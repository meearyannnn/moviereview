import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, UserPlus } from 'lucide-react';
import { communityService } from '@/services/community';
import { Avatar } from './communityUtils';
import { useAuth } from '@/contexts/AuthContext';

interface MemberRow {
  id: string;
  username: string;
  avatar_url?: string;
  posts_count?: number;
}

export function CommunityRightPanel() {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    communityService.getGlobalFeed(null, 60, 0).then((posts) => {
      const seen = new Set<string>();
      const unique: MemberRow[] = [];
      for (const p of posts) {
        if (!seen.has(p.user_id) && p.user_id !== user?.id) {
          seen.add(p.user_id);
          unique.push({ id: p.user_id, username: p.username, avatar_url: p.avatar_url });
        }
        if (unique.length >= 6) break;
      }
      setMembers(unique);
    });
  }, [user]);

  return (
    <>
      {/* Who to follow */}
      {members.length > 0 && (
        <section className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/80 p-5 shadow-lg">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#c9a24b]">
            <UserPlus className="h-3.5 w-3.5 text-[#f5c542]" />
            Who to follow
          </h3>
          <ul className="space-y-4">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <Avatar username={m.username} url={m.avatar_url} size={8} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/community/user/${m.id}`}
                    className="block truncate text-sm font-semibold text-white hover:text-[#f5c542] transition-colors"
                  >
                    {m.username}
                  </Link>
                  <p className="text-xs text-white/40 font-mono">Cinephile</p>
                </div>
                <Link
                  to={`/community/user/${m.id}`}
                  className="shrink-0 rounded-full border border-[#c9a24b]/30 px-3 py-1 text-xs font-semibold text-white/70 hover:border-[#c9a24b]/70 hover:text-[#f5c542] hover:bg-[#c9a24b]/10 transition-colors"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Trending topics */}
      <section className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/80 p-5 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-[#c9a24b]">
          <TrendingUp className="h-3.5 w-3.5 text-[#f5c542]" />
          Hot Topics
        </h3>
        <ul className="space-y-3">
          {[
            { tag: '#AbsoluteCinema', posts: '240+ posts' },
            { tag: '#MustWatch2025', posts: '180+ posts' },
            { tag: '#HardPass', posts: '90+ posts' },
            { tag: '#HiddenGems', posts: '140+ posts' },
            { tag: '#WeekendWatch', posts: '320+ posts' },
          ].map((t) => (
            <li key={t.tag} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white hover:text-[#f5c542] transition-colors cursor-pointer">
                {t.tag}
              </span>
              <span className="text-xs font-mono text-[#c9a24b]/70">{t.posts}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
