import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { tmdb, type Movie } from '@/services/tmdb';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { MovieCard } from './MovieCard';

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
            <Sparkles className="w-5 h-5 text-[#f5c542] shrink-0" />
            <span>More Like </span>
            <span className="bg-gradient-to-r from-[#f5c542] via-[#f3e9d2] to-[#c9a24b] bg-clip-text text-transparent">
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
            : items.map((item) => (
                <div
                  key={item.id}
                  className={`flex-none w-[140px] sm:w-[170px] md:w-[190px] ${
                    isDragging ? 'pointer-events-none' : ''
                  }`}
                >
                  <MovieCard movie={item} type={mediaType} />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};
