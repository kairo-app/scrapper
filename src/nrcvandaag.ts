import { RSSFeedParser } from './utils/rss-parser.js';
import { DataStorage } from './utils/data-storage.js';

export class NRCVandaagScraper {
  private readonly RSS_FEED_URL = 'https://rss.art19.com/vandaag';
  private readonly PROVIDER_NAME = 'nrcvandaag';
  private storage: DataStorage;

  constructor() {
    this.storage = new DataStorage();
  }

  async scrape(): Promise<void> {
    try {
      console.log(`\n🎙️  Starting NRC Vandaag scraper...`);
      console.log(`📡 Fetching RSS feed from: ${this.RSS_FEED_URL}\n`);

      // Get existing episode IDs to skip validation
      const existingIds = await this.storage.getExistingEpisodeIds(this.PROVIDER_NAME);
      
      // Create parser with existing IDs
      const parser = new RSSFeedParser(this.RSS_FEED_URL, this.PROVIDER_NAME, existingIds);

      // Fetch and parse the RSS feed
      const podcastData = await parser.parseFeed();

      console.log(`\n✅ Successfully parsed RSS feed`);
      console.log(`🎯 Total episodes found: ${podcastData.episodes.length}\n`);

      // Save the data
      console.log(`💾 Saving data to disk...`);
      await this.storage.saveData(this.PROVIDER_NAME, podcastData);

      console.log(`\n✨ Scraping completed successfully!`);
      console.log(`📁 Data saved in: ./data/episodes.json and ./data/channels.json\n`);

      // Display some statistics
      this.displayStatistics(podcastData);

    } catch (error) {
      console.error(`\n❌ Error during scraping:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  private displayStatistics(data: any): void {
    console.log(`📈 Statistics:`);
    console.log(`   - Latest episode: ${data.episodes[0]?.title || 'N/A'}`);
    console.log(`   - Latest publish date: ${new Date(data.episodes[0]?.date).toLocaleDateString() || 'N/A'}`);
    console.log(`   - Oldest episode: ${data.episodes[data.episodes.length - 1]?.title || 'N/A'}`);
    console.log(`   - Total episodes: ${data.episodes.length}`);
  }

  async getData() {
    return await this.storage.loadData(this.PROVIDER_NAME);
  }
}

// Export a function to run the scraper
export async function scrapeNRCVandaag(): Promise<void> {
  const scraper = new NRCVandaagScraper();
  await scraper.scrape();
}
