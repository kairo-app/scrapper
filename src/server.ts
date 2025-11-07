import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { serve } from '@hono/node-server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { scrapeDarknetDiaries } from './darknetdiaries.js';
import { scrapeSansStormcast } from './sansstormcast.js';
import { scrapeTheDaily } from './thedaily.js';
import { scrapeNRCVandaag } from './nrcvandaag.js';
import { scrapeDeDag } from './dedag.js';
import { scrapeMaartenVanRossem } from './maartenvanrossem.js';
import { scrapeHardFork } from './hardfork.js';
import type { Episode, Channel } from './types/podcast.js';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', prettyJSON());

// Types for data files
interface EpisodesData {
  episodes: Episode[];
  metadata: {
    total_episodes: number;
    total_providers: number;
    last_updated: string;
  };
}

interface ChannelsData {
  channels: Channel[];
  metadata: {
    total_channels: number;
    last_updated: string;
  };
}

// Helper functions to get real-time data
async function getEpisodes(): Promise<EpisodesData> {
  console.log('🔄 Scraping episodes in real-time...');
  await runAllScrapers();
  
  try {
    const data = await readFile(join(process.cwd(), 'data', 'episodes.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { episodes: [], metadata: { total_episodes: 0, total_providers: 0, last_updated: new Date().toISOString() } };
  }
}

async function getChannels(): Promise<ChannelsData> {
  try {
    const data = await readFile(join(process.cwd(), 'data', 'channels.json'), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { channels: [], metadata: { total_channels: 0, last_updated: new Date().toISOString() } };
  }
}

// Scraping function
async function runAllScrapers() {
  console.log('🚀 Starting scraping process...');
  
  try {
    await scrapeDarknetDiaries();
    await scrapeSansStormcast();
    await scrapeTheDaily();
    await scrapeNRCVandaag();
    await scrapeDeDag();
    await scrapeMaartenVanRossem();
    await scrapeHardFork();
    
    console.log('✅ All scrapers completed successfully!');
    return { success: true, message: 'All podcasts scraped successfully' };
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Routes

// Home - API information
app.get('/home', (c) => {
  return c.json({
    name: 'Podcast Scraper API',
    version: '1.0.0',
    description: 'API for podcast episodes and channels from multiple providers',
    endpoints: {
      home: '/home',
      episodes: '/episodes',
      channels: '/channels',
      channelById: '/channels/:id',
      episodeById: '/episodes/:id',
      channelEpisodes: '/channels/:id/episodes',
      recent: '/recent',
      top: '/top',
      random: '/random',
      search: '/search?q=query',
      scrape: '/scrape (POST)'
    },
    providers: [
      'darknetdiaries',
      'sansstormcast',
      'thedaily',
      'nrcvandaag',
      'dedag',
      'maartenvanrossem',
      'hardfork'
    ]
  });
});

// Get all episodes
app.get('/episodes', async (c) => {
  const data = await getEpisodes();
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
  const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;
  
  const episodes = limit 
    ? data.episodes.slice(offset, offset + limit)
    : data.episodes.slice(offset);
  
  return c.json({
    episodes,
    metadata: {
      ...data.metadata,
      returned: episodes.length,
      offset,
      limit: limit || data.episodes.length
    }
  });
});

// Get all channels
app.get('/channels', async (c) => {
  const data = await getChannels();
  return c.json(data);
});

// Get channel by ID
app.get('/channels/:id', async (c) => {
  const id = c.req.param('id');
  const data = await getChannels();
  const channel = data.channels.find(ch => ch.id === id);
  
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }
  
  return c.json(channel);
});

// Get episode by ID
app.get('/episodes/:id', async (c) => {
  const id = c.req.param('id');
  const data = await getEpisodes();
  const episode = data.episodes.find(ep => ep.id === id);
  
  if (!episode) {
    return c.json({ error: 'Episode not found' }, 404);
  }
  
  return c.json(episode);
});

// Get episodes by channel ID
app.get('/channels/:id/episodes', async (c) => {
  const id = c.req.param('id');
  const episodesData = await getEpisodes();
  const channelsData = await getChannels();
  
  const channel = channelsData.channels.find(ch => ch.id === id);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }
  
  const episodes = episodesData.episodes.filter(ep => ep.provider === id);
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
  const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;
  
  const paginatedEpisodes = limit 
    ? episodes.slice(offset, offset + limit)
    : episodes.slice(offset);
  
  return c.json({
    channel,
    episodes: paginatedEpisodes,
    metadata: {
      total_episodes: episodes.length,
      returned: paginatedEpisodes.length,
      offset,
      limit: limit || episodes.length
    }
  });
});

// Get recent episodes
app.get('/recent', async (c) => {
  const data = await getEpisodes();
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20;
  
  // Episodes are already sorted by date (newest first)
  const recentEpisodes = data.episodes.slice(0, limit);
  
  return c.json({
    episodes: recentEpisodes,
    metadata: {
      total: data.metadata.total_episodes,
      returned: recentEpisodes.length,
      limit
    }
  });
});

// Get top episodes (by duration or popularity - using episode number as proxy)
app.get('/top', async (c) => {
  const data = await getEpisodes();
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20;
  
  // Sort by episode number (higher numbers = more popular in series)
  const topEpisodes = [...data.episodes]
    .filter(ep => ep.episode_number !== null)
    .sort((a, b) => (b.episode_number || 0) - (a.episode_number || 0))
    .slice(0, limit);
  
  return c.json({
    episodes: topEpisodes,
    metadata: {
      total: data.metadata.total_episodes,
      returned: topEpisodes.length,
      limit
    }
  });
});

// Get random episodes
app.get('/random', async (c) => {
  const data = await getEpisodes();
  const count = c.req.query('count') ? parseInt(c.req.query('count')!) : 10;
  
  // Shuffle and get random episodes
  const shuffled = [...data.episodes].sort(() => Math.random() - 0.5);
  const randomEpisodes = shuffled.slice(0, Math.min(count, shuffled.length));
  
  return c.json({
    episodes: randomEpisodes,
    metadata: {
      total: data.metadata.total_episodes,
      returned: randomEpisodes.length,
      requested: count
    }
  });
});

// Search episodes
app.get('/search', async (c) => {
  const query = c.req.query('q');
  const provider = c.req.query('provider');
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
  
  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }
  
  const data = await getEpisodes();
  const searchTerm = query.toLowerCase();
  
  let results = data.episodes.filter(ep => {
    const matchesQuery = 
      ep.title.toLowerCase().includes(searchTerm) ||
      ep.description.toLowerCase().includes(searchTerm) ||
      ep.summary.toLowerCase().includes(searchTerm) ||
      ep.author.toLowerCase().includes(searchTerm);
    
    const matchesProvider = provider ? ep.provider === provider : true;
    
    return matchesQuery && matchesProvider;
  });
  
  results = results.slice(0, limit);
  
  return c.json({
    episodes: results,
    metadata: {
      query,
      provider: provider || 'all',
      total_matches: results.length,
      returned: results.length,
      limit
    }
  });
});

// Trigger scraping (POST only)
app.post('/scrape', async (c) => {
  const result = await runAllScrapers();
  return c.json(result);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found', message: 'The requested endpoint does not exist' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

// Start server
const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📚 API documentation: /home`);
console.log(`⚡ Real-time scraping: Fresh data on every request\n`);

serve({
  fetch: app.fetch,
  port,
});
