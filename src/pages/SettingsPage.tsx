// src/pages/SettingsPage.tsx — Full Settings Suite matching MovieGuy aesthetic & features
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  HeartPulse,
  PlusCircle,
  Lock,
  Trash2,
  Shield,
  FileText,
  Save,
  LogOut,
  CheckCircle,
  Trophy,
  Plus,
  Clock,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  X,
  Heart,
  ExternalLink,
  Info,
} from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { Avatar, Spinner } from '@/components/community/communityUtils';
import { useAuth } from '@/contexts/AuthContext';
import { communityService } from '@/services/community';
import {
  userSettingsService,
  type UserContribution,
  type ProfileHealthInfo,
} from '@/services/userSettings';
import { toast } from 'sonner';

type SettingsTab =
  | 'edit-profile'
  | 'profile-health'
  | 'my-contributions'
  | 'change-username'
  | 'delete-account'
  | 'privacy-policy'
  | 'terms-of-service';

const GENRE_OPTIONS = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller',
  'Romance', 'Animation', 'Documentary', 'Fantasy', 'Mystery', 'Crime',
];

const FAQS = [
  {
    id: 1,
    question: 'What is Profile Health?',
    answer:
      'Profile Health is a metric that reflects your account standing and compliance with MovieGuy Community Guidelines. A healthy profile ensures uninterrupted access to writing reviews, creating public collections, and submitting content contributions.',
  },
  {
    id: 2,
    question: 'What types of content can result in a strike?',
    answer:
      'Content that violates our policies—such as hate speech, harassment, spam, explicit or offensive media, posting fake/bot reviews, or copyright infringement—will receive strikes upon review by our moderation team.',
  },
  {
    id: 3,
    question: 'How does the strike system work?',
    answer:
      'Strikes are permanent: 1 strike restricts username modifications and content approvals. 2 strikes restrict public commenting and reviews. 3 strikes result in permanent account suspension and removal from the community.',
  },
];

