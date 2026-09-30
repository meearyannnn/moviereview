/**
 * GenreOrbitMeter.tsx  (redesigned)
 *
 * A film-dial genre profile for detail pages.
 *  - A 270° ring, one segment per genre, wrapped by a fine tick scale
 *    (like a lens / light-meter dial). Ticks light up in the active genre's colour.
 *  - The centre shows the active genre. Hover, focus or tap a genre in the list
 *    to move the dial to it.
 *  - Draws in once on load. Respects prefers-reduced-motion.
 */
import { memo, useState } from "react";
import { Clapperboard } from "lucide-react";

// ── Palette ────────────────────────────────────────────────────────────
type Tone = { color: string; glow: string };

const tone = (color: string, glow: string): Tone => ({ color, glow });

const GENRE_PALETTE: Record<string, Tone> = {
  "Action": tone("#f87171", "rgba(248,113,113,0.55)"),
  "Action & Adventure": tone("#f87171", "rgba(248,113,113,0.55)"),
  "Adventure": tone("#fb923c", "rgba(251,146,60,0.55)"),
  "Animation": tone("#a78bfa", "rgba(167,139,250,0.55)"),
  "Comedy": tone("#fde047", "rgba(253,224,71,0.50)"),
  "Crime": tone("#9ca3af", "rgba(156,163,175,0.50)"),
  "Documentary": tone("#4ade80", "rgba(74,222,128,0.50)"),
  "Drama": tone("#818cf8", "rgba(129,140,248,0.55)"),
  "Family": tone("#fbbf24", "rgba(251,191,36,0.55)"),
  "Fantasy": tone("#c084fc", "rgba(192,132,252,0.55)"),
  "History": tone("#d97706", "rgba(217,119,6,0.50)"),
  "Horror": tone("#ef4444", "rgba(239,68,68,0.60)"),
  "Music": tone("#f472b6", "rgba(244,114,182,0.55)"),
  "Mystery": tone("#94a3b8", "rgba(148,163,184,0.50)"),
  "Romance": tone("#fb7185", "rgba(251,113,133,0.55)"),
  "Sci-Fi": tone("#22d3ee", "rgba(34,211,238,0.55)"),
  "Sci-Fi & Fantasy": tone("#22d3ee", "rgba(34,211,238,0.55)"),
  "Thriller": tone("#fca5a5", "rgba(252,165,165,0.50)"),
  "War": tone("#a8a29e", "rgba(168,162,158,0.50)"),
  "War & Politics": tone("#a8a29e", "rgba(168,162,158,0.50)"),
  "Western": tone("#ca8a04", "rgba(202,138,4,0.50)"),
  "Kids": tone("#34d399", "rgba(52,211,153,0.55)"),
  "Reality": tone("#f59e0b", "rgba(245,158,11,0.55)"),
  "News": tone("#38bdf8", "rgba(56,189,248,0.50)"),
  "Talk": tone("#d946ef", "rgba(217,70,239,0.55)"),
  "Soap": tone("#ec4899", "rgba(236,72,153,0.50)"),
  "TV Movie": tone("#818cf8", "rgba(129,140,248,0.50)"),
};

const DEFAULT_TONE: Tone = tone("#94a3b8", "rgba(148,163,184,0.45)");

// ── Geometry ───────────────────────────────────────────────────────────
const SIZE = 176;
const C = SIZE / 2;
const RING_R = 60;      // genre ring radius
const TICK_IN = 73;     // tick scale inner radius
const TICK_OUT = 77;    // tick scale outer radius
const SWEEP = 270;      // total dial sweep in degrees
const START = -135;     // dial starts bottom-left, ends bottom-right
const TICK_COUNT = 55;
const MAX_GENRES = 5;

const polar = (r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
};

