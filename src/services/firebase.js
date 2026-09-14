// Firebase Realtime Database Service with Dual-Engine Architecture
// (Live Firebase RTDB when configured + Zero-Config BroadcastChannel Sync for instant local demo)

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  get,
  child,
  remove,
} from 'firebase/database';

let db = null;
let firebaseApp = null;
let isConfigured = false;

// Local fallback store & broadcast channel for instant multi-tab sync without setup
const localRoomsStore = new Map();
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('pulsequiz_channel')
  : null;

const localListeners = new Map(); // roomCode -> Set of callbacks

function notifyLocalListeners(roomCode, data) {
  const listeners = localListeners.get(roomCode);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(data ? JSON.parse(JSON.stringify(data)) : null);
      } catch (err) {
        console.error('Error in local room listener callback:', err);
      }
    });
  }
}

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const { type, roomCode, data } = event.data || {};
    if (type === 'ROOM_UPDATE' && roomCode) {
      localRoomsStore.set(roomCode, data);
      // Mirror to localStorage so newly opened tabs get immediate state
      try {
        localStorage.setItem(`pulse_room_${roomCode}`, JSON.stringify(data));
      } catch {
        // storage quota or private mode
      }
      notifyLocalListeners(roomCode, data);
    }
  };
}

// Window storage event fallback for cross-tab sync when BroadcastChannel is unsupported
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('pulse_room_')) {
      const roomCode = e.key.replace('pulse_room_', '');
      try {
        const data = JSON.parse(e.newValue);
        localRoomsStore.set(roomCode, data);
        notifyLocalListeners(roomCode, data);
      } catch {
        // ignore
      }
    }
  });
}

export function initFirebase() {
  if (db) return { isConfigured, db };

  // Read config from env or localStorage
  let config = null;
  const getEnv = (key) => {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key];
    } catch {}
    try {
      if (typeof process !== 'undefined' && process.env) return process.env[key];
    } catch {}
    return '';
  };

  const envApiKey = getEnv('VITE_FIREBASE_API_KEY');
  const envDbUrl = getEnv('VITE_FIREBASE_DATABASE_URL');

  if (envApiKey && envDbUrl && !envDbUrl.includes('your-app-default')) {
    config = {
      apiKey: envApiKey,
      authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      databaseURL: envDbUrl,
      projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnv('VITE_FIREBASE_APP_ID'),
    };
  } else {
    try {
      const saved = localStorage.getItem('pulse_firebase_config');
      if (saved) {
        config = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  if (config && config.apiKey && config.databaseURL) {
    try {
      firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
      db = getDatabase(firebaseApp);
      isConfigured = true;
      console.log('⚡ Firebase Realtime Database initialized successfully in LIVE mode');
      return { isConfigured: true, db };
    } catch (err) {
      console.warn('Firebase initialization error, using local real-time sync engine:', err);
    }
  }

  isConfigured = false;
  console.log('ℹ️ Running in Instant Zero-Config Sync Mode (Local / Cross-Tab Broadcast)');
  return { isConfigured: false, db: null };
}

export function isFirebaseLive() {
  initFirebase();
  return isConfigured;
}

// Generate a random, human-friendly 6-digit room PIN
export function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Subscribes to room state changes at /rooms/{roomCode}
 * @param {string} roomCode
 * @param {function} callback
 * @returns {function} unsubscribe
 */
export function subscribeToRoom(roomCode, callback) {
  initFirebase();

  if (isConfigured && db) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        const data = snapshot.val();
        callback(data);
      },
      (error) => {
        console.error(`Firebase snapshot error for room ${roomCode}:`, error);
        callback(null);
      }
    );
    return () => unsubscribe();
  }

  // Local fallback engine
  if (!localListeners.has(roomCode)) {
    localListeners.set(roomCode, new Set());
  }
  localListeners.get(roomCode).add(callback);

  // Check if room is in memory or localStorage
  let initial = localRoomsStore.get(roomCode);
  if (!initial) {
    try {
      const saved = localStorage.getItem(`pulse_room_${roomCode}`);
      if (saved) {
        initial = JSON.parse(saved);
        localRoomsStore.set(roomCode, initial);
      }
    } catch {
      // ignore
    }
  }
  if (initial) {
    setTimeout(() => callback(initial), 0);
  }

  return () => {
    const listeners = localListeners.get(roomCode);
    if (listeners) {
      listeners.delete(callback);
    }
  };
}

