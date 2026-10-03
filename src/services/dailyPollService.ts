// src/services/dailyPollService.ts — Voting state, calculation & persistence
import { supabase } from '@/lib/supabase';
import { ALL_DAILY_POLLS, type DailyPoll, type PollMovieOption } from '@/config/dailyPolls';

const LOCAL_STORAGE_KEY_VOTES = 'movieguy_daily_poll_user_votes';
const LOCAL_STORAGE_KEY_TALLIES = 'movieguy_daily_poll_tallies';
export const EVENT_POLL_VOTED = 'movieguy_poll_voted';

const inMemoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return inMemoryStore[key] ?? null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {}
  inMemoryStore[key] = value;
}

export interface OptionVoteResult {
  optionId: string;
  votes: number;
  percentage: number;
  isLeader: boolean;
  isUserPick: boolean;
}

export interface PollStats {
  pollId: string;
  totalVotes: number;
  options: OptionVoteResult[];
  userVotedOptionId?: string;
}

class DailyPollService {
  /**
   * Reset store (useful for unit tests)
   */
  clearForTesting(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY_VOTES);
        window.localStorage.removeItem(LOCAL_STORAGE_KEY_TALLIES);
      }
    } catch {}
    delete inMemoryStore[LOCAL_STORAGE_KEY_VOTES];
    delete inMemoryStore[LOCAL_STORAGE_KEY_TALLIES];
  }

  /**
   * Retrieve map of user's votes from localStorage: { [pollId]: optionId }
   */
  getUserVotes(): Record<string, string> {
    try {
      const raw = safeGetItem(LOCAL_STORAGE_KEY_VOTES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get additional community delta votes stored locally
   */
  private getVoteTallies(): Record<string, Record<string, number>> {
    try {
      const raw = safeGetItem(LOCAL_STORAGE_KEY_TALLIES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Check if the user has already voted on this poll
   */
  hasVoted(pollId: string): boolean {
    const votes = this.getUserVotes();
    return Boolean(votes[pollId]);
  }

  /**
   * Get the option the user selected for this poll
   */
  getUserVote(pollId: string): string | undefined {
    const votes = this.getUserVotes();
    return votes[pollId];
  }

  /**
   * Compute live stats & percentages for a poll
   */
  getPollStats(poll: DailyPoll): PollStats {
    const userVotes = this.getUserVotes();
    const userChoice = userVotes[poll.id];
    const tallies = this.getVoteTallies()[poll.id] || {};

    const rawVotes = poll.options.map((opt) => {
      const extra = tallies[opt.id] || 0;
      return {
        optionId: opt.id,
        count: opt.initialVotes + extra,
      };
    });

    const totalVotes = rawVotes.reduce((sum, item) => sum + item.count, 0);
    const maxVotes = Math.max(...rawVotes.map((r) => r.count), 1);

    const options: OptionVoteResult[] = rawVotes.map((r) => {
      const percentage = totalVotes > 0 ? Math.round((r.count / totalVotes) * 100) : 0;
      return {
        optionId: r.optionId,
        votes: r.count,
        percentage,
        isLeader: r.count === maxVotes,
        isUserPick: r.optionId === userChoice,
      };
    });

    return {
      pollId: poll.id,
      totalVotes,
      options,
      userVotedOptionId: userChoice,
    };
  }

  /**
   * Cast or change vote on a poll with optimistic local updates + background Supabase sync
   */
  async castVote(
    pollId: string,
    optionId: string,
    userId?: string | null
  ): Promise<PollStats> {
    const userVotes = this.getUserVotes();
    const prevOption = userVotes[pollId];

    // If voting for the same option, return existing stats
    const poll = ALL_DAILY_POLLS.find((p) => p.id === pollId);
    if (!poll) throw new Error(`Poll ${pollId} not found`);

    if (prevOption === optionId) {
      return this.getPollStats(poll);
    }

    // Update user's pick
    userVotes[pollId] = optionId;
    safeSetItem(LOCAL_STORAGE_KEY_VOTES, JSON.stringify(userVotes));

    // Adjust local tallies (decrement previous if changing vote, increment new)
    const allTallies = this.getVoteTallies();
    if (!allTallies[pollId]) allTallies[pollId] = {};

    if (prevOption && allTallies[pollId][prevOption]) {
      allTallies[pollId][prevOption] = Math.max(0, allTallies[pollId][prevOption] - 1);
    }
    allTallies[pollId][optionId] = (allTallies[pollId][optionId] || 0) + 1;

    safeSetItem(LOCAL_STORAGE_KEY_TALLIES, JSON.stringify(allTallies));

    // Notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENT_POLL_VOTED, {
          detail: { pollId, optionId, prevOption },
        })
      );
    }

    // Background Supabase Sync if authenticated
    if (userId) {
      this.syncVoteToSupabase(pollId, optionId, userId).catch((err) => {
        console.warn('Supabase daily poll sync skipped/failed:', err);
      });
    }

    return this.getPollStats(poll);
  }

  /**
   * Background write to Supabase (idempotent upsert)
   */
  private async syncVoteToSupabase(pollId: string, optionId: string, userId: string) {
    try {
      await supabase.from('daily_poll_votes').upsert(
        {
          poll_id: pollId,
          option_id: optionId,
          user_id: userId,
          voted_at: new Date().toISOString(),
        },
        { onConflict: 'poll_id,user_id' }
      );
    } catch {
      // Table might not exist yet if user hasn't run the migration; safe to ignore
    }
  }
}

export const dailyPollService = new DailyPollService();
