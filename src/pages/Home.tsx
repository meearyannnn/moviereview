import { Link } from 'react-router-dom';

import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { TraktAnticipatedShelf } from '@/components/TraktAnticipatedShelf';
import { HomeCuratedShelves } from '@/components/HomeCuratedShelves';
import { HomeDirectorsSpotlight } from '@/components/HomeDirectorsSpotlight';
import { HomeNewLaunchesSection } from '@/components/HomeNewLaunchesSection';
import { HomeFranchiseSection } from '@/components/HomeFranchiseSection';
import { HomePersonalizedSection } from '@/components/HomePersonalizedSection';
import { DailyCinemaPollSection } from '@/components/home/DailyCinemaPollSection';
import { HomeSidebar } from '@/components/HomeSidebar';
import { tmdb, type Movie } from '@/services/tmdb';
import { Film, Flame, Award, Zap, Sparkles, Heart, Tv, Radio, Trophy } from 'lucide-react';

type MediaType = 'movie' | 'tv';

interface Section {
  key: string;
  chip?: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  subtitle: string;
  fetch: () => Promise<any>;
  type?: MediaType;
  viewAllLink?: string;
}

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
  { key: 'tv-airing', chip: 'Airing today', icon: Radio, title: 'Airing', accent: 'Today', subtitle: 'New episodes live', fetch: getAiringToday, type: 'tv', viewAllLink: '/schedule' },
  { key: 'tv-top', chip: 'Top TV', icon: Trophy, title: 'Top Rated', accent: 'TV Shows', subtitle: 'The best of television', fetch: () => tmdb.getTopRated('tv'), type: 'tv', viewAllLink: '/tv' },
];

// A div, not a section: MovieRow already renders its own <section>
const Row = ({ s }: { s: Section }) => (
  <div id={s.key} className="scroll-mt-20">
    <MovieRow
      icon={s.icon}
      title={s.title}
      accent={s.accent}
      subtitle={s.subtitle}
      fetchData={s.fetch}
      type={s.type}
      viewAllLink={s.viewAllLink}
    />
  </div>
);

const JUMP_CHIPS = [
  { key: 'new-launches', label: 'New releases' },
  { key: 'directors-spotlight', label: 'Directors' },
  { key: 'franchises', label: 'Franchises' },
  { key: 'for-you', label: 'For You' },
  { key: 'daily-poll', label: 'Daily Poll' },
  ...MAIN.filter((s) => s.chip).map((s) => ({ key: s.key, label: s.chip! })),
];

const JumpBar = () => {
  const jump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return; // let the browser handle the hash if the target isn't there
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Jump to section"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {JUMP_CHIPS.map((c) => (
        <a
          key={c.key}
          href={`#${c.key}`}
          onClick={(e) => jump(e, c.key)}
          className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.09] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
        >
          {c.label}
        </a>
      ))}
    </nav>
  );
};

const Home = () => {
  return (
    // overflow-x-clip, not -hidden: "hidden" turns this div into a scroll container
    // and silently breaks the sticky sidebar below
    <div className="relative min-h-screen overflow-x-clip bg-transparent text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Compact, clean spacing rhythm for the whole page. */}
        <div className="space-y-9 sm:space-y-10 pb-24 pt-20 sm:pt-24 md:pb-16">
          <JumpBar />

          <HomeNewLaunchesSection />
          <HomeDirectorsSpotlight />
          <HomeFranchiseSection />

          <HomePersonalizedSection />
          <DailyCinemaPollSection />

          {/*
            Shelves and sidebar share one grid. The sidebar spans every shelf row and is sticky,
            so it can never be taller than the column beside it.
            Mobile order: first shelves, sidebar, then the rest.
          */}
          <div className="grid gap-x-8 gap-y-9 sm:gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-9 sm:space-y-10 lg:col-start-1">
              <HomeCuratedShelves />
              {TOP.map((s) => (
                <Row key={s.key} s={s} />
              ))}
            </div>

            <aside
              aria-label="Sidebar"
              className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <HomeSidebar />
            </aside>

            <div className="min-w-0 lg:col-start-1">
              <TraktAnticipatedShelf />
            </div>

            <div className="min-w-0 space-y-9 sm:space-y-10 lg:col-start-1">
              {MAIN.map((s) => (
                <Row key={s.key} s={s} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] pb-28 md:pb-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]">
              <img
                src="/assets/branding/movieguy-hero-tight.png"
                alt="MovieGuy"
                className="h-[18px] w-auto object-contain opacity-80 transition-opacity hover:opacity-100 sm:h-[20px]"
              />
            </Link>
            <span className="text-xs text-white/30">Honest reviews for cinema &amp; television</span>
          </div>
          <span className="text-xs text-white/25">© {new Date().getFullYear()} MovieGuy</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;