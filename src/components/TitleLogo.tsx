// components/TitleLogo.tsx
import React, { useEffect, useState } from 'react';
import { fanart } from '@/services/fanart';

interface TitleLogoProps {
  id: number | string;
  type?: 'movie' | 'tv';
  title: string;
  className?: string;
  size?: 'hero' | 'detail' | 'compact';
}

export const TitleLogo: React.FC<TitleLogoProps> = ({
  id,
  type = 'movie',
  title,
  className = '',
  size = 'detail',
}) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoaded(false);
    setHasError(false);

    const loadLogo = async () => {
      if (!id) return;
      try {
        const url = await fanart.getBestLogo(id, type);
        if (!isMounted || !url) return;

        // Preload and decode in memory before showing
        const img = new Image();
        img.src = url;

        const handleSuccess = () => {
          if (isMounted) {
            setLogoUrl(url);
            setIsLoaded(true);
          }
        };

        if (img.complete) {
          handleSuccess();
        } else {
          img.onload = handleSuccess;
          img.onerror = () => {
            if (isMounted) setHasError(true);
          };
        }
      } catch {
        if (isMounted) setHasError(true);
      }
    };

    loadLogo();

    return () => {
      isMounted = false;
    };
  }, [id, type]);

  // Sizing variants
  const sizeClasses = {
    hero: 'max-h-20 sm:max-h-28 md:max-h-32 max-w-[280px] sm:max-w-md md:max-w-lg',
    detail: 'max-h-16 sm:max-h-24 md:max-h-28 max-w-[280px] sm:max-w-md md:max-w-lg',
    compact: 'max-h-12 sm:max-h-16 max-w-[200px] sm:max-w-xs',
  }[size];

  const textClasses = {
    hero: 'font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.08] mb-3 sm:mb-4 text-balance drop-shadow-2xl',
    detail: 'font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight mb-4 drop-shadow-lg break-words',
    compact: 'font-display font-bold text-xl sm:text-2xl text-white tracking-tight mb-2',
  }[size];

  if (logoUrl && isLoaded && !hasError) {
    return (
      <div className={`relative mb-4 flex items-center min-h-[50px] overflow-visible ${className}`}>
        <img
          src={logoUrl}
          alt={title}
          onError={() => setHasError(true)}
          className={`${sizeClasses} w-auto h-auto object-contain object-left drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] animate-in fade-in zoom-in-95 duration-500`}
        />
      </div>
    );
  }

  // Seamless fallback to styled typography with zero layout jump
  return (
    <h1 className={`${textClasses} ${className}`}>
      {title}
    </h1>
  );
};
