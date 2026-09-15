import React, { useState, useEffect } from 'react';
import { X, Key, Database, Cloud, Check, Sparkles, Lock } from 'lucide-react';
import { isFirebaseLive } from '../../services/firebase.js';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Badge } from '../ui/badge.jsx';

export function ConfigModal({ isOpen, onClose }) {
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseDbUrl, setFirebaseDbUrl] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [imgbbKey, setImgbbKey] = useState('');
  const [cloudinaryCloud, setCloudinaryCloud] = useState('');
  const [cloudinaryPreset, setCloudinaryPreset] = useState('');
  const [hostPassword, setHostPassword] = useState('admin123');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setGeminiKey(localStorage.getItem('pulse_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
    setImgbbKey(localStorage.getItem('pulse_imgbb_api_key') || import.meta.env.VITE_IMGBB_API_KEY || '');
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
    if (geminiKey.trim()) {
      localStorage.setItem('pulse_gemini_key', geminiKey.trim());
    } else {
      localStorage.removeItem('pulse_gemini_key');
    }

    if (imgbbKey.trim()) {
      localStorage.setItem('pulse_imgbb_api_key', imgbbKey.trim());
    } else {
      localStorage.removeItem('pulse_imgbb_api_key');
    }

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
      window.location.reload();
    }, 800);
  };

  const isLive = isFirebaseLive();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl my-8 text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Host Settings &amp; API Keys
            </h3>
            <p className="text-xs text-zinc-400">
              Configure backend credentials, AI keys, and presenter password
            </p>
          </div>
        </div>

        {/* Realtime Status Banner */}
        <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 mb-5 flex items-start gap-2.5 text-xs">
          <div className="mt-0.5">
            <span className={`w-2 h-2 rounded-full inline-block ${isLive ? 'bg-emerald-400' : 'bg-blue-400'}`} />
          </div>
          <div>
            <span className="font-semibold text-zinc-200 block">
              {isLive ? 'Connected: Firebase Realtime Database' : 'Active: Instant Local Broadcast Sync'}
            </span>
            <span className="text-zinc-400 text-[11px]">
              {isLive
                ? 'Cloud synchronization active across different networks and devices.'
                : 'Zero-config local multi-tab sync active.'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Section 1: Google Gemini AI */}
          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
              >
                Get Key
              </a>
            </div>
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="h-9 font-mono text-xs"
            />
          </div>

          {/* Section 2: Firebase Realtime Database */}
          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-400" /> Firebase Realtime Database
              </label>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
              >
                Console
              </a>
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Database URL (e.g. https://...firebaseio.com)"
                value={firebaseDbUrl}
                onChange={(e) => setFirebaseDbUrl(e.target.value)}
                className="h-9 font-mono text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="password"
                  placeholder="API Key"
                  value={firebaseApiKey}
                  onChange={(e) => setFirebaseApiKey(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
                <Input
                  type="text"
                  placeholder="Project ID"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section: ImgBB Free Image Hosting */}
          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-zinc-400" /> ImgBB Free Image Hosting (Optional)
              </label>
              <a
                href="https://api.imgbb.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
              >
                Get Free Key
              </a>
            </div>
            <Input
              type="password"
              placeholder="Paste your ImgBB API key here..."
              value={imgbbKey}
              onChange={(e) => setImgbbKey(e.target.value)}
              className="h-9 font-mono text-xs"
            />
            <span className="text-[11px] text-zinc-500 block mt-1">
              Preserves 100% full original resolution and exact aspect ratio on high-speed CDN.
            </span>
          </div>

          {/* Section 3: Host Passcode */}
          <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" /> Host Passcode
            </label>
            <Input
              type="text"
              placeholder="admin123"
              value={hostPassword}
              onChange={(e) => setHostPassword(e.target.value)}
              className="h-9 font-mono text-xs"
            />
            <span className="text-[11px] text-zinc-500 block mt-1">
              Protects host studio from student access
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-zinc-800 text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 mr-1 text-emerald-600" /> Saved!
              </>
            ) : (
              'Save & Apply'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfigModal;
