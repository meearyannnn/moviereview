import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { TraktAnticipatedShelf } from '@/components/TraktAnticipatedShelf';
import { HomeCuratedShelves } from '@/components/HomeCuratedShelves';
import { HomeSidebar } from '@/components/HomeSidebar';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Film, Flame, Award, Zap, Sparkles, Heart, Tv, Radio, Trophy } from 'lucide-react';
import { TicketLoader } from '@/components/TicketLoader';

type MediaType = 'movie' | 'tv';

interface Section {
  key: string;
  chip?: string; // short label for the jump bar
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  subtitle: string;
  fetch: () => Promise<any>;
  type?: MediaType;
  viewAllLink?: string;
}

// Defined outside the component so rows keep the same function identity and don't refetch.
const getAiringToday = async () => {
  const data = await tmdb.getTrending('tv', 'day');
  return { results: data.results?.filter((s: Movie) => s.first_air_date).slice(0, 15) || [] };
};

const TOP: Section[] = [
  { key: 'latest', icon: Film, title: 'Latest', accent: 'Releases', subtitle: 'Trending in theaters this week', fetch: () => tmdb.getTrending('movie', 'week'), viewAllLink: '/movies' },
  { key: 'trending', icon: Flame, title: 'Trending', accent: 'Now', subtitle: 'What everyone is watching', fetch: () => tmdb.getPopular('movie'), viewAllLink: '/movies' },
];

const MAIN: Section[] = [
  { key: 'top-rated', chip: 'Top rated', icon: Award, title: 'Top Rated', accent: 'Masterpieces', subtitle: 'Critically acclaimed', fetch: () => tmdb.getTopRated('movie'), viewAllLink: '/movies' },
  { key: 'action', chip: 'Action', icon: Zap, title: 'Action', accent: 'Blockbusters', subtitle: 'Big, loud and fast', fetch: () => tmdb.getByGenre(28, 'movie'), viewAllLink: '/movies' },
  { key: 'scifi', chip: 'Sci-Fi', icon: Sparkles, title: 'Sci-Fi &', accent: 'Fantasy', subtitle: 'Worlds beyond ours', fetch: () => tmdb.getByGenre(878, 'movie'), viewAllLink: '/movies' },
  { key: 'drama', chip: 'Drama', icon: Heart, title: 'Gripping', accent: 'Drama', subtitle: 'Stories that stay with you', fetch: () => tmdb.getByGenre(18, 'movie'), viewAllLink: '/movies' },
  { key: 'tv-popular', chip: 'Popular TV', icon: Tv, title: 'Popular', accent: 'TV Series', subtitle: 'Worth binging', fetch: () => tmdb.getPopular('tv'), type: 'tv', viewAllLink: '/tv' },
  { key: 'tv-airing', chip: 'Airing today', icon: Radio, title: 'Airing', accent: 'Today', subtitle: 'New episodes', fetch: getAiringToday, type: 'tv', viewAllLink: '/schedule' },
  { key: 'tv-top', chip: 'Top TV', icon: Trophy, title: 'Top Rated', accent: 'TV Shows', subtitle: 'The best of TV', fetch: () => tmdb.getTopRated('tv'), type: 'tv', viewAllLink: '/tv' },
];

const Row = ({ s }: { s: Section }) => (
  <section id={s.key} className="scroll-mt-20">
    <MovieRow
      icon={s.icon}
      title={s.title}
      accent={s.accent}
      subtitle={s.subtitle}
      fetchData={s.fetch}
      type={s.type}
      viewAllLink={s.viewAllLink}
    />
  </section>
);

/* ─────────────────────────────────────────────────────────────
   Trending: one large featured card plus a grid of posters.
   The page's fixed navbar needs clearance, hence the top padding.
   ───────────────────────────────────────────────────────────── */
interface Pick {
  id: number;
  type: MediaType;
  title: string;
  year: string;
  rating: number;
  overview: string;
  poster: string;
  backdrop: string;
}

const IMG = 'https://image.tmdb.org/t/p';

