import type { CoWatcher, CoWatcherWithProgress, Friend, FriendRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

export interface SearchedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  friendStatus: 'pending' | 'accepted' | null;
}

export interface CowatchProgress {
  shows: Record<number, CoWatcherWithProgress[]>;
  movies: Record<number, (CoWatcher & { watched: boolean })[]>;
}

export const friendsApi = {
  async getFriends(): Promise<Friend[]> {
    const res = await fetch(`${API_URL}/friends`, { credentials: 'include' });
    const data = await handleResponse<{ friends: Friend[] }>(res);
    return data.friends;
  },

  async getRequests(): Promise<FriendRequest[]> {
    const res = await fetch(`${API_URL}/friends/requests`, { credentials: 'include' });
    const data = await handleResponse<{ requests: FriendRequest[] }>(res);
    return data.requests;
  },

  async searchUsers(q: string): Promise<SearchedUser[]> {
    const res = await fetch(`${API_URL}/friends/search?q=${encodeURIComponent(q)}`, {
      credentials: 'include',
    });
    const data = await handleResponse<{ users: SearchedUser[] }>(res);
    return data.users;
  },

  async sendRequest(targetUserId: string): Promise<void> {
    const res = await fetch(`${API_URL}/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ targetUserId }),
    });
    await handleResponse<{ message: string }>(res);
  },

  async acceptRequest(userId: string): Promise<void> {
    const res = await fetch(`${API_URL}/friends/accept/${userId}`, {
      method: 'POST',
      credentials: 'include',
    });
    await handleResponse<{ message: string }>(res);
  },

  async removeFriend(userId: string): Promise<void> {
    const res = await fetch(`${API_URL}/friends/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await handleResponse<{ message: string }>(res);
  },

  async getCowatchProgress(): Promise<CowatchProgress> {
    const res = await fetch(`${API_URL}/friends/cowatch-progress`, { credentials: 'include' });
    return handleResponse<CowatchProgress>(res);
  },

  async updateShowCoWatchers(showId: number, coWatchers: CoWatcher[]): Promise<void> {
    const res = await fetch(`${API_URL}/friends/cowatch/show/${showId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ coWatchers }),
    });
    await handleResponse<{ message: string }>(res);
  },

  async updateMovieCoWatchers(movieId: number, coWatchers: CoWatcher[]): Promise<void> {
    const res = await fetch(`${API_URL}/friends/cowatch/movie/${movieId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ coWatchers }),
    });
    await handleResponse<{ message: string }>(res);
  },
};
