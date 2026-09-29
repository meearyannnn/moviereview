import { useState, useEffect, useRef, useCallback, useMemo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Dices, Play, Star, Sparkles, RotateCw, Film, AlertCircle } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { soundEffects } from '@/lib/soundEffects';

interface CinemaRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MovieWithGenres = Movie & { genre_ids?: number[]; vote_count?: number };

// ────────────────────────────────────────────────────────────
// "Intelligence" layer: scoring, tagging, and human commentary
// ────────────────────────────────────────────────────────────

const GENRE_NAMES: Record<number, string> = {
  28: 'action', 12: 'adventure', 16: 'animated', 35: 'comedy', 80: 'crime',
  99: 'documentary', 18: 'drama', 10751: 'family', 14: 'fantasy', 36: 'historical',
  27: 'horror', 10402: 'musical', 9648: 'mystery', 10749: 'romance',
  878: 'sci-fi', 10770: 'TV movie', 53: 'thriller', 10752: 'war', 37: 'western',
};

function primaryGenre(movie: MovieWithGenres): string | null {
  const id = movie.genre_ids?.[0];
  return id ? GENRE_NAMES[id] ?? null : null;
}

// Cheap deterministic hash so the same movie always gets the same
// blurb variant, without needing to store anything.
function hashId(id: number | string): number {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Bayesian-adjusted rating: pulls low-vote-count outliers toward the pool
// average so a 9.5 from 12 votes doesn't dominate a 8.2 from 50,000.
function bayesianScore(movie: MovieWithGenres, poolMeanRating: number, minVotes: number): number {
  const v = movie.vote_count ?? 0;
  const r = movie.vote_average ?? poolMeanRating;
  return (v / (v + minVotes)) * r + (minVotes / (v + minVotes)) * poolMeanRating;
}

interface ScoredMovie {
  movie: MovieWithGenres;
  score: number;
  tag: 'Critics\u2019 Choice' | 'Fan Favorite' | 'Hidden Gem' | 'Cult Classic';
}

function scoreAndTagPool(candidates: MovieWithGenres[]): ScoredMovie[] {
  if (candidates.length === 0) return [];
  const voteCounts = candidates.map((m) => m.vote_count ?? 0).sort((a, b) => a - b);
  const minVotes = voteCounts[Math.floor(voteCounts.length / 2)] || 500; // median as Bayesian prior weight
  const poolMeanRating =
    candidates.reduce((sum, m) => sum + (m.vote_average ?? 0), 0) / candidates.length;

  const scored = candidates.map((movie) => ({
    movie,
    score: bayesianScore(movie, poolMeanRating, minVotes),
    voteCount: movie.vote_count ?? 0,
  }));

  const sortedByVotes = [...scored].sort((a, b) => a.voteCount - b.voteCount);
  const voteCountMedian = sortedByVotes[Math.floor(sortedByVotes.length / 2)]?.voteCount ?? 0;
  const sortedByScore = [...scored].sort((a, b) => b.score - a.score);
  const scoreTop25 = sortedByScore[Math.floor(sortedByScore.length * 0.25)]?.score ?? poolMeanRating;

  return scored.map(({ movie, score, voteCount }) => {
    const highScore = score >= scoreTop25;
    const wellKnown = voteCount >= voteCountMedian;
    let tag: ScoredMovie['tag'];
    if (highScore && wellKnown) tag = 'Fan Favorite';
    else if (highScore && !wellKnown) tag = 'Hidden Gem';
    else if (!highScore && wellKnown) tag = 'Critics\u2019 Choice';
    else tag = 'Cult Classic';
    return { movie, score, tag };
  });
}

const TAG_LINES: Record<ScoredMovie['tag'], string[]> = {
  'Fan Favorite': [
    'Widely loved, and it earns it every time.',
    'The kind of pick most people end up glad they took.',
  ],
  'Hidden Gem': [
    "It's flying under the radar, but it's better than most things that aren't.",
    'Not many people have seen this one yet — you could be early.',
  ],
  'Critics\u2019 Choice': [
    'Not the loudest pick, but a genuinely well-made one.',
    'The kind of film that rewards a bit of patience.',
  ],
  'Cult Classic': [
    "Divisive in the best way — people who love it, really love it.",
    "A little off the beaten path, which is half the appeal.",
  ],
};

function buildBlurb(sm: ScoredMovie): string {
  const { movie, tag } = sm;
  const variants = TAG_LINES[tag];
  const line = variants[hashId(movie.id) % variants.length];
  const genre = primaryGenre(movie);
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const context = genre && year
    ? `A ${year} ${genre} pick. `
    : year
      ? `From ${year}. `
      : '';
  return `${context}${line}`;
}

// Weighted random sample, with a novelty boost for unseen ids and a
// penalty against repeating the immediately previous winner.
function weightedPick(
  pool: ScoredMovie[],
  shownIds: Set<number | string>,
  lastId: number | string | null
): ScoredMovie {
  const weighted = pool.map((sm) => {
    let w = Math.max(sm.score, 0.1);
    if (!shownIds.has(sm.movie.id)) w *= 1.35; // reward novelty
    if (sm.movie.id === lastId) w *= 0.25; // discourage immediate repeat
    return { sm, w };
  });
  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  let roll = Math.random() * total;
  for (const { sm, w } of weighted) {
    roll -= w;
    if (roll <= 0) return sm;
  }
  return weighted[weighted.length - 1].sm;
}

function getTimeVibe(): string {
  const h = new Date().getHours();
  if (h < 5) return 'a late-night watch';
  if (h < 12) return 'a morning watch';
  if (h < 17) return 'an afternoon watch';
  if (h < 21) return 'an evening watch';
  return 'a late-night watch';
}

// ────────────────────────────────────────────────────────────

export const CinemaRouletteModal = ({ isOpen, onClose }: CinemaRouletteModalProps) => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<MovieWithGenres[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<ScoredMovie | null>(null);
  const [displayMovie, setDisplayMovie] = useState<MovieWithGenres | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const shownIdsRef = useRef<Set<number | string>>(new Set());
  const lastWinnerIdRef = useRef<number | string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const scoredPool = useMemo(() => scoreAndTagPool(candidates), [candidates]);
  const timeVibe = useMemo(() => getTimeVibe(), []);

  const clearSpinTimer = useCallback(() => {
    if (spinTimerRef.current) {
      clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }
  }, []);

  const loadMasterpieces = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadError(false);
    try {
      const data = await tmdb.discover('movie', 'sort_by=vote_average.desc&vote_count.gte=1500&page=1');
      const list = (data.results || []).filter((m: MovieWithGenres) => m.poster_path);
      setCandidates(list);
      if (list.length > 0) setDisplayMovie(list[0]);
      if (list.length === 0) setLoadError(true);
    } catch (e) {
      console.error(e);
      setLoadError(true);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (isOpen && candidates.length === 0 && !isFetchingRef.current) {
      loadMasterpieces();
    }
  }, [isOpen, candidates.length, loadMasterpieces]);

  useEffect(() => {
    if (!isOpen) {
      clearSpinTimer();
      setIsSpinning(false);
    }
  }, [isOpen, clearSpinTimer]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  useEffect(() => clearSpinTimer, [clearSpinTimer]);

  const spinReel = () => {
    if (scoredPool.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setSelectedMovie(null);
    setSpinCount((c) => c + 1);

    let counter = 0;
    const totalSpins = 24;
    let delay = 50;

    const runStep = () => {
      counter++;
      const randomIdx = Math.floor(Math.random() * scoredPool.length);
      setDisplayMovie(scoredPool[randomIdx].movie);
      soundEffects.playRouletteTick(1 + (counter / totalSpins) * 0.5);

      if (counter < totalSpins) {
        delay += 12;
        spinTimerRef.current = setTimeout(runStep, delay);
      } else {
        const winner = weightedPick(scoredPool, shownIdsRef.current, lastWinnerIdRef.current);
        shownIdsRef.current.add(winner.movie.id);
        lastWinnerIdRef.current = winner.movie.id;
        // If we've now shown everything, reset so future spins can revisit
        // titles again instead of degrading to pure repeats.
        if (shownIdsRef.current.size >= scoredPool.length) shownIdsRef.current.clear();

        setDisplayMovie(winner.movie);
        setSelectedMovie(winner);
        setIsSpinning(false);
        soundEffects.playChime();
      }
    };

    runStep();
  };

  if (!isOpen) return null;

  const showEncouragement = spinCount >= 3 && !isSpinning && selectedMovie;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-[#0d1017] border border-white/15 shadow-2xl shadow-amber-500/10 p-6 sm:p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold tracking-wider uppercase mb-3">
          <Dices className="w-3.5 h-3.5" />
          Cinema Roulette
        </div>

        <h3 id={titleId} className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-1">
          Can't Decide What to Watch?
        </h3>
        <p className="text-xs sm:text-sm text-white/50 mb-6 max-w-xs mx-auto font-light">
          Let the reels spin — this one's weighted toward what's actually good, not just loud.
        </p>

        <div className="relative mx-auto w-48 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-red-600/40 shadow-2xl shadow-black bg-black mb-4" aria-live="polite">
          {displayMovie ? (
            <img
              src={tmdb.getImageUrl(displayMovie.poster_path, 'w500')}
              alt={isSpinning ? '' : displayMovie.title}
              className={`w-full h-full object-cover transition-transform duration-150 ${isSpinning ? 'scale-105 blur-[1px]' : 'scale-100'
                }`}
            />
          ) : loadError ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/30 px-3 text-center">
              <AlertCircle className="w-8 h-8" />
              <span className="text-[11px]">Couldn't load titles</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <Film className="w-12 h-12 animate-pulse" />
            </div>
          )}

          <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-around pointer-events-none opacity-40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1.5 h-2 rounded-sm bg-black border border-white/30" />
            ))}
          </div>
          <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-around pointer-events-none opacity-40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1.5 h-2 rounded-sm bg-black border border-white/30" />
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3">
            <span className="text-xs font-bold text-white truncate drop-shadow-md">
              {displayMovie?.title || (loadError ? 'Unavailable' : 'Rolling...')}
            </span>
          </div>
        </div>

        {/* Selected Movie Info — now with a tag + a human "why this" line */}
        {selectedMovie && (
          <div className="mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-bold text-red-500 px-2.5 py-0.5 rounded-full bg-red-600/10 border border-red-500/20">
                <Star className="w-3 h-3 fill-red-500" />
                {selectedMovie.movie.vote_average?.toFixed(1)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                {selectedMovie.tag}
              </span>
              <span className="text-xs text-white/50">
                {selectedMovie.movie.release_date ? new Date(selectedMovie.movie.release_date).getFullYear() : ''}
              </span>
            </div>
            <p className="text-xs text-amber-200/70 italic mb-1.5 max-w-sm mx-auto">
              {buildBlurb(selectedMovie)}
            </p>
            <p className="text-xs text-white/60 line-clamp-2 max-w-sm mx-auto font-light">
              {selectedMovie.movie.overview}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {loadError && candidates.length === 0 ? (
            <button onClick={loadMasterpieces} className="btn-cinema-gold text-sm py-3.5 px-8">
              <RotateCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          ) : selectedMovie ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  navigate(`/movie/${selectedMovie.movie.id}`);
                }}
                className="btn-cinema-gold text-xs py-3 px-6"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Watch This Film</span>
              </button>
              <button onClick={spinReel} disabled={isSpinning} className="btn-cinema-ghost text-xs py-3 px-5">
                <RotateCw className="w-4 h-4" />
                <span>Spin Again</span>
              </button>
            </>
          ) : (
            <button
              onClick={spinReel}
              disabled={isSpinning || scoredPool.length === 0}
              className="btn-cinema-gold text-sm py-3.5 px-8"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>{isSpinning ? 'Rolling the Reels...' : `Spin — perfect for ${timeVibe}`}</span>
            </button>
          )}
        </div>

        {showEncouragement && (
          <p className="mt-3 text-[11px] text-white/30 font-light animate-in fade-in duration-500">
            Still torn? Sometimes the third spin is the one that sticks.
          </p>
        )}
      </div>
    </div>
  );
};