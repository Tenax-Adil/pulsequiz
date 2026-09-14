import React, { useState } from 'react';
import {
  Sparkles,
  PlusCircle,
  Play,
  Flame,
  Globe2,
  Cpu,
  Layers,
  Users2,
  Wand2
} from 'lucide-react';
import { SAMPLE_QUIZZES } from '../../data/sampleQuizzes.js';
import { AIGeneratorModal } from './AIGeneratorModal.jsx';

export function HostDashboard({ onStartRoom, onEditQuiz }) {
  const [showAIModal, setShowAIModal] = useState(false);

  const handleSelectSample = (quiz) => {
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
        </div>
      </div>

      {/* Instant Ready-to-Play Templates */}
      <div className="mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Ready-to-Play Curated Quizzes
            </h2>
            <p className="text-xs text-slate-400">
              Launch in 1-click or customize questions in the editor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_QUIZZES.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 transition flex flex-col justify-between group shadow-xl hover:shadow-indigo-500/10"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
                  {quiz.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  {quiz.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {quiz.questions.length} Questions
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEditQuiz(quiz)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleSelectSample(quiz)}
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

      {/* Tech Architecture Badges */}
      <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center">
          <Users2 className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
          <div className="text-lg font-black text-white">200 Concurrency</div>
          <div className="text-[11px] text-slate-400">Lightweight Managed Snapshots</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center">
          <Cpu className="w-6 h-6 text-pink-400 mx-auto mb-2" />
          <div className="text-lg font-black text-white">&lt;50ms Sync</div>
          <div className="text-[11px] text-slate-400">Centralized State Machine</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center">
          <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-lg font-black text-white">Gemini 2.0 AI</div>
          <div className="text-[11px] text-slate-400">Structured JSON Trivia Engine</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center">
          <Globe2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <div className="text-lg font-black text-white">Zero Server Crash</div>
          <div className="text-[11px] text-slate-400">Cloud Realtime Listeners</div>
        </div>
      </div>

      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={handleAIGenerated}
      />
    </div>
  );
}
