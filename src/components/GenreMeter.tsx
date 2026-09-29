import { memo } from "react";

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action-Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi-Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War-Politics",
};

const GENRE_PALETTE: Record<string, { bg: string; text: string; glow: string }> = {
  "Action":             { bg: "rgba(239,68,68,0.12)",   text: "#f87171", glow: "rgba(239,68,68,0.25)" },
  "Action-Adventure":   { bg: "rgba(239,68,68,0.12)",   text: "#f87171", glow: "rgba(239,68,68,0.25)" },
  "Adventure":          { bg: "rgba(251,146,60,0.12)",  text: "#fb923c", glow: "rgba(251,146,60,0.25)" },
  "Animation":          { bg: "rgba(167,139,250,0.12)", text: "#a78bfa", glow: "rgba(167,139,250,0.25)" },
  "Comedy":             { bg: "rgba(250,204,21,0.12)",  text: "#fde047", glow: "rgba(250,204,21,0.25)" },
  "Crime":              { bg: "rgba(107,114,128,0.18)", text: "#9ca3af", glow: "rgba(107,114,128,0.3)" },
  "Documentary":        { bg: "rgba(34,197,94,0.10)",   text: "#4ade80", glow: "rgba(34,197,94,0.2)" },
  "Drama":              { bg: "rgba(99,102,241,0.12)",  text: "#818cf8", glow: "rgba(99,102,241,0.25)" },
  "Family":             { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", glow: "rgba(251,191,36,0.25)" },
  "Fantasy":            { bg: "rgba(139,92,246,0.12)",  text: "#c084fc", glow: "rgba(139,92,246,0.25)" },
  "History":            { bg: "rgba(180,83,9,0.15)",    text: "#d97706", glow: "rgba(180,83,9,0.3)" },
  "Horror":             { bg: "rgba(220,38,38,0.15)",   text: "#dc2626", glow: "rgba(220,38,38,0.3)" },
  "Music":              { bg: "rgba(236,72,153,0.12)",  text: "#f472b6", glow: "rgba(236,72,153,0.25)" },
  "Mystery":            { bg: "rgba(71,85,105,0.18)",   text: "#94a3b8", glow: "rgba(71,85,105,0.3)" },
  "Romance":            { bg: "rgba(244,114,182,0.12)", text: "#fb7185", glow: "rgba(244,114,182,0.25)" },
  "Sci-Fi":             { bg: "rgba(6,182,212,0.12)",   text: "#22d3ee", glow: "rgba(6,182,212,0.25)" },
  "Sci-Fi-Fantasy":     { bg: "rgba(6,182,212,0.12)",   text: "#22d3ee", glow: "rgba(6,182,212,0.25)" },
  "Thriller":           { bg: "rgba(239,68,68,0.10)",   text: "#fca5a5", glow: "rgba(239,68,68,0.2)" },
  "War":                { bg: "rgba(120,113,108,0.18)", text: "#a8a29e", glow: "rgba(120,113,108,0.3)" },
  "War-Politics":       { bg: "rgba(120,113,108,0.18)", text: "#a8a29e", glow: "rgba(120,113,108,0.3)" },
  "Western":            { bg: "rgba(161,98,7,0.15)",    text: "#ca8a04", glow: "rgba(161,98,7,0.3)" },
  "Kids":               { bg: "rgba(52,211,153,0.12)",  text: "#34d399", glow: "rgba(52,211,153,0.25)" },
  "Reality":            { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b", glow: "rgba(245,158,11,0.25)" },
  "News":               { bg: "rgba(14,165,233,0.12)",  text: "#38bdf8", glow: "rgba(14,165,233,0.25)" },
  "Talk":               { bg: "rgba(168,85,247,0.12)",  text: "#d946ef", glow: "rgba(168,85,247,0.25)" },
  "Soap":               { bg: "rgba(236,72,153,0.10)",  text: "#ec4899", glow: "rgba(236,72,153,0.2)" },
  "TV Movie":           { bg: "rgba(99,102,241,0.10)",  text: "#818cf8", glow: "rgba(99,102,241,0.2)" },
};

const DEFAULT_PALETTE = { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.45)", glow: "transparent" };

interface GenreMeterProps {
  genreIds: number[];
  max?: number;
}

export const GenreMeter = memo(({ genreIds, max = 2 }: GenreMeterProps) => {
  if (!genreIds || genreIds.length === 0) return null;
  const genres = genreIds.map((id) => GENRE_MAP[id]).filter(Boolean).slice(0, max);
  if (genres.length === 0) return null;

  return (
    <div
      aria-label="Genres"
      style={{
        display: "flex",
        gap: "4px",
        flexWrap: "nowrap",
        alignItems: "center",
        marginTop: "5px",
        overflow: "hidden",
      }}
    >
      {genres.map((name) => {
        const p = GENRE_PALETTE[name] ?? DEFAULT_PALETTE;
        return (
          <span
            key={name}
            title={name}
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 1,
              minWidth: 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              paddingInline: "7px",
              paddingBlock: "2.5px",
              borderRadius: "999px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontFamily: "inherit",
              background: p.bg,
              color: p.text,
              border: `1px solid ${p.text}30`,
              boxShadow: `0 0 7px ${p.glow}`,
            }}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
});

GenreMeter.displayName = "GenreMeter";
