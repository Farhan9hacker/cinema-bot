import React, { useState } from 'react';
import { Upload, X, Film, Send, Link } from 'lucide-react';
import { uploadVideo, downloadTelegramMovie } from '../api/client';

export default function VideoUploadModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'telegram'
  const [file, setFile] = useState(null);
  const [telegramUrl, setTelegramUrl] = useState('');
  const [customFilename, setCustomFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, loadedMB: 0, totalMB: 0 });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setUploadProgress({ percent: 0, loadedMB: 0, totalMB: (e.target.files[0].size / (1024 * 1024)).toFixed(1) });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      if (activeTab === 'upload') {
        if (!file) {
          setError('Please select a video file');
          setUploading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        await uploadVideo(formData, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        if (!telegramUrl.trim()) {
          setError('Please enter a Telegram video link, HTTP URL, or file ID');
          setUploading(false);
          return;
        }
        await downloadTelegramMovie(telegramUrl.trim(), customFilename.trim());
      }

      setUploading(false);
      setFile(null);
      setTelegramUrl('');
      setCustomFilename('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.detail || 'Failed to process request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Headers */}
        <div className="flex space-x-2 border-b border-gray-800 pb-3 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Local File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'telegram'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telegram / URL</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          {activeTab === 'upload' ? (
            <div className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-gray-900/40">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {file ? (
                <div className="flex flex-col items-center space-y-3">
                  <Film className="w-10 h-10 text-indigo-400" />
                  <span className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>

                  {/* Detailed Upload Progress Bar */}
                  {uploading && (
                    <div className="w-full mt-2 space-y-1.5 text-left bg-gray-900 p-3 rounded-xl border border-gray-800">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-indigo-400">Uploading Video File...</span>
                        <span className="text-white font-bold">{uploadProgress.percent}%</span>
                      </div>

                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden border border-gray-700">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-300 shadow-md shadow-indigo-500/50"
                          style={{ width: `${uploadProgress.percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                        <span>Transferred: <strong className="text-indigo-300">{uploadProgress.loadedMB || 0} MB</strong> / {uploadProgress.totalMB || (file.size / (1024 * 1024)).toFixed(1)} MB</span>
                        <span className="animate-pulse text-indigo-400">Processing Pipeline Ready</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-500" />
                  <span className="text-sm font-medium text-gray-300">Click or Drag video here</span>
                  <span className="text-xs text-gray-500">Supports MP4, MKV, MOV, WEBM</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300">
                <span className="font-bold text-white block mb-0.5">💡 How to download from Telegram:</span>
                In Telegram, click <strong>Forward</strong> on any movie message (from any bot/group) and send it to your ShortForge Bot, or paste the link/file ID below!
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Telegram Video Link, File ID, or Video URL
                </label>
                <div className="relative">
                  <Link className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={telegramUrl}
                    onChange={(e) => setTelegramUrl(e.target.value)}
                    placeholder="e.g. Mr.Butler.2000.1080p.mkv or Telegram link"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Movie Title / Filename (Optional)
                </label>
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="e.g. Inception_2010.mp4"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading
                ? activeTab === 'telegram'
                  ? 'Downloading from Telegram...'
                  : 'Uploading...'
                : activeTab === 'telegram'
                ? 'Download & Split Movie'
                : 'Start Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
