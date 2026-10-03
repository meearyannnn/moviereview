// src/components/home/DailyCinemaPollSection.tsx — Daily Cinema Polls (3 matchups per day)
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Clock, ExternalLink } from 'lucide-react';
import { getDailyPolls, type DailyPoll } from '@/config/dailyPolls';
import { dailyPollService, type PollStats, EVENT_POLL_VOTED } from '@/services/dailyPollService';
import { useAuth } from '@/contexts/AuthContext';
import { tmdb } from '@/services/tmdb';

const PLACEHOLDER = '/placeholder.svg';

export const DailyCinemaPollSection: React.FC = () => {
  const { user } = useAuth();

  const { polls } = useMemo(() => getDailyPolls(new Date()), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const poll: DailyPoll = polls[activeIndex] || polls[0];

  const readVoted = () =>
    Object.fromEntries(polls.map((p) => [p.id, dailyPollService.hasVoted(p.id)])) as Record<string, boolean>;

  const [stats, setStats] = useState<PollStats>(() => dailyPollService.getPollStats(poll));
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>(readVoted);

  useEffect(() => {
    setStats(dailyPollService.getPollStats(poll));
    setHoverId(null);
  }, [poll]);

  useEffect(() => {
    const onVoted = () => {
      setStats(dailyPollService.getPollStats(poll));
      setVotedMap(readVoted());
    };
    window.addEventListener(EVENT_POLL_VOTED, onVoted);
    return () => window.removeEventListener(EVENT_POLL_VOTED, onVoted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll, polls]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
      const diff = Math.max(0, next - now.getTime());
      setTimeLeft(`${Math.floor(diff / 3_600_000)}h ${Math.floor((diff % 3_600_000) / 60_000)}m`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleVote = async (optionId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await dailyPollService.castVote(poll.id, optionId, user?.id);
      setStats(updated);
      setVotedMap((prev) => ({ ...prev, [poll.id]: true }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasVoted = Boolean(stats.userVotedOptionId);
  const doneCount = Object.values(votedMap).filter(Boolean).length;
  const posterOf = (path?: string | null) => (path ? tmdb.getImageUrl(path, 'w342') : PLACEHOLDER);

  // Whichever poster is "in focus" tints the whole section: hover > your pick > leader > first.
  const leaderId = stats.options.find((o) => o.isLeader)?.optionId;
  const focusId = hoverId ?? stats.userVotedOptionId ?? (hasVoted ? leaderId : undefined) ?? poll.options[0]?.id;
  const focusOption = poll.options.find((o) => o.id === focusId) ?? poll.options[0];

  const spotlight = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <section
      id="daily-poll"
      aria-label="Daily cinema poll"
      className="scroll-mt-24 relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[#0b0508] p-5 sm:p-8"
    >
      {/* Dynamic backdrop: blurred poster of the focused film, crossfades as focus changes */}
      {poll.options.map((o) => (
        <img
          key={o.id}
          src={posterOf(o.posterPath)}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 -z-10 h-full w-full scale-125 object-cover blur-3xl saturate-150 transition-opacity duration-700 motion-reduce:transition-none ${o.id === focusOption?.id ? 'opacity-30' : 'opacity-0'
            }`}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Pick a side
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
            <Clock className="h-3.5 w-3.5" />
            New matchups in {timeLeft || 'today'} · {doneCount}/{polls.length} voted
          </p>
        </div>

        {/* Segmented matchup switcher */}
        <nav className="flex gap-1 rounded-full bg-white/[0.06] p-1 backdrop-blur" aria-label="Matchups">
          {polls.map((p, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-current={active}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542] ${active ? 'bg-[#f5c542] text-black shadow-lg shadow-[#f5c542]/25' : 'text-white/60 hover:text-white'
                  }`}
              >
                {active ? p.category : i + 1}
                {votedMap[p.id] && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Question */}
      <div className="mt-8 max-w-2xl" key={poll.id}>
        <h3 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl">
          {poll.question}
        </h3>
        <p className="mt-2 text-white/60">{poll.subtitle}</p>
      </div>

      {/* Options */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {poll.options.map((option) => {
          const s = stats.options.find((o) => o.optionId === option.id);
          const pct = s?.percentage ?? 0;
          const votes = s?.votes ?? option.initialVotes;
          const isPick = s?.isUserPick ?? false;
          const isLeader = s?.isLeader ?? false;

          return (
            <div
              key={option.id}
              role="button"
              tabIndex={0}
              aria-pressed={isPick}
              aria-label={`Vote for ${option.title}`}
              onClick={() => handleVote(option.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleVote(option.id);
                }
              }}
              onMouseMove={spotlight}
              onMouseEnter={() => setHoverId(option.id)}
              onMouseLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(option.id)}
              onBlur={() => setHoverId(null)}
              className={`group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-2xl bg-black outline-none ring-1 transition-all duration-500 focus-visible:ring-2 focus-visible:ring-[#f5c542] motion-reduce:transition-none ${isPick
                  ? 'ring-2 ring-[#f5c542] shadow-2xl shadow-[#f5c542]/30'
                  : 'ring-white/10 hover:ring-white/30'
                } ${hasVoted && !isPick && !isLeader ? 'opacity-70 hover:opacity-100' : ''} ${!hasVoted ? 'hover:-translate-y-1.5' : ''
                }`}
            >
              <img
                src={posterOf(option.posterPath)}
                alt={option.title}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 motion-reduce:transition-none ${hasVoted && !isPick ? 'grayscale-[40%]' : ''
                  }`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PLACEHOLDER;
                }}
              />

              {/* Cursor-following spotlight */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(220px_circle_at_var(--mx,50%)_var(--my,50%),rgba(245,197,66,0.22),transparent_70%)]" />

              {/* Result fill: rises from the bottom to the vote share */}
              {hasVoted && (
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out motion-reduce:transition-none ${isPick
                      ? 'bg-gradient-to-t from-[#f5c542]/70 to-[#f5c542]/20'
                      : 'bg-gradient-to-t from-white/30 to-white/5'
                    }`}
                  style={{ height: `${pct}%` }}
                />
              )}

              {/* Legibility gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Detail link */}
              <Link
                to={`/movie/${option.movieId}`}
                onClick={(e) => e.stopPropagation()}
                title={`View ${option.title}`}
                aria-label={`View ${option.title} details`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 backdrop-blur transition hover:bg-[#f5c542] hover:text-black focus-visible:opacity-100 group-hover:opacity-100"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>

              {/* Your pick badge */}
              {isPick && (
                <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#f5c542] text-black shadow-lg">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
              )}

              {/* Bottom info */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                {hasVoted && (
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className={`font-display text-3xl font-black tabular-nums sm:text-4xl ${isPick ? 'text-[#f5c542]' : 'text-white'}`}>
                      {pct}%
                    </span>
                    {isLeader && <span className="text-xs font-semibold text-white/80">leading</span>}
                  </div>
                )}
                <h4 className="line-clamp-2 font-display text-base font-bold leading-tight text-white sm:text-lg">
                  {option.title}
                </h4>
                <p className="mt-0.5 truncate text-xs text-white/60">
                  {option.year} · {option.director}
                  {hasVoted && ` · ${votes.toLocaleString()} votes`}
                </p>
                {!hasVoted && (
                  <span className="mt-2 inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-xs font-bold text-white backdrop-blur transition-colors group-hover:bg-[#f5c542] group-hover:text-black">
                    Vote
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className={hasVoted ? 'font-medium text-emerald-400' : 'text-white/50'}>
          {hasVoted
            ? `Vote saved. Tap another film to change it.`
            : `Tap a film to vote.`}
        </p>
        <button
          type="button"
          onClick={() => setActiveIndex((i) => (i + 1) % polls.length)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c542]"
        >
          {activeIndex < polls.length - 1 ? 'Next matchup' : 'Back to first'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </section>
  );
};