const arc = (r: number, a0: number, a1: number) => {
  const s = polar(r, a0);
  const e = polar(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

// ── Scoped styles (animations + interaction states) ────────────────────
const CSS = `
.gom-seg { transition: opacity .35s ease, stroke-width .35s ease, filter .35s ease; }
.gom-draw { stroke-dasharray: 100; stroke-dashoffset: 100; animation: gom-draw .9s cubic-bezier(.22,1,.36,1) forwards; }
.gom-tick { transition: stroke .3s ease, opacity .3s ease; }
.gom-center { animation: gom-fade .35s ease both; }
.gom-row { transition: background .25s ease, border-color .25s ease; }
.gom-row:focus-visible { outline: 2px solid rgba(255,255,255,.7); outline-offset: 2px; }
@keyframes gom-draw { to { stroke-dashoffset: 0; } }
@keyframes gom-fade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .gom-draw { animation: none; stroke-dashoffset: 0; }
  .gom-center { animation: none; }
  .gom-seg, .gom-tick, .gom-row { transition: none; }
}
`;

// ── Component ──────────────────────────────────────────────────────────
interface GenreOrbitMeterProps {
  genres: { id: number; name: string }[];
  mediaType?: "movie" | "tv";
}

export const GenreOrbitMeter = memo(({ genres, mediaType = "movie" }: GenreOrbitMeterProps) => {
  const [active, setActive] = useState(0);

  if (!genres || genres.length === 0) return null;

  const shown = genres.slice(0, MAX_GENRES);
  const total = shown.length;
  const activeGenre = shown[Math.min(active, total - 1)];
  const activeTone = GENRE_PALETTE[activeGenre.name] ?? DEFAULT_TONE;

  // Segment angles (gap must exceed the rounded cap width so segments never touch)
  const gap = total > 1 ? 9 : 0;
  const slice = (SWEEP - gap * (total - 1)) / total;
  const segs = shown.map((g, i) => {
    const a0 = START + i * (slice + gap);
    return { g, a0, a1: a0 + slice, tone: GENRE_PALETTE[g.name] ?? DEFAULT_TONE };
  });

  // Which segment owns a given angle (ticks inside a gap stay dim)
  const ownerOf = (deg: number) => segs.findIndex((s) => deg >= s.a0 - 0.5 && deg <= s.a1 + 0.5);

  return (
    <section
      aria-label="Genre profile"
      style={{
        marginTop: 16,
        width: "100%",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.05), transparent 60%), rgba(12,14,20,0.88)",
        backdropFilter: "blur(14px)",
        overflow: "hidden",
        fontFamily: "inherit",
        color: "#fff",
      }}
    >
      <style>{CSS}</style>

      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px 0",
        }}
      >
        <Clapperboard size={14} color="rgba(255,255,255,0.55)" aria-hidden="true" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          Genres
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {mediaType === "tv" ? "TV series" : "Film"}
        </span>
      </header>

      {/* Body */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 16px 18px",
        }}
      >
        {/* Dial */}
        <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
            {/* Tick scale */}
            {Array.from({ length: TICK_COUNT }, (_, t) => {
              const deg = START + (t / (TICK_COUNT - 1)) * SWEEP;
              const major = t % 6 === 0;
              const owner = ownerOf(deg);
              const lit = owner === active;
              const p0 = polar(major ? TICK_IN - 2 : TICK_IN, deg);
              const p1 = polar(TICK_OUT, deg);
              return (
                <line
                  key={t}
                  className="gom-tick"
                  x1={p0.x}
                  y1={p0.y}
                  x2={p1.x}
                  y2={p1.y}
                  stroke={lit ? activeTone.color : "#fff"}
                  strokeOpacity={lit ? 0.95 : major ? 0.22 : 0.1}
                  strokeWidth={major ? 1.4 : 1}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Track */}
            <path
              d={arc(RING_R, START, START + SWEEP)}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={8}
              strokeLinecap="round"
            />

            {/* Genre segments */}
            {segs.map(({ g, a0, a1, tone: t }, i) => {
              const on = i === active;
              return (
                <path
                  key={g.id}
                  d={arc(RING_R, a0, a1)}
                  pathLength={100}
                  fill="none"
                  stroke={t.color}
                  strokeLinecap="round"
                  className="gom-seg gom-draw"
                  strokeWidth={on ? 9 : 6}
                  style={{
                    opacity: on ? 1 : 0.4,
                    filter: on ? `drop-shadow(0 0 6px ${t.glow})` : "none",
                    animationDelay: `${i * 110}ms`,
                  }}
                />
              );
            })}
          </svg>

          {/* Centre readout */}
          <div
            key={activeGenre.id}
            className="gom-center"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0 8px",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontFamily: "ui-serif, 'Iowan Old Style', Georgia, serif",
                fontSize:
                  activeGenre.name.length > 14
                    ? 13
                    : activeGenre.name.length > 9
                    ? 14
                    : activeGenre.name.length > 6
                    ? 16
                    : 18,
                lineHeight: 1.18,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: activeTone.color,
                textShadow: `0 0 18px ${activeTone.glow}`,
                wordBreak: "keep-all",
                overflowWrap: "normal",
                maxWidth: 94,
                display: "block",
              }}
            >
              {activeGenre.name}
            </span>
            <span style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              {active === 0 ? "Main genre" : `Genre ${active + 1} of ${total}`}
            </span>
          </div>
        </div>

        {/* Genre list */}
        <ul
          style={{
            flex: "1 1 150px",
            minWidth: 150,
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {segs.map(({ g, tone: t }, i) => {
            const on = i === active;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  className="gom-row"
                  aria-pressed={on}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: `1px solid ${on ? `${t.color}40` : "transparent"}`,
                    background: on ? `${t.color}14` : "transparent",
                    color: on ? "#fff" : "rgba(255,255,255,0.65)",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: on ? 600 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: t.color,
                      boxShadow: on ? `0 0 10px ${t.glow}` : "none",
                      opacity: on ? 1 : 0.6,
                      transition: "box-shadow .25s ease, opacity .25s ease",
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {g.name}
                  </span>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                        flexShrink: 0,
                      }}
                    >
                      Main
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
});

GenreOrbitMeter.displayName = "GenreOrbitMeter";