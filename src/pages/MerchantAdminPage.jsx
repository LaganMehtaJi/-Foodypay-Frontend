import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Crown,
  Store,
  KeyRound,
  Sparkles,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  Utensils,
  Plus,
  ArrowRight,
  ExternalLink,
  LogOut,
  RefreshCw,
  Edit3,
  Trash2,
  ShieldCheck,
  Building2,
  ChefHat,
  Monitor
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  subscribeToOrders,
  subscribeToTables,
  subscribeToProducts,
  getBusinessUserByUniqueId,
  saveBusinessUserToFirestore,
  updateOrderInFirestore,
  saveTableToFirestore,
  deleteTableFromFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  isAccountBlockedOrDeleted
} from '../utils/firestoreService';

export default function MerchantAdminPage({ onShowToast }) {
  const navigate = useNavigate();

  // Active Business & User session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('foodypay_user') || '{}');
    } catch (e) {
      return {};
    }
  });

  const activeBusinessId = localStorage.getItem('foodypay_active_business_id') || currentUser?.foodypayId || currentUser?.uniqueId || 'FP-348330';
  const token = localStorage.getItem('foodypay_token');

  // Verify auth - if not logged in, redirect to login
  useEffect(() => {
    if (!token && !localStorage.getItem('foodypay_admin_authed')) {
      navigate('/login?role=merchant_admin');
    }
  }, [token, navigate]);

  // Real-time Firestore Datasets
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [bizProfile, setBizProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sub-tab Navigation: 'overview' | 'credentials' | 'accounts' | 'tables' | 'catalog'
  const [subTab, setSubTab] = useState('overview');
  const [salesFilter, setSalesFilter] = useState('today');

  // Credentials State
  const [adminUniqueId, setAdminUniqueId] = useState(activeBusinessId);
  const [adminPartnerPassword, setAdminPartnerPassword] = useState(currentUser?.password || '');
  const [adminKitchenPassword, setAdminKitchenPassword] = useState(currentUser?.kitchenPassword || 'SnackRack400');
  const [showPartnerPass, setShowPartnerPass] = useState(false);
  const [showKitchenPass, setShowKitchenPass] = useState(false);
  const [credSaving, setCredSaving] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Table Add Modal
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCategory, setNewTableCategory] = useState('Main Dining');
  const [newTableSeats, setNewTableSeats] = useState(4);

  // Product Add Modal
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Main Course');
  const [newDishVeg, setNewDishVeg] = useState(true);

  // Subscribe to real-time Orders
  useEffect(() => {
    if (!activeBusinessId) return;
    const unsubOrders = subscribeToOrders(activeBusinessId, (liveOrders) => {
      setOrders(liveOrders || []);
      setLoading(false);
    });
    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
    };
  }, [activeBusinessId]);

  // Subscribe to real-time Tables
  useEffect(() => {
    if (!activeBusinessId) return;
    const unsubTables = subscribeToTables(activeBusinessId, (liveTables) => {
      setTables(liveTables || []);
    });
    return () => {
      if (typeof unsubTables === 'function') unsubTables();
    };
  }, [activeBusinessId]);

  // Subscribe to real-time Dishes/Products
  useEffect(() => {
    if (!activeBusinessId) return;
    const unsubProducts = subscribeToProducts(activeBusinessId, (liveProducts) => {
      setDishes(liveProducts || []);
    });
    return () => {
      if (typeof unsubProducts === 'function') unsubProducts();
    };
  }, [activeBusinessId]);

  // Fetch Business Profile from Firestore
  useEffect(() => {
    async function loadBiz() {
      if (!activeBusinessId) return;
      try {
        const bp = await getBusinessUserByUniqueId(activeBusinessId);
        if (bp) {
          setBizProfile(bp);
          if (bp.password) setAdminPartnerPassword(bp.password);
          if (bp.kitchenPassword) setAdminKitchenPassword(bp.kitchenPassword);
        }
      } catch (e) {
        console.warn('Error loading business profile:', e);
      }
    }
    loadBiz();
  }, [activeBusinessId]);

  // Periodic Account Liveness Check (Terminated account check)
  useEffect(() => {
    const checkAccount = async () => {
      const isBlocked = await isAccountBlockedOrDeleted(currentUser?.email, activeBusinessId);
      if (isBlocked) {
        localStorage.clear();
        sessionStorage.clear();
        alert('Your FoodyPay merchant account has been terminated or deleted by Master Admin.');
        window.location.href = '/login';
      }
    };
    checkAccount();
    const interval = setInterval(checkAccount, 12000);
    return () => clearInterval(interval);
  }, [currentUser?.email, activeBusinessId]);

  // ==========================================================================
  // SALES TELEMETRY COMPUTATION
  // ==========================================================================
  const salesData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7DaysStart = todayStart - 7 * 86400000;
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastMonthEnd = thisMonthStart - 1;

    const filtered = (orders || []).filter((o) => {
      const t = o.timestamp || (o.createdAt ? new Date(o.createdAt).getTime() : 0);
      if (salesFilter === 'today') return t >= todayStart;
      if (salesFilter === 'yesterday') return t >= yesterdayStart && t < todayStart;
      if (salesFilter === 'last_7') return t >= last7DaysStart;
      if (salesFilter === 'this_month') return t >= thisMonthStart;
      if (salesFilter === 'last_month') return t >= lastMonthStart && t <= lastMonthEnd;
      return true; // 'all'
    });

    const totalOrders = filtered.length;
    const totalSales = filtered.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const paidOrders = filtered.filter((o) => o.status === 'paid' || o.isPaid || o.paymentStatus === 'paid-upi' || o.paymentStatus === 'cash');
    const realizedSales = paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const unpaidOrders = filtered.filter((o) => o.status !== 'paid' && !o.isPaid && (o.paymentStatus === 'due' || o.status === 'due' || o.status === 'unpaid'));
    const unpaidSales = unpaidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const upiSales = filtered.filter((o) => String(o.paymentLabel || o.paymentStatus || '').toLowerCase().includes('upi')).reduce((s, o) => s + (Number(o.total) || 0), 0);
    const cashSales = filtered.filter((o) => String(o.paymentLabel || o.paymentStatus || '').toLowerCase().includes('cash')).reduce((s, o) => s + (Number(o.total) || 0), 0);
    const aov = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return { totalOrders, totalSales, realizedSales, unpaidOrders, unpaidSales, upiSales, cashSales, aov };
  }, [orders, salesFilter]);

  // All-time unpaid orders for Accounts tab
  const unpaidOrdersAllTime = useMemo(() => {
    return (orders || []).filter((o) => o.status !== 'paid' && !o.isPaid && (o.paymentStatus === 'due' || o.status === 'due' || o.status === 'unpaid'));
  }, [orders]);

  // Customer Directory summary
  const customerList = useMemo(() => {
    const map = {};
    (orders || []).forEach((o) => {
      const key = o.phone ? String(o.phone).trim() : (o.customer ? String(o.customer).trim() : 'Guest');
      if (!map[key]) {
        map[key] = {
          name: o.customer || 'Walk-in Guest',
          phone: o.phone || '',
          orderCount: 0,
          totalSpent: 0,
          unpaidAmount: 0,
          lastOrderDate: o.createdAt || null,
        };
      }
      map[key].orderCount += 1;
      map[key].totalSpent += Number(o.total) || 0;
      if (o.status !== 'paid' && !o.isPaid) {
        map[key].unpaidAmount += Number(o.total) || 0;
      }
    });
    return Object.values(map);
  }, [orders]);

  // Clipboard copy helper
  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
    if (onShowToast) onShowToast(`✓ Copied ${label} to clipboard!`);
  };

  // Generate Unique ID
  const handleGenerateUniqueId = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newId = `FP-${randomDigits}`;
    setAdminUniqueId(newId);
    if (onShowToast) onShowToast(`Generated new Store Unique ID: ${newId}`);
  };

  // Save Credentials to Firestore
  const handleSaveCredentials = async () => {
    if (!adminUniqueId.trim()) {
      alert('Please provide a valid Unique ID (e.g. FP-348330).');
      return;
    }
    setCredSaving(true);
    try {
      const payload = {
        uniqueId: adminUniqueId.trim().toUpperCase(),
        foodypayId: adminUniqueId.trim().toUpperCase(),
        password: adminPartnerPassword,
        kitchenPassword: adminKitchenPassword || 'SnackRack400',
        businessName: bizProfile?.businessName || currentUser?.businessName || "merchant's Business",
        email: currentUser?.email || bizProfile?.email || '',
        updatedAt: new Date().toISOString(),
      };

      await saveBusinessUserToFirestore(payload);
      localStorage.setItem('foodypay_active_business_id', adminUniqueId.trim().toUpperCase());

      // Update current user
      const updatedUser = { ...currentUser, ...payload };
      setCurrentUser(updatedUser);
      localStorage.setItem('foodypay_user', JSON.stringify(updatedUser));

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
      if (onShowToast) onShowToast('✓ Credentials saved to Cloud Firestore! Store & KDS logins updated.');
    } catch (err) {
      alert('Failed to save credentials: ' + err.message);
    } finally {
      setCredSaving(false);
    }
  };

  // Settle Unpaid Order
  const handleSettleUnpaidOrder = async (orderId) => {
    try {
      await updateOrderInFirestore(orderId, {
        status: 'paid',
        isPaid: true,
        paymentStatus: 'cash',
        paymentLabel: 'Cash Received (Settled in Merchant Admin)',
        tableCleared: true,
        settledAt: new Date().toISOString(),
      });
      setOrders((prev) =>
        prev.map((o) => ((o._id === orderId || o.id === orderId) ? { ...o, status: 'paid', isPaid: true, tableCleared: true } : o))
      );
      if (onShowToast) onShowToast(`✓ Order #${String(orderId).slice(-6)} marked as PAID & Settled!`);
    } catch (e) {
      alert('Failed to settle order: ' + e.message);
    }
  };

  // WhatsApp Reminder
  const handleSendWhatsAppReminder = (order) => {
    if (!order.phone) {
      alert('No phone number attached to this order.');
      return;
    }
    const cleanPhone = String(order.phone).replace(/\D/g, '');
    const storeName = bizProfile?.businessName || currentUser?.businessName || 'Our Restaurant';
    const msg = encodeURIComponent(
      `Hello ${order.customer || 'Diner'}, gentle reminder from ${storeName}: You have a pending bill of ₹${order.total} for Order #${String(order._id || order.id).slice(-6)}. Kindly settle your dues at your convenience. Thank you!`
    );
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, '_blank');
  };

  // Add Table
  const handleSaveNewTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    try {
      const tableObj = {
        name: newTableName.trim(),
        category: newTableCategory.trim() || 'Main Dining',
        seats: Number(newTableSeats) || 4,
        status: 'available',
        businessId: activeBusinessId,
      };
      await saveTableToFirestore(activeBusinessId, tableObj);
      setShowAddTableModal(false);
      setNewTableName('');
      if (onShowToast) onShowToast(`✓ Table "${tableObj.name}" added successfully!`);
    } catch (err) {
      alert('Failed to save table: ' + err.message);
    }
  };

  // Delete Table
  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Delete this dining table permanently?')) return;
    try {
      await deleteTableFromFirestore(activeBusinessId, tableId);
      if (onShowToast) onShowToast('Table deleted.');
    } catch (e) {
      alert('Failed to delete table: ' + e.message);
    }
  };

  // Add Product
  const handleSaveNewDish = async (e) => {
    e.preventDefault();
    if (!newDishName.trim() || !newDishPrice) return;
    try {
      const productObj = {
        name: newDishName.trim(),
        price: Number(newDishPrice),
        category: newDishCategory.trim() || 'Main Course',
        veg: Boolean(newDishVeg),
        inStock: true,
        businessId: activeBusinessId,
      };
      await saveProductToFirestore(activeBusinessId, productObj);
      setShowAddDishModal(false);
      setNewDishName('');
      setNewDishPrice('');
      if (onShowToast) onShowToast(`✓ Product "${productObj.name}" added to menu catalog!`);
    } catch (err) {
      alert('Failed to add product: ' + err.message);
    }
  };

  // Logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of Merchant Admin?')) {
      localStorage.removeItem('foodypay_token');
      localStorage.removeItem('foodypay_user');
      localStorage.removeItem('foodypay_admin_authed');
      navigate('/login?role=merchant_admin');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* =========================================================================
          TOP NAVIGATION BAR (STANDALONE MERCHANT ADMIN SUITE)
          ========================================================================= */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1.5px solid #E2E8F0',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF5E14 0%, #EA580C 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 94, 20, 0.35)'
          }}>
            <Crown size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>
                Merchant Admin Suite
              </h1>
              <span style={{
                background: '#FFF0EB',
                color: '#FF5E14',
                border: '1px solid #FFDCD0',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 900
              }}>
                STORE OWNER PORTAL
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              {bizProfile?.businessName || currentUser?.businessName || "merchant's Business"} • ID: <strong style={{ color: '#FF5E14' }}>{activeBusinessId}</strong>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Button to Open POS Dashboard in New Browser Tab */}
          <button
            type="button"
            onClick={() => window.open('/dashboard', '_blank')}
            style={{
              background: '#F1F5F9',
              border: '1.5px solid #CBD5E1',
              color: '#0F172A',
              padding: '8px 14px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Open POS Counter Dashboard in a separate tab"
          >
            <Monitor size={16} color="#0284C7" />
            <span>Open POS Counter Tab ↗</span>
          </button>

          {/* Button to Open Kitchen KDS in New Browser Tab */}
          <button
            type="button"
            onClick={() => window.open('/kds', '_blank')}
            style={{
              background: '#F1F5F9',
              border: '1.5px solid #CBD5E1',
              color: '#0F172A',
              padding: '8px 14px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Open Kitchen Display System in a separate tab"
          >
            <ChefHat size={16} color="#8B5CF6" />
            <span>Kitchen KDS Tab ↗</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              padding: '8px 12px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN BODY CONTAINER
          ========================================================================= */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* HERO DARK BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#FFFFFF',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FF5E14 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(255, 94, 20, 0.4)'
              }}>
                <Crown size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                    Merchant Admin Control Suite
                  </h2>
                  <span style={{
                    background: 'rgba(255, 94, 20, 0.2)',
                    border: '1px solid #FF5E14',
                    color: '#FF8A4C',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 900
                  }}>
                    SEPARATE ADMIN TAB
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94A3B8' }}>
                  Standalone Store Owner Administration. Control sales telemetry, generate Unique ID and staff passwords, manage dining tables, and audit unpaid customer accounts without cluttering the POS.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.08)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Store size={18} color="#38BDF8" />
              <div>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Active Store</div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF' }}>
                  {bizProfile?.businessName || currentUser?.businessName || "merchant's Business"} ({activeBusinessId})
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tab Pill Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {[
              { id: 'overview', label: '📊 Total Sales & Analytics', badge: `₹${salesData.totalSales.toLocaleString('en-IN')}` },
              { id: 'credentials', label: '🔑 Unique ID & Passwords', badge: 'Generate' },
              { id: 'accounts', label: '💳 Accounts & Unpaid Dues', badge: `${unpaidOrdersAllTime.length} Dues` },
              { id: 'tables', label: '🪑 Dining Tables', badge: `${tables.length} Tables` },
              { id: 'catalog', label: '📦 Catalog & Master Controls', badge: `${dishes.length} Items` },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSubTab(st.id)}
                style={{
                  background: subTab === st.id ? 'linear-gradient(135deg, #FF5E14 0%, #EA580C 100%)' : 'rgba(255, 255, 255, 0.08)',
                  color: subTab === st.id ? '#FFFFFF' : '#CBD5E1',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                <span>{st.label}</span>
                <span style={{
                  background: subTab === st.id ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.12)',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 900
                }}>
                  {st.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            SUB-TAB 1: OVERVIEW & SALES ANALYTICS
            ========================================================================= */}
        {subTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Sales Date Range Filter Buttons */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#FF5E14" />
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A' }}>Store Sales Period:</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'today', label: '⚡ Today' },
                  { id: 'yesterday', label: '📅 Yesterday' },
                  { id: 'last_7', label: '🗓️ Last 7 Days' },
                  { id: 'this_month', label: '📆 This Month' },
                  { id: 'last_month', label: '📊 Last Month' },
                  { id: 'all', label: '🌐 All Time' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setSalesFilter(btn.id)}
                    style={{
                      background: salesFilter === btn.id ? '#FF5E14' : '#F8FAFC',
                      color: salesFilter === btn.id ? '#FFFFFF' : '#475569',
                      border: `1.5px solid ${salesFilter === btn.id ? '#FF5E14' : '#E2E8F0'}`,
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Sales KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
              {/* Card 1: Gross Sales */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>Gross Store Sales</span>
                  <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={20} color="#16A34A" />
                  </span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '10px' }}>
                  ₹{salesData.totalSales.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700, marginTop: '4px' }}>
                  {salesData.totalOrders} Total Customer Orders
                </div>
              </div>

              {/* Card 2: Realized Revenue */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>Paid &amp; Realized Revenue</span>
                  <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} color="#2563EB" />
                  </span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#2563EB', marginTop: '10px' }}>
                  ₹{salesData.realizedSales.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, marginTop: '4px' }}>
                  Cash &amp; Online Settled
                </div>
              </div>

              {/* Card 3: Unpaid / Pending Khata */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>Unpaid / Pending Bill</span>
                  <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={20} color="#DC2626" />
                  </span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#DC2626', marginTop: '10px' }}>
                  ₹{salesData.unpaidSales.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, marginTop: '4px' }}>
                  {salesData.unpaidOrders.length} Diners Pending Clearance
                </div>
              </div>

              {/* Card 4: Average Order Value */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1.5px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>Average Order Value</span>
                  <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={20} color="#EA580C" />
                  </span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '10px' }}>
                  ₹{salesData.aov.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: '#EA580C', fontWeight: 700, marginTop: '4px' }}>
                  Per Diner Basket Average
                </div>
              </div>
            </div>

            {/* Payment Breakdown Card */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1.5px solid #E2E8F0' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>
                Payment Channels Breakdown ({salesFilter.replace('_', ' ').toUpperCase()})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>📱 Online / UPI / QR</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>₹{salesData.upiSales.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>💵 Cash at Counter</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>₹{salesData.cashSales.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#FEF2F2', padding: '14px', borderRadius: '12px', border: '1px solid #FCA5A5' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#DC2626' }}>⚠️ Unpaid / Khata Udhaar</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#DC2626', marginTop: '4px' }}>₹{salesData.unpaidSales.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB 2: UNIQUE ID & PASSWORDS GENERATOR
            ========================================================================= */}
        {subTab === 'credentials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1.5px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={20} color="#FF5E14" /> Store Unique ID &amp; Credentials Generator
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Generate custom credentials for Store Login and Kitchen KDS. Login will work via both registered Gmail and this Unique ID!
                </p>
              </div>

              {/* 1. Store Unique ID */}
              <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A' }}>
                    1. Store Unique ID (Restaurant Identification Key)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateUniqueId}
                    style={{ background: '#FFF0EB', color: '#FF5E14', border: '1px solid #FFDCD0', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Sparkles size={14} /> Generate New Unique ID
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={adminUniqueId}
                    onChange={(e) => setAdminUniqueId(e.target.value.toUpperCase())}
                    placeholder="e.g. FP-348330"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adminUniqueId, 'Unique ID')}
                    style={{ background: '#F1F5F9', border: '1.5px solid #CBD5E1', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '12px' }}
                  >
                    {copiedField === 'Unique ID' ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                    <span>{copiedField === 'Unique ID' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Merchant Store Partner Password */}
              <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
                  2. Merchant / Store Owner Password
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showPartnerPass ? 'text' : 'password'}
                      value={adminPartnerPassword}
                      onChange={(e) => setAdminPartnerPassword(e.target.value)}
                      placeholder="Custom Password for Store"
                      style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPartnerPass(!showPartnerPass)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                      {showPartnerPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adminPartnerPassword, 'Store Password')}
                    style={{ background: '#F1F5F9', border: '1.5px solid #CBD5E1', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '12px' }}
                  >
                    {copiedField === 'Store Password' ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                    <span>{copiedField === 'Store Password' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 3. Kitchen KDS Password */}
              <div style={{ background: '#F8FAFC', padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>
                  3. Kitchen Display (KDS) Chef Passcode
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showKitchenPass ? 'text' : 'password'}
                      value={adminKitchenPassword}
                      onChange={(e) => setAdminKitchenPassword(e.target.value)}
                      placeholder="Kitchen passcode (e.g. SnackRack400)"
                      style={{ width: '100%', padding: '10px 42px 10px 14px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '14px', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKitchenPass(!showKitchenPass)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                      {showKitchenPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adminKitchenPassword, 'Kitchen Password')}
                    style={{ background: '#F1F5F9', border: '1.5px solid #CBD5E1', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '12px' }}
                  >
                    {copiedField === 'Kitchen Password' ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                    <span>{copiedField === 'Kitchen Password' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveCredentials}
                disabled={credSaving}
                style={{
                  background: 'linear-gradient(135deg, #FF5E14 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(255, 94, 20, 0.35)'
                }}
              >
                <Save size={18} />
                <span>{credSaving ? 'Saving to Firestore...' : 'Save & Sync Credentials to Cloud Firestore'}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB 3: ACCOUNTS & UNPAID CUSTOMERS
            ========================================================================= */}
        {subTab === 'accounts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1.5px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} color="#DC2626" /> Unpaid Customer Dues ({unpaidOrdersAllTime.length})
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                    Track diners with pending payments. Click "Settle Paid" to clear dues or send an instant WhatsApp reminder.
                  </p>
                </div>

                <div style={{ background: '#FEF2F2', padding: '8px 16px', borderRadius: '12px', border: '1px solid #FCA5A5' }}>
                  <span style={{ fontSize: '12px', color: '#991B1B', fontWeight: 800 }}>Total Pending: </span>
                  <strong style={{ fontSize: '18px', color: '#DC2626' }}>
                    ₹{unpaidOrdersAllTime.reduce((s, o) => s + (Number(o.total) || 0), 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {unpaidOrdersAllTime.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '14px' }}>
                  <CheckCircle2 size={38} color="#16A34A" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>All Customer Accounts are Cleared!</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Zero pending dues or unpaid orders.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                        <th style={{ padding: '12px 14px' }}>Order ID</th>
                        <th style={{ padding: '12px 14px' }}>Customer Name</th>
                        <th style={{ padding: '12px 14px' }}>Contact Phone</th>
                        <th style={{ padding: '12px 14px' }}>Table / Type</th>
                        <th style={{ padding: '12px 14px' }}>Amount Due</th>
                        <th style={{ padding: '12px 14px' }}>Date</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidOrdersAllTime.map((o) => (
                        <tr key={o._id || o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1D4ED8' }}>#{String(o._id || o.id).slice(-6)}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{o.customer || 'Walk-in Diner'}</td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>{o.phone || 'N/A'}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '11.5px' }}>
                              {o.table || o.type || 'Dine-in'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 900, color: '#DC2626', fontSize: '14px' }}>₹{o.total}</td>
                          <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleSettleUnpaidOrder(o._id || o.id)}
                                style={{ background: '#16A34A', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Check size={14} /> Settle Paid
                              </button>
                              {o.phone && (
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppReminder(o)}
                                  style={{ background: '#25D366', color: '#FFFFFF', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                                  title="Send WhatsApp payment reminder"
                                >
                                  WhatsApp
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Customers Directory */}
            <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1.5px solid #E2E8F0' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#0D9488" /> All Customers Directory ({customerList.length})
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                      <th style={{ padding: '12px 14px' }}>Customer Name</th>
                      <th style={{ padding: '12px 14px' }}>Phone Number</th>
                      <th style={{ padding: '12px 14px' }}>Total Visits</th>
                      <th style={{ padding: '12px 14px' }}>Lifetime Spent</th>
                      <th style={{ padding: '12px 14px' }}>Pending Dues</th>
                      <th style={{ padding: '12px 14px' }}>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerList.map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{c.name}</td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>{c.phone || 'N/A'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '11.5px' }}>
                            {c.orderCount} Orders
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 900, color: '#16A34A' }}>₹{c.totalSpent.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: c.unpaidAmount > 0 ? '#DC2626' : '#64748B' }}>
                          {c.unpaidAmount > 0 ? `₹${c.unpaidAmount.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B', fontSize: '12px' }}>
                          {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB 4: DINING TABLES
            ========================================================================= */}
        {subTab === 'tables' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '18px 22px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>
                  Dining Tables Manager ({tables.length} Total Tables)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Manage tables for your restaurant. Synced in real-time with the POS Dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTableModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #FF5E14 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(255, 94, 20, 0.25)'
                }}
              >
                <Plus size={16} /> Add Table
              </button>
            </div>

            {/* Tables Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {tables.map((tbl) => (
                <div key={tbl._id || tbl.id || tbl.name} style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px', color: '#0F172A' }}>{tbl.name}</strong>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: '#F1F5F9', padding: '2px 8px', borderRadius: '6px', color: '#475569' }}>
                      {tbl.category || 'Dining'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Seats: <strong>{tbl.seats || 4} diners</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(tbl._id || tbl.id)}
                      style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Delete Table
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SUB-TAB 5: CATALOG & MASTER CONTROLS
            ========================================================================= */}
        {subTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '18px 22px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>
                  Catalog &amp; Master Menu Items ({dishes.length} Items)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  Full product catalog overview. Add dishes or toggle in-stock availability.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDishModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
                }}
              >
                <Plus size={16} /> Add Product to Catalog
              </button>
            </div>

            {/* Quick Products Table */}
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '16px', border: '1.5px solid #E2E8F0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                    <th style={{ padding: '12px 14px' }}>Dish Name</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Price</th>
                    <th style={{ padding: '12px 14px' }}>Food Type</th>
                    <th style={{ padding: '12px 14px' }}>Stock Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((d) => (
                    <tr key={d._id || d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A' }}>{d.name}</td>
                      <td style={{ padding: '12px 14px', color: '#64748B' }}>{d.category || 'Main Course'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 900, color: '#0F172A' }}>₹{d.price}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          background: d.veg ? '#DCFCE7' : '#FEE2E2',
                          color: d.veg ? '#15803D' : '#991B1B',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          {d.veg ? '🌱 VEG' : '🍗 NON-VEG'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          background: d.inStock !== false ? '#DCFCE7' : '#F1F5F9',
                          color: d.inStock !== false ? '#15803D' : '#64748B',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          {d.inStock !== false ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => deleteProductFromFirestore(activeBusinessId, d._id || d.id)}
                          style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          ADD TABLE MODAL
          ========================================================================= */}
      {showAddTableModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900 }}>Add New Dining Table</h3>
            <form onSubmit={handleSaveNewTable} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>Table Name / Number</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="e.g. Table 5, T-12, VIP 1"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>Section / Category</label>
                <input
                  type="text"
                  value={newTableCategory}
                  onChange={(e) => setNewTableCategory(e.target.value)}
                  placeholder="e.g. Main Hall, Cafe, Terrace"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>Seating Capacity</label>
                <input
                  type="number"
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(e.target.value)}
                  min="1"
                  max="50"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', background: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#FF5E14', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer' }}
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD DISH MODAL
          ========================================================================= */}
      {showAddDishModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900 }}>Add New Dish to Catalog</h3>
            <form onSubmit={handleSaveNewDish} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>Dish / Item Name</label>
                <input
                  type="text"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Butter Chicken, Paneer Tikka"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>Price (₹)</label>
                <input
                  type="number"
                  value={newDishPrice}
                  onChange={(e) => setNewDishPrice(e.target.value)}
                  placeholder="250"
                  required
                  min="0"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '4px' }}>Category</label>
                <input
                  type="text"
                  value={newDishCategory}
                  onChange={(e) => setNewDishCategory(e.target.value)}
                  placeholder="e.g. Main Course, Starters, Beverages"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={newDishVeg}
                    onChange={(e) => setNewDishVeg(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#16A34A' }}
                  />
                  <span>Pure Vegetarian (Veg)</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #CBD5E1', background: '#F8FAFC', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#1D4ED8', color: '#FFFFFF', fontWeight: 900, cursor: 'pointer' }}
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
