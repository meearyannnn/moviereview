import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { useWatchlist } from '@/hooks/useWatchlist';
import { useUserLibrary } from '@/hooks/useUserLibrary';
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

  const { isWatched, toggleWatched, isInWatchLater, toggleWatchLater } = useUserLibrary();
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0608] p-4 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white font-display">Show not found</h2>
        <p className="mb-6 text-sm text-white/50">It may have been removed, or the link is wrong.</p>
        <button
          onClick={() => navigate('/')}
          className="flex h-11 items-center rounded-full bg-[#f5c542] px-6 text-sm font-black text-[#1c120c] transition-colors hover:bg-[#c9a24b] shadow-lg shadow-[#f5c542]/25"
        >
          Return home
        </button>
      </div>
    );
  }

  const inWatchLater = isInWatchLater(show.id, 'tv');
  const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : null;
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null;
  const isReleased = show.first_air_date ? new Date(show.first_air_date) <= new Date() : true;
  const seasons = show.number_of_seasons;
  const episodes = show.number_of_episodes;
  const hasGenres = show.genres?.length > 0;
  const displayTitle = show.name || show.title || '';

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0608] text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
      <Navbar />

      {/* ── Cinema Projector Lighting & Curtain Gradients ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_top,_rgba(245,197,66,0.07)_0%,_rgba(201,162,75,0.03)_40%,_transparent_75%)] z-0" />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-black/90 via-[#140a0d]/40 to-transparent z-0" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-black/90 via-[#140a0d]/40 to-transparent z-0" />

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

        {/* ── Write Review & Community Reviews (Directly below TV Meter) ── */}
        <div className="mb-12 border-t border-white/[0.06] pt-10">
          <ReviewSection mediaId={show.id} mediaType="tv" title={displayTitle} />
        </div>

        <CastRow cast={cast} onSelect={setSelectedActor} />
        <CrewRow crew={crew} onSelect={setSelectedActor} />

        {show.seasons && show.seasons.filter((s) => s.season_number > 0).length > 0 && (
          <SeasonRatings
            showId={show.id}
            showName={displayTitle}
            imdbId={imdbId}
            showOmdbData={omdbData}
            seasons={show.seasons}
          />
        )}

        <div className="mt-8 border-t border-white/[0.06] pt-10">
          <WatchProviders mediaId={show.id} mediaType="tv" />
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-10 pb-32 md:pb-16 safe-bottom-content">
          <RecommendedShelf mediaId={show.id} mediaType="tv" currentTitle={show.name} />
        </div>
      </DetailLayout>

      <ActorFilmographyModal
        actorId={selectedActor?.id || null}
        actorName={selectedActor?.name || null}
        isOpen={!!selectedActor}
        onClose={() => setSelectedActor(null)}
      />

      {showTrailer && trailer && <TrailerModal trailerKey={trailer.key} onClose={closeTrailer} />}

      {show && (
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
      )}
    </div>
  );
};

export default TVDetailPage;