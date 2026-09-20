import React, { useState, useMemo } from 'react';
import {
  History,
  X,
  Trophy,
  Users,
  Calendar,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Globe,
  MapPin
} from 'lucide-react';
import { deleteGameHistory } from '../../services/firebase.js';
import { deleteGeoGameHistory } from '../../services/geoFirebase.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';

export function QuizHistoryModal({ isOpen, onClose, historyList = [], onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [downloadedId, setDownloadedId] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'quiz' | 'geoguessr'

  const counts = useMemo(() => {
    let quizCount = 0;
    let geoCount = 0;
    historyList.forEach(r => {
      if (r.gameType === 'geoguessr' || r.id?.startsWith('geo_hist_')) {
        geoCount++;
      } else {
        quizCount++;
      }
    });
    return { all: historyList.length, quiz: quizCount, geo: geoCount };
  }, [historyList]);

  const filteredList = useMemo(() => {
    if (filterType === 'quiz') {
      return historyList.filter(r => r.gameType !== 'geoguessr' && !r.id?.startsWith('geo_hist_'));
    }
    if (filterType === 'geoguessr') {
      return historyList.filter(r => r.gameType === 'geoguessr' || r.id?.startsWith('geo_hist_'));
    }
    return historyList;
  }, [historyList, filterType]);

  if (!isOpen) return null;

  const handleDelete = async (record, e) => {
    e.stopPropagation();
    const isGeo = record.gameType === 'geoguessr' || record.id?.startsWith('geo_hist_');
    if (confirm(`Delete this ${isGeo ? 'GeoGuessr' : 'quiz'} session history record?`)) {
      if (isGeo) {
        await deleteGeoGameHistory(record.id);
      } else {
        await deleteGameHistory(record.id);
      }
      if (onRefresh) onRefresh();
    }
  };

  const handleDownloadReport = (record, e) => {
    e.stopPropagation();
    const isGeo = record.gameType === 'geoguessr' || record.id?.startsWith('geo_hist_');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${isGeo ? 'geoguessr' : 'pulsequiz'}_report_${record.roomCode || record.id}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadedId(record.id);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl my-6 flex flex-col max-h-[88vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Session History
            </h3>
            <p className="text-xs text-zinc-400">
              Completed quiz tournaments, GeoGuessr rounds, and participant scorecards
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'all'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>All Sessions</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.all})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'quiz'
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Classic Quizzes</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.quiz})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('geoguessr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'geoguessr'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>GeoGuessr 🌍</span>
            <span className="text-[10px] opacity-75 font-mono">({counts.geo})</span>
          </button>
        </div>

        {/* History Records List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredList.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-500 mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-300">
                No sessions found
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                Completed quiz tournaments and GeoGuessr rounds will automatically be logged here with exportable results.
              </p>
            </div>
          ) : (
            filteredList.map((record) => {
              const isExpanded = expandedId === record.id;
              const isGeo = record.gameType === 'geoguessr' || record.id?.startsWith('geo_hist_');
              const dateStr = record.completedAt
                ? new Date(record.completedAt).toLocaleString()
                : 'Recent';

              const top1 = record.topScorers?.[0];

              return (
                <div
                  key={record.id}
                  className={`bg-zinc-950/70 border rounded-xl p-4 transition ${
                    isGeo ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {record.title || (isGeo ? 'GeoGuessr Finale' : 'Untitled Quiz')}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-zinc-800 text-zinc-400">
                          PIN {record.roomCode}
                        </Badge>
                        {isGeo && (
                          <Badge variant="outline" className="text-[10px] font-semibold px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/10 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5" />
                            <span>Geo 360</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-zinc-400" /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-zinc-400" /> {record.totalPlayers || 0} Players
                        </span>
                        <span>
                          {isGeo
                            ? `${record.totalLocations || record.totalQuestions || 0} Locations`
                            : `${record.totalQuestions || 0} Questions`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {top1 && (
                        <Badge
                          variant="secondary"
                          className={`gap-1 text-xs ${
                            isGeo ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          <span>{top1.avatar || '🏆'}</span>
                          <span className="font-semibold truncate max-w-[90px]">{top1.nickname}</span>
                          <span className="font-mono opacity-80">({(top1.score || 0).toLocaleString()})</span>
                        </Badge>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDownloadReport(record, e)}
                        className="h-8 w-8 text-zinc-400 hover:text-white"
                        title="Download JSON Report"
                      >
                        {downloadedId === record.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(record, e)}
                        className="h-8 w-8 text-zinc-400 hover:text-red-400"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <div className="p-1 text-zinc-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Leaderboard & Locations */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-3 animate-fade-in-up">
                      {record.leaderboard && record.leaderboard.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>Final Leaderboard</span>
                            </span>
                            <span className="font-mono text-zinc-500">
                              {record.leaderboard.length} Participants
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                            {record.leaderboard.map((player, pIdx) => (
                              <div
                                key={player.id || pIdx}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                                  pIdx === 0
                                    ? isGeo
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 font-semibold'
                                      : 'bg-zinc-800/90 border-zinc-700 text-zinc-100 font-semibold'
                                    : pIdx === 1
                                    ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                                    : 'bg-zinc-950/60 border-zinc-900 text-zinc-400'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-4 font-mono font-bold text-zinc-500 text-center">
                                    {pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : pIdx === 2 ? '🥉' : `${pIdx + 1}.`}
                                  </span>
                                  {player.avatar && <span>{player.avatar}</span>}
                                  <span className="font-medium text-zinc-200">{player.nickname}</span>
                                </div>
                                <span className="font-mono font-bold text-amber-400">
                                  {(player.score || 0).toLocaleString()} pts
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visited Locations list for GeoGuessr */}
                      {isGeo && record.locations && record.locations.length > 0 && (
                        <div className="pt-2 border-t border-zinc-800/60">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>Locations Visited ({record.locations.length}):</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {record.locations.map((locName, lIdx) => (
                              <span
                                key={lIdx}
                                className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                              >
                                {lIdx + 1}. {typeof locName === 'string' ? locName : (locName?.name ? `${locName.name}${locName.country ? `, ${locName.country}` : ''}` : 'Location')}
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
      </div>
    </div>
  );
}

export default QuizHistoryModal;
