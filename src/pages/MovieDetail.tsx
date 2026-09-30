import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { tmdb, type MovieDetail, type CastMember } from '@/services/tmdb';
import { RecommendedShelf } from '@/components/RecommendedShelf';
import { CineVibeMeter } from '@/components/CineVibeMeter';
import { MovieGuyMeter } from '@/components/MovieGuyMeter';
import { RatingsDisplay } from '@/components/RatingsDisplay';
import { ActorFilmographyModal } from '@/components/ActorFilmographyModal';
import { TitleLogo } from '@/components/TitleLogo';
import { useOmdb } from '@/services/omdb';
import { useWatchlist } from '@/hooks/useWatchlist';
import { ReviewSection } from '@/components/ReviewSection';
import { WatchProviders } from '@/components/WatchProviders';
import { GenreOrbitMeter } from '@/components/GenreOrbitMeter';
import {
  ActionBar,
  CastRow,
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
  const [selectedActor, setSelectedActor] = useState<{ id: number; name: string } | null>(null);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

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
        setCast(credits?.cast?.slice(0, 12) || []);
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0608]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#c9a24b]/20 border-t-[#f5c542]" />
      </div>
    );
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

  const inWatchlist = isInWatchlist(movie.id);
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

  const handleToggleWatchlist = () => {
    const added = toggleWatchlist({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      media_type: 'movie',
    });
    if (added) toast.success('Added to your watchlist');
    else toast.info('Removed from watchlist');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0608] text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
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
          inWatchlist={inWatchlist}
          onReview={scrollToReviews}
          onTrailer={() => setShowTrailer(true)}
          onToggleWatchlist={handleToggleWatchlist}
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

        <CastRow cast={cast} onSelect={setSelectedActor} />

        <div className="mt-12 border-t border-white/[0.06] pt-10">
          <WatchProviders mediaId={movie.id} mediaType="movie" />
          <ReviewSection mediaId={movie.id} mediaType="movie" title={movie.title} />
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
    </div>
  );
};

export default MovieDetailPage;