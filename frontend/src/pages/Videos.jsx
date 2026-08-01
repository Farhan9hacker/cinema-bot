import React, { useState, useEffect } from 'react';
import { Film, Play, Pause, RotateCw, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { getVideos, startVideo, pauseVideo, resumeVideo, cancelVideo, deleteVideo } from '../api/client';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await getVideos(filter);
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const handleAction = async (videoId, action) => {
    try {
      if (action === 'start') await startVideo(videoId);
      if (action === 'pause') await pauseVideo(videoId);
      if (action === 'resume') await resumeVideo(videoId);
      if (action === 'cancel') await cancelVideo(videoId);
      if (action === 'delete') {
        if (confirm('Are you sure you want to delete this video and its rendered clips?')) {
          await deleteVideo(videoId);
        } else {
          return;
        }
      }
      fetchVideos();
    } catch (err) {
      alert(`Action failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'processing':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse';
      case 'paused':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Video Library</h1>
          <p className="text-xs text-gray-400 mt-1">Manage long-form videos ingested into ShortForge</p>
        </div>

        {/* Filter buttons */}
        <div className="flex space-x-2 bg-gray-900/80 p-1 rounded-xl border border-gray-800 self-start">
          {['', 'processing', 'completed', 'paused', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === st
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-2xl border border-gray-800 text-gray-400">
          <Film className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="font-semibold text-lg text-gray-300">No videos found.</p>
          <p className="text-xs text-gray-500 mt-1">Drop video files into the input folder or use the Upload button on Dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div key={vid.id} className="glass-panel border border-gray-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(vid.status)}`}>
                    {vid.status}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">ID #{vid.id}</span>
                </div>

                <h3 className="font-bold text-white text-md mt-3 truncate" title={vid.filename}>
                  {vid.filename}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-gray-400 bg-gray-900/60 p-3 rounded-xl border border-gray-800/80">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-gray-500">Duration</span>
                    <span className="text-gray-200 font-mono font-semibold">{(vid.duration_seconds / 60).toFixed(1)} mins</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-gray-500">Resolution</span>
                    <span className="text-gray-200 font-mono font-semibold">{vid.resolution}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-gray-500">Total Clips</span>
                    <span className="text-indigo-400 font-bold">{vid.total_clips} clips</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-gray-500">FPS</span>
                    <span className="text-gray-200 font-mono font-semibold">{vid.fps}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex space-x-2">
                  {vid.status === 'paused' && (
                    <button
                      onClick={() => handleAction(vid.id, 'resume')}
                      className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-colors"
                      title="Resume"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {vid.status === 'processing' && (
                    <button
                      onClick={() => handleAction(vid.id, 'pause')}
                      className="p-2 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600 hover:text-white transition-colors"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {(vid.status === 'failed' || vid.status === 'pending') && (
                    <button
                      onClick={() => handleAction(vid.id, 'start')}
                      className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-colors"
                      title="Start Processing"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleAction(vid.id, 'delete')}
                  className="p-2 rounded-lg bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-colors"
                  title="Delete Video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
