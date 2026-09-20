import React, { useState, useEffect } from 'react';
import {
  X, Globe, MapPin, Play, Trash2, Plus, Calendar,
  Compass, Check, Sparkles, BookOpen
} from 'lucide-react';
import { fetchSavedGeoQuizzes, deleteSavedGeoQuiz } from '../../services/geoFirebase.js';

export function GeoQuizLibraryModal({ isOpen, onClose, onSelectQuiz, onNewBlankQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'custom' | 'preset'

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const list = await fetchSavedGeoQuizzes();
      setQuizzes(list);
    } catch (err) {
      console.error('Failed to load Geo Quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQuizzes();
    }
  }, [isOpen]);

  const handleDelete = async (quizId, e) => {
    e.stopPropagation();
    if (confirm('Delete this Geo Quiz from your library?')) {
      await deleteSavedGeoQuiz(quizId);
      loadQuizzes();
    }
  };

  if (!isOpen) return null;

  const filteredQuizzes = quizzes.filter(q => {
    if (filter === 'custom') return !q.isPreset;
    if (filter === 'preset') return q.isPreset;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Geo Quiz Library</h2>
              <p className="text-xs text-zinc-400">Load a saved 360° location quiz or launch presets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex rounded-lg bg-zinc-800 p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'all' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400'
              }`}
            >
              All ({quizzes.length})
            </button>
            <button
              onClick={() => setFilter('custom')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'custom' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400'
              }`}
            >
              My Saved Quizzes ({quizzes.filter(q => !q.isPreset).length})
            </button>
            <button
              onClick={() => setFilter('preset')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                filter === 'preset' ? 'bg-zinc-700 text-white font-semibold' : 'text-zinc-400'
              }`}
            >
              Curated Presets ({quizzes.filter(q => q.isPreset).length})
            </button>
          </div>

          <button
            onClick={() => {
              onNewBlankQuiz();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New From Scratch</span>
          </button>
        </div>

        {/* Quiz List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">Loading library...</div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">No saved Geo Quizzes found.</div>
          ) : (
            filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => {
                  onSelectQuiz(quiz);
                  onClose();
                }}
                className="group p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition truncate">
                      {quiz.title}
                    </h3>
                    {quiz.isPreset ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                        Curated Preset
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        Saved Custom
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                      {quiz.locations?.length || 0} Locations
                    </span>
                  </div>

                  {quiz.description && (
                    <p className="text-xs text-zinc-400 mb-2 truncate">{quiz.description}</p>
                  )}

                  {/* Locations preview tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {(quiz.locations || []).slice(0, 4).map((loc, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-zinc-900 border border-zinc-700/60 px-2 py-0.5 rounded text-zinc-300 flex items-center gap-1"
                      >
                        <MapPin className="w-2.5 h-2.5 text-amber-400" />
                        <span className="truncate max-w-[140px]">{loc.name.split(',')[0]}</span>
                      </span>
                    ))}
                    {(quiz.locations || []).length > 4 && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        +{(quiz.locations || []).length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!quiz.isPreset && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(quiz.id, e)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 transition cursor-pointer"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load & Play</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default GeoQuizLibraryModal;
