// src/components/HomeDirectorsSpotlight.tsx — Directors Showcase Section for Home Page
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, ArrowRight, Film, Star, ChevronRight } from 'lucide-react';
import { DirectorRow } from '@/components/directors/DirectorRow';
import { CURATED_DIRECTORS, type CuratedDirector } from '@/config/directors';

// Featured directors with guaranteed pre-cached posters for 0ms initial rendering
const FEATURED_IDS = [525, 137427, 138, 1032, 7467, 608, 147021];

const FEATURED_DIRECTORS: CuratedDirector[] = FEATURED_IDS.map((id) =>
  CURATED_DIRECTORS.find((d) => d.id === id)
).filter((d): d is CuratedDirector => Boolean(d));

// Mini discovery cards for other masters
const OTHER_MASTERS_IDS = [240, 5026, 21684, 45400]; // Kubrick, Kurosawa, Bong Joon-ho, Greta Gerwig
const OTHER_MASTERS: CuratedDirector[] = OTHER_MASTERS_IDS.map((id) =>
  CURATED_DIRECTORS.find((d) => d.id === id)
).filter((d): d is CuratedDirector => Boolean(d));

export const HomeDirectorsSpotlight: React.FC = () => {
  const [activeId, setActiveId] = useState<number>(FEATURED_DIRECTORS[0]?.id || 525);

  const selectedDirector =
    FEATURED_DIRECTORS.find((d) => d.id === activeId) || FEATURED_DIRECTORS[0];

  return (
    <section id="directors-spotlight" className="scroll-mt-24 pt-2">
      {/* ── Section Header matching MovieGuy aesthetic ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center flex-shrink-0">
            <Clapperboard className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-baseline gap-2">
              <span>Directors</span>
              <span className="text-[#f5c542]">Vault</span>
            </h2>
            <p className="text-[11px] font-mono text-white/40 mt-0.5 truncate">
              Visionary auteurs, signature filmographies &amp; masterworks
            </p>
          </div>
        </div>

        <Link
          to="/directors"
          className="flex items-center gap-1 text-[11px] font-mono text-[#c9a24b] hover:text-[#f5c542] transition-colors flex-shrink-0"
        >
          <span>All 45+ Directors</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Director Switcher Pills (0ms Instant Switch) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEATURED_DIRECTORS.map((director) => {
          const isSelected = director.id === activeId;
          const lastName = director.name.split(' ').slice(-1)[0];

          return (
            <button
              key={director.id}
              type="button"
              onClick={() => setActiveId(director.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-mono transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-[#f5c542] text-[#1c120c] font-bold border-[#f5c542] shadow-[0_0_15px_rgba(245,197,66,0.35)]'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
              }`}
            >
              {director.profilePath && (
                <img
                  src={`https://image.tmdb.org/t/p/w92${director.profilePath}`}
                  alt=""
                  className={`w-4 h-4 rounded-full object-cover ${
                    isSelected ? 'ring-1 ring-black/40' : 'grayscale opacity-75'
                  }`}
                  loading="lazy"
                />
              )}
              <span>{director.name}</span>
              <span
                className={`text-[10px] font-mono ${
                  isSelected ? 'text-[#1c120c]/70' : 'text-white/30'
                }`}
              >
                ({director.totalFilms || '—'})
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Showcase Card: Exact Figma Director Row ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#140b10]/60 to-[#0a0608]/90 p-4 sm:p-6 backdrop-blur-sm mt-3">
        {selectedDirector && (
          <DirectorRow
            key={selectedDirector.id}
            id={selectedDirector.id}
            fallbackName={selectedDirector.name}
            era={selectedDirector.era}
            initialData={{
              profilePath: selectedDirector.profilePath,
              totalFilms: selectedDirector.totalFilms,
              topFilms: selectedDirector.topFilms,
            }}
          />
        )}

        {/* ── More Masters Preview Strip ── */}
        <div className="pt-6 mt-6 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
              More Masters in the Vault
            </span>
            <Link
              to="/directors"
              className="text-[11px] font-mono text-[#c9a24b]/70 hover:text-[#f5c542] transition-colors"
            >
              Search Any Filmmaker →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {OTHER_MASTERS.map((m) => (
              <Link
                key={m.id}
                to={`/director/${m.id}`}
                className="group flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/5 transition-all"
              >
                {m.profilePath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${m.profilePath}`}
                    alt={m.name}
                    loading="lazy"
                    className="w-10 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 border border-white/[0.08] group-hover:border-[#f5c542] transition-all"
                  />
                ) : (
                  <div className="w-10 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
                    <Film className="w-4 h-4 text-white/30" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-xs font-bold text-white/85 group-hover:text-[#f5c542] truncate transition-colors">
                    {m.name}
                  </h4>
                  <p className="text-[10px] font-mono text-[#c9a24b]/70 truncate mt-0.5">
                    {m.era}
                  </p>
                  <span className="text-[9px] font-mono text-white/30 block truncate mt-0.5">
                    {m.totalFilms ? `${m.totalFilms} films` : 'Master'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Explore Button Banner */}
          <div className="mt-5 text-center">
            <Link
              to="/directors"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-[#c9a24b]/15 border border-[#c9a24b]/30 hover:border-[#f5c542] text-xs font-mono text-[#f5c542] transition-all group shadow-sm"
            >
              <span>Explore All 45+ Curated Directors &amp; Universal Search</span>
              <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
