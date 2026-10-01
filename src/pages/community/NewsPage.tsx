// src/pages/community/NewsPage.tsx — Clean Cinephile News Stream matching Screenshot layout
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  X,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Film,
  Tv,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { cinemaNewsService, type CinemaNewsItem } from '@/services/cinemaNews';
import { toast } from 'sonner';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState<CinemaNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState<CinemaNewsItem | null>(null);
  const [reactions, setReactions] = useState<{ [id: string]: { fire: number; hyped: number; shocked: number } }>({});

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await cinemaNewsService.getNews('all');
      setNews(data);
    } catch {
      toast.error('Could not refresh news feeds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleReact = (storyId: string, type: 'fire' | 'hyped' | 'shocked') => {
    setReactions((prev) => {
      const current = prev[storyId] || { fire: 0, hyped: 0, shocked: 0 };
      toast.success(`Marked as ${type === 'fire' ? '🔥 Cinema Fire' : type === 'hyped' ? '🍿 Hyped' : '😮 Shocking'}!`);
      return {
        ...prev,
        [storyId]: {
          ...current,
          [type]: current[type] + 1,
        },
      };
    });
  };

  // Highlights movie and director keywords in bold
  const renderFormattedText = (text: string) => {
    const boldTerms = [
      'Joe Russo & Anthony Russo',
      'Doctor Doom',
      'Avengers: Endgame Encore',
      'Iron Man',
      'Doom',
      'THE FURTHER MIS-ADVENTURES OF CLIFF BOOTH',
      'Once Upon a Time... in Hollywood',
      'Brad Pitt',
      'studio fixer',
      'Quentin Tarantino',
      'L.A. noir',
      'blackmail and extortion',
      'Mark Ruffalo',
      'Paramount-Warner Bros.',
      'Christopher Nolan',
      'Robert Downey Jr.',
      'Matt Reeves',
      'The Batman Part II',
      'Dune: Prophecy',
      'Severance Season 2',
      'Ben Stiller',
    ];

    const regex = new RegExp(`(${boldTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isBold = boldTerms.some((t) => t.toLowerCase() === part.toLowerCase());
      return isBold ? (
        <strong key={i} className="font-bold text-white">
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      );
    });
  };

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* ── Main Stream of News Posts (Screenshots 1 & 2) ── */}
      <div className="space-y-12 max-w-2xl mx-auto">
        {loading && news.length === 0 ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-16 w-full rounded-xl bg-white/[0.03] animate-pulse" />
                <div className="h-72 w-full rounded-2xl bg-white/[0.03] animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          news.map((item) => (
            <article key={item.id} className="space-y-4 group">
              {/* Text on Top (Matching Screenshots 1 & 2) */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div
                    onClick={() => setActiveStory(item)}
                    className="text-sm sm:text-base text-white/90 leading-relaxed font-sans cursor-pointer hover:text-white transition-colors"
                  >
                    {renderFormattedText(item.description)}
                  </div>

                  {/* Comment Bubble Icon on Right Top */}
                  <button
                    onClick={() => setActiveStory(item)}
                    className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
                    title="View comments & discussion"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Byline: By MovieGuy Official • [time] */}
                <div className="flex items-center gap-2 text-xs font-mono text-white/40 pt-1">
                  <span className="font-semibold text-white/60">By {item.author || 'MovieGuy Official'}</span>
                  <span>•</span>
                  <span>{item.readTime || '1 hr'}</span>
                </div>
              </div>

              {/* Full-Width Image Below Text (Matching Screenshots 1 & 2) */}
              <div
                onClick={() => setActiveStory(item)}
                className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/60 cursor-pointer shadow-lg group-hover:ring-1 group-hover:ring-white/20 transition-all"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                {/* Subtitle Dots indicator (as seen in screenshot) */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  <span className="w-4 h-1 rounded-full bg-white/90" />
                  <span className="w-1.5 h-1 rounded-full bg-white/40" />
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ── Native MovieGuy In-House Blog Reader Modal ── */}
      {activeStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setActiveStory(null)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/[0.12] bg-[#140a0e] shadow-2xl relative text-white space-y-6 custom-scrollbar"
          >
            {/* Header Image */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black/70">
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
                <span className="px-3 py-1 rounded-full border border-[#f5c542]/40 bg-[#f5c542]/20 text-xs font-mono font-bold uppercase tracking-wider text-[#f5c542] backdrop-blur-md">
                  {activeStory.scoopType}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#f5c542]/40 text-[#f5c542] font-mono text-xs font-bold">
                  MovieGuy Wire
                </span>
              </div>
            </div>

            {/* Modal Body: Full In-House Blog Article */}
            <div className="px-6 sm:px-8 pb-8 space-y-6">
              {/* Title & Metadata */}
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white leading-snug">
                  {activeStory.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/40 pt-1">
                  <span className="text-[#f5c542] font-semibold">{activeStory.author}</span>
                  <span>•</span>
                  <span>
                    {new Date(activeStory.pubDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{activeStory.readTime}</span>
                </div>
              </div>

              {/* Interactive Reaction Bar */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <button
                  onClick={() => handleReact(activeStory.id, 'fire')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.06] text-xs font-mono text-white/80 transition-colors"
                >
                  <span>🔥</span>
                  <span>Cinema Fire ({(activeStory.reactionCount?.fire || 40) + (reactions[activeStory.id]?.fire || 0)})</span>
                </button>
                <button
                  onClick={() => handleReact(activeStory.id, 'hyped')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.06] text-xs font-mono text-white/80 transition-colors"
                >
                  <span>🍿</span>
                  <span>Hyped ({(activeStory.reactionCount?.hyped || 65) + (reactions[activeStory.id]?.hyped || 0)})</span>
                </button>
                <button
                  onClick={() => handleReact(activeStory.id, 'shocked')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.06] text-xs font-mono text-white/80 transition-colors"
                >
                  <span>😮</span>
                  <span>Shocking ({(activeStory.reactionCount?.shocked || 12) + (reactions[activeStory.id]?.shocked || 0)})</span>
                </button>
              </div>

              {/* Blog Lead Paragraph */}
              <div className="text-sm sm:text-base text-white/90 leading-relaxed font-sans font-medium">
                {activeStory.fullBlog.leadParagraph}
              </div>

              {/* Deep Dive Paragraph */}
              <div className="text-sm text-white/75 leading-relaxed font-sans">
                {activeStory.fullBlog.deepDiveParagraph}
              </div>

              {/* MovieGuy Insider Perspective Box */}
              <div className="p-5 rounded-2xl border border-[#c9a24b]/40 bg-[#1c1216] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#f5c542] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#f5c542]" />
                  <span>MovieGuy Cinephile Perspective</span>
                </div>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                  {activeStory.fullBlog.insiderTakeParagraph}
                </p>
              </div>

              {/* What to Expect Next */}
              <div className="text-sm text-white/75 leading-relaxed font-sans">
                {activeStory.fullBlog.whatToExpectParagraph}
              </div>

              {/* Key Takeaways */}
              <div className="space-y-2.5 pt-2 border-t border-white/[0.08]">
                <h4 className="text-xs font-mono uppercase tracking-wider text-white/50 font-bold">
                  Key Industry Takeaways
                </h4>
                <div className="space-y-2">
                  {activeStory.fullBlog.keyTakeaways.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-white/75 font-mono">
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#f5c542] hover:bg-[#c9a24b] text-[#1c120c] font-mono font-bold text-xs shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Discuss with Cinephiles in Feed</span>
                </button>

                <div className="text-[11px] font-mono text-white/30">
                  Published by MovieGuy Cinema Wire
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </CommunityLayout>
  );
}