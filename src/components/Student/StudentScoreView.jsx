import React, { useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Trophy
} from 'lucide-react';
import { soundFx } from '../../services/audio.js';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';

export function StudentScoreView({ room, player }) {
  const currentIdx = room.currentQuestionIndex || 0;
  const currentQ = room.questions?.[currentIdx];

  const response = room.responses?.[currentQ?.id]?.[player?.id];
  const isCorrect = response ? response.selectedOption === currentQ?.correctOptionIndex : false;
  const pointsAwarded = response?.pointsAwarded || 0;
  const timeSpentMs = response?.timeSpentMs || 0;

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
    <div className="max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-between min-h-[calc(100vh-6rem)] animate-fade-in-up">
      <div className="my-auto text-center space-y-5">
        {/* Clean Status Icon */}
        <div className="relative inline-block">
          {isCorrect ? (
            <div className="w-20 h-20 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-sm">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isCorrect ? 'Correct!' : response ? 'Incorrect' : 'Time Expired'}
          </h2>

          <div className="text-3xl font-bold font-mono mt-1 text-white">
            +{pointsAwarded} <span className="text-sm text-zinc-400 font-sans font-normal">pts</span>
          </div>

          {isCorrect && timeSpentMs > 0 && (
            <div className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{(timeSpentMs / 1000).toFixed(2)}s elapsed</span>
            </div>
          )}
        </div>

        {/* Streak Indicator */}
        {streak > 1 && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-zinc-900 border-zinc-800 text-amber-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Streak: {streak} in a row</span>
          </Badge>
        )}

        {/* Stats Grid: Rank & Total Score */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
          <Card className="border-zinc-800 bg-zinc-900/80 p-3.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-0.5">
              Rank
            </span>
            <div className="text-xl font-bold text-white font-mono">
              #{currentRank}
            </div>
            <span className="text-[10px] text-zinc-500">
              of {totalPlayers} players
            </span>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/80 p-3.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-0.5">
              Total Score
            </span>
            <div className="text-xl font-bold text-white font-mono">
              {totalScore}
            </div>
            <span className="text-[10px] text-zinc-500">
              points accumulated
            </span>
          </Card>
        </div>
      </div>

      <div className="text-center text-xs text-zinc-500 pt-4">
        Waiting for next question...
      </div>
    </div>
  );
}

export default StudentScoreView;
