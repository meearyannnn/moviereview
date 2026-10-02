// src/components/HomeNewLaunchesSection.tsx — Clean, Uncluttered Spotlight Drops Shelf (Zero Filter Clutter)
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { newLaunchesService, type NewLaunchItem, type LaunchClass } from '@/services/newLaunches';
import { soundEffects } from '@/lib/soundEffects';

export const HomeNewLaunchesSection = () => {
  const navigate = useNavigate();
  const [launches, setLaunches] = useState<NewLaunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrailerKey, setActiveTrailerKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<NewLaunchItem | null>(null);
  const [copied, setCopied] = useState(false);

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

  const getLaunchConfig = (type: LaunchClass) => {
    switch (type) {
      case 'Trailer':
        return {
          label: 'New Trailer',
          style: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'Teaser':
        return {
          label: 'New Teaser',
          style: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'BTS':
        return {
          label: 'BTS / First Look',
          style: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'Poster Launched':
        return {
          label: 'Poster Launched',
          style: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'New Show':
        return {
          label: 'New Show',
          style: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      default:
        return {
          label: 'New Movie',
          style: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
    }
  };

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
      navigator.clipboard.writeText(`${item.title} — ${item.launchClass} on MovieGuy: ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="scroll-mt-20 my-10" id="new-launches">
      {/* ── Sleek, Uncluttered Section Header (No Filter Bar Crowding) ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f5c542]/15 text-[#f5c542] border border-[#c9a24b]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542] animate-pulse" />
              SPOTLIGHT DROPS
            </span>
            <span className="text-xs text-[#c9a24b] font-mono font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-[#c9a24b]" />
              Bollywood &amp; Hollywood
            </span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            <span>Spotlight </span>
            <span className="bg-gradient-to-r from-[#f5c542] via-white to-[#c9a24b] bg-clip-text text-transparent">
              Drops &amp; Announcements
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-xl">
            Realtime updates across Bollywood and Hollywood: brand-new trailers, teasers, BTS exclusives, poster launches &amp; premiere announcements.
          </p>
        </div>

        {/* Live counter indicator */}
        {launches.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{launches.length} Live Drops</span>
          </div>
        )}
      </div>

      {/* ── Uncluttered Cards Grid (5-col layout matching user reference) ── */}
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
      ) : launches.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#140a0e] p-10 text-center text-white/40">
          <Clapperboard className="w-8 h-8 mx-auto mb-2 text-[#c9a24b]/40" />
          <p className="text-sm font-semibold text-white/70">No launch updates found right now</p>
          <p className="text-xs text-white/40 mt-0.5">Please check back soon for breaking drops.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {launches.slice(0, 20).map((item) => {
            const cfg = getLaunchConfig(item.launchClass || item.launchType);

            return (
              <div
                key={`${item.mediaType}-${item.id}`}
                onClick={() => handleCardClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(item)}
                className="group cursor-pointer flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] rounded-2xl transition-all"
              >
                {/* Poster Card (Clean & Simple, Zero Badge Overlays) */}
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#140a0d] border border-white/[0.08] group-hover:border-[#f5c542]/50 shadow-xl transition-all duration-300 transform motion-safe:group-hover:-translate-y-1">
                  <img
                    src={item.poster}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
                  />

                  {/* Subtle hover overlay with play icon if video available */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[1px]">
                    {item.trailerKey ? (
                      <div className="w-12 h-12 rounded-full bg-[#f5c542] text-[#1c120c] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/20 text-white backdrop-blur-md flex items-center justify-center shadow-xl">
                        <Info className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Classification Label Under Poster (Clean & Simple like Moctale) */}
                <div className="mt-2.5 px-0.5">
                  <h3 className="font-display font-semibold text-sm sm:text-base text-white group-hover:text-[#f5c542] transition-colors truncate leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-white/50 mt-0.5 font-sans">
                    <span className="truncate font-normal">{item.launchClass || item.launchType}</span>
                    {item.releaseDate && (
                      <span className="text-[11px] font-mono text-white/40 truncate ml-1 shrink-0">
                        {item.releaseDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Movie Poster & Rich Details Modal ── */}
      {selectedItem && (() => {
        const modalCfg = getLaunchConfig(selectedItem.launchClass || selectedItem.launchType);

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="spotlight-title"
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#120a0e] shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-[#f5c542]"
                aria-label="Close details"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Left: Movie Poster Column */}
              <div className="relative md:w-5/12 bg-black shrink-0 flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[440px]">
                <img
                  src={selectedItem.poster}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120a0e] via-transparent to-transparent md:hidden" />

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
                      {selectedItem.industry === 'bollywood' ? 'Bollywood' : 'Hollywood'}
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
                  <div className="flex items-center gap-2.5 text-xs font-mono mt-2 flex-wrap">
                    <span className="capitalize px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/70">
                      {selectedItem.mediaType === 'tv' ? 'TV Series' : 'Feature Film'}
                    </span>
                    {selectedItem.releaseDate && (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#f5c542]/15 text-[#f5c542] border border-[#f5c542]/30 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[#f5c542]" />
                        <span>Premieres / Releasing: {selectedItem.releaseDate}</span>
                      </span>
                    )}
                    {selectedItem.source && (
                      <span className="text-[#c9a24b]/80 text-[11px] font-mono">
                        Via {selectedItem.source}
                      </span>
                    )}
                  </div>

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
                  <div className="flex items-center gap-2">
                    {selectedItem.trailerKey && (
                      <button
                        onClick={(e) => handlePlayTrailer(e, selectedItem.trailerKey!)}
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5c542] text-[#1c120c] font-display font-black text-xs hover:bg-white transition-all shadow-lg shadow-[#f5c542]/20 transform hover:scale-105"
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
                        <span>Explore Movie Page</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

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
