import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Play,
  Copy,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';
import { uploadQuestionImage } from '../../services/storage.js';
import { OPTION_THEMES } from '../Common/AnswerButton.jsx';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';

export function QuizEditor({ initialQuiz, onStartRoom, onSaveQuiz, onBack, onOpenAIGenerator }) {
  const getInitialDraft = () => {
    if (initialQuiz) return initialQuiz;
    try {
      const raw = sessionStorage.getItem('pulse_host_draft_quiz');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  };

  const draft = getInitialDraft();
  const [title, setTitle] = useState(draft?.title || 'My Interactive Live Quiz');
  const [currentQuizId, setCurrentQuizId] = useState(draft?.id || null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [questions, setQuestions] = useState(
    draft?.questions || [
      {
        id: 'q_init_1',
        text: 'What does CSS stand for?',
        imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=900&auto=format&fit=crop&q=80',
        options: [
          'Computer Style Sheets',
          'Cascading Style Sheets',
          'Creative Style Systems',
          'Colorful Sheet Styles'
        ],
        correctOptionIndex: 1,
        timeLimit: 20
      }
    ]
  );
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Persist draft in sessionStorage so refreshing does not wipe question edits
  useEffect(() => {
    try {
      sessionStorage.setItem('pulse_host_draft_quiz', JSON.stringify({
        id: currentQuizId,
        title,
        questions,
      }));
    } catch { /* ignore */ }
  }, [title, questions, currentQuizId]);

  const currentQ = questions[activeQuestionIdx] || questions[0];

  const updateCurrentQuestion = (updates) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === activeQuestionIdx ? { ...q, ...updates } : q))
    );
  };

  const handleAddQuestion = () => {
    if (questions.length >= 50) {
      alert('Maximum limit of 50 questions reached for this quiz.');
      return;
    }
    const newQ = {
      id: `q_${Date.now()}_${questions.length + 1}`,
      text: '',
      imageUrl: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      timeLimit: 20
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionIdx(questions.length);
  };

  const handleDuplicateQuestion = (idxToDup) => {
    if (questions.length >= 50) {
      alert('Maximum limit of 50 questions reached for this quiz.');
      return;
    }
    const source = questions[idxToDup];
    const cloned = {
      ...source,
      id: `q_${Date.now()}_${questions.length + 1}`,
      text: `${source.text} (Copy)`,
      options: [...source.options],
    };
    const nextList = [...questions];
    nextList.splice(idxToDup + 1, 0, cloned);
    setQuestions(nextList);
    setActiveQuestionIdx(idxToDup + 1);
  };

  const handleDeleteQuestion = (idxToDelete) => {
    if (questions.length <= 1) return;
    const filtered = questions.filter((_, i) => i !== idxToDelete);
    setQuestions(filtered);
    if (activeQuestionIdx >= filtered.length) {
      setActiveQuestionIdx(filtered.length - 1);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadQuestionImage(file);
      const finalUrl = typeof res === 'string' ? res : res?.url;
      if (!finalUrl) throw new Error('No image URL returned from upload');
      updateCurrentQuestion({ imageUrl: finalUrl });
    } catch (err) {
      alert(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Question #${i + 1} has empty text!`);
        setActiveQuestionIdx(i);
        return;
      }
      for (let o = 0; o < 4; o++) {
        if (!q.options[o]?.trim()) {
          alert(`Question #${i + 1} option ${o + 1} is empty!`);
          setActiveQuestionIdx(i);
          return;
        }
      }
    }

    if (onSaveQuiz) {
      const saved = await onSaveQuiz({
        id: currentQuizId,
        title: title.trim() || 'Untitled Quiz',
        questions,
      });
      if (saved && saved.id) {
        setCurrentQuizId(saved.id);
      }
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    }
  };

  const handleLaunch = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Question #${i + 1} has empty text!`);
        setActiveQuestionIdx(i);
        return;
      }
      for (let o = 0; o < 4; o++) {
        if (!q.options[o]?.trim()) {
          alert(`Question #${i + 1} option ${o + 1} is empty!`);
          setActiveQuestionIdx(i);
          return;
        }
      }
    }

    onStartRoom({
      title: title.trim() || 'Untitled Quiz',
      questions,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Top Bar Navigation - Clean Shadcn */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="border-zinc-800 h-9 w-9 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Quiz Builder
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Quiz Title..."
              className="text-xl sm:text-2xl font-bold text-white bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-400 focus:outline-none transition block"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            onClick={handleSave}
            className="border-zinc-800 text-zinc-200 hover:bg-zinc-800"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-zinc-400" />
                <span>Save</span>
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={onOpenAIGenerator}
            className="border border-zinc-700/60"
          >
            <Sparkles className="w-4 h-4 text-zinc-300" />
            <span>AI Assist</span>
          </Button>

          <Button
            onClick={handleLaunch}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold shadow-sm"
          >
            <Play className="w-4 h-4 fill-zinc-950 mr-1" />
            <span>Launch Lobby</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Question Timeline */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Questions ({questions.length}/50)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddQuestion}
              disabled={questions.length >= 50}
              className="h-7 text-xs text-zinc-300 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`group relative p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  activeQuestionIdx === idx
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-zinc-950/80 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 text-zinc-400">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium truncate max-w-[130px]">
                    {q.text || 'Untitled Question'}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  {questions.length < 50 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateQuestion(idx);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-100 transition"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-red-400 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Main Editor Canvas */}
        <div className="lg:col-span-9 space-y-5">
          {/* Question Text & Time Limit Header */}
          <Card className="border-zinc-800 bg-zinc-900/80 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Question #{activeQuestionIdx + 1}
              </span>

              {/* Timer Limit Controller */}
              <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-400 font-medium">Timer:</span>
                <select
                  value={currentQ.timeLimit}
                  onChange={(e) =>
                    updateCurrentQuestion({ timeLimit: parseInt(e.target.value, 10) })
                  }
                  className="bg-transparent text-xs font-mono font-semibold text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10s</option>
                  <option value={15}>15s</option>
                  <option value={20}>20s</option>
                  <option value={30}>30s</option>
                  <option value={45}>45s</option>
                  <option value={60}>60s</option>
                </select>
              </div>
            </div>

            <textarea
              rows={2}
              value={currentQ.text}
              onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
              placeholder="Type your question here..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl p-3.5 text-base font-medium text-white placeholder-zinc-500 focus:outline-none transition resize-none"
            />
          </Card>

          {/* Media Attachment / Question Hint */}
          <Card className="border-zinc-800 bg-zinc-900/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> Image Hint / Visual (Optional)
              </label>
              {currentQ.imageUrl && (
                <button
                  type="button"
                  onClick={() => updateCurrentQuestion({ imageUrl: '' })}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                >
                  Clear Image
                </button>
              )}
            </div>

            {/* Input & Upload Controls: Always visible */}
            <div className="flex flex-col sm:flex-row gap-2 mb-2.5">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Paste any image URL (e.g. from Google Images, Unsplash)..."
                  value={currentQ.imageUrl || ''}
                  onChange={(e) => updateCurrentQuestion({ imageUrl: e.target.value.trim() })}
                  className="h-9 text-xs bg-zinc-950 font-mono"
                />
              </div>

              <label className="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition whitespace-nowrap border border-zinc-700">
                <Upload className="w-3.5 h-3.5 text-zinc-300" />
                <span>{uploadingImage ? 'Loading...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              <span className="text-[10px] text-zinc-500">Quick samples:</span>
              {[
                { name: 'Tech', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80' },
                { name: 'Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80' },
                { name: 'Nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80' },
                { name: 'City', url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=900&auto=format&fit=crop&q=80' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateCurrentQuestion({ imageUrl: preset.url })}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
                >
                  +{preset.name}
                </button>
              ))}
            </div>

            {/* Live Image Preview */}
            {currentQ.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-2.5 flex items-center justify-center min-h-[160px] group">
                <img
                  key={currentQ.imageUrl}
                  src={currentQ.imageUrl}
                  alt="Question Hint Preview"
                  className="max-h-[300px] sm:max-h-[360px] max-w-full w-auto h-auto object-contain rounded-lg mx-auto block shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const errorEl = document.getElementById('img-preview-error');
                    if (errorEl) errorEl.classList.remove('hidden');
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                    const errorEl = document.getElementById('img-preview-error');
                    if (errorEl) errorEl.classList.add('hidden');
                  }}
                />
                <div
                  id="img-preview-error"
                  className="hidden flex-col items-center justify-center text-center p-4 text-zinc-400"
                >
                  <AlertCircle className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-xs font-semibold text-zinc-200">Unable to load image preview</span>
                  <span className="text-[11px] text-zinc-500">Please check that the image URL is valid and publicly accessible.</span>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-800/80 rounded-xl p-4 text-center">
                <span className="text-[11px] text-zinc-500">
                  No image attached. Upload a file or paste any image link above to add a visual hint for this question.
                </span>
              </div>
            )}
          </Card>

          {/* Answer Options & Correct Selector */}
          <Card className="border-zinc-800 bg-zinc-900/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Answer Options
              </span>
              <span className="text-[11px] text-zinc-500">
                Click mark on the correct answer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {OPTION_THEMES.map((theme, optIdx) => {
                const isSelectedCorrect = currentQ.correctOptionIndex === optIdx;
                const Icon = theme.icon;

                return (
                  <div
                    key={optIdx}
                    className={`relative rounded-xl p-3.5 border transition ${
                      isSelectedCorrect
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : 'border-zinc-800 bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md ${theme.bg} flex items-center justify-center`}>
                          <Icon className="w-3.5 h-3.5 fill-white text-white" />
                        </div>
                        <span className="text-xs font-medium text-zinc-400">
                          {theme.label}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateCurrentQuestion({ correctOptionIndex: optIdx })}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                          isSelectedCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isSelectedCorrect ? 'Correct' : 'Mark'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={currentQ.options[optIdx] || ''}
                      onChange={(e) => {
                        const newOpts = [...currentQ.options];
                        newOpts[optIdx] = e.target.value;
                        updateCurrentQuestion({ options: newOpts });
                      }}
                      placeholder={`Option ${optIdx + 1}...`}
                      className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-zinc-500 rounded-lg px-3 py-2 text-sm font-medium text-white placeholder-zinc-600 focus:outline-none transition"
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default QuizEditor;
