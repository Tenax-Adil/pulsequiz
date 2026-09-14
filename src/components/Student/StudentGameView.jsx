import React, { useState, useEffect } from 'react';
import {
  Triangle,
  Diamond,
  Circle,
  Square,
  Check,
  Clock,
  Send,
  Loader2,
  Sparkles
} from 'lucide-react';
import { OPTION_THEMES } from '../Common/AnswerButton.jsx';
import { soundFx } from '../../services/audio.js';
import { Badge } from '../ui/badge.jsx';
import { Card, CardContent } from '../ui/card.jsx';

export function StudentGameView({ room, player, onSubmitAnswer }) {
  const currentIdx = room.currentQuestionIndex || 0;
  const currentQ = room.questions?.[currentIdx];
  const timeLimit = currentQ?.timeLimit || 20;

  // Check if player has already submitted for this question
  const existingResponse =
    room.responses?.[currentQ?.id]?.[player?.id] || null;

  const [selectedIdx, setSelectedIdx] = useState(
    existingResponse !== null ? existingResponse.selectedOption : null
  );
  const [submitting, setSubmitting] = useState(false);

  // Synchronize submission state if room reloads
  useEffect(() => {
    if (existingResponse) {
      setSelectedIdx(existingResponse.selectedOption);
    } else {
      setSelectedIdx(null);
      setSubmitting(false);
    }
  }, [currentIdx, existingResponse]);

  const handleSelectOption = (idx) => {
    if (selectedIdx !== null || submitting) return; // Prevent double submit

    setSelectedIdx(idx);
    setSubmitting(true);
    soundFx.playSelect();

    const now = Date.now();
    const startedAt = room.questionStartedAt || now;
    const timeSpentMs = Math.max(200, now - startedAt);
    const totalTimeMs = timeLimit * 1000;

    const isCorrect = idx === currentQ.correctOptionIndex;
    // Kahoot speed bonus formula
    const pointsAwarded = isCorrect
      ? Math.round(1000 * (1 - (timeSpentMs / totalTimeMs) / 2))
      : 0;

    onSubmitAnswer({
      selectedOption: idx,
      timeSpentMs,
      pointsAwarded,
      isCorrect,
      submittedAt: now,
    });
  };

  const isLocked = selectedIdx !== null;

  return (
    <div className="max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-between min-h-[calc(100vh-5rem)]">
      {/* Top Status Bar: Question Number & Player Score */}
      <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-xl mb-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">
            Question
          </span>
          <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
            {currentIdx + 1} / {room.questions?.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-zinc-200">
            {player?.nickname}
          </span>
          <Badge variant="secondary" className="font-mono text-xs font-bold text-zinc-100 bg-zinc-800">
            {player?.score || 0} pts
          </Badge>
        </div>
      </div>

      {/* Main Content Area */}
      {!isLocked ? (
        /* Active Answering Phase: 4 Color Blocks */
        <div className="flex-1 flex flex-col justify-center animate-in fade-in-50 duration-200">
          <div className="text-center mb-5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block mb-1">
              Select Your Answer
            </span>
            <p className="text-xs text-zinc-500">
              Match the shape and color on the main screen!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 h-[400px] sm:h-[440px]">
            {OPTION_THEMES.map((theme, idx) => {
              const Icon = theme.icon;
              const optionText = currentQ?.options?.[idx];

              return (
                <button
                  key={idx}
                  id={`student-btn-${idx}`}
                  type="button"
                  disabled={isLocked || submitting}
                  onClick={() => handleSelectOption(idx)}
                  className={`
                    w-full h-full rounded-2xl p-4 text-white
                    transition-all duration-150 transform active:scale-98 cursor-pointer
                    flex flex-col items-center justify-center text-center
                    ${theme.bg} shadow-md border ${theme.border}
                    hover:opacity-95 hover:shadow-lg
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl bg-black/20 flex items-center justify-center mb-2.5 shadow-inner">
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white" />
                  </div>
                  {optionText && (
                    <span className="text-xs sm:text-sm font-semibold line-clamp-2 px-1 text-white/95">
                      {optionText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Submitted / Locked State */
        <div className="flex-1 flex flex-col items-center justify-center text-center my-8 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-sm">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-zinc-100 tracking-tight mb-2">
            Answer Locked In
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mb-6">
            Your response has been registered. Waiting for the timer or remaining players.
          </p>

          {/* Selected Option Preview */}
          {selectedIdx !== null && (
            <div className={`p-3.5 rounded-xl border max-w-xs w-full text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-sm ${OPTION_THEMES[selectedIdx].bg} ${OPTION_THEMES[selectedIdx].border}`}>
              {React.createElement(OPTION_THEMES[selectedIdx].icon, {
                className: 'w-5 h-5 fill-white text-white',
              })}
              <span>Option {selectedIdx + 1} Submitted</span>
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
            <span>Scores reveal on host display soon...</span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center py-2">
        <span className="text-[11px] text-zinc-500">
          PulseQuiz Live Sync &bull; Watch the presenter screen
        </span>
      </div>
    </div>
  );
}

