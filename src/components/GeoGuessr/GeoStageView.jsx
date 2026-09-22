import React, { useState, useEffect, useMemo } from 'react';
import { useGeoRoomSync } from '../../hooks/useGeoRoomSync.js';
import { GEO_STATES, formatDistance, formatPoints, getRankLabel } from '../../services/geoEngine.js';
import { GeoPanorama } from './GeoPanorama.jsx';
import { GeoLeafletMap } from './GeoLeafletMap.jsx';
import { Globe, MapPin, Trophy, Users, Eye, Crosshair, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * GeoGuessr Stage / Projector View
 * Full-screen, cinematic, dark UI optimized for 1080p/4K projectors.
 * Route: /#/stage/geoguessr?code=XXXX
 */
export function GeoStageView({ roomCode }) {
  const { geoRoom, loading } = useGeoRoomSync(roomCode);
  const [showRevealAnim, setShowRevealAnim] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0); // 0=none, 1=line, 2=distance, 3=points

  const status = geoRoom?.status;
  const locIdx = geoRoom?.currentLocationIndex || 0;
  const currentLoc = geoRoom?.locations?.[locIdx];
  const playersRaw = geoRoom?.players;
  const buzzerQueueRaw = geoRoom?.buzzerQueue;
  const players = playersRaw || {};
  const activePlayerId = geoRoom?.activePlayer;
  const activePlayer = activePlayerId ? players[activePlayerId] : null;
  const mirroredCoords = geoRoom?.mirroredCoords;
  const revealResult = geoRoom?.revealResult;
  const lastFailedGuess = geoRoom?.lastFailedGuess;

  // Sort buzzer queue by timestamp
  const sortedQueue = useMemo(() => {
    if (!buzzerQueueRaw) return [];
    return Object.entries(buzzerQueueRaw)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [buzzerQueueRaw]);

  // Sorted leaderboard
  const leaderboard = useMemo(() => {
    if (!playersRaw) return [];
    return Object.entries(playersRaw)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [playersRaw]);


  // Reveal animation sequence
  useEffect(() => {
    if (status === GEO_STATES.REVEAL && revealResult) {
      setShowRevealAnim(true);
      setRevealPhase(1);
      const t1 = setTimeout(() => setRevealPhase(2), 800);
      const t2 = setTimeout(() => setRevealPhase(3), 1600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setShowRevealAnim(false);
      setRevealPhase(0);
    }
  }, [status, revealResult]);

  // ─── Loading ───────────────────────────────────────────────
  if (loading || !geoRoom) {
    return (
      <div className="geo-stage-fullscreen flex items-center justify-center bg-zinc-950">
        <div className="text-center animate-fade-in-up">
          <Globe className="w-16 h-16 text-zinc-600 mx-auto mb-4 animate-spin" style={{ animationDuration: '3s' }} />
          <h2 className="text-2xl font-bold text-zinc-400">Connecting to GeoGuessr...</h2>
          <p className="text-zinc-600 mt-2 font-mono text-sm">Room: {roomCode}</p>
        </div>
      </div>
    );
  }

  // ─── ROOM CLOSED ───────────────────────────────────────────
  if (status === 'GEO_ROOM_CLOSED') {
    return (
      <div className="geo-stage-fullscreen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6 text-center animate-fade-in-up">
        <Globe className="w-20 h-20 text-zinc-700 mb-6" />
        <h2 className="text-3xl md:text-5xl font-black text-white mb-2">Session Completed</h2>
        <p className="text-lg text-zinc-500 mb-8">This GeoGuessr game room has been closed by the host.</p>
        <button
          onClick={() => { window.location.hash = '#/host'; }}
          className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-300 transition cursor-pointer"
        >
          Exit to Dashboard
        </button>
      </div>
    );
  }

  // ─── LOBBY ─────────────────────────────────────────────────
  if (status === GEO_STATES.LOBBY) {
    return (
      <div className="geo-stage-fullscreen flex flex-col items-center justify-center bg-zinc-950 relative overflow-hidden">
        {/* Background animated globe */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
          <Globe className="w-[600px] h-[600px] animate-spin" style={{ animationDuration: '60s' }} />
        </div>

        <div className="relative z-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">GeoGuessr Finale</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Where in the<br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              World?
            </span>
          </h1>

          <p className="text-xl text-zinc-500 mb-12 max-w-xl mx-auto">
            {geoRoom.locations?.length || 0} locations &bull; Buzzer round &bull; Live scoring
          </p>

          {/* Player roster */}
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto">
            {leaderboard.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-lg">{p.avatar || '🌍'}</span>
                <span className="text-sm font-semibold text-zinc-200">{p.nickname}</span>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="mt-6 text-zinc-500 flex items-center gap-2 justify-center text-sm">
              <Users className="w-4 h-4" />
              <span>Waiting for players to buzz in...</span>
            </div>
          )}

          {/* Join Instructions with QR Code & PIN */}
          <div className="mt-8 flex items-center justify-center gap-6 p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl backdrop-blur-xl max-w-lg mx-auto">
            <div className="p-3 bg-white rounded-2xl shadow-inner">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/#/player/buzzer?code=${roomCode}`}
                size={110}
                level="M"
              />
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest block mb-1">
                Scan to Buzz In
              </span>
              <p className="text-xs text-zinc-400 mb-2">
                Or visit <span className="text-zinc-200 font-mono font-medium">{typeof window !== 'undefined' ? window.location.host : 'PulseQuiz'}</span>
              </p>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Game PIN</div>
              <div className="text-4xl font-black text-white tracking-widest font-mono">
                {roomCode}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ─── PANORAMA ──────────────────────────────────────────────
  if (status === GEO_STATES.PANORAMA) {
    return (
      <div className="geo-stage-fullscreen relative bg-zinc-950">
        {/* Full-screen panorama */}
        <div className="absolute inset-0">
          <GeoPanorama
            panoramaUrl={currentLoc?.panoramaUrl}
            viewpoints={currentLoc?.viewpoints}
            location={currentLoc}
            autoRotate={false}
            showControls={true}
          />
        </div>

        {/* Bottom overlay: location progress + clue */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold border border-amber-500/30">
                Location {locIdx + 1} / {geoRoom.locations?.length || 0}
              </span>
              <Eye className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-400 text-sm">Explore the panorama and buzz in when you know the location!</span>
            </div>
            {currentLoc?.clue && (
              <p className="text-lg text-zinc-300 italic">"{currentLoc.clue}"</p>
            )}
          </div>
        </div>

        {/* Top overlay: buzzer status */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-zinc-200">Buzzers Open</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm">
              <Users className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">{Object.keys(players).length} players</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAP VIEWS (BUZZER_LOCKED, HOST_MIRROR, REVEAL) ────────
  const isMapView = [GEO_STATES.BUZZER_LOCKED, GEO_STATES.HOST_MIRROR, GEO_STATES.REVEAL].includes(status);

  if (isMapView) {
    return (
      <div className="geo-stage-fullscreen relative bg-zinc-950">
        {/* Full-screen map */}
        <div className="absolute inset-0">
          <GeoLeafletMap
            correctCoords={currentLoc ? { lat: currentLoc.lat, lon: currentLoc.lon } : null}
            showCorrectPin={status === GEO_STATES.REVEAL}
            mirroredCoords={mirroredCoords}
            revealLine={status === GEO_STATES.REVEAL && showRevealAnim}
            interactive={false}
          />
        </div>

        {/* Active player banner */}
        {activePlayer && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 animate-fade-in-up">
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-700 backdrop-blur-md shadow-xl">
              <Crosshair className="w-5 h-5 text-amber-400" />
              <span className="text-lg font-bold text-white">
                {activePlayer.avatar} {activePlayer.nickname}
              </span>
              <span className="text-sm text-zinc-400">— Place your tag!</span>
            </div>
          </div>
        )}

        {/* Status notification banner: 0 PTS / hidden location */}
        {lastFailedGuess && status !== GEO_STATES.REVEAL && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-fade-in-up">
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-red-950/90 border border-red-700/80 backdrop-blur-md shadow-2xl text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              <span className="text-sm font-semibold">
                0 PTS — Outside tolerance radius! Location remains secret. Next player up!
              </span>
            </div>
          </div>
        )}

        {/* Buzzer queue display */}
        {sortedQueue.length > 0 && status !== GEO_STATES.REVEAL && (
          <div className="absolute top-6 right-6 z-20 animate-fade-in-up">
            <div className="px-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-md">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Buzzer Queue</div>
              {sortedQueue.slice(0, 5).map((b, i) => {
                const p = players[b.id];
                const isActive = b.id === activePlayerId;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-2 py-1 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`}
                  >
                    <span className="text-xs font-bold w-6">{getRankLabel(i)}</span>
                    <span className="text-sm">{p?.avatar || '🌍'}</span>
                    <span className="text-sm font-medium">{p?.nickname || b.id}</span>
                    {isActive && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reveal overlay */}
        {status === GEO_STATES.REVEAL && revealResult && (
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div className="max-w-2xl mx-auto p-8 text-center">
              {/* Distance pill */}
              {revealPhase >= 2 && (
                <div className="animate-fade-in-up mb-4">
                  <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold border backdrop-blur-md ${
                    revealResult.isCorrect
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border-red-500/40'
                  }`}>
                    <MapPin className="w-5 h-5" />
                    {formatDistance(revealResult.distanceKm)} away
                  </span>
                </div>
              )}

              {/* Points award */}
              {revealPhase >= 3 && revealResult.points > 0 && (
                <div className="geo-score-float">
                  <span className="text-5xl font-black text-amber-400 drop-shadow-lg">
                    {formatPoints(revealResult.points)}
                  </span>
                </div>
              )}

              {revealPhase >= 3 && revealResult.points === 0 && (
                <div className="animate-fade-in-up">
                  <span className="text-3xl font-bold text-zinc-500">No points</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ROUND WRAP / FINISHED ─────────────────────────────────
  if (status === GEO_STATES.ROUND_WRAP || status === GEO_STATES.FINISHED) {
    return (
      <div className="geo-stage-fullscreen flex flex-col items-center justify-center bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Trophy className="w-[500px] h-[500px]" />
        </div>

        <div className="relative z-10 text-center animate-fade-in-up">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-2">
            {status === GEO_STATES.FINISHED ? '🏆 Final Results' : `Round ${locIdx + 1} Complete`}
          </h2>
          <p className="text-zinc-500 mb-10 text-lg">
            {status === GEO_STATES.FINISHED
              ? 'GeoGuessr Finale — Final Leaderboard'
              : `${(geoRoom.locations?.length || 0) - locIdx - 1} locations remaining`}
          </p>

          {/* Leaderboard */}
          <div className="w-full max-w-xl mx-auto space-y-2">
            {leaderboard.map((p, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-6 py-3 rounded-xl border backdrop-blur-sm animate-fade-in-up ${
                    i === 0
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : i === 1
                      ? 'bg-zinc-800/50 border-zinc-700'
                      : i === 2
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="text-2xl w-8">{medals[i] || `${i + 1}.`}</span>
                  <span className="text-xl">{p.avatar || '🌍'}</span>
                  <span className="text-lg font-bold text-zinc-100 flex-1 text-left">{p.nickname}</span>
                  <span className="text-lg font-black text-amber-400 tabular-nums">
                    {(p.score || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-500">pts</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="geo-stage-fullscreen flex items-center justify-center bg-zinc-950">
      <p className="text-zinc-600">Unknown state: {status}</p>
    </div>
  );
}

export default GeoStageView;
