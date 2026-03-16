import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Tv, Film, Plus, Check, RefreshCw, Filter, HelpCircle } from 'lucide-react';
import {
  searchMulti,
  getShowRecommendations,
  getMovieRecommendations,
  getGenres,
  discoverShows,
  discoverMovies,
  getShowDetails,
  getMovieDetails,
  getImageUrl,
  type Genre,
} from '../api/tmdb';
import { useStore } from '../store/useStore';
import type { TMDBShow, TMDBMovie } from '../types';

type Tab = 'commands' | 'discover';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const HELP_TEXT = `**Available Commands:**

**/add [name]** - Search and add a show or movie
  Example: /add breaking bad

**/fav [name]** - Add to Favorite Shows or Favorite Movies
  Example: /fav the office

**/list create [name]** - Create a new list
  Example: /list create Want to Watch

**/list add [list name] | [show/movie name]** - Add to a list
  Example: /list add Want to Watch | Breaking Bad

**/watched [name]** - Mark a movie as watched
  Example: /watched inception

**/help** - Show this help message`;

export default function Assistant() {
  const [tab, setTab] = useState<Tab>('commands');

  // Command state
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I can help you manage your library. Type **/help** to see available commands.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Discover state
  const [contentType, setContentType] = useState<'shows' | 'movies'>('shows');
  const [source, setSource] = useState<'library' | 'genre' | 'trending'>('library');
  const [recommendations, setRecommendations] = useState<(TMDBShow | TMDBMovie)[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [genres, setGenres] = useState<{ tv: Genre[]; movie: Genre[] }>({ tv: [], movie: [] });
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  const shows = useStore((state) => state.shows);
  const movies = useStore((state) => state.movies);
  const lists = useStore((state) => state.lists);
  const addShow = useStore((state) => state.addShow);
  const addMovie = useStore((state) => state.addMovie);
  const toggleMovieWatched = useStore((state) => state.toggleMovieWatched);
  const createList = useStore((state) => state.createList);
  const addToList = useStore((state) => state.addToList);

  const isShowAdded = (id: number) => shows.some((s) => s.id === id);
  const isMovieAdded = (id: number) => movies.some((m) => m.id === id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    getGenres().then(setGenres).catch(console.error);
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const handleCommand = async (text: string) => {
    const trimmed = text.trim();
    addMessage('user', trimmed);
    setLoading(true);

    try {
      // /help
      if (trimmed.toLowerCase() === '/help') {
        addMessage('assistant', HELP_TEXT);
        return;
      }

      // /add [name]
      if (trimmed.toLowerCase().startsWith('/add ')) {
        const query = trimmed.slice(5).trim();
        if (!query) {
          addMessage('assistant', 'Please provide a name. Example: `/add breaking bad`');
          return;
        }

        const results = await searchMulti(query);
        const filtered = results.filter((r) => r.media_type === 'tv' || r.media_type === 'movie');

        if (filtered.length === 0) {
          addMessage('assistant', `No results found for "${query}"`);
          return;
        }

        const top = filtered[0];
        const isTV = top.media_type === 'tv';
        const name = isTV ? top.name : top.title;

        if (isTV) {
          if (isShowAdded(top.id)) {
            addMessage('assistant', `"${name}" is already in your library!`);
            return;
          }
          const details = await getShowDetails(top.id);
          addShow({
            id: details.id,
            name: details.name,
            posterPath: details.poster_path,
            totalSeasons: details.number_of_seasons ?? 0,
            totalEpisodes: details.number_of_episodes ?? 0,
          });
          addMessage('assistant', `Added **${name}** (${details.number_of_seasons} seasons, ${details.number_of_episodes} episodes) to your library!`);
        } else {
          if (isMovieAdded(top.id)) {
            addMessage('assistant', `"${name}" is already in your library!`);
            return;
          }
          const details = await getMovieDetails(top.id);
          addMovie({
            id: details.id,
            title: details.title,
            posterPath: details.poster_path,
          });
          addMessage('assistant', `Added **${name}** to your library!`);
        }
        return;
      }

      // /fav [name]
      if (trimmed.toLowerCase().startsWith('/fav ')) {
        const query = trimmed.slice(5).trim();
        if (!query) {
          addMessage('assistant', 'Please provide a name. Example: `/fav the office`');
          return;
        }

        const results = await searchMulti(query);
        const filtered = results.filter((r) => r.media_type === 'tv' || r.media_type === 'movie');

        if (filtered.length === 0) {
          addMessage('assistant', `No results found for "${query}"`);
          return;
        }

        const top = filtered[0];
        const isTV = top.media_type === 'tv';
        const name = isTV ? top.name : top.title;
        const listName = isTV ? 'Favorite Shows' : 'Favorite Movies';

        // Find or create the appropriate favorites list
        let favList = lists.find((l) => l.name === listName);
        if (!favList) {
          createList(listName);
          addMessage('assistant', `Created **${listName}** list`);
        }

        // We need to get the list again after potential creation
        // Using setTimeout to allow state to update
        setTimeout(() => {
          const updatedLists = useStore.getState().lists;
          const targetList = updatedLists.find((l) => l.name === listName);
          if (targetList) {
            addToList(targetList.id, {
              id: top.id,
              type: isTV ? 'show' : 'movie',
              name: name || '',
              posterPath: top.poster_path,
            });
          }
        }, 50);

        addMessage('assistant', `Added **${name}** to **${listName}**!`);
        return;
      }

      // /list create [name]
      if (trimmed.toLowerCase().startsWith('/list create ')) {
        const listName = trimmed.slice(13).trim();
        if (!listName) {
          addMessage('assistant', 'Please provide a list name. Example: `/list create Favorites`');
          return;
        }

        const exists = lists.some((l) => l.name.toLowerCase() === listName.toLowerCase());
        if (exists) {
          addMessage('assistant', `A list named "${listName}" already exists!`);
          return;
        }

        createList(listName);
        addMessage('assistant', `Created list **${listName}**!`);
        return;
      }

      // /list add [list name] | [item name]
      if (trimmed.toLowerCase().startsWith('/list add ')) {
        const rest = trimmed.slice(10).trim();
        const parts = rest.split('|').map((p) => p.trim());

        if (parts.length !== 2 || !parts[0] || !parts[1]) {
          addMessage('assistant', 'Please use format: `/list add [list name] | [show/movie name]`\nExample: `/list add Favorites | The Office`');
          return;
        }

        const [listName, itemQuery] = parts;
        let list = lists.find((l) => l.name.toLowerCase() === listName.toLowerCase());

        if (!list) {
          createList(listName);
          // Get the newly created list
          addMessage('assistant', `Created new list **${listName}**`);
        }

        const results = await searchMulti(itemQuery);
        const filtered = results.filter((r) => r.media_type === 'tv' || r.media_type === 'movie');

        if (filtered.length === 0) {
          addMessage('assistant', `No results found for "${itemQuery}"`);
          return;
        }

        const top = filtered[0];
        const isTV = top.media_type === 'tv';
        const name = isTV ? top.name : top.title;

        // Find list again (in case we just created it)
        const targetList = lists.find((l) => l.name.toLowerCase() === listName.toLowerCase());
        if (targetList) {
          addToList(targetList.id, {
            id: top.id,
            type: isTV ? 'show' : 'movie',
            name: name || '',
            posterPath: top.poster_path,
          });
          addMessage('assistant', `Added **${name}** to list **${listName}**!`);
        } else {
          addMessage('assistant', `Added **${name}** to list **${listName}**! (Note: List will update on next refresh)`);
        }
        return;
      }

      // /watched [name]
      if (trimmed.toLowerCase().startsWith('/watched ')) {
        const query = trimmed.slice(9).trim();
        if (!query) {
          addMessage('assistant', 'Please provide a movie name. Example: `/watched inception`');
          return;
        }

        // First check if it's in our library
        const movie = movies.find((m) => m.title.toLowerCase().includes(query.toLowerCase()));

        if (movie) {
          if (!movie.watched) {
            toggleMovieWatched(movie.id);
            addMessage('assistant', `Marked **${movie.title}** as watched!`);
          } else {
            addMessage('assistant', `**${movie.title}** is already marked as watched!`);
          }
          return;
        }

        // If not in library, search and add it
        const results = await searchMulti(query);
        const movieResult = results.find((r) => r.media_type === 'movie');

        if (!movieResult) {
          addMessage('assistant', `No movie found for "${query}". Try adding it first with \`/add ${query}\``);
          return;
        }

        const details = await getMovieDetails(movieResult.id);
        if (!isMovieAdded(details.id)) {
          addMovie({
            id: details.id,
            title: details.title,
            posterPath: details.poster_path,
          });
        }
        // Need to toggle after state updates
        setTimeout(() => {
          toggleMovieWatched(details.id);
        }, 100);
        addMessage('assistant', `Added **${details.title}** and marked it as watched!`);
        return;
      }

      // Unknown command
      if (trimmed.startsWith('/')) {
        addMessage('assistant', `Unknown command. Type **/help** to see available commands.`);
        return;
      }

      // Regular text - treat as search
      addMessage('assistant', `To search and add content, use: \`/add ${trimmed}\`\n\nType **/help** to see all commands.`);

    } catch (error) {
      addMessage('assistant', `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    handleCommand(input);
    setInput('');
  };

  // Discover functions
  const loadRecommendations = async () => {
    setDiscoverLoading(true);
    setRecommendations([]);

    try {
      let results: (TMDBShow | TMDBMovie)[] = [];

      if (source === 'library') {
        if (contentType === 'shows' && shows.length > 0) {
          const randomShow = shows[Math.floor(Math.random() * shows.length)];
          results = await getShowRecommendations(randomShow.id);
        } else if (contentType === 'movies' && movies.length > 0) {
          const randomMovie = movies[Math.floor(Math.random() * movies.length)];
          results = await getMovieRecommendations(randomMovie.id);
        }
      } else if (source === 'genre' && selectedGenre) {
        if (contentType === 'shows') {
          results = await discoverShows({ genreId: selectedGenre });
        } else {
          results = await discoverMovies({ genreId: selectedGenre });
        }
      } else if (source === 'trending') {
        if (contentType === 'shows') {
          results = await discoverShows({});
        } else {
          results = await discoverMovies({});
        }
      }

      const filtered = results.filter((item) => {
        return contentType === 'shows' ? !isShowAdded(item.id) : !isMovieAdded(item.id);
      });

      setRecommendations(filtered.slice(0, 12));
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setDiscoverLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'discover') {
      if (source === 'genre' && !selectedGenre) return;
      loadRecommendations();
    }
  }, [tab, contentType, source, selectedGenre]);

  const handleAddShow = async (show: TMDBShow) => {
    const details = await getShowDetails(show.id);
    addShow({
      id: details.id,
      name: details.name,
      posterPath: details.poster_path,
      totalSeasons: details.number_of_seasons ?? 0,
      totalEpisodes: details.number_of_episodes ?? 0,
    });
  };

  const handleAddMovie = async (movie: TMDBMovie) => {
    const details = await getMovieDetails(movie.id);
    addMovie({
      id: details.id,
      title: details.title,
      posterPath: details.poster_path,
    });
  };

  const currentGenres = contentType === 'shows' ? genres.tv : genres.movie;
  const hasLibrary = contentType === 'shows' ? shows.length > 0 : movies.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assistant</h1>
          <p className="mt-1 text-gray-500">Commands & recommendations</p>
        </div>

        <div className="flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setTab('commands')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'commands'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bot className="h-4 w-4" />
            Commands
          </button>
          <button
            onClick={() => setTab('discover')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'discover'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Discover
          </button>
        </div>
      </div>

      {tab === 'commands' ? (
        <div className="flex h-[calc(100vh-14rem)] flex-col">
          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white">
            <div className="space-y-4 p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <Bot className="h-4 w-4 text-indigo-600" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p
                      className="whitespace-pre-wrap text-sm"
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded text-xs">$1</code>')
                      }}
                    />
                  </div>

                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                onClick={() => setInput('/add ')}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                /add
              </button>
              <button
                onClick={() => setInput('/fav ')}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                /fav
              </button>
              <button
                onClick={() => setInput('/list create ')}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                /list create
              </button>
              <button
                onClick={() => setInput('/watched ')}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                /watched
              </button>
              <button
                onClick={() => handleCommand('/help')}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                <HelpCircle className="h-3 w-3" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a command... (e.g., /add breaking bad)"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Discover Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setContentType('shows')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  contentType === 'shows'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Tv className="h-4 w-4" />
                Shows
              </button>
              <button
                onClick={() => setContentType('movies')}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  contentType === 'movies'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Film className="h-4 w-4" />
                Movies
              </button>
            </div>

            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                onClick={() => setSource('library')}
                disabled={!hasLibrary}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === 'library'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                Based on Library
              </button>
              <button
                onClick={() => setSource('genre')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === 'genre'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By Genre
              </button>
              <button
                onClick={() => setSource('trending')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  source === 'trending'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Top Rated
              </button>
            </div>

            <button
              onClick={loadRecommendations}
              disabled={discoverLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${discoverLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {source === 'genre' && (
            <div className="flex flex-wrap gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              {currentGenres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedGenre === genre.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}

          {discoverLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Finding recommendations...
              </div>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {recommendations.map((item) => {
                const isShow = 'name' in item;
                const name = isShow ? item.name : item.title;
                const imageUrl = getImageUrl(item.poster_path);
                const year = isShow
                  ? item.first_air_date?.slice(0, 4)
                  : item.release_date?.slice(0, 4);
                const isAdded = isShow ? isShowAdded(item.id) : isMovieAdded(item.id);

                return (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-gray-300"
                  >
                    <div className="aspect-[2/3] overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          {isShow ? <Tv className="h-8 w-8" /> : <Film className="h-8 w-8" />}
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="truncate text-sm font-medium text-gray-900">{name}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">{year}</p>
                    </div>

                    <button
                      onClick={() =>
                        isShow
                          ? handleAddShow(item as TMDBShow)
                          : handleAddMovie(item as TMDBMovie)
                      }
                      disabled={isAdded}
                      className={`absolute right-2 top-2 rounded-full p-1.5 shadow-sm transition-all ${
                        isAdded
                          ? 'bg-green-500 text-white'
                          : 'bg-white/90 text-gray-500 opacity-0 hover:bg-indigo-500 hover:text-white group-hover:opacity-100'
                      }`}
                    >
                      {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {source === 'library' && !hasLibrary
                  ? `Add some ${contentType} first`
                  : source === 'genre' && !selectedGenre
                  ? 'Select a genre'
                  : 'No recommendations found'}
              </h3>
              <p className="mt-2 text-gray-500">
                {source === 'library' && !hasLibrary
                  ? `We need ${contentType} in your library to give personalized recommendations`
                  : source === 'genre' && !selectedGenre
                  ? 'Pick a genre above to discover content'
                  : 'Try a different filter or refresh'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
