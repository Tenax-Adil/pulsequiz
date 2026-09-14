import React from 'react';
import { Triangle, Diamond, Circle, Square } from 'lucide-react';

export const OPTION_THEMES = [
  {
    index: 0,
    bg: 'bg-[#e21b3c] hover:bg-[#c91533] active:bg-[#b0122c]',
    border: 'border-red-400/40',
    shadow: 'shadow-red-900/30',
    icon: Triangle,
    shape: 'Triangle',
    label: 'Red',
  },
  {
    index: 1,
    bg: 'bg-[#1368ce] hover:bg-[#0f54a8] active:bg-[#0c4488]',
    border: 'border-blue-400/40',
    shadow: 'shadow-blue-900/30',
    icon: Diamond,
    shape: 'Diamond',
    label: 'Blue',
  },
  {
    index: 2,
    bg: 'bg-[#d89e00] hover:bg-[#b88600] active:bg-[#9c7100]',
    border: 'border-amber-400/40',
    shadow: 'shadow-amber-900/30',
    icon: Circle,
    shape: 'Circle',
    label: 'Yellow',
  },
  {
    index: 3,
    bg: 'bg-[#26890c] hover:bg-[#1e6f09] active:bg-[#185b07]',
    border: 'border-green-400/40',
    shadow: 'shadow-green-900/30',
    icon: Square,
    shape: 'Square',
    label: 'Green',
  },
];

export function AnswerButton({
  index,
  text,
  onClick,
  disabled = false,
  selected = false,
  isCorrect = null, // true | false | null
  revealed = false,
  showLabelOnly = false,
  statsCount = null,
  statsPercent = null,
}) {
  const theme = OPTION_THEMES[index % 4];
  const Icon = theme.icon;

  let extraStyles = '';
  if (revealed) {
    if (isCorrect) {
      extraStyles = 'ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/50 scale-[1.02] opacity-100';
    } else {
      extraStyles = 'opacity-35 grayscale-[50%] scale-[0.98]';
    }
  } else if (selected) {
    extraStyles = 'ring-4 ring-white shadow-xl scale-[1.01]';
  }

  return (
    <button
      type="button"
      id={`answer-btn-${index}`}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full rounded-2xl p-4 sm:p-6 text-white font-bold
        transition-all duration-200 transform select-none cursor-pointer
        disabled:cursor-not-allowed
        flex flex-col justify-between
        ${theme.bg} ${theme.shadow} shadow-lg border-2 ${theme.border}
        ${extraStyles}
      `}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 fill-white text-white" />
          </div>
          {!showLabelOnly && text && (
            <span className="text-left text-lg sm:text-2xl font-bold tracking-tight line-clamp-3">
              {text}
            </span>
          )}
        </div>

        {statsCount !== null && (
          <div className="flex items-center space-x-2 bg-black/30 px-3 py-1 rounded-full text-sm font-semibold">
            <span>{statsCount}</span>
            {statsPercent !== null && (
              <span className="text-white/70">({statsPercent}%)</span>
            )}
          </div>
        )}
      </div>

      {showLabelOnly && (
        <div className="py-6 sm:py-10 flex items-center justify-center w-full">
          <Icon className="w-16 h-16 sm:w-20 sm:h-20 fill-white text-white drop-shadow-md" />
        </div>
      )}
    </button>
  );
}
