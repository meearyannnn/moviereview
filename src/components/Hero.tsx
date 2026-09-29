import { useEffect, useState, useRef, useCallback, type TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Star, Plus, Check, X, Flame, PenLine } from 'lucide-react';
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

// Thin progress line that fills over one slide's duration
const AutoFill = () => {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFull(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className="h-full rounded-full bg-white"
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
      <div className="flex h-[75vh] w-full items-center justify-center bg-[#060810] md:h-[88vh]">
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
        className="relative flex h-[85vh] max-h-[920px] min-h-[600px] w-full select-none flex-col justify-end overflow-hidden bg-[#060810]"
      >
        {/* Backdrops — stacked, crossfaded by opacity */}
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
          <div className="absolute inset-0 bg-gradient-to-t from-[#060810] via-[#060810]/45 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-full max-w-3xl bg-gradient-to-r from-[#060810]/90 via-[#060810]/50 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#060810]/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 md:pb-14 lg:px-8">
          <div key={featured.id} className="max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-700">
            {/* Meta */}
            <div className="mb-4 flex items-center gap-4 text-xs font-semibold text-white/70">
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-red-500" />
                #{currentIndex + 1} trending this week
              </span>
              {rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-white">{rating}</span>
                </span>
              )}
              {year && <span>{year}</span>}
            </div>

            <TitleLogo id={featured.id} type="movie" title={featured.title} size="hero" />

            <p className="mb-7 mt-4 line-clamp-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              {featured.overview}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  navigate(`/movie/${featured.id}#reviews`);
                }}
                className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition-colors hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
              >
                <PenLine className="h-4 w-4" />
                Rate &amp; Review
              </button>

              <button
                onClick={() => handleWatchTrailer(featured.id)}
                disabled={loadingTrailer}
                className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.16] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
              >
                <Play className="h-4 w-4 fill-white" />
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
                className={`${roundBtn} ${inWatchlist ? '!border-red-500/70 !bg-red-600/25 text-red-300' : ''}`}
                aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                aria-pressed={inWatchlist}
              >
                {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>

              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  navigate(`/movie/${featured.id}`);
                }}
                className={roundBtn}
                aria-label="View details"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Slide progress */}
          <div className="mt-9 flex max-w-xs gap-2 sm:max-w-sm">
            {movies.map((m, i) => (
              <button
                key={m.id}
                onClick={() => goToSlide(i)}
                aria-label={`Show ${m.title}`}
                aria-current={i === currentIndex}
                className="group flex h-5 flex-1 items-center"
              >
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-white/20 transition-all group-hover:h-1">
                  {i < currentIndex && <span className="block h-full w-full rounded-full bg-white/70" />}
                  {i === currentIndex &&
                    (isAutoPlay ? <AutoFill key={currentIndex} /> : <span className="block h-full w-full rounded-full bg-white" />)}
                </span>
              </button>
            ))}
          </div>
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