import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { TraktAnticipatedShelf } from '@/components/TraktAnticipatedShelf';
import { HomeCuratedShelves } from '@/components/HomeCuratedShelves';
import { HomeDirectorsSpotlight } from '@/components/HomeDirectorsSpotlight';
import { HomeNewLaunchesSection } from '@/components/HomeNewLaunchesSection';
import { HomeFranchiseSection } from '@/components/HomeFranchiseSection';
import { HomeSidebar } from '@/components/HomeSidebar';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Film, Flame, Award, Zap, Sparkles, Heart, Tv, Radio, Trophy, Clapperboard } from 'lucide-react';

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
  { key: 'top-rated', chip: 'Top Rated', icon: Award, title: 'Top Rated', accent: 'Masterpieces', subtitle: 'Critically acclaimed', fetch: () => tmdb.getTopRated('movie'), viewAllLink: '/movies' },
  { key: 'action', chip: 'Action', icon: Zap, title: 'Action', accent: 'Blockbusters', subtitle: 'Big, loud and fast', fetch: () => tmdb.getByGenre(28, 'movie'), viewAllLink: '/movies' },
  { key: 'scifi', chip: 'Sci-Fi', icon: Sparkles, title: 'Sci-Fi &', accent: 'Fantasy', subtitle: 'Worlds beyond ours', fetch: () => tmdb.getByGenre(878, 'movie'), viewAllLink: '/movies' },
  { key: 'drama', chip: 'Drama', icon: Heart, title: 'Gripping', accent: 'Drama', subtitle: 'Stories that stay with you', fetch: () => tmdb.getByGenre(18, 'movie'), viewAllLink: '/movies' },
  { key: 'tv-popular', chip: 'Popular TV', icon: Tv, title: 'Popular', accent: 'TV Series', subtitle: 'Worth binging', fetch: () => tmdb.getPopular('tv'), type: 'tv', viewAllLink: '/tv' },
  { key: 'tv-airing', chip: 'Airing Today', icon: Radio, title: 'Airing', accent: 'Today', subtitle: 'New episodes live', fetch: getAiringToday, type: 'tv', viewAllLink: '/schedule' },
  { key: 'tv-top', chip: 'Top TV', icon: Trophy, title: 'Top Rated', accent: 'TV Shows', subtitle: 'The best of television', fetch: () => tmdb.getTopRated('tv'), type: 'tv', viewAllLink: '/tv' },
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

/* Simple horizontal quick-nav with smooth scroll into view */
const JumpBar = () => {
  const handleJump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const jumpChips = [
    { key: 'new-launches', chip: 'Spotlight Drops' },
    { key: 'directors-spotlight', chip: 'Directors Vault' },
    { key: 'franchises', chip: 'Mega Franchises' },
    ...MAIN.filter((s) => s.chip).map((s) => ({ key: s.key, chip: s.chip! })),
  ];

  return (
    <nav
      aria-label="Jump to section"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {jumpChips.map((s) => (
        <a
          key={s.key}
          href={`#${s.key}`}
          onClick={(e) => handleJump(e, s.key)}
          className="shrink-0 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-1.5 text-[11px] font-mono text-white/50 transition-all hover:border-[#c9a24b]/40 hover:text-[#f5c542]"
        >
          {s.chip}
        </a>
      ))}
    </nav>
  );
};

const Home = () => {
  const { watchlist } = useWatchlist();
  const last = watchlist?.[0];
  const lastType: MediaType = (last?.media_type as MediaType) || 'movie';

  const fetchRecommended = useMemo(
    () => (last?.id ? () => tmdb.getRecommendations(last.id, lastType) : null),
    [last?.id, lastType]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="pb-28 md:pb-16 space-y-10 pt-24 sm:pt-28">

          {/* Quick-nav chips */}
          <JumpBar />

          {/* Personalised row */}
          {fetchRecommended && last?.title && (
            <section>
              <MovieRow
                icon={Sparkles}
                title="Because You Saved"
                accent={last.title}
                fetchData={fetchRecommended}
              />
            </section>
          )}

          {/* 1. Spotlight Drops & Launches (Past 2 Weeks & Coming 1 Month Live Stream) — Top of Home */}
          <HomeNewLaunchesSection />

          {/* 2. Directors Vault Showcase — Full Width */}
          <HomeDirectorsSpotlight />

          {/* 3. Mega Franchises & Cinematic Universes (Marvel, Harry Potter, DC, Star Wars, LOTR, etc.) */}
          <HomeFranchiseSection />

          {/* 4. Curated Shelves & Trending paired with Sidebar */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem] items-start">
            {/* Shelves column */}
            <div className="min-w-0 space-y-10">
              <HomeCuratedShelves />
              {TOP.map((s) => <Row key={s.key} s={s} />)}
            </div>

            {/* Sidebar */}
            <div>
              <HomeSidebar />
            </div>
          </div>

          {/* 4. Trakt Anticipated Shelf — Full Width */}
          <TraktAnticipatedShelf />

          {/* 5. Main Category & Genre Shelves (Top Rated, Action, Sci-Fi, Drama, TV) — Full Width */}
          <div className="space-y-10">
            {MAIN.map((s) => <Row key={s.key} s={s} />)}
          </div>

        </div>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#0a0608] pb-28 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="focus:outline-none">
              <img
                src="/assets/branding/movieguy-hero-tight.png"
                alt="MovieGuy"
                className="h-[18px] sm:h-[20px] w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
            <span className="text-[11px] font-mono text-white/25">Honest reviews for cinema &amp; television</span>
          </div>
          <span className="text-[11px] font-mono text-white/20">
            © {new Date().getFullYear()} MovieGuy
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Home;

