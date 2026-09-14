import { useState, useEffect, useRef } from 'react';
import { soundFx } from '../services/audio.js';

export function useQuizTimer({
  timeLimit = 20,
  startedAt = null,
  isActive = false,
  onTimeUp = null,
  enableSound = true,
}) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const hasEndedRef = useRef(false);
  const lastSecondRef = useRef(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
    hasEndedRef.current = false;
    lastSecondRef.current = timeLimit;

    if (!isActive || !startedAt) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - startedAt) / 1000;
      const remaining = Math.max(0, Math.ceil(timeLimit - elapsedSec));

      setTimeLeft(remaining);

      // Sound ticks for final 5 seconds
      if (enableSound && remaining <= 5 && remaining > 0 && remaining !== lastSecondRef.current) {
        soundFx.playTick();
        lastSecondRef.current = remaining;
      }

      if (remaining === 0 && !hasEndedRef.current) {
        hasEndedRef.current = true;
        if (enableSound) soundFx.playTimeUp();
        if (onTimeUpRef.current) {
          onTimeUpRef.current();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeLimit, startedAt, isActive, enableSound]);

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));

  return {
    timeLeft,
    progressPercent,
    isExpired: timeLeft === 0,
  };
}
