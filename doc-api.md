# Podcast Scraper API Documentation

A RESTful API for accessing podcast episodes and channels from multiple providers.

## Base URL
```
http://localhost:3000
```

## Providers

The API aggregates data from the following podcast providers:
- `darknetdiaries` - Darknet Diaries
- `sansstormcast` - SANS Internet Stormcenter Daily Stormcast
- `thedaily` - The Daily (New York Times)
- `nrcvandaag` - NRC Vandaag
- `dedag` - De Dag
- `maartenvanrossem` - Maarten van Rossem en Tom Jessen
- `hardfork` - Hard Fork (New York Times)

## Endpoints

### 1. Home / API Info
Get API information and available endpoints.

**Endpoint:** `GET /home`

**Response:**
```json
{
  "name": "Podcast Scraper API",
  "version": "1.0.0",
  "description": "API for podcast episodes and channels from multiple providers",
  "endpoints": {
    "home": "/home",
    "episodes": "/episodes",
    "channels": "/channels",
    "channelById": "/channels/:id",
    "episodeById": "/episodes/:id",
    "channelEpisodes": "/channels/:id/episodes",
    "recent": "/recent",
    "top": "/top",
    "random": "/random",
    "search": "/search?q=query",
    "scrape": "/scrape (POST)"
  },
  "providers": ["darknetdiaries", "sansstormcast", "thedaily", ...]
}
```

---

### 2. Get All Episodes
Retrieve all podcast episodes with optional pagination.

**Endpoint:** `GET /episodes`

**Query Parameters:**
- `limit` (optional) - Number of episodes to return
- `offset` (optional) - Number of episodes to skip (default: 0)

**Example:**
```
GET /episodes?limit=20&offset=40
```

**Response:**
```json
{
  "episodes": [
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
      "summary": "Episode summary...",
      "description": "Full description..."
    }
  ],
  "metadata": {
    "total_episodes": 2435,
    "total_providers": 7,
    "last_updated": "2025-11-07T12:00:00.000Z",
    "returned": 20,
    "offset": 40,
    "limit": 20
  }
}
```

---

### 3. Get All Channels
Retrieve information about all podcast channels.

**Endpoint:** `GET /channels`

**Response:**
```json
{
  "channels": [
    {
      "id": "darknetdiaries",
      "name": "Darknet Diaries",
      "description": "Explore true stories of the dark side of the Internet...",
      "author": "Jack Rhysider",
      "website": "https://darknetdiaries.com",
      "rss_url": "https://podcast.darknetdiaries.com/",
      "image_url": "https://...",
      "language": "en",
      "total_episodes": 155,
      "last_updated": "2025-11-07T12:00:00.000Z"
    }
  ],
  "metadata": {
    "total_channels": 7,
    "last_updated": "2025-11-07T12:00:00.000Z"
  }
}
```

---

### 4. Get Channel by ID
Retrieve information about a specific channel.

**Endpoint:** `GET /channels/:id`

**Parameters:**
- `id` - Channel identifier (e.g., `darknetdiaries`, `thedaily`)

**Example:**
```
GET /channels/darknetdiaries
```

**Response:**
```json
{
  "id": "darknetdiaries",
  "name": "Darknet Diaries",
  "description": "Explore true stories of the dark side of the Internet...",
  "author": "Jack Rhysider",
  "website": "https://darknetdiaries.com",
  "rss_url": "https://podcast.darknetdiaries.com/",
  "image_url": "https://...",
  "language": "en",
  "total_episodes": 155,
  "last_updated": "2025-11-07T12:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "error": "Channel not found"
}
```

---

### 5. Get Episode by ID
Retrieve a specific episode by its ID.

**Endpoint:** `GET /episodes/:id`

**Parameters:**
- `id` - Episode identifier (e.g., `20251104-darknetdiaries-ep165`)

**Example:**
```
GET /episodes/20251104-darknetdiaries-ep165
```

