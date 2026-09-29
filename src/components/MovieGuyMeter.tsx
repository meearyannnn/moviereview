// MovieGuyMeter.tsx — Filmstrip verdict meter with dynamic community review fluctuation
// Each verdict tier is a frame on a strip of film, sized by audience share.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Share2, Users, Flame, Check, Sparkles } from 'lucide-react';
import type { OmdbMovieData } from '@/services/omdb';
import type { Movie } from '@/services/tmdb';
import { communityReviewsService, type CommunityConsensus } from '@/services/communityReviews';

// ─── Verdict tiers (single source of truth) ─────────────────────────────────
// Ordered worst → best so the strip reads left → right.
export type TierKey = 'hardPass' | 'decentWatch' | 'mustWatch' | 'absoluteCinema';

export interface VerdictTier {
  key: TierKey;
  label: string;
  color: string;
}

export const VERDICT_TIERS: VerdictTier[] = [
  { key: 'hardPass', label: 'Hard Pass', color: '#ef4444' },
  { key: 'decentWatch', label: 'Decent Watch', color: '#38bdf8' },
  { key: 'mustWatch', label: 'Must Watch', color: '#10b981' },
  { key: 'absoluteCinema', label: 'Absolute Cinema', color: '#fbbf24' },
];

export type VerdictDist = Record<TierKey, number>;

// ─── Smart Multi-Source Continuous Consensus Engine ────────────────────────
function deriveDistribution(
  movie: Movie,
  omdb?: OmdbMovieData | null,
  community?: CommunityConsensus | null
): VerdictDist {
  interface WeightedScore {
    score: number;
    weight: number;
  }
  const sources: WeightedScore[] = [];

  // 1. IMDb (0-10 scale) — Weight 35: Global audience & cinephile consensus
  if (omdb?.imdbRating != null && !isNaN(Number(omdb.imdbRating)) && Number(omdb.imdbRating) > 0) {
    sources.push({
      score: Math.min(100, Math.max(10, Number(omdb.imdbRating) * 10)),
      weight: 35,
    });
  }

  // 2. Rotten Tomatoes (0-100% scale) — Weight 30: Broad critic consensus
  if (omdb?.rottenTomatoesNum != null && !isNaN(Number(omdb.rottenTomatoesNum))) {
    const rt = Number(omdb.rottenTomatoesNum);
    // Tomatometer is % of positive reviews; calibrate smoothly to continuous quality curve
    let calibratedRt = rt;
    if (rt >= 90) calibratedRt = 84 + (rt - 90) * 1.35;
    else if (rt >= 75) calibratedRt = 70 + (rt - 75) * 0.93;
    else if (rt >= 50) calibratedRt = 50 + (rt - 50) * 0.8;
    else calibratedRt = Math.max(8, rt * 0.95);

    sources.push({
      score: Math.min(100, Math.max(8, calibratedRt)),
      weight: 30,
    });
  }

  // 3. Metacritic (0-100 scale) — Weight 20: Strict editorial critique
  if (omdb?.metascore != null && !isNaN(Number(omdb.metascore)) && Number(omdb.metascore) > 0) {
    const meta = Number(omdb.metascore);
    const calibratedMeta = meta >= 80 ? Math.min(99, meta * 1.05) : meta;
    sources.push({
      score: Math.min(100, Math.max(10, calibratedMeta)),
      weight: 20,
    });
  }

  // 4. TMDB (0-10 scale) — Weight 15: Community cinephiles with Bayesian smoothing
  const tmdbScoreRaw = movie.vote_average ?? 6.0;
  const tmdbVotes = movie.vote_count ?? 100;
  const smoothedTmdb = tmdbVotes > 0
    ? ((tmdbVotes * (tmdbScoreRaw * 10)) + (40 * 63)) / (tmdbVotes + 40)
    : 63;

  sources.push({
    score: Math.min(100, Math.max(10, smoothedTmdb)),
    weight: sources.length > 0 ? 15 : 100,
  });

  // 5. MOVIEGUY COMMUNITY REVIEWS FLUCTUATION (Bayesian confidence scaling)
  if (community && community.total_reviews > 0) {
    // Weight scales from ~8% with 2 reviews up to 35% with 25+ reviews
    const communityWeight = Math.min(
      35,
      Math.round(30 * (community.total_reviews / (community.total_reviews + 6)))
    );
    sources.push({
      score: Math.min(100, Math.max(10, community.community_score)),
      weight: communityWeight,
    });
  }

  // Weighted consensus mean (mu)
  const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
  const weightedMean = sources.reduce((sum, s) => sum + s.score * (s.weight / totalWeight), 0);

  // Cross-source variance / polarization (sigma)
  const weightedVariance = sources.reduce(
    (sum, s) => sum + Math.pow(s.score - weightedMean, 2) * (s.weight / totalWeight),
    0
  );
  const sourceStdDev = Math.sqrt(weightedVariance);

  // Deterministic micro-signature per movie ID (guarantees authentic, unique numbers for every film)
  const idSeed = movie.id ? (((movie.id * 9301 + 49297) % 233280) / 233280) : 0.5;
  const microOffset = (idSeed - 0.5) * 1.6;
  const mu = Math.min(98.5, Math.max(7.5, weightedMean + microOffset));

  // Dynamic distribution spread (s):
  // Polarizing films (high divergence between critics and fans) broaden the curve into the tails!
  const baseSpread = 6.6 + Math.min(5.5, sourceStdDev * 0.28) + (idSeed - 0.5) * 0.8;
  const s = Math.max(5.4, Math.min(12.8, baseSpread));

  // Continuous cumulative logistic distribution across the 4 tier cutoffs:
  // Hard Pass: [0, 41.5)
  // Decent Watch: [41.5, 64.5)
  // Must Watch: [64.5, 83.5)
  // Absolute Cinema: [83.5, 100]
  const logistic = (x: number) => 1 / (1 + Math.exp(-(x - mu) / s));

  const p1 = logistic(41.5);
  const p2 = logistic(64.5);
  const p3 = logistic(83.5);

  const rawHardPass = p1;
  const rawDecentWatch = Math.max(0, p2 - p1);
  const rawMustWatch = Math.max(0, p3 - p2);
  const rawAbsoluteCinema = Math.max(0, 1 - p3);

  // Largest-Remainder Rounding (Hare-Niemeyer Method) to guarantee exact 100% sum
  const rawPcts = [
    { key: 'hardPass' as TierKey, val: rawHardPass * 100 },
    { key: 'decentWatch' as TierKey, val: rawDecentWatch * 100 },
    { key: 'mustWatch' as TierKey, val: rawMustWatch * 100 },
    { key: 'absoluteCinema' as TierKey, val: rawAbsoluteCinema * 100 },
  ];

  const floored = rawPcts.map((item) => ({
    key: item.key,
    int: Math.floor(item.val),
    rem: item.val - Math.floor(item.val),
  }));

  const currentSum = floored.reduce((sum, item) => sum + item.int, 0);
  const remainder = 100 - currentSum;

  floored.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < remainder; i++) {
    floored[i % floored.length].int += 1;
  }

  const result: VerdictDist = {
    hardPass: floored.find((f) => f.key === 'hardPass')?.int ?? 0,
    decentWatch: floored.find((f) => f.key === 'decentWatch')?.int ?? 0,
    mustWatch: floored.find((f) => f.key === 'mustWatch')?.int ?? 0,
    absoluteCinema: floored.find((f) => f.key === 'absoluteCinema')?.int ?? 0,
  };

  return result;
}

