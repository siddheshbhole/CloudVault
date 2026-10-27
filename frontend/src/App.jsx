import React, { useState, useEffect, useRef } from 'react';
import { apiClient, setAuthToken } from './services/apiClient';
import { supabase } from './services/supabaseClient';
import AuthModal from './components/AuthModal';
import SplashScreen from './components/SplashScreen';
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
  RefreshCw, 
  LogOut, 
  User, 
  KeyRound, 
  Database,
  ArrowRight,
  ExternalLink,
  Lock,
  Cloud,
  Server,
  FolderLock,
  Shield,
  Binary
} from 'lucide-react';
import './App.css';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize Supabase Auth session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
      setAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.access_token) {
        setAuthToken(session.access_token);
      } else {
        setAuthToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // When session changes or on load, fetch files
  useEffect(() => {
    if (session) {
      fetchFiles();
    }
  }, [session]);

  const fetchFiles = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiClient.listFiles();
      setFiles(data);
    } catch (err) {
      if (err.message && err.message.includes('expired')) {
        // Attempt immediate token refresh
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session) {
          setSession(refreshData.session);
          setAuthToken(refreshData.session.access_token);
          try {
            const retryData = await apiClient.listFiles();
            setFiles(retryData);
            return;
          } catch (retryErr) {
            showNotice(retryErr.message || 'Session expired. Please sign in again.', 'error');
            return;
          }
        }
      }
      showNotice(err.message || 'Could not load files', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setFiles([]);
    setAuthToken(null);
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

  const handleDownload = async (fileId, fileName) => {
    try {
      showNotice(`Decrypting and downloading "${fileName}"...`);
      await apiClient.downloadFile(fileId, fileName);
    } catch (err) {
      showNotice(err.message || 'Download failed', 'error');
    }
  };

  // Metrics
  const totalStorage = files.reduce((acc, curr) => acc + (curr.original_size || 0), 0);
  const totalBlocks = files.reduce((acc, curr) => acc + (curr.block_count || 0), 0);

  // Derive custom user display name and profile initial (e.g. Ⓜ️ Manik or 👤 Guest)
  const isAnonymous = session?.user?.is_anonymous;
  const customUsername = session?.user?.user_metadata?.username;
  const userEmail = session?.user?.email;

  let displayName = 'Guest';
  let initial = 'G';

  if (!isAnonymous) {
    if (customUsername) {
      displayName = customUsername;
      initial = customUsername.charAt(0).toUpperCase();
    } else if (userEmail) {
      displayName = userEmail.split('@')[0];
      initial = displayName.charAt(0).toUpperCase();
    }
  }

  return (
    <>
      {/* 1. Animated Splash Screen Intro */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Main App Content */}
      {authChecking ? (
        <div className="loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
          <p>Loading CloudVault session...</p>
        </div>
      ) : !session ? (
        <AuthModal 
          onAuthSuccess={(newSession) => {
            setSession(newSession);
            if (newSession?.access_token) {
              setAuthToken(newSession.access_token);
            }
          }} 
        />
      ) : (
        <div className="app-page-wrapper">
          {/* Top White Hero Container */}
          <div className="hero-page-container">
            <div className="content-inner">
              {/* Top Navbar Header */}
              <header className="app-header">
                {/* Top Left: Logo & Name */}
                <div className="brand">
                  <div className="brand-icon">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <h1>CloudVault</h1>
                    <p>Secure File Segmentation & Encryption</p>
                  </div>
                </div>

                {/* Top Right: User Profile Circle & Name */}
                <div className="user-profile-chip">
                  <div className="user-avatar-circle">
                    {isAnonymous ? '👤' : initial}
                  </div>
                  <div className="user-info-text">
                    <span className="user-display-name">{displayName}</span>
                    <span className="user-display-role">{isAnonymous ? 'Guest Vault' : 'Authorized User'}</span>
                  </div>
                  <button 
                    className="btn-signout" 
                    onClick={handleSignOut}
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </header>

              {/* Alert Banner */}
              {notification && (
                <div className={`alert-banner ${notification.type}`}>
                  <span>{notification.message}</span>
                </div>
              )}

              {/* Horizontal Hero Banner with Cloud/Security Logo Mosaic Background */}
              <section className="hero-horizontal-banner">
                {/* Ambient Randomly Positioned Floating Cloud/Security Logo Objects */}
                <div className="hero-logo-pattern" aria-hidden="true">
                  <div className="floating-logo float-item-1" title="Cloud"><Cloud size={44} /></div>
                  <div className="floating-logo float-item-2" title="Lock"><Lock size={36} /></div>
                  <div className="floating-logo float-item-3" title="Database"><Database size={40} /></div>
                  <div className="floating-logo float-item-4" title="Shield"><Shield size={38} /></div>
                  <div className="floating-logo float-item-5" title="Server"><Server size={34} /></div>
                  <div className="floating-logo float-item-6" title="HardDrive"><HardDrive size={42} /></div>
                  <div className="floating-logo float-item-7" title="FolderLock"><FolderLock size={38} /></div>
                  <div className="floating-logo float-item-8" title="UploadCloud"><UploadCloud size={44} /></div>
                  <div className="floating-logo float-item-9" title="KeyRound"><KeyRound size={36} /></div>
                  <div className="floating-logo float-item-10" title="Binary"><Binary size={36} /></div>
                  <div className="floating-logo float-item-11" title="ShieldCheck"><ShieldCheck size={42} /></div>
                  <div className="floating-logo float-item-12" title="Layers"><Layers size={40} /></div>
                </div>

                {/* Foreground Hero Content */}
                <div className="hero-banner-content">
                  <div className="hero-pill">
                    <ShieldCheck size={14} />
                    <span>Next-Gen Cloud Storage</span>
                  </div>
                  <h2 className="hero-title">
                    One Click to Segment & <span>Secure Your Files</span>
                  </h2>
                  <p className="hero-description">
                    CloudVault divides your sensitive data into verified 1 MiB blocks, encrypts every chunk with authenticated AES-256-GCM before upload, and securely stores them in private cloud vaults.
                  </p>
                  <button 
                    type="button" 
                    className="hero-cta-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>Upload New File</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* Diagonal Angled Divider Transition between Hero (White) and Services (Light Grey) */}
          <div className="diagonal-divider" aria-hidden="true" />

          {/* Following Section (Light Grey Background with Cut-Dark Services Card & Dashboard) */}
          <div className="secondary-page-container">
            <div className="content-inner">
              {/* Services Provided Section (With Cut Darkish Surface Shade) */}
              <section className="services-section-wrapper">
                <div className="services-header">
                  <span className="services-badge">What We Do</span>
                  <h3 className="services-title">Services Provided</h3>
                  <p className="services-subtitle">
                    Comprehensive cryptographic pipeline protecting your data from upload to cloud reconstruction.
                  </p>
                </div>

                <div className="services-grid">
                  <div className="service-card">
                    <div className="service-icon-box">
                      <Layers size={22} />
                    </div>
                    <h4>File Segmentation</h4>
                    <p>
                      Splits large uploads into uniform 1 MiB ordered blocks with collision-resistant indexing and checksum validation.
                    </p>
                    <span className="service-learn-more">
                      <span>1 MiB Chunks</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>

                  <div className="service-card">
                    <div className="service-icon-box">
                      <KeyRound size={22} />
                    </div>
                    <h4>AES-256-GCM Encryption</h4>
                    <p>
                      Client-separated authenticated encryption with a unique 96-bit nonce per block to guarantee tamper-proof security.
                    </p>
                    <span className="service-learn-more">
                      <span>AES-GCM Auth</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>

                  <div className="service-card">
                    <div className="service-icon-box">
                      <Database size={22} />
                    </div>
                    <h4>Cloud Reconstruction</h4>
                    <p>
                      Retrieves encrypted blocks in sequence from private Supabase Storage and decrypts byte-for-byte upon download.
                    </p>
                    <span className="service-learn-more">
                      <span>Safe Streaming</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </section>

              {/* Vault Storage Metrics */}
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

              {/* Stored Files Table Section */}
              <section>
                <div className="section-header">
                  <h2 className="section-title">Stored Files</h2>
                  <button className="btn-icon" onClick={fetchFiles} title="Reload file list">
                    <RefreshCw size={14} className={loading ? 'spin' : ''} />
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
                                <button 
                                  className="btn-icon" 
                                  title="Decrypt & Download"
                                  onClick={() => handleDownload(file.id, file.original_name)}
                                >
                                  <Download size={16} />
                                </button>
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
          </div>

          {/* Full-Bleed Edge-to-Edge Technologies Footer */}
          <footer className="app-footer-fullwidth">
            <div className="content-inner">
              <div className="footer-top">
                <div className="footer-brand">
                  <div className="brand" style={{ gap: '8px' }}>
                    <div className="brand-icon" style={{ width: '32px', height: '32px' }}>
                      <ShieldCheck size={18} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>CloudVault</span>
                  </div>
                  <p className="footer-tagline">
                    Secure cloud file storage with client-side block segmentation, AES-256-GCM encryption, and deterministic reconstruction.
                  </p>
                </div>

                <div className="footer-tech-grid">
                  <div className="footer-tech-col">
                    <span className="footer-col-title">Core Cryptography</span>
                    <ul className="footer-links">
                      <li>
                        <a href="https://en.wikipedia.org/wiki/File_splitting" target="_blank" rel="noopener noreferrer">
                          <span>File Segmentation (Chunking)</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                      <li>
                        <a href="https://en.wikipedia.org/wiki/Galois/Counter_Mode" target="_blank" rel="noopener noreferrer">
                          <span>AES-256-GCM (Authenticated AEAD)</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                      <li>
                        <a href="https://en.wikipedia.org/wiki/Cryptographic_nonce" target="_blank" rel="noopener noreferrer">
                          <span>96-bit Cryptographic Nonce</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                      <li>
                        <a href="https://en.wikipedia.org/wiki/SHA-2" target="_blank" rel="noopener noreferrer">
                          <span>SHA-256 Integrity Checksums</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div className="footer-tech-col">
                    <span className="footer-col-title">Cloud & Backend</span>
                    <ul className="footer-links">
                      <li>
                        <a href="https://supabase.com/docs/guides/storage" target="_blank" rel="noopener noreferrer">
                          <span>Supabase Private Storage</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                      <li>
                        <a href="https://supabase.com/docs/guides/auth" target="_blank" rel="noopener noreferrer">
                          <span>Supabase Auth & JWT</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                      <li>
                        <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer">
                          <span>Python FastAPI Engine</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                      <li>
                        <a href="https://www.postgresql.org/docs/current/ddl-rowsecurity.html" target="_blank" rel="noopener noreferrer">
                          <span>PostgreSQL Row Level Security (RLS)</span>
                          <ExternalLink size={12} />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="footer-bottom">
                <span>© {new Date().getFullYear()} CloudVault Project. All cryptographic operations verified.</span>
                <span style={{ color: '#64748b' }}>React + Vite • FastAPI • Supabase</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
