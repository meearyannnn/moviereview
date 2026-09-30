import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Film, Globe, Play, Tv, X, ZoomIn } from 'lucide-react';
import type { CommunityPost } from '@/services/community';

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function getVimeoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:vimeo\.com\/)(\d+)/;
  const match = url.match(regExp);
  return match && match[1] ? `https://player.vimeo.com/video/${match[1]}` : null;
}

export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
}

export function PostMediaRenderer({ post }: { post: CommunityPost }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const youtubeEmbed = post.video_url ? getYouTubeEmbedUrl(post.video_url) : null;
  const vimeoEmbed = post.video_url ? getVimeoEmbedUrl(post.video_url) : null;

  return (
    <div className="mt-3 space-y-3">
      {/* ── Movie / TV TMDB card ── */}
      {post.media_title && (
        <Link
          to={`/${post.media_type ?? 'movie'}/${post.media_id}`}
          className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors hover:border-white/20 group"
        >
          {post.media_poster && (
            <img
              src={`https://image.tmdb.org/t/p/w92${post.media_poster}`}
              alt=""
              className="h-12 w-8 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
              {post.media_title}
            </p>
            <p className="flex items-center gap-1 text-xs text-white/35">
              {post.media_type === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
              {post.media_type === 'tv' ? 'TV Show' : 'Movie'}
            </p>
          </div>
        </Link>
      )}

      {/* ── Attached Image ── */}
      {post.image_url && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 group">
          <img
            src={post.image_url}
            alt="Attachment"
            loading="lazy"
            className="w-full max-h-[480px] object-contain rounded-2xl cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
            onClick={() => setLightboxOpen(true)}
          />
          <button
            onClick={() => setLightboxOpen(true)}
            aria-label="View full image"
            className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span>Expand</span>
          </button>
        </div>
      )}

      {/* ── Lightbox Modal ── */}
      {lightboxOpen && post.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={post.image_url}
            alt="Full size attachment"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Attached Video (YouTube / Vimeo / HTML5 Video) ── */}
      {post.video_url && (
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50">
          {youtubeEmbed ? (
            <div className="relative aspect-video w-full">
              <iframe
                src={youtubeEmbed}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full rounded-2xl"
              />
            </div>
          ) : vimeoEmbed ? (
            <div className="relative aspect-video w-full">
              <iframe
                src={vimeoEmbed}
                title="Vimeo video"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full rounded-2xl"
              />
            </div>
          ) : (
            <video
              src={post.video_url}
              controls
              preload="metadata"
              className="w-full max-h-[460px] rounded-2xl bg-black"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}

      {/* ── Attached Link ── */}
      {post.link_url && (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 hover:border-red-500/40 hover:bg-white/[0.04] transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 group-hover:text-red-400 transition-colors">
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white group-hover:text-red-300 transition-colors">
                {post.link_title || post.link_url}
              </p>
              <p className="text-xs text-white/40">{getDomain(post.link_url)}</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-white/30 group-hover:text-white transition-colors" />
        </a>
      )}
    </div>
  );
}
