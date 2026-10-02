// src/components/library/AddToCollectionModal.tsx — Clean "Add to Collection" Modal
import React, { useState, useEffect } from 'react';
import { X, Check, Lock, Globe, PlusCircle } from 'lucide-react';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { userLibraryService } from '@/services/userLibrary';
import { soundEffects } from '@/lib/soundEffects';

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
  const [isCreatingNew, setIsCreatingNew] = useState(false);
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

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggle = async (colId: string) => {
    soundEffects.playHoverTick();
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
    soundEffects.playHoverTick();
    try {
      const created = await createCollection(newTitle.trim(), '', false);
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
      setIsCreatingNew(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add to Collection"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border border-[#c9a24b]/30 bg-[#120a0e]/98 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative ring-1 ring-white/5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-4 w-1.5 rounded-full bg-[#c9a24b] shadow-[0_0_8px_rgba(201,162,75,0.8)]"
            />
            <h3 className="font-display font-extrabold text-xl text-white tracking-tight">
              Add to Collection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-[#c9a24b]/20 text-white/70 hover:text-[#f5c542] border border-[#c9a24b]/20 flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collections List */}
        <div className="max-h-64 overflow-y-auto space-y-2.5 pr-0.5 mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="space-y-2.5 py-2">
              <div className="h-12 w-full rounded-2xl bg-white/[0.04] animate-pulse" />
              <div className="h-12 w-full rounded-2xl bg-white/[0.04] animate-pulse" />
            </div>
          ) : collections.length === 0 ? (
            <p className="text-xs font-mono text-white/40 text-center py-4">
              No collections yet. Create your first collection below!
            </p>
          ) : (
            collections.map((col) => {
              const inCollection = !!collectionStatus[col.id];
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleToggle(col.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all text-left group ${
                    inCollection
                      ? 'bg-[#24141e] border border-[#c9a24b]/60 shadow-md shadow-[#c9a24b]/10'
                      : 'bg-[#180e14] hover:bg-[#20121b] border border-[#c9a24b]/20 hover:border-[#c9a24b]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        inCollection
                          ? 'bg-gradient-to-br from-[#f5c542] to-[#c9a24b] text-[#1c120c] shadow-sm shadow-[#f5c542]/30'
                          : 'border border-[#c9a24b]/40 bg-transparent group-hover:border-[#c9a24b]/80'
                      }`}
                    >
                      {inCollection && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="font-display font-bold text-sm text-white group-hover:text-[#f5c542] transition-colors truncate">
                      {col.title}
                    </span>
                  </div>

                  <div className="shrink-0 text-[#c9a24b]/60 group-hover:text-[#c9a24b] transition-colors">
                    {col.is_public ? (
                      <Globe className="w-4 h-4" title="Public" />
                    ) : (
                      <Lock className="w-4 h-4" title="Private" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom: Create New Collection Button / Form */}
        <div className="pt-1">
          {!isCreatingNew ? (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full rounded-2xl border border-dashed border-[#c9a24b]/30 hover:border-[#f5c542] bg-[#c9a24b]/5 hover:bg-[#c9a24b]/10 p-3.5 flex items-center justify-center gap-2.5 text-sm font-display font-bold text-white/80 hover:text-[#f5c542] transition-all active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4 text-[#c9a24b]" />
              <span>Create New Collection</span>
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="space-y-2.5 animate-in fade-in duration-150">
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Collection title..."
                className="w-full rounded-xl border border-[#c9a24b]/30 bg-[#0a0507] px-4 py-2.5 text-sm text-white font-sans placeholder-white/30 focus:border-[#f5c542] focus:outline-none transition-colors"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewTitle('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || isCreating}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#f5c542] to-[#c9a24b] hover:brightness-110 text-[#1c120c] font-display font-extrabold text-xs disabled:opacity-40 transition-all shadow-sm shadow-[#f5c542]/20"
                >
                  {isCreating ? 'Creating…' : 'Create & Add'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
