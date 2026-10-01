/**
 * SeasonDetailModal.tsx
 * Uses the SAME scoring engine as MovieGuyMeter.tsx for consistency.
 * Sources: IMDb episode avg (calibrated), TMDB season (Bayesian smoothed),
 *          show-level RT & Metacritic.
 * Episode-level IMDb inflation bias is corrected via anchor blending.
 */
import { useEffect, useState, memo } from "react";
import { X, Star, Calendar, Clock, Film, BarChart2, ChevronRight, Sparkles } from "lucide-react";
import { tmdb } from "@/services/tmdb";
import { getOmdbSeasonEpisodes, type OmdbSeasonEpisode, type OmdbMovieData } from "@/services/omdb";

// ── Types ──────────────────────────────────────────────────────────────
interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
}

interface SeasonDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date?: string;
  season_number: number;
  vote_average?: number;
  vote_count?: number;
  episodes: Episode[];
}

export interface SeasonDetailModalProps {
  showId: number;
  showName: string;
  seasonNumber: number;
  imdbId?: string | null;
  showOmdbData?: OmdbMovieData | null;
  onClose: () => void;
}

// ── Tier definitions (matches MovieGuyMeter exactly) ────────────────────
type TierKey = "hardPass" | "decentWatch" | "mustWatch" | "absoluteCinema";
type VerdictDist = Record<TierKey, number>;

const TIERS: { key: TierKey; label: string; color: string }[] = [
  { key: "hardPass", label: "Hard Pass", color: "#ef4444" },
  { key: "decentWatch", label: "Decent Watch", color: "#38bdf8" },
  { key: "mustWatch", label: "Must Watch", color: "#10b981" },
  { key: "absoluteCinema", label: "Absolute Cinema", color: "#c084fc" },
];

// ── Scoring engine (same logistic + Hare-Niemeyer as MovieGuyMeter) ─────
interface SeasonScoreInput {
  /** TMDB season vote_average (0-10) */
  tmdbScore: number;
  /** TMDB season vote_count */
  tmdbVotes: number;
  /** Average episode IMDb rating from OMDB season endpoint (0-10) */
  imdbEpAvg: number | null;
  /** Show-level IMDb rating from OMDB (0-10) — used as calibration anchor */
  imdbShow: number | null;
  /** Show-level RT tomatometer (0-100) */
  rt: number | null;
  /** Show-level Metacritic (0-100) */
  meta: number | null;
  /** Unique ID for the per-season micro-signature */
  showId: number;
  seasonNumber: number;
}

