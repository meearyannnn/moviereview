// src/pages/community/DiscussionsPage.tsx — Realtime Database Discussions (100% Real Data, Zero Dummy Data)
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Send,
  Loader2,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { communityService, type CommunityPost, type PostComment } from '@/services/community';
import { useAuth } from '@/contexts/AuthContext';
import { timeAgo } from '@/components/community/communityUtils';
import { toast } from 'sonner';

const TOPICS_LIST = [
  '🎬 Film Theories & Hot Takes',
  '🍿 Box Office Debates',
  '📺 Series & Show Finales',
  '🎮 Gaming Lore & Adaptations',
  '📚 Books & Graphic Novels',
];

export default function DiscussionsPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'top' | 'newest'>('top');
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine current day of week (e.g. Wednesday Open Floor)
  const dayOfWeek = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  // Fetch real discussions from database
  const loadDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      const feed = await communityService.getGlobalFeed(user?.id ?? null, 40, 0, ['discussion', 'general']);
      setPosts(feed || []);
    } catch {
      toast.error('Could not load discussion feed.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  const handlePostDiscussion = async () => {
    if (!newCommentText.trim()) return;

    if (!user) {
      toast.error('Please sign in to join the discussion.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await communityService.createPost({
        content: newCommentText.trim(),
        category: 'discussion',
      });

      if (created) {
        setPosts((prev) => [created, ...prev]);
        setNewCommentText('');
        toast.success('Your take has been posted to the Open Floor!');
      } else {
        toast.error('Could not post your take. Try again.');
      }
    } catch {
      toast.error('Failed to post discussion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (post: CommunityPost) => {
    if (!user) {
      toast.error('Please sign in to like takes.');
      return;
    }

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          const isLiked = !p.liked_by_user;
          return {
            ...p,
            liked_by_user: isLiked,
            likes_count: isLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
          };
        }
        return p;
      })
    );

    try {
      await communityService.toggleLike(post.id, user.id);
    } catch {
      // Revert if failed
      loadDiscussions();
    }
  };

  const loadRepliesForPost = async (postId: string) => {
    if (commentsMap[postId]) return;
    try {
      const replies = await communityService.getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: replies }));
    } catch {
      // Ignore
    }
  };

  const handleSendReply = async (postId: string) => {
    if (!replyText.trim()) return;
    if (!user) {
      toast.error('Please sign in to reply.');
      return;
    }

    try {
      const res = await communityService.addComment(postId, user.id, replyText.trim());
      if (res) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res],
        }));
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
        );
        setReplyText('');
        setReplyingToId(null);
        toast.success('Reply added!');
      }
    } catch {
      toast.error('Could not submit reply.');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Discussion link copied to clipboard!');
  };

  const sortedPosts = useMemo(() => {
    let list = [...posts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'top') {
      return list.sort((a, b) => b.likes_count - a.likes_count);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, activeTab, searchQuery]);

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
              {TOPICS_LIST.length}
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
              <span>Today</span>
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
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'top'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#181016] text-white/60 hover:text-white border border-white/[0.08]'
          }`}
        >
          Top
        </button>

        <button
          onClick={() => setActiveTab('newest')}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'newest'
              ? 'bg-white text-black shadow-md'
              : 'bg-[#181016] text-white/60 hover:text-white border border-white/[0.08]'
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
            <img
              src={profile.avatar_url}
              alt=""
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              className="h-full w-full object-cover"
            />
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
            onKeyDown={(e) => e.key === 'Enter' && !submitting && handlePostDiscussion()}
            placeholder={user ? "Write a comment..." : "Sign in to join the discussion..."}
            disabled={submitting}
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
            onClick={handlePostDiscussion}
            disabled={!newCommentText.trim() || submitting}
            className="text-xs font-semibold text-[#f5c542] hover:text-[#ffd666] disabled:opacity-30 disabled:hover:text-[#f5c542] transition-colors px-1 flex items-center gap-1"
          >
            {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* ── Community Comments Feed (Screenshot 1) ── */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-white/[0.04]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-white/[0.04]" />
                <div className="h-4 w-full rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-12 text-center">
          <MessageSquare className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white/80 font-bold text-sm">The floor is quiet</p>
          <p className="text-white/40 text-xs mt-1">
            Be the first cinephile to share a hot take or theory above!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedPosts.map((post) => {
            const isExpanded = !!expandedMap[post.id];
            const isLong = post.content.length > 200;
            const displayContent =
              isLong && !isExpanded ? `${post.content.slice(0, 200)}...` : post.content;
            const postReplies = commentsMap[post.id] || [];

            return (
              <article key={post.id} className="group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* User avatar */}
                    <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-800 border border-white/[0.1] overflow-hidden">
                      {post.avatar_url ? (
                        <img
                          src={post.avatar_url}
                          alt={post.username}
                          decoding="async"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white/70">
                          {post.username[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>

                    {/* Comment Body */}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white/90">
                        {post.username}
                      </span>

                      {/* Comment text */}
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/80">
                        {displayContent}
                        {isLong && !isExpanded && (
                          <button
                            onClick={() =>
                              setExpandedMap((prev) => ({ ...prev, [post.id]: true }))
                            }
                            className="ml-1 text-xs text-white/50 hover:text-white font-medium"
                          >
                            more
                          </button>
                        )}
                      </p>

                      {/* Comment Footer: TimeAgo, Reply, Menu */}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-white/45">
                        <span>{timeAgo(post.created_at)}</span>
                        <button
                          onClick={() => {
                            const willOpen = replyingToId !== post.id;
                            setReplyingToId(willOpen ? post.id : null);
                            if (willOpen) loadRepliesForPost(post.id);
                          }}
                          className="hover:text-white font-medium transition-colors"
                        >
                          Reply {post.comments_count > 0 && `(${post.comments_count})`}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/community/discussions#${post.id}`
                            );
                            toast.success('Take link copied');
                          }}
                          className="hover:text-white transition-colors"
                          title="Options"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Inline Reply Input */}
                      {replyingToId === post.id && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-black/40 p-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendReply(post.id)}
                              placeholder={`Reply to ${post.username}...`}
                              className="flex-1 bg-transparent px-2 text-xs text-white placeholder-white/40 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSendReply(post.id)}
                              disabled={!replyText.trim()}
                              className="rounded-xl bg-[#f5c542] px-3 py-1 text-xs font-bold text-[#1c120c] hover:bg-[#e0b034] disabled:opacity-40"
                            >
                              Reply
                            </button>
                          </div>

                          {/* Nested Replies */}
                          {postReplies.length > 0 && (
                            <div className="space-y-2 border-l border-white/[0.08] pl-3 mt-2">
                              {postReplies.map((rep) => (
                                <div key={rep.id} className="text-xs">
                                  <span className="font-semibold text-white/90">
                                    {rep.username || 'Cinephile'}
                                  </span>
                                  <span className="ml-2 text-[10px] text-white/40">
                                    {timeAgo(rep.created_at)}
                                  </span>
                                  <p className="mt-0.5 text-white/70 leading-relaxed">
                                    {rep.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Like column on far right (Screenshot 1) */}
                  <button
                    onClick={() => handleToggleLike(post)}
                    className="flex flex-col items-center gap-0.5 shrink-0 text-white/40 hover:text-white transition-colors pt-0.5"
                    title={post.liked_by_user ? 'Liked' : 'Like'}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        post.liked_by_user
                          ? 'fill-red-500 text-red-500'
                          : 'text-white/40 hover:text-white/80'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-white/50">
                      {post.likes_count}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </CommunityLayout>
  );
}
