// src/components/explore/PosterCard.tsx — Standard MovieCard wrapper for Explore
import React from 'react';
import { MovieCard } from '@/components/MovieCard';
import { type Movie } from '@/services/tmdb';

export interface PosterCardProps {
  item: Movie;
  typeOverride?: 'movie' | 'tv';
  className?: string;
}

export const PosterCard: React.FC<PosterCardProps> = ({ item, typeOverride, className = '' }) => {
  return <MovieCard movie={item} type={typeOverride} className={className} />;
};

export default PosterCard;
