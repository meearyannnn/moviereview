// src/services/userSettings.ts — Settings, Contributions, Health & Account Management
import { supabase } from '@/lib/supabase';

export interface UserContribution {
  id: string;
  user_id: string;
  name: string;
  type: 'Movie' | 'TV Show' | 'Director' | 'Synopsis' | 'Trivia' | 'Poster';
  details?: string;
  source_url?: string;
  status: 'approved' | 'pending' | 'rejected' | 'draft';
  created_at: string;
}

export interface ProfileHealthInfo {
  strikesCount: number;
  isGoodStanding: boolean;
  activeStrikes: Array<{
    id: string;
    reason: string;
    issued_at: string;
    details: string;
  }>;
}

const LOCAL_CONTRIBUTIONS_KEY = 'mg_user_contributions_v1';
const LOCAL_HEALTH_KEY = 'mg_user_health_v1';
const LOCAL_USERNAME_HISTORY_KEY = 'mg_username_history_v1';

export const userSettingsService = {
  // ── Contributions ──────────────────────────────────────────────────────────
  async getContributions(userId: string): Promise<UserContribution[]> {
    try {
      const { data, error } = await supabase
        .from('user_contributions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as UserContribution[];
      }
    } catch {
      // Fallback to local storage
    }

    try {
      const stored = localStorage.getItem(`${LOCAL_CONTRIBUTIONS_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return [];
  },

  async addContribution(
    userId: string,
    contribution: Omit<UserContribution, 'id' | 'user_id' | 'created_at'>
  ): Promise<UserContribution> {
    const newRecord: UserContribution = {
      id: `contrib-${Date.now()}`,
      user_id: userId,
      ...contribution,
      created_at: new Date().toISOString(),
    };

    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('user_contributions')
        .insert({
          user_id: userId,
          name: contribution.name,
          type: contribution.type,
          details: contribution.details || null,
          source_url: contribution.source_url || null,
          status: contribution.status,
        })
        .select()
        .single();

      if (!error && data) {
        return data as UserContribution;
      }
    } catch {
      // Ignore and use local storage fallback
    }

    // Local storage fallback
    try {
      const key = `${LOCAL_CONTRIBUTIONS_KEY}_${userId}`;
      const existing = await this.getContributions(userId);
      const updated = [newRecord, ...existing];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    return newRecord;
  },

  async deleteContribution(userId: string, contributionId: string): Promise<boolean> {
    try {
      await supabase
        .from('user_contributions')
        .delete()
        .eq('id', contributionId)
        .eq('user_id', userId);
    } catch {
      // Ignore
    }

    try {
      const key = `${LOCAL_CONTRIBUTIONS_KEY}_${userId}`;
      const existing = await this.getContributions(userId);
      const updated = existing.filter((c) => c.id !== contributionId);
      localStorage.setItem(key, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  },

  // ── Profile Health & Strikes ────────────────────────────────────────────────
  async getProfileHealth(userId: string): Promise<ProfileHealthInfo> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('strikes_count')
        .eq('id', userId)
        .single();

      if (data && typeof data.strikes_count === 'number') {
        return {
          strikesCount: data.strikes_count,
          isGoodStanding: data.strikes_count === 0,
          activeStrikes: [],
        };
      }
    } catch {
      // Fallback
    }

    try {
      const stored = localStorage.getItem(`${LOCAL_HEALTH_KEY}_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }

    return {
      strikesCount: 0,
      isGoodStanding: true,
      activeStrikes: [],
    };
  },

  // ── Username Change Restrictions ──────────────────────────────────────────
  async checkUsernameEligibility(userId: string): Promise<{
    canChange: boolean;
    daysRemaining: number;
    hasActiveStrike: boolean;
    nextAllowedDate?: string;
  }> {
    const health = await this.getProfileHealth(userId);
    if (health.strikesCount > 0) {
      return {
        canChange: false,
        daysRemaining: 0,
        hasActiveStrike: true,
      };
    }

    // Check last change timestamp
    let lastChangeTimestamp: number | null = null;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('last_username_change')
        .eq('id', userId)
        .single();

      if (data?.last_username_change) {
        lastChangeTimestamp = new Date(data.last_username_change).getTime();
      }
    } catch {
      // Fallback
    }

    if (!lastChangeTimestamp) {
      const local = localStorage.getItem(`${LOCAL_USERNAME_HISTORY_KEY}_${userId}`);
      if (local) {
        lastChangeTimestamp = parseInt(local, 10);
      }
    }

    if (lastChangeTimestamp) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - lastChangeTimestamp;
      if (elapsed < thirtyDaysMs) {
        const remainingMs = thirtyDaysMs - elapsed;
        const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        const nextAllowedDate = new Date(lastChangeTimestamp + thirtyDaysMs).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return {
          canChange: false,
          daysRemaining,
          hasActiveStrike: false,
          nextAllowedDate,
        };
      }
    }

    return {
      canChange: true,
      daysRemaining: 0,
      hasActiveStrike: false,
    };
  },

  async updateUsername(
    userId: string,
    newUsername: string
  ): Promise<{ success: boolean; error?: string }> {
    const eligibility = await this.checkUsernameEligibility(userId);
    if (!eligibility.canChange) {
      if (eligibility.hasActiveStrike) {
        return { success: false, error: "Users with an active strike can't change their username." };
      }
      return {
        success: false,
        error: `Usernames can only be changed once every 30 days. You can change it again in ${eligibility.daysRemaining} days.`,
      };
    }

    const trimmed = newUsername.trim().toLowerCase();
    if (trimmed.length < 3 || trimmed.length > 30) {
      return { success: false, error: 'Username must be between 3 and 30 characters.' };
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return { success: false, error: 'Username can only contain letters, numbers, and underscores.' };
    }

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          username: trimmed,
          last_username_change: nowIso,
          updated_at: nowIso,
        })
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      // Local fallback
    }

    // Persist local timestamp & username
    try {
      localStorage.setItem(`${LOCAL_USERNAME_HISTORY_KEY}_${userId}`, Date.now().toString());
    } catch {
      // Ignore
    }

    return { success: true };
  },

  // ── Account Deletion ───────────────────────────────────────────────────────
  async scheduleAccountDeletion(userId: string): Promise<{ success: boolean; error?: string }> {
    const health = await this.getProfileHealth(userId);
    if (health.strikesCount > 0) {
      return {
        success: false,
        error: 'Accounts currently under active strike cannot be deleted until the strike ends.',
      };
    }

    const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      await supabase
        .from('profiles')
        .update({
          scheduled_delete_at: scheduledDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch {
      // Fallback
    }

    try {
      localStorage.setItem(`mg_scheduled_deletion_${userId}`, scheduledDate);
    } catch {
      // Ignore
    }

    return { success: true };
  },
};
