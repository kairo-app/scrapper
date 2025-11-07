import axios from 'axios';
import xml2js from 'xml2js';
import type { Episode, PodcastData, Channel } from '../types/podcast.js';

export class RSSFeedParser {
  private feedUrl: string;
  private providerName: string;
  private existingEpisodeIds: Set<string>;

  constructor(feedUrl: string, providerName: string, existingEpisodeIds: string[] = []) {
    this.feedUrl = feedUrl;
    this.providerName = providerName;
    this.existingEpisodeIds = new Set(existingEpisodeIds);
  }

  async fetchFeed(): Promise<string> {
    try {
      const response = await axios.get(this.feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateMp3Url(url: string, retries: number = 3): Promise<boolean> {
    if (!url) return false;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
        
        const response = await axios.head(url, {
          signal: controller.signal as any,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*'
          },
          maxRedirects: 5,
          validateStatus: () => true, // Accept all responses to check status
          decompress: false,
        });
        
        clearTimeout(timeoutId);
        
        // If 200 OK, return true
        if (response.status === 200) {
          return true;
        }
        
        // If 404, don't retry - it's definitely not available
        if (response.status === 404) {
          return false;
        }
        
        // For other errors (429 rate limit, 503 service unavailable, etc.), retry
        if (attempt < retries) {
          const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Final attempt failed with non-404 error, reject it
        return false;
      } catch (error) {
        // Network error or timeout - retry unless it's the last attempt
        if (attempt < retries) {
          const delay = attempt * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return false;
      }
    }
    
    return false;
  }

  async parseFeed(): Promise<PodcastData> {
    const xmlData = await this.fetchFeed();
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true
    });

    const result = await parser.parseStringPromise(xmlData);
    const channel = result.rss.channel;

    // Extract channel info first to get the channel image
    const channelInfo = this.extractChannelInfo(channel);

    console.log(`🔍 Extracting episodes...`);
    const allEpisodes = await this.extractEpisodes(channel.item, channelInfo.image_url);
    console.log(`✅ Extracted ${allEpisodes.length} valid episodes\n`);

    return {
      episodes: allEpisodes,
      metadata: {
        provider: this.providerName,
        total_episodes: allEpisodes.length
      },
      channelInfo
    };
  }

  extractChannelInfo(channel: any): Channel {
    // Try multiple ways to get the author
    const author = channel['itunes:author'] 
      || channel.author 
      || channel['itunes:owner']?.['itunes:name']
      || channel.managingEditor?.replace(/\s*\(.*?\)\s*/, '') // Remove email format
      || '';

    // Try multiple ways to get the image
    const imageUrl = channel['itunes:image']?.href 
      || channel['itunes:image'] 
      || channel.image?.url 
      || '';

    return {
      id: this.providerName,
      name: this.cleanCDATA(channel.title || ''),
      description: this.cleanCDATA(channel.description || channel['itunes:summary'] || ''),
      author: this.cleanCDATA(author),
      website: channel.link || '',
      rss_url: this.feedUrl,
      image_url: imageUrl,
      language: channel.language || 'en',
      total_episodes: 0 // Will be updated when saving
    };
  }

