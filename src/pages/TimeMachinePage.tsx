import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import { tmdb, type Movie } from '@/services/tmdb';
import { soundEffects } from '@/lib/soundEffects';
import { ChevronLeft, ChevronRight, Clapperboard } from 'lucide-react';

interface EraFact {
  year: number;
  headline: string;
  culturalNote: string;
}

const ERA_FACTS: Record<number, Omit<EraFact, 'year'>> = {
  1972: { headline: 'The rise of New Hollywood', culturalNote: 'The Godfather and Cabaret redefine cinematic realism and auteur prestige.' },
  1977: { headline: 'A cultural galaxy awakens', culturalNote: 'Star Wars creates the modern blockbuster and pioneers visual effects.' },
  1979: { headline: 'Cosmic dread & raw warfare', culturalNote: 'Alien and Apocalypse Now push horror and war filmmaking to new heights.' },
  1982: { headline: 'The golden summer of sci-fi', culturalNote: 'Blade Runner, The Thing, and E.T. arrive in one historic summer.' },
  1984: { headline: 'High-octane eighties zeitgeist', culturalNote: 'The Terminator, Ghostbusters, and Beverly Hills Cop define the decade.' },
  1989: { headline: 'Blockbuster apex of the 80s', culturalNote: 'Batman and Indiana Jones usher in high-concept theatrical fever.' },
  1993: { headline: 'The CGI revolution begins', culturalNote: 'Jurassic Park showcases digital spectacle as Schindler\u2019s List wins reverence.' },
  1994: { headline: 'Cinema\u2019s greatest modern year', culturalNote: 'Pulp Fiction, Shawshank, and Forrest Gump captivate the world at once.' },
  1999: { headline: 'The millennium awakening', culturalNote: 'The Matrix, Fight Club, and The Sixth Sense open a new epoch.' },
  2001: { headline: 'Epic fantasy revolution', culturalNote: 'Fellowship of the Ring, Harry Potter, and Spirited Away launch sagas.' },
  2004: { headline: 'Peak indie & comic authenticity', culturalNote: 'Eternal Sunshine, Spider-Man 2, and Mean Girls showcase the decade.' },
  2008: { headline: 'The modern heroic era', culturalNote: 'The Dark Knight, Iron Man, and WALL-E redefine cinematic heroism.' },
  2014: { headline: 'Cosmic odysseys & auteur vision', culturalNote: 'Interstellar, Whiplash, and The Grand Budapest Hotel ignite audiences.' },
  2019: { headline: 'Peak theatrical phenomenon', culturalNote: 'Parasite makes Oscar history as Endgame shatters box-office records.' },
  2023: { headline: 'The Barbenheimer phenomenon', culturalNote: 'Oppenheimer and Barbie prove theatrical cinema is alive and unstoppable.' },
  2024: { headline: 'Grand spectacle return', culturalNote: 'Dune: Part Two leads a run of jaw-dropping releases back to screens.' },
};

const DECADES = [
  { label: '70s', startYear: 1977 },
  { label: '80s', startYear: 1984 },
  { label: '90s', startYear: 1994 },
  { label: '00s', startYear: 2001 },
  { label: '10s', startYear: 2014 },
  { label: '20s', startYear: 2023 },
];

const MILESTONES = [1972, 1977, 1982, 1984, 1989, 1993, 1994, 1999, 2001, 2004, 2008, 2014, 2019, 2023, 2024];

const GENRE_FILTERS = [
  { id: 0, name: 'All' },
  { id: 28, name: 'Action' },
  { id: 878, name: 'Sci-Fi' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 35, name: 'Comedy' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
];

const MIN_YEAR = 1970;
const MAX_YEAR = 2025;
const YEAR_SPAN = MAX_YEAR - MIN_YEAR;

const yearToPercent = (y: number) => ((y - MIN_YEAR) / YEAR_SPAN) * 100;

// 12 tick marks for the countdown-leader ring around the year
const RING_TICKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
  const x1 = 100 + Math.cos(angle) * 86;
  const y1 = 100 + Math.sin(angle) * 86;
  const x2 = 100 + Math.cos(angle) * 94;
  const y2 = 100 + Math.sin(angle) * 94;
  return { x1, y1, x2, y2 };
});

