import { useState } from 'react';
import { Trash2, Check, Eye, Heart, Users } from 'lucide-react';
import { getImageUrl } from '../api/tmdb';
import type { WatchedMovie, CoWatcher } from '../types';

interface MovieCardProps {
  movie: WatchedMovie;
  coWatcherProgress?: (CoWatcher & { watched: boolean })[];
  onRemove?: () => void;
  onToggleWatched?: () => void;
  onFavorite?: () => void;
  onCoWatch?: () => void;
  isFavorite?: boolean;
}

function CoWatcherAvatar({ cw, movieWatched }: { cw: CoWatcher & { watched: boolean }; movieWatched: boolean }) {
  const [imgError, setImgError] = useState(false);
  const isAhead = cw.watched && !movieWatched;

  return (
    <div className="relative" title={`${cw.name}${cw.watched ? ' — watched' : ' — not watched yet'}${isAhead ? ' (watched already!)' : ''}`}>
      {cw.avatar && !imgError ? (
        <img
          src={cw.avatar}
          alt={cw.name}
          className="h-6 w-6 rounded-full ring-2 ring-white/50 object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="h-6 w-6 rounded-full ring-2 ring-white/50 bg-white/30 flex items-center justify-center text-[10px] font-semibold text-white">
          {cw.name.charAt(0).toUpperCase()}
        </div>
      )}
      {isAhead && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-orange-400 ring-1 ring-white" />
      )}
    </div>
  );
}

export default function MovieCard({
  movie,
  coWatcherProgress,
  onRemove,
  onToggleWatched,
  onFavorite,
  onCoWatch,
  isFavorite,
}: MovieCardProps) {
  const imageUrl = getImageUrl(movie.posterPath);
  const cwProgress = coWatcherProgress ?? [];

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-gray-300">
      <div className="aspect-[2/3] overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">No Image</div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
        <h3 className="truncate text-sm font-medium text-white">{movie.title}</h3>

        {/* Co-watcher avatars */}
        {cwProgress.length > 0 && (
          <div className="mt-1.5 flex -space-x-1.5">
            {cwProgress.slice(0, 4).map((cw) => (
              <CoWatcherAvatar key={cw.userId} cw={cw} movieWatched={movie.watched} />
            ))}
            {cwProgress.length > 4 && (
              <span className="text-xs text-white/70 ml-1 self-center">+{cwProgress.length - 4}</span>
            )}
          </div>
        )}

        {movie.watched ? (
          <div className="mt-1 flex items-center gap-1 text-xs text-green-400">
            <Check className="h-3 w-3" />
            <span>Watched</span>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-300">
            <Eye className="h-3 w-3" />
            <span>Not watched</span>
          </div>
        )}
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onCoWatch && (
          <button
            onClick={(e) => { e.stopPropagation(); onCoWatch(); }}
            className={`rounded-full p-1.5 shadow-sm transition-colors ${
              (movie.coWatchers?.length ?? 0) > 0
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
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
        {onToggleWatched && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatched(); }}
            className={`rounded-full p-1.5 shadow-sm transition-colors ${
              movie.watched
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-white/90 text-gray-500 hover:bg-green-50 hover:text-green-500'
            }`}
            title={movie.watched ? 'Mark as unwatched' : 'Mark as watched'}
          >
            <Check className="h-4 w-4" />
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
