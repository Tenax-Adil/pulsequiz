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
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Sleek Presenter Control Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 mb-10 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
              Quiz Studio
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Host Active
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Create custom quizzes, generate trivia with Gemini AI, and launch live interactive multiplayer rooms.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Wand2 className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={handleCustomQuiz}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-white font-bold text-sm transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-indigo-500/10 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Create Quiz</span>
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all duration-300 cursor-pointer"
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span>History</span>
            {gameHistory.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-mono font-bold">
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
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  My Quiz Library ({savedQuizzes.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Ready-to-launch quizzes stored securely in your library
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card-interactive rounded-3xl p-6 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800/80">
                      Saved Quiz
                    </span>
                    <button
                      onClick={(e) => handleDeleteSaved(quiz.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {quiz.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(quiz.updatedAt || quiz.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 font-mono bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                    {quiz.questions?.length || 0} Questions
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditQuiz(quiz)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleSelectQuiz(quiz)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 transition transform hover:scale-105 cursor-pointer"
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
        <div className="text-center py-20 px-6 border border-dashed border-slate-800/80 rounded-3xl bg-slate-900/40 backdrop-blur-sm mb-8 animate-fade-in-up">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4 animate-float shadow-lg shadow-indigo-500/5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">No Saved Quizzes Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Create your custom quiz or generate questions instantly using Gemini AI. Once saved, your quizzes will appear here ready to launch anytime.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-bold text-sm transition transform hover:scale-105 shadow-md shadow-orange-500/20 cursor-pointer"
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
