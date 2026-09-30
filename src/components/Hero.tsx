import { useEffect, useState, useRef, useCallback, type TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star, Plus, Check, X, PenLine } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { TitleLogo } from './TitleLogo';
import { useWatchlist } from '@/hooks/useWatchlist';
import { soundEffects } from '@/lib/soundEffects';

interface VideoTrailer {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
}

const SLIDE_MS = 7000;

// Thin line that fills over one slide's duration (sits on the active poster)
const AutoFill = () => {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFull(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="h-full bg-[#f5c542] shadow-[0_0_8px_#f5c542]"
      style={{ width: full ? '100%' : '0%', transition: full ? `width ${SLIDE_MS}ms linear` : 'none' }}
    />
  );
};

export const Hero = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);

  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await tmdb.getTrending('movie', 'week');
        if (!cancelled) setMovies(data.results?.slice(0, 5) || []);
      } catch (e) {
        console.error('Failed to load hero movies:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex) return;
    soundEffects.playSwoosh();
    setIsAutoPlay(false);
    setCurrentIndex(index);
  }, [currentIndex]);

  const step = useCallback((dir: 1 | -1) => {
    if (movies.length === 0) return;
    soundEffects.playSwoosh();
    setCurrentIndex((i) => (i + dir + movies.length) % movies.length);
  }, [movies.length]);

  // Autoplay: one timer per slide so it stays in sync with the progress line
  useEffect(() => {
    if (!isAutoPlay || movies.length === 0) return;
    const t = setTimeout(() => step(1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [isAutoPlay, currentIndex, movies.length, step]);

  // Touch swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s) return;
    const dx = s.x - e.changedTouches[0].clientX;
    const dy = s.y - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
      setIsAutoPlay(false);
      step(dx > 0 ? 1 : -1);
    }
  };

  // Trailer
  const closeTrailer = useCallback(() => setTrailerKey(null), []);

  useEffect(() => {
    if (!trailerKey) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeTrailer();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trailerKey, closeTrailer]);

  const handleWatchTrailer = async (movieId: number) => {
    soundEffects.playHoverTick();
    setLoadingTrailer(true);
    try {
      const data = await tmdb.getVideos(movieId, 'movie');
      const trailer = data.results?.find(
        (v: VideoTrailer) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
      );
      if (trailer) {
        setIsAutoPlay(false);
        setTrailerKey(trailer.key);
        soundEffects.playChime();
      } else {
        navigate(`/movie/${movieId}`);
      }
    } catch {
      navigate(`/movie/${movieId}`);
    } finally {
      setLoadingTrailer(false);
    }
  };

  if (movies.length === 0) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center bg-[#060810]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
      </div>
    );
  }

  const featured = movies[currentIndex];
  const year = featured.release_date ? new Date(featured.release_date).getFullYear() : null;
  const rating = featured.vote_average ? featured.vote_average.toFixed(1) : null;
  const inWatchlist = isInWatchlist(featured.id);

  const roundBtn =
    'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-white backdrop-blur-md transition-colors hover:bg-white/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70';

  return (
    <>
      <section
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-roledescription="carousel"
        className="relative flex h-[78vh] max-h-[820px] min-h-[600px] w-full select-none flex-col justify-end overflow-hidden bg-[#0a0608]"
      >
        {/* Backdrops: stacked, crossfaded */}
        <div className="absolute inset-0">
          {movies.map((m, i) => (
            <img
              key={m.id}
              src={tmdb.getImageUrl(m.backdrop_path, 'original')}
              alt=""
              aria-hidden={i !== currentIndex}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 motion-reduce:transition-none ${i === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0608] via-[#0a0608]/40 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-full max-w-2xl bg-gradient-to-r from-[#0a0608]/80 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0a0608]/70 to-transparent" />
        </div>

        {/* Ambient Top Studio Hallmark */}
        <div className="pointer-events-none absolute top-16 sm:top-20 right-4 sm:right-8 lg:right-12 z-10 hidden sm:flex flex-col items-end opacity-30">
          <img
            src="/assets/branding/movieguy-hero-tight.png"
            alt="MovieGuy"
            className="h-5 sm:h-6 lg:h-7 w-auto object-contain filter drop-shadow-[0_0_16px_rgba(245,197,66,0.4)]"
          />
          <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-[#c9a24b] mt-1 mr-0.5">
            PREMIERE STAGE
          </span>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-8 sm:px-6 md:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          {/* Featured film */}
          <div key={featured.id} className="max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-700">
            {/* MovieGuy Box Office Premiere Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-black/65 border border-[#c9a24b]/30 backdrop-blur-md mb-3 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
              <img
                src="/assets/branding/movieguy-logo-tight.png"
                alt="MovieGuy"
                className="h-3.5 w-auto object-contain animate-pulse"
              />
              <span className="text-[10px] font-mono font-bold tracking-[0.22em] text-[#f5c542] uppercase">
                MOVIEGUY MARQUEE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5c542] shadow-[0_0_8px_rgba(245,197,66,0.9)]" />
              <span className="font-mono text-[10px] text-white/50">PREMIERE #{currentIndex + 1}</span>
            </div>

            <p className="mb-4 flex items-center gap-3 text-sm text-white/70">
              <span className="font-mono font-bold text-[#c9a24b]">#{currentIndex + 1} THIS WEEK</span>
              {rating && (
                <span className="flex items-center gap-1 font-mono font-bold text-[#f5c542]">
                  <Star className="h-3.5 w-3.5 fill-[#f5c542] text-[#f5c542]" />
                  {rating}
                </span>
              )}
              {year && <span className="font-mono text-white/50">{year}</span>}
            </p>

            <TitleLogo id={featured.id} type="movie" title={featured.title} size="hero" />

            <p className="mb-6 mt-4 line-clamp-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              {featured.overview}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  navigate(`/movie/${featured.id}#reviews`);
                }}
                className="flex h-11 items-center gap-2 rounded-full bg-[#f5c542] hover:bg-[#e6b738] px-6 text-sm font-extrabold text-[#1c120c] transition-all shadow-lg shadow-[#f5c542]/25 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a24b]"
              >
                <PenLine className="h-4 w-4" />
                Rate &amp; Review
              </button>

              <button
                onClick={() => handleWatchTrailer(featured.id)}
                disabled={loadingTrailer}
                className="flex h-11 items-center gap-2 rounded-full border border-[#c9a24b]/30 bg-[#140c10]/80 px-5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-[#c9a24b]/15 hover:border-[#c9a24b]/60 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
              >
                <Play className="h-4 w-4 fill-[#f5c542] text-[#f5c542]" />
                {loadingTrailer ? 'Loading' : 'Trailer'}
              </button>

              <button
                onClick={() => {
                  soundEffects.playChime();
                  toggleWatchlist({
                    id: featured.id,
                    title: featured.title,
                    poster_path: featured.poster_path,
                    backdrop_path: featured.backdrop_path,
                    vote_average: featured.vote_average,
                    release_date: featured.release_date,
                    media_type: 'movie',
                  });
                }}
                className={`${roundBtn} ${inWatchlist ? '!border-[#c9a24b] !bg-[#c9a24b]/25 text-[#f5c542] shadow-[0_0_12px_rgba(201,162,75,0.4)]' : 'border-[#c9a24b]/30 bg-[#140c10]/80'}`}
                aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                aria-pressed={inWatchlist}
              >
                {inWatchlist ? <Check className="h-4 w-4 text-[#f5c542]" /> : <Plus className="h-4 w-4 text-[#c9a24b]" />}
              </button>

              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  navigate(`/movie/${featured.id}`);
                }}
                className={`${roundBtn} border-[#c9a24b]/30 bg-[#140c10]/80 hover:bg-[#c9a24b]/15`}
                aria-label="View details"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Poster picker: the five films, tap one to feature it */}
          <ol className="flex gap-2.5 sm:gap-3" aria-label="Pick a film">
            {movies.map((m, i) => {
              const active = i === currentIndex;
              return (
                <li key={m.id} className="w-[4.25rem] sm:w-20 lg:w-24">
                  <button
                    onClick={() => goToSlide(i)}
                    aria-label={`Show ${m.title}`}
                    aria-current={active}
                    className={`relative block aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-900 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 ${active
                        ? 'ring-2 ring-[#c9a24b] shadow-[0_0_15px_rgba(201,162,75,0.5)]'
                        : 'opacity-55 hover:opacity-90'
                      }`}
                  >
                    {m.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                    {active && isAutoPlay && (
                      <span className="absolute inset-x-0 bottom-0 block h-[3px] bg-black/50">
                        <AutoFill key={currentIndex} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Trailer modal */}
      {trailerKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Trailer"
          onClick={closeTrailer}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
          >
            <button
              onClick={closeTrailer}
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:bg-black/90"
              aria-label="Close trailer"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title="Movie trailer"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
};