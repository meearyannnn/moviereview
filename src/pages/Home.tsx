import { useMemo } from 'react';
import { Hero } from '@/components/Hero';
import { MovieRow } from '@/components/MovieRow';
import { Navbar } from '@/components/Navbar';
import { TraktAnticipatedShelf } from '@/components/TraktAnticipatedShelf';
import { HomeCuratedShelves } from '@/components/HomeCuratedShelves';
import { tmdb, type Movie } from '@/services/tmdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import {
  Film,
  Flame,
  Award,
  Zap,
  Sparkles,
  Heart,
  Tv,
  Radio,
  Trophy,
} from 'lucide-react';

type MediaType = 'movie' | 'tv';

interface Section {
  key: string;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  subtitle: string;
  fetch: () => Promise<any>;
  type?: MediaType;
}

// Defined once, outside the component, so rows never get a new function
// identity on re-render and don't refetch by accident.
const getAiringToday = async () => {
  const data = await tmdb.getTrending('tv', 'day');
  const results = data.results?.filter((show: Movie) => show.first_air_date).slice(0, 15) || [];
  return { results };
};

const TOP: Section[] = [
  { key: 'latest', icon: Film, title: 'Latest', accent: 'Releases', subtitle: 'Trending in theaters this week', fetch: () => tmdb.getTrending('movie', 'week') },
  { key: 'trending', icon: Flame, title: 'Trending', accent: 'Now', subtitle: 'What everyone is watching', fetch: () => tmdb.getPopular('movie') },
];

const MAIN: Section[] = [
  { key: 'top-rated', icon: Award, title: 'Top Rated', accent: 'Masterpieces', subtitle: 'Critically acclaimed', fetch: () => tmdb.getTopRated('movie') },
  { key: 'action', icon: Zap, title: 'Action', accent: 'Blockbusters', subtitle: 'Big, loud and fast', fetch: () => tmdb.getByGenre(28, 'movie') },
  { key: 'scifi', icon: Sparkles, title: 'Sci-Fi &', accent: 'Fantasy', subtitle: 'Worlds beyond ours', fetch: () => tmdb.getByGenre(878, 'movie') },
  { key: 'drama', icon: Heart, title: 'Gripping', accent: 'Drama', subtitle: 'Stories that stay with you', fetch: () => tmdb.getByGenre(18, 'movie') },
  { key: 'tv-popular', icon: Tv, title: 'Popular', accent: 'TV Series', subtitle: 'Worth binging', fetch: () => tmdb.getPopular('tv'), type: 'tv' },
  { key: 'tv-airing', icon: Radio, title: 'Airing', accent: 'Today', subtitle: 'New episodes', fetch: getAiringToday, type: 'tv' },
  { key: 'tv-top', icon: Trophy, title: 'Top Rated', accent: 'TV Shows', subtitle: 'The best of TV', fetch: () => tmdb.getTopRated('tv'), type: 'tv' },
];

const Row = ({ s }: { s: Section }) => (
  <section>
    <MovieRow
      icon={s.icon}
      title={s.title}
      accent={s.accent}
      subtitle={s.subtitle}
      fetchData={s.fetch}
      type={s.type}
    />
  </section>
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
    <div className="min-h-screen overflow-x-hidden bg-[#060810] text-[#f8fafc] selection:bg-red-600 selection:text-white">
      <Navbar />

      <main>
        <Hero />

        <div className="mx-auto max-w-7xl space-y-14 px-4 pb-28 pt-10 sm:px-6 md:pb-16 lg:px-8">
          {fetchRecommended && lastTitle && (
            <section>
              <MovieRow
                icon={Sparkles}
                title="Because You Saved"
                accent={lastTitle}
                fetchData={fetchRecommended}
              />
            </section>
          )}

          <HomeCuratedShelves />

          {TOP.map((s) => <Row key={s.key} s={s} />)}

          <TraktAnticipatedShelf />

          {MAIN.map((s) => <Row key={s.key} s={s} />)}
        </div>
      </main>

      <footer className="border-t border-white/[0.06] pb-28 md:pb-10 safe-bottom-content">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <span className="font-display font-bold text-white">
              Movie<span className="text-red-500">Guy</span>
            </span>
            <span className="ml-3">Honest reviews for movies and TV</span>
          </div>
          <div>Â© {new Date().getFullYear()} MovieGuy Â· Data from TMDB</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
