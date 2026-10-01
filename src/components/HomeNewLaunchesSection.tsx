// src/components/HomeNewLaunchesSection.tsx — Dedicated realtime Bollywood & Hollywood launches grid matching user screenshot
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
  ExternalLink,
} from 'lucide-react';
import { newLaunchesService, type NewLaunchItem, type LaunchType } from '@/services/newLaunches';
import { soundEffects } from '@/lib/soundEffects';

type FilterTab = 'all' | 'bollywood' | 'hollywood' | 'trailers' | 'announcements';

const FILTER_TABS: { id: FilterTab; label: string; badge?: string }[] = [
  { id: 'all', label: 'All Launches' },
  { id: 'bollywood', label: 'Bollywood & Desi Buzz', badge: '🇮🇳' },
  { id: 'hollywood', label: 'Hollywood & Global', badge: '🎬' },
  { id: 'trailers', label: 'Trailers & Teasers', badge: '🍿' },
  { id: 'announcements', label: 'Announcements & BTS', badge: '📢' },
];

export const HomeNewLaunchesSection = () => {
  const navigate = useNavigate();
  const [launches, setLaunches] = useState<NewLaunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [activeTrailerKey, setActiveTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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

  const filteredItems = launches.filter((item) => {
    if (activeTab === 'bollywood') return item.industry === 'bollywood';
    if (activeTab === 'hollywood') return item.industry === 'hollywood';
    if (activeTab === 'trailers') {
      return item.launchType === 'New Trailer' || item.launchType === 'New Teaser';
    }
    if (activeTab === 'announcements') {
      return item.launchType === 'New Announcement' || item.launchType === 'BTS / First Look';
    }
    return true;
  });

  const handleCardClick = (item: NewLaunchItem) => {
    soundEffects.playHoverTick();
    if (item.trailerKey && (item.launchType === 'New Trailer' || item.launchType === 'New Teaser')) {
      setActiveTrailerKey(item.trailerKey);
    } else {
      navigate(`/${item.mediaType}/${item.id}`);
    }
  };

  return (
    <section className="scroll-mt-20 my-10" id="new-launches">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#f5c542]/15 text-[#f5c542] border border-[#c9a24b]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542] animate-pulse" />
              LIVE LAUNCHES &amp; BUZZ
            </span>
            <span className="text-xs text-[#c9a24b] font-mono font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-[#c9a24b]" />
              Bollywood &amp; Hollywood
            </span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            <span>Spotlight </span>
            <span className="bg-gradient-to-r from-[#f5c542] via-white to-[#c9a24b] bg-clip-text text-transparent">
              Drops &amp; Announcemnts
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-xl">
            Realtime updates across Bollywood and Hollywood: brand-new trailers, posters, teasers, re-releases &amp; movie announcements.
          </p>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.playHoverTick();
                setActiveTab(tab.id);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                activeTab === tab.id
                  ? 'bg-[#f5c542] text-[#1c120c] font-black shadow-md shadow-[#f5c542]/20'
                  : 'bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {tab.badge && <span>{tab.badge}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards Grid (Matches user screenshot 5-col 2-row layout) ── */}
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
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#140a0e] p-10 text-center text-white/40">
          <Clapperboard className="w-8 h-8 mx-auto mb-2 text-[#c9a24b]/40" />
          <p className="text-sm font-semibold text-white/70">No launch updates found for this filter</p>
          <p className="text-xs text-white/40 mt-0.5">Switch back to All Launches to see all global drops.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {filteredItems.slice(0, 10).map((item) => (
            <div
              key={`${item.mediaType}-${item.id}`}
              onClick={() => handleCardClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCardClick(item)}
              className="group cursor-pointer flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] rounded-2xl transition-all"
            >
              {/* Poster Card (Matching screenshot) */}
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

                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Industry chip in top left (Bollywood 🇮🇳 / Hollywood 🎬) */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md border border-white/[0.1] text-white/90">
                    {item.industry === 'bollywood' ? 'Bollywood' : 'Hollywood'}
                  </span>
                </div>

                {/* Play action icon overlay if trailer available */}
                {item.trailerKey && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-11 h-11 rounded-full bg-[#f5c542] text-[#1c120c] flex items-center justify-center shadow-xl shadow-black/80 transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Launch Type Label (Exactly like screenshot) */}
              <div className="mt-2.5 px-0.5">
                <h3 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-[#f5c542] transition-colors truncate leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-white/50 mt-0.5 font-sans truncate font-medium">
                  {item.launchType}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── YouTube Video Player Modal ── */}
      {activeTrailerKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New Launch Video"
          onClick={() => setActiveTrailerKey(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
          >
            <button
              onClick={() => setActiveTrailerKey(null)}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/90"
              aria-label="Close video"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeTrailerKey}?autoplay=1&rel=0`}
              title="Launch Trailer"
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
