// CineVibeMeter.tsx — Critic Consensus card
// A four-axis "kite" radar for how the film feels, plus an agreement plot
// showing where each critic lands relative to the MovieGuy score.
import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { type Movie } from '@/services/tmdb';
import { type OmdbMovieData } from '@/services/omdb';
import {
  calculateIntelligentScore,
  calculateVibeChartData,
  type MultiSourceRatings,
} from '@/lib/cineAiEngine';

// ─── Helpers ────────────────────────────────────────────────────────────────
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Score → accent color (shared by the number, the kite and the grade chip)
const accentFor = (score: number) =>
  score >= 80 ? '#fbbf24' : score >= 65 ? '#10b981' : score >= 50 ? '#38bdf8' : '#ef4444';

// Small hook: flips to true on the next frame so CSS transitions can play
function useReady() {
  const [ready, setReady] = useState(reducedMotion());
  useEffect(() => {
    if (ready) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, [ready]);
  return ready;
}

// ─── Kite radar (4 axes) ────────────────────────────────────────────────────
interface Axis { label: string; value: number }

const Kite: React.FC<{ axes: [Axis, Axis, Axis, Axis]; accent: string }> = ({ axes, accent }) => {
  const ready = useReady();
  const W = 300, H = 240, cx = 150, cy = 120, R = 70;

  // top, right, bottom, left
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
  const pt = (i: number, pct: number) => `${cx + dirs[i][0] * R * (pct / 100)},${cy + dirs[i][1] * R * (pct / 100)}`;
  const ring = (pct: number) => dirs.map((_, i) => pt(i, pct)).join(' ');
  const data = axes.map((a, i) => pt(i, Math.max(0, Math.min(100, a.value)))).join(' ');

  const labelPos = [
    { x: cx, y: 16, anchor: 'middle' as const },
    { x: cx + R + 12, y: cy - 2, anchor: 'start' as const },
    { x: cx, y: cy + R + 26, anchor: 'middle' as const },
    { x: cx - R - 12, y: cy - 2, anchor: 'end' as const },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px] mx-auto overflow-visible" role="img"
      aria-label={axes.map((a) => `${a.label} ${a.value}`).join(', ')}>
      {/* Grid */}
      {[33, 66, 100].map((p) => (
        <polygon key={p} points={ring(p)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}
      {dirs.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + dirs[i][0] * R} y2={cy + dirs[i][1] * R} stroke="rgba(255,255,255,0.07)" />
      ))}

      {/* Data kite */}
      <g
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          transform: ready ? 'scale(1)' : 'scale(0)',
          transition: reducedMotion() ? 'none' : 'transform 0.9s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <polygon points={data} fill={`${accent}26`} stroke={accent} strokeWidth={2} strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 8px ${accent}66)` }} />
        {axes.map((a, i) => {
          const [x, y] = pt(i, Math.max(0, Math.min(100, a.value))).split(',');
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#0b0d13" stroke={accent} strokeWidth={2} />;
        })}
      </g>

      {/* Labels */}
      {axes.map((a, i) => (
        <text key={a.label} x={labelPos[i].x} y={labelPos[i].y} textAnchor={labelPos[i].anchor}>
          <tspan fill="rgba(255,255,255,0.5)" fontSize={10.5} fontWeight={600}>{a.label}</tspan>
          <tspan x={labelPos[i].x} dy={14} fill="#fff" fontSize={13} fontWeight={800}>{a.value}</tspan>
        </text>
      ))}
    </svg>
  );
};

// ─── Agreement plot: one lollipop per critic on a shared 0–100 scale ────────
interface Source { key: string; label: string; value: number; display: string; color: string }

