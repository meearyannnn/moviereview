import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '@/components/Hero';
import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { TraktAnticipatedShelf } from '@/components/TraktAnticipatedShelf';
import { HomeCuratedShelves } from '@/components/HomeCuratedShelves';
import { HomeSidebar } from '@/components/HomeSidebar';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Film, Flame, Award, Zap, Sparkles, Heart, Tv, Radio, Trophy } from 'lucide-react';

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

// Jump bar: one tap to any shelf below. Scrolls sideways on phones.
const JumpBar = () => (
  <nav aria-label="Jump to a shelf" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {MAIN.filter((s) => s.chip).map((s) => (
      <a
        key={s.key}
        href={`#${s.key}`}
        className="shrink-0 rounded-full border border-[#c9a24b]/25 bg-[#140c10]/80 px-4 py-1.5 text-xs font-mono font-medium text-white/70 transition-all hover:border-[#c9a24b]/60 hover:text-[#f5c542] hover:bg-[#c9a24b]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a24b]/50 shadow-sm"
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
    <div className="min-h-screen overflow-x-hidden bg-[#0a0608] text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
      <Navbar />

      {/* ── Cinema Projector Lighting & Curtain Gradients ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_top,_rgba(245,197,66,0.07)_0%,_rgba(201,162,75,0.03)_40%,_transparent_75%)] z-0" />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-black/90 via-[#140a0d]/40 to-transparent z-0" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-black/90 via-[#140a0d]/40 to-transparent z-0" />

      <main className="relative z-10">
        <Hero />

        <div className="mx-auto max-w-7xl space-y-14 px-4 pb-28 pt-8 sm:px-6 md:pb-16 lg:px-8">
          <JumpBar />

          {fetchRecommended && lastTitle && (
            <section>
              <MovieRow icon={Sparkles} title="Because You Saved" accent={lastTitle} fetchData={fetchRecommended} />
            </section>
          )}

          {/* Two columns on wide screens: shelves on the left, the rich sidebar beside them */}
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
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

      <footer className="safe-bottom-content border-t border-[#c9a24b]/20 bg-[#0a0608] pb-28 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <span className="font-display font-extrabold text-white">
              Movie<span className="text-[#f5c542]">Guy</span>
            </span>
            <span className="ml-3 font-mono text-xs text-white/40">Honest reviews for movies and TV</span>
          </div>
          <div className="font-mono text-xs text-white/40">© {new Date().getFullYear()} MovieGuy · Data from TMDB</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
