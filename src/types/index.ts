export interface TMDBShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TMDBSeason[];
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  runtime?: number;
}

export interface CoWatcher {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface CoWatcherWithProgress extends CoWatcher {
  watchedCount: number;
  watchedEpisodes?: Record<string, number[]>;
  watched?: boolean; // for movies
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  compatibilityScore: number;
}

export interface FriendRequest {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  initiatedByMe: boolean;
}

export interface WatchedShow {
  id: number;
  name: string;
  posterPath: string | null;
  addedAt: string;
  totalSeasons: number;
  totalEpisodes: number;
  watchedEpisodes: Record<number, number[]>; // seasonNumber -> episodeNumbers[]
  coWatchers: CoWatcher[];
}

export interface WatchedMovie {
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: string;
  watched: boolean;
  watchedAt: string | null;
  coWatchers: CoWatcher[];
}

export interface CustomList {
  id: string;
  name: string;
  createdAt: string;
  items: ListItem[];
}

export interface ListItem {
  id: number;
  type: 'show' | 'movie';
  name: string;
  posterPath: string | null;
  addedAt: string;
}

export type SearchResult = {
  id: number;
  media_type: 'tv' | 'movie' | 'person';
  name?: string;
  title?: string;
  poster_path: string | null;
  profile_path?: string | null;
  overview: string;
  first_air_date?: string;
  release_date?: string;
  vote_average: number;
  known_for_department?: string;
  known_for?: SearchResult[];
};

export interface PersonCredits {
  id: number;
  cast: CreditItem[];
}

export interface CreditItem {
  id: number;
  media_type: 'tv' | 'movie';
  name?: string;
  title?: string;
  poster_path: string | null;
  overview: string;
  first_air_date?: string;
  release_date?: string;
  vote_average: number;
  character?: string;
  episode_count?: number;
}
