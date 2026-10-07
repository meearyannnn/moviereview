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
import { ModalShell } from '@/components/ui/ModalShell';
import { toast } from 'sonner';

interface CollectionDetailModalProps {
  collection: UserCollection | null;
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
  initialItems?: UserCollectionItem[];
  onUpdate?: () => void;
}

// ─── Glass tokens ──────────────────────────────────────────────────────────────

const GLASS =
  'border border-white/[0.1] bg-white/[0.045] backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)]';
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';
const ICON_BTN = `flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-black/60 hover:text-white ${FOCUS}`;
const PRIMARY = `inline-flex items-center gap-1.5 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-semibold text-[#1c120c] shadow-[0_8px_24px_-8px_rgba(245,197,66,0.6)] transition hover:bg-[#ffd25e] active:scale-95 ${FOCUS}`;
const GHOST = `rounded-full px-4 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/[0.07] hover:text-white ${FOCUS}`;
const INPUT =
  'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/30 transition focus:border-[#f5c542]/60 focus:bg-white/[0.07] focus:outline-none';
const MENU_ITEM =
  'cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/80 focus:bg-white/[0.08] focus:text-white';

// Small glass dialog used for the edit forms
function GlassDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <ModalShell label={title} onClose={onClose} zIndex={60} panelClassName="max-w-md overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className={`rounded-full p-2 text-white/50 transition hover:bg-white/[0.08] hover:text-white ${FOCUS}`}>
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </ModalShell>
  );
}