const LEADERBOARD_CONTRIBUTORS = [
  { rank: 1, username: 'CineAuteur', points: 1420, contributions: 89, badge: 'Grand Cinephile' },
  { rank: 2, username: 'NolanFanatic', points: 1180, contributions: 74, badge: 'Film Historian' },
  { rank: 3, username: 'ScorseseGuild', points: 950, contributions: 61, badge: 'Curator' },
  { rank: 4, username: 'TarantinoVault', points: 720, contributions: 45, badge: 'Contributor' },
  { rank: 5, username: 'CriterionBuff', points: 510, contributions: 33, badge: 'Archivist' },
];

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('edit-profile');

  // Edit Profile State
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile Health State
  const [healthInfo, setHealthInfo] = useState<ProfileHealthInfo>({
    strikesCount: 0,
    isGoodStanding: true,
    activeStrikes: [],
  });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // My Contributions State
  const [contributions, setContributions] = useState<UserContribution[]>([]);
  const [contribFilter, setContribFilter] = useState<'All' | 'Approved' | 'Pending' | 'Rejected' | 'Drafts'>('All');
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [newContentName, setNewContentName] = useState('');
  const [newContentType, setNewContentType] = useState<'Movie' | 'TV Show' | 'Director' | 'Synopsis' | 'Trivia' | 'Poster'>('Movie');
  const [newContentDetails, setNewContentDetails] = useState('');
  const [newContentSource, setNewContentSource] = useState('');
  const [submittingContrib, setSubmittingContrib] = useState(false);

  // Change Username State
  const [usernameStep, setUsernameStep] = useState<1 | 2>(1);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);
  const [usernameEligibility, setUsernameEligibility] = useState<{
    canChange: boolean;
    daysRemaining: number;
    hasActiveStrike: boolean;
    nextAllowedDate?: string;
  }>({ canChange: true, daysRemaining: 0, hasActiveStrike: false });

  // Delete Account State
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load initial data
  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setBio((profile as any).bio ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    communityService.getProfile(user.id).then((p) => {
      if (p?.favorite_genres) setGenres(p.favorite_genres);
    });

    userSettingsService.getProfileHealth(user.id).then(setHealthInfo);
    userSettingsService.getContributions(user.id).then(setContributions);
    userSettingsService.checkUsernameEligibility(user.id).then(setUsernameEligibility);
  }, [user]);

  if (!user) {
    return (
      <CommunityLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-white/50">
          <Shield className="h-8 w-8" />
          <p>You must be signed in to access settings.</p>
        </div>
      </CommunityLayout>
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    setBusy(true);
    const ok = await communityService.updateProfile(user.id, {
      username: username.trim(),
      bio: bio.trim() || undefined,
      favorite_genres: genres.length ? genres : undefined,
    });
    setBusy(false);
    if (ok) {
      await refreshProfile();
      setSaved(true);
      toast.success('Profile saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } else {
      toast.error('Failed to save profile changes.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.info('Signed out of MovieGuy');
  };

  const toggleGenre = (g: string) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleAddContribution = async (status: 'pending' | 'draft' = 'pending') => {
    if (!newContentName.trim()) {
      toast.error('Content name is required');
      return;
    }
    setSubmittingContrib(true);
    const created = await userSettingsService.addContribution(user.id, {
      name: newContentName.trim(),
      type: newContentType,
      details: newContentDetails.trim(),
      source_url: newContentSource.trim(),
      status,
    });
    setSubmittingContrib(false);
    setContributions((prev) => [created, ...prev]);
    setIsAddContentOpen(false);
    setNewContentName('');
    setNewContentDetails('');
    setNewContentSource('');
    toast.success(status === 'draft' ? 'Draft saved!' : 'Contribution submitted for review!');
  };

  const handleDeleteContribution = async (id: string) => {
    const ok = await userSettingsService.deleteContribution(user.id, id);
    if (ok) {
      setContributions((prev) => prev.filter((c) => c.id !== id));
      toast.success('Contribution removed');
    }
  };

  const handleSaveNewUsername = async () => {
    if (!newUsernameInput.trim()) {
      toast.error('Please enter a new username');
      return;
    }
    setChangingUsername(true);
    const res = await userSettingsService.updateUsername(user.id, newUsernameInput);
    setChangingUsername(false);

    if (res.success) {
      toast.success('Username successfully updated!');
      await refreshProfile();
      setUsernameStep(1);
      setUsername(newUsernameInput.trim().toLowerCase());
      setNewUsernameInput('');
      const eligibility = await userSettingsService.checkUsernameEligibility(user.id);
      setUsernameEligibility(eligibility);
    } else {
      toast.error(res.error || 'Failed to update username');
    }
  };

  const handleProceedDeleteAccount = async () => {
    if (!deleteConfirmed) return;
    setIsDeleting(true);
    const res = await userSettingsService.scheduleAccountDeletion(user.id);
    setIsDeleting(false);

    if (res.success) {
      toast.success('Account deletion scheduled. You will be signed out.');
      await signOut();
      navigate('/');
    } else {
      toast.error(res.error || 'Failed to schedule deletion.');
    }
  };

  // Filtered contributions list
  const filteredContributions = contributions.filter((c) => {
    if (contribFilter === 'All') return true;
    return c.status.toLowerCase() === contribFilter.toLowerCase();
  });

  const countApproved = contributions.filter((c) => c.status === 'approved').length;
  const countPending = contributions.filter((c) => c.status === 'pending').length;
  const countRejected = contributions.filter((c) => c.status === 'rejected').length;

  return (
    <CommunityLayout>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ── Left Sidebar Navigation (Screenshots 2-5) ── */}
        <aside className="w-full lg:w-64 shrink-0">
          <h1 className="text-2xl font-display font-black text-white mb-6">Settings</h1>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('edit-profile')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'edit-profile'
                  ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-white/70" />
                <span>Edit profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>

            <button
              onClick={() => setActiveTab('profile-health')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'profile-health'
                  ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                <span>Profile Health</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>

            <button
              onClick={() => setActiveTab('my-contributions')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'my-contributions'
                  ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle className="w-4 h-4 text-[#f5c542]" />
                <span>My Contributions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>

            <button
              onClick={() => setActiveTab('change-username')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'change-username'
                  ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-white/70" />
                <span>Change Username</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>

            <button
              onClick={() => setActiveTab('delete-account')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'delete-account'
                  ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete Account</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>

            {/* MORE section */}
            <div className="pt-6 pb-2 px-4">
              <span className="text-[11px] font-mono tracking-wider text-white/40 uppercase">More</span>
            </div>

            <button
              onClick={() => setActiveTab('privacy-policy')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'privacy-policy'
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-white/70" />
                <span>Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>

            <button
              onClick={() => setActiveTab('terms-of-service')}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === 'terms-of-service'
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-white/70" />
                <span>Terms of Service</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </button>
          </nav>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 w-full min-w-0">
          {/* 1. Edit Profile */}
          {activeTab === 'edit-profile' && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-6 lg:p-8 space-y-6">
              <h2 className="text-xl font-display font-bold text-white">Public Profile</h2>

              <div className="flex items-center gap-4">
                <Avatar username={profile?.username ?? 'U'} url={profile?.avatar_url} size={16} />
                <div>
                  <p className="font-semibold text-white text-base">{profile?.username}</p>
                  <p className="text-xs text-white/40">{user.email}</p>
                  <p className="mt-1 text-xs text-white/30">Synced from Google sign-in or auto-generated.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-[#c9a24b] mb-1.5">
                  Bio <span className="text-white/30">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Tell the cinema community about yourself…"
                  className="w-full resize-none rounded-xl border border-white/[0.1] bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none transition-colors"
                />
                <div className="mt-1 flex justify-between text-[11px] font-mono text-white/30">
                  <span>Shown on your public profile.</span>
                  <span>{bio.length}/200</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-mono font-medium text-white/60 mb-2">
                  Favourite Genres <span className="text-white/30">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`rounded-full px-3.5 py-1 text-xs font-mono transition-all border ${
                        genres.includes(g)
                          ? 'border-[#c9a24b] bg-[#c9a24b]/20 text-[#f5c542] font-semibold'
                          : 'border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/70'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
                <button
                  onClick={saveProfile}
                  disabled={busy}
                  className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-mono font-bold transition-all disabled:opacity-40 ${
                    saved
                      ? 'bg-green-600 text-white'
                      : 'bg-[#f5c542] hover:bg-[#c9a24b] text-[#1c120c] shadow-lg'
                  }`}
                >
                  {busy ? <Spinner size={3} /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {busy ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
                </button>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono text-white/40 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}

          {/* 2. Profile Health (Screenshot 4) */}
          {activeTab === 'profile-health' && (
            <div className="space-y-6">
              {/* Header with 3 Heart Status Pill */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-white">Profile Health</h2>
                <div className="flex items-center bg-[#1c1216] border border-white/[0.08] rounded-full p-1 gap-1">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  </div>
                  <div className="w-7 h-7 rounded-full opacity-30 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="w-7 h-7 rounded-full opacity-30 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Info text */}
              <p className="text-xs text-white/50 flex items-start gap-1.5 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 text-white/40 mt-0.5" />
                <span>
                  Strikes are given when other users report your content for violating community guidelines.
                  Strikes are permanent and remain on your account.
                </span>
              </p>

              {/* Good Standing Banner */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center gap-3 text-emerald-400">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Heart className="w-3.5 h-3.5 fill-emerald-400" />
                </div>
                <span className="text-sm font-medium">
                  {healthInfo.isGoodStanding
                    ? 'Your account is in good standing with no active strikes.'
                    : `Your account currently has ${healthInfo.strikesCount} active strike(s).`}
                </span>
              </div>

              {/* Active Strikes section */}
              <div>
                <h3 className="text-sm font-display font-bold text-white mb-2">
                  Active Strikes ({healthInfo.strikesCount})
                </h3>
                <div className="rounded-xl border border-white/[0.08] bg-[#140a0e] p-4 text-xs font-mono text-white/40">
                  {healthInfo.activeStrikes.length === 0 ? (
                    'No active strikes.'
                  ) : (
                    <div className="space-y-2">
                      {healthInfo.activeStrikes.map((s) => (
                        <div key={s.id} className="p-2 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300">
                          <p className="font-bold">{s.reason}</p>
                          <p className="text-[11px] text-white/60">{s.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Frequently Asked Questions */}
              <div>
                <h3 className="text-base font-display font-bold text-white mb-3">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2">
                  {FAQS.map((faq) => {
                    const isOpen = expandedFaq === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-xl border border-white/[0.08] bg-[#140a0e] overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-mono text-white/60">
                              {faq.id}
                            </span>
                            <span className="text-sm font-medium text-white/90">{faq.question}</span>
                          </div>
                          <span className="text-white/40 text-lg font-mono">
                            {isOpen ? '−' : '+'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs text-white/60 font-mono leading-relaxed border-t border-white/[0.04]">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. My Contributions (Screenshot 3) */}
          {activeTab === 'my-contributions' && (
            <div className="space-y-6">
              {/* Header with Leaderboard & Add Content buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">My Contributions</h2>
                  <p className="text-xs text-white/40 mt-1">
                    Manage all content contribution requests that you have submitted
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLeaderboardOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium text-white/80 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
                  >
                    <Trophy className="w-4 h-4 text-[#f5c542]" />
                    Leaderboard
                  </button>
                  <button
                    onClick={() => setIsAddContentOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Content
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-4 text-center">
                  <p className="text-2xl font-bold font-display text-white">{contributions.length}</p>
                  <p className="text-xs font-mono text-white/40 mt-1">Contributions</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-4 text-center">
                  <p className="text-2xl font-bold font-display text-emerald-400">{countApproved}</p>
                  <p className="text-xs font-mono text-white/40 mt-1">Approved</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-4 text-center">
                  <p className="text-2xl font-bold font-display text-amber-400">{countPending}</p>
                  <p className="text-xs font-mono text-white/40 mt-1">Pending</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-4 text-center">
                  <p className="text-2xl font-bold font-display text-red-400">{countRejected}</p>
                  <p className="text-xs font-mono text-white/40 mt-1">Rejected</p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(['All', 'Approved', 'Pending', 'Rejected', 'Drafts'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setContribFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                      contribFilter === filter
                        ? 'bg-white text-black font-bold'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Table / List View */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.08] text-xs font-mono text-white/40">
                  <div className="col-span-4 sm:col-span-5">Name</div>
                  <div className="col-span-2 sm:col-span-2">Type</div>
                  <div className="col-span-3 sm:col-span-2">Added</div>
                  <div className="col-span-3 sm:col-span-2">Status</div>
                  <div className="hidden sm:block sm:col-span-1 text-right">Actions</div>
                </div>

                {filteredContributions.length === 0 ? (
                  <div className="py-16 text-center text-xs font-mono text-white/40">
                    No contributions found.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.05]">
                    {filteredContributions.map((item) => {
                      const statusColor =
                        item.status === 'approved'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : item.status === 'pending'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                          : item.status === 'rejected'
                          ? 'text-red-400 bg-red-500/10 border-red-500/30'
                          : 'text-white/40 bg-white/[0.05] border-white/10';

                      return (
                        <div key={item.id} className="grid grid-cols-12 px-5 py-3.5 items-center text-xs font-mono hover:bg-white/[0.02]">
                          <div className="col-span-4 sm:col-span-5 font-semibold text-white truncate pr-2">
                            {item.name}
                          </div>
                          <div className="col-span-2 sm:col-span-2 text-white/60">
                            {item.type}
                          </div>
                          <div className="col-span-3 sm:col-span-2 text-white/40 text-[11px]">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                          <div className="col-span-3 sm:col-span-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColor}`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="hidden sm:flex sm:col-span-1 justify-end">
                            <button
                              onClick={() => handleDeleteContribution(item.id)}
                              className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"
                              title="Delete submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Change Username (Screenshot 2) */}
          {activeTab === 'change-username' && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#140a0d] p-6 lg:p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Change Username</h2>
                <ul className="mt-3 space-y-1.5 text-xs text-white/60 list-disc list-inside">
                  <li>Users with an active strike can't change their username.</li>
                  <li>Usernames can only be changed once every 30 days.</li>
                </ul>
              </div>

              {usernameStep === 1 && (
                <div className="space-y-4 pt-2">
                  <span className="text-[11px] font-mono tracking-wider text-white/40 uppercase block">
                    STEP 1
                  </span>

                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1.5">
                      Current Username
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={username || profile?.username || ''}
                      className="w-full max-w-md rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setUsernameStep(2)}
                      className="px-6 py-2 rounded-xl text-xs font-mono font-bold text-black bg-white hover:bg-white/90 shadow transition-all"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              )}

              {usernameStep === 2 && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between max-w-md">
                    <span className="text-[11px] font-mono tracking-wider text-[#f5c542] uppercase font-bold">
                      STEP 2: Enter New Username
                    </span>
                    <button
                      onClick={() => setUsernameStep(1)}
                      className="text-xs font-mono text-white/40 hover:text-white"
                    >
                      Back
                    </button>
                  </div>

                  {!usernameEligibility.canChange ? (
                    <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-mono text-amber-300 max-w-md">
                      {usernameEligibility.hasActiveStrike
                        ? "Active strikes prevent changing your username."
                        : `Username can only be changed once every 30 days. You can change it again in ${usernameEligibility.daysRemaining} days (on ${usernameEligibility.nextAllowedDate}).`}
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-xs font-mono text-white/70 mb-1.5">
                          New Username
                        </label>
                        <input
                          type="text"
                          value={newUsernameInput}
                          onChange={(e) => setNewUsernameInput(e.target.value)}
                          placeholder="e.g. cinema_buff99"
                          maxLength={30}
                          className="w-full rounded-xl border border-[#f5c542]/40 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                        />
                        <p className="text-[10px] font-mono text-white/40 mt-1">
                          Letters, numbers, and underscores (3-30 chars).
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveNewUsername}
                          disabled={changingUsername || !newUsernameInput.trim()}
                          className="px-6 py-2.5 rounded-xl text-xs font-mono font-bold text-[#1c120c] bg-[#f5c542] hover:bg-[#c9a24b] transition-all disabled:opacity-40 shadow-lg"
                        >
                          {changingUsername ? 'Updating…' : 'Confirm & Change'}
                        </button>
                        <button
                          onClick={() => setUsernameStep(1)}
                          className="px-4 py-2.5 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/[0.06]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Delete Account (Screenshot 5) */}
          {activeTab === 'delete-account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Delete Account</h2>
                <p className="text-xs text-white/50 mt-1">
                  Before continuing, please review what happens next.
                </p>
              </div>

              {/* 4 Informational Cards */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] divide-y divide-white/[0.06] overflow-hidden">
                {/* 1. Permanent Data Removal */}
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Permanent Data Removal</h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Your profile, ratings, watchlists, and preferences will be erased and cannot be recovered
                    </p>
                  </div>
                </div>

                {/* 2. 30 Day Delete Window */}
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">30 Day Delete Window</h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Your account will be scheduled for deletion and permanently removed after 30 days
                    </p>
                  </div>
                </div>

                {/* 3. Change Your Mind? */}
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Change Your Mind?</h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      You can log in anytime during the next 30 days and cancel the deletion
                    </p>
                  </div>
                </div>

                {/* 4. Active Account Restriction */}
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Active Account Restriction</h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Accounts currently under active strike cannot be deleted until the strike ends
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox & Button */}
              <div className="pt-2 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-white/[0.2] bg-white/[0.04] text-red-500 focus:ring-0"
                  />
                  <span className="text-xs font-mono text-white/80">
                    I understand that my account and data will be permanently deleted
                  </span>
                </label>

                <div>
                  <button
                    onClick={handleProceedDeleteAccount}
                    disabled={!deleteConfirmed || isDeleting}
                    className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      deleteConfirmed
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                        : 'bg-white/[0.06] text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {isDeleting ? 'Scheduling Deletion…' : 'Proceed to Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. Privacy Policy */}
          {activeTab === 'privacy-policy' && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-6 lg:p-8 space-y-4">
              <h2 className="text-2xl font-display font-bold text-white">Privacy Policy</h2>
              <p className="text-xs text-white/60 leading-relaxed font-mono">
                MovieGuy values your privacy. We store strictly necessary account identifiers (such as user ID,
                username, and preferences) to deliver a personalized cinephile experience. Your watchlist, reviews,
                and collection entries are safeguarded via Supabase Row-Level Security. We do not sell user data to
                third parties.
              </p>
              <p className="text-xs text-white/60 leading-relaxed font-mono">
                Movie data and imagery are provided legally through The Movie Database (TMDB) API and legal public RSS syndication.
              </p>
            </div>
          )}

          {/* 7. Terms of Service */}
          {activeTab === 'terms-of-service' && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#140a0e] p-6 lg:p-8 space-y-4">
              <h2 className="text-2xl font-display font-bold text-white">Terms of Service</h2>
              <p className="text-xs text-white/60 leading-relaxed font-mono">
                By participating in the MovieGuy community, you agree to treat fellow cinephiles respectfully.
                Harassment, spoilers without appropriate warnings, spam, and piracy distribution are strictly prohibited.
                Violations will result in strikes and eventual suspension under our Profile Health framework.
              </p>
              <p className="text-xs text-white/40 text-[11px] font-mono">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ── Add Content Contribution Modal ── */}
      {isAddContentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsAddContentOpen(false)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#140a0e] p-6 shadow-2xl relative text-white space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Submit Content Contribution</h3>
              <button
                onClick={() => setIsAddContentOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Content Type</label>
                <select
                  value={newContentType}
                  onChange={(e) => setNewContentType(e.target.value as any)}
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                >
                  <option value="Movie" className="bg-[#140a0e]">Movie</option>
                  <option value="TV Show" className="bg-[#140a0e]">TV Show</option>
                  <option value="Director" className="bg-[#140a0e]">Director / Person</option>
                  <option value="Synopsis" className="bg-[#140a0e]">Synopsis Edit</option>
                  <option value="Trivia" className="bg-[#140a0e]">Behind-The-Scenes Trivia</option>
                  <option value="Poster" className="bg-[#140a0e]">Poster / Banner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Title / Name *</label>
                <input
                  type="text"
                  value={newContentName}
                  onChange={(e) => setNewContentName(e.target.value)}
                  placeholder="e.g. Inception (2010)"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Details / Notes</label>
                <textarea
                  value={newContentDetails}
                  onChange={(e) => setNewContentDetails(e.target.value)}
                  rows={3}
                  placeholder="Describe the contribution or corrections needed..."
                  className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/60 mb-1">Source / Verification Link</label>
                <input
                  type="url"
                  value={newContentSource}
                  onChange={(e) => setNewContentSource(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-sm text-white focus:border-[#f5c542] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAddContribution('draft')}
                disabled={submittingContrib}
                className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/[0.06]"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleAddContribution('pending')}
                disabled={submittingContrib || !newContentName.trim()}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md transition-all disabled:opacity-40"
              >
                {submittingContrib ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard Modal ── */}
      {isLeaderboardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsLeaderboardOpen(false)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#140a0e] p-6 shadow-2xl relative text-white space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#f5c542]" />
                <h3 className="text-lg font-display font-bold">Contributors Leaderboard</h3>
              </div>
              <button
                onClick={() => setIsLeaderboardOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/50 font-mono">
              Top community cinephiles adding missing entries, trivia, and verified database details.
            </p>

            <div className="space-y-2 pt-1">
              {LEADERBOARD_CONTRIBUTORS.map((contributor) => (
                <div
                  key={contributor.rank}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-display font-bold text-sm text-[#f5c542]">
                      #{contributor.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white">{contributor.username}</p>
                      <p className="text-[10px] font-mono text-white/40">{contributor.badge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold font-mono text-[#f5c542]">{contributor.points} pts</p>
                    <p className="text-[10px] font-mono text-white/40">{contributor.contributions} edits</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setIsLeaderboardOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/[0.06]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </CommunityLayout>
  );
}
