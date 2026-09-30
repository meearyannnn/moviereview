// pages/CategoriesPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Search, ChevronLeft } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

const CATEGORIES_DATA: Record<string, string[]> = {
  A: [
    'Action',
    'Adaptation',
    'Adult Comedy',
    'Adventure',
    'Animated',
    'Anthology',
    'Art House',
  ],
  B: [
    'Based on Book',
    'Based on Game',
    'Based on True Story',
    'Biopic',
    'Blood & Gore',
    'Body Horror',
    'Bottle Movies',
    'Bromance',
    'Buddy Movie',
    'Business',
  ],
  C: [
    'Coming of Age',
    'Crime',
    'Cult Classic',
    'Cyberpunk',
  ],
  D: [
    'Dark Comedy',
    'Disaster',
    'Dystopian',
  ],
  E: [
    'Epic',
    'Erotic Thriller',
    'Espionage',
  ],
  F: [
    'Family',
    'Fantasy',
    'Found Footage',
  ],
  G: [
    'Gangster',
    'Gothic',
    'Gory',
  ],
  H: [
    'Heist',
    'Historical',
    'Horror',
  ],
  I: [
    'Independent',
    'Inspirational',
    'Investigation',
  ],
  M: [
    'Martial Arts',
    'Mockumentary',
    'Mystery',
  ],
  N: [
    'Neo-Noir',
    'Non-Linear',
  ],
  P: [
    'Parody',
    'Period Drama',
    'Post-Apocalyptic',
    'Psychological Thriller',
  ],
  R: [
    'Road Trip',
    'Romance',
    'Rom-Com',
  ],
  S: [
    'Satire',
    'Sci-Fi',
    'Slasher',
    'Space',
    'Sports',
    'Superhero',
    'Survival',
    'Supernatural',
  ],
  T: [
    'Teen',
    'Time Travel',
    'Thriller',
    'True Crime',
  ],
  V: [
    'Vampire',
    'Video Game',
    'Vigilante',
  ],
  W: [
    'War',
    'Western',
    'Whodunit',
    'Workplace',
  ],
  Z: [
    'Zombie',
  ],
};

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CATEGORIES_DATA;

    const result: Record<string, string[]> = {};
    for (const [letter, cats] of Object.entries(CATEGORIES_DATA)) {
      const matched = cats.filter((c) => c.toLowerCase().includes(q));
      if (matched.length > 0) {
        result[letter] = matched;
      }
    }
    return result;
  }, [searchQuery]);

  const handleSelectCategory = (categoryName: string) => {
    soundEffects.playHoverTick();
    navigate(`/explore?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0608] text-[#f3e9d2] selection:bg-[#c9a24b] selection:text-[#1c120c] overflow-x-hidden">
      {/* Projector light ambient radial glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(245, 197, 66, 0.08) 0%, rgba(20, 10, 13, 0.4) 55%, transparent 80%)'
        }}
      />
      {/* Curtain folds */}
      <div className="pointer-events-none fixed inset-y-0 left-0 w-24 bg-gradient-to-r from-black/80 to-transparent z-10" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-24 bg-gradient-to-l from-black/80 to-transparent z-10" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 mb-6 border-b border-[#c9a24b]/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-[#140a0d] hover:bg-[#1a0f14] border border-[#c9a24b]/20 hover:border-[#f5c542]/50 flex items-center justify-center text-white/70 hover:text-[#f5c542] transition-all"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#c9a24b] uppercase block">Lobby Catalog</span>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                Categories
              </h1>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#c9a24b]/60 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category..."
              className="w-full bg-[#140a0d] border border-[#c9a24b]/25 focus:border-[#f5c542] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#f5c542]/30 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Alphabetical Rows */}
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([letter, items]) => (
            <div
              key={letter}
              className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8 pb-6 border-b border-[#c9a24b]/10"
            >
              {/* Big Alphabet Letter */}
              <div className="w-12 sm:w-16 flex-shrink-0">
                <span className="font-display font-black text-3xl sm:text-4xl text-[#f5c542] tracking-tight drop-shadow-sm">
                  {letter}
                </span>
              </div>

              {/* Categories Pills Grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                {items.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleSelectCategory(cat)}
                    className="p-3.5 rounded-xl bg-[#140a0d] hover:bg-[#1a0f14] border border-[#c9a24b]/20 hover:border-[#f5c542]/60 hover:shadow-[0_4px_20px_rgba(245,197,66,0.12)] text-left transition-all duration-200 cursor-pointer group hover:scale-[1.02]"
                  >
                    <span className="text-sm font-medium text-white/90 group-hover:text-[#f5c542] transition-colors truncate block">
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredGroups).length === 0 && (
            <div className="text-center py-20 text-white/40 text-sm">
              No categories found matching "{searchQuery}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;
