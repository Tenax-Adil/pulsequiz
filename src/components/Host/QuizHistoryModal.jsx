import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { deleteGameHistory } from '../../services/firebase.js';
import { Button } from '../ui/button.jsx';
import { Badge } from '../ui/badge.jsx';

export function QuizHistoryModal({ isOpen, onClose, historyList = [], onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [downloadedId, setDownloadedId] = useState(null);

  if (!isOpen) return null;

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this game history record?')) {
      await deleteGameHistory(id);
      if (onRefresh) onRefresh();
    }
  };

  const handleDownloadReport = (record, e) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pulsequiz_report_${record.roomCode || record.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadedId(record.id);
    setTimeout(() => setDownloadedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl my-6 flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Session History
            </h3>
            <p className="text-xs text-zinc-400">
              Completed tournaments and participant scorecards
            </p>
          </div>
        </div>

        {/* History Records List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {historyList.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-500 mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-300">
                No past sessions recorded
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                Completed quiz tournaments will automatically be logged here with exportable results.
              </p>
            </div>
          ) : (
            historyList.map((record) => {
              const isExpanded = expandedId === record.id;
              const dateStr = record.completedAt
                ? new Date(record.completedAt).toLocaleString()
                : 'Recent';

              const top1 = record.topScorers?.[0];

              return (
                <div
                  key={record.id}
                  className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {record.title || 'Untitled Quiz'}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 border-zinc-800 text-zinc-400">
                          PIN {record.roomCode}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-zinc-400" /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-zinc-400" /> {record.totalPlayers || 0} Players
                        </span>
                        <span>
                          {record.totalQuestions || 0} Questions
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {top1 && (
                        <Badge variant="secondary" className="gap-1 bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">
                          <span>🏆</span>
                          <span className="font-semibold">{top1.nickname}</span>
                          <span className="text-zinc-400 font-mono">({top1.score})</span>
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
                        onClick={(e) => handleDelete(record.id, e)}
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

                  {/* Expanded Full Leaderboard Table */}
                  {isExpanded && record.leaderboard && record.leaderboard.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 animate-fade-in-up">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                        <span>Final Leaderboard</span>
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
                                ? 'bg-zinc-800/90 border-zinc-700 text-zinc-100 font-semibold'
                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-4 text-center font-mono text-zinc-500 font-semibold">
                                #{pIdx + 1}
                              </span>
                              <span>{player.avatar || '⚡'}</span>
                              <span>{player.nickname}</span>
                            </div>
                            <span className="font-mono font-semibold text-zinc-200">
                              {player.score || 0} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800/80 flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-zinc-800 text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default QuizHistoryModal;
