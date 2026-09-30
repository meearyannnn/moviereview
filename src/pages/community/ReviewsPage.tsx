import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film, Tv, Filter, ChevronDown } from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, timeAgo, Spinner } from '@/components/community/communityUtils';
import { communityService, type CommunityPost } from '@/services/community';
import { useAuth } from '@/contexts/AuthContext';

const VERDICT_FILTERS = [
  { key: 'all', label: 'All Verdicts', cls: 'border-white/20 bg-white/10 text-white' },
  { key: 'absoluteCinema', label: 'Absolute Cinema', cls: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-400' },
  { key: 'mustWatch', label: 'Must Watch', cls: 'border-green-500/30 bg-green-500/15 text-green-400' },
  { key: 'decentWatch', label: 'Decent Watch', cls: 'border-blue-500/30 bg-blue-500/15 text-blue-400' },
  { key: 'hardPass', label: 'Hard Pass', cls: 'border-red-500/30 bg-red-500/15 text-red-400' },
];

function StarRating({ likes }: { likes: number }) {
  const score = Math.min(5, Math.max(1, Math.round(likes / 2) + 1));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3 w-3 ${i < score ? 'fill-amber-400 text-amber-400' : 'text-white/15'}`} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all');
  const PAGE = 30;

  const load = async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const offset = reset ? 0 : reviews.length;
    const data = await communityService.getGlobalFeed(user?.id ?? null, PAGE, offset, 'review');

    setHasMore(data.length === PAGE);
    if (reset) setReviews(data);
    else setReviews((prev) => [...prev, ...data]);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => { load(true); }, [user]);

  const displayed = reviews; // verdict filter would need a verdict field on community_posts (currently on reviews table)

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-white/45">Community takes — unfiltered and uncensored.</p>
      </div>

      {/* Filter row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-white/30" />
        {VERDICT_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-all ${filter === f.key ? f.cls : 'border-transparent text-white/30 hover:text-white/60'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/60 py-24 text-center">
          <Star className="mx-auto mb-3 h-8 w-8 text-[#c9a24b]/30" />
          <p className="font-semibold text-white/50">No reviews yet</p>
          <p className="mt-1 text-sm text-white/35">
            Post a review from the{' '}
            <Link to="/community" className="text-[#f5c542] hover:underline">Feed</Link>{' '}
            or from any movie/show page.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayed.map((r) => (
            <article key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/85 transition-all hover:border-[#c9a24b]/45 shadow-md">
              {/* Movie poster banner */}
              {r.media_poster ? (
                <Link to={`/${r.media_type ?? 'movie'}/${r.media_id}`} className="relative block h-40 overflow-hidden">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${r.media_poster}`}
                    alt={r.media_title ?? ''}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0608] via-[#0a0608]/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="truncate font-bold text-sm text-white drop-shadow">{r.media_title}</p>
                    <p className="flex items-center gap-1 text-xs text-white/60">
                      {r.media_type === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                      {r.media_type === 'tv' ? 'TV Show' : 'Movie'}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-t-2xl bg-gradient-to-br from-[#1a0f14] to-[#0a0608]">
                  <Film className="h-8 w-8 text-white/15" />
                </div>
              )}

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                <StarRating likes={r.likes_count} />
                <p className="mt-2 text-sm leading-relaxed text-white/70 line-clamp-3">{r.content}</p>
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-white/[0.05]">
                  <Link to={`/community/user/${r.user_id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar username={r.username} url={r.avatar_url} size={6} />
                    <span className="text-xs font-semibold text-white/65">{r.username}</span>
                  </Link>
                  <span className="text-[11px] text-white/25">{timeAgo(r.created_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && displayed.length > 0 && (
        <div className="mt-6 flex justify-center">
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
