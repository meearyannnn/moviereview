// CineVibeMeter.tsx — the film's reception as a dark theatre ticket.
// Main part: verdict, ratings by site, what it does well (all shown as theatre seats).
// Stub (bottom on phones): the overall score. Gold on dark, so it sits with the rest of the page.
import React, { useMemo } from 'react';
import { type Movie } from '@/services/tmdb';
import { type OmdbMovieData } from '@/services/omdb';
import {
  calculateIntelligentScore,
  type MultiSourceRatings,
} from '@/lib/cineAiEngine';

const GOLD = '#f2c46d';

const wordFor = (val: number) => {
  if (val >= 88) return 'Excellent';
  if (val >= 78) return 'Very good';
  if (val >= 68) return 'Good';
  if (val >= 55) return 'Okay';
  return 'Weak';
};

interface Source {
  key: string;
  label: string;
  value: number; // 0-100
  display: string;
}

interface CineVibeMeterProps {
  movie: Movie;
  runtime?: number;
  imdbRating?: number | null;
  omdbData?: OmdbMovieData | null;
  /** Set --page on this element to your page background so the ticket notches blend in. */
  className?: string;
}

// A row of theatre seats. Filled seats = the score.
const Seats: React.FC<{ filled: number; total: number }> = ({ filled, total }) => (
  <span aria-hidden="true" className="flex gap-[3px]">
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        className="h-3 w-2 rounded-t-[5px] rounded-b-[2px]"
        style={{ backgroundColor: i < filled ? GOLD : 'rgba(255,255,255,0.12)' }}
      />
    ))}
  </span>
);

const Notch: React.FC<{ className: string }> = ({ className }) => (
  <span aria-hidden="true" className={`absolute h-5 w-5 rounded-full bg-[var(--page,#060811)] ${className}`} />
);

