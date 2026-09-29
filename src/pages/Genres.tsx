import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie, type Genre } from '@/services/tmdb';

// Curated color accents per genre name
const GENRE_COLORS: Record<string, string> = {
  Action:          '#ef4444',
  Adventure:       '#f97316',
  Animation:       '#a855f7',
  Comedy:          '#eab308',
  Crime:           '#6b7280',
  Documentary:     '#22c55e',
  Drama:           '#ec4899',
  Family:          '#f59e0b',
  Fantasy:         '#8b5cf6',
  History:         '#d97706',
  Horror:          '#dc2626',
  Music:           '#06b6d4',
  Mystery:         '#7c3aed',
  Romance:         '#f43f5e',
  'Science Fiction': '#38bdf8',
  Thriller:        '#64748b',
  War:             '#78716c',
  Western:         '#b45309',
};

const GenresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(
    searchParams.get('genre') ? Number(searchParams.get('genre')) : null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    tmdb.getGenres('movie').then((data) => {
      setGenres(data.genres || []);
      if (!selectedGenreId && data.genres?.length) {
        const id = data.genres[0].id;
        setSelectedGenreId(id);
        setSearchParams({ genre: id.toString() });
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedGenreId) return;
    setIsLoading(true);
    tmdb.getByGenre(selectedGenreId, 'movie')
      .then((data) => setMovies(data.results || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedGenreId]);

  const handleGenreClick = (id: number) => {
    setSelectedGenreId(id);
    setSearchParams({ genre: id.toString() });
  };

  const selectedGenre = genres.find(g => g.id === selectedGenreId);
  const accentColor = selectedGenre ? (GENRE_COLORS[selectedGenre.name] || '#ef4444') : '#ef4444';

  return (
    <div className="min-h-screen bg-[#060810] text-white overflow-x-hidden selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* Ambient glow from selected genre */}
      <div
        className="pointer-events-none fixed top-0 left-0 w-full h-[40vh] opacity-[0.06] blur-[120px] transition-all duration-700"
        style={{ background: `radial-gradient(ellipse at 30% 0%, ${accentColor}, transparent 70%)` }}
      />

      <div className="pt-24 sm:pt-28 pb-28 md:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500/70 font-display mb-2">
            Categories & Themes
          </p>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-none">
            Browse by <span className="text-red-500">Genre</span>
          </h1>
        </div>

        {/* ── Genre pill grid ── */}
        <div className="flex flex-wrap gap-2 mb-12">
          {genres.map((genre) => {
            const active = selectedGenreId === genre.id;
            const color = GENRE_COLORS[genre.name] || '#ef4444';
            return (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className={[
                  'px-4 py-2 rounded-full text-xs font-black font-display uppercase tracking-wide transition-all duration-200 border',
                  active
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-transparent text-white/50 border-white/[0.08] hover:text-white hover:border-white/20',
                ].join(' ')}
                style={active
                  ? { backgroundColor: `${color}20`, borderColor: `${color}70`, color, boxShadow: `0 0 16px ${color}30` }
                  : undefined
                }
              >
                {genre.name}
              </button>
            );
          })}
        </div>

        {/* ── Section title + accent bar ── */}
        {selectedGenre && (
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }} />
              <h2 className="font-display font-black text-xl text-white tracking-tight">
                {selectedGenre.name} <span className="text-white/40 font-medium">Movies</span>
              </h2>
            </div>
            <span className="text-[11px] text-white/30 font-sans hidden sm:block">
              Top rated & popular titles
            </span>
          </div>
        )}

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
                <div className="h-3.5 w-3/4 rounded bg-white/[0.04] animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} type="movie" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenresPage;

