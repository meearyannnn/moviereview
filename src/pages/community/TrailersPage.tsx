// src/pages/community/TrailersPage.tsx — Cinema Trailers, Promos, BTS & Teasers Feed matching Screenshots 3-5
import { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Search,
  Play,
  MessageCircle,
  X,
  Share2,
  Film,
  Sparkles,
  RefreshCw,
  Clock,
  Tv,
  ExternalLink,
  Flame,
  Heart,
  Send,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { trailersService, type CinemaTrailer, type TrailerType } from '@/services/trailers';
import { toast } from 'sonner';

const TOPIC_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'trailers', label: 'Trailers' },
  { id: 'promos', label: 'Promos' },
  { id: 'bts', label: 'BTS' },
  { id: 'teasers', label: 'Teasers' },
  { id: 'upcoming', label: 'Upcoming' },
];

export default function TrailersPage() {
  const [trailers, setTrailers] = useState<CinemaTrailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<CinemaTrailer | null>(null);
  const [commentDrawerItem, setCommentDrawerItem] = useState<CinemaTrailer | null>(null);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<Record<string, string[]>>({
    'tr-lanterns-promo': [
      'The cinematography for this finale looks insane! Cannot wait for episode 8.',
      'John Stewart and Hal Jordan dynamic is peak DC.',
    ],
    'tr-black-doves': [
      'Keira Knightley and Ben Whishaw is the duo I never knew I needed.',
      'Season 1 was a masterclass in tension, hope Season 2 tops it.',
    ],
    'tr-werwulf-trailer': [
      'Robert Eggers never misses. The atmosphere and audio design are terrifying.',
      'That gothic costume work gives pure folklore dread.',
    ],
  });

  const fetchTrailers = async () => {
    setLoading(true);
    try {
      const data = await trailersService.getTrailers(activeFilter as any);
      setTrailers(data);
    } catch {
      toast.error('Could not load live trailers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrailers();
  }, [activeFilter]);

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedIds((prev) => {
      const isLiked = !prev[id];
      if (isLiked) {
        toast.success('Added to your cinema favorites!');
      }
      return { ...prev, [id]: isLiked };
    });
  };

  const handleAddComment = (id: string) => {
    if (!newComment.trim()) return;
    setLocalComments((prev) => ({
      ...prev,
      [id]: [newComment.trim(), ...(prev[id] || [])],
    }));
    setNewComment('');
    toast.success('Comment posted!');
  };

  const filteredTrailers = trailers.filter((tr) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tr.title.toLowerCase().includes(q) ||
      tr.movieTitle.toLowerCase().includes(q) ||
      (tr.subtitle && tr.subtitle.toLowerCase().includes(q))
    );
  });

  // Helper to render headline with underlined keywords matching screenshots
  const renderStyledTitle = (item: CinemaTrailer) => {
    const text = item.title;
    const entities = item.entities || [item.movieTitle];

    // Build regex pattern for matching entities
    const escapedEntities = entities.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escapedEntities.length === 0) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(`(${escapedEntities.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) => {
          const isEntity = entities.some((e) => e.toLowerCase() === part.toLowerCase());
          if (isEntity) {
            return (
              <span
                key={i}
                className="underline decoration-dotted underline-offset-4 decoration-white/50 font-semibold text-white hover:text-[#f5c542] transition-colors"
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* ── Top Header Controls (Screenshot 5) ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Topics Filter Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowTopicsMenu((v) => !v)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.12] bg-[#140a0e] hover:bg-white/[0.06] text-xs font-medium text-white transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
              <span>Topics</span>
              <span className="w-4 h-4 rounded-full bg-white/[0.12] flex items-center justify-center text-[10px] font-bold">
                5
              </span>
            </button>

            {showTopicsMenu && (
              <div className="absolute top-10 left-0 z-30 w-52 rounded-2xl border border-white/[0.1] bg-[#140a0e] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in duration-100">
                {TOPIC_FILTERS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setActiveFilter(topic.id);
                      setShowTopicsMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      activeFilter === topic.id
                        ? 'bg-white/[0.1] text-white font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
            {TOPIC_FILTERS.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    active
                      ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar / Icon */}
        <div className="flex items-center gap-2 ml-auto">
          {searchOpen ? (
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="Search trailers, promos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-full border border-white/[0.15] bg-[#140a0e] px-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:border-[#f5c542] focus:outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="absolute right-2.5 text-white/50 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Search trailers"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            onClick={fetchTrailers}
            disabled={loading}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Feed List (Screenshots 3, 4, 5) ── */}
      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-3">
              <div className="aspect-video w-full rounded-2xl bg-white/[0.04] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-white/[0.04] animate-pulse" />
              <div className="h-3 w-1/4 rounded bg-white/[0.04] animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredTrailers.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-12 text-center">
          <Film className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 font-medium text-sm">No videos found matching your filter</p>
          <button
            onClick={() => {
              setActiveFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-full bg-white/[0.08] text-xs font-semibold text-white hover:bg-white/[0.15]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {filteredTrailers.map((item) => {
            const isLiked = !!likedIds[item.id];
            const comments = localComments[item.id] || [];
            const commentTotal = item.commentsCount + comments.length;

            return (
              <article key={item.id} className="group">
                {/* ── 1. Video / Media Thumbnail (16:9) ── */}
                <div
                  onClick={() => setActiveVideo(item)}
                  className="relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-black cursor-pointer shadow-lg border border-white/[0.06] group-hover:border-white/[0.15] transition-all"
                >
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Dark subtle vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

                  {/* Brand / Streamer Badges */}
                  {item.streamer === 'netflix' && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-red-600/30 text-red-500 font-extrabold tracking-wider text-xs">
                      NETFLIX
                    </div>
                  )}

                  {item.streamer === 'disney' && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded bg-[#001030]/80 backdrop-blur-md border border-blue-400/30 text-blue-200 font-bold text-xs tracking-wide">
                      Disney+
                    </div>
                  )}

                  {/* Type / Watermark Tag in Corner */}
                  {item.badgeText && (
                    <div className="absolute bottom-4 left-4">
                      {item.badgeText === 'FINALE PROMO HD' ? (
                        <div className="flex flex-col">
                          <span className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            FINALE PROMO
                          </span>
                          <span className="w-fit rounded border border-white/60 px-1 text-[10px] font-bold tracking-widest text-white/90">
                            HD
                          </span>
                        </div>
                      ) : item.badgeText === 'OFFICIAL TRAILER 2' ? (
                        <div className="flex flex-col">
                          <span className="font-serif text-lg sm:text-xl font-bold uppercase tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            {item.movieTitle}
                          </span>
                          <span className="text-[11px] font-mono tracking-widest text-white/70 uppercase">
                            OFFICIAL TRAILER 2
                          </span>
                        </div>
                      ) : (
                        <span className="inline-block rounded-md bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/10">
                          {item.badgeText}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Center Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-[#f5c542] group-hover:text-[#1c120c] group-hover:border-transparent">
                      <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* ── 2. Information Line BELOW Video (Screenshots 3-5) ── */}
                <div className="mt-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <h2
                      onClick={() => setActiveVideo(item)}
                      className="cursor-pointer text-sm sm:text-base leading-snug font-medium text-white/90 hover:text-white transition-colors"
                    >
                      {renderStyledTitle(item)}
                    </h2>

                    {item.subtitle && (
                      <p className="text-xs sm:text-sm text-white/60">
                        {item.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-0.5 text-xs text-white/45">
                      <span>By {item.author}</span>
                      <span>•</span>
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>

                  {/* Action Icons: Comment Bubble & Like on the right */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <button
                      onClick={() => setCommentDrawerItem(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors"
                      title="Open comments"
                    >
                      <MessageCircle className="h-4.5 w-4.5" />
                    </button>

                    <button
                      onClick={(e) => toggleLike(item.id, e)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        isLiked
                          ? 'text-red-500 bg-red-500/10'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                      }`}
                      title={isLiked ? 'Liked' : 'Like'}
                    >
                      <Heart className={`h-4.5 w-4.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div className="mt-8 border-b border-white/[0.08]" />
              </article>
            );
          })}
        </div>
      )}

      {/* ── Cinema Theater Video Modal ── */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#140a0e] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#f5c542]">
                  {activeVideo.videoType} • {activeVideo.movieTitle}
                </span>
                <h3 className="mt-1 text-base font-bold text-white line-clamp-1">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/[0.1]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* YouTube Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer */}
            <div className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span>By {activeVideo.author}</span>
                <span>•</span>
                <span>{activeVideo.timeAgo}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`);
                    toast.success('YouTube trailer link copied!');
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.08] transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share</span>
                </button>

                <button
                  onClick={() => {
                    setCommentDrawerItem(activeVideo);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-[#f5c542] px-4 py-1.5 text-xs font-bold text-[#1c120c] hover:bg-[#e0b034] transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Discuss</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Comments Drawer Modal ── */}
      {commentDrawerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#140a0e] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4.5 w-4.5 text-[#f5c542]" />
                <h3 className="text-sm font-bold text-white">
                  Takes on {commentDrawerItem.movieTitle}
                </h3>
              </div>
              <button
                onClick={() => setCommentDrawerItem(null)}
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input Box */}
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-black/40 p-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(commentDrawerItem.id)}
                placeholder="Share your thoughts on this preview..."
                className="flex-1 bg-transparent px-2 text-xs text-white placeholder-white/40 focus:outline-none"
              />
              <button
                onClick={() => handleAddComment(commentDrawerItem.id)}
                className="rounded-xl bg-[#f5c542] p-2 text-[#1c120c] hover:bg-[#e0b034] transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Existing Comments */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(localComments[commentDrawerItem.id] || []).length === 0 ? (
                <p className="text-xs text-white/40 text-center py-6">
                  No takes yet. Be the first to share your reaction!
                </p>
              ) : (
                (localComments[commentDrawerItem.id] || []).map((c, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                    <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
                      <span className="font-semibold text-white/80">Cinephile User</span>
                      <span>Just now</span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">{c}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </CommunityLayout>
  );
}
