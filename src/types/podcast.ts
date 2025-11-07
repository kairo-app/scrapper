export interface Episode {
  id: string; // Custom ID format: YYYYMMDD-provider-epXXX
  provider: string; // Provider identifier (e.g., 'darknetdiaries', 'sansstormcast')
  title: string;
  episode_number: number | null;
  date: string; // ISO date format
  audio_url: string;
  image_url: string;
  url: string; // Episode page URL
  duration: string;
  author: string;
  summary: string; // Plain text summary
  description: string; // HTML formatted description
}

export interface Channel {
  id: string; // Provider identifier
  name: string; // Channel/Podcast name
  description: string;
  author: string;
  website: string;
  rss_url: string;
  image_url: string;
  language: string;
  total_episodes: number;
  last_updated: string;
}

export interface PodcastData {
  episodes: Episode[];
  metadata: {
    provider: string;
    total_episodes: number;
    last_updated: string;
  };
  channelInfo?: Channel; // Optional channel information
}

export interface AllEpisodesData {
  episodes: Episode[];
  metadata: {
    total_episodes: number;
    total_providers: number;
    last_updated: string;
  };
}

export interface ChannelsData {
  channels: Channel[];
  metadata: {
    total_channels: number;
    last_updated: string;
  };
}
