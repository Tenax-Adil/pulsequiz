import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  ChevronRight,
  Trophy,
  BarChart3,
  Maximize2,
  X
} from 'lucide-react';
import { AnswerButton, OPTION_THEMES } from '../Common/AnswerButton.jsx';
import { useQuizTimer } from '../../hooks/useQuizTimer.js';
import { soundFx } from '../../services/audio.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Card } from '../ui/card.jsx';

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
  const [zoomedImage, setZoomedImage] = useState(null);

  // Synchronized countdown timer
  const { timeLeft, progressPercent } = useQuizTimer({
    timeLimit: currentQ?.timeLimit || 20,
    startedAt: room.questionStartedAt || Date.now(),
    isActive: !isRevealed,
    onTimeUp: () => {
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

  if (!currentQ) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Question data missing.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-5rem)] justify-between animate-fade-in-up">
      {/* Top Header */}
      <Card className="border-zinc-800 bg-zinc-900/80 p-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1 bg-zinc-800 text-zinc-200 border-zinc-700">
            {currentIdx + 1} / {totalQuestions}
          </Badge>
          <span className="text-xs font-semibold text-zinc-300 truncate max-w-xs hidden sm:inline">
            {room.title}
          </span>
        </div>

        {/* Timer & Response Counters */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400' : 'text-zinc-400'}`} />
            <span className={`text-sm font-mono font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-zinc-100'}`}>
              {isRevealed ? 'Revealed' : `${timeLeft}s`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-mono font-bold text-zinc-100">
              {responseCount}/{totalPlayers}
            </span>
          </div>

          {/* Action Button */}
          {!isRevealed ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualReveal}
              className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100"
            >
              Skip / Reveal
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onShowLeaderboard}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold shadow-sm"
            >
              <Trophy className="w-3.5 h-3.5 mr-1" />
              <span>Leaderboard</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </Card>

      {/* Synchronized Timer Progress Bar */}
      <div className="w-full bg-zinc-900 rounded-full h-1.5 my-3 overflow-hidden border border-zinc-800/80">
        <div
          className={`h-full transition-all duration-200 ease-linear rounded-full ${
            progressPercent > 20
              ? 'bg-zinc-300'
              : 'bg-red-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Display & Media */}
      <div className="flex-1 flex flex-col items-center justify-center my-3 text-center">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-snug max-w-3xl mb-4">
          {currentQ.text}
        </h2>

        {currentQ.imageUrl && (
          <div className="w-full max-w-2xl mx-auto my-3 flex items-center justify-center">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800/90 bg-zinc-950/80 shadow-2xl p-1.5 flex items-center justify-center max-w-full group">
              <img
                src={currentQ.imageUrl}
                alt="Question Hint"
                className="max-h-[380px] sm:max-h-[460px] max-w-full w-auto h-auto object-contain rounded-xl mx-auto block cursor-pointer transition-transform hover:scale-[1.01]"
                onClick={() => setZoomedImage(currentQ.imageUrl)}
              />
              <button
                type="button"
                onClick={() => setZoomedImage(currentQ.imageUrl)}
                className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/75 hover:bg-black/90 text-white rounded-lg text-xs font-medium backdrop-blur-md border border-white/20 transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                title="View Full Size"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Full Size
              </button>
            </div>
          </div>
        )}

        {/* Live Answer Distribution Bar Graph */}
        <div className="w-full max-w-xl bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 mb-2">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400" /> Response Distribution
            </span>
            <span className="font-mono text-[11px]">
              {responseCount} / {totalPlayers} answered
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 h-14 items-end pt-1">
            {OPTION_THEMES.map((theme, idx) => {
              const count = optionCounts[idx];
              const percent = responseCount > 0 ? Math.round((count / responseCount) * 100) : 0;
              const isCorrect = currentQ.correctOptionIndex === idx;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end">
                  <span className="text-[10px] font-mono font-semibold text-zinc-300 mb-0.5">
                    {count}
                  </span>
                  <div className="w-full bg-zinc-950 rounded h-full max-h-8 flex items-end p-0.5 border border-zinc-800">
                    <div
                      className={`w-full rounded transition-all duration-300 ${theme.bg} ${
                        isRevealed && isCorrect ? 'ring-1 ring-white' : ''
                      }`}
                      style={{ height: `${Math.max(10, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Clean Options Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
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

      {/* Full Size Image Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[92vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-11 right-0 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white rounded-lg bg-zinc-900 border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <img
              src={zoomedImage}
              alt="Full Size View"
              className="max-h-[88vh] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default HostControl;
