// src/pages/community/NewsPage.tsx — Realtime Movie & Series News with MovieGuy Rephrasing & Native Reader
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Newspaper,
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
  Film,
  Tv,
  MessageCircle,
  Share2,
  X,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { cinemaNewsService, type CinemaNewsItem } from '@/services/cinemaNews';
import { toast } from 'sonner';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<CinemaNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'all' | 'movie' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Native Story Reader Modal state ("show it in own")
  const [activeStory, setActiveStory] = useState<CinemaNewsItem | null>(null);

  const fetchNews = async (cat: 'all' | 'movie' | 'tv' = category) => {
    setLoading(true);
    try {
      const data = await cinemaNewsService.getNews(cat);
      setNews(data);
      setLastRefreshed(new Date());
    } catch {
      toast.error('Could not refresh news feeds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(category);
  }, [category]);

  const handleCategoryChange = (cat: 'all' | 'movie' | 'tv') => {
    setCategory(cat);
  };

  const filteredNews = useMemo(() => {
    if (!searchQuery.trim()) return news;
    const q = searchQuery.toLowerCase();
    return news.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.scoopType.toLowerCase().includes(q)
    );
  }, [news, searchQuery]);

  const heroItem = filteredNews[0];
  const listItems = filteredNews.slice(1);

  const getScoopBadgeStyle = (type: CinemaNewsItem['scoopType']) => {
    switch (type) {
      case 'Casting Intel':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Production Buzz':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Hollywood Rumor':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Box Office Watch':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-[#f5c542]/20 text-[#f5c542] border-[#f5c542]/40';
    }
  };

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* ── Top Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-display">
              Cinema & TV News
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Realtime Wire
            </div>
          </div>
          <p className="mt-1 text-xs text-white/50 font-mono">
            Direct Hollywood scoops, series production buzz, and verified cinema intel.
          </p>
        </div>

        {/* Refresh & Time */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-white/40">
            Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => fetchNews(category)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-white/70 hover:text-white transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#f5c542]' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: 'all' as const, label: 'All Feeds' },
            { key: 'movie' as const, label: 'Movies', icon: Film },
            { key: 'tv' as const, label: 'TV Shows', icon: Tv },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                category === key
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              {label}
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scoops & titles…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-white/30 focus:border-[#f5c542] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* ── News Content ── */}
      {loading && news.length === 0 ? (
        <div className="space-y-4">
          <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="h-44 rounded-2xl bg-white/[0.03] animate-pulse" />
            <div className="h-44 rounded-2xl bg-white/[0.03] animate-pulse" />
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#140a0e] py-20 text-center">
          <Newspaper className="mx-auto mb-3 h-8 w-8 text-white/20" />
          <p className="font-semibold text-white/60">No cinema headlines found.</p>
          <p className="mt-1 text-xs text-white/40">Try adjusting your search terms or category.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Breaking / Featured Hero News Card */}
          {heroItem && (
            <div
              onClick={() => setActiveStory(heroItem)}
              className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-[#140a0e] shadow-2xl group cursor-pointer"
            >
              <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black/60">
                {heroItem.thumbnail && (
                  <img
                    src={heroItem.thumbnail}
                    alt={heroItem.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] via-[#140a0e]/60 to-transparent" />

                <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow">
                    <Flame className="w-3 h-3 fill-current" />
                    Top Story
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md ${getScoopBadgeStyle(
                      heroItem.scoopType
                    )}`}
                  >
                    {heroItem.scoopType}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 font-mono text-[10px]">
                    {heroItem.source}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 -mt-20 relative z-10 space-y-3">
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white leading-tight group-hover:text-[#f5c542] transition-colors">
                  {heroItem.title}
                </h2>
                {heroItem.description && (
                  <p className="text-xs sm:text-sm text-white/70 line-clamp-3 leading-relaxed">
                    {heroItem.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center gap-3 text-xs font-mono text-white/40">
                    <span>By {heroItem.author}</span>
                    <span>•</span>
                    <span>
                      {heroItem.pubDate
                        ? new Date(heroItem.pubDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Today'}
                    </span>
                    <span>•</span>
                    <span className="text-[#f5c542]">{heroItem.readTime}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStory(heroItem);
                    }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold text-[#1c120c] bg-[#f5c542] hover:bg-[#c9a24b] transition-all shadow-md"
                  >
                    <span>Read Scoop</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Remaining Stories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listItems.map((item) => (
              <article
                key={item.id}
                onClick={() => setActiveStory(item)}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#140a0e] p-5 hover:border-white/[0.18] transition-all group shadow-md cursor-pointer"
              >
                <div className="space-y-3">
                  {item.thumbnail && (
                    <div className="relative h-44 w-full rounded-xl overflow-hidden bg-black/40 border border-white/[0.06]">
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md ${getScoopBadgeStyle(
                            item.scoopType
                          )}`}
                        >
                          {item.scoopType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/70">
                          {item.source}
                        </span>
                      </div>
                    </div>
                  )}

                  <h3 className="font-display font-bold text-base text-white group-hover:text-[#f5c542] transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-white/60 line-clamp-2 font-mono leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-white/40">
                  <span className="text-[11px]">
                    {item.pubDate
                      ? new Date(item.pubDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Today'}
                  </span>

                  <span className="flex items-center gap-1 text-[#f5c542] group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
                    <span>Read</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ── Native MovieGuy Cinema Reader Modal ("show it in own") ── */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setActiveStory(null)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.12] bg-[#140a0e] shadow-2xl relative text-white space-y-6 custom-scrollbar"
          >
            {/* Header Image with Badges */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black/70">
              <img
                src={activeStory.thumbnail}
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] via-[#140a0e]/40 to-transparent" />

              <button
                onClick={() => setActiveStory(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 backdrop-blur-md text-white/70 hover:text-white border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md ${getScoopBadgeStyle(
                    activeStory.scoopType
                  )}`}
                >
                  {activeStory.scoopType}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 font-mono text-xs">
                  {activeStory.source}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 sm:px-8 pb-8 space-y-6">
              {/* Title & Metadata */}
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white leading-snug">
                  {activeStory.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/40 pt-1">
                  <span>By {activeStory.author}</span>
                  <span>•</span>
                  <span>{new Date(activeStory.pubDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span className="text-[#f5c542]">{activeStory.readTime}</span>
                </div>
              </div>

              {/* Story Overview */}
              <div className="text-sm text-white/80 leading-relaxed font-sans border-b border-white/[0.08] pb-5">
                {activeStory.description}
              </div>

              {/* MovieGuy Insider Analysis Box */}
              <div className="p-5 rounded-2xl border border-[#c9a24b]/30 bg-[#1c1216] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#f5c542] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#f5c542]" />
                  <span>MovieGuy Insider Takeaway</span>
                </div>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                  {activeStory.insiderTake}
                </p>
              </div>

              {/* Key Takeaways */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/50 font-bold">
                  Key Industry Highlights
                </h4>
                <div className="space-y-2">
                  {activeStory.keyHighlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-white/70 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-[#f5c542] shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/community');
                    toast.success('Opening Community feed to discuss scoop!');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-white transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-[#f5c542]" />
                  <span>Discuss in Community Feed</span>
                </button>

                <a
                  href={activeStory.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white transition-colors"
                >
                  <span>Original Wire Source ({activeStory.source})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </CommunityLayout>
  );
}
