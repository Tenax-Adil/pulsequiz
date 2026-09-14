import React, { useState } from 'react';
import {
  Users,
  QrCode,
  Play,
  Bot,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Zap,
  Volume2
} from 'lucide-react';
import { QRModal } from '../Common/QRModal.jsx';
import { botSimulator } from '../../services/mockBots.js';
import { soundFx } from '../../services/audio.js';

export function HostLobby({ room, onStartQuiz, onCancelRoom }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spawningBots, setSpawningBots] = useState(false);

  const players = room?.players ? Object.values(room.players) : [];
  const playerCount = players.length;

  const joinUrl = `${window.location.origin}/?code=${room.roomCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpawnBots = async (count) => {
    setSpawningBots(true);
    try {
      await botSimulator.spawnBots(room.roomCode, count);
    } finally {
      setSpawningBots(false);
    }
  };

  const handleClearBots = () => {
    botSimulator.clearBots();
  };

  const handleStartGame = () => {
    soundFx.playCorrect();
    onStartQuiz();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-5rem)] justify-between">
      {/* Top Bar: Title & QR Code / Copy Quick Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-6 rounded-3xl backdrop-blur-md">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Lobby &bull; {room.questions?.length || 0} Questions Ready
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {room.title || 'Live Interactive Quiz'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Join QR</span>
          </button>

          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Copied Code!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" /> Copy PIN
              </>
            )}
          </button>
        </div>
      </div>

      {/* Center Stage: Huge Kahoot 6-digit Room PIN Display */}
      <div className="my-8 text-center">
        <span className="text-sm uppercase font-extrabold tracking-widest text-slate-400 block mb-2">
          Join at <span className="text-indigo-400 underline font-mono">{window.location.host}</span> with Game PIN:
        </span>

        <div
          onClick={copyCode}
          className="inline-flex items-center justify-center bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border-2 border-indigo-500/50 rounded-3xl px-8 sm:px-16 py-6 sm:py-8 shadow-2xl shadow-indigo-500/20 cursor-pointer hover:border-indigo-400 hover:scale-[1.02] transition"
        >
          <span className="text-6xl sm:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 font-mono select-all">
            {room.roomCode}
          </span>
        </div>

        {/* Dynamic Participant Counter */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-5 py-2.5 rounded-full">
            <Users className="w-5 h-5 text-pink-400" />
            <span className="text-lg font-black text-white">{playerCount}</span>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              {playerCount === 1 ? 'Player Joined' : 'Players Joined'}
            </span>
          </div>

          {/* Quick 200-Player Load Testing Simulator Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-full">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-indigo-400" /> Sim:
            </span>
            <button
              onClick={() => handleSpawnBots(10)}
              disabled={spawningBots}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              +10
            </button>
            <button
              onClick={() => handleSpawnBots(50)}
              disabled={spawningBots}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              +50
            </button>
            <button
              onClick={() => handleSpawnBots(200)}
              disabled={spawningBots}
              className="px-2.5 py-1 rounded-full bg-indigo-900/50 hover:bg-indigo-800 text-xs font-extrabold text-indigo-300 hover:text-white transition cursor-pointer"
            >
              +200
            </button>
          </div>
        </div>
      </div>

      {/* Participant List (Adaptive Grid) */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 mb-8 flex-1 min-h-[160px] max-h-[300px] overflow-y-auto">
        {playerCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3 animate-pulse">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-300">
              Waiting for players to enter the PIN...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Share the room code or click &quot;+10 Sim&quot; to test with simulated participants
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 justify-center">
            {players.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/70 px-4 py-2 rounded-2xl shadow-sm animate-fade-in hover:border-indigo-500/50 transition"
              >
                <span className="text-lg">{p.avatar || '⚡'}</span>
                <span className="text-sm font-bold text-white tracking-wide">
                  {p.nickname}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Host Launch Control */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <button
          onClick={onCancelRoom}
          className="text-xs font-bold text-slate-500 hover:text-rose-400 transition cursor-pointer"
        >
          Cancel & Exit Room
        </button>

        <button
          onClick={handleStartGame}
          disabled={playerCount === 0}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-6 h-6 fill-white" />
          <span>Start Quiz ({playerCount})</span>
        </button>
      </div>

      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        roomCode={room.roomCode}
      />
    </div>
  );
}
