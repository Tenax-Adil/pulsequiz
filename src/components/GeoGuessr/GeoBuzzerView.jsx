import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGeoRoomSync } from '../../hooks/useGeoRoomSync.js';
import { GEO_STATES, getRankLabel } from '../../services/geoEngine.js';
import { soundFx } from '../../services/audio.js';
import { Zap, Globe, Check, Clock, Lock, AlertCircle, UserX } from 'lucide-react';

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

  const isBuzzingOpen = [GEO_STATES.PANORAMA, GEO_STATES.HOST_MIRROR, GEO_STATES.BUZZER_LOCKED].includes(status);
  const locIdx = geoRoom?.currentLocationIndex || 0;
  const hasFailedThisLocation = Boolean(geoRoom?.failedPlayers?.[playerId]);

  // Reset buzz state when panorama starts or new location index arrives
  useEffect(() => {
    if (status === GEO_STATES.PANORAMA) {
      setHasBuzzed(false);
    }
  }, [status, locIdx]);

  // Check if already buzzed in the current queue
  useEffect(() => {
    if (playerId && buzzerQueueRaw?.[playerId]) {
      setHasBuzzed(true);
    }
  }, [playerId, buzzerQueueRaw]);

  // Auto-sync player registration in room if pre-joined via JoinForm
  useEffect(() => {
    // If player has been kicked by host, do not re-join and clear local storage
    if (playerId && geoRoom?.kicked?.[playerId]) {
      try {
        localStorage.removeItem('pulse_geo_player');
      } catch {
        // ignore
      }
      return;
    }

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

  // ─── Buzz (Available for 1st, 2nd, 3rd+ while round is active) ─────────
  const handleBuzz = useCallback(async () => {
    if (hasBuzzed || hasFailedThisLocation || !playerId || !isBuzzingOpen) return;

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
  }, [hasBuzzed, hasFailedThisLocation, playerId, isBuzzingOpen, submitBuzz]);

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

  // PLAYER KICKED / REMOVED BY HOST
  if (playerId && geoRoom?.kicked?.[playerId]) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400">
          <UserX className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Removed from Room</h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-xs leading-relaxed">
          You have been removed from this GeoGuessr session by the host.
        </p>
        <button
          onClick={() => {
            try {
              localStorage.removeItem('pulse_geo_player');
            } catch {
              // ignore
            }
            window.location.hash = '';
            window.location.reload();
          }}
          className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

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

  // FAILED THIS LOCATION (0 PTS) — Waiting for next round while other buzzers try
  if (hasFailedThisLocation && status !== GEO_STATES.REVEAL && status !== GEO_STATES.FINISHED) {
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mb-6">
          <span className="text-3xl font-black text-red-400">0</span>
        </div>
        <h2 className="text-2xl font-bold text-red-400 mb-1">0 Points</h2>
        <p className="text-sm text-zinc-400 mb-4">Your guess was outside the acceptable target area.</p>
        <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-amber-400 font-semibold inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Location is still hidden! Next buzzer is guessing...</span>
        </div>
      </div>
    );
  }

  // BUZZED — You are the active player (Your turn to guess!)
  if (hasBuzzed && isActive) {
    const rankLabel = myRank >= 0 ? getRankLabel(myRank) : '1st';
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-emerald-950 text-zinc-100 p-6 text-center animate-fade-in-up">
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-6 animate-pulse-ring">
          <Check className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black text-emerald-400 mb-2">YOU'RE UP!</h2>
        <p className="text-lg text-emerald-300/80 mb-4">Go to the screen and place your tag!</p>
        <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/30">
          🎯 {rankLabel} Buzzer &bull; Active Guesser
        </span>
      </div>
    );
  }

  // BUZZED — You are in queue (Waiting for turn if current player gets 0 pts)
  if (hasBuzzed && myRank >= 0) {
    const activeP = activePlayerId ? players[activePlayerId] : null;
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-amber-950/50 text-zinc-100 p-6 text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center mb-6">
          <span className="text-2xl font-black text-amber-400">{getRankLabel(myRank)}</span>
        </div>
        <h2 className="text-xl font-bold text-amber-400 mb-2">Buzzed In!</h2>
        <p className="text-sm text-zinc-300">You are <strong className="text-amber-400">#{myRank + 1}</strong> in the queue</p>
        <p className="text-xs text-zinc-400 mt-3 max-w-xs leading-relaxed">
          {activeP ? (
            <><strong>{activeP.nickname}</strong> is guessing now. If they score 0 points, it will be your turn!</>
          ) : (
            <>Get ready to place your tag!</>
          )}
        </p>
      </div>
    );
  }

  // BUZZING OPEN — Player can buzz in (1st, 2nd, 3rd, and more)
  if (isBuzzingOpen && !hasBuzzed && !hasFailedThisLocation) {
    const activeP = activePlayerId ? players[activePlayerId] : null;
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4 text-center">
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
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative z-10 flex flex-col items-center gap-2">
            <Zap className="w-12 h-12" />
            <span>BUZZ IN</span>
            {activeP && (
              <span className="text-[11px] font-bold tracking-normal text-amber-200 uppercase bg-black/40 px-3 py-1 rounded-full">
                Join Queue #{sortedQueue.length + 1}
              </span>
            )}
          </div>
        </button>

        {activeP ? (
          <div className="mt-6 text-center max-w-xs">
            <p className="text-sm font-semibold text-zinc-300">
              {activeP.avatar} {activeP.nickname} is guessing
            </p>
            <p className="text-xs text-amber-400/90 mt-1">
              Buzz now to be next in line if they score 0 points!
            </p>
          </div>
        ) : (
          <p className="text-zinc-500 text-xs mt-6 uppercase tracking-wider">Tap when you know the location</p>
        )}
      </div>
    );
  }

  // REVEAL — Round in progress results
  if (status === GEO_STATES.REVEAL) {
    const winnerP = geoRoom?.revealResult?.playerId ? players[geoRoom.revealResult.playerId] : null;
    return (
      <div className="geo-buzzer-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Globe className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Location Revealed!</h2>
        {winnerP ? (
          <p className="text-sm text-zinc-300">
            {winnerP.avatar} <strong className="text-amber-400">{winnerP.nickname}</strong> scored points!
          </p>
        ) : (
          <p className="text-sm text-zinc-400">Round completed.</p>
        )}
        <p className="text-xs text-zinc-500 mt-4">Next location coming up...</p>
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
