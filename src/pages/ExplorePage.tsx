// pages/ExplorePage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import {
  SlidersHorizontal, X, ChevronDown, Check, Clapperboard,
} from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

interface GenreOption { id: number; name: string; color: string; }

const GENRE_LIST: GenreOption[] = [
  { id: 28,    name: 'Action',      color: '#ef4444' },
  { id: 35,    name: 'Comedy',      color: '#eab308' },
  { id: 18,    name: 'Drama',       color: '#ec4899' },
  { id: 27,    name: 'Horror',      color: '#6b7280' },
  { id: 99,    name: 'Documentary', color: '#22c55e' },
  { id: 9648,  name: 'Mystery',     color: '#a855f7' },
  { id: 10749, name: 'Romance',     color: '#f43f5e' },
  { id: 878,   name: 'Sci-Fi',      color: '#38bdf8' },
  { id: 10770, name: 'Sports',      color: '#f97316' },
  { id: 53,    name: 'Thriller',    color: '#64748b' },
];

const SORT_OPTIONS = [
  { value: 'release_date.desc',  label: 'Newest Releases' },
  { value: 'popularity.desc',    label: 'Most Popular' },
  { value: 'vote_average.desc',  label: 'Highest Rated' },
];

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialFilter = searchParams.get('filter') || '';
  const initialAnime  = searchParams.get('anime')  || '';
  const initialSort   = searchParams.get('sort')   || 'release_date.desc';
  const initialType   = (searchParams.get('type') as 'all' | 'movie' | 'tv') || 'all';
  const initialGenre  = searchParams.get('genre') ? Number(searchParams.get('genre')) : null;

  const [activeHeroFilter, setActiveHeroFilter] = useState<'none'|'select'|'family_friendly'|'award_winner'>(
    initialFilter === 'family_friendly' ? 'family_friendly'
    : initialFilter === 'award_winner'  ? 'award_winner'
    : initialFilter === 'select'        ? 'select'
    : 'none'
  );
  const [animeFilter, setAnimeFilter] = useState<'all'|'hide'|'only'>(
    initialAnime === 'only' ? 'only' : initialAnime === 'hide' ? 'hide' : 'all'
  );
  const [contentType, setContentType] = useState<'all'|'movie'|'tv'>(initialType);
  const [sortBy, setSortBy] = useState<string>(
    initialSort === 'monthly' ? 'popularity.desc'
    : initialSort === 'top_100' ? 'vote_average.desc'
    : initialSort || 'release_date.desc'
  );
  const [selectedGenre, setSelectedGenre] = useState<number|null>(initialGenre);
  const [items, setItems]   = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage]     = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync from URL
  useEffect(() => {
    const f = searchParams.get('filter') || '';
    setActiveHeroFilter(f === 'family_friendly' ? 'family_friendly' : f === 'award_winner' ? 'award_winner' : f === 'select' ? 'select' : 'none');
    const a = searchParams.get('anime') || '';
    setAnimeFilter(a === 'only' ? 'only' : a === 'hide' ? 'hide' : 'all');
    const t = (searchParams.get('type') as 'all'|'movie'|'tv') || 'all';
    setContentType(t);
    const s = searchParams.get('sort') || '';
    setSortBy(s === 'monthly' ? 'popularity.desc' : s === 'top_100' ? 'vote_average.desc' : s || 'release_date.desc');
    const g = searchParams.get('genre') ? Number(searchParams.get('genre')) : null;
    setSelectedGenre(g);
  }, [searchParams]);

  const currentLanguageName  = searchParams.get('language')     || '';
  const currentLanguageCode  = searchParams.get('lang')         || '';
  const currentCategory      = searchParams.get('category')     || '';
  const currentCountryName   = searchParams.get('country')      || '';
  const currentCountryCode   = searchParams.get('country_code') || '';

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (activeHeroFilter !== 'none')                  c++;
    if (animeFilter !== 'all')                        c++;
    if (contentType !== 'all')                        c++;
    if (selectedGenre !== null)                       c++;
    if (sortBy !== 'release_date.desc')               c++;
    if (currentLanguageName || currentLanguageCode)   c++;
    if (currentCategory)                              c++;
    if (currentCountryName || currentCountryCode)     c++;
    return c;
  }, [activeHeroFilter, animeFilter, contentType, selectedGenre, sortBy, currentLanguageName, currentLanguageCode, currentCategory, currentCountryName, currentCountryCode]);

  const updateFilterParam = (key: string, val: string | null) => {
    const p = new URLSearchParams(searchParams);
    if (!val || val === 'all' || val === 'none') p.delete(key); else p.set(key, val);
    setSearchParams(p);
  };

  const handleClearFilters = useCallback(() => {
    soundEffects.playHoverTick();
    setActiveHeroFilter('none'); setAnimeFilter('all'); setContentType('all');
    setSelectedGenre(null); setSortBy('release_date.desc');
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    async function loadData() {
      try {
        const q: string[] = [];
        if (sortBy === 'vote_average.desc')      q.push('sort_by=vote_average.desc&vote_count.gte=300');
        else if (sortBy === 'popularity.desc')   q.push('sort_by=popularity.desc');
        else                                     q.push('sort_by=primary_release_date.desc&primary_release_date.lte=2026-12-31');
        if (activeHeroFilter === 'family_friendly') q.push('with_genres=10751');
        else if (activeHeroFilter === 'award_winner') q.push('vote_average.gte=7.6&vote_count.gte=200');
        else if (activeHeroFilter === 'select')   q.push('vote_average.gte=7.4&vote_count.gte=150');
        if (animeFilter === 'only')               q.push('with_genres=16&with_original_language=ja');
        else if (animeFilter === 'hide')          q.push('without_genres=16');
        if (selectedGenre)                        q.push(`with_genres=${selectedGenre}`);
        if (currentLanguageCode)                  q.push(`with_original_language=${currentLanguageCode}`);
        if (currentCountryCode)                   q.push(`with_origin_country=${currentCountryCode}`);
        if (currentCategory) {
          const m = GENRE_LIST.find(g => g.name.toLowerCase() === currentCategory.toLowerCase());
          if (m) q.push(`with_genres=${m.id}`);
        }
        q.push(`page=${page}`);
        const qs = q.join('&');
        let res: any;
        if (contentType === 'tv') {
          res = await tmdb.discover('tv', qs.replace('primary_release_date', 'first_air_date'));
        } else if (contentType === 'movie') {
          res = await tmdb.discover('movie', qs);
        } else {
          const [mRes, tvRes] = await Promise.all([tmdb.discover('movie', qs), tmdb.discover('tv', qs.replace('primary_release_date', 'first_air_date'))]);
          const mList = (mRes.results||[]).map((x: any) => ({ ...x, media_type: 'movie' as const }));
          const tList = (tvRes.results||[]).map((x: any) => ({ ...x, media_type: 'tv' as const }));
          const combined: Movie[] = [];
          for (let i = 0; i < Math.max(mList.length, tList.length); i++) {
            if (mList[i]) combined.push(mList[i]);
            if (tList[i]) combined.push(tList[i]);
          }
          res = { results: combined };
        }
        if (isMounted) {
          const valid = (res.results||[]).filter((x: Movie) => x.poster_path);
          setItems(valid); setHasMore(valid.length >= 10); setLoading(false);
        }
      } catch { if (isMounted) setLoading(false); }
    }
    loadData();
    return () => { isMounted = false; };
  }, [activeHeroFilter, animeFilter, contentType, sortBy, selectedGenre, page, currentLanguageCode, currentCountryCode, currentCategory]);

  // ────────────────── Sidebar filter button helpers ──────────────────
  const ActiveBtn = 'bg-white/10 text-white border-white/30 font-black';
  const InactiveBtn = 'bg-transparent text-white/45 border-white/[0.07] hover:text-white hover:border-white/20';

  return (
    <div className="min-h-screen bg-[#060810] text-white selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-36 md:pb-28 safe-bottom-content">

        {/* ── Page header ── */}
        <div className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500/70 font-display mb-1.5">
            Discover
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none">
            Explore <span className="text-red-500">Cinema</span>
          </h1>
        </div>

        {/* ── Mobile filter toggle ── */}
        <div className="md:hidden w-full flex items-center justify-between mb-4">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-black font-display uppercase tracking-wide text-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
          {activeFiltersCount > 0 && (
            <button onClick={handleClearFilters} className="text-xs text-white/40 hover:text-red-400 flex items-center gap-1 transition-colors">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* ── Sidebar ── */}
          <aside className={`w-full md:w-56 lg:w-64 flex-shrink-0 space-y-7 ${mobileFilterOpen ? 'block' : 'hidden md:block'}`}>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-white/40" />
                <span className="font-display font-black text-sm text-white tracking-wide">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] font-black w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button onClick={handleClearFilters} className="text-[11px] text-white/35 hover:text-red-400 flex items-center gap-1 transition-colors font-medium">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30 font-display">Sort By</p>
              <div className="space-y-1.5">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { soundEffects.playHoverTick(); setSortBy(opt.value); updateFilterParam('sort', opt.value === 'release_date.desc' ? null : opt.value); }}
                    className={[
                      'w-full text-left px-3 py-2 rounded-lg border text-xs font-bold font-sans transition-all duration-200',
                      sortBy === opt.value ? 'bg-red-600/15 text-red-400 border-red-500/40' : InactiveBtn,
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30 font-display">Type</p>
              <div className="flex gap-1.5">
                {(['movie', 'tv'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { soundEffects.playHoverTick(); const next = contentType === type ? 'all' : type; setContentType(next); updateFilterParam('type', next === 'all' ? null : next); }}
                    className={[
                      'flex-1 py-2 rounded-lg border text-xs font-black font-display uppercase tracking-wide transition-all duration-200',
                      contentType === type ? ActiveBtn : InactiveBtn,
                    ].join(' ')}
                  >
                    {type === 'movie' ? 'Movies' : 'Shows'}
                  </button>
                ))}
              </div>
            </div>

            {/* Anime */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30 font-display">Anime</p>
              <div className="flex gap-1.5">
                {(['hide', 'only'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => { soundEffects.playHoverTick(); const next = animeFilter === a ? 'all' : a; setAnimeFilter(next); updateFilterParam('anime', next === 'all' ? null : next); }}
                    className={[
                      'flex-1 py-2 rounded-lg border text-xs font-black font-display uppercase tracking-wide transition-all duration-200',
                      animeFilter === a ? ActiveBtn : InactiveBtn,
                    ].join(' ')}
                  >
                    {a === 'hide' ? 'Hide' : 'Only'}
                  </button>
                ))}
              </div>
            </div>

            {/* Genres */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30 font-display">Genre</p>
              <div className="space-y-1">
                {GENRE_LIST.map((g) => {
                  const on = selectedGenre === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => { soundEffects.playHoverTick(); const next = on ? null : g.id; setSelectedGenre(next); updateFilterParam('genre', next ? String(next) : null); }}
                      className={[
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-bold font-sans text-left transition-all duration-200',
                        on ? 'bg-white/[0.06] text-white border-white/20' : InactiveBtn,
                      ].join(' ')}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                      <span>{g.name}</span>
                      {on && <Check className="w-3 h-3 ml-auto text-white/60 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ── Main content ── */}
          <section className="flex-1 w-full min-w-0 space-y-6">

            {/* Active tag badges */}
            {(currentLanguageName || currentCountryName || activeHeroFilter !== 'none') && (
              <div className="flex flex-wrap gap-2">
                {currentLanguageName && (
                  <button
                    onClick={() => { const p = new URLSearchParams(searchParams); p.delete('language'); p.delete('lang'); setSearchParams(p); }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/[0.04] text-xs text-white/70 hover:text-white transition-colors"
                  >
                    {currentLanguageName} <X className="w-3 h-3 ml-0.5" />
                  </button>
                )}
                {currentCountryName && (
                  <button
                    onClick={() => { const p = new URLSearchParams(searchParams); p.delete('country'); p.delete('country_code'); setSearchParams(p); }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 bg-white/[0.04] text-xs text-white/70 hover:text-white transition-colors"
                  >
                    {currentCountryName} <X className="w-3 h-3 ml-0.5" />
                  </button>
                )}
                {activeHeroFilter !== 'none' && (
                  <button
                    onClick={() => { setActiveHeroFilter('none'); updateFilterParam('filter', null); }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/30 bg-red-600/10 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    {activeHeroFilter === 'select' ? 'MovieGuy Select' : activeHeroFilter === 'family_friendly' ? 'Family Friendly' : 'Award Winner'}
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                )}
              </div>
            )}

            {/* Quick badges row */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'select' as const,          label: '★ MovieGuy Select',  cls: 'border-red-500/30 text-red-400 hover:bg-red-600/10' },
                { key: 'family_friendly' as const, label: '✦ Family Friendly',  cls: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/10' },
                { key: 'award_winner' as const,    label: '◆ Award Winner',     cls: 'border-sky-500/30 text-sky-400 hover:bg-sky-600/10' },
              ].map(({ key, label, cls }) => {
                const on = activeHeroFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => { soundEffects.playHoverTick(); const next = on ? 'none' : key; setActiveHeroFilter(next); updateFilterParam('filter', next === 'none' ? null : next); }}
                    className={[
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold font-sans transition-all duration-200',
                      on ? cls.replace('hover:', '') + ' bg-opacity-15' : `bg-transparent ${cls} border-opacity-30`,
                    ].join(' ')}
                  >
                    {on && <Check className="w-3 h-3" />}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
                    <div className="h-3.5 w-3/4 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-white/[0.04] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-24 text-center rounded-2xl border border-white/[0.06] space-y-3">
                <Clapperboard className="w-10 h-10 text-white/15 mx-auto" />
                <h3 className="font-display font-black text-lg text-white/50">No Titles Found</h3>
                <p className="text-xs text-white/30 max-w-xs mx-auto">Try adjusting or clearing your filters.</p>
                <button onClick={handleClearFilters} className="px-5 py-2 rounded-full bg-red-600 text-white text-xs font-black font-display uppercase tracking-wide transition-all hover:bg-red-500">
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                  {items.map((item) => {
                    const mType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                    return (
                      <MovieCard key={`${mType}-${item.id}`} movie={item} type={mType as 'movie' | 'tv'} />
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-8">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-red-600/80 hover:border-red-500/50 text-white/60 hover:text-white text-xs font-black font-display uppercase tracking-widest transition-all duration-300"
                    >
                      <ChevronDown className="w-3.5 h-3.5" /> Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;


