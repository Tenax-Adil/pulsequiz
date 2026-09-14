import React, { useState } from 'react';
import { Zap, Volume2, VolumeX, Settings, MonitorPlay, Lock, LogOut } from 'lucide-react';
import { soundFx } from '../../services/audio.js';
import { isFirebaseLive } from '../../services/firebase.js';
import { ConfigModal } from './ConfigModal.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';

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
      <header className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo - Clean Shadcn Style (No Neon) */}
          <div
            onClick={() => onViewChange('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center shadow-sm group-hover:bg-zinc-200 transition">
              <Zap className="w-4 h-4 fill-zinc-950 text-zinc-950" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
                PulseQuiz
              </span>
              <span className="text-[10px] font-medium tracking-wide text-zinc-400 block -mt-1">
                Live Interactive
              </span>
            </div>
          </div>

          {/* Center Status: Only shown when Host is Authenticated */}
          {isHostAuthenticated ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-2 px-3 py-1 bg-zinc-900 border-zinc-800 text-zinc-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <MonitorPlay className="w-3.5 h-3.5 text-zinc-400" />
                <span>Host Studio</span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onHostLogout}
                className="h-7 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-900"
                title="Lock & Exit Host Studio"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Exit Host</span>
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] text-zinc-400 border-zinc-800 font-normal">
                Live Multiplayer Quiz Platform
              </Badge>
            </div>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Host-Only Controls: Realtime Status & Settings Gear */}
            {isHostAuthenticated && (
              <>
                <button
                  onClick={() => setShowConfig(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition cursor-pointer"
                  title="Host: Configure Real-Time Backend & AI Keys"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                  <span className="hidden sm:inline">
                    {isLive ? 'Firebase Active' : 'Local Sync'}
                  </span>
                </button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowConfig(true)}
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                  title="Host Settings (API Keys, Database, Passcode)"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Sound Mute Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleSound}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-zinc-300" />
              )}
            </Button>

            {/* Host Passcode Login trigger (discreet if not authenticated) */}
            {!isHostAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenHostAuth}
                className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
                title="Host Studio Login"
              >
                <Lock className="w-4 h-4" />
              </Button>
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

export default Navbar;
