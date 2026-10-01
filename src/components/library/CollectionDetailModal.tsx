// src/components/library/CollectionDetailModal.tsx — View, Add Content & Manage Collection
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Trash2,
  Film,
  Star,
  Globe,
  Lock,
  Heart,
  Plus,
  Pencil,
  ImagePlus,
  FileEdit,
  ListOrdered,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  userLibraryService,
  type UserCollection,
  type UserCollectionItem,
} from '@/services/userLibrary';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { AddContentModal } from './AddContentModal';
import { toast } from 'sonner';

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
  const [currentCollection, setCurrentCollection] = useState<UserCollection | null>(collection);
  const [items, setItems] = useState<UserCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-modals
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [isEditListMode, setIsEditListMode] = useState(false);

  // Edit details form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);

  // Add banner form state
  const [bannerUrl, setBannerUrl] = useState('');

  const {
    removeItemFromCollection,
    toggleSaveCollection,
    updateCollection,
    deleteCollection,
  } = useUserLibrary();

  useEffect(() => {
    setCurrentCollection(collection);
    if (collection) {
      setEditTitle(collection.title || '');
      setEditDesc(collection.description || '');
      setEditIsPublic(collection.is_public ?? true);
      setBannerUrl(collection.cover_image || '');
    }
  }, [collection]);

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

  const existingItemIds = useMemo(() => {
    return new Set(items.map((it) => `${it.media_type}_${it.media_id}`));
  }, [items]);

  if (!isOpen || !currentCollection) return null;

  const handleRemove = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    await removeItemFromCollection(currentCollection.id, mediaId, mediaType);
    setItems((prev) =>
      prev.filter((it) => !(it.media_id === mediaId && it.media_type === mediaType))
    );
  };

  const handleItemAdded = (newItem: {
    media_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string;
    release_year?: string;
    vote_average?: number;
  }) => {
    setItems((prev) => [
      {
        id: `ci-${Date.now()}`,
        collection_id: currentCollection.id,
        media_id: newItem.media_id,
        media_type: newItem.media_type,
        media_title: newItem.title,
        media_poster: newItem.poster_path,
        release_year: newItem.release_year,
        vote_average: newItem.vote_average,
        added_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleItemRemoved = (mediaId: number, mediaType: 'movie' | 'tv') => {
    setItems((prev) =>
      prev.filter((it) => !(it.media_id === mediaId && it.media_type === mediaType))
    );
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const updated = await updateCollection(currentCollection.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      is_public: editIsPublic,
    });

    if (updated) {
      setCurrentCollection(updated);
    } else {
      setCurrentCollection((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle.trim(),
              description: editDesc.trim(),
              is_public: editIsPublic,
            }
          : null
      );
    }
    setIsEditDetailsOpen(false);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await updateCollection(currentCollection.id, {
      cover_image: bannerUrl.trim(),
    });

    if (updated) {
      setCurrentCollection(updated);
    } else {
      setCurrentCollection((prev) =>
        prev ? { ...prev, cover_image: bannerUrl.trim() } : null
      );
    }
    setIsAddBannerOpen(false);
  };

  const handleDeleteCollection = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the collection "${currentCollection.title}"?`
      )
    ) {
      await deleteCollection(currentCollection.id);
      onClose();
    }
  };

  const canEdit = isOwner !== false && currentCollection.user_id !== 'system';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={currentCollection.title}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-white/[0.1] bg-[#120a0e] shadow-2xl overflow-hidden relative"
        >
          {/* ── Top Banner Area (Matches Screenshot 2) ── */}
          <div className="relative w-full h-44 sm:h-52 bg-gradient-to-b from-[#261520] via-[#1a0f16] to-[#120a0e] overflow-hidden border-b border-white/[0.08]">
            {/* Background Cover Image if available */}
            {currentCollection.cover_image && (
              <img
                src={currentCollection.cover_image}
                alt={currentCollection.title}
                className="absolute inset-0 w-full h-full object-cover opacity-40 brightness-75"
              />
            )}

            {/* Gradient Overlay for dark cinema feel */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#120a0e] via-[#120a0e]/60 to-transparent" />

            {/* Center Logo / Empty Icon (from Screenshot 2) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img
                src="/assets/branding/movieguy-logo-tight.png"
                alt=""
                className="w-16 sm:w-20 h-auto object-contain opacity-25 drop-shadow-[0_0_15px_rgba(245,197,66,0.3)]"
              />
            </div>

            {/* Top Bar Actions: + Add Content, Edit Dropdown, Save, Close */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              {canEdit && (
                <>
                  {/* + Add Content Pill Button (Screenshot 2) */}
                  <button
                    type="button"
                    onClick={() => setIsAddContentOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full font-display font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_0_18px_rgba(192,38,211,0.45)] transition-all duration-200 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Content</span>
                  </button>

                  {/* Actions Dropdown Menu (Pencil Button from Screenshot 2) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Collection options"
                        className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-2xl border border-white/[0.12] bg-[#1a0f16]/95 backdrop-blur-xl p-1.5 shadow-2xl text-white z-50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <DropdownMenuItem
                        onClick={() => setIsAddBannerOpen(true)}
                        className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08]"
                      >
                        <ImagePlus className="w-4 h-4 text-[#c9a24b]" />
                        <span>Add Banner</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setIsEditDetailsOpen(true)}
                        className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08]"
                      >
                        <FileEdit className="w-4 h-4 text-sky-400" />
                        <span>Edit Details</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setIsEditListMode((v) => !v)}
                        className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/[0.08]"
                      >
                        <ListOrdered className="w-4 h-4 text-emerald-400" />
                        <span>{isEditListMode ? 'Done Editing List' : 'Edit List'}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-white/[0.08] my-1" />

                      <DropdownMenuItem
                        onClick={handleDeleteCollection}
                        className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {/* Save / Like Collection Button */}
              <button
                type="button"
                onClick={() => toggleSaveCollection(currentCollection)}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-[#f5c542] border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                title="Save collection"
              >
                <Heart className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-md"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom-left Collection Info inside Banner */}
            <div className="absolute bottom-4 left-6 right-6 z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[#f5c542] bg-[#c9a24b]/15 border border-[#c9a24b]/30 backdrop-blur-md">
                  {currentCollection.is_public ? (
                    <>
                      <Globe className="w-2.5 h-2.5" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-2.5 h-2.5" /> Private
                    </>
                  )}
                </span>
                <span className="text-xs font-mono text-white/50 backdrop-blur-md">
                  {items.length} {items.length === 1 ? 'title' : 'titles'}
                </span>
              </div>

              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white truncate drop-shadow-md">
                {currentCollection.title}
              </h2>
              {currentCollection.description && (
                <p className="text-xs font-mono text-white/70 mt-1 line-clamp-1 drop-shadow-sm max-w-xl">
                  {currentCollection.description}
                </p>
              )}
            </div>
          </div>

          {/* ── Content Items Grid ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="py-20 text-center text-xs font-mono text-white/40 animate-pulse">
                Loading collection titles…
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                  <Film className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-base font-bold text-white/80">No titles in this collection yet</p>
                <p className="text-xs font-mono text-white/40 mt-1 max-w-sm">
                  Click "+ Add Content" to search and add movies and shows to your collection.
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsAddContentOpen(true)}
                    className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-display font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_0_15px_rgba(192,38,211,0.4)] transition-all"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add First Title</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {items.map((item) => {
                  const posterUrl = item.media_poster
                    ? `https://image.tmdb.org/t/p/w342${item.media_poster}`
                    : null;
                  const linkTo = `/${item.media_type}/${item.media_id}`;

                  return (
                    <div
                      key={`${item.media_type}-${item.media_id}`}
                      className="group relative flex flex-col select-none"
                    >
                      {/* Poster Card */}
                      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] group-hover:border-white/25 transition-all shadow-md">
                        <Link to={linkTo} onClick={onClose} className="block w-full h-full">
                          {posterUrl ? (
                            <img
                              src={posterUrl}
                              alt={item.media_title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/30 p-2 text-center">
                              <Film className="w-8 h-8 mb-1" />
                              <span className="text-[10px] font-mono">{item.media_title}</span>
                            </div>
                          )}
                        </Link>

                        {/* Top-Right Remove Button (when in owner/edit mode) */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemove(item.media_id, item.media_type)}
                            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                              isEditListMode
                                ? 'bg-red-500 hover:bg-red-600 text-white scale-105'
                                : 'bg-black/60 hover:bg-red-600 text-white/80 hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                            title="Remove from collection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="pt-2 px-0.5 min-w-0">
                        <Link
                          to={linkTo}
                          onClick={onClose}
                          className="font-display font-bold text-xs text-white truncate hover:text-[#f5c542] transition-colors block"
                        >
                          {item.media_title}
                        </Link>
                        <div className="flex items-center justify-between text-[11px] font-mono text-white/40 mt-0.5">
                          <span>
                            {item.release_year ? `${item.release_year} · ` : ''}
                            {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
                          </span>
                          {item.vote_average && item.vote_average > 0 && (
                            <span className="flex items-center gap-0.5 text-[#f5c542]">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>{item.vote_average.toFixed(1)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Content Modal (Screenshots 1, 3, 4, 5) ── */}
      <AddContentModal
        collectionId={currentCollection.id}
        isOpen={isAddContentOpen}
        onClose={() => setIsAddContentOpen(false)}
        existingItemIds={existingItemIds}
        onItemAdded={handleItemAdded}
        onItemRemoved={handleItemRemoved}
      />

      {/* ── Edit Details Dialog ── */}
      {isEditDetailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsEditDetailsOpen(false)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#140a0e] p-6 shadow-2xl relative text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Edit Collection Details</h3>
              <button
                type="button"
                onClick={() => setIsEditDetailsOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none resize-none"
                  placeholder="What is this collection about?"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.04] text-[#f5c542] focus:ring-0"
                />
                <label htmlFor="editIsPublic" className="text-xs font-mono text-white/80 cursor-pointer">
                  Make collection public in Community
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditDetailsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#1c120c] bg-[#f5c542] hover:bg-[#f5c542]/90 shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Banner Dialog ── */}
      {isAddBannerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsAddBannerOpen(false)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#140a0e] p-6 shadow-2xl relative text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Add Collection Banner</h3>
              <button
                type="button"
                onClick={() => setIsAddBannerOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* Image Preview if chosen */}
              {bannerUrl ? (
                <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-[#f5c542]/40 bg-black/60 shadow-inner group">
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBannerUrl('')}
                      className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-mono font-medium shadow"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Upload from Device */}
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1.5">
                  Upload Image from Device
                </label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/[0.15] hover:border-[#f5c542]/60 rounded-2xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                  <div className="flex flex-col items-center justify-center pt-2 pb-2">
                    <ImagePlus className="w-6 h-6 text-[#f5c542] mb-1.5" />
                    <p className="text-xs text-white/80 font-mono">
                      <span className="font-bold text-[#f5c542]">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">PNG, JPG, WEBP, GIF (Max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        toast.error('Please select an image file');
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('Image size must be under 10MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setBannerUrl(reader.result);
                          toast.success('Image loaded successfully');
                        }
                      };
                      reader.onerror = () => toast.error('Failed to read image file');
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              {/* Or enter URL */}
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">
                  Or enter Banner Image URL
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/w1280/... or direct link"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none placeholder:text-white/20"
                />
              </div>

              {/* Quick Pick from Collection Posters */}
              {items.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono text-white/50 mb-2">
                    Or select from collection titles:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {items.slice(0, 6).map((it) => {
                      if (!it.media_poster) return null;
                      const fullUrl = `https://image.tmdb.org/t/p/w780${it.media_poster}`;
                      const isSelected = bannerUrl === fullUrl;
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setBannerUrl(fullUrl)}
                          className={`relative w-12 h-16 rounded-lg overflow-hidden border shrink-0 transition-all ${
                            isSelected
                              ? 'border-[#f5c542] ring-2 ring-[#f5c542]/50 scale-105'
                              : 'border-white/[0.1] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={fullUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#f5c542]/30 flex items-center justify-center">
                              <Check className="w-4 h-4 text-[#1c120c] stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBannerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-[#1c120c] bg-[#f5c542] hover:bg-[#f5c542]/90 shadow-md"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
