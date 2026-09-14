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
} from './services/firebase.js';
import { useRoomSync } from './hooks/useRoomSync.js';
import { botSimulator } from './services/mockBots.js';

import { Lock } from 'lucide-react';
import { AIGeneratorModal } from './components/Host/AIGeneratorModal.jsx';
import { HostAuthModal } from './components/Host/HostAuthModal.jsx';

export function App() {
  // Navigation: 'host' | 'student'
  const [navRole, setNavRole] = useState('student');

  // Host security & authentication
  const [isHostAuthenticated, setIsHostAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('pulse_host_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [showHostAuthModal, setShowHostAuthModal] = useState(false);

  // Host sub-state: 'dashboard' | 'editor' | 'live'
  const [hostMode, setHostMode] = useState('dashboard');
  const [activeHostQuiz, setActiveHostQuiz] = useState(null);
  const [hostRoomCode, setHostRoomCode] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const recordedRoomsRef = useRef(new Set());

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
    } catch {
      // ignore
    }
    setIsHostAuthenticated(false);
    setNavRole('student');
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

    const hostRequested =
      params.get('host') === 'true' ||
      params.get('host') === '1' ||
      window.location.pathname.includes('/host') ||
      window.location.hash === '#host';

    if (hostRequested) {
      if (sessionStorage.getItem('pulse_host_auth') === 'true') {
        setIsHostAuthenticated(true);
        setNavRole('host');
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
  }, []);

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
    setHostRoomCode(null);
    setHostMode('dashboard');
  };

  // -------------------------------------------------------------
  // STUDENT ACTIONS
  // -------------------------------------------------------------
  const handleStudentJoin = async ({ roomCode, nickname, avatar }) => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
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

            {hostMode === 'live' && room && (
              <>
                {room.status === 'LOBBY' && (
                  <HostLobby
                    room={room}
                    onStartQuiz={() => handleHostLaunchQuestion(0)}
                    onCancelRoom={handleHostExit}
                  />
                )}

                {room.status === 'QUESTION_ACTIVE' && (
                  <HostControl
                    room={room}
                    onRevealAnswers={handleHostRevealAnswers}
                    onShowLeaderboard={handleHostShowLeaderboard}
                    onNextQuestion={handleHostNextQuestion}
                    onEndQuiz={handleHostFinishGame}
                  />
                )}

                {(room.status === 'QUESTION_LEADERBOARD' || room.status === 'FINISHED') && (
                  <HostLeaderboard
                    room={room}
                    onNextQuestion={handleHostNextQuestion}
                    onFinishGame={handleHostFinishGame}
                    onRestart={handleHostExit}
                  />
                )}
              </>
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
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
                <h3 className="text-xl font-bold text-white mb-1">
                  Connecting to Game Room...
                </h3>
                <p className="text-xs text-slate-400">
                  PIN: {studentRoomCode}
                </p>
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
              </>
            )}
          </>
        )}
      </main>

      {navRole === 'student' && (
        <footer className="py-5 text-center text-xs text-slate-500 border-t border-slate-900/80 flex items-center justify-center gap-3">
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
            className="hover:text-indigo-400 text-slate-500 transition cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-3 h-3 text-slate-500" />
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
