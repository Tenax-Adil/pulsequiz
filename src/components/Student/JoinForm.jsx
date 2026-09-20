import React, { useState, useEffect, useMemo } from 'react';
import { Zap, ArrowRight, Globe, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { joinGeoRoom } from '../../services/geoFirebase.js';

const CLASSIC_AVATARS = ['🚀', '⚡', '🔥', '🦊', '🤖', '👾', '🌟', '🦄', '🎯', '🎸', '🕹️', '💎'];
const GEO_AVATARS = ['🌍', '🧭', '🗺️', '📍', '🏔️', '🗼', '⛩️', '🏛️', '🗽', '🏖️', '🌋', '🚀'];

export function JoinForm({ initialCode = '', onJoin, onReconnect, savedSession }) {
  const [quizType, setQuizType] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode') || searchParams.get('type');
      if (mode === 'geo' || mode === 'geoguessr') return 'geo';

      const hash = window.location.hash;
      if (hash.includes('mode=geo') || hash.includes('type=geo') || hash.includes('geoguessr')) {
        return 'geo';
      }
    } catch { /* ignore */ }
    return 'classic';
  });

  const [roomCode, setRoomCode] = useState(initialCode || '');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(quizType === 'geo' ? GEO_AVATARS[0] : CLASSIC_AVATARS[0]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for saved geo player session
  const savedGeoSession = useMemo(() => {
    try {
      const raw = localStorage.getItem('pulse_geo_player');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }, []);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode);
    }
  }, [initialCode]);

  const handleSelectQuizType = (type) => {
    setQuizType(type);
    setError(null);
    if (type === 'geo') {
      if (!GEO_AVATARS.includes(selectedAvatar)) {
        setSelectedAvatar(GEO_AVATARS[0]);
      }
    } else {
      if (!CLASSIC_AVATARS.includes(selectedAvatar)) {
        setSelectedAvatar(CLASSIC_AVATARS[0]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanCode = roomCode.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setError('Please enter a valid 6-digit PIN');
      return;
    }

    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setError('Please enter a nickname');
      return;
    }

    if (quizType === 'geo') {
      setIsSubmitting(true);
      const geoId = `geo_p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const playerData = {
        id: geoId,
        nickname: cleanNick,
        avatar: selectedAvatar,
        roomCode: cleanCode,
      };

      try {
        localStorage.setItem('pulse_geo_player', JSON.stringify(playerData));
        await joinGeoRoom(cleanCode, {
          id: geoId,
          nickname: cleanNick,
          avatar: selectedAvatar,
        });
      } catch (err) {
        console.warn('Direct joinGeoRoom note:', err);
      } finally {
        setIsSubmitting(false);
      }

      window.location.hash = `#/player/buzzer?code=${cleanCode}`;
      return;
    }

    onJoin({
      roomCode: cleanCode,
      nickname: cleanNick,
      avatar: selectedAvatar,
      quizType: 'classic',
    });
  };

  const isGeo = quizType === 'geo';
  const currentAvatars = isGeo ? GEO_AVATARS : CLASSIC_AVATARS;

  return (
    <div className="max-w-md w-full mx-auto px-4 py-6 animate-fade-in-up">
      {/* 2 Options Segmented Tabs: Classic Quiz vs Geo Quiz */}
      <div className="flex rounded-xl bg-zinc-900/90 p-1 border border-zinc-800 mb-6 shadow-sm">
        <button
          type="button"
          onClick={() => handleSelectQuizType('classic')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            !isGeo
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Classic Quiz</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectQuizType('geo')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isGeo
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Geo Quiz</span>
        </button>
      </div>

      {/* Active Session Reconnect Alert */}
      {!isGeo && savedSession?.roomCode && (
        <Card className="border-zinc-800 bg-zinc-900/90 p-3.5 mb-5 text-center">
          <p className="text-xs text-zinc-300 mb-2.5">
            Resume as <span className="font-semibold text-white">{savedSession.nickname}</span> in PIN{' '}
            <span className="font-mono font-semibold text-zinc-100">{savedSession.roomCode}</span>?
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => onReconnect(savedSession)}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 h-8 text-xs font-semibold cursor-pointer"
            >
              Rejoin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('pulse_student_session');
                window.location.reload();
              }}
              className="border-zinc-800 text-zinc-400 h-8 text-xs cursor-pointer"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {isGeo && savedGeoSession?.roomCode && (
        <Card className="border-zinc-800 bg-zinc-900/90 p-3.5 mb-5 text-center">
          <p className="text-xs text-zinc-300 mb-2.5">
            Resume buzzer as <span className="font-semibold text-white">{savedGeoSession.nickname}</span> in PIN{' '}
            <span className="font-mono font-semibold text-zinc-100">{savedGeoSession.roomCode}</span>?
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => {
                window.location.hash = `#/player/buzzer?code=${savedGeoSession.roomCode}`;
              }}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 h-8 text-xs font-semibold cursor-pointer"
            >
              Rejoin
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('pulse_geo_player');
                window.location.reload();
              }}
              className="border-zinc-800 text-zinc-400 h-8 text-xs cursor-pointer"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Main Join Card */}
      <Card className="border-zinc-800 bg-zinc-900/80 shadow-xl backdrop-blur-xl">
        <CardHeader className="text-center pb-4 pt-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-750 flex items-center justify-center mx-auto mb-3 shadow-sm">
            {isGeo ? (
              <Globe className="w-5 h-5 text-amber-400" />
            ) : (
              <Zap className="w-5 h-5 text-zinc-200" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            {isGeo ? 'Join Geo Quiz' : 'Join Classic Quiz'}
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400 mt-1">
            Enter the 6-digit PIN to enter the game
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PIN Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                PIN
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
                className="text-center text-2xl font-mono font-bold tracking-widest text-zinc-100 placeholder:text-zinc-700 h-12"
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
                placeholder="Your name"
                className="h-11 text-zinc-100 placeholder:text-zinc-600 font-medium"
              />
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {currentAvatars.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`w-full aspect-square rounded-xl text-lg flex items-center justify-center transition cursor-pointer border ${
                      selectedAvatar === emoji
                        ? 'bg-zinc-800 border-zinc-400 scale-105 shadow-sm text-xl'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700'
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
              disabled={isSubmitting}
              className={`w-full font-bold h-12 mt-2 shadow-sm text-sm cursor-pointer transition flex items-center justify-center gap-2 ${
                isGeo
                  ? 'bg-amber-500 hover:bg-amber-400 text-black font-black'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-950'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Join Game</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default JoinForm;
