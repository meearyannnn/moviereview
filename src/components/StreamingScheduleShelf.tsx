// components/StreamingScheduleShelf.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Tv2, ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { tvmaze, type TVmazeScheduleEpisode } from '@/services/tvmaze';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

const STREAMING_PLATFORMS = [
  'All',
  'Netflix',
  'Disney+',
  'Apple TV+',
  'Prime Video',
  'Max',
  'Hulu',
  'Paramount+',
  'Peacock',
] as const;

const PLATFORM_META: Record<string, { color: string; glow: string; badge: string }> = {
  netflix:    { color: 'text-red-400',     glow: 'shadow-red-600/30',    badge: 'bg-red-600/20 text-red-400 border-red-500/30' },
  apple:      { color: 'text-white',       glow: 'shadow-white/10',      badge: 'bg-white/20 text-white border-white/30' },
  disney:     { color: 'text-blue-400',    glow: 'shadow-blue-600/30',   badge: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
  prime:      { color: 'text-sky-400',     glow: 'shadow-sky-500/30',    badge: 'bg-sky-500/20 text-sky-400 border-sky-400/30' },
  amazon:     { color: 'text-sky-400',     glow: 'shadow-sky-500/30',    badge: 'bg-sky-500/20 text-sky-400 border-sky-400/30' },
  max:        { color: 'text-purple-400',  glow: 'shadow-purple-600/30', badge: 'bg-purple-600/20 text-purple-400 border-purple-500/30' },
  hulu:       { color: 'text-emerald-400', glow: 'shadow-emerald-600/30',badge: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
  paramount:  { color: 'text-blue-300',    glow: 'shadow-blue-500/30',   badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
  peacock:    { color: 'text-amber-400',   glow: 'shadow-amber-500/30',  badge: 'bg-amber-500/20 text-amber-400 border-amber-400/30' },
};

function getPlatformMeta(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(PLATFORM_META)) {
    if (lower.includes(key)) return val;
  }
  return { color: 'text-[#f5c542]', glow: 'shadow-[#f5c542]/20', badge: 'bg-[#c9a24b]/20 text-[#f5c542] border-[#c9a24b]/30' };
}

export const StreamingScheduleShelf: React.FC = () => {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState<TVmazeScheduleEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<string>('All');
  const [selectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    isDragging,
    scrollToDirection,
    handlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    tvmaze.getWebSchedule(selectedDate)
      .then((data) => {
        if (isMounted) {
          const isMajorPlatform = (channelName: string) => {
            const lower = channelName.toLowerCase();
            return (
              lower.includes('netflix') ||
              lower.includes('apple') ||
              lower.includes('disney') ||
              lower.includes('prime') ||
              lower.includes('amazon') ||
              lower.includes('max') ||
              lower.includes('hbo') ||
              lower.includes('hulu') ||
              lower.includes('paramount') ||
              lower.includes('peacock')
            );
          };

          const filtered = data.filter((ep) => {
            const channelName =
              ep._embedded?.show?.webChannel?.name ||
              ep._embedded?.show?.network?.name ||
              '';
            return isMajorPlatform(channelName);
          });

          setEpisodes(filtered);
        }
      })
      .catch((err) => {
        console.error('Failed to load streaming schedule:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const filtered = episodes.filter((ep) => {
    if (activePlatform === 'All') return true;
    const channelName =
      ep._embedded?.show?.webChannel?.name ||
      ep._embedded?.show?.network?.name ||
      '';
    if (activePlatform === 'Prime Video') return /prime|amazon/i.test(channelName);
    if (activePlatform === 'Apple TV+') return /apple/i.test(channelName);
    if (activePlatform === 'Disney+') return /disney/i.test(channelName);
    if (activePlatform === 'Paramount+') return /paramount/i.test(channelName);
    if (activePlatform === 'Peacock') return /peacock/i.test(channelName);
    return channelName.toLowerCase().includes(activePlatform.toLowerCase());
  });

  const handleShowClick = (showName?: string) => {
    if (!showName) return;
    navigate(`/search?q=${encodeURIComponent(showName)}`);
  };

  return (
    <section className="my-12 w-full max-w-full min-w-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5c542] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5c542]" />
            </span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#c9a24b]">
              Airing Today
            </span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-tight">
            <span className="text-white">Streaming</span>{" "}
            <span className="bg-gradient-to-r from-[#f5c542] to-[#c9a24b] bg-clip-text text-transparent">Premieres</span>
          </h2>
          <p className="text-[#c9a24b]/70 text-xs font-mono mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Platform filter pills + navigation arrows */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide touch-pan-x flex-shrink-0">
            {STREAMING_PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={[
                  'px-3.5 py-1.5 rounded-full text-[11px] font-black font-display uppercase tracking-wide',
                  'whitespace-nowrap border transition-all duration-200',
                  activePlatform === p
                    ? 'bg-[#f5c542] text-[#1c120c] border-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.35)]'
                    : 'bg-transparent text-white/50 hover:text-white border-white/10 hover:border-[#c9a24b]/30 hover:bg-white/5',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scrollToDirection('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToDirection('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex gap-4 overflow-x-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-none w-52 rounded-2xl bg-white/[0.04] border border-white/8 animate-pulse"
              style={{ height: 260, animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-white/[0.02] border border-white/8 gap-3">
          <Radio className="w-8 h-8 text-white/20" />
          <p className="text-white/40 text-sm font-sans">
            Nothing listed for <span className="text-white/60 font-semibold">{activePlatform}</span> today.
          </p>
          <button
            onClick={() => setActivePlatform('All')}
            className="mt-1 text-xs text-[#f5c542] hover:text-white font-bold font-display uppercase tracking-widest transition-colors"
          >
            Show All Platforms
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          {...handlers}
          className={`flex gap-4 overflow-x-auto scrollbar-hide pb-4 touch-pan-x select-none overscroll-x-contain ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filtered.slice(0, 18).map((ep, idx) => {
            const show = ep._embedded?.show;
            const rawImg = ep.image?.medium || ep.image?.original || show?.image?.medium || show?.image?.original || '';
            const imgUrl = rawImg
              ? rawImg.replace(/^http:\/\//i, 'https://')
              : '/placeholder.svg';
            const meta = getPlatformMeta(channelName);

            return (
              <div
                key={ep.id}
                onClick={() => handleShowClick(show?.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleShowClick(show?.name)}
                className={[
                  'group flex-none w-52 rounded-2xl bg-[#140a0d] border border-[#c9a24b]/20',
                  'hover:border-[#f5c542]/60 transition-all duration-300 cursor-pointer overflow-hidden',
                  'hover:shadow-[0_8px_30px_rgba(245,197,66,0.2)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]',
                  isDragging ? 'pointer-events-none' : '',
                ].join(' ')}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Poster */}
                <div className="relative aspect-[3/2] overflow-hidden bg-neutral-900">
                  <img
                    src={imgUrl}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#140a0d] via-black/20 to-transparent" />

                  {/* Platform badge */}
                  <span className={`absolute bottom-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-widest ${meta.badge}`}>
                    {channelName}
                  </span>

                  {/* Episode pill */}
                  {ep.season && ep.number && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold bg-black/60 text-white/80 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm font-display tracking-wide">
                      S{ep.season} · E{ep.number}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1.5">
                  <h3 className="font-display font-black text-sm text-white leading-tight group-hover:text-red-400 transition-colors duration-200 truncate">
                    {show?.name}
                  </h3>
                  <p className="text-[11px] text-white/50 font-sans truncate leading-tight">
                    {ep.name || 'New Episode'}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-0.5 border-t border-white/[0.06]">
                    <span className="flex items-center gap-1 text-[10px] text-white/35 font-sans">
                      <Clock className="w-3 h-3 text-[#f5c542]/80 flex-shrink-0" />
                      {ep.airtime ? ep.airtime : 'Streaming'}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] font-black font-display text-[#f5c542] group-hover:translate-x-0.5 transition-transform uppercase tracking-wide">
                      <Tv2 className="w-3 h-3" />
                      Watch
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