  private async extractEpisodes(items: any | any[], channelImageUrl: string): Promise<Episode[]> {
    const episodeArray = Array.isArray(items) ? items : [items];
    
    console.log(`   📊 Total episodes in feed: ${episodeArray.length}`);
    console.log(`   🔎 Parsing episodes...`);
    
    // Parse all episodes
    const parsedEpisodes = episodeArray.map(item => {
      const episodeNumber = item['itunes:episode'] ? parseInt(item['itunes:episode'], 10) : null;
      const pubDate = new Date(item.pubDate || '');
      const dateStr = pubDate.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      
      const id = `${dateStr}-${this.providerName}-ep${episodeNumber || 'unknown'}`;
      const description = this.cleanCDATA(item.description || item['content:encoded'] || '');
      const summary = this.cleanCDATA(item['itunes:summary'] || item['itunes:subtitle'] || item.description || '')
        .replace(/<[^>]*>/g, '')
        .trim();

      const rawAudioUrl = item.enclosure?.url || '';
      const audioUrl = this.extractPermanentUrl(rawAudioUrl);

      // Try multiple ways to get the image, fallback to channel image
      const episodeImage = item['itunes:image']?.href 
        || item['itunes:image'] 
        || item['media:thumbnail']?.url
        || item['media:content']?.url
        || '';
      
      const imageUrl = episodeImage || channelImageUrl; // Use channel image as fallback

      // Try multiple ways to get the author
      const author = item['itunes:author'] 
        || item.author?.replace(/\s*\(.*?\)\s*/, '') // Remove email from author
        || item['dc:creator']
        || '';

      return {
        id,
        provider: this.providerName,
        title: this.cleanCDATA(item.title || ''),
        episode_number: episodeNumber,
        date: pubDate.toISOString(),
        audio_url: audioUrl,
        image_url: imageUrl,
        url: item.link || '',
        duration: item['itunes:duration'] || '',
        author: this.cleanCDATA(author),
        summary,
        description
      };
    });
    
    console.log(`   ✅ Parsed ${parsedEpisodes.length} episodes`);
    
    // Separate existing and new episodes
    const existingEpisodes = parsedEpisodes.filter(ep => this.existingEpisodeIds.has(ep.id));
    const newEpisodes = parsedEpisodes.filter(ep => !this.existingEpisodeIds.has(ep.id));
    
    console.log(`   ♻️  Skipping validation for ${existingEpisodes.length} existing episodes`);
    console.log(`   🔍 Validating ${newEpisodes.length} new MP3 URLs (100 concurrent)...`);
    
    // Validate only new episodes
    if (newEpisodes.length > 0) {
      const validationResults = await this.validateMp3UrlsBatch(newEpisodes.map(ep => ep.audio_url));
      const validNewEpisodes = newEpisodes.filter((_, index) => validationResults[index]);
      
      console.log(`   ✅ ${validNewEpisodes.length}/${newEpisodes.length} new episodes have valid MP3s\n`);
      
      // Return existing episodes + valid new episodes
      return [...existingEpisodes, ...validNewEpisodes];
    }
    
    console.log(`   ℹ️  No new episodes to validate\n`);
    return existingEpisodes;
  }

  private async validateMp3UrlsBatch(urls: string[]): Promise<boolean[]> {
    const BATCH_SIZE = 100; // 100 concurrent checks per second
    const results: boolean[] = new Array(urls.length).fill(false);
    
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const batchIndexes = Array.from({ length: batch.length }, (_, idx) => i + idx);
      
      // Validate batch in parallel (100 at a time)
      const batchResults = await Promise.all(
        batch.map(url => this.validateMp3Url(url))
      );
      
      // Store results
      batchResults.forEach((isValid, idx) => {
        results[batchIndexes[idx]] = isValid;
      });
      
      // Progress indicator
      const progress = Math.min(i + BATCH_SIZE, urls.length);
      const validCount = results.slice(0, progress).filter(r => r).length;
      console.log(`      ${progress}/${urls.length} checked (${validCount} valid)...`);
    }
    
    return results;
  }

  private extractPermanentUrl(url: string): string {
    if (!url) return '';

    // Remove common tracking/redirect domains to get permanent URL
    const trackingPatterns = [
      /^https?:\/\/www\.podtrac\.com\/pts\/redirect\.mp3\//i,
      /^https?:\/\/dts\.podtrac\.com\/redirect\.mp3\//i,
      /^https?:\/\/tracking\.feedpress\.it\//i,
      /^https?:\/\/.*?\/redirect\.mp3\//i,
      /^https?:\/\/prfx\.byspotify\.com\/e\/op3\.dev\/e\//i, // Spotify/OP3 tracking
      /^https?:\/\/pdst\.fm\/e\//i, // Podscribe tracking
      /^https?:\/\/pfx\.vpixl\.com\/[^\/]+\//i, // VPixl tracking
      /^https?:\/\/pscrb\.fm\/rss\/p\//i, // Podscribe RSS tracking
    ];

    let cleanUrl = url;
    for (const pattern of trackingPatterns) {
      cleanUrl = cleanUrl.replace(pattern, 'https://');
    }

    return cleanUrl;
  }

  private cleanCDATA(text: string): string {
    if (!text) return '';
    
    // Remove CDATA wrapper if present
    return text
      .replace(/^<!\[CDATA\[/, '')
      .replace(/\]\]>$/, '')
      .trim();
  }
}
