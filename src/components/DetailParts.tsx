/**
 * Detailparts.tsx
 * Shared building blocks for MovieDetailPage and TVDetailPage styled with Cinema Box Office elegance.
 */
import { useEffect, useState, useRef, type ElementType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Check, Play, Share2, X, PenLine, Calendar, Star, Clock, Eye } from 'lucide-react';
import { tmdb, type CastMember, type CrewMember } from '@/services/tmdb';
import type { WatchLaterTag } from '@/services/userLibrary';

// ── Small atoms ────────────────────────────────────────────────────────
export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="mb-4 flex items-center gap-2.5 font-display text-xl font-extrabold text-white">
    <span aria-hidden="true" className="h-4 w-1.5 rounded-full bg-[#c9a24b] shadow-[0_0_8px_rgba(201,162,75,0.8)]" />
    {children}
  </h2>
);

export const Pill = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'sky' }) => (
  <span
    className={`rounded-full border px-3 py-0.5 text-xs font-mono font-medium ${tone === 'sky'
        ? 'border-sky-400/30 bg-sky-500/10 text-sky-300'
        : 'border-[#c9a24b]/30 bg-[#c9a24b]/10 text-[#f5c542]'
      }`}
  >
    {children}
  </span>
);

export const Fact = ({ icon: Icon, children }: { icon: ElementType; children: ReactNode }) => (
  <span className="flex items-center gap-1.5 text-xs font-mono text-white/70">
    <Icon className="h-3.5 w-3.5 text-[#c9a24b]" aria-hidden="true" />
    {children}
  </span>
);

export const Rating = ({ value }: { value: string }) => (
  <span className="flex items-center gap-1.5 text-xl font-bold text-white md:text-sm md:font-semibold">
    <Star className="h-4 w-4 fill-[#f5c542] text-[#f5c542]" aria-hidden="true" />
    <span className="font-mono text-[#f5c542]">{value}</span>
  </span>
);

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const FALLBACK_BACKDROP = '/placeholder.svg';

// ── Page layout ────────────────────────────────────────────────────────
interface DetailLayoutProps {
  backdropSrc: string;
  posterSrc: string;
  posterAlt: string;
  /** Shown under the poster on md+ screens only */
  posterExtra?: ReactNode;
  /** Quick facts: sit beside the poster on mobile, in a row above the title on desktop */
  facts: ReactNode;
  children: ReactNode;
}

