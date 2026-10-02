// src/components/HomeNewLaunchesSection.tsx — Spotlight drops (past 14 days & coming 60 days)
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  X,
  Calendar,
  Share2,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  Rows3,
  Flame,
} from 'lucide-react';
import { newLaunchesService, type NewLaunchItem } from '@/services/newLaunches';
import { soundEffects } from '@/lib/soundEffects';
import { useWatchlist } from '@/hooks/useWatchlist';

type FilterTab = 'all' | 'upcoming' | 'trailers' | 'bollywood' | 'hollywood' | 'tv';

const LEGACY_CACHE_KEYS = [
  'mg_spotlight_launches_v3',
  'mg_spotlight_launches_v4',
  'mg_spotlight_launches_curated_v5',
  'mg_spotlight_launches_v6_latest',
  'mg_spotlight_launches_v7_latest_only',
  'mg_spotlight_launches_realtime_v1',
  'mg_new_launches_feed_v1',
  'mg_spotlight_launches_window_2w_1m_v1',
];

/* One accent per meaning, nothing else: gold = upcoming, rose = video, neutral = already out */
const getLaunchConfig = (type?: string) => {
  switch (type) {
    case 'Upcoming Movie':
    case 'Upcoming Show':
      return { label: type, dot: 'bg-[#f5c542]' };
    case 'New Trailer':
    case 'Trailer':
      return { label: 'Trailer', dot: 'bg-rose-400' };
    case 'New Teaser':
    case 'Teaser':
      return { label: 'Teaser', dot: 'bg-rose-400' };
    case 'BTS / First Look':
    case 'BTS':
      return { label: 'First look', dot: 'bg-rose-400' };
    case 'Poster Launched':
      return { label: 'New poster', dot: 'bg-white/60' };
    case 'New Show':
      return { label: 'New show', dot: 'bg-white/60' };
    default:
      return { label: 'New movie', dot: 'bg-white/60' };
  }
};

/* Name the video by what it is ("trailer"), never by the title's status ("upcoming movie") */
const VIDEO_NAME = { trailer: 'trailer', teaser: 'teaser', bts: 'first look' } as const;
const videoName = (it: NewLaunchItem) => VIDEO_NAME[it.videoKind ?? 'trailer'];

const isUpcoming = (it: NewLaunchItem) => Boolean(it.isUpcoming || it.launchClass?.startsWith('Upcoming'));
const hasVideo = (it: NewLaunchItem) =>
  ['New Trailer', 'New Teaser', 'BTS / First Look'].includes(it.launchClass) || Boolean(it.trailerKey);

