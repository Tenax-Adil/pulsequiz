/**
 * GeoGuessr Firebase Service
 * Mirrors the dual-engine pattern: Firebase RTDB (live) + BroadcastChannel (local dev).
 * Operates under /geo_rooms/{roomCode}/ in Firebase.
 */

import {
  initFirebase,
  isFirebaseLive,
  generateRoomCode,
} from './firebase.js';

import {
  ref,
  onValue,
  set,
  update,
  get,
  remove,
  serverTimestamp,
} from 'firebase/database';

import { GEO_STATES } from './geoEngine.js';
import { GEO_LOCATIONS } from '../data/geoLocations.js';

// ─── Local Fallback Engine ────────────────────────────────────
const localGeoStore = new Map();
const geoChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('pulsequiz_geo_channel')
    : null;
const localGeoListeners = new Map();

function notifyGeoListeners(roomCode, data) {
  const listeners = localGeoListeners.get(roomCode);
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(data ? JSON.parse(JSON.stringify(data)) : null);
      } catch (err) {
        console.error('GeoGuessr local listener error:', err);
      }
    });
  }
}

if (geoChannel) {
  geoChannel.onmessage = (event) => {
    const { type, roomCode, data } = event.data || {};
    if (type === 'GEO_ROOM_UPDATE' && roomCode) {
      localGeoStore.set(roomCode, data);
      try {
        localStorage.setItem(`pulse_geo_${roomCode}`, JSON.stringify(data));
      } catch { /* quota */ }
      notifyGeoListeners(roomCode, data);
    }
  };
}

// Cross-tab fallback via storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('pulse_geo_')) {
      const roomCode = e.key.replace('pulse_geo_', '');
      try {
        const data = JSON.parse(e.newValue);
        localGeoStore.set(roomCode, data);
        notifyGeoListeners(roomCode, data);
      } catch { /* ignore */ }
    }
  });
}

// ─── Helper: broadcast local update ──────────────────────────
function broadcastLocalUpdate(roomCode, data) {
  localGeoStore.set(roomCode, data);
  try {
    localStorage.setItem(`pulse_geo_${roomCode}`, JSON.stringify(data));
  } catch { /* quota */ }
  if (geoChannel) {
    geoChannel.postMessage({ type: 'GEO_ROOM_UPDATE', roomCode, data });
  }
  notifyGeoListeners(roomCode, data);
}

// ─── Helper: get room path in Firebase ───────────────────────
// We store under rooms/geo_${roomCode} so it inherits existing
// Firebase Realtime Database rules (.read: true, .write: true on 'rooms')
// without needing manual security rules redeployment, while keeping namespace isolated.
function getFirebaseRoomPath(roomCode) {
  return `rooms/geo_${roomCode}`;
}

// Strip undefined values which Firebase RTDB rejects with fatal errors
function sanitizeForFirebase(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirebase(value);
    }
  }
  return clean;
}

// ─── Get Firebase DB ref ─────────────────────────────────────
function getDb() {
  const { db, isConfigured } = initFirebase();
  return isConfigured ? db : null;
}

