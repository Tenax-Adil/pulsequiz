import React from 'react';
import { Sparkles, Loader2, LogOut } from 'lucide-react';

export function StudentLobby({ room, player, onLeave }) {
  return (
    <div className="max-w-md w-full mx-auto px-4 py-12 flex flex-col items-center justify-between min-h-[calc(100vh-6rem)] text-center">
      {/* Top Banner */}
      <div className="w-full bg-slate-900/80 border border-slate-800 p-4 rounded-3xl backdrop-blur-md flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
            Room PIN: {room.roomCode}
          </span>
          <span className="text-xs font-bold text-slate-300 truncate block max-w-[200px]">
            {room.title}
          </span>
        </div>
        <button
          onClick={onLeave}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
          title="Leave Game"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main Waiting Card with Animated Pulse */}
      <div className="my-8 flex flex-col items-center">
        {/* Pulsing Avatar Halo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 blur-xl opacity-50 animate-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-slate-900 border-4 border-indigo-500/50 flex items-center justify-center text-5xl shadow-2xl">
            {player?.avatar || '⚡'}
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          {player?.nickname}
        </h3>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          You&apos;re In!
        </div>

        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          See your name on the host&apos;s main screen? Get ready to answer fast for speed bonuses!
        </p>

        <div className="mt-8 flex items-center gap-2 text-xs text-indigo-400 font-semibold bg-indigo-950/40 border border-indigo-900/50 px-4 py-2 rounded-full">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Waiting for host to start the quiz...</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-600">
        PulseQuiz Real-Time Engine &bull; Room {room.roomCode}
      </div>
    </div>
  );
}