export const CineVibeMeter: React.FC<CineVibeMeterProps> = ({
  movie,
  runtime,
  imdbRating,
  omdbData,
  className = '',
}) => {
  const releaseDate = (movie as any).release_date || (movie as any).first_air_date;
  const isReleased = useMemo(() => !!releaseDate && new Date(releaseDate) <= new Date(), [releaseDate]);

  const multiRatings: MultiSourceRatings = useMemo(
    () => ({
      imdbRating: omdbData?.imdbRating ?? imdbRating,
      rottenTomatoes: omdbData?.rottenTomatoesNum,
      metascore: omdbData?.metascore,
      tmdbRating: movie.vote_average,
      tmdbVoteCount: movie.vote_count,
      awards: omdbData?.awards,
    }),
    [omdbData, imdbRating, movie.vote_average, movie.vote_count]
  );

  const intel = useMemo(
    () => calculateIntelligentScore(movie, runtime, multiRatings),
    [movie, runtime, multiRatings]
  );

  const sources: Source[] = useMemo(() => {
    const list: Source[] = [];
    const valid = (n: unknown) => n != null && !isNaN(Number(n)) && Number(n) > 0;

    const imdb = omdbData?.imdbRating ?? imdbRating;
    const rt = omdbData?.rottenTomatoesNum;
    const meta = omdbData?.metascore;

    if (valid(imdb)) list.push({ key: 'imdb', label: 'IMDb', value: Number(imdb) * 10, display: `${Number(imdb).toFixed(1)}/10` });
    if (valid(rt)) list.push({ key: 'rt', label: 'Rotten Tomatoes', value: Number(rt), display: `${rt}%` });
    if (valid(meta)) list.push({ key: 'meta', label: 'Metacritic', value: Number(meta), display: `${meta}/100` });
    if (valid(movie.vote_average)) list.push({ key: 'tmdb', label: 'TMDB', value: movie.vote_average * 10, display: `${movie.vote_average.toFixed(1)}/10` });

    return list;
  }, [omdbData, imdbRating, movie.vote_average]);

  if (!isReleased) return null;

  const b = intel.breakdown;
  const strengths = [
    { key: 'story', label: 'Story', val: b?.storyCraft ?? 80 },
    { key: 'immersion', label: 'Look and sound', val: b?.immersion ?? 75 },
    { key: 'resonance', label: 'Emotional impact', val: b?.resonance ?? 78 },
    { key: 'rewatch', label: 'Worth rewatching', val: b?.rewatchability ?? 72 },
  ];

  return (
    <section
      aria-label="How critics and audiences rated this film"
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101118] text-white sm:flex-row ${className}`}
    >
      {/* thin inner frame, like the printed border on a real ticket */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-xl border border-white/[0.05]" />

      {/* ── Main ticket ── */}
      <div className="relative min-w-0 flex-1 p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold" style={{ color: GOLD }}>Admit one</p>
          <p className="text-xs text-white/40">{sources.length} {sources.length === 1 ? 'site' : 'sites'} · {intel.confidence} confidence</p>
        </div>

        <h3 className="mt-2 font-display text-2xl sm:text-3xl font-bold">{intel.verdict}</h3>
        {intel.consensusDescription && (
          <p className="mt-1.5 max-w-[60ch] text-sm text-white/50">{intel.consensusDescription}</p>
        )}

        {sources.length > 0 && (
          <div className="mt-7">
            <h4 className="text-sm font-semibold text-white/85">Ratings by site</h4>
            <ul className="mt-3">
              {sources.map((s) => (
                <li
                  key={s.key}
                  className="grid grid-cols-[6.5rem_1fr_3.5rem] sm:grid-cols-[8rem_1fr_4rem] items-center gap-3 border-b border-dashed border-white/10 py-2.5"
                >
                  <span className="truncate text-sm text-white/70">{s.label}</span>
                  <Seats filled={Math.round(Math.min(100, s.value) / 10)} total={10} />
                  <span className="text-right text-sm font-semibold tabular-nums">{s.display}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-white/35">Each seat = 10 points.</p>
          </div>
        )}

        <div className="mt-7">
          <h4 className="text-sm font-semibold text-white/85">What it does well</h4>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
            {strengths.map((a) => (
              <li key={a.key} className="flex items-center justify-between gap-3 border-b border-dashed border-white/10 py-2.5">
                <span className="text-sm text-white/70">{a.label}</span>
                <span className="flex items-center gap-2.5">
                  <Seats filled={Math.max(1, Math.round(a.val / 20))} total={5} />
                  <span className="w-[4.5rem] text-right text-sm font-semibold">{wordFor(a.val)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Perforation + stub ── */}
      <div
        className="relative flex h-32 items-center justify-center gap-5 border-t-2 border-dashed border-white/20 sm:h-auto sm:w-48 sm:flex-col sm:gap-1 sm:border-l-2 sm:border-t-0"
      >
        <span
          className="font-display text-6xl font-black leading-none tabular-nums sm:text-7xl"
          style={{ color: GOLD, textShadow: `0 0 26px ${GOLD}55` }}
        >
          {intel.overallScore}
        </span>
        <div className="text-left sm:text-center">
          <p className="text-sm font-semibold">out of 100</p>
          <p className="text-sm text-white/50">Grade {intel.grade}</p>
        </div>
        {/* barcode */}
        <span
          aria-hidden="true"
          className="mt-4 hidden h-8 w-24 opacity-30 sm:block"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #fff 0 2px, transparent 2px 4px, #fff 4px 5px, transparent 5px 8px, #fff 8px 11px, transparent 11px 13px)',
          }}
        />
      </div>

      {/* ticket notches at the perforation */}
      <Notch className="-left-2.5 bottom-32 translate-y-1/2 sm:hidden" />
      <Notch className="-right-2.5 bottom-32 translate-y-1/2 sm:hidden" />
      <Notch className="-top-2.5 right-48 hidden translate-x-1/2 sm:block" />
      <Notch className="-bottom-2.5 right-48 hidden translate-x-1/2 sm:block" />
    </section>
  );
};