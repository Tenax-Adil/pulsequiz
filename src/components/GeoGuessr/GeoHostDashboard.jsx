import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useGeoRoomSync } from '../../hooks/useGeoRoomSync.js';
import { GEO_STATES, haversineDistance, calculateGeoScore, formatDistance, formatPoints, getRankLabel, GEO_TIMERS } from '../../services/geoEngine.js';
import { createGeoRoom, generateRoomCode, saveGeoQuiz, closeGeoRoom, recordGeoGameHistory } from '../../services/geoFirebase.js';
import { GEO_LOCATIONS } from '../../data/geoLocations.js';
import { GeoLeafletMap } from './GeoLeafletMap.jsx';
import { GeoPanorama } from './GeoPanorama.jsx';
import { GeoTimer } from './GeoTimer.jsx';
import { soundFx } from '../../services/audio.js';
import {
  Globe, Play, SkipForward, Check, X, Users,
  RotateCcw, Map as MapIcon, Crosshair, Trophy,
  ArrowRight, Copy, ExternalLink, Eye, EyeOff, Plus,
  Footprints, RefreshCw, Save, BookOpen, LogOut, ArrowLeft,
  History, Sparkles, Edit3, ChevronUp, ChevronDown
} from 'lucide-react';
import { GeoAddLocationModal } from './GeoAddLocationModal.jsx';
import { GeoQuizLibraryModal } from './GeoQuizLibraryModal.jsx';
import { GeoHistoryModal } from './GeoHistoryModal.jsx';
import { GeoAIGeneratorModal } from './GeoAIGeneratorModal.jsx';

/**
 * GeoGuessr Host Control Dashboard
 * Route: /#/host/geoguessr?code=XXXX
 */
