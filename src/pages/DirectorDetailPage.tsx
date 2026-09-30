// src/pages/DirectorDetailPage.tsx — Director Detail Page & Filmography
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { TicketLoader } from '@/components/TicketLoader';
import { useDirector } from '@/hooks/useDirector';
import { DirectorHero } from '@/components/directors/DirectorHero';
import { DirectorStats } from '@/components/directors/DirectorStats';
import { DirectorTopFilms } from '@/components/directors/DirectorTopFilms';
import { DirectorUpcoming } from '@/components/directors/DirectorUpcoming';
import { FilmographyGrid } from '@/components/directors/FilmographyGrid';

export const DirectorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: director, isLoading, isError, error } = useDirector(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0608] text-[#f8fafc]">
        <Navbar />
        <TicketLoader fullScreen size="lg" label="Retrieving director filmography archives…" />
      </div>
    );
  }

  if (isError || !director) {
    return (
      <div className="min-h-screen bg-[#0a0608] text-[#f8fafc] flex flex-col justify-between">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-32 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-[#c9a24b]/30 text-[#f5c542] flex items-center justify-center mx-auto shadow-lg">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Director Profile Not Found</h1>
          <p className="text-xs sm:text-sm font-mono text-white/50">
            {error?.message || 'Unable to retrieve director information from cinema database.'}
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => navigate('/directors')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5c542] text-[#1c120c] font-mono font-bold text-xs hover:bg-[#c9a24b] transition-all shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Directors Vault</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-28 md:pb-16 space-y-10 sm:space-y-14">
        {/* ── Breadcrumb & Back Link ── */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <Link
            to="/directors"
            className="inline-flex items-center gap-1.5 text-[#c9a24b] hover:text-[#f5c542] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Directors</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/60 truncate max-w-xs">{director.name}</span>
        </div>

        {/* ── 1. Hero Section ── */}
        <DirectorHero director={director} />

        {/* ── 2. Cinema Statistics Strip ── */}
        <DirectorStats stats={director.stats} />

        {/* ── 3. Top Films Carousel (Ticket Cards) ── */}
        {director.topFilms.length > 0 && (
          <DirectorTopFilms movies={director.topFilms} directorName={director.name} />
        )}

        {/* ── 4. Upcoming Releases Row (if any) ── */}
        {director.upcomingFilms.length > 0 && (
          <DirectorUpcoming movies={director.upcomingFilms} />
        )}

        {/* ── 5. Full Filmography Grid with Filters & Sort ── */}
        <FilmographyGrid
          movies={director.movies}
          decadesCount={director.stats.decadesCount}
        />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-[#0a0608] pb-28 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm tracking-wider text-white">
              Movie<span className="text-[#f5c542]">Guy</span>
            </span>
            <span className="text-[11px] font-mono text-white/30">
              The Definitive Director Filmography Showcase
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/20">
            © {new Date().getFullYear()} MovieGuy · Honoring cinema creators worldwide.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default DirectorDetailPage;
