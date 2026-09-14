import React, { useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Trophy,
  Award,
  Zap
} from 'lucide-react';
import { soundFx } from '../../services/audio.js';

export function StudentScoreView({ room, player }) {
  const currentIdx = room.currentQuestionIndex || 0;
  const currentQ = room.questions?.[currentIdx];

  // Retrieve player's submission for current question
  const response = room.responses?.[currentQ?.id]?.[player?.id];
  const isCorrect = response ? response.selectedOption === currentQ?.correctOptionIndex : false;
  const pointsAwarded = response?.pointsAwarded || 0;
  const timeSpentMs = response?.timeSpentMs || 0;

  // Calculate student's overall rank
  const allPlayers = room.players ? Object.entries(room.players) : [];
  const sorted = allPlayers
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const rankIdx = sorted.findIndex((p) => p.id === player?.id);
  const currentRank = rankIdx !== -1 ? rankIdx + 1 : '-';
  const totalPlayers = allPlayers.length;

  const currentPlayerData = room.players?.[player?.id] || player;
  const streak = currentPlayerData.streak || 0;
  const totalScore = currentPlayerData.score || 0;

  useEffect(() => {
    if (response) {
      if (isCorrect) {
        soundFx.playCorrect();
      } else {
        soundFx.playWrong();
      }
    }
  }, [response, isCorrect]);

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-between min-h-[calc(100vh-6rem)]">
      {/* Top Banner: Round Result Banner */}
      <div className="my-auto text-center space-y-6">
        {/* Big Animated Icon */}
        <div className="relative inline-block">
          {isCorrect ? (
            <div className="w-28 h-28 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 className="w-16 h-16" />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mx-auto shadow-2xl shadow-rose-500/30">
              <XCircle className="w-16 h-16" />
            </div>
          )}
        </div>

        <div>
          <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isCorrect ? 'Correct!' : response ? 'Incorrect' : 'Time Expired'}
          </h2>

          <div className="text-4xl font-black font-mono mt-2 text-white">
            +{pointsAwarded} <span className="text-base text-slate-400 font-sans">pts</span>
          </div>

          {isCorrect && timeSpentMs > 0 && (
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Answered in {(timeSpentMs / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>

        {/* Streak Flame Banner */}
        {streak > 1 && (
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 px-5 py-2 rounded-full text-orange-400 font-black text-sm shadow-lg shadow-orange-500/10 animate-bounce">
            <Flame className="w-5 h-5 fill-orange-400 text-orange-400" />
            <span>Answer Streak: {streak} in a row!</span>
          </div>
        )}

        {/* Stats Grid: Rank & Total Score */}
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Your Rank
            </span>
            <div className="text-2xl font-black text-indigo-400 font-mono">
              #{currentRank}
            </div>
            <span className="text-[10px] text-slate-500">
              of {totalPlayers} players
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Score
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {totalScore}
            </div>
            <span className="text-[10px] text-slate-500">
              points
            </span>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <span className="text-xs text-slate-400">
          Get ready for the next round on the host screen...
        </span>
      </div>
    </div>
  );
}
