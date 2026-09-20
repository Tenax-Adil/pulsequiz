import React, { useState, useEffect } from 'react';
import {
  History, X, Trophy, Users, Calendar, Download,
  Trash2, ChevronDown, ChevronUp, Check, Globe, MapPin
} from 'lucide-react';
import { fetchGeoGameHistory, deleteGeoGameHistory } from '../../services/geoFirebase.js';

export function GeoHistoryModal({ isOpen, onClose }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [downloadedId, setDownloadedId] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const list = await fetchGeoGameHistory();
      setHistoryList(list || []);
    } catch (err) {
      console.warn('Failed to load geo history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this GeoGuessr match history record?')) {
      await deleteGeoGameHistory(id);
      loadHistory();
    }
  };

  const handleDownloadReport = (record, e) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `geoguessr_match_${record.roomCode || record.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadedId(record.id);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl my-6 flex flex-col max-h-[88vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                GeoGuessr Match History
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                {historyList.length} Sessions
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Completed map rounds, contestant scores, and exportable match reports
            </p>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-amber-400 animate-spin mx-auto mb-3" />
              <span>Loading match history...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-500 mx-auto mb-3">
                <History className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">
                No GeoGuessr matches recorded yet
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                Whenever you conduct a GeoGuessr finale and complete or end the game, the full match scorecard and locations will be logged here.
              </p>
            </div>
          ) : (
            historyList.map((record) => {
              const isExpanded = expandedId === record.id;
              const dateStr = record.completedAt
                ? new Date(record.completedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent';

              const winner = record.topScorers?.[0];

              return (
                <div
                  key={record.id}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">
                          {record.title || 'GeoGuessr Finale'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px]">
                          PIN {record.roomCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Geo 360</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-zinc-500" /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-zinc-500" /> {record.totalPlayers || 0} Contestants
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500" /> {record.totalLocations || record.totalQuestions || 0} Locations
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {winner && (
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                          <span>👑</span>
                          <span>{winner.avatar}</span>
                          <span className="font-bold truncate max-w-[90px]">{winner.nickname}</span>
                          <span className="font-mono text-[11px] text-amber-400">({(winner.score || 0).toLocaleString()})</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDownloadReport(record, e)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                        title="Download Match JSON Report"
                      >
                        {downloadedId === record.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(record.id, e)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer"
                        title="Delete Match Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-1 text-zinc-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section: Scoreboard & Locations */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-3 animate-fade-in">
                      {/* Leaderboard */}
                      {record.leaderboard && record.leaderboard.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>Contestant Standings</span>
                            </span>
                            <span className="font-mono text-zinc-500 text-[10px]">
                              {record.leaderboard.length} players
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {record.leaderboard.map((player, pIdx) => {
                              const medals = ['🥇', '🥈', '🥉'];
                              return (
                                <div
                                  key={player.id || pIdx}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                                    pIdx === 0
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 font-bold'
                                      : pIdx === 1
                                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200'
                                      : pIdx === 2
                                      ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
                                      : 'bg-zinc-950/60 border-zinc-900 text-zinc-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 text-center text-sm font-bold">
                                      {medals[pIdx] || `${pIdx + 1}.`}
                                    </span>
                                    <span>{player.avatar || '🌍'}</span>
                                    <span className="truncate">{player.nickname}</span>
                                  </div>
                                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                                    {(player.score || 0).toLocaleString()} pts
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Locations Visited */}
                      {record.locations && record.locations.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800/60">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>Locations Visited:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {record.locations.map((locName, lIdx) => (
                              <span
                                key={lIdx}
                                className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1"
                              >
                                <span className="text-zinc-500 font-mono text-[10px]">{lIdx + 1}.</span>
                                <span>{typeof locName === 'string' ? locName : (locName?.name ? `${locName.name}${locName.country ? `, ${locName.country}` : ''}` : 'Location')}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Match records are preserved in local browser storage and Firebase.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default GeoHistoryModal;
