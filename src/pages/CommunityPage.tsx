import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Heart, MessageCircle, Trash2, Send, Film, Tv,
  Sparkles, Globe, MoreHorizontal, ChevronDown, Pen,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, CATEGORIES, categoryMeta, timeAgo, Spinner } from '@/components/community/communityUtils';
import { useAuth } from '@/contexts/AuthContext';
import {
  communityService,
  type CommunityPost,
  type PostComment,
  type PostCategory,
} from '@/services/community';
import { toast } from 'sonner';

import { ComposePostBox } from '@/components/community/ComposePostBox';
import { PostMediaRenderer } from '@/components/community/PostMediaRenderer';

// ─── Glass tokens ──────────────────────────────────────────────────────────────

// Frosted fill, hairline edge, light catching the top edge
const GLASS =
  'border border-white/[0.1] bg-white/[0.045] backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)]';
const GLASS_HOVER = 'transition duration-300 hover:border-white/20 hover:bg-white/[0.06]';
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

// ─── Comment Thread ────────────────────────────────────────────────────────────

function CommentThread({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    communityService.getComments(postId).then((c) => {
      setComments(c);
      setLoading(false);
    });
  }, [postId]);

  const submit = async () => {
    if (!user || !text.trim()) return;
    setBusy(true);
    const comment = await communityService.addComment(postId, user.id, text.trim());
    setBusy(false);
    if (comment) { setComments((p) => [...p, comment]); setText(''); }
    else toast.error('Failed to add comment');
  };

  return (
    <div className="mt-4 space-y-3 border-t border-white/[0.08] pt-4">
      {loading ? (
        <div className="flex justify-center py-3"><Spinner /></div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-xs text-white/40">No comments yet. Start the conversation.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar username={c.username ?? 'U'} url={c.avatar_url} size={7} />
            <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3.5 py-2.5 text-sm">
              <span className="mr-2 font-semibold text-white/90">{c.username}</span>
              <span className="text-white/70">{c.content}</span>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-white/40">
                <span>{timeAgo(c.created_at)}</span>
                {user?.id === c.user_id && (
                  <button
                    onClick={async () => {
                      const ok = await communityService.deleteComment(c.id, user.id);
                      if (ok) setComments((p) => p.filter((x) => x.id !== c.id));
                    }}
                    className={`rounded transition-colors hover:text-red-400 ${FOCUS}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      {user && (
        <div className="flex gap-2">
          <Avatar username={profile?.username ?? 'U'} url={profile?.avatar_url} size={7} />
          <div className="flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 transition focus-within:border-[#f5c542]/50 focus-within:bg-white/[0.07]">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Add a comment…"
              aria-label="Add a comment"
              className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-white/35 focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={!text.trim() || busy}
              aria-label="Send comment"
              className={`shrink-0 rounded-full p-1 text-white/50 transition-colors hover:text-[#f5c542] disabled:opacity-30 ${FOCUS}`}
            >
              {busy ? <Spinner size={3} /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared action button ──────────────────────────────────────────────────────

function ActionButton({
  onClick, active, activeClass, label, children,
}: {
  onClick: () => void;
  active: boolean;
  activeClass: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm tabular-nums transition active:scale-95 ${FOCUS} ${active ? activeClass : 'text-white/50 hover:bg-white/[0.07] hover:text-white'
        }`}
    >
      {children}
    </button>
  );
}

// ─── Hero Post (featured card) ─────────────────────────────────────────────────

function HeroPost({ post, currentUserId, onDelete }: {
  post: CommunityPost;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likes, setLikes] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const meta = categoryMeta(post.category);

  const toggleLike = async () => {
    if (!currentUserId) { toast.info('Sign in to like posts'); return; }
    const next = await communityService.togglePostLike(post.id, currentUserId, liked);
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
  };

  const hasPoster = !!post.media_poster;

  return (
    <article className={`overflow-hidden rounded-[28px] border-[#f5c542]/25 ${GLASS}`}>
      <div className={`flex ${hasPoster ? 'flex-row' : 'flex-col'}`}>
        {/* Movie poster */}
        {hasPoster && (
          <Link
            to={`/${post.media_type ?? 'movie'}/${post.media_id}`}
            aria-label={`Open ${post.media_title ?? 'title'}`}
            className={`relative w-28 shrink-0 overflow-hidden sm:w-40 ${FOCUS}`}
          >
            <img
              src={`https://image.tmdb.org/t/p/w342${post.media_poster}`}
              alt={post.media_title ?? ''}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder.svg';
              }}
              className="h-full min-h-[180px] w-full object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:min-h-[240px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#140a0d]/70" />
          </Link>
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.color}`}>
              {meta.label}
            </span>
            {post.media_title && (
              <Link
                to={`/${post.media_type ?? 'movie'}/${post.media_id}`}
                className={`flex items-center gap-1 rounded-full text-xs text-white/55 transition-colors hover:text-[#f5c542] ${FOCUS}`}
              >
                {post.media_type === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                <span className="max-w-[160px] truncate">{post.media_title}</span>
              </Link>
            )}
          </div>

          <p className="line-clamp-4 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-white/90">
            {post.content}
          </p>

          <PostMediaRenderer post={post} />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
            <Link
              to={`/community/user/${post.user_id}`}
              className={`flex items-center gap-2.5 rounded-full transition-opacity hover:opacity-80 ${FOCUS}`}
            >
              <Avatar username={post.username} url={post.avatar_url} size={7} />
              <div>
                <p className="text-xs font-semibold text-white">{post.username}</p>
                <p className="text-[11px] text-white/45">{timeAgo(post.created_at)}</p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <ActionButton
                onClick={toggleLike}
                active={liked}
                activeClass="text-[#f5c542]"
                label={liked ? `Unlike, ${likes} likes` : `Like, ${likes} likes`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-[#f5c542] text-[#f5c542]' : ''}`} />
                {likes}
              </ActionButton>
              <ActionButton
                onClick={() => setShowComments((v) => !v)}
                active={showComments}
                activeClass="bg-white/[0.08] text-white"
                label={`Comments, ${post.comments_count}`}
              >
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </ActionButton>
              {currentUserId === post.user_id && (
                <button
                  onClick={async () => {
                    const ok = await communityService.deletePost(post.id, currentUserId!);
                    if (ok) onDelete(post.id); else toast.error('Failed to delete');
                  }}
                  aria-label="Delete post"
                  className={`rounded-full p-2 text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-400 ${FOCUS}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {showComments && <CommentThread postId={post.id} />}
        </div>
      </div>
    </article>
  );
}

// ─── Regular Post Card ─────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onDelete }: {
  post: CommunityPost;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likes, setLikes] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const meta = categoryMeta(post.category);

  const toggleLike = async () => {
    if (!currentUserId) { toast.info('Sign in to like posts'); return; }
    const next = await communityService.togglePostLike(post.id, currentUserId, liked);
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
  };

  return (
    <article className={`rounded-3xl p-5 ${GLASS} ${GLASS_HOVER}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/community/user/${post.user_id}`}
          className={`flex items-center gap-3 rounded-full transition-opacity hover:opacity-80 ${FOCUS}`}
        >
          <Avatar username={post.username} url={post.avatar_url} size={9} />
          <div>
            <p className="text-sm font-semibold text-white">{post.username}</p>
            <p className="text-xs text-white/45">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.color}`}>
            {meta.label}
          </span>
          {currentUserId === post.user_id && (
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                aria-label="Post options"
                aria-expanded={showMenu}
                className={`grid h-8 w-8 place-items-center rounded-full text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white ${FOCUS}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-2xl border border-white/[0.12] bg-[#140a0d]/85 py-1 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      const ok = await communityService.deletePost(post.id, currentUserId!);
                      if (ok) onDelete(post.id); else toast.error('Failed to delete');
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" /> Delete post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="mt-4 line-clamp-5 whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">{post.content}</p>

      {/* Media & Attachments */}
      <PostMediaRenderer post={post} />

      {/* Actions */}
      <div className="-ml-3 mt-3 flex items-center gap-1">
        <ActionButton
          onClick={toggleLike}
          active={liked}
          activeClass="text-[#f5c542]"
          label={liked ? `Unlike, ${likes} likes` : `Like, ${likes} likes`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-[#f5c542] text-[#f5c542]' : ''}`} />
          {likes}
        </ActionButton>
        <ActionButton
          onClick={() => setShowComments((v) => !v)}
          active={showComments}
          activeClass="bg-white/[0.08] text-white"
          label={`Comments, ${post.comments_count}`}
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments_count}
        </ActionButton>
      </div>
      {showComments && <CommentThread postId={post.id} />}
    </article>
  );
}

// ─── Main Feed Page ────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const feedType = (searchParams.get('feed') as 'for-you' | 'global') ?? (user ? 'for-you' : 'global');
  const [filterCat, setFilterCat] = useState<PostCategory | 'all'>('all');

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostBanner, setNewPostBanner] = useState(false);
  const offsetRef = useRef(0);
  const PAGE = 20;

  const loadPosts = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); offsetRef.current = 0; }
    else setLoadingMore(true);

    const offset = reset ? 0 : offsetRef.current;
    const data = feedType === 'for-you' && user
      ? await communityService.getPersonalizedFeed(user.id, PAGE, offset, filterCat)
      : await communityService.getGlobalFeed(user?.id ?? null, PAGE, offset, filterCat);

    offsetRef.current = offset + data.length;
    setHasMore(data.length === PAGE);
    if (reset) setPosts(data);
    else setPosts((prev) => [...prev, ...data]);
    setLoading(false);
    setLoadingMore(false);
  }, [feedType, user, filterCat]);

  useEffect(() => { loadPosts(true); }, [loadPosts]);

  // Real-time subscription — show banner on new post instead of auto-refresh
  useEffect(() => {
    const channel = communityService.subscribeToFeed(() => setNewPostBanner(true));
    return () => { channel.unsubscribe(); };
  }, [loadPosts]);

  const handleNewPost = (post: CommunityPost) => setPosts((p) => [post, ...p]);
  const handleDelete = (id: string) => setPosts((p) => p.filter((x) => x.id !== id));

  const displayed = posts;

  // Split: first post becomes the hero card, rest are normal cards
  const heroPost = displayed[0] ?? null;
  const restPosts = displayed.slice(1);

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="relative isolate">
        {/* Ambient light the glass refracts */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#f5c542]/[0.09] blur-[110px]" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[#9b1c3c]/[0.20] blur-[130px]" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[#5b2a86]/[0.14] blur-[120px]" />
        </div>

        {/* Feed toggle + category chips */}
        <div className="mb-6 space-y-4">
          <div role="tablist" aria-label="Feed" className={`inline-flex rounded-full p-1 ${GLASS}`}>
            {[
              { key: 'for-you', label: 'For You', Icon: Sparkles, needsAuth: true },
              { key: 'global', label: 'Discover', Icon: Globe, needsAuth: false },
            ].map(({ key, label, Icon, needsAuth }) => (
              <button
                key={key}
                role="tab"
                aria-selected={feedType === key}
                onClick={() => {
                  if (needsAuth && !user) { toast.info('Sign in to see your personalized feed'); return; }
                  setSearchParams({ feed: key });
                }}
                className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold transition-all ${FOCUS} ${feedType === key
                    ? 'bg-[#f5c542] text-[#1c120c] shadow-[0_6px_20px_-6px_rgba(245,197,66,0.6)]'
                    : 'text-white/55 hover:text-white'
                  }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Category filter — scrolls sideways on small screens */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setFilterCat('all')}
              aria-pressed={filterCat === 'all'}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-xl transition-all ${FOCUS} ${filterCat === 'all'
                  ? 'border-[#f5c542]/50 bg-[#f5c542]/15 text-[#f5c542]'
                  : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/25 hover:text-white'
                }`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilterCat(c.key)}
                aria-pressed={filterCat === c.key}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-xl transition-all ${FOCUS} ${filterCat === c.key
                    ? `${c.color} border-white/25`
                    : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/25 hover:text-white'
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compose */}
        {user && <ComposePostBox onPost={handleNewPost} />}
        {!user && (
          <div className={`mb-6 rounded-3xl px-6 py-8 text-center ${GLASS}`}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#f5c542]/30 bg-[#f5c542]/10">
              <Pen className="h-5 w-5 text-[#f5c542]" />
            </div>
            <p className="text-base font-semibold text-white">Join the conversation</p>
            <p className="mt-1 text-sm text-white/55">Sign in to post, like, and follow fellow cinephiles.</p>
          </div>
        )}

        {/* New post banner */}
        {newPostBanner && (
          <button
            onClick={() => { setNewPostBanner(false); loadPosts(true); }}
            className={`mb-5 w-full rounded-full border border-[#f5c542]/40 bg-[#f5c542]/10 py-3 text-sm font-semibold text-[#f5c542] backdrop-blur-xl transition hover:bg-[#f5c542]/20 ${FOCUS}`}
          >
            New posts available. Tap to refresh
          </button>
        )}

        {/* Posts */}
        {loading ? (
          <div className="space-y-5" aria-busy="true" aria-label="Loading posts">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`animate-pulse rounded-3xl ${GLASS} ${i === 0 ? 'h-56' : 'h-36'}`}
              />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className={`rounded-3xl px-6 py-16 text-center ${GLASS}`}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
              <Globe className="h-6 w-6 text-[#f5c542]/80" strokeWidth={1.5} />
            </div>
            <p className="font-medium text-white/85">
              {feedType === 'for-you' ? 'Your feed is empty.' : 'No posts yet.'}
            </p>
            <p className="mt-1 text-sm text-white/45">
              {feedType === 'for-you'
                ? 'Follow people to see their posts here.'
                : 'Be the first to share something.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {heroPost && <HeroPost post={heroPost} currentUserId={user?.id} onDelete={handleDelete} />}
            {restPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={user?.id} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && displayed.length > 0 && (
          <div className="mt-8 flex justify-center pb-12">
            <button
              onClick={() => loadPosts(false)}
              disabled={loadingMore}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white/70 transition hover:border-[#f5c542]/40 hover:text-[#f5c542] disabled:opacity-40 ${GLASS} ${FOCUS}`}
            >
              {loadingMore ? <Spinner size={3} /> : <ChevronDown className="h-4 w-4" />}
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </CommunityLayout>
  );
}