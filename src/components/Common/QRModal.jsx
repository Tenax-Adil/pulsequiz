import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

export function QRModal({ isOpen, onClose, roomCode }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !roomCode) return null;

  const joinUrl = `${window.location.origin}/?code=${roomCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-black text-white tracking-tight mb-2">
          Join with Phone Camera
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Scan this QR code to jump straight into the room without typing the code!
        </p>

        <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mb-6">
          <QRCodeSVG
            value={joinUrl}
            size={220}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mb-6">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">
            Room Code
          </div>
          <div className="text-4xl font-extrabold tracking-widest text-indigo-400 font-mono">
            {roomCode}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Copied Link!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Direct Link
              </>
            )}
          </button>

          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition flex items-center justify-center"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
