import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Clapperboard, Home, Film, Tv, Bookmark, Calendar,
  Bell, User, LogIn, LogOut, X, Users, Settings, PenSquare, Trophy, Compass,
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

const NAV = [
  { path: '/', label: 'Home' },
  { path: '/explore', label: 'Explore' },
  { path: '/community', label: 'Community' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/genres', label: 'Genres' },
  { path: '/time-machine', label: 'Time Machine' },
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
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const keys = useRef('');

  const isActive = (p: string) => pathname === p;

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
        setShowWatchlist(false); setShowVault(false); setShowHub(false); setShowBell(false);
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
              className="h-6 sm:h-7 w-auto object-contain transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_14px_rgba(245,197,66,0.6)]"
            />
          </Link>

          {/* Links: plain text with warm brass line marking active state */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
            {NAV.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                onClick={tick}
                aria-current={isActive(path) ? 'page' : undefined}
                className={`relative whitespace-nowrap py-1 text-[13px] font-medium transition-colors ${isActive(path)
                    ? 'text-[#f5c542] font-semibold after:absolute after:inset-x-0 after:-bottom-[17px] after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-[#c9a24b] after:to-[#f5c542] after:shadow-[0_0_8px_rgba(201,162,75,0.7)]'
                    : 'text-white/60 hover:text-white'
                  }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <IconBtn label="Search (/)" active={isActive('/search')} onClick={() => { tick(); navigate('/search'); }}>
              <Search className="h-[18px] w-[18px]" />
            </IconBtn>

            <span className="hidden md:block">
              <IconBtn label="Watchlist" onClick={() => { tick(); setShowWatchlist(true); }}>
                <Bookmark className="h-[18px] w-[18px]" />
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
                <div className="absolute right-0 top-11 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/95 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                  <p className="px-2.5 pb-1.5 pt-1 text-sm font-bold text-white font-display">What's new</p>
                  {[
                    ['Reacher Season 3', 'Streaming on Prime Video'],
                    ['Lanterns Season 1', 'New episode 5 is out'],
                  ].map(([t, s]) => (
                    <div key={t} className="rounded-xl px-2.5 py-2 hover:bg-white/[0.05]">
                      <p className="text-sm font-medium text-white">{t}</p>
                      <p className="text-xs text-white/50">{s}</p>
                    </div>
                  ))}
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
                    {/* My Reviews */}
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                      <Link to="/community/reviews">
                        <PenSquare className="h-4 w-4 text-white/50" /> My Reviews
                      </Link>
                    </DropdownMenuItem>
                    {/* My Contributions */}
                    <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm">
                      <Link to="/community">
                        <Trophy className="h-4 w-4 text-white/50" /> My Contributions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/[0.07]" />
                  </>
                )}
                {/* Mobile-only nav items */}
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm md:hidden">
                  <Link to="/genres">Genres</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm md:hidden">
                  <Link to="/time-machine">Time Machine</Link>
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
            onClick={() => { tick(); setShowWatchlist(true); }}
            className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${showWatchlist ? 'text-[#f5c542]' : 'text-white/50'}`}
          >
            <span className="relative">
              <Bookmark className="h-5 w-5" strokeWidth={1.75} />
              {watchlist.length > 0 && (
                <span className="absolute -right-2 -top-1 grid min-w-[15px] place-items-center rounded-full bg-[#8c1c2b] border border-[#c9a24b]/40 px-1 text-[9px] font-bold text-[#f3e9d2]">
                  {watchlist.length}
                </span>
              )}
            </span>
            Saved
          </button>
        </div>
      </nav>

      {/* Watchlist */}
      {showWatchlist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setShowWatchlist(false)}
        >
          <div
            role="dialog"
            aria-label="My watchlist"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d13]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
              <h3 className="font-display text-lg font-bold">
                My Watchlist <span className="ml-1 text-sm font-medium text-white/40">{watchlist.length}</span>
              </h3>
              <IconBtn label="Close" onClick={() => setShowWatchlist(false)}><X className="h-4 w-4" /></IconBtn>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {watchlist.length === 0 ? (
                <div className="py-12 text-center">
                  <Bookmark className="mx-auto mb-3 h-7 w-7 text-white/25" />
                  <p className="font-semibold">Nothing saved yet</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-white/50">
                    Tap the bookmark on any movie or show and it will wait for you here.
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {watchlist.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => { setShowWatchlist(false); navigate(`/${item.media_type || 'movie'}/${item.id}`); }}
                      className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-white/[0.05]"
                    >
                      <img
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : ''}
                        alt=""
                        className="h-20 w-14 shrink-0 rounded-lg bg-neutral-900 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="mt-0.5 text-xs text-white/50">
                          {item.media_type === 'tv' ? 'TV' : 'Movie'}
                          {item.vote_average ? ` · ★ ${item.vote_average.toFixed(1)}` : ''}
                        </p>
                      </div>
                      <button
                        aria-label={`Remove ${item.title}`}
                        onClick={(e) => { e.stopPropagation(); tick(); removeFromWatchlist(item.id); }}
                        className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-[#f5c542]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <MidnightVaultModal isOpen={showVault} onClose={() => setShowVault(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
};