// src/pages/community/CollectionsPage.tsx — Collections showcase powered by live Supabase & TMDB data
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Film,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, Spinner } from '@/components/community/communityUtils';
import { CollectionDetailModal } from '@/components/library/CollectionDetailModal';
import { collectionsService } from '@/services/collections';
import { userLibraryService, type UserCollection } from '@/services/userLibrary';
import { tmdb, type Movie } from '@/services/tmdb';
import { useAuth } from '@/contexts/AuthContext';

interface CuratedCollectionRow {
  id: string;
  title: string;
  topic?: string;
  creator: {
    username: string;
    avatarUrl?: string;
  };
  commentsCount: number;
  items: Array<{
    id: number;
    title: string;
    type: 'Movie' | 'TV';
    year: string;
    poster: string;
  }>;
}

const TOPICS = [
  'All Topics',
  'Trending Cinema',
  'Top Rated Masterpieces',
  'Sci-Fi & Cosmic Epics',
  'Crime & Mystery Thrillers',
  'Upcoming Box Office',
];

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CuratedCollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState('All Topics');
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected collection for CollectionDetailModal
  const [selectedCollection, setSelectedCollection] = useState<UserCollection | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    let cancelled = false;

    async function loadCollections() {
      setLoading(true);
      try {
        const rows: CuratedCollectionRow[] = [];

        // 1. Fetch public user-created collections from Supabase
        try {
          const publicCols = await collectionsService.getPublicCollections(10);
          for (const col of publicCols) {
            const items = await collectionsService.getItems(col.id);
            if (items.length > 0) {
              rows.push({
                id: col.id,
                title: col.title,
                topic: 'Community Showcase',
                creator: {
                  username: col.username || 'Cinephile',
                  avatarUrl: col.avatar_url,
                },
                commentsCount: col.items_count || items.length,
                items: items.map((it) => ({
                  id: it.media_id,
                  title: it.media_title,
                  type: it.media_type === 'tv' ? 'TV' : 'Movie',
                  year: '',
                  poster: it.media_poster
                    ? tmdb.getImageUrl(it.media_poster, 'w342')
                    : '/placeholder.svg',
                })),
              });
            }
          }
        } catch (supabaseErr) {
          console.warn('Supabase public collections check:', supabaseErr);
        }

        // 2. Fetch live TMDB collections
        const [trendingRes, topRatedRes, scifiRes, thrillerRes, upcomingRes] = await Promise.allSettled([
          tmdb.getTrending('movie', 'week'),
          tmdb.getTopRated('movie', 1),
          tmdb.discoverMovies('with_genres=878&sort_by=vote_average.desc&vote_count.gte=500'),
          tmdb.discoverMovies('with_genres=53,80&sort_by=popularity.desc'),
          tmdb.getUpcomingMovies(1),
        ]);

        const mapMovies = (movies: Movie[]) =>
          movies.slice(0, 10).map((m) => ({
            id: m.id,
            title: m.title,
            type: 'Movie' as const,
            year: m.release_date ? m.release_date.slice(0, 4) : '',
            poster: tmdb.getImageUrl(m.poster_path, 'w342'),
          }));

        if (trendingRes.status === 'fulfilled' && trendingRes.value?.results?.length) {
          rows.push({
            id: 'col-trending-box-office',
            title: 'Worldwide Box Office Sensations',
            topic: 'Trending Cinema',
            creator: { username: 'movieguy_editorial' },
            commentsCount: 42,
            items: mapMovies(trendingRes.value.results),
          });
        }

        if (topRatedRes.status === 'fulfilled' && topRatedRes.value?.results?.length) {
          rows.push({
            id: 'col-top-rated-vault',
            title: 'Essential Masterpieces of Cinema History',
            topic: 'Top Rated Masterpieces',
            creator: { username: 'criterion_archivist' },
            commentsCount: 68,
            items: mapMovies(topRatedRes.value.results),
          });
        }

        if (scifiRes.status === 'fulfilled' && scifiRes.value?.results?.length) {
          rows.push({
            id: 'col-scifi-epics',
            title: 'Sci-Fi Mindbenders & Cosmic Horizons',
            topic: 'Sci-Fi & Cosmic Epics',
            creator: { username: 'astro_cinephile' },
            commentsCount: 31,
            items: mapMovies(scifiRes.value.results),
          });
        }

        if (thrillerRes.status === 'fulfilled' && thrillerRes.value?.results?.length) {
          rows.push({
            id: 'col-thrillers-noir',
            title: 'Heart-Pounding Crime & Noir Whodunits',
            topic: 'Crime & Mystery Thrillers',
            creator: { username: 'midnight_detective' },
            commentsCount: 27,
            items: mapMovies(thrillerRes.value.results),
          });
        }

        if (upcomingRes.status === 'fulfilled' && upcomingRes.value?.results?.length) {
          rows.push({
            id: 'col-upcoming-hype',
            title: 'Theatrical Calendar & Next Big Releases',
            topic: 'Upcoming Box Office',
            creator: { username: 'marquee_insider' },
            commentsCount: 19,
            items: mapMovies(upcomingRes.value.results),
          });
        }

        if (!cancelled) {
          setCollections(rows);
        }
      } catch (err) {
        console.error('Failed to load collections:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCollections();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollLeft = (key: string) => {
    const el = scrollRefs.current[key];
    if (el) el.scrollBy({ left: -340, behavior: 'smooth' });
  };

  const scrollRight = (key: string) => {
    const el = scrollRefs.current[key];
    if (el) el.scrollBy({ left: 340, behavior: 'smooth' });
  };

  const handleOpenCollection = (row: CuratedCollectionRow) => {
    const col: UserCollection = {
      id: row.id,
      user_id: user?.id || 'public-showcase',
      title: row.title,
      description: `Curated cinema showcase by @${row.creator.username}`,
      cover_image: row.items[0]?.poster,
      is_public: true,
      items_count: row.items.length,
      likes_count: row.commentsCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSelectedCollection(col);
    setIsDetailModalOpen(true);
  };

  const filteredRows = collections.filter((row) => {
    const matchesTopic =
      activeTopic === 'All Topics' || row.topic === activeTopic;
    if (!matchesTopic) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.title.toLowerCase().includes(q) ||
      row.items.some((it) => it.title.toLowerCase().includes(q))
    );
  });

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* ── Top Bar ── */}
      <div className="mb-8 flex items-center justify-between">
        {/* Topics Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowTopicsMenu((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-white transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#f5c542]" />
            <span>{activeTopic}</span>
            <span className="text-white/40">({TOPICS.length - 1})</span>
          </button>

          {showTopicsMenu && (
            <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.12] bg-[#140a0e] p-2 shadow-2xl z-30 space-y-1 backdrop-blur-xl">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setActiveTopic(topic);
                    setShowTopicsMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center justify-between ${
                    activeTopic === topic
                      ? 'bg-[#f5c542] text-[#1c120c] font-black'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>{topic}</span>
                  {activeTopic === topic && <span className="text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Search Action */}
        <div>
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Search collections or movies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-xl border border-white/[0.15] bg-black/50 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-[#f5c542] focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="text-xs text-white/50 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Search collection lists"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Curated Collection Lists ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/40">
          <Spinner className="h-8 w-8 text-[#f5c542] mb-3 animate-spin" />
          <p className="text-sm font-mono tracking-wide">Assembling live cinema anthologies…</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#140a0e] p-12 text-center text-white/50">
          <Layers className="w-10 h-10 mx-auto mb-3 text-[#c9a24b]/40" />
          <p className="text-base font-medium text-white/80">No collections matched</p>
          <p className="text-xs text-white/40 mt-1">Try another topic or clear the search query.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredRows.map((collection) => (
            <section key={collection.id} className="space-y-4">
              {/* Collection Header: Title + Navigation Arrows */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <h2 className="text-lg sm:text-2xl font-display font-extrabold text-white truncate">
                    {collection.title}
                  </h2>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    Curated by @{collection.creator.username} · {collection.items.length} titles
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => scrollLeft(collection.id)}
                    className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Previous titles"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollRight(collection.id)}
                    className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                    title="Next titles"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Posters Row */}
              <div
                ref={(el) => {
                  scrollRefs.current[collection.id] = el;
                }}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-none custom-scrollbar touch-pan-x overscroll-x-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {collection.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenCollection(collection)}
                    className="w-36 sm:w-52 shrink-0 cursor-pointer group"
                  >
                    <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-black/60 border border-[#c9a24b]/20 shadow-lg relative">
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1 rounded-full bg-[#f5c542] text-[#1c120c] font-mono text-[11px] font-bold shadow-lg">
                          View List
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#f5c542] transition-colors truncate">
                        {item.title}
                      </h3>
                      {item.year && (
                        <p className="text-[10px] sm:text-xs font-mono text-white/40 mt-0.5">
                          {item.type} • {item.year}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Collection Footer: Avatar + Visit Link + Count */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={collection.creator.avatarUrl}
                    name={collection.creator.username}
                    size="sm"
                  />
                  <span className="text-xs font-mono text-white/60">
                    @{collection.creator.username}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenCollection(collection)}
                  className="text-xs font-mono text-white/60 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-all flex items-center gap-1"
                >
                  <span>Visit Collection</span>
                  <span className="text-[10px]">↗</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{collection.commentsCount}</span>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Collection Detail Modal integration */}
      {selectedCollection && (
        <CollectionDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCollection(null);
          }}
          collection={selectedCollection}
          onUpdate={() => {}}
        />
      )}
    </CommunityLayout>
  );
}
