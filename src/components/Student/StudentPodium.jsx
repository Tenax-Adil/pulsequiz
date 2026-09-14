import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Sparkles, RotateCcw } from 'lucide-react';
import { soundFx } from '../../services/audio.js';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { Badge } from '../ui/badge.jsx';

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

    if (rankIdx < 5) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [rankIdx]);

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-between min-h-[calc(100vh-6rem)] text-center animate-fade-in-up">
      <div className="my-auto space-y-5">
        <Badge variant="secondary" className="gap-1 px-3 py-1 bg-zinc-900 border-zinc-800 text-zinc-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Tournament Finished
        </Badge>

        {/* Podium Rank Card */}
        <Card className="max-w-xs mx-auto border-zinc-800 bg-zinc-900/90 p-6 shadow-xl">
          {finalRank === 1 && (
            <Crown className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
          )}

          <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-4xl mx-auto mb-3 shadow-inner">
            {player?.avatar || '⚡'}
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {player?.nickname}
          </h2>

          {/* Rank Number */}
          <div className="mt-4 py-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 block mb-0.5">
              Final Rank
            </span>
            <div className="text-3xl font-mono font-bold text-white">
              #{finalRank}
            </div>
            <span className="text-[11px] text-zinc-500">
              out of {totalPlayers} players
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between px-2 text-xs">
            <span className="text-zinc-400 font-medium">Final Points:</span>
            <span className="text-white font-mono font-bold text-base">
              {totalScore} pts
            </span>
          </div>
        </Card>

        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
          Tournament concluded. Check the presenter screen for overall podium standings.
        </p>
      </div>

      <div className="pt-4">
        <Button
          size="lg"
          onClick={onLeave}
          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold h-11"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          <span>Play Another Quiz</span>
        </Button>
      </div>
    </div>
  );
}

export default StudentPodium;
