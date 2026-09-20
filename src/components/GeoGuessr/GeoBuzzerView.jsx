import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGeoRoomSync } from '../../hooks/useGeoRoomSync.js';
import { GEO_STATES, getRankLabel } from '../../services/geoEngine.js';
import { soundFx } from '../../services/audio.js';
import { Zap, Globe, Check, Clock, Lock, AlertCircle } from 'lucide-react';

/**
 * GeoGuessr Player Mobile Buzzer
 * Ultra-minimal, full-screen, thumb-friendly tap target.
 * Route: /#/player/buzzer?code=XXXX
 */
export function GeoBuzzerView({ roomCode }) {
  const { geoRoom, loading, submitBuzz, joinGeoRoom } = useGeoRoomSync(roomCode);

  const [playerId, setPlayerId] = useState(() => {
    try {
      const saved = localStorage.getItem('pulse_geo_player');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roomCode === roomCode) return parsed.id;
      }
    } catch { /* ignore */ }
    return null;
  });
  const [nickname, setNickname] = useState('');
  const [joined, setJoined] = useState(!!playerId);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [buzzAnimating, setBuzzAnimating] = useState(false);

  const status = geoRoom?.status;
  const players = geoRoom?.players || {};
  const buzzerQueueRaw = geoRoom?.buzzerQueue;
  const buzzerQueue = buzzerQueueRaw || {};
  const activePlayerId = geoRoom?.activePlayer;

  // Sorted queue for rank lookup
  const sortedQueue = useMemo(() => {
    if (!buzzerQueueRaw) return [];
    return Object.entries(buzzerQueueRaw)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [buzzerQueueRaw]);

  // My rank in queue
  const myRank = useMemo(() => {
    return sortedQueue.findIndex(b => b.id === playerId);
  }, [sortedQueue, playerId]);

  const isActive = activePlayerId === playerId;

  // Reset buzz state when panorama starts (new location)
  useEffect(() => {
    if (status === GEO_STATES.PANORAMA) {
      setHasBuzzed(false);
    }
  }, [status]);

  // Check if already buzzed in the current queue
  useEffect(() => {
    if (playerId && buzzerQueueRaw?.[playerId]) {
      setHasBuzzed(true);
    }
  }, [playerId, buzzerQueueRaw]);

  // Auto-sync player registration in room if pre-joined via JoinForm
  useEffect(() => {
    if (playerId && geoRoom && !loading && !players[playerId]) {
      try {
        const saved = localStorage.getItem('pulse_geo_player');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id === playerId && parsed.nickname && parsed.roomCode === roomCode) {
            joinGeoRoom({
              id: parsed.id,
              nickname: parsed.nickname,
              avatar: parsed.avatar || '🌍',
            });
          }
        }
      } catch { /* ignore */ }
    }
  }, [playerId, geoRoom, loading, players, roomCode, joinGeoRoom]);


  // ─── Join ──────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!nickname.trim()) return;

    const id = `geo_p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const avatars = ['🌍', '🗺️', '🧭', '📍', '🌎', '🌏', '🏔️', '🗼', '⛩️', '🏛️'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    try {
      await joinGeoRoom({
        id,
        nickname: nickname.trim(),
        avatar,
      });

      setPlayerId(id);
      setJoined(true);

      try {
        localStorage.setItem('pulse_geo_player', JSON.stringify({
          id, nickname: nickname.trim(), avatar, roomCode,
        }));
      } catch { /* ignore */ }

      soundFx.playSelect();
    } catch (err) {
      alert(err.message || 'Failed to join room');
    }
  };

  // ─── Buzz ──────────────────────────────────────────────────
  const handleBuzz = useCallback(async () => {
    if (hasBuzzed || !playerId || status !== GEO_STATES.PANORAMA) return;

    setHasBuzzed(true);
    setBuzzAnimating(true);

    // Haptic feedback
    try { navigator.vibrate?.(200); } catch { /* ignore */ }

    soundFx.playSelect();

    try {
      await submitBuzz(playerId);
    } catch (err) {
      console.error('Buzz failed:', err);
      setHasBuzzed(false);
    }

    setTimeout(() => setBuzzAnimating(false), 600);
  }, [hasBuzzed, playerId, status, submitBuzz]);

  // ─── Join Screen ───────────────────────────────────────────
  if (!joined) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100">
        <Globe className="w-14 h-14 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-1">GeoGuessr Buzzer</h1>
        <p className="text-sm text-zinc-500 mb-8">Room: {roomCode}</p>

        <div className="w-full max-w-xs space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="Your name"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-lg font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition"
            autoFocus
          />
          <button
            onClick={handleJoin}
            disabled={!nickname.trim()}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold text-lg transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Join Game
          </button>
        </div>

        {loading && (
          <p className="text-xs text-zinc-600 mt-6">Connecting...</p>
        )}
      </div>
    );
  }

  // ─── Loading / Connecting ──────────────────────────────────
  if (loading || !geoRoom) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-amber-400 animate-spin mb-4" />
        <p className="text-zinc-400 text-sm">Connecting to room...</p>
      </div>
    );
  }

  // ─── Buzzer States ─────────────────────────────────────────

  // ROOM CLOSED
  if (status === 'GEO_ROOM_CLOSED') {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Globe className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Room Closed</h2>
        <p className="text-sm text-zinc-400 mb-6">The host has closed this GeoGuessr session.</p>
        <button
          onClick={() => {
            try { localStorage.removeItem('pulse_geo_player'); } catch {}
            window.location.hash = '';
            window.location.reload();
          }}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  // LOBBY — Waiting for game to start
  if (status === GEO_STATES.LOBBY) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center mb-6 animate-pulse-ring">
          <Clock className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-300 mb-2">Waiting for Host</h2>
        <p className="text-sm text-zinc-600">The game will start soon...</p>
        <div className="mt-8 text-xs text-zinc-700">
          {players[playerId]?.nickname || 'You'} • Room {roomCode}
        </div>
      </div>
    );
  }

  // PANORAMA — Buzzer is ACTIVE
  if (status === GEO_STATES.PANORAMA && !hasBuzzed) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        {/* Giant buzz button */}
        <button
          onClick={handleBuzz}
          className={`
            w-64 h-64 sm:w-72 sm:h-72 rounded-full
            bg-gradient-to-br from-amber-500 to-orange-600
            text-white font-black text-3xl uppercase tracking-wider
            flex items-center justify-center
            shadow-2xl shadow-amber-500/30
            active:scale-95 transition-transform duration-100
            cursor-pointer relative
            ${buzzAnimating ? 'scale-90' : 'animate-pulse-ring'}
          `}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* Pulse ring behind button */}
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <Zap className="w-12 h-12" />
            <span>BUZZ IN</span>
          </div>
        </button>

        <p className="text-zinc-600 text-xs mt-6 uppercase tracking-wider">Tap when you know the location</p>
      </div>
    );
  }

  // BUZZED — You are #1 (active player)
  if (hasBuzzed && isActive) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-emerald-950 text-zinc-100 p-6">
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-6 animate-pulse-ring">
          <Check className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black text-emerald-400 mb-2">YOU'RE UP!</h2>
        <p className="text-lg text-emerald-300/70 mb-4">Go to the screen and place your tag!</p>
        <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/30">
          🥇 1st Buzzer
        </span>
      </div>
    );
  }

  // BUZZED — You are in queue (not active)
  if (hasBuzzed && myRank >= 0) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-amber-950/50 text-zinc-100 p-6">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mb-6">
          <span className="text-2xl font-black text-amber-400">{getRankLabel(myRank)}</span>
        </div>
        <h2 className="text-xl font-bold text-amber-400 mb-2">Buzzed In!</h2>
        <p className="text-sm text-zinc-400">You are <strong className="text-amber-400">#{myRank + 1}</strong> in the queue</p>
        {myRank > 0 && (
          <p className="text-xs text-zinc-600 mt-2">Wait for your turn if the current guess fails</p>
        )}
      </div>
    );
  }

  // BUZZER_LOCKED / HOST_MIRROR / REVEAL — Round in progress (not you)
  if ([GEO_STATES.BUZZER_LOCKED, GEO_STATES.HOST_MIRROR, GEO_STATES.REVEAL].includes(status)) {
    const activeP = activePlayerId ? players[activePlayerId] : null;
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-zinc-500" />
        </div>
        <h2 className="text-lg font-bold text-zinc-400 mb-2">Round in Progress</h2>
        {activeP && (
          <p className="text-sm text-zinc-500">
            {activeP.avatar} <strong className="text-zinc-300">{activeP.nickname}</strong> is guessing...
          </p>
        )}
        {status === GEO_STATES.REVEAL && (
          <p className="text-xs text-amber-500 mt-3 animate-pulse">Results incoming...</p>
        )}
      </div>
    );
  }

  // ROUND_WRAP — Between rounds
  if (status === GEO_STATES.ROUND_WRAP) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <Clock className="w-10 h-10 text-zinc-600 mb-4" />
        <h2 className="text-lg font-bold text-zinc-400">Next location loading...</h2>
      </div>
    );
  }

  // FINISHED
  if (status === GEO_STATES.FINISHED) {
    const myData = playerId ? players[playerId] : null;
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <span className="text-5xl mb-4">🏆</span>
        <h2 className="text-2xl font-black text-white mb-2">Game Over!</h2>
        {myData && (
          <div className="mt-4 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
            <div className="text-xs text-zinc-500 mb-1">Your Score</div>
            <div className="text-3xl font-black text-amber-400 tabular-nums">
              {(myData.score || 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <AlertCircle className="w-8 h-8 text-zinc-600 mb-3" />
      <p className="text-sm text-zinc-500">Waiting for game update...</p>
    </div>
  );
}

export default GeoBuzzerView;
