import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { playMilestoneCelebration } from '../utils/soundEffects';
import { loginApi, googleAuthApi, firebaseAuthApi, checkEmailExistsApi } from '../utils/api';
import { loginWithFirebaseEmail, loginWithFirebaseGoogle, sendFirebasePasswordReset } from '../utils/firebase';

export default function LoginModal({ isOpen, onClose, onShowToast, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  const [showForgot, setShowForgot] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
      setSuccessUser(null);
      setShowForgot(false);
      setResetMsg('');

      // Pre-fill remembered email & password
      const savedEmail = localStorage.getItem('foodypay_remember_email');
      const savedPass = localStorage.getItem('foodypay_remember_password');
      if (savedEmail) setEmail(savedEmail);
      if (savedPass) setPassword(savedPass);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      let response = null;

      // 1. Primary Authentication: Attempt MongoDB Backend login directly
      try {
        response = await loginApi(cleanEmail, cleanPassword);
      } catch (dbErr) {
        // 2. Fallback Attempt via Firebase Auth Sync
        try {
          const fbRes = await loginWithFirebaseEmail(cleanEmail, cleanPassword);
          if (fbRes && fbRes.user) {
            response = await firebaseAuthApi({
              firebaseToken: fbRes.token,
              uid: fbRes.user.uid,
              email: fbRes.user.email,
              name: fbRes.user.displayName || cleanEmail.split('@')[0],
              emailVerified: fbRes.user.emailVerified,
              providerId: 'password',
            });
          }
        } catch (fbErr) {
          throw dbErr;
        }
      }

      if (response && response.success && response.data) {
        const userData = response.data;
        if (userData.token) {
          localStorage.setItem('foodypay_token', userData.token);
          localStorage.setItem('foodypay_user', JSON.stringify(userData));
        }

        if (rememberMe) {
          localStorage.setItem('foodypay_remember_email', cleanEmail);
          localStorage.setItem('foodypay_remember_password', cleanPassword);
        } else {
          localStorage.removeItem('foodypay_remember_email');
          localStorage.removeItem('foodypay_remember_password');
        }

        setSuccessUser(userData);
        playMilestoneCelebration();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });

        if (onShowToast) {
          onShowToast(`Welcome back, ${userData.name}!`);
        }
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 600);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      let firebaseRes = null;
      try {
        firebaseRes = await loginWithFirebaseGoogle();
      } catch (fbErr) {
        console.warn('Firebase Google modal auth fallback:', fbErr.message);
      }

      const gEmail = firebaseRes?.user?.email ? firebaseRes.user.email.toLowerCase().trim() : email.trim().toLowerCase();
      const gName = firebaseRes?.user?.displayName || 'Restaurant Owner';
      const gUid = firebaseRes?.user?.uid || 'google_uid_' + Date.now();
      const gPhoto = firebaseRes?.user?.photoURL || '';

      const googlePayload = {
        firebaseToken: firebaseRes?.token || 'google_token_' + Date.now(),
        credential: firebaseRes?.token || 'google_token_' + Date.now(),
        uid: gUid,
        email: gEmail,
        name: gName,
        picture: gPhoto,
        providerId: 'google.com',
      };

      const res = await firebaseAuthApi(googlePayload).catch(() => googleAuthApi(googlePayload));
      if (res && res.success && res.data) {
        if (res.data.token) {
          localStorage.setItem('foodypay_token', res.data.token);
          localStorage.setItem('foodypay_user', JSON.stringify(res.data));
        }
        setSuccessUser(res.data);
        playMilestoneCelebration();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
        if (onShowToast) onShowToast(`Logged in with Google via Firebase as ${res.data.name}!`);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 600);
      } else {
        setError(`No registered account found for ${gEmail}. Please click "Register Free Account" below.`);
        if (onShowToast) onShowToast(`No account found for ${gEmail}. Please Register first.`);
      }
    } catch (err) {
      setError(err.message || 'Google Auth failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter your email address above to receive a reset link.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await sendFirebasePasswordReset(email.trim());
      setResetMsg(res.message);
      if (onShowToast) onShowToast(`Password reset email sent to ${email.trim()}!`);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog auth-split-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <button
          className="close"
          onClick={onClose}
          aria-label="Close"
          style={{ top: '16px', right: '18px', color: '#64748B', zIndex: 10, fontSize: '1.4rem' }}
        >
          ×
        </button>

        {/* LEFT BRAND SIDE PANEL */}
        <div
          className="auth-side-brand-panel"
          style={{
            background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
            padding: '36px 28px'
          }}
        >
          <div>
            <div style={{ display: 'inline-block', background: '#FFFFFF', padding: '6px 14px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}>
              <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '36px', objectFit: 'contain', display: 'block' }} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Welcome Back!
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
              Sign in to manage your kitchen orders, billing &amp; QR settings.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '28px 0' }}>
            <div style={{ fontSize: '0.82rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Firebase 256-Bit Auth Security
            </div>
            <div style={{ fontSize: '0.82rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Real-time Kitchen Order Streams
            </div>
            <div style={{ fontSize: '0.82rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Sales Analytics &amp; Ledger
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            © 2026 FoodyPay. All rights reserved.
          </div>
        </div>

        {/* RIGHT MAIN FORM PANEL */}
        <div className="auth-main-form-panel" style={{ padding: '40px 36px' }}>
          {!successUser ? (
            <div>
              <div style={{ marginBottom: '22px' }}>
                <span
                  style={{
                    background: '#FFF2EB',
                    color: '#FF5E14',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    padding: '4px 12px',
                    borderRadius: '20px'
                  }}
                >
                  RESTAURANT PORTAL
                </span>
                <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                  Sign In to FoodyPay
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                  Enter your credentials or use Google to open dashboard.
                </p>
              </div>

              {/* GOOGLE LOGIN */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: '#334155',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '18px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                }}
              >
                <svg viewBox="0 0 48 48" width="18" height="18">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 18px' }}>
                <div style={{ flex: 1, borderBottom: '1px solid #E2E8F0' }} />
                <span style={{ padding: '0 10px', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 700 }}>
                  OR SIGN IN WITH EMAIL
                </span>
                <div style={{ flex: 1, borderBottom: '1px solid #E2E8F0' }} />
              </div>

              {resetMsg && (
                <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, marginBottom: '14px' }}>
                  {resetMsg}
                </div>
              )}

              {/* LOGIN FORM */}
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="field-label-lg">Email Address *</label>
                  <input
                    type="email"
                    className="input-lg"
                    placeholder="cafe@foodypay.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (passwordInputRef.current) passwordInputRef.current.focus();
                      }
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="field-label-lg">Password *</label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      style={{ background: 'none', border: 'none', color: '#FF5E14', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    className="input-lg"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLoginSubmit();
                      }
                    }}
                    required
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember password</span>
                </label>

                {error && (
                  <div
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#EF4444',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 600
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn primary"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    minHeight: '50px',
                    borderRadius: '12px',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-icon" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In to Dashboard</span>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.88rem', color: '#64748B' }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#FF5E14', fontWeight: 800, cursor: 'pointer' }}
                    onClick={() => {
                      onClose();
                      if (onSwitchToSignup) onSwitchToSignup();
                    }}
                  >
                    Register Free Account →
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* RICH WELCOME BANNER ON LOGIN SUCCESS */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                  margin: '0 auto 18px',
                  boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)'
                }}
              >
                
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                WELCOME BACK, {successUser.name.toUpperCase()}!
              </h2>

              <p style={{ color: '#64748B', fontSize: '0.96rem', margin: '0 0 20px' }}>
                Logged in successfully! Opening <b>{successUser.businessName || 'FoodyPay Dashboard'}</b>...
              </p>

              <a
                href="/dashboard"
                className="btn primary"
                style={{
                  display: 'inline-flex',
                  width: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  minHeight: '52px',
                  borderRadius: '12px'
                }}
              >
                Open Dashboard Now
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
