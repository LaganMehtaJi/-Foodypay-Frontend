import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  KeyRound,
  Building2,
  ChefHat,
  Crown,
  User,
  Utensils
} from 'lucide-react';
import { playMilestoneCelebration } from '../utils/soundEffects';
import { validateDashboardLogin, validateKitchenLogin } from '../utils/partnerAuth';
import {
  loginWithFirebaseEmail,
  loginWithFirebaseGoogle,
  sendFirebasePasswordReset
} from '../utils/firebase';
import {
  getBusinessUserByUniqueId,
  getBusinessUserByEmail,
  saveBusinessUserToFirestore
} from '../utils/firestoreService';
import { checkEmailExistsApi, loginApi } from '../utils/api';

export default function LoginPage({ onShowToast }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active Login Role: 'merchant' | 'kds' | 'master'
  const [loginRole, setLoginRole] = useState(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['merchant', 'kds', 'master'].includes(roleParam)) {
      return roleParam;
    }
    return 'merchant'; // default to merchant for POS
  });

  // User & Merchant Form States
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // KDS Form States
  const [kdsStoreId, setKdsStoreId] = useState('FP-348330');
  const [kdsPassword, setKdsPassword] = useState('');

  // Master Admin States
  const [masterPassword, setMasterPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [noAccountEmail, setNoAccountEmail] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['merchant', 'kds', 'master'].includes(roleParam)) {
      setLoginRole(roleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // Auto-fill remembered credentials
    const savedEmail = localStorage.getItem('foodypay_remember_email');
    const savedPass = localStorage.getItem('foodypay_remember_password');
    if (savedEmail) setEmailOrId(savedEmail);
    if (savedPass) setPassword(savedPass);
  }, []);

  // 2. Merchant Partner Login Submit (Controls Cafe / Restaurant Dashboard)
  const handleMerchantLogin = async (e) => {
    e.preventDefault();
    setError('');
    const cleanInput = emailOrId.trim();
    const cleanPass = password.trim();

    if (!cleanInput) {
      setError('Please enter your Restaurant Unique ID (e.g. FP-348330) or Registered Email.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // Step A: Check Business Registration strictly in Cloud Firestore Business_Users
      let businessProfile = null;
      if (cleanInput.toUpperCase().startsWith('FP-') || !cleanInput.includes('@')) {
        businessProfile = await getBusinessUserByUniqueId(cleanInput);
      } else {
        businessProfile = await getBusinessUserByEmail(cleanInput);
      }

      // If NOT registered in Firestore Business_Users, BLOCK LOGIN COMPLETELY!
      if (!businessProfile) {
        setNoAccountEmail(cleanInput);
        throw new Error(`No registered Business found for "${cleanInput}". You must register your Business first on /register!`);
      }

      if (businessProfile.isLocked) {
        throw new Error(`This Business account is locked. Reason: ${businessProfile.lockReason || 'Subscription Payment Required'}`);
      }

      // Step B: Authenticate Password against Firebase Auth using registered email
      let token = 'token_fs_' + Date.now();
      const authEmail = businessProfile.email || (cleanInput.includes('@') ? cleanInput.toLowerCase() : null);

      if (authEmail) {
        try {
          const fbRes = await loginWithFirebaseEmail(authEmail, cleanPass);
          if (fbRes?.token) token = fbRes.token;
        } catch (fbErr) {
          // If stored direct password match
          if (businessProfile.password && businessProfile.password === cleanPass) {
            // direct match
          } else {
            throw new Error('Incorrect password. Please enter your registered account password.');
          }
        }
      } else {
        if (businessProfile.password && businessProfile.password !== cleanPass) {
          throw new Error('Incorrect password. Please enter your registered account password.');
        }
      }

      const bId = (businessProfile.uniqueId || businessProfile.businessId || 'FP-348330').toUpperCase();
      const userData = {
        ...businessProfile,
        token,
        foodypayId: bId,
        businessId: bId,
        role: 'Restaurant Owner',
        businessName: businessProfile.businessName || 'My Restaurant POS',
      };

      localStorage.setItem('foodypay_token', userData.token);
      localStorage.setItem('foodypay_user', JSON.stringify(userData));
      localStorage.setItem('foodypay_active_business_id', bId);

      // Clear any legacy mock order cache from other sessions
      localStorage.removeItem('foodypay_crm_orders_v3');

      if (rememberMe) {
        localStorage.setItem('foodypay_remember_email', cleanInput);
        localStorage.setItem('foodypay_remember_password', cleanPass);
      }

      playMilestoneCelebration();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      if (onShowToast) onShowToast(`Logged into ${userData.businessName}!`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      return;
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 3. KDS Kitchen Login Submit
  const handleKdsLogin = (e) => {
    e.preventDefault();
    setError('');
    const cleanStoreId = (kdsStoreId || 'FP-348330').trim().toUpperCase();
    const cleanPass = kdsPassword.trim();

    if (!cleanPass) {
      setError('Please enter Kitchen Password.');
      return;
    }

    const check = validateKitchenLogin(cleanStoreId, cleanPass, cleanStoreId);
    const isSnackRackPass = cleanPass === 'SnackRack400' || cleanPass.toLowerCase() === 'snackrack400';

    if ((check && check.valid) || isSnackRackPass) {
      localStorage.setItem('foodypay_kitchen_logged_in', 'true');
      localStorage.setItem('foodypay_kitchen_store_id', cleanStoreId);
      localStorage.setItem('foodypay_kitchen_role', (check && check.role) || 'Kitchen Chef');

      playMilestoneCelebration();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      if (onShowToast) onShowToast(`Kitchen KDS Authenticated for Store ${cleanStoreId}!`);

      setTimeout(() => {
        navigate(`/kds`);
      }, 500);
    } else {
      setError('Invalid Kitchen Password. Use store kitchen password or SnackRack400.');
    }
  };

  // 4. Master Admin Login Submit (Controls All Businesses Across System)
  const handleMasterLogin = (e) => {
    e.preventDefault();
    setError('');
    const cleanPass = masterPassword.trim();

    if (cleanPass === '12345678') {
      sessionStorage.setItem('foodypay_admin_authed', 'true');
      playMilestoneCelebration();
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      if (onShowToast) onShowToast('👑 Master SuperAdmin Access Granted! Loading all businesses...');

      setTimeout(() => {
        navigate('/admin');
      }, 500);
    } else {
      setError('Incorrect Master Password! Enter the Master Admin Security Key.');
    }
  };

  // Google Firebase OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const fbRes = await loginWithFirebaseGoogle();
      const gEmail = fbRes?.user?.email ? fbRes.user.email.toLowerCase().trim() : '';
      const gName = fbRes?.user?.displayName || gEmail.split('@')[0];
      const gUid = fbRes?.user?.uid;

      if (!gEmail) {
        throw new Error('Could not retrieve email from Google Account.');
      }

      // Check if Business User profile exists in Firestore Business_Users
      const bProfile = await getBusinessUserByEmail(gEmail);

      // If user is NOT registered in Cloud Firestore Business_Users, DO NOT allow login even if Google email is verified!
      if (!bProfile) {
        setNoAccountEmail(gEmail);
        throw new Error(`Email "${gEmail}" is verified, but NO Business account is registered in Cloud Firestore! Please register your business on /register first.`);
      }

      if (bProfile.isLocked) {
        throw new Error(`This Business account is locked. Reason: ${bProfile.lockReason || 'Subscription Payment Required'}`);
      }

      const activeBizId = (bProfile.uniqueId || bProfile.businessId || 'FP-348330').toUpperCase();

      const userData = {
        ...bProfile,
        token: fbRes?.token || 'token_' + Date.now(),
        uid: gUid,
        name: bProfile.ownerName || gName,
        email: gEmail,
        role: 'Restaurant Owner',
        foodypayId: activeBizId,
        businessId: activeBizId,
        businessName: bProfile.businessName || `${gName}'s Restaurant`,
        plan: bProfile.plan || 'Free',
      };

      localStorage.setItem('foodypay_token', userData.token);
      localStorage.setItem('foodypay_user', JSON.stringify(userData));
      localStorage.setItem('foodypay_active_business_id', activeBizId);
      localStorage.removeItem('foodypay_crm_orders_v3');

      playMilestoneCelebration();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      if (onShowToast) onShowToast(`Logged into ${userData.businessName}!`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setError(err.message || 'Google Gmail authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Real Working Password Reset via Firebase Auth Email Link
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setResetError('');

    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid registered email address.');
      return;
    }

    setResetLoading(true);
    try {
      const result = await sendFirebasePasswordReset(resetEmail.trim());
      setResetMsg(result.message);
      if (onShowToast) onShowToast(`Reset email sent to ${resetEmail.trim()}! Check inbox.`);
    } catch (err) {
      setResetError(err.message || 'Failed to dispatch password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* TOP HEADER */}
      <header className="auth-header">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '34px', objectFit: 'contain' }} />
          <div>
            <span style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>FoodyPay</span>
            <span style={{ fontSize: '10.5px', color: '#FF5E14', fontWeight: 800, display: 'block', marginTop: '-3px' }}>Always With You</span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="auth-header-subtext">New Business?</span>
          <Link
            to="/register"
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
            Register Cafe / Restaurant
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="auth-main-container">
        <div className="auth-card-grid">

          {/* LEFT BRANDING PANEL */}
          <div className="auth-left-panel">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 94, 20, 0.15)', color: '#FF5E14', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800, border: '1px solid rgba(255, 94, 20, 0.3)', marginBottom: '16px' }}>
                <Sparkles size={14} />
                <span>Multi-Tenant Cloud Restaurant OS</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.3px' }}>
                Unified Portal for Restaurants, KDS &amp; Master Admin
              </h2>

              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 20px' }}>
                Every Cafe and Restaurant has an isolated Unique ID across all products, orders, coupons, tables &amp; customers in Cloud Firestore.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Unique ID for Each Cafe & Restaurant',
                  'Plan Tiers: Free, Basic, Growth & Pro',
                  'Firebase Auth Real Password Reset to Inbox',
                  'Dedicated Kitchen Display System (KDS)',
                  'Master Admin Full Multi-Business Overview',
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
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#F8FAFC' }}>Cloud Firestore 100% Persistent Database</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Sub-second real-time sync with Google Firebase</div>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN FORM */}
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* 3 LOGIN ROLE SWITCHER TABS (MERCHANT, KITCHEN, MASTER ADMIN) */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                {[
                  { id: 'merchant', label: 'Merchant', icon: Building2, badgeColor: '#FF5E14' },
                  { id: 'kds', label: 'Kitchen', icon: ChefHat, badgeColor: '#8B5CF6' },
                  { id: 'master', label: 'Master', icon: Crown, badgeColor: '#10B981' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = loginRole === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setLoginRole(tab.id);
                        setError('');
                      }}
                      style={{
                        padding: '9px 4px',
                        borderRadius: '9px',
                        border: 'none',
                        backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? tab.badgeColor : '#64748B',
                        fontWeight: isActive ? 900 : 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={17} color={isActive ? tab.badgeColor : '#64748B'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB TITLE & SUBTEXT */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 900, color: '#0F172A', margin: '0 0 3px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {loginRole === 'merchant' && '🏢 Merchant Partner Login'}
                {loginRole === 'kds' && '🍳 Kitchen Display (KDS) Login'}
                {loginRole === 'master' && '👑 Master SuperAdmin Login'}
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
                {loginRole === 'merchant' && 'Manage your cafe, restaurant menu, tables, bills & reports'}
                {loginRole === 'kds' && 'Enter your Kitchen Unique ID & Password to open live orders screen'}
                {loginRole === 'master' && 'Master access to view ALL businesses, plans & platform telemetry'}
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div>{error}</div>
                {(noAccountEmail || error.toLowerCase().includes('register') || error.toLowerCase().includes('not found')) && (
                  <Link
                    to="/register"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#FF5E14',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Register Now →
                  </Link>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. MERCHANT PARTNER LOGIN FORM */}
            {/* ========================================================= */}
            {loginRole === 'merchant' && (
              <>
                {/* GOOGLE GMAIL ONE-CLICK SIGN IN */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{ width: '100%', padding: '9px', borderRadius: '9px', backgroundColor: '#FFFFFF', border: '1.5px solid #CBD5E1', color: '#334155', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Quick Sign In with Google</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 12px', gap: '8px' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Or Sign In With Unique ID / Email</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }} />
                </div>

                <form onSubmit={handleMerchantLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                      Restaurant Unique ID (e.g. FP-348330) or Registered Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={emailOrId}
                        onChange={(e) => setEmailOrId(e.target.value)}
                        placeholder="FP-348330 or owner@restaurant.com"
                        style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(emailOrId.includes('@') ? emailOrId : '');
                          setResetMsg('');
                          setResetError('');
                          setShowForgotModal(true);
                        }}
                        style={{ background: 'none', border: 'none', color: '#FF5E14', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ width: '100%', padding: '9px 38px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ width: '14px', height: '14px', accentColor: '#FF5E14' }}
                      />
                      <span>Remember credentials</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', borderRadius: '9px', background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)', color: '#FFFFFF', border: 'none', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255, 94, 20, 0.35)', marginTop: '4px' }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Restaurant POS Dashboard →'}
                  </button>
                </form>
              </>
            )}

            {/* ========================================================= */}
            {/* 3. KDS KITCHEN DISPLAY SYSTEM LOGIN FORM */}
            {/* ========================================================= */}
            {loginRole === 'kds' && (
              <form onSubmit={handleKdsLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Restaurant Unique ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={kdsStoreId}
                      onChange={(e) => setKdsStoreId(e.target.value)}
                      placeholder="e.g. FP-348330"
                      style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Kitchen Security Password / Passcode
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      value={kdsPassword}
                      onChange={(e) => setKdsPassword(e.target.value)}
                      placeholder="Kitchen passcode (e.g. SnackRack400)"
                      style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', padding: '10px', borderRadius: '9px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: '#FFFFFF', border: 'none', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)', marginTop: '4px' }}
                >
                  <ChefHat size={17} />
                  <span>Launch Live Kitchen Display (KDS) →</span>
                </button>
              </form>
            )}

            {/* ========================================================= */}
            {/* 4. MASTER SUPERADMIN LOGIN FORM */}
            {/* ========================================================= */}
            {loginRole === 'master' && (
              <form onSubmit={handleMasterLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 12px', borderRadius: '8px', color: '#166534', fontSize: '12px', fontWeight: 700 }}>
                  👑 Master Admin Overview: View all Cafe &amp; Restaurant profiles, plan subscriptions, live revenue &amp; manage global records.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Master Admin Master Key Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Master Security Password (Default: 12345678)"
                      style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '9px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ width: '100%', padding: '10px', borderRadius: '9px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', border: 'none', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)', marginTop: '4px' }}
                >
                  <Crown size={17} />
                  <span>Enter Master Admin Panel →</span>
                </button>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* FIREBASE FORGOT PASSWORD RESET MODAL */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={22} color="#FF5E14" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>Reset Password</h3>
              </div>
              <button type="button" onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
              Enter your registered email address below. Firebase will dispatch an actual password reset email link directly to your inbox.
            </p>

            {resetMsg && (
              <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '14px' }}>
                ✓ {resetMsg}
              </div>
            )}

            {resetError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '14px' }}>
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#FF5E14', color: '#FFFFFF', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,94,20,0.3)' }}
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}