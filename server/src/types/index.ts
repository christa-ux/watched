export interface CoWatcher {
  userId: string;
  name: string;
  avatar: string | null;
}

// Shared types matching frontend
export interface WatchedShow {
  id: number;
  name: string;
  posterPath: string | null;
  addedAt: string;
  totalSeasons: number;
  totalEpisodes: number;
  watchedEpisodes: Record<number, number[]>;
  coWatchers?: CoWatcher[];
}

export interface WatchedMovie {
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: string;
  watched: boolean;
  watchedAt: string | null;
  coWatchers?: CoWatcher[];
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

// User types
export interface IUser {
  _id: string;
  email: string;
  password?: string;
  googleId?: string;
  name: string;
  avatar?: string;
  shows: WatchedShow[];
  movies: WatchedMovie[];
  lists: CustomList[];
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface TokenPayload {
  userId: string;
  email: string;
}

export interface SyncData {
  shows: WatchedShow[];
  movies: WatchedMovie[];
  lists: CustomList[];
}
