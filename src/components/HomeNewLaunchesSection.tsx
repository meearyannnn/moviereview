// src/components/HomeNewLaunchesSection.tsx — Unique Cinema Radar Spotlight Drops (Past 14 Days & Coming 60 Days)
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Play,
  Film,
  Tv,
  Clapperboard,
  Flame,
  X,
  Info,
  Calendar,
  Share2,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  Bookmark,
  BookmarkCheck,
  Globe,
  LayoutGrid,
  Layers,
  Clock,
} from 'lucide-react';
import { newLaunchesService, type NewLaunchItem, type LaunchClass } from '@/services/newLaunches';
import { soundEffects } from '@/lib/soundEffects';
import { useWatchlist } from '@/hooks/useWatchlist';

type FilterTab = 'all' | 'upcoming' | 'trailers' | 'bollywood' | 'hollywood' | 'tv';

export const HomeNewLaunchesSection = () => {
  const navigate = useNavigate();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const [launches, setLaunches] = useState<NewLaunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<'shelf' | 'grid'>('shelf');
  const [activeTrailerKey, setActiveTrailerKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<NewLaunchItem | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Purge any stale legacy caches
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        [
          'mg_spotlight_launches_v3',
          'mg_spotlight_launches_v4',
          'mg_spotlight_launches_curated_v5',
          'mg_spotlight_launches_v6_latest',
          'mg_spotlight_launches_v7_latest_only',
          'mg_spotlight_launches_realtime_v1',
          'mg_new_launches_feed_v1',
          'mg_spotlight_launches_window_2w_1m_v1',
        ].forEach((k) => {
          sessionStorage.removeItem(k);
        });
      } catch {
        // Storage cleanup catch
      }
    }

    async function fetchLaunches() {
      setLoading(true);
      try {
        const data = await newLaunchesService.getLaunches();
        if (!cancelled) {
          setLaunches(data);
        }
      } catch (err) {
        console.error('Failed to load new launches:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLaunches();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      updateScrollButtons();
      return () => el.removeEventListener('scroll', updateScrollButtons);
    }
  }, [launches, activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    soundEffects.playHoverTick();
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getLaunchConfig = (type: LaunchClass | string) => {
    switch (type) {
      case 'Upcoming Movie':
        return {
          label: 'Upcoming Movie',
          badge: 'Upcoming Movie',
          style: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-amber-500/10',
          dot: 'bg-amber-400',
        };
      case 'Upcoming Show':
        return {
          label: 'Upcoming Show',
          badge: 'Upcoming Show',
          style: 'bg-blue-500/15 text-blue-300 border-blue-500/40 shadow-blue-500/10',
          dot: 'bg-blue-400',
        };
      case 'New Trailer':
      case 'Trailer':
        return {
          label: 'New Trailer',
          badge: 'New Trailer',
          style: 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-rose-500/10',
          dot: 'bg-rose-400',
        };
      case 'New Teaser':
      case 'Teaser':
        return {
          label: 'New Teaser',
          badge: 'New Teaser',
          style: 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-orange-500/10',
          dot: 'bg-orange-400',
        };
      case 'BTS / First Look':
      case 'BTS':
        return {
          label: 'BTS / First Look',
          badge: 'BTS / First Look',
          style: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10',
          dot: 'bg-cyan-400',
        };
      case 'Poster Launched':
        return {
          label: 'Poster Launched',
          badge: 'Poster Launched',
          style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10',
          dot: 'bg-emerald-400',
        };
      case 'New Show':
        return {
          label: 'New Show',
          badge: 'New Show',
          style: 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sky-500/10',
          dot: 'bg-sky-400',
        };
      case 'New Movie':
      default:
        return {
          label: 'New Movie',
          badge: 'New Movie',
          style: 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-purple-500/10',
          dot: 'bg-purple-400',
        };
    }
  };

  // Filtered items based on active tab
  const filteredLaunches = useMemo(() => {
    switch (activeTab) {
      case 'upcoming':
        return launches.filter((it) => it.isUpcoming || it.launchClass.startsWith('Upcoming'));
      case 'trailers':
        return launches.filter(
          (it) => it.launchClass === 'New Trailer' || it.launchClass === 'New Teaser' || it.launchClass === 'BTS / First Look' || Boolean(it.trailerKey)
        );
      case 'bollywood':
        return launches.filter((it) => it.industry === 'bollywood');
      case 'hollywood':
        return launches.filter((it) => it.industry === 'hollywood');
      case 'tv':
        return launches.filter((it) => it.mediaType === 'tv');
      default:
        return launches;
    }
  }, [launches, activeTab]);

  const counts = useMemo(() => {
    return {
      all: launches.length,
      upcoming: launches.filter((it) => it.isUpcoming || it.launchClass.startsWith('Upcoming')).length,
      trailers: launches.filter(
        (it) => it.launchClass === 'New Trailer' || it.launchClass === 'New Teaser' || it.launchClass === 'BTS / First Look' || Boolean(it.trailerKey)
      ).length,
      bollywood: launches.filter((it) => it.industry === 'bollywood').length,
      hollywood: launches.filter((it) => it.industry === 'hollywood').length,
      tv: launches.filter((it) => it.mediaType === 'tv').length,
    };
  }, [launches]);

  const handleCardClick = (item: NewLaunchItem) => {
    soundEffects.playHoverTick();
    setSelectedItem(item);
  };

  const handlePlayTrailer = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    soundEffects.playHoverTick();
    setActiveTrailerKey(key);
  };

  const handleShare = (item: NewLaunchItem) => {
    soundEffects.playHoverTick();
    const url = window.location.href.split('#')[0] + `#new-launches`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${item.title} (${item.launchClass}) on MovieGuy: ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWatchlistToggle = (e: React.MouseEvent, item: NewLaunchItem) => {
    e.stopPropagation();
    soundEffects.playHoverTick();
    const numId = typeof item.id === 'number' ? item.id : Number(item.tmdbId || 0);
    if (!numId) return;

    if (isInWatchlist(numId)) {
      removeFromWatchlist(numId);
    } else {
      addToWatchlist({
        id: numId,
        title: item.title,
        poster_path: item.poster,
        backdrop_path: item.backdrop,
        release_date: item.releaseDate,
        vote_average: item.rating,
        media_type: item.mediaType,
      });
    }
  };

  return (
    <section className="scroll-mt-20 my-10 relative" id="new-launches">
      {/* ── Unique Premiere Radar Ambient Header ── */}
      <div className="relative rounded-3xl p-5 sm:p-7 border border-white/[0.08] bg-gradient-to-br from-[#1b0f16]/90 via-[#120a10]/80 to-[#0a0508]/90 backdrop-blur-xl shadow-2xl mb-7 overflow-hidden">
        {/* Ambient background glow accents */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#f5c542]/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            {/* Live Radar Pulsing Badge */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#f5c542]/15 text-[#f5c542] border border-[#c9a24b]/40 shadow-sm shadow-[#f5c542]/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5c542] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5c542]" />
                </span>
                LIVE RADAR • PAST 14D &amp; COMING 60D
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold text-white/70 bg-white/[0.04] border border-white/[0.08]">
                <Globe className="w-3.5 h-3.5 text-[#f5c542]" />
                Bollywood &amp; Hollywood
              </span>

              {launches.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {launches.length} Live Drops Tracked
                </span>
              )}
            </div>

            {/* Title & Description */}
            <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
              <span>Spotlight </span>
              <span className="bg-gradient-to-r from-[#f5c542] via-amber-200 to-[#c9a24b] bg-clip-text text-transparent">
                Premieres &amp; Launches
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5 max-w-2xl leading-relaxed">
              Realtime dynamic tracker for movies &amp; shows released in the past 2 weeks or upcoming in the next 2 months. Fresh trailers, teasers, poster launches &amp; BTS exclusives.
            </p>
          </div>

          {/* Right Controls: View Mode & Scroll Arrows */}
          <div className="flex items-center gap-2 self-start lg:self-end shrink-0">
            {/* Shelf / Grid View Toggle */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setViewMode('shelf');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  viewMode === 'shelf'
                    ? 'bg-[#f5c542] text-[#1c120c] font-bold shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Shelf View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shelf</span>
              </button>
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setViewMode('grid');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#f5c542] text-[#1c120c] font-bold shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            {/* Scroll Navigation Arrows (Shelf View only) */}
            {viewMode === 'shelf' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleScroll('left')}
                  disabled={!canScrollLeft}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none hover:border-[#f5c542]/40"
                  aria-label="Previous launches"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  disabled={!canScrollRight}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none hover:border-[#f5c542]/40"
                  aria-label="Next launches"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'all' as FilterTab, label: 'All Releases', count: counts.all },
            { id: 'upcoming' as FilterTab, label: 'Upcoming (60 Days)', count: counts.upcoming, accent: 'text-amber-400' },
            { id: 'trailers' as FilterTab, label: 'Trailers & Teasers', count: counts.trailers, accent: 'text-rose-400' },
            { id: 'bollywood' as FilterTab, label: '🇮🇳 Bollywood', count: counts.bollywood },
            { id: 'hollywood' as FilterTab, label: '🌐 Hollywood', count: counts.hollywood },
            { id: 'tv' as FilterTab, label: 'TV Series', count: counts.tv },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playHoverTick();
                  setActiveTab(tab.id);
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-[#f5c542] text-[#1c120c] font-bold shadow-md shadow-[#f5c542]/20'
                    : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-[#1c120c]/20 text-[#1c120c]' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content View (Shelf or Grid) ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] w-full rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.05]" />
              <div className="h-4 w-3/4 rounded bg-white/[0.04] animate-pulse mt-1" />
              <div className="h-3 w-1/2 rounded bg-white/[0.03] animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredLaunches.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.06] bg-[#140a0e] p-12 text-center text-white/40">
          <Clapperboard className="w-10 h-10 mx-auto mb-3 text-[#c9a24b]/40" />
          <p className="text-base font-semibold text-white/80">No drops found in this category</p>
          <p className="text-xs text-white/40 mt-1">Try switching tabs above to explore more upcoming premieres.</p>
        </div>
      ) : viewMode === 'shelf' ? (
        /* Shelf Carousel View */
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 -mx-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        >
          {filteredLaunches.map((item) => (
            <div
              key={`${item.mediaType}-${item.id}`}
              className="shrink-0 w-[170px] sm:w-[210px] md:w-[230px] snap-start"
            >
              <LaunchCard
                item={item}
                getLaunchConfig={getLaunchConfig}
                onCardClick={handleCardClick}
                onPlayTrailer={handlePlayTrailer}
                onWatchlistToggle={handleWatchlistToggle}
                isSaved={isInWatchlist(Number(item.tmdbId || item.id))}
              />
            </div>
          ))}
        </div>
      ) : (
        /* 5-Column Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredLaunches.map((item) => (
            <div key={`${item.mediaType}-${item.id}`}>
              <LaunchCard
                item={item}
                getLaunchConfig={getLaunchConfig}
                onCardClick={handleCardClick}
                onPlayTrailer={handlePlayTrailer}
                onWatchlistToggle={handleWatchlistToggle}
                isSaved={isInWatchlist(Number(item.tmdbId || item.id))}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Movie Poster & Rich Details Modal ── */}
      {selectedItem && (() => {
        const modalCfg = getLaunchConfig(selectedItem.launchClass || selectedItem.launchType);
        const isSaved = isInWatchlist(Number(selectedItem.tmdbId || selectedItem.id));

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="spotlight-title"
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-5 backdrop-blur-xl animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#180d14] via-[#10070c] to-[#0a0407] shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col md:flex-row max-h-[92vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-3.5 top-3.5 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white transition-colors hover:bg-[#f5c542] hover:text-[#1c120c] focus:outline-none focus:ring-2 focus:ring-[#f5c542]"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Left: Movie Poster Column */}
              <div className="relative md:w-5/12 bg-black shrink-0 flex items-center justify-center overflow-hidden min-h-[320px] md:min-h-[460px]">
                <img
                  src={selectedItem.poster}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10070c] via-transparent to-transparent md:hidden" />

                {/* Play video overlay on mobile */}
                {selectedItem.trailerKey && (
                  <button
                    onClick={(e) => handlePlayTrailer(e, selectedItem.trailerKey!)}
                    className="absolute bottom-4 left-4 right-4 md:hidden flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f5c542] text-[#1c120c] font-black font-display text-sm shadow-xl"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch {modalCfg.label}</span>
                  </button>
                )}
              </div>

              {/* Right: Movie Details Content */}
              <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                <div>
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/[0.08] text-white/90 border border-white/10">
                      {selectedItem.industry === 'bollywood' ? '🇮🇳 Bollywood' : '🌐 Hollywood'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm ${modalCfg.style}`}
                    >
                      {modalCfg.label}
                    </span>
                    {selectedItem.isHot && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f5c542]/20 text-[#f5c542] border border-[#f5c542]/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" />
                        Trending Drop
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 id="spotlight-title" className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                    {selectedItem.title}
                  </h3>

                  {/* Release Date & Format */}
                  <div className="flex items-center gap-2 text-xs font-mono mt-2.5 flex-wrap">
                    <span className="capitalize px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/70">
                      {selectedItem.mediaType === 'tv' ? 'TV Series' : 'Feature Film'}
                    </span>
                    {selectedItem.releaseDate && (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#f5c542]/15 text-[#f5c542] border border-[#f5c542]/30 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[#f5c542]" />
                        <span>
                          {selectedItem.isUpcoming ? 'Releasing: ' : 'Released: '}
                          {selectedItem.releaseDate}
                          {selectedItem.releaseTimingLabel ? ` (${selectedItem.releaseTimingLabel})` : ''}
                        </span>
                      </span>
                    )}
                    {selectedItem.rating !== undefined && selectedItem.rating > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                        <Star className="w-3 h-3 fill-current text-amber-400" />
                        <span>{selectedItem.rating}</span>
                      </span>
                    )}
                  </div>

                  {/* Genre Pills */}
                  {selectedItem.genres && selectedItem.genres.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {selectedItem.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-white/60"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Story Synopsis */}
                  <div className="mt-4">
                    <h4 className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-1.5 font-semibold">
                      Story Synopsis &amp; Details
                    </h4>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans line-clamp-5">
                      {selectedItem.overview || 'Details regarding this premiere are currently updating live on MovieGuy.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedItem.trailerKey && (
                      <button
                        onClick={(e) => handlePlayTrailer(e, selectedItem.trailerKey!)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5c542] text-[#1c120c] font-display font-black text-xs hover:bg-white transition-all shadow-lg shadow-[#f5c542]/20 transform hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch {modalCfg.label}</span>
                      </button>
                    )}
                    {selectedItem.tmdbId && (
                      <button
                        onClick={() => {
                          setSelectedItem(null);
                          navigate(`/${selectedItem.mediaType}/${selectedItem.tmdbId}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-mono text-xs border border-white/10 transition-all"
                      >
                        <span>Explore Page</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Watchlist Bookmark */}
                    <button
                      onClick={(e) => handleWatchlistToggle(e, selectedItem)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs border transition-all ${
                        isSaved
                          ? 'bg-[#f5c542]/20 border-[#f5c542]/40 text-[#f5c542]'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-white/70 hover:text-white'
                      }`}
                      title={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-[#f5c542]" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </>
                      )}
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(selectedItem)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white font-mono text-xs border border-white/[0.06] transition-all"
                      title="Share this launch"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── YouTube Video Player Modal ── */}
      {activeTrailerKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Launch Video"
          onClick={() => setActiveTrailerKey(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
          >
            <button
              onClick={() => setActiveTrailerKey(null)}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-[#f5c542]"
              aria-label="Close video"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeTrailerKey}?autoplay=1&rel=0`}
              title="Launch Video"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
};

// ── Unique Cinema Card Component ──
interface LaunchCardProps {
  item: NewLaunchItem;
  getLaunchConfig: (type: LaunchClass | string) => {
    label: string;
    badge: string;
    style: string;
    dot: string;
  };
  onCardClick: (item: NewLaunchItem) => void;
  onPlayTrailer: (e: React.MouseEvent, key: string) => void;
  onWatchlistToggle: (e: React.MouseEvent, item: NewLaunchItem) => void;
  isSaved: boolean;
}

const LaunchCard = ({
  item,
  getLaunchConfig,
  onCardClick,
  onPlayTrailer,
  onWatchlistToggle,
  isSaved,
}: LaunchCardProps) => {
  const cfg = getLaunchConfig(item.launchClass || item.launchType);

  return (
    <div
      onClick={() => onCardClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onCardClick(item)}
      className="group cursor-pointer flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] rounded-2xl transition-all duration-300 transform motion-safe:group-hover:-translate-y-1.5"
    >
      {/* ── Card Poster Frame (Unique Obsidian Cinema Glass) ── */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#1c1017] to-[#0c060a] border border-white/[0.08] group-hover:border-[#f5c542]/50 shadow-xl group-hover:shadow-[0_14px_35px_rgba(245,197,66,0.16)] transition-all duration-300">
        <img
          src={item.poster}
          alt={item.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder.svg';
          }}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none"
        />

        {/* Top Floating Glass Badge Ribbon */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10 gap-1.5">
          {/* Industry tag */}
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white/90 border border-white/10 shrink-0">
            {item.industry === 'bollywood' ? '🇮🇳 Bolly' : '🌐 Holly'}
          </span>

          {/* Classification Badge */}
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border ${cfg.style} truncate`}
          >
            {cfg.label}
          </span>
        </div>

        {/* Hover Center Beacon / Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/85 via-black/35 to-black/30 backdrop-blur-[2px]">
          {item.trailerKey ? (
            <button
              onClick={(e) => onPlayTrailer(e, item.trailerKey!)}
              className="w-12 h-12 rounded-full bg-[#f5c542] text-[#1c120c] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform hover:bg-white"
              title="Play Trailer"
            >
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 text-white backdrop-blur-md flex items-center justify-center shadow-xl">
              <Info className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Bottom Floating Glass Strip (Release Timing & Rating) */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10 gap-1.5">
          {/* Countdown pill */}
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-black/75 backdrop-blur-md text-[#f5c542] border border-[#f5c542]/30 flex items-center gap-1 shadow-sm">
            <Clock className="w-2.5 h-2.5" />
            <span>{item.releaseTimingLabel || item.releaseDate}</span>
          </span>

          {/* Rating pill if available */}
          {item.rating !== undefined && item.rating > 0 && (
            <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
              <span>{item.rating}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Title & Meta Info Below Poster ── */}
      <div className="mt-2.5 px-0.5">
        <h3
          className="font-display font-semibold text-sm sm:text-base text-white group-hover:text-[#f5c542] transition-colors truncate leading-snug"
          title={item.title}
        >
          {item.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-white/50 mt-0.5 font-sans gap-1.5">
          <span className="truncate font-medium text-white/70">
            {item.genres && item.genres.length > 0 ? item.genres.join(' • ') : item.mediaType === 'tv' ? 'TV Series' : 'Feature Film'}
          </span>

          {item.releaseDate && (
            <span className="text-[11px] font-mono text-white/40 truncate shrink-0">
              {item.releaseDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
