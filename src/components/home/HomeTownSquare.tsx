// src/components/home/HomeTownSquare.tsx — "Talk Of The Town" Cinema Frontline
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Megaphone,
  Star,
  Heart,
  Play,
  Copy,
  Check,
  Ticket,
  ChevronRight,
  Sparkles,
  Flame,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { tmdb } from '@/services/tmdb';
import {
  curatedShelvesService,
  type CuratedShelfItem,
} from '@/services/curatedShelves';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';
import { toast } from 'sonner';

export const HomeTownSquare: React.FC = () => {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [items, setItems] = useState<CuratedShelfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'shows'>('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await curatedShelvesService.getTalkOfTheTown();
        if (mounted) {
          setItems(data.slice(0, 10));
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load Talk of the Town:', err);
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopyCode = () => {
    soundEffects.playChime();
    navigator.clipboard.writeText('MOVIEGUY100');
    setCopiedCode(true);
    toast.success('Promo Code "MOVIEGUY100" copied to clipboard!', {
      description: 'Use it at checkout to claim Flat 100/- off on your movie bookings.',
    });
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleSentimentVote = (sentiment: string) => {
    soundEffects.playHoverTick();
    setSelectedSentiment(sentiment);
    toast.success(`MovieGuy Meter vote recorded: "${sentiment}"`, {
      description: 'Your rating directly influences the community consensus score.',
    });
  };

  // Filter items by tab if selected
  const displayedItems = items.filter((item) => {
    if (activeTab === 'movies') return item.media_type === 'movie';
    if (activeTab === 'shows') return item.media_type === 'tv';
    return true;
  });

  // Pull 3 posters for the promo card fan collage
  const collagePosters = items.slice(0, 3);

  return (
    <section className="relative pt-24 sm:pt-28 pb-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#c9a24b]/20 border border-[#c9a24b]/35 text-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.3)]">
              <Megaphone className="w-4 h-4 fill-current stroke-none animate-pulse" />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-[#f5c542] uppercase">
              CINEMA SPOTLIGHT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542] shadow-[0_0_8px_rgba(245,197,66,0.9)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 hidden sm:inline">
              BOX OFFICE BUZZ
            </span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight flex items-center gap-3">
            Talk Of The Town
          </h1>
          <p className="text-xs sm:text-sm font-mono text-white/50 mt-1 max-w-xl">
            The hottest premieres, critical sensations, and streaming phenomena everyone is discussing.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-[#c9a24b]/20 backdrop-blur-md self-start sm:self-end">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] font-bold shadow-md shadow-[#c9a24b]/25'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            All Buzz
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'movies'
                ? 'bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] font-bold shadow-md shadow-[#c9a24b]/25'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shows')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'shows'
                ? 'bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] font-bold shadow-md shadow-[#c9a24b]/25'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            Series
          </button>
        </div>
      </div>

      {/* ── Main Layout: 2-Row Poster Grid (Left) + Moctale-Inspired Companion Cards (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
        {/* ── LEFT: 2 Rows of High-Impact Cinema Poster Cards ── */}
        <div className="min-w-0">
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl overflow-hidden border border-[#c9a24b]/15 bg-[#140c10] animate-pulse"
                >
                  <div className="aspect-[2/3] bg-white/[0.04]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-white/[0.08]" />
                    <div className="h-2.5 w-1/2 rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {displayedItems.map((item, index) => {
                const posterUrl = item.poster_path
                  ? tmdb.getImageUrl(item.poster_path, 'w500')
                  : '/placeholder.svg';
                const inWatchlist = isInWatchlist(item.id);
                const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                const subtitle =
                  item.customSubtitle ||
                  `${item.media_type === 'tv' ? 'Series' : 'Movie'} • ${item.year || '2026'}`;

                return (
                  <div
                    key={`${item.media_type}_${item.id}_${index}`}
                    onClick={() => navigate(`/${item.media_type}/${item.id}`)}
                    className="group relative flex flex-col cursor-pointer transition-all duration-300"
                  >
                    {/* Poster Frame */}
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden border border-[#c9a24b]/20 bg-[#140c10] transition-all duration-300 group-hover:border-[#f5c542] group-hover:shadow-[0_12px_30px_rgba(245,197,66,0.22)] group-hover:-translate-y-1">
                      <img
                        src={posterUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Vignette Shadow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      {/* Top Rank / Type Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase bg-black/70 text-[#f5c542] border border-[#c9a24b]/30 backdrop-blur-md">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Watchlist Bookmark Icon (accessible directly on mobile & hover on desktop) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playChime();
                          const added = toggleWatchlist({
                            id: item.id,
                            title: item.title,
                            poster_path: item.poster_path,
                            backdrop_path: item.backdrop_path,
                            vote_average: item.vote_average,
                            media_type: item.media_type,
                          });
                          if (added) toast.success(`Saved "${item.title}" to Watchlist`);
                          else toast.info(`Removed "${item.title}" from Watchlist`);
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg border transition-all ${
                          inWatchlist
                            ? 'bg-[#f5c542] border-[#f5c542] text-[#1c120c] opacity-100 shadow-md shadow-[#f5c542]/40'
                            : 'bg-black/60 border-white/20 text-white/70 hover:text-white hover:border-[#c9a24b] opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
                        }`}
                        title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${inWatchlist ? 'fill-current' : ''}`} />
                      </button>

                      {/* Bottom Quick Play Indicator on Hover */}
                      <div className="absolute bottom-2.5 inset-x-2.5 hidden sm:flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f5c542] text-[#1c120c] font-display font-extrabold text-[10px] shadow-lg shadow-[#f5c542]/30">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          View Reel
                        </span>
                        {rating && Number(rating) > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#f5c542] bg-black/75 px-1.5 py-0.5 rounded-md border border-[#c9a24b]/30">
                            <Star className="w-2.5 h-2.5 fill-current stroke-none" />
                            {rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Movie Metadata Beneath Poster */}
                    <div className="mt-2.5 px-0.5">
                      <h3 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-[#f5c542] truncate transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-mono text-white/50 truncate">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: The Two Moctale-Inspired Cinema Cards ── */}
        <div className="flex flex-col gap-5 shrink-0">
          {/* ── CARD 1: District Cinemas x MovieGuy Promo Box (Moctale Inspired) ── */}
          <div className="relative overflow-hidden rounded-3xl border border-[#c9a24b]/30 bg-gradient-to-br from-[#1a0f16] via-[#140a0f] to-[#0a0608] p-5 shadow-2xl shadow-black/80 flex flex-col justify-between group">
            {/* Background Geometric Cinema Glow & Watermark */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-44 h-44 bg-[#f5c542]/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Top Brand Partnership Lockup */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-sm tracking-wider text-white">
                    DISTRICT <span className="text-[#c9a24b] font-light">CINEMAS</span>
                  </span>
                  <span className="text-white/40 font-mono text-xs">×</span>
                  <img
                    src="/assets/branding/movieguy-hero-tight.png"
                    alt="MovieGuy"
                    className="h-4.5 w-auto object-contain drop-shadow-[0_0_8px_rgba(245,197,66,0.4)]"
                  />
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#f5c542] px-2 py-0.5 rounded-full bg-[#f5c542]/15 border border-[#c9a24b]/30">
                  EXCLUSIVE
                </span>
              </div>

              {/* Big Promo Headline */}
              <div className="my-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight leading-tight">
                  FLAT 100/- OFF
                </h2>
                <p className="font-mono text-xs font-bold text-[#f5c542] tracking-wider uppercase mt-0.5">
                  USE CODE: <span className="underline decoration-dashed">MOVIEGUY100</span>
                </p>
                <p className="text-[10px] font-mono text-white/45 mt-1">
                  For MovieGuy CineClub Members · Min 2 Admissions
                </p>
              </div>

              {/* Dynamic 3-Poster Fan Collage (like in reference screenshot) */}
              <div className="relative h-32 my-4 flex items-center justify-center overflow-hidden">
                {collagePosters.map((posterItem, pIdx) => {
                  const pUrl = posterItem.poster_path
                    ? tmdb.getImageUrl(posterItem.poster_path, 'w300')
                    : '/placeholder.svg';

                  let transformStyle = '';
                  let zIndex = 1;
                  if (pIdx === 0) {
                    transformStyle = '-rotate-12 -translate-x-8 translate-y-1';
                    zIndex = 1;
                  } else if (pIdx === 1) {
                    transformStyle = 'z-10 scale-105 shadow-2xl';
                    zIndex = 10;
                  } else {
                    transformStyle = 'rotate-12 translate-x-8 translate-y-1';
                    zIndex = 2;
                  }

                  return (
                    <div
                      key={`fan_${posterItem.id}_${pIdx}`}
                      style={{ zIndex }}
                      className={`absolute w-20 aspect-[2/3] rounded-xl overflow-hidden border border-[#c9a24b]/40 shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105 ${transformStyle}`}
                    >
                      <img src={pUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons: Copy Code + Book Tickets */}
            <div className="space-y-2 pt-2 border-t border-[#c9a24b]/20">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#c9a24b]/35 bg-black/60 hover:bg-[#c9a24b]/15 text-white text-xs font-mono font-bold tracking-wider uppercase transition-all"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#c9a24b]" />
                      <span>MOVIEGUY100</span>
                    </>
                  )}
                </button>

                <Link
                  to="/explore"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] font-display font-extrabold text-xs shadow-lg shadow-[#c9a24b]/20 hover:brightness-110 active:scale-95 transition-all text-center"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Book Tickets</span>
                </Link>
              </div>
              <p className="text-[9px] font-mono text-right text-white/35">T&amp;C Apply</p>
            </div>
          </div>

          {/* ── CARD 2: "Rate with the MovieGuy Meter" (Moctale Inspired) ── */}
          <div className="relative overflow-hidden rounded-3xl border border-[#c9a24b]/25 bg-gradient-to-br from-[#1a120b] via-[#140a0e] to-[#0a0608] p-5 shadow-2xl shadow-black/80 flex flex-col justify-between">
            {/* Top Carousel Indicator Dashes */}
            <div className="flex items-center gap-1.5 mb-3.5">
              <span className="h-1 flex-1 rounded-full bg-[#f5c542] shadow-[0_0_8px_#f5c542]" />
              <span className="h-1 flex-1 rounded-full bg-white/20" />
              <span className="h-1 flex-1 rounded-full bg-white/20" />
              <span className="h-1 flex-1 rounded-full bg-white/20" />
              <span className="h-1 flex-1 rounded-full bg-white/20" />
            </div>

            {/* Headline and Prompt */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f5c542] shadow-[0_0_8px_rgba(245,197,66,0.9)]" />
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#f5c542] uppercase">
                  COMMUNITY METER
                </span>
              </div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-tight leading-snug">
                Rate with the MovieGuy Meter
              </h2>
              <p className="text-xs font-mono text-white/60 mt-1 leading-relaxed">
                Forget complicated star ratings. Vote whether a film was worth the ticket or a total walk-out.
              </p>

              {/* Expressive Cinema Sentiment Buttons */}
              <div className="grid grid-cols-3 gap-2 my-4">
                {[
                  { id: 'worth', emoji: '🍿', label: 'Worth It!', percent: '91%' },
                  { id: 'avg', emoji: '🎟️', label: 'Average', percent: '7%' },
                  { id: 'walkout', emoji: '🪑', label: 'Walkout', percent: '2%' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSentimentVote(s.label)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      selectedSentiment === s.label
                        ? 'bg-[#f5c542] border-[#f5c542] text-[#1c120c] font-bold shadow-lg shadow-[#f5c542]/30 scale-105'
                        : 'border-[#c9a24b]/20 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] hover:border-[#c9a24b]/50'
                    }`}
                  >
                    <span className="text-lg">{s.emoji}</span>
                    <span className="text-[11px] font-display font-bold mt-1">{s.label}</span>
                    <span className="text-[9px] font-mono opacity-60">{s.percent}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Community CTA */}
            <div className="pt-3 border-t border-[#c9a24b]/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/50">
                24.8k votes today
              </span>
              <Link
                to="/community"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#f5c542] hover:text-[#ffd966] transition-colors group"
              >
                <span>Join CineClub Discussions</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
