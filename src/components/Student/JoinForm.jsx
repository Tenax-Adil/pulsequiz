import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, User, Hash, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Badge } from '../ui/badge.jsx';

const AVATARS = ['🚀', '⚡', '🔥', '🦊', '🤖', '👾', '🌟', '🦄', '🎯', '🎸', '🕹️', '💎'];

export function JoinForm({ initialCode = '', onJoin, onReconnect, savedSession }) {
  const [roomCode, setRoomCode] = useState(initialCode || '');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const cleanCode = roomCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-digit Room PIN');
      return;
    }

    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setError('Please choose a nickname');
      return;
    }

    onJoin({
      roomCode: cleanCode,
      nickname: cleanNick,
      avatar: selectedAvatar,
    });
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 animate-fade-in-up">
      {/* Reconnection alert banner if student disconnected */}
      {savedSession && savedSession.roomCode && (
        <Card className="border-zinc-800 bg-zinc-900/90 p-4 mb-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-zinc-300 text-xs font-semibold mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" /> Active Session Found
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Resume as <span className="font-semibold text-zinc-100">{savedSession.nickname}</span> in PIN{' '}
            <span className="font-mono font-semibold text-zinc-200">{savedSession.roomCode}</span>?
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => onReconnect(savedSession)}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 h-8"
            >
              Rejoin Room
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('pulse_student_session');
                window.location.reload();
              }}
              className="border-zinc-800 h-8"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Main Join Card - Clean Shadcn Aesthetic */}
      <Card className="border-zinc-800 bg-zinc-900/80 shadow-xl backdrop-blur-xl">
        <CardHeader className="text-center pb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Zap className="w-5 h-5 text-zinc-200 fill-zinc-200" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Join Quiz Game
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400 mt-1">
            Enter the 6-digit PIN displayed on the host screen
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Room PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Room PIN
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl font-mono font-bold tracking-widest text-zinc-100 placeholder:text-zinc-600 h-12"
              />
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Nickname
              </label>
              <Input
                type="text"
                maxLength={18}
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Alex"
                className="h-11 text-zinc-100 placeholder:text-zinc-600 font-medium"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Player Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`w-full aspect-square rounded-xl text-lg flex items-center justify-center transition cursor-pointer border ${
                      selectedAvatar === emoji
                        ? 'bg-zinc-800 border-zinc-400 scale-105 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-850 hover:border-zinc-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-xs font-medium text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold h-12 mt-2 shadow-sm text-sm"
            >
              <span>Join Game</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default JoinForm;
