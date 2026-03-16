import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, X, Loader2 } from 'lucide-react';
import { getSeasonDetails, getImageUrl } from '../api/tmdb';
import { useStore } from '../store/useStore';
import type { WatchedShow, TMDBEpisode } from '../types';

interface EpisodeTrackerProps {
  show: WatchedShow;
  onClose: () => void;
}

interface SeasonData {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  episodes: TMDBEpisode[];
}

export default function EpisodeTracker({ show, onClose }: EpisodeTrackerProps) {
  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    markEpisodeWatched,
    unmarkEpisodeWatched,
    markSeasonWatched,
    unmarkSeasonWatched,
  } = useStore();

  const watchedEpisodes = useStore(
    (state) => state.shows.find((s) => s.id === show.id)?.watchedEpisodes ?? {}
  );

  useEffect(() => {
    async function loadSeasons() {
      setLoading(true);
      const seasonData: SeasonData[] = [];

      for (let i = 1; i <= show.totalSeasons; i++) {
        try {
          const season = await getSeasonDetails(show.id, i);
          seasonData.push({
            seasonNumber: i,
            name: season.name,
            episodeCount: season.episodes?.length ?? 0,
            episodes: season.episodes ?? [],
          });
        } catch {
          seasonData.push({
            seasonNumber: i,
            name: `Season ${i}`,
            episodeCount: 0,
            episodes: [],
          });
        }
      }

      setSeasons(seasonData);
      setLoading(false);
    }

    loadSeasons();
  }, [show.id, show.totalSeasons]);

  const isEpisodeWatched = (seasonNumber: number, episodeNumber: number) => {
    return watchedEpisodes[seasonNumber]?.includes(episodeNumber) ?? false;
  };

  const isSeasonWatched = (seasonNumber: number, episodeCount: number) => {
    const watched = watchedEpisodes[seasonNumber] ?? [];
    return watched.length === episodeCount && episodeCount > 0;
  };

  const toggleEpisode = (seasonNumber: number, episodeNumber: number) => {
    if (isEpisodeWatched(seasonNumber, episodeNumber)) {
      unmarkEpisodeWatched(show.id, seasonNumber, episodeNumber);
    } else {
      markEpisodeWatched(show.id, seasonNumber, episodeNumber);
    }
  };

  const toggleSeason = (seasonNumber: number, episodeCount: number) => {
    if (isSeasonWatched(seasonNumber, episodeCount)) {
      unmarkSeasonWatched(show.id, seasonNumber);
    } else {
      markSeasonWatched(show.id, seasonNumber, episodeCount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            {show.posterPath && (
              <img
                src={getImageUrl(show.posterPath, 'w200') ?? ''}
                alt={show.name}
                className="h-16 w-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{show.name}</h2>
              <p className="text-sm text-gray-500">
                {show.totalSeasons} seasons, {show.totalEpisodes} episodes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {seasons.map((season) => {
                const watchedInSeason = watchedEpisodes[season.seasonNumber]?.length ?? 0;
                const seasonWatched = isSeasonWatched(season.seasonNumber, season.episodeCount);
                const isExpanded = expandedSeason === season.seasonNumber;

                return (
                  <div
                    key={season.seasonNumber}
                    className="overflow-hidden rounded-xl border border-gray-200"
                  >
                    <div
                      className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100"
                      onClick={() =>
                        setExpandedSeason(isExpanded ? null : season.seasonNumber)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSeason(season.seasonNumber, season.episodeCount);
                          }}
                          className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                            seasonWatched
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {seasonWatched && <Check className="h-4 w-4" />}
                        </button>
                        <span className="font-medium text-gray-900">{season.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          {watchedInSeason} / {season.episodeCount}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white p-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {season.episodes.map((episode) => {
                            const watched = isEpisodeWatched(
                              season.seasonNumber,
                              episode.episode_number
                            );
                            return (
                              <button
                                key={episode.id}
                                onClick={() =>
                                  toggleEpisode(season.seasonNumber, episode.episode_number)
                                }
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                  watched
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                    watched
                                      ? 'border-indigo-500 bg-indigo-500 text-white'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {watched && <Check className="h-3 w-3" />}
                                </span>
                                <span className="truncate">Ep {episode.episode_number}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