**Response:**
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
  "summary": "Episode summary...",
  "description": "Full description..."
}
```

**Error Response (404):**
```json
{
  "error": "Episode not found"
}
```

---

### 6. Get Episodes by Channel
Retrieve all episodes from a specific channel with optional pagination.

**Endpoint:** `GET /channels/:id/episodes`

**Parameters:**
- `id` - Channel identifier

**Query Parameters:**
- `limit` (optional) - Number of episodes to return
- `offset` (optional) - Number of episodes to skip (default: 0)

**Example:**
```
GET /channels/darknetdiaries/episodes?limit=10
```

**Response:**
```json
{
  "channel": {
    "id": "darknetdiaries",
    "name": "Darknet Diaries",
    "description": "...",
    "author": "Jack Rhysider",
    "total_episodes": 155
  },
  "episodes": [
    {
      "id": "20251104-darknetdiaries-ep165",
      "provider": "darknetdiaries",
      "title": "165: Tanya",
      ...
    }
  ],
  "metadata": {
    "total_episodes": 155,
    "returned": 10,
    "offset": 0,
    "limit": 10
  }
}
```

---

### 7. Get Recent Episodes
Retrieve the most recently published episodes.

**Endpoint:** `GET /recent`

**Query Parameters:**
- `limit` (optional) - Number of episodes to return (default: 20)

**Example:**
```
GET /recent?limit=10
```

**Response:**
```json
{
  "episodes": [
    {
      "id": "20251107-thedaily-ep...",
      "provider": "thedaily",
      "title": "Trump's Bad Week",
      "date": "2025-11-07T10:47:21.000Z",
      ...
    }
  ],
  "metadata": {
    "total": 2435,
    "returned": 10,
    "limit": 10
  }
}
```

---

### 8. Get Top Episodes
Retrieve top episodes sorted by episode number (higher episode numbers indicate later/more popular episodes in a series).

**Endpoint:** `GET /top`

**Query Parameters:**
- `limit` (optional) - Number of episodes to return (default: 20)

**Example:**
```
GET /top?limit=15
```

**Response:**
```json
{
  "episodes": [
    {
      "id": "...",
      "episode_number": 884,
      "title": "...",
      ...
    }
  ],
  "metadata": {
    "total": 2435,
    "returned": 15,
    "limit": 15
  }
}
```

---

### 9. Get Random Episodes
Retrieve random episodes from the database.

**Endpoint:** `GET /random`

**Query Parameters:**
- `count` (optional) - Number of random episodes to return (default: 10)

**Example:**
```
GET /random?count=5
```

**Response:**
```json
{
  "episodes": [
    {
      "id": "20250315-hardfork-ep...",
      "provider": "hardfork",
      "title": "...",
      ...
    }
  ],
  "metadata": {
    "total": 2435,
    "returned": 5,
    "requested": 5
  }
}
```

---

### 10. Search Episodes
Search for episodes by title, description, summary, or author.

**Endpoint:** `GET /search`

**Query Parameters:**
- `q` (required) - Search query
- `provider` (optional) - Filter by specific provider
- `limit` (optional) - Maximum results to return (default: 50)

**Examples:**
```
GET /search?q=trump
GET /search?q=security&provider=darknetdiaries&limit=20
GET /search?q=AI&provider=hardfork
```

**Response:**
```json
{
  "episodes": [
    {
      "id": "...",
      "provider": "thedaily",
      "title": "Trump's Bad Week",
      ...
    }
  ],
  "metadata": {
    "query": "trump",
    "provider": "all",
    "total_matches": 15,
    "returned": 15,
    "limit": 50
  }
}
```

**Error Response (400):**
```json
{
  "error": "Query parameter \"q\" is required"
}
```

---

### 11. Trigger Scraping
Manually trigger the scraping process to update all podcast data.

**Endpoint:** `POST /scrape`

**Note:** This operation may take several minutes to complete.

**Example:**
```bash
curl -X POST http://localhost:3000/scrape
```

**Success Response:**
```json
{
  "success": true,
  "message": "All podcasts scraped successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message details"
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "The requested endpoint does not exist"
}
```

### 400 Bad Request
```json
{
  "error": "Query parameter \"q\" is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details"
}
```

---

## Data Models

### Episode
```typescript
{
  id: string;              // Format: YYYYMMDD-provider-epXXX
  provider: string;        // Provider identifier
  title: string;           // Episode title
  episode_number: number | null;
  date: string;            // ISO 8601 format
  audio_url: string;       // Direct MP3 URL
  image_url: string;       // Episode artwork
  url: string;             // Episode webpage
  duration: string;        // Format: HH:MM:SS
  author: string;          // Author/host name
  summary: string;         // Plain text summary
  description: string;     // Full HTML description
}
```

### Channel
```typescript
{
  id: string;              // Provider identifier
  name: string;            // Channel name
  description: string;     // Channel description
  author: string;          // Author/host name
  website: string;         // Channel website
  rss_url: string;         // RSS feed URL
  image_url: string;       // Channel artwork
  language: string;        // Language code (e.g., 'en', 'nl')
  total_episodes: number;  // Total episode count
  last_updated: string;    // ISO 8601 format
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. Please use the API responsibly.

---

## CORS

CORS is enabled for all origins. The API can be accessed from any domain.

---

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Environment Variables
- `PORT` - Server port (default: 3000)

---

## Examples

### JavaScript/TypeScript
```javascript
// Fetch recent episodes
const response = await fetch('http://localhost:3000/recent?limit=10');
const data = await response.json();
console.log(data.episodes);

// Search for episodes
const searchResponse = await fetch('http://localhost:3000/search?q=hacking&provider=darknetdiaries');
const searchData = await searchResponse.json();
console.log(searchData.episodes);

// Get channel info
const channelResponse = await fetch('http://localhost:3000/channels/thedaily');
const channel = await channelResponse.json();
console.log(channel);
```

### cURL
```bash
# Get all channels
curl http://localhost:3000/channels

# Search episodes
curl "http://localhost:3000/search?q=AI&limit=5"

# Get recent episodes
curl "http://localhost:3000/recent?limit=20"

# Trigger scraping
curl -X POST http://localhost:3000/scrape
```

### Python
```python
import requests

# Get recent episodes
response = requests.get('http://localhost:3000/recent', params={'limit': 10})
data = response.json()
print(data['episodes'])

# Search
search_response = requests.get('http://localhost:3000/search', params={
    'q': 'security',
    'provider': 'darknetdiaries',
    'limit': 20
})
search_data = search_response.json()
print(search_data['episodes'])
```

---

## Support

For issues or questions, please refer to the project repository.

---

**Last Updated:** November 7, 2025
**API Version:** 1.0.0
