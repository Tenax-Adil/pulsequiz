import React, { useState } from 'react';
import { Zap, Volume2, VolumeX, Settings, Users, MonitorPlay, Lock, LogOut } from 'lucide-react';
import { soundFx } from '../../services/audio.js';
import { isFirebaseLive } from '../../services/firebase.js';
import { ConfigModal } from './ConfigModal.jsx';

export function Navbar({
  currentView,
  onViewChange,
  roomCode,
  isHostAuthenticated = false,
  onOpenHostAuth,
  onHostLogout,
}) {
  const [isMuted, setIsMuted] = useState(soundFx.isMuted());
  const [showConfig, setShowConfig] = useState(false);
  const isLive = isFirebaseLive();

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  return (
    <>
      <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => onViewChange('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-pink-400 fill-pink-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1 font-heading">
                Pulse<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400">Quiz</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 block -mt-1">
                Real-Time Live
              </span>
            </div>
          </div>

          {/* Center Navigation: Only shown when Host is Authenticated */}
          {isHostAuthenticated ? (
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-full p-1 shadow-inner">
              <button
                onClick={() => onViewChange('student')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  currentView === 'student'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Player View
              </button>
              <button
                onClick={() => onViewChange('host')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  currentView === 'host'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MonitorPlay className="w-3.5 h-3.5" /> Host Studio
              </button>
              <button
                onClick={onHostLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 rounded-full hover:bg-rose-950/40 transition cursor-pointer"
                title="Lock Host Controls"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-500">
              Live Classroom &amp; Event Quiz
            </div>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Host-Only Controls: Realtime Status & Settings Gear */}
            {isHostAuthenticated && (
              <>
                <button
                  onClick={() => setShowConfig(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                  title="Host: Configure Real-Time Backend & AI Keys"
                >
                  <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400 animate-pulse'}`} />
                  <span className="text-slate-300 hidden sm:inline">
                    {isLive ? 'Firebase Live' : 'Local RT Sync'}
                  </span>
                </button>

                <button
                  onClick={() => setShowConfig(true)}
                  className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Host Settings (API Keys, Database, Passcode)"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                </button>
              </>
            )}

            {/* Sound Mute Toggle (Available to all users) */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Host Passcode Login trigger (if not authenticated) */}
            {!isHostAuthenticated && (
              <button
                onClick={onOpenHostAuth}
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
                title="Host Studio Login (Passcode Protected)"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal: Strictly rendered for authenticated host only */}
      {isHostAuthenticated && (
        <ConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
      )}
    </>
  );
}
