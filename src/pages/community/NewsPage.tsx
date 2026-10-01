// src/pages/community/NewsPage.tsx — Realtime Cinema & TV News Feed powered by legal RSS syndication
import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { cinemaNewsService, type CinemaNewsItem } from '@/services/cinemaNews';
import { toast } from 'sonner';

export default function NewsPage() {
  const [news, setNews] = useState<CinemaNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'all' | 'movie' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

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
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.source.toLowerCase().includes(q)
    );
  }, [news, searchQuery]);

  const heroItem = filteredNews[0];
  const listItems = filteredNews.slice(1);

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
              Realtime RSS
            </div>
          </div>
          <p className="mt-1 text-xs text-white/50 font-mono">
            Direct scoops and official releases from Collider, Variety, and Deadline.
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
            placeholder="Search headlines…"
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
          <p className="font-semibold text-white/60">No headlines found.</p>
          <p className="mt-1 text-xs text-white/40">Try adjusting your category or search term.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Breaking / Featured Hero News Card */}
          {heroItem && (
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-[#140a0e] shadow-2xl group">
              <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black/60">
                {heroItem.thumbnail && (
                  <img
                    src={heroItem.thumbnail}
                    alt={heroItem.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#140a0e] via-[#140a0e]/60 to-transparent" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow">
                    <Flame className="w-3 h-3 fill-current" />
                    Top Story
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[#f5c542] font-mono text-[10px] font-semibold">
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
                    <span>{heroItem.author || heroItem.source}</span>
                    <span>•</span>
                    <span>
                      {heroItem.pubDate
                        ? new Date(heroItem.pubDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Today'}
                    </span>
                  </div>

                  <a
                    href={heroItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold text-[#1c120c] bg-[#f5c542] hover:bg-[#c9a24b] transition-all shadow-md"
                  >
                    <span>Read Full Scoop</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Grid of Remaining Stories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listItems.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#140a0e] p-5 hover:border-white/[0.18] transition-all group shadow-md"
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
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-semibold text-[#f5c542]">
                        {item.source}
                      </span>
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

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
                  >
                    <span>Read Article</span>
                    <ExternalLink className="w-3 h-3 text-[#f5c542]" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </CommunityLayout>
  );
}
