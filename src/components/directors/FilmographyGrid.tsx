// src/components/directors/FilmographyGrid.tsx — Director Filmography Grid (simplified)
import React, { useState, useMemo } from 'react';
import { MovieCard } from '@/components/MovieCard';
import { type DirectorMovie } from '@/hooks/useDirector';

interface FilmographyGridProps {
  movies: DirectorMovie[];
  decadesCount: Record<string, number>;
}

type FilterOption = 'all' | 'top_rated' | 'latest' | 'oldest' | string;
type SortOption = 'release_desc' | 'release_asc' | 'rating_desc' | 'popularity_desc';

const GRID = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5';

export const FilmographyGrid: React.FC<FilmographyGridProps> = ({ movies, decadesCount }) => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('release_desc');
  const [groupByDecade, setGroupByDecade] = useState(false);

  // Decades, newest first
  const decades = useMemo(
    () => Object.keys(decadesCount).sort((a, b) => parseInt(b, 10) - parseInt(a, 10)),
    [decadesCount]
  );

  const filteredMovies = useMemo(() => {
    let result = [...movies];

    if (activeFilter === 'top_rated') {
      result = result.filter((m) => (m.vote_average ?? 0) >= 7.5);
    } else if (activeFilter === 'latest') {
      result = result.slice(0, 10);
    } else if (activeFilter === 'oldest') {
      result = [...result]
        .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
        .slice(0, 10);
    } else if (activeFilter.endsWith('s')) {
      const start = parseInt(activeFilter, 10);
      result = result.filter((m) => {
        if (!m.release_date) return false;
        const y = parseInt(m.release_date.slice(0, 4), 10);
        return y >= start && y < start + 10;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'release_desc':
          return (b.release_date || '').localeCompare(a.release_date || '');
        case 'release_asc':
          return (a.release_date || '').localeCompare(b.release_date || '');
        case 'rating_desc':
          return (b.vote_average ?? 0) - (a.vote_average ?? 0);
        case 'popularity_desc':
          return (b.popularity ?? 0) - (a.popularity ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [movies, activeFilter, sortBy]);

  const groupedMovies = useMemo(() => {
    if (!groupByDecade || activeFilter.endsWith('s')) return null;

    const groups: Record<string, DirectorMovie[]> = {};
    for (const m of filteredMovies) {
      const year = m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : NaN;
      const decade = Number.isNaN(year) ? 'Undated' : `${Math.floor(year / 10) * 10}s`;
      (groups[decade] ||= []).push(m);
    }
    return groups;
  }, [filteredMovies, groupByDecade, activeFilter]);

  const chips: { key: FilterOption; label: string }[] = [
    { key: 'all', label: `All ${movies.length}` },
    { key: 'top_rated', label: 'Top rated' },
    { key: 'latest', label: 'Latest' },
    { key: 'oldest', label: 'Oldest' },
    ...decades.map((d) => ({ key: d, label: d })),
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <h2 className="font-display font-extrabold tracking-tight text-2xl sm:text-3xl text-white">
          Filmography
          <span className="ml-3 text-base font-medium text-white/40">
            {filteredMovies.length}
          </span>
        </h2>

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setGroupByDecade((v) => !v)}
            aria-pressed={groupByDecade}
            className={`hidden sm:block transition-colors ${groupByDecade ? 'text-[#f5c542]' : 'text-white/50 hover:text-white'
              }`}
          >
            Group by decade
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort filmography"
            className="rounded-lg bg-white/[0.06] border border-white/10 px-3 py-1.5 text-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] cursor-pointer"
          >
            <option value="release_desc" className="bg-[#140a0d]">Newest</option>
            <option value="release_asc" className="bg-[#140a0d]">Oldest</option>
            <option value="rating_desc" className="bg-[#140a0d]">Highest rated</option>
            <option value="popularity_desc" className="bg-[#140a0d]">Most popular</option>
          </select>
        </div>
      </div>

      {/* Filter chips */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {chips.map(({ key, label }) => {
          const active = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              aria-pressed={active}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${active
                  ? 'bg-[#f5c542] text-[#1c120c] font-semibold'
                  : 'bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/10'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredMovies.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-white/70">No films match this filter.</p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="mt-3 text-sm font-semibold text-[#f5c542] hover:text-white transition-colors"
          >
            Show all films
          </button>
        </div>
      )}

      {/* Grid */}
      {groupedMovies ? (
        <div className="space-y-10">
          {Object.entries(groupedMovies).map(([decade, list]) => (
            <div key={decade} className="space-y-4">
              <div className="flex items-baseline gap-3">
                <h3 className="font-display font-extrabold text-2xl text-[#f5c542]">{decade}</h3>
                <span className="text-sm text-white/40">
                  {list.length} {list.length === 1 ? 'film' : 'films'}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-[#c9a24b]/25 to-transparent" />
              </div>
              <div className={GRID}>
                {list.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} type="movie" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={GRID}>
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} type="movie" />
          ))}
        </div>
      )}
    </section>
  );
};