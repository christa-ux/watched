import { Link } from 'react-router-dom';
import { Tv, Film, PlayCircle, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import StatsCard from '../components/StatsCard';
import ShowCard from '../components/ShowCard';
import MovieCard from '../components/MovieCard';

export default function Dashboard() {
  const stats = useStore((state) => state.getStats());
  const shows = useStore((state) => state.shows);
  const movies = useStore((state) => state.movies);
  const getWatchedEpisodesCount = useStore((state) => state.getWatchedEpisodesCount);
  const toggleMovieWatched = useStore((state) => state.toggleMovieWatched);

  const recentShows = [...shows]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 4);

  const recentMovies = [...movies]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Your watching statistics at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Shows" value={stats.totalShows} icon={Tv} color="indigo" />
        <StatsCard title="Movies" value={stats.totalMovies} icon={Film} color="emerald" />
        <StatsCard title="Episodes" value={stats.totalEpisodes} icon={PlayCircle} color="amber" />
        <StatsCard title="Watching" value={stats.currentlyWatching} icon={Clock} color="rose" />
      </div>

      {recentShows.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Shows</h2>
            <Link
              to="/shows"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {recentShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                watchedCount={getWatchedEpisodesCount(show.id)}
              />
            ))}
          </div>
        </div>
      )}

      {recentMovies.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Movies</h2>
            <Link
              to="/movies"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {recentMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onToggleWatched={() => toggleMovieWatched(movie.id)}
              />
            ))}
          </div>
        </div>
      )}

      {shows.length === 0 && movies.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Tv className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No content yet</h3>
          <p className="mt-2 text-gray-500">Start by searching for shows or movies to track</p>
          <Link
            to="/search"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Search content
          </Link>
        </div>
      )}
    </div>
  );
}
