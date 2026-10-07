const TMDB_API_KEY = '3ca43ac7d6fb0198ecb572fa4db184bb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

export interface MovieDetail extends Movie {
  imdb_id?: string;
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  budget?: number;
  revenue?: number;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string;
  air_date?: string;
  vote_average?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

const tmdbFetch = async (endpoint: string) => {
  const sep = endpoint.includes("?") ? "&" : "?";
  const response = await fetch(`${TMDB_BASE_URL}${endpoint}${sep}api_key=${TMDB_API_KEY}`);
  if (!response.ok) throw new Error('TMDB API request failed');
  return response.json();
};

export const tmdb = {
  getTrending: (type: 'movie' | 'tv' = 'movie', timeWindow: 'day' | 'week' = 'day') =>
    tmdbFetch(`/trending/${type}/${timeWindow}`),

  getPopular: (type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/popular`),

  getTopRated: (type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/top_rated`),

  getUpcoming: async (page: number = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const data = await tmdbFetch(`/movie/upcoming?page=${page}`);
    const strictlyUpcoming = (data.results || []).filter(
      (m: Movie) => m.release_date && m.release_date > today
    );
    if (strictlyUpcoming.length < 5) {
      const discoverData = await tmdbFetch(
        `/discover/movie?sort_by=popularity.desc&primary_release_date.gt=${today}&page=${page}`
      );
      return discoverData;
    }
    return { ...data, results: strictlyUpcoming };
  },

  getNowPlaying: (page: number = 1) =>
    tmdbFetch(`/movie/now_playing?page=${page}`),

  getLatestReleases: async (page: number = 1) => {
    const today = new Date().toISOString().split('T')[0];
    const data = await tmdbFetch(`/movie/now_playing?page=${page}`);
    const results = (data.results || []).filter(
      (m: Movie) => m.backdrop_path && m.release_date && m.release_date <= today
    );
    if (results.length < 6) {
      const past90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      const discoverData = await tmdbFetch(
        `/discover/movie?sort_by=popularity.desc&primary_release_date.lte=${today}&primary_release_date.gte=${past90}&vote_count.gte=10&page=${page}`
      );
      return {
        ...data,
        results: (discoverData.results || []).filter(
          (m: Movie) => m.backdrop_path && m.release_date && m.release_date <= today
        ),
      };
    }
    return { ...data, results };
  },

  getOnTheAir: () =>
    tmdbFetch('/tv/on_the_air'),

  getAiringToday: () =>
    tmdbFetch('/tv/airing_today'),

  getByGenre: (genreId: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/discover/${type}?with_genres=${genreId}`),

  getByProvider: (providerId: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/discover/${type}?with_watch_providers=${providerId}&watch_region=US&sort_by=popularity.desc`),

  getGenres: (type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/genre/${type}/list`),

  search: (query: string, type: 'movie' | 'tv' | 'multi' = 'multi') =>
    tmdbFetch(`/search/${type}?query=${encodeURIComponent(query)}`),

  getDetails: (id: number, type: 'movie' | 'tv' | 'person' = 'movie') =>
    tmdbFetch(`/${type}/${id}`),

  getPersonDetails: (personId: number) =>
    tmdbFetch(`/person/${personId}`),

  getPersonCombinedCredits: (personId: number) =>
    tmdbFetch(`/person/${personId}/combined_credits`),

  getExternalIds: (id: number, type: 'movie' | 'tv' = 'tv') =>
    tmdbFetch(`/${type}/${id}/external_ids`),

  getSeasonDetails: (tvId: number, seasonNumber: number) =>
    tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`),

  getCredits: (id: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/${id}/credits`),

  getVideos: (id: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/${id}/videos`),

  discover: (type: 'movie' | 'tv' = 'movie', queryString: string = '') =>
    tmdbFetch(`/discover/${type}?${queryString}`),

  discoverMovies: (queryString: string = '') =>
    tmdbFetch(`/discover/movie?${queryString}`),

  discoverTV: (queryString: string = '') =>
    tmdbFetch(`/discover/tv?${queryString}`),

  getWatchProviders: (id: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/${id}/watch/providers`),

  getMovieReleaseDates: (id: number) =>
    tmdbFetch(`/movie/${id}/release_dates`),

  getCollection: (id: number) =>
    tmdbFetch(`/collection/${id}`),

  getImages: (id: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/${id}/images`),

  getPerson: (personId: number, append?: string) =>
    tmdbFetch(`/person/${personId}${append ? `?append_to_response=${append}` : ''}`),

  getReviews: (id: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/${id}/reviews`),

  searchPerson: (query: string) =>
    tmdbFetch(`/search/person?query=${encodeURIComponent(query)}`),

  getUpcomingMovies: (page: number = 1) =>
    tmdb.getUpcoming(page),

  getRecommendations: (id: number, type: 'movie' | 'tv' = 'movie') =>
    tmdbFetch(`/${type}/${id}/recommendations`),

  getImageUrl: (path: string, size: 'w500' | 'w300' | 'w185' | 'original' = 'w500') =>
    path ? `${TMDB_IMAGE_BASE}/${size}${path}` : '/placeholder.svg',
};
