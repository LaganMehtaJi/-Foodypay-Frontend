import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { playMilestoneCelebration } from '../utils/soundEffects';
import { registerApi, loginApi, googleAuthApi } from '../utils/api';

export default function LoginPage({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'login'
  const [regStep, setRegStep] = useState(1); // 1, 2, 3, 4

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  // Input refs for Enter key auto focus
  const lastNameRef = useRef(null);
  const contactNoRef = useRef(null);
  const passwordRef = useRef(null);
  const loginPassRef = useRef(null);

  useEffect(() => {
    // Load remembered email/password
    const savedEmail = localStorage.getItem('foodypay_remember_email');
    const savedPass = localStorage.getItem('foodypay_remember_password');
    if (savedEmail) setEmail(savedEmail);
    if (savedPass) setPassword(savedPass);
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo image must be under 5MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const googlePayload = {
        credential: 'demo_google_id_token_' + Date.now(),
        email: email.trim() || 'owner@gmail.com',
        name: `${firstName || 'Restaurant'} ${lastName || 'Owner'}`.trim(),
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        businessName: businessName.trim() || "Sharma's Kitchen",
        contactNo: contactNo.trim() || '+91 9876543210',
        googleId: 'google_sub_' + Date.now(),
      };

      const res = await googleAuthApi(googlePayload);
      if (res.success && res.data) {
        if (res.data.token) {
          localStorage.setItem('foodypay_token', res.data.token);
          localStorage.setItem('foodypay_user', JSON.stringify(res.data));
        }
        setSuccessUser(res.data);
        playMilestoneCelebration();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        if (onShowToast) onShowToast(`👋 Signed in with Google as ${res.data.name}!`);
      }
    } catch (err) {
      setError(err.message || 'Google Auth failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginApi(email.trim(), password.trim());
      if (response.success && response.data) {
        const userData = response.data;
        if (userData.token) {
          localStorage.setItem('foodypay_token', userData.token);
          localStorage.setItem('foodypay_user', JSON.stringify(userData));
        }

        if (rememberMe) {
          localStorage.setItem('foodypay_remember_email', email.trim());
          localStorage.setItem('foodypay_remember_password', password.trim());
        }

        setSuccessUser(userData);
        playMilestoneCelebration();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
        if (onShowToast) onShowToast(`🎉 Welcome back, ${userData.name}!`);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const formData = new FormData();
      formData.append('name', fullName);
      formData.append('email', email.trim());
      formData.append('password', password.trim());
      formData.append('businessName', businessName.trim());
      formData.append('contactNo', contactNo.trim());
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const response = await registerApi(formData);
      if (response.success && response.data) {
        const userData = response.data;
        if (userData.token) {
          localStorage.setItem('foodypay_token', userData.token);
          localStorage.setItem('foodypay_user', JSON.stringify(userData));
        }

        if (rememberMe) {
          localStorage.setItem('foodypay_remember_email', email.trim());
          localStorage.setItem('foodypay_remember_password', password.trim());
        }

        setSuccessUser(userData);
        playMilestoneCelebration();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
        if (onShowToast) onShowToast(`🚀 Account created for ${userData.businessName}!`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div
        className="auth-split-dialog"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15)',
          border: '1px solid #E2E8F0'
        }}
      >
        {/* LEFT BRAND PANEL */}
        <div
          className="auth-side-brand-panel"
          style={{
            background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
            padding: '36px 28px'
          }}
        >
          <div>
            <a href="/">
              <div style={{ display: 'inline-block', background: '#FFFFFF', padding: '6px 14px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}>
                <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '36px', objectFit: 'contain', display: 'block' }} />
              </div>
            </a>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              FoodyPay Platform
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
              {activeTab === 'register' ? 'Free Step-by-Step Account Setup' : 'Restaurant Owner Portal'}
            </p>
          </div>

          {activeTab === 'register' ? (
            <div className="step-wizard-nav" style={{ margin: '28px 0' }}>
              <div className={`step-wizard-item ${regStep === 1 ? 'active' : regStep > 1 ? 'completed' : ''}`}>
                <div className="step-badge-num">{regStep > 1 ? '✓' : '1'}</div>
                <span>1. Owner Name</span>
              </div>
              <div className={`step-wizard-item ${regStep === 2 ? 'active' : regStep > 2 ? 'completed' : ''}`}>
                <div className="step-badge-num">{regStep > 2 ? '✓' : '2'}</div>
                <span>2. Business Details</span>
              </div>
              <div className={`step-wizard-item ${regStep === 3 ? 'active' : regStep > 3 ? 'completed' : ''}`}>
                <div className="step-badge-num">{regStep > 3 ? '✓' : '3'}</div>
                <span>3. Account Security</span>
              </div>
              <div className={`step-wizard-item ${regStep === 4 ? 'active' : ''}`}>
                <div className="step-badge-num">4</div>
                <span>4. Logo Upload</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '28px 0' }}>
              <div style={{ fontSize: '0.82rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF5E14' }}>⚡</span> Real-time Kitchen Order Streams
              </div>
              <div style={{ fontSize: '0.82rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF5E14' }}>📊</span> Sales Analytics &amp; Ledger
              </div>
              <div style={{ fontSize: '0.82rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#FF5E14' }}>📱</span> Table QR Standee Management
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
            © 2026 FoodyPay. All rights reserved.
          </div>
        </div>

        {/* RIGHT MAIN PANEL */}
        <div className="auth-main-form-panel" style={{ padding: '40px 36px' }}>
          {/* TAB TOGGLE */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: '#F1F5F9',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError('');
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '9px',
                border: 'none',
                fontWeight: activeTab === 'register' ? 800 : 600,
                fontSize: '0.9rem',
                backgroundColor: activeTab === 'register' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'register' ? '#FF5E14' : '#64748B',
                boxShadow: activeTab === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer'
              }}
            >
              🟢 Register Free Account
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError('');
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '9px',
                border: 'none',
                fontWeight: activeTab === 'login' ? 800 : 600,
                fontSize: '0.9rem',
                backgroundColor: activeTab === 'login' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'login' ? '#FF5E14' : '#64748B',
                boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer'
              }}
            >
              🔐 Sign In
            </button>
          </div>

          {!successUser ? (
            <div>
              {/* GOOGLE SIGN IN */}
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
                  OR {activeTab === 'register' ? 'REGISTER' : 'SIGN IN'} WITH EMAIL
                </span>
                <div style={{ flex: 1, borderBottom: '1px solid #E2E8F0' }} />
              </div>

              {/* MODE 1: STEP-BY-STEP REGISTER */}
              {activeTab === 'register' ? (
                <div>
                  {regStep === 1 && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!firstName.trim()) return setError('Please enter First Name.');
                      if (!lastName.trim()) return setError('Please enter Last Name.');
                      setError('');
                      setRegStep(2);
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label className="field-label-lg">First Name *</label>
                          <input
                            type="text"
                            className="input-lg"
                            placeholder="e.g. Rahul"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (lastNameRef.current) lastNameRef.current.focus();
                              }
                            }}
                            autoFocus
                            required
                          />
                        </div>
                        <div>
                          <label className="field-label-lg">Last Name *</label>
                          <input
                            ref={lastNameRef}
                            type="text"
                            className="input-lg"
                            placeholder="e.g. Sharma"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!firstName.trim()) return setError('Please enter First Name.');
                                if (!lastName.trim()) return setError('Please enter Last Name.');
                                setError('');
                                setRegStep(2);
                              }
                            }}
                            required
                          />
                        </div>
                      </div>

                      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginTop: '14px' }}>⚠️ {error}</div>}

                      <button type="submit" className="btn primary" style={{ width: '100%', marginTop: '24px', minHeight: '48px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 800 }}>
                        Next: Business Details →
                      </button>
                    </form>
                  )}

                  {regStep === 2 && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!businessName.trim()) return setError('Please enter Business Name.');
                      if (!contactNo.trim()) return setError('Please enter Contact Number.');
                      setError('');
                      setRegStep(3);
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label className="field-label-lg">Business / Restaurant Name *</label>
                          <input
                            type="text"
                            className="input-lg"
                            placeholder="e.g. Sharma's Kitchen"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (contactNoRef.current) contactNoRef.current.focus();
                              }
                            }}
                            autoFocus
                            required
                          />
                        </div>
                        <div>
                          <label className="field-label-lg">Contact Phone Number *</label>
                          <input
                            ref={contactNoRef}
                            type="tel"
                            className="input-lg"
                            placeholder="e.g. +91 98765 43210"
                            value={contactNo}
                            onChange={(e) => setContactNo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!businessName.trim()) return setError('Please enter Business Name.');
                                if (!contactNo.trim()) return setError('Please enter Contact Number.');
                                setError('');
                                setRegStep(3);
                              }
                            }}
                            required
                          />
                        </div>
                      </div>

                      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginTop: '14px' }}>⚠️ {error}</div>}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn ghost" onClick={() => setRegStep(1)} style={{ borderRadius: '12px' }}>← Back</button>
                        <button type="submit" className="btn primary" style={{ width: '100%', minHeight: '48px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 800 }}>Next: Security →</button>
                      </div>
                    </form>
                  )}

                  {regStep === 3 && (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!email.trim() || !email.includes('@')) return setError('Please enter valid Email.');
                      if (!password.trim() || password.length < 6) return setError('Password must be 6+ chars.');
                      setError('');
                      setRegStep(4);
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                if (passwordRef.current) passwordRef.current.focus();
                              }
                            }}
                            autoFocus
                            required
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="field-label-lg">Password *</label>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          <input
                            ref={passwordRef}
                            type={showPassword ? 'text' : 'password'}
                            className="input-lg"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!email.trim() || !email.includes('@')) return setError('Please enter valid Email.');
                                if (!password.trim() || password.length < 6) return setError('Password must be 6+ chars.');
                                setError('');
                                setRegStep(4);
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
                          <span>Remember password in browser</span>
                        </label>
                      </div>

                      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginTop: '14px' }}>⚠️ {error}</div>}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn ghost" onClick={() => setRegStep(2)} style={{ borderRadius: '12px' }}>← Back</button>
                        <button type="submit" className="btn primary" style={{ width: '100%', minHeight: '48px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 800 }}>Next: Logo &amp; Submit →</button>
                      </div>
                    </form>
                  )}

                  {regStep === 4 && (
                    <form onSubmit={handleRegisterSubmit}>
                      <div
                        style={{
                          border: '2px dashed #CBD5E1',
                          borderRadius: '16px',
                          padding: '24px 16px',
                          textAlign: 'center',
                          backgroundColor: '#F8FAFC',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '20px'
                        }}
                        onClick={() => document.getElementById('pageLogoFileInput').click()}
                      >
                        <input
                          id="pageLogoFileInput"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          style={{ display: 'none' }}
                        />

                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FF5E14', boxShadow: '0 4px 14px rgba(255, 94, 20, 0.25)' }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FFF2EB', color: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                            🖼️
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>
                            {logoFile ? logoFile.name : 'Click to Upload Restaurant Logo'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '3px' }}>
                            Saved directly to Cloudinary &amp; MongoDB
                          </div>
                        </div>
                      </div>

                      {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginBottom: '14px' }}>⚠️ {error}</div>}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                        <button type="button" className="btn ghost" onClick={() => setRegStep(3)} disabled={loading} style={{ borderRadius: '12px' }}>← Back</button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn primary"
                          style={{
                            width: '100%',
                            borderRadius: '12px',
                            minHeight: '50px',
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
                              <span>Uploading &amp; Registering...</span>
                            </>
                          ) : (
                            <span>🟢 Register &amp; Launch Free Account</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* MODE 2: LOGIN FORM */
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
                          if (loginPassRef.current) loginPassRef.current.focus();
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
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      ref={loginPassRef}
                      type={showPassword ? 'text' : 'password'}
                      className="input-lg"
                      placeholder="••••••••"
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
                      ⚠️ {error}
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
                      <span>🔐 Sign In to Dashboard</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* RICH WELCOME BANNER ON SUCCESS */
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
                ✓
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                WELCOME, {successUser.name.toUpperCase()}!
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.96rem', margin: '0 0 20px' }}>
                Authentication verified! Opening <b>{successUser.businessName || 'FoodyPay Dashboard'}</b>...
              </p>

              {successUser.logo?.url && (
                <div style={{ marginBottom: '20px' }}>
                  <img
                    src={successUser.logo.url}
                    alt="Business Logo"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #22C55E', boxShadow: '0 6px 18px rgba(0,0,0,0.1)' }}
                  />
                  <div style={{ fontSize: '0.86rem', color: '#059669', fontWeight: 800, marginTop: '6px' }}>
                    {successUser.businessName} Verified
                  </div>
                </div>
              )}

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
                🚀 Open Dashboard Now
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}