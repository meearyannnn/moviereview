// src/components/directors/DirectorStats.tsx — Cinema Statistics Strip (simplified)
import React from 'react';
import { type DirectorProfile } from '@/hooks/useDirector';

interface DirectorStatsProps {
  stats: DirectorProfile['stats'];
}

export const DirectorStats: React.FC<DirectorStatsProps> = ({ stats }) => {
  const best = stats.highestRatedFilm;

  const items = [
    { label: 'Films directed', value: `${stats.totalFilms}` },
    {
      label: 'Average rating',
      value: stats.avgRating > 0 ? `${stats.avgRating}` : '—',
      gold: stats.avgRating > 0,
    },
    {
      label: best ? `Best rated · ★ ${best.vote_average.toFixed(1)}` : 'Best rated',
      value: best ? best.title : '—',
    },
    { label: 'Signature genre', value: stats.topGenre || '—' },
  ];

  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border border-white/[0.08] bg-[#140a0d]/80 overflow-hidden">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`min-w-0 p-5 sm:p-6 border-white/[0.08] ${i % 2 === 1 ? 'border-l' : ''
            } ${i >= 2 ? 'border-t lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l' : ''}`}
        >
          <dt className="text-xs sm:text-sm text-white/45 truncate">{item.label}</dt>
          <dd
            className={`mt-1.5 font-display font-extrabold tracking-tight text-2xl sm:text-3xl truncate ${item.gold ? 'text-[#f5c542]' : 'text-white'
              }`}
            title={item.value}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
};