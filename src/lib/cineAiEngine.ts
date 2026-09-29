import { tmdb, type Movie } from '@/services/tmdb';

export interface AiMovieRecommendation {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  runtime?: number;
  matchScore: number;
  matchReason: string;
  pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric';
  vibeScores: {
    tension: number;
    mindBend: number;
    emotion: number;
    humor: number;
  };
}

export interface CineAiResponse {
  message: string;
  recommendations: AiMovieRecommendation[];
  suggestions: string[];
}

// ── Known Plot Memory Database for Reverse-Search ──
const PLOT_MEMORIES: Array<{
  keywords: string[];
  movieId: number;
  title: string;
  reason: string;
}> = [
  {
    keywords: ['mars', 'potato', 'potatoes', 'stuck on mars', 'botanist', 'red planet'],
    movieId: 286217, // The Martian
    title: 'The Martian',
    reason: 'Identified from: Astronaut botanist stranded on Mars growing potatoes',
  },
  {
    keywords: ['dreams', 'dream within a dream', 'spinning top', 'totem', 'subconscious', 'leo dreams'],
    movieId: 27205, // Inception
    title: 'Inception',
    reason: 'Identified from: Dream heist within dreams with spinning top totem',
  },
  {
    keywords: ['magicians', 'magic clone', 'two magicians', 'tesla machine', 'borden', 'angier'],
    movieId: 1124, // The Prestige
    title: 'The Prestige',
    reason: 'Identified from: Rival 19th-century magicians and cloning machine',
  },
  {
    keywords: ['black hole', 'wormhole', 'relativity', 'cooper', 'murph', 'tesseract', '5th dimension', 'cornfield space'],
    movieId: 157336, // Interstellar
    title: 'Interstellar',
    reason: 'Identified from: Wormhole space travel, gravitational time dilation, and black hole',
  },
  {
    keywords: ['repeating day', 'time loop', 'same day over and over', 'bill murray groundhog', 'reliving'],
    movieId: 137, // Groundhog Day
    title: 'Groundhog Day',
    reason: 'Identified from: Guy stuck in an infinite daily time loop',
  },
  {
    keywords: ['clown in sewer', 'pennywise', 'balloon', 'red balloon', 'derry', 'sewers clown'],
    movieId: 346364, // It
    title: 'It',
    reason: 'Identified from: Shape-shifting sewer clown terrorizing kids',
  },
  {
    keywords: ['box', 'whats in the box', 'seven deadly sins', 'head in a box', 'detectives sins'],
    movieId: 807, // Se7en
    title: 'Se7en',
    reason: 'Identified from: Two detectives tracking seven deadly sins killer with mystery box',
  },
  {
    keywords: ['alien language', 'heptapods', 'circular language', 'amy adams linguist', 'aliens arrive in pods'],
    movieId: 329865, // Arrival
    title: 'Arrival',
    reason: 'Identified from: Linguist deciphering circular alien time language',
  },
  {
    keywords: ['quiet', 'monsters sensitive to sound', 'dont make a sound', 'sound monsters', 'barefoot sand'],
    movieId: 447332, // A Quiet Place
    title: 'A Quiet Place',
    reason: 'Identified from: Family surviving creatures that hunt by sound',
  },
  {
    keywords: ['family basement', 'peach allergy', 'tutor family', 'rich house basement', 'korean basement'],
    movieId: 496243, // Parasite
    title: 'Parasite',
    reason: 'Identified from: Poor family infiltrating a wealthy household with a secret bunker',
  },
  {
    keywords: ['blue pills', 'red pill', 'bullet time', 'neo matrix', 'simulated reality', 'agents sunglasses'],
    movieId: 603, // The Matrix
    title: 'The Matrix',
    reason: 'Identified from: Hacker discovering humanity lives in a simulated computer reality',
  },
];

