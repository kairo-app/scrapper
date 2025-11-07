# Podcast Scraper API Server

A fast and lightweight REST API server built with [Hono](https://hono.dev/) for accessing scraped podcast data from multiple providers.

## Features

- 🚀 Fast and lightweight (built on Hono)
- 📡 RESTful API with JSON responses
- 🔍 Full-text search across episodes
- 📊 Pagination support
- 🎲 Random episode discovery
- 📱 CORS enabled
- 🔄 Manual scraping trigger endpoint

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Run Initial Scraping
```bash
npm run dev
```
This will scrape all podcast providers and save data to `data/episodes.json` and `data/channels.json`.

### 4. Start the API Server
```bash
npm run server
```

The server will start on `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run scrapers to fetch latest podcast data |
| `npm run server` | Build and start the API server |
| `npm start` | Start the API server (requires pre-built code) |
| `npm run build` | Compile TypeScript to JavaScript |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |

Example:
```bash
PORT=8080 npm run server
```

## API Endpoints

For full API documentation, see [doc-api.md](./doc-api.md)

### Quick Reference

```bash
# Get API info
GET /home

# Get all episodes (with pagination)
GET /episodes?limit=20&offset=0

# Get all channels
GET /channels

# Get specific channel
GET /channels/darknetdiaries

# Get specific episode
GET /episodes/20251104-darknetdiaries-ep165

# Get channel's episodes
GET /channels/darknetdiaries/episodes?limit=10

# Get recent episodes
GET /recent?limit=20

# Get top episodes
GET /top?limit=20

# Get random episodes
GET /random?count=10

# Search episodes
GET /search?q=security&provider=darknetdiaries&limit=20

# Trigger scraping (POST)
POST /scrape
```

## Example Usage

### cURL
```bash
# Get recent episodes
curl http://localhost:3000/recent?limit=5

# Search for AI-related episodes
curl "http://localhost:3000/search?q=AI&limit=10"

# Get Darknet Diaries episodes
curl http://localhost:3000/channels/darknetdiaries/episodes
```

### JavaScript/TypeScript
```javascript
// Fetch recent episodes
const response = await fetch('http://localhost:3000/recent?limit=10');
const data = await response.json();
console.log(data.episodes);

// Search episodes
const searchResponse = await fetch(
  'http://localhost:3000/search?q=hacking&provider=darknetdiaries'
);
const searchData = await searchResponse.json();
```

### Python
```python
import requests

# Get channels
response = requests.get('http://localhost:3000/channels')
channels = response.json()

# Search episodes
search = requests.get('http://localhost:3000/search', params={
    'q': 'security',
    'limit': 20
})
episodes = search.json()
```

## Supported Providers

The API aggregates data from:

1. **Darknet Diaries** (`darknetdiaries`) - Cybersecurity stories
2. **SANS Stormcast** (`sansstormcast`) - Daily cybersecurity podcast
3. **The Daily** (`thedaily`) - New York Times daily news
4. **NRC Vandaag** (`nrcvandaag`) - Dutch daily news
5. **De Dag** (`dedag`) - Dutch daily news
6. **Maarten van Rossem** (`maartenvanrossem`) - Dutch news/history
7. **Hard Fork** (`hardfork`) - Tech news from NYT

## Data Structure

### Episode Object
```json
{
  "id": "20251104-darknetdiaries-ep165",
  "provider": "darknetdiaries",
  "title": "165: Tanya",
  "episode_number": 165,
  "date": "2025-11-04T08:00:00.000Z",
  "audio_url": "https://...",
  "image_url": "https://...",
  "url": "https://...",
  "duration": "01:15:23",
  "author": "Jack Rhysider",
  "summary": "Short summary...",
  "description": "Full HTML description..."
}
```

### Channel Object
```json
{
  "id": "darknetdiaries",
  "name": "Darknet Diaries",
  "description": "Explore true stories...",
  "author": "Jack Rhysider",
  "website": "https://darknetdiaries.com",
  "rss_url": "https://podcast.darknetdiaries.com/",
  "image_url": "https://...",
  "language": "en",
  "total_episodes": 155,
  "last_updated": "2025-11-07T12:00:00.000Z"
}
```

## Performance

- Built on Hono for minimal overhead
- Parallel MP3 validation during scraping
- Efficient JSON file-based storage
- CORS and logging middleware included

## Development

### Project Structure
```
scrapper/
├── src/
│   ├── server.ts              # API server
│   ├── index.ts               # Scraper entry point
│   ├── darknetdiaries.ts      # Provider scraper
│   ├── sansstormcast.ts       # Provider scraper
│   ├── thedaily.ts            # Provider scraper
│   ├── nrcvandaag.ts          # Provider scraper
│   ├── dedag.ts               # Provider scraper
│   ├── maartenvanrossem.ts    # Provider scraper
│   ├── hardfork.ts            # Provider scraper
│   ├── types/
│   │   └── podcast.ts         # TypeScript types
│   └── utils/
│       ├── rss-parser.ts      # RSS feed parser
│       └── data-storage.ts    # Data persistence
├── data/
│   ├── episodes.json          # All episodes
│   └── channels.json          # All channels
├── doc-api.md                 # Full API documentation
└── package.json
```

### Adding New Providers

1. Create a new scraper file in `src/` (e.g., `newpodcast.ts`)
2. Use the existing scrapers as templates
3. Add to `src/index.ts` for batch scraping
4. Add to `src/server.ts` providers list

## Troubleshooting

### Server won't start
- Ensure you've run `npm install`
- Check if port 3000 is available
- Verify TypeScript compiled successfully with `npm run build`

### No data returned
- Run `npm run dev` first to scrape podcast data
- Check that `data/episodes.json` and `data/channels.json` exist

### Scraping fails
- Check your internet connection
- Some podcasts may have rate limiting
- Verify RSS feed URLs are still valid

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues or questions, please open an issue on GitHub.
