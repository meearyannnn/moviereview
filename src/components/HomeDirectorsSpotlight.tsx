// src/components/HomeDirectorsSpotlight.tsx — Dynamic 40+ Directors Showcase Section for Home Page
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clapperboard, ArrowRight } from 'lucide-react';
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

  // Automatic rotation loop timer with progress bar (runs automatically, pauses on hover or when out of view)
  useEffect(() => {
    if (isHovered || !isIntersecting) return;

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
  }, [isHovered, isIntersecting, goToNext]);

  return (
    <section
      ref={sectionRef}
      id="directors-spotlight"
      aria-label="Directors Vault"
      className="scroll-mt-24 pt-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Clean Section Header ── */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        {/* Title & Tagline */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Clapperboard className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white flex items-baseline gap-2">
              <span>Directors</span>
              <span className="text-[#f5c542]">Vault</span>
            </h2>
            <p className="text-[11px] font-mono text-white/40 mt-0.5 truncate">
              Visionary auteurs, signature filmographies &amp; masterworks
            </p>
          </div>
        </div>

        {/* All 45+ Directors Link */}
        <Link
          to="/directors"
          className="flex items-center gap-1 text-[11px] font-mono text-[#c9a24b] hover:text-[#f5c542] transition-colors flex-shrink-0"
        >
          <span>All 45+ Directors</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Director Switcher Pills (Continuous Scrollable Loop of all 40+ Directors) ── */}
      <div
        ref={pillsContainerRef}
        role="tablist"
        aria-label="Choose Director"
        className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
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
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-mono transition-all duration-300 flex items-center gap-1.5 border select-none ${
                isSelected
                  ? 'bg-[#f5c542] text-[#1c120c] font-black border-[#f5c542] shadow-[0_0_14px_rgba(245,197,66,0.35)] scale-[1.02]'
                  : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:border-[#c9a24b]/40 hover:bg-white/[0.06]'
              }`}
            >
              {director.profilePath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${director.profilePath}`}
                  alt=""
                  className={`w-3.5 h-3.5 rounded-full object-cover transition-all ${
                    isSelected ? 'ring-1 ring-black/50 grayscale-0' : 'grayscale opacity-75'
                  }`}
                  loading="lazy"
                />
              ) : (
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-white/50'
                  }`}
                >
                  🎬
                </div>
              )}
              <span>{director.name}</span>
              <span
                className={`text-[9px] font-mono ${
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
      <div className="relative rounded-xl border border-white/[0.08] bg-gradient-to-b from-[#140b10]/80 via-[#10080d]/90 to-[#0a0608] p-3.5 sm:p-4 backdrop-blur-md mt-2 overflow-hidden shadow-2xl transition-all">
        {/* Subtle Ambient Radial Gold Glow behind the active director */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(245,197,66,0.08)_0%,_transparent_70%)] blur-2xl" />

        {/* ── Visual Countdown Progress Bar (Fills across 6s during auto-play) ── */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-white/[0.05] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#c9a24b] to-[#f5c542] transition-all ease-linear shadow-[0_0_8px_rgba(245,197,66,0.6)]"
            style={{
              width: `${!isHovered ? progress : 0}%`,
              transitionDuration: !isHovered ? '50ms' : '300ms',
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
      </div>
    </section>
  );
};
