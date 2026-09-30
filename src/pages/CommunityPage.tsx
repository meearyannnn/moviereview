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
    <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
      {loading ? (
        <div className="flex justify-center py-3"><Spinner /></div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-center text-xs text-white/25">No comments yet. Be first!</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar username={c.username ?? 'U'} url={c.avatar_url} size={7} />
            <div className="flex-1 rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
              <span className="mr-2 font-semibold text-white/90">{c.username}</span>
              <span className="text-white/65">{c.content}</span>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-white/25">
                <span>{timeAgo(c.created_at)}</span>
                {user?.id === c.user_id && (
                  <button
                    onClick={async () => {
                      const ok = await communityService.deleteComment(c.id, user.id);
                      if (ok) setComments((p) => p.filter((x) => x.id !== c.id));
                    }}
                    className="hover:text-red-400 transition-colors"
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
          <div className="flex flex-1 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Add a comment…"
              className="flex-1 bg-transparent py-2 text-sm text-white placeholder-white/25 focus:outline-none"
            />
            <button onClick={submit} disabled={!text.trim() || busy} className="shrink-0 text-white/30 hover:text-white transition-colors disabled:opacity-30">
              {busy ? <Spinner size={3} /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hero Post (Musifall-style featured card) ─────────────────────────────────

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
    <article className="overflow-hidden rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/90 shadow-xl">
      <div className={`flex ${hasPoster ? 'flex-row' : 'flex-col'}`}>
        {/* Movie poster (left column if available) */}
        {hasPoster && (
          <Link
            to={`/${post.media_type ?? 'movie'}/${post.media_id}`}
            className="relative shrink-0 overflow-hidden"
            style={{ width: 160 }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w342${post.media_poster}`}
              alt={post.media_title ?? ''}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              style={{ minHeight: 220 }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0608]/70" />
          </Link>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between p-5">
          {/* Category + timestamp */}
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.color}`}>
              {meta.label}
            </span>
            {post.media_title && (
              <Link
                to={`/${post.media_type ?? 'movie'}/${post.media_id}`}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {post.media_type === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                <span className="truncate max-w-[140px]">{post.media_title}</span>
              </Link>
            )}
          </div>

          {/* Post text */}
          <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-white/85 line-clamp-4">
            {post.content}
          </p>

          <PostMediaRenderer post={post} />

          {/* Author + actions */}
          <div className="mt-4 flex items-center justify-between">
            <Link to={`/community/user/${post.user_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar username={post.username} url={post.avatar_url} size={7} />
              <div>
                <p className="text-xs font-semibold text-white">{post.username}</p>
                <p className="text-[11px] text-white/35">{timeAgo(post.created_at)}</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-[#f5c542]' : 'text-white/35 hover:text-white/70'}`}>
                <Heart className={`h-4 w-4 ${liked ? 'fill-[#f5c542] text-[#f5c542]' : ''}`} />
                {likes}
              </button>
              <button onClick={() => setShowComments((v) => !v)} className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-white' : 'text-white/35 hover:text-white/70'}`}>
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </button>
              {currentUserId === post.user_id && (
                <button onClick={async () => {
                  const ok = await communityService.deletePost(post.id, currentUserId!);
                  if (ok) onDelete(post.id); else toast.error('Failed to delete');
                }} className="text-white/20 hover:text-red-400 transition-colors">
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
    <article className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/80 p-4 transition-all hover:border-[#c9a24b]/40 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link to={`/community/user/${post.user_id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <Avatar username={post.username} url={post.avatar_url} size={9} />
          <div>
            <p className="text-sm font-semibold text-white">{post.username}</p>
            <p className="text-xs text-white/35">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.color}`}>
            {meta.label}
          </span>
          {currentUserId === post.user_id && (
            <div className="relative">
              <button onClick={() => setShowMenu((v) => !v)} className="grid h-7 w-7 place-items-center rounded-full text-white/25 hover:bg-white/[0.06] hover:text-white transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-white/10 bg-[#0c0f1a] py-1 shadow-xl">
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      const ok = await communityService.deletePost(post.id, currentUserId!);
                      if (ok) onDelete(post.id); else toast.error('Failed to delete');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80 line-clamp-5">{post.content}</p>

      {/* Media & Attachments */}
      <PostMediaRenderer post={post} />

      {/* Actions */}
      <div className="mt-3 flex items-center gap-5">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-[#f5c542]' : 'text-white/35 hover:text-white/70'}`}>
          <Heart className={`h-4 w-4 ${liked ? 'fill-[#f5c542] text-[#f5c542]' : ''}`} />
          <span className="tabular-nums">{likes}</span>
        </button>
        <button onClick={() => setShowComments((v) => !v)} className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-white' : 'text-white/35 hover:text-white/70'}`}>
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{post.comments_count}</span>
        </button>
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
      {/* Feed toggle + category chips */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-full border border-[#c9a24b]/30 bg-[#140c10] p-1 self-start shadow-md">
          {[
            { key: 'for-you', label: 'For You', Icon: Sparkles, needsAuth: true },
            { key: 'global', label: 'Discover', Icon: Globe, needsAuth: false },
          ].map(({ key, label, Icon, needsAuth }) => (
            <button
              key={key}
              onClick={() => {
                if (needsAuth && !user) { toast.info('Sign in to see your personalized feed'); return; }
                setSearchParams({ feed: key });
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${feedType === key ? 'bg-[#f5c542] text-[#1c120c] shadow-md shadow-[#f5c542]/20' : 'text-white/45 hover:text-white'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilterCat('all')} className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${filterCat === 'all' ? 'bg-[#c9a24b]/20 text-[#f5c542] border border-[#c9a24b]/40' : 'text-white/30 hover:text-white/60'}`}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setFilterCat(c.key)} className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${filterCat === c.key ? c.color + ' ring-1 ring-white/20' : 'text-white/30 hover:text-white/60'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      {user && <ComposePostBox onPost={handleNewPost} />}
      {!user && (
        <div className="mb-5 rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/80 px-5 py-6 text-center shadow-lg">
          <Pen className="mx-auto mb-2 h-5 w-5 text-[#c9a24b]" />
          <p className="text-sm font-bold text-white">Join the conversation</p>
          <p className="mt-1 text-xs text-white/50">Sign in to post, like, and follow fellow cinephiles.</p>
        </div>
      )}

      {/* New post banner */}
      {newPostBanner && (
        <button
          onClick={() => { setNewPostBanner(false); loadPosts(true); }}
          className="mb-4 w-full rounded-xl bg-[#c9a24b]/15 border border-[#c9a24b]/40 py-2.5 text-sm font-bold text-[#f5c542] hover:bg-[#c9a24b]/25 transition-colors shadow-lg"
        >
          ↑ New posts — click to refresh
        </button>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`animate-pulse rounded-2xl bg-white/[0.04] ${i === 0 ? 'h-52' : 'h-36'}`} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] py-20 text-center">
          <Globe className="mx-auto mb-3 h-8 w-8 text-white/15" />
          <p className="font-semibold text-white/50">
            {feedType === 'for-you' ? 'Follow people to see their posts here.' : 'No posts yet. Be the first!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Hero card — Musifall style */}
          {heroPost && <HeroPost post={heroPost} currentUserId={user?.id} onDelete={handleDelete} />}
          {/* Regular cards */}
          {restPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && displayed.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => loadPosts(false)}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] px-6 py-2.5 text-sm font-medium text-white/50 hover:border-white/20 hover:text-white transition-colors disabled:opacity-40"
          >
            {loadingMore ? <Spinner size={3} /> : <ChevronDown className="h-4 w-4" />}
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </CommunityLayout>
  );
}
