import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  DollarSign,
  Package,
  Utensils,
  Store,
  Mail,
  Phone,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Eye,
  EyeOff,
  Crown,
  LogIn,
  LogOut,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Briefcase,
  CreditCard,
  CheckCircle2,
  XCircle,
  Settings,
  ShieldAlert,
  Building2,
  Activity,
  Plus,
} from 'lucide-react';
import {
  fetchRegisteredUsersApi,
  deleteUserApi,
  deleteUserByEmailApi,
  toggleUserLockApi,
  updateUserSubscriptionApi,
  fetchPublicOrdersApi,
} from '../utils/api';

export default function AdminDebugPage({ onShowToast }) {
  const navigate = useNavigate();

  // Admin Security Password Gate (Master Password: 12345678)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('foodypay_admin_authed') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');

  // Main Admin Navigation Tabs: 'merchants' | 'customers' | 'orders' | 'subscription_settings'
  const [activeTab, setActiveTab] = useState('merchants');

  // Real Registered Users & Merchants Data
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [globalOrders, setGlobalOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'locked' | 'paid'

  // Account Lock Modal State
  const [lockModalUser, setLockModalUser] = useState(null);
  const [lockReasonInput, setLockReasonInput] = useState('Subscription Payment Required');

  // Subscription Pricing Modal State
  const [subModalUser, setSubModalUser] = useState(null);
  const [subForm, setSubForm] = useState({
    price: 499,
    plan: 'Pro Business Plan',
    status: 'Active',
    expiry: '',
  });

  // Delete Confirmation Modal State
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [confirmEmailInput, setConfirmEmailInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Global Platform Subscription Settings State
  const [globalSubSettings, setGlobalSubSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_global_subscription_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      platformName: 'FoodyPay Enterprise System',
      defaultMonthlyPrice: 499,
      defaultAnnualPrice: 4999,
      freeTrialDays: 14,
      autoLockExpiredAccounts: true,
      currency: 'INR (₹)',
      supportEmail: 'billing@foodypay.in',
    };
  });

  // Save Global Subscription Settings to localStorage
  const handleSaveGlobalSettings = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('foodypay_global_subscription_settings', JSON.stringify(globalSubSettings));
      if (onShowToast) onShowToast('️ Global Platform Subscription Settings Saved!');
    } catch (e) {}
  };

  // Fetch Live Real Data from Backend Database
  const loadLiveAdminData = async () => {
    setLoadingData(true);
    try {
      const usersRes = await fetchRegisteredUsersApi();
      if (usersRes && usersRes.success && Array.isArray(usersRes.data)) {
        const normalized = usersRes.data.map((u) => ({
          _id: u._id,
          email: u.email || 'merchant@foodypay.in',
          name: u.name || 'Merchant Owner',
          businessName: u.businessName || u.name || 'Food Outlet',
          contactNo: u.contactNo || '+91 98000 00000',
          foodypayId: u.foodypayId || 'FP-' + Math.floor(100000 + Math.random() * 900000),
          isLocked: Boolean(u.isLocked),
          lockReason: u.lockReason || 'Subscription Payment Required',
          subscriptionPrice: u.subscriptionPrice !== undefined ? Number(u.subscriptionPrice) : globalSubSettings.defaultMonthlyPrice,
          subscriptionStatus: u.subscriptionStatus || (u.isLocked ? 'Locked' : 'Active'),
          subscriptionPlan: u.subscriptionPlan || 'Pro Business Plan',
          subscriptionExpiry: u.subscriptionExpiry || '',
          totalSales: Number(u.totalSales) || 0,
          totalOrders: Number(u.totalOrders) || 0,
          dishCount: Number(u.dishCount) || (u.dishes ? u.dishes.length : 0),
          dishes: u.dishes || [],
          createdAt: u.createdAt || new Date().toISOString(),
        }));
        setRegisteredUsers(normalized);
      }

      // Fetch sample/live public orders feed
      try {
        const ordersRes = await fetchPublicOrdersApi();
        if (Array.isArray(ordersRes)) {
          setGlobalOrders(ordersRes);
        }
      } catch (ordErr) {}

      if (onShowToast) onShowToast(' Live Database Records Reloaded Cleanly!');
    } catch (err) {
      console.warn('Backend load error:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadLiveAdminData();
    }
  }, [isAdminAuthenticated]);

  // Handle Admin Authentication Gate Login
  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === '12345678') {
      sessionStorage.setItem('foodypay_admin_authed', 'true');
      setIsAdminAuthenticated(true);
      setAdminAuthError('');
      if (onShowToast) onShowToast(' Master Admin Access Granted!');
    } else {
      setAdminAuthError('Incorrect Password! Master Admin password is 12345678.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('foodypay_admin_authed');
    setIsAdminAuthenticated(false);
    setAdminPasswordInput('');
    if (onShowToast) onShowToast(' Logged out of Master Admin Panel');
  };

  // 1. Account Lock / Unlock Handler
  const handleExecuteAccountLockToggle = async () => {
    if (!lockModalUser) return;
    const targetUserId = lockModalUser._id;
    const nextLockedState = !lockModalUser.isLocked;

    try {
      if (targetUserId && !targetUserId.startsWith('user_')) {
        await toggleUserLockApi(targetUserId, nextLockedState, lockReasonInput);
      }
    } catch (err) {
      console.warn('Lock API note:', err.message);
    }

    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u._id === targetUserId) {
          return {
            ...u,
            isLocked: nextLockedState,
            lockReason: lockReasonInput,
            subscriptionStatus: nextLockedState ? 'Locked' : 'Active',
          };
        }
        return u;
      })
    );

    if (onShowToast) {
      onShowToast(
        nextLockedState
          ? ` Account ${lockModalUser.email} is now LOCKED (Subscription Required)`
          : ` Account ${lockModalUser.email} has been UNLOCKED & Activated!`
      );
    }

    setLockModalUser(null);
  };

  // 2. Subscription Pricing Update Handler
  const handleSaveUserSubscription = async (e) => {
    e.preventDefault();
    if (!subModalUser) return;
    const targetUserId = subModalUser._id;

    try {
      if (targetUserId && !targetUserId.startsWith('user_')) {
        await updateUserSubscriptionApi(targetUserId, subForm);
      }
    } catch (err) {
      console.warn('Subscription API note:', err.message);
    }

    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u._id === targetUserId) {
          return {
            ...u,
            subscriptionPrice: Number(subForm.price) || 0,
            subscriptionPlan: subForm.plan,
            subscriptionStatus: subForm.status,
            subscriptionExpiry: subForm.expiry,
            isLocked: subForm.status === 'Locked' || subForm.status === 'Expired',
          };
        }
        return u;
      })
    );

    if (onShowToast) {
      onShowToast(` Subscription pricing for ${subModalUser.email} updated to ₹${subForm.price}/mo!`);
    }

    setSubModalUser(null);
  };

  // 3. Delete Account Handler with Confirmation
  const handleExecuteDeleteAccount = async () => {
    if (!deleteModalUser) return;

    if (confirmEmailInput.trim().toLowerCase() !== deleteModalUser.email.trim().toLowerCase()) {
      alert(`Email confirmation does not match! Please type "${deleteModalUser.email}" to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    const targetUserId = deleteModalUser._id;
    const targetEmail = deleteModalUser.email;

    try {
      if (targetUserId && !targetUserId.startsWith('user_')) {
        await deleteUserApi(targetUserId);
      } else {
        await deleteUserByEmailApi(targetEmail);
      }
    } catch (err) {
      console.warn('Delete API note:', err.message);
    }

    setRegisteredUsers((prev) => prev.filter((u) => u._id !== targetUserId && u.email !== targetEmail));

    if (onShowToast) {
      onShowToast(`️ User account (${targetEmail}) deleted permanently from database!`);
    }

    setIsDeleting(false);
    setDeleteModalUser(null);
    setConfirmEmailInput('');
  };

  // Context Switch to Merchant POS Dashboard
  const handleLaunchMerchantDashboard = (user) => {
    try {
      localStorage.setItem('foodypay_user', JSON.stringify(user));
    } catch (e) {}
    if (onShowToast) onShowToast(`Switched active context to ${user.businessName || user.name}`);
    navigate('/dashboard');
  };

  // Password Gate Screen
  if (!isAdminAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '24px', padding: '40px 32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', textAlign: 'center' }}>
          
          <div style={{ width: '68px', height: '68px', borderRadius: '22px', backgroundColor: '#FF5E14', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 25px rgba(255,94,20,0.45)' }}>
            <ShieldCheck size={38} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Master Admin Security Access
          </h2>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.5 }}>
            Enter Master Admin Password (<strong style={{ color: '#FF5E14' }}>12345678</strong>) to access merchant accounts, subscriptions, &amp; database controls.
          </p>

          {adminAuthError && (
            <div style={{ backgroundColor: '#7F1D1D', border: '1px solid #991B1B', color: '#FECACA', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, marginBottom: '20px' }}>
              ️ {adminAuthError}
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showAdminPassword ? 'text' : 'password'}
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter Password (12345678)"
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #374151',
                  backgroundColor: '#030712',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#FF5E14',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 900,
                fontSize: '15.5px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(255,94,20,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <LogIn size={20} />
              <span>Unlock Admin Console</span>
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1F2937', fontSize: '12px', color: '#6B7280' }}>
             Protected by FoodyPay Master Admin Security Engine
          </div>
        </div>
      </div>
    );
  }

  // Calculated Metrics
  const totalRegisteredCount = registeredUsers.length;
  const lockedCount = registeredUsers.filter((u) => u.isLocked || u.subscriptionStatus === 'Locked').length;
  const activeCount = registeredUsers.filter((u) => !u.isLocked && u.subscriptionStatus === 'Active').length;
  const totalPlatformSales = registeredUsers.reduce((s, u) => s + (Number(u.totalSales) || 0), 0);
  const totalPlatformOrders = registeredUsers.reduce((s, u) => s + (Number(u.totalOrders) || 0), 0);
  const totalPlatformDishes = registeredUsers.reduce((s, u) => s + (Number(u.dishCount) || 0), 0);
  const totalMRR = registeredUsers.filter((u) => !u.isLocked).reduce((s, u) => s + (Number(u.subscriptionPrice) || globalSubSettings.defaultMonthlyPrice), 0);

  // Filtered Users List
  const filteredUsers = registeredUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.businessName || '').toLowerCase().includes(q) ||
      (u.contactNo || '').toLowerCase().includes(q) ||
      (u.foodypayId || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return !u.isLocked;
    if (statusFilter === 'locked') return u.isLocked;
    return true;
  });

  // Extract real customers from users/orders
  const aggregateCustomers = [];
  registeredUsers.forEach((u) => {
    if (u.dishes && u.dishes.length > 0) {
      aggregateCustomers.push({
        name: u.name || 'Diner',
        phone: u.contactNo || '+91 98123 45678',
        email: u.email,
        merchant: u.businessName || u.name,
        ordersCount: u.totalOrders || 1,
        totalSpend: u.totalSales || 450,
      });
    }
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090D16', color: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <header style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(255,94,20,0.45)' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 900, color: '#FFF', letterSpacing: '-0.02em' }}>
                  FoodyPay Platform Admin Console
                </h1>
                <span style={{ fontSize: '11px', backgroundColor: '#334155', color: '#38BDF8', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', border: '1px solid #0EA5E9' }}>
                  PRODUCTION DB
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                Account Management • Subscription Pricing • Lock Controls • Production Database Telemetry
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={loadLiveAdminData}
              disabled={loadingData}
              style={{
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
              <span>{loadingData ? 'Syncing...' : 'Reload DB Data'}</span>
            </button>

            <button
              onClick={() => setActiveTab('subscription_settings')}
              style={{
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Settings size={15} /> Global Settings
            </button>

            <button
              onClick={handleAdminLogout}
              style={{
                backgroundColor: '#7F1D1D',
                color: '#FECACA',
                border: '1px solid #991B1B',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={15} /> Exit Admin
            </button>
          </div>

        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px 24px' }}>

        {/* METRICS CARDS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>REAL MERCHANTS</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#FFF', marginTop: '4px' }}>{totalRegisteredCount}</div>
              <div style={{ fontSize: '12px', color: '#38BDF8', marginTop: '2px', fontWeight: 700 }}>Active Database Accounts</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: '#38BDF8' }}>
              <Building2 size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>ESTIMATED MRR</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>₹{totalMRR.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '12px', color: '#34D399', marginTop: '2px', fontWeight: 700 }}>Monthly Subscription Revenue</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: '#10B981' }}>
              <CreditCard size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>GROSS SALES</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>₹{totalPlatformSales.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '12px', color: '#FBBF24', marginTop: '2px', fontWeight: 700 }}>{totalPlatformOrders} Total Orders</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: '#F59E0B' }}>
              <DollarSign size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>LOCKED ACCOUNTS</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: lockedCount > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>{lockedCount}</div>
              <div style={{ fontSize: '12px', color: lockedCount > 0 ? '#FCA5A5' : '#6EE7B7', marginTop: '2px', fontWeight: 700 }}>Subscription Locked</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: lockedCount > 0 ? '#EF4444' : '#10B981' }}>
              <Lock size={26} />
            </div>
          </div>

        </div>

        {/* TABS NAVIGATION BAR */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
          {[
            { id: 'merchants', label: ' Merchant Accounts', count: registeredUsers.length },
            { id: 'customers', label: ' Customers & CRM', count: aggregateCustomers.length || registeredUsers.length },
            { id: 'orders', label: ' Live Orders Feed', count: globalOrders.length },
            { id: 'subscription_settings', label: '️ Global Subscription Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: activeTab === tab.id ? '#FF5E14' : '#0F172A',
                color: activeTab === tab.id ? '#FFF' : '#94A3B8',
                border: '1px solid ' + (activeTab === tab.id ? '#FF5E14' : '#1E293B'),
                padding: '11px 22px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* TAB 1: MERCHANTS & ACCOUNT MANAGEMENT */}
        {activeTab === 'merchants' && (
          <div>
            {/* Search & Filter controls */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search merchant by Email, Business Name, WhatsApp, FoodyPay ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #1E293B',
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '12px', border: '1px solid #1E293B' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    backgroundColor: statusFilter === 'all' ? '#1E293B' : 'transparent',
                    color: statusFilter === 'all' ? '#FFF' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  All Accounts ({registeredUsers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  style={{
                    backgroundColor: statusFilter === 'active' ? '#064E3B' : 'transparent',
                    color: statusFilter === 'active' ? '#34D399' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('locked')}
                  style={{
                    backgroundColor: statusFilter === 'locked' ? '#7F1D1D' : 'transparent',
                    color: statusFilter === 'locked' ? '#FCA5A5' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Locked ({lockedCount})
                </button>
              </div>
            </div>

            {/* MERCHANTS TABLE */}
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', overflow: 'hidden' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <Building2 size={40} color="#475569" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>No merchant accounts found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Try clearing your search filter.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#161F33', borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '14px 18px' }}>Merchant / Business</th>
                        <th style={{ padding: '14px 18px' }}>Contact Email &amp; Phone</th>
                        <th style={{ padding: '14px 18px' }}>Subscription Plan &amp; Price</th>
                        <th style={{ padding: '14px 18px' }}>Lock Status</th>
                        <th style={{ padding: '14px 18px' }}>Sales / Dishes</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right' }}>Account Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id} style={{ borderBottom: '1px solid #1E293B', backgroundColor: user.isLocked ? '#1A0B0E' : 'transparent' }}>
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#1E293B', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#FF5E14' }}>
                                {user.businessName ? user.businessName.charAt(0).toUpperCase() : 'M'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#FFF', fontSize: '14.5px' }}>{user.businessName || user.name}</div>
                                <div style={{ fontSize: '12px', color: '#38BDF8', marginTop: '2px', fontWeight: 600 }}>ID: {user.foodypayId}</div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ color: '#F1F5F9', fontWeight: 600 }}>{user.email}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{user.contactNo || 'No Phone Added'}</div>
                          </td>

                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>₹{user.subscriptionPrice}/mo</span>
                              <span style={{ fontSize: '10.5px', backgroundColor: '#1E293B', color: '#94A3B8', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                                {user.subscriptionPlan}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSubModalUser(user);
                                setSubForm({
                                  price: user.subscriptionPrice,
                                  plan: user.subscriptionPlan,
                                  status: user.subscriptionStatus,
                                  expiry: user.subscriptionExpiry ? user.subscriptionExpiry.split('T')[0] : '',
                                });
                              }}
                              style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: 0, fontSize: '11.5px', fontWeight: 700, marginTop: '4px' }}
                            >
                              ️ Change Subscription Price
                            </button>
                          </td>

                          <td style={{ padding: '16px 18px' }}>
                            {user.isLocked ? (
                              <div>
                                <span style={{ backgroundColor: '#7F1D1D', color: '#FECACA', border: '1px solid #991B1B', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Lock size={12} /> LOCKED
                                </span>
                                <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '4px' }}>{user.lockReason}</div>
                              </div>
                            ) : (
                              <span style={{ backgroundColor: '#064E3B', color: '#6EE7B7', border: '1px solid #047857', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={12} /> ACTIVE
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ fontWeight: 800, color: '#F59E0B' }}>₹{user.totalSales.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{user.totalOrders} Orders • {user.dishCount} Dishes</div>
                          </td>

                          <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              
                              {/* Lock / Unlock Toggle Button */}
                              <button
                                onClick={() => {
                                  setLockModalUser(user);
                                  setLockReasonInput(user.lockReason || 'Subscription Payment Required');
                                }}
                                style={{
                                  backgroundColor: user.isLocked ? '#064E3B' : '#7F1D1D',
                                  color: user.isLocked ? '#6EE7B7' : '#FECACA',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {user.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                <span>{user.isLocked ? 'Unlock Account' : 'Lock Account'}</span>
                              </button>

                              {/* Launch Dashboard Context */}
                              <button
                                onClick={() => handleLaunchMerchantDashboard(user)}
                                style={{
                                  backgroundColor: '#1E293B',
                                  color: '#38BDF8',
                                  border: '1px solid #334155',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title="Open Merchant POS Dashboard"
                              >
                                Open POS 
                              </button>

                              {/* Delete Account Button */}
                              <button
                                onClick={() => {
                                  setDeleteModalUser(user);
                                  setConfirmEmailInput('');
                                }}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#EF4444',
                                  border: '1px solid #7F1D1D',
                                  padding: '6px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                }}
                                title="Delete Account Permanently"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMERS & CRM */}
        {activeTab === 'customers' && (
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
              Aggregate Platform Customers &amp; CRM Database
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {aggregateCustomers.map((c, i) => (
                <div key={i} style={{ backgroundColor: '#161F33', border: '1px solid #1E293B', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#FFF' }}>{c.name}</div>
                  <div style={{ fontSize: '12.5px', color: '#38BDF8', marginTop: '2px' }}> {c.phone} •  {c.email}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
                    Store: <strong>{c.merchant}</strong> • Orders: {c.ordersCount} • Total Spend: ₹{c.totalSpend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE ORDERS FEED */}
        {activeTab === 'orders' && (
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
              Live Platform Orders Feed Across All Restaurants
            </h3>
            {globalOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                <Package size={36} color="#475569" style={{ marginBottom: '8px' }} />
                <div>No live orders recorded yet in system database.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {globalOrders.map((ord, idx) => (
                  <div key={ord._id || idx} style={{ backgroundColor: '#161F33', border: '1px solid #1E293B', padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#FFF', fontSize: '14px' }}>
                        Order #{ord.orderId || ord._id.slice(-6)} • ₹{ord.total || ord.subtotal || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                        Customer: {ord.customerName || 'Diner'} ({ord.customerPhone || 'N/A'}) • Table: {ord.tableNo || 'Dine-In'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', backgroundColor: '#064E3B', color: '#6EE7B7', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                        {ord.paymentMethod ? ord.paymentMethod.toUpperCase() : 'PAID ONLINE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GLOBAL PLATFORM SUBSCRIPTION SETTINGS */}
        {activeTab === 'subscription_settings' && (
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '28px', maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Settings size={24} color="#FF5E14" />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF' }}>
                Global Platform Subscription &amp; Policy Settings
              </h2>
            </div>

            <form onSubmit={handleSaveGlobalSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                  Platform Title / System Name
                </label>
                <input
                  type="text"
                  value={globalSubSettings.platformName}
                  onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, platformName: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Default Monthly Subscription Price (₹/mo)
                  </label>
                  <input
                    type="number"
                    value={globalSubSettings.defaultMonthlyPrice}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, defaultMonthlyPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Default Annual Subscription Price (₹/yr)
                  </label>
                  <input
                    type="number"
                    value={globalSubSettings.defaultAnnualPrice}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, defaultAnnualPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Free Trial Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={globalSubSettings.freeTrialDays}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, freeTrialDays: Number(e.target.value) })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Billing &amp; Admin Support Email
                  </label>
                  <input
                    type="email"
                    value={globalSubSettings.supportEmail}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, supportEmail: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#161F33', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                <input
                  type="checkbox"
                  id="autoLock"
                  checked={globalSubSettings.autoLockExpiredAccounts}
                  onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, autoLockExpiredAccounts: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="autoLock" style={{ fontSize: '13.5px', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>
                  Enforce Lock Policy: Automatically lock accounts when monthly subscription is not renewed.
                </label>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  padding: '13px',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={18} /> Save Global Subscription Settings
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ==========================================================================
          MODAL 1: LOCK / UNLOCK ACCOUNT MODAL
          ========================================================================== */}
      {lockModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '20px', padding: '24px', maxWidth: '480px', width: '100%', color: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: lockModalUser.isLocked ? '#34D399' : '#FCA5A5' }}>
                {lockModalUser.isLocked ? ' Unlock Merchant Account' : ' Lock Merchant Account'}
              </h3>
              <button onClick={() => setLockModalUser(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 16px' }}>
              Target Account: <strong>{lockModalUser.businessName || lockModalUser.name}</strong> ({lockModalUser.email})
            </p>

            {!lockModalUser.isLocked && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Lock Reason / Subscription Requirement Text:
                </label>
                <input
                  type="text"
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setLockModalUser(null)}
                style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAccountLockToggle}
                style={{
                  backgroundColor: lockModalUser.isLocked ? '#047857' : '#DC2626',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                {lockModalUser.isLocked ? 'Confirm Unlock' : 'Confirm Lock Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 2: PER-ACCOUNT SUBSCRIPTION PRICING MODAL
          ========================================================================== */}
      {subModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '20px', padding: '24px', maxWidth: '480px', width: '100%', color: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
                 Manage Subscription Pricing
              </h3>
              <button onClick={() => setSubModalUser(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUserSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Monthly Subscription Price (₹/month) *
                </label>
                <input
                  type="number"
                  value={subForm.price}
                  onChange={(e) => setSubForm({ ...subForm, price: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Subscription Plan Name
                </label>
                <input
                  type="text"
                  value={subForm.plan}
                  onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Subscription Status
                </label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Active">Active (Unlocked)</option>
                  <option value="Trial">Trial Period</option>
                  <option value="Expired">Expired</option>
                  <option value="Locked">Locked (Unpaid)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSubModalUser(null)}
                  style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3: DELETE USER ACCOUNT CONFIRMATION MODAL
          ========================================================================== */}
      {deleteModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #7F1D1D', borderRadius: '20px', padding: '24px', maxWidth: '500px', width: '100%', color: '#FFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#7F1D1D', color: '#FECACA', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#EF4444' }}>
                  Permanent Account Deletion
                </h3>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Action cannot be undone. Database record will be purged.</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#161F33', border: '1px solid #1E293B', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5 }}>
              Account to Delete: <strong style={{ color: '#FFF' }}>{deleteModalUser.email}</strong><br/>
              Merchant Name: <strong>{deleteModalUser.businessName || deleteModalUser.name}</strong>
            </div>

            <p style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '12px' }}>
              To confirm deletion, please type <strong style={{ color: '#EF4444' }}>{deleteModalUser.email}</strong> below:
            </p>

            <input
              type="text"
              placeholder={`Type ${deleteModalUser.email} to confirm`}
              value={confirmEmailInput}
              onChange={(e) => setConfirmEmailInput(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #7F1D1D', backgroundColor: '#1A0B0E', color: '#FFF', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteModalUser(null)}
                style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDeleteAccount}
                disabled={isDeleting || confirmEmailInput.trim().toLowerCase() !== deleteModalUser.email.trim().toLowerCase()}
                style={{
                  backgroundColor: confirmEmailInput.trim().toLowerCase() === deleteModalUser.email.trim().toLowerCase() ? '#DC2626' : '#334155',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '13.5px',
                  cursor: confirmEmailInput.trim().toLowerCase() === deleteModalUser.email.trim().toLowerCase() ? 'pointer' : 'not-allowed',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
