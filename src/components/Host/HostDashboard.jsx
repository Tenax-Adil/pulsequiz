import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Play,
  Wand2,
  History,
  BookOpen,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { AIGeneratorModal } from './AIGeneratorModal.jsx';
import { QuizHistoryModal } from './QuizHistoryModal.jsx';
import { fetchSavedQuizzes, deleteSavedQuiz, fetchGameHistory } from '../../services/firebase.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card.jsx';

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
      {/* Executive Command Header - Shadcn Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Quiz Library
            </h1>
            <Badge variant="outline" className="border-zinc-800 text-zinc-400 font-normal">
              Host Panel
            </Badge>
          </div>
          <p className="text-sm text-zinc-400 max-w-xl">
            Create, manage, and launch multiplayer quiz sessions with real-time synchronization.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
          >
            <History className="w-4 h-4 text-zinc-400" />
            <span>History</span>
            {gameHistory.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[11px] font-mono font-medium">
                {gameHistory.length}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleCustomQuiz}
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200"
          >
            <PlusCircle className="w-4 h-4 text-zinc-400" />
            <span>New Quiz</span>
          </Button>

          <Button
            onClick={() => setShowAIModal(true)}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-zinc-900" />
            <span>AI Generate</span>
          </Button>
        </div>
      </div>

      {/* SAVED QUIZZES GRID */}
      {savedQuizzes.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Saved Quizzes
              </h2>
              <span className="text-xs text-zinc-400 font-mono">
                ({savedQuizzes.length})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedQuizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="shadcn-card-interactive flex flex-col justify-between group overflow-hidden border-zinc-800/90"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="text-[11px] bg-zinc-800/80 text-zinc-300 border-zinc-700/60 font-medium">
                      {quiz.questions?.length || 0} Questions
                    </Badge>
                    <button
                      onClick={(e) => handleDeleteSaved(quiz.id, e)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 transition opacity-60 group-hover:opacity-100 cursor-pointer"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <CardTitle className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors line-clamp-2">
                    {quiz.title}
                  </CardTitle>

                  <CardDescription className="text-xs text-zinc-400 flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span>{new Date(quiz.updatedAt || quiz.createdAt || Date.now()).toLocaleDateString()}</span>
                  </CardDescription>
                </CardHeader>

                <CardFooter className="p-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2 bg-zinc-950/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditQuiz(quiz)}
                    className="h-8 text-xs text-zinc-400 hover:text-zinc-100"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleSelectQuiz(quiz)}
                    className="h-8 text-xs bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold"
                  >
                    <Play className="w-3 h-3 fill-zinc-950 mr-1" /> Launch
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Clean Shadcn Empty State with subtle geometric vector graphic */
        <Card className="border-dashed border-zinc-800 bg-zinc-950/40 p-12 text-center my-6">
          <div className="w-12 h-12 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <CardTitle className="text-lg font-semibold text-zinc-200 mb-1">
            No Quizzes in Library
          </CardTitle>
          <CardDescription className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
            Get started by creating your custom questions or generate a set in seconds with Gemini AI.
          </CardDescription>
          <div className="flex items-center justify-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCustomQuiz}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Manual Builder
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAIModal(true)}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI Generator
            </Button>
          </div>
        </Card>
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

export default HostDashboard;
