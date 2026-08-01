import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Server, Layers, CheckCircle2, AlertTriangle, Upload, RefreshCw } from 'lucide-react';
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

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Operational Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Real-time status of 9:16 video processing pipeline & workers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl glass-panel border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all"
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
          subtext="12 CPU Threads active"
          icon={Cpu}
          color="indigo"
          progress={systemStats?.cpu_percent}
        />
        <StatCard
          title="RAM Usage"
          value={`${systemStats?.ram_percent ?? 0}%`}
          subtext={`${systemStats?.ram_used_gb ?? 0} / ${systemStats?.ram_total_gb ?? 64} GB`}
          icon={Server}
          color="emerald"
          progress={systemStats?.ram_percent}
        />
        <StatCard
          title="Disk Space"
          value={`${systemStats?.disk_free_gb ?? 0} GB`}
          subtext={`Free (${systemStats?.disk_percent ?? 0}% used)`}
          icon={HardDrive}
          color="cyan"
          progress={100 - (systemStats?.disk_percent ?? 0)}
        />
        <StatCard
          title="Queue Size"
          value={systemStats?.queue_size ?? 0}
          subtext="Pending render items"
          icon={Layers}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={systemStats?.completed_videos_count ?? 0}
          subtext="Videos rendered"
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-md">Active Transcode Queue</h3>
            <span className="text-xs text-gray-400">Total: {queueData?.summary?.total_clips ?? 0} clips</span>
          </div>
          <QueueTable items={queueData?.active_items} onRefresh={fetchData} />
        </div>

        <div>
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
