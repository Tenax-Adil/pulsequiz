import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PlusCircle,
  Play,
  Wand2,
  History,
  BookOpen,
  Trash2,
  Edit3,
  Calendar,
  Check
} from 'lucide-react';
import { AIGeneratorModal } from './AIGeneratorModal.jsx';
import { QuizHistoryModal } from './QuizHistoryModal.jsx';
import { fetchSavedQuizzes, deleteSavedQuiz, fetchGameHistory } from '../../services/firebase.js';

export function HostDashboard({ onStartRoom, onEditQuiz }) {
  const [showAIModal, setShowAIModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  const loadData = async () => {
    setLoadingLibrary(true);
    try {
      const [quizzes, history] = await Promise.all([
        fetchSavedQuizzes(),
        fetchGameHistory()
      ]);
      setSavedQuizzes(quizzes || []);
      setGameHistory(history || []);
    } catch (err) {
      console.warn('Error loading host dashboard data:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectQuiz = (quiz) => {
    onStartRoom({
      title: quiz.title,
      questions: quiz.questions,
    });
  };

  const handleCustomQuiz = () => {
    onEditQuiz({
      title: 'New Live Quiz',
      questions: [
        {
          id: `q_${Date.now()}`,
          text: '',
          imageUrl: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          timeLimit: 20,
        },
      ],
    });
  };

  const handleDeleteSaved = async (quizId, e) => {
    e.stopPropagation();
    if (confirm('Delete this saved quiz from your library?')) {
      await deleteSavedQuiz(quizId);
      loadData();
    }
  };

  const handleAIGenerated = (quizData) => {
    onEditQuiz(quizData);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          Real-Time Live Presenter Studio
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight mb-4">
          Engage Up To{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400">
            200 Live Players
          </span>{' '}
          Instantly
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Create an interactive Kahoot-style experience with instant synchronized state,
          live answer distribution graphs, Gemini AI generation, and podium celebrations.
        </p>

        {/* Quick Launcher Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-black text-base shadow-xl shadow-orange-500/25 transition transform hover:scale-[1.02] cursor-pointer"
          >
            <Wand2 className="w-5 h-5" /> Generate with Gemini AI
          </button>

          <button
            onClick={handleCustomQuiz}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-base transition cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-indigo-400" /> Create Custom Quiz
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-base transition cursor-pointer"
          >
            <History className="w-5 h-5 text-indigo-400" />
            <span>Quiz History</span>
            {gameHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-mono font-bold">
                {gameHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MY SAVED QUIZZES (User Created & Saved) */}
      {savedQuizzes.length > 0 ? (
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  My Saved Quizzes ({savedQuizzes.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Custom quizzes created and saved to your library
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {savedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-400 rounded-3xl p-6 transition flex flex-col justify-between group shadow-xl hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800">
                      Saved Custom Quiz
                    </span>
                    <button
                      onClick={(e) => handleDeleteSaved(quiz.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition truncate">
                    {quiz.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(quiz.updatedAt || quiz.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {quiz.questions?.length || 0} Questions
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditQuiz(quiz)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleSelectQuiz(quiz)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Host
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Saved Quizzes Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Create your custom quiz or generate questions instantly using Gemini AI. Once saved, your quizzes will appear here ready to launch.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-bold text-sm transition cursor-pointer"
            >
              <Wand2 className="w-4 h-4" /> Generate with AI
            </button>
            <button
              onClick={handleCustomQuiz}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" /> Create Custom Quiz
            </button>
          </div>
        </div>
      )}

      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={handleAIGenerated}
      />

      <QuizHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyList={gameHistory}
        onRefresh={loadData}
      />
    </div>
  );
}
