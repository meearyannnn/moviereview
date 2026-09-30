// src/components/library/CollectionDetailModal.tsx — View items inside a collection
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Film, Star, ExternalLink, Globe, Lock, Heart } from 'lucide-react';
import { userLibraryService, type UserCollection, type UserCollectionItem } from '@/services/userLibrary';
import { useUserLibrary } from '@/hooks/useUserLibrary';

interface CollectionDetailModalProps {
  collection: UserCollection | null;
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
}

export const CollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  collection,
  isOpen,
  onClose,
  isOwner,
}) => {
  const [items, setItems] = useState<UserCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { removeItemFromCollection, toggleSaveCollection } = useUserLibrary();

  useEffect(() => {
    if (!isOpen || !collection) return;
    let isMounted = true;
    setLoading(true);

    userLibraryService.getCollectionItems(collection.id).then((data) => {
      if (isMounted) {
        setItems(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, collection]);

  if (!isOpen || !collection) return null;

  const handleRemove = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    await removeItemFromCollection(collection.id, mediaId, mediaType);
    setItems((prev) => prev.filter((it) => !(it.media_id === mediaId && it.media_type === mediaType)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={collection.title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-[#c9a24b]/30 bg-[#120a0e] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[#f5c542] bg-[#c9a24b]/15 border border-[#c9a24b]/30">
                {collection.is_public ? (
                  <>
                    <Globe className="w-2.5 h-2.5" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5" /> Private
                  </>
                )}
              </span>
              <span className="text-xs font-mono text-white/40">
                {items.length} {items.length === 1 ? 'title' : 'titles'}
              </span>
            </div>

            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white truncate">
              {collection.title}
            </h2>
            {collection.description && (
              <p className="text-xs font-mono text-white/60 mt-1 line-clamp-2">
                {collection.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleSaveCollection(collection)}
              className="p-2 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-[#c9a24b]/20 hover:border-[#f5c542] text-white/60 hover:text-[#f5c542] transition-colors"
              title="Save collection"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.1] text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-white/40 animate-pulse">
              Loading collection titles…
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Film className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white/70">No titles in this collection yet</p>
              <p className="text-xs font-mono text-white/40 mt-1">
                Use "Add to Collections" from any movie or TV show page to add titles here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => {
                const posterUrl = item.media_poster
                  ? `https://image.tmdb.org/t/p/w185${item.media_poster}`
                  : null;
                const linkTo = `/${item.media_type}/${item.media_id}`;

                return (
                  <div
                    key={`${item.media_type}-${item.media_id}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-[#c9a24b]/40 transition-all group"
                  >
                    <Link to={linkTo} onClick={onClose} className="flex items-center gap-3 min-w-0 flex-1">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={item.media_title}
                          className="w-11 h-16 rounded-xl object-cover border border-white/[0.08] shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-11 h-16 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06] shrink-0">
                          <Film className="w-5 h-5 text-white/30" />
                        </div>
                      )}

                      <div className="min-w-0 pr-2">
                        <p className="font-display font-bold text-sm text-white group-hover:text-[#f5c542] truncate transition-colors">
                          {item.media_title}
                        </p>
                        <p className="text-[10px] font-mono text-[#c9a24b]/70 mt-0.5">
                          {item.media_type === 'tv' ? 'TV Series' : 'Movie'} {item.release_year ? `· ${item.release_year}` : ''}
                        </p>
                        {item.vote_average && item.vote_average > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-[#f5c542] mt-1">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{item.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {isOwner && (
                      <button
                        onClick={() => handleRemove(item.media_id, item.media_type)}
                        className="p-2 text-white/30 hover:text-red-400 transition-colors shrink-0"
                        title="Remove from collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