const AgreementRow: React.FC<{ s: Source; consensus: number; delay: number; ready: boolean }> = ({
  s, consensus, delay, ready,
}) => {
  const v = Math.max(0, Math.min(100, s.value));
  const t = reducedMotion() ? 'none' : `width 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms`;
  return (
    <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
      <span className="text-xs font-semibold text-white/60 truncate">{s.label}</span>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        {/* stem */}
        <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
          style={{ width: ready ? `${v}%` : '0%', transition: t, backgroundColor: `${s.color}55` }} />
        {/* dot */}
        <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0d13]"
          style={{
            left: ready ? `${v}%` : '0%',
            transition: reducedMotion() ? 'none' : `left 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
            backgroundColor: s.color,
            boxShadow: `0 0 10px ${s.color}88`,
          }} />
        {/* consensus tick */}
        <div className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-white/45" style={{ left: `${consensus}%` }} />
      </div>
      <span className="text-right text-sm font-black tabular-nums" style={{ color: s.color }}>{s.display}</span>
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────
interface CineVibeMeterProps {
  movie: Movie;
  runtime?: number;
  imdbRating?: number | null;
  omdbData?: OmdbMovieData | null;
  className?: string;
}

export const CineVibeMeter: React.FC<CineVibeMeterProps> = ({
  movie, runtime, imdbRating, omdbData, className = '',
}) => {
  const ready = useReady();

  const releaseDate = (movie as any).release_date || (movie as any).first_air_date;
  const isReleased = useMemo(() => !!releaseDate && new Date(releaseDate) <= new Date(), [releaseDate]);

  const multiRatings: MultiSourceRatings = useMemo(() => ({
    imdbRating: omdbData?.imdbRating ?? imdbRating,
    rottenTomatoes: omdbData?.rottenTomatoesNum,
    metascore: omdbData?.metascore,
    tmdbRating: movie.vote_average,
    tmdbVoteCount: movie.vote_count,
    awards: omdbData?.awards,
  }), [omdbData, imdbRating, movie.vote_average, movie.vote_count]);

  const intel = useMemo(
    () => calculateIntelligentScore(movie, runtime, multiRatings),
    [movie, runtime, multiRatings]
  );
  const vibeChart = useMemo(() => calculateVibeChartData(movie), [movie]);

  const sources: Source[] = useMemo(() => {
    const list: Source[] = [];
    const imdb = omdbData?.imdbRating ?? imdbRating;
    const rt = omdbData?.rottenTomatoesNum;
    const meta = omdbData?.metascore;
    if (imdb != null) list.push({ key: 'imdb', label: 'IMDb', value: imdb * 10, display: imdb.toFixed(1), color: '#f5c518' });
    if (rt != null) list.push({ key: 'rt', label: 'Tomatoes', value: rt, display: `${rt}%`, color: rt >= 60 ? '#4ade80' : '#ef4444' });
    if (meta != null) list.push({ key: 'meta', label: 'Metascore', value: meta, display: `${meta}`, color: meta >= 61 ? '#4ade80' : meta >= 40 ? '#facc15' : '#ef4444' });
    if (movie.vote_average > 0) list.push({ key: 'tmdb', label: 'TMDB', value: movie.vote_average * 10, display: movie.vote_average.toFixed(1), color: '#01b4e4' });
    return list;
  }, [omdbData, imdbRating, movie.vote_average]);

  if (!isReleased) return null;

  const accent = accentFor(intel.overallScore);
  const b = intel.breakdown;

  return (
    <div className={`w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0b0d13] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#dc2626]/20 border border-[#dc2626]/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#dc2626]" />
          </div>
          <h3 className="font-display font-black text-sm tracking-wider uppercase text-white">Critic Consensus</h3>
        </div>
        <span className="text-xs text-white/40">
          {intel.activeSources.length} source{intel.activeSources.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-5 space-y-6">
        {/* Hero: score + kite */}
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="text-xs font-medium text-white/45">MovieGuy Score</div>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-sans font-black text-7xl leading-none tracking-tight text-white tabular-nums">
                {intel.overallScore}
              </span>
              <span
                className="rounded-lg px-2.5 py-1 text-lg font-black leading-none border"
                style={{ color: accent, backgroundColor: `${accent}1a`, borderColor: `${accent}44` }}
              >
                {intel.grade}
              </span>
            </div>
            <div className="mt-4 text-lg font-bold leading-snug text-white">{intel.verdict}</div>
            {intel.consensusDescription && (
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/45">{intel.consensusDescription}</p>
            )}
          </div>

          {b && (
            <div className="w-full sm:w-[300px]">
              <Kite
                accent={accent}
                axes={[
                  { label: 'Story & Craft', value: b.storyCraft },
                  { label: 'Immersion', value: b.immersion },
                  { label: 'Resonance', value: b.resonance },
                  { label: 'Rewatchability', value: b.rewatchability },
                ]}
              />
            </div>
          )}
        </div>

        {/* Agreement plot */}
        {sources.length > 0 && (
          <div className="space-y-3 border-t border-white/[0.06] pt-5">
            {sources.map((s, i) => (
              <AgreementRow key={s.key} s={s} consensus={intel.overallScore} delay={i * 80} ready={ready} />
            ))}
          </div>
        )}

        {/* Genre DNA */}
        {vibeChart.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-5">
            {vibeChart.map((item) => (
              <span
                key={item.name}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/65"
              >
                {item.name} <span className="font-black text-white">{item.percent}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};