function deriveSeasonDistribution(input: SeasonScoreInput): VerdictDist {
  const { tmdbScore, tmdbVotes, imdbEpAvg, imdbShow, rt, meta, showId, seasonNumber } = input;
  const sources: { score: number; weight: number }[] = [];

  // 1. IMDb — episode-level average, but corrected for systematic inflation bias.
  //    Episode raters are highly engaged fans → avg rating ~0.3-0.5 pts above show rating.
  //    We calibrate by blending with the show-level anchor when both exist.
  if (imdbEpAvg != null && imdbEpAvg > 0) {
    let calibrated = imdbEpAvg;
    if (imdbShow != null && imdbShow > 0) {
      // The show-level rating acts as a market price; episode avg is the speculative premium.
      // Blend 65% episode, 35% show-level to remove the fan-inflation bias.
      calibrated = imdbEpAvg * 0.65 + imdbShow * 0.35;
    }
    sources.push({
      score: Math.min(100, Math.max(10, calibrated * 10)),
      weight: 35,
    });
  } else if (imdbShow != null && imdbShow > 0) {
    // Fallback: no episode data, use show IMDb directly
    sources.push({
      score: Math.min(100, Math.max(10, imdbShow * 10)),
      weight: 35,
    });
  }

  // 2. Rotten Tomatoes (show-level, same calibration curve as MovieGuyMeter)
  if (rt != null && !isNaN(rt)) {
    let calibratedRt = rt;
    if (rt >= 90) calibratedRt = 84 + (rt - 90) * 1.35;
    else if (rt >= 75) calibratedRt = 70 + (rt - 75) * 0.93;
    else if (rt >= 50) calibratedRt = 50 + (rt - 50) * 0.80;
    else calibratedRt = Math.max(8, rt * 0.95);
    sources.push({ score: Math.min(100, Math.max(8, calibratedRt)), weight: 30 });
  }

  // 3. Metacritic (show-level)
  if (meta != null && !isNaN(meta) && meta > 0) {
    const calibratedMeta = meta >= 80 ? Math.min(99, meta * 1.05) : meta;
    sources.push({ score: Math.min(100, Math.max(10, calibratedMeta)), weight: 20 });
  }

  // 4. TMDB season rating (raw — no Bayesian smoothing for season-specific data;
  //    Bayesian would drag all seasons toward the prior and flatten differences).
  // When RT & Meta are absent (common for TV), give TMDB equal weight to IMDb
  // so that genuine per-season differences (e.g. 8.4 vs 7.6) move the score meaningfully.
  const hasExternal = sources.length > 0; // any RT/Meta already pushed
  const tmdbRaw = tmdbScore > 0 ? tmdbScore * 10 : 63;
  const tmdbWeight = hasExternal ? 15 : 35; // equal to IMDb when no external critics

  sources.push({
    score: Math.min(100, Math.max(10, tmdbRaw)),
    weight: sources.length > 0 ? tmdbWeight : 100,
  });

  // Weighted mean (mu)
  const totalWeight = sources.reduce((s, x) => s + x.weight, 0);
  const mu_raw = sources.reduce((s, x) => s + x.score * (x.weight / totalWeight), 0);

  // Cross-source variance → spread (also adds episode-level IMDb variance for natural diversity)
  const variance = sources.reduce(
    (s, x) => s + Math.pow(x.score - mu_raw, 2) * (x.weight / totalWeight), 0
  );
  const stdDev = Math.sqrt(variance);

  // Per-season micro-signature: incorporates both showId AND seasonNumber so each season
  // gets a unique, stable offset that scales with the score gap between seasons.
  const seed = (((showId * 9301 + seasonNumber * 49297) % 233280) / 233280);
  const microOffset = (seed - 0.5) * 2.2; // slightly wider offset for visible differentiation
  const mu = Math.min(98.5, Math.max(7.5, mu_raw + microOffset));

  const baseSpread = 6.2 + Math.min(6.0, stdDev * 0.32) + (seed - 0.5) * 1.0;
  const s = Math.max(5.0, Math.min(13.5, baseSpread));

  // Logistic CDF (same cutoffs as MovieGuyMeter)
  const logistic = (x: number) => 1 / (1 + Math.exp(-(x - mu) / s));
  const p1 = logistic(41.5), p2 = logistic(64.5), p3 = logistic(83.5);

  const rawPcts = [
    { key: "hardPass" as TierKey, val: p1 * 100 },
    { key: "decentWatch" as TierKey, val: Math.max(0, p2 - p1) * 100 },
    { key: "mustWatch" as TierKey, val: Math.max(0, p3 - p2) * 100 },
    { key: "absoluteCinema" as TierKey, val: Math.max(0, 1 - p3) * 100 },
  ];

  // Hare-Niemeyer largest-remainder rounding (exact 100% sum)
  const floored = rawPcts.map((x) => ({ key: x.key, int: Math.floor(x.val), rem: x.val - Math.floor(x.val) }));
  const rem = 100 - floored.reduce((s, x) => s + x.int, 0);
  floored.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < rem; i++) floored[i % floored.length].int++;

  const result = { hardPass: 0, decentWatch: 0, mustWatch: 0, absoluteCinema: 0 } as VerdictDist;
  for (const x of floored) result[x.key] = x.int;
  return result;
}

