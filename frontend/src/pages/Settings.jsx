import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Eye, Sliders } from 'lucide-react';
import { getSettings, updateSettings } from '../api/client';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    clip_length: 90,
    video_codec: 'h264',
    bitrate: '6M',
    resolution: '1080x1920',
    fps: 30,
    overlay_font: 'DejaVuSans-Bold.ttf',
    overlay_size: 54,
    overlay_color: 'white',
    overlay_outline_color: 'black',
    overlay_outline_width: 4,
    top_padding: 120,
    show_movie_title: true,
    upload_schedule: 'immediate',
    upload_interval_mins: 30,
    auto_publish_youtube: true,
    auto_publish_tiktok: true,
    auto_publish_instagram: false,
    auto_publish_facebook: false,
    max_workers: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getSettings();
        setFormData(res.data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) || 0 : value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading settings configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System & Transcoder Settings</h1>
          <p className="text-xs text-gray-400 mt-1">Configure segment duration, FFmpeg video encoding, overlay typography, and schedule</p>
        </div>
        {savedSuccess && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Video Transcoding Specs */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-md">Transcoding Parameters</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Clip Duration (Seconds)</label>
                <input
                  type="number"
                  name="clip_length"
                  value={formData.clip_length}
                  onChange={handleChange}
                  min="10"
                  max="300"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Video Codec</label>
                <select
                  name="video_codec"
                  value={formData.video_codec}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="h264">H.264 (Universal Compatibility)</option>
                  <option value="h265">H.265 / HEVC (High Efficiency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Target Resolution (9:16)</label>
                <input
                  type="text"
                  name="resolution"
                  value={formData.resolution}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Target Bitrate</label>
                <input
                  type="text"
                  name="bitrate"
                  value={formData.bitrate}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Text Overlay Style */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
              <Eye className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-md">9:16 Text Overlay Style</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Font File</label>
                <input
                  type="text"
                  name="overlay_font"
                  value={formData.overlay_font}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Font Size (px)</label>
                <input
                  type="number"
                  name="overlay_size"
                  value={formData.overlay_size}
                  onChange={handleChange}
                  min="20"
                  max="120"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Top Padding (px)</label>
                <input
                  type="number"
                  name="top_padding"
                  value={formData.top_padding}
                  onChange={handleChange}
                  min="50"
                  max="400"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Outline Width (px)</label>
                <input
                  type="number"
                  name="overlay_outline_width"
                  value={formData.overlay_outline_width}
                  onChange={handleChange}
                  min="0"
                  max="20"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Show/Hide Movie Title Toggle */}
              <div className="sm:col-span-2 flex items-center justify-between p-4 bg-gray-900/80 border border-gray-800 rounded-xl">
                <div>
                  <span className="block text-sm font-bold text-white">Show Movie Title in Overlay</span>
                  <span className="text-xs text-gray-400">Display full movie name above the Part number on top of vertical clips</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="show_movie_title"
                    checked={formData.show_movie_title}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Social Media & Auto-Upload Accounts */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
              <span className="text-xl">🚀</span>
              <h3 className="font-bold text-white text-md">Social Media Connections</h3>
            </div>
            <p className="text-xs text-gray-400">Connect your short-form video channels for automated auto-publishing</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* YouTube Shorts */}
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center font-bold text-xs">
                    YT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">YouTube Shorts</h4>
                    <span className="text-[10px] text-emerald-400 font-semibold">● Connected (@CinemaClips)</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="auto_publish_youtube"
                    checked={formData.auto_publish_youtube}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* TikTok */}
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                    TT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">TikTok</h4>
                    <span className="text-[10px] text-emerald-400 font-semibold">● Connected (@ShortsForge)</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="auto_publish_tiktok"
                    checked={formData.auto_publish_tiktok}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Instagram Reels */}
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold text-xs">
                    IG
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Instagram Reels</h4>
                    <span className="text-[10px] text-gray-500 font-semibold">Disconnected</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Instagram Graph API authorization initialized')}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Connect
                </button>
              </div>

              {/* Facebook Reels */}
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                    FB
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Facebook Reels</h4>
                    <span className="text-[10px] text-gray-500 font-semibold">Disconnected</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Facebook Reels API authorization initialized')}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>

          {/* Upload Schedule & Automation Settings */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
              <span className="text-xl">⏰</span>
              <h3 className="font-bold text-white text-md">Upload Schedule & Automation</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Upload Schedule Strategy</label>
                <select
                  name="upload_schedule"
                  value={formData.upload_schedule}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="immediate">Immediate (Publish clip as soon as rendered)</option>
                  <option value="custom_interval">Staggered Interval (Delay between clips)</option>
                  <option value="hourly">Hourly Batch</option>
                  <option value="daily">Daily Prime-time Batch (6:00 PM UTC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Interval Delay Between Clips (Minutes)</label>
                <input
                  type="number"
                  name="upload_interval_mins"
                  value={formData.upload_interval_mins}
                  onChange={handleChange}
                  min="5"
                  max="1440"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>

        {/* Live Visualizer for Shorts Safe Area & Overlay */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col items-center">
          <h3 className="font-bold text-white text-md mb-2">Overlay Visualizer (9:16)</h3>
          <p className="text-xs text-gray-400 mb-4 text-center">Live preview of text layout & safe area guidelines</p>

          {/* Mock Vertical Phone Frame */}
          <div className="relative w-56 h-96 bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl overflow-hidden flex flex-col justify-between p-4">
            {/* Blurred background mockup */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-purple-900/30 to-black pointer-events-none" />

            {/* Overlay Title */}
            <div
              className="relative z-10 text-center font-extrabold uppercase tracking-wide leading-tight"
              style={{
                marginTop: `${Math.min(100, formData.top_padding / 3)}px`,
                color: formData.overlay_color,
                fontSize: `${Math.max(12, formData.overlay_size / 3.5)}px`,
                textShadow: `-1px -1px 0 ${formData.overlay_outline_color}, 1px -1px 0 ${formData.overlay_outline_color}, -1px 1px 0 ${formData.overlay_outline_color}, 1px 1px 0 ${formData.overlay_outline_color}`,
              }}
            >
              {formData.show_movie_title && <div>MOVIE NAME</div>}
              <div className={formData.show_movie_title ? "mt-2" : ""}>PART 1</div>
            </div>

            {/* Shorts UI Safe Area Indicator */}
            <div className="relative z-10 border border-dashed border-indigo-400/40 rounded-lg p-2 text-center text-[9px] text-indigo-300 bg-indigo-950/40">
              Shorts UI Safe Area Zone
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
