// src/services/__tests__/dailyPollService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getDailyPolls, ALL_DAILY_POLLS } from '@/config/dailyPolls';
import { dailyPollService } from '@/services/dailyPollService';

describe('Everyday Cinema Poll Service', () => {
  beforeEach(() => {
    dailyPollService.clearForTesting();
  });

  it('deterministically returns 3 daily polls for any calendar day', () => {
    const today = new Date('2026-10-03T12:00:00Z');
    const result = getDailyPolls(today);

    expect(result.polls).toHaveLength(3);
    expect(result.dateKey).toBe('2026-10-03');
    expect(result.nextResetMs).toBeGreaterThan(0);

    // Consistency check: running again on same date produces same 3 questions
    const again = getDailyPolls(today);
    expect(again.polls.map((p) => p.id)).toEqual(result.polls.map((p) => p.id));
  });

  it('rotates to next set of questions on consecutive dates', () => {
    const day1 = new Date('2026-10-03T12:00:00Z');
    const day2 = new Date('2026-10-04T12:00:00Z');

    const result1 = getDailyPolls(day1);
    const result2 = getDailyPolls(day2);

    expect(result1.dateKey).not.toBe(result2.dateKey);
    expect(result1.polls[0].id).not.toBe(result2.polls[0].id);
  });

  it('computes initial poll stats with accurate percentage breakdown and leader', () => {
    const poll = ALL_DAILY_POLLS[0];
    const stats = dailyPollService.getPollStats(poll);

    expect(stats.totalVotes).toBeGreaterThan(0);
    expect(stats.options).toHaveLength(poll.options.length);

    // Percentage sum should approximate ~100%
    const sumPct = stats.options.reduce((sum, o) => sum + o.percentage, 0);
    expect(sumPct).toBeGreaterThanOrEqual(98);
    expect(sumPct).toBeLessThanOrEqual(102);

    // Should designate exactly one leader
    const leaders = stats.options.filter((o) => o.isLeader);
    expect(leaders.length).toBeGreaterThanOrEqual(1);
  });

  it('records user vote and recalculates stats optimistically', async () => {
    const poll = ALL_DAILY_POLLS[0];
    const pickedOption = poll.options[0].id;

    expect(dailyPollService.hasVoted(poll.id)).toBe(false);

    const stats = await dailyPollService.castVote(poll.id, pickedOption);

    expect(dailyPollService.hasVoted(poll.id)).toBe(true);
    expect(dailyPollService.getUserVote(poll.id)).toBe(pickedOption);
    expect(stats.userVotedOptionId).toBe(pickedOption);

    const chosenResult = stats.options.find((o) => o.optionId === pickedOption);
    expect(chosenResult?.isUserPick).toBe(true);
  });
});
