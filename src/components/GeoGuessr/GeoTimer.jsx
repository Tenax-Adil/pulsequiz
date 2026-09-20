import React, { useEffect, useState, useRef } from 'react';

/**
 * Animated countdown timer bar
 * Props:
 *  - durationSec: total seconds for countdown
 *  - startedAt: timestamp (ms) when timer started
 *  - onExpire: callback when timer reaches 0
 *  - label: optional label text
 *  - className: extra CSS classes
 */
export function GeoTimer({
  durationSec = 15,
  startedAt = Date.now(),
  onExpire = null,
  label = '',
  className = '',
}) {
  const [remaining, setRemaining] = useState(durationSec);
  const [percentage, setPercentage] = useState(100);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rem = Math.max(0, durationSec - elapsed);
      const pct = Math.max(0, (rem / durationSec) * 100);

      setRemaining(rem);
      setPercentage(pct);

      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick(); // Initial
    const interval = setInterval(tick, 50); // Smooth updates

    return () => clearInterval(interval);
  }, [durationSec, startedAt, onExpire]);

  const getColor = () => {
    if (percentage > 60) return 'bg-emerald-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGlow = () => {
    if (percentage > 60) return 'shadow-emerald-500/30';
    if (percentage > 30) return 'shadow-yellow-500/30';
    return 'shadow-red-500/30';
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-sm font-bold text-white tabular-nums">
            {Math.ceil(remaining)}s
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear shadow-md ${getColor()} ${getGlow()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default GeoTimer;
