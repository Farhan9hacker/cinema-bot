import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSystemStatus = () => api.get('/system/status');
export const getVideos = (statusFilter = '') => api.get(`/videos${statusFilter ? `?status_filter=${statusFilter}` : ''}`);
export const getVideoDetails = (videoId) => api.get(`/videos/${videoId}`);
export const uploadVideo = (formData, onProgress) => api.post('/videos/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    if (onProgress && progressEvent.total) {
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      const loadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
      const totalMB = (progressEvent.total / (1024 * 1024)).toFixed(1);
      onProgress({ percent, loadedMB, totalMB });
    }
  }
});
export const startVideo = (videoId) => api.post(`/videos/${videoId}/start`);
export const pauseVideo = (videoId) => api.post(`/videos/${videoId}/pause`);
export const resumeVideo = (videoId) => api.post(`/videos/${videoId}/resume`);
export const cancelVideo = (videoId) => api.post(`/videos/${videoId}/cancel`);
export const deleteVideo = (videoId) => api.delete(`/videos/${videoId}`);

export const getQueueStatus = () => api.get('/queue/status');
export const retryClip = (clipId) => api.post(`/queue/retry/${clipId}`);
export const resumeAllQueue = () => api.post('/queue/resume-all');

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

export const getLogs = (level = '', category = '') => {
  let url = '/logs?limit=100';
  if (level) url += `&level=${level}`;
  if (category) url += `&category=${category}`;
  return api.get(url);
};

export const downloadTelegramMovie = (url_or_file_id, filename = '') =>
  api.post('/telegram/download', { url_or_file_id, filename });

export default api;
