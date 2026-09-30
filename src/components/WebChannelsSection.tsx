// components/WebChannelsSection.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { MovieCard } from '@/components/MovieCard';
import { WEB_CHANNELS, webChannelsService, type WebChannel } from '@/services/webChannels';
import { tmdb, type Movie } from '@/services/tmdb';

const GENRE_FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'drama',     label: 'Drama' },
  { id: 'comedy',    label: 'Comedy' },
  { id: 'action',    label: 'Action' },
  { id: 'scifi',     label: 'Sci-Fi' },
  { id: 'crime',     label: 'Crime' },
  { id: 'animation', label: 'Animation' },
] as const;

interface WebChannelsSectionProps {
  initialTab?: 'popular' | 'thisSeason' | 'movies';
}

export const WebChannelsSection: React.FC<WebChannelsSectionProps> = ({ initialTab = 'popular' }) => {
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState<WebChannel>(WEB_CHANNELS[0]);
  const [activeTab, setActiveTab] = useState<'popular' | 'thisSeason' | 'movies'>(initialTab);
  const [activeGenre, setActiveGenre] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(18);

  const [popularShows, setPopularShows]   = useState<Movie[]>([]);
  const [seasonShows, setSeasonShows]     = useState<Movie[]>([]);
  const [movies, setMovies]               = useState<Movie[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setVisibleCount(18);
    setActiveGenre('all');

    Promise.all([
      webChannelsService.getPopularShows(selectedChannel, 36),
      webChannelsService.getThisSeasonShows(selectedChannel, 36),
      webChannelsService.getTrendingMovies(selectedChannel, 36),
    ])
      .then(([pop, season, mov]) => {
        if (isMounted) { setPopularShows(pop); setSeasonShows(season); setMovies(mov); }
      })
      .catch(console.warn)
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [selectedChannel]);

  const handleTabChange = (tab: 'popular' | 'thisSeason' | 'movies') => {
    setActiveTab(tab); setVisibleCount(18);
  };

  const rawList = useMemo(() => {
    if (activeTab === 'popular')    return popularShows;
    if (activeTab === 'thisSeason') return seasonShows;
    return movies;
  }, [activeTab, popularShows, seasonShows, movies]);

  const filteredList = useMemo(() => {
    if (activeGenre === 'all') return rawList;
    return rawList.filter((item) => {
      const ids = item.genre_ids || [];
      if (activeGenre === 'drama')     return ids.includes(18);
      if (activeGenre === 'comedy')    return ids.includes(35);
      if (activeGenre === 'action')    return ids.includes(10759) || ids.includes(28) || ids.includes(12);
      if (activeGenre === 'scifi')     return ids.includes(10765) || ids.includes(878) || ids.includes(14);
      if (activeGenre === 'crime')     return ids.includes(80) || ids.includes(9648) || ids.includes(53);
      if (activeGenre === 'animation') return ids.includes(16);
      return true;
    });
  }, [rawList, activeGenre]);

  const visibleItems = filteredList.slice(0, visibleCount);

  const tabLabel = activeTab === 'popular' ? 'Popular' : activeTab === 'thisSeason' ? 'New This Season' : 'Movies';

  return (
    <section className="my-14 w-full max-w-full min-w-0">

      {/* ── Section eyebrow ── */}
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9a24b] font-mono mb-1.5">
          Streaming Networks
        </p>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
          Browse by <span className="bg-gradient-to-r from-[#f5c542] to-[#c9a24b] bg-clip-text text-transparent">Network</span>
        </h2>
      </div>

      {/* ── Network selector pills ── */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 mb-1 touch-pan-x">
        {WEB_CHANNELS.map((ch) => {
          const active = selectedChannel.id === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch)}
              className={[
                'group flex-none flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 border whitespace-nowrap',
                active
                  ? 'border-[#f5c542]/60 text-white shadow-[0_0_18px_rgba(245,197,66,0.3)]'
                  : 'bg-transparent border-white/[0.08] text-white/50 hover:text-white hover:border-white/20',
              ].join(' ')}
              style={active ? { backgroundColor: `${ch.color}18`, boxShadow: `0 0 18px ${ch.color}28` } : undefined}
            >
              <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 bg-black/50 p-0.5">
                <img src={ch.logoUrl} alt={ch.name} className="w-full h-full object-contain" loading="lazy" />
              </div>
              <span className="text-xs font-black font-display tracking-wide">{ch.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main showcase ── */}
      <div className="mt-6 relative rounded-3xl overflow-hidden border border-white/[0.06]"
           style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%)' }}>

        {/* Ambient colour glow from selected channel */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] blur-3xl"
          style={{ background: `radial-gradient(ellipse at top left, ${selectedChannel.color}, transparent 70%)` }}
        />

        {/* Panel header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-7 pt-5 pb-4">

          {/* Left: channel logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/[0.08]"
              style={{ backgroundColor: `${selectedChannel.color}18` }}
            >
              <img src={selectedChannel.logoUrl} alt={selectedChannel.name} className="w-7 h-7 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 font-display">
                {selectedChannel.tagline || selectedChannel.name}
              </p>
              <h3 className="font-display font-black text-lg sm:text-xl text-white leading-tight">
                <span style={{ color: selectedChannel.color }}>{selectedChannel.name}</span>{' '}
                — {tabLabel}
              </h3>
            </div>
          </div>

          {/* Right: tab switcher */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl border border-[#c9a24b]/20 bg-black/40 flex-shrink-0 backdrop-blur-sm">
            {([
              { key: 'popular',    label: 'Popular'  },
              { key: 'thisSeason', label: 'New'      },
              { key: 'movies',     label: 'Movies'   },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={[
                  'px-4 py-1.5 rounded-lg text-[11px] font-black font-display uppercase tracking-wider transition-all duration-200',
                  activeTab === key
                    ? 'bg-[#f5c542] text-[#1c120c] shadow-[0_2px_10px_rgba(245,197,66,0.35)]'
                    : 'text-white/40 hover:text-white',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Genre pills */}
        <div className="relative z-10 flex gap-1.5 px-5 sm:px-7 pb-4 overflow-x-auto scrollbar-hide touch-pan-x">
          {GENRE_FILTERS.map((g) => (
            <button
              key={g.id}
              onClick={() => { setActiveGenre(g.id); setVisibleCount(18); }}
              className={[
                'flex-none px-3.5 py-1 rounded-full text-[11px] font-bold font-sans whitespace-nowrap border transition-all duration-200',
                activeGenre === g.id
                  ? 'bg-[#c9a24b]/20 text-[#f5c542] border-[#c9a24b]/50'
                  : 'bg-transparent text-white/35 border-white/[0.06] hover:text-white/60 hover:border-[#c9a24b]/25',
              ].join(' ')}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.05] mx-5 sm:mx-7" />

        {/* Grid */}
        <div className="relative z-10 p-5 sm:p-7">
          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-white/30 text-sm font-sans">No titles for this filter on {selectedChannel.name}.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {visibleItems.map((item) => {
                  const isTv = activeTab !== 'movies';
                  return (
                    <MovieCard
                      key={`${item.id}_${activeTab}`}
                      movie={item}
                      type={isTv ? 'tv' : 'movie'}
                    />
                  );
                })}
              </div>

              {/* Load More */}
              {visibleCount < filteredList.length && (
                <div className="mt-10 flex flex-col items-center gap-2">
                  <button
                    onClick={() => setVisibleCount((p) => p + 12)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#c9a24b]/30 bg-[#140a0d] hover:bg-[#f5c542] hover:border-[#f5c542] text-[#f5c542] hover:text-[#1c120c] text-xs font-black font-display uppercase tracking-widest transition-all duration-300 shadow-md"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Load More
                  </button>
                  <span className="text-[10px] text-white/25 font-sans">
                    {visibleItems.length} / {filteredList.length} titles
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};


