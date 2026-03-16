import type { TMDBShow, TMDBMovie, TMDBSeason, TMDBEpisode, SearchResult, PersonCredits } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const getToken = () => import.meta.env.VITE_TMDB_TOKEN;

const headers = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w300') => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export async function searchMulti(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const response = await fetch(
    `${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
    { headers: headers() }
  );

  if (!response.ok) throw new Error('Search failed');

  const data = await response.json();
  return data.results.filter(
    (item: SearchResult) => item.media_type === 'tv' || item.media_type === 'movie' || item.media_type === 'person'
  );
}

export async function getPersonCredits(personId: number): Promise<PersonCredits> {
  const response = await fetch(
    `${BASE_URL}/person/${personId}/combined_credits`,
    { headers: headers() }
  );
  if (!response.ok) throw new Error('Failed to fetch person credits');
  const data = await response.json();

  // Add media_type to each credit and filter/sort
  const cast = data.cast
    .map((item: Record<string, unknown>) => ({
      ...item,
      media_type: item.media_type || (item.title ? 'movie' : 'tv'),
    }))
    .filter((item: { vote_average?: number }) => item.vote_average && item.vote_average > 0)
    .sort((a: { vote_average: number }, b: { vote_average: number }) => b.vote_average - a.vote_average);

  return { id: personId, cast };
}

export async function getShowDetails(id: number): Promise<TMDBShow> {
  const response = await fetch(`${BASE_URL}/tv/${id}`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to fetch show details');
  return response.json();
}

export async function getSeasonDetails(showId: number, seasonNumber: number): Promise<TMDBSeason & { episodes: TMDBEpisode[] }> {
  const response = await fetch(
    `${BASE_URL}/tv/${showId}/season/${seasonNumber}`,
    { headers: headers() }
  );
  if (!response.ok) throw new Error('Failed to fetch season details');
  return response.json();
}

export async function getMovieDetails(id: number): Promise<TMDBMovie> {
  const response = await fetch(`${BASE_URL}/movie/${id}`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to fetch movie details');
  return response.json();
}

export async function getTrendingShows(): Promise<TMDBShow[]> {
  const response = await fetch(`${BASE_URL}/trending/tv/week`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to fetch trending shows');
  const data = await response.json();
  return data.results;
}

export async function getTrendingMovies(): Promise<TMDBMovie[]> {
  const response = await fetch(`${BASE_URL}/trending/movie/week`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to fetch trending movies');
  const data = await response.json();
  return data.results;
}

export async function getShowRecommendations(showId: number): Promise<TMDBShow[]> {
  const response = await fetch(`${BASE_URL}/tv/${showId}/recommendations`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  const data = await response.json();
  return data.results;
}

export async function getMovieRecommendations(movieId: number): Promise<TMDBMovie[]> {
  const response = await fetch(`${BASE_URL}/movie/${movieId}/recommendations`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  const data = await response.json();
  return data.results;
}

export interface Genre {
  id: number;
  name: string;
}

export async function getGenres(): Promise<{ tv: Genre[]; movie: Genre[] }> {
  const [tvRes, movieRes] = await Promise.all([
    fetch(`${BASE_URL}/genre/tv/list`, { headers: headers() }),
    fetch(`${BASE_URL}/genre/movie/list`, { headers: headers() }),
  ]);
  const tvData = await tvRes.json();
  const movieData = await movieRes.json();
  return { tv: tvData.genres, movie: movieData.genres };
}

export async function discoverShows(params: { genreId?: number; year?: number }): Promise<TMDBShow[]> {
  const queryParams = new URLSearchParams();
  if (params.genreId) queryParams.set('with_genres', params.genreId.toString());
  if (params.year) queryParams.set('first_air_date_year', params.year.toString());
  queryParams.set('sort_by', 'vote_average.desc');
  queryParams.set('vote_count.gte', '100');

  const response = await fetch(`${BASE_URL}/discover/tv?${queryParams}`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to discover shows');
  const data = await response.json();
  return data.results;
}

export async function discoverMovies(params: { genreId?: number; year?: number }): Promise<TMDBMovie[]> {
  const queryParams = new URLSearchParams();
  if (params.genreId) queryParams.set('with_genres', params.genreId.toString());
  if (params.year) queryParams.set('primary_release_year', params.year.toString());
  queryParams.set('sort_by', 'vote_average.desc');
  queryParams.set('vote_count.gte', '200');

  const response = await fetch(`${BASE_URL}/discover/movie?${queryParams}`, { headers: headers() });
  if (!response.ok) throw new Error('Failed to discover movies');
  const data = await response.json();
  return data.results;
}