export const CollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  collection,
  isOpen,
  onClose,
  isOwner,
  initialItems,
  onUpdate,
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

    if (initialItems && initialItems.length > 0) {
      setItems(initialItems);
      setLoading(false);
      return;
    }

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
  }, [isOpen, collection, initialItems]);

  const existingItemIds = useMemo(() => {
    return new Set(items.map((it) => `${it.media_type}_${it.media_id}`));
  }, [items]);

  if (!isOpen || !currentCollection) return null;

  const handleRemove = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    await removeItemFromCollection(currentCollection.id, mediaId, mediaType);
    setItems((prev) =>
      prev.filter((it) => !(it.media_id === mediaId && it.media_type === mediaType))
    );
    onUpdate?.();
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
    onUpdate?.();
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
    onUpdate?.();
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
    onUpdate?.();
  };

  const handleDeleteCollection = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the collection "${currentCollection.title}"?`
      )
    ) {
      await deleteCollection(currentCollection.id);
      onUpdate?.();
      onClose();
    }
  };

  const canEdit = isOwner !== false && currentCollection.user_id !== 'system' && !currentCollection.id.startsWith('shelf-');

  return (
    <>
      <ModalShell
        label={currentCollection.title}
        onClose={onClose}
        panelClassName="flex max-w-4xl flex-col overflow-hidden sm:max-h-[90vh]"
      >
        {/* ── Banner ── */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-gradient-to-b from-[#2a1422] via-[#1a0f16] to-[#140a0e] sm:h-56">
          {currentCollection.cover_image && (
            <img
              src={currentCollection.cover_image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] via-[#140a0e]/50 to-transparent" />

          {/* Brand mark when there is no cover */}
          {!currentCollection.cover_image && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <img
                src="/assets/branding/movieguy-logo-tight.png"
                alt=""
                className="h-auto w-16 object-contain opacity-25 drop-shadow-[0_0_15px_rgba(245,197,66,0.3)] sm:w-20"
              />
            </div>
          )}

          {/* Top actions */}
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            {canEdit && (
              <>
                <button type="button" onClick={() => setIsAddContentOpen(true)} className={PRIMARY}>
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  <span>Add content</span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label="Collection options" className={ICON_BTN}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="z-[80] w-48 rounded-2xl border border-white/[0.12] bg-[#140a0e]/85 p-1.5 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
                  >
                    <DropdownMenuItem onClick={() => setIsAddBannerOpen(true)} className={MENU_ITEM}>
                      <ImagePlus className="h-4 w-4 text-[#f5c542]" />
                      <span>Change banner</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditDetailsOpen(true)} className={MENU_ITEM}>
                      <FileEdit className="h-4 w-4 text-[#f5c542]" />
                      <span>Edit details</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditListMode((v) => !v)} className={MENU_ITEM}>
                      <ListOrdered className="h-4 w-4 text-[#f5c542]" />
                      <span>{isEditListMode ? 'Done editing list' : 'Edit list'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-white/[0.08]" />
                    <DropdownMenuItem
                      onClick={handleDeleteCollection}
                      className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 focus:bg-red-500/10 focus:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete collection</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <button
              type="button"
              onClick={() => toggleSaveCollection(currentCollection)}
              className={`${ICON_BTN} hover:text-[#f5c542]`}
              aria-label="Save collection"
              title="Save collection"
            >
              <Heart className="h-4 w-4" />
            </button>

            <button type="button" onClick={onClose} className={ICON_BTN} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Title block */}
          <div className="absolute bottom-5 left-6 right-6 z-10">
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-[#f5c542] backdrop-blur-md">
                {currentCollection.is_public ? (
                  <>
                    <Globe className="h-3 w-3" /> Public
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Private
                  </>
                )}
              </span>
              <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/75 backdrop-blur-md">
                {items.length} {items.length === 1 ? 'title' : 'titles'}
              </span>
            </div>

            <h2 className="truncate font-display text-2xl font-bold text-white drop-shadow-md sm:text-3xl">
              {currentCollection.title}
            </h2>
            {currentCollection.description && (
              <p className="mt-1 line-clamp-2 max-w-xl text-sm text-white/70 drop-shadow-sm">
                {currentCollection.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Titles ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {isEditListMode && canEdit && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#f5c542]/25 bg-[#f5c542]/[0.07] px-4 py-2.5 backdrop-blur-md">
              <p className="text-sm text-white/80">Tap the bin on a title to remove it.</p>
              <button type="button" onClick={() => setIsEditListMode(false)} className={`text-sm font-semibold text-[#f5c542] ${FOCUS} rounded-full px-2`}>
                Done
              </button>
            </div>
          )}

          {loading ? (
            <div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              aria-busy="true"
              aria-label="Loading titles"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[2/3] animate-pulse rounded-2xl bg-white/[0.05]" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${GLASS}`}>
                <Film className="h-7 w-7 text-[#f5c542]/80" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-white/90">No titles yet</p>
              <p className="mt-1 max-w-sm text-sm text-white/50">
                {canEdit
                  ? 'Search for movies and shows to start building this collection.'
                  : 'Nothing has been added to this collection yet.'}
              </p>
              {canEdit && (
                <button type="button" onClick={() => setIsAddContentOpen(true)} className={`mt-6 ${PRIMARY}`}>
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  <span>Add your first title</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map((item) => {
                const posterUrl = item.media_poster
                  ? item.media_poster.startsWith('http')
                    ? item.media_poster
                    : `https://image.tmdb.org/t/p/w342${item.media_poster.startsWith('/') ? '' : '/'}${item.media_poster}`
                  : null;
                const linkTo = `/${item.media_type}/${item.media_id}`;

                return (
                  <div key={`${item.media_type}-${item.media_id}`} className="group relative flex select-none flex-col">
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-lg transition group-hover:border-white/25">
                      <Link
                        to={linkTo}
                        onClick={onClose}
                        aria-label={item.media_title}
                        className={`block h-full w-full ${FOCUS}`}
                      >
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-white/40">
                            <Film className="mb-1 h-8 w-8" strokeWidth={1.5} />
                            <span className="text-[11px]">{item.media_title}</span>
                          </div>
                        )}
                      </Link>

                      {item.vote_average && item.vote_average > 0 ? (
                        <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                          <Star className="h-3 w-3 fill-[#f5c542] text-[#f5c542]" />
                          {item.vote_average.toFixed(1)}
                        </span>
                      ) : null}

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemove(item.media_id, item.media_type)}
                          aria-label={`Remove ${item.media_title} from collection`}
                          title="Remove from collection"
                          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white shadow-lg backdrop-blur-md transition ${FOCUS} ${isEditListMode
                              ? 'scale-105 bg-red-500/90 hover:bg-red-500'
                              : 'bg-black/50 opacity-0 hover:bg-red-500/90 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100'
                            }`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="min-w-0 px-0.5 pt-2.5">
                      <Link
                        to={linkTo}
                        onClick={onClose}
                        className={`block truncate rounded text-sm font-semibold text-white transition-colors hover:text-[#f5c542] ${FOCUS}`}
                      >
                        {item.media_title}
                      </Link>
                      <p className="mt-0.5 text-xs text-white/45">
                        {item.release_year ? `${item.release_year} • ` : ''}
                        {item.media_type === 'tv' ? 'TV show' : 'Movie'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModalShell>

      {/* ── Add Content Modal ── */}
      <AddContentModal
        collectionId={currentCollection.id}
        isOpen={isAddContentOpen}
        onClose={() => setIsAddContentOpen(false)}
        existingItemIds={existingItemIds}
        onItemAdded={handleItemAdded}
        onItemRemoved={handleItemRemoved}
      />

      {/* ── Edit Details ── */}
      {isEditDetailsOpen && (
        <GlassDialog title="Edit collection details" onClose={() => setIsEditDetailsOpen(false)}>
          <form onSubmit={handleSaveDetails} className="space-y-5">
            <div>
              <label htmlFor="collection-title" className="mb-1.5 block text-sm font-medium text-white/75">
                Title
              </label>
              <input
                id="collection-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={INPUT}
                required
              />
            </div>

            <div>
              <label htmlFor="collection-desc" className="mb-1.5 block text-sm font-medium text-white/75">
                Description
              </label>
              <textarea
                id="collection-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className={`${INPUT} resize-none`}
                placeholder="What is this collection about?"
              />
            </div>

            <label
              htmlFor="editIsPublic"
              className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <span>
                <span className="block text-sm font-medium text-white/90">Public collection</span>
                <span className="block text-xs text-white/50">Show this collection in Community.</span>
              </span>
              <input
                type="checkbox"
                id="editIsPublic"
                role="switch"
                checked={editIsPublic}
                onChange={(e) => setEditIsPublic(e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-white/20 bg-white/[0.06] text-[#f5c542] focus:ring-[#f5c542]/60 focus:ring-offset-0"
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsEditDetailsOpen(false)} className={GHOST}>
                Cancel
              </button>
              <button type="submit" className={PRIMARY}>
                Save changes
              </button>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* ── Banner ── */}
      {isAddBannerOpen && (
        <GlassDialog title="Change banner" onClose={() => setIsAddBannerOpen(false)}>
          <form onSubmit={handleSaveBanner} className="space-y-5">
            {bannerUrl && (
              <div className="group relative h-32 w-full overflow-hidden rounded-2xl border border-[#f5c542]/40 bg-black/60">
                <img src={bannerUrl} alt="Banner preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className={`rounded-full bg-red-500/90 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 ${FOCUS}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div>
              <span className="mb-1.5 block text-sm font-medium text-white/75">Upload from your device</span>
              <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-center transition hover:border-[#f5c542]/60 hover:bg-white/[0.06] focus-within:border-[#f5c542]/60">
                <ImagePlus className="mb-1.5 h-6 w-6 text-[#f5c542]" strokeWidth={1.75} />
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-[#f5c542]">Choose an image</span> or drop it here
                </p>
                <p className="mt-0.5 text-xs text-white/40">PNG, JPG, WEBP or GIF, up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
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

            <div>
              <label htmlFor="banner-url" className="mb-1.5 block text-sm font-medium text-white/75">
                Or paste an image link
              </label>
              <input
                id="banner-url"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://image.tmdb.org/t/p/w1280/…"
                className={INPUT}
              />
            </div>

            {items.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-white/75">Or use a poster from this collection</p>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {items.slice(0, 6).map((it) => {
                    if (!it.media_poster) return null;
                    const fullUrl = it.media_poster.startsWith('http')
                      ? it.media_poster
                      : `https://image.tmdb.org/t/p/w780${it.media_poster}`;
                    const isSelected = bannerUrl === fullUrl;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => setBannerUrl(fullUrl)}
                        aria-label={`Use poster of ${it.media_title}`}
                        aria-pressed={isSelected}
                        className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border transition ${FOCUS} ${isSelected
                            ? 'scale-105 border-[#f5c542] ring-2 ring-[#f5c542]/50'
                            : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                      >
                        <img src={fullUrl} alt="" className="h-full w-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#f5c542]/30">
                            <Check className="h-4 w-4 text-[#1c120c]" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsAddBannerOpen(false)} className={GHOST}>
                Cancel
              </button>
              <button type="submit" className={PRIMARY}>
                Save banner
              </button>
            </div>
          </form>
        </GlassDialog>
      )}
    </>
  );
};