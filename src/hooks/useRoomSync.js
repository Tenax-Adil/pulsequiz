import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToRoom,
  updateRoom,
  submitAnswer,
  kickPlayer,
  isFirebaseLive,
} from '../services/firebase.js';

/**
 * Custom hook to subscribe to real-time room state from Firebase or Sync Engine
 */
export function useRoomSync(roomCode) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setIsLive(isFirebaseLive());
  }, []);

  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToRoom(roomCode, (data) => {
      if (data) {
        setRoom(data);
        setError(null);
      } else {
        setError('Room not found or session closed');
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [roomCode]);

  const update = useCallback(
    async (updates) => {
      if (!roomCode) return;
      try {
        await updateRoom(roomCode, updates);
      } catch (err) {
        console.error('Failed to update room:', err);
      }
    },
    [roomCode]
  );

  const answer = useCallback(
    async (questionId, playerId, data) => {
      if (!roomCode) return;
      try {
        await submitAnswer(roomCode, questionId, playerId, data);
      } catch (err) {
        console.error('Failed to submit answer:', err);
      }
    },
    [roomCode]
  );

  const kick = useCallback(
    async (playerId) => {
      if (!roomCode || !playerId) return;
      try {
        await kickPlayer(roomCode, playerId);
      } catch (err) {
        console.error('Failed to kick player:', err);
      }
    },
    [roomCode]
  );

  return {
    room,
    loading,
    error,
    isLive,
    updateRoom: update,
    submitAnswer: answer,
    kickPlayer: kick,
  };
}
