# Podcast Scraper

A modular TypeScript-based podcast scraper that fetches podcast data from RSS feeds and saves it in a clean, structured JSON format.

## Features

- 🎙️ **RSS Feed Parsing**: Fetches and parses podcast RSS feeds
- 💾 **Single File Storage**: All episodes stored in one `episodes.json` file per provider
- 🔄 **Smart Deduplication**: Automatically merges new episodes with existing data
- 📊 **Clean Data Format**: Simplified structure with custom IDs and formatted descriptions
- 🎯 **Type-Safe**: Full TypeScript support
- 🔌 **Modular Design**: Easy to add new podcast providers

## Currently Supported Podcasts

- **Darknet Diaries** - True stories from the dark side of the Internet

## Data Structure

Each episode contains the following fields:

```json
{
  "id": "20251104-darknetdiaries-ep165",
  "title": "165: Tanya",
  "episode_number": 165,
  "date": "2025-11-04T08:00:00.000Z",
  "audio_url": "https://www.podtrac.com/pts/redirect.mp3/...",
  "image_url": "https://f.prxu.org/7057/.../flying.jpg",
  "url": "https://darknetdiaries.com/episode/165/",
  "duration": "47:43",
  "author": "Jack Rhysider",
  "summary": "Plain text summary without HTML tags...",
  "description": "<p>HTML formatted description with all formatting...</p>"
}
```

### File Structure

```
data/
  darknetdiaries/
    episodes.json          # All episodes with metadata
```

The `episodes.json` file contains:
- `episodes[]` - Array of all podcast episodes (sorted by date, newest first)
- `metadata` - Provider info, total count, and last updated timestamp

Example metadata:
```json
{
  "metadata": {
    "provider": "darknetdiaries",
    "total_episodes": 165,
    "last_updated": "2025-11-07T12:48:48.575Z"
  }
}
```

## Installation

```bash
npm install
```

## Usage

### Run the scraper

```bash
npm run dev
```

or

```bash
npm start
```

## How It Works

1. **Fetch**: Downloads the RSS feed from the podcast URL
2. **Parse**: Extracts episode data using XML parser with iTunes tags support
3. **Transform**: Converts to clean, structured format with custom IDs
4. **Merge**: Checks for existing data and adds only new episodes (no duplicates)
5. **Save**: Writes to `data/{provider}/episodes.json` with pretty formatting

### Custom ID Format

Each episode gets a unique ID based on publication date and episode number:

Format: `YYYYMMDD-provider-epXXX`

Examples:
- `20251104-darknetdiaries-ep165`
- `20251007-darknetdiaries-ep164`
- `20250902-darknetdiaries-ep163`

This ensures:
- ✅ IDs are human-readable
- ✅ Episodes can be sorted chronologically by ID
- ✅ Easy to identify provider and episode at a glance
- ✅ No collisions between different providers

## Project Structure

```
src/
  ├── index.ts                 # Main entry point
  ├── darknetdiaries.ts        # Darknet Diaries scraper
  ├── types/
  │   └── podcast.ts           # TypeScript interfaces
  └── utils/
      ├── rss-parser.ts        # RSS feed parser
      └── data-storage.ts      # JSON file management
```

## Adding New Podcast Providers

1. Create a new scraper file in `src/` (e.g., `newpodcast.ts`)
2. Use the existing utilities from `utils/`
3. Add the scraper to `src/index.ts`
4. Run the scraper

Example implementation:

```typescript
import { RSSFeedParser } from './utils/rss-parser.js';
import { DataStorage } from './utils/data-storage.js';

export class NewPodcastScraper {
  private readonly RSS_FEED_URL = 'https://podcast.example.com/feed';
  private readonly PROVIDER_NAME = 'newpodcast';
  private parser: RSSFeedParser;
  private storage: DataStorage;

  constructor() {
    this.parser = new RSSFeedParser(this.RSS_FEED_URL, this.PROVIDER_NAME);
    this.storage = new DataStorage();
  }

  async scrape(): Promise<void> {
    const podcastData = await this.parser.parseFeed();
    await this.storage.saveData(this.PROVIDER_NAME, podcastData);
  }
}

export async function scrapeNewPodcast(): Promise<void> {
  const scraper = new NewPodcastScraper();
  await scraper.scrape();
}
```

Then add to `index.ts`:

```typescript
import { scrapeNewPodcast } from './newpodcast.js';

async function main() {
  await scrapeDarknetDiaries();
  await scrapeNewPodcast();  // Add your new scraper
}
```

## Data Updates

When you run the scraper again:
- ✅ New episodes are automatically added
- ✅ Existing episodes are preserved (no duplicates based on ID)
- ✅ Episodes are sorted by date (newest first)
- ✅ Metadata is updated with current timestamp and total count

Example output on subsequent runs:

```
💾 Saving data to disk...
  - Previous total: 165
  - New episodes added: 0
Episodes saved to data\darknetdiaries\episodes.json
  - Total episodes: 165
```

## Dependencies

- `axios` - HTTP client for fetching RSS feeds
- `xml2js` - XML to JSON parser
- `typescript` - Type safety and modern JavaScript features

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Output Example

```
🚀 Podcast Scraper Started

==================================================

🎙️  Starting Darknet Diaries scraper...
📡 Fetching RSS feed from: https://podcast.darknetdiaries.com


✅ Successfully parsed RSS feed
🎯 Total episodes found: 165

💾 Saving data to disk...
Created directory: data
Created provider directory: data\darknetdiaries
  - Created new file
Episodes saved to data\darknetdiaries\episodes.json
  - Total episodes: 165

✨ Scraping completed successfully!
📁 Data saved in: ./data/darknetdiaries/episodes.json

📈 Statistics:
   - Latest episode: 165: Tanya
   - Latest publish date: 4/11/2025
   - Oldest episode: Ep 1: The Phreaky World of PBX Hacking
   - Total episodes: 165
==================================================

✅ All scrapers completed successfully!
```

## Key Features

### Summary vs Description

- **`summary`**: Plain text without HTML tags - perfect for previews and search indexing
- **`description`**: Full HTML formatted content with links, formatting, and structure

### Episode Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Custom ID: `YYYYMMDD-provider-epXXX` |
| `title` | string | Episode title |
| `episode_number` | number \| null | Episode number (null if not available) |
| `date` | string | ISO 8601 date format |
| `audio_url` | string | Direct link to audio file (MP3) |
| `image_url` | string | Episode artwork URL |
| `url` | string | Episode page URL |
| `duration` | string | Duration in HH:MM:SS or MM:SS format |
| `author` | string | Episode author/host |
| `summary` | string | Plain text summary |
| `description` | string | HTML formatted description |

## Error Handling

The scraper includes comprehensive error handling for:
- Network failures when fetching RSS feeds
- XML parsing errors
- File system errors
- Missing or malformed data fields
- Invalid date formats

## License

ISC

## Contributing

Contributions are welcome! Feel free to:
- Add new podcast providers
- Improve parsing logic
- Add new features
- Fix bugs
- Improve documentation

## Roadmap

- [ ] Add support for more podcast providers
- [ ] Add transcript scraping
- [ ] Export to different formats (CSV, SQLite, etc.)
- [ ] Add scheduling/cron support
- [ ] Create API endpoints for serving data
- [ ] Build web UI for browsing episodes

---

**Note**: This scraper respects RSS feed standards and fetches only publicly available data. Please use responsibly and in accordance with each podcast's terms of service.