export const TimeMachinePage = () => {
  const [year, setYear] = useState(1999);
  const [selectedGenre, setSelectedGenre] = useState<number>(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEraMovies = useCallback(async (selectedYear: number, genreId: number) => {
    try {
      setLoading(true);
      const genreParam = genreId > 0 ? `&with_genres=${genreId}` : '';
      const voteCountGte = selectedYear < 1985 ? 30 : selectedYear < 2000 ? 70 : 120;

      let data = await tmdb.discover(
        'movie',
        `primary_release_year=${selectedYear}&sort_by=vote_count.desc&vote_count.gte=${voteCountGte}${genreParam}&page=1`
      );

      if (!data.results || data.results.length < 4) {
        data = await tmdb.discover(
          'movie',
          `primary_release_year=${selectedYear}&sort_by=vote_count.desc&vote_count.gte=10${genreParam}&page=1`
        );
      }

      setMovies((data.results || []).slice(0, 24));
    } catch (err) {
      console.error('Failed to load time machine movies', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEraMovies(year, selectedGenre);
  }, [year, selectedGenre, fetchEraMovies]);

  const handleYearChange = useCallback((newYear: number) => {
    const clamped = Math.min(MAX_YEAR, Math.max(MIN_YEAR, newYear));
    setYear(prev => {
      if (clamped === prev) return prev;
      try {
        soundEffects.playHoverTick();
      } catch {
        // ignore sound error
      }
      return clamped;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') handleYearChange(year - 1);
      else if (e.key === 'ArrowRight') handleYearChange(year + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [year, handleYearChange]);

  const currentFact = useMemo((): EraFact => {
    if (ERA_FACTS[year]) return { year, ...ERA_FACTS[year] };
    return {
      year,
      headline: `Cinematic archive of ${year}`,
      culturalNote: `Exploring theatrical releases and movie history from ${year}.`,
    };
  }, [year]);

  const currentDecadeLabel = useMemo(() => {
    if (year >= 2020) return '20s';
    if (year >= 2010) return '10s';
    if (year >= 2000) return '00s';
    if (year >= 1990) return '90s';
    if (year >= 1980) return '80s';
    return '70s';
  }, [year]);

  const sliderPercent = yearToPercent(year);

  return (
    <div className="relative min-h-screen bg-[#060810] text-white overflow-x-hidden selection:bg-[#dc2626] selection:text-white">
      <div className="fixed top-10 left-1/2 -translate-x-1/2 w-[480px] h-[360px] bg-[#dc2626]/[0.06] rounded-full blur-[150px] pointer-events-none -z-10" />

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-24">

        {/* ── Hero: countdown-leader year ring ── */}
        <div className="flex flex-col items-center text-center mb-10 sm:mb-14">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => handleYearChange(year - 1)}
              disabled={year <= MIN_YEAR}
              aria-label="Previous year"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none border border-white/[0.08]"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative w-44 h-44 sm:w-56 sm:h-56 shrink-0">
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
                <circle cx="100" cy="100" r="94" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                {RING_TICKS.map((t, i) => (
                  <line
                    key={i}
                    x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                    stroke={i % 3 === 0 ? '#dc2626' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={i % 3 === 0 ? 2.5 : 1}
                    strokeLinecap="round"
                    style={i % 3 === 0 ? { filter: 'drop-shadow(0 0 4px rgba(220,38,38,0.7))' } : undefined}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-black text-5xl sm:text-6xl text-white tracking-tight tabular-nums">
                  {year}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleYearChange(year + 1)}
              disabled={year >= MAX_YEAR}
              aria-label="Next year"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none border border-white/[0.08]"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 max-w-md">
            <p className="font-display font-black text-xl text-white tracking-tight uppercase">
              {currentFact.headline}
            </p>
            <p className="mt-1.5 text-sm text-white/60 leading-relaxed font-medium">
              {currentFact.culturalNote}
            </p>
          </div>
        </div>

        {/* ── Unified timeline: slider + milestones + decades ── */}
        <div className="max-w-2xl mx-auto mb-10 sm:mb-14 px-2">
          <div className="relative h-2.5">
            <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/10" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_12px_rgba(220,38,38,0.5)]"
              style={{ width: `${sliderPercent}%` }}
            />
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              aria-label="Select year"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-pan-x"
            />
            <div
              className="absolute top-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-[#dc2626] pointer-events-none transition-[left]"
              style={{ left: `${sliderPercent}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>

          {/* milestone dots */}
          <div className="relative h-3 mt-3">
            {MILESTONES.map((y) => (
              <button
                key={y}
                onClick={() => handleYearChange(y)}
                aria-label={`Jump to ${y}`}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-all touch-manipulation"
                style={{
                  left: `${yearToPercent(y)}%`,
                  backgroundColor: year === y ? '#ef4444' : 'rgba(255,255,255,0.22)',
                  boxShadow: year === y ? '0 0 8px #ef4444' : 'none',
                }}
              />
            ))}
          </div>

          {/* decade labels, positioned proportionally to match the track */}
          <div className="relative h-5 mt-1.5">
            {DECADES.map((d) => (
              <button
                key={d.label}
                onClick={() => handleYearChange(d.startYear)}
                className="absolute -translate-x-1/2 text-xs font-mono transition-colors touch-manipulation tracking-wider"
                style={{
                  left: `${yearToPercent(d.startYear)}%`,
                  color: currentDecadeLabel === d.label ? '#ef4444' : 'rgba(255,255,255,0.4)',
                  fontWeight: currentDecadeLabel === d.label ? 800 : 500,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Genre tabs ── */}
        <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide mb-6 border-b border-white/10 px-1">
          {GENRE_FILTERS.map((genre) => {
            const active = selectedGenre === genre.id;
            return (
              <button
                key={genre.id}
                onClick={() => {
                  soundEffects.playHoverTick();
                  setSelectedGenre(genre.id);
                }}
                className={`relative shrink-0 pb-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors touch-manipulation ${
                  active ? 'text-white' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {genre.name}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#dc2626] rounded-full shadow-[0_0_8px_#dc2626]" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Movies grid ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-white/70">
              <Clapperboard className="w-4 h-4 text-[#dc2626]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Releases from {year}</h2>
            </div>
            <span className="text-xs font-mono text-white/40">{movies.length} titles</span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#dc2626]/20 border-t-[#dc2626] animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">Traveling through cinema history</span>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-20 text-white/40 text-sm font-medium">
              No releases found for {year} in this genre.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default TimeMachinePage;