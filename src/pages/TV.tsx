import { useEffect, useState } from 'react';
import { MovieCard } from '@/components/MovieCard';
import { Navbar } from '@/components/Navbar';
import { TraktShowsShelves } from '@/components/TraktShowsShelves';
import { WebChannelsSection } from '@/components/WebChannelsSection';
import { tmdb, type Movie } from '@/services/tmdb';
import { Tv, Flame, TrendingUp, Award } from 'lucide-react';

const SKELETON_COUNT = 18;

const TVPage = () => {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'topRated'>('trending');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trendingData, popularData, topRatedData] = await Promise.all([
          tmdb.getTrending('tv', 'week'),
          tmdb.getPopular('tv'),
          tmdb.getTopRated('tv'),
        ]);
        setTrending(trendingData.results || []);
        setPopular(popularData.results || []);
        setTopRated(topRatedData.results || []);
      } catch (error) {
        console.error('Error loading TV shows:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getActiveList = () => {
    if (activeTab === 'popular') return popular;
    if (activeTab === 'topRated') return topRated;
    return trending;
  };

  const TABS = [
    { key: 'trending' as const, label: 'Trending', icon: Flame },
    { key: 'popular' as const, label: 'Popular', icon: TrendingUp },
    { key: 'topRated' as const, label: 'Top Rated', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#060810] text-[#f8fafc] overflow-x-hidden selection:bg-red-600 selection:text-white">
      <Navbar />

      <div className="pt-24 sm:pt-28 pb-32 md:pb-20 safe-bottom-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tv className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-red-500/80 font-display">
                Television Series
              </span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-none">
              Binge Worthy Series
            </h1>
          </div>

          {/* Tab pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] flex-shrink-0">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={[
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black font-display uppercase tracking-wide transition-all duration-200 whitespace-nowrap',
                  activeTab === key
                    ? 'bg-red-600 text-white shadow-[0_2px_12px_rgba(220,38,38,0.4)]'
                    : 'text-white/50 hover:text-white',
                ].join(' ')}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Streaming Networks ── */}
        <WebChannelsSection />

        {/* ── Shelves ── */}
        <TraktShowsShelves />

        {/* ── TV Grid ── */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-0.5 h-5 bg-red-500 rounded-full" />
            <h2 className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-white to-red-300 bg-clip-text text-transparent">
              {activeTab === 'trending' ? 'Trending This Week' : activeTab === 'popular' ? 'Most Popular' : 'All-Time Top Rated'}
            </h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" />
                  <div className="h-3.5 w-3/4 rounded bg-white/[0.04] animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-white/[0.04] animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
              {getActiveList().map(show => (
                <MovieCard key={show.id} movie={show} type="tv" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVPage;

