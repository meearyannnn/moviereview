// src/components/HomeFranchiseSection.tsx — Iconic franchises shelf
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Play, X, Loader2 } from 'lucide-react';
import { franchiseService, FRANCHISES_CONFIG, type FranchiseMovie } from '@/services/franchises';
import { tmdb } from '@/services/tmdb';
import { soundEffects } from '@/lib/soundEffects';

export const HomeFranchiseSection = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>(FRANCHISES_CONFIG[0].id);
  const [movies, setMovies] = useState<FranchiseMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerLoadingId, setTrailerLoadingId] = useState<number | null>(null);

  const shelfRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const franchise = FRANCHISES_CONFIG.find((f) => f.id === selectedId) ?? FRANCHISES_CONFIG[0];
  const tick = () => soundEffects.playHoverTick();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    franchiseService
      .getFranchiseMovies(selectedId)
      .then((data) => {
        if (!cancelled) setMovies(data);
      })
      .catch((err) => {
        console.error('Failed to load franchise movies:', err);
        if (!cancelled) setMovies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Close the trailer with Escape
  useEffect(() => {
    if (!trailerKey) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTrailerKey(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trailerKey]);

  const updateScrollState = () => {
    const el = shelfRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  // The shelf only exists once loading finishes, so re-attach then
  useEffect(() => {
    const el = shelfRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [movies, loading]);

  const scrollShelf = (dir: 'left' | 'right') => {
    tick();
    const el = shelfRef.current;
    if (el) el.scrollBy({ left: (dir === 'left' ? -1 : 1) * el.clientWidth * 0.75, behavior: 'smooth' });
  };

  const playTrailer = async (movieId: number) => {
    tick();
    setTrailerLoadingId(movieId);
    try {
      const res = await tmdb.getVideos(movieId, 'movie');
      const videos = ((res?.results ?? []) as any[]).filter(
        (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      const best =
        videos.find((v) => v.type === 'Trailer' && v.official) ?? videos.find((v) => v.type === 'Trailer') ?? videos[0];
      if (best?.key) setTrailerKey(best.key);
      else navigate(`/movie/${movieId}`);
    } catch {
      navigate(`/movie/${movieId}`);
    } finally {
      setTrailerLoadingId(null);
    }
  };

  const openMovie = (id: number) => {
    tick();
    navigate(`/movie/${id}`);
  };

  return (
    <section
      id="franchises"
      className="scroll-mt-20"
      // The active franchise's colour drives hover and focus states below
      style={{ '--accent': franchise.accentColor } as CSSProperties}
    >
      {/* ── Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
            Franchises &amp; sagas
          </h2>
          <p className="mt-0.5 text-xs text-white/50">{franchise.tagline}</p>
        </div>

        <div className="hidden gap-1.5 sm:flex">
          {(['left', 'right'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => scrollShelf(dir)}
              disabled={dir === 'left' ? !canScrollLeft : !canScrollRight}
              aria-label={dir === 'left' ? 'Previous films' : 'Next films'}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-25"
            >
              {dir === 'left' ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </header>

      {/* ── Franchise tabs: the underline takes the franchise's own colour ── */}
      <nav
        aria-label="Choose a franchise"
        className="mt-4 flex gap-5 overflow-x-auto border-b border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FRANCHISES_CONFIG.map((f) => {
          const active = f.id === selectedId;
          return (
            <button
              key={f.id}
              onClick={() => {
                tick();
                setSelectedId(f.id);
              }}
              aria-current={active}
              className={`-mb-px shrink-0 border-b-2 pb-2 text-xs font-medium transition-colors ${active ? 'text-white' : 'border-transparent text-white/45 hover:text-white/80'
                }`}
              style={active ? { borderColor: f.accentColor } : undefined}
            >
              {f.shortName}
            </button>
          );
        })}
      </nav>

      {/* ── Shelf ── */}
      <div className="mt-4">
        {loading ? (
          <div className="flex gap-3 overflow-hidden sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-[115px] shrink-0 sm:w-[130px] md:w-[145px] lg:w-[155px]">
                <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
                <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-white/[0.05]" />
                <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-white/80 text-sm">No films found for {franchise.shortName}</p>
            <p className="mt-1 text-xs text-white/40">Pick another franchise above.</p>
          </div>
        ) : (
          <div
            ref={shelfRef}
            className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {movies.map((movie) => (
              <div key={movie.id} className="group relative w-[115px] shrink-0 snap-start sm:w-[130px] md:w-[145px] lg:w-[155px]">
                {/* The card is one real button; the play control sits beside it, not inside it */}
                <button
                  onClick={() => openMovie(movie.id)}
                  className="block w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1a1116] ring-1 ring-white/[0.08] transition duration-300 group-hover:ring-[var(--accent)] motion-safe:group-hover:-translate-y-1">
                    <img
                      src={tmdb.getImageUrl(movie.poster_path, 'w500')}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                      className="h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-2 px-0.5">
                    <h3
                      className="truncate text-xs font-semibold text-white transition-colors group-hover:text-[var(--accent)] sm:text-[13px] leading-tight"
                      title={movie.title}
                    >
                      {movie.title}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/45">
                      <span className={movie.isUpcoming ? 'font-semibold text-[var(--accent)]' : undefined}>
                        {movie.isUpcoming ? `Coming ${movie.releaseYear ?? 'soon'}` : movie.releaseYear ?? 'TBA'}
                      </span>
                      {movie.vote_average !== undefined && movie.vote_average > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          {movie.vote_average}
                        </span>
                      )}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => playTrailer(movie.id)}
                  disabled={trailerLoadingId === movie.id}
                  aria-label={`Play trailer for ${movie.title}`}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 backdrop-blur-md transition hover:bg-white hover:text-black focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  {trailerLoadingId === movie.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="ml-0.5 h-3 w-3 fill-current" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Trailer modal ── */}
      {trailerKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trailer"
          onClick={() => setTrailerKey(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"
          >
            <button
              onClick={() => setTrailerKey(null)}
              aria-label="Close trailer"
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-white hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title="Trailer"
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