export function GeoHostDashboard({ roomCode: initialRoomCode }) {
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [setupMode, setSetupMode] = useState(!initialRoomCode);
  const [quizTitle, setQuizTitle] = useState('World Wonders Finale');
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [saveNotification, setSaveNotification] = useState('');
  const recordedGeoHistoryRef = useRef(new Set());

  const [selectedLocations, setSelectedLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('pulse_custom_geo_locations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...GEO_LOCATIONS, ...parsed];
        }
      }
    } catch { /* ignore */ }
    return [...GEO_LOCATIONS];
  });
  const [hostPanoMode, setHostPanoMode] = useState(true);
  const [hostPeek, setHostPeek] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setSetupMode(false);
    }
  }, [initialRoomCode]);

  const { geoRoom, updateGeoState, mirrorCoords, confirmGuess, passTurn, updatePlayerScore } = useGeoRoomSync(roomCode);

  const status = geoRoom?.status;
  const locIdx = geoRoom?.currentLocationIndex || 0;
  const currentLoc = geoRoom?.locations?.[locIdx];
  const playersRaw = geoRoom?.players;
  const buzzerQueueRaw = geoRoom?.buzzerQueue;
  const players = playersRaw || {};
  const activePlayerId = geoRoom?.activePlayer;
  const mirroredCoords = geoRoom?.mirroredCoords;
  const revealResult = geoRoom?.revealResult;
  const timer = geoRoom?.timer;

  // Sorted buzzer queue
  const sortedQueue = useMemo(() => {
    if (!buzzerQueueRaw) return [];
    return Object.entries(buzzerQueueRaw)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [buzzerQueueRaw]);

  // Sorted leaderboard
  const leaderboard = useMemo(() => {
    if (!playersRaw) return [];
    return Object.entries(playersRaw)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [playersRaw]);


  // ─── CUSTOM LOCATIONS MANAGEMENT ──────────────────────
  const handleAddCustomLocation = (newLoc) => {
    setSelectedLocations(prev => {
      const updated = [...prev, newLoc];
      try {
        const customs = updated.filter(l => l.isCustom);
        localStorage.setItem('pulse_custom_geo_locations', JSON.stringify(customs));
      } catch { /* ignore */ }
      return updated;
    });
  };

  const handleUpdateLocation = (updatedLoc) => {
    if (editingLocationIndex === null || editingLocationIndex < 0) return;
    setSelectedLocations(prev => {
      const updated = [...prev];
      updated[editingLocationIndex] = updatedLoc;
      try {
        const customs = updated.filter(l => l.isCustom);
        localStorage.setItem('pulse_custom_geo_locations', JSON.stringify(customs));
      } catch { /* ignore */ }
      return updated;
    });
    setEditingLocationIndex(null);
    setIsEditModalOpen(false);
  };

  const handleMoveLocation = (fromIdx, toIdx) => {
    setSelectedLocations(prev => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      try {
        const customs = next.filter(l => l.isCustom);
        localStorage.setItem('pulse_custom_geo_locations', JSON.stringify(customs));
      } catch { /* ignore */ }
      return next;
    });
  };

  const handleRemoveLocation = (indexToRemove) => {
    setSelectedLocations(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      try {
        const customs = updated.filter(l => l.isCustom);
        localStorage.setItem('pulse_custom_geo_locations', JSON.stringify(customs));
      } catch { /* ignore */ }
      return updated;
    });
  };

  const handleResetToDefaults = () => {
    setSelectedLocations([...GEO_LOCATIONS]);
    setQuizTitle('World Wonders Finale');
    setCurrentQuizId(null);
    try {
      localStorage.removeItem('pulse_custom_geo_locations');
    } catch { /* ignore */ }
  };

  // ─── GEO QUIZ SAVE / LOAD / EXIT HANDLERS ────────────────
  const handleSaveCurrentQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Please enter a title for this Geo Quiz.');
      return;
    }
    if (selectedLocations.length === 0) {
      alert('Please add at least one location before saving the quiz.');
      return;
    }
    try {
      const saved = await saveGeoQuiz({
        id: currentQuizId || undefined,
        title: quizTitle.trim(),
        locations: selectedLocations,
      });
      setCurrentQuizId(saved.id);
      setSaveNotification(`"${saved.title}" saved to library!`);
      setTimeout(() => setSaveNotification(''), 3500);
    } catch (err) {
      console.error('Failed to save quiz:', err);
      alert('Failed to save quiz. Please try again.');
    }
  };

  const handleSelectSavedQuiz = (quiz) => {
    setQuizTitle(quiz.title);
    setSelectedLocations(quiz.locations || []);
    setCurrentQuizId(quiz.isPreset ? null : quiz.id);
  };

  const handleNewBlankQuiz = () => {
    setQuizTitle('New Custom Geo Quiz');
    setSelectedLocations([]);
    setCurrentQuizId(null);
  };

  const handleAIGeneratedGeoQuiz = ({ title, locations }) => {
    setQuizTitle(title);
    setSelectedLocations(locations);
    setCurrentQuizId(null);
    try {
      localStorage.setItem('pulse_custom_geo_locations', JSON.stringify(locations));
    } catch { /* ignore */ }
    setSaveNotification(`✨ AI generated "${title}" with ${locations.length} locations!`);
    soundFx.playSelect();
  };

  // ─── AUTO-RECORD MATCH HISTORY ────────────────────────────
  const persistMatchHistory = useCallback(async () => {
    if (!roomCode || recordedGeoHistoryRef.current.has(roomCode)) return;
    recordedGeoHistoryRef.current.add(roomCode);

    const locationsList = (geoRoom?.locations || selectedLocations || []);
    const locationNames = locationsList.map(l =>
      typeof l === 'string' ? l : (l.name ? `${l.name}${l.country ? `, ${l.country}` : ''}` : 'Location')
    );

    const formattedLeaderboard = leaderboard.map((p, idx) => ({
      id: p.id || `player_${idx}`,
      nickname: p.nickname || `Player ${idx + 1}`,
      avatar: p.avatar || '🌍',
      score: Number(p.score) || 0,
      rank: idx + 1,
    }));

    const sessionData = {
      roomCode,
      quizTitle: quizTitle || 'GeoGuessr Finale',
      title: quizTitle || 'GeoGuessr Finale',
      totalPlayers: formattedLeaderboard.length,
      totalLocations: locationsList.length,
      totalQuestions: locationsList.length,
      leaderboard: formattedLeaderboard,
      players: formattedLeaderboard,
      locations: locationNames,
      winner: formattedLeaderboard[0] || null,
      top1: formattedLeaderboard[0] || null,
      gameType: 'geoguessr',
    };

    try {
      await recordGeoGameHistory(sessionData);
    } catch (err) {
      console.warn('Failed to record Geo match history:', err);
    }
  }, [roomCode, geoRoom?.locations, selectedLocations, leaderboard, quizTitle]);

  // Automatically record history once game reaches FINISHED state
  useEffect(() => {
    if (status === GEO_STATES.FINISHED && roomCode) {
      persistMatchHistory();
    }
  }, [status, roomCode, persistMatchHistory]);

  const handleExitRoom = async () => {
    if (status && status !== GEO_STATES.FINISHED && status !== GEO_STATES.LOBBY) {
      if (!confirm('A game is currently in progress. Exit and close room?')) {
        return;
      }
      if (roomCode && leaderboard.length > 0) {
        await persistMatchHistory();
      }
    }
    if (roomCode) {
      await closeGeoRoom(roomCode);
    }
    window.location.hash = '#/host';
  };

  const handlePlayAgain = async () => {
    soundFx.playSelect();
    setHostPeek(false);
    if (roomCode) {
      recordedGeoHistoryRef.current.delete(roomCode);
    }
    if (playersRaw) {
      for (const pid of Object.keys(playersRaw)) {
        await updatePlayerScore(pid, 0);
      }
    }
    await updateGeoState({
      status: GEO_STATES.PANORAMA,
      currentLocationIndex: 0,
      buzzerQueue: {},
      activePlayer: null,
      mirroredCoords: null,
      revealResult: null,
      timer: null,
    });
  };

  const handleNewGameSetup = () => {
    setRoomCode('');
    setSetupMode(true);
    window.location.hash = '#/host/geoguessr';
  };

  // ─── SETUP MODE: Create Room ──────────────────────────────
  const handleCreateRoom = async () => {
    const code = generateRoomCode();
    try {
      await createGeoRoom(code, selectedLocations, 'Host');
      setRoomCode(code);
      setSetupMode(false);
      // Update URL hash
      window.location.hash = `#/host/geoguessr?code=${code}`;
    } catch (err) {
      console.error('Failed to create GeoGuessr room:', err);
      alert('Failed to create room. Please try again.');
    }
  };

  // ─── HOST ACTIONS ─────────────────────────────────────────
  const handleStartRound = async () => {
    soundFx.playSelect();
    setHostPeek(false);
    await updateGeoState({
      status: GEO_STATES.PANORAMA,
      buzzerQueue: {},
      activePlayer: null,
      mirroredCoords: null,
      revealResult: null,
      timer: null,
    });
  };

  const handleShowMap = async () => {
    // Transition from panorama to map (manual, without buzzer)
    soundFx.playSelect();
    await updateGeoState({
      status: GEO_STATES.HOST_MIRROR,
      timer: { startedAt: Date.now(), durationSec: GEO_TIMERS.TAG_TIME_FIRST },
    });
  };

  const handleForceSkip = async () => {
    // Skip current location entirely
    soundFx.playTimeUp();
    setHostPeek(false);
    const nextIdx = locIdx + 1;
    if (nextIdx >= (geoRoom?.locations?.length || 0)) {
      await updateGeoState({ status: GEO_STATES.FINISHED });
    } else {
      await updateGeoState({
        status: GEO_STATES.ROUND_WRAP,
        currentLocationIndex: locIdx,
      });
    }
  };

  // When a buzzer comes in, lock buzzers and switch to map
  useEffect(() => {
    if (status === GEO_STATES.PANORAMA && sortedQueue.length > 0) {
      const firstBuzzer = sortedQueue[0];
      soundFx.playSelect();

      updateGeoState({
        status: GEO_STATES.BUZZER_LOCKED,
        activePlayer: firstBuzzer.id,
        timer: { startedAt: Date.now(), durationSec: GEO_TIMERS.TAG_TIME_FIRST },
      }).then(() => {
        // Transition to host mirror after brief lockout display
        setTimeout(() => {
          updateGeoState({ status: GEO_STATES.HOST_MIRROR });
        }, 1500);
      });
    }
  }, [sortedQueue.length, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = useCallback((lat, lon) => {
    if (status !== GEO_STATES.HOST_MIRROR) return;
    mirrorCoords(lat, lon);
  }, [status, mirrorCoords]);

  const handleConfirmGuess = async () => {
    if (!mirroredCoords || !currentLoc) return;

    const distanceKm = haversineDistance(
      mirroredCoords.lat, mirroredCoords.lon,
      currentLoc.lat, currentLoc.lon
    );

    const activeIdx = sortedQueue.findIndex(b => b.id === activePlayerId);
    const buzzerRank = activeIdx >= 0 ? activeIdx : 0;
    const points = calculateGeoScore(distanceKm, buzzerRank);
    const isCorrect = distanceKm <= (currentLoc.toleranceKm || 200);

    // Update player score
    if (activePlayerId && points > 0) {
      const currentScore = players[activePlayerId]?.score || 0;
      await updatePlayerScore(activePlayerId, currentScore + points);
    }

    soundFx.playCorrect();

    await confirmGuess({
      distanceKm,
      points,
      isCorrect,
      playerId: activePlayerId,
      locationId: currentLoc.id,
    });
  };

  const handlePassTurn = async () => {
    const activeIdx = sortedQueue.findIndex(b => b.id === activePlayerId);
    const nextIdx = activeIdx + 1;

    soundFx.playWrong();

    if (nextIdx < sortedQueue.length) {
      // Pass to next in queue
      const nextPlayer = sortedQueue[nextIdx];
      await passTurn(nextPlayer.id, GEO_TIMERS.TAG_TIME_PASS);
    } else {
      // No more buzzers — skip to round wrap
      handleForceSkip();
    }
  };

  const handleNextLocation = async () => {
    setHostPeek(false);
    const nextIdx = locIdx + 1;
    if (nextIdx >= (geoRoom?.locations?.length || 0)) {
      await updateGeoState({ status: GEO_STATES.FINISHED });
    } else {
      await updateGeoState({
        status: GEO_STATES.PANORAMA,
        currentLocationIndex: nextIdx,
        buzzerQueue: {},
        activePlayer: null,
        mirroredCoords: null,
        revealResult: null,
        timer: null,
      });
    }
  };

  const handleResetRound = async () => {
    setHostPeek(false);
    await updateGeoState({
      status: GEO_STATES.PANORAMA,
      buzzerQueue: {},
      activePlayer: null,
      mirroredCoords: null,
      revealResult: null,
      timer: null,
    });
  };

  const handleFinishGame = async () => {
    await updateGeoState({ status: GEO_STATES.FINISHED });
  };

  const copyRoomCode = () => {
    navigator.clipboard?.writeText(roomCode);
  };

  // ─── SETUP MODE ────────────────────────────────────────────
  if (setupMode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80">
            <button
              type="button"
              onClick={handleExitRoom}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Host Dashboard</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAIGeneratorOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
                title="Generate custom Geo Quiz using Gemini AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Generator</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 text-xs font-semibold transition cursor-pointer"
                title="View previous GeoGuessr match history and scorecards"
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Geo History</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-semibold transition cursor-pointer"
                title="Browse curated presets and your saved Geo Quizzes"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Geo Quiz Library</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentQuiz}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
                title="Save current quiz and locations to library"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Quiz</span>
              </button>
              <button
                type="button"
                onClick={handleNewBlankQuiz}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition cursor-pointer"
                title="Start a fresh blank Geo Quiz"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Blank</span>
              </button>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {saveNotification && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{saveNotification}</span>
              </div>
              <button onClick={() => setSaveNotification('')} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Header & Quiz Details Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 mb-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">GeoGuessr Finale Studio</h1>
                  <p className="text-xs text-zinc-400">Configure quiz title, 360° panoramas, and launch round</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAIGeneratorOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-lg shadow-amber-500/10 cursor-pointer"
                  title="Generate complete Geo Quiz with Gemini AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Generate</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold hover:bg-zinc-800 transition cursor-pointer"
                  title="Reset to 5 default curated locations"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Presets</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Place</span>
                </button>
              </div>
            </div>

            {/* Quiz Title Input Field */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider min-w-[80px]">
                Quiz Title:
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g. World Wonders Finale, Europe Capitals, Secret Geo..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-sm font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={handleSaveCurrentQuiz}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Title</span>
              </button>
            </div>
          </div>

          {/* Location list */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Locations In Game ({selectedLocations.length})
              </h3>
              <span className="text-xs text-zinc-500">
                Contestants will guess these in order
              </span>
            </div>

            {selectedLocations.map((loc, i) => (
              <div
                key={loc.id || i}
                className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border transition ${
                  loc.isCustom
                    ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Reorder and Index */}
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveLocation(i, i - 1)}
                    disabled={i === 0}
                    className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition cursor-pointer disabled:cursor-not-allowed"
                    title="Move Question Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    loc.isCustom ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMoveLocation(i, i + 1)}
                    disabled={i === selectedLocations.length - 1}
                    className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition cursor-pointer disabled:cursor-not-allowed"
                    title="Move Question Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-200 truncate">{loc.name}</p>
                    {loc.isCustom ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        Custom
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-semibold">
                        Preset
                      </span>
                    )}
                    {loc.googleStreetView && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Street View 360
                      </span>
                    )}
                    {loc.viewpoints && loc.viewpoints.length > 1 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 flex items-center gap-1">
                        <Footprints className="w-2.5 h-2.5" />
                        {loc.viewpoints.length} Viewpoints
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                    <span className="text-zinc-500 font-medium">Clue:</span> {loc.clue || <span className="italic text-zinc-600">No clue provided</span>}
                  </p>
                </div>

                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs text-zinc-400 font-mono">
                    {loc.lat?.toFixed(3)}°, {loc.lon?.toFixed(3)}°
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    ±{loc.toleranceKm || 200} km
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLocationIndex(i);
                      setIsEditModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-300 border border-zinc-700/60 hover:border-amber-500/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    title="Edit question & location details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(i)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                    title="Remove question"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Quick Add Card when empty or host wants to add */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900/30 text-zinc-400 hover:text-amber-300 transition flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Custom Location</span>
            </button>
          </div>

          {/* Launch button */}
          <button
            onClick={handleCreateRoom}
            disabled={selectedLocations.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5" />
            Create GeoGuessr Room ({selectedLocations.length} Locations)
          </button>
        </div>

        {/* Geo Quiz Library Modal */}
        <GeoQuizLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelectQuiz={handleSelectSavedQuiz}
          onNewBlankQuiz={handleNewBlankQuiz}
        />

        {/* Add Location Modal */}
        <GeoAddLocationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddLocation={handleAddCustomLocation}
        />

        {/* Edit Location Modal */}
        <GeoAddLocationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingLocationIndex(null);
          }}
          editLocation={editingLocationIndex !== null ? selectedLocations[editingLocationIndex] : null}
          onUpdateLocation={handleUpdateLocation}
        />

        {/* Geo History Modal */}
        <GeoHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />

        {/* Geo AI Generator Modal */}
        <GeoAIGeneratorModal
          isOpen={isAIGeneratorOpen}
          onClose={() => setIsAIGeneratorOpen(false)}
          onGenerated={handleAIGeneratedGeoQuiz}
        />
      </div>
    );
  }

  // ─── MAIN DASHBOARD ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-3 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-zinc-200 truncate max-w-[160px] sm:max-w-xs">{quizTitle || 'GeoGuessr Host'}</span>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-mono hover:bg-zinc-700 transition cursor-pointer"
            title="Copy room code"
          >
            <span>PIN: {roomCode}</span>
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Quick launch links for Stage and Player Buzzer */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <button
              onClick={() => window.open(`#/stage/geoguessr?code=${roomCode}`, '_blank')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition cursor-pointer"
              title="Open full-screen Stage Display for Projector in new tab"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
              <span>Stage View</span>
            </button>
            <button
              onClick={() => window.open(`#/player/buzzer?code=${roomCode}`, '_blank')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition cursor-pointer"
              title="Open Mobile Player Buzzer in new tab"
            >
              <ExternalLink className="w-3 h-3 text-emerald-400" />
              <span>Player Buzzer</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            status === GEO_STATES.LOBBY ? 'bg-zinc-800 text-zinc-400' :
            status === GEO_STATES.PANORAMA ? 'bg-emerald-500/20 text-emerald-400' :
            status === GEO_STATES.REVEAL ? 'bg-amber-500/20 text-amber-400' :
            status === GEO_STATES.FINISHED ? 'bg-amber-500/20 text-amber-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {status?.replace('GEO_', '') || 'UNKNOWN'}
          </span>
          <span className="text-xs text-zinc-500">
            <Users className="w-3.5 h-3.5 inline mr-1" />
            {Object.keys(players).length}
          </span>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition cursor-pointer"
            title="View Geo match history"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Geo History</span>
          </button>
          <button
            type="button"
            onClick={handleExitRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 text-xs font-semibold transition cursor-pointer ml-1"
            title="Close game room and return to Host Dashboard"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Close Room</span>
          </button>
        </div>
      </header>


      <div className="flex-1 flex">
        {/* ─── LEFT PANEL: Queue & Controls ─────────────────── */}
        <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/50">
          {/* Location progress */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Current Location
              </div>
              <button
                type="button"
                onClick={() => setHostPeek(prev => !prev)}
                title={hostPeek ? "Conceal Answer" : "Host Peek (Secret Eye)"}
                className="text-xs text-zinc-400 hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
              >
                {hostPeek ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-zinc-500" />}
                <span className="text-[10px]">{hostPeek ? 'Conceal' : 'Peek'}</span>
              </button>
            </div>
            <div className="text-sm font-bold text-zinc-200">
              {status === GEO_STATES.REVEAL || hostPeek ? (
                currentLoc?.name || 'N/A'
              ) : (
                <span className="font-mono text-zinc-500 tracking-wider text-xs">
                  ••••••••••••••••• <span className="text-[10px] text-zinc-600 font-sans">(Hidden for contest)</span>
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {locIdx + 1} of {geoRoom?.locations?.length || 0}
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${((locIdx + 1) / (geoRoom?.locations?.length || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Buzzer Queue */}
          <div className="p-4 border-b border-zinc-800 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Buzzer Queue ({sortedQueue.length})
            </div>
            {sortedQueue.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No buzzes yet</p>
            ) : (
              <div className="space-y-2">
                {sortedQueue.map((b, i) => {
                  const p = players[b.id];
                  const isActive = b.id === activePlayerId;
                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-2 p-2 rounded-lg transition ${
                        isActive
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'bg-zinc-900/50 border border-transparent'
                      }`}
                    >
                      <span className={`text-xs font-bold w-8 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`}>
                        {getRankLabel(i)}
                      </span>
                      <span className="text-sm">{p?.avatar || '🌍'}</span>
                      <span className={`text-sm font-medium flex-1 ${isActive ? 'text-amber-300' : 'text-zinc-300'}`}>
                        {p?.nickname || b.id}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="p-4 border-b border-zinc-800 max-h-48 overflow-y-auto">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              <Trophy className="w-3 h-3 inline mr-1" /> Leaderboard
            </div>
            {leaderboard.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 py-1">
                <span className="text-xs font-bold w-5 text-zinc-500">{i + 1}</span>
                <span className="text-xs">{p.avatar}</span>
                <span className="text-xs text-zinc-300 flex-1 truncate">{p.nickname}</span>
                <span className="text-xs font-bold text-amber-400 tabular-nums">{(p.score || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="p-4 space-y-2">
            {status === GEO_STATES.LOBBY && (
              <button
                onClick={handleStartRound}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4" /> Start Round
              </button>
            )}

            {status === GEO_STATES.PANORAMA && (
              <>
                <button
                  onClick={handleShowMap}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MapIcon className="w-4 h-4" /> Show Map (Manual)
                </button>
                <button
                  onClick={handleForceSkip}
                  className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Skip Location
                </button>
              </>
            )}

            {status === GEO_STATES.HOST_MIRROR && (
              <>
                <button
                  onClick={handleConfirmGuess}
                  disabled={!mirroredCoords}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Confirm & Reveal
                </button>
                <button
                  onClick={handlePassTurn}
                  className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-red-500/20"
                >
                  <X className="w-3.5 h-3.5" /> Pass Turn
                </button>
                <button
                  onClick={handleResetRound}
                  className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Round
                </button>
              </>
            )}

            {status === GEO_STATES.REVEAL && (
              <button
                onClick={handleNextLocation}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" /> Next Location
              </button>
            )}

            {status === GEO_STATES.ROUND_WRAP && (
              <button
                onClick={handleNextLocation}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" /> Next Location
              </button>
            )}

            {status === GEO_STATES.FINISHED && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="text-center text-xs font-bold text-amber-400 py-1 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Game Completed</span>
                </div>
                <button
                  onClick={handlePlayAgain}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again (Reset Scores)</span>
                </button>
                <button
                  onClick={handleNewGameSetup}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-700"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Setup New Game</span>
                </button>
                <button
                  onClick={handleSaveCurrentQuiz}
                  className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-800"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save This Geo Quiz</span>
                </button>
                <button
                  onClick={handleExitRoom}
                  className="w-full py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Close & Exit to Dashboard</span>
                </button>
              </div>
            )}

            {status !== GEO_STATES.LOBBY && status !== GEO_STATES.FINISHED && (
              <button
                onClick={handleFinishGame}
                className="w-full py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs flex items-center justify-center gap-2 transition cursor-pointer mt-2"
              >
                End Game
              </button>
            )}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Mirror Map or Panorama Preview ─────────────────────── */}
        <div className="flex-1 relative">
          {status === GEO_STATES.LOBBY ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Globe className="w-20 h-20 text-zinc-800 mb-6" />
              <h3 className="text-xl font-bold text-zinc-400 mb-2">Waiting in Lobby</h3>
              <p className="text-sm text-zinc-600 mb-6 max-w-md">
                Launch the stage display for the projector and mobile buzzers for participants.
              </p>
              <div className="px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6">
                <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Room PIN</div>
                <div className="text-4xl font-black text-white tracking-wider font-mono">{roomCode}</div>
              </div>

              {/* Quick Launch Buttons for Testing & Multi-Window */}
              <div className="flex flex-wrap items-center justify-center gap-3 max-w-md">
                <button
                  onClick={() => window.open(`#/stage/geoguessr?code=${roomCode}`, '_blank')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Stage View (Projector)</span>
                </button>
                <button
                  onClick={() => window.open(`#/player/buzzer?code=${roomCode}`, '_blank')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm border border-zinc-700 transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Open Player Buzzer</span>
                </button>
              </div>
            </div>
          ) : status === GEO_STATES.FINISHED ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-950/80 overflow-y-auto">
              <div className="max-w-2xl w-full mx-auto animate-fade-in-up">
                {/* Save Notification if saved from completed screen */}
                {saveNotification && (
                  <div className="mb-6 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{saveNotification}</span>
                  </div>
                )}

                {/* Trophy & Header */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/10">
                  <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
                  GeoGuessr Finale Complete!
                </h2>
                <p className="text-sm text-zinc-400 mb-8">
                  {geoRoom?.locations?.length || 0} locations completed &bull; {leaderboard.length} contestants
                </p>

                {/* Podium Display (Top 3) */}
                {leaderboard.length > 0 && (
                  <div className="flex items-end justify-center gap-3 sm:gap-4 mb-8 max-w-lg mx-auto">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                      <div className="flex-1 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <div className="text-3xl mb-1">{leaderboard[1].avatar || '🌍'}</div>
                        <div className="text-xs font-bold text-zinc-200 truncate max-w-[100px] mb-1">
                          {leaderboard[1].nickname}
                        </div>
                        <div className="text-xs font-mono font-bold text-zinc-400 mb-2">
                          {(leaderboard[1].score || 0).toLocaleString()} pts
                        </div>
                        <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-zinc-800/80 border-t-2 border-zinc-400 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-2xl">🥈</span>
                          <span className="text-[11px] font-bold text-zinc-400 uppercase">2nd</span>
                        </div>
                      </div>
                    )}

                    {/* 1st Place (Winner) */}
                    {leaderboard[0] && (
                      <div className="flex-1 flex flex-col items-center animate-fade-in-up">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 mb-1">
                          WINNER 👑
                        </span>
                        <div className="text-4xl mb-1">{leaderboard[0].avatar || '🌍'}</div>
                        <div className="text-sm font-black text-amber-300 truncate max-w-[120px] mb-1">
                          {leaderboard[0].nickname}
                        </div>
                        <div className="text-sm font-mono font-black text-amber-400 mb-2">
                          {(leaderboard[0].score || 0).toLocaleString()} pts
                        </div>
                        <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-500/20 to-amber-500/40 border-t-4 border-amber-400 flex flex-col items-center justify-center shadow-xl shadow-amber-500/20">
                          <span className="text-3xl">🥇</span>
                          <span className="text-xs font-black text-amber-300 uppercase tracking-wider">1st</span>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                      <div className="flex-1 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <div className="text-3xl mb-1">{leaderboard[2].avatar || '🌍'}</div>
                        <div className="text-xs font-bold text-zinc-200 truncate max-w-[100px] mb-1">
                          {leaderboard[2].nickname}
                        </div>
                        <div className="text-xs font-mono font-bold text-zinc-400 mb-2">
                          {(leaderboard[2].score || 0).toLocaleString()} pts
                        </div>
                        <div className="w-full h-18 sm:h-20 rounded-t-2xl bg-zinc-900/90 border-t-2 border-orange-500/50 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-2xl">🥉</span>
                          <span className="text-[11px] font-bold text-orange-400 uppercase">3rd</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Full Standings List (if > 3) */}
                {leaderboard.length > 3 && (
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 mb-8 max-h-48 overflow-y-auto text-left">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Remaining Standings
                    </div>
                    <div className="space-y-1.5">
                      {leaderboard.slice(3).map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-500 w-5">{i + 4}.</span>
                            <span>{p.avatar}</span>
                            <span className="font-semibold text-zinc-200">{p.nickname}</span>
                          </div>
                          <span className="font-mono text-amber-400 font-bold">{(p.score || 0).toLocaleString()} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-saved to history indicator */}
                <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Match automatically saved to history</span>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-sm shadow-lg shadow-amber-500/10 transition cursor-pointer"
                  >
                    <History className="w-4 h-4 text-amber-400" />
                    <span>View Match History</span>
                  </button>
                  <button
                    onClick={handleExitRoom}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 font-bold text-sm shadow-lg transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Close & Exit to Dashboard</span>
                  </button>
                  <button
                    onClick={handlePlayAgain}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </button>
                  <button
                    onClick={handleNewGameSetup}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-sm border border-zinc-700 transition cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-zinc-400" />
                    <span>Setup New Game</span>
                  </button>
                  <button
                    onClick={handleSaveCurrentQuiz}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-sm border border-zinc-800 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>Save This Quiz</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Host View Mode Toolbar + Secret Peek Button */}
              <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
                {/* Host Secret Peek Button */}
                <button
                  type="button"
                  onClick={() => setHostPeek(prev => !prev)}
                  title={hostPeek ? "Conceal Answer" : "Host Peek: Secretly show answer on host screen only"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md shadow-lg transition cursor-pointer border ${
                    hostPeek
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {hostPeek ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{hostPeek ? 'Conceal Answer' : 'Peek Secret Pin'}</span>
                </button>

                {status === GEO_STATES.PANORAMA && (
                  <div className="flex items-center bg-zinc-900/90 border border-zinc-700 rounded-xl p-1 backdrop-blur-md shadow-lg">
                    <button
                      onClick={() => setHostPanoMode(true)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        hostPanoMode
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>360° Panorama</span>
                    </button>
                    <button
                      onClick={() => setHostPanoMode(false)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        !hostPanoMode
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Map View</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Render Panorama or Leaflet Map */}
              {status === GEO_STATES.PANORAMA && hostPanoMode ? (
                <div className="w-full h-full relative">
                  <GeoPanorama
                    panoramaUrl={currentLoc?.panoramaUrl}
                    viewpoints={currentLoc?.viewpoints}
                    location={currentLoc}
                    autoRotate={false}
                    showControls={true}
                  />
                  <div className="absolute bottom-4 left-4 z-[1000] px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-zinc-800 text-xs text-zinc-300 pointer-events-none">
                    <span className="font-semibold text-amber-400">
                      {status === GEO_STATES.REVEAL || hostPeek ? currentLoc?.name : `Location #${locIdx + 1}`}
                    </span> &bull; 360° Street View Live
                  </div>
                </div>
              ) : (
                <GeoLeafletMap
                  correctCoords={currentLoc ? { lat: currentLoc.lat, lon: currentLoc.lon } : null}
                  showCorrectPin={status === GEO_STATES.REVEAL || hostPeek}
                  mirroredCoords={mirroredCoords}
                  onMapClick={status === GEO_STATES.HOST_MIRROR ? handleMapClick : null}
                  revealLine={status === GEO_STATES.REVEAL}
                  interactive={true}
                />
              )}


              {/* Timer overlay on map */}
              {timer && status === GEO_STATES.HOST_MIRROR && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-72 z-[1000]">
                  <GeoTimer
                    durationSec={timer.durationSec}
                    startedAt={timer.startedAt}
                    label="Tag Time"
                  />
                </div>
              )}

              {/* Mirror instruction */}
              {status === GEO_STATES.HOST_MIRROR && !mirroredCoords && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] animate-fade-in-up">
                  <div className="px-6 py-3 rounded-xl bg-zinc-900/90 border border-amber-500/30 backdrop-blur-md flex items-center gap-3">
                    <Crosshair className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="text-sm font-semibold text-zinc-200">Click the map to mirror the player's tag placement</span>
                  </div>
                </div>
              )}

              {/* Reveal result overlay */}
              {status === GEO_STATES.REVEAL && revealResult && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] animate-fade-in-up">
                  <div className={`px-6 py-4 rounded-xl backdrop-blur-md border ${
                    revealResult.isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : 'bg-red-500/15 border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-zinc-400 mb-0.5">Distance</div>
                        <div className="text-lg font-bold text-white">{formatDistance(revealResult.distanceKm)}</div>
                      </div>
                      <div className="w-px h-10 bg-zinc-700" />
                      <div>
                        <div className="text-xs text-zinc-400 mb-0.5">Points</div>
                        <div className="text-lg font-bold text-amber-400">{formatPoints(revealResult.points)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Geo Quiz Library Modal */}
      <GeoQuizLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectQuiz={handleSelectSavedQuiz}
        onNewBlankQuiz={handleNewBlankQuiz}
      />

      {/* Geo History Modal */}
      <GeoHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}

export default GeoHostDashboard;
