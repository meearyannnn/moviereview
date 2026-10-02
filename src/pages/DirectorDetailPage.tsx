// src/pages/DirectorDetailPage.tsx — Director Detail Page (simplified)
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { TicketLoader } from '@/components/TicketLoader';
import { useDirector } from '@/hooks/useDirector';
import { DirectorHero } from '@/components/directors/DirectorHero';
import { DirectorStats } from '@/components/directors/DirectorStats';
import { DirectorTopFilms } from '@/components/directors/DirectorTopFilms';
import { DirectorUpcoming } from '@/components/directors/DirectorUpcoming';
import { FilmographyGrid } from '@/components/directors/FilmographyGrid';

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0608]';

export const DirectorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: director, isLoading, isError, error } = useDirector(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0608] text-[#f8fafc]">
        <Navbar />
        <TicketLoader fullScreen size="lg" label="Loading director…" />
      </div>
    );
  }

  if (isError || !director) {
    return (
      <div className="min-h-screen bg-[#0a0608] text-[#f8fafc]">
        <Navbar />
        <main className="mx-auto max-w-md px-4 py-40 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
            Director not found
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {error?.message || 'We couldn’t load this director right now.'}
          </p>
          <Link
            to="/directors"
            className={`mt-6 inline-flex items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-semibold text-[#1c120c] transition-colors hover:bg-[#ffd666] ${ring}`}
          >
            <ArrowLeft className="h-4 w-4" />
            All directors
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-transparent text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c]">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-8 px-4 pb-28 pt-20 sm:space-y-12 sm:px-6 sm:pt-24 md:pb-16 lg:px-8">
        <Link
          to="/directors"
          className={`inline-flex items-center gap-1.5 rounded text-sm text-white/50 transition-colors hover:text-[#f5c542] ${ring}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Directors
        </Link>

        <DirectorHero director={director} />
        <DirectorStats stats={director.stats} />

        {director.topFilms.length > 0 && (
          <DirectorTopFilms movies={director.topFilms} directorName={director.name} />
        )}

        {director.upcomingFilms.length > 0 && <DirectorUpcoming movies={director.upcomingFilms} />}

        <FilmographyGrid movies={director.movies} decadesCount={director.stats.decadesCount} />
      </main>

      <footer className="border-t border-white/[0.06] bg-[#0a0608] pb-28 md:pb-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-6 sm:px-6 lg:px-8">
          <span className="font-display text-sm font-bold text-white">
            Movie<span className="text-[#f5c542]">Guy</span>
          </span>
          <span className="text-xs text-white/30">© {new Date().getFullYear()} MovieGuy</span>
        </div>
      </footer>
    </div>
  );
};

export default DirectorDetailPage;