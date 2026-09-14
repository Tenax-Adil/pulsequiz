import React, { useState, useEffect } from 'react';
import {
  Triangle,
  Diamond,
  Circle,
  Square,
  Check,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import { OPTION_THEMES } from '../Common/AnswerButton.jsx';
import { soundFx } from '../../services/audio.js';

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
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-2xl mb-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">
            Question
          </span>
          <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-black rounded-lg">
            {currentIdx + 1} / {room.questions?.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            {player?.nickname}
          </span>
          <span className="text-xs font-mono font-bold text-pink-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
            {player?.score || 0} pts
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {!isLocked ? (
        /* Active Answering Phase: 4 Giant Kahoot Color Blocks */
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 block mb-1">
              Select Your Answer
            </span>
            <p className="text-xs text-slate-400">
              Match the shape and color on the main screen!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 h-[420px] sm:h-[460px]">
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
                    w-full h-full rounded-3xl p-4 text-white
                    transition-all duration-150 transform active:scale-95 cursor-pointer
                    flex flex-col items-center justify-center text-center
                    ${theme.bg} ${theme.shadow} shadow-lg border-2 ${theme.border}
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/20 flex items-center justify-center mb-3">
                    <Icon className="w-10 h-10 sm:w-12 sm:h-12 fill-white text-white drop-shadow" />
                  </div>
                  {optionText && (
                    <span className="text-xs sm:text-sm font-extrabold line-clamp-2 px-1 text-white/90">
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
        <div className="flex-1 flex flex-col items-center justify-center text-center my-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <Check className="w-12 h-12" />
            </div>
          </div>

          <h3 className="text-3xl font-black text-white tracking-tight mb-2">
            Answer Locked In!
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mb-6">
            Great speed! Waiting for the timer to expire or for all players to answer.
          </p>

          {/* Selected Option Badge */}
          {selectedIdx !== null && (
            <div className={`p-4 rounded-2xl border-2 max-w-xs w-full text-white font-bold flex items-center justify-center gap-3 ${OPTION_THEMES[selectedIdx].bg} ${OPTION_THEMES[selectedIdx].border}`}>
              {React.createElement(OPTION_THEMES[selectedIdx].icon, {
                className: 'w-6 h-6 fill-white text-white',
              })}
              <span>Option {selectedIdx + 1} Submitted</span>
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Results will appear on screen soon...</span>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center py-2">
        <span className="text-[11px] text-slate-500">
          PulseQuiz Live Sync &bull; Watch the main presenter display
        </span>
      </div>
    </div>
  );
}
