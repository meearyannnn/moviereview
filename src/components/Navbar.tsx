import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  Home,
  Clapperboard,
  Tv,
  Sparkles,
  Bookmark,
  Film,
  Volume2,
  VolumeX,
  HelpCircle,
  Hourglass,
  Flame,
  Calendar,
  LayoutGrid,
  Bell,
  User,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { soundEffects } from '@/lib/soundEffects';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ReelSwiperModal } from './ReelSwiperModal';
import { MidnightVaultModal } from './MidnightVaultModal';
import { ExploreHubModal } from './ExploreHubModal';
import { AuthModal } from './AuthModal';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSwiperModal, setShowSwiperModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showExploreHub, setShowExploreHub] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [soundOn, setSoundOn] = useState(() => soundEffects.getSoundEnabled());
  const keySequenceRef = useRef<string>('');

  const { watchlist, removeFromWatchlist } = useWatchlist();

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );
  const isSearchPage = location.pathname === '/search';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        setShowWatchlistModal(false);
        setShowShortcutsModal(false);
        setShowSwiperModal(false);
        setShowVaultModal(false);
        setShowExploreHub(false);
        setShowNotificationModal(false);
        setIsOpen(false);
        return;
      }

      if (isInput) return;

      keySequenceRef.current = (keySequenceRef.current + e.key.toLowerCase()).slice(-5);
      if (keySequenceRef.current === 'vault' || keySequenceRef.current.endsWith('cult')) {
        soundEffects.playSlide();
        setShowVaultModal(true);
        keySequenceRef.current = '';
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        soundEffects.playHoverTick();
        navigate('/search');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundEffects.playHoverTick();
        setShowSwiperModal((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        const newState = soundEffects.toggleSound();
        setSoundOn(newState);
      } else if (e.key === '?') {
        e.preventDefault();
        soundEffects.playHoverTick();
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const toggleAudio = () => {
    const newState = soundEffects.toggleSound();
    setSoundOn(newState);
  };

  // Original PC navigation links
  const navItems = useMemo(
    () => [
      { path: '/', label: 'Home' },
      { path: '/movies', label: 'Movies' },
      { path: '/tv', label: 'TV Shows' },
      { path: '/schedule', label: 'Schedule' },
      { path: '/genres', label: 'Genres' },
      { path: '/recommendations', label: 'AI Vibes' },
      { path: '/time-machine', label: 'Time Machine' },
    ],
    []
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'glass-header py-2.5 shadow-2xl shadow-black/60'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-3'
          }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* -- Brand Logo (Same on PC, compact on Phone) -- */}
          <Link
            to="/"
            onClick={() => soundEffects.playHoverTick()}
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none shrink-0"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-red-400 shadow-md p-0.5 transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#060810] rounded-[9px] flex items-center justify-center">
                <Clapperboard className="w-4 h-4 text-[#dc2626]" />
              </div>
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight text-white leading-none">
              Movie<span className="text-[#dc2626]">Guy</span>
            </span>
          </Link>

          {/* -- Desktop Navigation Links (EXACT SAME AS BEFORE FOR PC) -- */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.08] backdrop-blur-xl">
            {navItems.map(({ path, label }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => soundEffects.playHoverTick()}
                  className={`px-3 lg:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${active
                    ? 'bg-[#dc2626] text-white font-bold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* -- Desktop Right Actions Suite (EXACT SAME AS BEFORE FOR PC) -- */}
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5 md:gap-2">
            {/* 1. Calendar (Schedule) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                navigate('/schedule');
              }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${location.pathname === '/schedule'
                ? 'bg-[#dc2626] text-white shadow-md shadow-[#dc2626]/30'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white'
                }`}
              title="Release Schedule"
              aria-label="Release Schedule"
            >
              <Calendar className="w-4 h-4" />
            </button>



            {/* 3. Bookmark (Watchlist) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setShowWatchlistModal(true);
              }}
              className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white transition-all"
              aria-label="Watchlist"
              title="My Watchlist"
            >
              <Bookmark className="w-4 h-4" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[10px] font-bold rounded-full bg-[#dc2626] text-white">
                  {watchlist.length}
                </span>
              )}
            </button>

            {/* 4. 2x2 Grid Hub (?) matching screenshot */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setShowExploreHub((prev) => !prev);
              }}
              className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${showExploreHub
                ? 'bg-white text-white font-extrabold shadow-lg shadow-white/30 border border-white scale-105'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/85 hover:text-white'
                }`}
              aria-label="Explore Cinema Hub"
              title="Explore Cinema Hub"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {/* 5. Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setShowNotificationModal((prev) => !prev);
                }}
                className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${showNotificationModal
                  ? 'bg-[#dc2626] text-white shadow-md shadow-[#dc2626]/20'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white'
                  }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
              </button>

              {/* Notification Popover */}
              {showNotificationModal && (
                <div className="absolute right-0 top-11 w-72 bg-[#060810]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-[11px] font-mono font-bold text-white/80 uppercase tracking-wider">
                      Cinema Updates
                    </span>
                    <button
                      onClick={() => setShowNotificationModal(false)}
                      className="text-white/40 hover:text-white text-xs px-1"
                    >
                      ?
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#dc2626]/30 transition-all">
                      <p className="font-semibold text-white">Reacher Season 3</p>
                      <p className="text-[11px] text-white/50">Streaming on Prime Video</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#dc2626]/30 transition-all">
                      <p className="font-semibold text-white">Lanterns Season 1</p>
                      <p className="text-[11px] text-white/50">New Episode 5 now available</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Quick Search */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                navigate('/search');
              }}
              className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${isSearchPage
                ? 'bg-[#dc2626] text-white shadow-md shadow-[#dc2626]/20'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white'
                }`}
              aria-label="Search"
              title="Search (/)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 7. User Avatar & Auth (DNA / Cloud Profile) */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={() => soundEffects.playHoverTick()}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-red-600 to-red-500 border border-red-400/40 text-white font-extrabold hover:scale-105 transition-all shadow-md shadow-red-600/30 text-xs"
                    title={`Signed in as ${profile?.username || user.email}`}
                  >
                    {profile?.username ? profile.username.slice(0, 2).toUpperCase() : (user.email ? user.email.slice(0, 2).toUpperCase() : 'U')}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0a0d14]/95 backdrop-blur-xl border border-white/10 text-white rounded-xl shadow-2xl p-1.5 z-50">
                  <DropdownMenuLabel className="px-3 py-2">
                    <p className="text-xs font-bold text-white leading-none">{profile?.username || 'Cinephile'}</p>
                    <p className="text-[10px] text-white/50 truncate mt-1">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  <DropdownMenuItem
                    onClick={() => {
                      soundEffects.playHoverTick();
                      setShowWatchlistModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-white" />
                    <span>Cloud Watchlist ({watchlist.length})</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  <DropdownMenuItem
                    onClick={async () => {
                      soundEffects.playHoverTick();
                      await signOut();
                      toast.info('Signed out of MovieGuy');
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#dc2626] hover:bg-[#ef4444] text-white text-xs font-bold transition-all shadow-md shadow-[#dc2626]/30 hover:scale-105"
                title="Sign In / Join CineClub"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>

          {/* -- MOBILE ONLY HEADER ACTIONS (OPTIMIZED FOR PHONE: 4 CLEAN BUTTONS) -- */}
          {/* Calendar, 2x2 Hub, Bell, Menu Drawer Toggle */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {/* 1. Calendar (glowing amber when on /schedule) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                navigate('/schedule');
              }}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 touch-feedback ${isActive('/schedule')
                ? 'bg-[#dc2626] text-white font-bold border border-[#dc2626] shadow-[0_0_16px_rgba(251,191,36,0.65)] ring-2 ring-[#dc2626]/40'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white'
                }`}
              title="Schedule"
              aria-label="Schedule"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* 2. 2x2 Cinema Hub (?) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setShowExploreHub((prev) => !prev);
              }}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 touch-feedback ${showExploreHub
                ? 'bg-[#dc2626] text-white border border-[#dc2626] shadow-[0_0_16px_rgba(251,191,36,0.5)]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/85 hover:text-white'
                }`}
              aria-label="Explore Cinema Hub"
              title="Explore Cinema Hub"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {/* 3. Bell Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  soundEffects.playHoverTick();
                  setShowNotificationModal((prev) => !prev);
                }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 touch-feedback ${showNotificationModal
                  ? 'bg-[#dc2626] text-white border border-[#dc2626] shadow-[0_0_16px_rgba(251,191,36,0.5)]'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white'
                  }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
              </button>

              {/* Mobile Notification Popover */}
              {showNotificationModal && (
                <div className="absolute right-0 top-10 w-72 max-w-[calc(100vw-2rem)] bg-[#060810]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-[11px] font-mono font-bold text-white/80 uppercase tracking-wider">
                      Cinema Updates
                    </span>
                    <button
                      onClick={() => setShowNotificationModal(false)}
                      className="text-white/40 hover:text-white text-xs px-1"
                    >
                      ?
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="font-semibold text-white">Reacher Season 3</p>
                      <p className="text-[11px] text-white/50">Streaming on Prime Video</p>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="font-semibold text-white">Lanterns Season 1</p>
                      <p className="text-[11px] text-white/50">New Episode 5 available</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Drawer Menu Toggle (?) */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setIsOpen((prev) => !prev);
              }}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 touch-feedback ${isOpen
                ? 'bg-[#dc2626] text-white font-bold border border-[#dc2626]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/90 hover:text-white'
                }`}
              aria-label="Toggle Menu"
              title="Menu"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* -- Slide-Down Menu Drawer (Mobile & Tablet) -- */}
        {isOpen && (
          <div className="glass-header border-t border-white/[0.08] px-4 py-5 mt-2 max-h-[75vh] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Mobile Profile Banner */}
              {user ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                      {profile?.username ? profile.username.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">
                        {profile?.username || 'Cinephile'}
                      </h4>
                      <p className="text-[10px] text-white/50 truncate max-w-[160px]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      soundEffects.playHoverTick();
                      setIsOpen(false);
                      await signOut();
                      toast.info('Signed out');
                    }}
                    className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setIsOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-600/15 via-red-600/10 to-transparent border border-red-500/30 hover:border-red-500/60 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#dc2626] flex items-center justify-center text-white font-extrabold shadow-sm">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">
                        Join MovieGuy CineClub
                      </h4>
                      <p className="text-[11px] text-white/50">
                        Sync cloud watchlist & reviews
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#dc2626] text-white">
                    Sign In
                  </span>
                </div>
              )}

              {/* Mobile primary nav links */}
              <div className="flex flex-col gap-1.5 pb-3 border-b border-white/10">
                {navItems.map(({ path, label }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => {
                        soundEffects.playHoverTick();
                        setIsOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all touch-feedback ${active
                        ? 'bg-[#dc2626] text-white font-bold'
                        : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                        }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* Discovery Directories */}
              <div className="pb-3 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-2 px-1">
                  Directories
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/categories"
                    onClick={() => {
                      soundEffects.playHoverTick();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80"
                  >
                    <Clapperboard className="w-3.5 h-3.5 text-[#dc2626]" />
                    <span>Categories A-Z</span>
                  </Link>

                  <Link
                    to="/languages"
                    onClick={() => {
                      soundEffects.playHoverTick();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80"
                  >
                    <span className="text-[#dc2626] font-bold text-xs">?A</span>
                    <span>Languages A-Z</span>
                  </Link>

                  <Link
                    to="/countries"
                    onClick={() => {
                      soundEffects.playHoverTick();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80"
                  >
                    <span className="text-[#dc2626] text-xs">??</span>
                    <span>Countries A-Z</span>
                  </Link>

                  <Link
                    to="/explore"
                    onClick={() => {
                      soundEffects.playHoverTick();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-[#dc2626]" />
                    <span>Explore Catalog</span>
                  </Link>
                </div>
              </div>

              {/* Extra Cinema Features */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSwiperModal(true);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  <Flame className="w-4 h-4 text-[#dc2626]" />
                  <span>Reel Swiper</span>
                </button>



                <button
                  onClick={toggleAudio}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  {soundOn ? (
                    <Volume2 className="w-4 h-4 text-[#dc2626]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-white/40" />
                  )}
                  <span>{soundOn ? 'Sound: ON' : 'Sound: OFF'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowShortcutsModal(true);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-xs text-white/80 transition-all text-left"
                >
                  <HelpCircle className="w-4 h-4 text-white/50" />
                  <span>Shortcuts</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* -- Fixed Mobile Bottom Navigation Bar (Android & iOS Optimized) -- */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060810]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.85)] safe-bottom-nav"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-[56px] items-center px-1">
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${isActive('/')
              ? 'text-[#dc2626] font-bold'
              : 'text-white/50 hover:text-white/80'
              }`}
          >
            <Home
              className={`w-5 h-5 transition-transform ${isActive('/') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'
                }`}
            />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* 2. Movies */}
          <Link
            to="/movies"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${isActive('/movies')
              ? 'text-[#dc2626] font-bold'
              : 'text-white/50 hover:text-white/80'
              }`}
          >
            <Film
              className={`w-5 h-5 transition-transform ${isActive('/movies') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'
                }`}
            />
            <span className="text-[10px] tracking-tight">Movies</span>
          </Link>

          {/* 3. Series */}
          <Link
            to="/tv"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${isActive('/tv')
              ? 'text-[#dc2626] font-bold'
              : 'text-white/50 hover:text-white/80'
              }`}
          >
            <Tv
              className={`w-5 h-5 transition-transform ${isActive('/tv') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'
                }`}
            />
            <span className="text-[10px] tracking-tight">Series</span>
          </Link>

          {/* 4. Search */}
          <Link
            to="/search"
            onClick={() => soundEffects.playHoverTick()}
            className={`flex flex-col items-center justify-center h-full gap-1 touch-feedback ${isActive('/search')
              ? 'text-[#dc2626] font-bold'
              : 'text-white/50 hover:text-white/80'
              }`}
          >
            <Search
              className={`w-5 h-5 transition-transform ${isActive('/search') ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'
                }`}
            />
            <span className="text-[10px] tracking-tight">Search</span>
          </Link>

          {/* 5. Saved (Watchlist) */}
          <button
            onClick={() => {
              soundEffects.playHoverTick();
              setShowWatchlistModal(true);
            }}
            className={`relative flex flex-col items-center justify-center h-full gap-1 touch-feedback ${showWatchlistModal
              ? 'text-[#dc2626] font-bold'
              : 'text-white/50 hover:text-white/80'
              }`}
          >
            <div className="relative">
              <Bookmark
                className={`w-5 h-5 ${showWatchlistModal ? 'stroke-[2.5]' : 'stroke-[1.75]'
                  }`}
              />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[15px] h-[15px] px-1 text-[9px] font-black rounded-full bg-[#dc2626] text-white shadow-sm">
                  {watchlist.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Saved</span>
          </button>
        </div>
      </nav>



      {/* -- Watchlist Modal -- */}
      {showWatchlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-[#111520] border border-white/10 shadow-2xl shadow-black overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#dc2626]" />
                <h3 className="font-display font-bold text-lg text-white">
                  My Watchlist
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#dc2626]/20 text-[#dc2626] font-semibold">
                  {watchlist.length}
                </span>
              </div>
              <button
                onClick={() => setShowWatchlistModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {watchlist.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/30 border border-white/10">
                    <Bookmark className="w-7 h-7" />
                  </div>
                  <h4 className="font-display font-semibold text-white text-base mb-1">
                    Your Watchlist is Empty
                  </h4>
                  <p className="text-sm text-white/50 max-w-xs">
                    Bookmark your favorite movies and shows to easily pick up
                    where you left off.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {watchlist.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#dc2626]/30 transition-all cursor-pointer"
                      onClick={() => {
                        setShowWatchlistModal(false);
                        navigate(`/${item.media_type || 'movie'}/${item.id}`);
                      }}
                    >
                      <img
                        src={
                          item.poster_path
                            ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                            : ''
                        }
                        alt={item.title}
                        className="w-14 h-20 object-cover rounded-lg flex-shrink-0 bg-neutral-900 border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-semibold text-sm text-white truncate group-hover:text-[#dc2626] transition-colors">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                            {item.media_type === 'tv' ? 'TV' : 'Movie'}
                          </span>
                          {item.vote_average && (
                            <span className="text-[11px] text-[#dc2626] font-semibold">
                              ? {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playHoverTick();
                          removeFromWatchlist(item.id);
                        }}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                        title="Remove from watchlist"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* -- Keyboard Shortcuts Modal -- */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* -- Reel Swiper Modal -- */}
      <ReelSwiperModal
        isOpen={showSwiperModal}
        onClose={() => setShowSwiperModal(false)}
      />

      {/* -- Midnight Cult Vault Modal -- */}
      <MidnightVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
      />

      {/* -- Explore Cinema Hub (?) Modal matching screenshot -- */}
      <ExploreHubModal
        isOpen={showExploreHub}
        onClose={() => setShowExploreHub(false)}
      />

      {/* -- CineClub Supabase Auth Modal -- */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
