import { type ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import { CommunitySidebar } from '@/components/community/CommunitySidebar';

interface CommunityLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export function CommunityLayout({ children, rightPanel }: CommunityLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0608] text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c]">
      <Navbar />

      {/* ── Cinema Projector Lighting & Curtain Gradients ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_top,_rgba(245,197,66,0.07)_0%,_rgba(201,162,75,0.03)_40%,_transparent_75%)] z-0" />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-black/90 via-[#140a0d]/40 to-transparent z-0" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-black/90 via-[#140a0d]/40 to-transparent z-0" />

      <div className="mx-auto max-w-screen-xl px-4 pb-32 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <CommunitySidebar />

          {/* Center Content */}
          <main className="min-w-0 flex-1">{children}</main>

          {/* Right Panel */}
          {rightPanel && (
            <aside className="hidden w-72 shrink-0 space-y-5 xl:block">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
