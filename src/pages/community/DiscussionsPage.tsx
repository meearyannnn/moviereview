import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Flame, Clock, BarChart2, Send, ChevronDown, Pen } from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, timeAgo, categoryMeta, Spinner } from '@/components/community/communityUtils';
import { communityService, type CommunityPost } from '@/services/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type SortKey = 'new' | 'top' | 'hot';

function sortPosts(posts: CommunityPost[], sort: SortKey): CommunityPost[] {
  switch (sort) {
    case 'top': return [...posts].sort((a, b) => b.likes_count - a.likes_count);
    case 'hot': return [...posts].sort((a, b) => (b.likes_count * 2 + b.comments_count) - (a.likes_count * 2 + a.comments_count));
    case 'new': default: return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

import { ComposePostBox } from '@/components/community/ComposePostBox';
import { PostMediaRenderer } from '@/components/community/PostMediaRenderer';

export default function DiscussionsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('hot');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE = 20;

  const load = useCallback(async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const offset = reset ? 0 : posts.length;
    const data = await communityService.getGlobalFeed(user?.id ?? null, PAGE, offset, ['discussion', 'general']);

    setHasMore(data.length === PAGE);
    if (reset) setPosts(data);
    else setPosts((prev) => [...prev, ...data]);
    setLoading(false);
    setLoadingMore(false);
  }, [user, posts.length]);

  useEffect(() => { load(true); }, [user]);

  const handleNewPost = (post: CommunityPost) => setPosts((p) => [post, ...p]);
  const handleDelete = (id: string) => setPosts((p) => p.filter((x) => x.id !== id));

  const displayed = sortPosts(posts, sort);

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Discussions</h1>
        <p className="mt-1 text-sm text-white/45">Real conversations from real cinephiles.</p>
      </div>

      {/* Sort tabs */}
      <div className="mb-5 flex items-center gap-1 rounded-full border border-[#c9a24b]/30 bg-[#140c10] p-1 self-start w-fit shadow-md">
        {([
          { key: 'hot' as SortKey, label: 'Hot', Icon: Flame },
          { key: 'new' as SortKey, label: 'New', Icon: Clock },
          { key: 'top' as SortKey, label: 'Top', Icon: BarChart2 },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-all ${sort === key ? 'bg-[#f5c542] text-[#1c120c] shadow-md shadow-[#f5c542]/20' : 'text-white/40 hover:text-white'}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Compose */}
      <ComposePostBox
        onPost={handleNewPost}
        defaultCategory="discussion"
        lockCategory
        placeholder="Start a discussion — ask a question, share a take, attach an image, video, or link…"
      />

      {/* Thread list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/60 py-20 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[#c9a24b]/30" />
          <p className="font-semibold text-white/50">No discussions yet</p>
          <p className="mt-1 text-sm text-white/30">Start the first one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((post) => {
            const meta = categoryMeta(post.category);
            return (
              <article
                key={post.id}
                className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/85 p-4 transition-all hover:border-[#c9a24b]/40 shadow-sm"
              >
                <div className="flex gap-3">
                  <Link to={`/community/user/${post.user_id}`}>
                    <Avatar username={post.username} url={post.avatar_url} size={9} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Link to={`/community/user/${post.user_id}`} className="text-sm font-semibold text-white hover:text-[#f5c542] transition-colors">
                        {post.username}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-white/25">{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="text-sm text-white/75 line-clamp-3 leading-relaxed">{post.content}</p>

                    {/* Media & Attachments */}
                    <PostMediaRenderer post={post} />
                    <div className="mt-2 flex items-center gap-4 text-xs text-white/30">
                      <span className="flex items-center gap-1">❤️ {post.likes_count}</span>
                      <span className="flex items-center gap-1">💬 {post.comments_count} replies</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasMore && !loading && displayed.length > 0 && (
        <div className="mt-5 flex justify-center">
          <button onClick={() => load(false)} disabled={loadingMore}
            className="flex items-center gap-2 rounded-full border border-white/[0.08] px-6 py-2.5 text-sm text-white/50 hover:border-white/20 hover:text-white transition-colors disabled:opacity-40">
            {loadingMore ? <Spinner size={3} /> : <ChevronDown className="h-4 w-4" />}
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </CommunityLayout>
  );
}
