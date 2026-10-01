// src/pages/community/CollectionsPage.tsx — Matches Screenshots 3 & 4 with collection rows, posters & modal integration
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Plus,
  X,
  Bookmark,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar } from '@/components/community/communityUtils';
import { CollectionDetailModal } from '@/components/library/CollectionDetailModal';
import { collectionsService, type Collection } from '@/services/collections';
import { userLibraryService, type UserCollection } from '@/services/userLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CuratedCollectionRow {
  id: string;
  title: string;
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

const SHOWCASE_COLLECTIONS: CuratedCollectionRow[] = [
  {
    id: 'col-1',
    title: 'Wait, WHAT Movie Is This?',
    creator: {
      username: 'cult_cinema',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=cult',
    },
    commentsCount: 18,
    items: [
      {
        id: 10834,
        title: 'From Dusk Till Dawn',
        type: 'Movie',
        year: '1996',
        poster: 'https://image.tmdb.org/t/p/w780/snAeeiQ3k6vN6V6dZ8sT3m1yC2e.jpg',
      },
      {
        id: 496243,
        title: 'Parasite',
        type: 'Movie',
        year: '2019',
        poster: 'https://image.tmdb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
      },
      {
        id: 534780,
        title: 'Andhadhun',
        type: 'Movie',
        year: '2018',
        poster: 'https://image.tmdb.org/t/p/w780/dyHaAepgqT269n05b4sU7q5x2P2.jpg',
      },
      {
        id: 11324,
        title: 'Shutter Island',
        type: 'Movie',
        year: '2010',
        poster: 'https://image.tmdb.org/t/p/w780/4GDy0PHYX3VRXUtwK5ysqvqlOhv.jpg',
      },
      {
        id: 77,
        title: 'Memento',
        type: 'Movie',
        year: '2000',
        poster: 'https://image.tmdb.org/t/p/w780/yuNs09hvpHVU1cBTCA99x5w2Qox.jpg',
      },
    ],
  },
  {
    id: 'col-2',
    title: 'Sci-Fi Mindbenders & Cosmic Epics',
    creator: {
      username: 'nolan_disciple',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=nolan',
    },
    commentsCount: 37,
    items: [
      {
        id: 999991,
        title: 'Project Hail Mary',
        type: 'Movie',
        year: '2026',
        poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=780&auto=format&fit=crop&q=80',
      },
      {
        id: 157336,
        title: 'Interstellar',
        type: 'Movie',
        year: '2014',
        poster: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      },
      {
        id: 872585,
        title: 'Oppenheimer',
        type: 'Movie',
        year: '2023',
        poster: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      },
      {
        id: 693134,
        title: 'Dune: Part Two',
        type: 'Movie',
        year: '2024',
        poster: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      },
    ],
  },
  {
    id: 'col-3',
    title: 'TIFF Winners & Festival Gems 2026',
    creator: {
      username: 'criterion_archivist',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=criterion',
    },
    commentsCount: 22,
    items: [
      {
        id: 1079091,
        title: 'The Life of Chuck',
        type: 'Movie',
        year: '2024',
        poster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=780&auto=format&fit=crop&q=80',
      },
      {
        id: 974576,
        title: 'Conclave',
        type: 'Movie',
        year: '2024',
        poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=780&auto=format&fit=crop&q=80',
      },
      {
        id: 402431,
        title: 'Wicked',
        type: 'Movie',
        year: '2024',
        poster: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=780&auto=format&fit=crop&q=80',
      },
    ],
  },
];

const TOPICS = ['All Topics', 'Cult Thrillers', 'Sci-Fi Epics', 'Festival Gems', 'Oscar Contenders'];

export default function CollectionsPage() {
  const { user } = useAuth();
  const [activeTopic, setActiveTopic] = useState('All Topics');
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected collection for CollectionDetailModal
  const [selectedCollection, setSelectedCollection] = useState<UserCollection | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
      user_id: user?.id || 'demo-user',
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

  const filteredRows = SHOWCASE_COLLECTIONS.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.title.toLowerCase().includes(q) ||
      row.items.some((it) => it.title.toLowerCase().includes(q))
    );
  });

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* ── Top Bar (Screenshots 3 & 4) ── */}
      <div className="mb-8 flex items-center justify-between">
        {/* Topics (5) Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowTopicsMenu((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-white transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
            <span>Topics</span>
            <span className="w-4 h-4 rounded-full bg-white/[0.1] flex items-center justify-center text-[10px] font-bold">
              {TOPICS.length}
            </span>
          </button>

          {showTopicsMenu && (
            <div className="absolute top-10 left-0 z-30 w-48 rounded-2xl border border-white/[0.1] bg-[#140a0e] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in duration-100">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setActiveTopic(topic);
                    setShowTopicsMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    activeTopic === topic
                      ? 'bg-[#f5c542] text-[#1c120c] font-bold'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1 animate-in fade-in duration-150">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections or titles..."
                className="w-44 bg-transparent text-xs text-white focus:outline-none placeholder-white/30"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Search collections"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Collection Rows (Screenshots 3 & 4) ── */}
      <div className="space-y-12">
        {filteredRows.map((collection) => (
          <section key={collection.id} className="space-y-4">
            {/* Collection Header: Title + "< >" Navigation Arrows */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                {collection.title}
              </h2>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollLeft(collection.id)}
                  className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollRight(collection.id)}
                  className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Row of Posters */}
            <div
              ref={(el) => {
                scrollRefs.current[collection.id] = el;
              }}
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-none custom-scrollbar"
            >
              {collection.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenCollection(collection)}
                  className="w-44 sm:w-56 shrink-0 cursor-pointer group"
                >
                  <div className="aspect-[2/3] w-full rounded-2xl overflow-hidden bg-black/60 border border-white/[0.1] shadow-lg relative">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-[#f5c542] text-[#1c120c] font-mono text-[11px] font-bold shadow-lg">
                        View List
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#f5c542] transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs font-mono text-white/40 mt-0.5">
                      {item.type} • {item.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Collection Footer: Avatar (Left) + Visit Collection Link (Center) + Comments (Right) */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              {/* Creator Avatar */}
              <div className="flex items-center gap-2">
                <Avatar
                  username={collection.creator.username}
                  url={collection.creator.avatarUrl}
                  size={8}
                />
              </div>

              {/* Visit Collection Link */}
              <button
                onClick={() => handleOpenCollection(collection)}
                className="text-xs font-mono text-white/60 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white transition-all flex items-center gap-1"
              >
                <span>Visit Collection</span>
                <span className="text-[10px]">↗</span>
              </button>

              {/* Comments Icon with Count */}
              <button
                onClick={() => handleOpenCollection(collection)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-1.5 text-xs font-mono"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{collection.commentsCount}</span>
              </button>
            </div>
          </section>
        ))}
      </div>

      {/* ── Collection Detail Modal ── */}
      <CollectionDetailModal
        collection={selectedCollection}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCollection(null);
        }}
      />
    </CommunityLayout>
  );
}
