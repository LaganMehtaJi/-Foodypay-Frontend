import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { playMilestoneCelebration } from '../utils/soundEffects';
import { registerApi, googleAuthApi } from '../utils/api';

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3, 4

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

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFirstName('');
      setLastName('');
      setBusinessName('');
      setContactNo('');
      setLogoFile(null);
      setLogoPreview(null);
      setError('');
      setLoading(false);
      setSuccessUser(null);

      // Load remembered email/password if stored
      const savedEmail = localStorage.getItem('foodypay_remember_email');
      const savedPass = localStorage.getItem('foodypay_remember_password');
      if (savedEmail) setEmail(savedEmail);
      if (savedPass) setPassword(savedPass);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo image size must be under 5MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleNextStep1 = (e) => {
    if (e) e.preventDefault();
    if (!firstName.trim()) return setError('Please enter your First Name.');
    if (!lastName.trim()) return setError('Please enter your Last Name.');
    setError('');
    setCurrentStep(2);
  };

  const handleNextStep2 = (e) => {
    if (e) e.preventDefault();
    if (!businessName.trim()) return setError('Please enter your Business Name.');
    if (!contactNo.trim() || contactNo.length < 8) return setError('Please enter a valid Contact Number.');
    setError('');
    setCurrentStep(3);
  };

  const handleNextStep3 = (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid Email Address.');
    if (!password.trim() || password.length < 6) return setError('Password must be at least 6 characters.');
    setError('');
    setCurrentStep(4);
  };

  const handleFinalSubmit = async (e) => {
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
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Server connection error. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
      }
    } catch (err) {
      setError(err.message || 'Google Authentication failed.');
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
              Start with FoodyPay
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
              Join 10,000+ restaurants transforming their dining experience.
            </p>
          </div>

          {/* STEP WIZARD NAV */}
          <div className="step-wizard-nav" style={{ margin: '28px 0' }}>
            <div className={`step-wizard-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-badge-num">{currentStep > 1 ? '✓' : '1'}</div>
              <span>1. Owner Name</span>
            </div>
            <div className={`step-wizard-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-badge-num">{currentStep > 2 ? '✓' : '2'}</div>
              <span>2. Business Details</span>
            </div>
            <div className={`step-wizard-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-badge-num">{currentStep > 3 ? '✓' : '3'}</div>
              <span>3. Account Security</span>
            </div>
            <div className={`step-wizard-item ${currentStep === 4 ? 'active' : ''}`}>
              <div className="step-badge-num">4</div>
              <span>4. Logo &amp; Launch</span>
            </div>
          </div>

          {/* BRAND FEATURE BULLETS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22C55E' }}>✓</span> 100% Free Forever Plan ($0/mo)
            </div>
            <div style={{ fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22C55E' }}>✓</span> Instant QR Code Standees
            </div>
            <div style={{ fontSize: '0.78rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22C55E' }}>✓</span> Cloud POS &amp; KDS Printing
            </div>
          </div>
        </div>

        {/* RIGHT MAIN FORM PANEL */}
        <div className="auth-main-form-panel" style={{ padding: '40px 36px' }}>
          {!successUser ? (
            <div>
              {/* STEP 1: FIRST & LAST NAME */}
              {currentStep === 1 && (
                <form onSubmit={handleNextStep1}>
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
                      🟢 FREE REGISTRATION — STEP 1 OF 4
                    </span>
                    <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                      What is your Name?
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                      Enter your name to personalize your restaurant portal.
                    </p>
                  </div>

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
                            handleNextStep1();
                          }
                        }}
                        required
                      />
                    </div>
                  </div>

                  {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginTop: '14px' }}>⚠️ {error}</div>}

                  <button
                    type="submit"
                    className="btn primary"
                    style={{ width: '100%', marginTop: '24px', minHeight: '48px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 800 }}
                  >
                    Next: Business Info →
                  </button>
                </form>
              )}

              {/* STEP 2: BUSINESS & CONTACT */}
              {currentStep === 2 && (
                <form onSubmit={handleNextStep2}>
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
                      🟢 FREE REGISTRATION — STEP 2 OF 4
                    </span>
                    <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                      Business &amp; Contact Info
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                      Provide details for your digital menu &amp; QR standees.
                    </p>
                  </div>

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
                            handleNextStep2();
                          }
                        }}
                        required
                      />
                    </div>
                  </div>

                  {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginTop: '14px' }}>⚠️ {error}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '24px' }}>
                    <button type="button" className="btn ghost" onClick={() => setCurrentStep(1)} style={{ borderRadius: '12px' }}>← Back</button>
                    <button type="submit" className="btn primary" style={{ width: '100%', minHeight: '48px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 800 }}>Next: Security →</button>
                  </div>
                </form>
              )}

              {/* STEP 3: EMAIL & PASSWORD */}
              {currentStep === 3 && (
                <form onSubmit={handleNextStep3}>
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
                      🟢 FREE REGISTRATION — STEP 3 OF 4
                    </span>
                    <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                      Security Credentials
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                      Set up your login email and password.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="field-label-lg">Email Address *</label>
                      <input
                        type="email"
                        className="input-lg"
                        placeholder="e.g. cafe@foodypay.in"
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
                            handleNextStep3();
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
                    <button type="button" className="btn ghost" onClick={() => setCurrentStep(2)} style={{ borderRadius: '12px' }}>← Back</button>
                    <button type="submit" className="btn primary" style={{ width: '100%', minHeight: '48px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 800 }}>Next: Logo &amp; Submit →</button>
                  </div>
                </form>
              )}

              {/* STEP 4: LOGO & SUBMIT */}
              {currentStep === 4 && (
                <form onSubmit={handleFinalSubmit}>
                  <div style={{ marginBottom: '22px' }}>
                    <span
                      style={{
                        background: '#ECFDF5',
                        color: '#059669',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '4px 12px',
                        borderRadius: '20px'
                      }}
                    >
                      FINAL STEP 4 OF 4
                    </span>
                    <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '10px 0 4px', letterSpacing: '-0.02em' }}>
                      Upload Restaurant Logo
                    </h2>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
                      Upload your logo for digital menu headers and receipt printing.
                    </p>
                  </div>

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
                      marginBottom: '20px',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                    onClick={() => document.getElementById('modalLogoFileInput').click()}
                  >
                    <input
                      id="modalLogoFileInput"
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
                        Supports PNG, JPG, WEBP (Saved directly to Cloudinary)
                      </div>
                    </div>
                  </div>

                  {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, marginBottom: '14px' }}>⚠️ {error}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <button type="button" className="btn ghost" onClick={() => setCurrentStep(3)} disabled={loading} style={{ borderRadius: '12px' }}>← Back</button>
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
                          <span>Uploading Logo &amp; Registering...</span>
                        </>
                      ) : (
                        <span>🟢 Register &amp; Launch Free Account</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* GOOGLE & LOGIN SWITCH */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
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
                    boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
                  }}
                >
                  <svg viewBox="0 0 48 48" width="18" height="18">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>Quick Sign Up with Google</span>
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.88rem', color: '#64748B' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#FF5E14', fontWeight: 800, cursor: 'pointer' }}
                    onClick={() => {
                      onClose();
                      if (onSwitchToLogin) onSwitchToLogin();
                    }}
                  >
                    Sign In →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* RICH WELCOME BANNER ON REGISTRATION SUCCESS */
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
                Your Free Account for <b>{successUser.businessName}</b> is successfully created!
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