// Calculate intelligent vibe scores based on TMDB movie data
export const calculateMovieVibe = (
  movie: Movie,
  runtime?: number
): {
  pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric';
  vibeScores: { tension: number; mindBend: number; emotion: number; humor: number };
} => {
  const genres = movie.genre_ids || (movie as any).genres?.map((g: any) => g.id) || [];
  const overview = (movie.overview || '').toLowerCase();
  const title = (movie.title || (movie as any).name || '').toLowerCase();
  const text = `${title} ${overview}`;

  // 1. Dynamic Tension (1 to 10)
  let tension = 1;
  if (genres.includes(27)) tension += 4.5; // Horror
  if (genres.includes(53)) tension += 4.0; // Thriller
  if (genres.includes(10752)) tension += 3.5; // War
  if (genres.includes(28)) tension += 3.0; // Action
  if (genres.includes(80)) tension += 2.5; // Crime
  if (genres.includes(9648)) tension += 2.0; // Mystery
  if (genres.includes(878)) tension += 1.5; // Sci-Fi

  if (/kill|deadly|hunter|assassin|terror|danger|hostage|escape|survival|threat|countdown|bomb|monster|stalker|haunted|battle|war|fight|chase|blood|murder|trapped|nightmare|sinister|vengeance/.test(text)) {
    tension += 2.5;
  }
  if (genres.includes(35) && !genres.includes(53) && !genres.includes(27) && !genres.includes(28)) {
    tension = Math.max(1, tension - 2); // Suppress tension in pure comedy
  }

  // 2. Dynamic Mind-Bend (1 to 10)
  let mindBend = 1;
  if (genres.includes(878)) mindBend += 4.5; // Sci-Fi
  if (genres.includes(9648)) mindBend += 4.0; // Mystery
  if (genres.includes(53)) mindBend += 2.5; // Thriller
  if (genres.includes(14)) mindBend += 2.0; // Fantasy
  if (genres.includes(80)) mindBend += 1.5; // Crime

  if (/twist|conspiracy|paradox|dimension|simulation|memory|subconscious|timeline|reality|identity|illusion|quantum|temporal|code|matrix|puzzle|secret|hallucination|parallel|existential|dream/.test(text)) {
    mindBend += 3.0;
  }
  if (genres.includes(10749) && !genres.includes(878) && !genres.includes(9648) && !genres.includes(53)) {
    mindBend = Math.max(1, mindBend - 1.5); // Suppress mind-bend in pure romance
  }

  // 3. Dynamic Emotion (1 to 10)
  let emotion = 1;
  if (genres.includes(10749)) emotion += 4.5; // Romance
  if (genres.includes(18)) emotion += 4.0; // Drama
  if (genres.includes(10751)) emotion += 3.0; // Family
  if (genres.includes(16)) emotion += 2.5; // Animation
  if (genres.includes(36)) emotion += 2.0; // History

  if (/love|heart|tragedy|loss|grief|family|son|daughter|tear|sacrifice|bond|devoted|romance|marriage|friendship|healing|terminal|illness|inspire|reunion|courage|father|mother/.test(text)) {
    emotion += 2.5;
  }

  // 4. Dynamic Humor (1 to 10)
  let humor = 1;
  if (genres.includes(35)) humor += 5.5; // Comedy
  if (genres.includes(16)) humor += 2.5; // Animation
  if (genres.includes(10751)) humor += 2.0; // Family
  if (genres.includes(28) && genres.includes(35)) humor += 1.5; // Action Comedy

  if (/funny|hilarious|comedy|satire|fun|laugh|whimsical|mischief|goofy|parody|wacky|absurd|buddy|misadventure|joke/.test(text)) {
    humor += 2.5;
  }
  if ((genres.includes(27) || genres.includes(18)) && !genres.includes(35)) {
    humor = Math.max(1, humor - 1.5); // Suppress humor in dark drama / horror
  }

  // Final Clamp 1-10
  tension = Math.min(10, Math.max(1, Math.round(tension)));
  mindBend = Math.min(10, Math.max(1, Math.round(mindBend)));
  emotion = Math.min(10, Math.max(1, Math.round(emotion)));
  humor = Math.min(10, Math.max(1, Math.round(humor)));

  // Dynamic Pacing Logic
  let pacing: 'Fast-Paced' | 'Balanced' | 'Slow-Burn Atmospheric' = 'Balanced';
  const effectiveRuntime = runtime || (movie as any).runtime || 110;

  if ((genres.includes(28) || tension >= 7) && effectiveRuntime <= 115) {
    pacing = 'Fast-Paced';
  } else if (humor >= 8 && effectiveRuntime <= 100) {
    pacing = 'Fast-Paced';
  } else if (effectiveRuntime >= 130 || (genres.includes(18) && mindBend >= 7) || (genres.includes(27) && effectiveRuntime >= 115)) {
    pacing = 'Slow-Burn Atmospheric';
  }

  return { pacing, vibeScores: { tension, mindBend, emotion, humor } };
};

