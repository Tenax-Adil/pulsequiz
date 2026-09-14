import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Crown, Sparkles, RotateCcw } from 'lucide-react';
import { soundFx } from '../../services/audio.js';

export function StudentPodium({ room, player, onLeave }) {
  const allPlayers = room.players ? Object.entries(room.players) : [];
  const sorted = allPlayers
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const rankIdx = sorted.findIndex((p) => p.id === player?.id);
  const finalRank = rankIdx !== -1 ? rankIdx + 1 : '-';
  const totalPlayers = allPlayers.length;

  const currentPlayerData = room.players?.[player?.id] || player;
  const totalScore = currentPlayerData.score || 0;

  useEffect(() => {
    soundFx.playFanfare();

    // Trigger celebratory confetti if in top 5
    if (rankIdx < 5) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [rankIdx]);

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-between min-h-[calc(100vh-6rem)] text-center">
      <div className="my-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" /> Quiz Finished!
        </div>

        {/* Podium Rank Trophy Card */}
        <div className="relative max-w-xs mx-auto bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl">
          {finalRank === 1 && (
            <Crown className="w-12 h-12 text-amber-400 mx-auto animate-bounce mb-2" />
          )}

          <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-indigo-500/60 flex items-center justify-center text-5xl mx-auto mb-3 shadow-inner">
            {player?.avatar || '⚡'}
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            {player?.nickname}
          </h2>

          {/* Big Rank Number */}
          <div className="mt-4 py-3 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Final Standing
            </span>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-400 font-mono">
              #{finalRank}
            </div>
            <span className="text-xs text-slate-500">
              out of {totalPlayers} players
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between px-2 text-sm">
            <span className="text-slate-400 font-bold">Total Score:</span>
            <span className="text-white font-mono font-black text-lg">
              {totalScore} pts
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Thanks for participating! Check out the presenter screen for overall podium and final statistics.
        </p>
      </div>

      <div className="pt-4">
        <button
          onClick={onLeave}
          className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Another Quiz</span>
        </button>
      </div>
    </div>
  );
}
