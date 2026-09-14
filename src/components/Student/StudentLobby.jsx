import React from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';
import { Card } from '../ui/card.jsx';

export function StudentLobby({ room, player, onLeave }) {
  return (
    <div className="max-w-md w-full mx-auto px-4 py-10 flex flex-col items-center justify-between min-h-[calc(100vh-6rem)] text-center animate-fade-in-up">
      {/* Top Banner */}
      <Card className="w-full border-zinc-800 bg-zinc-900/80 p-3.5 flex items-center justify-between">
        <div className="text-left">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block">
            PIN {room.roomCode}
          </span>
          <span className="text-xs font-semibold text-zinc-200 truncate block max-w-[200px]">
            {room.title}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeave}
          className="h-8 w-8 text-zinc-400 hover:text-red-400"
          title="Leave Game"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </Card>

      {/* Main Waiting View */}
      <div className="my-8 flex flex-col items-center">
        {/* Avatar Presentation */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-4xl shadow-md">
            {player?.avatar || '⚡'}
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
          {player?.nickname}
        </h3>

        <Badge variant="success" className="gap-1.5 px-3 py-1 mb-4 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Connected to Lobby
        </Badge>

        <p className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-6">
          Look at the presenter screen to see your name. Get ready to answer questions quickly for speed points.
        </p>

        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-full shadow-inner">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          <span>Waiting for host to start...</span>
        </div>
      </div>

      <div className="text-[11px] text-zinc-500 font-mono">
        Room PIN: {room.roomCode}
      </div>
    </div>
  );
}

export default StudentLobby;
