import React, { useState, useEffect } from 'react';
import { FileText, Filter, RefreshCw } from 'lucide-react';
import LogViewer from '../components/LogViewer';
import { getLogs } from '../api/client';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogsData = async () => {
    setLoading(true);
    try {
      const res = await getLogs(levelFilter, categoryFilter);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsData();
  }, [levelFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System & Pipeline Logs</h1>
          <p className="text-xs text-gray-400 mt-1">Audit trail for video ingestion, FFmpeg encoding, worker events, and API calls</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="monitor">Monitor</option>
            <option value="transcode">Transcode</option>
            <option value="api">API</option>
            <option value="system">System</option>
            <option value="settings">Settings</option>
          </select>

          <button
            onClick={fetchLogsData}
            className="p-2 rounded-xl glass-panel border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <LogViewer logs={logs} onRefresh={fetchLogsData} />
    </div>
  );
}
