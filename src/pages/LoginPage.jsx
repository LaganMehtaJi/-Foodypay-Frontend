import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { playMilestoneCelebration, playOrderPlaced } from '../utils/soundEffects';
import { parsePlanMeta } from '../components/SignupModal';

export default function LoginPage({ onShowToast }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'pin'
  const [selectedPlan, setSelectedPlan] = useState('Free'); // 'Free' | 'Growth' | 'Custom'
  
  // Credentials state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeIdOrPhone, setStoreIdOrPhone] = useState('');
  const [pin, setPin] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  // Handle Google Login Simulation
  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      const user = {
        name: 'Sharma Gourmet Kitchen',
        email: 'sharma.kitchen@gmail.com',
        plan: selectedPlan,
        method: 'Google Account'
      };
      setSuccessUser(user);
      playMilestoneCelebration();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.4 },
        colors: ['#FF5E14', '#22C55E', '#4285F4', '#FBBC05']
      });
      if (onShowToast) {
        onShowToast(`👋 Successfully signed in with Google (${user.email})!`);
      }
    }, 900);
  };

  // Handle Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      if (loginMethod === 'email') {
        if (!email.trim() || !email.includes('@')) {
          setError('Please enter a valid restaurant owner email address.');
          return;
        }
        if (!password.trim() || password.length < 4) {
          setError('Please enter your account password (at least 4 characters).');
          return;
        }
      } else {
        if (!storeIdOrPhone.trim()) {
          setError('Please enter your Restaurant Store ID or registered mobile.');
          return;
        }
        if (!pin.trim() || pin.length < 4) {
          setError('Please enter your 4-digit POS security PIN.');
          return;
        }
      }
    } else {
      // Sign up mode
      if (!restaurantName.trim()) {
        setError('Please enter your Restaurant / Cafe name.');
        return;
      }
      if (!email.trim() && !storeIdOrPhone.trim()) {
        setError('Please provide your phone or email.');
        return;
      }

      // Auto-open WhatsApp with pre-filled message to +91 7496888449
      const targetPhone = '917496888449';
      const cleanName = restaurantName.trim();
      const contactVal = storeIdOrPhone.trim() || email.trim();
      const planMeta = parsePlanMeta(selectedPlan);
      const messageText = `Hello FoodyPay Team! 🍽️\n\nI want to *Request for create Account* on FoodyPay.\n\n📋 *Restaurant Details:*\n• Restaurant Name: ${cleanName}\n• Contact Info: ${contactVal}\n• Selected Plan: *${planMeta.whatsappTag}*\n\nPlease help me set up my restaurant digital menu and QR ordering system. Thank you!`;
      const generatedWaUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(messageText)}`;
      try {
        window.open(generatedWaUrl, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Could not auto-open WhatsApp:', err);
      }
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = {
        name: restaurantName || (loginMethod === 'email' ? email.split('@')[0] : storeIdOrPhone),
        email: email || `${storeIdOrPhone}@foodypay.in`,
        plan: selectedPlan,
        method: authMode === 'signup' ? 'WhatsApp Request (+91 7496888449)' : (loginMethod === 'email' ? 'Email & Password' : 'POS PIN')
      };
      setSuccessUser(user);
      playMilestoneCelebration();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.4 },
        colors: ['#FF5E14', '#22C55E', '#25D366', '#F59E0B']
      });
      if (onShowToast) {
        onShowToast(authMode === 'signup' 
          ? `💬 WhatsApp opened! Account request sent for ${restaurantName}.` 
          : `🎉 Welcome to FoodyPay! Signed into ${selectedPlan} Plan.`
        );
      }
    }, 750);
  };

  // 1-Click Demo Logins
  const handleQuickDemo = (planType) => {
    setSelectedPlan(planType);
    if (planType === 'Free') {
      setEmail('sharma.kitchen@foodypay.in');
      setPassword('demo1234');
      setStoreIdOrPhone('SHARMA-01');
      setPin('1234');
      setRestaurantName("Sharma's Kitchen Cafe");
    } else {
      setEmail('royal.palace@foodypay.in');
      setPassword('growth999');
      setStoreIdOrPhone('ROYAL-PRO');
      setPin('9876');
      setRestaurantName('Royal Palace Dine & Lounge');
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessUser({
        name: planType === 'Free' ? "Sharma's Kitchen Cafe" : 'Royal Palace Dine & Lounge',
        email: planType === 'Free' ? 'sharma.kitchen@foodypay.in' : 'royal.palace@foodypay.in',
        plan: planType,
        method: '1-Click Demo'
      });
      playOrderPlaced();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.4 }
      });
    }, 600);
  };

  return (
    <div className="login-page-wrapper">
      {/* TOP BRAND NAVIGATION BAR */}
      <header className="login-top-bar">
        <div className="login-bar-wrap">
          <a href="/" className="login-brand-back">
            <span className="back-arrow">←</span>
            <span>Return to FoodyPay Home</span>
          </a>

          <a href="/" className="login-logo-link">
            <img src="/Logo.png" alt="FoodyPay Logo" className="login-bar-logo" />
          </a>

          <div className="login-security-tag">
            <span className="sec-dot" />
            <span>256-Bit SSL Cloud POS</span>
          </div>
        </div>
      </header>

      {/* MAIN SPLIT-SCREEN AUTH CONTAINER */}
      <main className="login-split-main">
        {/* LEFT SHOWCASE PANEL (Feature Highlights & Live Screenshot) */}
        <div className="login-showcase-panel">
          <div className="showcase-inner">
            <div className="showcase-badge">
              <span>🚀 THE ALL-IN-ONE OPERATING SYSTEM</span>
            </div>
            <h2>Unify Your Kitchen, Table QR &amp; Billing Ledger.</h2>
            <p className="showcase-sub">
              Access your real-time restaurant command center. Track orders placed table-side, walk-in counter tickets, and manage diner retention on any tablet or phone.
            </p>

            {/* LIVE DASHBOARD SCREENSHOT */}
            <div className="showcase-media-frame">
              <img
                src="/Section-Images/crm-analytics.png"
                alt="FoodyPay Live CRM & Analytics Dashboard"
                className="showcase-dashboard-img"
              />
              <div className="media-overlay-pill">
                <span className="live-pulse-dot" />
                <span>Live Telemetry: 1,451 Active Orders Today</span>
              </div>
            </div>

            {/* VALUE PROPOSITION TICKS */}
            <div className="showcase-perks-grid">
              <div className="perk-item">
                <span className="perk-icon">🟢</span>
                <div>
                  <b>Starter Free Plan</b>
                  <span>₹0/month forever. Zero fixed commitment.</span>
                </div>
              </div>
              <div className="perk-item">
                <span className="perk-icon">⚡</span>
                <div>
                  <b>0% Counter Commission</b>
                  <span>Keep 100% of all cash &amp; counter UPI billing.</span>
                </div>
              </div>
              <div className="perk-item">
                <span className="perk-icon">📱</span>
                <div>
                  <b>Table QR + Online Store</b>
                  <span>Diners order at tables or from home directly.</span>
                </div>
              </div>
              <div className="perk-item">
                <span className="perk-icon">👨‍🍳</span>
                <div>
                  <b>Digital Kitchen KDS</b>
                  <span>Real-time color-coded order prep countdowns.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT AUTH CARD */}
        <div className="login-form-panel">
          <div className="auth-card">
            {!successUser ? (
              <>
                {/* PLAN SELECTION CONTEXT */}
                <div className="plan-context-container">
                  <span className="plan-label">Select Your Account Tier:</span>
                  <div className="plan-tabs-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      type="button"
                      className={`plan-tab-btn ${selectedPlan === 'Free' ? 'active free' : ''}`}
                      onClick={() => setSelectedPlan('Free')}
                    >
                      <span className="plan-name">🟢 Free</span>
                      <span className="plan-price">$0 /mo</span>
                    </button>
                    <button
                      type="button"
                      className={`plan-tab-btn ${selectedPlan === '35 Dollar' || selectedPlan === 'Growth' ? 'active growth' : ''}`}
                      onClick={() => setSelectedPlan('35 Dollar')}
                    >
                      <span className="plan-name">⚡ $35</span>
                      <span className="plan-price">$35 /mo</span>
                    </button>
                    <button
                      type="button"
                      className={`plan-tab-btn ${selectedPlan === '75 Dollar' || selectedPlan === 'Max' ? 'active max' : ''}`}
                      onClick={() => setSelectedPlan('75 Dollar')}
                    >
                      <span className="plan-name">🌟 $75</span>
                      <span className="plan-price">$75 /mo</span>
                    </button>
                    <button
                      type="button"
                      className={`plan-tab-btn ${selectedPlan === 'Custom' ? 'active custom' : ''}`}
                      onClick={() => setSelectedPlan('Custom')}
                    >
                      <span className="plan-name">🏢 Custom</span>
                      <span className="plan-price">White-Label</span>
                    </button>
                  </div>
                </div>

                {/* AUTH MODE TOGGLE (LOGIN VS SIGNUP) */}
                <div className="auth-mode-switch">
                  <button
                    type="button"
                    className={`mode-btn ${authMode === 'login' ? 'active' : ''}`}
                    onClick={() => { setAuthMode('login'); setError(''); }}
                  >
                    Restaurant Sign In
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${authMode === 'signup' ? 'active' : ''}`}
                    onClick={() => { setAuthMode('signup'); setError(''); }}
                  >
                    Request for create Account
                  </button>
                </div>

                <div className="auth-header-text">
                  <h3>
                    {authMode === 'login'
                      ? `Sign In to ${selectedPlan} Portal`
                      : `Start Your ${selectedPlan} Plan Registration`}
                  </h3>
                  <p>
                    {authMode === 'login'
                      ? 'Enter your credentials or use 1-click Google account sign-in.'
                      : 'Zero setup fees. Zero credit card needed to begin.'}
                  </p>
                </div>

                {/* 1. GOOGLE SIGN IN BUTTON */}
                <button
                  type="button"
                  className="google-auth-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="google-icon" viewBox="0 0 48 48" width="22" height="22">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>{loading ? 'Verifying Google Account...' : 'Continue with Google Account'}</span>
                </button>

                {/* OR DIVIDER */}
                <div className="auth-divider">
                  <span>OR WITH RESTAURANT CREDENTIALS</span>
                </div>

                {/* LOGIN METHOD SELECTOR (EMAIL VS STORE ID / PIN) */}
                {authMode === 'login' && (
                  <div className="credential-tabs">
                    <button
                      type="button"
                      className={`cred-tab ${loginMethod === 'email' ? 'active' : ''}`}
                      onClick={() => setLoginMethod('email')}
                    >
                      ✉️ Email &amp; Password
                    </button>
                    <button
                      type="button"
                      className={`cred-tab ${loginMethod === 'pin' ? 'active' : ''}`}
                      onClick={() => setLoginMethod('pin')}
                    >
                      🔢 Store ID &amp; POS PIN
                    </button>
                  </div>
                )}

                {/* LOGIN / SIGNUP FORM */}
                <form className="auth-form" onSubmit={handleSubmit}>
                  {authMode === 'signup' && (
                    <label className="field">
                      Restaurant / Cafe Name *
                      <input
                        type="text"
                        placeholder="e.g. Sharma's Kitchen, Downtown Bistro"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        required
                        autoFocus
                      />
                    </label>
                  )}

                  {authMode === 'login' && loginMethod === 'pin' ? (
                    <>
                      <label className="field">
                        Restaurant Store ID / Registered Phone *
                        <input
                          type="text"
                          placeholder="e.g. SHARMA-01 or 98765 43210"
                          value={storeIdOrPhone}
                          onChange={(e) => setStoreIdOrPhone(e.target.value)}
                          required
                          autoFocus
                        />
                      </label>

                      <label className="field">
                        4-Digit POS Security PIN *
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="•••• (e.g. 1234)"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          required
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="field">
                        Registered Email Address *
                        <input
                          type="email"
                          placeholder="e.g. owner@sharmakitchen.in"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus={authMode === 'login'}
                        />
                      </label>

                      <label className="field">
                        <div className="field-label-row">
                          <span>Password *</span>
                          <button
                            type="button"
                            className="toggle-pass-btn"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? 'Hide 👁️' : 'Show 👁️'}
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </label>
                    </>
                  )}

                  {error && <div className="hint error-text">{error}</div>}

                  <div className="remember-forgot-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Keep me signed in</span>
                    </label>
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password recovery link sent to registered owner WhatsApp/Email!'); }}>
                      Forgot credentials?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="btn primary full-w auth-submit-btn"
                    disabled={loading}
                  >
                    {loading
                      ? 'Authenticating...'
                      : authMode === 'login'
                      ? `🚀 Sign In to ${selectedPlan} Portal`
                      : `💬 Request for create Account`}
                  </button>
                </form>

                {/* 1-CLICK INSTANT DEMO LOGINS */}
                <div className="demo-shortcuts-box">
                  <span className="demo-tag-label">Instant 1-Click Sandbox Portals:</span>
                  <div className="demo-btns-row">
                    <button
                      type="button"
                      className="demo-pill-btn free-demo"
                      onClick={() => handleQuickDemo('Free')}
                    >
                      ⚡ Demo: Sharma's Kitchen (Free Plan)
                    </button>
                    <button
                      type="button"
                      className="demo-pill-btn pro-demo"
                      onClick={() => handleQuickDemo('Growth')}
                    >
                      🌟 Demo: Royal Palace Dine (Growth Plan)
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* SUCCESS AUTHENTICATION STATE */
              <div className="login-success-state">
                <div className="success-check-badge">✓</div>
                <h3>Welcome Back, {successUser.name}!</h3>
                <p className="success-sub">
                  Authenticated successfully via <strong>{successUser.method}</strong> for the{' '}
                  <span className="user-plan-badge">{successUser.plan} Plan</span>.
                </p>

                <div className="session-info-card">
                  <div className="session-row">
                    <span>Account Email</span>
                    <b>{successUser.email}</b>
                  </div>
                  <div className="session-row">
                    <span>Active Storefront</span>
                    <b>Table QR &amp; Online Menu Live</b>
                  </div>
                  <div className="session-row">
                    <span>Terminal Mode</span>
                    <b>Kitchen KDS &amp; Billing Synchronized</b>
                  </div>
                </div>

                <div className="success-action-group">
                  <a href="/" className="btn primary full-w">
                    🖥️ Launch Restaurant POS &amp; KDS Console
                  </a>
                  <button
                    type="button"
                    className="btn full-w"
                    onClick={() => setSuccessUser(null)}
                  >
                    Sign In with Different Restaurant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
