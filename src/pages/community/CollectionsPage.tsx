import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Plus, Globe, Lock, Trash2, X, Film } from 'lucide-react';
import { CommunityLayout } from '@/components/community/CommunityLayout';
import { CommunityRightPanel } from '@/components/community/CommunityRightPanel';
import { Avatar, Spinner } from '@/components/community/communityUtils';
import { collectionsService, type Collection } from '@/services/collections';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ─── Create Collection Modal ────────────────────────────────────────────────────
function CreateCollectionModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (col: Collection) => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !title.trim()) return;
    setBusy(true);
    const col = await collectionsService.createCollection(user.id, title.trim(), desc.trim(), isPublic);
    setBusy(false);
    if (col) { onCreate(col); onClose(); toast.success('Collection created!'); }
    else toast.error('Failed to create collection. Run supabase_collections_schema.sql first.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl" onClick={onClose}>
      <div role="dialog" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-[#c9a24b]/30 bg-[#140a0d] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">New Collection</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-white/50">Title *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="My 2025 Watches"
            className="w-full rounded-xl border border-[#c9a24b]/20 bg-white/[0.04] px-3 py-2.5 text-sm focus:border-[#c9a24b]/60 focus:outline-none" />
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-white/50">Description <span className="text-white/25">(optional)</span></span>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={300}
            className="w-full resize-none rounded-xl border border-[#c9a24b]/20 bg-white/[0.04] px-3 py-2.5 text-sm focus:border-[#c9a24b]/60 focus:outline-none" />
        </label>
        <label className="mb-6 flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setIsPublic((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors ${isPublic ? 'bg-[#f5c542]' : 'bg-white/20'}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#1c120c] shadow transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm text-white/70">{isPublic ? 'Public — visible to everyone' : 'Private — only you'}</span>
        </label>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 hover:text-white transition-colors">Cancel</button>
          <button onClick={submit} disabled={!title.trim() || busy}
            className="flex-1 rounded-full bg-[#f5c542] hover:bg-[#e6b738] py-2.5 text-sm font-bold text-[#1c120c] disabled:opacity-40 transition-colors shadow-md shadow-[#f5c542]/20">
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Collection Card ───────────────────────────────────────────────────────────
function CollectionCard({ col, isOwn, onDelete }: { col: Collection; isOwn: boolean; onDelete?: (id: string) => void }) {
  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = await collectionsService.deleteCollection(col.id, col.user_id);
    if (ok) { onDelete(col.id); toast.success('Collection deleted'); }
    else toast.error('Failed to delete');
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/85 p-5 transition-all hover:border-[#c9a24b]/45 shadow-sm">
      {/* Visual grid placeholder */}
      <div className="mb-4 grid h-24 grid-cols-3 gap-1 overflow-hidden rounded-xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-gradient-to-br from-[#1a0f14] to-black/60 border border-[#c9a24b]/10 flex items-center justify-center">
            <Film className="h-5 w-5 text-[#c9a24b]/30" />
          </div>
        ))}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-white group-hover:text-[#f5c542] transition-colors">{col.title}</h3>
          {col.description && <p className="mt-0.5 truncate text-xs text-white/50">{col.description}</p>}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-white/40">
            <span>{col.items_count} titles</span>
            {col.is_public ? <Globe className="h-3 w-3 text-[#c9a24b]" /> : <Lock className="h-3 w-3" />}
            {col.username && !isOwn && (
              <span>by <Link to={`/community/user/${col.user_id}`} className="text-white/60 hover:text-[#f5c542] transition-colors">{col.username}</Link></span>
            )}
          </div>
        </div>
        {isOwn && (
          <button onClick={handleDelete} className="shrink-0 p-1 text-white/30 opacity-0 transition-all group-hover:opacity-100 hover:text-[#f5c542]">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [myCollections, setMyCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'mine'>('browse');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [pub, mine] = await Promise.all([
        collectionsService.getPublicCollections(),
        user ? collectionsService.getUserCollections(user.id) : Promise.resolve([]),
      ]);
      setCollections(pub);
      setMyCollections(mine);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const handleCreate = (col: Collection) => {
    setMyCollections((p) => [col, ...p]);
    setCollections((p) => col.is_public ? [col, ...p] : p);
    setActiveTab('mine');
  };

  const handleDelete = (id: string) => {
    setMyCollections((p) => p.filter((c) => c.id !== id));
    setCollections((p) => p.filter((c) => c.id !== id));
  };

  const displayed = activeTab === 'mine' ? myCollections : collections;

  return (
    <CommunityLayout rightPanel={<CommunityRightPanel />}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Collections</h1>
          <p className="mt-1 text-sm text-white/45">Curated watchlists by the community.</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f5c542] hover:bg-[#e6b738] px-4 py-2 text-sm font-bold text-[#1c120c] transition-all shadow-md shadow-[#f5c542]/20"
          >
            <Plus className="h-4 w-4" /> New List
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-full border border-[#c9a24b]/30 bg-[#140c10] p-1 self-start w-fit shadow-md">
        {[
          { key: 'browse', label: '🌐 Browse' },
          { key: 'mine', label: '📁 Mine' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'mine' && !user) { toast.info('Sign in to see your collections'); return; }
              setActiveTab(key as any);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${activeTab === key ? 'bg-[#f5c542] text-[#1c120c] shadow-md shadow-[#f5c542]/20' : 'text-white/40 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-[#c9a24b]/20 bg-[#140a0d]/60 py-20 text-center">
          <BookMarked className="mx-auto mb-3 h-8 w-8 text-[#c9a24b]/30" />
          <p className="font-semibold text-white/50">
            {activeTab === 'mine' ? "You haven't created any collections yet." : 'No public collections yet.'}
          </p>
          {user && activeTab === 'mine' && (
            <button onClick={() => setShowCreate(true)} className="mt-4 rounded-full bg-[#f5c542] hover:bg-[#e6b738] px-5 py-2 text-sm font-bold text-[#1c120c] transition-colors shadow-md shadow-[#f5c542]/20">
              Create your first list
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((col) => (
            <CollectionCard
              key={col.id}
              col={col}
              isOwn={col.user_id === user?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCollectionModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </CommunityLayout>
  );
}
