import { promises as fs } from 'fs';
import path from 'path';
import type { PodcastData, Episode, Channel, AllEpisodesData, ChannelsData } from '../types/podcast.js';

export class DataStorage {
  private dataDir: string;

  constructor(dataDir: string = 'data') {
    this.dataDir = dataDir;
  }

  async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`Created directory: ${this.dataDir}`);
    }
  }

  async saveData(providerName: string, data: PodcastData & { channelInfo?: Channel }): Promise<void> {
    await this.ensureDirectoryExists();

    // Save to centralized episodes.json
    await this.saveToEpisodes(data.episodes);
    
    // Save to centralized channels.json
    if (data.channelInfo) {
      await this.saveToChannels(data.channelInfo, data.episodes.length);
    }
    
    // Update version.json with last_updated timestamp
    await this.updateVersion();
  }

  private async saveToEpisodes(newEpisodes: Episode[]): Promise<void> {
    const episodesPath = path.join(this.dataDir, 'episodes.json');
    
    let existingData: AllEpisodesData | null = null;
    
    // Load existing data if file exists
    try {
      const existingContent = await fs.readFile(episodesPath, 'utf-8');
      existingData = JSON.parse(existingContent);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    // Merge episodes (avoid duplicates based on ID)
    let mergedEpisodes: Episode[];
    let addedCount = 0;
    const providers = new Set<string>();
    
    if (existingData) {
      const existingMap = new Map<string, Episode>();
      existingData.episodes.forEach(ep => {
        existingMap.set(ep.id, ep);
        providers.add(ep.provider);
      });
      
      // Add or update episodes
      newEpisodes.forEach(newEpisode => {
        if (!existingMap.has(newEpisode.id)) {
          addedCount++;
        }
        existingMap.set(newEpisode.id, newEpisode);
        providers.add(newEpisode.provider);
      });
      
      // Convert map back to array and sort by date (newest first)
      mergedEpisodes = Array.from(existingMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      console.log(`  - Previous total: ${existingData.episodes.length}`);
      console.log(`  - New episodes added: ${addedCount}`);
    } else {
      mergedEpisodes = newEpisodes.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      newEpisodes.forEach(ep => providers.add(ep.provider));
      addedCount = mergedEpisodes.length;
      console.log(`  - Created new episodes file`);
    }

    // Create final data structure
    const finalData: AllEpisodesData = {
      episodes: mergedEpisodes,
      metadata: {
        total_episodes: mergedEpisodes.length,
        total_providers: providers.size
      }
    };

    await this.writeJSON(episodesPath, finalData);
    
    console.log(`Episodes saved to ${episodesPath}`);
    console.log(`  - Total episodes: ${mergedEpisodes.length}`);
    console.log(`  - Total providers: ${providers.size}`);
  }

  private async saveToChannels(channelInfo: Channel, episodeCount: number): Promise<void> {
    const channelsPath = path.join(this.dataDir, 'channels.json');
    
    let existingData: ChannelsData | null = null;
    
    // Load existing data if file exists
    try {
      const existingContent = await fs.readFile(channelsPath, 'utf-8');
      existingData = JSON.parse(existingContent);
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    // Update channel info with episode count
    channelInfo.total_episodes = episodeCount;

    let channels: Channel[];
    
    if (existingData) {
      const existingMap = new Map<string, Channel>();
      existingData.channels.forEach(ch => existingMap.set(ch.id, ch));
      
      // Add or update channel
      existingMap.set(channelInfo.id, channelInfo);
      
      channels = Array.from(existingMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    } else {
      channels = [channelInfo];
      console.log(`  - Created new channels file`);
    }

    // Create final data structure
    const finalData: ChannelsData = {
      channels,
      metadata: {
        total_channels: channels.length
      }
    };

    await this.writeJSON(channelsPath, finalData);
    
    console.log(`Channels saved to ${channelsPath}`);
    console.log(`  - Total channels: ${channels.length}`);
  }

  private async writeJSON(filePath: string, data: any): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private async updateVersion(): Promise<void> {
    const versionPath = path.join(this.dataDir, 'version.json');
    
    const versionData = {
      last_updated: new Date().toISOString(),
      timestamp: Date.now()
    };

    await this.writeJSON(versionPath, versionData);
    console.log(`Version updated: ${versionData.last_updated}`);
  }

  async loadData(providerName: string): Promise<PodcastData | null> {
    const episodesPath = path.join(this.dataDir, 'episodes.json');
    
    try {
      const data = await fs.readFile(episodesPath, 'utf-8');
      const allData: AllEpisodesData = JSON.parse(data);
      
      // Filter episodes for this provider
      const providerEpisodes = allData.episodes.filter(ep => ep.provider === providerName);
      
      return {
        episodes: providerEpisodes,
        metadata: {
          provider: providerName,
          total_episodes: providerEpisodes.length
        }
      };
    } catch {
      return null;
    }
  }

  async getExistingEpisodeIds(providerName: string): Promise<string[]> {
    const episodesPath = path.join(this.dataDir, 'episodes.json');
    
    try {
      const data = await fs.readFile(episodesPath, 'utf-8');
      const allData: AllEpisodesData = JSON.parse(data);
      
      // Get IDs for this provider
      return allData.episodes
        .filter(ep => ep.provider === providerName)
        .map(ep => ep.id);
    } catch {
      return [];
    }
  }
}
