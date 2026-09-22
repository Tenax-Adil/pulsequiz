import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Crown,
  UserX,
} from 'lucide-react';
import { soundFx } from '../../services/audio.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';

export function HostLeaderboard({
  room,
  onNextQuestion,
  onFinishGame,
  onRestart,
  onKickPlayer,
}) {
  const isFinal = room.status === 'FINISHED';
  const currentIdx = room.currentQuestionIndex || 0;
  const totalQuestions = room.questions?.length || 1;
  const isLastQuestion = currentIdx >= totalQuestions - 1;

  // Compute sorted player rankings
  const rawPlayers = room?.players ? Object.entries(room.players) : [];
  const sortedPlayers = rawPlayers
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const top1 = sortedPlayers[0];
  const top2 = sortedPlayers[1];
  const top3 = sortedPlayers[2];

  // Trigger fanfare and confetti on final podium
  useEffect(() => {
    if (isFinal) {
      soundFx.playFanfare();

      const duration = 3.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isFinal]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-5rem)] justify-between animate-fade-in-up">
      {/* Top Banner */}
      <div className="text-center mb-6">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 mb-2 bg-zinc-900 border-zinc-800 text-zinc-300">
          {isFinal ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Final Tournament Results
            </>
          ) : (
            <>
              <Trophy className="w-3.5 h-3.5 text-zinc-400" /> Round {currentIdx + 1} of {totalQuestions}
            </>
          )}
        </Badge>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          {isFinal ? 'Podium Champions' : 'Current Standings'}
        </h2>
      </div>

      {/* Main Leaderboard or Podium */}
      {isFinal ? (
        /* Final Podium 1st, 2nd, 3rd View */
        <div className="my-6">
          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-xl mx-auto h-64 sm:h-72 mb-6">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-2xl mb-1">{top2.avatar || '🥈'}</div>
                <div className="text-xs sm:text-sm font-semibold text-zinc-300 truncate max-w-[90px] sm:max-w-[120px]">
                  {top2.nickname}
                </div>
                <div className="text-xs text-zinc-400 font-mono font-semibold mb-2">
                  {top2.score} pts
                </div>
                <div className="w-full h-32 sm:h-40 bg-zinc-800 rounded-t-xl border border-zinc-700/80 shadow-md flex flex-col items-center justify-start pt-3">
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-300">2</span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">Silver</span>
                </div>
              </div>
            )}

            {/* 1st Place Champion */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center">
                <Crown className="w-7 h-7 text-zinc-200 mb-1" />
                <div className="text-3xl mb-1">{top1.avatar || '🏆'}</div>
                <div className="text-sm sm:text-base font-bold text-white truncate max-w-[100px] sm:max-w-[140px]">
                  {top1.nickname}
                </div>
                <div className="text-xs text-zinc-200 font-mono font-bold mb-2">
                  {top1.score} pts
                </div>
                <div className="w-full h-44 sm:h-52 bg-zinc-700/90 rounded-t-xl border-t-2 border-zinc-300 shadow-xl flex flex-col items-center justify-start pt-3">
                  <span className="text-3xl sm:text-4xl font-bold text-white">1</span>
                  <span className="text-[10px] uppercase font-bold text-zinc-200 tracking-wider">Champion</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-2xl mb-1">{top3.avatar || '🥉'}</div>
                <div className="text-xs sm:text-sm font-semibold text-zinc-300 truncate max-w-[90px] sm:max-w-[120px]">
                  {top3.nickname}
                </div>
                <div className="text-xs text-zinc-400 font-mono font-semibold mb-2">
                  {top3.score} pts
                </div>
                <div className="w-full h-24 sm:h-32 bg-zinc-850 rounded-t-xl border border-zinc-800 shadow-md flex flex-col items-center justify-start pt-3">
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-400">3</span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500">Bronze</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Interstitial Leaderboard List */
        <div className="max-w-2xl w-full mx-auto space-y-2 my-4">
          {sortedPlayers.slice(0, 6).map((player, idx) => (
            <div
              key={player.id || idx}
              className={`group flex items-center justify-between p-3.5 rounded-xl border transition ${
                idx === 0
                  ? 'bg-zinc-850 border-zinc-700 shadow-sm'
                  : 'bg-zinc-900/60 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    idx === 0
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="text-xl">{player.avatar || '⚡'}</div>

                <div className="min-w-0">
                  <span className="text-sm font-semibold text-white block truncate">
                    {player.nickname}
                  </span>
                  {player.streak > 1 && (
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-zinc-400 text-zinc-400" />
                      {player.streak} Streak
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  <div className="text-base font-bold text-white font-mono">
                    {player.score || 0}
                  </div>
                  {player.lastRoundPoints > 0 && (
                    <div className="text-xs font-semibold text-emerald-400">
                      +{player.lastRoundPoints}
                    </div>
                  )}
                </div>

                {onKickPlayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Kick "${player.nickname}" from the quiz?`)) {
                        onKickPlayer(player.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                    title={`Kick ${player.nickname}`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Host Advance Controls */}
      <div className="flex items-center justify-between pt-5 border-t border-zinc-800">
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          className="border-zinc-800 text-zinc-400 hover:text-white"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          <span>Exit / New Quiz</span>
        </Button>

        {!isFinal ? (
          isLastQuestion ? (
            <Button
              size="lg"
              onClick={onFinishGame}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold px-6 shadow-sm"
            >
              <Trophy className="w-4 h-4 mr-1.5" />
              <span>Final Podium</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={onNextQuestion}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold px-6 shadow-sm"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}

export default HostLeaderboard;
