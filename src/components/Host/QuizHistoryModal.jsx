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
  Award,
  Flame,
  Check
} from 'lucide-react';
import { deleteGameHistory } from '../../services/firebase.js';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl my-6 flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Quiz History &amp; Results Log
            </h3>
            <p className="text-xs text-slate-400">
              Review completed game sessions, player standings, and download event reports
            </p>
          </div>
        </div>

        {/* History Records List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {historyList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto mb-3">
                <History className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-300">
                No completed quizzes yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Completed quiz sessions and final player leaderboards will automatically be archived here.
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
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base sm:text-lg font-black text-white truncate">
                          {record.title || 'Untitled Quiz'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-indigo-400 font-mono text-[11px] font-bold rounded-md">
                          PIN: {record.roomCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-pink-400" /> {record.totalPlayers || 0} Players
                        </span>
                        <span>
                          {record.totalQuestions || 0} Questions
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {top1 && (
                        <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-300 text-xs font-bold">
                          <span>{top1.avatar || '🏆'}</span>
                          <span>Winner: {top1.nickname} ({top1.score} pts)</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => handleDownloadReport(record, e)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Download JSON Report"
                      >
                        {downloadedId === record.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDelete(record.id, e)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button className="p-1 text-slate-400 hover:text-white">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Full Leaderboard Table */}
                  {isExpanded && record.leaderboard && record.leaderboard.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-800/80 animate-fade-in">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                        <span>Final Player Standings</span>
                        <span className="text-[11px] text-slate-500">
                          {record.leaderboard.length} Participants
                        </span>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {record.leaderboard.map((player, pIdx) => (
                          <div
                            key={player.id || pIdx}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                              pIdx === 0
                                ? 'bg-amber-950/20 border-amber-500/40 font-bold text-amber-200'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-5 text-center font-mono font-bold text-slate-500">
                                #{pIdx + 1}
                              </span>
                              <span className="text-base">{player.avatar || '⚡'}</span>
                              <span className="font-bold">{player.nickname}</span>
                              {player.streak > 1 && (
                                <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                                  <Flame className="w-3 h-3 fill-orange-400" /> {player.streak}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-white">
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

        <div className="pt-4 border-t border-slate-800 flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
