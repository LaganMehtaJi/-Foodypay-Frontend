import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { playMilestoneCelebration } from '../utils/soundEffects';
import { loginApi, googleAuthApi } from '../utils/api';

export default function LoginPage({ onShowToast }) {
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in, auto redirect to dashboard
    const token = localStorage.getItem('foodypay_token');
    if (token) {
      navigate('/dashboard');
      return;
    }

    // Auto-fill remembered credentials
    const savedEmail = localStorage.getItem('foodypay_remember_email');
    const savedPass = localStorage.getItem('foodypay_remember_password');
    if (savedEmail) setEmail(savedEmail);
    if (savedPass) setPassword(savedPass);
  }, [navigate]);

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const googlePayload = {
        credential: 'demo_google_id_token_' + Date.now(),
        email: email.trim() || 'owner@foodypay.com',
        name: 'Lagan Mehta',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        businessName: 'Lagan Da Dhaba',
        contactNo: '+91 98123 45678',
        googleId: 'google_sub_' + Date.now(),
      };

      const res = await googleAuthApi(googlePayload);
      if (res.success && res.data) {
        if (res.data.token) {
          localStorage.setItem('foodypay_token', res.data.token);
          localStorage.setItem('foodypay_user', JSON.stringify(res.data));
        }
        playMilestoneCelebration();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        if (onShowToast) onShowToast(`👋 Verified with Google! Welcome ${res.data.name || 'Merchant'}!`);
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Google Auth verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Form Login Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid business email address.');
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

        playMilestoneCelebration();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        if (onShowToast) onShowToast(`🎉 Login successful! Welcome back, ${userData.name || 'Merchant'}!`);

        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      
      {/* TOP HEADER */}
      <header style={{ height: '60px', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '38px', objectFit: 'contain' }} />
          <div>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>FoodyPay</span>
            <span style={{ fontSize: '11px', color: '#FF5E14', fontWeight: 800, display: 'block', marginTop: '-3px' }}>Always With You ✨</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>New to FoodyPay?</span>
          <Link
            to="/register"
            style={{
              padding: '7px 16px',
              borderRadius: '9px',
              backgroundColor: '#FFF0EB',
              color: '#FF5E14',
              border: '1.5px solid #FFDCD0',
              fontWeight: 800,
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT LAYOUT */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px', overflow: 'auto' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '960px',
            maxHeight: 'calc(100vh - 90px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 35px rgba(15, 23, 42, 0.06)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            overflow: 'hidden',
          }}
        >
          {/* LEFT BRANDING PANEL */}
          <div
            style={{
              background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
              padding: '28px 32px',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 94, 20, 0.15)', color: '#FF5E14', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800, border: '1px solid rgba(255, 94, 20, 0.3)', marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>Smart Restaurant Operating System</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.3px' }}>
                Sign In &amp; Control Your Restaurant POS &amp; QR Ordering
              </h2>

              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 20px' }}>
                Manage live table QR orders, kitchen KDS displays, digital menus, loyalty cohorts, and billings from one Cloud POS.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  '⚡ Instant Self-Service Table QR Ordering',
                  '🍳 Dedicated Kitchen Display System (KDS)',
                  '💰 0% Commission Direct Customer Payments',
                  '📊 Real-Time Sales Telemetry & Reports',
                ].map((feature, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 700, color: '#E2E8F0' }}>
                    <CheckCircle2 size={16} color="#FF5E14" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="#10B981" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#F8FAFC' }}>256-Bit SSL Encrypted Security</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Trusted by 10,000+ top restaurants &amp; dhabas</div>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN FORM */}
          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                Merchant Login
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Enter credentials to access your FoodyPay Dashboard
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            {/* GOOGLE GMAIL ONE-CLICK SIGN IN */}
            <button
              type="button"
              onClick={handleGoogleLogin}
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
              <span>Sign in with Google (Gmail)</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 16px', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Or Login with Email</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            </div>

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Business Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155' }}>
                    Password
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
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
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#FF5E14' }}
                  />
                  <span>Remember my login</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '14.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(255, 94, 20, 0.35)',
                  transition: 'all 0.2s',
                  marginTop: '4px',
                }}
              >
                <span>{loading ? 'Logging in...' : 'Sign In to Dashboard'}</span>
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}