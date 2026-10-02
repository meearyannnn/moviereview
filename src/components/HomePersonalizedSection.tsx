// src/components/HomePersonalizedSection.tsx
// Hyper-personalized recommendation section powered by:
// 1. User Watch History ("Because you watched [Title]")
// 2. Mark as Interested / Watch Later ("Top priority in Watch Later [Title]" / "Because you saved [Title]")
// 3. User Collections ("Inspired by your collection [Collection Name]")
// 4. Taste Profile fallback for fresh visitors

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  History,
  Clock,
  Flame,
  BookmarkCheck,
  FolderHeart,
  Eye,
  ArrowRight,
  Library,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { MovieRow } from '@/components/MovieRow';
import { tmdb, type Movie } from '@/services/tmdb';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { useWatchlist } from '@/hooks/useWatchlist';
import { userLibraryService, type UserCollection, type UserCollectionItem } from '@/services/userLibrary';

type ShelfFilter = 'all' | 'history' | 'watchLater' | 'collections';

// Helper to fetch smart recommendations with popular fallback
async function fetchSmartRecommendations(
  mediaId: number,
  mediaType: 'movie' | 'tv' = 'movie'
): Promise<{ results: Movie[] }> {
  try {
    const res = await tmdb.getRecommendations(mediaId, mediaType);
    let list = res.results || [];

    // If fewer than 6 recommendations returned from TMDB, supplement with popular titles of that media type
    if (list.length < 6) {
      const popular = await tmdb.getPopular(mediaType);
      const popularList = (popular.results || []).filter(
        (m: Movie) => m.id !== mediaId && !list.some((r: Movie) => r.id === m.id)
      );
      list = [...list, ...popularList];
    }

    return { results: list.filter((m: Movie) => m.id !== mediaId) };
  } catch (err) {
    console.warn(`Fallback recommendations for ${mediaType} ${mediaId}:`, err);
    return tmdb.getPopular(mediaType);
  }
}