// ─── Subscribe to GeoGuessr Room ─────────────────────────────
export function subscribeToGeoRoom(roomCode, callback) {
  const db = getDb();

  if (db) {
    const roomRef = ref(db, getFirebaseRoomPath(roomCode));
    const unsub = onValue(
      roomRef,
      (snap) => {
        const val = snap.val();
        if (val) {
          localGeoStore.set(roomCode, val);
          try {
            localStorage.setItem(`pulse_geo_${roomCode}`, JSON.stringify(val));
          } catch { /* quota */ }
        }
        callback(val);
      },
      (err) => {
        console.error('GeoGuessr Firebase listener error:', err);
        let initial = localGeoStore.get(roomCode);
        if (!initial) {
          try {
            const saved = localStorage.getItem(`pulse_geo_${roomCode}`);
            if (saved) initial = JSON.parse(saved);
          } catch { /* ignore */ }
        }
        callback(initial || null);
      }
    );
    return () => unsub();
  }

  // Local fallback
  if (!localGeoListeners.has(roomCode)) {
    localGeoListeners.set(roomCode, new Set());
  }
  localGeoListeners.get(roomCode).add(callback);

  let initial = localGeoStore.get(roomCode);
  if (!initial) {
    try {
      const saved = localStorage.getItem(`pulse_geo_${roomCode}`);
      if (saved) {
        initial = JSON.parse(saved);
        localGeoStore.set(roomCode, initial);
      }
    } catch { /* ignore */ }
  }
  if (initial) setTimeout(() => callback(initial), 0);

  return () => {
    const listeners = localGeoListeners.get(roomCode);
    if (listeners) listeners.delete(callback);
  };
}

// ─── Create GeoGuessr Room ───────────────────────────────────
export async function createGeoRoom(roomCode, locations, hostName = 'Host') {
  const roomData = {
    roomCode,
    status: GEO_STATES.LOBBY,
    currentLocationIndex: 0,
    locations,
    players: {},
    buzzerQueue: {},
    activePlayer: null,
    mirroredCoords: null,
    revealResult: null,
    timer: null,
    roundResults: [],
    createdAt: Date.now(),
    hostName,
  };

  const db = getDb();
  if (db) {
    try {
      await set(ref(db, getFirebaseRoomPath(roomCode)), sanitizeForFirebase(roomData));
      broadcastLocalUpdate(roomCode, roomData);
      return roomData;
    } catch (fbErr) {
      console.warn('Firebase set failed, falling back to local sync engine:', fbErr);
    }
  }

  broadcastLocalUpdate(roomCode, roomData);
  return roomData;
}

// ─── Update GeoGuessr State ──────────────────────────────────
export async function updateGeoState(roomCode, updates) {
  const db = getDb();
  if (db) {
    try {
      await update(ref(db, getFirebaseRoomPath(roomCode)), sanitizeForFirebase(updates));
      return;
    } catch (fbErr) {
      console.warn('Firebase update failed, falling back to local sync engine:', fbErr);
    }
  }

  // Local fallback
  let current = localGeoStore.get(roomCode);
  if (!current) {
    try {
      const saved = localStorage.getItem(`pulse_geo_${roomCode}`);
      if (saved) current = JSON.parse(saved);
    } catch { /* ignore */ }
  }

  const updated = { ...(current || {}), ...updates };
  broadcastLocalUpdate(roomCode, updated);
}

// ─── Join GeoGuessr Room (Player) ────────────────────────────
export async function joinGeoRoom(roomCode, player) {
  const playerData = {
    id: player.id,
    nickname: player.nickname,
    avatar: player.avatar || '🌍',
    score: 0,
    connected: true,
    joinedAt: Date.now(),
  };

  const db = getDb();
  if (db) {
    try {
      // Check if player was kicked by host
      const kickedSnap = await get(ref(db, `${getFirebaseRoomPath(roomCode)}/kicked/${player.id}`));
      if (kickedSnap.exists() && kickedSnap.val()) {
        throw new Error('You have been removed from this GeoGuessr session by the host.');
      }

      await set(ref(db, `${getFirebaseRoomPath(roomCode)}/players/${player.id}`), playerData);
      return;
    } catch (fbErr) {
      if (fbErr.message?.includes('removed from this GeoGuessr session')) throw fbErr;
      console.warn('Firebase join failed, falling back to local sync engine:', fbErr);
    }
  }

  // Local fallback
  let current = localGeoStore.get(roomCode);
  if (!current) {
    try {
      const saved = localStorage.getItem(`pulse_geo_${roomCode}`);
      if (saved) current = JSON.parse(saved);
    } catch { /* ignore */ }
  }
  if (!current) throw new Error('GeoGuessr room not found');

  if (current.kicked?.[player.id]) {
    throw new Error('You have been removed from this GeoGuessr session by the host.');
  }

  const updated = {
    ...current,
    players: {
      ...(current.players || {}),
      [player.id]: playerData,
    },
  };
  broadcastLocalUpdate(roomCode, updated);
}

