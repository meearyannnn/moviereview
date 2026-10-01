import { NavLink, useLocation } from 'react-router-dom';
import { Home, Newspaper, MessageSquare, Tv, PenSquare, Bookmark, Users } from 'lucide-react';

export const COMMUNITY_SIDEBAR_LINKS = [
  { to: '/community', label: 'Feed', Icon: Home, exact: true },
  { to: '/community/news', label: 'News', Icon: Newspaper },
  { to: '/community/discussions', label: 'Discussions', Icon: MessageSquare },
  { to: '/community/trailers', label: 'Trailers', Icon: Tv },
  { to: '/community/reviews', label: 'Reviews', Icon: PenSquare },
  { to: '/community/collections', label: 'Collections', Icon: Bookmark },
];

export function CommunitySidebar() {
  const { pathname } = useLocation();

  return (
    <>
      {/* Desktop Sidebar (Screenshots 2-5) */}
      <aside className="sticky top-20 hidden w-52 shrink-0 lg:block">
        <nav className="space-y-1">
          {COMMUNITY_SIDEBAR_LINKS.map(({ to, label, Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon
                  className="h-4.5 w-4.5 shrink-0"
                  strokeWidth={active ? 2.2 : 1.8}
                  style={{ width: 19, height: 19 }}
                />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f5c542] shadow-[0_0_8px_#f5c542]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#140a0e] p-4 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#f5c542] mb-2.5">
            <Users className="h-3.5 w-3.5" />
            THE BOX OFFICE FORUM
          </div>
          <p className="text-xs leading-relaxed text-white/50">
            Share honest takes, debate favourites, and discover what fellow cinephiles are watching.
          </p>
        </div>
      </aside>

      {/* Mobile / Tablet Horizontal Bar */}
      <div className="block lg:hidden mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 min-w-max p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          {COMMUNITY_SIDEBAR_LINKS.map(({ to, label, Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  active
                    ? 'bg-white/[0.1] text-white font-semibold shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
