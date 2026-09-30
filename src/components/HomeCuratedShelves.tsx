// components/HomeCuratedShelves.tsx
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

  useEffect(() => {
    let isMounted = true;
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
        }
      } catch (err) {
        console.warn('Error fetching curated shelves:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadShelves();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-8 my-0">
      {/* 1. Trending Worldwide */}
      <CuratedShelfRow
        title="Trending Worldwide"
        subtitle="Global audience favorites & high-heat releases"
        icon={Flame}
        items={talkOfTheTown}
        loading={loading}
        viewAllLink="/movies"
      />

      {/* 2. Movie Release Schedule */}
      <MovieScheduleShelf />

      {/* 2. Worth Watching on Prime */}
      <CuratedShelfRow
        title="Worth Watching on Prime"
        subtitle="Hand-picked Prime Video essentials"
        logoSrc="/assets/logos/prime.png"
        items={prime}
        loading={loading}
        viewAllLink="/explore"
      />

      {/* 3. Don't Miss These on Netflix */}
      <CuratedShelfRow
        title="Don't Miss These on Netflix"
        subtitle="Netflix originals & must-see picks"
        logoSrc="/assets/logos/netflix.png"
        items={netflix}
        loading={loading}
        viewAllLink="/explore"
      />

      {/* 4. Don't Miss These on JioHotstar */}
      <CuratedShelfRow
        title="Don't Miss These on JioHotstar"
        subtitle="Top picks streaming on JioHotstar"
        logoSrc="/assets/logos/jiohotstar.svg"
        items={jiohotstar}
        loading={loading}
        viewAllLink="/explore"
      />

      {/* 5. Watch It With District */}
      <CuratedShelfRow
        title="Watch It With District"
        subtitle="Curated by the District community"
        logoSrc="/assets/logos/district.svg"
        items={district}
        loading={loading}
        viewAllLink="/community"
      />
    </div>
  );
};
