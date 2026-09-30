// components/RatingsDisplay.tsx — Redesigned with ScreenCritic design system
import React from 'react';
import { Trophy, ExternalLink } from 'lucide-react';
import { useOmdb, type OmdbMovieData } from '@/services/omdb';

// ── Rating content-advisory pill ──
const RatedPill = ({ rated }: { rated: string }) => {
  const colors: Record<string, string> = {
    'G':       'bg-emerald-500/15 border-emerald-500/35 text-emerald-400',
    'PG':      'bg-sky-500/15 border-sky-500/35 text-sky-400',
    'PG-13':   'bg-amber-500/15 border-amber-500/35 text-amber-400',
    'R':       'bg-orange-500/15 border-orange-500/35 text-orange-400',
    'NC-17':   'bg-red-500/15 border-red-500/35 text-red-400',
    'TV-G':    'bg-emerald-500/15 border-emerald-500/35 text-emerald-400',
    'TV-PG':   'bg-sky-500/15 border-sky-500/35 text-sky-400',
    'TV-14':   'bg-amber-500/15 border-amber-500/35 text-amber-400',
    'TV-MA':   'bg-red-500/15 border-red-500/35 text-red-400',
  };
  const cls = colors[rated] || 'bg-white/8 border-white/15 text-white/80';
  return (
    <span
      className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full border ${cls}`}
      title={`Content rating: ${rated}`}
    >
      {rated}
    </span>
  );
};

// ── Inline compact badge ──
const InlineBadge = ({
  icon,
  score,
  color,
  bg,
  border,
  href,
  title,
}: {
  icon: React.ReactNode;
  score: string;
  color: string;
  bg: string;
  border: string;
  href?: string;
  title?: string;
}) => {
  const inner = (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm shrink-0 transition-all hover:brightness-110`}
      style={{ color, backgroundColor: bg, borderColor: border }}
      title={title}
    >
      {icon}
      {score}
    </span>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return inner;
};

export interface RatingsDisplayProps {
  data?: OmdbMovieData | null;
  imdbId?: string | null;
  title?: string;
  year?: number | string;
  type?: 'movie' | 'series';
  releaseDate?: string;
  isReleased?: boolean;
  tmdbRating?: number;
  variant?: 'badges' | 'awards';
  className?: string;
}

export const RatingsDisplay: React.FC<RatingsDisplayProps> = ({
  data: providedData,
  imdbId,
  title,
  year,
  releaseDate,
  isReleased: isReleasedProp,
  type = 'movie',
  variant = 'badges',
  className = '',
}) => {
  const isReleased = React.useMemo(() => {
    if (isReleasedProp !== undefined) return isReleasedProp;
    if (releaseDate) {
      return new Date(releaseDate) <= new Date();
    }
    return true;
  }, [isReleasedProp, releaseDate]);

  const { data: fetchedData, isLoading } = useOmdb(
    !providedData && (imdbId || title)
      ? { imdbId: imdbId || undefined, title, year, type }
      : null
  );

  const data = providedData || fetchedData;

  if (isLoading && !data) {
    if (variant === 'badges') {
      return (
        <div className={`flex items-center gap-1.5 ${className}`}>
          <div className="h-6 w-14 bg-white/8 rounded-full animate-pulse" />
          <div className="h-6 w-14 bg-white/8 rounded-full animate-pulse" />
          <div className="h-6 w-14 bg-white/8 rounded-full animate-pulse" />
        </div>
      );
    }
    return null;
  }

  if (!isReleased) {
    if (variant === 'badges') {
      return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
          {data?.rated && <RatedPill rated={data.rated} />}
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
            Upcoming Premiere
          </span>
        </div>
      );
    }
    return null;
  }

  if (!data) return null;

  const imdbScore = data.imdbRating;
  const rtScore = data.rottenTomatoesScore;
  const rtNum = data.rottenTomatoesNum;
  const metascore = data.metascore;
  const rated = data.rated;
  const awards = data.awards && data.awards !== 'N/A' ? data.awards : null;

  // ── 1. Badge row ──
  if (variant === 'badges') {
    const isRotten = rtNum != null && rtNum < 60;
    const metaColor =
      metascore != null
        ? metascore >= 61
          ? '#54b32b'
          : metascore >= 40
          ? '#ffad00'
          : '#ff4500'
        : '#fff';

    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {rated && <RatedPill rated={rated} />}

        {imdbScore != null && (
          <InlineBadge
            icon={
              <span className="font-black text-[9px] bg-[#f5c518] text-black px-1 rounded-sm leading-none py-0.5">
                IMDb
              </span>
            }
            score={imdbScore.toFixed(1)}
            color="#f5c518"
            bg="rgba(245,197,24,0.10)"
            border="rgba(245,197,24,0.28)"
            href={data.imdbId ? `https://www.imdb.com/title/${data.imdbId}` : undefined}
            title={`IMDb: ${imdbScore}/10${data.imdbVotes ? ` (${data.imdbVotes} votes)` : ''}`}
          />
        )}

        {rtScore && (
          <InlineBadge
            icon={<span className="text-xs leading-none">{isRotten ? '🍅' : '🍿'}</span>}
            score={rtScore}
            color={isRotten ? '#fa7060' : '#6ecc55'}
            bg={isRotten ? 'rgba(250,50,10,0.10)' : 'rgba(84,179,43,0.10)'}
            border={isRotten ? 'rgba(250,50,10,0.28)' : 'rgba(84,179,43,0.28)'}
            title={`Rotten Tomatoes: ${rtScore}`}
          />
        )}

        {metascore != null && (
          <InlineBadge
            icon={
              <span
                className="font-black text-[9px] px-1 rounded-sm leading-none py-0.5 text-white"
                style={{ backgroundColor: metaColor }}
              >
                M
              </span>
            }
            score={`${metascore}`}
            color={metaColor}
            bg={`${metaColor}1a`}
            border={`${metaColor}40`}
            title={`Metacritic: ${metascore}/100`}
          />
        )}
      </div>
    );
  }

  // ── 2. Awards strip ──
  if (variant === 'awards') {
    if (!awards) return null;
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#c9a24b]/10 border border-[#c9a24b]/30 text-[#f5c542] text-xs font-mono max-w-full min-w-0 shadow-sm ${className}`}
        title={awards}
      >
        <Trophy className="w-3.5 h-3.5 text-[#c9a24b] shrink-0" />
        <span className="truncate">{awards}</span>
      </div>
    );
  }

  return null;
};

// Named exports for logos (used in other components)
export const ImdbLogo = ({ className = 'h-3.5 w-auto' }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center font-black text-black bg-[#f5c518] rounded-sm px-1 py-0.5 text-[9px] leading-none ${className}`}
  >
    IMDb
  </span>
);

export const RottenTomatoesLogo = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <span className={`leading-none ${className}`}>🍅</span>
);

export const MetacriticLogo = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <span
    className={`inline-flex items-center justify-center font-black text-white bg-[#54b32b] rounded-sm text-[9px] leading-none ${className}`}
  >
    M
  </span>
);