// ─── Host Kicks / Removes a Player from GeoGuessr Room ────────
export async function kickGeoPlayer(roomCode, playerId) {
  const db = getDb();
  if (db) {
    try {
      // 1. Remove from players
      await remove(ref(db, `${getFirebaseRoomPath(roomCode)}/players/${playerId}`));
      // 2. Remove from buzzerQueue if present
      await remove(ref(db, `${getFirebaseRoomPath(roomCode)}/buzzerQueue/${playerId}`));
      // 3. Mark as kicked
      await set(ref(db, `${getFirebaseRoomPath(roomCode)}/kicked/${playerId}`), true);

      // 4. Check if active player was this player
      const activeSnap = await get(ref(db, `${getFirebaseRoomPath(roomCode)}/activePlayer`));
      if (activeSnap.exists() && activeSnap.val() === playerId) {
        await update(ref(db, getFirebaseRoomPath(roomCode)), {
          activePlayer: null,
          status: GEO_STATES.PANORAMA,
        });
      }
      return;
    } catch (err) {
      console.warn('Firebase kickGeoPlayer error, falling back to local sync:', err);
    }
  }

  // Local fallback
  let current = localGeoStore.get(roomCode);
  if (!current) {
    try {
      const saved = localStorage.getItem(`pulse_geo_${roomCode}`);
      if (saved) current = JSON.parse(saved);
    } catch { /* ignore */ }
  }
  if (!current) return;

  const updatedPlayers = { ...(current.players || {}) };
  delete updatedPlayers[playerId];

  const updatedBuzzerQueue = { ...(current.buzzerQueue || {}) };
  delete updatedBuzzerQueue[playerId];

  const updatedKicked = { ...(current.kicked || {}), [playerId]: true };

  const isCurrentActive = current.activePlayer === playerId;

  const updated = {
    ...current,
    players: updatedPlayers,
    buzzerQueue: updatedBuzzerQueue,
    kicked: updatedKicked,
    activePlayer: isCurrentActive ? null : current.activePlayer,
    status: isCurrentActive ? GEO_STATES.PANORAMA : current.status,
  };
  broadcastLocalUpdate(roomCode, updated);
}

// ─── Submit Buzz ─────────────────────────────────────────────
export async function submitBuzz(roomCode, playerId) {
  const buzzData = {
    timestamp: Date.now(), // For local; Firebase uses serverTimestamp
    rank: null, // Computed after collection
  };

  const db = getDb();
  if (db) {
    try {
      await set(ref(db, `${getFirebaseRoomPath(roomCode)}/buzzerQueue/${playerId}`), {
        timestamp: serverTimestamp(),
        rank: null,
      });
      return;
    } catch (fbErr) {
      console.warn('Firebase buzz failed, falling back to local sync engine:', fbErr);
    }
  }

  // Local fallback
  let current = localGeoStore.get(roomCode);
  if (!current) {
    try {
      const saved = localStorage.getItem(`pulse_geo_${roomCode}`);
      if (saved) current = JSON.parse(saved);
    } catch { /* ignore */ }
  }
  if (!current) return;

  const updated = {
    ...current,
    buzzerQueue: {
      ...(current.buzzerQueue || {}),
      [playerId]: buzzData,
    },
  };
  broadcastLocalUpdate(roomCode, updated);
}

// ─── Mirror Coordinates (Host clicks on map) ─────────────────
export async function mirrorCoords(roomCode, lat, lon) {
  await updateGeoState(roomCode, {
    mirroredCoords: { lat, lon },
  });
}

