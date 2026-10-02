import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
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
import type { WatchLaterTag } from '@/services/userLibrary';
import { AddToCollectionModal } from '@/components/library/AddToCollectionModal';
import { ReviewSection } from '@/components/ReviewSection';
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

const scrollToReviews = () =>
  document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hash } = useLocation();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailer, setTrailer] = useState<VideoTrailer | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedActor, setSelectedActor] = useState<{ id: number; name: string } | null>(null);

  const { isWatched, toggleWatched, isInWatchLater, toggleWatchLater, watchLater, setWatchLaterTag } = useUserLibrary();
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  const omdbParams = useMemo(() => {
    if (!movie) return null;
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined;
    return { imdbId: movie.imdb_id, title: movie.title, year: releaseYear, type: 'movie' as const };
  }, [movie?.imdb_id, movie?.title, movie?.release_date]);

  const { data: omdbData } = useOmdb(omdbParams);

  // Load details, trailer and cast together
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const movieId = parseInt(id);

    (async () => {
      setLoading(true);
      setMovie(null);
      setTrailer(null);
      setCast([]);
      setShowTrailer(false);
      try {
        const [data, videos, credits] = await Promise.all([
          tmdb.getDetails(movieId, 'movie'),
          tmdb.getVideos(movieId, 'movie').catch(() => null),
          tmdb.getCredits(movieId, 'movie').catch(() => null),
        ]);
        if (cancelled) return;
        setMovie(data);
        setTrailer(
          videos?.results?.find(
            (v: VideoTrailer) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
          ) || null
        );
        setCast(credits?.cast?.slice(0, 14) || []);

        // Process and dedupe crew (directors first, then writers, producers, music, cinematography)
        const rawCrew: CrewMember[] = credits?.crew || [];
        const seenCrew = new Map<number, CrewMember>();
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
            const isDirA = a.job.toLowerCase().includes('director');
            const isDirB = b.job.toLowerCase().includes('director');
            if (isDirA && !isDirB) return -1;
            if (!isDirA && isDirB) return 1;
            return 0;
          })
          .slice(0, 16);

        setCrew(sortedCrew);
      } catch (error) {
        console.error('Error loading movie details:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  // Support links like /movie/123#reviews
  useEffect(() => {
    if (loading || !movie || hash !== '#reviews') return;
    const t = setTimeout(scrollToReviews, 250);
    return () => clearTimeout(t);
  }, [loading, movie?.id, hash]);

  const closeTrailer = useCallback(() => setShowTrailer(false), []);

  if (loading) {
    return <TicketLoader fullScreen size="lg" label="Preparing cinema presentation…" />;
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0608] p-4 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white font-display">Movie not found</h2>
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

  const inWatchLater = isInWatchLater(movie.id, 'movie');
  const currentWatchLaterItem = watchLater.find((l) => l.media_id === movie.id && l.media_type === 'movie');
  const watchLaterTag = currentWatchLaterItem?.tag;
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const isReleased = movie.release_date ? new Date(movie.release_date) <= new Date() : true;
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const hasGenres = movie.genres?.length > 0;

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${movie.title} — MovieGuy`,
          text: `Check out ${movie.title} on MovieGuy!`,
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
      media_id: movie.id,
      media_type: 'movie',
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
    });
  };

  const handleSelectWatchLaterTag = (tag: WatchLaterTag) => {
    if (inWatchLater && watchLaterTag === tag) {
      handleToggleWatchLater();
    } else if (inWatchLater) {
      setWatchLaterTag(movie.id, 'movie', tag);
    } else {
      toggleWatchLater(
        {
          media_id: movie.id,
          media_type: 'movie',
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
        },
        tag
      );
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
      <Navbar />

      {/* ── Cinema Projector Lighting & Curtain Gradients ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_top,_rgba(245,197,66,0.07)_0%,_rgba(201,162,75,0.03)_40%,_transparent_75%)] z-0" />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-black/90 via-[#140a0d]/40 to-transparent z-0" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-black/90 via-[#140a0d]/40 to-transparent z-0" />

      <DetailLayout
        backdropSrc={tmdb.getImageUrl(movie.backdrop_path, 'original')}
        posterSrc={tmdb.getImageUrl(movie.poster_path, 'w500')}
        posterAlt={movie.title}
        posterExtra={hasGenres && <GenreOrbitMeter genres={movie.genres} mediaType="movie" />}
        facts={
          <>
            <Pill>Film</Pill>
            {isReleased ? (
              rating && Number(rating) > 0 && <Rating value={rating} />
            ) : (
              <Pill tone="sky">Upcoming</Pill>
            )}
            {year && <Fact icon={Calendar}>{year}</Fact>}
            {runtime && <Fact icon={Clock}>{runtime}</Fact>}
          </>
        }
      >
        <div className="mb-5">
          <TitleLogo id={movie.id} type="movie" title={movie.title} size="detail" />
        </div>

        <div className="mb-6 empty:hidden">
          <RatingsDisplay
            data={omdbData}
            releaseDate={movie.release_date}
            isReleased={isReleased}
            variant="badges"
          />
        </div>

        <ActionBar
          hasTrailer={!!trailer}
          inWatchLater={inWatchLater}
          watchLaterTag={watchLaterTag}
          onSelectWatchLaterTag={handleSelectWatchLaterTag}
          isWatched={isWatched(movie.id, 'movie')}
          onToggleWatched={() =>
            toggleWatched({
              media_id: movie.id,
              media_type: 'movie',
              title: movie.title,
              poster_path: movie.poster_path,
              backdrop_path: movie.backdrop_path,
              release_year: movie.release_date ? movie.release_date.slice(0, 4) : undefined,
              vote_average: movie.vote_average,
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
            <GenreOrbitMeter genres={movie.genres} mediaType="movie" />
          </div>
        )}

        <RatingsDisplay data={omdbData} variant="awards" className="mb-6" />

        <Storyline key={movie.id} text={movie.overview} fallback="No overview available for this title." />

        {isReleased ? (
          <section className="mb-10 space-y-5">
            <MovieGuyMeter movie={movie} omdbData={omdbData} />
            <CineVibeMeter
              movie={movie}
              runtime={movie.runtime}
              imdbRating={omdbData?.imdbRating}
              omdbData={omdbData}
            />
          </section>
        ) : (
          <UpcomingCard heading="Not released yet" verb="Arrives" date={movie.release_date} />
        )}

        {/* ── Write Review & Community Reviews (Directly below Movie Meter) ── */}
        <div className="mb-12 border-t border-white/[0.06] pt-10">
          <ReviewSection mediaId={movie.id} mediaType="movie" title={movie.title} />
        </div>

        <CastRow cast={cast} onSelect={setSelectedActor} />
        <CrewRow crew={crew} onSelect={setSelectedActor} />

        <div className="mt-12 border-t border-white/[0.06] pt-10">
          <WatchProviders mediaId={movie.id} mediaType="movie" />
        </div>

        <div className="mt-12 border-t border-white/[0.06] pt-10 pb-32 md:pb-16 safe-bottom-content">
          <RecommendedShelf mediaId={movie.id} mediaType="movie" currentTitle={movie.title} />
        </div>
      </DetailLayout>

      <ActorFilmographyModal
        actorId={selectedActor?.id || null}
        actorName={selectedActor?.name || null}
        isOpen={!!selectedActor}
        onClose={() => setSelectedActor(null)}
      />

      {showTrailer && trailer && <TrailerModal trailerKey={trailer.key} onClose={closeTrailer} />}

      {movie && (
        <AddToCollectionModal
          isOpen={showCollectionModal}
          onClose={() => setShowCollectionModal(false)}
          media={{
            id: movie.id,
            title: movie.title,
            mediaType: 'movie',
            posterPath: movie.poster_path,
            releaseYear: movie.release_date ? movie.release_date.slice(0, 4) : undefined,
            voteAverage: movie.vote_average,
          }}
        />
      )}
    </div>
  );
};

export default MovieDetailPage;