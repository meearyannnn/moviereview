import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Star, BookMarked, Bookmark, Users } from 'lucide-react';

const SIDEBAR_LINKS = [
  { to: '/community', label: 'Feed', Icon: Home, exact: true },
  { to: '/community/discussions', label: 'Discussions', Icon: MessageSquare },
  { to: '/community/reviews', label: 'Reviews', Icon: Star },
  { to: '/community/collections', label: 'Collections', Icon: BookMarked },
];

export function CommunitySidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sticky top-20 hidden w-52 shrink-0 lg:block">
      <nav className="space-y-1">
        {SIDEBAR_LINKS.map(({ to, label, Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'border border-[#c9a24b]/40 bg-[#c9a24b]/15 text-[#f5c542] shadow-[0_0_15px_rgba(245,197,66,0.12)]'
                  : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-[#f5c542]' : ''}`}
                strokeWidth={active ? 2.2 : 1.75}
                style={{ width: 18, height: 18 }}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#f5c542] shadow-[0_0_8px_#f5c542]" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/80 p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#c9a24b] mb-3">
          <Users className="h-3.5 w-3.5" />
          THE BOX OFFICE FORUM
        </div>
        <p className="text-xs leading-relaxed text-white/50">
          Share honest takes, debate favourites, and discover what fellow cinephiles are watching.
        </p>
      </div>
    </aside>
  );
}
