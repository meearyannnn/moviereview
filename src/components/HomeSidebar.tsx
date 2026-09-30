import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Tv, Trophy, Flame, Compass, ArrowRight, MessageSquare, Star } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';

interface RankedItem {
  id: number;
  title: string;
  poster_path: string | null;
  year?: string;
  rating?: number;
  type: 'movie' | 'tv';
}

const POPULAR_GENRES = [
  { id: 28, name: 'Action' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' },
  { id: 35, name: 'Comedy' },
  { id: 16, name: 'Animation' },
  { id: 53, name: 'Thriller' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
];

export const HomeSidebar = () => {
  const [topMovies, setTopMovies] = useState<RankedItem[]>([]);
  const [trendingShows, setTrendingShows] = useState<RankedItem[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    Promise.all([
      tmdb.getTrending('movie', 'week'),
      tmdb.getTrending('tv', 'week'),
      tmdb.getTopRated('tv'),
    ])
      .then(([movieRes, tvRes, topTvRes]) => {
        if (!live) return;
        setTopMovies(
          (movieRes.results || []).slice(0, 5).map((m: any) => ({
            id: m.id,
            title: m.title || m.original_title,
            poster_path: m.poster_path,
            year: m.release_date?.slice(0, 4),
            rating: m.vote_average,
            type: 'movie',
          }))
        );
        setTrendingShows(
          (tvRes.results || []).slice(0, 5).map((s: any) => ({
            id: s.id,
            title: s.name || s.original_name,
            poster_path: s.poster_path,
            year: s.first_air_date?.slice(0, 4),
            rating: s.vote_average,
            type: 'tv',
          }))
        );
        setTopRatedShows(
          (topTvRes.results || []).slice(0, 5).map((s: any) => ({
            id: s.id,
            title: s.name || s.original_name,
            poster_path: s.poster_path,
            year: s.first_air_date?.slice(0, 4),
            rating: s.vote_average,
            type: 'tv',
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.warn('HomeSidebar fetch warning:', err);
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, []);

  const renderRankedList = (
    items: RankedItem[],
    accentColor: string = 'rgba(201,162,75,0.85)'
  ) => (
    <ol className="space-y-1">
      {items.map((item, i) => (
        <li key={item.id}>
          <Link
            to={`/${item.type}/${item.id}`}
            className="group flex items-center gap-3 rounded-2xl p-2 transition-all duration-200 hover:bg-white/[0.06] hover:translate-x-1"
          >
            <span
              aria-hidden="true"
              className="w-8 shrink-0 text-right font-display text-5xl font-black leading-none text-transparent select-none transition-transform group-hover:scale-105"
              style={{ WebkitTextStroke: `1.5px ${accentColor}` }}
            >
              {i + 1}
            </span>
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                alt={item.title}
                loading="lazy"
                className="h-[4.2rem] w-11 shrink-0 rounded-lg bg-neutral-900 object-cover shadow-md group-hover:ring-1 group-hover:ring-[#c9a24b]/50 transition-all"
              />
            ) : (
              <div className="h-[4.2rem] w-11 shrink-0 rounded-lg bg-white/[0.05] flex items-center justify-center">
                <Film className="h-4 w-4 text-white/20" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white/90 group-hover:text-[#f5c542] transition-colors">
                {item.title}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-white/45 font-mono">
                <span>{item.year || '2026'}</span>
                {item.rating && item.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-[#f5c542] font-semibold">
                    <Star className="h-3 w-3 fill-[#f5c542] text-[#f5c542]" />
                    {item.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <aside aria-label="Trending and popular sidebar" className="space-y-10">
      {/* ── 1. Top Movies This Week ── */}
      <section className="rounded-3xl border border-[#c9a24b]/20 bg-[#140a0d]/85 p-4 sm:p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.2)]">
              <Film className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold tracking-tight text-white">Top Movies</h2>
              <p className="text-[11px] font-mono text-white/40">Most popular this week</p>
            </div>
          </div>
          <Link
            to="/movies"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-[#f5c542] hover:text-[#ffd875] hover:bg-[#c9a24b]/15 transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : (
          renderRankedList(topMovies, 'rgba(201,162,75,0.9)')
        )}
      </section>

      {/* ── 2. Trending TV Shows ── */}
      <section className="rounded-3xl border border-[#c9a24b]/20 bg-[#140a0d]/85 p-4 sm:p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.2)]">
              <Tv className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold tracking-tight text-white">Trending Shows</h2>
              <p className="text-[11px] font-mono text-white/40">Binge-worthy series now</p>
            </div>
          </div>
          <Link
            to="/tv"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-[#f5c542] hover:text-[#ffd875] hover:bg-[#c9a24b]/15 transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : (
          renderRankedList(trendingShows, 'rgba(201,162,75,0.9)')
        )}
      </section>

      {/* ── 3. Top Rated Shows & Masterpieces ── */}
      <section className="rounded-3xl border border-[#c9a24b]/20 bg-[#140a0d]/85 p-4 sm:p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542] shadow-[0_0_12px_rgba(245,197,66,0.2)]">
              <Trophy className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold tracking-tight text-white">Top Rated TV</h2>
              <p className="text-[11px] font-mono text-white/40">Critically acclaimed hits</p>
            </div>
          </div>
          <Link
            to="/tv"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-[#f5c542] hover:text-[#ffd875] hover:bg-[#c9a24b]/15 transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : (
          renderRankedList(topRatedShows, 'rgba(201,162,75,0.9)')
        )}
      </section>

      {/* ── 4. Community Buzz & Hot Topics ── */}
      <section className="rounded-3xl border border-[#c9a24b]/20 bg-gradient-to-br from-[#140a0d] to-[#1a0f14] p-4 sm:p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-[#f5c542]">
              <Flame className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-display text-base font-extrabold tracking-tight text-white">Community Buzz</h2>
          </div>
          <Link
            to="/community"
            className="flex items-center gap-1 text-xs font-bold text-[#f5c542] hover:text-[#ffd875] transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <p className="text-xs text-white/50 mb-3">Join conversations with fellow cinephiles</p>

        <div className="space-y-2 mb-4">
          {[
            { tag: '#AbsoluteCinema', count: '240+ takes' },
            { tag: '#MustWatch2025', count: '180+ takes' },
            { tag: '#HiddenGems', count: '140+ takes' },
            { tag: '#WeekendWatch', count: '320+ takes' },
          ].map((topic) => (
            <Link
              key={topic.tag}
              to="/community?feed=global"
              className="flex items-center justify-between rounded-xl border border-[#c9a24b]/15 bg-white/[0.02] px-3 py-2 text-xs hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/10 transition-all"
            >
              <span className="font-semibold text-white/90">{topic.tag}</span>
              <span className="text-[11px] font-mono text-[#c9a24b]/80">{topic.count}</span>
            </Link>
          ))}
        </div>

        <Link
          to="/community/discussions"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5c542] hover:bg-[#e6b738] py-2.5 text-xs font-black text-[#1c120c] transition-all shadow-md shadow-[#f5c542]/20 hover:scale-[1.02]"
        >
          <MessageSquare className="h-3.5 w-3.5 fill-[#1c120c]" />
          <span>Start a Discussion</span>
        </Link>
      </section>

      {/* ── 5. Quick Genres & Explore ── */}
      <section className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-display text-base font-bold tracking-tight text-white">Explore Genres</h2>
          </div>
          <Link
            to="/genres"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>See all</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {POPULAR_GENRES.map((g) => (
            <Link
              key={g.id}
              to={`/genres`}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/25 hover:bg-white/[0.07] hover:text-white transition-all"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
};