export const HomePersonalizedSection = () => {
  const { history, watchLater, collections, savedCollections, loading: libraryLoading } = useUserLibrary();
  const { watchlist } = useWatchlist();

  // Active filter tab
  const [activeTab, setActiveTab] = useState<ShelfFilter>('all');

  // Selected seed indices when multiple options exist
  const [historySeedIdx, setHistorySeedIdx] = useState(0);
  const [watchLaterSeedIdx, setWatchLaterSeedIdx] = useState(0);
  const [collectionIdx, setCollectionIdx] = useState(0);

  // Loaded items for user collections
  const [collectionItemsMap, setCollectionItemsMap] = useState<Record<string, UserCollectionItem[]>>({});

  // Combine custom & saved collections
  const allUserCollections = useMemo(() => {
    const combined = [...collections, ...savedCollections];
    const seen = new Set<string>();
    return combined.filter((col) => {
      if (seen.has(col.id)) return false;
      seen.add(col.id);
      return true;
    });
  }, [collections, savedCollections]);

  // Load items for collections that have items_count > 0
  useEffect(() => {
    let isMounted = true;
    const loadItems = async () => {
      const map: Record<string, UserCollectionItem[]> = {};
      for (const col of allUserCollections) {
        if (col.items_count > 0 || col.preview_posters?.length) {
          try {
            const items = await userLibraryService.getCollectionItems(col.id);
            if (items.length > 0) {
              map[col.id] = items;
            }
          } catch {}
        }
      }
      if (isMounted) {
        setCollectionItemsMap(map);
      }
    };

    if (allUserCollections.length > 0) {
      loadItems();
    }

    return () => {
      isMounted = false;
    };
  }, [allUserCollections]);

  // 1. Resolve Watch History Seed
  const historySeed = useMemo(() => {
    if (!history || history.length === 0) return null;
    const safeIdx = Math.min(historySeedIdx, history.length - 1);
    return history[safeIdx];
  }, [history, historySeedIdx]);

  // 2. Resolve Watch Later / "Marked as Interested" Seed (Deduplicated against history)
  const watchLaterItems = useMemo(() => {
    if (watchLater && watchLater.length > 0) {
      return watchLater;
    }
    // Fallback to legacy watchlist
    if (watchlist && watchlist.length > 0) {
      return watchlist.map((item) => ({
        id: `wl-${item.id}`,
        media_id: item.id,
        media_type: item.media_type || 'movie',
        title: item.title,
        poster_path: item.poster_path,
        tag: 'asap' as const,
        created_at: new Date().toISOString(),
      }));
    }
    return [];
  }, [watchLater, watchlist]);

  const watchLaterSeed = useMemo(() => {
    if (watchLaterItems.length === 0) return null;
    // Try to pick an item that does not duplicate the history seed
    const candidatePool = watchLaterItems.filter(
      (it) => it.media_id !== historySeed?.media_id
    );
    const pool = candidatePool.length > 0 ? candidatePool : watchLaterItems;
    const safeIdx = Math.min(watchLaterSeedIdx, pool.length - 1);
    return pool[safeIdx];
  }, [watchLaterItems, watchLaterSeedIdx, historySeed?.media_id]);

  // 3. Resolve Collection Seed
  const collectionsWithItems = useMemo(() => {
    return allUserCollections.filter((col) => {
      const items = collectionItemsMap[col.id];
      return items && items.length > 0;
    });
  }, [allUserCollections, collectionItemsMap]);

  const activeCollection = useMemo(() => {
    if (collectionsWithItems.length === 0) return null;
    const safeIdx = Math.min(collectionIdx, collectionsWithItems.length - 1);
    return collectionsWithItems[safeIdx];
  }, [collectionsWithItems, collectionIdx]);

  const collectionHeroItem = useMemo(() => {
    if (!activeCollection) return null;
    const items = collectionItemsMap[activeCollection.id];
    return items?.[0] || null;
  }, [activeCollection, collectionItemsMap]);

  // Stable fetchData callbacks for MovieRow
  const fetchHistoryRecs = useCallback(() => {
    if (!historySeed) return Promise.resolve({ results: [] });
    return fetchSmartRecommendations(historySeed.media_id, historySeed.media_type);
  }, [historySeed?.media_id, historySeed?.media_type]);

  const fetchWatchLaterRecs = useCallback(() => {
    if (!watchLaterSeed) return Promise.resolve({ results: [] });
    return fetchSmartRecommendations(watchLaterSeed.media_id, watchLaterSeed.media_type);
  }, [watchLaterSeed?.media_id, watchLaterSeed?.media_type]);

  const fetchCollectionRecs = useCallback(() => {
    if (!collectionHeroItem) return Promise.resolve({ results: [] });
    return fetchSmartRecommendations(collectionHeroItem.media_id, collectionHeroItem.media_type);
  }, [collectionHeroItem?.media_id, collectionHeroItem?.media_type]);

  const fetchFallbackRecs = useCallback(() => {
    return tmdb.getPopular('movie');
  }, []);

  const hasAnyUserData = Boolean(
    history.length > 0 || watchLaterItems.length > 0 || collectionsWithItems.length > 0
  );

  // Watch Later tag styling & title helper
  const watchLaterConfig = useMemo(() => {
    if (!watchLaterSeed) return { title: 'Because you saved', icon: Clock, subtitle: 'Based on items in your list' };
    if (watchLaterSeed.tag === 'asap') {
      return {
        title: 'Top priority in Watch Later',
        icon: Flame,
        subtitle: 'Recommendations matching high priority films on your radar',
      };
    }
    if (watchLaterSeed.tag === 'weekend') {
      return {
        title: 'Saved for your weekend',
        icon: Clock,
        subtitle: 'Cinema picks tuned to your upcoming weekend watch queue',
      };
    }
    return {
      title: "Because you're interested in",
      icon: Sparkles,
      subtitle: 'Hand-picked cinema based on titles saved in your Watch Later',
    };
  }, [watchLaterSeed]);

  return (
    <div id="for-you" className="scroll-mt-20 space-y-10">
      {/* ── Personalized Hub Top Header ── */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#170e13]/90 via-[#120a10]/70 to-[#0d070b]/90 p-4 sm:p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f5c542]/25 bg-[#f5c542]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#f5c542]">
                <Sparkles className="h-3 w-3" />
                For You · Cinema Radar
              </span>
            </div>
            <h2 className="mt-1.5 font-display text-lg font-bold text-white sm:text-xl">
              Personalized Recommendations
            </h2>
            <p className="mt-0.5 text-xs text-white/50 sm:text-sm">
              Dynamically synthesized from your watch history, saved radar, and custom collections.
            </p>
          </div>

          {/* Quick Metrics & Manage Link */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">
              <History className="h-3.5 w-3.5 text-white/40" />
              <span>{history.length} watched</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">
              <Clock className="h-3.5 w-3.5 text-white/40" />
              <span>{watchLaterItems.length} interested</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">
              <FolderHeart className="h-3.5 w-3.5 text-white/40" />
              <span>{allUserCollections.length} lists</span>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 rounded-lg bg-[#f5c542]/10 px-2.5 py-1 text-xs font-medium text-[#f5c542] transition-colors hover:bg-[#f5c542]/20 hover:text-white"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Filter Tabs (when user has items across categories) */}
        {hasAnyUserData && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
              View shelf:
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-[#f5c542] text-[#140c10] shadow-sm'
                  : 'bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              All shelves
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#f5c542] text-[#140c10] shadow-sm'
                    : 'bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <History className="h-3 w-3" />
                Watch History ({history.length})
              </button>
            )}
            {watchLaterItems.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('watchLater')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === 'watchLater'
                    ? 'bg-[#f5c542] text-[#140c10] shadow-sm'
                    : 'bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Clock className="h-3 w-3" />
                Watch Later ({watchLaterItems.length})
              </button>
            )}
            {collectionsWithItems.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('collections')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeTab === 'collections'
                    ? 'bg-[#f5c542] text-[#140c10] shadow-sm'
                    : 'bg-white/[0.05] text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FolderHeart className="h-3 w-3" />
                Collections ({collectionsWithItems.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 1. WATCH HISTORY SHELF: "Because you watched [Title]" ── */}
      {(activeTab === 'all' || activeTab === 'history') && historySeed && (
        <div className="space-y-2">
          {/* Seed Switcher if user has logged multiple watched titles */}
          {history.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 text-[11px] font-medium text-white/40">Switch watched:</span>
              {history.slice(0, 5).map((item, idx) => (
                <button
                  key={`${item.media_type}-${item.media_id}`}
                  type="button"
                  onClick={() => setHistorySeedIdx(idx)}
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    idx === historySeedIdx
                      ? 'border-[#f5c542]/50 bg-[#f5c542]/15 text-[#f5c542] font-semibold'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          <MovieRow
            icon={History}
            title="Because you watched"
            accent={historySeed.title}
            subtitle="Personalized cinema recommendations matching films you've completed"
            fetchData={fetchHistoryRecs}
            type={historySeed.media_type}
            viewAllLink="/profile"
          />
        </div>
      )}

      {/* ── 2. WATCH LATER / MARKED AS INTERESTED SHELF: "Top priority in Watch Later" / "Because you saved" ── */}
      {(activeTab === 'all' || activeTab === 'watchLater') && watchLaterSeed && (
        <div className="space-y-2">
          {/* Seed Switcher if user has saved multiple titles */}
          {watchLaterItems.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 text-[11px] font-medium text-white/40">Switch saved:</span>
              {watchLaterItems.slice(0, 5).map((item, idx) => (
                <button
                  key={`${item.media_type}-${item.media_id}`}
                  type="button"
                  onClick={() => setWatchLaterSeedIdx(idx)}
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    item.media_id === watchLaterSeed.media_id
                      ? 'border-[#f5c542]/50 bg-[#f5c542]/15 text-[#f5c542] font-semibold'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          <MovieRow
            icon={watchLaterConfig.icon}
            title={watchLaterConfig.title}
            accent={watchLaterSeed.title}
            subtitle={watchLaterConfig.subtitle}
            fetchData={fetchWatchLaterRecs}
            type={watchLaterSeed.media_type}
            viewAllLink="/profile"
          />
        </div>
      )}

      {/* ── 3. USER COLLECTIONS SHELF: "Inspired by your collection [Collection Title]" ── */}
      {(activeTab === 'all' || activeTab === 'collections') && activeCollection && collectionHeroItem && (
        <div className="space-y-2">
          {/* Collection switcher if user has multiple collections */}
          {collectionsWithItems.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 text-[11px] font-medium text-white/40">Switch list:</span>
              {collectionsWithItems.map((col, idx) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setCollectionIdx(idx)}
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    idx === collectionIdx
                      ? 'border-[#f5c542]/50 bg-[#f5c542]/15 text-[#f5c542] font-semibold'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {col.title} ({col.items_count})
                </button>
              ))}
            </div>
          )}

          <MovieRow
            icon={BookmarkCheck}
            title="Inspired by your collection"
            accent={activeCollection.title}
            subtitle={
              activeCollection.description ||
              `Titles attuned to the curated mood of "${activeCollection.title}" (seeded by ${collectionHeroItem.media_title})`
            }
            fetchData={fetchCollectionRecs}
            type={collectionHeroItem.media_type}
            viewAllLink="/profile"
          />
        </div>
      )}

      {/* ── 4. FALLBACK / ONBOARDING SHELF (When user library is fresh) ── */}
      {!hasAnyUserData && (
        <div className="space-y-6">
          <MovieRow
            icon={Sparkles}
            title="Taste Profile"
            accent="Picks for You"
            subtitle="Save films, mark what you've watched, or curate collections to train your custom algorithm"
            fetchData={fetchFallbackRecs}
            type="movie"
            viewAllLink="/movies"
          />

          {/* Quick onboarding guidance cards */}
          <div className="grid gap-3.5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Eye className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-semibold text-white">1. Mark as Watched</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                Log films and series you’ve completed. We automatically surface director picks and genre matches.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-semibold text-white">2. Save to Watch Later</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                Tag upcoming titles as ASAP or Weekend watch to get high-priority cinema on your home radar.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm transition-all hover:border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Library className="h-4 w-4" />
                </div>
                <h4 className="font-display text-sm font-semibold text-white">3. Curate Collections</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/50">
                Create custom lists like "Late Night Noir" or "Family Favorites" to discover theme-tailored gems.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
