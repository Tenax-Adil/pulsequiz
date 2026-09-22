import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Common/Navbar.jsx';
import { HostDashboard } from './components/Host/HostDashboard.jsx';
import { QuizEditor } from './components/Host/QuizEditor.jsx';
import { HostLobby } from './components/Host/HostLobby.jsx';
import { HostControl } from './components/Host/HostControl.jsx';
import { HostLeaderboard } from './components/Host/HostLeaderboard.jsx';
import { JoinForm } from './components/Student/JoinForm.jsx';
import { StudentLobby } from './components/Student/StudentLobby.jsx';
import { StudentGameView } from './components/Student/StudentGameView.jsx';
import { StudentScoreView } from './components/Student/StudentScoreView.jsx';
import { StudentPodium } from './components/Student/StudentPodium.jsx';
import {
  createRoom,
  updateRoom,
  joinRoom,
  submitAnswer,
  generateRoomCode,
  saveQuizToLibrary,
  recordGameHistory,
  kickPlayer,
} from './services/firebase.js';
import { useRoomSync } from './hooks/useRoomSync.js';
import { botSimulator } from './services/mockBots.js';

import { Lock, UserX } from 'lucide-react';
import { AIGeneratorModal } from './components/Host/AIGeneratorModal.jsx';
import { HostAuthModal } from './components/Host/HostAuthModal.jsx';

// ─── GeoGuessr Imports ──────────────────────────────────────
import { GeoStageView } from './components/GeoGuessr/GeoStageView.jsx';
import { GeoHostDashboard } from './components/GeoGuessr/GeoHostDashboard.jsx';
import { GeoBuzzerView } from './components/GeoGuessr/GeoBuzzerView.jsx';
import { getGeoRoom, joinGeoRoom } from './services/geoFirebase.js';


// ─── Hash-based route parser for GeoGuessr views ────────────
function parseGeoHash(hash) {
  if (!hash || !hash.startsWith('#/')) return null;
  const [path, query] = hash.substring(2).split('?');
  const params = new URLSearchParams(query || '');
  let code = params.get('code') || '';
  if (path === 'stage/geoguessr') return { view: 'geo-stage', code };
  if (path === 'host/geoguessr') {
    // If no code in query params, check saved Geo host session
    if (!code) {
      try {
        const saved = sessionStorage.getItem('pulse_geo_host_session') || localStorage.getItem('pulse_geo_host_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.roomCode && (Date.now() - (parsed.timestamp || 0) < 12 * 60 * 60 * 1000)) {
            code = parsed.roomCode;
          }
        }
      } catch { /* ignore */ }
    }
    return { view: 'geo-host', code };
  }
  if (path === 'player/buzzer') return { view: 'geo-buzzer', code };
  return null;
}

