// src/components/directors/DirectorHero.tsx — Director Detail Hero (simplified)
import React, { useState } from 'react';
import { MapPin, Star, Instagram, Twitter } from 'lucide-react';
import { type DirectorProfile } from '@/hooks/useDirector';
import { tmdb } from '@/services/tmdb';

interface DirectorHeroProps {
  director: DirectorProfile;
}

const FALLBACK_PORTRAIT =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=500&q=80';

const fmtYear = (d: string) => new Date(d).getFullYear();

export const DirectorHero: React.FC<DirectorHeroProps> = ({ director }) => {
  const [open, setOpen] = useState(false);

  const photoUrl = director.profile_path
    ? tmdb.getImageUrl(director.profile_path, 'h632' as any) ||
    tmdb.getImageUrl(director.profile_path, 'w500')
    : FALLBACK_PORTRAIT;

  const backdrop = director.stats.highestRatedFilm?.backdrop_path
    ? tmdb.getImageUrl(director.stats.highestRatedFilm.backdrop_path, 'original')
    : null;

  // "1963 – 2020" for the deceased, "Born 1963" otherwise
  const years = director.birthday
    ? director.deathday
      ? `${fmtYear(director.birthday)} – ${fmtYear(director.deathday)}`
      : `Born ${fmtYear(director.birthday)}`
    : null;

  const ext = director.external_ids;
  const bio = director.biography;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0a0608] border border-[#c9a24b]/20">
      {/* Backdrop: soft, dark, fades into the card */}
      {backdrop && (
        <>
          <img
            src={backdrop}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-30 blur-2xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0608] via-[#0a0608]/80 to-[#0a0608]/40" />
        </>
      )}

      <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-8 p-6 sm:p-10 lg:p-12">
        {/* Portrait — the one memorable element */}
        <img
          src={photoUrl}
          alt={director.name}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_PORTRAIT;
          }}
          className="w-44 h-60 sm:w-52 sm:h-72 lg:w-60 lg:h-80 shrink-0 rounded-2xl object-cover ring-1 ring-[#c9a24b]/40 shadow-[0_20px_60px_-10px_rgba(201,162,75,0.35)]"
        />

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="font-display font-extrabold tracking-tight text-4xl sm:text-6xl lg:text-7xl text-white leading-[0.95]">
            {director.name}
          </h1>

          {/* One quiet line: years · place · films · rating */}
          <p className="mt-4 flex flex-wrap justify-center sm:justify-start items-center gap-x-5 gap-y-1 text-sm text-white/60">
            {years && <span>{years}</span>}
            {director.place_of_birth && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#f5c542]" />
                {director.place_of_birth}
              </span>
            )}
            <span>{director.stats.totalFilms} films</span>
            {director.stats.avgRating > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[#f5c542] font-semibold">
                <Star className="w-3.5 h-3.5 fill-current stroke-none" />
                {director.stats.avgRating}
              </span>
            )}
          </p>

          {bio && (
            <div className="mt-5 max-w-2xl">
              <p
                className={`text-white/75 leading-relaxed ${open ? '' : 'line-clamp-3'
                  }`}
              >
                {bio}
              </p>
              {bio.length > 280 && (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  className="mt-2 text-sm font-semibold text-[#f5c542] hover:text-white transition-colors"
                >
                  {open ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {ext && (ext.imdb_id || ext.instagram_id || ext.twitter_id) && (
            <div className="mt-6 flex justify-center sm:justify-start gap-2">
              {ext.imdb_id && (
                <a
                  href={`https://www.imdb.com/name/${ext.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="IMDb profile"
                  className="h-9 px-3 rounded-lg bg-[#f5c518] text-black text-xs font-black flex items-center hover:brightness-110 transition"
                >
                  IMDb
                </a>
              )}
              {ext.instagram_id && (
                <a
                  href={`https://instagram.com/${ext.instagram_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram profile"
                  className="w-9 h-9 rounded-lg bg-white/10 text-white/80 hover:text-[#f5c542] hover:bg-white/15 flex items-center justify-center transition"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {ext.twitter_id && (
                <a
                  href={`https://x.com/${ext.twitter_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X profile"
                  className="w-9 h-9 rounded-lg bg-white/10 text-white/80 hover:text-[#f5c542] hover:bg-white/15 flex items-center justify-center transition"
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