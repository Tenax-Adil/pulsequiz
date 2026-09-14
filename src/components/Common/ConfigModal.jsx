import React, { useState, useEffect } from 'react';
import { X, Key, Database, Cloud, Check, Sparkles, AlertCircle, Lock } from 'lucide-react';
import { isFirebaseLive } from '../../services/firebase.js';

export function ConfigModal({ isOpen, onClose }) {
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseDbUrl, setFirebaseDbUrl] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [cloudinaryCloud, setCloudinaryCloud] = useState('');
  const [cloudinaryPreset, setCloudinaryPreset] = useState('');
  const [hostPassword, setHostPassword] = useState('admin123');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load from localStorage or env
    setGeminiKey(localStorage.getItem('pulse_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
    setCloudinaryCloud(localStorage.getItem('pulse_cloudinary_cloud') || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '');
    setCloudinaryPreset(localStorage.getItem('pulse_cloudinary_preset') || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '');
    setHostPassword(localStorage.getItem('pulse_host_password') || import.meta.env.VITE_HOST_PASSWORD || 'admin123');

    try {
      const fb = JSON.parse(localStorage.getItem('pulse_firebase_config') || '{}');
      setFirebaseApiKey(fb.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '');
      setFirebaseDbUrl(fb.databaseURL || import.meta.env.VITE_FIREBASE_DATABASE_URL || '');
      setFirebaseProjectId(fb.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '');
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Save Gemini Key
    if (geminiKey.trim()) {
      localStorage.setItem('pulse_gemini_key', geminiKey.trim());
    } else {
      localStorage.removeItem('pulse_gemini_key');
    }

    // Save Cloudinary
    if (cloudinaryCloud.trim()) {
      localStorage.setItem('pulse_cloudinary_cloud', cloudinaryCloud.trim());
    } else {
      localStorage.removeItem('pulse_cloudinary_cloud');
    }

    if (cloudinaryPreset.trim()) {
      localStorage.setItem('pulse_cloudinary_preset', cloudinaryPreset.trim());
    } else {
      localStorage.removeItem('pulse_cloudinary_preset');
    }

    if (hostPassword.trim()) {
      localStorage.setItem('pulse_host_password', hostPassword.trim());
    } else {
      localStorage.setItem('pulse_host_password', 'admin123');
    }

    // Save Firebase config
    if (firebaseApiKey.trim() && firebaseDbUrl.trim()) {
      const fbConfig = {
        apiKey: firebaseApiKey.trim(),
        databaseURL: firebaseDbUrl.trim(),
        projectId: firebaseProjectId.trim() || undefined,
      };
      localStorage.setItem('pulse_firebase_config', JSON.stringify(fbConfig));
    } else {
      localStorage.removeItem('pulse_firebase_config');
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      // Reload window if Firebase config changed to initialize real Firebase client
      window.location.reload();
    }, 800);
  };

  const isLive = isFirebaseLive();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              API & Cloud Services
            </h3>
            <p className="text-xs text-slate-400">
              Configure managed cloud integrations or run with instant local sync
            </p>
          </div>
        </div>

        {/* Realtime Status Banner */}
        <div className={`p-4 rounded-2xl border mb-6 flex items-start gap-3 ${
          isLive
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
        }`}>
          <div className="mt-0.5">
            {isLive ? <Check className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-5 h-5 text-indigo-400" />}
          </div>
          <div className="text-xs leading-relaxed">
            <span className="font-bold block mb-0.5">
              Active Sync Mode: {isLive ? 'Live Firebase Realtime Database' : 'Instant Zero-Config Realtime Sync'}
            </span>
            {isLive
              ? 'Connected to your cloud Firebase database. Up to 200 simultaneous users can join from any network.'
              : 'Zero setup required! Syncs Host and Student tabs across browser windows seamlessly.'}
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Google Gemini AI */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Free Key
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-xs text-slate-400 mt-2">
              Enables 1-click AI quiz generation with Gemini 2.0 / 1.5 JSON structured mode.
            </p>
          </div>

          {/* Section 2: Firebase Realtime Database */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> Firebase Realtime Database
              </label>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Firebase Console
              </a>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Database URL (e.g. https://my-quiz-rtdb.firebaseio.com)"
                value={firebaseDbUrl}
                onChange={(e) => setFirebaseDbUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  placeholder="Firebase API Key"
                  value={firebaseApiKey}
                  onChange={(e) => setFirebaseApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <input
                  type="text"
                  placeholder="Project ID (optional)"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cloudinary / Image Storage */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <label className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Cloud className="w-4 h-4 text-sky-400" /> Cloudinary Media Storage (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Cloud Name"
                value={cloudinaryCloud}
                onChange={(e) => setCloudinaryCloud(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <input
                type="text"
                placeholder="Upload Preset"
                value={cloudinaryPreset}
                onChange={(e) => setCloudinaryPreset(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              If left blank, questions will automatically use compressed client-side local images or Unsplash URLs.
            </p>
          </div>

          {/* Section 4: Host Passcode Protection */}
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <label className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-purple-400" /> Host Control Passcode
            </label>
            <input
              type="text"
              placeholder="admin123"
              value={hostPassword}
              onChange={(e) => setHostPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-xs text-slate-400 mt-2">
              Secures the presenter dashboard so students cannot access or control quiz rounds.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="w-1/3 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-5 h-5" /> Saved & Reloading...
              </>
            ) : (
              'Save & Apply Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
