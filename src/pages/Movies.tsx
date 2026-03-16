import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Film, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import MovieCard from '../components/MovieCard';
import type { WatchedMovie } from '../types';

const FAVORITE_MOVIES_LIST = 'Favorite Movies';

export default function Movies() {
  const movies = useStore((state) => state.movies);
  const removeMovie = useStore((state) => state.removeMovie);
  const toggleMovieWatched = useStore((state) => state.toggleMovieWatched);
  const lists = useStore((state) => state.lists);
  const createList = useStore((state) => state.createList);
  const addToList = useStore((state) => state.addToList);
  const removeFromList = useStore((state) => state.removeFromList);
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched'>('all');

  const favoriteList = lists.find((l) => l.name === FAVORITE_MOVIES_LIST);

  const isMovieFavorite = useCallback(
    (movieId: number) => {
      if (!favoriteList) return false;
      return favoriteList.items.some((item) => item.id === movieId && item.type === 'movie');
    },
    [favoriteList]
  );

  const toggleFavorite = useCallback(
    (movie: WatchedMovie) => {
      let listId = favoriteList?.id;
      if (!listId) {
        createList(FAVORITE_MOVIES_LIST);
        const updatedLists = useStore.getState().lists;
        listId = updatedLists.find((l) => l.name === FAVORITE_MOVIES_LIST)?.id;
      }
      if (!listId) return;

      if (isMovieFavorite(movie.id)) {
        removeFromList(listId, movie.id);
      } else {
        addToList(listId, {
          id: movie.id,
          type: 'movie',
          name: movie.title,
          posterPath: movie.posterPath,
        });
      }
    },
    [favoriteList, isMovieFavorite, createList, addToList, removeFromList]
  );

  const filteredMovies = movies.filter((movie) => {
    if (filter === 'watched') return movie.watched;
    if (filter === 'unwatched') return !movie.watched;
    return true;
  });

  const sortedMovies = [...filteredMovies].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

  const watchedCount = movies.filter((m) => m.watched).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Movies</h1>
          <p className="mt-1 text-gray-500">
            {watchedCount} watched, {movies.length - watchedCount} to watch
          </p>
        </div>

        <div className="flex gap-2">
          {(['all', 'watched', 'unwatched'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'unwatched' ? 'To Watch' : f}
            </button>
          ))}
        </div>
      </div>

      {sortedMovies.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sortedMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onRemove={() => removeMovie(movie.id)}
              onToggleWatched={() => toggleMovieWatched(movie.id)}
              onFavorite={() => toggleFavorite(movie)}
              isFavorite={isMovieFavorite(movie.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Film className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {filter === 'all' ? 'No movies yet' : `No ${filter === 'unwatched' ? 'movies to watch' : 'watched movies'}`}
          </h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all'
              ? 'Search for movies to add them to your library'
              : 'Movies will appear here based on their status'}
          </p>
          {filter === 'all' && (
            <Link
              to="/search"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Search className="h-4 w-4" />
              Search movies
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
