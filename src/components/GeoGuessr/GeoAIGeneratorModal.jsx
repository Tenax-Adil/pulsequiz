import React, { useState } from 'react';
import { Sparkles, X, Globe, Loader2, Check, MapPin, Compass, Trash2, RotateCcw, ArrowRight } from 'lucide-react';
import { generateGeoQuizWithGemini } from '../../services/gemini.js';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';

const GEO_TOPIC_SUGGESTIONS = [
  '🏛️ Ancient Wonders of the World',
  '🗼 Iconic European Capitals',
  '🏙️ Asian Megacity Skylines',
  '🏎️ Formula 1 Grand Prix Cities',
  '🏰 Historic Castles & Palaces',
  '🏔️ Spectacular Natural Wonders',
  '🎬 Famous Movie Filming Locations',
  '🏖️ Tropical Islands & Coastal Havens',
];

const REGIONS = [
  { id: 'all', label: 'Global (Anywhere)' },
  { id: 'Europe', label: 'Europe' },
  { id: 'Asia', label: 'Asia' },
  { id: 'Americas', label: 'Americas' },
  { id: 'Africa & Middle East', label: 'Africa & Middle East' },
  { id: 'Oceania', label: 'Oceania' },
];

export function GeoAIGeneratorModal({ isOpen, onClose, onGenerated }) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [region, setRegion] = useState('all');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedResult, setGeneratedResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await generateGeoQuizWithGemini({
        topic: topic.trim(),
        count,
        region,
        difficulty,
      });

      if (!result || !Array.isArray(result.locations) || result.locations.length === 0) {
        throw new Error('AI could not generate locations. Please try another theme or prompt.');
      }

      setGeneratedResult(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate Geo Quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLocation = (idxToRemove) => {
    if (!generatedResult) return;
    setGeneratedResult(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== idxToRemove),
    }));
  };

  const handleApply = () => {
    if (generatedResult && generatedResult.locations.length > 0) {
      onGenerated({
        title: generatedResult.quizTitle || topic.trim(),
        locations: generatedResult.locations,
      });
      onClose();
    }
  };

  const handleResetForm = () => {
    setGeneratedResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl my-6 max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 flex-shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Gemini AI Geo Quiz Creator</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                360° Places
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Generate themed world tours with real GPS coordinates and clues using Gemini AI
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {!generatedResult ? (
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Topic Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Quiz Theme or Topic
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Ancient Wonders, European Capital Bridges, Japanese Castles"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-11 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                />
              </div>

              {/* Quick Pick Topic Chips */}
              <div>
                <span className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                  Popular Themes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {GEO_TOPIC_SUGGESTIONS.map((sug) => {
                    const cleanText = sug.replace(/^[\p{Emoji}\s]+/u, '');
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTopic(cleanText)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          topic === cleanText
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        {sug}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Options Grid: Count, Region, Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
                {/* Count */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Places Count
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value={3}>3 Locations (Quick)</option>
                    <option value={5}>5 Locations (Standard)</option>
                    <option value={8}>8 Locations (Long)</option>
                    <option value={10}>10 Locations (Tournament)</option>
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Region Scope
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {REGIONS.map(r => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty / Clue Style */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Clue Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    <option value="easy">Easy (Iconic & Direct)</option>
                    <option value="medium">Medium (Standard Clues)</option>
                    <option value="hard">Hard (Obscure & Cryptic)</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-xs text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black h-12 shadow-lg shadow-amber-500/20 text-sm cursor-pointer transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Gemini AI is researching coordinates & clues...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Generate Geo Quiz with AI</span>
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Preview Stage */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Generated Quiz Title
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {generatedResult.locations.length} Locations
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {generatedResult.quizTitle}
                </h4>
                {generatedResult.description && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {generatedResult.description}
                  </p>
                )}
              </div>

              {/* Locations List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {generatedResult.locations.map((loc, idx) => (
                  <div
                    key={loc.id || idx}
                    className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-750 hover:border-zinc-700 transition flex items-start justify-between gap-3 text-left"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 text-amber-400 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-white truncate">
                            {loc.name}
                          </span>
                          {loc.country && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300">
                              {loc.country}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono">
                            {loc.lat.toFixed(4)}°, {loc.lon.toFixed(4)}°
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 italic leading-relaxed">
                          "{loc.clue}"
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(idx)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer flex-shrink-0"
                      title="Remove location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetForm}
                  className="border-zinc-700 text-zinc-300 hover:text-white h-11 px-4 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start Over</span>
                </Button>

                <Button
                  type="button"
                  disabled={generatedResult.locations.length === 0}
                  onClick={handleApply}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black h-11 shadow-lg shadow-amber-500/20 text-sm cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-black" />
                  <span>Use This Geo Quiz ({generatedResult.locations.length} Locations)</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeoAIGeneratorModal;
