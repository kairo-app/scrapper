import { scrapeDarknetDiaries } from './darknetdiaries.js';
import { scrapeSansStormcast } from './sansstormcast.js';
import { scrapeTheDaily } from './thedaily.js';
import { scrapeNRCVandaag } from './nrcvandaag.js';
import { scrapeDeDag } from './dedag.js';
import { scrapeMaartenVanRossem } from './maartenvanrossem.js';
import { scrapeHardFork } from './hardfork.js';

async function main() {
  try {
    console.log('🚀 Podcast Scraper Started\n');
    console.log('=' .repeat(50));
    
    // Run Darknet Diaries scraper
    await scrapeDarknetDiaries();
    
    console.log('=' .repeat(50));
    
    // Run SANS Stormcast scraper
    await scrapeSansStormcast();
    
    console.log('=' .repeat(50));
    
    // Run The Daily scraper
    await scrapeTheDaily();
    
    console.log('=' .repeat(50));
    
    // Run NRC Vandaag scraper
    await scrapeNRCVandaag();
    
    console.log('=' .repeat(50));
    
    // Run De Dag scraper
    await scrapeDeDag();
    
    console.log('=' .repeat(50));
    
    // Run Maarten van Rossem scraper
    await scrapeMaartenVanRossem();
    
    console.log('=' .repeat(50));
    
    // Run Hard Fork scraper
    await scrapeHardFork();
    
    console.log('=' .repeat(50));
    console.log('\n✅ All scrapers completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the main function
main();
