import { X, Command, Search, Volume2, HelpCircle, Flame, Terminal } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'S', desc: 'Open Reel Swiper', icon: Flame },
  { key: '/', desc: 'Quick Search Bar', icon: Search },
  { key: 'M', desc: 'Toggle Tactile Sound FX', icon: Volume2 },
  { key: 'vault', desc: 'Type "vault" for Secret CRT', icon: Terminal },
  { key: '?', desc: 'Show Shortcuts Cheatsheet', icon: HelpCircle },
  { key: 'Esc', desc: 'Close Modals / Exit Player', icon: Command },
];

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden bg-[#140a0d] border border-[#c9a24b]/25 shadow-2xl p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#f5c542]">
          <Command className="w-5 h-5" />
          <h3 className="font-display font-bold text-lg text-white">
            Cinema Console Shortcuts
          </h3>
        </div>
        <p className="text-xs text-[#f3e9d2]/60 mb-6 font-light">
          Navigate and control MovieGuy with your keyboard like a cinema console.
        </p>

        <div className="space-y-3">
          {SHORTCUTS.map(item => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-[#c9a24b]/15"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#c9a24b]" />
                  <span className="text-sm font-medium text-white/80">{item.desc}</span>
                </div>
                <kbd className="px-2.5 py-1 rounded-lg bg-[#f5c542]/10 border border-[#c9a24b]/30 text-xs font-mono font-bold text-[#f5c542] shadow-sm">
                  {item.key}
                </kbd>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
