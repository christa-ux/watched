import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import ShowCard from '../components/ShowCard';
import EpisodeTracker from '../components/EpisodeTracker';
import CoWatchModal from '../components/CoWatchModal';
import { friendsApi } from '../api/friends';
import type { WatchedShow, CoWatcher, CoWatcherWithProgress } from '../types';
import { useAuth } from '../context/AuthContext';

const FAVORITE_SHOWS_LIST = 'Favorite Shows';

export default function Shows() {
  const { isAuthenticated } = useAuth();
  const shows = useStore((state) => state.shows);
  const removeShow = useStore((state) => state.removeShow);
  const getWatchedEpisodesCount = useStore((state) => state.getWatchedEpisodesCount);
  const updateShowCoWatchers = useStore((state) => state.updateShowCoWatchers);
  const lists = useStore((state) => state.lists);
  const createList = useStore((state) => state.createList);
  const addToList = useStore((state) => state.addToList);
  const removeFromList = useStore((state) => state.removeFromList);

  const [selectedShow, setSelectedShow] = useState<WatchedShow | null>(null);
  const [coWatchShow, setCoWatchShow] = useState<WatchedShow | null>(null);
  const [filter, setFilter] = useState<'all' | 'watching' | 'completed'>('all');
  const [coWatchProgress, setCoWatchProgress] = useState<Record<number, CoWatcherWithProgress[]>>({});

  // Fetch co-watcher progress for all shows
  useEffect(() => {
    if (!isAuthenticated) return;
    friendsApi.getCowatchProgress().then((data) => {
      setCoWatchProgress(data.shows as Record<number, CoWatcherWithProgress[]>);
    }).catch(() => {});
  }, [isAuthenticated, shows]);

  const favoriteList = lists.find((l) => l.name === FAVORITE_SHOWS_LIST);

  const isShowFavorite = useCallback(
    (showId: number) => {
      if (!favoriteList) return false;
      return favoriteList.items.some((item) => item.id === showId && item.type === 'show');
    },
    [favoriteList]
  );

  const toggleFavorite = useCallback(
    (show: WatchedShow) => {
      let listId = favoriteList?.id;
      if (!listId) {
        createList(FAVORITE_SHOWS_LIST);
        const updatedLists = useStore.getState().lists;
        listId = updatedLists.find((l) => l.name === FAVORITE_SHOWS_LIST)?.id;
      }
      if (!listId) return;

      if (isShowFavorite(show.id)) {
        removeFromList(listId, show.id);
      } else {
        addToList(listId, {
          id: show.id,
          type: 'show',
          name: show.name,
          posterPath: show.posterPath,
        });
      }
    },
    [favoriteList, isShowFavorite, createList, addToList, removeFromList]
  );

  const handleSaveCoWatchers = async (coWatchers: CoWatcher[]) => {
    if (!coWatchShow) return;
    updateShowCoWatchers(coWatchShow.id, coWatchers);
    await friendsApi.updateShowCoWatchers(coWatchShow.id, coWatchers);
    // Refresh co-watcher progress
    friendsApi.getCowatchProgress().then((data) => {
      setCoWatchProgress(data.shows as Record<number, CoWatcherWithProgress[]>);
    }).catch(() => {});
  };

  const filteredShows = shows.filter((show) => {
    const watchedCount = getWatchedEpisodesCount(show.id);
    if (filter === 'watching') return watchedCount > 0 && watchedCount < show.totalEpisodes;
    if (filter === 'completed') return watchedCount === show.totalEpisodes;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shows</h1>
          <p className="mt-1 text-gray-500">{shows.length} shows in your library</p>
        </div>

        <div className="flex gap-2">
          {(['all', 'watching', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredShows.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredShows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              watchedCount={getWatchedEpisodesCount(show.id)}
              coWatcherProgress={coWatchProgress[show.id]}
              onRemove={() => removeShow(show.id)}
              onClick={() => setSelectedShow(show)}
              onFavorite={() => toggleFavorite(show)}
              onCoWatch={() => setCoWatchShow(show)}
              isFavorite={isShowFavorite(show.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Tv className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {filter === 'all' ? 'No shows yet' : `No ${filter} shows`}
          </h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all'
              ? 'Search for shows to add them to your library'
              : 'Shows will appear here based on your progress'}
          </p>
          {filter === 'all' && (
            <Link
              to="/search"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Search className="h-4 w-4" />
              Search shows
            </Link>
          )}
        </div>
      )}

      {selectedShow && (
        <EpisodeTracker show={selectedShow} onClose={() => setSelectedShow(null)} />
      )}

      {coWatchShow && (
        <CoWatchModal
          title={coWatchShow.name}
          currentCoWatchers={coWatchShow.coWatchers ?? []}
          onSave={handleSaveCoWatchers}
          onClose={() => setCoWatchShow(null)}
        />
      )}
    </div>
  );
}
