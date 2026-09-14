import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  Trophy,
  BarChart3,
  Flame,
  AlertCircle
} from 'lucide-react';
import { AnswerButton, OPTION_THEMES } from '../Common/AnswerButton.jsx';
import { useQuizTimer } from '../../hooks/useQuizTimer.js';
import { soundFx } from '../../services/audio.js';

export function HostControl({
  room,
  onRevealAnswers,
  onShowLeaderboard,
  onNextQuestion,
  onEndQuiz,
}) {
  const currentIdx = room.currentQuestionIndex || 0;
  const currentQ = room.questions?.[currentIdx];
  const totalQuestions = room.questions?.length || 1;

  const players = room?.players ? Object.values(room.players) : [];
  const totalPlayers = players.length;

  const responsesForQ = (room?.responses && currentQ?.id && room.responses[currentQ.id]) || {};
  const answeredPlayerIds = Object.keys(responsesForQ);
  const responseCount = answeredPlayerIds.length;

  const [isRevealed, setIsRevealed] = useState(room.isQuestionRevealed || false);

  // Synchronized countdown timer
  const { timeLeft, progressPercent, isExpired } = useQuizTimer({
    timeLimit: currentQ?.timeLimit || 20,
    startedAt: room.questionStartedAt || Date.now(),
    isActive: !isRevealed,
    onTimeUp: () => {
      // Time is up, reveal answers
      setIsRevealed(true);
      onRevealAnswers();
    },
  });

  // Calculate live distribution count per option
  const optionCounts = [0, 0, 0, 0];
  answeredPlayerIds.forEach((pid) => {
    const resp = responsesForQ[pid];
    if (resp && typeof resp.selectedOption === 'number') {
      optionCounts[resp.selectedOption] = (optionCounts[resp.selectedOption] || 0) + 1;
    }
  });

  // Auto-reveal if all players have answered
  useEffect(() => {
    if (totalPlayers > 0 && responseCount >= totalPlayers && !isRevealed) {
      setIsRevealed(true);
      onRevealAnswers();
    }
  }, [totalPlayers, responseCount, isRevealed, onRevealAnswers]);

  const handleManualReveal = () => {
    setIsRevealed(true);
    soundFx.playTimeUp();
    onRevealAnswers();
  };

  const isLastQuestion = currentIdx >= totalQuestions - 1;

  if (!currentQ) {
    return (
      <div className="p-8 text-center text-white">
        Question data missing.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-5rem)] justify-between">
      {/* Top Header: Question Index, Countdown Clock, Response Counter */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-indigo-950 border border-indigo-500/40 text-indigo-300 rounded-2xl text-sm font-black font-mono">
            {currentIdx + 1} / {totalQuestions}
          </div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300 hidden sm:inline">
            {room.title}
          </span>
        </div>

        {/* Circular / Digital Countdown Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 px-5 py-2 rounded-2xl border border-slate-800 shadow-inner">
            <Clock className={`w-5 h-5 ${timeLeft <= 5 ? 'text-rose-500 animate-bounce' : 'text-amber-400'}`} />
            <span className={`text-2xl font-black font-mono tracking-tight ${timeLeft <= 5 ? 'text-rose-400' : 'text-white'}`}>
              {isRevealed ? 'TIME UP' : `${timeLeft}s`}
            </span>
          </div>

          {/* Response Tracker Pill */}
          <div className="flex items-center gap-2 bg-slate-950 px-5 py-2 rounded-2xl border border-slate-800 shadow-inner">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-2xl font-black text-white font-mono">
              {responseCount}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              / {totalPlayers}
            </span>
          </div>
        </div>

        {/* Action Button: Reveal or Leaderboard */}
        <div>
          {!isRevealed ? (
            <button
              onClick={handleManualReveal}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              Skip / Reveal
            </button>
          ) : (
            <button
              onClick={onShowLeaderboard}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Show Leaderboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Timer Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-2 my-4 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-200 ease-linear rounded-full ${
            progressPercent > 50
              ? 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              : progressPercent > 20
              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
              : 'bg-gradient-to-r from-orange-600 to-rose-600 animate-pulse'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Display & Media */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 text-center">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mb-6">
          {currentQ.text}
        </h2>

        {currentQ.imageUrl && (
          <div className="max-w-xl w-full max-h-64 sm:max-h-80 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl mb-6 bg-slate-950">
            <img
              src={currentQ.imageUrl}
              alt="Question illustration"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Live Answer Distribution Bar Graph while timer is running or revealed */}
        <div className="w-full max-w-2xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-400" /> Live Response Distribution
            </span>
            <span>
              {responseCount} of {totalPlayers} ({totalPlayers > 0 ? Math.round((responseCount / totalPlayers) * 100) : 0}%)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 h-16 items-end pt-2">
            {OPTION_THEMES.map((theme, idx) => {
              const count = optionCounts[idx];
              const percent = responseCount > 0 ? Math.round((count / responseCount) * 100) : 0;
              const isCorrect = currentQ.correctOptionIndex === idx;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-300 mb-1">
                    {count}
                  </span>
                  <div className="w-full bg-slate-950 rounded-lg h-full max-h-10 flex items-end p-0.5 border border-slate-800">
                    <div
                      className={`w-full rounded transition-all duration-300 ${theme.bg} ${
                        isRevealed && isCorrect ? 'ring-2 ring-emerald-400' : ''
                      }`}
                      style={{ height: `${Math.max(8, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Colored Response Cards (Kahoot Style Presenter Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {currentQ.options.map((optText, optIdx) => {
          const isCorrect = currentQ.correctOptionIndex === optIdx;
          const count = optionCounts[optIdx];
          const percent = responseCount > 0 ? Math.round((count / responseCount) * 100) : 0;

          return (
            <AnswerButton
              key={optIdx}
              index={optIdx}
              text={optText}
              disabled={true}
              revealed={isRevealed}
              isCorrect={isCorrect}
              statsCount={isRevealed ? count : null}
              statsPercent={isRevealed ? percent : null}
            />
          );
        })}
      </div>
    </div>
  );
}
