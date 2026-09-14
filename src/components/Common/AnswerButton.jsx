import React from 'react';
import { Triangle, Diamond, Circle, Square } from 'lucide-react';

export const OPTION_THEMES = [
  {
    index: 0,
    bg: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white',
    border: 'border-rose-500/40',
    shadow: 'shadow-sm',
    icon: Triangle,
    shape: 'Triangle',
    label: 'Red',
  },
  {
    index: 1,
    bg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white',
    border: 'border-blue-500/40',
    shadow: 'shadow-sm',
    icon: Diamond,
    shape: 'Diamond',
    label: 'Blue',
  },
  {
    index: 2,
    bg: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white',
    border: 'border-amber-500/40',
    shadow: 'shadow-sm',
    icon: Circle,
    shape: 'Circle',
    label: 'Yellow',
  },
  {
    index: 3,
    bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white',
    border: 'border-emerald-500/40',
    shadow: 'shadow-sm',
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
  isCorrect = null,
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
      extraStyles = 'ring-2 ring-emerald-400 shadow-md scale-[1.01] opacity-100';
    } else {
      extraStyles = 'opacity-30 grayscale-[60%] scale-[0.99]';
    }
  } else if (selected) {
    extraStyles = 'ring-2 ring-white shadow-md scale-[1.01]';
  }

  return (
    <button
      type="button"
      id={`answer-btn-${index}`}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full rounded-2xl p-4 sm:p-5 font-semibold
        transition-all duration-200 transform select-none cursor-pointer
        disabled:cursor-not-allowed
        flex flex-col justify-between
        ${theme.bg} ${theme.shadow} border ${theme.border}
        ${extraStyles}
      `}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 fill-white text-white" />
          </div>
          {!showLabelOnly && text && (
            <span className="text-left text-base sm:text-xl font-bold tracking-tight line-clamp-3">
              {text}
            </span>
          )}
        </div>

        {statsCount !== null && (
          <div className="flex items-center space-x-1.5 bg-black/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
            <span>{statsCount}</span>
            {statsPercent !== null && (
              <span className="text-white/70">({statsPercent}%)</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default AnswerButton;
