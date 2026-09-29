// CineVibeMeter.tsx — Prestigious Critic Consensus & Film Profile Console
// Comprehensive multi-source agreement, attribute spectrum, and critical consensus.
import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, TrendingUp, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { type Movie } from '@/services/tmdb';
import { type OmdbMovieData } from '@/services/omdb';
import {
  calculateIntelligentScore,
  calculateVibeChartData,
  type MultiSourceRatings,
} from '@/lib/cineAiEngine';

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const accentFor = (score: number) => {
  if (score >= 85) return { color: '#d946ef', label: 'Masterpiece', bg: 'rgba(217, 70, 239, 0.15)', border: 'rgba(217, 70, 239, 0.4)' };
  if (score >= 78) return { color: '#10b981', label: 'Universal Acclaim', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
  if (score >= 65) return { color: '#38bdf8', label: 'Strong Consensus', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' };
  if (score >= 50) return { color: '#f59e0b', label: 'Mixed Reception', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
  return { color: '#ef4444', label: 'Critical Pan', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
};

const qualitativeLabel = (val: number) => {
  if (val >= 88) return 'Exceptional';
  if (val >= 78) return 'Superb';
  if (val >= 68) return 'Polished';
  if (val >= 55) return 'Solid';
  return 'Mixed';
};

interface Source {
  key: string;
  label: string;
  value: number; // 0-100 scale
  display: string;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface CineVibeMeterProps {
  movie: Movie;
  runtime?: number;
  imdbRating?: number | null;
  omdbData?: OmdbMovieData | null;
  className?: string;
}

export const CineVibeMeter: React.FC<CineVibeMeterProps> = ({
  movie,
  runtime,
  imdbRating,
  omdbData,
  className = '',
}) => {
  const [ready, setReady] = useState(reducedMotion());

  useEffect(() => {
    if (ready) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, [ready]);

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

    if (imdb != null && !isNaN(Number(imdb)) && Number(imdb) > 0) {
      list.push({
        key: 'imdb',
        label: 'IMDb Audience',
        value: Number(imdb) * 10,
        display: `${Number(imdb).toFixed(1)} / 10`,
        badge: 'IMDb',
        color: '#f5c518',
        bgColor: 'rgba(245, 197, 24, 0.12)',
        borderColor: 'rgba(245, 197, 24, 0.35)',
      });
    }

    if (rt != null && !isNaN(Number(rt))) {
      list.push({
        key: 'rt',
        label: 'Rotten Tomatoes',
        value: Number(rt),
        display: `${rt}% Fresh`,
        badge: 'RT',
        color: Number(rt) >= 60 ? '#ef4444' : '#6b7280',
        bgColor: Number(rt) >= 60 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(107, 114, 128, 0.12)',
        borderColor: Number(rt) >= 60 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(107, 114, 128, 0.35)',
      });
    }

    if (meta != null && !isNaN(Number(meta)) && Number(meta) > 0) {
      list.push({
        key: 'meta',
        label: 'Metacritic',
        value: Number(meta),
        display: `${meta} Metascore`,
        badge: 'META',
        color: Number(meta) >= 61 ? '#10b981' : Number(meta) >= 40 ? '#f59e0b' : '#ef4444',
        bgColor: Number(meta) >= 61 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        borderColor: Number(meta) >= 61 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)',
      });
    }

    if (movie.vote_average && movie.vote_average > 0) {
      list.push({
        key: 'tmdb',
        label: 'TMDB Cinephiles',
        value: movie.vote_average * 10,
        display: `${movie.vote_average.toFixed(1)} / 10`,
        badge: 'TMDB',
        color: '#01b4e4',
        bgColor: 'rgba(1, 180, 228, 0.12)',
        borderColor: 'rgba(1, 180, 228, 0.35)',
      });
    }

    return list;
  }, [omdbData, imdbRating, movie.vote_average]);

  if (!isReleased) return null;

  const accent = accentFor(intel.overallScore);
  const b = intel.breakdown;

  const attributes = [
    { key: 'story', label: 'Story & Craft', desc: 'Screenplay, direction & structural flow', val: b?.storyCraft ?? 80, color: '#38bdf8' },
    { key: 'immersion', label: 'Immersion', desc: 'World-building, cinematography & sound', val: b?.immersion ?? 75, color: '#a855f7' },
    { key: 'resonance', label: 'Resonance', desc: 'Thematic depth & emotional staying power', val: b?.resonance ?? 78, color: '#10b981' },
    { key: 'rewatch', label: 'Pacing & Replay', desc: 'Rhythm, momentum & replay factor', val: b?.rewatchability ?? 72, color: '#f59e0b' },
  ];

  return (
    <div className={`w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#090b10] shadow-[0_20px_48px_rgba(0,0,0,0.6)] ${className}`}>
      {/* ── Editorial Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-white/90">
              Critics Consensus & Film Profile
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/[0.04] border border-white/[0.08] text-white/70">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{intel.confidence} Confidence</span>
            <span className="text-white/30">•</span>
            <span className="text-white/50">{sources.length} Verified Sources</span>
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* ── Top Hero: Master Score + Attribute Console ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-6 items-center">
          {/* Left Column: Overall Index */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-1">
                Multi-Critic Weighted Index
              </span>
              <div className="flex items-baseline gap-3">
                <span className="font-display font-black text-6xl sm:text-7xl text-white tracking-tight leading-none tabular-nums">
                  {intel.overallScore}
                </span>
                <span className="text-2xl text-white/30 font-medium">/100</span>
                <span
                  className="px-2.5 py-1 rounded-lg text-sm font-black border uppercase tracking-wide ml-1"
                  style={{ color: accent.color, backgroundColor: accent.bg, borderColor: accent.border }}
                >
                  Grade {intel.grade}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white tracking-tight">
                {intel.verdict}
              </h4>
              {intel.consensusDescription && (
                <p className="mt-1.5 text-xs sm:text-sm text-white/50 leading-relaxed pl-3 border-l-2 border-red-500/50">
                  {intel.consensusDescription}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Attribute Spectrum (4-Dimensions) */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-red-400" />
                Film Profile Dimensions
              </span>
              <span className="text-[10px] text-white/40 font-mono">Calibrated Ratings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attributes.map((attr, idx) => {
                const targetWidth = ready ? `${attr.val}%` : '0%';
                const label = qualitativeLabel(attr.val);
                return (
                  <div key={attr.key} className="bg-black/30 border border-white/[0.04] rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/80">{attr.label}</span>
                      <span className="font-bold tabular-nums" style={{ color: attr.color }}>
                        {attr.val}<span className="text-[10px] text-white/30">/100</span>
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: targetWidth,
                          backgroundColor: attr.color,
                          boxShadow: `0 0 8px ${attr.color}88`,
                          transition: reducedMotion() ? 'none' : `width 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 75}ms`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span className="truncate pr-1">{attr.desc.split(',')[0]}</span>
                      <span className="font-medium shrink-0" style={{ color: `${attr.color}cc` }}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Mid Section: Multi-Platform Agreement Matrix ── */}
        {sources.length > 0 && (
          <div className="border-t border-white/[0.06] pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Source Agreement Breakdown
              </span>
              <span className="text-[11px] text-white/40">
                Consensus Target: <strong className="text-white font-bold">{intel.overallScore}/100</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {sources.map((s, idx) => {
                const diff = s.value - intel.overallScore;
                const diffLabel = diff > 0 ? `+${diff.toFixed(0)} pts` : diff < 0 ? `${diff.toFixed(0)} pts` : 'Even';
                const targetWidth = ready ? `${Math.min(100, Math.max(8, s.value))}%` : '0%';

                return (
                  <div
                    key={s.key}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] transition-all"
                  >
                    {/* Source brand badge */}
                    <span
                      className="px-2 py-1 rounded text-[11px] font-black shrink-0 tracking-wide"
                      style={{ color: s.color, backgroundColor: s.bgColor, border: `1px solid ${s.borderColor}` }}
                    >
                      {s.badge}
                    </span>

                    {/* Progress slider */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-white/80 truncate">{s.label}</span>
                        <span className="font-bold tabular-nums" style={{ color: s.color }}>
                          {s.display}
                        </span>
                      </div>

                      <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: targetWidth,
                            backgroundColor: s.color,
                            boxShadow: `0 0 6px ${s.color}66`,
                            transition: reducedMotion() ? 'none' : `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 60}ms`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Variance vs consensus */}
                    <span className="text-[10px] font-mono text-white/40 shrink-0 w-16 text-right">
                      {diffLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Bottom Section: Film Tasting Notes ── */}
        {vibeChart.length > 0 && (
          <div className="border-t border-white/[0.06] pt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mr-1">
              Genre DNA:
            </span>
            {vibeChart.map((item) => (
              <span
                key={item.name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.03] border border-white/[0.07] text-white/75"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                <span className="text-[11px] font-bold text-white/40">{item.percent}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};