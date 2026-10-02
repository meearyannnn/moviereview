// src/pages/community/DiscussionsPage.tsx — Realtime Discussions (simplified)
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

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70';

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

  const dayOfWeek = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

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

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== post.id) return p;
        const liked = !p.liked_by_user;
        return {
          ...p,
          liked_by_user: liked,
          likes_count: liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
        };
      })
    );

    try {
      await communityService.toggleLike(post.id, user.id);
    } catch {
      loadDiscussions(); // revert
    }
  };

  const loadRepliesForPost = async (postId: string) => {
    if (commentsMap[postId]) return;
    try {
      const replies = await communityService.getComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: replies }));
    } catch {
      // ignore
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
        setCommentsMap((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), res] }));
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
        (p) => p.content.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
      );
    }
    return activeTab === 'top'
      ? list.sort((a, b) => b.likes_count - a.likes_count)
      : list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, activeTab, searchQuery]);

  const tab = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${ring} ${active ? 'bg-white text-black' : 'bg-white/[0.06] text-white/60 hover:text-white'
    }`;

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* Top bar: topics + search */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative">
          <button
            onClick={() => setShowTopicsMenu((v) => !v)}
            aria-expanded={showTopicsMenu}
            className={`flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors ${ring}`}
          >
            <SlidersHorizontal className="h-4 w-4 text-white/60" />
            Topics
          </button>

          {showTopicsMenu && (
            <div className="absolute left-0 top-11 z-30 w-64 rounded-2xl border border-white/10 bg-[#140a0e] p-2 shadow-2xl">
              {TOPICS_LIST.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setShowTopicsMenu(false)}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {searchOpen ? (
          <div className="relative flex items-center">
            <input
              type="text"
              autoFocus
              aria-label="Search discussion"
              placeholder="Search takes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-64 rounded-full border border-white/15 bg-white/[0.06] py-1.5 pl-4 pr-9 text-sm text-white placeholder-white/40 focus:border-[#f5c542] focus:outline-none"
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              aria-label="Close search"
              className="absolute right-3 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search discussion"
            className={`rounded-full p-2 text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors ${ring}`}
          >
            <Search className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Open Floor */}
      <section className="mb-8">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-[#0c0512] ring-1 ring-white/10">
          <img
            src="/assets/branding/open-floor-banner.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {dayOfWeek} Open Floor
        </h2>
        <p className="mt-2 max-w-xl leading-relaxed text-white/65">
          Hot takes, theories, books, games, sports — the floor is all yours. Join in.
        </p>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-white/45">MovieGuy Official · Today</p>
          <button
            onClick={handleShare}
            className={`flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors ${ring}`}
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </section>

      {/* Sort tabs */}
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => setActiveTab('top')} aria-pressed={activeTab === 'top'} className={tab(activeTab === 'top')}>
          Top
        </button>
        <button onClick={() => setActiveTab('newest')} aria-pressed={activeTab === 'newest'} className={tab(activeTab === 'newest')}>
          Newest
        </button>
      </div>

      {/* Composer */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-bold text-white/80">
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

        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 transition-colors focus-within:border-[#f5c542]/60">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !submitting && handlePostDiscussion()}
            placeholder={user ? 'Add your take…' : 'Sign in to join the discussion…'}
            aria-label="Write a take"
            disabled={submitting}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setNewCommentText((prev) => prev + ' 🍿')}
            aria-label="Add popcorn emoji"
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <Smile className="h-5 w-5" />
          </button>
          <button
            onClick={handlePostDiscussion}
            disabled={!newCommentText.trim() || submitting}
            className="flex items-center gap-1 px-1 text-sm font-semibold text-[#f5c542] hover:text-[#ffd666] disabled:opacity-30 disabled:hover:text-[#f5c542] transition-colors"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Post
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-6 py-4" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse gap-3">
              <div className="h-10 w-10 rounded-full bg-white/[0.05]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-white/[0.05]" />
                <div className="h-4 w-full rounded bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/25" />
          <p className="font-semibold text-white/80">The floor is quiet</p>
          <p className="mt-1 text-sm text-white/40">Be the first to share a take.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {sortedPosts.map((post) => {
            const isExpanded = !!expandedMap[post.id];
            const isLong = post.content.length > 200;
            const displayContent =
              isLong && !isExpanded ? `${post.content.slice(0, 200)}…` : post.content;
            const postReplies = commentsMap[post.id] || [];

            return (
              <article key={post.id} className="py-5 first:pt-0">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-800">
                    {post.avatar_url ? (
                      <img
                        src={post.avatar_url}
                        alt=""
                        decoding="async"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                        {post.username[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-white">{post.username}</span>
                      <span className="ml-2 text-xs text-white/40">{timeAgo(post.created_at)}</span>
                    </p>

                    <p className="mt-1 leading-relaxed text-white/80">
                      {displayContent}
                      {isLong && !isExpanded && (
                        <button
                          onClick={() => setExpandedMap((prev) => ({ ...prev, [post.id]: true }))}
                          className="ml-1 text-sm font-medium text-[#f5c542] hover:text-white"
                        >
                          more
                        </button>
                      )}
                    </p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-white/45">
                      <button
                        onClick={() => {
                          const willOpen = replyingToId !== post.id;
                          setReplyingToId(willOpen ? post.id : null);
                          if (willOpen) loadRepliesForPost(post.id);
                        }}
                        className="font-medium hover:text-white transition-colors"
                      >
                        Reply{post.comments_count > 0 && ` (${post.comments_count})`}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/community/discussions#${post.id}`
                          );
                          toast.success('Take link copied');
                        }}
                        aria-label="Copy link to this take"
                        className="hover:text-white transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    {replyingToId === post.id && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-4 pr-1.5">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply(post.id)}
                            placeholder={`Reply to ${post.username}…`}
                            aria-label="Write a reply"
                            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSendReply(post.id)}
                            disabled={!replyText.trim()}
                            className="rounded-full bg-[#f5c542] px-4 py-1 text-sm font-semibold text-[#1c120c] hover:bg-[#e0b034] disabled:opacity-40 transition-colors"
                          >
                            Reply
                          </button>
                        </div>

                        {postReplies.length > 0 && (
                          <div className="space-y-3 border-l border-white/10 pl-4">
                            {postReplies.map((rep) => (
                              <div key={rep.id} className="text-sm">
                                <span className="font-semibold text-white/90">
                                  {rep.username || 'Cinephile'}
                                </span>
                                <span className="ml-2 text-xs text-white/40">
                                  {timeAgo(rep.created_at)}
                                </span>
                                <p className="mt-0.5 leading-relaxed text-white/70">{rep.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleLike(post)}
                    aria-pressed={!!post.liked_by_user}
                    aria-label={post.liked_by_user ? 'Unlike' : 'Like'}
                    className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5 text-white/45 hover:text-white transition-colors"
                  >
                    <Heart
                      className={`h-5 w-5 ${post.liked_by_user ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    <span className="text-xs font-medium">{post.likes_count}</span>
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