import { useState } from 'react';
import { Trash2, Heart, Users } from 'lucide-react';
import { getImageUrl } from '../api/tmdb';
import type { WatchedShow, CoWatcherWithProgress } from '../types';

interface ShowCardProps {
  show: WatchedShow;
  watchedCount: number;
  coWatcherProgress?: CoWatcherWithProgress[];
  onRemove?: () => void;
  onClick?: () => void;
  onFavorite?: () => void;
  onCoWatch?: () => void;
  isFavorite?: boolean;
}

function CoWatcherAvatar({
  cw,
  myWatchedCount,
}: {
  cw: CoWatcherWithProgress;
  myWatchedCount: number;
}) {
  const [imgError, setImgError] = useState(false);
  const isAhead = cw.watchedCount > myWatchedCount;

  return (
    <div className="relative" title={`${cw.name} — ${cw.watchedCount} ep watched${isAhead ? ' (ahead of you)' : ''}`}>
      {cw.avatar && !imgError ? (
        <img
          src={cw.avatar}
          alt={cw.name}
          className="h-6 w-6 rounded-full ring-2 ring-white object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="h-6 w-6 rounded-full ring-2 ring-white bg-indigo-200 flex items-center justify-center text-[10px] font-semibold text-indigo-700">
          {cw.name.charAt(0).toUpperCase()}
        </div>
      )}
      {isAhead && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-400 ring-1 ring-white" title="Ahead of you" />
      )}
    </div>
  );
}

export default function ShowCard({
  show,
  watchedCount,
  coWatcherProgress,
  onRemove,
  onClick,
  onFavorite,
  onCoWatch,
  isFavorite,
}: ShowCardProps) {
  const progress = show.totalEpisodes > 0 ? (watchedCount / show.totalEpisodes) * 100 : 0;
  const imageUrl = getImageUrl(show.posterPath);
  const cwProgress = coWatcherProgress ?? [];

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-gray-300">
      <div className="cursor-pointer" onClick={onClick}>
        <div className="aspect-[2/3] overflow-hidden bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={show.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
          )}
        </div>

        <div className="p-3">
          <h3 className="truncate text-sm font-medium text-gray-900">{show.name}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {watchedCount} / {show.totalEpisodes} episodes
          </p>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Co-watcher avatars */}
          {cwProgress.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {cwProgress.slice(0, 4).map((cw) => (
                  <CoWatcherAvatar key={cw.userId} cw={cw} myWatchedCount={watchedCount} />
                ))}
              </div>
              {cwProgress.length > 4 && (
                <span className="text-xs text-gray-400">+{cwProgress.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onCoWatch && (
          <button
            onClick={(e) => { e.stopPropagation(); onCoWatch(); }}
            className={`rounded-full p-1.5 shadow-sm transition-colors ${
              (show.coWatchers?.length ?? 0) > 0
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                : 'bg-white/90 text-gray-500 hover:bg-indigo-50 hover:text-indigo-500'
            }`}
            title="Co-watching"
          >
            <Users className="h-4 w-4" />
          </button>
        )}
        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className={`rounded-full bg-white/90 p-1.5 shadow-sm transition-colors ${
              isFavorite ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="rounded-full bg-white/90 p-1.5 text-gray-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
