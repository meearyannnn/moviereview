import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clapperboard, ArrowUp } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { LandscapeHeroRow } from '@/components/LandscapeHeroRow';
import { MediaFilterBar, type FilterState } from '@/components/MediaFilterBar';
import { tmdb, type Movie } from '@/services/tmdb';

const SKELETON_COUNT = 18;

const MoviesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlProvider = searchParams.get('provider') || 'all';

  const [latestReleases, setLatestReleases] = useState<Movie[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    genre: 'all',
    year: 'all',
    sort: 'popular',
    provider: urlProvider,
    country: 'all',
  });

  useEffect(() => {
    const p = searchParams.get('provider');
    if (p && p !== filters.provider) {
      setFilters((prev) => ({ ...prev, provider: p }));
    }
  }, [searchParams]);

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load Latest Releases row using proper TMDB logic
  useEffect(() => {
    const loadLatestReleases = async () => {
      try {
        const data = await tmdb.getLatestReleases();
        const list = (data.results || []).filter((m: Movie) => m.backdrop_path);
        setLatestReleases(list);
      } catch (err) {
        console.error('Failed to load latest releases:', err);
      }
    };
    loadLatestReleases();
  }, []);

  // Fetch movies based on active filters
  const loadFilteredMovies = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let queryParts: string[] = ['include_adult=false', 'include_video=false'];

      // Sort
      if (filters.sort === 'top_rated') {
        queryParts.push('sort_by=vote_average.desc&vote_count.gte=100');
      } else if (filters.sort === 'latest') {
        queryParts.push(`sort_by=primary_release_date.desc&vote_count.gte=10&primary_release_date.lte=${today}`);
      } else if (filters.sort === 'trending') {
        queryParts.push('sort_by=popularity.desc');
      } else {
        queryParts.push('sort_by=popularity.desc');
      }

      // Genre
      if (filters.genre !== 'all') {
        queryParts.push(`with_genres=${filters.genre}`);
      }

      // Year
      if (filters.year !== 'all') {
        if (filters.year.endsWith('s')) {
          const startDecade = parseInt(filters.year);
          queryParts.push(`primary_release_date.gte=${startDecade}-01-01&primary_release_date.lte=${startDecade + 9}-12-31`);
        } else {
          queryParts.push(`primary_release_year=${filters.year}`);
        }
      }

      // Country
      if (filters.country !== 'all') {
        queryParts.push(`with_origin_country=${filters.country}`);
      }

      // Provider
      if (filters.provider !== 'all') {
        const providerMap: Record<string, number> = {
          netflix: 8,
          prime: 9,
          disney: 337,
          apple: 350,
          appletv: 350,
          max: 1899,
          hbomax: 1899,
          hulu: 15,
          paramount: 531,
          peacock: 386,
          crunchyroll: 283,
          starz: 43,
          amc: 526,
          mgm: 583,
        };
        const pId = providerMap[filters.provider];
        if (pId) {
          const region = filters.country !== 'all' ? filters.country : 'US';
          queryParts.push(`with_watch_providers=${pId}&watch_region=${region}`);
        }
      }

      const queryString = queryParts.join('&');
      const data = await tmdb.discover('movie', queryString);
      setMovies((data.results || []).filter((m: Movie) => m.poster_path));
    } catch (err) {
      console.error('Error filtering movies:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFilteredMovies();
  }, [loadFilteredMovies]);

  const heroBackdrop = latestReleases.length > 0 ? latestReleases[0].backdrop_path : null;

  return (
    <div className="relative min-h-screen bg-[#0e1217] text-[#f8fafc] overflow-x-hidden selection:bg-white selection:text-black">
      {/* ── Subtle Top Cinematic Backdrop Artwork matching Screenshot 1 ── */}
      {heroBackdrop && (
        <div className="absolute top-0 left-0 right-0 h-[380px] sm:h-[460px] overflow-hidden pointer-events-none -z-10">
          <img
            src={tmdb.getImageUrl(heroBackdrop, 'original')}
            alt=""
            className="w-full h-full object-cover opacity-20 filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0e1217]/50 via-[#0e1217]/85 to-[#0e1217]" />
        </div>
      )}

      {/* Floating Island Navbar */}
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Top Header matching Screenshot 1 ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Go back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>

            <h1 className="font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              Movies
            </h1>
          </div>

          {/* ── Filter Dropdown Pills matching Screenshot 1 ── */}
          <MediaFilterBar
            mediaType="movie"
            filters={filters}
            onChange={setFilters}
          />
        </div>

        {/* ── Latest Releases Horizontal 16:9 Landscape Row ── */}
        <LandscapeHeroRow
          title="Latest Releases"
          items={latestReleases}
          type="movie"
          badgeType="latest_release"
        />

        {/* ── Main Movies Grid matching Screenshot 1 ── */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="py-20 text-center text-white/50">
              <p className="text-base font-semibold">No movies found matching these filters.</p>
              <button
                onClick={() => setFilters({ genre: 'all', year: 'all', sort: 'popular', provider: 'all', country: 'all' })}
                className="mt-3 px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in duration-300">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} type="movie" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Emerald Scroll-to-Top Button matching Screenshot 1 ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-emerald-800/85 hover:bg-emerald-700 text-white border border-white/20 shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-md"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MoviesPage;