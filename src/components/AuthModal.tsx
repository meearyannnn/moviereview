import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Film, LogIn, UserPlus, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMessage(error.message);
          toast.error(error.message);
        } else {
          toast.success('Welcome back to MovieGuy!');
          onClose();
        }
      } else {
        const { error, needsEmailVerification } = await signUpWithEmail(
          email.trim(),
          password,
          username.trim() || undefined
        );

        if (error) {
          setErrorMessage(error.message);
          toast.error(error.message);
        } else if (needsEmailVerification) {
          toast.info('Account created! Please check your email to confirm your account.');
          onClose();
        } else {
          toast.success('Welcome to the CineClub! Your account is ready.');
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Google sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-[#0c0d14]/95 backdrop-blur-2xl border border-white/10 text-white shadow-2xl p-0 overflow-hidden rounded-2xl">
        {/* Red & White cinema aesthetic header */}
        <div className="relative h-28 bg-gradient-to-br from-red-600/25 via-red-950/40 to-black flex flex-col items-center justify-center border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.35),transparent_70%)]" />
          <div className="w-12 h-12 rounded-xl bg-black/70 border border-red-500/40 flex items-center justify-center shadow-lg relative z-10 backdrop-blur-md">
            <Film className="w-6 h-6 text-red-500" />
          </div>
          <span className="text-xs uppercase tracking-widest text-white/70 font-mono mt-2 relative z-10 flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3 h-3 text-red-500" />
            MovieGuy CineClub
          </span>
        </div>

        <div className="p-6">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              {mode === 'signin' ? 'Welcome Back' : 'Join MovieGuy'}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/50">
              {mode === 'signin'
                ? 'Sign in to access your cloud watchlist and rate films.'
                : 'Create an account to synchronize your tastes and shift the MovieGuy Meter.'}
            </DialogDescription>
          </DialogHeader>

          {/* Social Google Login Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full bg-white/5 hover:bg-white/10 border-white/15 text-white flex items-center justify-center gap-2.5 py-5 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm font-medium">Continue with Google</span>
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0c0d14] px-3 text-white/40 font-mono tracking-wider">
                Or with email
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Username</Label>
                <Input
                  type="text"
                  placeholder="cinephile99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus:border-red-500/60 rounded-lg"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Email Address</Label>
              <Input
                type="email"
                required
                placeholder="you@cinema.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus:border-red-500/60 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus:border-red-500/60 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#dc2626] hover:bg-[#ef4444] text-white font-bold py-5 rounded-xl transition-all shadow-lg shadow-[#dc2626]/25 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : mode === 'signin' ? (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Create CineClub Account
                </span>
              )}
            </Button>
          </form>

          {/* Switch mode */}
          <div className="mt-5 text-center text-xs text-white/50">
            {mode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline ml-1"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already a member?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className="text-red-400 hover:text-red-300 font-semibold underline ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
