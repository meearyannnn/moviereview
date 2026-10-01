import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  Play,
  Star,
  Sparkles,
  Compass,
  Shuffle,
} from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { useWatchlist } from '@/hooks/useWatchlist';
import { tmdb, Movie } from '@/services/tmdb';

interface ExploreHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

type SubViewType = 'none' | 'activity' | 'language' | 'personalization';

interface SmartRecommendation {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  matchScore: number;
  reason: string;
}

const POPULAR_GENRES = [
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 28, name: 'Action' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
];

export const ExploreHubModal: React.FC<ExploreHubModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const modalRef = useRef<HTMLDivElement>(null);
  const [subView, setSubView] = useState<SubViewType>('none');
  const { progressList } = useWatchProgress();
  const { watchlist } = useWatchlist();

  // Smart Personalization State
  const [selectedGenreId, setSelectedGenreId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('movieguy_smart_taste_genre');
      return saved ? parseInt(saved, 10) : 878;
    } catch {
      return 878;
    }
  });
  const [smartPicks, setSmartPicks] = useState<SmartRecommendation[]>([]);
  const [isLoadingPicks, setIsLoadingPicks] = useState(false);

  const isExplorePage = location.pathname === '/explore';
  const currentFilter = searchParams.get('filter') || '';
  const currentAnime = searchParams.get('anime') || '';
  const currentSort = searchParams.get('sort') || '';
  const currentGenre = searchParams.get('genre') || '';

  // Active status per tile
  const isFamilyFriendlyActive = currentFilter === 'family_friendly';
  const isAwardWinnerActive = currentFilter === 'award_winner';
  const isSelectActive = currentFilter === 'select';
  const isAnimeActive = currentAnime === 'only';
  const isMonthlyRankingActive = currentSort === 'popularity.desc';
  const isTop100Active = currentSort === 'vote_average.desc';
  const isGenreActive = currentGenre !== '';

  const handleToggleFilter = (key: 'filter' | 'anime' | 'sort', val: string, defaultOffVal?: string) => {
    soundEffects.playHoverTick();
    const newParams = new URLSearchParams(location.search);
    const existing = newParams.get(key);

    if (existing === val) {
      if (defaultOffVal) {
        newParams.set(key, defaultOffVal);
      } else {
        newParams.delete(key);
      }
    } else {
      newParams.set(key, val);
    }

    if (isExplorePage) {
      setSearchParams(newParams);
    } else {
      onClose();
      navigate(`/explore?${newParams.toString()}`);
    }
  };

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (subView !== 'none') {
          setSubView('none');
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, subView, onClose]);

  // Reset subview when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubView('none');
    }
  }, [isOpen]);

  // Load Smart Recommendations based on user data
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchSmartPicks = async () => {
      setIsLoadingPicks(true);
      try {
        let rawMovies: Movie[] = [];
        let reasonLabel = '';

        if (watchlist.length > 0) {
          // Seed from most recent user watchlist item
          const seedMovie = watchlist[0];
          try {
            const res = await tmdb.getRecommendations(seedMovie.id);
            if (res.results && res.results.length > 0) {
              rawMovies = res.results;
              reasonLabel = `Because you saved "${seedMovie.title}"`;
            }
          } catch {
            // fallback
          }
        }

        // If no recommendations yet, discover by selected genre
        if (rawMovies.length === 0) {
          const res = await tmdb.getByGenre(selectedGenreId);
          rawMovies = res.results || [];
          const genreObj = POPULAR_GENRES.find((g) => g.id === selectedGenreId);
          reasonLabel = `Curated for your ${genreObj?.name || 'Cinema'} taste`;
        }

        if (isMounted) {
          const transformed: SmartRecommendation[] = rawMovies
            .filter((m) => m.poster_path)
            .slice(0, 6)
            .map((m, idx) => ({
              id: m.id,
              title: m.title || m.name || 'Untitled',
              poster_path: m.poster_path,
              vote_average: m.vote_average || 7.5,
              release_date: m.release_date || m.first_air_date,
              matchScore: Math.max(88, 99 - idx * 2),
              reason: reasonLabel,
            }));
          setSmartPicks(transformed);
        }
      } catch (err) {
        console.error('Failed to load smart recommendations:', err);
      } finally {
        if (isMounted) setIsLoadingPicks(false);
      }
    };

    fetchSmartPicks();

    return () => {
      isMounted = false;
    };
  }, [isOpen, watchlist, selectedGenreId]);

  const handleSelectGenreTaste = (genreId: number) => {
    soundEffects.playHoverTick();
    setSelectedGenreId(genreId);
    try {
      localStorage.setItem('movieguy_smart_taste_genre', genreId.toString());
    } catch {
      // storage error
    }
  };

  const handleSmartSurprise = () => {
    if (smartPicks.length === 0) return;
    soundEffects.playHoverTick();
    const randomPick = smartPicks[Math.floor(Math.random() * smartPicks.length)];
    onClose();
    navigate(`/movie/${randomPick.id}`);
  };

  if (!isOpen) return null;

  const handleTileClick = (action: () => void) => {
    soundEffects.playHoverTick();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:justify-end pt-16 sm:pt-14 sm:pr-6 md:pr-12 pointer-events-none">
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs pointer-events-auto sm:hidden"
        onClick={onClose}
      />

      {/* -- Main Hub Popover Container -- */}
      <div
        ref={modalRef}
        className="relative pointer-events-auto w-[94vw] sm:w-[360px] max-w-[370px] bg-[#080a10]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/95 animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden"
      >
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#f5c542]/70 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-1 pb-2.5 mb-1.5 border-b border-white/[0.08]">
          {subView !== 'none' ? (
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setSubView('none');
              }}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors font-medium cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#f5c542]" />
              <span>Back to Hub</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f5c542] animate-pulse shadow-[0_0_8px_rgba(245,197,66,0.8)]" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/70 font-bold">
                Cinema Hub
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#c9a24b]/15 text-[#f5c542] border border-[#c9a24b]/20">
                PRO
              </span>
            </div>
          )}

          <button
            onClick={() => {
              soundEffects.playHoverTick();
              onClose();
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* -- SUBVIEW: User Personalization (Smart Feature) -- */}
        {/* ========================================================================= */}
        {subView === 'personalization' && (
          <div className="py-1 space-y-3 max-h-[460px] overflow-y-auto scrollbar-hide">
            {/* Header info */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#c9a24b]/20 via-[#140a0d] to-[#0a0608] border border-[#c9a24b]/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-[#f5c542]" />
                  Your Smart Cinema DNA
                </span>
                <span className="text-[10px] font-mono text-[#f5c542] font-bold px-1.5 py-0.5 rounded bg-[#c9a24b]/15 border border-[#c9a24b]/20">
                  {watchlist.length > 0 ? 'LIVE SYNC' : 'TASTE ENGINE'}
                </span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                {watchlist.length > 0
                  ? `Analyzing ${watchlist.length} film${watchlist.length > 1 ? 's' : ''} in your watchlist to deliver live algorithm-driven recommendations.`
                  : 'Select your preferred cinema vibe below to train your personal recommendation feed.'}
              </p>

              {/* Genre taste selector chips */}
              <div className="mt-2.5 pt-2 border-t border-white/[0.08]">
                <p className="text-[10px] font-medium text-white/50 mb-1.5">Tune your taste vibe:</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_GENRES.map((g) => {
                    const active = selectedGenreId === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => handleSelectGenreTaste(g.id)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                          active
                            ? 'bg-[#f5c542] text-[#1c120c] font-black shadow-[0_0_8px_rgba(245,197,66,0.5)]'
                            : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSmartSurprise}
                disabled={smartPicks.length === 0}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-[#c9a24b]/40 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#f5c542]" />
                <span>Smart Surprise</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  onClose();
                  navigate(`/explore?genre=${selectedGenreId}&sort=vote_average.desc`);
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-xl bg-[#f5c542] hover:bg-[#c9a24b] text-xs font-black text-[#1c120c] transition-all shadow-[0_0_12px_rgba(245,197,66,0.3)] cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Taste Feed</span>
              </button>
            </div>

            {/* Smart Recommended Titles */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                  Recommended For You
                </span>
                <span className="text-[10px] text-white/40">
                  {smartPicks.length} high-match titles
                </span>
              </div>

              {isLoadingPicks ? (
                <div className="py-8 text-center text-xs text-white/40 flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-[#f5c542] border-t-transparent animate-spin" />
                  <span>Computing taste synergy...</span>
                </div>
              ) : smartPicks.length === 0 ? (
                <div className="text-center py-6 text-white/40 text-xs">
                  Save a movie to your watchlist to unlock tailored smart recommendations!
                </div>
              ) : (
                <div className="space-y-2">
                  {smartPicks.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        soundEffects.playHoverTick();
                        onClose();
                        navigate(`/movie/${item.id}`);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#c9a24b]/40 transition-all cursor-pointer group"
                    >
                      <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                        <img
                          src={tmdb.getImageUrl(item.poster_path, 'w185')}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 fill-[#f5c542] text-[#f5c542]" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-white group-hover:text-[#f5c542] truncate">
                            {item.title}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-[#f5c542] bg-[#c9a24b]/15 px-1 py-0.5 rounded border border-[#c9a24b]/20 flex-shrink-0">
                            {item.matchScore}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            <span>{item.vote_average.toFixed(1)}</span>
                          </div>
                          {item.release_date && (
                            <span className="text-[10px] text-white/40">
                              {new Date(item.release_date).getFullYear()}
                            </span>
                          )}
                        </div>
                        <p className="text-[9.5px] text-white/50 truncate mt-0.5 italic">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* -- SUBVIEW: Following Activity -- */}
        {/* ========================================================================= */}
        {subView === 'activity' && (
          <div className="py-2 space-y-3 max-h-[420px] overflow-y-auto scrollbar-hide">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider px-1">
              Your Watching Activity
            </h3>

            {progressList.length === 0 && watchlist.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs">
                No watching activity yet. Start saving movies to track your activity!
              </div>
            ) : (
              <div className="space-y-2">
                {progressList.slice(0, 4).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      onClose();
                      navigate(`/${item.type || 'movie'}/${item.id}`);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
                  >
                    <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img
                        src={item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w185') : '/placeholder.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 fill-[#f5c542] text-[#f5c542]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-[#f5c542] truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-white/50 capitalize mt-0.5">
                        {item.type === 'tv' ? 'TV Series' : 'Movie'}
                      </p>
                    </div>
                  </div>
                ))}

                {watchlist.slice(0, 4).map((item) => (
                  <div
                    key={`wl-${item.id}`}
                    onClick={() => {
                      onClose();
                      navigate(`/${item.media_type || 'movie'}/${item.id}`);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
                  >
                    <div className="w-12 aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img
                        src={item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w185') : '/placeholder.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-[#f5c542] truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[#f5c542] font-bold mt-0.5">
                        In Watchlist
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* -- SUBVIEW: Language Selection -- */}
        {/* ========================================================================= */}
        {subView === 'language' && (
          <div className="py-2 space-y-2">
            <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider px-1 mb-2">
              Browse by Language
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'English', query: 'English audio' },
                { name: 'Hindi', query: 'Hindi audio' },
                { name: 'Korean', query: 'Korean audio' },
                { name: 'Japanese', query: 'Japanese anime' },
                { name: 'Spanish', query: 'Spanish' },
                { name: 'French', query: 'French cinema' },
              ].map((lang) => (
                <button
                  key={lang.name}
                  onClick={() => {
                    soundEffects.playHoverTick();
                    onClose();
                    navigate(`/search?q=${encodeURIComponent(lang.query)}`);
                  }}
                  className="p-2.5 rounded-xl bg-[#140a0d]/80 hover:bg-[#1a0f14] border border-white/[0.06] hover:border-[#c9a24b]/40 text-center transition-all group cursor-pointer"
                >
                  <span className="text-xs text-white/80 group-hover:text-[#f5c542] font-bold">
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* -- MAIN VIEW: Ultra-Aesthetic Red & White Cinema Grid -- */}
        {/* ========================================================================= */}
        {subView === 'none' && (
          <div className="space-y-2 pt-1">
            {/* -- 1. HERO FEATURE: Smart Personalization (For You) -- */}
            <button
              onClick={() => handleTileClick(() => setSubView('personalization'))}
              className="w-full relative group overflow-hidden rounded-xl p-3 flex items-center justify-between transition-all duration-300 cursor-pointer border border-[#c9a24b]/40 bg-gradient-to-r from-[#c9a24b]/25 via-[#140a0d] to-[#0a0608] hover:border-[#f5c542] hover:shadow-[0_0_20px_rgba(245,197,66,0.25)] text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#c9a24b]/20 border border-[#c9a24b]/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-[#f5c542] transition-all">
                  <Sparkles className="w-5 h-5 text-[#f5c542] group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      Personalized For You
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#f5c542] text-[#1c120c] shadow-[0_0_6px_rgba(245,197,66,0.6)]">
                      SMART
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 truncate mt-0.5">
                    {watchlist.length > 0
                      ? `Tuned to your ${watchlist.length} saved film${watchlist.length > 1 ? 's' : ''}`
                      : 'Live algorithm-matched cinema feed'}
                  </p>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-white/40 rotate-180 group-hover:text-[#f5c542] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* -- 2. 3x3 Discovery Grid (Category, Franchise, Country removed) -- */}
            <div className="grid grid-cols-3 gap-2">
              {/* Row 1: Following Activity | Monthly Ranking | Top 100 */}
              <button
                onClick={() => handleTileClick(() => setSubView('activity'))}
                className="group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90"
              >
                <PulseActivityIcon className="w-5 h-5 text-white/80 group-hover:text-[#f5c542] group-hover:scale-110 transition-all" />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  Following
                </span>
              </button>

              <button
                onClick={() =>
                  handleToggleFilter('sort', 'popularity.desc', 'release_date.desc')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isMonthlyRankingActive
                    ? 'bg-[#140a0d] border border-[#f5c542] text-white shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90'
                }`}
              >
                <MonthlyRankingIcon
                  className={`w-5 h-5 transition-all ${
                    isMonthlyRankingActive
                      ? 'text-[#f5c542] scale-105'
                      : 'text-white/80 group-hover:text-[#f5c542] group-hover:scale-110'
                  }`}
                />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  Monthly Top
                </span>
              </button>

              <button
                onClick={() =>
                  handleToggleFilter('sort', 'vote_average.desc', 'release_date.desc')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isTop100Active
                    ? 'bg-[#140a0d] border border-[#f5c542] text-white shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90'
                }`}
              >
                <CrownIcon
                  className={`w-5 h-5 transition-all ${
                    isTop100Active
                      ? 'text-[#f5c542] scale-105'
                      : 'text-white/80 group-hover:text-[#f5c542] group-hover:scale-110'
                  }`}
                />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  Top 100
                </span>
              </button>

              {/* Row 2: Genre | Award Winners | Language */}
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  onClose();
                  navigate('/explore');
                }}
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isGenreActive
                    ? 'bg-[#140a0d] border border-[#f5c542] text-white shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90'
                }`}
              >
                <DramaMasksIcon
                  className={`w-5 h-5 transition-all ${
                    isGenreActive
                      ? 'text-[#f5c542] scale-105'
                      : 'text-white/80 group-hover:text-[#f5c542] group-hover:scale-110'
                  }`}
                />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Genre
                </span>
              </button>

              <button
                onClick={() =>
                  handleToggleFilter('filter', 'award_winner')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isAwardWinnerActive
                    ? 'bg-[#140a0d] border border-[#f5c542] text-white shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90'
                }`}
              >
                <StatuetteAwardIcon
                  className={`w-5 h-5 transition-all ${
                    isAwardWinnerActive
                      ? 'text-[#f5c542] scale-105'
                      : 'text-white/80 group-hover:text-[#f5c542] group-hover:scale-110'
                  }`}
                />
                <span className="text-[11px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  Awards
                </span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setSubView('language');
                }}
                className="group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90"
              >
                <LanguageTranslateIcon className="w-5 h-5 text-white/80 group-hover:text-[#f5c542] group-hover:scale-110 transition-all" />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Language
                </span>
              </button>

              {/* Row 3: MovieGuy Select | Anime | Family Friendly */}
              <button
                onClick={() =>
                  handleToggleFilter('filter', 'select')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isSelectActive
                    ? 'bg-[#140a0d] border border-[#f5c542] text-white shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90'
                }`}
              >
                <CertifiedSelectIcon
                  className={`w-5 h-5 transition-all ${
                    isSelectActive
                      ? 'text-[#f5c542] scale-105'
                      : 'text-white/80 group-hover:text-[#f5c542] group-hover:scale-110'
                  }`}
                />
                <span className="text-[10.5px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  MG Select
                </span>
              </button>

              <button
                onClick={() =>
                  handleToggleFilter('anime', 'only')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isAnimeActive
                    ? 'bg-[#140a0d] border border-[#f5c542] text-white shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90'
                }`}
              >
                <AnimeFaceIcon
                  className={`w-5 h-5 transition-all ${
                    isAnimeActive
                      ? 'text-[#f5c542] scale-105'
                      : 'text-white/80 group-hover:text-[#f5c542] group-hover:scale-110'
                  }`}
                />
                <span className="text-[11.5px] font-medium text-white/90 group-hover:text-white tracking-tight">
                  Anime
                </span>
              </button>

              <button
                onClick={() =>
                  handleToggleFilter('filter', 'family_friendly')
                }
                className={`group rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isFamilyFriendlyActive
                    ? 'bg-[#140a0d] border border-[#f5c542] text-white shadow-[0_0_12px_rgba(245,197,66,0.25)]'
                    : 'bg-[#140a0d]/90 hover:bg-[#1a0f14] border border-white/[0.08] hover:border-[#c9a24b]/40 text-white/90'
                }`}
              >
                <FamilyFriendlyIcon
                  className={`w-5 h-5 transition-all ${
                    isFamilyFriendlyActive
                      ? 'text-[#f5c542] scale-105'
                      : 'text-white/80 group-hover:text-[#f5c542] group-hover:scale-110'
                  }`}
                />
                <span className="text-[10.5px] font-medium text-white/90 group-hover:text-white tracking-tight text-center leading-tight">
                  Family
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* -- Custom Red & White SVG Icons Matching Cinema Aesthetics -- */

const PulseActivityIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const MonthlyRankingIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M12 18l3 -3" />
    <path d="M15 15l-3 0" />
    <path d="M15 15l0 3" />
  </svg>
);

const CrownIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6l3 11h12l3-11-5 5-4-5-4 5-5-5z" />
  </svg>
);

const DramaMasksIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 6c0-2.2 3.6-4 8-4s8 1.8 8 4v7c0 4.4-3.6 7-8 7s-8-2.6-8-7V6z" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <path d="M9 14c1 1.5 5 1.5 6 0" />
  </svg>
);

const LanguageTranslateIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

const FamilyFriendlyIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const StatuetteAwardIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v10" />
    <path d="M9 9l3 2 3-2" />
    <path d="M10 17h4" />
    <path d="M7 21h10v-2H7v2z" />
  </svg>
);

const CertifiedSelectIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="9" r="6" />
    <path d="M9 9l2 2 4-4" />
    <path d="M8.5 14.5L7 21l5-3 5 3-1.5-6.5" />
  </svg>
);

const AnimeFaceIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="13" r="7" />
    <path d="M8 8c0-2 2-4 4-4s4 2 4 4" />
    <path d="M7 10c1.5 2 3.5 1 5 1s3.5 1 5-1" />
    <circle cx="9.5" cy="13" r="1" fill="currentColor" />
    <circle cx="14.5" cy="13" r="1" fill="currentColor" />
    <path d="M11 16c.5.5 1.5.5 2 0" />
  </svg>
);
