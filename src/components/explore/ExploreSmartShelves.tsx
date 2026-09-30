// src/components/explore/ExploreSmartShelves.tsx — Smart Shelves for Explore
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Film,
  Tv,
  Trophy,
  Sparkles,
  Play,
  Star,
  Crown,
  Moon,
  Clapperboard,
} from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { WEB_CHANNELS, type WebChannel } from '@/services/webChannels';
import { PosterCard } from './PosterCard';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

// ── Generic Horizontal Shelf Row ─────────────────────────────────────────────
interface ShelfRowProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  items: Movie[];
  loading?: boolean;
  typeOverride?: 'movie' | 'tv';
  renderItem?: (item: Movie, index: number) => React.ReactNode;
}

const ShelfRow: React.FC<ShelfRowProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  items,
  loading = false,
  typeOverride,
  renderItem,
}) => {
  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    scrollToDirection,
    handlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  return (
    <section className="space-y-3.5 mb-10 min-w-0">
      {/* Shelf Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.18)] shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                {title}
              </h2>
              {badgeText && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/30 shrink-0">
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs font-mono text-[#f3e9d2]/50 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Arrow Controls (Desktop only) */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollToDirection('left')}
            disabled={!canScrollLeft}
            aria-label={`Scroll ${title} left`}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-[#c9a24b]/20 border border-[#c9a24b]/25 hover:border-[#c9a24b]/60 text-white/70 hover:text-[#f5c542] flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToDirection('right')}
            disabled={!canScrollRight}
            aria-label={`Scroll ${title} right`}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-[#c9a24b]/20 border border-[#c9a24b]/25 hover:border-[#c9a24b]/60 text-white/70 hover:text-[#f5c542] flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track - edge-to-edge touch swipe on phone */}
      {loading ? (
        <div className="flex gap-3 sm:gap-4 overflow-hidden py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[136px] sm:w-44 md:w-48 shrink-0 aspect-[2/3] rounded-2xl bg-[#140a0d] border border-[#c9a24b]/15 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          {...handlers}
          className="flex gap-3 sm:gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2 -mx-4 px-4 sm:mx-0 sm:px-0.5 cursor-grab active:cursor-grabbing select-none touch-pan-x"
        >
          {items.map((item, index) =>
            renderItem ? (
              renderItem(item, index)
            ) : (
              <div key={`${item.media_type || 'm'}_${item.id}_${index}`} className="w-[136px] sm:w-44 md:w-48 shrink-0">
                <PosterCard item={item} typeOverride={typeOverride} />
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
};

// ── Main ExploreSmartShelves Component ─────────────────────────────────────────
export const ExploreSmartShelves: React.FC = () => {
  const [top10Items, setTop10Items] = useState<Movie[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [trendingShows, setTrendingShows] = useState<Movie[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<Movie[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Movie[]>([]);
  const [timelessVault, setTimelessVault] = useState<Movie[]>([]);
  const [lateNightThrills, setLateNightThrills] = useState<Movie[]>([]);
  const [bingeChampions, setBingeChampions] = useState<Movie[]>([]);

  // Streaming platform state
  const [activeChannel, setActiveChannel] = useState<WebChannel>(WEB_CHANNELS[0]);
  const [streamingMode, setStreamingMode] = useState<'popular' | 'top_rated'>('popular');
  const [streamingItems, setStreamingItems] = useState<Movie[]>([]);
  const [loadingStreaming, setLoadingStreaming] = useState(false);

  const {
    containerRef: streamingScrollRef,
    canScrollLeft: canScrollStreamLeft,
    canScrollRight: canScrollStreamRight,
    scrollToDirection: scrollStreaming,
    handlers: streamingHandlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  const [loadingGeneral, setLoadingGeneral] = useState(true);

  // Fetch standard shelves on mount
  useEffect(() => {
    let live = true;
    Promise.all([
      tmdb.getTrending('all', 'day'),
      tmdb.getTrending('movie', 'week'),
      tmdb.getTrending('tv', 'day'),
      tmdb.getTopRated('tv'),
      tmdb.discover(
        'movie',
        'vote_average.gte=8.0&vote_count.gte=300&vote_count.lte=4000&sort_by=vote_average.desc'
      ),
      tmdb.discover(
        'movie',
        'primary_release_date.lte=2002-01-01&vote_average.gte=8.2&vote_count.gte=1000&sort_by=vote_average.desc'
      ),
      tmdb.discover('movie', 'with_genres=27|53&sort_by=popularity.desc'),
      tmdb.discover('tv', 'vote_average.gte=8.2&vote_count.gte=500&sort_by=popularity.desc'),
    ])
      .then(
        ([
          allTrendingRes,
          moviesRes,
          tvTrendingRes,
          topTvRes,
          gemsRes,
          vaultRes,
          thrillsRes,
          bingeRes,
        ]) => {
          if (!live) return;
          setTop10Items((allTrendingRes.results || []).slice(0, 10));
          setTopMovies(
            (moviesRes.results || []).slice(0, 18).map((m: any) => ({ ...m, media_type: 'movie' }))
          );
          setTrendingShows(
            (tvTrendingRes.results || []).slice(0, 18).map((t: any) => ({ ...t, media_type: 'tv' }))
          );
          setTopRatedShows(
            (topTvRes.results || []).slice(0, 18).map((t: any) => ({ ...t, media_type: 'tv' }))
          );
          setHiddenGems(
            (gemsRes.results || []).slice(0, 18).map((m: any) => ({ ...m, media_type: 'movie' }))
          );
          setTimelessVault(
            (vaultRes.results || []).slice(0, 18).map((m: any) => ({ ...m, media_type: 'movie' }))
          );
          setLateNightThrills(
            (thrillsRes.results || []).slice(0, 18).map((m: any) => ({ ...m, media_type: 'movie' }))
          );
          setBingeChampions(
            (bingeRes.results || []).slice(0, 18).map((t: any) => ({ ...t, media_type: 'tv' }))
          );
          setLoadingGeneral(false);
        }
      )
      .catch((err) => {
        console.warn('ExploreSmartShelves load error:', err);
        if (live) setLoadingGeneral(false);
      });

    return () => {
      live = false;
    };
  }, []);

  // Fetch streaming platform items when channel or mode changes
  useEffect(() => {
    let live = true;
    setLoadingStreaming(true);

    const sortParam =
      streamingMode === 'popular'
        ? 'sort_by=popularity.desc'
        : 'sort_by=vote_average.desc&vote_count.gte=100';

    // Query both TV and Movie on this streaming channel
    Promise.all([
      tmdb.discover('tv', `with_networks=${activeChannel.networkId}&${sortParam}&page=1`),
      tmdb.discover('movie', `with_watch_providers=${activeChannel.providerId}&watch_region=US&${sortParam}&page=1`),
    ])
      .then(([tvRes, movieRes]) => {
        if (!live) return;
        const tvList = (tvRes.results || []).map((t: any) => ({ ...t, media_type: 'tv' as const }));
        const movieList = (movieRes.results || []).map((m: any) => ({ ...m, media_type: 'movie' as const }));

        // Interleave
        const combined: Movie[] = [];
        const maxLen = Math.max(tvList.length, movieList.length);
        for (let i = 0; i < maxLen; i++) {
          if (tvList[i]) combined.push(tvList[i]);
          if (movieList[i]) combined.push(movieList[i]);
        }
        setStreamingItems(combined.filter((i) => i.poster_path).slice(0, 20));
      })
      .catch((err) => {
        console.warn('Streaming shelf fetch error:', err);
      })
      .finally(() => {
        if (live) setLoadingStreaming(false);
      });

    return () => {
      live = false;
    };
  }, [activeChannel, streamingMode]);

  return (
    <div className="space-y-4 mb-12">
      {/* ── 1. Top 10 in Box Office Today (Netflix style Big Stroked Numerals 1 to 10) ── */}
      <ShelfRow
        title="Top 10 Today"
        subtitle="The highest grossing & most watched titles right now"
        icon={Flame}
        badgeText="RANKED #1-#10"
        items={top10Items}
        loading={loadingGeneral}
        renderItem={(item, index) => (
          <div
            key={`top10_${item.media_type || 'm'}_${item.id}`}
            className="flex-none flex items-end relative group"
          >
            {/* Massive Cinema Gold / Yellow Stroked Rank Number */}
            <span
              aria-hidden="true"
              className="select-none font-display font-black text-6xl sm:text-8xl leading-none text-transparent -mr-5 sm:-mr-8 z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] translate-y-2 sm:translate-y-3 pointer-events-none transition-transform duration-300 group-hover:scale-105"
              style={{
                WebkitTextStroke: '2px #f5c542',
                color: '#0a0608',
              }}
            >
              {index + 1}
            </span>
            <div className="w-[136px] sm:w-44 md:w-48 shrink-0">
              <PosterCard item={item} />
            </div>
          </div>
        )}
      />

      {/* ── 2. On Streaming Platforms Shelf (Netflix, Prime, Apple TV+, etc.) ── */}
      <section className="space-y-4 mb-10 min-w-0 p-4 sm:p-5 rounded-3xl bg-[#140a0d]/90 border border-[#c9a24b]/20 shadow-xl -mx-2 sm:mx-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#c9a24b]/15">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-xl font-extrabold text-white truncate">
                Streaming on {activeChannel.name}
              </h2>
              <p className="text-[11px] sm:text-xs font-mono text-[#f3e9d2]/50 truncate">
                {activeChannel.tagline}
              </p>
            </div>
          </div>

          {/* Controls: Mode toggle + Arrow buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="flex rounded-full border border-[#c9a24b]/20 bg-black/40 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setStreamingMode('popular')}
                className={`rounded-full px-3 py-1 text-xs font-bold font-mono transition-colors ${
                  streamingMode === 'popular'
                    ? 'bg-[#f5c542] text-[#1c120c] shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Popular
              </button>
              <button
                type="button"
                onClick={() => setStreamingMode('top_rated')}
                className={`rounded-full px-3 py-1 text-xs font-bold font-mono transition-colors ${
                  streamingMode === 'top_rated'
                    ? 'bg-[#f5c542] text-[#1c120c] shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Top Rated
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollStreaming('left')}
                disabled={!canScrollStreamLeft}
                aria-label="Scroll streaming shelf left"
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-[#c9a24b]/20 border border-[#c9a24b]/25 hover:border-[#c9a24b]/60 text-white/70 hover:text-[#f5c542] flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollStreaming('right')}
                disabled={!canScrollStreamRight}
                aria-label="Scroll streaming shelf right"
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-[#c9a24b]/20 border border-[#c9a24b]/25 hover:border-[#c9a24b]/60 text-white/70 hover:text-[#f5c542] flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Network Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 touch-pan-x">
          {WEB_CHANNELS.map((ch) => {
            const active = activeChannel.id === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch)}
                className={`flex-none flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border whitespace-nowrap ${
                  active
                    ? 'bg-[#c9a24b]/20 border-[#f5c542] text-white shadow-[0_0_14px_rgba(245,197,66,0.3)]'
                    : 'bg-black/30 border-white/[0.08] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
                }`}
              >
                <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0 bg-black/70 p-0.5">
                  <img src={ch.logoUrl} alt="" className="w-full h-full object-contain" />
                </div>
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>

        {/* Streaming Shelf Carousel */}
        {loadingStreaming ? (
          <div className="flex gap-3 sm:gap-4 overflow-hidden py-1 -mx-2 px-2 sm:mx-0 sm:px-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[136px] sm:w-44 md:w-48 shrink-0 aspect-[2/3] rounded-2xl bg-[#0c0609] border border-[#c9a24b]/15 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div
            ref={streamingScrollRef}
            {...streamingHandlers}
            className="flex gap-3 sm:gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 -mx-2 px-2 sm:mx-0 sm:px-0 cursor-grab active:cursor-grabbing select-none touch-pan-x"
          >
            {streamingItems.map((item, index) => (
              <div key={`streaming_${item.id}_${index}`} className="w-[136px] sm:w-44 md:w-48 shrink-0">
                <PosterCard item={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Top Movies (Most popular this week) ── */}
      <ShelfRow
        title="Top Movies"
        subtitle="Most popular this week"
        icon={Film}
        typeOverride="movie"
        items={topMovies}
        loading={loadingGeneral}
      />

      {/* ── 4. Trending Shows (Binge-worthy series now) ── */}
      <ShelfRow
        title="Trending Shows"
        subtitle="Binge-worthy series now"
        icon={Tv}
        typeOverride="tv"
        items={trendingShows}
        loading={loadingGeneral}
      />

      {/* ── 5. Top Rated TV (Critically acclaimed hits) ── */}
      <ShelfRow
        title="Top Rated TV"
        subtitle="Critically acclaimed hits"
        icon={Trophy}
        typeOverride="tv"
        items={topRatedShows}
        loading={loadingGeneral}
      />

      {/* ── 6. Hidden Gems (Under-the-radar masterpieces) ── */}
      <ShelfRow
        title="Hidden Gems"
        subtitle="Under-the-radar cinematic masterworks"
        icon={Sparkles}
        badgeText="HIGH ACCLAIM"
        typeOverride="movie"
        items={hiddenGems}
        loading={loadingGeneral}
      />

      {/* ── 7. Timeless Vault (Classic masterpieces) ── */}
      <ShelfRow
        title="Timeless Vault"
        subtitle="Legendary classics that made film history"
        icon={Crown}
        badgeText="ALL-TIME"
        typeOverride="movie"
        items={timelessVault}
        loading={loadingGeneral}
      />

      {/* ── 8. Late-Night Thrills (High-pulse suspense & horror) ── */}
      <ShelfRow
        title="Late-Night Thrills"
        subtitle="Heart-pounding horror & suspense"
        icon={Moon}
        badgeText="ADRENALINE"
        typeOverride="movie"
        items={lateNightThrills}
        loading={loadingGeneral}
      />

      {/* ── 9. Binge Champions (Addictive series you can't stop) ── */}
      <ShelfRow
        title="Binge Champions"
        subtitle="Series you watch in one sitting"
        icon={Clapperboard}
        badgeText="ADDICTIVE"
        typeOverride="tv"
        items={bingeChampions}
        loading={loadingGeneral}
      />
    </div>
  );
};