// ── MovieGuy composite score (0-100, for display) ──────────────────────
function calcMovieGuyScore(input: Omit<SeasonScoreInput, "showId" | "seasonNumber">): number {
  const { tmdbScore, imdbEpAvg, imdbShow, rt, meta } = input;
  const sources: { v: number; w: number }[] = [];
  if (imdbEpAvg != null && imdbEpAvg > 0) {
    const cal = imdbShow != null && imdbShow > 0 ? imdbEpAvg * 0.65 + imdbShow * 0.35 : imdbEpAvg;
    sources.push({ v: cal * 10, w: 35 });
  } else if (imdbShow != null && imdbShow > 0) {
    sources.push({ v: imdbShow * 10, w: 35 });
  }
  if (rt != null && rt > 0) sources.push({ v: rt, w: 30 });
  if (meta != null && meta > 0) sources.push({ v: meta, w: 20 });
  // Match distribution engine: TMDB gets 35 when no external critics
  const tmdbRaw = Math.max(10, (tmdbScore > 0 ? tmdbScore * 10 : 63));
  const tmdbW = sources.length > 0 ? 15 : 35;
  sources.push({ v: tmdbRaw, w: sources.length > 0 ? tmdbW : 100 });
  const tw = sources.reduce((s, x) => s + x.w, 0);
  return Math.round(sources.reduce((s, x) => s + x.v * x.w, 0) / tw);
}

// ── Colour helpers ─────────────────────────────────────────────────────
const ratingColor = (r: number) => {
  if (r >= 8.5) return { color: "#4ade80", glow: "rgba(74,222,128,0.45)" };
  if (r >= 7.5) return { color: "#a3e635", glow: "rgba(163,230,53,0.40)" };
  if (r >= 6.5) return { color: "#fbbf24", glow: "rgba(251,191,36,0.40)" };
  if (r >= 5) return { color: "#f97316", glow: "rgba(249,115,22,0.40)" };
  return { color: "#f87171", glow: "rgba(248,113,113,0.40)" };
};

const scorePct = (r: number, max = 10) => Math.round((r / max) * 100);

// ── Rating source pill ─────────────────────────────────────────────────
const SourcePill = ({
  label, value, logo, color, sub,
}: { label: string; value: string | null; logo: string; color: string; sub?: string }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl py-3 px-2 min-w-0"
    style={{
      background: value ? `${color}0f` : "rgba(255,255,255,0.03)",
      border: `1px solid ${value ? color + "28" : "rgba(255,255,255,0.06)"}`,
      flex: 1,
    }}
  >
    <span className="mb-1.5 text-[10px] font-black uppercase tracking-widest"
      style={{ color: value ? color : "rgba(255,255,255,0.3)" }}>
      {logo}
    </span>
    <span className="text-xl font-black tabular-nums leading-none"
      style={{ color: value ? "#fff" : "rgba(255,255,255,0.2)" }}>
      {value ?? "—"}
    </span>
    {sub && <span className="mt-0.5 text-[9px] text-white/30 font-medium">{sub}</span>}
    <span className="mt-1 text-[9px] font-semibold text-white/35">{label}</span>
  </div>
);

// ── Sprocket ───────────────────────────────────────────────────────────
const Sprocket = () => (
  <div style={{
    height: 6,
    backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0 9px, transparent 9px 19px)",
    borderRadius: 2,
  }} />
);

