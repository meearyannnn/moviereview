// src/pages/community/NewsPage.tsx — Glassmorphic cinephile news stream
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Clock, Check, Flame, Heart, Zap, RefreshCw, Newspaper, ArrowUpRight } from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { cinemaNewsService, type CinemaNewsItem } from '@/services/cinemaNews';
import { toast } from 'sonner';

type Reaction = 'fire' | 'hyped' | 'shocked';

const REACTIONS = [
  { key: 'fire' as Reaction, label: 'Fire', icon: Flame, base: 40 },
  { key: 'hyped' as Reaction, label: 'Hyped', icon: Heart, base: 65 },
  { key: 'shocked' as Reaction, label: 'Shocked', icon: Zap, base: 12 },
];

// Names and titles shown in bold inside story text (longest first so "Doctor Doom" wins over "Doom")
const BOLD_TERMS = [
  'Joe Russo & Anthony Russo',
  'THE FURTHER MIS-ADVENTURES OF CLIFF BOOTH',
  'Once Upon a Time... in Hollywood',
  'Avengers: Endgame Encore',
  'Paramount-Warner Bros.',
  'blackmail and extortion',
  'Severance Season 2',
  'The Batman Part II',
  'Robert Downey Jr.',
  'Quentin Tarantino',
  'Christopher Nolan',
  'Dune: Prophecy',
  'Doctor Doom',
  'Mark Ruffalo',
  'Matt Reeves',
  'Ben Stiller',
  'Brad Pitt',
  'Iron Man',
  'studio fixer',
  'L.A. noir',
  'Doom',
];

