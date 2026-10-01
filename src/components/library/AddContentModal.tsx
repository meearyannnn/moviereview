// src/components/library/AddContentModal.tsx — Search & Add Movies/Shows to Collection
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Plus, Check, Film, Tv, Loader2 } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useUserLibrary } from '@/hooks/useUserLibrary';
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

export const AddContentModal: React.FC<AddContentModalProps> = ({
  collectionId,
  isOpen,
  onClose,
  existingItemIds = new Set(),
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

  // Sync existing item keys whenever modal opens or changes
  useEffect(() => {
    if (isOpen) {
      setAddedSet(new Set(existingItemIds));
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen, existingItemIds]);

  // Debounced search
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

      // Filter out items without posters and people
      const filtered = list.filter((m: Movie) => {
        if ((m as any).media_type === 'person') return false;
        return Boolean(m.poster_path);
      });

      setResults(filtered);
    } catch (err) {
      console.error('AddContent search error:', err);
      setResults([]);
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
    debounceRef.current = setTimeout(() => {
      runSearch(val);
    }, 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleToggleItem = async (m: Movie) => {
    const mediaType: 'movie' | 'tv' =
      m.media_type === 'tv' || (!m.media_type && (m.first_air_date || (m as any).name))
        ? 'tv'
        : 'movie';
    const mediaId = m.id;
    const title = m.title || (m as any).name || 'Untitled';
    const releaseDate = m.release_date || m.first_air_date || '';
    const releaseYear = releaseDate ? releaseDate.slice(0, 4) : '';
    const itemKey = `${mediaType}_${mediaId}`;
    const isAlreadyAdded = addedSet.has(itemKey);

    if (isAlreadyAdded) {
      // Remove
      setAddedSet((prev) => {
        const next = new Set(prev);
        next.delete(itemKey);
        return next;
      });
      await removeItemFromCollection(collectionId, mediaId, mediaType);
      onItemRemoved?.(mediaId, mediaType);
      toast.info(`Removed from collection`);
    } else {
      // Add
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
      toast.success('Content added to collection');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add Content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-3xl border border-white/[0.1] bg-[#10090d] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="font-display font-extrabold text-lg text-white">Add Content</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="px-6 pt-5 pb-3">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search for movies, TV shows..."
              className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#c9a24b]/60 focus:bg-white/[0.08] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 p-1 rounded-full text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body / Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-white/40 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#f5c542]" />
              <p className="text-xs font-mono">Searching titles…</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {results.map((m) => {
                const mediaType =
                  m.media_type === 'tv' || (!m.media_type && (m.first_air_date || (m as any).name))
                    ? 'tv'
                    : 'movie';
                const itemKey = `${mediaType}_${m.id}`;
                const isAdded = addedSet.has(itemKey);
                const title = m.title || (m as any).name || 'Untitled';
                const releaseDate = m.release_date || m.first_air_date || '';
                const releaseYear = releaseDate ? releaseDate.slice(0, 4) : '';
                const typeLabel = mediaType === 'tv' ? 'TV Show' : 'Movie';

                return (
                  <div key={itemKey} className="group relative flex flex-col select-none">
                    {/* Poster Card */}
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] group-hover:border-white/20 transition-all shadow-md">
                      {m.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/30 p-2 text-center">
                          {mediaType === 'tv' ? <Tv className="w-8 h-8 mb-1" /> : <Film className="w-8 h-8 mb-1" />}
                          <span className="text-[10px] font-mono">{title}</span>
                        </div>
                      )}

                      {/* Top-Right Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleItem(m)}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                          isAdded
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-105 ring-2 ring-emerald-400/40'
                            : 'bg-black/60 hover:bg-black/90 text-white/90 border border-white/20 hover:scale-110'
                        }`}
                        title={isAdded ? 'Remove from collection' : 'Add to collection'}
                      >
                        {isAdded ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="pt-2 px-0.5 min-w-0">
                      <p className="font-display font-bold text-xs text-white truncate group-hover:text-[#f5c542] transition-colors">
                        {title}
                      </p>
                      <p className="text-[11px] font-mono text-white/40 mt-0.5 truncate">
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
              <Film className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white/70">No titles found for "{query}"</p>
              <p className="text-xs font-mono text-white/40 mt-1">
                Try searching for another movie, TV show, or original title.
              </p>
            </div>
          ) : (
            <div className="py-28 text-center">
              <p className="text-xs sm:text-sm font-mono text-white/40">
                Search Movies and Shows to add to your collection
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
