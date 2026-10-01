// src/pages/community/ReviewsPage.tsx — Grouped movie review feed with live Supabase & TMDB data
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Film,
  ThumbsUp,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, Spinner } from '@/components/community/communityUtils';
import { communityService } from '@/services/community';
import { tmdb, type Movie } from '@/services/tmdb';

interface ReviewItem {
  id: string;
  username: string;
  avatarUrl?: string;
  date: string;
  verdict?: string;
  verdictColor?: string;
  rating?: number;
  content: string;
  likesCount?: number;
}

interface MovieReviewGroup {
  movieId: number | string;
  movieTitle: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  reviews: ReviewItem[];
}

export default function ReviewsPage() {
  const [groups, setGroups] = useState<MovieReviewGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // References for horizontal scrolling
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoading(true);
      try {
        const groupsMap: { [key: string]: MovieReviewGroup } = {};

        // 1. Fetch community reviews from Supabase
        const dbPosts = await communityService.getGlobalFeed({ category: 'review', limit: 20 });
        for (const post of dbPosts) {
          if (!post.media_id || !post.media_title) continue;
          const key = `movie-${post.media_id}`;
          if (!groupsMap[key]) {
            groupsMap[key] = {
              movieId: post.media_id,
              movieTitle: post.media_title,
              posterPath: post.media_poster
                ? tmdb.getImageUrl(post.media_poster, 'w342')
                : '/placeholder.svg',
              mediaType: post.media_type || 'movie',
              reviews: [],
            };
          }
          groupsMap[key].reviews.push({
            id: post.id,
            username: post.username,
            avatarUrl: post.avatar_url,
            date: new Date(post.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            }),
            content: post.content,
            likesCount: post.likes_count,
            verdict: 'Community Review',
            verdictColor: 'bg-[#f5c542]/20 text-[#f5c542] border border-[#f5c542]/40',
          });
        }

        // 2. Fetch live reviews from TMDB for trending movies to ensure rich, real data
        const trending = await tmdb.getTrending('movie', 'week');
        const candidateMovies: Movie[] = (trending.results || []).slice(0, 8);

        await Promise.allSettled(
          candidateMovies.map(async (movie) => {
            const key = `movie-${movie.id}`;
            try {
              const res = await tmdb.getReviews(movie.id, 'movie');
              const tmdbReviews = res.results || [];
              if (tmdbReviews.length > 0) {
                if (!groupsMap[key]) {
                  groupsMap[key] = {
                    movieId: movie.id,
                    movieTitle: movie.title,
                    posterPath: tmdb.getImageUrl(movie.poster_path, 'w342'),
                    mediaType: 'movie',
                    reviews: [],
                  };
                }

                for (const tr of tmdbReviews.slice(0, 4)) {
                  const rating = tr.author_details?.rating;
                  let verdict = 'Must Watch';
                  let verdictColor = 'bg-[#f5c542]/20 text-[#f5c542] border border-[#f5c542]/40';
                  if (rating) {
                    if (rating >= 8) {
                      verdict = 'Absolute Cinema';
                      verdictColor = 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
                    } else if (rating >= 6) {
                      verdict = 'Go For It';
                      verdictColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
                    } else {
                      verdict = 'Mixed Take';
                      verdictColor = 'bg-white/10 text-white/70 border border-white/20';
                    }
                  }

                  // Clean TMDB markdown content
                  const cleanText = tr.content
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                    .replace(/[*_#`]/g, '')
                    .trim();

                  groupsMap[key].reviews.push({
                    id: tr.id,
                    username: tr.author_details?.username || tr.author || 'Cinephile',
                    avatarUrl: tr.author_details?.avatar_path
                      ? tmdb.getImageUrl(tr.author_details.avatar_path, 'w185')
                      : undefined,
                    date: new Date(tr.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    }),
                    verdict,
                    verdictColor,
                    rating,
                    content: cleanText,
                    likesCount: rating ? rating * 4 : undefined,
                  });
                }
              }
            } catch (err) {
              console.warn('Error fetching TMDB reviews for', movie.id, err);
            }
          })
        );

        if (!cancelled) {
          const list = Object.values(groupsMap).filter((g) => g.reviews.length > 0);
          setGroups(list);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollLeft = (key: string) => {
    const el = scrollRefs.current[key];
    if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = (key: string) => {
    const el = scrollRefs.current[key];
    if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
  };

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/40">
            <Spinner className="h-8 w-8 text-[#f5c542] mb-3 animate-spin" />
            <p className="text-sm font-mono tracking-wide">Syncing authentic cinephile reviews…</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-[#140a0e] p-12 text-center text-white/50">
            <Film className="w-10 h-10 mx-auto mb-3 text-[#c9a24b]/40" />
            <p className="text-base font-medium text-white/80">No reviews published yet</p>
            <p className="text-xs text-white/40 mt-1">Be the first to share your verdict on a film!</p>
          </div>
        ) : (
          groups.map((group) => {
            const groupKey = `${group.mediaType}-${group.movieId}`;

            return (
              <section key={groupKey} className="space-y-4">
                {/* Header with Title + "< >" Navigation Arrows */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <h2 className="text-lg sm:text-2xl font-display font-extrabold text-white truncate">
                      {group.movieTitle}
                    </h2>
                    <p className="text-xs text-white/50 font-mono mt-0.5">
                      Recent community &amp; audience verdicts
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => scrollLeft(groupKey)}
                      className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                      title="Previous reviews"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => scrollRight(groupKey)}
                      className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                      title="Next reviews"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Row Layout: Movie Poster (Left) + Horizontally Scrollable Reviews (Right) */}
                <div className="flex flex-col md:flex-row gap-5 items-stretch">
                  {/* Left: Movie Poster */}
                  <Link
                    to={`/${group.mediaType}/${group.movieId}`}
                    className="w-full md:w-56 h-64 sm:h-80 md:h-96 shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#c9a24b]/20 bg-[#140a0e] shadow-xl group relative block"
                  >
                    <img
                      src={group.posterPath}
                      alt={group.movieTitle}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      <p className="text-xs font-mono font-semibold text-white/90 group-hover:text-[#f5c542] transition-colors">
                        View Movie Details ↗
                      </p>
                    </div>
                  </Link>

                  {/* Right: Scrollable Review Cards */}
                  <div
                    ref={(el) => {
                      scrollRefs.current[groupKey] = el;
                    }}
                    className="flex-1 flex gap-4 overflow-x-auto pb-2 scrollbar-none custom-scrollbar touch-pan-x overscroll-x-contain"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {group.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="w-72 sm:w-80 shrink-0 rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#140a0e] p-5 sm:p-6 flex flex-col justify-between shadow-xl hover:border-white/[0.16] transition-all"
                      >
                        {/* Review Card Header */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar
                                src={rev.avatarUrl}
                                name={rev.username}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-white/90 truncate">
                                  {rev.username}
                                </p>
                                <p className="text-[10px] font-mono text-white/40">
                                  {rev.date}
                                </p>
                              </div>
                            </div>

                            {/* Verdict Pill */}
                            {rev.verdict && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide shrink-0 ${rev.verdictColor}`}
                              >
                                {rev.verdict}
                              </span>
                            )}
                          </div>

                          {/* Review Content */}
                          <p className="text-xs sm:text-sm leading-relaxed text-white/75 line-clamp-6">
                            "{rev.content}"
                          </p>
                        </div>

                        {/* Review Card Footer: Rating + Likes */}
                        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40 font-mono mt-4">
                          <div className="flex items-center gap-1.5">
                            {rev.rating ? (
                              <span className="flex items-center gap-1 text-[#f5c542] font-bold">
                                <Star className="w-3.5 h-3.5 fill-[#f5c542]" />
                                {rev.rating}/10
                              </span>
                            ) : (
                              <span className="text-white/30 text-[11px]">Audience Score</span>
                            )}
                          </div>

                          {rev.likesCount !== undefined && (
                            <div className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{rev.likesCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </CommunityLayout>
  );
}
