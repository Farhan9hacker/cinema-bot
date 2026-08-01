import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Play } from 'lucide-react';
import QueueTable from '../components/QueueTable';
import { getQueueStatus, resumeAllQueue } from '../api/client';

export default function Queue() {
  const [queueData, setQueueData] = useState({ summary: {}, active_items: [] });
  const [loading, setLoading] = useState(true);
  const [resuming, setResuming] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await getQueueStatus();
      setQueueData(res.data);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeAll = async () => {
    setResuming(true);
    try {
      await resumeAllQueue();
      fetchQueue();
    } catch (err) {
      alert('Failed to resume queue: ' + (err.response?.data?.detail || err.message));
    } finally {
      setResuming(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Upload & Render Queue</h1>
          <p className="text-xs text-gray-400 mt-1">Detailed view of active and pending clip rendering segments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResumeAll}
            disabled={resuming}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{resuming ? 'Resuming...' : 'Start / Resume Transcoding'}</span>
          </button>
          <button
            onClick={fetchQueue}
            className="p-2.5 rounded-xl glass-panel border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-panel border border-amber-500/30 bg-amber-500/5">
          <span className="text-xs uppercase font-semibold text-amber-400">Queued</span>
          <p className="text-2xl font-extrabold text-white mt-1">{queueData.summary?.queued || 0}</p>
        </div>
        <div className="p-4 rounded-xl glass-panel border border-indigo-500/30 bg-indigo-500/5">
          <span className="text-xs uppercase font-semibold text-indigo-400">Rendering</span>
          <p className="text-2xl font-extrabold text-white mt-1">{queueData.summary?.rendering || 0}</p>
        </div>
        <div className="p-4 rounded-xl glass-panel border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-xs uppercase font-semibold text-emerald-400">Completed</span>
          <p className="text-2xl font-extrabold text-white mt-1">{queueData.summary?.completed || 0}</p>
        </div>
        <div className="p-4 rounded-xl glass-panel border border-rose-500/30 bg-rose-500/5">
          <span className="text-xs uppercase font-semibold text-rose-400">Failed</span>
          <p className="text-2xl font-extrabold text-white mt-1">{queueData.summary?.failed || 0}</p>
        </div>
      </div>

      <QueueTable items={queueData.active_items} onRefresh={fetchQueue} />
    </div>
  );
}
