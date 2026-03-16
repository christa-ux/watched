import { Trash2, Check, Eye, Heart } from 'lucide-react';
import { getImageUrl } from '../api/tmdb';
import type { WatchedMovie } from '../types';

interface MovieCardProps {
  movie: WatchedMovie;
  onRemove?: () => void;
  onToggleWatched?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export default function MovieCard({ movie, onRemove, onToggleWatched, onFavorite, isFavorite }: MovieCardProps) {
  const imageUrl = getImageUrl(movie.posterPath);

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
          <div className="flex h-full items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
        <h3 className="truncate text-sm font-medium text-white">{movie.title}</h3>
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
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
        {onToggleWatched && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatched();
            }}
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