const TABS: { id: FilterTab; label: string; test: (it: NewLaunchItem) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'upcoming', label: 'Upcoming', test: isUpcoming },
  { id: 'trailers', label: 'Trailers', test: hasVideo },
  { id: 'bollywood', label: 'Bollywood', test: (it) => it.industry === 'bollywood' },
  { id: 'hollywood', label: 'Hollywood', test: (it) => it.industry === 'hollywood' },
  { id: 'tv', label: 'TV', test: (it) => it.mediaType === 'tv' },
];

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const tick = () => soundEffects.playHoverTick();

  useEffect(() => {
    let cancelled = false;
    try {
      LEGACY_CACHE_KEYS.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
    (async () => {
      setLoading(true);
      try {
        const data = await newLaunchesService.getLaunches();
        if (!cancelled) setLaunches(data);
      } catch (err) {
        console.error('Failed to load new launches:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close modals with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activeTrailerKey) setActiveTrailerKey(null);
      else setSelectedItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTrailerKey]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [launches, activeTab, viewMode, loading]);

  const handleScroll = (dir: 'left' | 'right') => {
    tick();
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: (dir === 'left' ? -1 : 1) * el.clientWidth * 0.75, behavior: 'smooth' });
  };

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
    return launches.filter(tab.test);
  }, [launches, activeTab]);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, launches.filter(t.test).length])) as Record<FilterTab, number>,
    [launches]
  );

  const savedId = (it: NewLaunchItem) => Number(it.tmdbId || it.id);

  const handleWatchlistToggle = (e: React.MouseEvent, item: NewLaunchItem) => {
    e.stopPropagation();
    tick();
    const numId = savedId(item);
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

  const handlePlay = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    tick();
    setActiveTrailerKey(key);
  };

  const handleShare = async (item: NewLaunchItem) => {
    tick();
    const url = window.location.href.split('#')[0] + '#new-launches';
    try {
      await navigator.clipboard?.writeText(`${item.title} on MovieGuy: ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const openItem = (item: NewLaunchItem) => {
    tick();
    setSelectedItem(item);
  };

  const renderCard = (item: NewLaunchItem) => (
    <LaunchCard
      key={`${item.mediaType}-${item.id}`}
      item={item}
      isSaved={isInWatchlist(savedId(item))}
      onOpen={openItem}
      onPlay={handlePlay}
      onToggleSave={handleWatchlistToggle}
    />
  );

  return (
    <section className="scroll-mt-20" id="new-launches">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            Premieres &amp; launches
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Released in the last 2 weeks or arriving in the next 2 months.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-white/[0.05] p-1">
            {([
              { id: 'shelf', Icon: Rows3, label: 'Shelf view' },
              { id: 'grid', Icon: LayoutGrid, label: 'Grid view' },
            ] as const).map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  tick();
                  setViewMode(id);
                }}
                aria-label={label}
                aria-pressed={viewMode === id}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${viewMode === id ? 'bg-white text-black' : 'text-white/50 hover:text-white'
                  }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {viewMode === 'shelf' && (
            <div className="hidden sm:flex gap-1.5">
              {(['left', 'right'] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => handleScroll(dir)}
                  disabled={dir === 'left' ? !canScrollLeft : !canScrollRight}
                  aria-label={dir === 'left' ? 'Previous launches' : 'Next launches'}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25"
                >
                  {dir === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Tabs: plain text, underline marks the active one ── */}
      <nav
        aria-label="Filter launches"
        className="mt-6 flex gap-6 overflow-x-auto border-b border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                tick();
                setActiveTab(tab.id);
              }}
              aria-current={active}
              className={`-mb-px shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors ${active
                  ? 'border-[#f5c542] text-white'
                  : 'border-transparent text-white/45 hover:text-white/80'
                }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs tabular-nums text-white/35">{counts[tab.id]}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/[0.05]" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-semibold text-white/80">Nothing here yet</p>
            <p className="mt-1 text-sm text-white/40">Try another tab to see more premieres.</p>
          </div>
        ) : viewMode === 'shelf' ? (
          <div
            ref={scrollRef}
            className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 sm:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {filtered.map((item) => (
              <div key={`${item.mediaType}-${item.id}`} className="w-[160px] shrink-0 snap-start sm:w-[200px] md:w-[220px]">
                {renderCard(item)}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5">
            {filtered.map(renderCard)}
          </div>
        )}
      </div>

      {/* ── Details modal ── */}
      {selectedItem && (() => {
        const cfg = getLaunchConfig(selectedItem.launchClass || selectedItem.launchType);
        const saved = isInWatchlist(savedId(selectedItem));
        const upcoming = isUpcoming(selectedItem);

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="spotlight-title"
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-in fade-in duration-200 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-y-auto rounded-3xl border border-white/10 bg-[#0f0a0d] shadow-2xl md:flex-row"
            >
              <button
                onClick={() => setSelectedItem(null)}
                aria-label="Close details"
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Poster */}
              <div className="relative min-h-[320px] shrink-0 bg-black md:min-h-[480px] md:w-5/12">
                <img
                  src={selectedItem.poster}
                  alt={selectedItem.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a0d] via-transparent to-transparent md:hidden" />
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                <div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    <span className="font-medium text-white/80">{cfg.label}</span>
                    <span className="text-white/25">/</span>
                    <span>{selectedItem.industry === 'bollywood' ? 'Bollywood' : 'Hollywood'}</span>
                    <span className="text-white/25">/</span>
                    <span>{selectedItem.mediaType === 'tv' ? 'TV series' : 'Film'}</span>
                    {selectedItem.isHot && <Flame className="ml-1 h-3.5 w-3.5 fill-[#f5c542] text-[#f5c542]" aria-label="Trending" />}
                  </div>

                  <h3 id="spotlight-title" className="mt-3 font-display text-3xl font-black leading-tight tracking-tight text-white">
                    {selectedItem.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
                    {selectedItem.releaseDate && (
                      <span className="flex items-center gap-1.5 text-[#f5c542]">
                        <Calendar className="h-4 w-4" />
                        {upcoming ? 'Releasing' : 'Released'} {selectedItem.releaseDate}
                        {selectedItem.releaseTimingLabel ? ` (${selectedItem.releaseTimingLabel})` : ''}
                      </span>
                    )}
                    {selectedItem.rating !== undefined && selectedItem.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {selectedItem.rating}
                      </span>
                    )}
                  </div>

                  {selectedItem.genres && selectedItem.genres.length > 0 && (
                    <p className="mt-3 text-sm text-white/45">{selectedItem.genres.join(', ')}</p>
                  )}

                  <p className="mt-5 line-clamp-6 max-w-prose text-sm leading-relaxed text-white/70">
                    {selectedItem.overview || 'The synopsis for this title is still being added.'}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedItem.trailerKey && (
                      <button
                        onClick={(e) => handlePlay(e, selectedItem.trailerKey!)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-bold text-[#1c120c] transition-colors hover:bg-white"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Watch {videoName(selectedItem)}
                      </button>
                    )}
                    {selectedItem.tmdbId && (
                      <button
                        onClick={() => {
                          setSelectedItem(null);
                          navigate(`/${selectedItem.mediaType}/${selectedItem.tmdbId}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.14]"
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleWatchlistToggle(e, selectedItem)}
                      aria-pressed={saved}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors ${saved ? 'text-[#f5c542]' : 'text-white/60 hover:text-white'
                        }`}
                    >
                      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      {saved ? 'Saved' : 'Save'}
                    </button>
                    <button
                      onClick={() => handleShare(selectedItem)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                      {copied ? 'Link copied' : 'Share'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Video modal ── */}
      {activeTrailerKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Launch video"
          onClick={() => setActiveTrailerKey(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"
          >
            <button
              onClick={() => setActiveTrailerKey(null)}
              aria-label="Close video"
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeTrailerKey}?autoplay=1&rel=0`}
              title="Launch video"
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

// ── Card ──
interface LaunchCardProps {
  item: NewLaunchItem;
  isSaved: boolean;
  onOpen: (item: NewLaunchItem) => void;
  onPlay: (e: React.MouseEvent, key: string) => void;
  onToggleSave: (e: React.MouseEvent, item: NewLaunchItem) => void;
}

const LaunchCard = ({ item, isSaved, onOpen, onPlay, onToggleSave }: LaunchCardProps) => {
  const cfg = getLaunchConfig(item.launchClass || item.launchType);
  const upcoming = isUpcoming(item);

  return (
    <div className="group relative">
      {/* Whole card is one button; the save/play controls sit beside it, not inside it */}
      <button
        onClick={() => onOpen(item)}
        className="block w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1a1116] ring-1 ring-white/[0.08] transition duration-300 group-hover:ring-[#f5c542]/60 motion-safe:group-hover:-translate-y-1">
          <img
            src={item.poster}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/placeholder.svg';
            }}
            className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Readability scrim, bottom only */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

          {/* The one badge: what kind of drop this is */}
          <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>

          {/* Release timing */}
          <span
            className={`absolute bottom-2 left-2 text-xs font-semibold ${upcoming ? 'text-[#f5c542]' : 'text-white/90'}`}
          >
            {item.releaseTimingLabel || item.releaseDate}
          </span>

          {item.rating !== undefined && item.rating > 0 && (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-xs font-semibold text-white/90">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {item.rating}
            </span>
          )}
        </div>

        <div className="mt-3 px-0.5">
          <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#f5c542] sm:text-base" title={item.title}>
            {item.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-white/45">
            {item.genres && item.genres.length > 0
              ? item.genres.slice(0, 2).join(', ')
              : item.mediaType === 'tv'
                ? 'TV series'
                : 'Film'}
          </p>
        </div>
      </button>

      {/* Hover actions (always visible on touch via focus-within / group-focus) */}
      <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
        <button
          onClick={(e) => onToggleSave(e, item)}
          aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
          aria-pressed={isSaved}
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/65 backdrop-blur-md transition-colors hover:bg-white hover:text-black ${isSaved ? 'text-[#f5c542]' : 'text-white'
            }`}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </button>
        {item.trailerKey && (
          <button
            onClick={(e) => onPlay(e, item.trailerKey!)}
            aria-label={`Play ${videoName(item)}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5c542] text-[#1c120c] transition-colors hover:bg-white"
          >
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
};