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
  name,
  url,
  src,
  size = 8,
  className = '',
}: {
  username?: string;
  name?: string;
  url?: string;
  src?: string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const displayName = username || name || 'User';
  const initial = (displayName ? displayName.trim().slice(0, 1) : 'U').toUpperCase();
  const avatarSrc = url || src;

  let px = 32;
  if (typeof size === 'number') {
    px = size * 4;
  } else if (size === 'xs') px = 20;
  else if (size === 'sm') px = 28;
  else if (size === 'md') px = 36;
  else if (size === 'lg') px = 48;
  else if (size === 'xl') px = 64;

  const fs = Math.max(Math.round(px * 0.4), 10);
  const cls = `shrink-0 rounded-full bg-gradient-to-br from-[#c9a24b] to-[#140a0d] border border-white/10 object-cover ${className}`;

  return avatarSrc ? (
    <img
      src={avatarSrc}
      alt={displayName}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
      className={cls}
      style={{ width: px, height: px }}
    />
  ) : (
    <span
      className={`${cls} grid place-items-center font-bold text-white select-none`}
      style={{ width: px, height: px, fontSize: fs }}
    >
      {initial}
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