// ─── Host Session Persistence Helpers ───────────────────────
function getSavedHostSession() {
  try {
    const raw = sessionStorage.getItem('pulse_host_session') || localStorage.getItem('pulse_host_session');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.roomCode) return null;
    // Session is valid for up to 12 hours
    if (Date.now() - (data.timestamp || 0) > 12 * 60 * 60 * 1000) {
      sessionStorage.removeItem('pulse_host_session');
      localStorage.removeItem('pulse_host_session');
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function getHostCodeFromUrl() {
  try {
    // 1. Check window.location.search (?hostCode=... or ?host=true&code=...)
    const searchParams = new URLSearchParams(window.location.search);
    const codeParam = searchParams.get('hostCode') || (searchParams.get('host') === 'true' && searchParams.get('code'));
    if (codeParam) return codeParam.trim();

    // 2. Check window.location.hash (#/host?code=... or #host?code=...)
    const hash = window.location.hash;
    if (hash && (hash.startsWith('#/host') || hash.startsWith('#host')) && !hash.startsWith('#/host/geoguessr')) {
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hash.substring(qIndex + 1));
        const c = hashParams.get('code');
        if (c) return c.trim();
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function App() {
  // ─── GeoGuessr Hash Route Detection ──────────────────────
  const [geoRoute, setGeoRoute] = useState(() => parseGeoHash(window.location.hash));

  // Check saved host session
  const initialHostSession = getSavedHostSession();
  const initialHostCode = getHostCodeFromUrl() || initialHostSession?.roomCode || null;
  const hasActiveHostSession = Boolean(initialHostCode);

  // Navigation: 'host' | 'student'
  const [navRole, setNavRole] = useState(() => (hasActiveHostSession ? 'host' : 'student'));

  // Host security & authentication
  const [isHostAuthenticated, setIsHostAuthenticated] = useState(() => {
    try {
      if (hasActiveHostSession) {
        sessionStorage.setItem('pulse_host_auth', 'true');
        return true;
      }
      return sessionStorage.getItem('pulse_host_auth') === 'true';
    } catch {
      return hasActiveHostSession;
    }
  });
  const [showHostAuthModal, setShowHostAuthModal] = useState(false);

  // Host sub-state: 'dashboard' | 'editor' | 'live'
  const [hostMode, setHostMode] = useState(() => (hasActiveHostSession ? 'live' : 'dashboard'));
  const [activeHostQuiz, setActiveHostQuiz] = useState(null);
  const [hostRoomCode, setHostRoomCode] = useState(() => initialHostCode);
  const [showAIModal, setShowAIModal] = useState(false);
  const recordedRoomsRef = useRef(new Set());

  // Keep host session in storage and URL updated while hosting
  useEffect(() => {
    if (hostRoomCode && hostMode === 'live') {
      const sessionData = {
        roomCode: hostRoomCode,
        mode: 'live',
        timestamp: Date.now(),
      };
      try {
        sessionStorage.setItem('pulse_host_session', JSON.stringify(sessionData));
        localStorage.setItem('pulse_host_session', JSON.stringify(sessionData));
        sessionStorage.setItem('pulse_host_auth', 'true');
      } catch { /* ignore */ }

      const targetHash = `#/host?code=${hostRoomCode}`;
      if (window.location.hash !== targetHash && !window.location.hash.startsWith('#/host/geoguessr')) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  }, [hostRoomCode, hostMode]);

  useEffect(() => {
    const handler = () => {
      setGeoRoute(parseGeoHash(window.location.hash));
      const hash = window.location.hash;
      if (hash.startsWith('#/host') || hash.startsWith('#host')) {
        if (hash.startsWith('#/host/geoguessr')) return;

        const codeInHash = getHostCodeFromUrl();
        if (sessionStorage.getItem('pulse_host_auth') === 'true' || codeInHash || hasActiveHostSession) {
          setIsHostAuthenticated(true);
          setNavRole('host');
          if (codeInHash) {
            setHostRoomCode(codeInHash);
            setHostMode('live');
          }
        } else {
          setShowHostAuthModal(true);
        }
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [hasActiveHostSession]);

  // Handle AI generator result
  const handleAIGenerated = (quizData) => {
    setActiveHostQuiz(quizData);
    setHostMode('editor');
  };

  const handleHostAuthSuccess = () => {
    setIsHostAuthenticated(true);
    setShowHostAuthModal(false);
    setNavRole('host');
  };

  const handleHostLogout = () => {
    try {
      sessionStorage.removeItem('pulse_host_auth');
      sessionStorage.removeItem('pulse_host_session');
      localStorage.removeItem('pulse_host_session');
      sessionStorage.removeItem('pulse_host_draft_quiz');
    } catch {
      // ignore
    }
    botSimulator.clearBots();
    setIsHostAuthenticated(false);
    setHostRoomCode(null);
    setHostMode('dashboard');
    setNavRole('student');
    window.history.replaceState(null, '', '#/');
  };

  // Student state
  const [studentRoomCode, setStudentRoomCode] = useState('');
  const [studentPlayer, setStudentPlayer] = useState(null);
  const [savedSession, setSavedSession] = useState(null);

  // Check URL query parameters on load (e.g. ?code=123456 or ?host=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code') || params.get('join') || params.get('pin');
    if (codeParam) {
      setStudentRoomCode(codeParam.trim());
      setNavRole('student');
    }

    const hostCodeInUrl = getHostCodeFromUrl();
    const hostRequested =
      hostCodeInUrl ||
      params.get('host') === 'true' ||
      params.get('host') === '1' ||
      window.location.pathname.includes('/host') ||
      window.location.hash === '#host' ||
      window.location.hash.startsWith('#/host');

    if (hostRequested && !window.location.hash.startsWith('#/host/geoguessr')) {
      if (sessionStorage.getItem('pulse_host_auth') === 'true' || hostCodeInUrl || hasActiveHostSession) {
        setIsHostAuthenticated(true);
        setNavRole('host');
        if (hostCodeInUrl || initialHostCode) {
          setHostRoomCode(hostCodeInUrl || initialHostCode);
          setHostMode('live');
        }
      } else {
        setShowHostAuthModal(true);
      }
    }

    // Check localStorage for previous student session
    try {
      const saved = localStorage.getItem('pulse_student_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roomCode && parsed.id) {
          setSavedSession(parsed);
          // If code matches URL or no URL param, pre-set
          if (!codeParam || codeParam === parsed.roomCode) {
            setStudentRoomCode(parsed.roomCode);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [hasActiveHostSession, initialHostCode]);

  // Subscribe to room states
  const activeRoomCode = navRole === 'host' ? hostRoomCode : studentRoomCode;
  const { room, loading, updateRoom: dispatchUpdate, submitAnswer: dispatchAnswer } = useRoomSync(activeRoomCode);

  // -------------------------------------------------------------
  // HOST ACTIONS
  // -------------------------------------------------------------
  const handleHostStartRoom = async (quiz) => {
    const newPin = generateRoomCode();
    const initialRoomState = {
      roomCode: newPin,
      status: 'LOBBY', // 'LOBBY' | 'QUESTION_ACTIVE' | 'QUESTION_LEADERBOARD' | 'FINISHED'
      currentQuestionIndex: 0,
      title: quiz.title || 'Live Quiz',
      questions: quiz.questions,
      players: {},
      responses: {},
      isQuestionRevealed: false,
      questionStartedAt: null,
      createdAt: Date.now(),
    };

    await createRoom(initialRoomState);
    setHostRoomCode(newPin);
    setHostMode('live');
    setNavRole('host');
  };

  const handleHostLaunchQuestion = async (qIndex = 0) => {
    if (!room) return;
    const now = Date.now();
    await dispatchUpdate({
      status: 'QUESTION_ACTIVE',
      currentQuestionIndex: qIndex,
      isQuestionRevealed: false,
      questionStartedAt: now,
    });

    // Notify bot simulator if any bots are active
    botSimulator.handleQuestionActive({
      ...room,
      currentQuestionIndex: qIndex,
      questionStartedAt: now,
    });
  };

  const handleHostRevealAnswers = async () => {
    await dispatchUpdate({
      isQuestionRevealed: true,
    });
  };

  const handleHostShowLeaderboard = async () => {
    if (!room) return;

    // Calculate score updates for all players who answered
    const currentQ = room.questions?.[room.currentQuestionIndex];
    const qResponses = (currentQ && room.responses?.[currentQ.id]) || {};
    const updatedPlayers = { ...(room.players || {}) };

    Object.keys(updatedPlayers).forEach((pId) => {
      const resp = qResponses[pId];
      const playerObj = updatedPlayers[pId];

      if (resp && resp.pointsAwarded > 0) {
        // Correct answer
        const newScore = (playerObj.score || 0) + resp.pointsAwarded;
        const newStreak = (playerObj.streak || 0) + 1;
        updatedPlayers[pId] = {
          ...playerObj,
          score: newScore,
          streak: newStreak,
          lastRoundPoints: resp.pointsAwarded,
        };
      } else {
        // Incorrect or no answer
        updatedPlayers[pId] = {
          ...playerObj,
          streak: 0,
          lastRoundPoints: 0,
        };
      }
    });

    await dispatchUpdate({
      status: 'QUESTION_LEADERBOARD',
      players: updatedPlayers,
    });
  };

  const handleHostNextQuestion = async () => {
    if (!room) return;
    const nextIdx = (room.currentQuestionIndex || 0) + 1;
    handleHostLaunchQuestion(nextIdx);
  };

  const handleHostFinishGame = async () => {
    if (room && !recordedRoomsRef.current.has(room.roomCode)) {
      recordedRoomsRef.current.add(room.roomCode);
      const rawPlayers = room?.players ? Object.entries(room.players) : [];
      const sortedPlayers = rawPlayers
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));

      try {
        await recordGameHistory({
          roomCode: room.roomCode,
          title: room.title || 'Live Quiz',
          totalQuestions: room.questions?.length || 0,
          totalPlayers: sortedPlayers.length,
          topScorers: sortedPlayers.slice(0, 3),
          leaderboard: sortedPlayers,
        });
      } catch (err) {
        console.warn('Could not record game history:', err);
      }
    }

    await dispatchUpdate({
      status: 'FINISHED',
    });
  };

  const handleHostExit = () => {
    botSimulator.clearBots();
    try {
      sessionStorage.removeItem('pulse_host_session');
      localStorage.removeItem('pulse_host_session');
    } catch {
      // ignore
    }
    setHostRoomCode(null);
    setHostMode('dashboard');
    window.history.replaceState(null, '', '#/host');
  };

  const handleHostKickPlayer = useCallback(async (playerId) => {
    if (!hostRoomCode || !playerId) return;
    try {
      await kickPlayer(hostRoomCode, playerId);
    } catch (err) {
      console.error('Failed to kick player:', err);
    }
  }, [hostRoomCode]);

  // Clean up student session if kicked by host
  useEffect(() => {
    if (studentPlayer && room?.kicked?.[studentPlayer.id]) {
      try {
        localStorage.removeItem('pulse_student_session');
      } catch {
        // ignore
      }
    }
  }, [studentPlayer, room?.kicked]);

  // -------------------------------------------------------------
  // STUDENT ACTIONS
  // -------------------------------------------------------------
  const handleStudentJoin = async ({ roomCode, nickname, avatar, quizType }) => {
    // 1. Check if this is a GeoGuessr room PIN or requested as Geo quiz
    try {
      const geoRoom = await getGeoRoom(roomCode);
      if (geoRoom || quizType === 'geo') {
        const geoId = `geo_p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        try {
          localStorage.setItem('pulse_geo_player', JSON.stringify({
            id: geoId,
            nickname: nickname.trim(),
            avatar,
            roomCode,
          }));
          await joinGeoRoom(roomCode, {
            id: geoId,
            nickname: nickname.trim(),
            avatar,
          });
        } catch { /* ignore */ }
        window.location.hash = `#/player/buzzer?code=${roomCode}`;
        return;
      }
    } catch (err) {
      console.warn('GeoGuessr check error, falling back to standard room:', err);
    }

    const pId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const playerObj = {
      id: pId,
      nickname,
      avatar,
      score: 0,
      streak: 0,
      roomCode,
    };

    try {
      await joinRoom(roomCode, playerObj);
      setStudentPlayer(playerObj);
      setStudentRoomCode(roomCode);
      setSavedSession(playerObj);

      // Save to localStorage for auto-reconnection
      try {
        localStorage.setItem('pulse_student_session', JSON.stringify(playerObj));
      } catch {
        // ignore
      }
    } catch (err) {
      alert(err.message || 'Could not join room');
    }
  };


  const handleStudentReconnect = (session) => {
    if (room?.kicked?.[session?.id]) {
      try {
        localStorage.removeItem('pulse_student_session');
      } catch {
        // ignore
      }
      alert('You have been removed from this quiz session by the host.');
      return;
    }
    setStudentPlayer(session);
    setStudentRoomCode(session.roomCode);
  };

  const handleStudentSubmitAnswer = async (answerData) => {
    if (!room || !studentPlayer) return;
    const currentQ = room.questions?.[room.currentQuestionIndex];
    if (!currentQ) return;

    await dispatchAnswer(currentQ.id, studentPlayer.id, answerData);
  };

  const handleStudentLeave = () => {
    try {
      localStorage.removeItem('pulse_student_session');
    } catch {
      // ignore
    }
    setStudentPlayer(null);
    setStudentRoomCode('');
    setSavedSession(null);
  };

  // If a GeoGuessr hash route is active, render only that view (full-screen, no navbar)
  // Rendered here so all Hooks are called in the exact same order on every render (Rules of Hooks)
  if (geoRoute) {
    switch (geoRoute.view) {
      case 'geo-stage':
        return <GeoStageView roomCode={geoRoute.code} />;
      case 'geo-host':
        return <GeoHostDashboard roomCode={geoRoute.code} />;
      case 'geo-buzzer':
        return <GeoBuzzerView roomCode={geoRoute.code} />;
      default:
        break;
    }
  }

  return (

    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      <Navbar
        currentView={navRole}
        onViewChange={(view) => {
          if (view === 'host') {
            if (isHostAuthenticated) {
              setNavRole('host');
            } else {
              setShowHostAuthModal(true);
            }
          } else {
            setNavRole('student');
          }
        }}
        roomCode={activeRoomCode}
        isHostAuthenticated={isHostAuthenticated}
        onOpenHostAuth={() => setShowHostAuthModal(true)}
        onHostLogout={handleHostLogout}
      />

      <main className="flex-1 flex flex-col">
        {/* Active Host Session banner if host switches to student view while hosting */}
        {hostRoomCode && navRole === 'student' && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Active Host Session in progress (Room PIN: <strong className="font-mono text-white">{hostRoomCode}</strong>)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNavRole('host');
                  setHostMode('live');
                }}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Return to Host Control
              </button>
              <button
                type="button"
                onClick={handleHostExit}
                className="px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 text-xs transition cursor-pointer"
                title="End active host session"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HOST PORTAL */}
        {/* ========================================================================= */}
        {navRole === 'host' && (
          <>
            {hostMode === 'dashboard' && (
              <HostDashboard
                onStartRoom={handleHostStartRoom}
                onEditQuiz={(quiz) => {
                  setActiveHostQuiz(quiz);
                  setHostMode('editor');
                }}
              />
            )}

            {hostMode === 'editor' && (
              <QuizEditor
                initialQuiz={activeHostQuiz}
                onStartRoom={handleHostStartRoom}
                onSaveQuiz={async (quiz) => {
                  return await saveQuizToLibrary(quiz);
                }}
                onBack={() => setHostMode('dashboard')}
                onOpenAIGenerator={() => setShowAIModal(true)}
              />
            )}

            {hostMode === 'live' && (
              room ? (
                <>
                  {room.status === 'LOBBY' && (
                    <HostLobby
                      room={room}
                      onStartQuiz={() => handleHostLaunchQuestion(0)}
                      onCancelRoom={handleHostExit}
                      onKickPlayer={handleHostKickPlayer}
                    />
                  )}

                  {room.status === 'QUESTION_ACTIVE' && (
                    <HostControl
                      room={room}
                      onRevealAnswers={handleHostRevealAnswers}
                      onShowLeaderboard={handleHostShowLeaderboard}
                      onNextQuestion={handleHostNextQuestion}
                      onEndQuiz={handleHostFinishGame}
                      onKickPlayer={handleHostKickPlayer}
                    />
                  )}

                  {(room.status === 'QUESTION_LEADERBOARD' || room.status === 'FINISHED') && (
                    <HostLeaderboard
                      room={room}
                      onNextQuestion={handleHostNextQuestion}
                      onFinishGame={handleHostFinishGame}
                      onRestart={handleHostExit}
                      onKickPlayer={handleHostKickPlayer}
                    />
                  )}
                </>
              ) : loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">
                    Reconnecting to Live Host Session...
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono mb-4">
                    Room PIN: <span className="text-amber-400 font-bold">{hostRoomCode}</span>
                  </p>
                  <p className="text-xs text-zinc-600 max-w-sm">
                    Re-establishing real-time Firebase sync with players and question progress...
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3 text-lg font-bold">
                      !
                    </div>
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Host Session Not Found
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
                      The room PIN <span className="font-mono text-zinc-300 font-semibold">{hostRoomCode}</span> may have expired or was closed by the host.
                    </p>
                    <button
                      type="button"
                      onClick={handleHostExit}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Return to Host Dashboard
                    </button>
                  </div>
                </div>
              )
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* STUDENT EXPERIENCE */}
        {/* ========================================================================= */}
        {navRole === 'student' && (
          <>
            {!studentPlayer ? (
              <JoinForm
                initialCode={studentRoomCode}
                onJoin={handleStudentJoin}
                onReconnect={handleStudentReconnect}
                savedSession={savedSession}
              />
            ) : !room ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-zinc-200 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-zinc-200 mb-1">
                  Connecting to Game Room...
                </h3>
                <p className="text-xs text-zinc-500 font-mono mb-4">
                  PIN: {studentRoomCode}
                </p>
                <button
                  onClick={handleStudentLeave}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                >
                  Cancel / Join different PIN
                </button>
              </div>
            ) : room?.kicked?.[studentPlayer.id] ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
                <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 animate-pulse">
                    <UserX className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Removed from Room
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    You have been removed from this quiz session by the host.
                  </p>
                  <button
                    type="button"
                    onClick={handleStudentLeave}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            ) : (
              <>
                {room.status === 'LOBBY' && (
                  <StudentLobby
                    room={room}
                    player={studentPlayer}
                    onLeave={handleStudentLeave}
                  />
                )}

                {room.status === 'QUESTION_ACTIVE' && (
                  <StudentGameView
                    room={room}
                    player={studentPlayer}
                    onSubmitAnswer={handleStudentSubmitAnswer}
                  />
                )}

                {room.status === 'QUESTION_LEADERBOARD' && (
                  <StudentScoreView
                    room={room}
                    player={studentPlayer}
                  />
                )}

                {room.status === 'FINISHED' && (
                  <StudentPodium
                    room={room}
                    player={studentPlayer}
                    onLeave={handleStudentLeave}
                  />
                )}

                {/* GeoGuessr status handler for live mobile buzzer */}
                {(room.status?.startsWith('GEO_') || ['PANORAMA', 'HOST_MIRROR', 'BUZZER_LOCKED', 'REVEAL', 'ROUND_WRAP'].includes(room.status)) && (
                  <GeoBuzzerView roomCode={studentRoomCode} />
                )}

                {/* Robust fallback so player view is NEVER a blank/black void */}
                {!['LOBBY', 'QUESTION_ACTIVE', 'QUESTION_LEADERBOARD', 'FINISHED'].includes(room.status) &&
                 !room.status?.startsWith('GEO_') &&
                 !['PANORAMA', 'HOST_MIRROR', 'BUZZER_LOCKED', 'REVEAL', 'ROUND_WRAP'].includes(room.status) && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="max-w-xs w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl text-center">
                      <p className="text-zinc-300 font-semibold mb-1">Room Connected</p>
                      <p className="text-zinc-500 text-xs font-mono mb-4">{room.status || 'Active'}</p>
                      <button
                        onClick={handleStudentLeave}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Exit to Home
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </>
        )}
      </main>

      {navRole === 'student' && (
        <footer className="py-5 text-center text-xs text-zinc-600 border-t border-zinc-900 flex items-center justify-center gap-3">
          <span>PulseQuiz Real-Time Live</span>
          <span>&bull;</span>
          <button
            onClick={() => {
              if (isHostAuthenticated) {
                setNavRole('host');
              } else {
                setShowHostAuthModal(true);
              }
            }}
            className="hover:text-zinc-300 text-zinc-500 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3 text-zinc-500" />
            <span>Host Portal (Passcode Required)</span>
          </button>
        </footer>
      )}

      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={handleAIGenerated}
      />

      <HostAuthModal
        isOpen={showHostAuthModal}
        onClose={() => setShowHostAuthModal(false)}
        onSuccess={handleHostAuthSuccess}
      />
    </div>
  );
}


export default App;
