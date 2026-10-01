// src/components/HomeDirectorsSpotlight.tsx — Dynamic 40+ Directors Showcase Section for Home Page
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clapperboard,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  Film,
} from 'lucide-react';
import { DirectorRow } from '@/components/directors/DirectorRow';
import { CURATED_DIRECTORS, type CuratedDirector } from '@/config/directors';

const ROTATION_INTERVAL_MS = 6000; // 6 seconds per director

export const HomeDirectorsSpotlight: React.FC = () => {
  // Use all 40+ curated directors in a continuous loop
  const directors = CURATED_DIRECTORS;

  // Start with Christopher Nolan (id 525) or the first director
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const nolanIdx = directors.findIndex((d) => d.id === 525);
    return nolanIdx >= 0 ? nolanIdx : 0;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const pillsContainerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const currentDirector: CuratedDirector = directors[currentIndex] || directors[0];

  // Advance to next director in loop
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % directors.length);
    setProgress(0);
  }, [directors.length]);

  // Go to previous director in loop
  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + directors.length) % directors.length);
    setProgress(0);
  }, [directors.length]);

  // Select a specific director
  const selectDirector = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const sectionRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(true);

  // Pause rotation when section is scrolled out of viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smoothly center the active pill strictly INSIDE the horizontal container (never scrolling the page/window)
  useEffect(() => {
    const activePill = pillRefs.current[currentDirector.id];
    const container = pillsContainerRef.current;
    if (activePill && container) {
      const pillRect = activePill.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const pillRelativeLeft = pillRect.left - containerRect.left + container.scrollLeft;
      const targetScrollLeft = pillRelativeLeft - (container.clientWidth / 2) + (activePill.clientWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [currentDirector.id]);

  // Automatic rotation loop timer with progress bar (only runs when playing, not hovered, and in viewport)
  useEffect(() => {
    if (!isPlaying || isHovered || !isIntersecting) return;

    const tickInterval = 50; // update progress bar smoothly
    const step = (tickInterval / ROTATION_INTERVAL_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + step;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, isIntersecting, goToNext]);

  return (
    <section
      ref={sectionRef}
      id="directors-spotlight"
      aria-label="Directors Vault"
      className="scroll-mt-24 pt-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Section Header with Loop & Navigation Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Title & Tagline */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Clapperboard className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-baseline gap-2">
                <span>Directors</span>
                <span className="text-[#f5c542]">Vault</span>
              </h2>
              {/* Dynamic Loop Live Indicator */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 border border-[#c9a24b]/30 text-[10px] font-mono text-[#f5c542] backdrop-blur-md">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPlaying && !isHovered ? 'bg-[#f5c542] animate-ping' : 'bg-white/40'
                  }`}
                />
                <span className="hidden xs:inline">
                  {isHovered ? 'Paused (Hovering)' : isPlaying ? 'Live Loop' : 'Paused'}
                </span>
                <span>
                  {currentIndex + 1}/{directors.length}
                </span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-white/40 mt-0.5 truncate">
              Visionary auteurs, signature filmographies &amp; masterworks
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white text-[11px] font-mono transition-all"
            title={isPlaying ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
            aria-label={isPlaying ? 'Pause Director Loop' : 'Play Director Loop'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 text-[#f5c542]" />
                <span className="hidden md:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-[#f5c542] fill-[#f5c542]" />
                <span className="hidden md:inline">Play</span>
              </>
            )}
          </button>

          {/* Prev / Next Steppers */}
          <div className="flex items-center rounded-full bg-white/[0.04] border border-white/[0.08] p-0.5">
            <button
              type="button"
              onClick={goToPrev}
              className="p-1 rounded-full text-white/60 hover:text-[#f5c542] hover:bg-white/[0.08] transition-all"
              title="Previous Director"
              aria-label="Previous Director"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-1 rounded-full text-white/60 hover:text-[#f5c542] hover:bg-white/[0.08] transition-all"
              title="Next Director"
              aria-label="Next Director"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:block w-px h-4 bg-white/10 mx-1" />

          {/* All 45+ Directors Link */}
          <Link
            to="/directors"
            className="flex items-center gap-1 text-[11px] font-mono text-[#c9a24b] hover:text-[#f5c542] transition-colors flex-shrink-0"
          >
            <span>All 45+ Directors</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Director Switcher Pills (Continuous Scrollable Loop of all 40+ Directors) ── */}
      <div
        ref={pillsContainerRef}
        role="tablist"
        aria-label="Choose Director"
        className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {directors.map((director, index) => {
          const isSelected = index === currentIndex;

          return (
            <button
              key={director.id}
              ref={(el) => {
                pillRefs.current[director.id] = el;
              }}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => selectDirector(index)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-mono transition-all duration-300 flex items-center gap-2 border select-none ${
                isSelected
                  ? 'bg-[#f5c542] text-[#1c120c] font-black border-[#f5c542] shadow-[0_0_18px_rgba(245,197,66,0.4)] scale-[1.02]'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:border-[#c9a24b]/40 hover:bg-white/[0.06]'
              }`}
            >
              {director.profilePath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${director.profilePath}`}
                  alt=""
                  className={`w-4 h-4 rounded-full object-cover transition-all ${
                    isSelected ? 'ring-1 ring-black/50 grayscale-0' : 'grayscale opacity-75'
                  }`}
                  loading="lazy"
                />
              ) : (
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-white/50'
                  }`}
                >
                  🎬
                </div>
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

      {/* ── Showcase Card: Dynamic Cinema Display with Smooth Transitions ── */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#140b10]/80 via-[#10080d]/90 to-[#0a0608] p-4 sm:p-6 backdrop-blur-md mt-2 overflow-hidden shadow-2xl transition-all">
        {/* Subtle Ambient Radial Gold Glow behind the active director */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(245,197,66,0.08)_0%,_transparent_70%)] blur-2xl" />

        {/* ── Visual Countdown Progress Bar (Fills across 6s during auto-play) ── */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-white/[0.05] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#c9a24b] to-[#f5c542] transition-all ease-linear shadow-[0_0_8px_rgba(245,197,66,0.6)]"
            style={{
              width: `${isPlaying && !isHovered ? progress : isPlaying ? progress : 0}%`,
              transitionDuration: isPlaying && !isHovered ? '50ms' : '300ms',
            }}
          />
        </div>

        {/* ── Active Director Row (Key-triggered smooth fade transition) ── */}
        <div
          key={currentDirector.id}
          className="animate-in fade-in zoom-in-[0.99] duration-300"
        >
          <DirectorRow
            id={currentDirector.id}
            fallbackName={currentDirector.name}
            era={currentDirector.era}
            initialData={{
              profilePath: currentDirector.profilePath,
              totalFilms: currentDirector.totalFilms,
              topFilms: currentDirector.topFilms,
            }}
          />
        </div>

        {/* ── Quick Discovery Strip: Direct Jump to Other Curated Masters ── */}
        <div className="pt-5 mt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#f5c542]" />
              <span>Explore More Masters in Vault</span>
            </span>
            <Link
              to="/directors"
              className="text-[11px] font-mono text-[#c9a24b]/80 hover:text-[#f5c542] transition-colors"
            >
              Search All 45+ Filmmakers →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {directors.slice(0, 8).map((m, idx) => {
              const isCurrent = m.id === currentDirector.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectDirector(idx)}
                  className={`group flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'border-[#f5c542] bg-[#c9a24b]/10 shadow-[0_0_15px_rgba(245,197,66,0.15)]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/5'
                  }`}
                >
                  {m.profilePath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${m.profilePath}`}
                      alt={m.name}
                      loading="lazy"
                      className={`w-9 h-11 rounded-lg object-cover border transition-all ${
                        isCurrent
                          ? 'border-[#f5c542] grayscale-0'
                          : 'border-white/[0.08] grayscale group-hover:grayscale-0'
                      }`}
                    />
                  ) : (
                    <div className="w-9 h-11 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
                      <Film className="w-3.5 h-3.5 text-white/30" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-display text-xs font-bold truncate transition-colors ${
                        isCurrent
                          ? 'text-[#f5c542]'
                          : 'text-white/85 group-hover:text-[#f5c542]'
                      }`}
                    >
                      {m.name}
                    </h4>
                    <p className="text-[10px] font-mono text-[#c9a24b]/70 truncate mt-0.5">
                      {m.era}
                    </p>
                    <span className="text-[9px] font-mono text-white/30 block truncate mt-0.5">
                      {m.totalFilms ? `${m.totalFilms} films` : 'Master'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Full Archive Link */}
          <div className="mt-4 text-center">
            <Link
              to="/directors"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/[0.04] hover:bg-[#c9a24b]/15 border border-[#c9a24b]/30 hover:border-[#f5c542] text-xs font-mono text-[#f5c542] transition-all group shadow-sm"
            >
              <span>Explore All 45+ Curated Directors &amp; Complete Filmographies</span>
              <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
