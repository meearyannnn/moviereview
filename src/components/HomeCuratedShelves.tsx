// src/components/HomeCuratedShelves.tsx
import React, { useEffect, useState } from 'react';
import { CuratedShelfRow } from './CuratedShelfRow';
import { MovieScheduleShelf } from './MovieScheduleShelf';
import {
  curatedShelvesService,
  type CuratedShelfItem,
} from '@/services/curatedShelves';

import { Flame } from 'lucide-react';

export const HomeCuratedShelves: React.FC = () => {
  const [talkOfTheTown, setTalkOfTheTown] = useState<CuratedShelfItem[]>([]);
  const [prime, setPrime]                 = useState<CuratedShelfItem[]>([]);
  const [netflix, setNetflix]             = useState<CuratedShelfItem[]>([]);
  const [jiohotstar, setJiohotstar]       = useState<CuratedShelfItem[]>([]);
  const [district, setDistrict]           = useState<CuratedShelfItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [slotInfo, setSlotInfo]           = useState(() => curatedShelvesService.getSlotInfo());

  useEffect(() => {
    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    async function loadShelves() {
      try {
        const [talkRes, primeRes, netflixRes, jioRes, distRes] = await Promise.all([
          curatedShelvesService.getTalkOfTheTown(),
          curatedShelvesService.getPrimeWorthWatching(),
          curatedShelvesService.getNetflixDontMiss(),
          curatedShelvesService.getJioHotstarDontMiss(),
          curatedShelvesService.getDistrictCollection(),
        ]);
        if (isMounted) {
          setTalkOfTheTown(talkRes);
          setPrime(primeRes);
          setNetflix(netflixRes);
          setJiohotstar(jioRes);
          setDistrict(distRes);
          setLoading(false);

          const currentSlot = curatedShelvesService.getSlotInfo();
          setSlotInfo(currentSlot);

          // Schedule automatic rotation right at the next 6-hour boundary
          const msUntilNext = Math.max(1000, currentSlot.nextRotationMs - Date.now());
          timerId = setTimeout(() => {
            loadShelves();
          }, msUntilNext);
        }
      } catch (err) {
        console.warn('Error fetching curated shelves:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadShelves();

    // Auto-refresh when tab becomes active after entering a new 6-hour epoch
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const nowSlot = curatedShelvesService.getSlotInfo();
        if (nowSlot.epoch !== slotInfo.epoch) {
          loadShelves();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <div className="space-y-8 my-0">
      {/* 1. Trending Worldwide */}
      <CuratedShelfRow
        title="Trending Worldwide"
        subtitle="Global audience favorites & high-heat releases · Rotates every 6h"
        icon={Flame}
        items={talkOfTheTown}
        loading={loading}
        viewAllLink="/movies"
      />

      {/* 2. Movie Release Schedule */}
      <MovieScheduleShelf />

      {/* 3. Worth Watching on Prime */}
      <CuratedShelfRow
        title="Worth Watching on Prime"
        subtitle="Hand-picked Prime Video essentials · Rotates every 6h"
        logoSrc="/assets/logos/prime.png"
        items={prime}
        loading={loading}
        viewAllLink="/explore"
      />

      {/* 4. Don't Miss These on Netflix */}
      <CuratedShelfRow
        title="Don't Miss These on Netflix"
        subtitle="Netflix originals & must-see picks · Rotates every 6h"
        logoSrc="/assets/logos/netflix.png"
        items={netflix}
        loading={loading}
        viewAllLink="/explore"
      />

      {/* 5. Don't Miss These on JioHotstar */}
      <CuratedShelfRow
        title="Don't Miss These on JioHotstar"
        subtitle="Top picks streaming on JioHotstar · Rotates every 6h"
        logoSrc="/assets/logos/jiohotstar.svg"
        items={jiohotstar}
        loading={loading}
        viewAllLink="/explore"
      />

      {/* 6. Watch It With District */}
      <CuratedShelfRow
        title="Watch It With District"
        subtitle="Curated by the District community · Rotates every 6h"
        logoSrc="/assets/logos/district.svg"
        items={district}
        loading={loading}
        viewAllLink="/community"
      />
    </div>
  );
};