export interface MultiSourceRatings {
  imdbRating?: number | null;
  rottenTomatoes?: number | string | null;
  metascore?: number | null;
  tmdbRating?: number | null;
  tmdbVoteCount?: number | null;
  awards?: string | null;
}

export interface ConsensusSourceItem {
  id: 'imdb' | 'rt' | 'meta' | 'tmdb';
  name: string;
  score: number; // 0-100 normalized
  formatted: string; // e.g. "8.4", "92%", "85", "8.1"
  weight: number;
}

export interface IntelligentScoreResult {
  overallScore: number;
  grade: string;
  verdict: string;
  confidence: 'Very High' | 'High' | 'Solid' | 'Moderate';
  activeSources: ConsensusSourceItem[];
  consensusDescription: string;
  breakdown: {
    storyCraft: number;
    immersion: number;
    resonance: number;
    rewatchability: number;
  };
}

export const calculateIntelligentScore = (
  movie: Movie,
  runtime?: number,
  imdbOrMultiRatings?: number | null | MultiSourceRatings,
  additionalRatings?: MultiSourceRatings
): IntelligentScoreResult => {
  const voteAvg = movie.vote_average != null && !isNaN(movie.vote_average) ? movie.vote_average : 6.0;
  const voteCount = movie.vote_count != null && !isNaN(movie.vote_count) ? movie.vote_count : 100;
  const overview = (movie.overview || '').toLowerCase();
  const genres = movie.genre_ids || (movie as any).genres?.map((g: any) => g.id) || [];

  // Parse multi-source input (supports both legacy imdbRating number and MultiSourceRatings object)
  let multi: MultiSourceRatings = {};
  if (typeof imdbOrMultiRatings === 'number') {
    multi = { imdbRating: imdbOrMultiRatings, ...additionalRatings };
  } else if (imdbOrMultiRatings && typeof imdbOrMultiRatings === 'object') {
    multi = { ...imdbOrMultiRatings, ...additionalRatings };
  } else if (additionalRatings) {
    multi = { ...additionalRatings };
  }

  // 1. Extract and normalize individual ratings
  const activeSources: ConsensusSourceItem[] = [];

  // A. IMDb (0-10 scale -> 0-100)
  const imdbVal = multi.imdbRating != null && !isNaN(Number(multi.imdbRating)) && Number(multi.imdbRating) > 0
    ? Number(multi.imdbRating)
    : null;
  if (imdbVal != null) {
    activeSources.push({
      id: 'imdb',
      name: 'IMDb',
      score: Math.min(100, Math.max(10, imdbVal * 10)),
      formatted: imdbVal.toFixed(1),
      weight: 35, // Strong global audience consensus
    });
  }

  // B. Rotten Tomatoes (0-100% scale)
  let rtVal: number | null = null;
  if (multi.rottenTomatoes != null) {
    const parsed = typeof multi.rottenTomatoes === 'string'
      ? parseInt(multi.rottenTomatoes.replace('%', ''), 10)
      : multi.rottenTomatoes;
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      rtVal = parsed;
    }
  }
  if (rtVal != null) {
    // Calibrate binary Tomatometer percentage to a curved 0-100 cinematic score
    let calibratedRt = rtVal;
    if (rtVal >= 90) calibratedRt = 85 + (rtVal - 90) * 1.3;
    else if (rtVal >= 75) calibratedRt = 73 + (rtVal - 75) * 0.8;
    else if (rtVal >= 55) calibratedRt = 55 + (rtVal - 55) * 0.9;
    else calibratedRt = Math.max(12, rtVal * 0.95);

    activeSources.push({
      id: 'rt',
      name: 'Rotten Tomatoes',
      score: Math.min(100, Math.max(10, Math.round(calibratedRt))),
      formatted: `${rtVal}%`,
      weight: 30, // Broad critical consensus
    });
  }

  // C. Metacritic (0-100 scale)
  const metaVal = multi.metascore != null && !isNaN(Number(multi.metascore)) && Number(multi.metascore) > 0
    ? Number(multi.metascore)
    : null;
  if (metaVal != null) {
    activeSources.push({
      id: 'meta',
      name: 'Metacritic',
      score: Math.min(100, Math.max(10, metaVal)),
      formatted: `${metaVal}`,
      weight: 20, // Strict professional critic depth
    });
  }

  // D. TMDB (0-10 scale -> smoothed 0-100)
  const tmdbScoreRaw = multi.tmdbRating ?? voteAvg;
  const tmdbVotes = multi.tmdbVoteCount ?? voteCount;
  // Apply Bayesian smoothing against low vote counts
  const smoothedTmdbScore = tmdbVotes > 0
    ? ((tmdbVotes * (tmdbScoreRaw * 10)) + (40 * 63)) / (tmdbVotes + 40)
    : 63;

  activeSources.push({
    id: 'tmdb',
    name: 'TMDB',
    score: Math.min(100, Math.max(10, Math.round(smoothedTmdbScore))),
    formatted: tmdbScoreRaw.toFixed(1),
    weight: 15, // Community cinephile vote
  });

  // 2. Dynamic Bayesian Consensus Weighting
  const totalAvailableWeight = activeSources.reduce((acc, s) => acc + s.weight, 0);
  let weightedSum = 0;
  for (const src of activeSources) {
    const normalizedWeight = src.weight / totalAvailableWeight;
    weightedSum += src.score * normalizedWeight;
  }

  let overall = Math.round(weightedSum);

  // 3. Consensus Nuance & Critical Agreement Checks
  let consensusDescription = 'Multi-Critic Consensus';
  const hasRT = rtVal != null;
  const hasMeta = metaVal != null;
  const hasImdb = imdbVal != null;

  // Check for Unanimous Acclaim
  if (hasRT && rtVal >= 88 && (imdbVal == null || imdbVal >= 7.8) && (metaVal == null || metaVal >= 75)) {
    overall = Math.min(99, overall + 2);
    consensusDescription = 'Universal Critical & Audience Acclaim';
  }
  // Check for Unanimous Disapproval
  else if (hasRT && rtVal <= 35 && (imdbVal == null || imdbVal <= 5.2) && (metaVal == null || metaVal <= 42)) {
    overall = Math.max(8, overall - 3);
    consensusDescription = 'Broad Critical Pan';
  }
  // Check for Polarized Audience vs Critic Split (e.g. Cult hit or Popcorn divider)
  else if (hasRT && hasImdb && Math.abs((imdbVal * 10) - rtVal) >= 25) {
    consensusDescription = 'Polarized Audience & Critic Split';
  }

  // 4. Prestigious Awards & Accolades Calibration
  const awards = (multi.awards || '').toLowerCase();
  if (/won \d+ oscar|academy award winner|emmy winner|golden globe winner|palme d'or/.test(awards)) {
    overall = Math.min(99, overall + 2);
  }

  // 5. Synopsis Craft & Tone Nuances
  if (overall >= 70 && /masterpiece|acclaimed|groundbreaking|iconic|unforgettable|cinematic triumph/.test(overview)) {
    overall = Math.min(99, overall + 1);
  }
  if (overall <= 52 && /worst|disaster|flop|terrible|boring/.test(overview)) {
    overall = Math.max(8, overall - 2);
  }

  overall = Math.min(99, Math.max(8, overall));

  // Determine Confidence Tier based on source depth
  let confidence: 'Very High' | 'High' | 'Solid' | 'Moderate' = 'Moderate';
  if (activeSources.length >= 4) confidence = 'Very High';
  else if (activeSources.length === 3) confidence = 'High';
  else if (activeSources.length === 2) confidence = 'Solid';

  // 6. Realistic Cinematic Grades & Verdicts
  let grade = 'B';
  let verdict = 'Decent Watch • Casual Stream';

  if (overall >= 85) {
    grade = 'A+';
    verdict = 'Absolute Cinema • Masterpiece';
  } else if (overall >= 78) {
    grade = 'A';
    verdict = 'Must Watch • Critical Acclaim';
  } else if (overall >= 70) {
    grade = 'B+';
    verdict = 'Must Watch • Highly Recommended';
  } else if (overall >= 60) {
    grade = 'B';
    verdict = 'Decent Watch • Engaging Stream';
  } else if (overall >= 50) {
    grade = 'C+';
    verdict = 'Decent Watch • Casual Viewing';
  } else if (overall >= 38) {
    grade = 'C';
    verdict = 'Hard Pass • Mediocre Execution';
  } else {
    grade = 'F';
    verdict = 'Hard Pass • Critical Pan';
  }

  // Sub-Breakdown Ratings
  const storyCraft = Math.min(99, Math.max(10, Math.round(overall * 0.96 + (genres.includes(18) || genres.includes(9648) ? 3 : 0))));
  const immersion = Math.min(99, Math.max(10, Math.round(overall * 0.94 + (genres.includes(878) || genres.includes(28) ? 4 : 0))));
  const resonance = Math.min(99, Math.max(10, Math.round(overall * 0.95)));
  const rewatchability = Math.min(99, Math.max(10, Math.round(overall * 0.88 + (genres.includes(35) || genres.includes(28) ? 6 : 0))));

  return {
    overallScore: overall,
    grade,
    verdict,
    confidence,
    activeSources,
    consensusDescription,
    breakdown: {
      storyCraft,
      immersion,
      resonance,
      rewatchability,
    },
  };
};

