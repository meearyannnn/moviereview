// src/pages/community/ReviewsPage.tsx — Matches Screenshot 2 with grouped movie rows & horizontal review cards
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Film,
  MessageCircle,
  ThumbsUp,
  Share2,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, Spinner } from '@/components/community/communityUtils';
import { communityService, type CommunityPost } from '@/services/community';
import { useAuth } from '@/contexts/AuthContext';

interface MovieReviewGroup {
  movieId: number | string;
  movieTitle: string;
  posterPath: string;
  mediaType: 'movie' | 'tv';
  reviews: Array<{
    id: string;
    username: string;
    avatarUrl?: string;
    date: string;
    verdict: string;
    verdictColor: string;
    content: string;
    likesCount?: number;
  }>;
}

// Curated showcase groups matching Screenshot 2
const SHOWCASE_GROUPS: MovieReviewGroup[] = [
  {
    movieId: 1079091,
    movieTitle: 'The Life of Chuck',
    posterPath: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&auto=format&fit=crop&q=80',
    mediaType: 'movie',
    reviews: [
      {
        id: 'rev-chuck-1',
        username: 'nikhil_moc',
        date: 'yesterday',
        verdict: 'Go For It',
        verdictColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
        content: "I can't really describe how I feel about movie but Tom's dance let alone earns go for it. A poetic meditation on human mortality and joyous consciousness.",
        likesCount: 24,
      },
      {
        id: 'rev-chuck-2',
        username: 'adithya_cine',
        date: '27th Sep',
        verdict: 'Must Watch',
        verdictColor: 'bg-[#f5c542]/20 text-[#f5c542] border border-[#f5c542]/40',
        content: "I only have praise for Flanagan's emotional precision. From the third act backward structure to Nick Offerman's voiceover narration, this is quintessential cinema.",
        likesCount: 19,
      },
      {
        id: 'rev-chuck-3',
        username: 'sarah_movies',
        date: '25th Sep',
        verdict: 'Absolute Cinema',
        verdictColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
        content: "An absolute masterpiece that left the entire theater in tears. Stephen King's novella adapted with deep reverence and heartfelt humanity.",
        likesCount: 45,
      },
    ],
  },
  {
    movieId: 299534,
    movieTitle: 'Avengers: Endgame',
    posterPath: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80',
    mediaType: 'movie',
    reviews: [
      {
        id: 'rev-endgame-1',
        username: 'marvel_scout',
        date: '3 days ago',
        verdict: 'Absolute Cinema',
        verdictColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
        content: "The portals scene remains the peak collective theater experience of the 21st century. The emotional closure for Tony Stark and Steve Rogers is unmatched.",
        likesCount: 78,
      },
      {
        id: 'rev-endgame-2',
        username: 'robert_cinephile',
        date: '1 week ago',
        verdict: 'Must Watch',
        verdictColor: 'bg-[#f5c542]/20 text-[#f5c542] border border-[#f5c542]/40',
        content: "A 3-hour victory lap for an 11-year cinematic universe that landed every single emotional punch. Alan Silvestri's score gives chills every time.",
        likesCount: 31,
      },
    ],
  },
  {
    movieId: 157336,
    movieTitle: 'Interstellar',
    posterPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    mediaType: 'movie',
    reviews: [
      {
        id: 'rev-inter-1',
        username: 'astro_nolan',
        date: '2 days ago',
        verdict: 'Absolute Cinema',
        verdictColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
        content: "Love is the one thing we're capable of perceiving that transcends dimensions of time and space. Hans Zimmer's pipe organ score is transcendence itself.",
        likesCount: 92,
      },
      {
        id: 'rev-inter-2',
        username: 'tars_humor',
        date: '5 days ago',
        verdict: 'Go For It',
        verdictColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
        content: "Miller's planet water world scene still sets the gold standard for cinematic suspense and acoustic rhythm. Unquestionable masterpiece.",
        likesCount: 40,
      },
    ],
  },
];

export default function ReviewsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<MovieReviewGroup[]>(SHOWCASE_GROUPS);
  const [loading, setLoading] = useState(false);

  // References for horizontal scrolling
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
        {groups.map((group) => {
          const groupKey = `${group.mediaType}-${group.movieId}`;

          return (
            <section key={groupKey} className="space-y-4">
              {/* Header with Title + "< >" Navigation Arrows (Screenshot 2) */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">
                    {group.movieTitle}
                  </h2>
                  <p className="text-xs text-white/50 font-mono mt-0.5">
                    Read the recent reviews
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
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
                  className="w-full md:w-56 h-72 sm:h-96 shrink-0 rounded-3xl overflow-hidden border border-white/[0.1] bg-black/40 shadow-xl group relative block"
                >
                  <img
                    src={group.posterPath}
                    alt={group.movieTitle}
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
                  className="flex-1 flex gap-4 overflow-x-auto pb-2 scrollbar-none custom-scrollbar"
                >
                  {group.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="w-72 sm:w-80 shrink-0 rounded-3xl border border-white/[0.08] bg-[#140a0e] p-6 flex flex-col justify-between shadow-xl hover:border-white/[0.16] transition-all"
                    >
                      {/* Review Card Header */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar username={rev.username} url={rev.avatarUrl} size={9} />
                            <div>
                              <p className="text-xs font-bold text-white leading-none">
                                By {rev.username}
                              </p>
                              <p className="text-[10px] font-mono text-white/40 mt-1">
                                {rev.date}
                              </p>
                            </div>
                          </div>

                          {/* Verdict Pill */}
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${rev.verdictColor}`}
                          >
                            {rev.verdict}
                          </span>
                        </div>

                        {/* Review Content */}
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans line-clamp-6">
                          "{rev.content}"
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-white/40">
                        <div className="flex items-center gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-white/50" />
                          <span>{rev.likesCount ?? 0}</span>
                        </div>
                        <span className="text-[11px] text-[#f5c542]/80">Verified Cinephile</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </CommunityLayout>
  );
}