const BOLD_REGEX = new RegExp(
  `(${BOLD_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'gi'
);

const renderFormattedText = (text: string) =>
  text.split(BOLD_REGEX).map((part, i) =>
    BOLD_TERMS.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <strong key={i} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );

// Shared glass recipe: frosted fill, hairline edge, light catching the top edge
const GLASS =
  'border border-white/[0.1] bg-white/[0.045] backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)]';

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<CinemaNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeStory, setActiveStory] = useState<CinemaNewsItem | null>(null);
  const [reactions, setReactions] = useState<Record<string, Partial<Record<Reaction, number>>>>({});

  const fetchNews = async () => {
    setLoading(true);
    setFailed(false);
    try {
      setNews(await cinemaNewsService.getNews('all'));
    } catch {
      setFailed(true);
      toast.error('Could not load the news. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Close the reader with Escape, and lock page scroll while it is open
  useEffect(() => {
    if (!activeStory) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActiveStory(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeStory]);

  const react = (id: string, type: Reaction) =>
    setReactions((prev) => ({ ...prev, [id]: { ...prev[id], [type]: (prev[id]?.[type] || 0) + 1 } }));

  const cleanTag = (s: string) => (s || '').replace(/[^\p{L}\p{N}\s&'-]/gu, '').trim();

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/placeholder.svg';
  };

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="relative isolate">
        {/* Ambient light the glass refracts */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#f5c542]/[0.10] blur-[110px]" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-[#9b1c3c]/[0.20] blur-[130px]" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-[#5b2a86]/[0.14] blur-[120px]" />
        </div>

        <div className="mx-auto max-w-2xl space-y-8 pb-16">
          {loading && news.length === 0 ? (
            <div className="space-y-8" aria-busy="true" aria-label="Loading stories">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`overflow-hidden rounded-[28px] ${GLASS}`}>
                  <div className="aspect-video w-full animate-pulse bg-white/[0.05]" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/[0.07]" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.05]" />
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/[0.05]" />
                  </div>
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className={`rounded-[28px] px-6 py-16 text-center ${GLASS}`}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                <Newspaper className="h-6 w-6 text-[#f5c542]/80" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-white/85">{failed ? "The news didn't load." : 'No stories yet.'}</p>
              <p className="mt-1 text-sm text-white/45">
                {failed ? 'Check your connection and try again.' : 'New stories will appear here.'}
              </p>
              <button
                onClick={fetchNews}
                className={`mt-6 inline-flex items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-semibold text-[#1c120c] transition hover:bg-[#ffd25e] ${FOCUS}`}
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2} />
                Try again
              </button>
            </div>
          ) : (
            news.map((item) => (
              <article
                key={item.id}
                className={`group relative overflow-hidden rounded-[28px] transition duration-300 hover:border-white/20 hover:bg-white/[0.06] ${GLASS}`}
              >
                {/* Cover */}
                <button
                  onClick={() => setActiveStory(item)}
                  aria-label={`Read story: ${item.title}`}
                  className={`relative block aspect-video w-full overflow-hidden bg-black/60 ${FOCUS}`}
                >
                  <img
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={onImgError}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e]/80 via-transparent to-transparent" />
                  {item.scoopType && (
                    <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-medium text-[#f5c542] backdrop-blur-md">
                      {cleanTag(item.scoopType)}
                    </span>
                  )}
                </button>

                {/* Body */}
                <div className="space-y-4 p-6">
                  <div className="space-y-2">
                    <h2
                      onClick={() => setActiveStory(item)}
                      className="cursor-pointer font-display text-xl font-bold leading-snug text-white transition group-hover:text-[#f5c542]"
                    >
                      {item.title}
                    </h2>
                    <p
                      onClick={() => setActiveStory(item)}
                      className="cursor-pointer text-[15px] leading-relaxed text-white/70"
                    >
                      {renderFormattedText(item.description)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-white/50">
                      <span className="truncate font-medium text-white/70">
                        {item.author || 'MovieGuy Official'}
                      </span>
                      <span aria-hidden className="text-white/25">
                        •
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Clock className="h-3 w-3" strokeWidth={1.75} />
                        {item.readTime || '1 hr'}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setActiveStory(item)}
                        aria-label="Read story and discuss"
                        className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:border-[#f5c542]/40 hover:text-[#f5c542] ${FOCUS}`}
                      >
                        <MessageCircle className="h-[17px] w-[17px]" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => setActiveStory(item)}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-white/85 transition hover:border-[#f5c542]/50 hover:bg-[#f5c542]/10 hover:text-[#f5c542] ${FOCUS}`}
                      >
                        Read story
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Reader */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-xl sm:items-center sm:p-4"
          onClick={() => setActiveStory(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeStory.title}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-[32px] border border-white/[0.12] bg-[#140a0e]/80 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-2xl sm:rounded-[32px]"
          >
            {/* Cover */}
            <div className="relative h-56 sm:h-72">
              <img
                src={activeStory.thumbnail}
                alt=""
                decoding="async"
                onError={onImgError}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] via-[#140a0e]/20 to-transparent" />
              <button
                onClick={() => setActiveStory(null)}
                aria-label="Close"
                className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/85 backdrop-blur-md transition hover:bg-black/60 hover:text-white ${FOCUS}`}
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
              {activeStory.scoopType && (
                <span className="absolute bottom-4 left-6 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-medium text-[#f5c542] backdrop-blur-md">
                  {cleanTag(activeStory.scoopType)}
                </span>
              )}
            </div>

            <div className="space-y-7 px-6 pb-8 pt-3 sm:px-9">
              {/* Title + meta */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold leading-snug sm:text-[28px]">{activeStory.title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                  <span className="font-medium text-white/75">{activeStory.author}</span>
                  <span aria-hidden className="text-white/25">
                    •
                  </span>
                  <span>
                    {new Date(activeStory.pubDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span aria-hidden className="text-white/25">
                    •
                  </span>
                  <span>{activeStory.readTime}</span>
                </div>
              </div>

              {/* Article */}
              <div className="space-y-5 leading-relaxed">
                <p className="text-[17px] font-medium leading-relaxed text-white/95">
                  {activeStory.fullBlog.leadParagraph}
                </p>
                <p className="text-[15px] text-white/70">{activeStory.fullBlog.deepDiveParagraph}</p>

                <blockquote className="rounded-2xl border border-[#f5c542]/20 bg-[#f5c542]/[0.06] p-5 backdrop-blur-md">
                  <p className="text-[15px] italic text-white/90">{activeStory.fullBlog.insiderTakeParagraph}</p>
                  <footer className="mt-3 text-xs font-medium text-[#f5c542]">MovieGuy's take</footer>
                </blockquote>

                <p className="text-[15px] text-white/70">{activeStory.fullBlog.whatToExpectParagraph}</p>
              </div>

              {/* Takeaways */}
              <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
                <h3 className="text-sm font-semibold text-white/90">Key takeaways</h3>
                <ul className="space-y-2.5">
                  {activeStory.fullBlog.keyTakeaways.map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5c542]/15">
                        <Check className="h-3 w-3 text-[#f5c542]" strokeWidth={2.5} />
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
                <div className="flex gap-2">
                  {REACTIONS.map(({ key, label, icon: Icon, base }) => {
                    const count = (activeStory.reactionCount?.[key] || base) + (reactions[activeStory.id]?.[key] || 0);
                    const active = !!reactions[activeStory.id]?.[key];
                    return (
                      <button
                        key={key}
                        onClick={() => react(activeStory.id, key)}
                        aria-label={`${label}, ${count}`}
                        aria-pressed={active}
                        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition active:scale-95 ${FOCUS} ${active
                            ? 'border-[#f5c542]/60 bg-[#f5c542]/10 text-[#f5c542]'
                            : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25 hover:text-white'
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} fill={active ? 'currentColor' : 'none'} />
                        {count}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => navigate('/community')}
                  className={`flex items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-semibold text-[#1c120c] shadow-[0_8px_24px_-8px_rgba(245,197,66,0.6)] transition hover:bg-[#ffd25e] ${FOCUS}`}
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                  Discuss this story
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CommunityLayout>
  );
}