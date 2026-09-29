import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, X, Bot, Play, Star, Clock, Zap, MessageSquare } from 'lucide-react';
import { queryCineAi, type CineAiResponse, type AiMovieRecommendation } from '@/lib/cineAiEngine';
import { soundEffects } from '@/lib/soundEffects';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  recommendations?: AiMovieRecommendation[];
  suggestions?: string[];
}

export const CineAiCopilot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "?? Hey there! I'm **CineAI**, your personal cinema concierge. Tell me your mood, a plot you can't remember, or how much time you have before bed!",
      suggestions: [
        '?? Fast movie under 90 mins',
        '?? Couple movie night',
        '?? Guy stuck on Mars growing potatoes',
        '?? Mind-blowing sci-fi twist',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Keyboard shortcut listener: 'c' or 'C' toggles CineAI (when not typing in an input)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
      if (!isTyping && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        soundEffects.playHoverTick();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    soundEffects.playHoverTick();
    setInput('');
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res: CineAiResponse = await queryCineAi(textToSend);
      soundEffects.playChime();
      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.message,
        recommendations: res.recommendations,
        suggestions: res.suggestions,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: "I ran into a temporary hiccup connecting to the cinema database. Try asking for another vibe!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* -- Floating Launcher Trigger -- */}
      {!isOpen && (
        <button
          onClick={() => {
            soundEffects.playSwoosh();
            setIsOpen(true);
          }}
          className="fixed bottom-[76px] right-3 sm:bottom-6 sm:right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#111520]/85 hover:bg-[#111520] border border-white/15 hover:border-purple-400/50 backdrop-blur-xl shadow-xl shadow-black/80 flex items-center justify-center text-red-500 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 group touch-feedback"
          aria-label="Open CineAI Copilot"
          title="Ask CineAI Copilot (Press C)"
        >
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* -- Chat Drawer Window -- */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-16 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] max-h-[80vh] h-[80vh] rounded-3xl overflow-hidden bg-[#0d1017] border border-white/15 shadow-2xl shadow-black flex flex-col animate-in slide-in-from-bottom-6 zoom-in-95 duration-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-black/40 to-transparent backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md shadow-purple-500/20">
                <div className="w-full h-full bg-[#0d1017] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  CineAI Co-Pilot
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                    Online
                  </span>
                </h3>
                <p className="text-[10px] text-white/50">Personal Cinema Intelligence</p>
              </div>
            </div>

            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setIsOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-red-600 text-white font-extrabold font-medium shadow-md shadow-red-600/25 rounded-br-sm'
                      : 'bg-white/[0.05] border border-white/10 text-white/90 rounded-bl-sm leading-relaxed'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Movie Recommendation Cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="w-full mt-3 space-y-2.5">
                    {msg.recommendations.map(movie => (
                      <div
                        key={movie.id}
                        onClick={() => {
                          soundEffects.playHoverTick();
                          navigate(`/movie/${movie.id}`);
                        }}
                        className="group flex gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-red-500/40 transition-all cursor-pointer"
                      >
                        <img
                          src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : ''}
                          alt={movie.title}
                          className="w-14 h-20 object-cover rounded-lg flex-shrink-0 bg-neutral-900 border border-white/10"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="font-display font-bold text-xs text-white truncate group-hover:text-red-400 transition-colors">
                                {movie.title}
                              </h4>
                              {movie.vote_average > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
                                  <Star className="w-2.5 h-2.5 fill-red-500" />
                                  {movie.vote_average.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-white/50 line-clamp-2 leading-tight">
                              {movie.overview}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="text-purple-300 font-semibold truncate max-w-[140px]">
                              {movie.matchReason}
                            </span>
                            <span className="flex items-center gap-1 text-red-500 font-extrabold group-hover:translate-x-0.5 transition-transform">
                              <Play className="w-2.5 h-2.5 fill-red-500" />
                              Stream
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prompt Suggestion Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {msg.suggestions.map(sug => (
                      <button
                        key={sug}
                        onClick={() => handleSend(sug)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-purple-400/40 text-white/70 hover:text-white transition-all text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-white/40 text-xs py-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>CineAI is thinking & scanning cinematic archives...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask for mood, runtime, plot memory..."
              className="flex-1 h-11 px-3.5 rounded-xl bg-white/[0.05] border border-white/10 focus:border-purple-400 text-white text-base sm:text-xs placeholder-white/40 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-amber-500 text-black flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4 fill-black" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
