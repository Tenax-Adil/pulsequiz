import React, { useState } from 'react';
import {
  Users,
  QrCode,
  Play,
  Bot,
  Copy,
  Check,
  X,
  UserX,
} from 'lucide-react';
import { QRModal } from '../Common/QRModal.jsx';
import { botSimulator } from '../../services/mockBots.js';
import { soundFx } from '../../services/audio.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Card } from '../ui/card.jsx';

export function HostLobby({ room, onStartQuiz, onCancelRoom, onKickPlayer }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spawningBots, setSpawningBots] = useState(false);

  const players = room?.players
    ? Object.entries(room.players).map(([id, p]) => ({ id: p.id || id, ...p }))
    : [];
  const playerCount = players.length;

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

  const handleStartGame = () => {
    soundFx.playCorrect();
    onStartQuiz();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-5rem)] justify-between animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Lobby Stage &bull; {room.questions?.length || 0} Questions
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {room.title || 'Live Quiz'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(true)}
            className="border-zinc-800 text-zinc-300 h-9"
          >
            <QrCode className="w-4 h-4 mr-1.5 text-zinc-400" />
            <span>QR Code</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="border-zinc-800 text-zinc-300 h-9"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5 text-zinc-400" />
                <span>Copy PIN</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Center Stage: Clean, High-Contrast 6-digit PIN */}
      <div className="my-8 text-center">
        <span className="text-xs uppercase font-semibold tracking-widest text-zinc-400 block mb-2">
          Join at <span className="text-zinc-200 font-mono font-bold">{window.location.host}</span> with Game PIN:
        </span>

        <div
          onClick={copyCode}
          className="inline-flex items-center justify-center bg-zinc-900/90 border border-zinc-700/80 rounded-2xl px-8 sm:px-14 py-5 sm:py-7 shadow-xl cursor-pointer hover:border-zinc-500 transition active:scale-[0.99]"
        >
          <span className="text-5xl sm:text-7xl font-mono font-bold tracking-widest text-white select-all">
            {room.roomCode}
          </span>
        </div>

        {/* Participant Counter & Simulator */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Badge variant="secondary" className="gap-2 px-3 py-1.5 bg-zinc-900 border-zinc-800 text-sm font-semibold">
            <Users className="w-4 h-4 text-zinc-400" />
            <span className="font-mono text-white">{playerCount}</span>
            <span className="text-zinc-400 text-xs font-normal">
              {playerCount === 1 ? 'Player Joined' : 'Players Joined'}
            </span>
          </Badge>

          {/* Bot simulator */}
          <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 p-1 rounded-lg">
            <span className="text-[11px] text-zinc-400 px-2 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> Test:
            </span>
            <button
              onClick={() => handleSpawnBots(10)}
              disabled={spawningBots}
              className="px-2 py-0.5 rounded text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              +10
            </button>
            <button
              onClick={() => handleSpawnBots(50)}
              disabled={spawningBots}
              className="px-2 py-0.5 rounded text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              +50
            </button>
            <button
              onClick={() => handleSpawnBots(200)}
              disabled={spawningBots}
              className="px-2 py-0.5 rounded text-xs font-mono font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              +200
            </button>
          </div>
        </div>
      </div>

      {/* Participant List */}
      <Card className="border-zinc-800/80 bg-zinc-900/50 p-5 mb-6 flex-1 min-h-[140px] max-h-[260px] overflow-y-auto">
        {playerCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6">
            <Users className="w-8 h-8 text-zinc-600 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-zinc-400">
              Waiting for players to connect...
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">
              Share the room PIN or use the test button above
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((p, idx) => (
              <div
                key={p.id || idx}
                className="group relative flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-red-500/40 pl-3 pr-2 py-1.5 rounded-xl shadow-sm text-xs font-medium text-zinc-200 transition animate-fade-in"
              >
                <span>{p.avatar || '⚡'}</span>
                <span className="max-w-[120px] truncate">{p.nickname}</span>
                {onKickPlayer && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Kick "${p.nickname}" from this quiz room?`)) {
                        onKickPlayer(p.id);
                      }
                    }}
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-500/15 p-0.5 rounded-md transition cursor-pointer"
                    title={`Kick ${p.nickname}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bottom Host Launch Control */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancelRoom}
          className="text-xs text-zinc-500 hover:text-red-400"
        >
          Cancel &amp; Exit Room
        </Button>

        <Button
          size="lg"
          onClick={handleStartGame}
          disabled={playerCount === 0}
          className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold px-8 shadow-sm h-11"
        >
          <Play className="w-4 h-4 fill-zinc-950 mr-2" />
          <span>Start Quiz ({playerCount})</span>
        </Button>
      </div>

      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        roomCode={room.roomCode}
      />
    </div>
  );
}

export default HostLobby;
