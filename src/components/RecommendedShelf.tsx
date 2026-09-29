import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

interface RecommendedShelfProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  currentTitle?: string;
  onSelectMedia?: (id: number, type: 'movie' | 'tv') => void;
}

export const RecommendedShelf = ({
  mediaId,
  mediaType,
  currentTitle,
  onSelectMedia,
}: RecommendedShelfProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    containerRef,
    canScrollLeft,
    canScrollRight,
    isDragging,
    scrollToDirection,
    updateScrollState,
    handlers,
  } = useSmoothScroll<HTMLDivElement>({
    enableWheel: true,
    enableDrag: true,
    scrollStepRatio: 0.75,
  });

  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const res = await tmdb.getRecommendations(mediaId, mediaType);
        let list = res.results || [];

        if (list.length < 5) {
          const fallbackRes = await tmdb.getPopular(mediaType);
          const fallbackList = (fallbackRes.results || []).filter(
            (item: Movie) => item.id !== mediaId
          );
          list = [...list, ...fallbackList];
        }

        if (isMounted) {
          setItems(list.filter((item: Movie) => item.id !== mediaId).slice(0, 18));
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (mediaId) {
      loadRecommendations();
    }
    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType]);

  useEffect(() => {
    updateScrollState();
  }, [items, updateScrollState]);

  const handleCardClick = (id: number) => {
    if (onSelectMedia) {
      onSelectMedia(id, mediaType);
    } else {
      navigate(`/${mediaType}/${id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!loading && items.length === 0) return null;

  return (
    <div className="w-full max-w-full min-w-0 my-8">
      {/* Header with Arrow Controls */}
      <div className="flex items-center justify-between mb-4 px-1 min-w-0">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-xl md:text-2xl text-white tracking-tight flex items-center gap-2 truncate">
            <Sparkles className="w-5 h-5 text-red-500 shrink-0" />
            <span>More Like </span>
            <span className="bg-gradient-to-r from-red-500 via-white to-red-400 bg-clip-text text-transparent">
              This
            </span>
          </h3>
          <p className="text-xs text-white/50 mt-1 truncate">
            {currentTitle ? `Hand-picked titles recommended based on ${currentTitle}` : 'Top-rated titles recommended for you'}
          </p>
        </div>

        {/* Header Arrow Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => scrollToDirection('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToDirection('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white/70 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row container */}
      <div className="relative group/row w-full max-w-full min-w-0">
        <div
          ref={containerRef}
          {...handlers}
          className={`flex gap-3.5 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide touch-pan-x pb-3 pt-0.5 px-0.5 w-full max-w-full min-w-0 select-none overscroll-x-contain ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[140px] sm:w-[170px] md:w-[190px] aspect-[2/3] rounded-xl bg-white/5 animate-pulse border border-white/10"
                />
              ))
            : items.map((item, index) => {
                const title = item.title || item.name || 'Untitled';
                const date = item.release_date || item.first_air_date;
                const year = date ? new Date(date).getFullYear() : null;
                const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                const matchScore = 90 + Math.floor(((item.vote_average || 7) / 10) * 9) + (index % 3);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item.id)}
                    className={`group flex-none w-[140px] sm:w-[170px] md:w-[190px] cursor-pointer ${
                      isDragging ? 'pointer-events-none' : ''
                    }`}
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/[0.06] group-hover:border-white/25 shadow-lg bg-neutral-900 transition-colors duration-200">
                      <img
                        src={tmdb.getImageUrl(item.poster_path, 'w500')}
                        alt={title}
                        draggable={false}
                        className="w-full h-full object-cover pointer-events-none select-none"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-md backdrop-blur-md">
                          {matchScore}%
                        </span>
                        {rating ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/75 text-white border border-white/10 backdrop-blur-sm flex items-center gap-0.5 font-display">
                            <Star className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                            {rating}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 px-0.5">
                      <h4 className="line-clamp-1 font-display font-bold text-xs sm:text-sm text-white/85 group-hover:text-white transition-colors">
                        {title}
                      </h4>
                      <p className="mt-0.5 flex items-center justify-between text-[11px] text-white/35 font-sans">
                        <span>{year ? year : 'TBA'}</span>
                        <span>{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
