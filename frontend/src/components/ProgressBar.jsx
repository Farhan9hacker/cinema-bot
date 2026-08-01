import React from 'react';
import { Clock, Play, CheckCircle2 } from 'lucide-react';

export default function ProgressBar({
  videoTitle,
  currentPart,
  completedClipsCount = 0,
  totalClipsCount = 0,
  progressPercent = 0,
  etaSeconds = null
}) {
  const formatETA = (sec) => {
    if (!sec || sec <= 0) return 'Calculating...';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m > 60) {
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}m`;
    }
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-dark-card to-dark-card shadow-xl glow-active">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Play className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs uppercase font-semibold text-indigo-400 tracking-wider">Active Video Pipeline</span>
            <h3 className="text-lg font-bold text-white tracking-tight truncate max-w-md">
              {videoTitle || 'No Active Processing Job'}
            </h3>
            {currentPart && (
              <p className="text-xs text-gray-400 mt-0.5">
                Currently Transcoding: <span className="font-semibold text-indigo-300">Part {currentPart} {totalClipsCount ? `of ${totalClipsCount} Clips` : ''}</span>
              </p>
            )}
          </div>
        </div>

        {etaSeconds !== null && (
          <div className="flex items-center space-x-2 text-sm text-gray-300 bg-gray-900/60 px-4 py-2 rounded-xl border border-gray-800 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>ETA: <strong className="text-white">{formatETA(etaSeconds)}</strong></span>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-2">
          <span>Overall Video Progress {totalClipsCount > 0 ? `(${completedClipsCount} / ${totalClipsCount} Clips Rendered)` : ''}</span>
          <span className="text-indigo-400 text-sm font-bold">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-900/90 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-800 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 rounded-full transition-all duration-500 shadow-lg shadow-indigo-500/50"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
