// src/pages/community/DiscussionsPage.tsx — Cinema Open Floor & Community Discussions matching Screenshots 1-2
import { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Search,
  Share2,
  Heart,
  Smile,
  MoreHorizontal,
  X,
  MessageSquare,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DiscussionComment {
  id: string;
  username: string;
  avatarUrl?: string;
  timeAgo: string;
  content: string;
  fullContent?: string;
  likesCount: number;
  isLiked?: boolean;
  replies?: Array<{
    id: string;
    username: string;
    timeAgo: string;
    content: string;
  }>;
}

const INITIAL_COMMENTS: DiscussionComment[] = [
  {
    id: 'comm-1',
    username: 'avenger_akash_16',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    timeAgo: '15 hrs',
    content:
      'Unpopular opinion: Indian masala cinema(commercial movies) lacks respect mainly because creators recycle the same formulas without taking screenwriting risks.',
    fullContent:
      'Unpopular opinion: Indian masala cinema(commercial movies) lacks respect mainly because creators recycle the same formulas without taking screenwriting risks. When filmmakers like Rajamouli, Prashanth Neel, or Lokesh Kanagaraj push world-building and character motivation, the entire global cinema audience celebrates it.',
    likesCount: 10,
    isLiked: false,
    replies: [
      {
        id: 'rep-1',
        username: 'cinephile_sam',
        timeAgo: '12 hrs',
        content: 'Agreed 100%. Craftsmanship in technical departments is world class, but the writing needs bolder original arcs.',
      },
    ],
  },
  {
    id: 'comm-2',
    username: 'nolan_theorist',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    timeAgo: '12 hrs',
    content:
      'Christopher Nolan doing a period gothic espionage thriller next would shatter every box office record. The tension pacing would be completely unreal.',
    likesCount: 42,
    isLiked: false,
  },
  {
    id: 'comm-3',
    username: 'cinephile_zoe',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    timeAgo: '8 hrs',
    content:
      'Severance Season 2 and Black Doves Season 2 are setting the gold standard for modern television writing. We are in a new golden age of psychological suspense.',
    likesCount: 28,
    isLiked: false,
  },
  {
    id: 'comm-4',
    username: 'cinema_vault_official',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    timeAgo: '5 hrs',
    content:
      "Robert Eggers tackling folklore dread in Werwulf rather than modern jump scares is the best news for horror cinema fans this year. The atmosphere alone will be hypnotic.",
    likesCount: 65,
    isLiked: false,
  },
];

const TOPICS_LIST = [
  '🎬 Film Theories & Hot Takes',
  '🍿 Box Office Debates',
  '📺 Series & Show Finales',
  '🎮 Gaming Lore & Adaptations',
  '📚 Books & Graphic Novels',
];

export default function DiscussionsPage() {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<DiscussionComment[]>(INITIAL_COMMENTS);
  const [activeTab, setActiveTab] = useState<'top' | 'newest'>('top');
  const [newCommentText, setNewCommentText] = useState('');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine current day of week (e.g. Wednesday Open Floor)
  const dayOfWeek = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const handlePostComment = () => {
    if (!newCommentText.trim()) return;

    const username = profile?.username || user?.email?.split('@')[0] || 'Cinephile_User';
    const newCommentItem: DiscussionComment = {
      id: `comm-${Date.now()}`,
      username,
      avatarUrl: profile?.avatar_url || undefined,
      timeAgo: 'Just now',
      content: newCommentText.trim(),
      likesCount: 0,
      isLiked: false,
    };

    setComments((prev) => [newCommentItem, ...prev]);
    setNewCommentText('');
    toast.success('Your comment has been posted to the Open Floor!');
  };

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;
    const username = profile?.username || user?.email?.split('@')[0] || 'Cinephile_User';

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const currentReplies = c.replies || [];
          return {
            ...c,
            replies: [
              ...currentReplies,
              {
                id: `rep-${Date.now()}`,
                username,
                timeAgo: 'Just now',
                content: replyText.trim(),
              },
            ],
          };
        }
        return c;
      })
    );

    setReplyingToId(null);
    setReplyText('');
    toast.success('Reply posted!');
  };

  const toggleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.isLiked;
          return {
            ...c,
            isLiked,
            likesCount: isLiked ? c.likesCount + 1 : c.likesCount - 1,
          };
        }
        return c;
      })
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Discussion link copied to clipboard!');
  };

  const sortedComments = useMemo(() => {
    let list = [...comments];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.content.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'top') {
      return list.sort((a, b) => b.likesCount - a.likesCount);
    }
    return list; // 'newest' preserves insertion order
  }, [comments, activeTab, searchQuery]);

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* ── Top Bar Header (Screenshots 1 & 2) ── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        {/* Topics Filter Pill */}
        <div className="relative">
          <button
            onClick={() => setShowTopicsMenu((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.12] bg-[#140a0e] hover:bg-white/[0.08] text-xs font-semibold text-white transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
            <span>Topics</span>
            <span className="w-4.5 h-4.5 rounded-full bg-white/[0.12] flex items-center justify-center text-[10px] font-bold">
              5
            </span>
          </button>

          {showTopicsMenu && (
            <div className="absolute top-10 left-0 z-30 w-64 rounded-2xl border border-white/[0.12] bg-[#140a0e] p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-100">
              <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#f5c542]">
                Discussion Categories
              </div>
              {TOPICS_LIST.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => setShowTopicsMenu(false)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search icon */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative flex items-center">
              <input
                type="text"
                autoFocus
                placeholder="Search takes & comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 rounded-full border border-white/[0.15] bg-[#140a0e] px-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:border-[#f5c542] focus:outline-none"
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
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Search discussion"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Open Floor Feature Card (Screenshots 1 & 2) ── */}
      <section className="mb-6">
        {/* Banner Graphic */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0c0512] shadow-2xl">
          <img
            src="/assets/branding/open-floor-banner.jpg"
            alt="Open Floor"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Open Floor Meta & Description */}
        <div className="mt-4 space-y-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{dayOfWeek} Open Floor</span>
            <span role="img" aria-label="chat bubble">💬</span>
          </h2>

          <p className="text-sm leading-relaxed text-white/70">
            Got some hot takes? Theories? Want to discuss books, games, sports or anything else? The floor is all yours.
          </p>

          <p className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>Join in.</span>
            <span>👇</span>
          </p>

          {/* Author line and Share button */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-white/45">
              <span>By MovieGuy Official</span>
              <span>•</span>
              <span>15 hrs</span>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/[0.08] hover:text-white transition-all shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Sort Tabs: Top & Newest (Screenshot 1) ── */}
      <div className="mb-5 flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('top')}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'top'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#140a0e] text-white/60 hover:text-white border border-white/[0.08]'
          }`}
        >
          Top
        </button>

        <button
          onClick={() => setActiveTab('newest')}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'newest'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#140a0e] text-white/60 hover:text-white border border-white/[0.08]'
          }`}
        >
          Newest
        </button>
      </div>

      {/* ── Comment Input Box (Screenshot 1) ── */}
      <div className="mb-8 flex items-center gap-3">
        {/* User avatar circle */}
        <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.1] border border-white/[0.15] flex items-center justify-center text-xs font-bold text-white/80 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            (profile?.username || user?.email || 'U')[0].toUpperCase()
          )}
        </div>

        {/* Input Pill with Emoji and Post button */}
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/[0.1] bg-[#140a0e] px-4 py-2 shadow-inner focus-within:border-white/30 transition-colors">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
            placeholder="Write a comment..."
            className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setNewCommentText((prev) => prev + ' 🍿')}
            className="text-white/40 hover:text-white/80 transition-colors"
            title="Add cinema reaction"
          >
            <Smile className="h-4 w-4" />
          </button>

          <button
            onClick={handlePostComment}
            disabled={!newCommentText.trim()}
            className="text-xs font-semibold text-[#f5c542] hover:text-[#ffd666] disabled:opacity-30 disabled:hover:text-[#f5c542] transition-colors px-1"
          >
            Post
          </button>
        </div>
      </div>

      {/* ── Community Comments Feed (Screenshot 1) ── */}
      <div className="space-y-6">
        {sortedComments.map((comment) => {
          const isExpanded = !!expandedMap[comment.id];
          const hasFullContent = !!comment.fullContent;
          const displayContent =
            hasFullContent && !isExpanded
              ? comment.content
              : comment.fullContent || comment.content;

          return (
            <article key={comment.id} className="group">
              <div className="flex items-start gap-3">
                {/* User avatar */}
                <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-800 border border-white/[0.1] overflow-hidden">
                  {comment.avatarUrl ? (
                    <img
                      src={comment.avatarUrl}
                      alt={comment.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white/70">
                      {comment.username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white/90">
                      {comment.username}
                    </span>

                    {/* Like button on top right of comment (Screenshot 1) */}
                    <button
                      onClick={() => toggleLike(comment.id)}
                      className="flex items-center gap-1 text-white/50 hover:text-white transition-colors"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          comment.isLiked
                            ? 'fill-red-500 text-red-500'
                            : 'text-white/50 group-hover:text-white/70'
                        }`}
                      />
                      <span className="text-[11px] font-medium">
                        {comment.likesCount}
                      </span>
                    </button>
                  </div>

                  {/* Comment text */}
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/80">
                    {displayContent}
                    {hasFullContent && !isExpanded && (
                      <button
                        onClick={() =>
                          setExpandedMap((prev) => ({ ...prev, [comment.id]: true }))
                        }
                        className="ml-1 text-xs text-white/50 hover:text-white font-medium"
                      >
                        ...more
                      </button>
                    )}
                  </p>

                  {/* Comment Footer: TimeAgo, Reply, Menu */}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-white/45">
                    <span>{comment.timeAgo}</span>
                    <button
                      onClick={() =>
                        setReplyingToId(replyingToId === comment.id ? null : comment.id)
                      }
                      className="hover:text-white font-medium transition-colors"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/community/discussions#${comment.id}`
                        );
                        toast.success('Comment link copied');
                      }}
                      className="hover:text-white transition-colors"
                      title="Options"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Inline Reply Input */}
                  {replyingToId === comment.id && (
                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-black/40 p-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(comment.id)}
                        placeholder={`Reply to ${comment.username}...`}
                        className="flex-1 bg-transparent px-2 text-xs text-white placeholder-white/40 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={!replyText.trim()}
                        className="rounded-xl bg-[#f5c542] px-3 py-1 text-xs font-bold text-[#1c120c] hover:bg-[#e0b034] disabled:opacity-40"
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l border-white/[0.08] pl-3">
                      {comment.replies.map((rep) => (
                        <div key={rep.id} className="text-xs">
                          <span className="font-semibold text-white/90">
                            {rep.username}
                          </span>
                          <span className="ml-2 text-[10px] text-white/40">
                            {rep.timeAgo}
                          </span>
                          <p className="mt-0.5 text-white/70 leading-relaxed">
                            {rep.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </CommunityLayout>
  );
}
