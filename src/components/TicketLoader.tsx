import React from 'react';

interface TicketLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

const SIZES = {
  xs: { w: 22, h: 10 },
  sm: { w: 34, h: 16 },
  md: { w: 52, h: 24 },
  lg: { w: 76, h: 35 },
  xl: { w: 108, h: 50 },
};

export const TicketLoader: React.FC<TicketLoaderProps> = ({
  size = 'md',
  label = 'Loading cinema reel…',
  fullScreen = false,
  className = '',
}) => {
  const dims = SIZES[size] || SIZES.md;

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Golden ambient halo */}
        <div className="absolute inset-0 -m-3 rounded-full bg-[#f5c542]/20 blur-xl animate-pulse" />
        <img
          src="/assets/branding/ticket-loader.png"
          alt="Loading..."
          style={{ width: `${dims.w}px`, height: `${dims.h}px` }}
          className="relative object-contain animate-bounce drop-shadow-[0_0_16px_rgba(245,197,66,0.7)]"
        />
      </div>
      {label && (
        <p className="font-mono text-xs font-bold tracking-widest uppercase text-white/50 animate-pulse text-center">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0608]/95 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};
