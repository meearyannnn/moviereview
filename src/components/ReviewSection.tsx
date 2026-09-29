// ReviewSection.tsx — Review system for MovieGuy with Supabase & MovieGuy Meter fluctuation
// Star rating, verdict picker, spoiler blur, likes, community sync
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Star, ThumbsUp, MessageCircle, Flag, ChevronDown, ChevronUp, Check, Pencil, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { communityReviewsService } from '@/services/communityReviews';
import { AuthModal } from '@/components/AuthModal';
import { toast } from 'sonner';
import type { TierKey } from '@/components/MovieGuyMeter';

// ─── Types ───────────────────────────────────────────────────────────────────
export type Verdict = 'Hard Pass' | 'Decent Watch' | 'Must Watch' | 'Absolute Cinema';

interface Review {
  id: string;
  author: string;
  avatar: string;
  date: string;
  ts?: number;             // epoch ms, used for "Newest"
  verdict: Verdict;
  stars: number;           // 0.5 – 5 in 0.5 steps
  text: string;
  likes: number;
  liked: boolean;
  spoiler: boolean;
  replies: number;
}

// ─── Verdict meta (matches the MovieGuy Meter colors) ────────────────────────
const tint = (color: string) => ({ bg: `${color}1a`, border: `${color}55` });

export const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; border: string }> = {
  'Hard Pass': { label: 'Hard Pass', color: '#ef4444', ...tint('#ef4444') },
  'Decent Watch': { label: 'Decent Watch', color: '#38bdf8', ...tint('#38bdf8') },
  'Must Watch': { label: 'Must Watch', color: '#10b981', ...tint('#10b981') },
  'Absolute Cinema': { label: 'Absolute Cinema', color: '#d946ef', bg: 'rgba(217, 70, 239, 0.16)', border: 'rgba(232, 121, 249, 0.55)' },
};
const VERDICTS = Object.keys(VERDICT_META) as Verdict[];

const VERDICT_TO_TIER: Record<Verdict, TierKey> = {
  'Hard Pass': 'hardPass',
  'Decent Watch': 'decentWatch',
  'Must Watch': 'mustWatch',
  'Absolute Cinema': 'absoluteCinema',
};

const TIER_TO_VERDICT: Record<TierKey, Verdict> = {
  hardPass: 'Hard Pass',
  decentWatch: 'Decent Watch',
  mustWatch: 'Must Watch',
  absoluteCinema: 'Absolute Cinema',
};

const OLD_VERDICT_MAP: Record<string, Verdict> = {
  'Perfection': 'Absolute Cinema',
  'Go for it': 'Must Watch',
  'Go For It': 'Must Watch',
  'Timepass': 'Decent Watch',
  'Skip': 'Hard Pass',
};

export function normalizeVerdict(val: any): Verdict {
  if (val && VERDICT_META[val as Verdict]) return val as Verdict;
  if (val && TIER_TO_VERDICT[val as TierKey]) return TIER_TO_VERDICT[val as TierKey];
  if (val && OLD_VERDICT_MAP[String(val)]) return OLD_VERDICT_MAP[String(val)];
  return 'Decent Watch';
}

const SAMPLE_REVIEWS: Review[] = [
  {
    id: 'sample-1', author: 'cinephile_sam', avatar: 'CS', date: '18 Sep 2026', ts: Date.UTC(2026, 8, 18),
    verdict: 'Absolute Cinema', stars: 5,
    text: 'An absolute tour de force. The cinematography is breathtaking, and the performances feel completely lived-in. This is cinema at its best — the kind of film that stays with you for weeks.',
    likes: 142, liked: false, spoiler: false, replies: 8,
  },
  {
    id: 'sample-2', author: 'reel_nerd', avatar: 'RN', date: '12 Sep 2026', ts: Date.UTC(2026, 8, 12),
    verdict: 'Must Watch', stars: 4,
    text: 'Really solid. The pacing in the second act drags a little, but the finale more than makes up for it. Strong writing throughout — recommended for any genre fan.',
    likes: 89, liked: false, spoiler: false, replies: 4,
  },
];

const storageKey = (mediaId: number, type: string) => `mg_reviews_${type}_${mediaId}`;

function loadLocalReviews(mediaId: number, type: string): Review[] {
  try {
    const raw = localStorage.getItem(storageKey(mediaId, type));
    if (raw) {
      const parsed: any[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((r) => ({ ...r, verdict: normalizeVerdict(r.verdict) }));
      }
    }
  } catch { }
  return SAMPLE_REVIEWS;
}

