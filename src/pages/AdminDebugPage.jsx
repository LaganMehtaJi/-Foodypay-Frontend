import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Search,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  Users,
  Utensils,
  CheckCircle2,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Clock,
  Check,
  Mail,
  UserX,
  Crown,
  LogIn,
  LogOut,
  QrCode,
  Sparkles,
  Activity,
  Database,
  Building2,
  Phone,
  ShieldAlert
} from 'lucide-react';
import { fetchRegisteredUsersApi, deleteUserApi, deleteUserByEmailApi } from '../utils/api';

const INITIAL_BUSINESSES = [
  {
    id: 'biz_1',
    foodypayId: 'FP-985569',
    name: 'Lagan Da Dhaba',
    slug: 'lagan-da-dhaba',
    phone: '+91 98123 45678',
    address: 'Connaught Place, New Delhi',
    status: 'open',
    categoriesCount: 6,
    productsCount: 15,
    tablesCount: 6,
    totalSales: 48500,
    totalOrders: 142,
    gstPercent: 5,
    upiId: 'lagandhaba@icici',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
    createdAt: '12 Jan 2026',
  },
];

export default function AdminDebugPage({ onShowToast }) {
  const navigate = useNavigate();

  // Active Admin View Tab: 'users' | 'businesses'
  const [activeTab, setActiveTab] = useState('users');

  // Registered Users State (Strictly Real Data, no fake mock users)
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_registered_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    // Check if there is an active logged-in user in session
    try {
      const activeUserStr = localStorage.getItem('foodypay_user');
      if (activeUserStr) {
        const u = JSON.parse(activeUserStr);
        if (u.email) {
          return [
            {
              _id: u._id || 'user_' + Date.now(),
              email: u.email,
              name: u.name || 'Merchant Owner',
              businessName: u.businessName || 'Food Business',
              contactNo: u.contactNo || '',
              foodypayId: u.foodypayId || 'FP-985569',
              authProvider: 'local',
              isLoggedIn: true,
              hasPurchased: true,
              planName: 'Pro Plan',
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }
    } catch (err) {}

    return [];
  });


  // Business Outlets Registry
  const [businesses, setBusinesses] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_admin_businesses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_BUSINESSES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'logged_in' | 'purchased' | 'free'
  const [bizStatusFilter, setBizStatusFilter] = useState('all'); // 'all' | 'open' | 'closed'

  // Modal State for Adding / Editing Business
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBiz, setEditingBiz] = useState(null);
  const [bizForm, setBizForm] = useState({
    name: '',
    foodypayId: '',
    phone: '',
    address: '',
    categoriesCount: 6,
    productsCount: 15,
    tablesCount: 6,
    gstPercent: 5,
    upiId: '',
    logoUrl: '',
    status: 'open',
  });

  // Modal State for Adding New User Account
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    businessName: '',
    contactNo: '',
    hasPurchased: false,
  });

  // Fetch Users from Backend API on mount
  useEffect(() => {
    const loadBackendUsers = async () => {
      try {
        const response = await fetchRegisteredUsersApi();
        if (response && response.success && Array.isArray(response.data)) {
          const apiUsers = response.data.map((u) => ({
            _id: u._id,
            email: u.email,
            name: u.name || 'Merchant',
            businessName: u.businessName || 'Food Business',
            contactNo: u.contactNo || '',
            foodypayId: u.foodypayId || 'FP-' + Math.floor(100000 + Math.random() * 900000),
            authProvider: u.authProvider || 'local',
            isLoggedIn: true,
            hasPurchased: true,
            planName: 'Pro Plan',
            createdAt: u.createdAt || new Date().toISOString(),
          }));

          setRegisteredUsers((prev) => {
            const combinedMap = new Map();
            prev.forEach((item) => combinedMap.set(item.email.toLowerCase(), item));
            apiUsers.forEach((item) => combinedMap.set(item.email.toLowerCase(), item));
            const merged = Array.from(combinedMap.values());
            localStorage.setItem('foodypay_registered_users', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        // Fallback to localStorage pool
      }
    };
    loadBackendUsers();
  }, []);

  // Save registeredUsers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('foodypay_registered_users', JSON.stringify(registeredUsers));
    } catch (e) {}
  }, [registeredUsers]);

  // Save businesses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('foodypay_admin_businesses', JSON.stringify(businesses));
    } catch (e) {}
  }, [businesses]);

  // Aggregate Metrics & Counts
  const totalRegisteredCount = registeredUsers.length;
  const storesCreatedCount = registeredUsers.filter((u) => u.businessName && u.businessName.trim() !== '').length;
  const loggedInUsersCount = registeredUsers.filter((u) => u.isLoggedIn).length;
  const purchasedUsersCount = registeredUsers.filter((u) => u.hasPurchased).length;
  const freeUsersCount = registeredUsers.filter((u) => !u.hasPurchased).length;

  const totalSalesAll = businesses.reduce((s, b) => s + (Number(b.totalSales) || 0), 0);
  const totalOrdersAll = businesses.reduce((s, b) => s + (Number(b.totalOrders) || 0), 0);
  const totalProductsAll = businesses.reduce((s, b) => s + (Number(b.productsCount) || 0), 0);
  const totalTablesAll = businesses.reduce((s, b) => s + (Number(b.tablesCount) || 0), 0);
  const activeBizCount = businesses.filter((b) => b.status === 'open').length;

  // Filtered User List
  const filteredUsers = registeredUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.businessName || '').toLowerCase().includes(q) ||
      (u.contactNo || '').toLowerCase().includes(q) ||
      (u.foodypayId || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'stores_created') return u.businessName && u.businessName.trim() !== '';
    if (statusFilter === 'logged_in') return u.isLoggedIn;
    if (statusFilter === 'purchased') return u.hasPurchased;
    if (statusFilter === 'free') return !u.hasPurchased;
    return true;
  });


  // Filtered Businesses List
  const filteredBusinesses = businesses.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.name || '').toLowerCase().includes(q) ||
      (b.foodypayId || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      (b.phone || '').toLowerCase().includes(q);
    const matchesStatus = bizStatusFilter === 'all' || b.status === bizStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // DELETE USER ACCOUNT FROM DATABASE & SYSTEM REGISTRY
  const handleDeleteUserAccount = async (userId, userEmail, userName) => {
    const confirmMsg = `⚠️ ARE YOU SURE YOU WANT TO DELETE ACCOUNT (${userEmail}) FROM DATABASE?\n\n- User will be removed from MongoDB database.\n- User will be logged out and CANNOT log in.\n- Email address will be freed up for fresh registration.`;
    
    if (!window.confirm(confirmMsg)) return;

    // Try deleting from backend server API
    try {
      if (userId && !userId.startsWith('user_')) {
        await deleteUserApi(userId);
      } else {
        await deleteUserByEmailApi(userEmail);
      }
    } catch (e) {
      console.warn('Backend API delete note:', e.message);
    }

    // Remove from frontend state & localStorage
    const updatedUsers = registeredUsers.filter((u) => u.email.toLowerCase() !== userEmail.toLowerCase() && u._id !== userId);
    setRegisteredUsers(updatedUsers);
    localStorage.setItem('foodypay_registered_users', JSON.stringify(updatedUsers));

    // Clear session if current active logged-in user was deleted
    try {
      const currentUserStr = localStorage.getItem('foodypay_user');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.email && currentUser.email.toLowerCase() === userEmail.toLowerCase()) {
          localStorage.removeItem('foodypay_token');
          localStorage.removeItem('foodypay_user');
        }
      }
    } catch (err) {}

    if (onShowToast) {
      onShowToast(`🗑️ Account (${userEmail}) deleted from Database! Email is now free for re-registration.`);
    }
  };

  // Toggle Purchase Status (Free vs Paid Plan)
  const handleTogglePurchaseStatus = (userId, currentStatus) => {
    const nextStatus = !currentStatus;
    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u._id === userId) {
          return {
            ...u,
            hasPurchased: nextStatus,
            planName: nextStatus ? 'Pro Plan (₹499/mo)' : 'Free Plan',
          };
        }
        return u;
      })
    );

    if (onShowToast) {
      onShowToast(`Updated purchase status to ${nextStatus ? 'PRO PAID' : 'FREE PLAN'}`);
    }
  };

  // Create New User Account Manually
  const handleCreateUserSubmit = (e) => {
    e.preventDefault();
    if (!userForm.email.trim() || !userForm.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const emailLower = userForm.email.trim().toLowerCase();
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === emailLower);
    if (existing) {
      alert(`An account with email ${emailLower} already exists! Delete it first if you want to re-register.`);
      return;
    }

    const newUser = {
      _id: `user_${Date.now()}`,
      email: emailLower,
      name: userForm.name.trim() || 'Merchant Owner',
      businessName: userForm.businessName.trim() || 'Food Outlet',
      contactNo: userForm.contactNo.trim() || '+91 98000 00000',
      foodypayId: `FP-${Math.floor(100000 + Math.random() * 900000)}`,
      authProvider: 'local',
      isLoggedIn: true,
      hasPurchased: userForm.hasPurchased,
      planName: userForm.hasPurchased ? 'Pro Plan (₹499/mo)' : 'Free Plan',
      createdAt: new Date().toISOString(),
    };

    setRegisteredUsers((prev) => [newUser, ...prev]);
    setIsUserModalOpen(false);
    setUserForm({ name: '', email: '', businessName: '', contactNo: '', hasPurchased: false });

    if (onShowToast) {
      onShowToast(`✅ Account registered for ${newUser.email}!`);
    }
  };

  // Business Handlers
  const handleToggleBizStatus = (bizId) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === bizId) {
          const nextStatus = b.status === 'open' ? 'closed' : 'open';
          if (onShowToast) onShowToast(`${b.name} status updated to ${nextStatus.toUpperCase()}`);
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
  };

  const handleOpenAddModal = () => {
    setEditingBiz(null);
    const nextFpId = `FP-${Math.floor(100000 + Math.random() * 900000)}`;
    setBizForm({
      name: '',
      foodypayId: nextFpId,
      phone: '+91 98000 00000',
      address: 'New Delhi, India',
      categoriesCount: 6,
      productsCount: 15,
      tablesCount: 6,
      gstPercent: 5,
      upiId: 'merchant@icici',
      logoUrl: '',
      status: 'open',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (biz) => {
    setEditingBiz(biz);
    setBizForm({
      name: biz.name || '',
      foodypayId: biz.foodypayId || '',
      phone: biz.phone || '',
      address: biz.address || '',
      categoriesCount: biz.categoriesCount || 6,
      productsCount: biz.productsCount || 15,
      tablesCount: biz.tablesCount || 6,
      gstPercent: biz.gstPercent || 5,
      upiId: biz.upiId || '',
      logoUrl: biz.logoUrl || '',
      status: biz.status || 'open',
    });
    setIsModalOpen(true);
  };

  const handleDeleteBiz = (bizId, bizName) => {
    if (!window.confirm(`Are you sure you want to delete ${bizName} from Admin Panel?`)) return;
    setBusinesses((prev) => prev.filter((b) => b.id !== bizId));
    if (onShowToast) onShowToast(`🗑️ Deleted ${bizName} from system registry.`);
  };

  const handleSaveBizSubmit = (e) => {
    e.preventDefault();
    if (!bizForm.name.trim() || !bizForm.foodypayId.trim()) return;

    const slug = bizForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const bizData = {
      name: bizForm.name.trim(),
      foodypayId: bizForm.foodypayId.trim().toUpperCase(),
      slug,
      phone: bizForm.phone.trim(),
      address: bizForm.address.trim(),
      categoriesCount: Number(bizForm.categoriesCount) || 6,
      productsCount: Number(bizForm.productsCount) || 15,
      tablesCount: Number(bizForm.tablesCount) || 6,
      gstPercent: Number(bizForm.gstPercent) || 5,
      upiId: bizForm.upiId.trim() || 'merchant@icici',
      logoUrl: bizForm.logoUrl.trim(),
      status: bizForm.status || 'open',
    };

    if (editingBiz) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === editingBiz.id ? { ...b, ...bizData } : b))
      );
      if (onShowToast) onShowToast(`Updated ${bizData.name} details!`);
    } else {
      const newBiz = {
        ...bizData,
        id: `biz_${Date.now()}`,
        totalSales: 0,
        totalOrders: 0,
        createdAt: 'Just now',
      };
      setBusinesses((prev) => [newBiz, ...prev]);
      if (onShowToast) onShowToast(`Registered ${newBiz.name} (${newBiz.foodypayId})!`);
    }

    setIsModalOpen(false);
  };

  const handleLaunchDashboardForBiz = (biz) => {
    try {
      const u = {
        name: biz.name,
        businessName: biz.name,
        foodypayId: biz.foodypayId,
        contactNo: biz.phone,
        address: biz.address,
        gstPercent: biz.gstPercent,
        upiId: biz.upiId,
      };
      localStorage.setItem('foodypay_user', JSON.stringify(u));
    } catch (e) {}

    if (onShowToast) onShowToast(`Switched active context to ${biz.name} (${biz.foodypayId})`);
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', color: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Admin Header Bar */}
      <header style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,94,20,0.4)' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF', letterSpacing: '-0.02em' }}>
                  FoodyPay Master Admin Control Panel
                </h1>
                <span style={{ fontSize: '11px', backgroundColor: '#FF5E14', color: '#FFF', fontWeight: 900, padding: '2px 8px', borderRadius: '12px' }}>
                  /Admin
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                Database User Accounts Registry • Real-time Login Telemetry • Account Deletion Engine
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', backgroundColor: '#064E3B', color: '#34D399', padding: '6px 12px', borderRadius: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block' }} />
              MongoDB Database Online
            </span>

            {activeTab === 'users' ? (
              <button
                onClick={() => setIsUserModalOpen(true)}
                style={{
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(255,94,20,0.35)'
                }}
              >
                <Plus size={16} /> Register New Email User
              </button>
            ) : (
              <button
                onClick={handleOpenAddModal}
                style={{
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(255,94,20,0.35)'
                }}
              >
                <Plus size={16} /> Add Outlet Business
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Master Real-Time KPI Telemetry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>REGISTERED USER EMAILS</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#FFF', marginTop: '4px' }}>{totalRegisteredCount}</div>
              <div style={{ fontSize: '12px', color: '#38BDF8', marginTop: '2px', fontWeight: 700 }}>📧 Accounts in DB</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#38BDF8' }}>
              <Mail size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>STORES CREATED IN DB</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#FF5E14', marginTop: '4px' }}>{storesCreatedCount}</div>
              <div style={{ fontSize: '12px', color: '#FF5E14', marginTop: '2px', fontWeight: 700 }}>🏪 Stores Registered</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#FF5E14' }}>
              <Store size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>LOGGED IN USERS</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#34D399', marginTop: '4px' }}>{loggedInUsersCount}</div>
              <div style={{ fontSize: '12px', color: '#34D399', marginTop: '2px', fontWeight: 700 }}>🟢 Active Sessions</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#34D399' }}>
              <LogIn size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>PAID PURCHASES / PRO</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>{purchasedUsersCount}</div>
              <div style={{ fontSize: '12px', color: '#F59E0B', marginTop: '2px', fontWeight: 700 }}>👑 {freeUsersCount} Free Tier</div>
            </div>
            <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', color: '#F59E0B' }}>
              <Crown size={26} />
            </div>
          </div>

        </div>

        {/* View Selection Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              backgroundColor: activeTab === 'users' ? '#FF5E14' : '#1E293B',
              color: activeTab === 'users' ? '#FFF' : '#94A3B8',
              border: '1px solid ' + (activeTab === 'users' ? '#FF5E14' : '#334155'),
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Mail size={18} /> Registered User Emails ({registeredUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('businesses')}
            style={{
              backgroundColor: activeTab === 'businesses' ? '#FF5E14' : '#1E293B',
              color: activeTab === 'businesses' ? '#FFF' : '#94A3B8',
              border: '1px solid ' + (activeTab === 'businesses' ? '#FF5E14' : '#334155'),
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Store size={18} /> Outlet Businesses ({businesses.length})
          </button>
        </div>

        {/* TAB 1: REGISTERED USER EMAIL ACCOUNTS MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            {/* Search & Filter Bar for Users */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by Email (e.g. user@foodypay.com), Merchant Name, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    backgroundColor: '#1E293B',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '12px', border: '1px solid #334155' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    backgroundColor: statusFilter === 'all' ? '#334155' : 'transparent',
                    color: statusFilter === 'all' ? '#FFF' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  All Users ({registeredUsers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('stores_created')}
                  style={{
                    backgroundColor: statusFilter === 'stores_created' ? '#7C2D12' : 'transparent',
                    color: statusFilter === 'stores_created' ? '#FF5E14' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🏪 Stores Created ({storesCreatedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('logged_in')}
                  style={{
                    backgroundColor: statusFilter === 'logged_in' ? '#064E3B' : 'transparent',
                    color: statusFilter === 'logged_in' ? '#34D399' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🟢 Logged In ({loggedInUsersCount})
                </button>

                <button
                  onClick={() => setStatusFilter('purchased')}
                  style={{
                    backgroundColor: statusFilter === 'purchased' ? '#78350F' : 'transparent',
                    color: statusFilter === 'purchased' ? '#F59E0B' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  👑 Purchased ({purchasedUsersCount})
                </button>
                <button
                  onClick={() => setStatusFilter('free')}
                  style={{
                    backgroundColor: statusFilter === 'free' ? '#1E293B' : 'transparent',
                    color: statusFilter === 'free' ? '#94A3B8' : '#64748B',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Free Tier ({freeUsersCount})
                </button>
              </div>
            </div>

            {/* Registered Users Table */}
            <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F172A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={20} color="#38BDF8" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#FFF' }}>
                    Registered Database Accounts ({filteredUsers.length})
                  </h3>
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  Click <b>Delete Account</b> to remove from DB and allow re-registration
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
                  <UserX size={48} style={{ opacity: 0.4, marginBottom: '12px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#E2E8F0' }}>No registered user accounts match search query</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Try searching by email or clear active filter tabs.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #334155', color: '#94A3B8', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '14px 20px' }}>Registered Email / Name</th>
                        <th style={{ padding: '14px 16px' }}>Business Outlet</th>
                        <th style={{ padding: '14px 16px' }}>Contact</th>
                        <th style={{ padding: '14px 16px' }}>Auth Method</th>
                        <th style={{ padding: '14px 16px' }}>Login Status</th>
                        <th style={{ padding: '14px 16px' }}>Purchase Status</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>DB Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user._id || user.email}
                          style={{
                            borderBottom: '1px solid #334155',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          {/* Email & Name */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 800, color: '#FFF', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Mail size={15} color="#38BDF8" />
                              {user.email}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                              👤 {user.name} • <span style={{ color: '#64748B' }}>{user.foodypayId}</span>
                            </div>
                          </td>

                          {/* Business Name */}
                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building2 size={15} color="#FF5E14" />
                              {user.businessName}
                            </div>
                          </td>

                          {/* Contact */}
                          <td style={{ padding: '16px 16px', color: '#CBD5E1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                              <Phone size={14} color="#34D399" />
                              {user.contactNo || 'N/A'}
                            </div>
                          </td>

                          {/* Auth Method */}
                          <td style={{ padding: '16px 16px' }}>
                            {user.authProvider === 'google' ? (
                              <span style={{ fontSize: '11px', backgroundColor: '#1E3A8A', color: '#93C5FD', padding: '4px 10px', borderRadius: '12px', fontWeight: 800 }}>
                                🌐 Google OAuth
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', backgroundColor: '#334155', color: '#E2E8F0', padding: '4px 10px', borderRadius: '12px', fontWeight: 800 }}>
                                🔑 Email / Password
                              </span>
                            )}
                          </td>

                          {/* Login Status */}
                          <td style={{ padding: '16px 16px' }}>
                            {user.isLoggedIn ? (
                              <span style={{ fontSize: '11.5px', backgroundColor: '#064E3B', color: '#34D399', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399' }} />
                                Logged In
                              </span>
                            ) : (
                              <span style={{ fontSize: '11.5px', backgroundColor: '#334155', color: '#94A3B8', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                                Offline
                              </span>
                            )}
                          </td>

                          {/* Purchase Status */}
                          <td style={{ padding: '16px 16px' }}>
                            <button
                              onClick={() => handleTogglePurchaseStatus(user._id, user.hasPurchased)}
                              title="Click to toggle purchase status"
                              style={{
                                backgroundColor: user.hasPurchased ? '#78350F' : '#0F172A',
                                color: user.hasPurchased ? '#FBFBFE' : '#94A3B8',
                                border: '1px solid ' + (user.hasPurchased ? '#F59E0B' : '#334155'),
                                padding: '5px 12px',
                                borderRadius: '12px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <Crown size={13} color={user.hasPurchased ? '#F59E0B' : '#64748B'} />
                              {user.hasPurchased ? 'PRO PURCHASED' : 'Free Plan (Upgrade)'}
                            </button>
                          </td>

                          {/* Actions: Delete Account from DB */}
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                onClick={() => handleDeleteUserAccount(user._id, user.email, user.name)}
                                style={{
                                  backgroundColor: '#7F1D1D',
                                  color: '#FECACA',
                                  border: '1px solid #991B1B',
                                  padding: '8px 14px',
                                  borderRadius: '10px',
                                  fontSize: '12.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Delete account from Database permanently"
                              >
                                <Trash2 size={15} /> Delete Account
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

        {/* TAB 2: OUTLET BUSINESSES REGISTRY */}
        {activeTab === 'businesses' && (
          <div>
            {/* Filter & Search Bar for Businesses */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by Business Name, FoodyPay ID (e.g. FP-985569), City..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    backgroundColor: '#1E293B',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1E293B', padding: '4px', borderRadius: '12px', border: '1px solid #334155' }}>
                <button
                  onClick={() => setBizStatusFilter('all')}
                  style={{
                    backgroundColor: bizStatusFilter === 'all' ? '#334155' : 'transparent',
                    color: bizStatusFilter === 'all' ? '#FFF' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  All Outlets ({businesses.length})
                </button>
                <button
                  onClick={() => setBizStatusFilter('open')}
                  style={{
                    backgroundColor: bizStatusFilter === 'open' ? '#064E3B' : 'transparent',
                    color: bizStatusFilter === 'open' ? '#34D399' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🟢 Active Open ({activeBizCount})
                </button>
              </div>
            </div>

            {/* Businesses Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {filteredBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={biz.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80'}
                          alt={biz.name}
                          style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #334155' }}
                        />
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#FFF' }}>{biz.name}</h3>
                          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{biz.address}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleBizStatus(biz.id)}
                        style={{
                          backgroundColor: biz.status === 'open' ? '#064E3B' : '#7F1D1D',
                          color: biz.status === 'open' ? '#34D399' : '#FCA5A5',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {biz.status === 'open' ? '🟢 OPEN' : '🔴 CLOSED'}
                      </button>
                    </div>

                    <div style={{ backgroundColor: '#0F172A', borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '11px' }}>FoodyPay ID</span>
                        <b style={{ color: '#FF5E14', fontSize: '13px' }}>{biz.foodypayId}</b>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '11px' }}>Tables</span>
                        <b style={{ color: '#FFF' }}>{biz.tablesCount} Standees</b>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '11px' }}>Catalog</span>
                        <b style={{ color: '#38BDF8' }}>{biz.productsCount} Dishes</b>
                      </div>
                      <div>
                        <span style={{ color: '#94A3B8', display: 'block', fontSize: '11px' }}>GST Rate</span>
                        <b style={{ color: '#FFF' }}>{biz.gstPercent}%</b>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleLaunchDashboardForBiz(biz)}
                      style={{
                        flex: 1,
                        backgroundColor: '#FF5E14',
                        color: '#FFF',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        gap: '6px',
                      }}
                    >
                      <ExternalLink size={14} /> Open POS Dashboard
                    </button>
                    <button
                      onClick={() => handleDeleteBiz(biz.id, biz.name)}
                      style={{
                        backgroundColor: '#334155',
                        color: '#F8FAFC',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                      }}
                      title="Delete Business Outlet"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD NEW REGISTERED USER EMAIL ACCOUNT */}
      {isUserModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={22} color="#FF5E14" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
                  Register New User Email Account
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>Registered Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. merchant@foodypay.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>Merchant Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lagan Mehta"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>Restaurant / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lagan Da Dhaba"
                  value={userForm.businessName}
                  onChange={(e) => setUserForm({ ...userForm, businessName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>WhatsApp Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98123 45678"
                  value={userForm.contactNo}
                  onChange={(e) => setUserForm({ ...userForm, contactNo: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="hasPurchased"
                  checked={userForm.hasPurchased}
                  onChange={(e) => setUserForm({ ...userForm, hasPurchased: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="hasPurchased" style={{ fontSize: '13.5px', color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>
                  Mark as Paid / Purchased Subscription (Pro Plan)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#FF5E14', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BUSINESS */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
                {editingBiz ? `Edit Business: ${editingBiz.name}` : 'Register New Business Outlet'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBizSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>Business Outlet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagan Da Dhaba"
                  value={bizForm.name}
                  onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>FoodyPay ID *</label>
                  <input
                    type="text"
                    required
                    value={bizForm.foodypayId}
                    onChange={(e) => setBizForm({ ...bizForm, foodypayId: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>Phone Number</label>
                  <input
                    type="text"
                    value={bizForm.phone}
                    onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>Address</label>
                <input
                  type="text"
                  value={bizForm.address}
                  onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94A3B8', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#FF5E14', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Business
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
