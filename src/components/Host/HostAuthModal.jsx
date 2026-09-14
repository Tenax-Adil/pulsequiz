import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';

export function HostAuthModal({ isOpen, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(false);

    const configuredPass =
      localStorage.getItem('pulse_host_password') ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_HOST_PASSWORD) ||
      'admin123';

    if (password.trim() === configuredPass.trim()) {
      try {
        sessionStorage.setItem('pulse_host_auth', 'true');
      } catch {
        // ignore
      }
      setPassword('');
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 mx-auto mb-3 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Host Studio Access
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Enter the host passcode to open presenter controls
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter passcode..."
                className={`h-11 pr-10 text-sm ${error ? 'border-red-600 focus-visible:ring-red-600' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 text-xs font-medium text-center">
              Incorrect passcode. Please try again.
            </div>
          )}

          <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 text-[11px] text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>
              Default: <code className="text-zinc-200 font-mono font-semibold">admin123</code>
            </span>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-800 text-xs h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs h-10"
            >
              <span>Unlock</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HostAuthModal;
