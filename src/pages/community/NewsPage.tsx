// src/pages/community/NewsPage.tsx — Clean cinephile news stream
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Clock, Check, Flame, Heart, Zap, RefreshCw, Newspaper } from 'lucide-react';
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

  // Close the reader with Escape
  useEffect(() => {
    if (!activeStory) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActiveStory(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStory]);

  const react = (id: string, type: Reaction) =>
    setReactions((prev) => ({ ...prev, [id]: { ...prev[id], [type]: (prev[id]?.[type] || 0) + 1 } }));

  const cleanTag = (s: string) => s.replace(/[^\p{L}\p{N}\s&'-]/gu, '').trim();

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="mx-auto max-w-2xl space-y-12">
        {loading && news.length === 0 ? (
          <div className="space-y-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-14 w-full animate-pulse rounded-xl bg-white/[0.04]" />
                <div className="aspect-video w-full animate-pulse rounded-2xl bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="py-20 text-center">
            <Newspaper className="mx-auto mb-3 h-8 w-8 text-white/20" strokeWidth={1.5} />
            <p className="font-medium text-white/70">{failed ? 'The news did not load.' : 'No stories yet.'}</p>
            <button
              onClick={fetchNews}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-[#f5c542]/50 hover:text-[#f5c542]"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
              Try again
            </button>
          </div>
        ) : (
          news.map((item) => (
            <article key={item.id} className="group space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <p
                    onClick={() => setActiveStory(item)}
                    className="cursor-pointer text-[15px] leading-relaxed text-white/80 transition hover:text-white"
                  >
                    {renderFormattedText(item.description)}
                  </p>
                  <button
                    onClick={() => setActiveStory(item)}
                    aria-label="Read story and discuss"
                    className="shrink-0 rounded-full p-2 text-white/45 transition hover:bg-white/[0.07] hover:text-[#f5c542]"
                  >
                    <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/45">
                  <span className="font-medium text-white/65">By {item.author || 'MovieGuy Official'}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" strokeWidth={1.75} />
                    {item.readTime || '1 hr'}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setActiveStory(item)}
                className="aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-black/60"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </article>
          ))
        )}
      </div>

      {/* Reader */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg"
          onClick={() => setActiveStory(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeStory.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#140a0e] text-white shadow-2xl"
          >
            <div className="relative h-60 sm:h-72">
              <img
                src={activeStory.thumbnail}
                alt=""
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder.svg';
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] to-transparent" />
              <button
                onClick={() => setActiveStory(null)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-md transition hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <span className="absolute bottom-4 left-6 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-[#f5c542] backdrop-blur-md">
                {cleanTag(activeStory.scoopType)}
              </span>
            </div>

            <div className="space-y-6 px-6 pb-8 pt-2 sm:px-8">
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold leading-snug">{activeStory.title}</h2>
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <span className="font-medium text-white/70">{activeStory.author}</span>
                  <span aria-hidden>·</span>
                  <span>
                    {new Date(activeStory.pubDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{activeStory.readTime}</span>
                </div>
              </div>

              <div className="space-y-5 leading-relaxed">
                <p className="text-base font-medium text-white/90">{activeStory.fullBlog.leadParagraph}</p>
                <p className="text-sm text-white/70">{activeStory.fullBlog.deepDiveParagraph}</p>

                <blockquote className="border-l-2 border-[#f5c542] pl-4">
                  <p className="text-sm italic text-white/85">{activeStory.fullBlog.insiderTakeParagraph}</p>
                  <footer className="mt-2 text-xs text-[#f5c542]">MovieGuy's take</footer>
                </blockquote>

                <p className="text-sm text-white/70">{activeStory.fullBlog.whatToExpectParagraph}</p>
              </div>

              <ul className="space-y-2.5 border-t border-white/10 pt-5">
                {activeStory.fullBlog.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#f5c542]" strokeWidth={2} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <div className="flex gap-1.5">
                  {REACTIONS.map(({ key, label, icon: Icon, base }) => {
                    const count = (activeStory.reactionCount?.[key] || base) + (reactions[activeStory.id]?.[key] || 0);
                    const active = !!reactions[activeStory.id]?.[key];
                    return (
                      <button
                        key={key}
                        onClick={() => react(activeStory.id, key)}
                        aria-label={label}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${active
                            ? 'border-[#f5c542]/60 text-[#f5c542]'
                            : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'
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
                  className="flex items-center gap-2 rounded-full bg-[#f5c542] px-4 py-2 text-sm font-semibold text-[#1c120c] transition hover:bg-[#c9a24b]"
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