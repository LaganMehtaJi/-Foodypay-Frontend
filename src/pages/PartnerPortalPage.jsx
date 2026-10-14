import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Lock,
  KeyRound,
  RefreshCw,
  Save,
  CheckCircle2,
  QrCode,
  Megaphone,
  Settings,
  Trash2,
  LogOut,
  Store,
  ChefHat,
  Eye,
  EyeOff,
  Sparkles,
  SlidersHorizontal,
  DollarSign,
  Calendar,
  ChevronDown,
  Utensils,
  Package,
  Users,
  BarChart3
} from 'lucide-react';
import {
  getPartnerCredentials,
  savePartnerCredentials,
  getStoreRestrictions,
  saveStoreRestrictions,
  generateUnique6DigitId,
  triggerAdminSyncBroadcast
} from '../utils/partnerAuth';
import { fetchOrdersApi } from '../utils/api';
import { subscribeToOrders } from '../utils/firestoreService';

export default function PartnerPortalPage({ onShowToast }) {
  const navigate = useNavigate();

  // Auth Check
  useEffect(() => {
    const isPartner = localStorage.getItem('foodypay_partner_logged_in');
    if (isPartner !== 'true') {
      navigate('/partner-login');
    }
  }, [navigate]);

  const handlePartnerLogout = () => {
    if (window.confirm('Are you sure you want to log out of Partner Admin Console?')) {
      localStorage.removeItem('foodypay_partner_logged_in');
      localStorage.removeItem('foodypay_partner_token');
      localStorage.removeItem('foodypay_partner_user');
      if (onShowToast) onShowToast('Logged out of Partner Admin Console.');
      navigate('/partner-login');
    }
  };

  // Telemetry & Orders Data State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Store & Restriction States
  const [restrictions, setRestrictions] = useState(getStoreRestrictions());
  const [upiIdInput, setUpiIdInput] = useState(restrictions.upiId || 'merchant@icici');

  // Partner Credentials State
  const [credentials, setCredentials] = useState(getPartnerCredentials());
  const [showPassMap, setShowPassMap] = useState({ admin: false, store: false, kitchen: false });

  // Sync credentials & restrictions from localStorage
  const loadData = () => {
    setCredentials(getPartnerCredentials());
    const r = getStoreRestrictions();
    setRestrictions(r);
    setUpiIdInput(r.upiId || 'merchant@icici');
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Fetch live order stats with real-time Firestore sync
  useEffect(() => {
    let unsubscribeFs = () => {};
    try {
      unsubscribeFs = subscribeToOrders(null, (liveOrders) => {
        if (Array.isArray(liveOrders) && liveOrders.length > 0) {
          setOrders(liveOrders);
          setLoadingOrders(false);
        }
      });
    } catch  {}

    const loadTelemetry = async () => {
      setLoadingOrders(true);
      try {
        const fetched = await fetchOrdersApi();
        if (Array.isArray(fetched) && fetched.length > 0) setOrders(fetched);
      } catch (err) {
        console.warn('Partner telemetry load warning:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    loadTelemetry();

    return () => {
      if (typeof unsubscribeFs === 'function') unsubscribeFs();
    };
  }, []);

  // Day-Wise Calendar & Date Range Filter State
  const [dateRangeFilter, setDateRangeFilter] = useState('today'); // 'today' | 'yesterday' | 'last_7' | 'last_30' | 'this_month' | 'custom' | 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Helper: Check if order falls in selected Date / Calendar Range
  const isOrderInDateRange = (o, rangeKey, startStr, endStr) => {
    if (!o) return false;
    if (rangeKey === 'all') return true;

    let oDate = null;
    if (o.createdAt) oDate = new Date(o.createdAt);
    else if (o.timestamp) oDate = new Date(o.timestamp);
    else if (o.date) oDate = new Date(o.date);
    else oDate = new Date();

    if (isNaN(oDate.getTime())) return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (rangeKey === 'today') {
      return oDate >= todayStart && oDate <= todayEnd;
    }

    if (rangeKey === 'yesterday') {
      const yestStart = new Date(todayStart);
      yestStart.setDate(yestStart.getDate() - 1);
      const yestEnd = new Date(todayStart);
      yestEnd.setMilliseconds(-1);
      return oDate >= yestStart && oDate <= yestEnd;
    }

    if (rangeKey === 'last_7') {
      const d7 = new Date(todayStart);
      d7.setDate(d7.getDate() - 6);
      return oDate >= d7 && oDate <= todayEnd;
    }

    if (rangeKey === 'last_30') {
      const d30 = new Date(todayStart);
      d30.setDate(d30.getDate() - 29);
      return oDate >= d30 && oDate <= todayEnd;
    }

    if (rangeKey === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return oDate >= monthStart && oDate <= todayEnd;
    }

    if (rangeKey === 'custom') {
      if (!startStr && !endStr) return true;
      const start = startStr ? new Date(`${startStr}T00:00:00`) : new Date(0);
      const end = endStr ? new Date(`${endStr}T23:59:59`) : new Date();
      return oDate >= start && oDate <= end;
    }

    return true;
  };

  const getFilterLabel = () => {
    if (dateRangeFilter === 'today') return "Today's";
    if (dateRangeFilter === 'yesterday') return "Yesterday's";
    if (dateRangeFilter === 'last_7') return "Last 7 Days";
    if (dateRangeFilter === 'last_30') return "Last 30 Days";
    if (dateRangeFilter === 'this_month') return "This Month's";
    if (dateRangeFilter === 'custom') return "Custom Range";
    return "All Time";
  };

  // Filtered Orders for the selected period
  const periodOrdersList = (orders || []).filter((o) =>
    isOrderInDateRange(o, dateRangeFilter, customStartDate, customEndDate)
  );

  const periodTotalSalesAmt = periodOrdersList.reduce(
    (sum, o) => sum + (o ? (Number(o.total) || 0) : 0),
    0
  );

  const periodTotalOrdersCount = periodOrdersList.length;

  const avgOrderValue = periodTotalOrdersCount > 0
    ? Math.round(periodTotalSalesAmt / periodTotalOrdersCount)
    : 0;

  const onlineOrders = periodOrdersList.filter(
    (o) => o && (o.paymentMode === 'online' || String(o.paymentStatus).toLowerCase().includes('online') || String(o.paymentStatus).toLowerCase().includes('razorpay'))
  );
  const onlineSalesAmt = onlineOrders.reduce((sum, o) => sum + (o ? (Number(o.total) || 0) : 0), 0);

  const cashOrders = periodOrdersList.filter(
    (o) => !onlineOrders.includes(o)
  );
  const cashSalesAmt = cashOrders.reduce((sum, o) => sum + (o ? (Number(o.total) || 0) : 0), 0);

  const activeKitchenTickets = (orders || []).filter(
    (o) => o && (o.status === 'new' || o.status === 'preparing')
  ).length;

  // Deep Telemetry: Top items, combos, and repeat retention
  const itemCounts = {};
  const comboCounts = {};
  periodOrdersList.forEach((o) => {
    (o.items || []).forEach((it) => {
      if (!it.name) return;
      const q = Number(it.qty) || 1;
      const p = Number(it.price) || 0;
      if (!itemCounts[it.name]) itemCounts[it.name] = { name: it.name, qty: 0, sales: 0 };
      itemCounts[it.name].qty += q;
      itemCounts[it.name].sales += q * p;

      if (it.name.toLowerCase().includes('combo')) {
        if (!comboCounts[it.name]) comboCounts[it.name] = { name: it.name, qty: 0, sales: 0 };
        comboCounts[it.name].qty += q;
        comboCounts[it.name].sales += q * p;
      }
    });
  });

  const sortedDishes = Object.values(itemCounts).sort((a, b) => b.qty - a.qty);
  const topDish = sortedDishes[0] || { name: 'No Orders In Range', qty: 0, sales: 0 };

  const sortedCombos = Object.values(comboCounts).sort((a, b) => b.qty - a.qty);
  const topCombo = sortedCombos[0] || { name: 'No Combos Sold Yet', qty: 0, sales: 0 };

  const customerMap = {};
  periodOrdersList.forEach((o) => {
    const key = o.customer || o.customerPhone || o.phone || o.customerName;
    if (!key) return;
    customerMap[key] = (customerMap[key] || 0) + 1;
  });
  const uniqueCustomerCount = Object.keys(customerMap).length;
  const repeatCustomerCount = Object.values(customerMap).filter((cnt) => cnt > 1).length;
  const customerRepeatRate = uniqueCustomerCount > 0
    ? ((repeatCustomerCount / uniqueCustomerCount) * 100).toFixed(1)
    : '0.0';

  // Save Store Restrictions & UPI ID
  const handleSaveRestrictions = (e) => {
    e?.preventDefault();
    const updated = {
      ...restrictions,
      upiId: upiIdInput.trim() || 'merchant@icici',
    };
    saveStoreRestrictions(updated);
    setRestrictions(updated);
    triggerAdminSyncBroadcast();
    if (onShowToast) onShowToast('⚡ Admin Restrictions Saved! Broadcasted live 2s refresh signal to Dashboard & Kitchen KDS.', <Sparkles color="#10B981" />);
  };

  // Save Credentials (Admin, Dashboard, Kitchen)
  const handleSaveCredentials = (e) => {
    e?.preventDefault();
    const updated = savePartnerCredentials(credentials);
    setCredentials(updated);
    triggerAdminSyncBroadcast();
    if (onShowToast) onShowToast('⚡ Access Credentials Saved! Broadcasted live 2s refresh signal to Dashboard & Kitchen KDS.', <Sparkles color="#10B981" />);
  };

  // Master Save All Admin Changes & Live Refresh Signal Broadcast Handler
  const handleMasterSaveAllAdminChanges = (e) => {
    e?.preventDefault();
    handleSaveRestrictions();
    handleSaveCredentials();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* TOP PARTNER HEADER */}
      <header style={{ background: '#0F172A', color: '#FFFFFF', padding: '16px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', sticky: 'top', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            <Building2 size={24} color="#FFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '19px', fontWeight: 900, letterSpacing: '-0.5px' }}>FoodyPay Partner Console</span>
              <span style={{ background: '#10B981', color: '#FFF', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>SuperAdmin Portal</span>
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Store Sales Telemetry &amp; Access Controls</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/dashboard" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1E293B', color: '#60A5FA', padding: '8px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800, textDecoration: 'none' }}>
            <Store size={16} /> Open Store Dashboard ↗
          </Link>
          <Link to="/kds" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1E293B', color: '#F59E0B', padding: '8px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800, textDecoration: 'none' }}>
            <ChefHat size={16} /> Open Kitchen KDS ↗
          </Link>
          <button
            type="button"
            onClick={handlePartnerLogout}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#334155', color: '#FCA5A5', padding: '8px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={16} /> Logout Admin
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* DATE RANGE & DAY-WISE CALENDAR SELECTION HEADER BAR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            backgroundColor: '#FFFFFF',
            padding: '16px 22px',
            borderRadius: '20px',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#0F172A' }}>
                Store Sales &amp; Business Telemetry Analytics
              </h2>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                Centralized Analytics &amp; Revenue Telemetry for SuperAdmin Partner
              </div>
            </div>
            {dateRangeFilter !== 'all' && (
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', padding: '4px 12px', borderRadius: '14px', border: '1px solid #A7F3D0' }}>
                Filter: {getFilterLabel()} ({periodOrdersList.length} Orders)
              </span>
            )}
          </div>

          {/* DAY-WISE CALENDAR & DATE RANGE SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '9px 36px 9px 36px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#1E293B',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  outline: 'none',
                }}
              >
                <option value="today"> Today</option>
                <option value="yesterday"> Yesterday</option>
                <option value="last_7"> Last 7 days</option>
                <option value="last_30"> Last 30 days</option>
                <option value="this_month"> This Month</option>
                <option value="custom">️ Custom Date Range (Day-Wise Calendar)</option>
                <option value="all"> All Time (All Sales)</option>
              </select>
              <Calendar size={17} color="#475569" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
              <ChevronDown size={16} color="#475569" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
            </div>

            {/* CUSTOM DAY-WISE CALENDAR PICKERS */}
            {dateRangeFilter === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748B' }}>From:</div>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '5px 10px', fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}
                />
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748B' }}>To:</div>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '5px 10px', fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}
                />
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    style={{ border: 'none', background: '#E2E8F0', borderRadius: '6px', padding: '4px 8px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', color: '#475569' }}
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COMPREHENSIVE KPI ANALYTICS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
          
          {/* Card 1: Total Period Sales */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getFilterLabel()} Total Sales</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={22} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#059669' }}>
              ₹{periodTotalSalesAmt.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, marginTop: '6px' }}>
               Live Revenue for {getFilterLabel()}
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{getFilterLabel()} Orders</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={22} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0F172A' }}>
              {periodTotalOrdersCount} <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 700 }}>Orders</span>
            </div>
            <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700, marginTop: '6px' }}>
               Verified Completed &amp; Active
            </div>
          </div>

          {/* Card 3: Average Order Value (AOV) */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Bill Value (AOV)</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={22} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#7C3AED' }}>
              ₹{avgOrderValue} <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 700 }}>/ order</span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
              Across {periodTotalOrdersCount} total orders in filter
            </div>
          </div>

          {/* Card 4: Active Kitchen Tickets */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Kitchen Tickets</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FFF0EB', color: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChefHat size={22} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#FF5E14' }}>
              {activeKitchenTickets} <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 700 }}>Tickets</span>
            </div>
            <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: 700, marginTop: '6px' }}>
               Currently preparing on KDS
            </div>
          </div>

          {/* Card 5: Payment Breakdown (Online UPI vs Counter) */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Modes</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#059669', fontWeight: 800 }}>Online UPI:</span>
                <b style={{ color: '#0F172A' }}>₹{onlineSalesAmt.toLocaleString('en-IN')} ({onlineOrders.length})</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: '#D97706', fontWeight: 800 }}>Cash/Counter:</span>
                <b style={{ color: '#0F172A' }}>₹{cashSalesAmt.toLocaleString('en-IN')} ({cashOrders.length})</b>
              </div>
            </div>
          </div>

          {/* Card 6: Customer Repeat Rate & Loyalty */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '22px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diner Repeat Rate</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#4F46E5' }}>
              {customerRepeatRate}%
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
              {uniqueCustomerCount} unique diners • {repeatCustomerCount} repeat visits
            </div>
          </div>

        </div>

        {/* DEEP MENU & PRODUCT TELEMETRY SECTION (GROW ANALYTICS IN PARTNER) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          
          {/* Top Dish Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={20} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Most Ordered Dish</span>
              </div>
              <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>#1 Dish</span>
            </div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>{topDish.name}</div>
              <div style={{ fontSize: '13px', color: topDish.qty > 0 ? '#059669' : '#64748B', fontWeight: 800 }}>
                {topDish.qty > 0 ? ` ${topDish.qty} Units Sold • ₹${topDish.sales.toLocaleString('en-IN')} Total Revenue` : '₹0 Sales recorded in this period'}
              </div>
            </div>
          </div>

          {/* Top Combo Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={20} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Best Selling Combo</span>
              </div>
              <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>#1 Combo</span>
            </div>
            <div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>{topCombo.name}</div>
              <div style={{ fontSize: '13px', color: topCombo.qty > 0 ? '#2563EB' : '#64748B', fontWeight: 800 }}>
                {topCombo.qty > 0 ? ` ${topCombo.qty} Combos Sold • ₹${topCombo.sales.toLocaleString('en-IN')} Total Revenue` : 'No combo sales recorded in this period'}
              </div>
            </div>
          </div>

        </div>

        {/* TOP PERFORMING MENU ITEMS LEADERBOARD */}
        {sortedDishes.length > 0 && (
          <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>Top Selling Items Leaderboard ({getFilterLabel()})</h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>Ranked by Units Sold</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sortedDishes.slice(0, 5).map((dish, idx) => {
                const maxQty = sortedDishes[0]?.qty || 1;
                const pct = Math.round((dish.qty / maxQty) * 100);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>
                        #{idx + 1} {dish.name}
                      </span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        {dish.qty} orders • <b style={{ color: '#0F172A' }}>₹{dish.sales.toLocaleString('en-IN')}</b>
                      </span>
                    </div>
                    <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #059669)', borderRadius: '10px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MASTER SAVE & SYNC LIVE APPS ACTION CARD */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: '24px', padding: '24px 28px', color: '#FFFFFF', boxShadow: '0 8px 24px rgba(15,23,42,0.15)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: 900 }}>
              <Sparkles color="#10B981" size={24} /> Save All Admin Changes &amp; Live Sync Apps
            </div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
              Clicking this button saves all Store Restrictions, UPI IDs &amp; Credentials and triggers a live 2-second auto-refresh popup on Store Dashboard &amp; Kitchen KDS!
            </div>
          </div>

          <button
            type="button"
            onClick={handleMasterSaveAllAdminChanges}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={20} /> Save Changes &amp; Refresh Live Apps (2s)
          </button>
        </div>

        {/* SECTION 1: STORE UPI & ACCESS RESTRICTION CONTROLS */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <SlidersHorizontal size={22} color="#10B981" />
            <div>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#0F172A' }}>Store Controls &amp; Dashboard Restrictions</h2>
              <span style={{ fontSize: '12.5px', color: '#64748B' }}>Admin settings to update Store UPI ID &amp; restrict dashboard tabs for store users</span>
            </div>
          </div>

          <form onSubmit={handleSaveRestrictions} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Live Store UPI ID Update Field */}
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', padding: '16px 20px', borderRadius: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  Merchant Store UPI VPA Address (Live Pay QR)
                </label>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Customer QR codes and mobile UPI payment deep links will instantly use this UPI ID.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. merchant@icici"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #94A3B8', fontSize: '14px', fontWeight: 700, width: '220px', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleSaveRestrictions}
                  style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={16} /> Update UPI ID
                </button>
              </div>
            </div>

            {/* Dashboard Tab Locks Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              
              {/* Lock 1: Settings Panel */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: restrictions.lockSettings ? '#FEF2F2' : '#F8FAFC', border: restrictions.lockSettings ? '1.5px solid #FECACA' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Settings size={18} color={restrictions.lockSettings ? '#DC2626' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Restrict Settings Panel</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Prevent store user from changing settings</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={restrictions.lockSettings}
                  onChange={(e) => setRestrictions({ ...restrictions, lockSettings: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                />
              </label>

              {/* Lock 2: Marketing & Campaigns */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: restrictions.lockMarketing ? '#FEF2F2' : '#F8FAFC', border: restrictions.lockMarketing ? '1.5px solid #FECACA' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Megaphone size={18} color={restrictions.lockMarketing ? '#DC2626' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Restrict Marketing Tab</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Lock coupon creation &amp; campaign push</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={restrictions.lockMarketing}
                  onChange={(e) => setRestrictions({ ...restrictions, lockMarketing: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                />
              </label>

              {/* Lock 3: Utilities & Table QR */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: restrictions.lockUtilities ? '#FEF2F2' : '#F8FAFC', border: restrictions.lockUtilities ? '1.5px solid #FECACA' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <QrCode size={18} color={restrictions.lockUtilities ? '#DC2626' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Restrict Utilities Tab</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Lock Table QR Code Generator</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={restrictions.lockUtilities}
                  onChange={(e) => setRestrictions({ ...restrictions, lockUtilities: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                />
              </label>

              {/* Lock 4: Table CRUD */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: restrictions.lockTableCrud ? '#FEF2F2' : '#F8FAFC', border: restrictions.lockTableCrud ? '1.5px solid #FECACA' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock size={18} color={restrictions.lockTableCrud ? '#DC2626' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Lock Table Add / Delete</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Prevent modifying restaurant tables</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={restrictions.lockTableCrud}
                  onChange={(e) => setRestrictions({ ...restrictions, lockTableCrud: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                />
              </label>

              {/* Lock 5: Order Deletion */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: restrictions.lockOrderDeletion ? '#FEF2F2' : '#F8FAFC', border: restrictions.lockOrderDeletion ? '1.5px solid #FECACA' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trash2 size={18} color={restrictions.lockOrderDeletion ? '#DC2626' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Lock Order Deletion</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Prevent store user from deleting orders</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={restrictions.lockOrderDeletion}
                  onChange={(e) => setRestrictions({ ...restrictions, lockOrderDeletion: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                />
              </label>

              {/* Lock 6: Catalog Dish Editing */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: restrictions.lockCatalogEdit ? '#FEF2F2' : '#F8FAFC', border: restrictions.lockCatalogEdit ? '1.5px solid #FECACA' : '1px solid #E2E8F0', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock size={18} color={restrictions.lockCatalogEdit ? '#DC2626' : '#64748B'} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Lock Catalog Dish Editing</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B' }}>Prevent changing prices &amp; dish names</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={restrictions.lockCatalogEdit}
                  onChange={(e) => setRestrictions({ ...restrictions, lockCatalogEdit: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#DC2626' }}
                />
              </label>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={18} /> Save Dashboard Restrictions
              </button>
            </div>

          </form>
        </div>

        {/* SECTION 2: ACCESS CREDENTIALS ISSUANCE & 6-DIGIT UNIQUE IDs */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <KeyRound size={22} color="#3B82F6" />
            <div>
              <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#0F172A' }}>Portal Credentials &amp; 6-Digit Unique IDs</h2>
              <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                Set Email/Password &amp; 6-Digit Unique IDs for Store Dashboard &amp; Kitchen KDS Logins
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              
              {/* CARD A: STORE DASHBOARD ACCESS CREDENTIALS */}
              <div style={{ background: '#F8FAFC', borderRadius: '18px', border: '1.5px solid #BFDBFE', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #DBEAFE', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: '#1E40AF', fontSize: '15px' }}>
                    <Store size={18} color="#2563EB" /> 1. Store Dashboard Login (/login)
                  </div>
                  <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>POS Portal</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Dashboard Email</label>
                  <input
                    type="email"
                    required
                    value={credentials.dashboardEmail}
                    onChange={(e) => setCredentials({ ...credentials, dashboardEmail: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>6-Digit Unique Store ID</label>
                    <button
                      type="button"
                      onClick={() => setCredentials({ ...credentials, dashboardUniqueId: generateUnique6DigitId() })}
                      style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={credentials.dashboardUniqueId}
                    onChange={(e) => setCredentials({ ...credentials, dashboardUniqueId: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #3B82F6', background: '#EFF6FF', fontSize: '15px', fontWeight: 900, color: '#1E3A8A', letterSpacing: '2px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Dashboard Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassMap.store ? 'text' : 'password'}
                      required
                      value={credentials.dashboardPass}
                      onChange={(e) => setCredentials({ ...credentials, dashboardPass: e.target.value })}
                      style={{ width: '100%', padding: '10px 36px 10px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassMap({ ...showPassMap, store: !showPassMap.store })}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                    >
                      {showPassMap.store ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#475569', background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                   Store User can log in at <Link to="/login" target="_blank" style={{ color: '#2563EB', fontWeight: 800 }}>/login</Link> using either email <b>{credentials.dashboardEmail}</b> OR 6-Digit Unique ID <b style={{ color: '#1E40AF' }}>{credentials.dashboardUniqueId}</b> with password <b>{credentials.dashboardPass}</b>!
                </div>
              </div>

              {/* CARD B: KITCHEN DISPLAY (KDS) CREDENTIALS */}
              <div style={{ background: '#F8FAFC', borderRadius: '18px', border: '1.5px solid #FDE68A', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #FEF3C7', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: '#D97706', fontSize: '15px' }}>
                    <ChefHat size={18} color="#D97706" /> 2. Kitchen Display System (/kds)
                  </div>
                  <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>Kitchen Staff</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Kitchen Email</label>
                  <input
                    type="email"
                    required
                    value={credentials.kitchenEmail}
                    onChange={(e) => setCredentials({ ...credentials, kitchenEmail: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>6-Digit Unique Kitchen ID</label>
                    <button
                      type="button"
                      onClick={() => setCredentials({ ...credentials, kitchenUniqueId: generateUnique6DigitId() })}
                      style={{ background: 'none', border: 'none', color: '#D97706', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={credentials.kitchenUniqueId}
                    onChange={(e) => setCredentials({ ...credentials, kitchenUniqueId: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #F59E0B', background: '#FFFBEB', fontSize: '15px', fontWeight: 900, color: '#78350F', letterSpacing: '2px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Kitchen Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassMap.kitchen ? 'text' : 'password'}
                      required
                      value={credentials.kitchenPass}
                      onChange={(e) => setCredentials({ ...credentials, kitchenPass: e.target.value })}
                      style={{ width: '100%', padding: '10px 36px 10px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassMap({ ...showPassMap, kitchen: !showPassMap.kitchen })}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                    >
                      {showPassMap.kitchen ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#475569', background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                   Kitchen Staff can log in at <Link to="/kds" target="_blank" style={{ color: '#D97706', fontWeight: 800 }}>/kds</Link> using email <b>{credentials.kitchenEmail}</b> OR 6-Digit Unique ID <b style={{ color: '#92400E' }}>{credentials.kitchenUniqueId}</b> with password <b>{credentials.kitchenPass}</b>!
                </div>
              </div>

              {/* CARD C: ADMIN / PARTNER MASTER CREDENTIALS */}
              <div style={{ background: '#F8FAFC', borderRadius: '18px', border: '1.5px solid #A7F3D0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D1FAE5', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, color: '#047857', fontSize: '15px' }}>
                    <Building2 size={18} color="#059669" /> 3. Admin / Partner Master Access
                  </div>
                  <span style={{ fontSize: '11px', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>SuperAdmin</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Admin Master Email</label>
                  <input
                    type="email"
                    required
                    value={credentials.partnerEmail}
                    onChange={(e) => setCredentials({ ...credentials, partnerEmail: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Admin 6-Digit Unique ID</label>
                    <button
                      type="button"
                      onClick={() => setCredentials({ ...credentials, partnerUniqueId: generateUnique6DigitId() })}
                      style={{ background: 'none', border: 'none', color: '#059669', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} /> Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={credentials.partnerUniqueId}
                    onChange={(e) => setCredentials({ ...credentials, partnerUniqueId: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #10B981', background: '#ECFDF5', fontSize: '15px', fontWeight: 900, color: '#064E3B', letterSpacing: '2px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Admin Master Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassMap.admin ? 'text' : 'password'}
                      required
                      value={credentials.partnerPass}
                      onChange={(e) => setCredentials({ ...credentials, partnerPass: e.target.value })}
                      style={{ width: '100%', padding: '10px 36px 10px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassMap({ ...showPassMap, admin: !showPassMap.admin })}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                    >
                      {showPassMap.admin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#475569', background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                   Admin logs in at <Link to="/partner-login" target="_blank" style={{ color: '#059669', fontWeight: 800 }}>/partner-login</Link> using email <b>{credentials.partnerEmail}</b> OR ID <b style={{ color: '#064E3B' }}>{credentials.partnerUniqueId}</b>!
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                style={{ background: '#10B981', color: '#FFFFFF', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
              >
                <Save size={18} /> Save All Portal Credentials
              </button>
            </div>

          </form>
        </div>

        {/* SECTION 3: LIVE RECENT STORE ORDERS MONITOR */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={22} color="#6366F1" />
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>Live Store Orders Stream</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Real-time order audit log across stores</span>
              </div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, background: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '12px' }}>
              Showing {periodOrdersList.length} of {orders.length} Orders ({getFilterLabel()})
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Order ID</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Type / Table</th>
                  <th style={{ padding: '12px 16px' }}>Total Amount</th>
                  <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(periodOrdersList.length > 0 ? periodOrdersList : orders).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                      {loadingOrders ? 'Loading live orders stream...' : 'No store orders recorded for this filter period.'}
                    </td>
                  </tr>
                ) : (
                  (periodOrdersList.length > 0 ? periodOrdersList : orders).slice(0, 15).map((o, idx) => (
                    <tr key={o._id || o.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>#{o.orderId || o.id || 'FP-100' + idx}</td>
                      <td style={{ padding: '12px 16px' }}>{o.customerName || o.customerPhone || 'Walk-in Diner'}</td>
                      <td style={{ padding: '12px 16px' }}>{o.orderType || 'Dine-In'} {o.tableNo ? `(T-${o.tableNo})` : ''}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#10B981' }}>₹{o.total || 0}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: o.paymentMode === 'online' ? '#DCFCE7' : '#FEF3C7', color: o.paymentMode === 'online' ? '#166534' : '#92400E' }}>
                          {o.paymentMode === 'online' ? 'Online UPI' : 'Cash / Counter'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: '#F1F5F9', color: '#334155' }}>
                          {o.status || 'Placed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

    </div>
  );
}
