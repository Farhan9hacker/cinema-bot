import React from 'react';
import { Download, RefreshCw, Terminal } from 'lucide-react';

export default function LogViewer({ logs = [], onRefresh }) {
  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return 'text-rose-400 font-bold';
      case 'WARNING':
        return 'text-amber-400 font-semibold';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-md">System & Transcoder Logs</h3>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <a
            href="/api/logs/download"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      <div className="bg-black/80 rounded-xl p-4 font-mono text-xs text-gray-300 h-64 overflow-y-auto border border-gray-800 space-y-1">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No system logs recorded yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex space-x-2 hover:bg-white/5 p-1 rounded transition-colors">
              <span className="text-gray-500 select-none">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className={`uppercase font-bold w-16 ${getLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-indigo-400 uppercase text-[10px] bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                {log.category}
              </span>
              <span className="text-gray-200 flex-1">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
