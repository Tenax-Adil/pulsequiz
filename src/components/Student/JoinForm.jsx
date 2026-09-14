import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, User, Hash, Sparkles, RefreshCw } from 'lucide-react';

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
    <div className="max-w-md w-full mx-auto px-4 py-8">
      {/* Reconnection alert banner if student disconnected */}
      {savedSession && savedSession.roomCode && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 p-4 rounded-3xl mb-6 shadow-xl text-center backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-pink-400" /> Active Session Found
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Resume as <span className="font-bold text-white">{savedSession.nickname}</span> in PIN{' '}
            <span className="font-mono font-bold text-indigo-400">{savedSession.roomCode}</span>?
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onReconnect(savedSession)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Rejoin Room
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('pulse_student_session');
                window.location.reload();
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs rounded-xl transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Join Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 p-0.5 shadow-xl shadow-pink-500/20 mx-auto mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-7 h-7 text-pink-400 fill-pink-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Join Live Game
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the 6-digit game PIN shown on the host screen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room PIN Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Game PIN
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-3.5 px-4 text-center text-3xl font-mono font-black tracking-widest text-indigo-400 placeholder-slate-700 focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Your Nickname
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={18}
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. SpeedRacer"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl py-3.5 px-4 text-white text-base font-bold placeholder-slate-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`w-full aspect-square rounded-xl text-xl flex items-center justify-center transition cursor-pointer ${
                    selectedAvatar === emoji
                      ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110 shadow-lg'
                      : 'bg-slate-950 hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/50 rounded-2xl text-rose-300 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-lg shadow-xl shadow-purple-600/30 transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Enter Lobby</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
