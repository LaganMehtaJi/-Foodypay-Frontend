import React, { useState } from 'react';

export default function Navbar({ onOpenSignup, onOpenLogin }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <nav className="nav">
      <div className="wrap">
        <a className="logo" href="/" aria-label="FoodyPay home">
          <video
            src="/Logo_Vidio.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="logo-video"
            title="FoodyPay"
          />
        </a>

        <div className={`links ${mobileOpen ? 'open' : ''}`} id="links">
          <a href="/#how" onClick={handleLinkClick}>How it works</a>
          <a href="/#guest" onClick={handleLinkClick}>Guests</a>
          <a href="/#control" onClick={handleLinkClick}>Control</a>
          <a href="/#pricing" onClick={handleLinkClick}>Pricing</a>

          {/* Dedicated 3-Step Website Creator (Opens in a New Tab) */}
          <a
            href="/create-website"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-builder-link"
            onClick={handleLinkClick}
            title="Live your restaurant website in just 3 steps (1 Week Free Trial)"
          >
            <span className="live-sparkle-dot"></span>
            🚀 Live Website in 3 Steps
          </a>

          {/* Restaurant Portal Login (Opens in New Tab) */}
          <a
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-login-btn"
            onClick={handleLinkClick}
            title="Restaurant Login Portal (New Tab)"
          >
            Login
          </a>

          {/* Start Free Plan */}
          <button 
            type="button"
            className="nav-free-btn" 
            onClick={() => {
              setMobileOpen(false);
              onOpenSignup('Free');
            }}
          >
            Start Free Plan
          </button>
        </div>

        <button 
          className="menu-btn" 
          id="menuBtn" 
          aria-label="Open menu" 
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
