import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchedShow, WatchedMovie, CustomList, ListItem } from '../types';

interface AppState {
  shows: WatchedShow[];
  movies: WatchedMovie[];
  lists: CustomList[];

  // Show actions
  addShow: (show: Omit<WatchedShow, 'addedAt' | 'watchedEpisodes'>) => boolean;
  removeShow: (id: number) => void;
  markEpisodeWatched: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  unmarkEpisodeWatched: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  markSeasonWatched: (showId: number, seasonNumber: number, episodeCount: number) => void;
  unmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  getWatchedEpisodesCount: (showId: number) => number;

  // Movie actions
  addMovie: (movie: Omit<WatchedMovie, 'addedAt' | 'watched' | 'watchedAt'>) => boolean;
  removeMovie: (id: number) => void;
  toggleMovieWatched: (id: number) => void;

  // List actions
  createList: (name: string) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, name: string) => void;
  addToList: (listId: string, item: Omit<ListItem, 'addedAt'>) => void;
  removeFromList: (listId: string, itemId: number) => void;

  // Stats
  getStats: () => {
    totalShows: number;
    totalMovies: number;
    totalEpisodes: number;
    currentlyWatching: number;
  };

  // Sync
  loadFromServer: (data: { shows: WatchedShow[]; movies: WatchedMovie[]; lists: CustomList[] }) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      shows: [],
      movies: [],
      lists: [],

      addShow: (show) => {
        const exists = get().shows.some((s) => s.id === show.id);
        if (exists) return false;
        set((state) => ({
          shows: [
            ...state.shows,
            {
              ...show,
              addedAt: new Date().toISOString(),
              watchedEpisodes: {},
            },
          ],
        }));
        return true;
      },

      removeShow: (id) => {
        set((state) => ({
          shows: state.shows.filter((s) => s.id !== id),
        }));
      },

      markEpisodeWatched: (showId, seasonNumber, episodeNumber) => {
        set((state) => ({
          shows: state.shows.map((show) => {
            if (show.id !== showId) return show;
            const seasonEpisodes = show.watchedEpisodes[seasonNumber] || [];
            if (seasonEpisodes.includes(episodeNumber)) return show;
            return {
              ...show,
              watchedEpisodes: {
                ...show.watchedEpisodes,
                [seasonNumber]: [...seasonEpisodes, episodeNumber].sort((a, b) => a - b),
              },
            };
          }),
        }));
      },

      unmarkEpisodeWatched: (showId, seasonNumber, episodeNumber) => {
        set((state) => ({
          shows: state.shows.map((show) => {
            if (show.id !== showId) return show;
            const seasonEpisodes = show.watchedEpisodes[seasonNumber] || [];
            return {
              ...show,
              watchedEpisodes: {
                ...show.watchedEpisodes,
                [seasonNumber]: seasonEpisodes.filter((ep) => ep !== episodeNumber),
              },
            };
          }),
        }));
      },

      markSeasonWatched: (showId, seasonNumber, episodeCount) => {
        set((state) => ({
          shows: state.shows.map((show) => {
            if (show.id !== showId) return show;
            const episodes = Array.from({ length: episodeCount }, (_, i) => i + 1);
            return {
              ...show,
              watchedEpisodes: {
                ...show.watchedEpisodes,
                [seasonNumber]: episodes,
              },
            };
          }),
        }));
      },

      unmarkSeasonWatched: (showId, seasonNumber) => {
        set((state) => ({
          shows: state.shows.map((show) => {
            if (show.id !== showId) return show;
            const { [seasonNumber]: _, ...rest } = show.watchedEpisodes;
            return {
              ...show,
              watchedEpisodes: rest,
            };
          }),
        }));
      },

      getWatchedEpisodesCount: (showId) => {
        const show = get().shows.find((s) => s.id === showId);
        if (!show) return 0;
        return Object.values(show.watchedEpisodes).reduce(
          (acc, episodes) => acc + episodes.length,
          0
        );
      },

      addMovie: (movie) => {
        const exists = get().movies.some((m) => m.id === movie.id);
        if (exists) return false;
        set((state) => ({
          movies: [
            ...state.movies,
            {
              ...movie,
              addedAt: new Date().toISOString(),
              watched: false,
              watchedAt: null,
            },
          ],
        }));
        return true;
      },

      removeMovie: (id) => {
        set((state) => ({
          movies: state.movies.filter((m) => m.id !== id),
        }));
      },

      toggleMovieWatched: (id) => {
        set((state) => ({
          movies: state.movies.map((m) => {
            if (m.id !== id) return m;
            const nowWatched = !m.watched;
            return {
              ...m,
              watched: nowWatched,
              watchedAt: nowWatched ? new Date().toISOString() : null,
            };
          }),
        }));
      },

      createList: (name) => {
        set((state) => ({
          lists: [
            ...state.lists,
            {
              id: crypto.randomUUID(),
              name,
              createdAt: new Date().toISOString(),
              items: [],
            },
          ],
        }));
      },

      deleteList: (id) => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== id),
        }));
      },

      renameList: (id, name) => {
        set((state) => ({
          lists: state.lists.map((l) => (l.id === id ? { ...l, name } : l)),
        }));
      },

      addToList: (listId, item) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id !== listId) return list;
            if (list.items.some((i) => i.id === item.id && i.type === item.type)) return list;
            return {
              ...list,
              items: [
                ...list.items,
                {
                  ...item,
                  addedAt: new Date().toISOString(),
                },
              ],
            };
          }),
        }));
      },

      removeFromList: (listId, itemId) => {
        set((state) => ({
          lists: state.lists.map((list) => {
            if (list.id !== listId) return list;
            return {
              ...list,
              items: list.items.filter((i) => i.id !== itemId),
            };
          }),
        }));
      },

      getStats: () => {
        const state = get();
        const totalEpisodes = state.shows.reduce((acc, show) => {
          return (
            acc +
            Object.values(show.watchedEpisodes).reduce(
              (sum, episodes) => sum + episodes.length,
              0
            )
          );
        }, 0);

        const currentlyWatching = state.shows.filter((show) => {
          const watchedCount = Object.values(show.watchedEpisodes).reduce(
            (sum, episodes) => sum + episodes.length,
            0
          );
          return watchedCount > 0 && watchedCount < show.totalEpisodes;
        }).length;

        return {
          totalShows: state.shows.length,
          totalMovies: state.movies.filter((m) => m.watched).length,
          totalEpisodes,
          currentlyWatching,
        };
      },

      loadFromServer: (data) => {
        set({
          shows: data.shows || [],
          movies: data.movies || [],
          lists: data.lists || [],
        });
      },
    }),
    {
      name: 'watched-storage',
    }
  )
);
