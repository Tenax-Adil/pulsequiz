import React, { useState } from 'react';
import { Sparkles, X, Wand2, Loader2, Check, Lightbulb } from 'lucide-react';
import { generateQuizWithGemini } from '../../services/gemini.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Input } from '../ui/input.jsx';

const TOPIC_SUGGESTIONS = [
  'JavaScript & React Core Concepts',
  'World Capitals & Currencies',
  'Solar System & Astrophysics',
  '2000s Pop Music & Billboard Hits',
  'Cybersecurity & Web Protocols',
  'Marvel Cinematic Universe',
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
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const questions = await generateQuizWithGemini({
        topic: topic.trim(),
        count,
        difficulty,
      });

      if (!questions || questions.length === 0) {
        throw new Error('AI could not generate questions. Please try a different topic.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
            <Sparkles className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Gemini AI Quiz Creator
            </h3>
            <p className="text-xs text-zinc-400">
              Generate structured questions automatically using Google Gemini
            </p>
          </div>
        </div>

        {!generatedQuestions ? (
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Topic or Prompt
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. World Capitals, Modern JavaScript, Space Exploration"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11 text-zinc-100 placeholder:text-zinc-500"
              />

              {/* Suggestions */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-zinc-400" /> Suggestions:
                </span>
                {TOPIC_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTopic(sug)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-950/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer border border-zinc-800"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Question Count (1 to 50)
                  </label>
                  <span className="text-xs font-mono font-semibold text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {count} Questions
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  className="w-full accent-zinc-200 cursor-pointer h-1.5 bg-zinc-950 rounded-lg mb-2"
                />

                <div className="flex gap-1.5">
                  {[5, 10, 20, 35, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCount(num)}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                        count === num
                          ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                          : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer border ${
                        difficulty === diff
                          ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                          : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold h-11 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Generating Questions with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-medium">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Generated {generatedQuestions.length} questions for &quot;{topic}&quot;</span>
              </div>
              <button
                onClick={() => setGeneratedQuestions(null)}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Change Topic
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {generatedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-400 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-zinc-200">
                      {q.text}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pl-7">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`text-[11px] px-2 py-1 rounded truncate border ${
                          oIdx === q.correctOptionIndex
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300 font-medium'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGeneratedQuestions(null)}
                className="border-zinc-800"
              >
                Regenerate
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold"
              >
                Load into Editor
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIGeneratorModal;
