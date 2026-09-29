// pages/CountriesPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Search, ChevronLeft } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

interface CountryItem {
  name: string;
  code: string;
  flag: string;
}

const COUNTRIES_DATA: Record<string, CountryItem[]> = {
  A: [
    { name: 'Argentina', code: 'AR', flag: '????' },
    { name: 'Australia', code: 'AU', flag: '????' },
    { name: 'Austria', code: 'AT', flag: '????' },
  ],
  B: [
    { name: 'Belgium', code: 'BE', flag: '????' },
    { name: 'Brazil', code: 'BR', flag: '????' },
  ],
  C: [
    { name: 'Canada', code: 'CA', flag: '????' },
    { name: 'China', code: 'CN', flag: '????' },
    { name: 'Colombia', code: 'CO', flag: '????' },
  ],
  D: [
    { name: 'Denmark', code: 'DK', flag: '????' },
  ],
  F: [
    { name: 'Finland', code: 'FI', flag: '????' },
    { name: 'France', code: 'FR', flag: '????' },
  ],
  G: [
    { name: 'Germany', code: 'DE', flag: '????' },
    { name: 'Greece', code: 'GR', flag: '????' },
  ],
  I: [
    { name: 'India (Bollywood & Regional)', code: 'IN', flag: '????' },
    { name: 'Indonesia', code: 'ID', flag: '????' },
    { name: 'Ireland', code: 'IE', flag: '????' },
    { name: 'Italy', code: 'IT', flag: '????' },
  ],
  J: [
    { name: 'Japan', code: 'JP', flag: '????' },
  ],
  M: [
    { name: 'Mexico', code: 'MX', flag: '????' },
  ],
  N: [
    { name: 'Netherlands', code: 'NL', flag: '????' },
    { name: 'New Zealand', code: 'NZ', flag: '????' },
    { name: 'Norway', code: 'NO', flag: '????' },
  ],
  P: [
    { name: 'Poland', code: 'PL', flag: '????' },
    { name: 'Portugal', code: 'PT', flag: '????' },
  ],
  S: [
    { name: 'South Africa', code: 'ZA', flag: '????' },
    { name: 'South Korea (K-Drama & Film)', code: 'KR', flag: '????' },
    { name: 'Spain', code: 'ES', flag: '????' },
    { name: 'Sweden', code: 'SE', flag: '????' },
    { name: 'Switzerland', code: 'CH', flag: '????' },
  ],
  T: [
    { name: 'Thailand', code: 'TH', flag: '????' },
    { name: 'Turkey', code: 'TR', flag: '????' },
  ],
  U: [
    { name: 'United Kingdom', code: 'GB', flag: '????' },
    { name: 'United States (Hollywood)', code: 'US', flag: '????' },
  ],
};

export const CountriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COUNTRIES_DATA;

    const result: Record<string, CountryItem[]> = {};
    for (const [letter, countries] of Object.entries(COUNTRIES_DATA)) {
      const matched = countries.filter(
        (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      );
      if (matched.length > 0) {
        result[letter] = matched;
      }
    }
    return result;
  }, [searchQuery]);

  const handleSelectCountry = (country: CountryItem) => {
    soundEffects.playHoverTick();
    navigate(`/explore?country=${encodeURIComponent(country.name)}&country_code=${country.code}`);
  };

  return (
    <div className="min-h-screen bg-[#060810] text-[#f8fafc] selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28">
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
              Countries
            </h1>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country"
              className="w-full bg-[#121520] border border-white/10 focus:border-red-600/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([letter, items]) => (
            <div
              key={letter}
              className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8 pb-6 border-b border-white/[0.06]"
            >
              <div className="w-12 sm:w-16 flex-shrink-0">
                <span className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                  {letter}
                </span>
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                {items.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelectCountry(country)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-[#121520]/90 hover:bg-[#1c2234] border border-white/[0.06] hover:border-red-600/60 text-left transition-all duration-200 cursor-pointer group shadow-sm hover:scale-[1.02]"
                  >
                    <span className="text-xl leading-none">{country.flag}</span>
                    <span className="text-sm font-medium text-white/90 group-hover:text-white truncate block">
                      {country.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(filteredGroups).length === 0 && (
            <div className="text-center py-20 text-white/40 text-sm">
              No countries found matching "{searchQuery}"
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CountriesPage;