export interface VibeChartItem {
  name: string;
  percent: number;
  color: string;
}

export interface MeterTierItem {
  label: 'Hard Pass' | 'Decent Watch' | 'Must Watch' | 'Absolute Cinema';
  percent: number;
  color: string;
}

const GENRE_COLOR_MAP: Record<string, string> = {
  Drama: '#9a3412',       // Warm Rust/Brown
  Thriller: '#1d4ed8',    // Deep Blue
  Action: '#dc2626',      // Crimson Red
  'Sci-Fi': '#8b5cf6',    // Purple
  'Science Fiction': '#8b5cf6', // Purple
  Comedy: '#eab308',      // Yellow
  Horror: '#991b1b',      // Dark Crimson
  Romance: '#f43f5e',     // Rose
  Mystery: '#6366f1',     // Indigo
  Crime: '#ea580c',       // Orange
  Adventure: '#f59e0b',   // Amber
  Animation: '#06b6d4',   // Cyan
  Fantasy: '#d946ef',     // Fuchsia
};

export const calculateVibeChartData = (movie: Movie): VibeChartItem[] => {
  const genres = movie.genre_ids || (movie as any).genres?.map((g: any) => typeof g === 'object' ? g.name : g) || [];
  const overview = (movie.overview || '').toLowerCase();

  const genreIdToName: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
  };

  const detectedNames: string[] = [];
  for (const g of genres) {
    if (typeof g === 'number' && genreIdToName[g]) {
      detectedNames.push(genreIdToName[g]);
    } else if (typeof g === 'string') {
      const normalized = g === 'Science Fiction' ? 'Sci-Fi' : g;
      detectedNames.push(normalized);
    }
  }

  if (detectedNames.length === 0) {
    if (/kill|assassin|danger|threat|survival|chase/.test(overview)) detectedNames.push('Thriller', 'Action');
    else if (/love|heart|romance|family/.test(overview)) detectedNames.push('Drama', 'Romance');
    else if (/twist|dimension|simulation|mystery|alien|space/.test(overview)) detectedNames.push('Sci-Fi', 'Mystery');
    else detectedNames.push('Drama', 'Thriller');
  }

  const unique = Array.from(new Set(detectedNames));
  const topNames = unique.slice(0, 3);
  if (topNames.length === 1) {
    if (topNames[0] === 'Drama') topNames.push('Thriller', 'Action');
    else if (topNames[0] === 'Action') topNames.push('Adventure', 'Thriller');
    else if (topNames[0] === 'Comedy') topNames.push('Romance', 'Drama');
    else if (topNames[0] === 'Sci-Fi') topNames.push('Adventure', 'Mystery');
    else topNames.push('Drama', 'Thriller');
  } else if (topNames.length === 2) {
    topNames.push(topNames.includes('Action') ? 'Thriller' : 'Action');
  }

  // Calculate dynamic, authentic proportions based on genre hierarchy and synopsis frequency
  let percents: number[] = [];
  if (topNames.length === 1) {
    percents = [100];
  } else if (topNames.length === 2) {
    // Dynamic 60/40 or 65/35 split
    const secondGenreKeywords = topNames[1].toLowerCase();
    const hasSecondKeywords = overview.includes(secondGenreKeywords);
    percents = hasSecondKeywords ? [58, 42] : [65, 35];
  } else {
    // 3 Genres: Check overview keyword density for secondary & tertiary genres
    const g2Word = topNames[1].toLowerCase();
    const g3Word = topNames[2].toLowerCase();
    const count2 = (overview.match(new RegExp(g2Word, 'g')) || []).length;
    const count3 = (overview.match(new RegExp(g3Word, 'g')) || []).length;

    if (count2 > count3) {
      percents = [52, 33, 15];
    } else if (count3 > count2) {
      percents = [50, 26, 24];
    } else {
      percents = [54, 30, 16];
    }
  }

  return topNames.map((name, idx) => ({
    name,
    percent: percents[idx] || 10,
    color: GENRE_COLOR_MAP[name] || '#3b82f6',
  }));
};

