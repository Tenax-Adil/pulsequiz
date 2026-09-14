import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  Crown
} from 'lucide-react';
import { soundFx } from '../../services/audio.js';

export function HostLeaderboard({
  room,
  onNextQuestion,
  onFinishGame,
  onRestart,
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
  const runnersUp = sortedPlayers.slice(3, 10);

  // Trigger fanfare and confetti on final podium
  useEffect(() => {
    if (isFinal) {
      soundFx.playFanfare();

      const duration = 4.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 4,
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
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-5rem)] justify-between">
      {/* Top Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">
          {isFinal ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Final Quiz Podium
            </>
          ) : (
            <>
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Round {currentIdx + 1} of {totalQuestions} Leaderboard
            </>
          )}
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          {isFinal ? 'Tournament Champions' : 'Current Standings'}
        </h2>
      </div>

      {/* Main Leaderboard or Podium */}
      {isFinal ? (
        /* Final Podium 1st, 2nd, 3rd View */
        <div className="my-6">
          <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-2xl mx-auto h-72 sm:h-80 mb-8">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-2xl mb-1">{top2.avatar || '🥈'}</div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[90px] sm:max-w-[120px]">
                  {top2.nickname}
                </div>
                <div className="text-xs text-indigo-400 font-mono font-bold mb-2">
                  {top2.score} pts
                </div>
                <div className="w-full h-36 sm:h-44 bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-2xl border-t-4 border-slate-400 shadow-xl flex flex-col items-center justify-start pt-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-300">2</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Silver</span>
                </div>
              </div>
            )}

            {/* 1st Place Champion */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center">
                <Crown className="w-8 h-8 text-amber-400 animate-bounce mb-1" />
                <div className="text-3xl mb-1">{top1.avatar || '🏆'}</div>
                <div className="text-sm sm:text-base font-extrabold text-amber-300 truncate max-w-[100px] sm:max-w-[140px]">
                  {top1.nickname}
                </div>
                <div className="text-xs text-amber-400 font-mono font-black mb-2">
                  {top1.score} pts
                </div>
                <div className="w-full h-48 sm:h-56 bg-gradient-to-t from-amber-600/60 via-amber-500/80 to-amber-400 rounded-t-2xl border-t-4 border-amber-300 shadow-2xl shadow-amber-500/30 flex flex-col items-center justify-start pt-4">
                  <span className="text-4xl sm:text-5xl font-black text-slate-950">1</span>
                  <span className="text-[10px] uppercase font-black text-slate-950 tracking-wider">Champion</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex-1 flex flex-col items-center">
                <div className="text-2xl mb-1">{top3.avatar || '🥉'}</div>
                <div className="text-xs sm:text-sm font-bold text-slate-200 truncate max-w-[90px] sm:max-w-[120px]">
                  {top3.nickname}
                </div>
                <div className="text-xs text-amber-600 font-mono font-bold mb-2">
                  {top3.score} pts
                </div>
                <div className="w-full h-28 sm:h-36 bg-gradient-to-t from-amber-950/80 to-amber-900/90 rounded-t-2xl border-t-4 border-amber-700 shadow-xl flex flex-col items-center justify-start pt-3">
                  <span className="text-3xl sm:text-4xl font-black text-amber-500">3</span>
                  <span className="text-[10px] uppercase font-bold text-amber-600">Bronze</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Interstitial Leaderboard List */
        <div className="max-w-3xl w-full mx-auto space-y-2.5 my-4">
          {sortedPlayers.slice(0, 6).map((player, idx) => (
            <div
              key={player.id || idx}
              className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                idx === 0
                  ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                    idx === 0
                      ? 'bg-amber-400 text-slate-950'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-950'
                      : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="text-2xl">{player.avatar || '⚡'}</div>

                <div className="min-w-0">
                  <span className="text-base font-bold text-white block truncate">
                    {player.nickname}
                  </span>
                  {player.streak > 1 && (
                    <span className="text-xs text-orange-400 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                      {player.streak} Streak
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-white font-mono">
                  {player.score || 0}
                </div>
                {player.lastRoundPoints > 0 && (
                  <div className="text-xs font-bold text-emerald-400">
                    +{player.lastRoundPoints}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Host Advance Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Exit / New Quiz</span>
        </button>

        {!isFinal ? (
          isLastQuestion ? (
            <button
              onClick={onFinishGame}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-black text-base shadow-xl shadow-orange-500/25 transition transform hover:scale-[1.02] cursor-pointer"
            >
              <Trophy className="w-5 h-5 text-amber-200" />
              <span>Final Podium</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onNextQuestion}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-500/25 transition transform hover:scale-[1.02] cursor-pointer"
            >
              <span>Next Question</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
