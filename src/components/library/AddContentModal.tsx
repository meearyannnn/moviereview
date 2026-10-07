// src/components/library/AddContentModal.tsx — Search & add movies/shows to a collection
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Plus, Check, Film, Tv, Loader2 } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import { ModalShell } from '@/components/ui/ModalShell';
import { toast } from 'sonner';

interface AddContentModalProps {
  collectionId: string;
  isOpen: boolean;
  onClose: () => void;
  existingItemIds?: Set<string>; // 'movie_123' or 'tv_456'
  onItemAdded?: (item: {
    media_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string;
    release_year?: string;
    vote_average?: number;
  }) => void;
  onItemRemoved?: (mediaId: number, mediaType: 'movie' | 'tv') => void;
}

// A stable fallback, so the sync effect below doesn't re-run on every render
const EMPTY_SET: Set<string> = new Set();

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

const getMediaType = (m: Movie): 'movie' | 'tv' =>
  m.media_type === 'tv' || (!m.media_type && (m.first_air_date || (m as any).name)) ? 'tv' : 'movie';

export const AddContentModal: React.FC<AddContentModalProps> = ({
  collectionId,
  isOpen,
  onClose,
  existingItemIds = EMPTY_SET,
  onItemAdded,
  onItemRemoved,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set(existingItemIds));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const { addItemToCollection, removeItemFromCollection } = useUserLibrary();

  // Sync existing item keys whenever the modal opens or the collection changes
  useEffect(() => {
    if (isOpen) {
      setAddedSet(new Set(existingItemIds));
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen, existingItemIds]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await tmdb.search(trimmed);
      const list = data?.results || [];
      // Drop people and anything without a poster
      setResults(list.filter((m: Movie) => (m as any).media_type !== 'person' && Boolean(m.poster_path)));
    } catch (err) {
      console.error('AddContent search error:', err);
      setResults([]);
      toast.error('Search failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleToggleItem = async (m: Movie) => {
    const mediaType = getMediaType(m);
    const mediaId = m.id;
    const title = m.title || (m as any).name || 'Untitled';
    const releaseDate = m.release_date || m.first_air_date || '';
    const releaseYear = releaseDate ? releaseDate.slice(0, 4) : '';
    const itemKey = `${mediaType}_${mediaId}`;
    const isAlreadyAdded = addedSet.has(itemKey);

    if (isAlreadyAdded) {
      setAddedSet((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
      await removeItemFromCollection(collectionId, mediaId, mediaType);
      onItemRemoved?.(mediaId, mediaType);
      toast.info('Removed from collection');
    } else {
      setAddedSet((prev) => new Set(prev).add(itemKey));
      const newItem = {
        media_id: mediaId,
        media_type: mediaType,
        title,
        poster_path: m.poster_path,
        release_year: releaseYear,
        vote_average: m.vote_average,
      };
      await addItemToCollection(collectionId, newItem);
      onItemAdded?.(newItem);
      toast.success('Added to collection');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      label="Add content"
      onClose={onClose}
      zIndex={60}
      panelClassName="flex max-w-4xl flex-col overflow-hidden sm:max-h-[88vh]"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <h2 className="font-display text-lg font-bold text-white">Add content</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.1] hover:text-white ${FOCUS}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="shrink-0 px-6 pb-3 pt-5">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={query}
            onChange={handleInputChange}
            aria-label="Search for movies and TV shows"
            placeholder="Search for movies or TV shows"
            className="h-12 w-full rounded-full border border-white/10 bg-white/[0.05] pl-11 pr-11 text-sm text-white placeholder-white/40 transition focus:border-[#f5c542]/60 focus:bg-white/[0.08] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className={`absolute right-3 rounded-full p-1.5 text-white/45 transition hover:bg-white/[0.08] hover:text-white ${FOCUS}`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-white/45" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-[#f5c542]" />
            <p className="text-sm">Searching…</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {results.map((m) => {
              const mediaType = getMediaType(m);
              const itemKey = `${mediaType}_${m.id}`;
              const isAdded = addedSet.has(itemKey);
              const title = m.title || (m as any).name || 'Untitled';
              const releaseDate = m.release_date || m.first_air_date || '';
              const releaseYear = releaseDate ? releaseDate.slice(0, 4) : '';
              const typeLabel = mediaType === 'tv' ? 'TV show' : 'Movie';

              return (
                <div key={itemKey} className="group relative flex select-none flex-col">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-lg transition group-hover:border-white/25">
                    {m.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-white/40">
                        {mediaType === 'tv' ? <Tv className="mb-1 h-8 w-8" /> : <Film className="mb-1 h-8 w-8" />}
                        <span className="text-[11px]">{title}</span>
                      </div>
                    )}

                    {isAdded && <div aria-hidden className="absolute inset-0 bg-[#f5c542]/10 ring-2 ring-inset ring-[#f5c542]/60" />}

                    <button
                      type="button"
                      onClick={() => handleToggleItem(m)}
                      aria-pressed={isAdded}
                      aria-label={`${isAdded ? 'Remove' : 'Add'} ${title}${isAdded ? ' from' : ' to'} collection`}
                      className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition active:scale-95 ${FOCUS} ${isAdded
                          ? 'border-[#f5c542] bg-[#f5c542] text-[#1c120c]'
                          : 'border-white/20 bg-black/50 text-white hover:bg-black/75'
                        }`}
                    >
                      {isAdded ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                    </button>
                  </div>

                  <div className="min-w-0 px-0.5 pt-2.5">
                    <p className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[#f5c542]">
                      {title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/45">
                      {releaseYear ? `${releaseYear} • ` : ''}
                      {typeLabel}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : query.trim() ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
              <Film className="h-6 w-6 text-[#f5c542]/80" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-white/85">No titles found for “{query}”</p>
            <p className="mt-1 text-sm text-white/45">Check the spelling or try the original title.</p>
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
              <Search className="h-6 w-6 text-[#f5c542]/80" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-white/55">Search for a movie or show to add it to your collection.</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
};