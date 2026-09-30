import { useState, useEffect } from 'react';
import { User, Palette, Bell, Shield, Save, LogOut, CheckCircle } from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { Avatar, Spinner } from '@/components/community/communityUtils';
import { useAuth } from '@/contexts/AuthContext';
import { communityService } from '@/services/community';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const GENRE_OPTIONS = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller',
  'Romance', 'Animation', 'Documentary', 'Fantasy', 'Mystery', 'Crime',
];

type SettingsTab = 'profile' | 'account' | 'notifications';

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setBio((profile as any).bio ?? '');
    }
  }, [profile]);

  // Fetch full community profile for genres
  useEffect(() => {
    if (!user) return;
    communityService.getProfile(user.id).then((p) => {
      if (p?.favorite_genres) setGenres(p.favorite_genres);
    });
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

  const saveProfile = async () => {
    if (!username.trim()) { toast.error('Username cannot be empty'); return; }
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
      toast.success('Profile saved!');
      setTimeout(() => setSaved(false), 3000);
    } else {
      toast.error('Failed to save. Make sure supabase_community_schema.sql has been run.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.info('Signed out of MovieGuy');
  };

  const toggleGenre = (g: string) =>
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const TABS: { key: SettingsTab; label: string; Icon: any }[] = [
    { key: 'profile', label: 'Profile', Icon: User },
    { key: 'account', label: 'Account', Icon: Shield },
    { key: 'notifications', label: 'Notifications', Icon: Bell },
  ];

  return (
    <CommunityLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/45">Manage your MovieGuy Community profile.</p>
      </div>

      <div className="flex gap-8">
        {/* Left: settings tabs */}
        <nav className="hidden w-44 shrink-0 sm:block">
          <div className="space-y-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all text-left ${activeTab === key ? 'bg-[#c9a24b]/20 border border-[#c9a24b]/40 text-[#f5c542]' : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${activeTab === key ? 'text-[#f5c542]' : ''}`} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Right: panel */}
        <div className="min-w-0 flex-1">
          {activeTab === 'profile' && (
            <div className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d] p-6">
              <h2 className="mb-5 text-base font-bold text-white font-display">Public Profile</h2>

              {/* Avatar preview */}
              <div className="mb-6 flex items-center gap-4">
                <Avatar username={profile?.username ?? 'U'} url={profile?.avatar_url} size={14} />
                <div>
                  <p className="font-semibold text-white">{profile?.username}</p>
                  <p className="text-xs text-white/40">{user.email}</p>
                  <p className="mt-1.5 text-xs text-white/30">Avatar synced from Google sign-in or auto-generated.</p>
                </div>
              </div>

              {/* Username */}
              <label className="mb-4 block">
                <span className="mb-1.5 block text-xs font-semibold text-[#c9a24b]">Username</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  className="w-full rounded-xl border border-[#c9a24b]/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none transition-colors"
                />
                <p className="mt-1 text-[11px] text-white/25">Visible to other community members.</p>
              </label>

              {/* Bio */}
              <label className="mb-5 block">
                <span className="mb-1.5 block text-xs font-semibold text-white/50">Bio <span className="text-white/25">(optional)</span></span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Tell the community about yourself…"
                  className="w-full resize-none rounded-xl border border-[#c9a24b]/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none transition-colors"
                />
                <p className="mt-1 flex justify-between text-[11px] text-white/25">
                  <span>Shown on your profile page.</span>
                  <span>{bio.length}/200</span>
                </p>
              </label>

              {/* Favourite genres */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold text-white/50">Favourite Genres <span className="text-white/25">(optional)</span></p>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all border ${genres.includes(g) ? 'border-[#c9a24b] bg-[#c9a24b]/20 text-[#f5c542]' : 'border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={busy}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-40 ${saved ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-[#f5c542] hover:bg-[#c9a24b] text-[#1c120c] font-black shadow-[0_2px_12px_rgba(245,197,66,0.35)]'}`}
              >
                {busy ? <Spinner size={3} /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {busy ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
              </button>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d] p-6">
                <h2 className="mb-4 text-base font-bold text-white font-display">Account</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40">Email address</p>
                    <p className="mt-1 text-sm font-medium text-white">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Account ID</p>
                    <p className="mt-1 font-mono text-xs text-white/40 break-all">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Member since</p>
                    <p className="mt-1 text-sm text-white/70">{new Date(user.created_at ?? '').toLocaleDateString('en', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d] p-6">
                <h2 className="mb-1 text-base font-bold text-[#f5c542] font-display">Sign Out</h2>
                <p className="mb-4 text-sm text-white/45">You'll be signed out of MovieGuy on this device.</p>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-full border border-[#c9a24b]/30 px-5 py-2 text-sm font-semibold text-[#f5c542] hover:bg-[#c9a24b]/15 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
              <h2 className="mb-5 text-base font-bold">Notifications</h2>
              <div className="space-y-4">
                {[
                  { label: 'New followers', desc: 'When someone starts following you' },
                  { label: 'Post likes', desc: 'When someone likes your post' },
                  { label: 'Comments', desc: 'When someone comments on your post' },
                  { label: 'New posts from people you follow', desc: 'Activity from your feed' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-white/35">{desc}</p>
                    </div>
                    <div className="relative h-5 w-9 rounded-full bg-white/20 cursor-pointer">
                      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-white/25">Notification settings coming in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </CommunityLayout>
  );
}
