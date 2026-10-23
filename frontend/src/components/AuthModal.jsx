import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ShieldCheck, Mail, Lock, LogIn, UserPlus, UserCheck, AlertCircle, User } from 'lucide-react';
import './AuthModal.css';

export default function AuthModal({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim() || undefined,
            }
          }
        });
        if (error) throw error;
        if (data?.session) {
          onAuthSuccess(data.session);
        } else {
          setInfoMsg('Account created! Please check your email or proceed to sign in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data?.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setGuestLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        throw new Error(error.message + ' (Make sure "Anonymous sign-ins" is enabled in Supabase Dashboard -> Authentication -> Providers)');
      }
      if (data?.session) {
        onAuthSuccess(data.session);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <ShieldCheck size={28} />
          </div>
          <h2>{isRegister ? 'Create your Vault Account' : 'Welcome to CloudVault'}</h2>
          <p>
            {isRegister
              ? 'Register with your email, password, and optional username'
              : 'Sign in to access your encrypted cloud vault'}
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="auth-alert success">
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Primary Form: Username (optional) + Email & Password */}
        <form onSubmit={handleEmailAuth} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label>
                Username <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.75rem' }}>(optional)</span>
              </label>
              <div className="input-wrapper">
                <User size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Manik, Alex..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email address</label>
            <div className="input-wrapper">
              <Mail size={16} className="field-icon" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={16} className="field-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading || guestLoading}>
            {loading ? (
              'Processing...'
            ) : isRegister ? (
              <>
                <UserPlus size={16} /> Register
              </>
            ) : (
              <>
                <LogIn size={16} /> Login
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Guest Option */}
        <button
          type="button"
          className="guest-btn-full"
          onClick={handleGuestSignIn}
          disabled={loading || guestLoading}
          title="Continue as Anonymous Guest"
        >
          <UserCheck size={18} color="#2563eb" />
          <span>{guestLoading ? 'Starting Guest Session...' : 'Continue as Guest'}</span>
        </button>

        {/* Toggle between Login and Register */}
        <div className="auth-footer">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="toggle-link"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              First time here?{' '}
              <button
                type="button"
                className="toggle-link"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
              >
                Create an account (Register)
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