// ─── Confirm Guess ───────────────────────────────────────────
export async function confirmGuess(roomCode, revealResult) {
  await updateGeoState(roomCode, {
    status: GEO_STATES.REVEAL,
    revealResult,
  });
}

// ─── Pass Turn ───────────────────────────────────────────────
export async function passTurn(roomCode, nextPlayerId, extraUpdates = {}) {
  await updateGeoState(roomCode, {
    activePlayer: nextPlayerId || null,
    mirroredCoords: null,
    revealResult: null,
    timer: null,
    ...extraUpdates,
  });
}

// ─── Record Failed (0 PTS) Guess & Shift Turn ────────────────
export async function recordFailedGuess(roomCode, playerId, nextPlayerId = null, extraData = {}) {
  await updateGeoState(roomCode, {
    activePlayer: nextPlayerId || null,
    mirroredCoords: null,
    revealResult: null,
    timer: null,
    lastFailedGuess: {
      playerId,
      timestamp: Date.now(),
      ...extraData,
    },
  });
}

// ─── Update Player Score ─────────────────────────────────────
export async function updatePlayerScore(roomCode, playerId, newScore) {
  const db = getDb();
  if (db) {
    try {
      await update(ref(db, `${getFirebaseRoomPath(roomCode)}/players/${playerId}`), {
        score: newScore,
      });
      return;
    } catch (fbErr) {
      console.warn('Firebase score update failed, falling back to local sync engine:', fbErr);
    }
  }

  let current = localGeoStore.get(roomCode);
  if (!current) return;

  const updated = {
    ...current,
    players: {
      ...(current.players || {}),
      [playerId]: {
        ...(current.players?.[playerId] || {}),
        score: newScore,
      },
    },
  };
  broadcastLocalUpdate(roomCode, updated);
}

// ─── Get GeoGuessr Room Snapshot ─────────────────────────────
export async function getGeoRoom(roomCode) {
  const db = getDb();
  if (db) {
    try {
      const snap = await get(ref(db, getFirebaseRoomPath(roomCode)));
      const val = snap.val();
      if (val) return val;
    } catch (fbErr) {
      console.warn('Firebase get room failed, falling back to local store:', fbErr);
    }
  }

  let data = localGeoStore.get(roomCode);
  if (!data) {
    try {
      const saved = localStorage.getItem(`pulse_geo_${roomCode}`);
      if (saved) data = JSON.parse(saved);
    } catch { /* ignore */ }
  }
  return data || null;
}

// ─── Default Curated Geo Quizzes ─────────────────────────────
export const DEFAULT_GEO_QUIZZES = [
  {
    id: 'geoquiz_world_wonders',
    title: 'World Wonders & Famous Monuments',
    description: 'Travel from the Taj Mahal to the Eiffel Tower and Pyramids of Giza.',
    isPreset: true,
    locations: [
      {
        id: 'loc_taj_mahal',
        name: 'Taj Mahal, Agra, India',
        clue: 'An ivory-white marble mausoleum on the south bank of the Yamuna river.',
        lat: 27.1751,
        lon: 78.0421,
        toleranceKm: 150,
        panoramaUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg',
      },
      {
        id: 'loc_eiffel_tower',
        name: 'Eiffel Tower, Paris, France',
        clue: 'Wrought-iron lattice tower on the Champ de Mars beside the Seine river.',
        lat: 48.8584,
        lon: 2.2945,
        toleranceKm: 150,
        panoramaUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Eiffel_Tower_from_the_Champ-de-Mars%2C_Paris_7e_140807_1.jpg',
      },
      {
        id: 'loc_colosseum',
        name: 'Colosseum, Rome, Italy',
        clue: 'The largest ancient amphitheatre ever built, in the centre of Rome.',
        lat: 41.8902,
        lon: 12.4922,
        toleranceKm: 150,
        panoramaUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg',
      },
      {
        id: 'loc_machu_picchu',
        name: 'Machu Picchu Citadel, Andes, Peru',
        clue: 'A 15th-century Inca citadel situated on a mountain ridge 2,430m above sea level.',
        lat: -13.1631,
        lon: -72.5450,
        toleranceKm: 200,
        panoramaUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Machu_Picchu%2C_Peru.jpg',
      },
      {
        id: 'loc_pyramids_giza',
        name: 'Great Pyramids of Giza, Egypt',
        clue: 'The oldest of the Seven Wonders of the Ancient World, in the desert sand.',
        lat: 29.9792,
        lon: 31.1342,
        toleranceKm: 150,
        panoramaUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Kheops-Pyramid.jpg',
      },
    ],
  },
  {
    id: 'geoquiz_curated_observatories',
    title: 'Extreme Terrains & Science Observatories',
    description: 'High-altitude deserts, primeval canopies, and historic coastal pavilions.',
    isPreset: true,
    locations: [...GEO_LOCATIONS],
  },
];

