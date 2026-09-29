import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search as SearchIcon, X, Film, Tv, ArrowUpDown, LayoutGrid, Compass, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { soundEffects } from '@/lib/soundEffects';

type MediaFilter = 'all' | 'movie' | 'tv';
type SortBy = 'best' | 'rating' | 'latest';

/**
 * Quick picks. Title chips run a normal title search.
 * Theme chips run a TMDB discover query (they are ideas, not titles).
 */
const QUICK_PICKS: { label: string; discover?: string }[] = [
  { label: 'Inception' },
  { label: 'Interstellar' },
  { label: 'Oppenheimer' },
  {
    label: 'Mind-bending sci-fi',
    discover: 'sort_by=vote_count.desc&vote_count.gte=500&with_genres=878,9648',
  },
  {
    label: '90s action',
    discover:
      'sort_by=vote_count.desc&vote_count.gte=300&with_genres=28&primary_release_date.gte=1990-01-01&primary_release_date.lte=1999-12-31',
  },
  {
    label: 'Movies under 90 min',
    discover: 'sort_by=vote_count.desc&vote_count.gte=300&with_runtime.lte=90',
  },
  {
    label: 'Dark crime mysteries',
    discover: 'sort_by=vote_count.desc&vote_count.gte=300&with_genres=80,9648',
  },
];

const MEDIA_FILTERS = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv', label: 'Series', icon: Tv },
] as const;

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090f]';

// Lowercase, strip accents and punctuation so "Spider-Man: No Way Home" matches "spider man no way home"
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getType = (item: Movie): 'movie' | 'tv' =>
  item.media_type === 'tv' || item.media_type === 'movie'
    ? item.media_type
    : item.first_air_date
      ? 'tv'
      : 'movie';

// How well an item's title matches the query. Higher is better.
const getTitleRelevance = (item: Movie, rawQuery: string): number => {
  const q = normalize(rawQuery);
  if (!q) return 0;

  const titles = [item.title, item.name, (item as any).original_title, (item as any).original_name]
    .filter(Boolean)
    .map(t => normalize(String(t)));
  if (titles.length === 0) return 0;

  if (titles.some(t => t === q)) return 1000;
  if (titles.some(t => t.startsWith(q + ' ') || t.startsWith(q))) return 800;
  if (titles.some(t => ` ${t} `.includes(` ${q} `))) return 600;
  if (titles.some(t => t.includes(q))) return 400;

  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    if (titles.some(t => tokens.every(tok => t.includes(tok)))) return 300;
    if (titles.some(t => tokens.some(tok => tok.length > 2 && t.includes(tok)))) return 150;
  }

  return 0;
};

