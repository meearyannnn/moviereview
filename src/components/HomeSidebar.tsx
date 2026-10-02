// src/components/HomeSidebar.tsx — Charts, community and genres
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Star, ArrowRight, MessageSquare } from 'lucide-react';
import { tmdb } from '@/services/tmdb';

interface RankedItem {
  id: number;
  title: string;
  poster_path: string | null;
  year?: string;
  rating?: number;
  type: 'movie' | 'tv';
}

interface ChartTab {
  id: string;
  label: string;
  type: 'movie' | 'tv';
  link: string;
  load: () => Promise<{ results?: any[] }>;
}

// One chart at a time instead of seven stacked cards
const TABS: ChartTab[] = [
  { id: 'movies', label: 'Top movies', type: 'movie', link: '/movies', load: () => tmdb.getTrending('movie', 'week') },
  { id: 'shows', label: 'Trending shows', type: 'tv', link: '/tv', load: () => tmdb.getTrending('tv', 'week') },
  { id: 'top-tv', label: 'Top rated TV', type: 'tv', link: '/tv', load: () => tmdb.getTopRated('tv') },
  {
    id: 'gems',
    label: 'Hidden gems',
    type: 'movie',
    link: '/explore',
    load: () => tmdb.discover('movie', 'vote_average.gte=8.0&vote_count.gte=300&vote_count.lte=4000&sort_by=vote_average.desc'),
  },
  {
    id: 'classics',
    label: 'Classics',
    type: 'movie',
    link: '/explore',
    load: () =>
      tmdb.discover('movie', 'primary_release_date.lte=2002-01-01&vote_average.gte=8.2&vote_count.gte=1000&sort_by=vote_average.desc'),
  },
  { id: 'thrills', label: 'Thrillers', type: 'movie', link: '/explore', load: () => tmdb.discover('movie', 'with_genres=27|53&sort_by=popularity.desc') },
  {
    id: 'binge',
    label: 'Binge-worthy',
    type: 'tv',
    link: '/tv',
    load: () => tmdb.discover('tv', 'vote_average.gte=8.2&vote_count.gte=500&sort_by=popularity.desc'),
  },
];

const GENRES = [
  { id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' }, { id: 35, name: 'Comedy' },
  { id: 16, name: 'Animation' }, { id: 53, name: 'Thriller' },
  { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' },
];

const toItem = (m: any, type: 'movie' | 'tv'): RankedItem => ({
  id: m.id,
  title: m.title || m.name || m.original_title || m.original_name || 'Untitled',
  poster_path: m.poster_path,
  year: (m.release_date || m.first_air_date)?.slice(0, 4),
  rating: m.vote_average,
  type,
});

/* ─── Ranked row ─── */
const RankRow = ({ item, rank }: { item: RankedItem; rank: number }) => (
  <li>
    <Link
      to={`/${item.type}/${item.id}`}
      className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
    >
      <span className="w-5 shrink-0 text-center font-display text-lg font-black tabular-nums text-white/30 transition-colors group-hover:text-[#f5c542]">
        {rank}
      </span>

      {item.poster_path ? (
        <img
          src={tmdb.getImageUrl(item.poster_path, 'w185')}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-14 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/[0.08]"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      ) : (
        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.08]">
          <Film className="h-4 w-4 text-white/20" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#f5c542]">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-white/45">
          {item.year && <span>{item.year}</span>}
          {!!item.rating && item.rating > 0 && (
            <span className="inline-flex items-center gap-1 text-white/65">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {item.rating.toFixed(1)}
            </span>
          )}
        </p>
      </div>
    </Link>
  </li>
);

const SkeletonRows = () => (
  <div className="space-y-4" aria-hidden>
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex animate-pulse items-center gap-3">
        <div className="h-5 w-5 rounded bg-white/[0.04]" />
        <div className="h-14 w-10 rounded-lg bg-white/[0.04]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded bg-white/[0.05]" />
          <div className="h-3 w-1/3 rounded bg-white/[0.04]" />
        </div>
      </div>
    ))}
  </div>
);

export const HomeSidebar = () => {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const [data, setData] = useState<Record<string, RankedItem[]>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [attempt, setAttempt] = useState(0);

  const active = TABS.find((t) => t.id === activeId) ?? TABS[0];

  // Each chart loads only when opened, and a failed one can't blank the others.
  // (Before: seven requests on mount inside one Promise.all, so one failure emptied everything.)
  useEffect(() => {
    if (data[active.id]) return;
    let cancelled = false;
    active
      .load()
      .then((res) => {
        if (cancelled) return;
        setData((prev) => ({ ...prev, [active.id]: (res.results || []).slice(0, 5).map((x) => toItem(x, active.type)) }));
      })
      .catch((err) => {
        console.error(`Sidebar chart "${active.id}" failed:`, err);
        if (!cancelled) setFailed((prev) => ({ ...prev, [active.id]: true }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.id, attempt]);

  const items = data[active.id];
  const hasFailed = !items && failed[active.id];

  const retry = () => {
    setFailed((prev) => ({ ...prev, [active.id]: false }));
    setAttempt((a) => a + 1);
  };

  return (
    <aside className="space-y-10" aria-label="Charts and community">
      {/* ── Charts ── */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Charts</h2>
          <Link
            to={active.link}
            className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-[#f5c542]"
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Chart"
          className="mt-4 flex gap-5 overflow-x-auto border-b border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((t) => {
            const isActive = t.id === activeId;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(t.id)}
                className={`-mb-px shrink-0 border-b-2 pb-2.5 text-sm font-medium transition-colors ${isActive ? 'border-[#f5c542] text-white' : 'border-transparent text-white/45 hover:text-white/80'
                  }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 min-h-[22rem]" role="tabpanel">
          {items ? (
            items.length > 0 ? (
              <ol>
                {items.map((it, i) => (
                  <RankRow key={it.id} item={it} rank={i + 1} />
                ))}
              </ol>
            ) : (
              <p className="py-10 text-center text-sm text-white/45">Nothing on this chart right now.</p>
            )
          ) : hasFailed ? (
            <div className="py-10 text-center">
              <p className="text-sm text-white/55">Couldn’t load this chart.</p>
              <button type="button" onClick={retry} className="mt-2 text-sm font-medium text-[#f5c542] hover:text-white">
                Try again
              </button>
            </div>
          ) : (
            <SkeletonRows />
          )}
        </div>
      </section>

      {/* ── Community: one calm panel, no invented numbers ── */}
      <section className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.06]">
        <h2 className="font-display text-lg font-bold text-white">Join the conversation</h2>
        <p className="mt-1 text-sm text-white/50">See what cinephiles are saying, and add your own take.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to="/community/discussions"
            className="inline-flex items-center gap-2 rounded-full bg-[#f5c542] px-4 py-2 text-sm font-bold text-[#1c120c] transition-colors hover:bg-white"
          >
            <MessageSquare className="h-4 w-4" />
            Start a discussion
          </Link>
          <Link to="/community" className="text-sm text-white/55 transition-colors hover:text-[#f5c542]">
            Browse community
          </Link>
        </div>
      </section>

      {/* ── Genres ── */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-bold tracking-tight text-white">Browse by genre</h2>
          <Link to="/explore" className="inline-flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-[#f5c542]">
            All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Link
              key={g.id}
              to={`/explore?genres=${g.id}`}
              className="rounded-full bg-white/[0.05] px-3.5 py-1.5 text-sm text-white/65 transition-colors hover:bg-white/[0.1] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
};