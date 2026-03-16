import { useState } from 'react';
import { Plus, Check, Tv, Film, ListPlus, User, ArrowLeft, Loader2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { searchMulti, getImageUrl, getShowDetails, getMovieDetails, getPersonCredits } from '../api/tmdb';
import { useStore } from '../store/useStore';
import type { SearchResult, CreditItem } from '../types';

export default function Search() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState<{ id: number; type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<{ id: number; name: string } | null>(null);
  const [personCredits, setPersonCredits] = useState<CreditItem[]>([]);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const shows = useStore((state) => state.shows);
  const movies = useStore((state) => state.movies);
  const lists = useStore((state) => state.lists);
  const addShow = useStore((state) => state.addShow);
  const addMovie = useStore((state) => state.addMovie);
  const addToList = useStore((state) => state.addToList);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setSelectedPerson(null);
    setPersonCredits([]);
    try {
      const data = await searchMulti(query);
      setResults(data);
    } catch {
      setError('Search failed. Please check your API key and try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonClick = async (person: SearchResult) => {
    setLoadingCredits(true);
    setSelectedPerson({ id: person.id, name: person.name || 'Unknown' });
    try {
      const credits = await getPersonCredits(person.id);
      setPersonCredits(credits.cast);
    } catch {
      setError('Failed to load filmography');
      setPersonCredits([]);
    } finally {
      setLoadingCredits(false);
    }
  };

  const isShowAdded = (id: number) => shows.some((s) => s.id === id);
  const isMovieAdded = (id: number) => movies.some((m) => m.id === id);

  const handleAddShow = async (id: number) => {
    try {
      const details = await getShowDetails(id);
      addShow({
        id: details.id,
        name: details.name,
        posterPath: details.poster_path,
        totalSeasons: details.number_of_seasons ?? 0,
        totalEpisodes: details.number_of_episodes ?? 0,
      });
    } catch {
      setError('Failed to add show. Please try again.');
    }
  };

  const handleAddMovie = async (id: number) => {
    try {
      const details = await getMovieDetails(id);
      addMovie({
        id: details.id,
        title: details.title,
        posterPath: details.poster_path,
      });
    } catch {
      setError('Failed to add movie. Please try again.');
    }
  };

  const handleAddToList = (listId: string, item: { id: number; type: 'show' | 'movie'; name: string; posterPath: string | null }) => {
    addToList(listId, item);
    setAddingToList(null);
  };

  const renderMediaItem = (item: SearchResult | CreditItem, showCharacter = false) => {
    const isTV = item.media_type === 'tv';
    const name = isTV ? item.name : item.title;
    const date = isTV ? item.first_air_date : item.release_date;
    const year = date ? new Date(date).getFullYear() : null;
    const isAdded = isTV ? isShowAdded(item.id) : isMovieAdded(item.id);
    const imageUrl = getImageUrl(item.poster_path, 'w200');
    const character = 'character' in item ? item.character : undefined;

    return (
      <div
        key={`${item.media_type}-${item.id}`}
        className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              {isTV ? <Tv className="h-8 w-8" /> : <Film className="h-8 w-8" />}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-gray-900">{name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    isTV
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {isTV ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                  {isTV ? 'Show' : 'Movie'}
                </span>
                {year && <span>{year}</span>}
                {showCharacter && character && (
                  <span className="text-gray-400">as {character}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {lists.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setAddingToList(
                        addingToList?.id === item.id
                          ? null
                          : { id: item.id, type: item.media_type as 'tv' | 'movie' }
                      )
                    }
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  >
                    <ListPlus className="h-4 w-4" />
                  </button>

                  {addingToList?.id === item.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() =>
                            handleAddToList(list.id, {
                              id: item.id,
                              type: isTV ? 'show' : 'movie',
                              name: name || '',
                              posterPath: item.poster_path,
                            })
                          }
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <ListPlus className="h-4 w-4 text-gray-400" />
                          {list.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() =>
                  isTV ? handleAddShow(item.id) : handleAddMovie(item.id)
                }
                disabled={isAdded}
                className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isAdded
                    ? 'bg-green-50 text-green-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add
                  </>
                )}
              </button>
            </div>
          </div>

          {item.overview && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-500">
              {item.overview}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderPersonItem = (person: SearchResult) => {
    const imageUrl = person.profile_path
      ? getImageUrl(person.profile_path, 'w200')
      : null;
    const knownFor = person.known_for
      ?.slice(0, 2)
      .map((item) => item.name || item.title)
      .join(', ');

    return (
      <div
        key={`person-${person.id}`}
        onClick={() => handlePersonClick(person)}
        className="flex cursor-pointer gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
      >
        <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={person.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-300">
              <User className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <h3 className="font-medium text-gray-900">{person.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
              <User className="h-3 w-3" />
              {person.known_for_department || 'Actor'}
            </span>
          </div>
          {knownFor && (
            <p className="mt-2 text-sm text-gray-500">Known for: {knownFor}</p>
          )}
        </div>
      </div>
    );
  };

  // Show person's filmography
  if (selectedPerson) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => {
              setSelectedPerson(null);
              setPersonCredits([]);
            }}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search results
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedPerson.name}</h1>
          <p className="mt-1 text-gray-500">Filmography</p>
        </div>

        {loadingCredits ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : personCredits.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{personCredits.length} credits found</p>
            <div className="grid gap-4">
              {personCredits.map((credit) => renderMediaItem(credit, true))}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-gray-500">No credits found</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="mt-1 text-gray-500">Find shows, movies, or search by actor name</p>
      </div>

      <SearchBar onSearch={handleSearch} loading={loading} placeholder="Search shows, movies, or actors..." />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{results.length} results found</p>

          <div className="grid gap-4">
            {results.map((result) => {
              if (result.media_type === 'person') {
                return renderPersonItem(result);
              }
              return renderMediaItem(result);
            })}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Tv className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Search for content</h3>
          <p className="mt-2 text-gray-500">
            Enter a show, movie, or actor name to search
          </p>
        </div>
      )}
    </div>
  );
}
