import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { searchMoviesByMood, type RecommendedMovie } from '@/services/aiRecommender';
import { calculateMovieVibe } from '@/lib/cineAiEngine';
import { useWatchlist } from '@/hooks/useWatchlist';
import {
  Search,
  Star,
  Compass,
  X,
  Calendar,
  Zap,
  Rocket,
  Flame,
  Moon,
  Smile,
  Heart,
  Ghost,
  Sparkles,
  User,
  Users,
  HeartHandshake,
  Play,
  AlertCircle,
  Bookmark,
  Check,
} from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';
import { toast } from 'sonner';

interface Preset {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
}

const PRESETS: Preset[] = [
  { id: 'scifi', label: 'Mind-Bending Sci-Fi', icon: Rocket, prompt: 'Mind-Bending Sci-Fi' },
  { id: 'action', label: 'Adrenaline Rush', icon: Flame, prompt: 'Adrenaline Rush' },
  { id: 'noir', label: 'Late Night Noir', icon: Moon, prompt: 'Late Night Noir' },
  { id: 'thriller', label: 'Edge-of-Seat Thriller', icon: Zap, prompt: 'Edge-of-Seat Thriller' },
  { id: 'horror', label: 'Spooky Horror', icon: Ghost, prompt: 'Spooky Horror' },
  { id: 'drama', label: 'Deeply Emotional', icon: Sparkles, prompt: 'Deeply Emotional' },
  { id: 'romance', label: 'Heartfelt Romance', icon: Heart, prompt: 'Heartfelt Romance' },
  { id: 'comedy', label: 'Pure Laughs', icon: Smile, prompt: 'Pure Laughs' },
];

const SMART_INSPIRATION_CHIPS = [
  { label: '🌌 Nolan-esque Mind Twists', query: 'mind bending time travel sci-fi thriller like nolan' },
  { label: '🔥 Non-Stop Adrenaline', query: 'high octane action thriller relentless pacing' },
  { label: '🔪 Dark Detective Whodunit', query: 'dark gritty detective murder mystery neo noir' },
  { label: '🌧️ Melancholic Rainy Night', query: 'atmospheric moody emotional drama rainy night' },
  { label: '🚀 Deep Space Isolation', query: 'space isolation survival high concept sci-fi' },
];

const COUPLE_MOODS = [
  { id: 'action', label: 'Action Blockbuster', icon: Flame },
  { id: 'romance', label: 'Romance & Love', icon: Heart },
  { id: 'comedy', label: 'Laughs & Comedy', icon: Smile },
  { id: 'thriller', label: 'Suspense & Mystery', icon: Zap },
  { id: 'scifi', label: 'Sci-Fi & Fantasy', icon: Rocket },
  { id: 'horror', label: 'Horror & Spooky', icon: Ghost },
  { id: 'drama', label: 'Deep Drama', icon: Sparkles },
];

interface MovieCardProps {
  movie: RecommendedMovie;
  onOpen: (id: string | number) => void;
}

