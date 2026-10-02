// src/components/HomeFranchiseSection.tsx — Simple & Sexy Iconic Franchises Section
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  Play,
  Film,
  X,
  Compass,
  ExternalLink,
} from 'lucide-react';
import {
  franchiseService,
  FRANCHISES_CONFIG,
  type FranchiseMeta,
  type FranchiseMovie,
} from '@/services/franchises';
import { tmdb } from '@/services/tmdb';
import { soundEffects } from '@/lib/soundEffects';

export const HomeFranchiseSection = () => {
  const navigate = useNavigate();
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('marvel');
  const [movies, setMovies] = useState<FranchiseMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTrailerKey, setActiveTrailerKey] = useState<string | null>(null);

  const shelfRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const activeFranchise =
    FRANCHISES_CONFIG.find((f) => f.id === selectedFranchiseId) || FRANCHISES_CONFIG[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadFranchise() {
      try {
        const data = await franchiseService.getFranchiseMovies(selectedFranchiseId);
        if (!cancelled) {
          setMovies(data);
        }
      } catch (err) {
        console.error('Failed to load franchise movies:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFranchise();
    return () => {
      cancelled = true;
    };
  }, [selectedFranchiseId]);

  const updateScrollState = () => {
    const el = shelfRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = shelfRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      updateScrollState();
      return () => el.removeEventListener('scroll', updateScrollState);
    }
  }, [movies]);

  const scrollShelf = (direction: 'left' | 'right') => {
    soundEffects.playHoverTick();
    const el = shelfRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleSelectFranchise = (id: string) => {
    soundEffects.playHoverTick();
    setSelectedFranchiseId(id);
    if (shelfRef.current) {
      shelfRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handlePlayTrailer = async (e: React.MouseEvent, movieId: number) => {
    e.stopPropagation();
    soundEffects.playHoverTick();
    try {
      const res = await tmdb.getVideos(movieId, 'movie');
      const trailer = res?.results?.find(
        (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      if (trailer?.key) {
        setActiveTrailerKey(trailer.key);
      } else {
        navigate(`/movie/${movieId}`);
      }
    } catch {
      navigate(`/movie/${movieId}`);
    }
  };

  const handleCardClick = (movieId: number) => {
    soundEffects.playHoverTick();
    navigate(`/movie/${movieId}`);
  };

  return (
    <section className="scroll-mt-20 my-10 relative" id="franchises">
      {/* ── Outer Ambient Cinema Frame ── */}
      <div className="relative rounded-3xl p-5 sm:p-8 border border-white/[0.08] bg-gradient-to-b from-[#140b12]/90 via-[#0e070c]/85 to-[#070306]/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-700">
        {/* Dynamic ambient color glow matching active franchise */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700 opacity-25"
          style={{ backgroundColor: activeFranchise.accentColor }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700 opacity-20"
          style={{ backgroundColor: activeFranchise.accentColor }}
        />

        {/* ── Section Header ── */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border shadow-sm transition-colors duration-500"
                style={{
                  backgroundColor: `${activeFranchise.accentColor}18`,
                  color: activeFranchise.accentColor,
                  borderColor: `${activeFranchise.accentColor}40`,
                }}
              >
                <Compass className="w-3.5 h-3.5" />
                CINEMATIC UNIVERSES
              </span>

              <span className="text-xs font-mono text-white/50 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.08]">
                {activeFranchise.studio}
              </span>

              <span className="text-xs font-mono text-white/40">
                {activeFranchise.badge}
              </span>
            </div>

            <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              <span>Mega </span>
              <span
                className="transition-colors duration-500"
                style={{ color: activeFranchise.accentColor }}
              >
                Franchises &amp; Sagas
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-xl font-sans transition-all duration-300">
              {activeFranchise.tagline}
            </p>
          </div>

          {/* Shelf Scroll Arrows */}
          <div className="flex items-center gap-2 self-start md:self-end shrink-0">
            {movies.length > 0 && (
              <span className="text-xs font-mono text-white/40 mr-1 hidden sm:inline">
                {movies.length} Films
              </span>
            )}
            <button
              onClick={() => scrollShelf('left')}
              disabled={!canScrollLeft}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white transition-all hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none hover:border-[#f5c542]/40"
              aria-label="Previous franchise movies"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollShelf('right')}
              disabled={!canScrollRight}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white transition-all hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none hover:border-[#f5c542]/40"
              aria-label="Next franchise movies"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Sexy Franchise Selector Tabs ── */}
        <div className="relative mb-6 pb-2 border-b border-white/[0.07] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2 min-w-max">
            {FRANCHISES_CONFIG.map((franchise) => {
              const isSelected = franchise.id === selectedFranchiseId;
              return (
                <button
                  key={franchise.id}
                  onClick={() => handleSelectFranchise(franchise.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-display font-bold tracking-wide transition-all duration-300 ${
                    isSelected
                      ? 'text-white shadow-lg'
                      : 'text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06]'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: `${franchise.accentColor}25`,
                          borderColor: franchise.accentColor,
                          borderWidth: '1px',
                          boxShadow: `0 8px 24px ${franchise.glowColor}`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full transition-transform duration-300"
                    style={{
                      backgroundColor: franchise.accentColor,
                      transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                  <span>{franchise.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Films Horizontal Shelf ── */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden py-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[160px] sm:w-[190px] flex flex-col gap-2">
                <div className="aspect-[2/3] w-full rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]" />
                <div className="h-4 w-3/4 rounded bg-white/[0.04] animate-pulse mt-1" />
                <div className="h-3 w-1/2 rounded bg-white/[0.03] animate-pulse" />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-10 text-center text-white/40">
            <Film className="w-8 h-8 mx-auto mb-2 text-white/30" />
            <p className="text-sm font-semibold text-white/70">No titles loaded for this universe</p>
            <p className="text-xs text-white/40 mt-1">Please try selecting another saga above.</p>
          </div>
        ) : (
          <div
            ref={shelfRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 px-1 -mx-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          >
            {movies.map((movie, idx) => (
              <div
                key={movie.id}
                onClick={() => handleCardClick(movie.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(movie.id)}
                className="group cursor-pointer shrink-0 w-[155px] sm:w-[190px] md:w-[205px] snap-start flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] rounded-2xl transition-all duration-300 transform motion-safe:group-hover:-translate-y-1.5"
              >
                {/* Poster Frame */}
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#10070c] border border-white/[0.08] group-hover:border-[#f5c542]/60 shadow-xl group-hover:shadow-[0_12px_32px_rgba(245,197,66,0.18)] transition-all duration-300">
                  <img
                    src={tmdb.getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none select-none"
                  />

                  {/* Top Rating Badge */}
                  {movie.vote_average !== undefined && movie.vote_average > 0 && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                      <span>{movie.vote_average}</span>
                    </div>
                  )}

                  {/* Chronological order index */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-black/70 backdrop-blur-md text-white/70 border border-white/10">
                    #{idx + 1}
                  </div>

                  {/* Center Play Beacon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/85 via-black/35 to-black/20 backdrop-blur-[2px]">
                    <button
                      onClick={(e) => handlePlayTrailer(e, movie.id)}
                      className="w-11 h-11 rounded-full bg-[#f5c542] text-[#1c120c] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform hover:bg-white"
                      title="Preview Trailer"
                    >
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    </button>
                  </div>

                  {/* Release Year Bottom Badge */}
                  {movie.releaseYear && (
                    <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-black/75 backdrop-blur-md text-white/80 border border-white/10">
                        {movie.releaseYear}
                      </span>
                    </div>
                  )}
                </div>

                {/* Movie Details Under Poster */}
                <div className="mt-2.5 px-0.5">
                  <h3
                    className="font-display font-semibold text-sm sm:text-base text-white group-hover:text-[#f5c542] transition-colors truncate leading-snug"
                    title={movie.title}
                  >
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-white/45 mt-0.5 font-sans">
                    <span className="truncate">{activeFranchise.shortName}</span>
                    <span className="font-mono text-[11px] shrink-0 text-white/35">
                      {movie.releaseYear}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── YouTube Trailer Player Modal ── */}
      {activeTrailerKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Franchise Trailer"
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
              aria-label="Close trailer"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${activeTrailerKey}?autoplay=1&rel=0`}
              title="Franchise Trailer"
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
