import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToGeoRoom,
  updateGeoState,
  submitBuzz,
  mirrorCoords,
  confirmGuess,
  passTurn,
  recordFailedGuess,
  updatePlayerScore,
  joinGeoRoom,
  kickGeoPlayer,
} from '../services/geoFirebase.js';

/**
 * Custom hook to subscribe to real-time GeoGuessr room state.
 * Mirrors the useRoomSync pattern.
 */
export function useGeoRoomSync(roomCode) {
  const [geoRoom, setGeoRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomCode) {
      setGeoRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToGeoRoom(roomCode, (data) => {
      if (data) {
        setGeoRoom(data);
        setError(null);
      } else {
        setError('GeoGuessr room not found');
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomCode]);

  const dispatchUpdate = useCallback(
    async (updates) => {
      if (!roomCode) return;
      try { await updateGeoState(roomCode, updates); }
      catch (err) { console.error('GeoGuessr update error:', err); }
    },
    [roomCode]
  );

  const dispatchBuzz = useCallback(
    async (playerId) => {
      if (!roomCode) return;
      try { await submitBuzz(roomCode, playerId); }
      catch (err) { console.error('Buzz submit error:', err); }
    },
    [roomCode]
  );

  const dispatchMirror = useCallback(
    async (lat, lon) => {
      if (!roomCode) return;
      try { await mirrorCoords(roomCode, lat, lon); }
      catch (err) { console.error('Mirror coords error:', err); }
    },
    [roomCode]
  );

  const dispatchConfirm = useCallback(
    async (revealResult) => {
      if (!roomCode) return;
      try { await confirmGuess(roomCode, revealResult); }
      catch (err) { console.error('Confirm guess error:', err); }
    },
    [roomCode]
  );

  const dispatchPass = useCallback(
    async (nextPlayerId, extraUpdates) => {
      if (!roomCode) return;
      try { await passTurn(roomCode, nextPlayerId, extraUpdates); }
      catch (err) { console.error('Pass turn error:', err); }
    },
    [roomCode]
  );

  const dispatchFailedGuess = useCallback(
    async (playerId, nextPlayerId, extraData) => {
      if (!roomCode) return;
      try { await recordFailedGuess(roomCode, playerId, nextPlayerId, extraData); }
      catch (err) { console.error('Record failed guess error:', err); }
    },
    [roomCode]
  );

  const dispatchScoreUpdate = useCallback(
    async (playerId, newScore) => {
      if (!roomCode) return;
      try { await updatePlayerScore(roomCode, playerId, newScore); }
      catch (err) { console.error('Score update error:', err); }
    },
    [roomCode]
  );

  const dispatchJoin = useCallback(
    async (player) => {
      if (!roomCode) return;
      try { await joinGeoRoom(roomCode, player); }
      catch (err) { console.error('Join GeoGuessr room error:', err); throw err; }
    },
    [roomCode]
  );

  const dispatchKick = useCallback(
    async (playerId) => {
      if (!roomCode || !playerId) return;
      try { await kickGeoPlayer(roomCode, playerId); }
      catch (err) { console.error('Kick GeoGuessr player error:', err); }
    },
    [roomCode]
  );

  return {
    geoRoom,
    loading,
    error,
    updateGeoState: dispatchUpdate,
    submitBuzz: dispatchBuzz,
    mirrorCoords: dispatchMirror,
    confirmGuess: dispatchConfirm,
    passTurn: dispatchPass,
    recordFailedGuess: dispatchFailedGuess,
    updatePlayerScore: dispatchScoreUpdate,
    joinGeoRoom: dispatchJoin,
    kickGeoPlayer: dispatchKick,
  };
}