function MovieCard({ movie, onOpen }: MovieCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const title = movie.title || 'Untitled';
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const rating = movie.rating ? movie.rating.toFixed(1) : null;
  const hasRating = !!rating && Number(rating) > 0;

  const posterSrc =
    movie.image_url ||
    movie.backdrop_url ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

  const handleActivate = () => {
    soundEffects.playHoverTick();
    onOpen(movie.id);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${title}${year ? `, ${year}` : ''}`}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      }}
      className="group relative flex cursor-pointer select-none flex-col touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-900 border border-white/[0.06] group-hover:border-white/25 transition-all duration-200">
        {!isImageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-white/[0.05]" />
        )}

        <img
          src={posterSrc}
          alt={title}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setIsImageLoaded(true)}
          className={`h-full w-full object-cover pointer-events-none select-none transition-all duration-300 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
        />

        {/* Top-right: Rating */}
        {hasRating && (
          <div className="pointer-events-none absolute right-2 top-2">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm border border-white/10 font-mono">
              <Star className="h-2.5 w-2.5 fill-red-500 text-red-500" />
              {rating}
            </span>
          </div>
        )}

        {/* Top-left: Match score */}
        {typeof movie.match_score === 'number' && (
          <div className="pointer-events-none absolute left-2 top-2">
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm font-mono">
              {movie.match_score}%
            </span>
          </div>
        )}
      </div>

      {/* Metadata below poster */}
      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-1 font-display text-xs sm:text-sm font-bold leading-snug text-white/85 transition-colors group-hover:text-white">
          {title}
        </h3>
        <p className="mt-0.5 flex items-center justify-between text-[11px] text-white/35 font-sans">
          <span>{year && !isNaN(year) ? year : 'Cinema'}</span>
          <span className="truncate max-w-[60%] text-right text-white/45">{movie.genre || 'Movie'}</span>
        </p>
      </div>
    </div>
  );
}

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'solo' | 'couple' | 'smart'>('solo');

  const [movies, setMovies] = useState<RecommendedMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Mind-Bending Sci-Fi');

  const [person1Mood, setPerson1Mood] = useState<string>('action');
  const [person2Mood, setPerson2Mood] = useState<string>('romance');

  const [eraFilter, setEraFilter] = useState<'all' | '2020s' | '2010s' | 'classic'>('all');

  const { watchlist } = useWatchlist();
  const requestIdRef = useRef(0);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const results = await searchMoviesByMood(query);
      if (requestId !== requestIdRef.current) return;
      setMovies(results);
    } catch (err) {
      console.error('Failed to match movies', err);
      if (requestId !== requestIdRef.current) return;
      setError('Something went wrong finding matches. Please try another vibe prompt.');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch('Mind-Bending Sci-Fi');
  }, [handleSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    soundEffects.playHoverTick();
    setSelectedPreset(null);
    handleSearch(searchQuery);
  };

  const handlePresetClick = (preset: Preset) => {
    soundEffects.playHoverTick();
    setSelectedPreset(preset.label);
    setSearchQuery('');
    handleSearch(preset.prompt);
  };

  const handleSmartChipClick = (query: string) => {
    soundEffects.playHoverTick();
    setSelectedPreset(null);
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleCoupleMatch = () => {
    soundEffects.playHoverTick();
    setSelectedPreset(null);
    const label1 = COUPLE_MOODS.find((m) => m.id === person1Mood)?.label || person1Mood;
    const label2 = COUPLE_MOODS.find((m) => m.id === person2Mood)?.label || person2Mood;
    const query = `mix of ${label1} and ${label2}`;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleSmartWatchlistMatch = () => {
    soundEffects.playHoverTick();
    setActiveTab('smart');
    setSelectedPreset(null);

    if (watchlist.length > 0) {
      const seedTitle = watchlist[0].title;
      const query = `movies like ${seedTitle} with high tension and great writing`;
      setSearchQuery(query);
      handleSearch(query);
    } else {
      const fallbackQuery = 'critically acclaimed masterpiece cinema';
      setSearchQuery(fallbackQuery);
      handleSearch(fallbackQuery);
    }
  };

  const handleOpenMovie = (id: string | number) => {
    navigate(`/movie/${id}`);
  };

  const filteredMovies = useMemo(() => {
    if (eraFilter === 'all') return movies;
    return movies.filter((movie) => {
      if (!movie.release_date) return false;
      const year = new Date(movie.release_date).getFullYear();
      if (eraFilter === '2020s') return year >= 2020;
      if (eraFilter === '2010s') return year >= 2010 && year < 2020;
      if (eraFilter === 'classic') return year < 2010;
      return true;
    });
  }, [movies, eraFilter]);

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-red-600 selection:text-white">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-32 md:pb-24 safe-bottom-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* -- Header Section -- */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/10 border border-red-500/25 text-red-500 text-xs font-mono font-bold mb-3 shadow-[0_0_12px_rgba(220,38,38,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI VIBE ENGINE 2.0</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            Discover by{' '}
            <span className="bg-gradient-to-r from-red-600 via-red-500 to-white bg-clip-text text-transparent">
              Vibe
            </span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-2.5 font-light max-w-lg mx-auto leading-relaxed">
            Describe any plot memory, mood, or let our smart algorithm match cinema to your taste.
          </p>
        </div>

        {/* -- Mode Tabs: Solo | Couple | Smart Taste -- */}
        <div className="max-w-md mx-auto mb-7">
          <div
            role="tablist"
            className="flex items-center justify-center p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl"
          >
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setActiveTab('solo');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === 'solo'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                  : 'text-white/60 hover:text-white'
                }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Solo Vibe</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setActiveTab('couple');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === 'couple'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                  : 'text-white/60 hover:text-white'
                }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Couple Mode</span>
            </button>

            <button
              onClick={handleSmartWatchlistMatch}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeTab === 'smart'
                  ? 'bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                  : 'text-white/60 hover:text-white'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
              <span>Smart Taste</span>
            </button>
          </div>
        </div>

        {/* -- Smart Taste Info Banner when in Smart Mode -- */}
        {activeTab === 'smart' && (
          <div className="max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#10131d] to-[#0c0e15] border border-red-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Personalized Watchlist Taste</p>
                <p className="text-[11px] text-white/60">
                  {watchlist.length > 0
                    ? `Matching high-synergy cinema to your saved movie: "${watchlist[0].title}"`
                    : 'Save films to your watchlist to enable 100% custom AI recommendations.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/watchlist')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex-shrink-0 cursor-pointer"
            >
              Watchlist ({watchlist.length})
            </button>
          </div>
        )}

        {/* -- Search Bar & Quick Inspiration Chips -- */}
        <div className="max-w-2xl mx-auto mb-7">
          {activeTab !== 'couple' ? (
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Describe a plot memory or vibe (e.g. time travel thriller, guy stuck on mars)..."
                aria-label="Describe a movie vibe to search for"
                className="w-full h-12 pl-11 pr-32 rounded-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-[#0d1017] border border-white/10 focus:border-red-600/70 text-white placeholder-white/35 text-xs font-medium focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-28 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-1.5 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-red-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isLoading ? 'Matching...' : 'Match Vibe'}</span>
              </button>
            </form>
          ) : (
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0e111a] border border-white/10 backdrop-blur-xl shadow-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="partner1-mood" className="text-[11px] font-mono text-red-500 uppercase tracking-wider block mb-2 font-bold">
                    Partner 1 Preference
                  </label>
                  <select
                    id="partner1-mood"
                    value={person1Mood}
                    onChange={(e) => setPerson1Mood(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    {COUPLE_MOODS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="partner2-mood" className="text-[11px] font-mono text-white/80 uppercase tracking-wider block mb-2 font-bold">
                    Partner 2 Preference
                  </label>
                  <select
                    id="partner2-mood"
                    value={person2Mood}
                    onChange={(e) => setPerson2Mood(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-red-600 cursor-pointer"
                  >
                    {COUPLE_MOODS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCoupleMatch}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>{isLoading ? 'Calculating Compromise...' : 'Calculate Compromise Match'}</span>
              </button>
            </div>
          )}

          {/* Quick Smart Inspiration Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-2.5 px-1 mt-1">
            <span className="text-[10.5px] font-mono text-white/40 flex-shrink-0 mr-1">Inspirations:</span>
            {SMART_INSPIRATION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSmartChipClick(chip.query)}
                className="px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] hover:border-red-500/40 border border-white/5 text-[11px] text-white/70 hover:text-white transition-all flex-shrink-0 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* -- Aesthetic Mood Presets (Clean, Modern Pill Matrix) -- */}
        {activeTab === 'solo' && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3 text-white/50 text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-red-500" />
                Curated Aesthetic Presets
              </span>
              <span className="text-[11px] text-white/40">Click any vibe to recalibrate</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPreset === preset.label;

                return (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    aria-pressed={isSelected}
                    className={`group flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${isSelected
                        ? 'bg-red-600 text-white font-bold border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.35)] scale-[1.02]'
                        : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.07] hover:border-red-500/40 text-white/80 hover:text-white'
                      }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-red-400 group-hover:text-red-300'
                        }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* -- Filters & Results Bar -- */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-white/[0.08] text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            <span className="font-mono">Era:</span>
            <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/5">
              {(['all', '2020s', '2010s', 'classic'] as const).map((era) => (
                <button
                  key={era}
                  onClick={() => {
                    soundEffects.playHoverTick();
                    setEraFilter(era);
                  }}
                  aria-pressed={eraFilter === era}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition-all cursor-pointer ${eraFilter === era
                      ? 'bg-red-600 text-white font-bold shadow-sm'
                      : 'hover:text-white text-white/60'
                    }`}
                >
                  {era}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-mono text-white/80 font-semibold">
              {filteredMovies.length} Curated Matches
            </span>
          </div>
        </div>

        {/* -- Error Notification -- */}
        {error && (
          <div className="mb-6 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs shadow-md">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* -- Movie Results Grid with Refined Vertical Posters -- */}
        {isLoading ? (
          <div className="h-72 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
            <span className="text-xs text-white/60 font-mono tracking-wide">
              Scanning semantic cinema embeddings & matching vibe...
            </span>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 text-white/40 text-xs font-mono">
            No matches found for this filter. Try selecting "All" eras or another vibe preset.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpen={handleOpenMovie}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;
