// src/hooks/useDirector.ts — React Query hook for Director profile, filmography & cinema statistics
import { useQuery } from '@tanstack/react-query';
import { tmdb, type Movie } from '@/services/tmdb';

export interface DirectorMovie extends Movie {
  department?: string;
  job?: string;
  credit_id?: string;
  vote_count?: number;
  popularity?: number;
}

export interface PersonExternalIds {
  imdb_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  facebook_id?: string | null;
  tiktok_id?: string | null;
}

export interface DirectorProfile {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  external_ids?: PersonExternalIds;
  movies: DirectorMovie[];
  topFilms: DirectorMovie[];
  upcomingFilms: DirectorMovie[];
  stats: {
    totalFilms: number;
    avgRating: number;
    highestRatedFilm: DirectorMovie | null;
    topGenre: string;
    decadesCount: Record<string, number>;
  };
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export const useDirector = (
  directorId: number | string | undefined,
  options: { enabled?: boolean } = {}
) => {
  const numericId = Number(directorId);
  const isEnabled =
    options.enabled !== undefined
      ? options.enabled && Boolean(numericId && !Number.isNaN(numericId))
      : Boolean(numericId && !Number.isNaN(numericId));

  return useQuery<DirectorProfile, Error>({
    queryKey: ['director', numericId],
    queryFn: async () => {
      if (!numericId || Number.isNaN(numericId)) {
        throw new Error('Valid director ID is required');
      }

      const data = await tmdb.getPerson(numericId, 'movie_credits,external_ids');

      // Filter crew for Director credits
      const crewList: DirectorMovie[] = data?.movie_credits?.crew || [];
      const directingCrew = crewList.filter(
        (item) => item.job === 'Director' || item.department === 'Directing'
      );

      // Deduplicate movies by ID
      const seenIds = new Set<number>();
      const deduped: DirectorMovie[] = [];

      for (const film of directingCrew) {
        if (!film.id || seenIds.has(film.id)) continue;
        // Drop entries without a valid poster or release date
        if (!film.poster_path || !film.release_date) continue;
        seenIds.add(film.id);
        deduped.push({
          ...film,
          media_type: 'movie',
        });
      }

      const today = new Date().toISOString().slice(0, 10);

      // Separate released vs upcoming
      const releasedFilms = deduped
        .filter((film) => film.release_date <= today)
        .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));

      const upcomingFilms = deduped
        .filter((film) => film.release_date > today)
        .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));

      // Top 10 films: rank by a combination of vote_count and vote_average
      const topFilms = [...releasedFilms]
        .filter((f) => (f.vote_count ?? 0) >= 30 || (f.vote_average ?? 0) > 0)
        .sort((a, b) => {
          // Weighted score favoring higher votes & rating
          const scoreA = (a.vote_average ?? 0) * Math.log10(Math.max(10, a.vote_count ?? 1));
          const scoreB = (b.vote_average ?? 0) * Math.log10(Math.max(10, b.vote_count ?? 1));
          return scoreB - scoreA;
        })
        .slice(0, 10);

      // Compute statistics
      const ratedFilms = releasedFilms.filter((f) => (f.vote_average ?? 0) > 0);
      const avgRating =
        ratedFilms.length > 0
          ? Number(
              (
                ratedFilms.reduce((acc, curr) => acc + (curr.vote_average ?? 0), 0) /
                ratedFilms.length
              ).toFixed(1)
            )
          : 0;

      // Highest rated film with at least significant votes
      const highestRatedFilm =
        [...releasedFilms]
          .filter((f) => (f.vote_count ?? 0) >= 50)
          .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))[0] ||
        releasedFilms[0] ||
        null;

      // Most frequent genre
      const genreCounts: Record<string, number> = {};
      const decadesCount: Record<string, number> = {};

      for (const film of releasedFilms) {
        if (film.genre_ids && film.genre_ids.length > 0) {
          for (const gid of film.genre_ids) {
            const gName = GENRE_MAP[gid];
            if (gName) {
              genreCounts[gName] = (genreCounts[gName] || 0) + 1;
            }
          }
        }

        if (film.release_date && film.release_date.length >= 4) {
          const year = parseInt(film.release_date.slice(0, 4), 10);
          if (!Number.isNaN(year)) {
            const decade = `${Math.floor(year / 10) * 10}s`;
            decadesCount[decade] = (decadesCount[decade] || 0) + 1;
          }
        }
      }

      let topGenre = 'Cinema';
      let maxGenreCount = 0;
      for (const [name, count] of Object.entries(genreCounts)) {
        if (count > maxGenreCount) {
          maxGenreCount = count;
          topGenre = name;
        }
      }

      return {
        id: data.id,
        name: data.name,
        biography: data.biography || '',
        birthday: data.birthday || null,
        deathday: data.deathday || null,
        place_of_birth: data.place_of_birth || null,
        profile_path: data.profile_path || null,
        known_for_department: data.known_for_department || 'Directing',
        popularity: data.popularity || 0,
        external_ids: data.external_ids,
        movies: deduped,
        topFilms: topFilms.length > 0 ? topFilms : releasedFilms.slice(0, 10),
        upcomingFilms,
        stats: {
          totalFilms: deduped.length,
          avgRating,
          highestRatedFilm,
          topGenre,
          decadesCount,
        },
      };
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 2,
  });
};
