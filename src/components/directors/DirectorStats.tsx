// src/components/directors/DirectorStats.tsx — Cinema Statistics Strip
import React from 'react';
import { Film, Star, Trophy, Sparkles } from 'lucide-react';
import { type DirectorProfile } from '@/hooks/useDirector';

interface DirectorStatsProps {
  stats: DirectorProfile['stats'];
}

export const DirectorStats: React.FC<DirectorStatsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Feature Films',
      value: `${stats.totalFilms}`,
      sub: 'Directed catalog',
      icon: Film,
    },
    {
      label: 'Average TMDB Rating',
      value: stats.avgRating > 0 ? `★ ${stats.avgRating}` : 'N/A',
      sub: 'Across all verified titles',
      icon: Star,
      highlight: true,
    },
    {
      label: 'Highest Rated Work',
      value: stats.highestRatedFilm ? stats.highestRatedFilm.title : 'N/A',
      sub: stats.highestRatedFilm
        ? `★ ${stats.highestRatedFilm.vote_average.toFixed(1)} rating`
        : 'Cinema landmark',
      icon: Trophy,
    },
    {
      label: 'Signature Genre',
      value: stats.topGenre || 'Cinema',
      sub: 'Most explored style',
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${
              card.highlight
                ? 'bg-gradient-to-br from-[#c9a24b]/15 via-[#140a0d] to-[#140a0d] border-[#c9a24b]/40 shadow-[0_4px_20px_rgba(201,162,75,0.15)]'
                : 'bg-[#140a0d]/80 border-white/[0.08] hover:border-[#c9a24b]/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono tracking-wider uppercase text-white/50">
                {card.label}
              </span>
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#f5c542]">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <p className="font-display font-extrabold text-xl sm:text-2xl text-white truncate">
              {card.value}
            </p>
            <p className="text-[11px] font-mono text-[#c9a24b]/80 mt-1 truncate">
              {card.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
};
