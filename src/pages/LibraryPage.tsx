// src/pages/LibraryPage.tsx — Unified User Library, Collections, Watch Later & Watch History
import React, { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  ListPlus,
  Clock,
  History,
  Plus,
  ArrowUpDown,
  Search,
  Lock,
  Globe,
  Film,
  Tv,
  Star,
  Trash2,
  PenLine,
  Check,
  ChevronRight,
  Sparkles,
  Flame,
  Hourglass,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import {
  type UserCollection,
  type WatchLaterTag,
  type WatchHistoryItem,
} from '@/services/userLibrary';
import { CollectionDetailModal } from '@/components/library/CollectionDetailModal';
import { CollectionCollageThumbnail } from '@/components/library/CollectionCollageThumbnail';
import { tmdb } from '@/services/tmdb';
import { toast } from 'sonner';

type NavTab = 'discover' | 'collections' | 'watch-later' | 'history';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as NavTab) || 'collections';

  const setTab = (tab: NavTab) => {
    setSearchParams({ tab });
  };

  const {
    history,
    watchLater,
    collections,
    savedCollections,
    discoverCollections,
    loading,
    setWatchLaterTag,
    toggleWatchLater,
    toggleWatched,
    createCollection,
    deleteCollection,
  } = useUserLibrary();

  // Modal states
  const [selectedCollection, setSelectedCollection] = useState<UserCollection | null>(null);
  const [showCreateColModal, setShowCreateColModal] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColPublic, setNewColPublic] = useState(true);

  // Collections tab sub-filters: 'created' vs 'saved'
  const [colSubTab, setColSubTab] = useState<'created' | 'saved'>('created');

  // Watch Later tag filter: 'all' | 'asap' | 'weekend' | 'someday'
  const [laterTag, setLaterTag] = useState<WatchLaterTag>('all');

  // Watch History filter: 'all' | 'movie' | 'tv' | 'not-reviewed'
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'movie' | 'tv' | 'not-reviewed'>('all');
  const [historySearch, setHistorySearch] = useState('');

  // ── Filtered Watch Later Items ──
  const filteredWatchLater = useMemo(() => {
    if (laterTag === 'all') return watchLater;
    return watchLater.filter((item) => item.tag === laterTag);
  }, [watchLater, laterTag]);

  // ── Filtered & Grouped Watch History Items ──
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (historyTypeFilter === 'movie' && item.media_type !== 'movie') return false;
      if (historyTypeFilter === 'tv' && item.media_type !== 'tv') return false;
      if (historyTypeFilter === 'not-reviewed' && item.reviewed) return false;
      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        return item.title.toLowerCase().includes(query);
      }
      return true;
    });
  }, [history, historyTypeFilter, historySearch]);

  // Group history by Month (e.g., "OCTOBER 2026")
  const groupedHistory = useMemo(() => {
    const groups: { monthYear: string; items: WatchHistoryItem[] }[] = [];
    const map = new Map<string, WatchHistoryItem[]>();

    filteredHistory.forEach((item) => {
      const d = new Date(item.watched_at);
      const monthYear = d
        .toLocaleString('en-US', { month: 'long', year: 'numeric' })
        .toUpperCase();
      if (!map.has(monthYear)) {
        map.set(monthYear, []);
      }
      map.get(monthYear)!.push(item);
    });

    map.forEach((items, monthYear) => {
      groups.push({ monthYear, items });
    });

    return groups;
  }, [filteredHistory]);

  const handleCreateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    await createCollection(newColTitle.trim(), newColDesc.trim(), newColPublic);
    setNewColTitle('');
    setNewColDesc('');
    setShowCreateColModal(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-28 md:pb-16">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* ── Left Sidebar Navigation (Matching Screenshots 1, 3, 4, 5) ── */}
          <aside className="w-full md:w-56 lg:w-64 shrink-0">
            <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button
                type="button"
                onClick={() => setTab('discover')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-display font-semibold text-sm transition-all whitespace-nowrap text-left ${activeTab === 'discover'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <Compass className="w-4 h-4 shrink-0 text-[#f5c542]" />
                <span>Discover</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('collections')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-display font-semibold text-sm transition-all whitespace-nowrap text-left ${activeTab === 'collections'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <ListPlus className="w-4 h-4 shrink-0 text-[#c9a24b]" />
                <span>My Collections</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('watch-later')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-display font-semibold text-sm transition-all whitespace-nowrap text-left ${activeTab === 'watch-later'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <Clock className="w-4 h-4 shrink-0 text-white/70" />
                <span>Watch Later</span>
                {watchLater.length > 0 && (
                  <span className="ml-auto text-xs font-mono text-[#f5c542]">
                    {watchLater.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab('history')}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-display font-semibold text-sm transition-all whitespace-nowrap text-left ${activeTab === 'history'
                    ? 'bg-white/[0.08] text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <History className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Watch History</span>
                {history.length > 0 && (
                  <span className="ml-auto text-xs font-mono text-emerald-400">
                    {history.length}
                  </span>
                )}
              </button>
            </nav>
          </aside>

          {/* ── Main Content Area ── */}
          <section className="flex-1 min-w-0 w-full">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 1: DISCOVER (Screenshot 5)                                   */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'discover' && (
              <div className="space-y-6">
                <div>
                  <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
                    Discover Collections
                  </h1>
                  <p className="text-xs font-mono text-[#c9a24b]/70 mt-1">
                    Curated cinema lineups, film festival showcases &amp; community lists
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {discoverCollections.map((col) => (
                    <article
                      key={col.id}
                      onClick={() => setSelectedCollection(col)}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-white/[0.08] bg-[#140a0e] hover:border-[#f5c542]/60 hover:shadow-[0_10px_30px_rgba(245,197,66,0.18)] transition-all duration-300"
                    >
                      {/* 16:9 Thumbnail Cover / Collage */}
                      <CollectionCollageThumbnail collection={col} />

                      {/* Info & Meta */}
                      <div className="p-4">
                        <h3 className="font-display font-bold text-base text-white group-hover:text-[#f5c542] transition-colors truncate">
                          {col.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono text-white/50 mt-1.5">
                          <span className="w-4 h-4 rounded-full bg-[#c9a24b]/20 flex items-center justify-center text-[9px] text-[#f5c542]">
                            🎬
                          </span>
                          <span>{col.items_count} Items</span>
                          <span>·</span>
                          <span>{col.likes_count} likes</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 2: MY COLLECTIONS (Screenshot 1)                              */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'collections' && (
              <div className="space-y-6">
                {/* Header Subtabs & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                  {/* Created by Me / Saved Pills */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setColSubTab('created')}
                      className={`px-5 py-2 rounded-full text-xs font-mono font-bold transition-all ${colSubTab === 'created'
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/[0.08]'
                        }`}
                    >
                      Created by Me
                    </button>
                    <button
                      type="button"
                      onClick={() => setColSubTab('saved')}
                      className={`px-5 py-2 rounded-full text-xs font-mono font-bold transition-all ${colSubTab === 'saved'
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/[0.08]'
                        }`}
                    >
                      Saved
                    </button>
                  </div>

                  {/* + Add & Reorder Buttons (Screenshot 1) */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowCreateColModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#9333ea] hover:bg-[#8b5cf6] text-white text-xs font-bold transition-all shadow-md shadow-purple-600/25 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toast.info('Drag or click to reorder collections')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white text-xs font-mono transition-all"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>
                  </div>
                </div>

                {/* Collections Grid */}
                {colSubTab === 'created' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {collections.map((col) => (
                      <article
                        key={col.id}
                        onClick={() => setSelectedCollection(col)}
                        className="group cursor-pointer rounded-2xl overflow-hidden border border-white/[0.08] bg-[#140a0e] hover:border-[#f5c542]/60 hover:shadow-[0_10px_30px_rgba(245,197,66,0.18)] transition-all duration-300"
                      >
                        {/* 16:9 Dynamic Movie Collage Thumbnail */}
                        <CollectionCollageThumbnail collection={col} />

                        {/* Card Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <h3 className="font-display font-bold text-base text-white group-hover:text-[#f5c542] transition-colors truncate">
                            {col.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-mono text-white/50 mt-1.5">
                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                              👤
                            </span>
                            {col.is_public ? (
                              <Globe className="w-3.5 h-3.5 text-[#c9a24b]" title="Public collection" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-amber-500/80" title="Private collection" />
                            )}
                            <span>{col.items_count} {col.items_count === 1 ? 'Item' : 'Items'}</span>
                            <span>·</span>
                            <span>{col.likes_count || 0} {col.likes_count === 1 ? 'like' : 'likes'}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div>
                    {savedCollections.length === 0 ? (
                      <div className="py-20 text-center">
                        <ListPlus className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <h3 className="font-display font-bold text-lg text-white">No saved collections</h3>
                        <p className="text-xs font-mono text-white/40 mt-1 max-w-sm mx-auto">
                          Browse the Discover tab and click the heart icon on any collection to save it here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {savedCollections.map((col) => (
                          <article
                            key={col.id}
                            onClick={() => setSelectedCollection(col)}
                            className="group cursor-pointer rounded-2xl overflow-hidden border border-white/[0.08] bg-[#140a0e] hover:border-[#f5c542]/60 hover:shadow-[0_10px_30px_rgba(245,197,66,0.18)] transition-all flex flex-col justify-between"
                          >
                            <CollectionCollageThumbnail collection={col} />
                            <div className="p-4">
                              <h3 className="font-display font-bold text-sm text-white group-hover:text-[#f5c542] truncate">
                                {col.title}
                              </h3>
                              <p className="text-xs font-mono text-white/40 mt-1 flex items-center gap-1.5">
                                <span>{col.items_count} {col.items_count === 1 ? 'Item' : 'Items'}</span>
                                <span>·</span>
                                <span>by {col.username || 'Cinephile'}</span>
                              </p>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 3: WATCH LATER (Screenshot 3)                                */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'watch-later' && (
              <div className="space-y-6">
                {/* Priority Filter Pills (Screenshot 3) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => setLaterTag('all')}
                    className={`px-5 py-2 rounded-full text-xs font-mono font-bold transition-all ${laterTag === 'all'
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/[0.08]'
                      }`}
                  >
                    All
                  </button>

                  <button
                    type="button"
                    onClick={() => setLaterTag('asap')}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all border ${laterTag === 'asap'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm shadow-rose-500/20'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                      }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Zero Chill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLaterTag('weekend')}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all border ${laterTag === 'weekend'
                        ? 'bg-[#c9a24b]/20 border-[#f5c542] text-[#f5c542] shadow-sm shadow-[#f5c542]/20'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                      }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#f5c542]" />
                    <span>Weekend Vibe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLaterTag('someday')}
                    className={`px-4 py-2 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 transition-all border ${laterTag === 'someday'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm shadow-sky-500/20'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white'
                      }`}
                  >
                    <Hourglass className="w-3.5 h-3.5 text-sky-400" />
                    <span>Low-Key</span>
                  </button>
                </div>

                {/* Empty State (Exact Match to Screenshot 3) */}
                {filteredWatchLater.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center mb-6">
                      <Clock className="w-8 h-8 text-white/30" />
                    </div>
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-white">
                      Your Watch Later list is empty
                    </h2>
                    <p className="text-xs sm:text-sm font-mono text-white/50 max-w-md mt-2 leading-relaxed">
                      Keep track of what you want to watch by adding titles from any content page.
                    </p>
                    <Link
                      to="/explore"
                      className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f5c542] hover:bg-[#e6b738] text-black font-bold text-xs font-mono transition-transform active:scale-95 shadow-lg shadow-[#f5c542]/20"
                    >
                      <span>Explore Titles</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredWatchLater.map((item) => {
                      const posterUrl = item.poster_path
                        ? tmdb.getImageUrl(item.poster_path, 'w342')
                        : '/placeholder.svg';

                      return (
                        <div
                          key={`${item.media_type}-${item.media_id}`}
                          className="group relative rounded-2xl border border-white/[0.08] bg-[#140a0e] overflow-hidden flex flex-col transition-all hover:border-[#f5c542]/50 hover:-translate-y-1 shadow-md"
                        >
                          <Link to={`/${item.media_type}/${item.media_id}`} className="block relative aspect-[2/3] overflow-hidden bg-[#160b10]">
                            <img
                              src={posterUrl}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                            {/* Tag pill badge */}
                            <span
                              className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wide backdrop-blur-md flex items-center gap-1 shadow-md ${
                                item.tag === 'asap'
                                  ? 'bg-black/80 border border-rose-500/40 text-rose-300'
                                  : item.tag === 'weekend'
                                  ? 'bg-black/80 border border-[#f5c542]/40 text-[#f5c542]'
                                  : 'bg-black/80 border border-sky-500/40 text-sky-300'
                              }`}
                            >
                              {item.tag === 'asap' && <Flame className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                              {item.tag === 'weekend' && <Sparkles className="w-2.5 h-2.5 text-[#f5c542] shrink-0" />}
                              {item.tag === 'someday' && <Hourglass className="w-2.5 h-2.5 text-sky-400 shrink-0" />}
                              <span>
                                {item.tag === 'asap'
                                  ? 'Zero Chill'
                                  : item.tag === 'weekend'
                                  ? 'Weekend Vibe'
                                  : 'Low-Key'}
                              </span>
                            </span>
                          </Link>

                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <Link
                                to={`/${item.media_type}/${item.media_id}`}
                                className="font-display font-bold text-xs text-white group-hover:text-[#f5c542] line-clamp-1 transition-colors"
                              >
                                {item.title}
                              </Link>
                              <p className="text-[10px] font-mono text-[#c9a24b]/70 mt-0.5">
                                {item.media_type === 'tv' ? 'TV' : 'Movie'} {item.release_date ? `· ${item.release_date.slice(0, 4)}` : ''}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                              <button
                                onClick={() =>
                                  toggleWatched({
                                    media_id: item.media_id,
                                    media_type: item.media_type,
                                    title: item.title,
                                    poster_path: item.poster_path,
                                    backdrop_path: item.backdrop_path,
                                  })
                                }
                                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                title="Mark as Watched"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Watched</span>
                              </button>

                              <button
                                onClick={() =>
                                  toggleWatchLater({
                                    media_id: item.media_id,
                                    media_type: item.media_type,
                                    title: item.title,
                                  })
                                }
                                className="text-white/30 hover:text-red-400 p-1"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 4: WATCH HISTORY (Screenshot 4)                              */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* History Filter Pills (Screenshot 4) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      type="button"
                      onClick={() => setHistoryTypeFilter('all')}
                      className={`px-5 py-2 rounded-full text-xs font-mono font-bold transition-all ${historyTypeFilter === 'all'
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/[0.04] text-white/60 hover:text-white border border-white/[0.08]'
                        }`}
                    >
                      All
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryTypeFilter('movie')}
                      className={`px-4 py-2 rounded-full text-xs font-mono font-medium transition-all ${historyTypeFilter === 'movie'
                          ? 'bg-[#c9a24b]/20 border border-[#f5c542] text-[#f5c542]'
                          : 'bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white'
                        }`}
                    >
                      Movies
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryTypeFilter('tv')}
                      className={`px-4 py-2 rounded-full text-xs font-mono font-medium transition-all ${historyTypeFilter === 'tv'
                          ? 'bg-[#c9a24b]/20 border border-[#f5c542] text-[#f5c542]'
                          : 'bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white'
                        }`}
                    >
                      Shows
                    </button>

                    <button
                      type="button"
                      onClick={() => setHistoryTypeFilter('not-reviewed')}
                      className={`px-4 py-2 rounded-full text-xs font-mono font-medium transition-all ${historyTypeFilter === 'not-reviewed'
                          ? 'bg-[#c9a24b]/20 border border-[#f5c542] text-[#f5c542]'
                          : 'bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white'
                        }`}
                    >
                      Not Reviewed
                    </button>
                  </div>

                  {/* Search Input Filter */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search history…"
                      className="w-full pl-9 pr-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] text-xs font-mono text-white placeholder-white/30 focus:border-[#f5c542] focus:outline-none"
                    />
                  </div>
                </div>

                {/* History Item List Grouped by Month (Screenshot 4) */}
                {groupedHistory.length === 0 ? (
                  <div className="py-24 text-center">
                    <History className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <h3 className="font-display font-bold text-lg text-white">No watch history yet</h3>
                    <p className="text-xs font-mono text-white/40 mt-1 max-w-sm mx-auto">
                      Click the green "✓ Watched" button on any movie or TV show detail page to log your viewing history.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {groupedHistory.map((group) => (
                      <div key={group.monthYear} className="space-y-3">
                        {/* Month Section Header (e.g. OCTOBER 2026) */}
                        <div className="border-b border-white/[0.08] pb-2">
                          <span className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-white/40">
                            {group.monthYear}
                          </span>
                        </div>

                        {/* History Rows (Screenshot 4 layout) */}
                        <div className="space-y-3">
                          {group.items.map((item) => {
                            const posterUrl = item.poster_path
                              ? tmdb.getImageUrl(item.poster_path, 'w185')
                              : '/placeholder.svg';
                            const watchedDateStr = new Date(item.watched_at).toLocaleDateString(
                              'en-US',
                              { day: 'numeric', month: 'short', year: 'numeric' }
                            );

                            return (
                              <div
                                key={`${item.media_type}-${item.media_id}`}
                                className="flex items-center justify-between p-3 rounded-2xl border border-white/[0.08] bg-[#140a0e] hover:border-[#c9a24b]/40 transition-all group"
                              >
                                {/* Poster + Title + Meta */}
                                <Link
                                  to={`/${item.media_type}/${item.media_id}`}
                                  className="flex items-center gap-4 min-w-0 flex-1"
                                >
                                  <img
                                    src={posterUrl}
                                    alt={item.title}
                                    className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl object-cover border border-white/[0.08] shrink-0 bg-[#160b10]"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = '/placeholder.svg';
                                    }}
                                  />

                                  <div className="min-w-0 pr-3">
                                    <h4 className="font-display font-extrabold text-base sm:text-lg text-white group-hover:text-[#f5c542] transition-colors truncate">
                                      {item.title}
                                    </h4>
                                    <p className="text-xs font-mono text-white/50 mt-1 truncate">
                                      <span>{item.media_type === 'tv' ? 'Show' : 'Movie'}</span>
                                      <span className="mx-1.5">·</span>
                                      <span>{item.release_year || '2026'}</span>
                                      <span className="mx-1.5">·</span>
                                      <span className="text-[#c9a24b]/80">{watchedDateStr}</span>
                                    </p>
                                  </div>
                                </Link>

                                {/* Action: Review Button & Delete (Screenshot 4) */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/${item.media_type}/${item.media_id}`)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] hover:border-[#f5c542] hover:bg-[#c9a24b]/15 text-xs font-mono text-white/80 hover:text-[#f5c542] transition-all"
                                  >
                                    <PenLine className="w-3.5 h-3.5" />
                                    <span>Review</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleWatched({
                                        media_id: item.media_id,
                                        media_type: item.media_type,
                                        title: item.title,
                                      })
                                    }
                                    className="p-2 text-white/30 hover:text-red-400 transition-colors"
                                    title="Remove from history"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Bottom message (Screenshot 4) */}
                    <div className="text-center pt-8 pb-4">
                      <p className="text-xs font-mono text-white/30">
                        You've reached the beginning of your logged history
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Collection Items Detail Modal */}
      <CollectionDetailModal
        collection={selectedCollection}
        isOpen={Boolean(selectedCollection)}
        onClose={() => setSelectedCollection(null)}
        isOwner={selectedCollection?.user_id !== 'system'}
      />

      {/* Create Collection Modal */}
      {showCreateColModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setShowCreateColModal(false)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#c9a24b]/30 bg-[#120a0e] p-6 shadow-2xl relative"
          >
            <h3 className="font-display font-bold text-lg text-white mb-4">Create New Collection</h3>
            <form onSubmit={handleCreateCollectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Collection Title *</label>
                <input
                  type="text"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  placeholder="e.g. Masterpieces of 2026"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Description (Optional)</label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  rows={2}
                  placeholder="What is this collection about?"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublicCheck"
                  checked={newColPublic}
                  onChange={(e) => setNewColPublic(e.target.checked)}
                  className="rounded border-white/20 text-[#f5c542] focus:ring-0"
                />
                <label htmlFor="isPublicCheck" className="text-xs font-mono text-white/70">
                  Make collection public in Community
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateColModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-xs font-mono text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newColTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#f5c542] hover:bg-[#e6b738] text-black font-bold text-xs disabled:opacity-40"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
