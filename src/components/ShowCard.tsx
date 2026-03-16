import { Trash2, Heart } from 'lucide-react';
import { getImageUrl } from '../api/tmdb';
import type { WatchedShow } from '../types';

interface ShowCardProps {
  show: WatchedShow;
  watchedCount: number;
  onRemove?: () => void;
  onClick?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export default function ShowCard({ show, watchedCount, onRemove, onClick, onFavorite, isFavorite }: ShowCardProps) {
  const progress = show.totalEpisodes > 0 ? (watchedCount / show.totalEpisodes) * 100 : 0;
  const imageUrl = getImageUrl(show.posterPath);

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-gray-300"
    >
      <div
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="aspect-[2/3] overflow-hidden bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={show.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No Image
            </div>
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
        </div>
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
            className={`rounded-full bg-white/90 p-1.5 shadow-sm transition-colors ${
              isFavorite
                ? 'text-red-500 hover:bg-red-50'
                : 'text-gray-500 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded-full bg-white/90 p-1.5 text-gray-500 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