// ─── Fetch Saved Geo Quizzes ─────────────────────────────────
export async function fetchSavedGeoQuizzes() {
  let localList = [];
  try {
    const raw = localStorage.getItem('pulse_saved_geo_quizzes');
    if (raw) localList = JSON.parse(raw);
  } catch { /* ignore */ }

  let firebaseList = [];
  const db = getDb();
  if (db) {
    try {
      const snap = await get(ref(db, 'rooms/geo_quizzes'));
      const val = snap.val();
      if (val) firebaseList = Object.values(val);
    } catch (err) {
      console.warn('Firebase fetchSavedGeoQuizzes error:', err);
    }
  }

  const map = new Map();
  [...localList, ...firebaseList].forEach(q => {
    if (q && q.id && !q.isPreset) map.set(q.id, q);
  });

  return Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

// ─── Save Geo Quiz ───────────────────────────────────────────
export async function saveGeoQuiz(quizData) {
  const quizId = quizData.id || `geoquiz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const quiz = {
    ...quizData,
    id: quizId,
    updatedAt: Date.now(),
    createdAt: quizData.createdAt || Date.now(),
  };

  try {
    const raw = localStorage.getItem('pulse_saved_geo_quizzes');
    let list = raw ? JSON.parse(raw) : [];
    list = list.filter(q => q.id !== quizId);
    list.unshift(quiz);
    localStorage.setItem('pulse_saved_geo_quizzes', JSON.stringify(list));
  } catch { /* ignore */ }

  const db = getDb();
  if (db) {
    try {
      await set(ref(db, `rooms/geo_quizzes/${quizId}`), sanitizeForFirebase(quiz));
    } catch (err) {
      console.warn('Firebase saveGeoQuiz error:', err);
    }
  }

  return quiz;
}

// ─── Delete Saved Geo Quiz ───────────────────────────────────
export async function deleteSavedGeoQuiz(quizId) {
  try {
    const raw = localStorage.getItem('pulse_saved_geo_quizzes');
    if (raw) {
      const list = JSON.parse(raw).filter(q => q.id !== quizId);
      localStorage.setItem('pulse_saved_geo_quizzes', JSON.stringify(list));
    }
  } catch { /* ignore */ }

  const db = getDb();
  if (db) {
    try {
      await set(ref(db, `rooms/geo_quizzes/${quizId}`), null);
    } catch (err) {
      console.warn('Firebase deleteSavedGeoQuiz error:', err);
    }
  }
}

// ─── Close & Clean up Geo Room ──────────────────────────────
export async function closeGeoRoom(roomCode) {
  if (!roomCode) return;

  const db = getDb();
  if (db) {
    try {
      await set(ref(db, getFirebaseRoomPath(roomCode)), null);
    } catch (err) {
      console.warn('Firebase closeGeoRoom error:', err);
    }
  }

  localGeoStore.delete(roomCode);
  try {
    localStorage.removeItem(`pulse_geo_${roomCode}`);
  } catch { /* ignore */ }

  if (geoChannel) {
    geoChannel.postMessage({ type: 'GEO_ROOM_CLOSED', roomCode });
  }
  notifyGeoListeners(roomCode, null);
}

// ─── Record Geo Game History ────────────────────────────────
export async function recordGeoGameHistory(sessionData) {
  const historyId = `geo_hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record = {
    ...sessionData,
    id: historyId,
    gameType: 'geoguessr',
    completedAt: Date.now(),
  };

  // 1. Mirror in localStorage (both generic and geo-specific)
  try {
    const rawAll = localStorage.getItem('pulse_quiz_history');
    const allList = rawAll ? JSON.parse(rawAll) : [];
    allList.unshift(record);
    localStorage.setItem('pulse_quiz_history', JSON.stringify(allList.slice(0, 50)));
  } catch { /* ignore */ }

  try {
    const rawGeo = localStorage.getItem('pulse_geo_history');
    const geoList = rawGeo ? JSON.parse(rawGeo) : [];
    geoList.unshift(record);
    localStorage.setItem('pulse_geo_history', JSON.stringify(geoList.slice(0, 50)));
  } catch { /* ignore */ }

  // 2. Firebase Realtime Database
  const db = getDb();
  if (db) {
    try {
      await set(ref(db, `history/${historyId}`), sanitizeForFirebase(record));
      await set(ref(db, `rooms/geo_history/${historyId}`), sanitizeForFirebase(record));
    } catch (err) {
      console.warn('Firebase recordGeoGameHistory error:', err);
    }
  }

  return record;
}

// ─── Fetch Geo Game History ─────────────────────────────────
export async function fetchGeoGameHistory() {
  let firebaseList = [];
  const db = getDb();
  if (db) {
    try {
      const snap = await get(ref(db, 'rooms/geo_history'));
      const val = snap.val();
      if (val) firebaseList = Object.values(val);
    } catch (err) {
      console.warn('Firebase fetchGeoGameHistory error:', err);
    }
  }

  let localList = [];
  try {
    const raw = localStorage.getItem('pulse_geo_history');
    if (raw) localList = JSON.parse(raw);
  } catch { /* ignore */ }

  // Also check pulse_quiz_history for any with gameType === 'geoguessr'
  try {
    const rawAll = localStorage.getItem('pulse_quiz_history');
    if (rawAll) {
      const allParsed = JSON.parse(rawAll);
      if (Array.isArray(allParsed)) {
        const geoOnly = allParsed.filter(h => h.gameType === 'geoguessr' || h.id?.startsWith('geo_hist_'));
        localList = [...localList, ...geoOnly];
      }
    }
  } catch { /* ignore */ }

  const map = new Map();
  [...localList, ...firebaseList].forEach(h => {
    if (h && h.id) map.set(h.id, h);
  });

  return Array.from(map.values()).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
}

// ─── Delete Geo Game History ────────────────────────────────
export async function deleteGeoGameHistory(historyId) {
  try {
    const rawGeo = localStorage.getItem('pulse_geo_history');
    if (rawGeo) {
      const list = JSON.parse(rawGeo).filter(h => h.id !== historyId);
      localStorage.setItem('pulse_geo_history', JSON.stringify(list));
    }
    const rawAll = localStorage.getItem('pulse_quiz_history');
    if (rawAll) {
      const listAll = JSON.parse(rawAll).filter(h => h.id !== historyId);
      localStorage.setItem('pulse_quiz_history', JSON.stringify(listAll));
    }
  } catch { /* ignore */ }

  const db = getDb();
  if (db) {
    try {
      await set(ref(db, `history/${historyId}`), null);
      await set(ref(db, `rooms/geo_history/${historyId}`), null);
    } catch (err) {
      console.warn('Firebase deleteGeoGameHistory error:', err);
    }
  }
}

// Re-export for convenience
export { generateRoomCode };