function saveLocalReviews(mediaId: number, type: string, reviews: Review[]) {
  try {
    localStorage.setItem(storageKey(mediaId, type), JSON.stringify(reviews));
  } catch { }
}

const likeCount = (r: Review) => r.likes + (r.liked ? 1 : 0);
const timeOf = (r: Review) => r.ts ?? (Number(r.id) || 0);

// ─── Stars ───────────────────────────────────────────────────────────────────
const StarGlyph: React.FC<{ fill: number; size: number }> = ({ fill, size }) => (
  <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
    <Star className="absolute inset-0 text-white/15" style={{ width: size, height: size }} />
    <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%` }}>
      <Star className="max-w-none fill-white text-white" style={{ width: size, height: size }} />
    </span>
  </span>
);

const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 13 }) => (
  <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <StarGlyph key={n} fill={value - (n - 1)} size={size} />
    ))}
  </span>
);

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3" role="group" aria-label="Star rating">
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="relative h-8 w-8">
            <StarGlyph fill={shown - (n - 1)} size={32} />
            <button
              type="button"
              aria-label={`${n - 0.5} stars`}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
              onMouseEnter={() => setHover(n - 0.5)}
              onClick={() => onChange(n - 0.5)}
            />
            <button
              type="button"
              aria-label={`${n} stars`}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange(n)}
            />
          </div>
        ))}
      </div>
      <span className="w-8 text-sm font-bold tabular-nums text-white/60">{shown > 0 ? shown.toFixed(1) : ''}</span>
    </div>
  );
};

// ─── Composer ────────────────────────────────────────────────────────────────
type Draft = Pick<Review, 'text' | 'stars' | 'verdict' | 'spoiler'>;

const WriteReview: React.FC<{
  title: string;
  onSubmit: (d: Draft) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}> = ({ title, onSubmit, onOpenAuth, isLoggedIn }) => {
  const [text, setText] = useState('');
  const [stars, setStars] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [spoiler, setSpoiler] = useState(false);
  const [posted, setPosted] = useState(false);
  const maxLen = 1000;
  const canPost = text.trim().length > 0 && stars > 0 && verdict !== null;

  const post = () => {
    if (!canPost || !verdict) return;
    onSubmit({ text: text.trim(), stars, verdict, spoiler });
    setPosted(true);
    setTimeout(() => {
      setText('');
      setStars(0);
      setVerdict(null);
      setSpoiler(false);
      setPosted(false);
    }, 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b0d13] p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
          <Pencil className="h-4 w-4 text-red-500" />
          <span>Write a Review</span>
        </h3>
        {!isLoggedIn && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 underline"
          >
            <UserIcon className="w-3.5 h-3.5" />
            Sign in to calibrate the MovieGuy Meter
          </button>
        )}
      </div>

      {/* Stars */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Rating</div>
        <StarPicker value={stars} onChange={setStars} />
      </div>

      {/* Verdict picker */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
          <span>Verdict</span>
          <span className="text-[10px] text-red-400 font-mono flex items-center gap-1 font-semibold">
            <Sparkles className="w-2.5 h-2.5" />
            Shifts MovieGuy Meter
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VERDICTS.map((v) => {
            const m = VERDICT_META[v];
            const active = verdict === v;
            const isAC = v === 'Absolute Cinema';

            if (isAC) {
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVerdict(v)}
                  className={`relative flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-black transition-all overflow-hidden ${
                    active
                      ? 'border-fuchsia-400 bg-gradient-to-r from-fuchsia-600/30 via-purple-600/25 to-pink-600/30 text-fuchsia-100 shadow-[0_0_22px_rgba(217,70,239,0.5)]'
                      : 'border-fuchsia-500/30 bg-fuchsia-500/[0.04] text-fuchsia-300/70 hover:border-fuchsia-400/60 hover:text-fuchsia-200'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-300 shadow-[0_0_8px_#d946ef] shrink-0" />
                  <span className={active ? 'bg-gradient-to-r from-pink-200 to-violet-300 bg-clip-text text-transparent' : ''}>
                    {m.label}
                  </span>
                  {active && <Sparkles className="w-3 h-3 text-fuchsia-300 shrink-0" />}
                </button>
              );
            }

            return (
              <button
                key={v}
                type="button"
                onClick={() => setVerdict(v)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                  active
                    ? 'border-white text-white shadow-lg'
                    : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
                }`}
                style={active ? { backgroundColor: m.bg, borderColor: m.color, color: m.color } : {}}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Textarea */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLen))}
          placeholder={`What did you think of ${title}? Share your honest take...`}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/85 outline-none transition-colors placeholder:text-white/25 focus:border-red-500/50"
        />
        <div className="mt-1 text-right text-[11px] tabular-nums text-white/30">{text.length}/{maxLen}</div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <SpoilerSwitch on={spoiler} onToggle={() => setSpoiler((s) => !s)} label="Contains spoilers" />
        <button
          type="button"
          onClick={post}
          disabled={!canPost && !posted}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
            posted
              ? 'bg-emerald-500 text-white'
              : canPost
              ? 'bg-[#dc2626] hover:bg-[#ef4444] text-white shadow-lg shadow-[#dc2626]/25'
              : 'cursor-not-allowed bg-white/[0.06] text-white/25'
          }`}
        >
          {posted ? (
            <>
              <Check className="h-4 w-4" /> Posted & Calibrated
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" /> Post Review
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const SpoilerSwitch: React.FC<{ on: boolean; onToggle: () => void; label: string }> = ({ on, onToggle, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onToggle}
    className="flex items-center gap-2.5 text-xs font-semibold text-white/55 hover:text-white/80 transition-colors focus-visible:outline rounded-full"
  >
    <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-[#dc2626]' : 'bg-white/15'}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </span>
    {label}
  </button>
);

// ─── Review Card ─────────────────────────────────────────────────────────────
const ReviewCard: React.FC<{ review: Review; revealAll: boolean; onLike: (id: string) => void }> = ({
  review,
  revealAll,
  onLike,
}) => {
  const normVerdict = normalizeVerdict(review.verdict);
  const meta = VERDICT_META[normVerdict];
  const isAC = normVerdict === 'Absolute Cinema';
  const [revealed, setRevealed] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const isLong = review.text.length > 260;
  const hidden = review.spoiler && !revealed && !revealAll;

  return (
    <article className="py-5 first:pt-2 last:pb-2">
      <div className="flex items-start gap-3.5">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black border ${
            isAC
              ? 'border-fuchsia-400/80 bg-gradient-to-br from-fuchsia-600/25 to-purple-950/40 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.35)]'
              : 'bg-white/[0.07] text-white'
          }`}
          style={!isAC ? { borderColor: `${meta.color}66` } : {}}
        >
          {review.avatar || review.author.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white text-sm">{review.author}</span>
            <span className="text-white/30 text-xs">•</span>
            <span className="text-white/40 text-xs">{review.date}</span>
            {isAC ? (
              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border border-fuchsia-400/50 bg-gradient-to-r from-fuchsia-600/25 via-purple-600/15 to-pink-600/20 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.35)]">
                <Sparkles className="w-2.5 h-2.5 text-fuchsia-300" />
                <span className="bg-gradient-to-r from-pink-200 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
                  Absolute Cinema
                </span>
              </span>
            ) : (
              <span
                className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold border"
                style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}
              >
                {meta.label}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <Stars value={review.stars} size={12} />
            <span className="text-xs font-bold text-white/70">{review.stars.toFixed(1)}</span>
          </div>

          {/* Review Text */}
          <div className="mt-2.5">
            {hidden ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200 flex items-center justify-between">
                <span>⚠️ This review contains spoilers.</span>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="font-bold underline text-white hover:text-red-300"
                >
                  Reveal
                </button>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-white/80 whitespace-pre-line">
                {isLong && !showFull ? `${review.text.slice(0, 260)}...` : review.text}
              </p>
            )}
          </div>

          {!hidden && isLong && (
            <button
              type="button"
              onClick={() => setShowFull((s) => !s)}
              className="mt-1.5 flex items-center gap-0.5 text-xs font-semibold text-white/50 hover:text-white"
            >
              {showFull ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Read more</>}
            </button>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-5">
            <button
              type="button"
              onClick={() => onLike(review.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold tabular-nums transition-colors ${
                review.liked ? 'text-red-500' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${review.liked ? 'fill-red-500' : ''}`} />
              {likeCount(review)}
            </button>
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <MessageCircle className="h-3.5 w-3.5" />
              {review.replies}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─── Main Export ─────────────────────────────────────────────────────────────
type SortMode = 'top' | 'recent' | 'critical';
const SORTS: { id: SortMode; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'recent', label: 'Newest' },
  { id: 'critical', label: 'Critical' },
];

interface ReviewSectionProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ mediaId, mediaType, title }) => {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(() => loadLocalReviews(mediaId, mediaType));
  const [sort, setSort] = useState<SortMode>('top');
  const [revealAll, setRevealAll] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Fetch reviews from Supabase
  useEffect(() => {
    let mounted = true;
    communityReviewsService.getReviews(mediaId, mediaType, user?.id).then((cloudReviews) => {
      if (!mounted) return;
      if (cloudReviews.length > 0) {
        const formatted: Review[] = cloudReviews.map((cr) => ({
          id: cr.id,
          author: cr.username,
          avatar: cr.avatar_url ? '' : cr.username.slice(0, 2).toUpperCase(),
          date: new Date(cr.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          ts: new Date(cr.created_at).getTime(),
          verdict: TIER_TO_VERDICT[cr.verdict] || 'Decent Watch',
          stars: cr.rating,
          text: cr.review_text || '',
          likes: cr.likes,
          liked: !!cr.liked_by_user,
          spoiler: cr.spoiler,
          replies: 0,
        }));
        setReviews(formatted);
      }
    });

    return () => {
      mounted = false;
    };
  }, [mediaId, mediaType, user?.id]);

  useEffect(() => {
    saveLocalReviews(mediaId, mediaType, reviews);
  }, [reviews, mediaId, mediaType]);

  const handleSubmit = useCallback(
    async (draft: Draft) => {
      const now = Date.now();
      const currentAuthor = profile?.username || user?.email?.split('@')[0] || 'You';
      const newReview: Review = {
        ...draft,
        id: `local-${now}`,
        ts: now,
        author: currentAuthor,
        avatar: currentAuthor.slice(0, 2).toUpperCase(),
        date: new Date(now).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        likes: 0,
        liked: false,
        replies: 0,
      };

      setReviews((prev) => [newReview, ...prev]);

      if (user) {
        try {
          const tier = VERDICT_TO_TIER[draft.verdict];
          const result = await communityReviewsService.submitReview({
            userId: user.id,
            mediaId,
            mediaType,
            rating: draft.stars,
            verdict: tier,
            reviewText: draft.text,
            spoiler: draft.spoiler,
          });

          if (result.success) {
            // Signal MovieGuyMeter to recalculate live
            window.dispatchEvent(new Event('movieguy_community_review_updated'));
            toast.success('Your verdict shifted the MovieGuy Meter! 🎬');
          } else {
            toast.error(result.error || 'Failed to sync review');
          }
        } catch (e) {
          console.error('Supabase review error:', e);
        }
      } else {
        toast.info('Review saved locally! Sign in anytime to sync to the global consensus.');
        // Still dispatch local update so the meter shifts in current session
        window.dispatchEvent(new Event('movieguy_community_review_updated'));
      }
    },
    [user, profile, mediaId, mediaType]
  );

  const handleLike = useCallback(
    (id: string) => {
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const newLiked = !r.liked;
            if (user && !id.startsWith('local-') && !id.startsWith('sample-')) {
              communityReviewsService.toggleLike(id, user.id, r.liked);
            }
            return { ...r, liked: newLiked, likes: r.likes + (newLiked ? 1 : -1) };
          }
          return r;
        })
      );
    },
    [user]
  );

  const list = useMemo(() => {
    const l = sort === 'critical' ? reviews.filter((r) => r.stars <= 3) : [...reviews];
    l.sort(sort === 'recent' ? (a, b) => timeOf(b) - timeOf(a) : (a, b) => likeCount(b) - likeCount(a));
    return l;
  }, [reviews, sort]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;

  return (
    <section id="reviews-section" className="w-full max-w-full min-w-0 space-y-10">
      <WriteReview
        title={title}
        onSubmit={handleSubmit}
        onOpenAuth={() => setShowAuthModal(true)}
        isLoggedIn={!!user}
      />

      <div>
        {/* List header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold text-white">Community Reviews</h2>
            <span className="text-sm text-white/40 tabular-nums">{reviews.length}</span>
            {reviews.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Stars value={avg} size={12} />
                <span className="text-sm font-bold tabular-nums text-white/80">{avg.toFixed(1)}</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5" role="tablist">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={sort === s.id}
                  onClick={() => setSort(s.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    sort === s.id ? 'bg-white text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <SpoilerSwitch on={revealAll} onToggle={() => setRevealAll((s) => !s)} label="Show spoilers" />
          </div>
        </div>

        {/* List */}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b0d13] py-12 text-center text-sm text-white/40">
            No reviews yet. Be the first to review <span className="font-semibold text-white/70">{title}</span> and shift the meter!
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#0b0d13] px-5 py-4 sm:px-6">
            {list.map((r) => (
              <ReviewCard key={r.id} review={r} revealAll={revealAll} onLike={handleLike} />
            ))}
          </div>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
};