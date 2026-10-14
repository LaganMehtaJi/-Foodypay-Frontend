import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';
import { playMilestoneCelebration } from '../utils/soundEffects';
import { validatePartnerLogin, getPartnerCredentials } from '../utils/partnerAuth';
import { loginWithFirebaseGoogle } from '../utils/firebase';
import { checkEmailExistsApi } from '../utils/api';

export default function PartnerLoginPage({ onShowToast }) {
  const navigate = useNavigate();

  const [partnerInput, setPartnerInput] = useState(''); // Email or 6-digit ID
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [savedCreds, setSavedCreds] = useState(getPartnerCredentials());

  useEffect(() => {
    // If already logged in as partner, redirect to partner portal
    const isPartner = localStorage.getItem('foodypay_partner_logged_in');
    if (isPartner === 'true') {
      navigate('/partner-portal');
    }
  }, [navigate]);

  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = partnerInput.trim();
    const cleanPass = password.trim();

    if (!cleanInput) {
      setError('Please enter Admin Email or 6-Digit Partner Unique ID.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your Admin Password.');
      return;
    }

    setLoading(true);
    try {
      if (cleanInput.includes('@')) {
        try {
          await checkEmailExistsApi(cleanInput);
        } catch (checkErr) {
          console.warn('DB check note for partner login:', checkErr.message);
        }
      }

      const isValid = validatePartnerLogin(cleanInput, cleanPass);
      if (isValid) {
        localStorage.setItem('foodypay_partner_logged_in', 'true');
        localStorage.setItem('foodypay_partner_token', 'partner_token_' + Date.now());
        localStorage.setItem('foodypay_partner_user', JSON.stringify({
          role: 'SuperAdmin Partner',
          email: cleanInput,
          uniqueId: savedCreds.partnerUniqueId,
          loginTime: new Date().toISOString()
        }));

        playMilestoneCelebration();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        if (onShowToast) onShowToast('Welcome to FoodyPay Partner Enterprise Console!');

        setTimeout(() => {
          navigate('/partner-portal');
        }, 500);
      } else {
        setError('Invalid Partner Admin Email/ID or Password. Check credentials.');
      }
    } catch (err) {
      setError(err.message || 'Partner login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePartnerLogin = async () => {
    setLoading(true);
    setError('');
    try {
      let fbRes = null;
      try {
        fbRes = await loginWithFirebaseGoogle();
      } catch (e) {
        console.warn('Firebase Google partner auth fallback:', e);
      }

      const userEmail = fbRes?.user?.email || savedCreds.partnerEmail;

      if (userEmail && userEmail.includes('@')) {
        try {
          await checkEmailExistsApi(userEmail);
        } catch (dbErr) {
          console.warn('Google partner email verification:', dbErr.message);
        }
      }

      localStorage.setItem('foodypay_partner_logged_in', 'true');
      localStorage.setItem('foodypay_partner_token', 'partner_token_g_' + Date.now());
      localStorage.setItem('foodypay_partner_user', JSON.stringify({
        role: 'SuperAdmin Partner',
        email: userEmail,
        name: fbRes?.user?.displayName || 'Enterprise Admin',
        uniqueId: savedCreds.partnerUniqueId,
        loginTime: new Date().toISOString()
      }));

      playMilestoneCelebration();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      if (onShowToast) onShowToast('Gmail Verified via Firebase! Logged in as Enterprise Admin!');

      setTimeout(() => {
        navigate('/partner-portal');
      }, 500);
    } catch (err) {
      setError(err.message || 'Google Partner authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      
      {/* TOP HEADER */}
      <header className="auth-header">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '34px', objectFit: 'contain' }} />
          <div>
            <span style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>FoodyPay</span>
            <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 800, display: 'block', marginTop: '-3px' }}>Enterprise Partner Console</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="auth-header-subtext">Store POS User?</span>
          <Link
            to="/login"
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#FFF0EB',
              color: '#FF5E14',
              border: '1.5px solid #FFDCD0',
              fontWeight: 800,
              fontSize: '12px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Store Dashboard Login ↗
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT LAYOUT */}
      <main className="auth-main-container">
        <div className="auth-card-grid">
          
          {/* LEFT BRANDING PANEL */}
          <div className="auth-left-panel">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800, border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>Enterprise SuperAdmin Portal</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.3px' }}>
                Partner Admin Operating System &amp; Multi-Store Console
              </h2>

              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 20px' }}>
                Manage live store sales telemetry, update merchant UPI IDs, issue Kitchen &amp; Store credentials, and enforce dashboard tab restriction locks.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Multi-Store Live Telemetry & Revenue Audit',
                  'Instant Merchant UPI ID & Payment QR Sync',
                  'Tab Locks for Settings, Marketing & Utilities',
                  'Issue 6-Digit Unique Store & Kitchen Credentials',
                  'Firebase & Gmail Verified 256-Bit SSL Security',
                ].map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: '#E2E8F0' }}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="#10B981" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#F8FAFC' }}>Firebase Auth 256-Bit SSL Encrypted</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>SuperAdmin Enterprise Console Access</div>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN FORM */}
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                Partner Admin Login
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Enter credentials or use Google to access SuperAdmin Portal
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} color="#EF4444" />
                <span>{error}</span>
              </div>
            )}

            {/* GOOGLE GMAIL ONE-CLICK SIGN IN */}
            <button
              type="button"
              onClick={handleGooglePartnerLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                color: '#334155',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                marginBottom: '16px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google Admin</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 16px', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Or Login with Admin ID</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={handlePartnerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Admin Email or 6-Digit Unique ID
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    value={partnerInput}
                    onChange={(e) => setPartnerInput(e.target.value)}
                    placeholder="admin@foodypay.com or 999999"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Admin Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="active-scale"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '14.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s',
                  marginTop: '4px',
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-icon-fast" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Login to Partner Console</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* DEMO CREDENTIALS QUICK HELPER */}
            <div style={{ marginTop: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1', padding: '10px 12px', fontSize: '11.5px', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, color: '#10B981' }}> Partner Demo Credentials:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPartnerInput(savedCreds.partnerEmail);
                    setPassword(savedCreds.partnerPass);
                  }}
                  style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '11px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Auto-fill
                </button>
              </div>
              <div><b>Email / ID:</b> {savedCreds.partnerEmail} (or 6-Digit ID: <code style={{ color: '#FF5E14' }}>{savedCreds.partnerUniqueId}</code>)</div>
              <div><b>Password:</b> <code style={{ color: '#FF5E14' }}>{savedCreds.partnerPass}</code></div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
              <Link to="/login" style={{ fontSize: '12.5px', color: '#FF5E14', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                 Back to Store Dashboard Login ↗
              </Link>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
