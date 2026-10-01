import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Film, Tv, Trophy, Flame, Compass, ArrowUpRight,
  MessageSquare, Star, Sparkles, Crown, Moon, Clapperboard,
} from 'lucide-react';
import { tmdb } from '@/services/tmdb';

interface RankedItem {
  id: number;
  title: string;
  poster_path: string | null;
  year?: string;
  rating?: number;
  type: 'movie' | 'tv';
}

const GENRES = [
  { id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' }, { id: 35, name: 'Comedy' },
  { id: 16, name: 'Animation' }, { id: 53, name: 'Thriller' },
  { id: 18, name: 'Drama' }, { id: 14, name: 'Fantasy' },
];

/* ─── Shared ranked-list row ─────────────────────────────────────────────── */
const RankRow = ({ item, rank }: { item: RankedItem; rank: number }) => (
  <li>
    <Link
      to={`/${item.type}/${item.id}`}
      className="group flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 transition-all hover:bg-white/[0.04]"
    >
      {/* Ghost rank number */}
      <span
        className="w-8 flex-shrink-0 font-display text-4xl font-black leading-none text-transparent select-none text-right"
        style={{ WebkitTextStroke: '1.5px rgba(201,162,75,0.45)' }}
        aria-hidden
      >
        {rank}
      </span>

      {/* Poster */}
      {item.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="h-14 w-10 flex-shrink-0 rounded-lg object-cover border border-white/[0.07] group-hover:border-[#c9a24b]/50 transition-all"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      ) : (
        <div className="h-14 w-10 flex-shrink-0 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.05]">
          <Film className="w-4 h-4 text-white/20" />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white/85 group-hover:text-[#f5c542] truncate transition-colors leading-snug">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-white/35">
          <span>{item.year || '—'}</span>
          {item.rating && item.rating > 0 && (
            <span className="flex items-center gap-0.5 text-[#e5b95a]">
              <Star className="w-2.5 h-2.5 fill-current stroke-none" />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  </li>
);

/* ─── Sidebar section card ───────────────────────────────────────────────── */
const SideCard = ({
  icon: Icon,
  label,
  link,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  link: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#150a11]/80 to-[#0c0609]/80 overflow-hidden">
    {/* Card header strip */}
    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.05]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-[#c9a24b]/12 border border-[#c9a24b]/20 flex items-center justify-center text-[#f5c542]">
          <Icon className="w-3 h-3" />
        </div>
        <span className="font-display text-sm font-black text-white tracking-tight">{label}</span>
      </div>
      <Link
        to={link}
        className="flex items-center gap-0.5 text-[10px] font-mono font-bold text-[#c9a24b]/55 hover:text-[#f5c542] transition-colors"
      >
        All <ArrowUpRight className="w-2.5 h-2.5" />
      </Link>
    </div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

const Skeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 rounded bg-white/[0.04]" />
        <div className="h-14 w-10 rounded-lg bg-white/[0.04]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
          <div className="h-2.5 w-1/2 rounded bg-white/[0.04]" />
        </div>
      </div>
    ))}
  </div>
);

export const HomeSidebar = () => {
  const [topMovies, setTopMovies] = useState<RankedItem[]>([]);
  const [trendingShows, setTrendingShows] = useState<RankedItem[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<RankedItem[]>([]);
  const [hiddenGems, setHiddenGems] = useState<RankedItem[]>([]);
  const [timelessVault, setTimelessVault] = useState<RankedItem[]>([]);
  const [lateNight, setLateNight] = useState<RankedItem[]>([]);
  const [binge, setBinge] = useState<RankedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    const toItem = (m: any, type: 'movie' | 'tv'): RankedItem => ({
      id: m.id,
      title: m.title || m.name || m.original_title || m.original_name,
      poster_path: m.poster_path,
      year: (m.release_date || m.first_air_date)?.slice(0, 4),
      rating: m.vote_average,
      type,
    });

    Promise.all([
      tmdb.getTrending('movie', 'week'),
      tmdb.getTrending('tv', 'week'),
      tmdb.getTopRated('tv'),
      tmdb.discover('movie', 'vote_average.gte=8.0&vote_count.gte=300&vote_count.lte=4000&sort_by=vote_average.desc'),
      tmdb.discover('movie', 'primary_release_date.lte=2002-01-01&vote_average.gte=8.2&vote_count.gte=1000&sort_by=vote_average.desc'),
      tmdb.discover('movie', 'with_genres=27|53&sort_by=popularity.desc'),
      tmdb.discover('tv', 'vote_average.gte=8.2&vote_count.gte=500&sort_by=popularity.desc'),
    ]).then(([m, tv, topTv, gems, vault, thrills, bingeRes]) => {
      if (!live) return;
      setTopMovies((m.results || []).slice(0, 5).map((x: any) => toItem(x, 'movie')));
      setTrendingShows((tv.results || []).slice(0, 5).map((x: any) => toItem(x, 'tv')));
      setTopRatedShows((topTv.results || []).slice(0, 5).map((x: any) => toItem(x, 'tv')));
      setHiddenGems((gems.results || []).slice(0, 5).map((x: any) => toItem(x, 'movie')));
      setTimelessVault((vault.results || []).slice(0, 5).map((x: any) => toItem(x, 'movie')));
      setLateNight((thrills.results || []).slice(0, 5).map((x: any) => toItem(x, 'movie')));
      setBinge((bingeRes.results || []).slice(0, 5).map((x: any) => toItem(x, 'tv')));
      setLoading(false);
    }).catch(() => { if (live) setLoading(false); });

    return () => { live = false; };
  }, []);

  return (
    <aside className="space-y-4" aria-label="Sidebar — Charts & Community">

      <SideCard icon={Film} label="Top Movies" link="/movies">
        {loading ? <Skeleton /> : <ol className="space-y-0.5">{topMovies.map((it, i) => <RankRow key={it.id} item={it} rank={i + 1} />)}</ol>}
      </SideCard>

      <SideCard icon={Tv} label="Trending Shows" link="/tv">
        {loading ? <Skeleton /> : <ol className="space-y-0.5">{trendingShows.map((it, i) => <RankRow key={it.id} item={it} rank={i + 1} />)}</ol>}
      </SideCard>

      <SideCard icon={Trophy} label="Top Rated TV" link="/tv">
        {loading ? <Skeleton /> : <ol className="space-y-0.5">{topRatedShows.map((it, i) => <RankRow key={it.id} item={it} rank={i + 1} />)}</ol>}
      </SideCard>

      <SideCard icon={Sparkles} label="Hidden Gems" link="/explore">
        {loading ? <Skeleton /> : <ol className="space-y-0.5">{hiddenGems.map((it, i) => <RankRow key={it.id} item={it} rank={i + 1} />)}</ol>}
      </SideCard>

      <SideCard icon={Crown} label="Timeless Vault" link="/time-machine">
        {loading ? <Skeleton /> : <ol className="space-y-0.5">{timelessVault.map((it, i) => <RankRow key={it.id} item={it} rank={i + 1} />)}</ol>}
      </SideCard>

      <SideCard icon={Moon} label="Late-Night Thrills" link="/genres">
        {loading ? <Skeleton /> : <ol className="space-y-0.5">{lateNight.map((it, i) => <RankRow key={it.id} item={it} rank={i + 1} />)}</ol>}
      </SideCard>

      <SideCard icon={Clapperboard} label="Binge Champions" link="/tv">
        {loading ? <Skeleton /> : <ol className="space-y-0.5">{binge.map((it, i) => <RankRow key={it.id} item={it} rank={i + 1} />)}</ol>}
      </SideCard>

      {/* ── Community Buzz ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#c9a24b]/20 bg-gradient-to-br from-[#1c0f18] to-[#0a0608] p-5">
        <div className="pointer-events-none absolute -top-6 -right-6 w-28 h-28 bg-[#f5c542]/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/25 flex items-center justify-center text-[#f5c542]">
                <Flame className="w-3 h-3" />
              </div>
              <span className="font-display text-sm font-black text-white">Community Buzz</span>
            </div>
            <Link to="/community" className="text-[10px] font-mono font-bold text-[#c9a24b]/60 hover:text-[#f5c542] transition-colors">
              Join →
            </Link>
          </div>

          <p className="text-[11px] font-mono text-white/35 mb-3">What cinephiles are talking about</p>

          <div className="space-y-2 mb-4">
            {[
              { tag: '#AbsoluteCinema', count: '240+' },
              { tag: '#MustWatch2025', count: '180+' },
              { tag: '#HiddenGems', count: '140+' },
              { tag: '#WeekendWatch', count: '320+' },
            ].map((topic) => (
              <Link
                key={topic.tag}
                to="/community?feed=global"
                className="flex items-center justify-between rounded-xl border border-[#c9a24b]/10 bg-white/[0.02] px-3 py-2 hover:border-[#c9a24b]/35 hover:bg-[#c9a24b]/8 transition-all group"
              >
                <span className="text-xs font-semibold text-white/75 group-hover:text-white transition-colors">{topic.tag}</span>
                <span className="text-[10px] font-mono text-[#c9a24b]/60">{topic.count} takes</span>
              </Link>
            ))}
          </div>

          <Link
            to="/community/discussions"
            className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a24b] to-[#e5b95a] text-[#1c120c] text-xs font-black hover:brightness-110 transition-all shadow-lg shadow-[#c9a24b]/20 active:scale-[0.98]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Start a Discussion
          </Link>
        </div>
      </div>

      {/* ── Directors Vault Showcase ── */}
      <div className="rounded-2xl border border-[#c9a24b]/20 bg-gradient-to-br from-[#180d14] to-[#0a0608] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#c9a24b]/15 border border-[#c9a24b]/25 flex items-center justify-center text-[#f5c542]">
              <Clapperboard className="w-3 h-3" />
            </div>
            <span className="font-display text-sm font-black text-white">Directors Vault</span>
          </div>
          <Link to="/directors" className="text-[10px] font-mono font-bold text-[#c9a24b]/80 hover:text-[#f5c542] transition-colors">
            All 45+ →
          </Link>
        </div>

        <p className="text-[11px] font-mono text-white/40 mb-3">Masterminds behind cinema's greatest stories</p>

        <div className="space-y-1.5 mb-3">
          {[
            { id: 525, name: 'Christopher Nolan', era: '1998–Present', films: 19, img: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' },
            { id: 137427, name: 'Denis Villeneuve', era: '1998–Present', films: 24, img: '/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg' },
            { id: 138, name: 'Quentin Tarantino', era: '1992–Present', films: 15, img: '/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg' },
            { id: 1032, name: 'Martin Scorsese', era: '1967–Present', films: 58, img: '/g3DjfKsgZQWZiw30I20hZVk1oMX.jpg' },
          ].map((d) => (
            <Link
              key={d.id}
              to={`/director/${d.id}`}
              className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-2 hover:border-[#c9a24b]/35 hover:bg-[#c9a24b]/10 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={`https://image.tmdb.org/t/p/w92${d.img}`}
                  alt={d.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                  className="w-8 h-8 rounded-full object-cover border border-white/[0.1] grayscale group-hover:grayscale-0 transition-all"
                />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white/85 group-hover:text-[#f5c542] truncate block transition-colors">
                    {d.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#c9a24b]/70 block truncate">
                    {d.era}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/30 shrink-0">
                {d.films} films
              </span>
            </Link>
          ))}
        </div>

        <Link
          to="/directors"
          className="flex w-full items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] hover:bg-[#c9a24b]/15 border border-[#c9a24b]/20 hover:border-[#f5c542]/50 text-[#f5c542] text-xs font-mono transition-all"
        >
          <span>Explore All 45+ Directors</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Explore Genres ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50">
              <Compass className="w-3 h-3" />
            </div>
            <span className="font-display text-sm font-black text-white">Explore Genres</span>
          </div>
          <Link to="/genres" className="text-[10px] font-mono font-bold text-white/35 hover:text-white/70 transition-colors">All →</Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <Link
              key={g.id}
              to="/genres"
              className="rounded-full border border-[#c9a24b]/15 bg-[#c9a24b]/5 px-3 py-1.5 text-[11px] font-mono text-white/55 hover:border-[#c9a24b]/50 hover:bg-[#c9a24b]/12 hover:text-[#f5c542] transition-all"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};
