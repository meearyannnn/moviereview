// src/components/directors/FilmographyGrid.tsx — Comprehensive Director Filmography Grid
import React, { useState, useMemo } from 'react';
import { Clapperboard, Filter, ArrowUpDown, Calendar, Grid3X3, Layers } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { type DirectorMovie } from '@/hooks/useDirector';

interface FilmographyGridProps {
  movies: DirectorMovie[];
  decadesCount: Record<string, number>;
}

type FilterOption = 'all' | 'top_rated' | 'latest' | 'oldest' | string;
type SortOption = 'release_desc' | 'release_asc' | 'rating_desc' | 'popularity_desc';

export const FilmographyGrid: React.FC<FilmographyGridProps> = ({ movies, decadesCount }) => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('release_desc');
  const [groupByDecade, setGroupByDecade] = useState(false);

  // Available decades sorted newest first
  const decades = useMemo(() => {
    return Object.keys(decadesCount).sort((a, b) => {
      const yearA = parseInt(a, 10);
      const yearB = parseInt(b, 10);
      return yearB - yearA;
    });
  }, [decadesCount]);

  // Filter movies
  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (activeFilter === 'top_rated') {
      result = result.filter((m) => (m.vote_average ?? 0) >= 7.5);
    } else if (activeFilter === 'latest') {
      result = result.slice(0, 10);
    } else if (activeFilter === 'oldest') {
      result = [...result].sort((a, b) => (a.release_date || '').localeCompare(b.release_date || '')).slice(0, 10);
    } else if (activeFilter.endsWith('s')) {
      // Decade filter
      const decadeNum = parseInt(activeFilter, 10);
      result = result.filter((m) => {
        if (!m.release_date) return false;
        const y = parseInt(m.release_date.slice(0, 4), 10);
        return y >= decadeNum && y < decadeNum + 10;
      });
    }

    // Sort movies
    result.sort((a, b) => {
      if (sortBy === 'release_desc') {
        return (b.release_date || '').localeCompare(a.release_date || '');
      }
      if (sortBy === 'release_asc') {
        return (a.release_date || '').localeCompare(b.release_date || '');
      }
      if (sortBy === 'rating_desc') {
        return (b.vote_average ?? 0) - (a.vote_average ?? 0);
      }
      if (sortBy === 'popularity_desc') {
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      }
      return 0;
    });

    return result;
  }, [movies, activeFilter, sortBy]);

  // Group movies by decade if groupByDecade toggle is enabled
  const groupedMovies = useMemo(() => {
    if (!groupByDecade || activeFilter.endsWith('s')) return null;

    const groups: Record<string, DirectorMovie[]> = {};
    for (const m of filteredMovies) {
      const year = m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : null;
      const decade = year && !Number.isNaN(year) ? `${Math.floor(year / 10) * 10}s` : 'Undated';
      if (!groups[decade]) groups[decade] = [];
      groups[decade].push(m);
    }
    return groups;
  }, [filteredMovies, groupByDecade, activeFilter]);

  return (
    <section className="space-y-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center shadow-[0_0_12px_rgba(245,197,66,0.2)] shrink-0">
            <Clapperboard className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
              <span>Full Filmography</span>
              <span className="text-[11px] font-mono text-[#c9a24b] px-2 py-0.5 rounded-full bg-[#c9a24b]/15 border border-[#c9a24b]/30">
                {filteredMovies.length} {filteredMovies.length === 1 ? 'Title' : 'Titles'}
              </span>
            </h2>
            <p className="text-[11px] text-[#c9a24b]/70 font-mono mt-0.5">
              Complete archive with authentic ticket stubs
            </p>
          </div>
        </div>

        {/* Controls: Group toggle & Sort select */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setGroupByDecade(!groupByDecade)}
            aria-label="Toggle decade grouping"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
              groupByDecade
                ? 'bg-[#c9a24b]/20 border-[#f5c542]/60 text-[#f5c542]'
                : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white'
            }`}
          >
            {groupByDecade ? <Layers className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
            <span>{groupByDecade ? 'Decade Timeline' : 'Standard Grid'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-[#140a0d] border border-white/[0.1] rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#f5c542]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort filmography"
              className="bg-transparent text-xs font-mono text-white/90 focus:outline-none cursor-pointer pr-1"
            >
              <option value="release_desc" className="bg-[#140a0d] text-white">
                Release: Newest
              </option>
              <option value="release_asc" className="bg-[#140a0d] text-white">
                Release: Oldest
              </option>
              <option value="rating_desc" className="bg-[#140a0d] text-white">
                Highest Rated
              </option>
              <option value="popularity_desc" className="bg-[#140a0d] text-white">
                Most Popular
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Filter Chips Bar ── */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-mono transition-all border ${
            activeFilter === 'all'
              ? 'bg-[#f5c542] text-[#1c120c] font-bold border-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.4)]'
              : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
          }`}
        >
          All ({movies.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('top_rated')}
          className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-mono transition-all border ${
            activeFilter === 'top_rated'
              ? 'bg-[#f5c542] text-[#1c120c] font-bold border-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.4)]'
              : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
          }`}
        >
          Top Rated (★ 7.5+)
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('latest')}
          className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-mono transition-all border ${
            activeFilter === 'latest'
              ? 'bg-[#f5c542] text-[#1c120c] font-bold border-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.4)]'
              : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
          }`}
        >
          Latest
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('oldest')}
          className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-mono transition-all border ${
            activeFilter === 'oldest'
              ? 'bg-[#f5c542] text-[#1c120c] font-bold border-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.4)]'
              : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
          }`}
        >
          Oldest
        </button>

        {/* Decade Filter Chips */}
        {decades.map((dec) => (
          <button
            key={dec}
            type="button"
            onClick={() => setActiveFilter(dec)}
            className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-mono transition-all border ${
              activeFilter === dec
                ? 'bg-[#f5c542] text-[#1c120c] font-bold border-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.4)]'
                : 'bg-white/[0.04] border-white/[0.1] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
            }`}
          >
            {dec} ({decadesCount[dec]})
          </button>
        ))}
      </div>

      {/* ── Empty State ── */}
      {filteredMovies.length === 0 && (
        <div className="py-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8">
          <Clapperboard className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="font-display font-bold text-base text-white/70">
            No films found for this filter
          </p>
          <p className="text-xs font-mono text-white/40 mt-1">
            Try resetting your decade or rating filter
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="mt-4 px-4 py-1.5 rounded-full bg-[#c9a24b]/20 border border-[#c9a24b]/40 text-[#f5c542] text-xs font-mono font-bold hover:bg-[#c9a24b]/30 transition-colors"
          >
            Reset to All Films
          </button>
        </div>
      )}

      {/* ── Grouped by Decade Mode ── */}
      {groupedMovies ? (
        <div className="space-y-10">
          {Object.entries(groupedMovies).map(([decade, decadeMovies]) => (
            <div key={decade} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full bg-[#c9a24b]/15 border border-[#c9a24b]/35 text-xs font-mono font-extrabold text-[#f5c542] tracking-wider uppercase">
                  {decade}
                </span>
                <span className="text-[11px] font-mono text-white/40">
                  {decadeMovies.length} {decadeMovies.length === 1 ? 'production' : 'productions'}
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#c9a24b]/25 to-transparent" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
                {decadeMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} type="movie" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Standard Ticket Grid ── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} type="movie" />
          ))}
        </div>
      )}
    </section>
  );
};