// ── Main component ─────────────────────────────────────────────────────
export const SeasonDetailModal = memo(({
  showId, showName, seasonNumber, imdbId, showOmdbData, onClose,
}: SeasonDetailModalProps) => {
  const [detail, setDetail] = useState<SeasonDetail | null>(null);
  const [omdbEps, setOmdbEps] = useState<OmdbSeasonEpisode[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [barsReady, setBarsReady] = useState(false);
  const [selectedEp, setSelectedEp] = useState<Episode | null>(null);

  useEffect(() => {
    setLoading(true); setDetail(null); setOmdbEps(null); setBarsReady(false);
    Promise.all([
      tmdb.getSeasonDetails(showId, seasonNumber).catch(() => null),
      imdbId ? getOmdbSeasonEpisodes(imdbId, seasonNumber).catch(() => null) : Promise.resolve(null),
    ]).then(([d, omdb]) => {
      setDetail(d as SeasonDetail | null);
      setOmdbEps(omdb);
      requestAnimationFrame(() => requestAnimationFrame(() => setBarsReady(true)));
    }).finally(() => setLoading(false));
  }, [showId, seasonNumber, imdbId]);

  // Scroll lock + ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // ── Derived values ─────────────────────────────────────────────────
  const tmdbScore = detail?.vote_average ?? 0;
  const tmdbVotes = detail?.vote_count ?? 0;
  const episodes = detail?.episodes ?? [];

  // IMDb: episode-level average (from OMDB season endpoint)
  const imdbRatings = omdbEps?.map((e) => e.imdbRating).filter((r): r is number => r !== null) ?? [];
  const imdbEpAvg = imdbRatings.length > 0
    ? imdbRatings.reduce((s, r) => s + r, 0) / imdbRatings.length
    : null;

  // Show-level anchors from parent OMDB data
  const imdbShow = showOmdbData?.imdbRating ?? null;
  const rt = showOmdbData?.rottenTomatoesNum ?? null;
  const meta = showOmdbData?.metascore ?? null;
  const rtStr = showOmdbData?.rottenTomatoesScore ?? null;

  // Only run scoring if we have at least TMDB
  const hasData = tmdbScore > 0;

  const scoreInput: SeasonScoreInput = {
    tmdbScore, tmdbVotes, imdbEpAvg, imdbShow,
    rt: typeof rt === 'number' ? rt : null,
    meta: typeof meta === 'number' ? meta : null,
    showId, seasonNumber,
  };

  const verdict = hasData ? deriveSeasonDistribution(scoreInput) : null;
  const movieGuyScore = hasData ? calcMovieGuyScore(scoreInput) : null;
  const recommendPct = verdict ? verdict.mustWatch + verdict.absoluteCinema : 0;
  const leadTier = verdict
    ? TIERS.reduce((b, t) => (verdict[t.key] as number) > (verdict[b.key] as number) ? t : b, TIERS[0])
    : null;

  // Calibrated IMDb display (show the blended value so user understands source)
  const displayImdb = imdbEpAvg != null
    ? (imdbShow != null ? imdbEpAvg * 0.65 + imdbShow * 0.35 : imdbEpAvg)
    : null;

  // Sources used badge
  const sourcesBadge = [
    imdbEpAvg != null && "IMDb",
    tmdbScore > 0 && "TMDB",
    rt != null && "RT",
    meta != null && "Meta",
  ].filter(Boolean).join(" · ");

  // Per-episode combined rating
  const combinedEpRating = (ep: Episode): number | null => {
    const tmdbR = ep.vote_average ?? 0;
    const imdbR = omdbEps?.find((o) => o.episode === ep.episode_number)?.imdbRating ?? null;
    if (!tmdbR && !imdbR) return null;
    if (tmdbR > 0 && imdbR != null) return tmdbR * 0.45 + imdbR * 0.55;
    return tmdbR || imdbR;
  };

  const year = detail?.air_date ? new Date(detail.air_date).getFullYear() : null;
  const palette = tmdbScore > 0 ? ratingColor(tmdbScore) : { color: "#6b7280", glow: "transparent" };

  return (
    <div role="dialog" aria-modal="true" aria-label={`Season ${seasonNumber} details`}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)" }}
    >
      <div onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] sm:max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "linear-gradient(160deg, rgba(18,20,30,0.98) 0%, rgba(8,10,16,0.99) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -8px 64px rgba(0,0,0,0.7)",
        }}
      >
        <button onClick={onClose} autoFocus aria-label="Close"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/60 transition-all hover:bg-white/[0.13] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading && (
            <div className="flex h-64 items-center justify-center gap-3 text-white/30">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
              <span className="text-sm">Loading…</span>
            </div>
          )}

          {!loading && detail && (
            <>
              {/* ── Hero ── */}
              <div className="relative min-h-[180px] overflow-hidden">
                {detail.poster_path && (
                  <img src={tmdb.getImageUrl(detail.poster_path, "w500")} alt="" aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-20 pointer-events-none"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c0e16]" />
                <div className="relative flex gap-5 p-5 pb-0 sm:gap-7 sm:p-7 sm:pb-0">
                  <div className="h-36 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-2xl sm:h-44 sm:w-[116px]">
                    <img
                      src={detail.poster_path ? tmdb.getImageUrl(detail.poster_path, "w342") : "/placeholder.svg"}
                      alt={detail.name}
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-4 min-w-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/40">{showName}</p>
                    <h2 className="text-2xl font-black text-white leading-tight sm:text-3xl">{detail.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {year && <span className="flex items-center gap-1.5 text-sm text-white/50"><Calendar className="h-3.5 w-3.5 text-white/30" />{year}</span>}
                      <span className="flex items-center gap-1.5 text-sm text-white/50"><Film className="h-3.5 w-3.5 text-white/30" />{episodes.length} episodes</span>
                      {tmdbScore > 0 && (
                        <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: palette.color }}>
                          <Star className="h-3.5 w-3.5" style={{ fill: palette.color }} />{tmdbScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Ratings row ── */}
              <div className="mx-5 mt-4 sm:mx-7">
                <p className="mb-2.5 text-[10px] font-black uppercase tracking-widest text-white/30">Ratings</p>
                <div className="flex gap-2">
                  <SourcePill
                    label="IMDb"
                    value={displayImdb != null ? displayImdb.toFixed(2) : null}
                    logo="IMDb"
                    color="#f5c518"
                    sub={imdbEpAvg != null ? "ep avg" : (imdbShow != null ? "show" : undefined)}
                  />
                  <SourcePill
                    label="TMDB"
                    value={tmdbScore > 0 ? tmdbScore.toFixed(1) : null}
                    logo="TMDB"
                    color="#01b4e4"
                    sub={tmdbScore > 0 ? "season" : undefined}
                  />
                  <SourcePill
                    label="Rotten Tomatoes"
                    value={rtStr ?? null}
                    logo="RT"
                    color="#fa320a"
                    sub={rtStr ? "show" : undefined}
                  />
                  <SourcePill
                    label="Metacritic"
                    value={meta != null ? `${meta}` : null}
                    logo="META"
                    color="#ffcc34"
                    sub={meta != null ? "show" : undefined}
                  />
                </div>
                {imdbEpAvg != null && imdbShow != null && (
                  <p className="mt-1.5 text-[9.5px] text-white/25 italic">
                    IMDb adjusted: ep avg ({imdbEpAvg.toFixed(2)}) × 65% + show ({imdbShow.toFixed(1)}) × 35% — removes episode-rating fan-inflation bias.
                  </p>
                )}
              </div>

              {/* ── Season Verdict ── */}
              {verdict && movieGuyScore !== null && (
                <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-white/[0.07] sm:mx-7"
                  style={{ background: "rgba(11,13,19,0.85)" }}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md"
                        style={{ background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.35)" }}>
                        <BarChart2 className="h-3 w-3 text-red-400" />
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-white">Season Verdict</span>
                      {sourcesBadge && (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[9px] text-white/40 font-semibold">
                          {sourcesBadge}
                        </span>
                      )}
                    </div>
                    {leadTier && (
                      leadTier.key === 'absoluteCinema' ? (
                        <span className="relative inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border border-fuchsia-400/50 bg-gradient-to-r from-fuchsia-600/30 via-purple-600/25 to-pink-600/30 text-fuchsia-100 shadow-[0_0_16px_rgba(217,70,239,0.45)] overflow-hidden">
                          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer-fast pointer-events-none" />
                          <Sparkles className="h-2.5 w-2.5 text-fuchsia-300 animate-pulse" />
                          <span className="bg-gradient-to-r from-pink-200 to-violet-300 bg-clip-text text-transparent">
                            Absolute Cinema
                          </span>
                        </span>
                      ) : (
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                          style={{ color: leadTier.color, background: `${leadTier.color}1a`, border: `1px solid ${leadTier.color}40` }}>
                          {leadTier.label}
                        </span>
                      )
                    )}
                  </div>

                  <div className="px-4 py-4 space-y-4">
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/30 font-semibold mb-1">MovieGuy Score</p>
                        <span className="text-5xl font-black tabular-nums text-white leading-none">
                          {movieGuyScore}<span className="text-2xl text-white/40">/100</span>
                        </span>
                      </div>
                      <div className="pb-1">
                        <p className="text-sm text-white/45">{recommendPct}% recommend this season</p>
                      </div>
                    </div>

                    {/* Film strip */}
                    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(4,5,8,0.9)" }}>
                      <Sprocket />
                      <div className="flex gap-1 my-2 h-12">
                        {TIERS.map((t, i) => {
                          const pct = verdict[t.key] as number;
                          if (pct <= 0) return null;
                          const isLead = t.key === leadTier?.key;
                          const isAC = t.key === 'absoluteCinema';

                          const background = isAC
                            ? 'linear-gradient(180deg, #fdf4ff 0%, #f472b6 22%, #d946ef 55%, #9333ea 82%, #4c1d95 100%)'
                            : `linear-gradient(180deg, ${t.color} 0%, ${t.color}cc 100%)`;

                          const boxShadow = isAC
                            ? (isLead
                                ? '0 0 22px rgba(217,70,239,0.75), inset 0 0 0 1px rgba(253,244,255,0.7)'
                                : '0 0 14px rgba(217,70,239,0.45), inset 0 0 0 1px rgba(245,208,254,0.35)')
                            : (isLead
                                ? `0 0 16px ${t.color}55, inset 0 0 0 1px rgba(255,255,255,0.2)`
                                : 'inset 0 0 0 1px rgba(255,255,255,0.07)');

                          return (
                            <div key={t.key} className={`rounded-md min-w-[4px] relative overflow-hidden ${isAC ? 'animate-pulse-glow' : ''}`}
                              style={{
                                flexBasis: 0,
                                flexGrow: barsReady ? pct : 0,
                                transition: `flex-grow 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 90}ms`,
                                background,
                                boxShadow,
                              }}
                            >
                              {isAC && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-shimmer-fast pointer-events-none" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <Sprocket />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                      {TIERS.map((t) => {
                        const isAC = t.key === 'absoluteCinema';
                        return (
                          <div key={t.key}>
                            <div className="flex items-center gap-1.5">
                              {isAC ? (
                                <span className="h-2 w-2 rounded-full shrink-0 bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-300 shadow-[0_0_6px_#d946ef]" />
                              ) : (
                                <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                              )}
                              <span className={`text-[10px] font-semibold ${isAC ? 'text-fuchsia-200/90 font-bold' : 'text-white/50'}`}>{t.label}</span>
                            </div>
                            <div
                              className={`mt-0.5 pl-3.5 text-lg font-black tabular-nums ${
                                isAC
                                  ? 'bg-gradient-to-r from-pink-200 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(217,70,239,0.5)]'
                                  : ''
                              }`}
                              style={!isAC ? { color: t.color } : {}}
                            >
                              {verdict[t.key]}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Overview ── */}
              {detail.overview && (
                <div className="mx-5 mt-5 sm:mx-7">
                  <p className="text-sm leading-relaxed text-white/55">{detail.overview}</p>
                </div>
              )}

              {/* ── Episode sparkline chart ── */}
              {episodes.length > 0 && (
                <div className="mx-5 mt-6 sm:mx-7">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white/80">
                    <BarChart2 className="h-3.5 w-3.5 text-red-400" />
                    Episode Ratings
                    <span className="text-[9px] text-white/25 font-normal ml-1">(combined IMDb + TMDB)</span>
                  </h3>
                  <div className="flex h-16 items-end gap-1.5">
                    {episodes.map((ep) => {
                      const r = combinedEpRating(ep) ?? 0;
                      const h = r > 0 ? scorePct(r) : 6;
                      const p = r > 0 ? ratingColor(r) : { color: "rgba(255,255,255,0.08)", glow: "transparent" };
                      return (
                        <button key={ep.id}
                          onClick={() => setSelectedEp(selectedEp?.id === ep.id ? null : ep)}
                          title={`E${ep.episode_number}: ${ep.name} — ${r > 0 ? r.toFixed(1) : "N/A"}`}
                          className="group relative flex-1 min-w-0" style={{ height: "100%", display: "flex", alignItems: "flex-end" }}
                        >
                          <div className="w-full rounded-sm"
                            style={{
                              height: barsReady ? `${h}%` : "4%",
                              background: r > 0 ? p.color : "rgba(255,255,255,0.08)",
                              opacity: selectedEp && selectedEp.id !== ep.id ? 0.3 : 1,
                              boxShadow: selectedEp?.id === ep.id ? `0 0 10px ${p.glow}` : "none",
                              transition: "height 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease",
                            }}
                          />
                          <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0c0e16] px-2 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            style={{ color: r > 0 ? p.color : "rgba(255,255,255,0.4)" }}>
                            {r > 0 ? r.toFixed(1) : "—"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[9px] text-white/25 font-medium">
                    <span>Ep 1</span><span>Ep {episodes.length}</span>
                  </div>
                </div>
              )}

              {/* ── Episodes list ── */}
              <div className="mt-6 px-5 pb-36 sm:px-7 sm:pb-12 safe-bottom-content">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white/80">
                  <ChevronRight className="h-4 w-4 text-white/30" />All Episodes
                </h3>
                <div className="space-y-3">
                  {episodes.map((ep, i) => {
                    const combined = combinedEpRating(ep);
                    const tmdbR = ep.vote_average ?? 0;
                    const imdbR = omdbEps?.find((o) => o.episode === ep.episode_number)?.imdbRating ?? null;
                    const hasR = combined !== null && combined > 0;
                    const p = hasR ? ratingColor(combined!) : { color: "#6b7280", glow: "transparent" };
                    const isSelected = selectedEp?.id === ep.id;

                    return (
                      <button key={ep.id} onClick={() => setSelectedEp(isSelected ? null : ep)}
                        className="group w-full overflow-hidden rounded-2xl border text-left transition-all duration-200"
                        style={{
                          border: `1px solid ${isSelected ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)"}`,
                          background: isSelected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                        }}
                      >
                        <div className="flex gap-3 p-3">
                          <div className="relative h-[60px] w-[106px] shrink-0 overflow-hidden rounded-lg bg-neutral-900 sm:h-[72px] sm:w-[128px]">
                            {ep.still_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-white/15"><Film className="h-6 w-6" /></div>
                            )}
                            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-black text-white/80 backdrop-blur-sm">
                              E{ep.episode_number}
                            </span>
                          </div>

                          <div className="flex flex-1 min-w-0 flex-col justify-between py-0.5">
                            <div>
                              <p className="font-bold text-white/90 text-sm leading-tight line-clamp-1 group-hover:text-white transition-colors">{ep.name}</p>
                              <div className="mt-1 flex items-center gap-3 text-[11px] text-white/35">
                                {ep.air_date && <span>{new Date(ep.air_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                                {ep.runtime && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{ep.runtime}m</span>}
                              </div>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                                  <div className="h-full rounded-full"
                                    style={{
                                      width: barsReady && hasR ? `${scorePct(combined!)}%` : "0%",
                                      background: `linear-gradient(90deg, ${p.color}, ${p.color}88)`,
                                      boxShadow: `0 0 6px ${p.glow}`,
                                      transition: `width 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 35}ms`,
                                    }}
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {imdbR != null && (
                                    <span className="text-[9px] font-bold rounded px-1.5 py-0.5 tabular-nums"
                                      style={{ background: "rgba(245,197,24,0.12)", color: "#f5c518", border: "1px solid rgba(245,197,24,0.2)" }}>
                                      ★ {imdbR.toFixed(1)}
                                    </span>
                                  )}
                                  {tmdbR > 0 && (
                                    <span className="text-[9px] font-bold rounded px-1.5 py-0.5 tabular-nums"
                                      style={{ background: "rgba(1,180,228,0.10)", color: "#01b4e4", border: "1px solid rgba(1,180,228,0.18)" }}>
                                      {tmdbR.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isSelected && ep.overview && (
                          <div className="border-t border-white/[0.05] px-3 pb-3 pt-2.5">
                            <p className="text-[12px] leading-relaxed text-white/50">{ep.overview}</p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {!loading && !detail && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-white/30">
              <p className="text-sm">Could not load season details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SeasonDetailModal.displayName = "SeasonDetailModal";
