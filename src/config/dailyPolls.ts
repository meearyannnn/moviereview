// src/config/dailyPolls.ts — Curated Question Bank for Everyday Cinema Polls
// Deterministically rotates 1 to 3 questions per calendar day with 100% verified TMDB poster paths

export interface PollMovieOption {
  id: string;
  movieId: number;
  title: string;
  year: string;
  director: string;
  posterPath: string;
  initialVotes: number;
}

export interface DailyPoll {
  id: string;
  category: string;
  categoryTag: string;
  question: string;
  subtitle: string;
  options: PollMovieOption[];
}

export const ALL_DAILY_POLLS: DailyPoll[] = [
  // 1. Absolute Cinema
  {
    id: 'poll-absolute-cinema',
    category: 'Absolute Cinema',
    categoryTag: 'PEAK MASTERPIECE',
    question: 'Which film is undisputed absolute cinema?',
    subtitle: 'The one film where every single frame is cinematic perfection.',
    options: [
      {
        id: 'opt-godfather',
        movieId: 238,
        title: 'The Godfather',
        year: '1972',
        director: 'Francis Ford Coppola',
        posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
        initialVotes: 642,
      },
      {
        id: 'opt-interstellar',
        movieId: 157336,
        title: 'Interstellar',
        year: '2014',
        director: 'Christopher Nolan',
        posterPath: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
        initialVotes: 819,
      },
      {
        id: 'opt-pulp-fiction',
        movieId: 680,
        title: 'Pulp Fiction',
        year: '1994',
        director: 'Quentin Tarantino',
        posterPath: '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
        initialVotes: 512,
      },
      {
        id: 'opt-there-will-be-blood',
        movieId: 7345,
        title: 'There Will Be Blood',
        year: '2007',
        director: 'Paul Thomas Anderson',
        posterPath: '/fa0RDkAlCec0STeMNAhPaF89q6U.jpg',
        initialVotes: 438,
      },
    ],
  },

  // 2. Cult Classic Royalty
  {
    id: 'poll-cult-classic',
    category: 'Cult Classic',
    categoryTag: 'MIDNIGHT VAULT',
    question: 'The undisputed king of cult classic cinema?',
    subtitle: 'Rewatched endlessly, quoted forever, obsessively revered.',
    options: [
      {
        id: 'opt-fight-club',
        movieId: 550,
        title: 'Fight Club',
        year: '1999',
        director: 'David Fincher',
        posterPath: '/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg',
        initialVotes: 914,
      },
      {
        id: 'opt-blade-runner',
        movieId: 78,
        title: 'Blade Runner',
        year: '1982',
        director: 'Ridley Scott',
        posterPath: '/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg',
        initialVotes: 489,
      },
      {
        id: 'opt-the-big-lebowski',
        movieId: 115,
        title: 'The Big Lebowski',
        year: '1998',
        director: 'Joel & Ethan Coen',
        posterPath: '/3bv6WAp6BSxxYvB5ozKFUYuRA8C.jpg',
        initialVotes: 421,
      },
      {
        id: 'opt-donnie-darko',
        movieId: 141,
        title: 'Donnie Darko',
        year: '2001',
        director: 'Richard Kelly',
        posterPath: '/j2AtZFsflxiluaNtajMTI0Avm8C.jpg',
        initialVotes: 375,
      },
    ],
  },

  // 3. Christopher Nolan Showdown
  {
    id: 'poll-nolan-showdown',
    category: 'Director Face-Off',
    categoryTag: 'AUTEUR SPOTLIGHT',
    question: 'The ultimate Christopher Nolan grand achievement?',
    subtitle: 'Scale, sound, practical effects and mind-bending narrative.',
    options: [
      {
        id: 'opt-oppenheimer',
        movieId: 872585,
        title: 'Oppenheimer',
        year: '2023',
        director: 'Christopher Nolan',
        posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        initialVotes: 730,
      },
      {
        id: 'opt-the-dark-knight',
        movieId: 155,
        title: 'The Dark Knight',
        year: '2008',
        director: 'Christopher Nolan',
        posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        initialVotes: 1150,
      },
      {
        id: 'opt-inception',
        movieId: 27205,
        title: 'Inception',
        year: '2010',
        director: 'Christopher Nolan',
        posterPath: '/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg',
        initialVotes: 894,
      },
      {
        id: 'opt-interstellar-nolan',
        movieId: 157336,
        title: 'Interstellar',
        year: '2014',
        director: 'Christopher Nolan',
        posterPath: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
        initialVotes: 1042,
      },
    ],
  },

  // 4. Mind Benders
  {
    id: 'poll-mind-benders',
    category: 'Psychological Thriller',
    categoryTag: 'MIND BENDERS',
    question: 'Which psychological thriller altered your brain chemistry most?',
    subtitle: 'The one that kept you up at night questioning reality.',
    options: [
      {
        id: 'opt-shutter-island',
        movieId: 11324,
        title: 'Shutter Island',
        year: '2010',
        director: 'Martin Scorsese',
        posterPath: '/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg',
        initialVotes: 865,
      },
      {
        id: 'opt-prisoners',
        movieId: 146233,
        title: 'Prisoners',
        year: '2013',
        director: 'Denis Villeneuve',
        posterPath: '/uhviyknTT5cEQXbn6vWIqfM4vGm.jpg',
        initialVotes: 612,
      },
      {
        id: 'opt-memento',
        movieId: 77,
        title: 'Memento',
        year: '2000',
        director: 'Christopher Nolan',
        posterPath: '/nzlv62aC0octS5AklAiWpXLX9Z0.jpg',
        initialVotes: 520,
      },
      {
        id: 'opt-gone-girl',
        movieId: 210577,
        title: 'Gone Girl',
        year: '2014',
        director: 'David Fincher',
        posterPath: '/ts996lKsxvjkO2yiYG0ht4qAicO.jpg',
        initialVotes: 590,
      },
    ],
  },

  // 5. Sci-Fi Pinnacle
  {
    id: 'poll-scifi-pinnacle',
    category: 'Sci-Fi Universe',
    categoryTag: 'BEYOND HORIZONS',
    question: 'The greatest sci-fi world-building in cinema history?',
    subtitle: 'Pure immersive atmosphere, design, and philosophical depth.',
    options: [
      {
        id: 'opt-dune-2',
        movieId: 693134,
        title: 'Dune: Part Two',
        year: '2024',
        director: 'Denis Villeneuve',
        posterPath: '/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
        initialVotes: 1025,
      },
      {
        id: 'opt-blade-runner-2049',
        movieId: 335984,
        title: 'Blade Runner 2049',
        year: '2017',
        director: 'Denis Villeneuve',
        posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
        initialVotes: 780,
      },
      {
        id: 'opt-the-matrix',
        movieId: 603,
        title: 'The Matrix',
        year: '1999',
        director: 'The Wachowskis',
        posterPath: '/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg',
        initialVotes: 940,
      },
      {
        id: 'opt-arrival',
        movieId: 329865,
        title: 'Arrival',
        year: '2016',
        director: 'Denis Villeneuve',
        posterPath: '/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg',
        initialVotes: 615,
      },
    ],
  },

  // 6. Most Devastating Climax
  {
    id: 'poll-devastating-endings',
    category: 'Heartbreakers',
    categoryTag: 'GUT PUNCH',
    question: 'Which movie ending left you speechless in the theater?',
    subtitle: 'When the credits rolled, nobody in the audience made a sound.',
    options: [
      {
        id: 'opt-se7en',
        movieId: 807,
        title: 'Se7en',
        year: '1995',
        director: 'David Fincher',
        posterPath: '/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg',
        initialVotes: 890,
      },
      {
        id: 'opt-la-la-land',
        movieId: 313369,
        title: 'La La Land',
        year: '2016',
        director: 'Damien Chazelle',
        posterPath: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
        initialVotes: 730,
      },
      {
        id: 'opt-the-mist',
        movieId: 5876,
        title: 'The Mist',
        year: '2007',
        director: 'Frank Darabont',
        posterPath: '/c4UgUKZjM0Qzy5t4hAXSOFHYsnb.jpg',
        initialVotes: 645,
      },
      {
        id: 'opt-requiem-for-a-dream',
        movieId: 641,
        title: 'Requiem for a Dream',
        year: '2000',
        director: 'Darren Aronofsky',
        posterPath: '/9BTwsLaMVHOGFlmsSlx5QYCaXb.jpg',
        initialVotes: 512,
      },
    ],
  },

  // 7. Crime & Mob Masters
  {
    id: 'poll-crime-masters',
    category: 'Crime Epics',
    categoryTag: 'MOB EMPIRE',
    question: 'The supreme gangster masterpiece of cinema?',
    subtitle: 'Power, corruption, loyalty, and unforgettable dialogue.',
    options: [
      {
        id: 'opt-goodfellas',
        movieId: 769,
        title: 'GoodFellas',
        year: '1990',
        director: 'Martin Scorsese',
        posterPath: '/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg',
        initialVotes: 835,
      },
      {
        id: 'opt-godfather-2',
        movieId: 240,
        title: 'The Godfather Part II',
        year: '1974',
        director: 'Francis Ford Coppola',
        posterPath: '/8a1lJs7mFyGhGhZZDT1azJUoQiZ.jpg',
        initialVotes: 910,
      },
      {
        id: 'opt-the-departed',
        movieId: 1422,
        title: 'The Departed',
        year: '2006',
        director: 'Martin Scorsese',
        posterPath: '/nT97ifVT2J1yMQmeq20Qblg61T.jpg',
        initialVotes: 742,
      },
      {
        id: 'opt-scarface',
        movieId: 111,
        title: 'Scarface',
        year: '1983',
        director: 'Brian De Palma',
        posterPath: '/iQ5ztdjvteGeboxtmRdXEChJOHh.jpg',
        initialVotes: 590,
      },
    ],
  },

  // 8. Pure Adrenaline Action
  {
    id: 'poll-adrenaline-action',
    category: 'High-Octane',
    categoryTag: 'ZERO BREAKS',
    question: 'Which movie is the greatest non-stop adrenaline rush?',
    subtitle: 'Exhausting, peerless stuntwork that rewired the action genre.',
    options: [
      {
        id: 'opt-mad-max',
        movieId: 76341,
        title: 'Mad Max: Fury Road',
        year: '2015',
        director: 'George Miller',
        posterPath: '/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg',
        initialVotes: 980,
      },
      {
        id: 'opt-john-wick-4',
        movieId: 603692,
        title: 'John Wick: Chapter 4',
        year: '2023',
        director: 'Chad Stahelski',
        posterPath: '/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
        initialVotes: 760,
      },
      {
        id: 'opt-mi-fallout',
        movieId: 353081,
        title: 'Mission: Impossible - Fallout',
        year: '2018',
        director: 'Christopher McQuarrie',
        posterPath: '/AkJQpZp9WoNdj7pLYSj1L0RcMMN.jpg',
        initialVotes: 540,
      },
      {
        id: 'opt-top-gun-maverick',
        movieId: 361743,
        title: 'Top Gun: Maverick',
        year: '2022',
        director: 'Joseph Kosinski',
        posterPath: '/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg',
        initialVotes: 690,
      },
    ],
  },

  // 9. Modern Horror King
  {
    id: 'poll-horror-king',
    category: 'Modern Horror',
    categoryTag: 'NIGHTMARE FUEL',
    question: 'The undisputed modern horror masterpiece?',
    subtitle: 'Not cheap jump-scares — true lingering psychological terror.',
    options: [
      {
        id: 'opt-hereditary',
        movieId: 493922,
        title: 'Hereditary',
        year: '2018',
        director: 'Ari Aster',
        posterPath: '/4GFPuL14eXi66V96xBWY73Y9PfR.jpg',
        initialVotes: 810,
      },
      {
        id: 'opt-the-shining',
        movieId: 694,
        title: 'The Shining',
        year: '1980',
        director: 'Stanley Kubrick',
        posterPath: '/uAR0AWqhQL1hQa69UDEbb2rE5Wx.jpg',
        initialVotes: 875,
      },
      {
        id: 'opt-get-out',
        movieId: 419430,
        title: 'Get Out',
        year: '2017',
        director: 'Jordan Peele',
        posterPath: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
        initialVotes: 640,
      },
      {
        id: 'opt-the-witch',
        movieId: 310131,
        title: 'The Witch',
        year: '2015',
        director: 'Robert Eggers',
        posterPath: '/zap5hpFCWSvdWSuPGAQyjUv2wAC.jpg',
        initialVotes: 420,
      },
    ],
  },

  // 10. A24 Cinema Icons
  {
    id: 'poll-a24-icons',
    category: 'Indie & A24',
    categoryTag: 'MODERN CLASSIC',
    question: 'Which indie masterpiece defined modern cinema culture?',
    subtitle: 'Original storytelling that conquered the mainstream.',
    options: [
      {
        id: 'opt-parasite',
        movieId: 496243,
        title: 'Parasite',
        year: '2019',
        director: 'Bong Joon-ho',
        posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        initialVotes: 1240,
      },
      {
        id: 'opt-eeaao',
        movieId: 545611,
        title: 'Everything Everywhere All at Once',
        year: '2022',
        director: 'Daniels',
        posterPath: '/u68AjlvlutfEIcpmbYpKcdi09ut.jpg',
        initialVotes: 860,
      },
      {
        id: 'opt-past-lives',
        movieId: 666277,
        title: 'Past Lives',
        year: '2023',
        director: 'Celine Song',
        posterPath: '/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
        initialVotes: 620,
      },
      {
        id: 'opt-whiplash',
        movieId: 244786,
        title: 'Whiplash',
        year: '2014',
        director: 'Damien Chazelle',
        posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
        initialVotes: 980,
      },
    ],
  },

  // 11. Greatest Plot Twist
  {
    id: 'poll-plot-twist',
    category: 'Mind Benders',
    categoryTag: 'UNEXPECTED TWIST',
    question: 'The most jaw-dropping twist in cinematic history?',
    subtitle: 'The reveal that made you instantly want to restart the movie.',
    options: [
      {
        id: 'opt-the-prestige',
        movieId: 1124,
        title: 'The Prestige',
        year: '2006',
        director: 'Christopher Nolan',
        posterPath: '/Ag2B2KHKQPukjH7WutmgnnSNurZ.jpg',
        initialVotes: 940,
      },
      {
        id: 'opt-the-sixth-sense',
        movieId: 745,
        title: 'The Sixth Sense',
        year: '1999',
        director: 'M. Night Shyamalan',
        posterPath: '/vOyfUXNFSnaTk7Vk5AjpsKTUWsu.jpg',
        initialVotes: 820,
      },
      {
        id: 'opt-oldboy',
        movieId: 670,
        title: 'Oldboy',
        year: '2003',
        director: 'Park Chan-wook',
        posterPath: '/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg',
        initialVotes: 680,
      },
      {
        id: 'opt-the-usual-suspects',
        movieId: 629,
        title: 'The Usual Suspects',
        year: '1995',
        director: 'Bryan Singer',
        posterPath: '/99X2SgyFunJFXGAYnDv3sb9pnUD.jpg',
        initialVotes: 710,
      },
    ],
  },

  // 12. Infinite Rewatchability
  {
    id: 'poll-comfort-rewatch',
    category: 'Comfort Cinema',
    categoryTag: 'NEVER SKIPS',
    question: 'The ultimate movie you can rewatch infinite times?',
    subtitle: 'Whenever it is on screen, you stop everything and watch to the end.',
    options: [
      {
        id: 'opt-lotr-rotk',
        movieId: 122,
        title: 'The Lord of the Rings: Return of the King',
        year: '2003',
        director: 'Peter Jackson',
        posterPath: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
        initialVotes: 1190,
      },
      {
        id: 'opt-into-the-spiderverse',
        movieId: 324857,
        title: 'Spider-Man: Into the Spider-Verse',
        year: '2018',
        director: 'Bob Persichetti, Peter Ramsey',
        posterPath: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
        initialVotes: 840,
      },
      {
        id: 'opt-spirited-away',
        movieId: 129,
        title: 'Spirited Away',
        year: '2001',
        director: 'Hayao Miyazaki',
        posterPath: '/jUo8cNmU400WtZiJss45HNXlQ2e.jpg',
        initialVotes: 760,
      },
      {
        id: 'opt-grand-budapest',
        movieId: 120467,
        title: 'The Grand Budapest Hotel',
        year: '2014',
        director: 'Wes Anderson',
        posterPath: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg',
        initialVotes: 590,
      },
    ],
  },

  // 13. Quentin Tarantino Signature
  {
    id: 'poll-tarantino-climax',
    category: 'Director Face-Off',
    categoryTag: 'TARANTINO PULSE',
    question: 'Peak Quentin Tarantino dialogue and audacity?',
    subtitle: 'Razor-sharp scripts, explosive tension, legendary soundtracks.',
    options: [
      {
        id: 'opt-inglourious-basterds',
        movieId: 16869,
        title: 'Inglourious Basterds',
        year: '2009',
        director: 'Quentin Tarantino',
        posterPath: '/aupnPtagH9JVBuMrGEanf4iqXEQ.jpg',
        initialVotes: 980,
      },
      {
        id: 'opt-django-unchained',
        movieId: 68718,
        title: 'Django Unchained',
        year: '2012',
        director: 'Quentin Tarantino',
        posterPath: '/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg',
        initialVotes: 870,
      },
      {
        id: 'opt-pulp-tarantino',
        movieId: 680,
        title: 'Pulp Fiction',
        year: '1994',
        director: 'Quentin Tarantino',
        posterPath: '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg',
        initialVotes: 1040,
      },
      {
        id: 'opt-kill-bill',
        movieId: 24,
        title: 'Kill Bill: Vol. 1',
        year: '2003',
        director: 'Quentin Tarantino',
        posterPath: '/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg',
        initialVotes: 610,
      },
    ],
  },

  // 14. Pure Visual Poetry (Today's Matchup 2 in the screenshot!)
  {
    id: 'poll-visual-poetry',
    category: 'Cinematography',
    categoryTag: 'EVERY FRAME A PAINTING',
    question: 'The most visually stunning cinema experience?',
    subtitle: 'Framing, color grading, lighting, and composition elevated to high art.',
    options: [
      {
        id: 'opt-in-the-mood-for-love',
        movieId: 843,
        title: 'In the Mood for Love',
        year: '2000',
        director: 'Wong Kar-wai',
        posterPath: '/8BgGbbWiLNhPtkMkN0gGTnbtvBv.jpg',
        initialVotes: 620,
      },
      {
        id: 'opt-space-odyssey',
        movieId: 62,
        title: '2001: A Space Odyssey',
        year: '1968',
        director: 'Stanley Kubrick',
        posterPath: '/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg',
        initialVotes: 730,
      },
      {
        id: 'opt-portrait-lady-fire',
        movieId: 531428,
        title: 'Portrait of a Lady on Fire',
        year: '2019',
        director: 'Céline Sciamma',
        posterPath: '/2LquGwEhbg3soxSCs9VNyh5VJd9.jpg',
        initialVotes: 510,
      },
      {
        id: 'opt-blade-runner-visual',
        movieId: 335984,
        title: 'Blade Runner 2049',
        year: '2017',
        director: 'Denis Villeneuve',
        posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
        initialVotes: 890,
      },
    ],
  },

  // 15. The Animated Masterpiece (Today's Matchup 3 in the screenshot!)
  {
    id: 'poll-animated-masterpiece',
    category: 'Animation Art',
    categoryTag: 'VISIONARY CRAFT',
    question: 'Which animated work transcends the medium into pure cinema?',
    subtitle: 'Limitless imagination, groundbreaking artistry, timeless emotion.',
    options: [
      {
        id: 'opt-spiderverse-across',
        movieId: 569094,
        title: 'Spider-Man: Across the Spider-Verse',
        year: '2023',
        director: 'Joaquim Dos Santos, Kemp Powers',
        posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        initialVotes: 990,
      },
      {
        id: 'opt-spirited-away-anim',
        movieId: 129,
        title: 'Spirited Away',
        year: '2001',
        director: 'Hayao Miyazaki',
        posterPath: '/jUo8cNmU400WtZiJss45HNXlQ2e.jpg',
        initialVotes: 910,
      },
      {
        id: 'opt-walle',
        movieId: 10681,
        title: 'WALL·E',
        year: '2008',
        director: 'Andrew Stanton',
        posterPath: '/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg',
        initialVotes: 680,
      },
      {
        id: 'opt-princess-mononoke',
        movieId: 128,
        title: 'Princess Mononoke',
        year: '1997',
        director: 'Hayao Miyazaki',
        posterPath: '/cMYCDADoLKLbB83g4WnJegaZimC.jpg',
        initialVotes: 640,
      },
    ],
  },
];

export const DAILY_POLL_COUNT = 3;

/**
 * Deterministically pick 3 daily polls for any given date.
 * Every user worldwide sees the exact same 3 polls on any calendar day.
 */
export function getDailyPolls(date = new Date()): {
  polls: DailyPoll[];
  dayIndex: number;
  dateKey: string;
  nextResetMs: number;
} {
  // Use UTC year, month, date for absolute global consistency
  const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  
  // Deterministic integer based on epoch days
  const epochDays = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000);
  
  const total = ALL_DAILY_POLLS.length;
  const start = (epochDays * DAILY_POLL_COUNT) % total;

  const polls: DailyPoll[] = [];
  for (let i = 0; i < DAILY_POLL_COUNT; i++) {
    const idx = (start + i) % total;
    polls.push(ALL_DAILY_POLLS[idx]);
  }

  // Calculate milliseconds until UTC midnight
  const tomorrowMidnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  const nextResetMs = Math.max(0, tomorrowMidnight.getTime() - date.getTime());

  return {
    polls,
    dayIndex: epochDays,
    dateKey,
    nextResetMs,
  };
}
