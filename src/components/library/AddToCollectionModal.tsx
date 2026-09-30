// src/components/library/AddToCollectionModal.tsx — Add Title to Collections Modal
import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Bookmark, FolderPlus } from 'lucide-react';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { userLibraryService, type UserCollectionItem } from '@/services/userLibrary';
import { toast } from 'sonner';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: number;
    title: string;
    mediaType: 'movie' | 'tv';
    posterPath?: string;
    releaseYear?: string;
    voteAverage?: number;
  };
}

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isOpen,
  onClose,
  media,
}) => {
  const { collections, createCollection, addItemToCollection, removeItemFromCollection } =
    useUserLibrary();

  const [collectionStatus, setCollectionStatus] = useState<Record<string, boolean>>({});
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check which collections already have this item
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    async function checkMemberships() {
      const statusMap: Record<string, boolean> = {};
      await Promise.all(
        collections.map(async (col) => {
          const items = await userLibraryService.getCollectionItems(col.id);
          const has = items.some(
            (it) => it.media_id === media.id && it.media_type === media.mediaType
          );
          statusMap[col.id] = has;
        })
      );
      if (isMounted) {
        setCollectionStatus(statusMap);
        setLoading(false);
      }
    }

    checkMemberships();
    return () => {
      isMounted = false;
    };
  }, [isOpen, collections, media.id, media.mediaType]);

  if (!isOpen) return null;

  const handleToggle = async (colId: string) => {
    const isCurrentlyIn = !!collectionStatus[colId];
    setCollectionStatus((prev) => ({ ...prev, [colId]: !isCurrentlyIn }));

    if (isCurrentlyIn) {
      await removeItemFromCollection(colId, media.id, media.mediaType);
    } else {
      await addItemToCollection(colId, {
        media_id: media.id,
        media_type: media.mediaType,
        title: media.title,
        poster_path: media.posterPath,
        release_year: media.releaseYear,
        vote_average: media.voteAverage,
      });
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const created = await createCollection(newTitle.trim());
      await addItemToCollection(created.id, {
        media_id: media.id,
        media_type: media.mediaType,
        title: media.title,
        poster_path: media.posterPath,
        release_year: media.releaseYear,
        vote_average: media.voteAverage,
      });
      setCollectionStatus((prev) => ({ ...prev, [created.id]: true }));
      setNewTitle('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add to Collections"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-[#c9a24b]/30 bg-[#120a0e] p-6 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c9a24b]/15 border border-[#c9a24b]/30 flex items-center justify-center text-[#f5c542]">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Add to Collections</h3>
              <p className="text-[11px] font-mono text-white/40 truncate max-w-[220px]">
                {media.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collections List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-5">
          {collections.length === 0 ? (
            <p className="text-xs font-mono text-white/40 text-center py-4">
              No collections yet. Create your first one below!
            </p>
          ) : (
            collections.map((col) => {
              const inCollection = !!collectionStatus[col.id];
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleToggle(col.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                    inCollection
                      ? 'border-[#f5c542] bg-[#f5c542]/10 text-white'
                      : 'border-white/[0.08] bg-white/[0.02] hover:border-[#c9a24b]/40 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-display font-bold text-sm truncate">{col.title}</p>
                    <span className="text-[10px] font-mono text-[#c9a24b]/70">
                      {col.items_count} titles {col.is_public ? '· Public' : '· Private'}
                    </span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      inCollection
                        ? 'bg-[#f5c542] border-[#f5c542] text-black shadow-sm'
                        : 'border-white/[0.2] bg-white/[0.05]'
                    }`}
                  >
                    {inCollection && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Quick Create New Collection Form */}
        <form onSubmit={handleCreateAndAdd} className="border-t border-white/[0.08] pt-4">
          <label className="block text-[11px] font-mono text-white/50 mb-1.5 uppercase tracking-wider">
            Create &amp; Add to New Collection
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Masterpieces to Rewatch"
              className="flex-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder-white/30 focus:border-[#f5c542] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || isCreating}
              className="px-4 py-2 rounded-xl bg-[#f5c542] hover:bg-[#e6b738] text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors shadow-sm"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Adding…' : 'Add'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
