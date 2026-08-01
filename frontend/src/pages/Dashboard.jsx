import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Server, Layers, CheckCircle2, AlertTriangle, Upload, RefreshCw, Download, Zap } from 'lucide-react';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import QueueTable from '../components/QueueTable';
import LogViewer from '../components/LogViewer';
import VideoUploadModal from '../components/VideoUploadModal';
import { getSystemStatus, getQueueStatus, getLogs } from '../api/client';

export default function Dashboard() {
  const [systemStats, setSystemStats] = useState(null);
  const [queueData, setQueueData] = useState({ active_items: [] });
  const [logsData, setLogsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [sysRes, queueRes, logsRes] = await Promise.allSettled([
        getSystemStatus(),
        getQueueStatus(),
        getLogs('', ''),
      ]);

      if (sysRes.status === 'fulfilled') setSystemStats(sysRes.value.data);
      if (queueRes.status === 'fulfilled') setQueueData(queueRes.value.data);
      if (logsRes.status === 'fulfilled') setLogsData(logsRes.value.data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Auto-refresh every 3s
    return () => clearInterval(interval);
  }, []);

  const handleDownloadZip = () => {
    if (!systemStats?.current_video_id) {
      alert('No active or finished video selected for ZIP export.');
      return;
    }
    window.open(`/api/videos/${systemStats.current_video_id}/download-zip`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Cyber Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/30 via-gray-900/40 to-purple-950/30 p-6 rounded-3xl border border-cyan-500/20 shadow-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-black gradient-text-cyber tracking-tight">Studio Operational Control</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">Real-time telemetry of 9:16 automated video engine, workers & transcode queue</p>
        </div>

        <div className="flex items-center space-x-3">
          {systemStats?.current_video_id && (
            <button
              onClick={handleDownloadZip}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 shadow-md shadow-cyan-500/20 transition-all"
              title="Download all rendered clips as ZIP"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export ZIP</span>
            </button>
          )}

          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl glass-panel border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-950/60 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/30 transition-all transform hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="CPU Usage"
          value={`${systemStats?.cpu_percent ?? 0}%`}
          subtext="12 Threads Active"
          icon={Cpu}
          color="cyan"
          progress={systemStats?.cpu_percent}
        />
        <StatCard
          title="RAM Usage"
          value={`${systemStats?.ram_percent ?? 0}%`}
          subtext={`${systemStats?.ram_used_gb ?? 0} / ${systemStats?.ram_total_gb ?? 64} GB`}
          icon={Server}
          color="purple"
          progress={systemStats?.ram_percent}
        />
        <StatCard
          title="Disk Storage"
          value={`${systemStats?.disk_free_gb ?? 0} GB`}
          subtext={`Free (${systemStats?.disk_percent ?? 0}% used)`}
          icon={HardDrive}
          color="emerald"
          progress={100 - (systemStats?.disk_percent ?? 0)}
        />
        <StatCard
          title="Queue Items"
          value={systemStats?.queue_size ?? 0}
          subtext="Pending clips"
          icon={Layers}
          color="amber"
        />
        <StatCard
          title="Rendered Movies"
          value={systemStats?.completed_videos_count ?? 0}
          subtext="Videos finished"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Failed / Retries"
          value={systemStats?.failed_videos_count ?? 0}
          subtext="Video errors"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Active Pipeline Progress Bar */}
      <ProgressBar
        videoTitle={systemStats?.current_video_title}
        currentPart={systemStats?.current_part}
        completedClipsCount={systemStats?.completed_clips_count ?? 0}
        totalClipsCount={systemStats?.total_clips_count ?? 0}
        progressPercent={systemStats?.progress_percent ?? 0}
        etaSeconds={systemStats?.eta_seconds}
      />

      {/* Live Render Queue Table & Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
            <h3 className="font-bold text-white text-md flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Active Transcode Queue</span>
            </h3>
            <span className="text-xs text-cyan-400 font-mono font-semibold">Total: {queueData?.summary?.total_clips ?? 0} clips</span>
          </div>
          <QueueTable items={queueData?.active_items} onRefresh={fetchData} />
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 shadow-xl">
          <LogViewer logs={logsData} onRefresh={fetchData} />
        </div>
      </div>

      {/* Upload Modal */}
      <VideoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
