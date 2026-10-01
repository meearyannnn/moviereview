// src/pages/community/TrailersPage.tsx — Matches Screenshot 5 with trailer feed, video modal & comments
import { useState } from 'react';
import {
  SlidersHorizontal,
  Search,
  Play,
  MessageCircle,
  X,
  Share2,
  Film,
  Sparkles,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { toast } from 'sonner';

interface TrailerItem {
  id: string;
  title: string;
  movieTitle: string;
  author: string;
  timeAgo: string;
  commentsCount: number;
  thumbnail: string;
  youtubeId: string;
  topic: string;
}

const TRAILERS_DATA: TrailerItem[] = [
  {
    id: 'tr-1',
    movieTitle: 'The Cycle',
    title: 'Check out the official trailer for the horror film The Cycle starring Deborah Ann Woll.',
    author: 'Moctale Official',
    timeAgo: '1 hr',
    commentsCount: 14,
    thumbnail: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'L3oOldVi8dU', // Official teaser trailer
    topic: 'Horror',
  },
  {
    id: 'tr-2',
    movieTitle: 'Project Hail Mary',
    title: 'First look trailer: Ryan Gosling stars in Andy Weir’s epic astronaut survival odyssey directed by Lord & Miller.',
    author: 'Universal Pictures',
    timeAgo: '3 hrs',
    commentsCount: 42,
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'd9J0w9Jk4pE',
    topic: 'Sci-Fi',
  },
  {
    id: 'tr-3',
    movieTitle: 'The Batman Part II',
    title: 'Matt Reeves teases the dark descent of Robert Pattinson’s Batman deeper into Gotham’s criminal syndicates.',
    author: 'Warner Bros. Pictures',
    timeAgo: '5 hrs',
    commentsCount: 88,
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'mqqft2x_Aa4',
    topic: 'DC',
  },
  {
    id: 'tr-4',
    movieTitle: 'Dune: Prophecy',
    title: 'Official HBO teaser trailer unveiling the secrets and political intrigue of the Bene Gesserit sisterhood.',
    author: 'Max Official',
    timeAgo: '8 hrs',
    commentsCount: 29,
    thumbnail: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'brn_r_wS_vA',
    topic: 'HBO',
  },
  {
    id: 'tr-5',
    movieTitle: 'Severance Season 2',
    title: 'Lumon Industries returns with Adam Scott and Patricia Arquette in the psychological workplace thriller.',
    author: 'Apple TV',
    timeAgo: '1 day',
    commentsCount: 65,
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80',
    youtubeId: 'xEQP4VVuyrY',
    topic: 'Apple TV',
  },
];

const TOPICS = ['All', 'Sci-Fi', 'Horror', 'DC', 'HBO', 'Apple TV'];

export default function TrailersPage() {
  const [activeTopic, setActiveTopic] = useState('All');
  const [showTopicsMenu, setShowTopicsMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<TrailerItem | null>(null);
  const [commentDrawerItem, setCommentDrawerItem] = useState<TrailerItem | null>(null);

  const filteredTrailers = TRAILERS_DATA.filter((tr) => {
    const matchesTopic = activeTopic === 'All' || tr.topic === activeTopic;
    const matchesSearch =
      !searchQuery.trim() ||
      tr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tr.movieTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* ── Top Bar (Screenshot 5) ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowTopicsMenu((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono font-medium text-white transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
            <span>Topics</span>
            <span className="w-4 h-4 rounded-full bg-white/[0.1] flex items-center justify-center text-[10px] font-bold">
              {TOPICS.length - 1}
            </span>
          </button>

          {showTopicsMenu && (
            <div className="absolute top-10 left-0 z-30 w-44 rounded-2xl border border-white/[0.1] bg-[#140a0e] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in duration-100">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setActiveTopic(topic);
                    setShowTopicsMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                    activeTopic === topic
                      ? 'bg-[#f5c542] text-[#1c120c] font-bold'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search button */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1 animate-in fade-in duration-150">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trailers..."
                className="w-40 bg-transparent text-xs text-white focus:outline-none placeholder-white/30"
              />
              <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="text-white/40 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Search trailers"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Feed of Trailers (Screenshot 5) ── */}
      <div className="space-y-8">
        {filteredTrailers.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl border border-white/[0.08] bg-[#140a0e] overflow-hidden shadow-xl hover:border-white/[0.15] transition-all"
          >
            {/* 16:9 Thumbnail with Play Button & TRAILER HD badge */}
            <div
              onClick={() => setActiveVideo(item)}
              className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer group"
            >
              <img
                src={item.thumbnail}
                alt={item.movieTitle}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors" />

              {/* Centered Circular Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#f5c542] group-hover:text-[#1c120c]">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </div>
              </div>

              {/* TRAILER HD badge */}
              <div className="absolute bottom-4 left-4">
                <div className="px-3 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-black tracking-wider uppercase shadow-lg">
                  TRAILER <span className="text-[#f5c542]">HD</span>
                </div>
              </div>
            </div>

            {/* Content & Metadata */}
            <div className="p-5 sm:p-6 space-y-3">
              <p className="text-sm sm:text-base font-medium text-white/90 leading-relaxed font-sans">
                {item.title}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono text-white/40">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white/70">By {item.author}</span>
                  <span>•</span>
                  <span>{item.timeAgo}</span>
                </div>

                <button
                  onClick={() => setCommentDrawerItem(item)}
                  className="flex items-center gap-1.5 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">{item.commentsCount}</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ── Video Player Modal ── */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setActiveVideo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl rounded-3xl border border-white/[0.12] bg-[#140a0e] overflow-hidden shadow-2xl relative"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] text-white">
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-[#f5c542]" />
                <h3 className="font-display font-bold text-base">{activeVideo.movieTitle} — Official Trailer</h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.movieTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Comments Drawer ── */}
      {commentDrawerItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setCommentDrawerItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#140a0e] p-6 shadow-2xl relative text-white space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display font-bold text-base">Comments ({commentDrawerItem.commentsCount})</h3>
              <button onClick={() => setCommentDrawerItem(null)} className="p-1 text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono">
                <p className="font-bold text-white mb-1">CineReviewer99</p>
                <p className="text-white/70">The cinematography looks insane. Can't wait for the theatrical IMAX run!</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono">
                <p className="font-bold text-white mb-1">AuteurCinema</p>
                <p className="text-white/70">Finally an authentic horror tone without overdone jumpscares.</p>
              </div>
            </div>

            <div className="pt-2">
              <input
                type="text"
                placeholder="Share your thoughts on this trailer..."
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#f5c542] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    toast.success('Comment posted!');
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </CommunityLayout>
  );
}
