// src/pages/DirectorsPage.tsx — Cinema Directors Showcase & Universal Search
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Sparkles,
  X,
  Clapperboard,
  Compass,
  ChevronRight,
  Filter,
  Film,
  User,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { DirectorRow } from '@/components/directors/DirectorRow';
import {
  CURATED_DIRECTORS,
  DIRECTOR_CATEGORIES,
  type DirectorCategory,
  type CuratedDirector,
} from '@/config/directors';
import { useDebounce } from '@/hooks/useDebounce';
import { tmdb } from '@/services/tmdb';

interface SearchPersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: {
    id: number;
    title?: string;
    name?: string;
    media_type?: string;
  }[];
}

const PAGE_SIZE = 8;
const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export const DirectorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DirectorCategory>('all');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchTerm.trim(), 350);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Universal TMDB search for directors/filmmakers
  const { data: searchData, isLoading: isSearching } = useQuery<{
    results: SearchPersonResult[];
  }>({
    queryKey: ['search-directors-universal', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return { results: [] };
      return tmdb.searchPerson(debouncedSearch);
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 60 * 15,
  });

  // Filter and prioritize search results (include all filmmakers, prioritizing directors & popular names)
  const searchResults = useMemo(() => {
    if (!searchData?.results) return [];
    return searchData.results
      .filter((person) => {
        // Exclude completely irrelevant entries without names or with negative popularity
        if (!person.id || !person.name) return false;
        return true;
      })
      .sort((a, b) => {
        const isDirA =
          a.known_for_department === 'Directing' ||
          a.known_for_department === 'Directing & Writing';
        const isDirB =
          b.known_for_department === 'Directing' ||
          b.known_for_department === 'Directing & Writing';
        if (isDirA && !isDirB) return -1;
        if (!isDirA && isDirB) return 1;
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }, [searchData]);

  // Filter curated directors by Category and Alphabet
  const filteredCurated = useMemo(() => {
    return CURATED_DIRECTORS.filter((d) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || d.category.includes(selectedCategory);

      // Alphabet filter (checks last name or first name)
      const matchesLetter =
        selectedLetter === 'ALL' ||
        d.name
          .split(' ')
          .some((part) => part.toUpperCase().startsWith(selectedLetter));

      return matchesCategory && matchesLetter;
    });
  }, [selectedCategory, selectedLetter]);

  // Reset pagination when category or alphabet changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedLetter]);

  const isSearchActive = debouncedSearch.length >= 2;

  const handleSelectDirector = (id: number) => {
    setDropdownOpen(false);
    navigate(`/director/${id}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0608] text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-28 md:pb-16 space-y-8 sm:space-y-10">
        {/* ── Page Header & Search ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a24b]/15 border border-[#c9a24b]/30 text-xs font-mono font-bold text-[#f5c542] mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>The Pantheon of Filmmakers</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl tracking-tight text-white flex items-baseline gap-3">
              <span>Directors</span>
              <span className="text-[#f5c542] text-xl sm:text-2xl font-light italic">
                Vault
              </span>
            </h1>

            <p className="text-xs sm:text-sm font-mono text-[#c9a24b]/80 mt-2 max-w-2xl leading-relaxed">
              Explore the visionary auteurs, iconic masterclasses, and complete filmographies
              that shaped cinema history.
            </p>
          </div>

          {/* ── Universal Search Bar with Live Autocomplete Dropdown ── */}
          <div ref={searchContainerRef} className="w-full lg:w-96 relative z-30">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onFocus={() => setDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDropdownOpen(true);
                }}
                placeholder="Search any director (e.g. Kubrick, Peele, Nolan)…"
                aria-label="Search directors"
                className="w-full bg-[#140a0d] border border-white/[0.12] focus:border-[#f5c542] focus:ring-1 focus:ring-[#f5c542] rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm font-mono text-white placeholder-white/40 transition-all outline-none shadow-xl"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setDropdownOpen(false);
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instant Autocomplete Suggestions Popover */}
            {dropdownOpen && isSearchActive && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[#c9a24b]/30 bg-[#140a0d]/95 backdrop-blur-2xl shadow-2xl p-2 max-h-96 overflow-y-auto divide-y divide-white/[0.06] animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-white/40 uppercase tracking-wider">
                  <span>Filmmaker Matches</span>
                  {isSearching && (
                    <span className="text-[#f5c542] animate-pulse">Searching…</span>
                  )}
                </div>

                {searchResults.slice(0, 6).map((person) => {
                  const photo = person.profile_path
                    ? tmdb.getImageUrl(person.profile_path, 'w185')
                    : null;
                  const knownWorks = (person.known_for || [])
                    .map((k) => k.title || k.name)
                    .filter(Boolean)
                    .slice(0, 2)
                    .join(', ');

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleSelectDirector(person.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.06] text-left transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-black/60 border border-[#c9a24b]/30 shrink-0">
                        {photo ? (
                          <img
                            src={photo}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-[#f5c542]">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-[#f5c542] transition-colors truncate">
                          {person.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#c9a24b]/70 truncate">
                          {person.known_for_department} {knownWorks ? `· ${knownWorks}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#f5c542] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  );
                })}

                {searchResults.length === 0 && !isSearching && (
                  <div className="p-4 text-center text-xs font-mono text-white/50">
                    No filmmaker found for "{debouncedSearch}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Category Filters & Alphabet Jump Index (Visible when not searching) ── */}
        {!isSearchActive && (
          <div className="space-y-4">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
              {DIRECTOR_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count =
                  cat.id === 'all'
                    ? CURATED_DIRECTORS.length
                    : CURATED_DIRECTORS.filter((d) => d.category.includes(cat.id)).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-mono transition-all border ${
                      isSelected
                        ? 'bg-[#f5c542] text-[#1c120c] font-bold border-[#f5c542] shadow-[0_0_15px_rgba(245,197,66,0.35)]'
                        : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:border-[#c9a24b]/40'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="ml-1.5 opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* A–Z Alphabet Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
              <span className="text-[10px] font-mono text-white/30 uppercase mr-1 shrink-0">
                A–Z Index:
              </span>
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setSelectedLetter(letter)}
                  className={`w-7 h-7 rounded-lg text-[10px] font-mono shrink-0 transition-colors flex items-center justify-center ${
                    selectedLetter === letter
                      ? 'bg-[#c9a24b]/20 text-[#f5c542] border border-[#c9a24b]/50 font-bold'
                      : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Directors Showcase List ── */}
        <section aria-label="Directors Showcase">
          {isSearchActive ? (
            /* Search Results View */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-mono text-white/50">
                  Found {searchResults.length} {searchResults.length === 1 ? 'filmmaker' : 'filmmakers'} for "{debouncedSearch}"
                </p>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs font-mono text-[#f5c542] hover:underline"
                >
                  Reset to Curated Vault
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-white/[0.08]">
                  {searchResults.slice(0, 15).map((person) => (
                    <DirectorRow
                      key={person.id}
                      id={person.id}
                      fallbackName={person.name}
                    />
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="py-20 text-center rounded-2xl bg-[#140a0d]/40 border border-white/[0.08] p-8 space-y-3">
                  <Clapperboard className="w-12 h-12 text-[#c9a24b]/40 mx-auto" />
                  <h3 className="font-display font-bold text-lg text-white">
                    No directors found matching "{debouncedSearch}"
                  </h3>
                  <p className="text-xs font-mono text-white/50 max-w-md mx-auto">
                    Try searching for another director or browsing through the curated auteur categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-3 px-5 py-2 rounded-full bg-[#f5c542] text-[#1c120c] font-mono font-bold text-xs hover:bg-[#c9a24b] transition-all"
                  >
                    View All Master Directors
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* Curated Master Showcase with Progressive Loading */
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#f5c542]" />
                  <h2 className="font-mono text-xs uppercase tracking-wider text-white/50 font-bold">
                    Showing {Math.min(visibleCount, filteredCurated.length)} of {filteredCurated.length} Auteurs
                  </h2>
                </div>
                {(selectedCategory !== 'all' || selectedLetter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedLetter('ALL');
                    }}
                    className="text-xs font-mono text-[#c9a24b] hover:text-[#f5c542] transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {filteredCurated.length > 0 ? (
                <div className="divide-y divide-white/[0.08]">
                  {filteredCurated.slice(0, visibleCount).map((d) => (
                    <DirectorRow
                      key={d.id}
                      id={d.id}
                      fallbackName={d.name}
                      era={d.era}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8">
                  <p className="font-display font-bold text-base text-white/70">
                    No directors found under letter "{selectedLetter}"
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedLetter('ALL')}
                    className="mt-3 px-4 py-1.5 rounded-full bg-[#c9a24b]/20 border border-[#c9a24b]/40 text-[#f5c542] text-xs font-mono font-bold hover:bg-[#c9a24b]/30"
                  >
                    Reset Letter Filter
                  </button>
                </div>
              )}

              {/* Load More Button */}
              {visibleCount < filteredCurated.length && (
                <div className="text-center pt-8">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="px-6 py-2.5 rounded-full bg-[#140a0d] border border-[#c9a24b]/40 text-[#f5c542] hover:bg-[#c9a24b]/15 hover:border-[#f5c542] transition-all font-mono text-xs font-bold shadow-lg"
                  >
                    Load More Directors ({filteredCurated.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-[#0a0608] pb-28 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm tracking-wider text-white">
              Movie<span className="text-[#f5c542]">Guy</span>
            </span>
            <span className="text-[11px] font-mono text-white/30">
              The Definitive Director Filmography Showcase
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/20">
            © {new Date().getFullYear()} MovieGuy. Film credits courtesy of TMDB.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default DirectorsPage;
