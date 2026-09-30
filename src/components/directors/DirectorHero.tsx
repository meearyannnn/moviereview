// src/components/directors/DirectorHero.tsx — Director Detail Hero Section
import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Star,
  Film,
  Award,
  Globe,
  Instagram,
  Twitter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { type DirectorProfile } from '@/hooks/useDirector';
import { tmdb } from '@/services/tmdb';

interface DirectorHeroProps {
  director: DirectorProfile;
}

const FALLBACK_PORTRAIT =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80';

export const DirectorHero: React.FC<DirectorHeroProps> = ({ director }) => {
  const [bioExpanded, setBioExpanded] = useState(false);

  const photoUrl = director.profile_path
    ? tmdb.getImageUrl(director.profile_path, 'h632' as any) || tmdb.getImageUrl(director.profile_path, 'w500')
    : FALLBACK_PORTRAIT;

  // Calculate age from birthday and deathday or current date
  let ageText = '';
  if (director.birthday) {
    const birthYear = new Date(director.birthday).getFullYear();
    const endYear = director.deathday
      ? new Date(director.deathday).getFullYear()
      : new Date().getFullYear();
    const age = endYear - birthYear;
    ageText = director.deathday ? `(19${birthYear % 100}–${endYear}, age ${age})` : `(age ${age})`;
  }

  const formattedBirthday = director.birthday
    ? new Date(director.birthday).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const external = director.external_ids;

  // Backdrop preview from their highest rated film if available
  const heroBackdrop = director.stats.highestRatedFilm?.backdrop_path
    ? tmdb.getImageUrl(director.stats.highestRatedFilm.backdrop_path, 'original')
    : null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#140a0d]/90 border border-[#c9a24b]/20 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md">
      {/* Subtle cinematic backdrop glow */}
      {heroBackdrop && (
        <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
          <img
            src={heroBackdrop}
            alt=""
            className="w-full h-full object-cover filter blur-3xl scale-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0608] via-[#0a0608]/80 to-transparent" />
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 sm:gap-8 lg:gap-10">
        {/* ── Director Portrait ── */}
        <div className="w-36 h-48 sm:w-48 sm:h-64 lg:w-56 lg:h-72 shrink-0 rounded-2xl overflow-hidden bg-[#0c090e] border-2 border-[#c9a24b]/30 shadow-[0_12px_36px_rgba(0,0,0,0.8)] relative group">
          <img
            src={photoUrl}
            alt={director.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_PORTRAIT;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* ── Director Info & Details ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Eyebrow & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a24b]/15 border border-[#c9a24b]/35 text-[#f5c542] text-xs font-mono font-bold uppercase tracking-wider">
              <Film className="w-3 h-3" />
              Known for: Directing
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-white/90 text-xs font-mono font-medium">
              <Award className="w-3 h-3 text-[#f5c542]" />
              {director.stats.totalFilms} Directed Films
            </span>

            {director.stats.avgRating > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5c542] text-[#1c120c] text-xs font-mono font-bold shadow-md">
                <Star className="w-3 h-3 fill-current stroke-none" />
                {director.stats.avgRating} Avg Rating
              </span>
            )}
          </div>

          {/* Director Display Name: wide letter-spaced bold sans */}
          <h1 className="font-display font-extrabold uppercase tracking-[0.15em] text-3xl sm:text-5xl lg:text-6xl text-white leading-tight">
            {director.name}
          </h1>

          {/* Monospaced Meta Line */}
          {(formattedBirthday || director.place_of_birth) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm font-mono text-[#c9a24b]/80">
              {formattedBirthday && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#f5c542]" />
                  <span>
                    Born {formattedBirthday} {ageText}
                  </span>
                </div>
              )}
              {director.place_of_birth && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#f5c542]" />
                  <span>{director.place_of_birth}</span>
                </div>
              )}
            </div>
          )}

          {/* Biography with Read More Expand */}
          {director.biography && (
            <div className="space-y-2 pt-1">
              <p
                className={`text-sm sm:text-base leading-relaxed text-white/70 transition-all duration-300 font-sans ${
                  !bioExpanded ? 'line-clamp-3 sm:line-clamp-4' : ''
                }`}
              >
                {director.biography}
              </p>
              {director.biography.length > 280 && (
                <button
                  type="button"
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#f5c542] hover:text-white transition-colors py-1"
                >
                  <span>{bioExpanded ? 'Show less' : 'Read full biography'}</span>
                  {bioExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Social Links from external_ids */}
          {external && (external.imdb_id || external.instagram_id || external.twitter_id) && (
            <div className="flex items-center gap-2.5 pt-2">
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider mr-1">
                Profiles:
              </span>

              {external.imdb_id && (
                <a
                  href={`https://www.imdb.com/name/${external.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="IMDb Profile"
                  className="px-2.5 py-1 rounded-lg bg-[#f5c518] text-[#140a0d] font-mono font-black text-xs hover:brightness-110 transition-all"
                >
                  IMDb
                </a>
              )}

              {external.instagram_id && (
                <a
                  href={`https://instagram.com/${external.instagram_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram Profile"
                  className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 hover:text-[#f5c542] flex items-center justify-center transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}

              {external.twitter_id && (
                <a
                  href={`https://x.com/${external.twitter_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X / Twitter Profile"
                  className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 hover:text-[#f5c542] flex items-center justify-center transition-all"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