export const calculateMeterData = (overallScore: number): MeterTierItem[] => {
  let absoluteCinema = 0;
  let mustWatch = 0;
  let decentWatch = 0;
  let hardPass = 0;

  if (overallScore >= 85) {
    // ── Tier 1: Absolute Cinema (Score 85+) ──
    absoluteCinema = Math.min(82, 60 + Math.round((overallScore - 85) * 1.5));
    mustWatch = Math.round((100 - absoluteCinema) * 0.70);
    decentWatch = Math.max(2, Math.round((100 - absoluteCinema - mustWatch) * 0.75));
    hardPass = Math.max(0, 100 - (absoluteCinema + mustWatch + decentWatch));
  } else if (overallScore >= 70) {
    // ── Tier 2: Must Watch (Score 70 - 84) ──
    mustWatch = Math.min(74, 55 + Math.round((overallScore - 70) * 1.2));
    absoluteCinema = Math.round((overallScore - 68) * 1.0);
    decentWatch = Math.max(3, Math.round((100 - mustWatch - absoluteCinema) * 0.75));
    hardPass = Math.max(0, 100 - (mustWatch + absoluteCinema + decentWatch));
  } else if (overallScore >= 50) {
    // ── Tier 3: Decent Watch (Score 50 - 69) ──
    decentWatch = Math.min(68, 52 + Math.round((69 - overallScore) * 0.6));
    mustWatch = Math.max(6, Math.round((overallScore - 48) * 0.9));
    hardPass = Math.max(8, Math.round((100 - decentWatch - mustWatch) * 0.85));
    absoluteCinema = Math.max(0, 100 - (decentWatch + mustWatch + hardPass));
  } else {
    // ── Tier 4: Hard Pass (Score < 50) ──
    hardPass = Math.min(85, 56 + Math.round((50 - overallScore) * 0.8));
    decentWatch = Math.round((100 - hardPass) * 0.7);
    mustWatch = Math.max(1, 100 - (hardPass + decentWatch));
    absoluteCinema = 0;
  }

  return [
    { label: 'Absolute Cinema', percent: absoluteCinema, color: '#f59e0b' },
    { label: 'Must Watch',      percent: mustWatch,      color: '#dc2626' },
    { label: 'Decent Watch',   percent: decentWatch,    color: '#94a3b8' },
    { label: 'Hard Pass',       percent: hardPass,       color: '#ef4444' },
  ];
};

