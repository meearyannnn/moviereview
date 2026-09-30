import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * RouteTransitionLoader
 * Seamlessly shows the MovieGuy ticket loader indicator on navigation between pages.
 */
export const RouteTransitionLoader: React.FC = () => {
  const location = useLocation();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => {
      setTransitioning(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  if (!transitioning) return null;

  return (
    <div className="pointer-events-none fixed top-0 inset-x-0 z-[100] h-1">
      {/* Golden progress sweep */}
      <div className="h-full w-full bg-gradient-to-r from-transparent via-[#f5c542] to-transparent animate-pulse shadow-[0_0_12px_rgba(245,197,66,0.8)]" />
      {/* Floating ticket loader pill on top right */}
      <div className="absolute right-4 top-2 flex items-center gap-2 rounded-full border border-[#c9a24b]/40 bg-[#140a0d]/90 px-3 py-1 shadow-2xl shadow-black/90 backdrop-blur-md animate-in fade-in slide-in-from-top-1 duration-200">
        <img
          src="/assets/branding/ticket-loader.png"
          alt=""
          className="h-3.5 w-auto object-contain animate-bounce"
        />
        <span className="font-mono text-[10px] font-bold text-[#f5c542] tracking-wider uppercase">Loading</span>
      </div>
    </div>
  );
};
