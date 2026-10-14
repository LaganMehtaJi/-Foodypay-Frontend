import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Store,
  Mail,
  Phone,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  Crown,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Eye,
  EyeOff,
  LogIn,
  AlertTriangle,
  Database,
  Server,
  Zap,
  KeyRound,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  fetchSetupUsers,
  subscribeToSetupUsers,
  registerSetupUser,
  deleteSetupUser,
  toggleSetupUserBlock,
  expireSetupUserPlan,
  upgradeSetupUserPlan,
  updateSetupUserDetails,
  updateSetupUserPasscode,
  checkServerStatus,
} from '../utils/setupApiService';
import { loginWithFirebaseGoogle } from '../utils/firebase';

const GoogleIcon = ({ className = "w-4 h-4 shrink-0" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const PLAN_PRESETS = [
  {
    id: 'L1',
    code: 'L1',
    name: 'L1 — Starter POS',
    price: 499,
    period: '/month',
    color: '#0284C7',
    bg: '#E0F2FE',
    border: '#38BDF8',
    features: ['1 Counter POS Billing', 'Table QR Dynamic Menu', 'Dine-In & Takeaway', 'Daily Sales Report'],
  },
  {
    id: 'L2',
    code: 'L2',
    name: 'L2 — Pro Growth',
    price: 1499,
    period: '/month',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FBBF24',
    popular: true,
    features: ['3 POS Billing Counters', 'Kitchen Display System (KDS)', 'Live Order Ticker & Alerts', 'Customer Khata & Dues Ledger'],
  },
  {
    id: 'L3',
    code: 'L3',
    name: 'L3 — Enterprise Max',
    price: 2999,
    period: '/month',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#A78BFA',
    features: ['Unlimited Counters & Outlets', 'Thermal Printer (58mm/80mm)', 'White-Label Branding', 'Priority Zero-Latency Cloud'],
  },
];

export default function SetupPage({ onShowToast }) {
  const navigate = useNavigate();

  // Navigation tab: 'register' | 'manage'
  const [activeTab, setActiveTab] = useState('register');

  // Server & Firestore health status
  const [serverStatus, setServerStatus] = useState({ online: false, mode: 'Checking connection...' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Users data
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Registration Form State
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    password: '',
    phone: '',
    foodypayId: '',
    plan: 'L1',
    subscriptionPrice: 499,
    activeDate: new Date().toISOString().split('T')[0],
    expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Active',
    isLocked: false,
    lockReason: 'Subscription Payment Required',
    passcode: '1234',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleQuickFilling, setIsGoogleQuickFilling] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [blockModalUser, setBlockModalUser] = useState(null);
  const [blockReasonInput, setBlockReasonInput] = useState('Subscription Payment Required');
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);

  const [upgradeModalUser, setUpgradeModalUser] = useState(null);
  const [upgradeForm, setUpgradeForm] = useState({
    plan: 'L2',
    durationMonths: 1,
    subscriptionPrice: 1499,
    expireDate: '',
  });
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    activeDate: '',
    expireDate: '',
    passcode: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  // Admin Passcode Management Modal
  const [passcodeModalUser, setPasscodeModalUser] = useState(null);
  const [passcodeInputValue, setPasscodeInputValue] = useState('');
  const [isUpdatingPasscode, setIsUpdatingPasscode] = useState(false);
  const [revealedPins, setRevealedPins] = useState({});

  // Copied FoodyPay ID tracking
  const [copiedId, setCopiedId] = useState('');

  const generateRandomFoodyPayId = () => {
    const randomId = 'FP-' + Math.floor(100000 + Math.random() * 900000);
    setForm((prev) => ({ ...prev, foodypayId: randomId }));
  };

  // Generate random FoodyPay ID on load if blank
  useEffect(() => {
    generateRandomFoodyPayId();
  }, []);

  // Check server health & load users
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const status = await checkServerStatus();
      if (isMounted) setServerStatus(status);

      const data = await fetchSetupUsers();
      if (isMounted) {
        setUsers(data);
        setIsLoadingUsers(false);
      }
    }

    init();

    // Subscribe to live Firestore updates
    const unsubscribe = subscribeToSetupUsers((cloudUsers) => {
      if (isMounted) {
        setUsers(cloudUsers);
        setIsLoadingUsers(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const status = await checkServerStatus();
    setServerStatus(status);
    const freshUsers = await fetchSetupUsers();
    setUsers(freshUsers);
    setIsRefreshing(false);
    if (onShowToast) onShowToast('⚡ Live Database & Server Synced!');
  };

  // Quick preset duration for expiry date
  const setExpiryPreset = (days) => {
    const active = form.activeDate ? new Date(form.activeDate) : new Date();
    const newExp = new Date(active.getTime() + days * 24 * 60 * 60 * 1000);
    setForm((prev) => ({
      ...prev,
      expireDate: newExp.toISOString().split('T')[0],
    }));
  };

  // Handle plan select in registration form
  const handleSelectPlan = (planCode) => {
    const preset = PLAN_PRESETS.find((p) => p.code === planCode) || PLAN_PRESETS[0];
    setForm((prev) => ({
      ...prev,
      plan: preset.code,
      subscriptionPrice: preset.price,
    }));
  };

  // Form Submit: Register User
  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Please enter Name, Email, and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerSetupUser(form);
      if (result.success) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
        setFormSuccess(`🎉 Account Created for "${result.user.businessName}" (${result.user.foodypayId})! Synchronized to Database.`);
        if (onShowToast) onShowToast(`✅ Account Created: ${result.user.businessName} (${result.user.foodypayId})`);

        // Refresh user list
        const fresh = await fetchSetupUsers();
        setUsers(fresh);

        // Reset form with new random ID
        const nextId = 'FP-' + Math.floor(100000 + Math.random() * 900000);
        setForm({
          name: '',
          businessName: '',
          email: '',
          password: '',
          phone: '',
          foodypayId: nextId,
          plan: 'L1',
          subscriptionPrice: 499,
          activeDate: new Date().toISOString().split('T')[0],
          expireDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Active',
          isLocked: false,
          lockReason: 'Subscription Payment Required',
          passcode: '1234',
        });
      } else {
        setFormError(result.message || 'Failed to create account.');
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Quick-Fill for Registration
  const handleGoogleQuickFill = async () => {
    setIsGoogleQuickFilling(true);
    setFormError('');
    try {
      const res = await loginWithFirebaseGoogle();
      if (res.success && res.user) {
        setForm((prev) => ({
          ...prev,
          name: res.user.displayName || prev.name,
          email: res.user.email || prev.email,
          businessName: res.user.displayName ? `${res.user.displayName}'s Restaurant` : prev.businessName,
        }));
        if (onShowToast) {
          onShowToast(`Google Verified! Details filled for ${res.user.displayName || res.user.email}`);
        }
      } else if (res.error) {
        setFormError(res.error);
      }
    } catch {
      setFormError('Google sign-in error.');
    } finally {
      setIsGoogleQuickFilling(false);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      const targetId = deleteModalUser.foodypayId || deleteModalUser.uniqueId || deleteModalUser.id;
      await deleteSetupUser(targetId, deleteModalUser.email);
      setUsers((prev) => prev.filter((u) => (u.foodypayId || u.uniqueId || u.id) !== targetId));
      if (onShowToast) onShowToast(`🗑️ Account ${deleteModalUser.businessName || targetId} deleted permanently.`);
      setDeleteModalUser(null);
    } catch  {
      if (onShowToast) onShowToast('Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Block / Unblock User
  const handleToggleBlock = async () => {
    if (!blockModalUser) return;
    setIsTogglingBlock(true);
    try {
      const targetId = blockModalUser.foodypayId || blockModalUser.uniqueId || blockModalUser.id;
      const willLock = !blockModalUser.isLocked;
      await toggleSetupUserBlock(targetId, willLock, blockReasonInput);

      setUsers((prev) =>
        prev.map((u) => {
          if ((u.foodypayId || u.uniqueId || u.id) === targetId) {
            return {
              ...u,
              isLocked: willLock,
              status: willLock ? 'Locked' : 'Active',
              subscriptionStatus: willLock ? 'Locked' : 'Active',
              lockReason: blockReasonInput,
            };
          }
          return u;
        })
      );

      if (onShowToast) {
        onShowToast(willLock ? `🔒 Account ${targetId} BLOCKED` : `🔓 Account ${targetId} UNBLOCKED / ACTIVE`);
      }
      setBlockModalUser(null);
    } catch  {
      if (onShowToast) onShowToast('Failed to update block status.');
    } finally {
      setIsTogglingBlock(false);
    }
  };

  // Expire User Plan Immediately
  const handleExpirePlan = async (user) => {
    const targetId = user.foodypayId || user.uniqueId || user.id;
    if (!window.confirm(`Are you sure you want to EXPIRE the plan for ${user.businessName || targetId} immediately?`)) {
      return;
    }

    try {
      await expireSetupUserPlan(targetId);
      setUsers((prev) =>
        prev.map((u) => {
          if ((u.foodypayId || u.uniqueId || u.id) === targetId) {
            return {
              ...u,
              status: 'Expired',
              subscriptionStatus: 'Expired',
              isLocked: true,
              expireDate: new Date().toISOString(),
              subscriptionExpiry: new Date().toISOString(),
            };
          }
          return u;
        })
      );
      if (onShowToast) onShowToast(`⚠️ Plan marked EXPIRED for ${user.businessName || targetId}`);
    } catch  {
      if (onShowToast) onShowToast('Failed to expire plan.');
    }
  };

  // Upgrade Plan
  const handleOpenUpgradeModal = (user) => {
    setUpgradeModalUser(user);
    const currentPlan = user.plan || user.subscriptionPlan || 'L1';
    const nextPlan = currentPlan === 'L1' ? 'L2' : currentPlan === 'L2' ? 'L3' : 'L3';
    const preset = PLAN_PRESETS.find((p) => p.code === nextPlan) || PLAN_PRESETS[1];

    const currentExp = user.expireDate ? new Date(user.expireDate) : new Date();
    const newExp = new Date(currentExp.getTime() + 30 * 24 * 60 * 60 * 1000);

    setUpgradeForm({
      plan: preset.code,
      durationMonths: 1,
      subscriptionPrice: preset.price,
      expireDate: newExp.toISOString().split('T')[0],
    });
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeModalUser) return;
    setIsUpgrading(true);
    try {
      const targetId = upgradeModalUser.foodypayId || upgradeModalUser.uniqueId || upgradeModalUser.id;
      await upgradeSetupUserPlan(targetId, upgradeForm);

      setUsers((prev) =>
        prev.map((u) => {
          if ((u.foodypayId || u.uniqueId || u.id) === targetId) {
            return {
              ...u,
              plan: upgradeForm.plan,
              subscriptionPlan: upgradeForm.plan,
              subscriptionPrice: upgradeForm.subscriptionPrice,
              expireDate: upgradeForm.expireDate,
              subscriptionExpiry: upgradeForm.expireDate,
              status: 'Active',
              subscriptionStatus: 'Active',
              isLocked: false,
            };
          }
          return u;
        })
      );

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      if (onShowToast) onShowToast(`👑 Plan upgraded to ${upgradeForm.plan} for ${upgradeModalUser.businessName || targetId}!`);
      setUpgradeModalUser(null);
    } catch  {
      if (onShowToast) onShowToast('Failed to upgrade plan.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Edit User Details
  const handleOpenEditModal = (user) => {
    setEditModalUser(user);
    setEditForm({
      name: user.name || user.ownerName || '',
      businessName: user.businessName || '',
      email: user.email || '',
      phone: user.phone || user.contactNo || '',
      activeDate: user.startingDate || user.activeDate ? new Date(user.startingDate || user.activeDate).toISOString().split('T')[0] : '',
      expireDate: user.expireDate || user.subscriptionExpiry ? new Date(user.expireDate || user.subscriptionExpiry).toISOString().split('T')[0] : '',
      passcode: user.passcode || user.pin || '1234',
    });
  };

  const handleConfirmEdit = async () => {
    if (!editModalUser) return;
    setIsEditing(true);
    try {
      const targetId = editModalUser.foodypayId || editModalUser.uniqueId || editModalUser.id;
      await updateSetupUserDetails(targetId, editForm);

      if (editForm.passcode && editForm.passcode.length === 4) {
        await updateSetupUserPasscode(targetId, editForm.passcode);
      }

      setUsers((prev) =>
        prev.map((u) => {
          if ((u.foodypayId || u.uniqueId || u.id) === targetId) {
            return {
              ...u,
              ...editForm,
              startingDate: editForm.activeDate,
              expireDate: editForm.expireDate,
              passcode: editForm.passcode || u.passcode,
              pin: editForm.passcode || u.pin,
            };
          }
          return u;
        })
      );

      if (onShowToast) onShowToast(`✏️ Details updated for ${editForm.businessName || targetId}`);
      setEditModalUser(null);
    } catch  {
      if (onShowToast) onShowToast('Failed to update details.');
    } finally {
      setIsEditing(false);
    }
  };

  // Admin Passcode Handlers
  const handleOpenPasscodeModal = (user) => {
    setPasscodeModalUser(user);
    const targetId = (user.foodypayId || user.uniqueId || user.id || '').toUpperCase();
    const currentPin =
      user.passcode ||
      user.pin ||
      localStorage.getItem(`foodypay_passcode_${targetId}`) ||
      (targetId === 'FP-9896' ? '9896' : '1234');
    setPasscodeInputValue(currentPin);
  };

  const handleConfirmPasscodeUpdate = async () => {
    if (!passcodeModalUser) return;
    const cleanPin = passcodeInputValue.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      alert('Please enter a valid 4-digit numeric passcode (e.g. 1234)');
      return;
    }

    setIsUpdatingPasscode(true);
    try {
      const targetId = passcodeModalUser.foodypayId || passcodeModalUser.uniqueId || passcodeModalUser.id;
      await updateSetupUserPasscode(targetId, cleanPin);

      setUsers((prev) =>
        prev.map((u) => {
          if ((u.foodypayId || u.uniqueId || u.id) === targetId) {
            return {
              ...u,
              passcode: cleanPin,
              pin: cleanPin,
              hasPasscode: true,
            };
          }
          return u;
        })
      );

      if (onShowToast) {
        onShowToast(`🔑 4-Digit Passcode set to "${cleanPin}" for ${passcodeModalUser.businessName || targetId}`);
      }
      setPasscodeModalUser(null);
    } catch  {
      if (onShowToast) onShowToast('Failed to update passcode.');
    } finally {
      setIsUpdatingPasscode(false);
    }
  };

  const togglePinReveal = (id) => {
    setRevealedPins((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Direct login as merchant
  const handleLaunchMerchantDashboard = (user) => {
    const targetId = user.foodypayId || user.uniqueId || user.id;
    const sessionUser = {
      _id: targetId,
      foodypayId: targetId,
      businessId: targetId,
      name: user.name || user.ownerName,
      businessName: user.businessName,
      email: user.email,
      contactNo: user.phone || user.contactNo,
      plan: user.plan || user.subscriptionPlan,
      status: user.status || user.subscriptionStatus,
    };
    try {
      localStorage.setItem('foodypay_user', JSON.stringify(sessionUser));
      localStorage.setItem('foodypay_active_business_id', targetId);
      localStorage.setItem('foodypay_pin_auth', 'true');
    } catch  {}

    if (onShowToast) onShowToast(`🚀 Launching Dashboard for ${user.businessName}...`);
    navigate('/dashboard');
  };

  // Copy FoodyPay ID helper
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length;
    let active = 0;
    let locked = 0;
    let expired = 0;
    let l1Count = 0;
    let l2Count = 0;
    let l3Count = 0;

    const now = Date.now();
    users.forEach((u) => {
      const isL = Boolean(u.isLocked || u.status === 'Locked' || u.subscriptionStatus === 'Locked');
      const isExp = Boolean(u.status === 'Expired' || (u.expireDate && new Date(u.expireDate).getTime() < now));

      if (isL) locked++;
      else if (isExp) expired++;
      else active++;

      const p = (u.plan || u.subscriptionPlan || 'L1').toUpperCase();
      if (p.includes('L3')) l3Count++;
      else if (p.includes('L2')) l2Count++;
      else l1Count++;
    });

    return { total, active, locked, expired, l1Count, l2Count, l3Count };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.businessName && u.businessName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.foodypayId && u.foodypayId.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      // Plan filter
      const userPlan = (u.plan || u.subscriptionPlan || 'L1').toUpperCase();
      let matchPlan = true;
      if (planFilter !== 'ALL') {
        matchPlan = userPlan.includes(planFilter);
      }

      // Status filter
      let matchStatus = true;
      const isL = Boolean(u.isLocked || u.status === 'Locked');
      const isExp = Boolean(u.status === 'Expired' || (u.expireDate && new Date(u.expireDate).getTime() < Date.now()));

      if (statusFilter === 'ACTIVE') {
        matchStatus = !isL && !isExp;
      } else if (statusFilter === 'LOCKED') {
        matchStatus = isL;
      } else if (statusFilter === 'EXPIRED') {
        matchStatus = isExp;
      }

      return matchSearch && matchPlan && matchStatus;
    });
  }, [users, searchQuery, planFilter, statusFilter]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Navbar */}
      <header
        style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1E293B',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF5E14 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255, 94, 20, 0.4)',
            }}
          >
            <ShieldCheck size={24} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>FoodyPay Setup</h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#FF5E14',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                MASTER CONTROL
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
              Merchant Setup, Plans (L1, L2, L3), Expiry Management & Cloud Database Sync
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Cloud Database Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
            }}
          >
            <Database size={14} color="#10B981" />
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Firestore:</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>🟢 Live</span>
          </div>

          {/* Server Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
            }}
          >
            <Server size={14} color={serverStatus.online ? '#10B981' : '#F59E0B'} />
            <span style={{ color: '#E2E8F0', fontWeight: 600 }}>API Server:</span>
            <span style={{ color: serverStatus.online ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
              {serverStatus.online ? '🟢 Connected' : '⚡ Resilient Sync'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'background 0.2s',
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>Sync</span>
          </button>

          {/* Links */}
          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'background 0.2s',
            }}
          >
            <LogIn size={14} />
            <span>Login / POS</span>
          </Link>

          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#FF5E14',
              color: '#FFFFFF',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            <Store size={14} />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Metric Cards Bar */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Total Registered
              </span>
              <Users size={18} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px', color: '#0F172A' }}>{stats.total}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>All Merchants & Accounts</div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Active Accounts
              </span>
              <CheckCircle2 size={18} color="#10B981" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px', color: '#10B981' }}>{stats.active}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Operational POS Users</div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Blocked / Locked
              </span>
              <Lock size={18} color="#EF4444" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px', color: '#EF4444' }}>{stats.locked}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Payment / Action Pending</div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Expired Plans
              </span>
              <Clock size={18} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '8px', color: '#F59E0B' }}>{stats.expired}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Renewal Required</div>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Plan Breakdown
              </span>
              <Crown size={18} color="#8B5CF6" />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0284C7' }}>
                L1: {stats.l1Count}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706' }}>
                L2: {stats.l2Count}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#EDE9FE', color: '#7C3AED' }}>
                L3: {stats.l3Count}
              </span>
            </div>
          </div>
        </section>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            borderBottom: '2px solid #E2E8F0',
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('register')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '14px',
              backgroundColor: activeTab === 'register' ? '#0F172A' : '#E2E8F0',
              color: activeTab === 'register' ? '#FFFFFF' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            <UserPlus size={18} />
            <span>1. Register New Merchant / Setup</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '14px',
              backgroundColor: activeTab === 'manage' ? '#0F172A' : '#E2E8F0',
              color: activeTab === 'manage' ? '#FFFFFF' : '#475569',
              transition: 'all 0.2s',
            }}
          >
            <Users size={18} />
            <span>2. All Registered Accounts ({users.length})</span>
            {stats.locked > 0 && (
              <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '11px', padding: '1px 6px', borderRadius: '10px' }}>
                {stats.locked}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: REGISTRATION SETUP FORM */}
        {activeTab === 'register' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: '#FF5E14',
                    color: '#FFFFFF',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  ⚡
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                    Register & Setup Restaurant Merchant
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Enter details, assign plan (L1, L2, L3), set Active Date & Expire Date. Directly writes to Cloud Firestore & Server.
                  </p>
                </div>
              </div>

              {/* Google Auto-fill / Quick Sign-In */}
              <button
                type="button"
                onClick={handleGoogleQuickFill}
                disabled={isGoogleQuickFilling}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  border: '1px solid #CBD5E1',
                  padding: '9px 16px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isGoogleQuickFilling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                }}
              >
                {isGoogleQuickFilling ? (
                  <RefreshCw size={14} className="spin" color="#FF5E14" />
                ) : (
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                )}
                <span>Auto-Fill with Google Account</span>
              </button>
            </div>

            {formError && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={18} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div
                style={{
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#15803D',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRegister}>
              {/* Row 1: Basic Info */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '18px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Owner / Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Business / Restaurant Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Snack Rack Café"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@snackrack.in"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter login password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 40px 11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748B',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Phone / Contact No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    FoodyPay ID (Unique ID)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={form.foodypayId}
                      onChange={(e) => setForm({ ...form, foodypayId: e.target.value.toUpperCase() })}
                      style={{
                        flex: 1,
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: 700,
                        backgroundColor: '#F1F5F9',
                        color: '#0F172A',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={generateRandomFoodyPayId}
                      title="Generate New ID"
                      style={{
                        backgroundColor: '#E2E8F0',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    4-Digit Passcode (POS Quick Login PIN) *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="e.g. 1234"
                    value={form.passcode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setForm({ ...form, passcode: clean });
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '4px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFDFB',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                    4-digit security PIN used to unlock POS without password
                  </span>
                </div>
              </div>

              {/* Row 2: PLAN SELECTION (L1, L2, L3) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>
                  Select Subscription Plan (L1, L2, L3) *
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {PLAN_PRESETS.map((p) => {
                    const isSelected = form.plan === p.code;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPlan(p.code)}
                        style={{
                          border: isSelected ? `2px solid ${p.color}` : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? p.bg : '#FFFFFF',
                          borderRadius: '14px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 4px 14px rgba(0,0,0,0.06)` : 'none',
                          position: 'relative',
                        }}
                      >
                        {p.popular && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              fontSize: '10px',
                              fontWeight: 800,
                              backgroundColor: p.color,
                              color: '#FFF',
                              padding: '2px 8px',
                              borderRadius: '8px',
                            }}
                          >
                            RECOMMENDED
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 900,
                              color: '#FFF',
                              backgroundColor: p.color,
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {p.code}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{p.name}</span>
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: p.color, marginBottom: '8px' }}>
                          ₹{p.price}
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{p.period}</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569' }}>
                          {p.features.map((f, i) => (
                            <li key={i} style={{ marginBottom: '3px' }}>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {/* Custom price modifier */}
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Custom Plan Price:</span>
                  <div style={{ position: 'relative', width: '130px' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      value={form.subscriptionPrice}
                      onChange={(e) => setForm({ ...form, subscriptionPrice: Number(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 24px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: ACTIVE DATE & EXPIRE DATE */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Calendar size={18} color="#FF5E14" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                    Subscription Dates (Active Date & Expire Date)
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                    marginBottom: '14px',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Active Date (Starting Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.activeDate}
                      onChange={(e) => setForm({ ...form, activeDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: 600,
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Expire Date (Subscription Expiration) *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.expireDate}
                      onChange={(e) => setForm({ ...form, expireDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: 600,
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '8px' }}>
                    ⚡ Quick Duration Presets for Expire Date:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { label: '+14 Days (Trial)', days: 14 },
                      { label: '+1 Month', days: 30 },
                      { label: '+3 Months', days: 90 },
                      { label: '+6 Months', days: 180 },
                      { label: '+1 Year', days: 365 },
                      { label: '+2 Years', days: 730 },
                      { label: 'Lifetime (5 Yrs)', days: 1825 },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setExpiryPreset(preset.days)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#334155',
                          transition: 'all 0.15s',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4: INITIAL ACCOUNT STATUS */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Initial Account Status
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[
                    { value: 'Active', label: '🟢 Active (Unrestricted)', locked: false },
                    { value: 'Trial', label: '🟡 Free Trial', locked: false },
                    { value: 'Locked', label: '🔴 Blocked / Locked', locked: true },
                    { value: 'Expired', label: '⚠️ Expired Plan', locked: true },
                  ].map((st) => (
                    <label
                      key={st.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: form.status === st.value ? '2px solid #0F172A' : '1px solid #CBD5E1',
                        backgroundColor: form.status === st.value ? '#F1F5F9' : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      <input
                        type="radio"
                        name="accountStatus"
                        checked={form.status === st.value}
                        onChange={() => setForm({ ...form, status: st.value, isLocked: st.locked })}
                        style={{ accentColor: '#FF5E14' }}
                      />
                      <span>{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#FF5E14',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(255, 94, 20, 0.4)',
                  transition: 'background 0.2s',
                }}
              >
                {isSubmitting ? <RefreshCw size={18} className="spin" /> : <Zap size={18} />}
                <span>{isSubmitting ? 'Registering & Syncing to Cloud Database...' : 'Register & Setup Merchant in Cloud Database'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MANAGE ALL REGISTERED ACCOUNTS */}
        {activeTab === 'manage' && (
          <div>
            {/* Search & Filter Header */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by restaurant, owner, email, FoodyPay ID or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Plan Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Plan:</span>
                {['ALL', 'L1', 'L2', 'L3'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlanFilter(p)}
                    style={{
                      border: planFilter === p ? '2px solid #0F172A' : '1px solid #CBD5E1',
                      backgroundColor: planFilter === p ? '#0F172A' : '#FFFFFF',
                      color: planFilter === p ? '#FFFFFF' : '#334155',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Status:</span>
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'ACTIVE', label: '🟢 Active' },
                  { id: 'LOCKED', label: '🔴 Blocked' },
                  { id: 'EXPIRED', label: '⚠️ Expired' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    style={{
                      border: statusFilter === s.id ? '2px solid #0F172A' : '1px solid #CBD5E1',
                      backgroundColor: statusFilter === s.id ? '#0F172A' : '#FFFFFF',
                      color: statusFilter === s.id ? '#FFFFFF' : '#334155',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Merchants List */}
            {isLoadingUsers ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                <div>Loading registered merchants from database...</div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '60px 20px',
                  textAlign: 'center',
                }}
              >
                <Store size={48} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0F172A' }}>No Merchants Found</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
                  No accounts matched your search or filter. Register a new merchant in the Setup tab.
                </p>
                <button
                  onClick={() => setActiveTab('register')}
                  style={{
                    backgroundColor: '#FF5E14',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Go to Register Setup
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredUsers.map((user) => {
                  const uId = user.foodypayId || user.uniqueId || user.id;
                  const isLocked = Boolean(user.isLocked || user.status === 'Locked' || user.subscriptionStatus === 'Locked');
                  const isExpired = Boolean(
                    user.status === 'Expired' ||
                      (user.expireDate && new Date(user.expireDate).getTime() < Date.now())
                  );

                  const planCode = (user.plan || user.subscriptionPlan || 'L1').toUpperCase();
                  const preset = PLAN_PRESETS.find((p) => planCode.includes(p.code)) || PLAN_PRESETS[0];

                  const daysRemaining = user.expireDate
                    ? Math.ceil((new Date(user.expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div
                      key={uId}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: isLocked ? '1px solid #FCA5A5' : isExpired ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                        padding: '20px 24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      {/* Left: Merchant Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            backgroundColor: isLocked ? '#FEE2E2' : preset.bg,
                            color: isLocked ? '#DC2626' : preset.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '18px',
                            border: `1px solid ${isLocked ? '#FCA5A5' : preset.border}`,
                            flexShrink: 0,
                          }}
                        >
                          {user.businessName ? user.businessName.charAt(0).toUpperCase() : 'M'}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                              {user.businessName || `${user.name}'s Restaurant`}
                            </span>
                            {/* FoodyPay ID Pill with Copy */}
                            <span
                              onClick={() => handleCopyId(uId)}
                              title="Click to copy ID"
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: '#F1F5F9',
                                color: '#475569',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{uId}</span>
                              {copiedId === uId ? <Check size={10} color="#10B981" /> : <Copy size={10} />}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                            {user.name && <span>👤 {user.name}</span>}
                            {user.email && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={12} /> {user.email}
                              </span>
                            )}
                            {(user.phone || user.contactNo) && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} /> {user.phone || user.contactNo}
                              </span>
                            )}
                            {/* 4-Digit Passcode Display Pill with Eye Toggle */}
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                backgroundColor: '#FFF7ED',
                                border: '1px solid #FFEDD5',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#C2410C',
                              }}
                            >
                              <KeyRound size={11} />
                              <span>PIN: {revealedPins[uId] ? (user.passcode || user.pin || '1234') : '••••'}</span>
                              <button
                                type="button"
                                onClick={() => togglePinReveal(uId)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: '#EA580C',
                                }}
                                title={revealedPins[uId] ? 'Hide PIN' : 'Show PIN'}
                              >
                                {revealedPins[uId] ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Plan & Dates */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                        {/* Plan Badge */}
                        <div
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            backgroundColor: preset.bg,
                            border: `1px solid ${preset.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Crown size={14} color={preset.color} />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: preset.color }}>
                            {preset.code} ({preset.name.split('—')[1] || 'Plan'})
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                            ₹{user.subscriptionPrice || preset.price}
                          </span>
                        </div>

                        {/* Dates Info */}
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ color: '#64748B' }}>
                            Active:{' '}
                            <strong style={{ color: '#0F172A' }}>
                              {user.startingDate || user.activeDate || user.createdAt
                                ? new Date(user.startingDate || user.activeDate || user.createdAt).toLocaleDateString()
                                : 'Today'}
                            </strong>
                          </div>
                          <div style={{ color: '#64748B', marginTop: '2px' }}>
                            Expires:{' '}
                            <strong style={{ color: isExpired ? '#DC2626' : '#0F172A' }}>
                              {user.expireDate || user.subscriptionExpiry
                                ? new Date(user.expireDate || user.subscriptionExpiry).toLocaleDateString()
                                : 'N/A'}
                            </strong>
                            {daysRemaining !== null && (
                              <span
                                style={{
                                  marginLeft: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: daysRemaining > 7 ? '#10B981' : daysRemaining > 0 ? '#F59E0B' : '#DC2626',
                                }}
                              >
                                ({daysRemaining > 0 ? `${daysRemaining}d left` : `Expired`})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isLocked ? (
                            <span
                              style={{
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Lock size={12} /> BLOCKED / LOCKED
                            </span>
                          ) : isExpired ? (
                            <span
                              style={{
                                backgroundColor: '#FEF3C7',
                                color: '#D97706',
                                border: '1px solid #FDE68A',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Clock size={12} /> EXPIRED
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: '#DCFCE7',
                                color: '#16A34A',
                                border: '1px solid #86EFAC',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle2 size={12} /> ACTIVE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions Toolbar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* 1. Upgrade Plan */}
                        <button
                          onClick={() => handleOpenUpgradeModal(user)}
                          title="Upgrade or Extend Plan"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#EDE9FE',
                            color: '#7C3AED',
                            border: '1px solid #DDD6FE',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Sparkles size={14} />
                          <span>Upgrade</span>
                        </button>

                        {/* 2. Block / Unblock Toggle */}
                        <button
                          onClick={() => {
                            setBlockModalUser(user);
                            setBlockReasonInput(user.lockReason || 'Subscription Payment Required');
                          }}
                          title={isLocked ? 'Unblock / Unlock Account' : 'Block / Lock Account'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: isLocked ? '#DCFCE7' : '#FEE2E2',
                            color: isLocked ? '#16A34A' : '#DC2626',
                            border: `1px solid ${isLocked ? '#86EFAC' : '#FCA5A5'}`,
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                          <span>{isLocked ? 'Unblock' : 'Block'}</span>
                        </button>

                        {/* 3. Expire Plan Immediately */}
                        {!isExpired && (
                          <button
                            onClick={() => handleExpirePlan(user)}
                            title="Expire Plan Now"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              border: '1px solid #FDE68A',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Clock size={14} />
                            <span>Expire</span>
                          </button>
                        )}

                        {/* 4. Edit Details */}
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          title="Edit Merchant Details"
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* 4.5 Set / Edit 4-Digit PIN */}
                        <button
                          onClick={() => handleOpenPasscodeModal(user)}
                          title="Set / Edit 4-Digit Passcode as Admin"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#FFF7ED',
                            color: '#C2410C',
                            border: '1px solid #FFD8BE',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <KeyRound size={13} />
                          <span>PIN</span>
                        </button>

                        {/* 5. Direct Launch Dashboard */}
                        <button
                          onClick={() => handleLaunchMerchantDashboard(user)}
                          title="Login as Merchant"
                          style={{
                            backgroundColor: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <LogIn size={13} />
                          <span>Login</span>
                        </button>

                        {/* 6. Delete User */}
                        <button
                          onClick={() => setDeleteModalUser(user)}
                          title="Permanently Delete Account"
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#EF4444',
                            border: '1px solid #FECACA',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: DELETE USER CONFIRMATION */}
      {deleteModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DC2626',
                }}
              >
                <Trash2 size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Delete Account</h3>
            </div>

            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: '0 0 16px' }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: '#0F172A' }}>{deleteModalUser.businessName || deleteModalUser.name}</strong> (
              {deleteModalUser.foodypayId})? This will wipe the account from Cloud Firestore & Server Database.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteModalUser(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isDeleting ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BLOCK / UNBLOCK USER */}
      {blockModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: blockModalUser.isLocked ? '#DCFCE7' : '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: blockModalUser.isLocked ? '#16A34A' : '#DC2626',
                }}
              >
                {blockModalUser.isLocked ? <Unlock size={22} /> : <Lock size={22} />}
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                {blockModalUser.isLocked ? 'Unblock / Unlock Account' : 'Block / Lock Account'}
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: '0 0 16px' }}>
              {blockModalUser.isLocked
                ? `Unlock ${blockModalUser.businessName || blockModalUser.name} to grant immediate full POS access again.`
                : `Locking this account will block POS login until unblocked or renewed.`}
            </p>

            {!blockModalUser.isLocked && (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Lock / Block Reason:
                </label>
                <input
                  type="text"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setBlockModalUser(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleToggleBlock}
                disabled={isTogglingBlock}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: blockModalUser.isLocked ? '#16A34A' : '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: isTogglingBlock ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isTogglingBlock ? <RefreshCw size={14} className="spin" /> : null}
                <span>{blockModalUser.isLocked ? 'Confirm Unblock' : 'Confirm Block Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UPGRADE PLAN */}
      {upgradeModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED',
                }}
              >
                <Crown size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Upgrade / Change Plan</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {upgradeModalUser.businessName || upgradeModalUser.name} ({upgradeModalUser.foodypayId})
                </span>
              </div>
            </div>

            {/* Choose Plan Tier */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Select New Plan Tier:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {PLAN_PRESETS.map((p) => {
                  const isSel = upgradeForm.plan === p.code;
                  return (
                    <div
                      key={p.code}
                      onClick={() =>
                        setUpgradeForm((prev) => ({
                          ...prev,
                          plan: p.code,
                          subscriptionPrice: p.price,
                        }))
                      }
                      style={{
                        border: isSel ? `2px solid ${p.color}` : '1px solid #E2E8F0',
                        backgroundColor: isSel ? p.bg : '#FFFFFF',
                        borderRadius: '10px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: '16px', color: p.color }}>{p.code}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>₹{p.price}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* New Expiry Date */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                New Expire Date:
              </label>
              <input
                type="date"
                value={upgradeForm.expireDate}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, expireDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                {[
                  { label: '+1 Month', days: 30 },
                  { label: '+3 Months', days: 90 },
                  { label: '+6 Months', days: 180 },
                  { label: '+1 Year', days: 365 },
                ].map((b, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const next = new Date(Date.now() + b.days * 24 * 60 * 60 * 1000);
                      setUpgradeForm((prev) => ({ ...prev, expireDate: next.toISOString().split('T')[0] }));
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price adjustment */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Price Charged (₹):
              </label>
              <input
                type="number"
                value={upgradeForm.subscriptionPrice}
                onChange={(e) => setUpgradeForm({ ...upgradeForm, subscriptionPrice: Number(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setUpgradeModalUser(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpgrade}
                disabled={isUpgrading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: isUpgrading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isUpgrading ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                <span>{isUpgrading ? 'Upgrading...' : 'Confirm Upgrade & Activate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT DETAILS */}
      {editModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0F172A',
                }}
              >
                <Edit3 size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Edit Merchant Details</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Owner Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Business Name
                </label>
                <input
                  type="text"
                  value={editForm.businessName}
                  onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Active Date
                  </label>
                  <input
                    type="date"
                    value={editForm.activeDate}
                    onChange={(e) => setEditForm({ ...editForm, activeDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Expire Date
                  </label>
                  <input
                    type="date"
                    value={editForm.expireDate}
                    onChange={(e) => setEditForm({ ...editForm, expireDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  4-Digit Access Passcode (POS Quick Login PIN)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={editForm.passcode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setEditForm({ ...editForm, passcode: clean });
                  }}
                  placeholder="e.g. 1234"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFDFB',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditModalUser(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={isEditing}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: isEditing ? 'not-allowed' : 'pointer',
                }}
              >
                {isEditing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SET / EDIT 4-DIGIT PASSCODE (ADMIN CONTROL) */}
      {passcodeModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              border: '1px solid #FED7AA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  backgroundColor: '#FFF7ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EA580C',
                  border: '1px solid #FFEDD5',
                }}
              >
                <KeyRound size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Set 4-Digit Passcode
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {passcodeModalUser.businessName || passcodeModalUser.name} ({passcodeModalUser.foodypayId})
                </span>
              </div>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
              Change or reset the 4-digit quick access PIN for this restaurant POS. Directly syncs to Cloud Firestore & merchant terminal.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                4-Digit Passcode (Numbers Only)
              </label>
              <input
                type="text"
                maxLength={4}
                value={passcodeInputValue}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPasscodeInputValue(clean);
                }}
                placeholder="e.g. 1234"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '2px solid #FED7AA',
                  fontSize: '22px',
                  fontWeight: 900,
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#EA580C',
                  backgroundColor: '#FFFDFB',
                }}
              />
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block', textAlign: 'center' }}>
                Must be exactly 4 numeric digits (0000 - 9999)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPasscodeModalUser(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPasscodeUpdate}
                disabled={isUpdatingPasscode || passcodeInputValue.length !== 4}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#EA580C',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: isUpdatingPasscode || passcodeInputValue.length !== 4 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                  opacity: passcodeInputValue.length === 4 ? 1 : 0.6,
                }}
              >
                {isUpdatingPasscode ? <RefreshCw size={14} className="spin" /> : <KeyRound size={14} />}
                <span>{isUpdatingPasscode ? 'Updating...' : 'Save & Sync Passcode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