export const queryCineAi = async (prompt: string): Promise<CineAiResponse> => {
  const p = prompt.toLowerCase().trim();

  // ── Strategy 1: Plot Memory Reverse Search ──
  for (const memory of PLOT_MEMORIES) {
    const hasMatch = memory.keywords.some(k => p.includes(k));
    if (hasMatch) {
      try {
        const details = await tmdb.getDetails(memory.movieId, 'movie');
        const recs = await tmdb.getRecommendations(memory.movieId, 'movie');
        const vibe = calculateMovieVibe(details, details.runtime);

        const targetMovie: AiMovieRecommendation = {
          id: details.id,
          title: details.title,
          overview: details.overview,
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          vote_average: details.vote_average,
          release_date: details.release_date,
          runtime: details.runtime,
          matchScore: 100,
          matchReason: memory.reason,
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };

        const similarMovies: AiMovieRecommendation[] = (recs.results || [])
          .slice(0, 3)
          .map((m: Movie) => {
            const v = calculateMovieVibe(m);
            return {
              id: m.id,
              title: m.title,
              overview: m.overview,
              poster_path: m.poster_path,
              backdrop_path: m.backdrop_path,
              vote_average: m.vote_average,
              release_date: m.release_date,
              matchScore: 92,
              matchReason: `Similar energy to ${details.title}`,
              pacing: v.pacing,
              vibeScores: v.vibeScores,
            };
          });

        return {
          message: `I identified the exact film you're thinking of: **${details.title}**! Here it is ready to explore, plus similar titles with that same energy:`,
          recommendations: [targetMovie, ...similarMovies],
          suggestions: [
            `Explore ${details.title}`,
            `More movies like ${details.title}`,
            'Suggest a thriller under 90 mins',
          ],
        };
      } catch (e) {
        console.error(e);
      }
    }
  }

  // ── Strategy 2: Time/Runtime Constrained Queries ("under 90 mins", "short movie") ──
  const runtimeMatch = p.match(/(?:under|less than|within|around)\s+(\d+)\s*(?:mins|minutes|min)/i) ||
    (p.includes('90 min') ? [null, '95'] : null) ||
    (p.includes('short movie') || p.includes('quick watch') ? [null, '95'] : null);

  if (runtimeMatch) {
    const maxMinutes = parseInt(runtimeMatch[1]) || 95;
    const discoverData = await tmdb.discover(
      'movie',
      `sort_by=vote_average.desc&vote_count.gte=500&with_runtime.lte=${maxMinutes}&page=1`
    );

    const recs: AiMovieRecommendation[] = (discoverData.results || [])
      .filter((m: Movie) => m.poster_path)
      .slice(0, 4)
      .map((m: Movie) => {
        const vibe = calculateMovieVibe(m, maxMinutes - 5);
        return {
          id: m.id,
          title: m.title,
          overview: m.overview,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          runtime: maxMinutes - 5,
          matchScore: 98,
          matchReason: `Tight runtime under ${maxMinutes}m • High audience score`,
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };
      });

    return {
      message: `Here are critically acclaimed films that respect your time limit (under ${maxMinutes} minutes) with zero filler:`,
      recommendations: recs,
      suggestions: [
        'Short horror under 90 mins',
        'Fast-paced action under 90 mins',
        'Cozy comedy under 90 mins',
      ],
    };
  }

  // ── Strategy 3: Couple / Compromise Matchmaker ("girlfriend wants X, I want Y") ──
  const isCoupleQuery = p.includes('couple') || p.includes('girlfriend') || p.includes('boyfriend') ||
    p.includes('roommate') || (p.includes('and') && (p.includes('romance') || p.includes('action')));

  if (isCoupleQuery) {
    // Intersect Romance (10749) + Comedy (35) or Action (28) + Comedy/Drama
    const discoverData = await tmdb.discover(
      'movie',
      'with_genres=10749,35&sort_by=vote_average.desc&vote_count.gte=600&page=1'
    );

    const recs: AiMovieRecommendation[] = (discoverData.results || [])
      .slice(0, 4)
      .map((m: Movie) => {
        const vibe = calculateMovieVibe(m);
        return {
          id: m.id,
          title: m.title,
          overview: m.overview,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          matchScore: 99,
          matchReason: 'Perfect Couple Compromise • Heart & Humor',
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };
      });

    return {
      message: "Here are the top crowd-pleaser compromise films guaranteed to make both of you happy tonight:",
      recommendations: recs,
      suggestions: [
        'Romance with thrilling twist',
        'Action comedy couple picks',
        'Feel-good adventure',
      ],
    };
  }

  // ── Strategy 4: Mind-Bending / Twist / Mystery ──
  if (p.includes('twist') || p.includes('mind bend') || p.includes('mind-bend') || p.includes('psychological')) {
    const discoverData = await tmdb.discover(
      'movie',
      'with_genres=9648,53&sort_by=vote_average.desc&vote_count.gte=800&page=1'
    );

    const recs: AiMovieRecommendation[] = (discoverData.results || [])
      .slice(0, 4)
      .map((m: Movie) => {
        const vibe = calculateMovieVibe(m);
        return {
          id: m.id,
          title: m.title,
          overview: m.overview,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average,
          release_date: m.release_date,
          matchScore: 99,
          matchReason: 'Legendary plot twist • High psychological tension',
          pacing: vibe.pacing,
          vibeScores: vibe.vibeScores,
        };
      });

    return {
      message: "Prepare to have your mind completely blown. Here are films with unforgettable twists and psychological depth:",
      recommendations: recs,
      suggestions: [
        'Sci-Fi with time paradoxes',
        'Crime mysteries with shocking endings',
        'Slow-burn psychological thrillers',
      ],
    };
  }

  // ── Strategy 5: General Discovery Fallback ──
  const searchResults = await tmdb.search(prompt, 'movie');
  const valid = (searchResults.results || []).filter((m: Movie) => m.poster_path).slice(0, 4);

  if (valid.length > 0) {
    const recs: AiMovieRecommendation[] = valid.map((m: Movie) => {
      const vibe = calculateMovieVibe(m);
      return {
        id: m.id,
        title: m.title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: m.vote_average,
        release_date: m.release_date,
        matchScore: 94,
        matchReason: 'High thematic relevance to your prompt',
        pacing: vibe.pacing,
        vibeScores: vibe.vibeScores,
      };
    });

    return {
      message: `Here are top matches for "${prompt}":`,
      recommendations: recs,
      suggestions: [
        'More movies like these',
        'Find a comedy instead',
        'Under 90 minutes',
      ],
    };
  }

  // Final fallback: trending
  const trending = await tmdb.getTrending('movie', 'week');
  return {
    message: "Here are trending cinema highlights that audiences are raving about right now:",
    recommendations: (trending.results || []).slice(0, 4).map((m: Movie) => {
      const vibe = calculateMovieVibe(m);
      return {
        id: m.id,
        title: m.title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: m.vote_average,
        release_date: m.release_date,
        matchScore: 90,
        matchReason: 'Trending Audience Favorite',
        pacing: vibe.pacing,
        vibeScores: vibe.vibeScores,
      };
    }),
    suggestions: [
      'Movies under 90 minutes',
      'Mind-bending sci-fi',
      'Couple movie night',
    ],
  };
};
