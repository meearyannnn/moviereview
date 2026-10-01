import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Clapperboard, Home, Film, Tv, Bookmark, Calendar,
  Bell, User, LogIn, LogOut, X, Users, Settings, PenSquare, Trophy, Compass,
  Clock, History, ExternalLink, RefreshCw, Newspaper,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuth } from '@/contexts/AuthContext';
import { soundEffects } from '@/lib/soundEffects';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MidnightVaultModal } from './MidnightVaultModal';
import { AuthModal } from './AuthModal';
import { cinemaNewsService, type CinemaNewsItem } from '@/services/cinemaNews';

const NAV = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/explore', label: 'Explore', icon: Compass },
  { path: '/community', label: 'Community', icon: Users },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/directors', label: 'Directors', icon: Clapperboard },
];

const tick = () => soundEffects.playHoverTick();

// One quiet icon button used everywhere in the bar: no borders, just a soft hover.
const IconBtn = ({ label, onClick, active, children }: {
  label: string; onClick: () => void; active?: boolean; children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`relative grid h-9 w-9 place-items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 ${active ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/[0.07] hover:text-white'
      }`}
  >
    {children}
  </button>
);

export const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { watchlist, removeFromWatchlist } = useWatchlist();

  const [scrolled, setScrolled] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [cinemaNews, setCinemaNews] = useState<CinemaNewsItem[]>([]);
  const [newsCategory, setNewsCategory] = useState<'all' | 'movie' | 'tv'>('all');
  const [newsLoading, setNewsLoading] = useState(false);
  const keys = useRef('');

  const loadNews = async (cat: 'all' | 'movie' | 'tv' = newsCategory) => {
    setNewsLoading(true);
    try {
      const items = await cinemaNewsService.getNews(cat);
      setCinemaNews(items);
    } catch {
      // safe fallback already handled inside service
    } finally {
      setNewsLoading(false);
    }
  };

  useEffect(() => {
    if (showBell && cinemaNews.length === 0) {
      loadNews(newsCategory);
    }
  }, [showBell]);

  const handleCategoryChange = (cat: 'all' | 'movie' | 'tv') => {
    setNewsCategory(cat);
    loadNews(cat);
  };

  const isActive = (p: string) =>
    pathname === p || (p === '/directors' && pathname.startsWith('/director'));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Shortcuts: Esc closes things, "/" opens search, typing "vault" opens the vault.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVault(false); setShowBell(false);
        return;
      }
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keys.current = (keys.current + e.key.toLowerCase()).slice(-5);
      if (keys.current === 'vault' || keys.current.endsWith('cult')) {
        soundEffects.playSlide();
        setShowVault(true);
        keys.current = '';
        return;
      }
      if (e.key === '/') { e.preventDefault(); tick(); navigate('/search'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const initials = (profile?.username || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled
            ? 'border-b border-[#c9a24b]/20 bg-[#0a0608]/90 backdrop-blur-2xl shadow-lg shadow-black/80'
            : 'bg-gradient-to-b from-[#0a0608]/95 via-[#0a0608]/60 to-transparent'
          }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" onClick={tick} className="flex shrink-0 items-center gap-2.5 focus:outline-none group">
            <img
              src="/assets/branding/movieguy-hero-tight.png"
              alt="MovieGuy"
              className="h-[18px] sm:h-[21px] w-auto object-contain transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_12px_rgba(245,197,66,0.5)]"
            />
          </Link>

          {/* Links: icons in place of text, shifted right */}
          <nav className="hidden items-center gap-1.5 md:flex ml-auto mr-3" aria-label="Main">
            {NAV.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={tick}
                  title={label}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-[#f5c542]/15 text-[#f5c542] border border-[#f5c542]/30 shadow-[0_0_12px_rgba(245,197,66,0.2)]'
                      : 'text-white/60 hover:bg-white/[0.08] hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
                  {active && (
                    <span className="absolute -bottom-[9px] h-[2px] w-3.5 rounded-full bg-gradient-to-r from-[#c9a24b] to-[#f5c542] shadow-[0_0_6px_rgba(245,197,66,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <IconBtn label="Search (/)" active={isActive('/search')} onClick={() => { tick(); navigate('/search'); }}>
              <Search className="h-[18px] w-[18px]" />
            </IconBtn>

            <span className="hidden md:block">
              <IconBtn label="Watch Later" onClick={() => { tick(); navigate('/library?tab=watch-later'); }}>
                <Clock className="h-[18px] w-[18px]" />
                {watchlist.length > 0 && (
                  <span className="absolute right-0.5 top-0.5 grid min-w-[16px] place-items-center rounded-full bg-[#f5c542] px-1 text-[10px] font-black leading-4 text-[#1c120c] shadow-sm">
                    {watchlist.length}
                  </span>
                )}
              </IconBtn>
            </span>


            <div className="relative">
              <IconBtn label="Notifications" active={showBell} onClick={() => { tick(); setShowBell((v) => !v); }}>
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f5c542] shadow-[0_0_6px_rgba(245,197,66,0.8)]" />
              </IconBtn>
              {showBell && (
                <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/95 p-3 shadow-2xl shadow-black/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 text-white">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Newspaper className="w-4 h-4 text-[#f5c542]" />
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <span className="text-sm font-bold font-display text-white">Cinema Scoop</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {(['all', 'movie', 'tv'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handleCategoryChange(cat)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md capitalize transition-all ${
                            newsCategory === cat
                              ? 'bg-[#f5c542] text-[#1c120c] font-bold'
                              : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      <button
                        onClick={() => loadNews(newsCategory)}
                        title="Refresh feeds"
                        className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${newsLoading ? 'animate-spin text-[#f5c542]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {newsLoading && cinemaNews.length === 0 ? (
                      <div className="py-8 text-center text-xs font-mono text-white/40">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#f5c542]" />
                        Fetching live cinema feeds...
                      </div>
                    ) : cinemaNews.length === 0 ? (
                      <div className="py-6 text-center text-xs font-mono text-white/40">
                        No headlines found.
                      </div>
                    ) : (
                      cinemaNews.map((item) => (
                        <Link
                          key={item.id}
                          to="/community/news"
                          onClick={() => {
                            tick();
                            setShowBell(false);
                          }}
                          className="group flex gap-2.5 p-2 rounded-xl border border-transparent hover:border-white/[0.08] hover:bg-white/[0.04] transition-all"
                        >
                          {item.thumbnail && (
                            <img
                              src={item.thumbnail}
                              alt=""
                              className="w-16 h-14 rounded-lg object-cover shrink-0 bg-white/[0.05] border border-white/[0.06]"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <p className="text-xs font-medium text-white/90 group-hover:text-[#f5c542] transition-colors line-clamp-2 leading-snug">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-white/40">
                              <span className="text-[#f5c542] bg-[#f5c542]/10 px-1.5 py-0.5 rounded font-semibold">
                                MovieGuy Wire
                              </span>
                              <span>
                                {item.pubDate
                                  ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Today'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-white/30 px-1">
                    <span>MovieGuy Cinema Wire</span>
                    <Link to="/community/news" onClick={() => setShowBell(false)} className="text-[#f5c542] hover:underline">
                      View All Scoops →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Account menu. On phones it also holds the links the bottom bar doesn't have. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={tick}
                  aria-label="Account and menu"
                  className={`ml-1 grid h-9 w-9 place-items-center rounded-full transition-colors ${user ? 'bg-[#f5c542] text-xs font-black text-[#1c120c] hover:bg-[#c9a24b]' : 'text-white/65 hover:bg-white/[0.07] hover:text-white'
                    }`}
                >
                  {user ? initials : <User className="h-[18px] w-[18px]" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 w-60 rounded-xl border border-[#c9a24b]/20 bg-[#140a0d]/95 p-1.5 text-white backdrop-blur-xl">
                {user && (
                  <>
                    {/* Profile info header */}
                    <DropdownMenuLabel className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5c542] text-xs font-black text-[#1c120c]">
                          {profile?.username?.slice(0, 1).toUpperCase() ?? 'C'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-none">{profile?.username || 'Cinephile'}</p>
                          <p className="mt-1 truncate text-xs font-normal text-white/40">{user.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/[0.07]" />
                    {/* My Profile */}
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                      <Link to={`/community/user/${user.id}`}>
                        <User className="h-4 w-4 text-white/50" /> My Profile
                      </Link>
                    </DropdownMenuItem>
                    {/* My Collections & Library */}
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                      <Link to="/library?tab=collections">
                        <Bookmark className="h-4 w-4 text-[#c9a24b]" /> My Collections
                      </Link>
                    </DropdownMenuItem>
                    {/* Watch Later */}
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                      <Link to="/library?tab=watch-later">
                        <Clock className="h-4 w-4 text-[#f5c542]" /> Watch Later
                      </Link>
                    </DropdownMenuItem>
                    {/* Watch History */}
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                      <Link to="/library?tab=history">
                        <History className="h-4 w-4 text-emerald-400" /> Watch History
                      </Link>
                    </DropdownMenuItem>
                    {/* My Reviews */}
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                      <Link to="/community/reviews">
                        <PenSquare className="h-4 w-4 text-white/50" /> My Reviews
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/[0.07]" />
                  </>
                )}
                {/* Mobile-only nav items */}
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm md:hidden">
                  <Link to="/directors">Directors</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm md:hidden">
                  <Link to="/schedule">Schedule</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowWatchlist(true)} className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                  <Bookmark className="h-4 w-4 text-white/50" /> Watchlist ({watchlist.length})
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                    <Link to="/settings">
                      <Settings className="h-4 w-4 text-white/50" /> Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/[0.07]" />
                {user ? (
                  <DropdownMenuItem
                    onClick={async () => { await signOut(); toast.info('Signed out of MovieGuy'); }}
                    className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm text-[#f5c542] focus:text-white"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowAuth(true)} className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                    <LogIn className="h-4 w-4" /> Sign in
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Phone bottom bar */}
      <nav
        aria-label="Mobile"
        className="safe-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#c9a24b]/20 bg-[#0a0608]/95 backdrop-blur-2xl md:hidden"
      >
        <div className="grid h-14 grid-cols-5">
          {[
            { to: '/', label: 'Home', Icon: Home },
            { to: '/explore', label: 'Explore', Icon: Compass },
            { to: '/community', label: 'Community', Icon: Users },
            { to: '/schedule', label: 'Schedule', Icon: Calendar },
          ].map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={tick}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${isActive(to) ? 'text-[#f5c542]' : 'text-white/50'}`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive(to) ? 2.4 : 1.75} />
              {label}
            </Link>
          ))}
          <button
            onClick={() => { tick(); navigate('/library?tab=watch-later'); }}
            className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${isActive('/library') ? 'text-[#f5c542]' : 'text-white/50'}`}
          >
            <span className="relative">
              <Clock className="h-5 w-5" strokeWidth={1.75} />
              {watchlist.length > 0 && (
                <span className="absolute -right-2 -top-1 grid min-w-[15px] place-items-center rounded-full bg-[#f5c542] px-1 text-[9px] font-bold text-black">
                  {watchlist.length}
                </span>
              )}
            </span>
            Watch Later
          </button>
        </div>
      </nav>

      <MidnightVaultModal isOpen={showVault} onClose={() => setShowVault(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
};