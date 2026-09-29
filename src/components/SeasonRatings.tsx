/**
 * SeasonRatings.tsx
 * Horizontally scrollable season cards for TV detail pages.
 * Each card shows poster, season name, year, episode count, a rating dial,
 * and an animated rating bar. Animated on mount.
 */
import { memo, useEffect, useState, useRef } from "react";
import { Star, Tv, ChevronRight } from "lucide-react";
import { tmdb, type Season } from "@/services/tmdb";
import { SeasonDetailModal } from "./SeasonDetailModal";
import type { OmdbMovieData } from "@/services/omdb";

interface SeasonWithRating extends Season {
  vote_average?: number;
  air_date?: string;
}

interface SeasonRatingsProps {
  showId: number;
  showName?: string;
  imdbId?: string | null;
  showOmdbData?: OmdbMovieData | null;
  seasons: Season[];
}

// Rating colour band
const ratingColor = (r: number) => {
  if (r >= 8) return { color: "#4ade80", glow: "rgba(74,222,128,0.4)" };
  if (r >= 7) return { color: "#a3e635", glow: "rgba(163,230,53,0.35)" };
  if (r >= 6) return { color: "#fbbf24", glow: "rgba(251,191,36,0.4)" };
  if (r >= 5) return { color: "#f97316", glow: "rgba(249,115,22,0.4)" };
  return { color: "#f87171", glow: "rgba(248,113,113,0.4)" };
};

const FALLBACK = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&q=70";

export const SeasonRatings = memo(({ showId, showName = "", imdbId, showOmdbData, seasons }: SeasonRatingsProps) => {
  const [enriched, setEnriched] = useState<SeasonWithRating[]>([]);
  const [animated, setAnimated] = useState(false);
  const [openSeason, setOpenSeason] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter out season 0 (specials) & sort
  const mainSeasons = seasons
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);

  useEffect(() => {
    if (!showId || mainSeasons.length === 0) return;
    // Fetch season details in parallel (cap at 10 to avoid hammering API)
    Promise.all(
      mainSeasons.slice(0, 12).map((s) =>
        tmdb
          .getSeasonDetails(showId, s.season_number)
          .then((d) => ({
            ...s,
            vote_average: d?.vote_average ?? undefined,
            air_date: d?.air_date ?? s.air_date,
            episode_count: d?.episodes?.length ?? s.episode_count,
          }))
          .catch(() => s as SeasonWithRating)
      )
    ).then((data) => {
      setEnriched(data as SeasonWithRating[]);
      // Trigger bar animations after data lands
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
    });
  }, [showId]);

  const display = enriched.length > 0 ? enriched : (mainSeasons as SeasonWithRating[]);

  if (display.length === 0) return null;

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2.5">
        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2.5">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)" }}
          >
            <Tv className="h-3.5 w-3.5 text-red-400" />
          </span>
          Seasons
        </h2>
        <span className="text-sm text-white/30 font-medium">
          {display.length} {display.length === 1 ? "season" : "seasons"}
        </span>
      </div>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-1 flex touch-pan-x gap-4 overflow-x-auto px-1 pb-3"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {display.map((season, i) => {
          const r = season.vote_average ?? 0;
          const hasRating = r > 0;
          const palette = hasRating ? ratingColor(r) : { color: "#6b7280", glow: "transparent" };
          const pct = hasRating ? Math.round((r / 10) * 100) : 0;
          const year = season.air_date
            ? new Date(season.air_date).getFullYear()
            : null;

          return (
            <button
              key={season.id}
              onClick={() => setOpenSeason(season.season_number)}
              className="flex-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#060810] rounded-2xl"
              style={{ width: "clamp(180px, 44vw, 220px)", scrollSnapAlign: "start" }}
            >
              <div
                className="h-full rounded-2xl border border-white/[0.07] overflow-hidden transition-all duration-200 hover:border-white/20"
                style={{ background: "rgba(11,13,19,0.9)", backdropFilter: "blur(10px)" }}
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={
                      season.poster_path
                        ? tmdb.getImageUrl(season.poster_path, "w300")
                        : FALLBACK
                    }
                    alt={season.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.src = FALLBACK; }}
                  />
                  {/* Rating badge on poster */}
                  {hasRating && (
                    <div
                      className="absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5"
                      style={{
                        background: "rgba(0,0,0,0.75)",
                        border: `1px solid ${palette.color}30`,
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <Star
                        className="h-2.5 w-2.5"
                        style={{ fill: palette.color, color: palette.color }}
                      />
                      <span
                        className="text-[10px] font-black tabular-nums"
                        style={{ color: palette.color }}
                      >
                        {r.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-3.5 py-3">
                  <p className="text-xs font-black text-white leading-tight line-clamp-1">
                    {season.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/40 font-medium">
                    {[year, `${season.episode_count} ep`].filter(Boolean).join(" · ")}
                  </p>

                  {/* Rating bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[9.5px] uppercase tracking-widest font-bold text-white/30">
                        Rating
                      </span>
                      <span
                        className="text-[10px] font-black tabular-nums"
                        style={{ color: hasRating ? palette.color : "rgba(255,255,255,0.2)" }}
                      >
                        {hasRating ? `${r.toFixed(1)}/10` : "N/A"}
                      </span>
                    </div>
                    <div
                      className="h-1 w-full rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: animated ? `${pct}%` : "0%",
                          background: `linear-gradient(90deg, ${palette.color}, ${palette.color}88)`,
                          boxShadow: animated ? `0 0 8px ${palette.glow}` : "none",
                          transition: `width 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms`,
                        }}
                      />
                    </div>
                  </div>
                  {/* Click hint */}
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">
                    <ChevronRight className="h-2.5 w-2.5" />
                    View episodes
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Season Detail Modal */}
      {openSeason !== null && (
        <SeasonDetailModal
          showId={showId}
          showName={showName}
          seasonNumber={openSeason}
          imdbId={imdbId}
          showOmdbData={showOmdbData}
          onClose={() => setOpenSeason(null)}
        />
      )}
    </section>
  );
});

SeasonRatings.displayName = "SeasonRatings";
