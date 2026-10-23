const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const getHeaders = (extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
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
    const res = await fetch(`${API_BASE_URL}/files`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch files');
    }
    return res.json();
  },

  async getFileDetail(fileId) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      headers: getHeaders()
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

    const res = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload and segment file');
    }
    return res.json();
  },

  async downloadFile(fileId, filename) {
    const res = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
      headers: getHeaders()
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
    const res = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to delete file');
    }
    return true;
  }
};
