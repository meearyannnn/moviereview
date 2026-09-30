import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, UserCheck, Film, Tv, Heart, MessageCircle, Trash2, Grid3X3, List } from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, timeAgo, categoryMeta, Spinner } from '@/components/community/communityUtils';
import { useAuth } from '@/contexts/AuthContext';
import { communityService, type CommunityPost, type CommunityProfile } from '@/services/community';
import { PostMediaRenderer } from '@/components/community/PostMediaRenderer';
import { toast } from 'sonner';

// ─── Stat pill ─────────────────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold text-white">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs font-medium text-white/40">{label}</p>
    </div>
  );
}

// ─── Post card (compact) ──────────────────────────────────────────────────────
function ProfilePostCard({ post, currentUserId, onDelete }: {
  post: CommunityPost;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likes, setLikes] = useState(post.likes_count);
  const meta = categoryMeta(post.category);

  const toggleLike = async () => {
    if (!currentUserId) { toast.info('Sign in to like'); return; }
    const next = await communityService.togglePostLike(post.id, currentUserId, liked);
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
  };

  const handleDelete = async () => {
    if (!currentUserId) return;
    const ok = await communityService.deletePost(post.id, currentUserId);
    if (ok) onDelete(post.id);
    else toast.error('Failed to delete');
  };

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-white/[0.12]">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.color}`}>{meta.label}</span>
        <span className="text-[11px] text-white/30">{timeAgo(post.created_at)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80 line-clamp-4">{post.content}</p>
      {/* Media & Attachments */}
      <PostMediaRenderer post={post} />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-[#f5c542]' : 'text-white/30 hover:text-white/70'}`}>
            <Heart className={`h-4 w-4 ${liked ? 'fill-[#f5c542] text-[#f5c542]' : ''}`} />{likes}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-white/30">
            <MessageCircle className="h-4 w-4" />{post.comments_count}
          </span>
        </div>
        {currentUserId === post.user_id && (
          <button onClick={handleDelete} className="p-1 text-white/20 hover:text-[#f5c542] transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ profile, onClose, onSave }: {
  profile: CommunityProfile;
  onClose: () => void;
  onSave: (updates: Partial<CommunityProfile>) => void;
}) {
  const { user } = useAuth();
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!user || !username.trim()) { toast.error('Username cannot be empty'); return; }
    setBusy(true);
    const ok = await communityService.updateProfile(user.id, {
      username: username.trim(),
      bio: bio.trim() || undefined,
    });
    setBusy(false);
    if (ok) { onSave({ username: username.trim(), bio: bio.trim() }); toast.success('Profile updated!'); onClose(); }
    else toast.error('Failed to update profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl" onClick={onClose}>
      <div role="dialog" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-[#c9a24b]/25 bg-[#140a0d] p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold text-white font-display">Edit Profile</h2>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-[#c9a24b]">Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-[#c9a24b]/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none" />
        </label>
        <label className="mb-6 block">
          <span className="mb-1.5 block text-xs font-semibold text-white/50">Bio <span className="text-white/25">(optional)</span></span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200}
            className="w-full resize-none rounded-xl border border-[#c9a24b]/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-[#f5c542] focus:outline-none" />
        </label>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 hover:text-white transition-colors">Cancel</button>
          <button onClick={save} disabled={busy} className="flex-1 rounded-full bg-[#f5c542] py-2.5 text-sm font-bold text-[#1c120c] hover:bg-[#c9a24b] disabled:opacity-40 transition-colors shadow-[0_2px_10px_rgba(245,197,66,0.3)]">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const isOwn = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      communityService.getProfile(userId),
      communityService.getUserPosts(userId, user?.id),
      user && !isOwn ? communityService.isFollowing(user.id, userId) : Promise.resolve(false),
    ]).then(([prof, userPosts, isFollowing]) => {
      setProfile(prof);
      setPosts(userPosts);
      setFollowing(!!isFollowing);
      setLoading(false);
    });
  }, [userId, user, isOwn]);

  const toggleFollow = async () => {
    if (!user || !userId) { toast.info('Sign in to follow'); return; }
    setFollowBusy(true);
    if (following) {
      await communityService.unfollowUser(user.id, userId);
      setFollowing(false);
      setProfile((p) => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p);
    } else {
      await communityService.followUser(user.id, userId);
      setFollowing(true);
      setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p);
    }
    setFollowBusy(false);
  };

  if (loading) {
    return (
      <CommunityLayout>
        <div className="flex h-64 items-center justify-center">
          <Spinner size={8} />
        </div>
      </CommunityLayout>
    );
  }

  if (!profile) {
    return (
      <CommunityLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-white/50">
          <p className="text-lg font-semibold">User not found</p>
          <Link to="/community" className="text-sm text-red-400 hover:underline">Back to Feed</Link>
        </div>
      </CommunityLayout>
    );
  }

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      {/* Profile header card */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-[#c9a24b]/20 bg-[#140a0d]">
        {/* Banner gradient */}
        <div className="h-28 bg-gradient-to-br from-[#c9a24b]/20 via-[#140a0d] to-[#0a0608]" />
        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between" style={{ marginTop: -36 }}>
            <div className="rounded-2xl border-4 border-[#0a0608]">
              <Avatar username={profile.username} url={profile.avatar_url} size={16} />
            </div>
            <div className="flex gap-2 pt-10">
              {isOwn ? (
                <button
                  onClick={() => setShowEdit(true)}
                  className="rounded-full border border-[#c9a24b]/30 px-5 py-2 text-sm font-semibold text-[#f5c542] hover:bg-[#c9a24b]/15 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={followBusy}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${following ? 'border border-white/[0.08] text-white/60 hover:border-[#f5c542]/40 hover:text-[#f5c542]' : 'bg-[#f5c542] text-[#1c120c] font-black hover:bg-[#c9a24b]'}`}
                >
                  {followBusy ? <Spinner size={3} /> : following ? <><UserCheck className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
                </button>
              )}
              <Link to="/community" className="rounded-full border border-[#c9a24b]/20 px-4 py-2 text-sm text-white/50 hover:border-[#c9a24b]/40 hover:text-white transition-colors">
                ← Feed
              </Link>
            </div>
          </div>

          {/* Name + bio */}
          <div className="mt-4">
            <h1 className="text-2xl font-extrabold">{profile.username}</h1>
            {profile.bio && <p className="mt-1.5 text-sm leading-relaxed text-white/55">{profile.bio}</p>}
          </div>

          {/* Stats row */}
          <div className="mt-5 flex gap-8">
            <Stat label="Posts" value={profile.posts_count} />
            <Stat label="Followers" value={profile.followers_count} />
            <Stat label="Following" value={profile.following_count} />
          </div>
        </div>
      </div>

      {/* Posts section */}
      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/35">
          {isOwn ? 'Your Posts' : `Posts`}
        </h2>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] py-16 text-center text-sm text-white/35">
            {isOwn ? "You haven&apos;t posted anything yet." : 'No posts yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <ProfilePostCard
                key={p.id}
                post={p}
                currentUserId={user?.id}
                onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSave={(u) => setProfile((p) => p ? { ...p, ...u } : p)} />}
    </CommunityLayout>
  );
}
