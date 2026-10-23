import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from './services/apiClient';
import { formatBytes, formatDate } from './utils/formatters';
import { 
  ShieldCheck, 
  UploadCloud, 
  Download, 
  Trash2, 
  FileText, 
  HardDrive, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import './App.css';

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);
  const fileInputRef = useRef(null);

  // Check health and load files
  const loadInitialData = async () => {
    try {
      await apiClient.getHealth();
      setBackendOnline(true);
      fetchFiles();
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await apiClient.listFiles();
      setFiles(data);
    } catch (err) {
      showNotice(err.message || 'Could not load files', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await apiClient.uploadFile(file);
      showNotice(`Successfully encrypted & stored "${file.name}"!`);
      fetchFiles();
    } catch (err) {
      showNotice(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This will remove its encrypted blocks.`)) return;
    try {
      await apiClient.deleteFile(fileId);
      showNotice(`Deleted "${fileName}"`);
      fetchFiles();
    } catch (err) {
      showNotice(err.message || 'Deletion failed', 'error');
    }
  };

  // Metrics
  const totalStorage = files.reduce((acc, curr) => acc + (curr.original_size || 0), 0);
  const totalBlocks = files.reduce((acc, curr) => acc + (curr.block_count || 0), 0);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1>CloudVault</h1>
            <p>Segmented & AES-256-GCM Encrypted Cloud Storage</p>
          </div>
        </div>

        <div className="header-status">
          <span className={`status-dot ${backendOnline ? 'active' : ''}`} />
          <span>{backendOnline ? 'FastAPI Connected' : 'Connecting to API...'}</span>
          <button className="btn-icon" onClick={loadInitialData} title="Refresh connection">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </header>

      {/* Alert Banner */}
      {notification && (
        <div className={`alert-banner ${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Stored Files</div>
          <div className="stat-value">{files.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Encrypted Blocks</div>
          <div className="stat-value">{totalBlocks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Plaintext Size</div>
          <div className="stat-value">{formatBytes(totalStorage)}</div>
        </div>
      </section>

      {/* Drag & Drop Upload Zone */}
      <div 
        className={`upload-card ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
      >
        <div className="upload-icon-wrapper">
          <UploadCloud size={28} />
        </div>
        <h2 className="upload-title">
          {uploading ? 'Segmenting, Encrypting & Uploading...' : 'Upload file to secure vault'}
        </h2>
        <p className="upload-subtitle">
          Files are automatically split into 1 MiB blocks and encrypted using AES-256-GCM
        </p>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="file-input" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          disabled={uploading}
        />

        <button 
          className="upload-btn" 
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={16} />
          <span>{uploading ? 'Processing File...' : 'Choose File'}</span>
        </button>
      </div>

      {/* Files Table Section */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Stored Files</h2>
          <button className="btn-icon" onClick={fetchFiles} title="Reload file list">
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="files-table-card">
          {files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={40} />
              </div>
              <h3>No files uploaded yet</h3>
              <p>Upload a file above to view segmentation and encrypted cloud storage in action.</p>
            </div>
          ) : (
            <table className="files-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Size</th>
                  <th>Blocks</th>
                  <th>Status</th>
                  <th>Uploaded At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="file-name-cell">
                        <FileText size={18} color="#64748b" />
                        <span>{file.original_name}</span>
                      </div>
                    </td>
                    <td>{formatBytes(file.original_size)}</td>
                    <td>
                      <span title={`${file.chunk_size ? formatBytes(file.chunk_size) : '1 MB'} chunks`}>
                        {file.block_count} {file.block_count === 1 ? 'block' : 'blocks'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${file.status}`}>
                        {file.status}
                      </span>
                    </td>
                    <td>{formatDate(file.created_at)}</td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <a 
                          href={apiClient.getDownloadUrl(file.id)}
                          className="btn-icon" 
                          title="Decrypt & Download"
                          download
                        >
                          <Download size={16} />
                        </a>
                        <button 
                          className="btn-icon delete" 
                          title="Delete file & objects"
                          onClick={() => handleDelete(file.id, file.original_name)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
