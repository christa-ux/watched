const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
}

export interface SyncData {
  shows: unknown[];
  movies: unknown[];
  lists: unknown[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse<AuthResponse>(response);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<AuthResponse>(response);
  },

  async logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  async getMe(): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/me`, {
      credentials: 'include',
    });
    return handleResponse<AuthResponse>(response);
  },

  async refreshToken(): Promise<void> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
  },

  getGoogleAuthUrl(): string {
    return `${API_URL}/auth/google`;
  },
};

export const syncApi = {
  async pull(): Promise<SyncData> {
    const response = await fetch(`${API_URL}/sync/pull`, {
      credentials: 'include',
    });
    return handleResponse<SyncData>(response);
  },

  async push(data: SyncData): Promise<void> {
    const response = await fetch(`${API_URL}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    await handleResponse<{ message: string }>(response);
  },
};
