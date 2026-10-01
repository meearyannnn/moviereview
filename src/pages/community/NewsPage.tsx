// src/pages/community/NewsPage.tsx — Cinema & TV News (simple, elegant reader)
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  LayoutGrid,
  Flame,
  Zap,
  Heart,
  X,
  Clock,
  ArrowUpRight,
  MessageCircle,
  Megaphone,
  Image as ImageIcon,
  Users,
  Scale,
  Check,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { cinemaNewsService, type CinemaNewsItem, type ScoopCategory } from '@/services/cinemaNews';
import { toast } from 'sonner';

type Reaction = 'fire' | 'hyped' | 'shocked';

const FILTERS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'Controversy', label: 'Controversies', icon: Scale },
  { key: 'Poster', label: 'Posters', icon: ImageIcon },
  { key: 'Announcement', label: 'Announcements', icon: Megaphone },
  { key: 'Casting', label: 'Casting', icon: Users },
];

const CATEGORIES: { key: 'all' | 'movie' | 'tv'; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV' },
];

const REACTIONS: { key: Reaction; label: string; icon: LucideIcon; base: number }[] = [
  { key: 'fire', label: 'Fire', icon: Flame, base: 40 },
  { key: 'hyped', label: 'Hyped', icon: Heart, base: 65 },
  { key: 'shocked', label: 'Shocked', icon: Zap, base: 12 },
];

const formatDate = (d?: string | Date, withYear = false) =>
  d
    ? new Date(d).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      ...(withYear ? { year: 'numeric' } : {}),
    })
    : 'Today';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<CinemaNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'all' | 'movie' | 'tv'>('all');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeStory, setActiveStory] = useState<CinemaNewsItem | null>(null);
  const [reactions, setReactions] = useState<Record<string, Partial<Record<Reaction, number>>>>({});

  const fetchNews = async (cat = category) => {
    setLoading(true);
    try {
      setNews(await cinemaNewsService.getNews(cat));
      setLastRefreshed(new Date());
    } catch {
      toast.error('Could not refresh the news. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Close reader with Escape
  useEffect(() => {
    if (!activeStory) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActiveStory(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStory]);

  const react = (id: string, type: Reaction) =>
    setReactions((prev) => ({
      ...prev,
      [id]: { ...prev[id], [type]: (prev[id]?.[type] || 0) + 1 },
    }));

  const filtered = useMemo(() => {
    let result = news;
    if (filter !== 'all') result = result.filter((i) => i.scoopType.includes(filter));
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.scoopType.toLowerCase().includes(q)
      );
    }
    return result;
  }, [news, filter, query]);

  const hero = filtered[0];
  const rest = filtered.slice(1);

  const scoopIcon = (type: ScoopCategory): LucideIcon => {
    if (type.includes('Controversy')) return Scale;
    if (type.includes('Poster')) return ImageIcon;
    if (type.includes('Announcement')) return Megaphone;
    if (type.includes('Casting')) return Users;
    return Newspaper;
  };

  const Tag = ({ type, className = '' }: { type: ScoopCategory; className?: string }) => {
    const Icon = scoopIcon(type);
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-[#f5c542] backdrop-blur-md ${className}`}
      >
        <Icon className="h-3 w-3" strokeWidth={1.75} />
        {type}
      </span>
    );
  };

  const Meta = ({ item }: { item: CinemaNewsItem }) => (
    <div className="flex items-center gap-2 text-xs text-white/45">
      <span className="font-medium text-white/70">{item.author}</span>
      <span aria-hidden>·</span>
      <span>{formatDate(item.pubDate)}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" strokeWidth={1.75} />
        {item.readTime}
      </span>
    </div>
  );

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* Header */}
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Cinema & TV news</h1>
          <p className="mt-1 text-sm text-white/50">Fresh buzz, posters and announcements.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-white/35 sm:inline">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem('mg_cinema_realtime_news_v4');
              fetchNews(category).then(() => toast.success('News refreshed'));
            }}
            disabled={loading}
            aria-label="Refresh news"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-[#f5c542]/50 hover:text-[#f5c542] disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-full border border-white/10 p-1">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${category === key ? 'bg-[#f5c542] font-semibold text-[#1c120c]' : 'text-white/55 hover:text-white'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories"
              className="w-full rounded-full border border-white/10 bg-transparent py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 transition focus:border-[#f5c542]/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${filter === key
                  ? 'border-[#f5c542]/60 text-[#f5c542]'
                  : 'border-transparent text-white/45 hover:text-white/80'
                }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && news.length === 0 ? (
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-3xl bg-white/[0.04]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-56 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-56 animate-pulse rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-white/20" strokeWidth={1.5} />
          <p className="font-medium text-white/70">No stories match.</p>
          <button
            onClick={() => {
              setFilter('all');
              setQuery('');
            }}
            className="mt-2 text-sm text-[#f5c542] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured */}
          {hero && (
            <article
              onClick={() => setActiveStory(hero)}
              className="group relative cursor-pointer overflow-hidden rounded-3xl"
            >
              <img
                src={hero.thumbnail}
                alt=""
                className="h-80 w-full object-cover transition duration-700 group-hover:scale-[1.03] sm:h-[26rem]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] via-[#140a0e]/50 to-transparent" />
              <Tag type={hero.scoopType} className="absolute left-5 top-5" />
              <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 sm:p-8">
                <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">{hero.title}</h2>
                {hero.description && (
                  <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70">{hero.description}</p>
                )}
                <Meta item={hero} />
              </div>
            </article>
          )}

          {/* Stories */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2">
              {rest.map((item) => (
                <article key={item.id} onClick={() => setActiveStory(item)} className="group cursor-pointer space-y-3">
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={item.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <Tag type={item.scoopType} className="absolute left-3 top-3" />
                  </div>
                  <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-white transition group-hover:text-[#f5c542]">
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-white/55">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <Meta item={item} />
                    <ArrowUpRight
                      className="h-4 w-4 text-white/30 transition group-hover:text-[#f5c542]"
                      strokeWidth={1.75}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

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
              <img src={activeStory.thumbnail} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] to-transparent" />
              <button
                onClick={() => setActiveStory(null)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-md transition hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <Tag type={activeStory.scoopType} className="absolute bottom-4 left-6" />
            </div>

            <div className="space-y-6 px-6 pb-8 pt-2 sm:px-8">
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold leading-snug">{activeStory.title}</h2>
                <div className="flex items-center gap-2 text-xs text-white/45">
                  <span className="font-medium text-white/70">{activeStory.author}</span>
                  <span aria-hidden>·</span>
                  <span>{formatDate(activeStory.pubDate, true)}</span>
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