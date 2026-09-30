// ─── Shared community UI utilities ────────────────────────────────────────────
import type { PostCategory } from '@/services/community';

export const CATEGORIES: { key: PostCategory; label: string; color: string; dot: string }[] = [
  { key: 'general',        label: 'General',        color: 'bg-white/10 text-white/70',      dot: 'bg-white/40' },
  { key: 'review',         label: 'Review',         color: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  { key: 'discussion',     label: 'Discussion',     color: 'bg-blue-500/20 text-blue-400',   dot: 'bg-blue-400' },
  { key: 'recommendation', label: 'Recommendation', color: 'bg-green-500/20 text-green-400', dot: 'bg-green-400' },
  { key: 'news',           label: 'News',           color: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-400' },
];

export const categoryMeta = (cat: PostCategory) =>
  CATEGORIES.find((c) => c.key === cat) ?? CATEGORIES[0];

export function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function Avatar({
  username,
  url,
  size = 9,
}: {
  username: string;
  url?: string;
  size?: number;
}) {
  const px = size * 4;
  const fs = size * 1.6;
  const cls = 'shrink-0 rounded-full bg-gradient-to-br from-red-700 to-red-950 object-cover';
  return url ? (
    <img src={url} alt={username} className={cls} style={{ width: px, height: px }} />
  ) : (
    <span
      className={`${cls} grid place-items-center font-bold text-white`}
      style={{ width: px, height: px, fontSize: fs }}
    >
      {username.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function Spinner({ size = 4 }: { size?: number }) {
  const width = Math.max(size * 5.5, 18);
  const height = width * 0.46;
  return (
    <img
      src="/assets/branding/ticket-loader.png"
      alt="Loading"
      className="inline-block object-contain animate-pulse drop-shadow-[0_0_8px_rgba(245,197,66,0.6)]"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
