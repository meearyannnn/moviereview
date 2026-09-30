// components/ActorFilmographyModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, MapPin, Film, Star } from 'lucide-react';
import { tmdb } from '@/services/tmdb';
import { tvmaze } from '@/services/tvmaze';

interface ActorCredit {
  id: number;
  title: string;
  character: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
  media_type: 'movie' | 'tv';
}

interface ActorProfile {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
}

interface ActorFilmographyModalProps {
  actorId: number | null;
  actorName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type Filter = 'all' | 'movie' | 'tv';

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ActorFilmographyModal: React.FC<ActorFilmographyModalProps> = ({
  actorId,
  actorName,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ActorProfile | null>(null);
  const [credits, setCredits] = useState<ActorCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [bioOpen, setBioOpen] = useState(false);

  // Load actor
  useEffect(() => {
    if (!isOpen || (!actorId && !actorName)) return;

    let isMounted = true;
    setLoading(true);
    setProfile(null);
    setCredits([]);
    setFilter('all');
    setBioOpen(false);

    const loadActor = async () => {
      try {
        let currentActorId = actorId;

        if (!currentActorId && actorName) {
          const searchRes = await tmdb.search(actorName, 'person');
          if (searchRes.results?.[0]) currentActorId = searchRes.results[0].id;
        }

        if (currentActorId) {
          const [details, creditsRes] = await Promise.all([
            tmdb.getPersonDetails(currentActorId).catch(() => null),
            tmdb.getPersonCombinedCredits(currentActorId).catch(() => null),
          ]);

          if (isMounted && details) setProfile(details);

          if (isMounted && creditsRes?.cast) {
            const seen = new Set<string>();
            const clean: ActorCredit[] = creditsRes.cast
              .filter((c: any) => c.poster_path && (c.title || c.name))
              .map((c: any) => ({
                id: c.id,
                title: c.title || c.name,
                character: c.character || '',
                poster_path: c.poster_path,
                release_date: c.release_date || c.first_air_date,
                vote_average: c.vote_average,
                media_type: c.media_type === 'tv' ? 'tv' : 'movie',
              }))
              // Remove duplicates (same title can appear for several episodes/roles)
              .filter((c: ActorCredit) => {
                const key = `${c.media_type}_${c.id}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              })
              // Newest first, undated last
              .sort((a: ActorCredit, b: ActorCredit) => {
                const da = a.release_date ? new Date(a.release_date).getTime() : 0;
                const db = b.release_date ? new Date(b.release_date).getTime() : 0;
                return db - da;
              });

            setCredits(clean);
          }
        } else if (actorName) {
          const tvmazeData = await tvmaze.getFilmographyByName(actorName);
          if (isMounted && tvmazeData?.person) {
            setProfile({
              id: tvmazeData.person.id,
              name: tvmazeData.person.name,
              biography: '',
              birthday: tvmazeData.person.birthday,
              place_of_birth: tvmazeData.person.country?.name,
              profile_path: tvmazeData.person.image?.medium,
            });
          }
        }
      } catch (err) {
        console.error('Error loading actor filmography:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadActor();
    return () => {
      isMounted = false;
    };
  }, [actorId, actorName, isOpen]);

  // Escape to close + lock page scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const counts = useMemo(
    () => ({
      all: credits.length,
      movie: credits.filter((c) => c.media_type === 'movie').length,
      tv: credits.filter((c) => c.media_type === 'tv').length,
    }),
    [credits]
  );

  if (!isOpen) return null;

  const filteredCredits = credits.filter((c) => filter === 'all' || c.media_type === filter);
  const displayName = profile?.name || actorName || 'Actor';
  const photo = profile?.profile_path
    ? profile.profile_path.startsWith('http')
      ? profile.profile_path
      : `https://image.tmdb.org/t/p/w300${profile.profile_path}`
    : null;
  const born = formatDate(profile?.birthday);
  const bio = profile?.biography?.trim();
  const bioLong = !!bio && bio.length > 220;

  const handleSelectWork = (credit: ActorCredit) => {
    onClose();
    navigate(`/${credit.media_type}/${credit.id}`);
  };

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'movie', label: 'Movies' },
    { key: 'tv', label: 'TV shows' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${displayName} filmography`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#0c0f17] shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:max-h-[88dvh] sm:rounded-3xl sm:zoom-in-95"
      >
        {/* Grab handle (mobile) */}
        <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <button
          onClick={onClose}
          autoFocus
          aria-label="Close"
          className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition-colors hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </button>

        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="h-11 w-11 animate-spin rounded-full border-2 border-white/10 border-t-red-500" />
          </div>
        ) : (
          <div className="overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            {/* Profile */}
            <div className="flex gap-4 px-4 pb-4 pt-4 sm:gap-6 sm:px-8 sm:pb-5 sm:pt-8">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-xl sm:h-28 sm:w-28">
                {photo ? (
                  <img src={photo} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white/50">{initials(displayName)}</span>
                )}
              </div>

              <div className="min-w-0 flex-1 pr-10">
                <h2 className="font-display text-xl font-black leading-tight tracking-tight text-white sm:text-3xl">
                  {displayName}
                </h2>
                {profile?.known_for_department && (
                  <p className="mt-0.5 text-sm text-red-400">{profile.known_for_department}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                  {born && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-white/35" aria-hidden="true" />
                      Born {born}
                    </span>
                  )}
                  {profile?.place_of_birth && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden="true" />
                      <span className="truncate">{profile.place_of_birth}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Film className="h-3.5 w-3.5 text-white/35" aria-hidden="true" />
                    {counts.all} titles
                  </span>
                </div>
              </div>
            </div>

            {/* Biography */}
            {bio && (
              <div className="px-4 pb-5 sm:px-8">
                <p
                  className={`max-w-2xl text-sm leading-relaxed text-white/70 ${bioLong && !bioOpen ? 'line-clamp-3' : ''
                    }`}
                >
                  {bio}
                </p>
                {bioLong && (
                  <button
                    onClick={() => setBioOpen((o) => !o)}
                    aria-expanded={bioOpen}
                    className="mt-1.5 text-sm font-semibold text-red-400 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
                  >
                    {bioOpen ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Tabs (stay visible while scrolling the grid) */}
            <div className="sticky top-0 z-10 border-y border-[#c9a24b]/20 bg-[#140a0d]/95 px-4 py-3 backdrop-blur sm:px-8">
              <div role="tablist" aria-label="Filter credits" className="grid grid-cols-3 gap-1 rounded-xl border border-[#c9a24b]/20 bg-black/40 p-1">
                {tabs.map(({ key, label }) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => setFilter(key)}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 ${filter === key ? 'bg-[#f5c542] text-[#1c120c] font-black shadow-sm' : 'text-white/60 hover:text-white'
                      }`}
                  >
                    {label}
                    <span className={`text-xs ${filter === key ? 'text-[#1c120c]/70 font-bold' : 'text-white/35'}`}>
                      {counts[key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Credits */}
            <div className="px-4 py-5 sm:px-8 sm:py-6">
              {filteredCredits.length === 0 ? (
                <p className="py-10 text-center text-sm text-white/50">
                  {credits.length === 0
                    ? 'No credits with posters were found for this person.'
                    : 'No credits in this category.'}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5">
                  {filteredCredits.map((credit) => {
                    const year = credit.release_date?.slice(0, 4);
                    return (
                      <button
                        key={`${credit.media_type}_${credit.id}`}
                        onClick={() => handleSelectWork(credit)}
                        className="group min-w-0 text-left focus-visible:outline-none"
                      >
                        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 transition-colors group-hover:border-[#f5c542]/60 group-focus-visible:ring-2 group-focus-visible:ring-[#f5c542]/70">
                          <img
                            src={`https://image.tmdb.org/t/p/w300${credit.poster_path}`}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {filter === 'all' && credit.media_type === 'tv' && (
                            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                              TV
                            </span>
                          )}
                          {credit.vote_average != null && credit.vote_average > 0 && (
                            <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                              {credit.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-2 line-clamp-1 text-xs font-semibold text-white transition-colors group-hover:text-red-400">
                          {credit.title}
                        </h4>
                        {credit.character && (
                          <p className="line-clamp-1 text-[11px] text-white/50">as {credit.character}</p>
                        )}
                        {year && <p className="text-[11px] text-white/35">{year}</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};