import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Layers } from 'lucide-react';
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
import { SeasonRatings } from '@/components/SeasonRatings';
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
  const [selectedActor, setSelectedActor] = useState<{ id: number; name: string } | null>(null);

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

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
        setCast(credits?.cast?.slice(0, 12) || []);
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0608]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#c9a24b]/20 border-t-[#f5c542]" />
      </div>
    );
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

  const inWatchlist = isInWatchlist(show.id);
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

  const handleToggleWatchlist = () => {
    const added = toggleWatchlist({
      id: show.id,
      title: displayTitle,
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      vote_average: show.vote_average,
      release_date: show.first_air_date,
      media_type: 'tv',
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
          inWatchlist={inWatchlist}
          onReview={scrollToReviews}
          onTrailer={() => setShowTrailer(true)}
          onToggleWatchlist={handleToggleWatchlist}
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

        <CastRow cast={cast} onSelect={setSelectedActor} />

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
          <ReviewSection mediaId={show.id} mediaType="tv" title={displayTitle} />
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
    </div>
  );
};

export default TVDetailPage;