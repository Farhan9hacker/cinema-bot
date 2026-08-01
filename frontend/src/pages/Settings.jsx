import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Eye, Sliders, Volume2, Sparkles, Palette } from 'lucide-react';
import { getSettings, updateSettings } from '../api/client';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    clip_length: 90,
    video_codec: 'h264',
    bitrate: '6M',
    resolution: '1080x1920',
    fps: 30,
    crop_mode: 'blur_pad',
    normalize_audio: true,
    overlay_font: 'DejaVuSans-Bold.ttf',
    overlay_size: 54,
    overlay_color: 'white',
    overlay_outline_color: 'black',
    overlay_outline_width: 4,
    top_padding: 120,
    show_movie_title: true,
    hook_text: 'MUST WATCH ENDING 🍿',
    enable_hook_text: true,
    watermark_handle: '@ShortForgeClips',
    enable_watermark: true,
    active_theme: 'cyberpunk',
    upload_schedule: 'immediate',
    upload_interval_mins: 30,
    auto_publish_youtube: true,
    auto_publish_tiktok: true,
    auto_publish_instagram: false,
    auto_publish_facebook: false,
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_auto_download: true,
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
    return <div className="p-12 text-center text-cyan-400 font-mono">Loading Studio configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black gradient-text-cyber tracking-tight">Studio Engine & Transcoder Settings</h1>
          <p className="text-xs text-gray-400 mt-1">Configure split-screen layout, FFmpeg audio normalization, hook banner, and watermark handle</p>
        </div>
        {savedSuccess && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Studio Settings Saved!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          
          {/* Video Transcoding & Crop Layout */}
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-md">Video Layout & Aspect Ratio</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Crop & Layout Mode</label>
                <select
                  name="crop_mode"
                  value={formData.crop_mode}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="blur_pad">Background Blur Pad (Vertical 9:16)</option>
                  <option value="center_crop">Center Crop Zoom (Vertical 9:16)</option>
                  <option value="split_screen">Dual Split-Screen (Movie Top + Pad Bottom)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Clip Duration (Seconds)</label>
                <input
                  type="number"
                  name="clip_length"
                  value={formData.clip_length}
                  onChange={handleChange}
                  min="10"
                  max="300"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Video Codec</label>
                <select
                  name="video_codec"
                  value={formData.video_codec}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Audio Normalization */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-md">Audio & Loudness Control</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/80 border border-gray-800 rounded-2xl">
              <div>
                <span className="block text-sm font-bold text-white">EBU R128 Audio Normalization</span>
                <span className="text-xs text-gray-400">Automatically balances and normalizes audio levels for crisp Shorts/TikTok playback</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="normalize_audio"
                  checked={formData.normalize_audio}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          {/* Attention Hook & Watermark Branding */}
          <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white text-md">Auto-Hook Banner & Channel Watermark</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">3-Second Hook Text</label>
                <input
                  type="text"
                  name="hook_text"
                  value={formData.hook_text}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-yellow-300 font-bold focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Watermark Handle</label>
                <input
                  type="text"
                  name="watermark_handle"
                  value={formData.watermark_handle}
                  onChange={handleChange}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-cyan-300 font-mono focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-900/80 border border-gray-800 rounded-xl">
                <div>
                  <span className="block text-xs font-bold text-white">Enable 3-Second Hook Text</span>
                  <span className="text-[11px] text-gray-400">Shows yellow attention text during first 3s of clip</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="enable_hook_text"
                    checked={formData.enable_hook_text}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-900/80 border border-gray-800 rounded-xl">
                <div>
                  <span className="block text-xs font-bold text-white">Enable Channel Watermark</span>
                  <span className="text-[11px] text-gray-400">Displays handle watermark in bottom-right corner</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="enable_watermark"
                    checked={formData.enable_watermark}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save Studio Engine Settings'}</span>
            </button>
          </div>
        </form>

        {/* Live Visualizer for Shorts Safe Area & Overlay */}
        <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 flex flex-col items-center">
          <h3 className="font-bold text-white text-md mb-2 flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Live 9:16 Studio Mockup</span>
          </h3>
          <p className="text-xs text-gray-400 mb-4 text-center">Preview layout, crop style & watermark placement</p>

          {/* Mock Vertical Phone Frame */}
          <div className="relative w-56 h-96 bg-gray-950 rounded-3xl border-4 border-cyan-500/40 shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col justify-between p-4">
            {/* Background mockup based on crop mode */}
            {formData.crop_mode === 'split_screen' ? (
              <div className="absolute inset-0 flex flex-col pointer-events-none">
                <div className="h-1/2 bg-indigo-900/40 border-b border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-300">Movie Stream (Top)</div>
                <div className="h-1/2 bg-purple-900/30 flex items-center justify-center text-[10px] text-purple-300">ASMR / Pad Stream (Bottom)</div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/40 via-purple-950/30 to-black pointer-events-none" />
            )}

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
              <div className={formData.show_movie_title ? "mt-1" : ""}>PART 1</div>

              {formData.enable_hook_text && (
                <div className="mt-2 text-[10px] font-black text-yellow-300 tracking-normal border border-yellow-400/40 bg-yellow-950/60 rounded px-1 py-0.5">
                  {formData.hook_text}
                </div>
              )}
            </div>

            {/* Watermark handle in safe area */}
            <div className="relative z-10 flex justify-between items-end">
              <div className="border border-dashed border-cyan-400/40 rounded p-1 text-center text-[8px] text-cyan-300 bg-cyan-950/40">
                Safe Zone
              </div>
              {formData.enable_watermark && (
                <div className="text-[9px] font-mono text-cyan-300 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                  {formData.watermark_handle}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
