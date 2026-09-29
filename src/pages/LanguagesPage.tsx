// pages/LanguagesPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Search, ChevronLeft } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

interface LanguageItem {
  name: string;
  code: string;
}

const LANGUAGES_DATA: Record<string, LanguageItem[]> = {
  A: [
    { name: 'Albanian', code: 'sq' },
    { name: 'Arabic', code: 'ar' },
    { name: 'Assamese', code: 'as' },
  ],
  B: [
    { name: 'Bengali', code: 'bn' },
    { name: 'Bhojpuri', code: 'bho' },
  ],
  C: [
    { name: 'Cantonese', code: 'cn' },
    { name: 'Catalan', code: 'ca' },
  ],
  D: [
    { name: 'Danish', code: 'da' },
    { name: 'Dutch', code: 'nl' },
  ],
  E: [
    { name: 'English', code: 'en' },
    { name: 'Estonian', code: 'et' },
  ],
  F: [
    { name: 'Filipino', code: 'tl' },
    { name: 'Finnish', code: 'fi' },
    { name: 'French', code: 'fr' },
  ],
  G: [
    { name: 'German', code: 'de' },
    { name: 'Greek', code: 'el' },
    { name: 'Gujarati', code: 'gu' },
  ],
  H: [
    { name: 'Hebrew', code: 'he' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Hungarian', code: 'hu' },
  ],
  I: [
    { name: 'Icelandic', code: 'is' },
    { name: 'Indonesian', code: 'id' },
    { name: 'Italian', code: 'it' },
  ],
  J: [
    { name: 'Japanese', code: 'ja' },
  ],
  K: [
    { name: 'Kannada', code: 'kn' },
    { name: 'Korean', code: 'ko' },
  ],
  M: [
    { name: 'Malayalam', code: 'ml' },
    { name: 'Mandarin', code: 'zh' },
    { name: 'Marathi', code: 'mr' },
  ],
  N: [
    { name: 'Norwegian', code: 'no' },
  ],
  P: [
    { name: 'Persian', code: 'fa' },
    { name: 'Polish', code: 'pl' },
    { name: 'Portuguese', code: 'pt' },
    { name: 'Punjabi', code: 'pa' },
  ],
  R: [
    { name: 'Romanian', code: 'ro' },
    { name: 'Russian', code: 'ru' },
  ],
  S: [
    { name: 'Spanish', code: 'es' },
    { name: 'Swedish', code: 'sv' },
  ],
  T: [
    { name: 'Tamil', code: 'ta' },
    { name: 'Telugu', code: 'te' },
    { name: 'Thai', code: 'th' },
    { name: 'Turkish', code: 'tr' },
  ],
  U: [
    { name: 'Ukrainian', code: 'uk' },
    { name: 'Urdu', code: 'ur' },
  ],
  V: [
    { name: 'Vietnamese', code: 'vi' },
  ],
};

export const LanguagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return LANGUAGES_DATA;

    const result: Record<string, LanguageItem[]> = {};
    for (const [letter, langs] of Object.entries(LANGUAGES_DATA)) {
      const matched = langs.filter(
        (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
      );
      if (matched.length > 0) {
        result[letter] = matched;
      }
    }
    return result;
  }, [searchQuery]);

  const handleSelectLanguage = (lang: LanguageItem) => {
    soundEffects.playHoverTick();
    navigate(`/explore?language=${encodeURIComponent(lang.name)}&lang=${lang.code}`);
  };

  return (
    <div className="min-h-screen bg-[#060810] text-[#f8fafc] selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28">
        {/* Header matching Screenshot 2 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
              Languages
            </h1>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language"
              className="w-full bg-[#121520] border border-white/10 focus:border-red-600/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Alphabetical Rows matching Screenshot 2 */}
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([letter, items]) => (
            <div
              key={letter}
              className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8 pb-6 border-b border-white/[0.06]"
            >
              {/* Big Alphabet Letter */}
              <div className="w-12 sm:w-16 flex-shrink-0">
                <span className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                  {letter}
                </span>
              </div>

              {/* Language Pills Grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang)}
                    className="p-3.5 rounded-xl bg-[#121520]/90 hover:bg-[#1c2234] border border-white/[0.06] hover:border-red-600/60 text-left transition-all duration-200 cursor-pointer group shadow-sm hover:scale-[1.02]"
                  >
                    <span className="text-sm font-medium text-white/90 group-hover:text-white truncate block">
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredGroups).length === 0 && (
            <div className="text-center py-20 text-white/40 text-sm">
              No languages found matching "{searchQuery}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LanguagesPage;