const toPick = (m: any, type: MediaType): Pick => {
  const date: string = (type === 'movie' ? m.release_date : m.first_air_date) || '';
  return {
    id: m.id,
    type,
    title: m.title || m.name,
    year: date.slice(0, 4),
    rating: m.vote_average || 0,
    overview: m.overview || '',
    poster: m.poster_path ? `${IMG}/w342${m.poster_path}` : '',
    backdrop: m.backdrop_path ? `${IMG}/w1280${m.backdrop_path}` : m.poster_path ? `${IMG}/w780${m.poster_path}` : '',
  };
};

const meta = (p: Pick) =>
  [p.type === 'tv' ? 'Series' : 'Film', p.year].filter(Boolean).join(', ');

const Trending = () => {
  const [picks, setPicks] = useState<Pick[] | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([tmdb.getTrending('movie', 'week'), tmdb.getTrending('tv', 'day')])
      .then(([movies, shows]) => {
        if (!alive) return;
        const m = (movies.results || []).filter((x: any) => x.poster_path).slice(0, 5).map((x: any) => toPick(x, 'movie'));
        const t = (shows.results || []).filter((x: any) => x.poster_path).slice(0, 4).map((x: any) => toPick(x, 'tv'));
        const mixed: Pick[] = [];
        for (let i = 0; i < Math.max(m.length, t.length); i++) {
          if (m[i]) mixed.push(m[i]);
          if (t[i]) mixed.push(t[i]);
        }
        setPicks(mixed.slice(0, 9));
      })
      .catch(() => alive && setPicks([]));
    return () => {
      alive = false;
    };
  }, []);

  const feature = picks?.find((p) => p.backdrop && !p.backdrop.includes('unsplash')) || picks?.[0];
  const rest = picks ? picks.filter((p) => p !== feature) : [];

  return (
    <section aria-labelledby="trending-heading" className="pb-14 pt-24 sm:pt-28">
      {/* ── Marquee Header with MG Logo ── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#c9a24b]/20 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a24b]/35 bg-[#1a110a]/90 px-3 py-1 shadow-[0_0_15px_rgba(201,162,75,0.25)] backdrop-blur-md">
              <img
                src="/assets/branding/ticket-loader.png"
                alt=""
                className="h-3.5 w-auto object-contain animate-pulse"
              />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#f5c542]">
                Box Office Marquee
              </span>
            </span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="font-mono text-xs text-white/40">Curated weekly cinema picks</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 id="trending-heading" className="font-display text-2xl font-black tracking-tight text-[#efeae2] sm:text-4xl">
              Trending this week
            </h1>
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#c9a24b]/25 bg-[#140a0d] px-2.5 py-1 shadow-md shadow-black/60">
              <img
                src="/assets/branding/movieguy-logo-tight.png"
                alt="MG"
                className="h-4.5 w-auto object-contain brightness-110 drop-shadow-[0_0_8px_rgba(245,197,66,0.5)]"
              />
            </div>
          </div>
        </div>

        <Link
          to="/explore"
          className="group inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-[#c9a24b]/20 bg-white/[0.03] px-4 py-1.5 text-xs font-mono text-[#efeae2]/70 transition-all hover:border-[#f5c542]/60 hover:bg-[#f5c542]/10 hover:text-[#f5c542]"
        >
          <span>Browse all releases</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1 text-[#f5c542]">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {picks === null && (
          <div className="col-span-full py-16 flex justify-center">
            <TicketLoader size="lg" label="Curating Trending Cinema…" />
          </div>
        )}

        {feature && (
          <Link
            to={`/${feature.type}/${feature.id}`}
            className="group relative col-span-3 aspect-[16/10] overflow-hidden rounded-2xl bg-white/5 border border-[#c9a24b]/25 shadow-2xl transition-all duration-300 hover:border-[#f5c542]/60 hover:shadow-[0_16px_50px_rgba(201,162,75,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f5c542] md:col-span-2 md:row-span-2 md:aspect-auto"
          >
            {/* MG Top Pick Ribbon */}
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 rounded-full border border-[#c9a24b]/40 bg-[#0a0608]/90 px-2.5 py-1 shadow-xl shadow-black/90 backdrop-blur-md">
              <img
                src="/assets/branding/ticket-loader.png"
                alt=""
                className="h-3 w-auto object-contain"
              />
              <span className="font-mono text-[9px] font-black uppercase tracking-widest text-[#f5c542]">
                MG Spotlight
              </span>
            </div>

            <img
              src={feature.backdrop || FALLBACK_BACKDROP}
              alt={feature.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none"
              onError={(e) => {
                const target = e.currentTarget;
                if (feature.poster && target.src !== feature.poster) {
                  target.src = feature.poster;
                } else if (target.src !== FALLBACK_BACKDROP) {
                  target.src = FALLBACK_BACKDROP;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="text-xs font-mono text-[#f5c542] flex items-center gap-2">
                <span>{meta(feature)}</span>
                {feature.rating > 0 && (
                  <span className="flex items-center gap-1 rounded bg-[#f5c542]/20 px-1.5 py-0.5 font-bold text-[#f5c542]">
                    ★ {feature.rating.toFixed(1)}
                  </span>
                )}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">{feature.title}</h2>
              <p className="mt-2 line-clamp-2 max-w-md text-xs sm:text-sm leading-relaxed text-white/70">{feature.overview}</p>
            </div>
          </Link>
        )}

        {rest.map((p, i) => (
          <Link
            key={`${p.type}-${p.id}`}
            to={`/${p.type}/${p.id}`}
            className={`group block focus-visible:outline-none ${i >= 6 ? 'hidden sm:block' : ''}`}
          >
            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5 border border-white/10 transition-all duration-300 group-hover:border-[#f5c542]/50 group-hover:shadow-[0_12px_30px_rgba(201,162,75,0.2)] group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-[#f5c542]">
              <img
                src={p.poster || FALLBACK_POSTER}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_POSTER;
                }}
              />
            </div>
            <p className="mt-2.5 truncate text-sm font-medium text-[#efeae2]/90 group-hover:text-[#f5c542] transition-colors">{p.title}</p>
            <p className="text-xs font-mono text-[#efeae2]/45">{meta(p)}</p>
          </Link>
        ))}

        {picks?.length === 0 && <p className="col-span-full text-sm text-[#efeae2]/50">Nothing to show right now.</p>}
      </div>
    </section>
  );
};

// Jump bar: one tap to any shelf below. Scrolls sideways on phones.
const JumpBar = () => (
  <nav aria-label="Jump to a shelf" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {MAIN.filter((s) => s.chip).map((s) => (
      <a
        key={s.key}
        href={`#${s.key}`}
        className="shrink-0 rounded-full border border-white/10 px-4 py-1.5 text-sm text-[#efeae2]/65 transition-colors hover:border-white/30 hover:text-[#efeae2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#efeae2]/60"
      >
        {s.chip}
      </a>
    ))}
  </nav>
);

const Home = () => {
  const { watchlist } = useWatchlist();

  const last = watchlist?.[0];
  const lastId = last?.id;
  const lastTitle = last?.title;
  const lastType: MediaType = (last?.media_type as MediaType) || 'movie';

  const fetchRecommended = useMemo(
    () => (lastId ? () => tmdb.getRecommendations(lastId, lastType) : null),
    [lastId, lastType]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0c0c0e] text-[#efeae2] selection:bg-[#efeae2] selection:text-[#0c0c0e]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Trending />

        <div className="space-y-14 pb-28 md:pb-16">
          <JumpBar />

          {fetchRecommended && lastTitle && (
            <section>
              <MovieRow icon={Sparkles} title="Because You Saved" accent={lastTitle} fetchData={fetchRecommended} />
            </section>
          )}

          {/* Shelves on the left, the sidebar beside them on wide screens */}
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-14">
              <HomeCuratedShelves />
              {TOP.map((s) => <Row key={s.key} s={s} />)}
            </div>
            <HomeSidebar />
          </div>

          <TraktAnticipatedShelf />

          {MAIN.map((s) => <Row key={s.key} s={s} />)}
        </div>
      </main>

      <footer className="safe-bottom-content border-t border-white/10 pb-28 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/" className="inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#efeae2]/60">
              <img
                src="/assets/branding/movieguy-hero-tight.png"
                alt="MovieGuy"
                className="h-[18px] w-auto object-contain sm:h-[21px]"
              />
            </Link>
            <span className="text-sm text-[#efeae2]/45">Honest reviews for cinema and television</span>
          </div>
          <div className="text-xs text-[#efeae2]/40">© {new Date().getFullYear()} MovieGuy. Data from TMDB and Trakt.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;