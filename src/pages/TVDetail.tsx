import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Layers } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { tmdb, type MovieDetail, type CastMember, type CrewMember } from '@/services/tmdb';
import { RecommendedShelf } from '@/components/RecommendedShelf';
import { CineVibeMeter } from '@/components/CineVibeMeter';
import { MovieGuyMeter } from '@/components/MovieGuyMeter';
import { RatingsDisplay } from '@/components/RatingsDisplay';
import { ActorFilmographyModal } from '@/components/ActorFilmographyModal';
import { TitleLogo } from '@/components/TitleLogo';
import { useOmdb } from '@/services/omdb';
import { useUserLibrary } from '@/hooks/useUserLibrary';
import type { WatchLaterTag } from '@/services/userLibrary';
import { AddToCollectionModal } from '@/components/library/AddToCollectionModal';
import { ReviewSection } from '@/components/ReviewSection';
import { SeasonRatings } from '@/components/SeasonRatings';
import { WatchProviders } from '@/components/WatchProviders';
import { GenreOrbitMeter } from '@/components/GenreOrbitMeter';
import { TicketLoader } from '@/components/TicketLoader';
import {
  ActionBar,
  CastRow,
  CrewRow,
  DetailLayout,
  Fact,
  Pill,
  Rating,
  Storyline,
  TrailerModal,
  UpcomingCard,
} from '@/components/DetailParts';
import { toast } from 'sonner';

interface VideoTrailer {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
}

interface TVShowDetail extends MovieDetail {
  number_of_seasons?: number;
  number_of_episodes?: number;
  imdb_id?: string;
}

const scrollToReviews = () =>
  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });

/* Same glass system as Home / MovieDetail / Navbar. Move to a shared file when ready. */
const GlassStyles = () => (
  <style>{`
    .page-root {
      font-family: -apple-system, 'SF Pro Display', 'Inter', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .glass {
      background: linear-gradient(180deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.025) 100%);
      backdrop-filter: blur(40px) saturate(170%);
      -webkit-backdrop-filter: blur(40px) saturate(170%);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.03), 0 30px 60px -30px rgba(0,0,0,0.65);
    }
    .glass-thin {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px -8px rgba(0,0,0,0.5);
    }
    .page-root a:focus-visible, .page-root button:focus-visible {
      outline: 2px solid rgba(255,255,255,0.7);
      outline-offset: 3px;
    }
    @keyframes drift-a { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(8vw,6vh,0) scale(1.15); } }
    @keyframes drift-b { 0%,100% { transform: translate3d(0,0,0) scale(1.1); } 50% { transform: translate3d(-10vw,-4vh,0) scale(0.95); } }
    .aurora { position: fixed; border-radius: 9999px; pointer-events: none; z-index: 0; will-change: transform; }
    .aurora-a { top: 30%; left: 5%; width: 55vw; height: 45vw; background: radial-gradient(closest-side, rgba(96,130,255,0.16), transparent); filter: blur(70px); animation: drift-a 40s ease-in-out infinite; }
    .aurora-b { bottom: -10%; right: -5%; width: 50vw; height: 50vw; background: radial-gradient(closest-side, rgba(190,120,255,0.12), transparent); filter: blur(80px); animation: drift-b 48s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .aurora { animation: none !important; } }
  `}</style>
);

/* One glass shelf per content section (replaces the hairline dividers) */
const Shelf: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`glass rounded-[2rem] p-5 sm:p-7 ${className}`}>{children}</section>
);

const TVDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hash } = useLocation();

  const [show, setShow] = useState<TVShowDetail | null>(null);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailer, setTrailer] = useState<VideoTrailer | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedActor, setSelectedActor] = useState<{ id: number; name: string } | null>(null);

  const { isWatched, toggleWatched, isInWatchLater, toggleWatchLater, watchLater, setWatchLaterTag } = useUserLibrary();
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const omdbParams = useMemo(() => {
    if (!show) return null;
    const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : undefined;
    return {
      imdbId: imdbId || show.imdb_id,
      title: show.name,
      year,
      type: 'series' as const,
    };
  }, [show?.name, show?.first_air_date, show?.imdb_id, imdbId]);

  const { data: omdbData } = useOmdb(omdbParams);

  // Load details, trailer, cast and IMDb id together
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const showId = parseInt(id);

    (async () => {
      setLoading(true);
      setShow(null);
      setImdbId(null);
      setTrailer(null);
      setCast([]);
      setShowTrailer(false);
      try {
        const [data, videos, credits, ext] = await Promise.all([
          tmdb.getDetails(showId, 'tv'),
          tmdb.getVideos(showId, 'tv').catch(() => null),
          tmdb.getCredits(showId, 'tv').catch(() => null),
          tmdb.getExternalIds(showId, 'tv').catch(() => null),
        ]);
        if (cancelled) return;
        setShow(data as TVShowDetail);
        setImdbId(ext?.imdb_id || null);
        setTrailer(
          videos?.results?.find(
            (v: VideoTrailer) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
          ) || null
        );
        setCast(credits?.cast?.slice(0, 14) || []);

        // Process creators and crew
        const rawCrew: CrewMember[] = credits?.crew || [];
        const seenCrew = new Map<number, CrewMember>();

        // Add TV creators first
        const tvData = data as any;
        if (tvData?.created_by && Array.isArray(tvData.created_by)) {
          for (const creator of tvData.created_by) {
            seenCrew.set(creator.id, {
              id: creator.id,
              name: creator.name,
              job: 'Creator',
              department: 'Writing',
              profile_path: creator.profile_path || null,
            });
          }
        }

        // Add other key crew
        for (const c of rawCrew) {
          if (!c.id || !c.name || !c.job) continue;
          const existing = seenCrew.get(c.id);
          if (existing) {
            if (!existing.job.includes(c.job)) {
              existing.job = `${existing.job}, ${c.job}`;
            }
          } else {
            seenCrew.set(c.id, { ...c });
          }
        }

        const sortedCrew = Array.from(seenCrew.values())
          .sort((a, b) => {
            const isPriorityA =
              a.job.toLowerCase().includes('creator') ||
              a.job.toLowerCase().includes('director');
            const isPriorityB =
              b.job.toLowerCase().includes('creator') ||
              b.job.toLowerCase().includes('director');
            if (isPriorityA && !isPriorityB) return -1;
            if (!isPriorityA && isPriorityB) return 1;
            return 0;
          })
          .slice(0, 16);

        setCrew(sortedCrew);
      } catch (error) {
        console.error('Error loading show details:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  // Support links like /tv/123#reviews
  useEffect(() => {
    if (loading || !show || hash !== '#reviews') return;
    const t = setTimeout(scrollToReviews, 250);
    return () => clearTimeout(t);
  }, [loading, show?.id, hash]);

  const closeTrailer = useCallback(() => setShowTrailer(false), []);

  if (loading) {
    return <TicketLoader fullScreen size="lg" label="Preparing cinema presentation…" />;
  }

  if (!show) {
    return (
      <div className="page-root relative flex min-h-screen items-center justify-center bg-[#090c12] p-4 overflow-hidden">
        <GlassStyles />
        <div className="aurora aurora-a" />
        <div className="glass relative z-10 max-w-sm rounded-[2rem] p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-[-0.022em] text-white">Show not found</h2>
          <p className="mt-2 text-sm text-white/50">It may have been removed, or the link is wrong.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 h-11 rounded-full bg-white px-7 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const inWatchLater = isInWatchLater(show.id, 'tv');
  const currentWatchLaterItem = watchLater.find((l) => Number(l.media_id) === Number(show.id) && l.media_type === 'tv');
  const watchLaterTag = currentWatchLaterItem?.tag;
  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : null;
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null;
  const isReleased = show.first_air_date ? new Date(show.first_air_date) <= new Date() : true;
  const seasons = show.number_of_seasons;
  const episodes = show.number_of_episodes;
  const hasGenres = (show.genres?.length ?? 0) > 0;
  const displayTitle = show.name || show.title || '';
  const hasSeasons = !!show.seasons && show.seasons.filter((s) => s.season_number > 0).length > 0;

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${displayTitle} — MovieGuy`,
          text: `Check out ${displayTitle} on MovieGuy!`,
          url,
        });
        return;
      } catch {
        // Share dismissed
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  const handleToggleWatchLater = () => {
    toggleWatchLater({
      media_id: show.id,
      media_type: 'tv',
      title: displayTitle,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      release_date: show.first_air_date,
      vote_average: show.vote_average,
    });
  };

  const handleSelectWatchLaterTag = (tag: WatchLaterTag) => {
    if (inWatchLater && watchLaterTag === tag) {
      handleToggleWatchLater();
    } else if (inWatchLater) {
      setWatchLaterTag(show.id, 'tv', tag);
    } else {
      toggleWatchLater(
        {
          media_id: show.id,
          media_type: 'tv',
          title: displayTitle,
          poster_path: show.poster_path,
          backdrop_path: show.backdrop_path,
          release_date: show.first_air_date,
          vote_average: show.vote_average,
        },
        tag
      );
    }
  };

  return (
    <div className="page-root relative min-h-screen overflow-x-hidden bg-[#090c12] text-white selection:bg-white selection:text-black">
      <GlassStyles />

      {/* Slow ambient light for the glass to refract (replaces the edge vignettes) */}
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />

      <Navbar />

      <DetailLayout
        backdropSrc={tmdb.getImageUrl(show.backdrop_path, 'original')}
        posterSrc={tmdb.getImageUrl(show.poster_path, 'w500')}
        posterAlt={displayTitle}
        posterExtra={hasGenres && <GenreOrbitMeter genres={show.genres} mediaType="tv" />}
        facts={
          <>
            <Pill>Series</Pill>
            {isReleased ? (
              rating && Number(rating) > 0 && <Rating value={rating} />
            ) : (
              <Pill tone="sky">Upcoming</Pill>
            )}
            {year && <Fact icon={Calendar}>{year}</Fact>}
            {seasons ? (
              <Fact icon={Layers}>
                {seasons} {seasons > 1 ? 'seasons' : 'season'}
                {episodes ? `, ${episodes} episodes` : ''}
              </Fact>
            ) : null}
          </>
        }
      >
        <div className="mb-5">
          <TitleLogo id={show.id} type="tv" title={show.name} size="detail" />
        </div>

        <div className="mb-6 empty:hidden">
          <RatingsDisplay
            data={omdbData}
            releaseDate={show.first_air_date}
            isReleased={isReleased}
            variant="badges"
          />
        </div>

        <ActionBar
          hasTrailer={!!trailer}
          inWatchLater={inWatchLater}
          watchLaterTag={watchLaterTag}
          onSelectWatchLaterTag={handleSelectWatchLaterTag}
          isWatched={isWatched(show.id, 'tv')}
          onToggleWatched={() =>
            toggleWatched({
              media_id: show.id,
              media_type: 'tv',
              title: show.name,
              poster_path: show.poster_path,
              backdrop_path: show.backdrop_path,
              release_year: show.first_air_date ? show.first_air_date.slice(0, 4) : undefined,
              vote_average: show.vote_average,
            })
          }
          onAddToCollections={() => setShowCollectionModal(true)}
          onReview={scrollToReviews}
          onTrailer={() => setShowTrailer(true)}
          onToggleWatchLater={handleToggleWatchLater}
          onShare={handleShare}
        />

        {/* Genre dial: below the actions on mobile, under the poster on desktop */}
        {hasGenres && (
          <div className="-mt-4 mb-8 md:hidden">
            <GenreOrbitMeter genres={show.genres} mediaType="tv" />
          </div>
        )}

        <RatingsDisplay data={omdbData} variant="awards" className="mb-6" />

        <Storyline key={show.id} text={show.overview} fallback="No overview available for this series." />

        {isReleased ? (
          <section className="mb-10 space-y-5">
            <MovieGuyMeter movie={show} omdbData={omdbData} />
            <CineVibeMeter movie={show} imdbRating={omdbData?.imdbRating} omdbData={omdbData} />
          </section>
        ) : (
          <UpcomingCard heading="Not aired yet" verb="Premieres" date={show.first_air_date} />
        )}

        {/* Content shelves: each section sits on its own glass panel */}
        <div className="space-y-6 sm:space-y-8">
          <Shelf>
            <ReviewSection mediaId={show.id} mediaType="tv" title={displayTitle} />
          </Shelf>

          {(cast.length > 0 || crew.length > 0) && (
            <Shelf className="space-y-8">
              <CastRow cast={cast} onSelect={setSelectedActor} />
              <CrewRow crew={crew} onSelect={setSelectedActor} />
            </Shelf>
          )}

          {hasSeasons && (
            <Shelf>
              <SeasonRatings
                showId={show.id}
                showName={displayTitle}
                imdbId={imdbId}
                showOmdbData={omdbData}
                seasons={show.seasons}
              />
            </Shelf>
          )}

          <Shelf>
            <WatchProviders mediaId={show.id} mediaType="tv" />
          </Shelf>

          <Shelf className="mb-32 md:mb-16 safe-bottom-content">
            <RecommendedShelf mediaId={show.id} mediaType="tv" currentTitle={show.name} />
          </Shelf>
        </div>
      </DetailLayout>

      <ActorFilmographyModal
        actorId={selectedActor?.id || null}
        actorName={selectedActor?.name || null}
        isOpen={!!selectedActor}
        onClose={() => setSelectedActor(null)}
      />

      {showTrailer && trailer && <TrailerModal trailerKey={trailer.key} onClose={closeTrailer} />}

      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        media={{
          id: show.id,
          title: show.name,
          mediaType: 'tv',
          posterPath: show.poster_path,
          releaseYear: show.first_air_date ? show.first_air_date.slice(0, 4) : undefined,
          voteAverage: show.vote_average,
        }}
      />
    </div>
  );
};

export default TVDetailPage;