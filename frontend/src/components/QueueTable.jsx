import React from 'react';
import { RotateCw, CheckCircle, AlertCircle, Clock, Film } from 'lucide-react';
import { retryClip } from '../api/client';

export default function QueueTable({ items = [], onRefresh }) {
  const handleRetry = async (clipId) => {
    try {
      await retryClip(clipId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to retry clip: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rendering':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse';
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-gray-800 text-gray-400">
        <Film className="w-10 h-10 mx-auto mb-2 text-gray-600" />
        <p className="font-medium">No clip items in queue.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass-panel rounded-2xl border border-gray-800">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-gray-900/80 text-xs uppercase font-semibold text-gray-400 border-b border-gray-800">
          <tr>
            <th className="px-6 py-4">Part #</th>
            <th className="px-6 py-4">Clip Filename</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Time Range</th>
            <th className="px-6 py-4">Retries</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {items.map((clip) => (
            <tr key={clip.id} className="hover:bg-gray-800/30 transition-colors">
              <td className="px-6 py-4 font-bold text-white">Part {clip.part_number}</td>
              <td className="px-6 py-4 font-mono text-xs text-indigo-300 truncate max-w-xs">{clip.filename}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(clip.status)}`}>
                  {clip.status}
                </span>
              </td>
              <td className="px-6 py-4 text-xs font-mono text-gray-400">
                {clip.start_time.toFixed(0)}s - {clip.end_time.toFixed(0)}s
              </td>
              <td className="px-6 py-4 text-xs">{clip.retry_count}</td>
              <td className="px-6 py-4 text-right">
                {clip.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(clip.id)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
