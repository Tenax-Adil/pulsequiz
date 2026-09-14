import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check, ArrowRight, Wand2, Lightbulb } from 'lucide-react';
import { generateQuizWithGemini } from '../../services/gemini.js';

const TOPIC_SUGGESTIONS = [
  'Modern Web Dev & React',
  'Cybersecurity & Ethical Hacking',
  'Space Exploration & Astronomy',
  'Machine Learning & AI Concepts',
  '90s Pop Culture & Video Games',
  'World Capitals & Flags'
];

export function AIGeneratorModal({ isOpen, onClose, onGenerated }) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const questions = await generateQuizWithGemini({
        topic: topic.trim(),
        questionCount: count,
        difficulty,
      });

      if (!questions || questions.length === 0) {
        throw new Error('No questions could be generated. Please try again.');
      }

      setGeneratedQuestions(questions);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate quiz. Please check API key or try another topic.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedQuestions) {
      onGenerated({
        title: topic,
        questions: generatedQuestions,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl my-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-0.5 shadow-lg shadow-orange-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Gemini AI Quiz Creator
            </h3>
            <p className="text-xs text-slate-400">
              Generate structured, high-energy live trivia in seconds using Google Gemini
            </p>
          </div>
        </div>

        {!generatedQuestions ? (
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">
                Quiz Topic or Theme
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. JavaScript Frameworks, Ancient Rome, Marvel Cinematic Universe"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-base"
                />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-400" /> Ideas:
                </span>
                {TOPIC_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTopic(sug)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question Count (1 to 50)
                  </label>
                  <span className="text-sm font-black font-mono text-indigo-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                    {count} Questions
                  </span>
                </div>

                {/* Smooth 1-50 Range Slider */}
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-950 rounded-lg mb-3"
                />

                {/* Quick Presets */}
                <div className="flex gap-2">
                  {[5, 10, 20, 35, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                        count === num
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm capitalize transition cursor-pointer ${
                        difficulty === diff
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-950/50 border border-rose-800/50 text-rose-300 rounded-2xl text-xs">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-600 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white font-extrabold text-lg rounded-2xl transition shadow-xl shadow-orange-500/25 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Gemini is generating your quiz...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Generated {generatedQuestions.length} questions for &quot;{topic}&quot;</span>
              </div>
              <button
                onClick={() => setGeneratedQuestions(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Regenerate
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
              {generatedQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-bold text-white">
                      Q{idx + 1}. {q.text}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full shrink-0">
                      {q.timeLimit}s
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border ${
                          oIdx === q.correctOptionIndex
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setGeneratedQuestions(null)}
                className="w-1/3 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl transition cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base rounded-2xl transition shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Use These Questions</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