export const DetailLayout = ({
  backdropSrc,
  posterSrc,
  posterAlt,
  posterExtra,
  facts,
  children,
}: DetailLayoutProps) => {
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const isBackdropInvalid = !backdropSrc || backdropSrc.includes('placeholder.svg') || backdropFailed;
  const isPosterValid = posterSrc && !posterSrc.includes('placeholder.svg') && !posterFailed;
  const effectiveBackdrop = isBackdropInvalid
    ? (isPosterValid ? posterSrc : FALLBACK_BACKDROP)
    : backdropSrc;

  return (
    <>
      {/* Backdrop with Cinema Vignettes */}
      <div className="relative h-[320px] w-full overflow-hidden sm:h-[480px] lg:h-[560px] bg-[#0c080a]">
        <img
          src={effectiveBackdrop}
          alt=""
          className={`h-full w-full object-cover object-center transition-all duration-700 ${effectiveBackdrop === posterSrc ? 'scale-125 blur-2xl opacity-40' : 'opacity-90'
            }`}
          onError={() => setBackdropFailed(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0608] via-[#0a0608]/75 to-[#0a0608]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0608]/80 via-transparent to-[#0a0608]/70" />
      </div>

      <main className="relative z-10 mx-auto -mt-28 w-full max-w-6xl px-4 pb-36 sm:-mt-44 sm:px-6 md:pb-20 lg:-mt-56 lg:px-8">
        <div
          className="grid grid-cols-[128px_minmax(0,1fr)] gap-x-4 gap-y-6
             sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-x-6
             md:grid-cols-[240px_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-10 md:gap-y-0
             lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-x-12"
        >
          {/* Poster column: Admission Ticket Style */}
          <div className="min-w-0 md:row-span-2">
            <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-[#c9a24b]/30 bg-[#140c10] shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
              <img
                src={posterFailed ? '/placeholder.svg' : posterSrc}
                alt={posterAlt}
                decoding="async"
                className="h-full w-full object-cover"
                onError={() => setPosterFailed(true)}
              />
            </div>
            {posterExtra && <div className="hidden md:block mt-4">{posterExtra}</div>}
          </div>

          {/* Quick facts */}
          <div className="flex min-w-0 flex-col items-start justify-end gap-2.5 pb-1 md:mb-4 md:flex-row md:flex-wrap md:items-center md:justify-start md:gap-x-4 md:gap-y-2 md:pb-0">
            {facts}
          </div>

          {/* Main content */}
          <div className="col-span-2 min-w-0 md:col-span-1">{children}</div>
        </div>
      </main>
    </>
  );
};

// ── Actions ────────────────────────────────────────────────────────────
const secondaryBtn =
  'flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-mono font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a24b] sm:px-5';
const idleBtn = 'border-[#c9a24b]/30 bg-[#140c10]/90 text-white hover:border-[#c9a24b]/60 hover:bg-[#c9a24b]/10';
const savedBtn = 'border-[#f5c542] bg-[#f5c542]/20 text-[#f5c542] hover:bg-[#f5c542]/30 shadow-md shadow-[#f5c542]/25';

// ── Watch Later Popover Options ─────────────────────────────────────────
const WATCH_LATER_OPTIONS: Array<{
  tag: WatchLaterTag;
  icon: string;
  label: string;
  desc: string;
  textColor: string;
}> = [
    {
      tag: 'asap',
      icon: '🚀',
      label: 'ASAP',
      desc: 'Watch as soon as you can',
      textColor: 'text-rose-400',
    },
    {
      tag: 'weekend',
      icon: '🥤',
      label: 'Weekend',
      desc: 'Save for your next free weekend',
      textColor: 'text-[#f5c542]',
    },
    {
      tag: 'someday',
      icon: '🐌',
      label: 'Someday',
      desc: 'No rush — get to it when you can',
      textColor: 'text-sky-400',
    },
  ];

interface ActionBarProps {
  hasTrailer: boolean;
  inWatchlist?: boolean;
  inWatchLater?: boolean;
  watchLaterTag?: WatchLaterTag;
  onSelectWatchLaterTag?: (tag: WatchLaterTag) => void;
  onReview: () => void;
  onTrailer: () => void;
  onToggleWatchlist?: () => void;
  onToggleWatchLater?: () => void;
  onShare?: () => void;
  isWatched?: boolean;
  onToggleWatched?: () => void;
  onAddToCollections?: () => void;
}

export const ActionBar = ({
  hasTrailer,
  inWatchlist,
  inWatchLater,
  watchLaterTag,
  onSelectWatchLaterTag,
  onReview,
  onTrailer,
  onToggleWatchlist,
  onToggleWatchLater,
  onShare,
  isWatched = false,
  onToggleWatched,
  onAddToCollections,
}: ActionBarProps) => {
  const isInLater = inWatchLater ?? inWatchlist ?? false;
  const toggleLater = onToggleWatchLater ?? onToggleWatchlist;
  const [showWatchLaterMenu, setShowWatchLaterMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowWatchLaterMenu(false);
      }
    };
    if (showWatchLaterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWatchLaterMenu]);

  return (
    <div className="mb-8 flex flex-col gap-3 max-w-sm sm:max-w-md w-full">
      {/* ── 1. Top Button: Mark as Watched (Cinema Box Office styling) ── */}
      {onToggleWatched && (
        <button
          onClick={onToggleWatched}
          aria-pressed={isWatched}
          className={`w-full flex h-11 items-center justify-center gap-2.5 rounded-full px-6 text-sm font-display font-extrabold tracking-wide transition-all active:scale-[0.98] ${isWatched
              ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/50'
              : 'bg-gradient-to-r from-[#f5c542] via-[#e6b738] to-[#c9a24b] text-[#1c120c] shadow-lg shadow-[#f5c542]/25 ring-1 ring-[#f5c542]/50 hover:brightness-105'
            }`}
        >
          {isWatched ? (
            <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
          )}
          <span>{isWatched ? 'Watched' : 'Mark as Watched'}</span>
        </button>
      )}

      {/* ── 2. Row: Collections & Watch Later (Cinema Dark with Gold Accents) ── */}
      <div className="grid grid-cols-2 gap-3 relative">
        {/* Collections Button */}
        {onAddToCollections && (
          <button
            onClick={onAddToCollections}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-[#c9a24b]/30 bg-[#140c10]/95 hover:border-[#c9a24b]/60 hover:bg-[#c9a24b]/10 px-4 text-xs font-display font-bold uppercase tracking-wider text-white/90 hover:text-[#f5c542] transition-all active:scale-[0.98] shadow-sm"
          >
            <Bookmark className="h-3.5 w-3.5 text-[#c9a24b]" aria-hidden="true" />
            <span>Collections</span>
          </button>
        )}

        {/* Watch Later Button with Popover anchor */}
        <div className="relative">
          <button
            onClick={() => setShowWatchLaterMenu((prev) => !prev)}
            aria-expanded={showWatchLaterMenu}
            className={`w-full flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-xs font-display font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm ${isInLater
                ? 'border-[#f5c542] bg-[#f5c542]/15 text-[#f5c542] ring-1 ring-[#f5c542]/40 shadow-sm shadow-[#f5c542]/20'
                : 'border-[#c9a24b]/30 bg-[#140c10]/95 hover:border-[#c9a24b]/60 hover:bg-[#c9a24b]/10 text-white/90 hover:text-[#f5c542]'
              }`}
          >
            <div className="relative inline-flex items-center justify-center">
              <Clock className={`h-3.5 w-3.5 ${isInLater ? 'text-[#f5c542]' : 'text-[#c9a24b]'}`} aria-hidden="true" />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold leading-none text-[#f5c542]">+</span>
            </div>
            <span>Watch Later</span>
          </button>

          {/* Watch Later Dropdown Popover */}
          {showWatchLaterMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[#c9a24b]/35 bg-[#120a0e]/98 p-2.5 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl ring-1 ring-white/5"
            >
              <div className="space-y-1">
                {WATCH_LATER_OPTIONS.map((opt) => {
                  const isSelected = isInLater && watchLaterTag === opt.tag;
                  return (
                    <button
                      key={opt.tag}
                      type="button"
                      onClick={() => {
                        if (onSelectWatchLaterTag) {
                          onSelectWatchLaterTag(opt.tag);
                        } else if (toggleLater) {
                          toggleLater();
                        }
                        setShowWatchLaterMenu(false);
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group ${isSelected
                          ? 'bg-[#c9a24b]/15 border border-[#c9a24b]/40'
                          : 'hover:bg-[#c9a24b]/10 border border-transparent'
                        }`}
                    >
                      {/* Radio Circle */}
                      <div className="mt-0.5 shrink-0 flex items-center justify-center">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                              ? 'border-[#f5c542] bg-[#f5c542]/20'
                              : 'border-[#c9a24b]/40 group-hover:border-[#c9a24b]/80'
                            }`}
                        >
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#f5c542]" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{opt.icon}</span>
                          <span className={`text-sm font-display font-bold ${opt.textColor}`}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-white/60 mt-0.5 leading-snug">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Auxiliary Actions: Review, Trailer, Share ── */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          onClick={onReview}
          className="flex-1 flex h-10 items-center justify-center gap-2 rounded-full border border-[#c9a24b]/40 bg-[#140c10]/90 hover:border-[#f5c542] hover:bg-[#c9a24b]/15 text-[#f5c542] text-xs font-display font-extrabold transition-all shadow-sm active:scale-95"
        >
          <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Review</span>
        </button>

        {hasTrailer && (
          <button
            onClick={onTrailer}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#c9a24b]/30 bg-[#140c10]/90 hover:border-[#c9a24b]/60 hover:bg-[#c9a24b]/15 px-4 text-xs font-mono font-medium text-white/90 hover:text-white transition-all active:scale-95"
          >
            <Play className="h-3.5 w-3.5 fill-[#c9a24b] text-[#c9a24b]" aria-hidden="true" />
            <span>Trailer</span>
          </button>
        )}

        {onShare && (
          <button
            onClick={onShare}
            aria-label="Share"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9a24b]/30 bg-[#140c10]/90 hover:border-[#c9a24b]/60 hover:bg-[#c9a24b]/15 text-white/80 hover:text-[#f5c542] transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Storyline (collapses on mobile) ────────────────────────────────────
export const Storyline = ({ text, fallback }: { text?: string; fallback: string }) => {
  const [open, setOpen] = useState(false);
  const body = text || fallback;
  const long = !!text && text.length > 260;

  return (
    <section className="mb-10">
      <SectionTitle>Storyline</SectionTitle>
      <p
        className={`max-w-2xl break-words text-[15px] leading-relaxed text-white/70 sm:text-base ${long && !open ? 'line-clamp-4 md:line-clamp-none' : ''
          }`}
      >
        {body}
      </p>
      {long && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2 text-xs font-mono font-bold text-[#c9a24b] hover:text-[#f5c542] focus-visible:outline md:hidden"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </section>
  );
};

// ── Upcoming card ──────────────────────────────────────────────────────
export const UpcomingCard = ({
  heading,
  verb,
  date,
}: {
  heading: string;
  verb: string;
  date?: string;
}) => (
  <section className="mb-10 flex items-center gap-4 rounded-2xl border border-[#c9a24b]/20 bg-[#140c10] p-4 sm:p-5 shadow-lg">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#c9a24b]/30 bg-[#c9a24b]/10">
      <Calendar className="h-5 w-5 text-[#f5c542]" aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <h3 className="font-display text-base font-extrabold text-white">{heading}</h3>
      <p className="mt-0.5 text-xs font-mono text-white/60">
        {verb}{' '}
        <span className="font-bold text-[#f5c542]">
          {date
            ? new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'soon'}
        </span>
        . Ratings and the critic consensus unlock after the premiere.
      </p>
    </div>
  </section>
);

// ── Cast row ───────────────────────────────────────────────────────────
const CastAvatar = ({ m }: { m: CastMember }) => {
  const [failed, setFailed] = useState(false);
  const photoUrl = m.profile_path ? tmdb.getImageUrl(m.profile_path, 'w185') : null;

  return (
    <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-[#c9a24b]/20 bg-[#140c10] transition-all group-hover:border-[#c9a24b]/60 group-hover:scale-105 group-focus-visible:border-[#c9a24b] group-focus-visible:ring-2 group-focus-visible:ring-[#c9a24b]/50 shadow-md">
      {photoUrl && !failed ? (
        <img
          src={photoUrl}
          alt={m.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xs font-mono font-bold text-[#c9a24b]">{initials(m.name)}</span>
      )}
    </div>
  );
};

export const CastRow = ({
  cast,
  onSelect,
}: {
  cast: CastMember[];
  onSelect: (actor: { id: number; name: string }) => void;
}) => {
  if (cast.length === 0) return null;
  return (
    <section className="mb-6">
      <SectionTitle>Cast</SectionTitle>
      <div className="scrollbar-hide -mx-4 flex touch-pan-x snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:gap-4 md:px-0">
        {cast.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect({ id: m.id, name: m.name })}
            title={`View ${m.name}'s filmography`}
            className="group w-[88px] flex-none snap-start text-center focus-visible:outline-none"
          >
            <CastAvatar m={m} />
            <span className="mt-2 block truncate text-xs font-semibold text-white/90 group-hover:text-[#f5c542] transition-colors">{m.name}</span>
            <span className="block truncate text-[10px] font-mono text-white/40">{m.character}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

// ── Crew row ───────────────────────────────────────────────────────────
const CrewAvatar = ({ m }: { m: CrewMember }) => {
  const [failed, setFailed] = useState(false);
  const photoUrl = m.profile_path ? tmdb.getImageUrl(m.profile_path, 'w185') : null;
  const isDirector = m.job.toLowerCase().includes('director');

  return (
    <div
      className={`mx-auto flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border bg-[#140c10] transition-all group-hover:scale-105 group-focus-visible:ring-2 shadow-md ${isDirector
          ? 'border-[#f5c542]/60 ring-2 ring-[#f5c542]/20 group-hover:border-[#f5c542] group-hover:shadow-[0_0_16px_rgba(245,197,66,0.35)]'
          : 'border-[#c9a24b]/20 group-hover:border-[#c9a24b]/60'
        }`}
    >
      {photoUrl && !failed ? (
        <img
          src={photoUrl}
          alt={m.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xs font-mono font-bold text-[#c9a24b]">{initials(m.name)}</span>
      )}
    </div>
  );
};

export const CrewRow = ({
  crew,
  onSelect,
}: {
  crew: CrewMember[];
  onSelect?: (person: { id: number; name: string }) => void;
}) => {
  const navigate = useNavigate();
  if (!crew || crew.length === 0) return null;

  const handleClick = (m: CrewMember) => {
    // If director, navigate to the Director Showcase page
    if (m.job.toLowerCase().includes('director')) {
      navigate(`/director/${m.id}`);
    } else if (onSelect) {
      onSelect({ id: m.id, name: m.name });
    } else {
      navigate(`/director/${m.id}`);
    }
  };

  return (
    <section className="mb-6">
      <SectionTitle>Directors &amp; Crew</SectionTitle>
      <div className="scrollbar-hide -mx-4 flex touch-pan-x snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:gap-4 md:px-0">
        {crew.map((m, idx) => {
          const isDirector = m.job.toLowerCase().includes('director');
          return (
            <button
              key={`${m.id}-${m.job}-${idx}`}
              onClick={() => handleClick(m)}
              title={
                isDirector
                  ? `Explore ${m.name}'s Director Filmography`
                  : `View ${m.name} (${m.job})`
              }
              className="group w-[88px] flex-none snap-start text-center focus-visible:outline-none"
            >
              <CrewAvatar m={m} />
              <span className="mt-2 block truncate text-xs font-semibold text-white/90 group-hover:text-[#f5c542] transition-colors">
                {m.name}
              </span>
              <span
                className={`block truncate text-[10px] font-mono ${isDirector ? 'text-[#f5c542] font-bold' : 'text-white/40'
                  }`}
              >
                {m.job}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

// ── Trailer modal ──────────────────────────────────────────────────────
export const TrailerModal = ({ trailerKey, onClose }: { trailerKey: string; onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trailer"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-xl animate-in fade-in duration-200 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-[#c9a24b]/30 bg-black shadow-2xl"
      >
        <button
          onClick={onClose}
          autoFocus
          aria-label="Close trailer"
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a24b]/40 bg-black/80 text-white transition-all hover:bg-black hover:border-[#c9a24b]"
        >
          <X className="h-5 w-5" />
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
          title="Official trailer"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};