import { supabase } from './supabaseClient';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl;
  }
  // If accessing from phone/LAN IP (e.g. 192.168.x.x), route API calls to the same host IP
  if (typeof window !== 'undefined' && window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return envUrl || 'http://127.0.0.1:8000/api/v1';
};

const API_BASE_URL = getBaseUrl();

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const getFreshToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authToken = session.access_token;
      return session.access_token;
    }
  } catch (err) {
    console.error('Error getting fresh auth session:', err);
  }
  return authToken;
};

const getHeaders = async (extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  const token = await getFreshToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiClient = {
  setAuthToken,

  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  async listFiles() {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/files`, {
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch files');
    }
    return res.json();
  },

  async getFileDetail(fileId) {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to retrieve file details');
    }
    return res.json();
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = await getHeaders();

    const res = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload and segment file');
    }
    return res.json();
  },

  async downloadFile(fileId, filename) {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download and decrypt file');
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'downloaded_file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async deleteFile(fileId) {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete file');
    }
    return true;
  }
};
