import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { uploadQuestionImage } from '../../services/storage.js';
import { OPTION_THEMES } from '../Common/AnswerButton.jsx';

export function QuizEditor({ initialQuiz, onStartRoom, onBack, onOpenAIGenerator }) {
  const [title, setTitle] = useState(initialQuiz?.title || 'My Interactive Live Quiz');
  const [questions, setQuestions] = useState(
    initialQuiz?.questions || [
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

  const currentQ = questions[activeQuestionIdx] || questions[0];

  const updateCurrentQuestion = (updates) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === activeQuestionIdx ? { ...q, ...updates } : q))
    );
  };

  const handleAddQuestion = () => {
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
      updateCurrentQuestion({ imageUrl: res.url });
    } catch (err) {
      alert(err.message || 'Failed to process image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLaunch = () => {
    // Validate
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Quiz Creator Studio
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Quiz Title..."
              className="text-2xl sm:text-3xl font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition block"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenAIGenerator}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-bold text-sm shadow-md shadow-orange-500/20 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>

          <button
            onClick={handleLaunch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" /> Launch Live Lobby
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Question Timeline */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions ({questions.length})
            </span>
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`group relative p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  activeQuestionIdx === idx
                    ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium truncate">
                    {q.text || 'Untitled Question'}
                  </span>
                </div>

                {questions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(idx);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={handleAddQuestion}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </div>

        {/* Right Main Editor Canvas */}
        <div className="lg:col-span-9 space-y-6">
          {/* Question Text & Time Limit Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Question {activeQuestionIdx + 1} of {questions.length}
              </span>

              {/* Timer Limit Controller */}
              <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">Time Limit:</span>
                <select
                  value={currentQ.timeLimit}
                  onChange={(e) =>
                    updateCurrentQuestion({ timeLimit: parseInt(e.target.value, 10) })
                  }
                  className="bg-transparent text-sm font-black text-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 Seconds</option>
                  <option value={15}>15 Seconds</option>
                  <option value={20}>20 Seconds</option>
                  <option value={30}>30 Seconds</option>
                  <option value={45}>45 Seconds</option>
                  <option value={60}>60 Seconds</option>
                </select>
              </div>
            </div>

            <textarea
              rows={2}
              value={currentQ.text}
              onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
              placeholder="Type your question here (e.g. Which planet is closest to the Sun?)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-4 text-lg sm:text-xl font-bold text-white placeholder-slate-600 focus:outline-none transition resize-none"
            />
          </div>

          {/* Media Attachment: Drag-and-drop or URL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" /> Question Image Attachment (Optional)
              </label>
              {currentQ.imageUrl && (
                <button
                  onClick={() => updateCurrentQuestion({ imageUrl: '' })}
                  className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Remove Image
                </button>
              )}
            </div>

            {currentQ.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden max-h-56 bg-black border border-slate-800 group">
                <img
                  src={currentQ.imageUrl}
                  alt="Question Attachment"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition">
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                    />
                  </label>
                  <button
                    onClick={() => updateCurrentQuestion({ imageUrl: '' })}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-6 text-center transition">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer transition mb-2">
                    {uploadingImage ? 'Processing...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Supports JPG, PNG, WebP with Cloudinary, S3, or local compression
                  </span>

                  {/* Or image URL input */}
                  <div className="mt-4 w-full max-w-md">
                    <input
                      type="text"
                      placeholder="Or paste an image URL directly..."
                      value={currentQ.imageUrl}
                      onChange={(e) => updateCurrentQuestion({ imageUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4 Kahoot Options & Correct Answer Toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Answer Options & Correct Answer Selector
              </span>
              <span className="text-[11px] text-slate-400">
                Click the checkmark on the correct answer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OPTION_THEMES.map((theme, optIdx) => {
                const isSelectedCorrect = currentQ.correctOptionIndex === optIdx;
                const Icon = theme.icon;

                return (
                  <div
                    key={optIdx}
                    className={`relative rounded-2xl p-4 border-2 transition ${
                      isSelectedCorrect
                        ? 'border-emerald-400 bg-emerald-950/20'
                        : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${theme.bg} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 fill-white text-white" />
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          {theme.label} ({theme.shape})
                        </span>
                      </div>

                      {/* Correct answer toggle badge */}
                      <button
                        type="button"
                        onClick={() => updateCurrentQuestion({ correctOptionIndex: optIdx })}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          isSelectedCorrect
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isSelectedCorrect ? 'Correct' : 'Mark Correct'}</span>
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
                      placeholder={`Choice ${optIdx + 1}...`}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-base font-bold text-white placeholder-slate-600 focus:outline-none transition"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
