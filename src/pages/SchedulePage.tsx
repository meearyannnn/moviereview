// pages/SchedulePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Calendar, Clock, Megaphone, Flame, Film, Tv, LayoutGrid, CalendarX } from 'lucide-react';
import {
  scheduleService,
  type DateGroupedSchedule,
  type ScheduleItem,
} from '@/services/schedule';
import { tmdb } from '@/services/tmdb';

type ScheduleMode = 'upcoming' | 'released' | 'announced';
type MediaTypeFilter = 'all' | 'movie' | 'tv';

const YEARS = [2026, 2027, 2028, 2029];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MODES: { id: ScheduleMode; label: string; icon: React.ElementType }[] = [
  { id: 'released', label: 'Released', icon: Calendar },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'announced', label: 'Announced', icon: Megaphone },
];

const TYPES: { id: MediaTypeFilter; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'movie', label: 'Movies', icon: Film },
  { id: 'tv', label: 'Shows', icon: Tv },
];

const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090f]';

const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScheduleMode>('upcoming');
  const [mediaType, setMediaType] = useState<MediaTypeFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null = all upcoming
  const [dateGroups, setDateGroups] = useState<DateGroupedSchedule[]>([]);
  const [announcedItems, setAnnouncedItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        if (mode === 'upcoming') {
          const data = await scheduleService.getUpcomingSchedule(
            selectedYear,
            selectedMonth || undefined,
            mediaType
          );
          if (isMounted) setDateGroups(data);
        } else if (mode === 'released') {
          const data = await scheduleService.getReleasedSchedule(mediaType);
          if (isMounted) setDateGroups(data);
        } else {
          const data = await scheduleService.getAnnouncedSchedule(selectedYear, mediaType);
          if (isMounted) setAnnouncedItems(data);
        }
      } catch (err) {
        console.warn('Error loading schedule:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [mode, mediaType, selectedYear, selectedMonth]);

  const openItem = (item: ScheduleItem) =>
    navigate(item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`);

  const changeMode = (next: ScheduleMode) => {
    setMode(next);
    if (next !== 'upcoming') setSelectedMonth(null);
  };

  const scopeLabel =
    mode === 'released'
      ? 'Recently released'
      : mode === 'announced'
        ? `Announced for ${selectedYear}`
        : selectedMonth
          ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
          : `Coming in ${selectedYear}`;

  const pill = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors ${ring} ${active ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/[0.07]'
    }`;

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors border ${ring} ${active
      ? 'bg-[#f5c542] border-[#f5c542] text-[#1c120c] font-black shadow-md shadow-[#f5c542]/20'
      : 'border-white/10 text-white/60 hover:text-white hover:border-[#c9a24b]/30'
    }`;

  const renderCard = (item: ScheduleItem) => {
    const poster = item.poster_path ? tmdb.getImageUrl(item.poster_path, 'w500') : '/placeholder.svg';
    return (
      <button
        key={`${item.id}_${item.media_type}`}
        type="button"
        onClick={() => openItem(item)}
        aria-label={`${item.title}, ${item.releaseTag}`}
        className={`group flex-none w-36 sm:w-44 text-left rounded-2xl snap-start ${ring}`}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10 transition duration-300 group-hover:ring-white/30 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60">
          <img
            src={poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
            {item.media_type === 'tv' ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
            {item.media_type === 'tv' ? 'Show' : 'Movie'}
          </span>
          <span
            title="Hype score"
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-md"
          >
            <Flame className="h-3 w-3 fill-[#f5c542] text-[#f5c542]" />
            {item.hypeScore}
          </span>
        </div>
        <div className="mt-3 px-0.5">
          <h4 className="truncate font-display text-sm font-semibold text-white/95 transition-colors group-hover:text-white">
            {item.title}
          </h4>
          <p className="mt-0.5 truncate text-xs text-white/45">{item.releaseTag}</p>
        </div>
      </button>
    );
  };

  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 py-24 text-center">
      <CalendarX className="h-8 w-8 text-white/25" />
      <p className="max-w-xs text-sm text-white/50">{message}</p>
      {mode === 'upcoming' && selectedMonth !== null && (
        <button
          onClick={() => setSelectedMonth(null)}
          className={`mt-1 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 ${ring}`}
        >
          Show the whole year
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0608] text-[#f8fafc] selection:bg-[#c9a24b] selection:text-[#1c120c] relative">
      <Navbar />

      {/* ── Cinema Projector Lighting & Curtain Gradients ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-[radial-gradient(ellipse_at_top,_rgba(245,197,66,0.07)_0%,_rgba(201,162,75,0.03)_40%,_transparent_75%)] z-0" />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-black/90 via-[#140a0d]/40 to-transparent z-0" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-black/90 via-[#140a0d]/40 to-transparent z-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {/* Heading */}
        <header className="mb-8 max-w-2xl">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[#c9a24b] mb-1.5 flex items-center gap-2">
            <img src="/assets/branding/movieguy-logo-tight.png" alt="" className="h-3.5 w-auto object-contain" />
            <span>MOVIEGUY CINEMA TIMETABLE</span>
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Release Schedule
          </h1>
          <p className="mt-2 text-sm text-white/50 sm:text-base font-mono">
            Upcoming premieres, curtain calls, and box office release dates.
          </p>
          <div className="w-24 border-t border-[#c9a24b]/40 mt-3" />
        </header>

        {/* Sticky filters */}
        <div className="sticky top-16 z-20 -mx-4 mb-10 border-y border-[#c9a24b]/20 bg-[#140a0d]/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-2xl lg:border lg:px-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Schedule view" className="flex gap-1 overflow-x-auto scrollbar-hide rounded-full bg-white/[0.04] p-1">
                {MODES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={mode === id}
                    onClick={() => changeMode(id)}
                    className={pill(mode === id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <div role="group" aria-label="Type" className="flex gap-1 rounded-full bg-white/[0.04] p-1">
                {TYPES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    aria-pressed={mediaType === id}
                    onClick={() => setMediaType(id)}
                    className={pill(mediaType === id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {(mode === 'upcoming' || mode === 'announced') && (
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-6">
                <div role="group" aria-label="Year" className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      aria-pressed={selectedYear === year}
                      onClick={() => setSelectedYear(year)}
                      className={chip(selectedYear === year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                {mode === 'upcoming' && (
                  <>
                    <div className="hidden h-5 w-px bg-white/10 lg:block" />
                    <div role="group" aria-label="Month" className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                      {MONTHS.map((label, i) => {
                        const num = i + 1;
                        const active = selectedMonth === num;
                        return (
                          <button
                            key={label}
                            aria-pressed={active}
                            onClick={() => setSelectedMonth(active ? null : num)}
                            className={chip(active)}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scope label */}
        <h2 className="mb-6 font-display text-lg font-bold text-white/90 sm:text-xl">{scopeLabel}</h2>

        {/* Content */}
        {loading ? (
          <div className="space-y-10" aria-busy="true" aria-label="Loading schedule">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="grid gap-4 sm:grid-cols-[88px_1fr] sm:gap-6">
                <div className="h-14 w-24 animate-pulse rounded-xl bg-white/[0.05] sm:h-24 sm:w-full" />
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="aspect-[2/3] w-36 shrink-0 animate-pulse rounded-2xl bg-white/[0.05] sm:w-44" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : mode === 'announced' ? (
          announcedItems.length === 0 ? (
            renderEmpty(`Nothing has been announced for ${selectedYear} yet.`)
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 xl:grid-cols-5">
              {announcedItems.map((item) => (
                <div key={`${item.id}_${item.media_type}`} className="[&>button]:w-full">
                  {renderCard(item)}
                </div>
              ))}
            </div>
          )
        ) : dateGroups.length === 0 ? (
          renderEmpty('No releases match these filters. Try another month or type.')
        ) : (
          <div>
            {dateGroups.map((group, idx) => (
              <section
                key={group.dateKey}
                className="grid gap-4 pb-10 sm:grid-cols-[88px_1fr] sm:gap-6"
              >
                {/* Date marker */}
                <div className="flex items-baseline gap-2 sm:flex-col sm:items-start sm:gap-0 sm:pt-1">
                  <span className={`text-xs font-medium ${group.isToday ? 'text-[#f5c542] font-bold' : 'text-white/40'}`}>
                    {group.dayName}
                  </span>
                  <span
                    className={`font-display text-3xl font-extrabold leading-none sm:mt-1 sm:text-4xl ${group.isToday ? 'text-[#f5c542]' : 'text-white'
                      }`}
                  >
                    {group.dayNumber}
                  </span>
                  <span className="text-xs font-medium text-white/50 sm:mt-1">{group.monthName}</span>
                  {group.isToday && (
                    <span className="rounded-full bg-[#f5c542] px-2 py-0.5 text-[10px] font-black text-[#1c120c] sm:mt-2 shadow-sm">
                      Today
                    </span>
                  )}
                </div>

                {/* Releases with timeline rail */}
                <div className="relative min-w-0 sm:border-l sm:border-white/10 sm:pl-6">
                  <span
                    aria-hidden
                    className={`absolute -left-[5px] top-3 hidden h-2.5 w-2.5 rounded-full sm:block ${group.isToday ? 'bg-[#f5c542] shadow-[0_0_0_4px_rgba(245,197,66,0.3)]' : 'bg-white/30'
                      }`}
                  />
                  <div className="-mx-1 flex snap-x gap-3 overflow-x-auto scrollbar-hide px-1 pb-3 pt-1 touch-pan-x sm:gap-4 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]">
                    {group.items.map(renderCard)}
                  </div>
                  {idx < dateGroups.length - 1 && (
                    <div className="mt-6 h-px bg-white/[0.05] sm:hidden" />
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <footer className="safe-bottom-content border-t border-[#c9a24b]/20 bg-[#0a0608] pb-28 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link to="/" className="inline-block group focus:outline-none">
              <img
                src="/assets/branding/movieguy-hero-tight.png"
                alt="MovieGuy"
                className="h-6 sm:h-7 w-auto object-contain transition-all group-hover:brightness-125 group-hover:drop-shadow-[0_0_12px_rgba(245,197,66,0.4)]"
              />
            </Link>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="font-mono text-xs text-white/40">Timetable &amp; release tracking for cinema &amp; TV</span>
          </div>
          <div className="font-mono text-xs text-white/40">© {new Date().getFullYear()} MovieGuy · Data from TMDB &amp; Trakt</div>
        </div>
      </footer>
    </div>
  );
};

export default SchedulePage;