export const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('best');

  const searchIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Press "/" anywhere to jump to the search box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const reset = useCallback(() => {
    searchIdRef.current++;
    setResults([]);
    setIsSearching(false);
    setHasError(false);
  }, []);

  const runSearch = useCallback(
    async (text: string, discover?: string) => {
      const trimmed = text.trim();
      if (!trimmed) {
        reset();
        return;
      }

      const id = ++searchIdRef.current;
      setIsSearching(true);
      setHasError(false);

      try {
        let list: Movie[] = [];

        if (discover) {
          const data = await tmdb.discover('movie', discover);
          list = data.results || [];
        } else {
          const data = await tmdb.search(trimmed);
          list = data.results || [];
        }

        // Keep only movies and series with a poster; drop people and duplicates
        const seen = new Set<string>();
        const clean = list.filter((m: Movie) => {
          if ((m as any).media_type === 'person' || !m.poster_path) return false;
          const key = `${getType(m)}_${m.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (id === searchIdRef.current) setResults(clean);
      } catch (err) {
        console.error('Search error:', err);
        if (id === searchIdRef.current) {
          setResults([]);
          setHasError(true);
        }
      } finally {
        if (id === searchIdRef.current) setIsSearching(false);
      }
    },
    [reset],
  );

  const handleInputChange = (val: string) => {
    setQuery(val);
    setActiveChip(null);
    clearTimeout(debounceRef.current);

    if (!val.trim()) {
      reset();
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => runSearch(val), 350);
  };

  const handleChipClick = (pick: (typeof QUICK_PICKS)[number]) => {
    soundEffects.playHoverTick();
    clearTimeout(debounceRef.current);
    setQuery(pick.label);
    setActiveChip(pick.discover ? pick.label : null);
    runSearch(pick.label, pick.discover);
  };

  const clearAll = () => {
    soundEffects.playHoverTick();
    handleInputChange('');
    inputRef.current?.focus();
  };

  const counts = useMemo(() => {
    let movie = 0;
    let tv = 0;
    for (const r of results) getType(r) === 'movie' ? movie++ : tv++;
    return { all: results.length, movie, tv };
  }, [results]);

  const processed = useMemo(() => {
    const filtered = results.filter(item => mediaFilter === 'all' || getType(item) === mediaFilter);

    const scored = filtered.map(item => ({
      item,
      relevance: activeChip ? 0 : getTitleRelevance(item, query),
    }));

    const pop = (m: Movie) => (m as any).popularity || 0;
    const dateOf = (m: Movie) => new Date(m.release_date || m.first_air_date || 0).getTime() || 0;

    if (sortBy === 'best') {
      scored.sort((a, b) => b.relevance - a.relevance || pop(b.item) - pop(a.item));
    } else if (sortBy === 'rating') {
      // Titles with almost no votes go last so a single 10/10 vote does not win
      const solid = (m: Movie) => ((m as any).vote_count || 0) >= 20;
      scored.sort((a, b) => {
        if (solid(a.item) !== solid(b.item)) return solid(a.item) ? -1 : 1;
        return (b.item.vote_average || 0) - (a.item.vote_average || 0);
      });
    } else {
      scored.sort((a, b) => dateOf(b.item) - dateOf(a.item));
    }

    return scored.map(s => s.item);
  }, [results, mediaFilter, sortBy, query, activeChip]);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const chipClass = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${ring} ${active
      ? 'border-red-600 bg-red-600 text-white'
      : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25 hover:text-white'
    }`;

  const segClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${ring} ${active ? 'bg-white text-black' : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
    }`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07090f] text-slate-50 selection:bg-red-600 selection:text-white">
      <Navbar />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.16),transparent_65%)]"
      />

      <main className="relative mx-auto max-w-7xl px-4 pb-36 md:pb-28 safe-bottom-content pt-24 sm:px-6 sm:pt-32 lg:px-8">
        {/* Header + search box */}
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            What do you want to watch?
          </h1>
          <p className="mt-3 text-sm text-white/50 sm:text-base">
            Type any movie or series name, or start from an idea below.
          </p>

          <div className="relative mt-7">
            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') clearAll();
                if (e.key === 'Enter') {
                  clearTimeout(debounceRef.current);
                  runSearch(query);
                }
              }}
              placeholder="Search movies and series"
              aria-label="Search movies and series"
              className="h-14 w-full rounded-full border border-white/10 bg-white/[0.05] pl-14 pr-14 text-base font-medium text-white placeholder-white/35 shadow-2xl shadow-black/40 transition-colors hover:bg-white/[0.07] focus:border-red-500/60 focus:bg-[#0e121c] focus:outline-none focus:ring-4 focus:ring-red-600/10"
            />
            {query ? (
              <button
                type="button"
                onClick={clearAll}
                aria-label="Clear search"
                className={`absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white ${ring}`}
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd
                aria-hidden
                className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-semibold text-white/35 sm:block"
              >
                /
              </kbd>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {QUICK_PICKS.map(pick => {
              const active = query.toLowerCase() === pick.label.toLowerCase();
              return (
                <button
                  key={pick.label}
                  type="button"
                  onClick={() => handleChipClick(pick)}
                  aria-pressed={active}
                  className={chipClass(active)}
                >
                  {pick.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Toolbar */}
        {!isSearching && results.length > 0 && (
          <div className="sticky top-16 z-20 -mx-4 mb-8 flex flex-col gap-3 border-y border-white/[0.06] bg-[#07090f]/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:mx-0 lg:rounded-2xl lg:border lg:px-4">
            <p className="truncate text-sm text-white/50" aria-live="polite">
              <span className="font-semibold text-white">{processed.length}</span>{' '}
              {processed.length === 1 ? 'result' : 'results'}
              {hasQuery && (
                <>
                  {' '}for &ldquo;{trimmedQuery}&rdquo;
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div role="group" aria-label="Type" className="flex gap-1 rounded-full bg-white/[0.04] p-1">
                {MEDIA_FILTERS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={mediaFilter === id}
                    onClick={() => setMediaFilter(id)}
                    className={segClass(mediaFilter === id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    <span className={mediaFilter === id ? 'text-black/50' : 'text-white/35'}>{counts[id]}</span>
                  </button>
                ))}
              </div>

              <label className="relative flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-2 text-xs text-white/60 focus-within:ring-2 focus-within:ring-red-500/70">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="sr-only">Sort by</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortBy)}
                  className="cursor-pointer bg-transparent pr-1 font-semibold text-white/90 outline-none"
                >
                  <option value="best" className="bg-[#111520]">Best match</option>
                  <option value="rating" className="bg-[#111520]">Highest rated</option>
                  <option value="latest" className="bg-[#111520]">Newest</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isSearching && (
          <div
            aria-busy="true"
            aria-label="Searching"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/[0.05]" />
            ))}
          </div>
        )}

        {/* Results */}
        {!isSearching && processed.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {processed.map(item => (
              <MovieCard key={`${getType(item)}_${item.id}`} movie={item} />
            ))}
          </div>
        )}

        {/* Error */}
        {!isSearching && hasError && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-dashed border-red-500/30 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <h3 className="font-display text-lg font-bold">Search failed</h3>
            <p className="px-6 text-sm text-white/50">Check your connection and try again.</p>
            <button
              type="button"
              onClick={() => runSearch(query)}
              className={`mt-1 rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-500 ${ring}`}
            >
              Try again
            </button>
          </div>
        )}

        {/* No results */}
        {!isSearching && !hasError && hasQuery && processed.length === 0 && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 py-20 text-center">
            <SearchIcon className="h-8 w-8 text-white/25" />
            <h3 className="font-display text-lg font-bold">Nothing found for &ldquo;{trimmedQuery}&rdquo;</h3>
            <p className="px-6 text-sm text-white/50">
              Check the spelling or try fewer words, for example just the main title.
            </p>
            {mediaFilter !== 'all' && results.length > 0 && (
              <button
                type="button"
                onClick={() => setMediaFilter('all')}
                className={`mt-1 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/15 ${ring}`}
              >
                Show movies and series
              </button>
            )}
          </div>
        )}

        {/* Idle */}
        {!isSearching && !hasQuery && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center text-white/40">
            <Compass className="h-8 w-8 text-white/25" />
            <p className="text-sm">Start typing a title, or pick an idea above.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;