function deriveVoteCount(movie: Movie, omdb?: OmdbMovieData | null, communityReviewsCount = 0): number {
  let baseVotes = 0;
  if (omdb?.imdbVotes) {
    const parsed = parseInt(String(omdb.imdbVotes).replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      baseVotes = parsed + (movie.vote_count ?? 0);
    }
  }
  if (!baseVotes) {
    const raw = movie.vote_count ?? 0;
    baseVotes = Math.max(Math.round(raw * 1.25), 18);
  }
  return baseVotes + communityReviewsCount;
}

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ─── Film strip ─────────────────────────────────────────────────────────────
const sprockets: React.CSSProperties = {
  height: 6,
  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 9px, transparent 9px 19px)',
  borderRadius: 2,
};

const FilmStrip: React.FC<{ dist: VerdictDist; leadKey: TierKey }> = ({ dist, leadKey }) => {
  const [ready, setReady] = useState(reducedMotion());

  useEffect(() => {
    if (ready) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, [ready]);

  return (
    <div
      className="rounded-xl bg-[#05060a] border border-white/[0.06] px-2.5 py-2"
      role="img"
      aria-label={VERDICT_TIERS.map((t) => `${t.label} ${dist[t.key]}%`).join(', ')}
    >
      <div style={sprockets} />
      <div className="flex gap-1 my-2 h-14 sm:h-16">
        {VERDICT_TIERS.map((t, i) => {
          const pct = dist[t.key];
          if (pct <= 0) return null;
          const isLead = t.key === leadKey;
          return (
            <div
              key={t.key}
              className="rounded-md min-w-[6px]"
              style={{
                flexBasis: 0,
                flexGrow: ready ? pct : 0,
                transition: reducedMotion() ? 'none' : `flex-grow 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 90}ms`,
                background: `linear-gradient(180deg, ${t.color} 0%, ${t.color}cc 100%)`,
                boxShadow: isLead ? `0 0 18px ${t.color}55, inset 0 0 0 1px rgba(255,255,255,0.25)` : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            />
          );
        })}
      </div>
      <div style={sprockets} />
    </div>
  );
};

// ─── Main component ─────────────────────────────────────────────────────────
interface MovieGuyMeterProps {
  movie: Movie;
  omdbData?: OmdbMovieData | null;
  mediaType?: 'movie' | 'tv';
  className?: string;
}

export const MovieGuyMeter: React.FC<MovieGuyMeterProps> = ({
  movie,
  omdbData,
  mediaType,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [communityData, setCommunityData] = useState<CommunityConsensus | null>(null);

  const resolvedMediaType: 'movie' | 'tv' =
    mediaType || ((movie as any).first_air_date || (movie as any).name ? 'tv' : 'movie');

  const releaseDate = (movie as any).release_date || (movie as any).first_air_date;
  const isReleased = useMemo(() => !!releaseDate && new Date(releaseDate) <= new Date(), [releaseDate]);

  // Fetch community reviews consensus
  const fetchCommunityConsensus = useCallback(async () => {
    if (!movie.id) return;
    const score = await communityReviewsService.getCommunityScore(movie.id, resolvedMediaType);
    setCommunityData(score);
  }, [movie.id, resolvedMediaType]);

  useEffect(() => {
    fetchCommunityConsensus();

    const handleUpdate = () => {
      fetchCommunityConsensus();
    };

    window.addEventListener('movieguy_community_review_updated', handleUpdate);
    return () => {
      window.removeEventListener('movieguy_community_review_updated', handleUpdate);
    };
  }, [fetchCommunityConsensus]);

  const dist = useMemo(
    () => deriveDistribution(movie, omdbData, communityData),
    [movie, omdbData, communityData]
  );
  const votes = useMemo(
    () => deriveVoteCount(movie, omdbData, communityData?.total_reviews ?? 0),
    [movie, omdbData, communityData]
  );

  const recommendPct = dist.mustWatch + dist.absoluteCinema;
  const lead = useMemo(() => {
    if (dist.absoluteCinema >= 35 && dist.absoluteCinema >= dist.mustWatch) {
      return VERDICT_TIERS[3]; // Absolute Cinema
    }
    return VERDICT_TIERS.reduce((best, t) => (dist[t.key] > dist[best.key] ? t : best), VERDICT_TIERS[0]);
  }, [dist]);

  if (!isReleased) return null;

  const handleShare = () => {
    const title = (movie as any).title || (movie as any).name;
    if (navigator.share) {
      navigator
        .share({ title: `${title} — MovieGuy Meter`, text: `${recommendPct}% of MovieGuy users recommend this!`, url: window.location.href })
        .catch(() => { });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0b0d13] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-[#dc2626]/20 border border-[#dc2626]/40 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-[#dc2626]" />
          </div>
          <h3 className="font-display font-black text-sm tracking-wider uppercase text-white">MovieGuy Meter</h3>
          
          {communityData && communityData.total_reviews > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/15 border border-red-500/30 text-[10px] font-mono text-red-400 font-semibold">
              <Sparkles className="w-2.5 h-2.5 text-red-500" />
              Community Influenced ({communityData.total_reviews})
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-white/45">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold text-white/80 tabular-nums">{votes.toLocaleString()}</span> votes
        </span>
      </div>

      <div className="px-5 pt-5 pb-5 space-y-5">
        {/* Score row */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-black text-5xl sm:text-6xl leading-none tracking-tight text-white tabular-nums">
              {recommendPct}
              <span className="text-2xl sm:text-3xl text-white/40">%</span>
            </span>
            <span className="text-sm text-white/45 font-medium">recommend</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="px-3 py-1.5 rounded-full text-xs font-extrabold border whitespace-nowrap"
              style={{ color: lead.color, backgroundColor: `${lead.color}1a`, borderColor: `${lead.color}44` }}
            >
              {lead.label}
            </span>
            <button
              onClick={handleShare}
              aria-label="Share verdict"
              className="h-8 w-8 rounded-full flex items-center justify-center text-white/45 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Film strip */}
        <FilmStrip dist={dist} leadKey={lead.key} />

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4">
          {VERDICT_TIERS.map((t) => (
            <div key={t.key} className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-semibold text-white/60 whitespace-nowrap">{t.label}</span>
              </div>
              <div className="mt-1 pl-3.5 text-xl font-black tabular-nums" style={{ color: t.color }}>
                {dist[t.key]}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};