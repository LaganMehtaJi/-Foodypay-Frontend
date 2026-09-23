import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  User,
  Building2,
  Phone,
  Upload,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { playMilestoneCelebration } from '../utils/soundEffects';
import { registerApi, googleAuthApi } from '../utils/api';

export default function SignupPage({ onShowToast }) {
  const navigate = useNavigate();

  // Form Field States
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Logo File Upload Selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo image file must be under 5MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Google OAuth Quick Signup
  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const googlePayload = {
        credential: 'demo_google_id_token_' + Date.now(),
        email: email.trim() || 'merchant@foodypay.com',
        name: name.trim() || 'Lagan Mehta',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        businessName: businessName.trim() || 'Lagan Da Dhaba',
        contactNo: contactNo.trim() || '+91 98123 45678',
        googleId: 'google_sub_' + Date.now(),
      };

      const res = await googleAuthApi(googlePayload);
      if (res.success && res.data) {
        playMilestoneCelebration();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        setSuccessMsg(`Account created for ${res.data.businessName || 'Merchant'}! Click Sign In to log into Dashboard.`);
        if (onShowToast) onShowToast(`🚀 Account Created! Please Sign In.`);
      }
    } catch (err) {
      setError(err.message || 'Google Auth verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Form Registration Submission Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your Name.');
      return;
    }
    if (!businessName.trim()) {
      setError('Please enter your Restaurant / Business Name.');
      return;
    }
    if (!contactNo.trim()) {
      setError('Please enter your WhatsApp Contact Number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid Email Address.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
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
        playMilestoneCelebration();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.4 } });
        setSuccessMsg(`Registration Successful for ${userData.businessName || businessName}! Click Sign In to access Dashboard.`);
        if (onShowToast) onShowToast(`🚀 Account Created! Please Sign In.`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your backend server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', maxHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER NAVBAR */}
      <header style={{ height: '60px', padding: '0 32px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '38px', objectFit: 'contain' }} />
          <div>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>FoodyPay</span>
            <span style={{ fontSize: '11px', color: '#FF5E14', fontWeight: 800, display: 'block', marginTop: '-3px' }}>Always With You ✨</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Already registered?</span>
          <Link
            to="/login"
            style={{
              padding: '7px 16px',
              borderRadius: '9px',
              backgroundColor: '#F1F5F9',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '620px', maxHeight: 'calc(100vh - 85px)', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)', padding: '24px 32px' }}>
          
          {/* HEADER TITLE */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
              Create Merchant Account
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
              Launch Digital QR Menu, Table Ordering &amp; Cloud POS in minutes.
            </p>
          </div>

          {/* SUCCESS BANNER */}
          {successMsg && (
            <div style={{ backgroundColor: '#ECFDF5', border: '1.5px solid #6EE7B7', color: '#065F46', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div>🎉 {successMsg}</div>
              <Link
                to="/login"
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                }}
              >
                Go to Sign In →
              </Link>
            </div>
          )}

          {/* ERROR BANNER */}
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div>⚠️ {error}</div>
              {error.toLowerCase().includes('already exist') && (
                <Link
                  to="/login"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '7px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Sign In Now →
                </Link>
              )}
            </div>
          )}

          {/* GOOGLE SIGNUP BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignup}
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
              marginBottom: '14px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* DIVIDER */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Or fill registration details</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
          </div>

          {/* REGISTRATION FORM (2-COLUMN GRID FOR COMPACT FIT) */}
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* NAME */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Your Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Lagan Mehta"
                    style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              {/* BUSINESS NAME */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Restaurant / Business Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Lagan Da Dhaba"
                    style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* WHATSAPP CONTACT NUMBER */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>WhatsApp Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="+91 98123 45678"
                    style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Business Email *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@restaurant.com"
                    style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* PASSWORD */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '9px 38px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, boxSizing: 'border-box' }}
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

              {/* LOGO FILE UPLOAD (OPTIONAL) */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Brand Logo (Optional)</label>
                <div style={{ border: '1.5px dashed #CBD5E1', borderRadius: '9px', padding: '6px 12px', backgroundColor: '#F8FAFC', textAlign: 'center', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {logoPreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={logoPreview} alt="Logo preview" style={{ width: '26px', height: '26px', borderRadius: '6px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>Selected</span>
                      </div>
                      <label style={{ fontSize: '11.5px', color: '#FF5E14', fontWeight: 800, cursor: 'pointer' }}>
                        Change
                        <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                      </label>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                      <Upload size={15} color="#64748B" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Upload Brand Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '10px',
                backgroundColor: '#FF5E14',
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
                marginTop: '6px',
                transition: 'transform 0.1s',
              }}
            >
              <span>{loading ? 'Registering Account...' : 'Register Account'}</span>
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {/* FOOTER GUARANTEE */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ShieldCheck size={15} color="#10B981" />
            <span>100% Free Trial Plan • No Credit Card Required</span>
          </div>

        </div>
      </main>

    </div>
  );
}
