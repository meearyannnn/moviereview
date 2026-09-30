import { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  X,
  Send,
  Upload,
  Globe,
  Film,
  Sparkles,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { Avatar, CATEGORIES, Spinner } from '@/components/community/communityUtils';
import { useAuth } from '@/contexts/AuthContext';
import { communityService, type CommunityPost, type PostCategory } from '@/services/community';
import { toast } from 'sonner';

interface ComposePostBoxProps {
  onPost: (post: CommunityPost) => void;
  defaultCategory?: PostCategory;
  lockCategory?: boolean;
  placeholder?: string;
}

export function ComposePostBox({
  onPost,
  defaultCategory = 'general',
  lockCategory = false,
  placeholder = 'Share a thought, review, recommendation, or discussion…',
}: ComposePostBoxProps) {
  const { user, profile } = useAuth();
  const [text, setText] = useState('');
  const [category, setCategory] = useState<PostCategory>(defaultCategory);
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);

  // Attachments
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  // Mini input modals/toggles
  const [activeInput, setActiveInput] = useState<'image' | 'video' | 'link' | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [tempTitle, setTempTitle] = useState('');

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setBusy(true);
    toast.info(`Uploading ${type}…`);
    const res = await communityService.uploadMedia(file);
    setBusy(false);

    if (res.url) {
      if (type === 'image') {
        setImageUrl(res.url);
      } else {
        setVideoUrl(res.url);
      }
      toast.success(`${type === 'image' ? 'Image' : 'Video'} attached!`);
      setActiveInput(null);
    } else {
      toast.error(res.error || `Failed to upload ${type}`);
    }
  };

  const handleApplyLink = () => {
    if (!tempUrl.trim()) return;
    let url = tempUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (activeInput === 'image') {
      setImageUrl(url);
    } else if (activeInput === 'video') {
      setVideoUrl(url);
    } else if (activeInput === 'link') {
      setLinkUrl(url);
      setLinkTitle(tempTitle.trim() || url);
    }

    setTempUrl('');
    setTempTitle('');
    setActiveInput(null);
  };

  const submit = async () => {
    if (!text.trim() && !imageUrl && !videoUrl && !linkUrl) return;

    setBusy(true);
    const result = await communityService.createPost({
      userId: user.id,
      content: text.trim(),
      category,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
      linkUrl: linkUrl || undefined,
      linkTitle: linkTitle || undefined,
    });
    setBusy(false);

    if (result.success && result.post) {
      onPost(result.post);
      setText('');
      setImageUrl('');
      setVideoUrl('');
      setLinkUrl('');
      setLinkTitle('');
      setFocused(false);
      setActiveInput(null);
      toast.success(category === 'discussion' ? 'Discussion started!' : 'Post published!');
    } else {
      toast.error(result.error ?? 'Failed to post');
    }
  };

  const hasAttachments = !!(imageUrl || videoUrl || linkUrl);
  const isExpanded = focused || text.length > 0 || hasAttachments || activeInput !== null;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isExpanded
          ? 'border-[#c9a24b]/40 bg-[#140a0d] shadow-2xl shadow-black/80'
          : 'border-[#c9a24b]/20 bg-[#140a0d]/80 hover:border-[#c9a24b]/35'
      } p-4 mb-6`}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'image');
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={videoFileInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'video');
          e.target.value = '';
        }}
      />

      <div className="flex gap-3">
        <Avatar username={profile?.username ?? 'U'} url={profile?.avatar_url} size={9} />
        <div className="min-w-0 flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            rows={isExpanded ? 3 : 1}
            maxLength={2000}
            className="w-full resize-none rounded-xl bg-transparent px-0 py-1 text-sm leading-relaxed text-white placeholder-white/30 focus:outline-none transition-all duration-200"
          />

          {/* ── Active Attachments Preview ── */}
          {hasAttachments && (
            <div className="my-2 space-y-2">
              {imageUrl && (
                <div className="relative inline-block overflow-hidden rounded-xl border border-white/15 bg-black/40">
                  <img src={imageUrl} alt="Attached" className="h-28 w-44 object-cover rounded-xl" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
                    Image
                  </span>
                </div>
              )}

              {videoUrl && (
                <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] p-2.5">
                  <div className="flex items-center gap-2 text-xs text-white/80 truncate">
                    <Film className="h-4 w-4 shrink-0 text-red-400" />
                    <span className="truncate">{videoUrl}</span>
                  </div>
                  <button
                    onClick={() => setVideoUrl('')}
                    className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {linkUrl && (
                <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.04] p-2.5">
                  <div className="flex items-center gap-2 text-xs text-white/80 truncate">
                    <Globe className="h-4 w-4 shrink-0 text-blue-400" />
                    <span className="truncate">{linkTitle || linkUrl}</span>
                  </div>
                  <button
                    onClick={() => {
                      setLinkUrl('');
                      setLinkTitle('');
                    }}
                    className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/40 hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Mini Input Bar for URL input ── */}
          {activeInput && (
            <div className="my-2.5 rounded-xl border border-white/15 bg-white/[0.05] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                <span>
                  {activeInput === 'image' && 'Attach Image URL'}
                  {activeInput === 'video' && 'Attach Video or YouTube URL'}
                  {activeInput === 'link' && 'Attach Web Link'}
                </span>
                <button onClick={() => setActiveInput(null)} className="text-white/40 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {activeInput === 'link' && (
                <input
                  type="text"
                  placeholder="Link Title (optional)"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                />
              )}

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder={
                    activeInput === 'video'
                      ? 'https://youtube.com/watch?v=... or direct video URL'
                      : 'https://...'
                  }
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyLink()}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleApplyLink}
                  disabled={!tempUrl.trim()}
                  className="rounded-lg bg-[#f5c542] px-3 py-1.5 text-xs font-black text-[#1c120c] hover:bg-[#c9a24b] disabled:opacity-40 transition-colors shadow-sm"
                >
                  Attach
                </button>
              </div>
            </div>
          )}

          {/* ── Toolbar & Action Row ── */}
          {isExpanded && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              {/* Left tools: Media buttons & Category */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Image button */}
                <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.06]">
                  <button
                    type="button"
                    title="Upload image from device"
                    onClick={() => imageFileInputRef.current?.click()}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    title="Paste Image URL"
                    onClick={() => {
                      setActiveInput(activeInput === 'image' ? null : 'image');
                      setTempUrl('');
                    }}
                    className={`rounded-md px-1.5 py-1 text-[11px] ${
                      activeInput === 'image' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    URL
                  </button>
                </div>

                {/* Video button */}
                <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5 border border-white/[0.06]">
                  <button
                    type="button"
                    title="Upload video from device"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={busy}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <Video className="h-3.5 w-3.5 text-red-400" />
                    <span>Video / Clip</span>
                  </button>
                  <button
                    type="button"
                    title="Paste YouTube or Video URL"
                    onClick={() => {
                      setActiveInput(activeInput === 'video' ? null : 'video');
                      setTempUrl('');
                    }}
                    className={`rounded-md px-1.5 py-1 text-[11px] ${
                      activeInput === 'video' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Link
                  </button>
                </div>

                {/* Link button */}
                <button
                  type="button"
                  title="Attach external link"
                  onClick={() => {
                    setActiveInput(activeInput === 'link' ? null : 'link');
                    setTempUrl('');
                    setTempTitle('');
                  }}
                  className={`flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs transition-colors ${
                    activeInput === 'link'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <LinkIcon className="h-3.5 w-3.5 text-blue-400" />
                  <span>Link</span>
                </button>

                {/* Category selector (if not locked) */}
                {!lockCategory && (
                  <div className="flex flex-wrap gap-1 ml-1 pl-2 border-l border-white/[0.08]">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategory(c.key)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                          category === c.key
                            ? c.color + ' ring-1 ring-white/25'
                            : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right tools: Character counter & Submit */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-[11px] font-mono text-[#c9a24b]/70">{text.length}/2000</span>
                <button
                  type="button"
                  onClick={submit}
                  disabled={(!text.trim() && !hasAttachments) || busy}
                  className="flex items-center gap-1.5 rounded-full bg-[#f5c542] hover:bg-[#e6b738] px-4 py-1.5 text-xs font-black text-[#1c120c] disabled:opacity-40 transition-all shadow-md shadow-[#f5c542]/20 hover:scale-[1.02]"
                >
                  {busy ? <Spinner size={3} /> : <Send className="h-3 w-3 fill-[#1c120c]" />}
                  <span>{category === 'discussion' ? 'Start Discussion' : 'Post'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
