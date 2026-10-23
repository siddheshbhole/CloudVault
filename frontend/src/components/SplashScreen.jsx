import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onFinish }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const totalDuration = mediaQuery.matches ? 1000 : 2350;
    const fadeOutDuration = 450;

    // Start fadeout after animation sequence finishes
    const timer = setTimeout(() => {
      setFadingOut(true);
      // Remove component after fadeout transition
      const endTimer = setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, fadeOutDuration);

      return () => clearTimeout(endTimer);
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div className={`splash-overlay ${fadingOut ? 'fade-out' : ''}`} aria-hidden="true">
      <div className="splash-container">
        {/* Shield Icon Stage */}
        <div className="splash-shield-wrapper">
          <div className="shield-pulse-ring" />
          <svg
            className="splash-shield-svg"
            viewBox="0 0 72 84"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            {/* Shield Body */}
            <path
              className="shield-path"
              d="M36 3L66 14.5V40C66 61.5 53 74 36 81C19 74 6 61.5 6 40V14.5L36 3Z"
            />

            {/* Verification Checkmark (✓) */}
            <path
              className="shield-check-path"
              d="M24 41L32.5 49.5L48.5 32"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Brand Text Reveal Stage with staggered sliding words and animated underline */}
        <div className="splash-brand">
          <div className="brand-word-wrapper">
            <span className="brand-text-cloud">Cloud</span>
          </div>
          <div className="brand-word-wrapper">
            <span className="brand-text-vault">Vault</span>
          </div>
          {/* Animated accent underline */}
          <div className="brand-underline-track">
            <div className="brand-underline-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}
