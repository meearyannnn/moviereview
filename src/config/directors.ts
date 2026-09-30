// src/config/directors.ts — Curated Master Database of Cinema Directors
// Verified TMDB Person IDs categorized across eras and movements

export type DirectorCategory =
  | 'all'
  | 'legends'
  | 'modern'
  | 'world'
  | 'indian'
  | 'genre';

export interface CuratedDirector {
  id: number;
  name: string;
  knownFor: string;
  era: string;
  category: DirectorCategory[];
}

export const DIRECTOR_CATEGORIES: { id: DirectorCategory; label: string }[] = [
  { id: 'all', label: 'All Masters' },
  { id: 'legends', label: 'Cinema Legends' },
  { id: 'modern', label: 'Modern Auteurs' },
  { id: 'world', label: 'World & Asian Cinema' },
  { id: 'indian', label: 'Indian Cinema Masters' },
  { id: 'genre', label: 'Sci-Fi & Visionaries' },
];

export const CURATED_DIRECTORS: CuratedDirector[] = [
  // ── Modern Icons & Masterminds ──
  {
    id: 1032,
    name: 'Martin Scorsese',
    knownFor: 'Taxi Driver, GoodFellas, The Wolf of Wall Street',
    era: '1967–Present',
    category: ['modern', 'legends'],
  },
  {
    id: 525,
    name: 'Christopher Nolan',
    knownFor: 'Oppenheimer, Interstellar, The Dark Knight, Inception',
    era: '1998–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 138,
    name: 'Quentin Tarantino',
    knownFor: 'Pulp Fiction, Inglourious Basterds, Kill Bill',
    era: '1992–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 488,
    name: 'Steven Spielberg',
    knownFor: 'Jurassic Park, Schindler’s List, Jaws, Raiders of the Lost Ark',
    era: '1971–Present',
    category: ['legends', 'genre'],
  },
  {
    id: 7467,
    name: 'David Fincher',
    knownFor: 'Fight Club, Se7en, The Social Network, Zodiac',
    era: '1992–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 137427,
    name: 'Denis Villeneuve',
    knownFor: 'Dune, Blade Runner 2049, Arrival, Sicario',
    era: '1998–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 2710,
    name: 'James Cameron',
    knownFor: 'Titanic, Avatar, Terminator 2, Aliens',
    era: '1981–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 578,
    name: 'Ridley Scott',
    knownFor: 'Alien, Blade Runner, Gladiator, The Martian',
    era: '1977–Present',
    category: ['legends', 'genre'],
  },
  {
    id: 4762,
    name: 'Paul Thomas Anderson',
    knownFor: 'There Will Be Blood, Boogie Nights, Magnolia',
    era: '1996–Present',
    category: ['modern'],
  },
  {
    id: 5655,
    name: 'Wes Anderson',
    knownFor: 'The Grand Budapest Hotel, Moonrise Kingdom, Fantastic Mr. Fox',
    era: '1996–Present',
    category: ['modern'],
  },
  {
    id: 10828,
    name: 'Guillermo del Toro',
    knownFor: 'Pan’s Labyrinth, The Shape of Water, Pinocchio',
    era: '1993–Present',
    category: ['modern', 'genre', 'world'],
  },
  {
    id: 108,
    name: 'Peter Jackson',
    knownFor: 'The Lord of the Rings Trilogy, King Kong',
    era: '1987–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 45400,
    name: 'Greta Gerwig',
    knownFor: 'Barbie, Little Women, Lady Bird',
    era: '2008–Present',
    category: ['modern'],
  },
  {
    id: 136495,
    name: 'Damien Chazelle',
    knownFor: 'Whiplash, La La Land, First Man, Babylon',
    era: '2009–Present',
    category: ['modern'],
  },
  {
    id: 291263,
    name: 'Jordan Peele',
    knownFor: 'Get Out, Us, Nope',
    era: '2017–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 122423,
    name: 'Yorgos Lanthimos',
    knownFor: 'Poor Things, The Favourite, The Lobster',
    era: '2001–Present',
    category: ['modern', 'world'],
  },
  {
    id: 1145520,
    name: 'Ari Aster',
    knownFor: 'Hereditary, Midsommar, Beau Is Afraid',
    era: '2018–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 138781,
    name: 'Robert Eggers',
    knownFor: 'The Witch, The Lighthouse, The Northman, Nosferatu',
    era: '2015–Present',
    category: ['modern', 'genre'],
  },

  // ── Golden Age & Historical Legends ──
  {
    id: 240,
    name: 'Stanley Kubrick',
    knownFor: '2001: A Space Odyssey, The Shining, A Clockwork Orange',
    era: '1953–1999',
    category: ['legends', 'genre'],
  },
  {
    id: 2636,
    name: 'Alfred Hitchcock',
    knownFor: 'Psycho, Vertigo, Rear Window, North by Northwest',
    era: '1922–1976',
    category: ['legends', 'genre'],
  },
  {
    id: 5026,
    name: 'Akira Kurosawa',
    knownFor: 'Seven Samurai, Rashomon, Ran, Yojimbo',
    era: '1943–1993',
    category: ['legends', 'world'],
  },
  {
    id: 1776,
    name: 'Francis Ford Coppola',
    knownFor: 'The Godfather Trilogy, Apocalypse Now, The Conversation',
    era: '1963–Present',
    category: ['legends'],
  },
  {
    id: 5602,
    name: 'David Lynch',
    knownFor: 'Mulholland Drive, Blue Velvet, Eraserhead, Twin Peaks',
    era: '1977–Present',
    category: ['legends', 'genre'],
  },
  {
    id: 190,
    name: 'Clint Eastwood',
    knownFor: 'Unforgiven, Million Dollar Baby, Mystic River',
    era: '1971–Present',
    category: ['legends'],
  },
  {
    id: 1,
    name: 'George Lucas',
    knownFor: 'Star Wars, American Graffiti, THX 1138',
    era: '1971–Present',
    category: ['legends', 'genre'],
  },
  {
    id: 510,
    name: 'Tim Burton',
    knownFor: 'Edward Scissorhands, Batman, Beetlejuice, Big Fish',
    era: '1985–Present',
    category: ['legends', 'genre'],
  },
  {
    id: 11218,
    name: 'Alfonso Cuarón',
    knownFor: 'Gravity, Children of Men, Roma, Harry Potter 3',
    era: '1991–Present',
    category: ['modern', 'world', 'genre'],
  },
  {
    id: 956,
    name: 'Guy Ritchie',
    knownFor: 'Snatch, Lock Stock and Two Smoking Barrels, Sherlock Holmes',
    era: '1998–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 11090,
    name: 'Edgar Wright',
    knownFor: 'Baby Driver, Shaun of the Dead, Hot Fuzz, Scott Pilgrim',
    era: '1995–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 15218,
    name: 'James Gunn',
    knownFor: 'Guardians of the Galaxy, The Suicide Squad, Superman',
    era: '2006–Present',
    category: ['modern', 'genre'],
  },
  {
    id: 57130,
    name: 'Todd Phillips',
    knownFor: 'Joker, The Hangover Trilogy, War Dogs',
    era: '2000–Present',
    category: ['modern'],
  },

  // ── World & Asian Cinema ──
  {
    id: 21684,
    name: 'Bong Joon-ho',
    knownFor: 'Parasite, Memories of Murder, Snowpiercer',
    era: '2000–Present',
    category: ['world', 'modern'],
  },
  {
    id: 608,
    name: 'Hayao Miyazaki',
    knownFor: 'Spirited Away, Princess Mononoke, My Neighbor Totoro',
    era: '1979–Present',
    category: ['world', 'legends', 'genre'],
  },
  {
    id: 10099,
    name: 'Park Chan-wook',
    knownFor: 'Oldboy, Decision to Leave, The Handmaiden',
    era: '1992–Present',
    category: ['world', 'modern'],
  },
  {
    id: 12453,
    name: 'Wong Kar-wai',
    knownFor: 'In the Mood for Love, Chungking Express, Fallen Angels',
    era: '1988–Present',
    category: ['world', 'legends'],
  },
  {
    id: 55934,
    name: 'Taika Waititi',
    knownFor: 'Jojo Rabbit, Hunt for the Wilderpeople, Thor: Ragnarok',
    era: '2007–Present',
    category: ['world', 'modern'],
  },

  // ── Indian Cinema Masters ──
  {
    id: 147021,
    name: 'S. S. Rajamouli',
    knownFor: 'RRR, Baahubali 2: The Conclusion, Eega, Magadheera',
    era: '2001–Present',
    category: ['indian', 'world'],
  },
  {
    id: 78747,
    name: 'Mani Ratnam',
    knownFor: 'Nayakan, Iruvar, Ponniyin Selvan, Dil Se',
    era: '1983–Present',
    category: ['indian', 'legends'],
  },
  {
    id: 1592411,
    name: 'Lokesh Kanagaraj',
    knownFor: 'Kaithi, Vikram, Leo, Master',
    era: '2017–Present',
    category: ['indian', 'modern'],
  },
  {
    id: 91552,
    name: 'Shankar',
    knownFor: 'Indian, Anniyan, Enthiran, Sivaji',
    era: '1993–Present',
    category: ['indian', 'genre'],
  },
  {
    id: 12160,
    name: 'Satyajit Ray',
    knownFor: 'Pather Panchali, The Apu Trilogy, Charulata',
    era: '1955–1991',
    category: ['indian', 'legends', 'world'],
  },
  {
    id: 85670,
    name: 'Anurag Kashyap',
    knownFor: 'Gangs of Wasseypur, Black Friday, Ugly',
    era: '2004–Present',
    category: ['indian', 'modern'],
  },
  {
    id: 2182258,
    name: 'Prashanth Neel',
    knownFor: 'K.G.F: Chapter 1 & 2, Salaar',
    era: '2014–Present',
    category: ['indian', 'genre'],
  },
  {
    id: 1879517,
    name: 'Sandeep Reddy Vanga',
    knownFor: 'Animal, Kabir Singh, Arjun Reddy',
    era: '2017–Present',
    category: ['indian', 'modern'],
  },
];
