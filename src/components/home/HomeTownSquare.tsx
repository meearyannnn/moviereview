// src/components/home/HomeTownSquare.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Heart, Play, ChevronRight } from 'lucide-react';
import { tmdb } from '@/services/tmdb';
import { curatedShelvesService, type CuratedShelfItem } from '@/services/curatedShelves';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';
import { toast } from 'sonner';

export const HomeTownSquare: React.FC = () => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [items, setItems] = useState<CuratedShelfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'shows'>('all');

  useEffect(() => {
    let mounted = true;
    curatedShelvesService.getTalkOfTheTown()
      .then((data) => { if (mounted) { setItems(data.slice(0, 10)); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const displayedItems = items.filter((item) => {
    if (activeTab === 'movies') return item.media_type === 'movie';
    if (activeTab === 'shows') return item.media_type === 'tv';
    return true;
  });

  return (
    <section className="pt-20 sm:pt-24 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-mono font-bold tracking-[0.25em] text-[#c9a24b] uppercase mb-2">
            Cinema Spotlight
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Talk Of The Town
          </h1>
          <p className="text-sm font-mono text-white/40 mt-1">
            What the world is watching right now.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] self-start sm:self-end">
          {(['all', 'movies', 'shows'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[#f5c542] text-[#1c120c] font-bold'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'movies' ? 'Films' : 'Series'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">

        {/* Poster grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayedItems.map((item, index) => {
                const posterUrl = item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w500') : null;
                const inWatchlist = isInWatchlist(item.id);

                return (
                  <div
                    key={`${item.media_type}_${item.id}`}
                    onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                    className="group relative cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#130a10] transition-all duration-300 group-hover:border-[#f5c542]/40 group-hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] group-hover:-translate-y-0.5">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <Play className="w-8 h-8" />
                        </div>
                      )}

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Rank */}
                      <span className="absolute top-2 left-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/70 text-[#f5c542] border border-[#c9a24b]/30">
                        #{index + 1}
                      </span>

                      {/* Watchlist */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playChime();
                          const added = toggleWatchlist({
                            id: item.id, title: item.title,
                            poster_path: item.poster_path,
                            backdrop_path: item.backdrop_path,
                            vote_average: item.vote_average,
                            media_type: item.media_type,
                          });
                          toast[added ? 'success' : 'info'](added ? `Saved "${item.title}"` : `Removed "${item.title}"`);
                        }}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          inWatchlist
                            ? 'bg-[#f5c542] border-[#f5c542] text-[#1c120c]'
                            : 'bg-black/60 border-white/20 text-white/60 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${inWatchlist ? 'fill-current' : ''}`} />
                      </button>

                      {/* Rating at bottom */}
                      {item.vote_average && item.vote_average > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#f5c542]">
                          <Star className="w-2.5 h-2.5 fill-current stroke-none" />
                          {item.vote_average.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <p className="mt-2 text-[12px] font-semibold text-white/80 group-hover:text-white truncate transition-colors leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] font-mono text-white/30 mt-0.5">
                      {item.media_type === 'tv' ? 'Series' : 'Film'} · {item.year || '2026'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Community Meter card */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#c9a24b] uppercase mb-1">
            Community Meter
          </p>
          <h3 className="font-display font-bold text-lg text-white mb-1">Was it worth it?</h3>
          <p className="text-[11px] font-mono text-white/35 mb-4">Skip stars — vote your gut feeling.</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: 'worth', emoji: '🍿', label: 'Worth It', pct: '91%' },
              { id: 'avg', emoji: '🎟️', label: 'Average', pct: '7%' },
              { id: 'walkout', emoji: '🚪', label: 'Walkout', pct: '2%' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  soundEffects.playHoverTick();
                  setSelectedSentiment(s.label);
                  toast.success(`Voted: "${s.label}"`);
                }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                  selectedSentiment === s.label
                    ? 'bg-[#f5c542] border-[#f5c542] text-[#1c120c] scale-[1.03]'
                    : 'border-white/[0.08] text-white/70 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[10px] font-semibold leading-tight">{s.label}</span>
                <span className="text-[9px] font-mono opacity-50">{s.pct}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono text-white/30">24.8k votes today</span>
            <Link
              to="/community"
              className="flex items-center gap-1 text-[11px] font-mono text-[#c9a24b] hover:text-[#f5c542] transition-colors"
            >
              Discussions <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