/**
 * Creates or overwrites room state
 */
export async function createRoom(roomData) {
  const { roomCode } = roomData;
  initFirebase();

  if (isConfigured && db) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    await set(roomRef, roomData);
    return roomData;
  }

  // Local engine
  localRoomsStore.set(roomCode, roomData);
  try {
    localStorage.setItem(`pulse_room_${roomCode}`, JSON.stringify(roomData));
  } catch {
    // ignore
  }

  if (syncChannel) {
    syncChannel.postMessage({ type: 'ROOM_UPDATE', roomCode, data: roomData });
  }
  notifyLocalListeners(roomCode, roomData);
  return roomData;
}

/**
 * Updates partial room state (e.g. status, currentQuestionIndex)
 */
export async function updateRoom(roomCode, updates) {
  initFirebase();

  if (isConfigured && db) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    await update(roomRef, updates);
    return;
  }

  // Local engine
  let current = localRoomsStore.get(roomCode);
  if (!current) {
    try {
      const saved = localStorage.getItem(`pulse_room_${roomCode}`);
      if (saved) current = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  const updated = { ...(current || {}), ...updates };
  localRoomsStore.set(roomCode, updated);

  try {
    localStorage.setItem(`pulse_room_${roomCode}`, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (syncChannel) {
    syncChannel.postMessage({ type: 'ROOM_UPDATE', roomCode, data: updated });
  }
  notifyLocalListeners(roomCode, updated);
}

/**
 * Player joins room
 */
export async function joinRoom(roomCode, player) {
  initFirebase();

  if (isConfigured && db) {
    const playerRef = ref(db, `rooms/${roomCode}/players/${player.id}`);
    await set(playerRef, {
      nickname: player.nickname,
      avatar: player.avatar || '⚡',
      score: 0,
      streak: 0,
      lastRoundPoints: 0,
      joinedAt: Date.now(),
    });
    return;
  }

  // Local engine
  let current = localRoomsStore.get(roomCode);
  if (!current) {
    try {
      const saved = localStorage.getItem(`pulse_room_${roomCode}`);
      if (saved) current = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  if (!current) throw new Error('Room not found');

  const updated = {
    ...current,
    players: {
      ...(current.players || {}),
      [player.id]: {
        nickname: player.nickname,
        avatar: player.avatar || '⚡',
        score: 0,
        streak: 0,
        lastRoundPoints: 0,
        joinedAt: Date.now(),
      },
    },
  };

  localRoomsStore.set(roomCode, updated);
  try {
    localStorage.setItem(`pulse_room_${roomCode}`, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (syncChannel) {
    syncChannel.postMessage({ type: 'ROOM_UPDATE', roomCode, data: updated });
  }
  notifyLocalListeners(roomCode, updated);
}

/**
 * Player submits answer to question
 */
export async function submitAnswer(roomCode, questionId, playerId, answerData) {
  initFirebase();

  if (isConfigured && db) {
    const responseRef = ref(db, `rooms/${roomCode}/responses/${questionId}/${playerId}`);
    await set(responseRef, answerData);
    return;
  }

  // Local engine
  let current = localRoomsStore.get(roomCode);
  if (!current) {
    try {
      const saved = localStorage.getItem(`pulse_room_${roomCode}`);
      if (saved) current = JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  if (!current) return;

  const currentResponses = current.responses || {};
  const questionResponses = currentResponses[questionId] || {};

  const updated = {
    ...current,
    responses: {
      ...currentResponses,
      [questionId]: {
        ...questionResponses,
        [playerId]: answerData,
      },
    },
  };

  localRoomsStore.set(roomCode, updated);
  try {
    localStorage.setItem(`pulse_room_${roomCode}`, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (syncChannel) {
    syncChannel.postMessage({ type: 'ROOM_UPDATE', roomCode, data: updated });
  }
  notifyLocalListeners(roomCode, updated);
}

/**
 * Fetch current snapshot of a room
 */
export async function getRoom(roomCode) {
  initFirebase();

  if (isConfigured && db) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    return snapshot.val();
  }

  let data = localRoomsStore.get(roomCode);
  if (!data) {
    try {
      const saved = localStorage.getItem(`pulse_room_${roomCode}`);
      if (saved) data = JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return data || null;
}

// -------------------------------------------------------------
// QUIZ LIBRARY STORAGE (SAVE & LOAD CREATED QUIZZES)
// -------------------------------------------------------------

export async function saveQuizToLibrary(quiz) {
  initFirebase();
  const quizId = quiz.id || `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const preparedQuiz = {
    ...quiz,
    id: quizId,
    updatedAt: Date.now(),
    createdAt: quiz.createdAt || Date.now(),
  };

  // 1. Mirror in localStorage
  try {
    const raw = localStorage.getItem('pulse_saved_quizzes');
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(q => q.id === quizId);
    if (idx >= 0) {
      list[idx] = preparedQuiz;
    } else {
      list.unshift(preparedQuiz);
    }
    localStorage.setItem('pulse_saved_quizzes', JSON.stringify(list));
  } catch {
    // ignore
  }

  // 2. Save in Firebase Realtime Database
  if (isConfigured && db) {
    try {
      const quizRef = ref(db, `saved_quizzes/${quizId}`);
      await set(quizRef, preparedQuiz);
    } catch (err) {
      console.warn('Firebase saveQuiz error (falling back to local):', err);
    }
  }

  return preparedQuiz;
}

export async function fetchSavedQuizzes() {
  initFirebase();
  let firebaseList = [];

  if (isConfigured && db) {
    try {
      const listRef = ref(db, 'saved_quizzes');
      const snap = await get(listRef);
      const val = snap.val();
      if (val) {
        firebaseList = Object.values(val);
      }
    } catch (err) {
      console.warn('Firebase fetchSavedQuizzes error:', err);
    }
  }

  // Merge with localStorage
  let localList = [];
  try {
    const raw = localStorage.getItem('pulse_saved_quizzes');
    if (raw) localList = JSON.parse(raw);
  } catch {
    // ignore
  }

  const map = new Map();
  [...localList, ...firebaseList].forEach(q => {
    if (q && q.id) map.set(q.id, q);
  });

  return Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function deleteSavedQuiz(quizId) {
  initFirebase();

  // Remove from localStorage
  try {
    const raw = localStorage.getItem('pulse_saved_quizzes');
    if (raw) {
      const list = JSON.parse(raw).filter(q => q.id !== quizId);
      localStorage.setItem('pulse_saved_quizzes', JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  // Remove from Firebase Realtime Database
  if (isConfigured && db) {
    try {
      const quizRef = ref(db, `saved_quizzes/${quizId}`);
      await remove(quizRef);
    } catch (err) {
      console.warn('Firebase deleteSavedQuiz error:', err);
    }
  }
}

// -------------------------------------------------------------
// GAME SESSION HISTORY (TRACK COMPLETED QUIZZES & RESULTS)
// -------------------------------------------------------------

export async function recordGameHistory(gameSession) {
  initFirebase();
  const historyId = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const record = {
    ...gameSession,
    id: historyId,
    completedAt: Date.now(),
  };

  // 1. Mirror in localStorage
  try {
    const raw = localStorage.getItem('pulse_quiz_history');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    // Keep last 50 games
    localStorage.setItem('pulse_quiz_history', JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore
  }

  // 2. Save in Firebase Realtime Database
  if (isConfigured && db) {
    try {
      const histRef = ref(db, `history/${historyId}`);
      await set(histRef, record);
    } catch (err) {
      console.warn('Firebase recordGameHistory error:', err);
    }
  }

  return record;
}

export async function fetchGameHistory() {
  initFirebase();
  let firebaseList = [];

  if (isConfigured && db) {
    try {
      const listRef = ref(db, 'history');
      const snap = await get(listRef);
      const val = snap.val();
      if (val) {
        firebaseList = Object.values(val);
      }
    } catch (err) {
      console.warn('Firebase fetchGameHistory error:', err);
    }
  }

  let localList = [];
  try {
    const raw = localStorage.getItem('pulse_quiz_history');
    if (raw) localList = JSON.parse(raw);
  } catch {
    // ignore
  }

  const map = new Map();
  [...localList, ...firebaseList].forEach(h => {
    if (h && h.id) map.set(h.id, h);
  });

  return Array.from(map.values()).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
}

export async function deleteGameHistory(historyId) {
  initFirebase();

  try {
    const raw = localStorage.getItem('pulse_quiz_history');
    if (raw) {
      const list = JSON.parse(raw).filter(h => h.id !== historyId);
      localStorage.setItem('pulse_quiz_history', JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  if (isConfigured && db) {
    try {
      const histRef = ref(db, `history/${historyId}`);
      await remove(histRef);
    } catch (err) {
      console.warn('Firebase deleteGameHistory error:', err);
    }
  }
}
