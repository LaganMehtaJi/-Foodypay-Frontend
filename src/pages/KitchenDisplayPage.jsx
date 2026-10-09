import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle2,
  Flame,
  Utensils,
  Plus,
  RefreshCw,
  ArrowLeft,
  X,
  AlertCircle,
  ShoppingBag,
  Check,
  Play,
  RotateCcw
} from 'lucide-react';
import { playFoodPreparing, playFoodReady, startKitchenAlarm, stopKitchenAlarm } from '../utils/soundEffects';
import { fetchOrdersApi, fetchPublicOrdersApi, updateOrderStatusApi, markKitchenSeenApi } from '../utils/api';
import { validateKitchenLogin, getPartnerCredentials } from '../utils/partnerAuth';

export default function KitchenDisplayPage({ onShowToast }) {
  const { restaurantSlug, merchantId } = useParams();

  const formatSlug = (str) => {
    if (!str) return 'Kitchen Display System';
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const storeName = formatSlug(restaurantSlug);
  const effectiveMerchantId = merchantId || 'FP-397310';

  // State
  const [orders, setOrders] = useState([]);
  const [kitchenTabFilter, setKitchenTabFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [currentTime, setCurrentTime] = useState('');
  const [isCounterOrderModalOpen, setIsCounterOrderModalOpen] = useState(false);
  const [actionLoadingSet, setActionLoadingSet] = useState(new Set());

  // Kitchen KDS Login Authentication State
  const [isKitchenAuth, setIsKitchenAuth] = useState(() => {
    try {
      return localStorage.getItem('foodypay_kitchen_logged_in') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [kInput, setKInput] = useState(() => merchantId || 'FP-348330');
  const [kPass, setKPass] = useState('');
  const [kError, setKError] = useState('');

  useEffect(() => {
    if (merchantId) setKInput(merchantId);
  }, [merchantId]);

  const handleKitchenLoginSubmit = (e) => {
    e.preventDefault();
    setKError('');
    const cleanIn = (kInput || effectiveMerchantId || 'FP-348330').trim();
    const cleanPa = kPass.trim();

    if (!cleanPa) {
      setKError('Please enter Kitchen Password.');
      return;
    }

    const res = validateKitchenLogin(cleanIn, cleanPa, effectiveMerchantId);
    const isSnackRackPass = cleanPa === 'SnackRack400' || cleanPa.toLowerCase() === 'snackrack400';
    if ((res && res.valid) || isSnackRackPass) {
      localStorage.setItem('foodypay_kitchen_logged_in', 'true');
      localStorage.setItem('foodypay_kitchen_role', (res && res.role) || 'Kitchen Chef');
      setIsKitchenAuth(true);
      if (onShowToast) onShowToast(`Kitchen KDS Authenticated for Store ${effectiveMerchantId}!`);
    } else {
      setKError('Invalid Kitchen Password. Use password SnackRack400 or store password.');
    }
  };

  // KDS Enabled toggle setting check
  const [isKdsEnabled, setIsKdsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_kds_enabled');
      return saved === null ? true : JSON.parse(saved);
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    const checkKds = () => {
      try {
        const saved = localStorage.getItem('foodypay_kds_enabled');
        if (saved !== null) setIsKdsEnabled(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', checkKds);
    return () => window.removeEventListener('storage', checkKds);
  }, []);

  // Per-item cooking status map: { `${orderId}_${itemIdx}`: 'idle' | 'cooking' | 'done' }
  const [itemCookingState, setItemCookingState] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_kitchen_items_cooking');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Continuous KDS Bell Alarm Controller
  useEffect(() => {
    const rawKdsSeen = (() => {
      try {
        const raw = localStorage.getItem('foodypay_kds_seen_orders');
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch (e) {
        return new Set();
      }
    })();

    const hasUnseenKitchen = (orders || []).some((o) => {
      if (!o) return false;
      const oId = String(o._id || o.id || o.orderId);
      const isUnseen = !o.kitchenSeen && !rawKdsSeen.has(oId);
      const isPendingKitchen = Boolean(o.sentToKitchen || o.status === 'preparing');
      return isPendingKitchen && isUnseen;
    });

    if (hasUnseenKitchen) {
      startKitchenAlarm();
    } else {
      stopKitchenAlarm();
    }

    return () => {
      stopKitchenAlarm();
    };
  }, [orders]);

  // Counter POS Quick Order Form
  const [counterForm, setCounterForm] = useState({
    table: 'Table 1',
    customer: 'Walk-in Diner',
    items: 'Paneer Butter Masala x1, Garlic Naan x2',
    note: 'Serve HOT',
  });

  // Load orders from Live Server API for THIS specific merchant (NO SAMPLE FALLBACKS)
  const loadOrders = async () => {
    const token = localStorage.getItem('foodypay_token');
    if (token) {
      try {
        const fetched = await fetchOrdersApi(token);
        const fetchedList = fetched.orders || (Array.isArray(fetched) ? fetched : []);
        if (Array.isArray(fetchedList) && fetchedList.length > 0) {
          setOrders(fetchedList);
          return;
        }
      } catch (e) {}
    }

    try {
      const fetchedPublic = await fetchPublicOrdersApi(merchantId, effectiveMerchantId);
      if (Array.isArray(fetchedPublic) && fetchedPublic.length > 0) {
        setOrders(fetchedPublic);
        return;
      }
    } catch (e) {}

    // Fallback to local storage (only real customer created orders)
    try {
      const saved = localStorage.getItem('foodypay_crm_orders_v3');
      if (saved) {
        setOrders(JSON.parse(saved));
      } else {
        setOrders([]);
      }
    } catch (e) {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
    const pollInterval = setInterval(loadOrders, 4000);

    const handleStorage = (e) => {
      if (!e || e.key === 'foodypay_crm_orders_v3') {
        loadOrders();
      }
    };

    let bc = null;
    try {
      bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.onmessage = (msg) => {
        if (msg && msg.data) {
          loadOrders();
        }
      };
    } catch (e) {}

    window.addEventListener('storage', handleStorage);
    window.addEventListener('foodypay_order_created', loadOrders);

    return () => {
      clearInterval(pollInterval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('foodypay_order_created', loadOrders);
    };
  }, []);

  // Live Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save per-item cooking status map
  const toggleItemCooking = (orderId, itemIdx) => {
    const key = `${orderId}_${itemIdx}`;
    setItemCookingState((prev) => {
      const current = prev[key] || 'idle';
      const next = current === 'idle' ? 'cooking' : current === 'cooking' ? 'done' : 'idle';
      const updated = { ...prev, [key]: next };
      try {
        localStorage.setItem('foodypay_kitchen_items_cooking', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      playFoodPreparing();
    } catch (e) {}
  };

  // Order Status Updates with Debouncing & Non-Interactability state during API calls
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId) return;
    const oIdStr = String(orderId);
    if (actionLoadingSet.has(oIdStr)) return; // Prevent double/triple rapid clicks

    stopKitchenAlarm();

    try {
      const raw = localStorage.getItem('foodypay_kds_seen_orders');
      const seenSet = raw ? new Set(JSON.parse(raw)) : new Set();
      seenSet.add(oIdStr);
      localStorage.setItem('foodypay_kds_seen_orders', JSON.stringify(Array.from(seenSet)));

      const rawDash = localStorage.getItem('foodypay_seen_order_ids');
      const dashSet = rawDash ? new Set(JSON.parse(rawDash)) : new Set();
      dashSet.add(oIdStr);
      localStorage.setItem('foodypay_seen_order_ids', JSON.stringify(Array.from(dashSet)));
    } catch (e) {}

    setActionLoadingSet((prev) => new Set(prev).add(oIdStr));

    try {
      const updated = orders.map((o) => {
        const currentId = o._id || o.id || o.orderId;
        if (currentId === orderId || String(currentId) === oIdStr) {
          return {
            ...o,
            status: newStatus,
            seen: true,
            kitchenSeen: true,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      });

      setOrders(updated);
      try {
        localStorage.setItem('foodypay_crm_orders_v3', JSON.stringify(updated));
        window.dispatchEvent(new Event('foodypay_order_created'));
        window.dispatchEvent(new Event('storage'));
        const bc = new BroadcastChannel('foodypay_live_orders_channel');
        bc.postMessage({ type: 'ORDER_UPDATED', orderId, newStatus, orders: updated });
        bc.close();
      } catch (e) {}

      if (newStatus === 'preparing') {
        try {
          playFoodPreparing();
        } catch (e) {}
        if (onShowToast) onShowToast(`Chef started cooking Order ${orderId}!`);
      } else if (newStatus === 'ready') {
        try {
          playFoodReady();
        } catch (e) {}
        if (onShowToast) onShowToast(`Order ${orderId} marked Ready to Serve!`);
      } else if (newStatus === 'completed') {
        try {
          playFoodReady();
        } catch (e) {}
        if (onShowToast) onShowToast(`Order ${orderId} marked Completed & Served!`);
      }

      const token = localStorage.getItem('foodypay_token');
      const targetObj = orders.find((o) => (o._id || o.id || o.orderId) === orderId || String(o._id || o.id || o.orderId) === oIdStr);
      const targetId = (targetObj && targetObj._id) || orderId;
      await updateOrderStatusApi(token, targetId, newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoadingSet((prev) => {
        const next = new Set(prev);
        next.delete(oIdStr);
        return next;
      });
    }
  };

  // Mark Kitchen Order Seen (Stops Alarm Bell for Kitchen Staff & syncs DB)
  const handleMarkKitchenSeen = async (orderId) => {
    stopKitchenAlarm();
    if (!orderId) return;
    const oIdStr = String(orderId);
    try {
      const raw = localStorage.getItem('foodypay_kds_seen_orders');
      const seenSet = raw ? new Set(JSON.parse(raw)) : new Set();
      seenSet.add(oIdStr);
      localStorage.setItem('foodypay_kds_seen_orders', JSON.stringify(Array.from(seenSet)));
    } catch (e) {}

    setOrders((prev) =>
      prev.map((o) => {
        const idStr = String(o._id || o.id || o.orderId);
        if (idStr === oIdStr || String(o._id) === oIdStr || String(o.id) === oIdStr || String(o.orderId) === oIdStr) {
          return { ...o, kitchenSeen: true };
        }
        return o;
      })
    );

    try {
      const token = localStorage.getItem('foodypay_token');
      const targetObj = orders.find((o) => (o._id || o.id || o.orderId) === orderId || String(o._id || o.id || o.orderId) === oIdStr);
      const targetId = (targetObj && targetObj._id) || orderId;
      await markKitchenSeenApi(token, targetId);
    } catch (e) {
      console.error('Failed to mark kitchen order seen on server:', e);
    }
  };

  // Add Counter POS Order directly to kitchen
  const handleAddCounterOrder = (e) => {
    e.preventDefault();
    const newId = `#FP-${Math.floor(1000 + Math.random() * 9000)}`;

    const itemEntries = counterForm.items.split(',').map((str, idx) => {
      const parts = str.trim().split('x');
      const name = parts[0]?.trim() || `Item ${idx + 1}`;
      const qty = parseInt(parts[1] || '1', 10) || 1;
      return { name, qty, price: 150 };
    });

    const newOrderObj = {
      _id: `ord_${Date.now()}`,
      id: newId,
      table: counterForm.table || 'Counter POS',
      customer: counterForm.customer || 'Walk-in Diner',
      items: itemEntries,
      note: counterForm.note.trim(),
      status: 'preparing',
      seen: true,
      kitchenSeen: true,
      time: 'Just now',
      timestamp: Date.now(),
      paymentStatus: 'cash',
      paymentLabel: 'Cash on Counter',
      total: itemEntries.reduce((s, i) => s + i.price * i.qty, 0),
    };

    const updated = [newOrderObj, ...orders];
    setOrders(updated);
    try {
      localStorage.setItem('foodypay_crm_orders_v3', JSON.stringify(updated));
      window.dispatchEvent(new Event('foodypay_order_created'));
    } catch (e) {}

    setIsCounterOrderModalOpen(false);
    if (onShowToast) onShowToast(`Created Counter Order ${newId}!`);
  };

  // Active Kitchen Queue Filters:
  // Active queue: sentToKitchen === true or status is active ('new' | 'preparing' | 'ready')
  // Completed history: status === 'completed' or status === 'cancelled'
  const activeOrders = (orders || []).filter((o) => o && (o.sentToKitchen || o.status === 'preparing' || o.status === 'new' || o.status === 'ready') && o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = (orders || []).filter((o) => o && (o.status === 'completed' || o.status === 'cancelled'));

  const displayedOrders =
    kitchenTabFilter === 'active'
      ? activeOrders
      : kitchenTabFilter === 'completed'
      ? completedOrders
      : (orders || []).filter((o) => o && (o.sentToKitchen || o.status === 'preparing' || o.status === 'ready' || o.status === 'completed'));

  if (!isKitchenAuth) {
    const creds = getPartnerCredentials();
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1E293B',
          padding: '36px 32px',
          borderRadius: '24px',
          border: '1.5px solid #334155',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,94,20,0.4)' }}>
              <ChefHat size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF' }}>Kitchen KDS Staff Login</h2>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>{storeName}</span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '20px', lineHeight: '1.4' }}>
            Store ID <b>{effectiveMerchantId}</b> is pre-filled. Enter Kitchen Password (e.g. <b>SnackRack400</b>) to access live kitchen orders.
          </p>

          {kError && (
            <div style={{ background: '#451A1A', border: '1px solid #7F1D1D', color: '#FCA5A5', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#EF4444" />
              <span>{kError}</span>
            </div>
          )}

          <form onSubmit={handleKitchenLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#E2E8F0', marginBottom: '4px' }}>
                Store FoodyPay ID / Kitchen ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FP-348330"
                value={kInput}
                onChange={(e) => setKInput(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: '#60A5FA', fontWeight: 700, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#E2E8F0', marginBottom: '4px' }}>
                Kitchen Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter password (e.g. SnackRack400)"
                value={kPass}
                onChange={(e) => setKPass(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: '#0F172A', border: '1px solid #334155', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              className="active-scale"
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
                color: '#FFF',
                fontWeight: 900,
                fontSize: '14.5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(255,94,20,0.3)'
              }}
            >
              Enter Kitchen Display System
            </button>
          </form>

          <div style={{ marginTop: '20px', background: '#0F172A', padding: '10px 12px', borderRadius: '10px', border: '1px dashed #334155', fontSize: '11.5px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><b>Store Kitchen Pass:</b> <code style={{ color: '#F59E0B' }}>SnackRack400</code></div>
            <button
              type="button"
              onClick={() => {
                setKInput(effectiveMerchantId || 'FP-348330');
                setKPass('SnackRack400');
              }}
              style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '11px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Auto-fill Password
            </button>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'none' }}>
              Back to Store Dashboard Login ↗
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isKdsEnabled) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#1E293B',
          padding: '36px 28px',
          borderRadius: '24px',
          border: '1.5px solid #334155',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEF2F2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <ChefHat size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px', color: '#FFF' }}>
            Kitchen Display System is OFF
          </h2>
          <p style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.6, marginBottom: '24px' }}>
            The Kitchen Display System (KDS) for <b>{storeName}</b> is currently turned <b>OFF</b> in Restaurant Settings.
          </p>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#FF5E14',
              color: '#FFF',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '14px',
              width: '100%'
            }}
          >
            <ArrowLeft size={16} /> Open Dashboard Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F172A', color: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* KDS Top Header */}
      <header style={{ backgroundColor: '#1E293B', borderBottom: '1px solid #334155', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/dashboard" style={{ color: '#94A3B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
              <ArrowLeft size={16} /> Exit KDS
            </Link>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#334155' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ backgroundColor: '#FF5E14', color: '#FFF', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                <ChefHat size={20} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#F8FAFC' }}>
                  Kitchen Display System (KDS)
                </h1>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 400 }}>
                  {storeName} • Merchant: {effectiveMerchantId}
                </div>
              </div>
            </div>
          </div>

          {/* Center Tabs: Active Queue vs History */}
          <div style={{ display: 'flex', backgroundColor: '#0F172A', padding: '3px', borderRadius: '10px', border: '1px solid #334155' }}>
            <button
              onClick={() => setKitchenTabFilter('active')}
              style={{
                border: 'none',
                backgroundColor: kitchenTabFilter === 'active' ? '#FF5E14' : 'transparent',
                color: kitchenTabFilter === 'active' ? '#FFF' : '#94A3B8',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
               Active Queue ({activeOrders.length})
            </button>
            <button
              onClick={() => setKitchenTabFilter('completed')}
              style={{
                border: 'none',
                backgroundColor: kitchenTabFilter === 'completed' ? '#10B981' : 'transparent',
                color: kitchenTabFilter === 'completed' ? '#FFF' : '#94A3B8',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
               Ready / Served ({completedOrders.length})
            </button>
            <button
              onClick={() => setKitchenTabFilter('all')}
              style={{
                border: 'none',
                backgroundColor: kitchenTabFilter === 'all' ? '#334155' : 'transparent',
                color: kitchenTabFilter === 'all' ? '#FFF' : '#94A3B8',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              All Orders ({orders.length})
            </button>
          </div>

          {/* Right Clock & Add Ticket Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#CBD5E1', fontSize: '13px', fontWeight: 500 }}>
              <Clock size={16} color="#FF5E14" />
              <span>{currentTime}</span>
            </div>

            <button
              onClick={() => setIsCounterOrderModalOpen(true)}
              style={{
                backgroundColor: '#334155',
                color: '#F8FAFC',
                border: '1px solid #475569',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} /> Add Counter Ticket
            </button>
          </div>

        </div>
      </header>

      {/* Main KDS Workspace */}
      <main style={{ padding: '20px' }}>
        
        {displayedOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
            <ChefHat size={48} color="#475569" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 500, color: '#94A3B8' }}>
              {kitchenTabFilter === 'active' ? 'No Active Kitchen Orders' : 'No Completed Orders in History'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 400 }}>
              {kitchenTabFilter === 'active' ? 'Orders sent to kitchen will appear here automatically.' : 'Completed orders will be saved here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {displayedOrders.map((order) => {
              const orderIdStr = String(order._id || order.id || order.orderId);
              const isReady = order.status === 'ready' || order.status === 'completed';
              const isPreparing = order.status === 'preparing';

              const rawKdsSeen = (() => {
                try {
                  const raw = localStorage.getItem('foodypay_kds_seen_orders');
                  return raw ? new Set(JSON.parse(raw)) : new Set();
                } catch (e) {
                  return new Set();
                }
              })();

              const isKitchenSeen = Boolean(
                order.kitchenSeen ||
                rawKdsSeen.has(orderIdStr) ||
                (order._id && rawKdsSeen.has(String(order._id))) ||
                (order.id && rawKdsSeen.has(String(order.id)))
              );

              return (
                <div
                  key={orderIdStr}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '16px',
                    border: isReady ? '1px solid #10B981' : isPreparing ? '1.5px solid #FF5E14' : !isKitchenSeen ? '2px solid #2563EB' : '1px solid #334155',
                    boxShadow: !isKitchenSeen ? '0 0 16px rgba(37,99,235,0.4)' : '0 4px 14px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                  }}
                >
                  {/* Order Card Header */}
                  <div style={{
                    backgroundColor: isReady ? 'rgba(16,185,129,0.15)' : isPreparing ? 'rgba(255,94,20,0.15)' : !isKitchenSeen ? 'rgba(37,99,235,0.15)' : '#0F172A',
                    padding: '12px 14px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 600, color: '#F8FAFC' }}>
                          {order.id || order.orderId}
                        </span>
                        <span style={{ fontSize: '11px', backgroundColor: '#FFEDD5', color: '#C2410C', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
                           {order.table || 'Table'}
                        </span>
                        {(order.paymentStatus === 'paid-razorpay' || order.paymentStatus === 'paid-upi' || order.paymentStatus === 'paid-cash' || order.paymentStatus === 'paid' || (order.paymentLabel && order.paymentLabel.toLowerCase().includes('paid')) || order.status === 'completed') && (
                          <span style={{ fontSize: '10.5px', backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                             PAID
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', fontWeight: 400 }}>
                        Customer: <strong style={{ color: '#E2E8F0', fontWeight: 500 }}>{order.customer || 'Diner'}</strong> • {order.time || 'Today'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleMarkKitchenSeen(orderIdStr)}
                        disabled={isKitchenSeen}
                        style={{
                          backgroundColor: isKitchenSeen ? '#334155' : '#2563EB',
                          color: '#FFF',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: isKitchenSeen ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: isKitchenSeen ? 'none' : '0 0 10px rgba(37,99,235,0.6)'
                        }}
                        title={isKitchenSeen ? "Bell alarm stopped" : "Stop Kitchen Bell Alarm & Acknowledge Order"}
                      >
                        {isKitchenSeen ? (
                          <>
                            <Check size={13} />
                            <span>SEEN (BELL STOPPED)</span>
                          </>
                        ) : (
                          <>
                            <Bell size={13} style={{ animation: 'foodypay-spin 1.2s ease infinite' }} />
                            <span>SEEN (STOP BELL)</span>
                          </>
                        )}
                      </button>

                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: isReady ? '#10B981' : isPreparing ? '#FF5E14' : '#334155',
                        color: '#FFF'
                      }}>
                        {isReady ? ' READY' : isPreparing ? ' COOKING' : '⏳ NEW'}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List with Per-Item Start Cooking Status */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Items to Prepare:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.items?.map((item, itemIdx) => {
                        const itemKey = `${orderIdStr}_${itemIdx}`;
                        const cookingStatus = itemCookingState[itemKey] || 'idle';

                        return (
                          <div
                            key={itemIdx}
                            style={{
                              backgroundColor: cookingStatus === 'done' ? 'rgba(16,185,129,0.1)' : cookingStatus === 'cooking' ? 'rgba(255,94,20,0.1)' : '#0F172A',
                              border: cookingStatus === 'done' ? '1px solid #10B981' : cookingStatus === 'cooking' ? '1px solid #FF5E14' : '1px solid #334155',
                              borderRadius: '10px',
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#FF5E14' }}>
                                {item.qty}x
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: cookingStatus === 'done' ? '#94A3B8' : '#F8FAFC', textDecoration: cookingStatus === 'done' ? 'line-through' : 'none' }}>
                                {item.name}
                              </span>
                            </div>

                            <button
                              onClick={() => toggleItemCooking(orderIdStr, itemIdx)}
                              style={{
                                border: 'none',
                                backgroundColor: cookingStatus === 'done' ? '#10B981' : cookingStatus === 'cooking' ? '#FF5E14' : '#334155',
                                color: '#FFF',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {cookingStatus === 'done' ? (
                                <> Done</>
                              ) : cookingStatus === 'cooking' ? (
                                <> Cooking...</>
                              ) : (
                                <><Play size={10} /> Start Cooking</>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {order.note && (
                      <div style={{ backgroundColor: '#334155', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', color: '#FCD34D', fontWeight: 400, marginTop: '4px' }}>
                         Note: {order.note}
                      </div>
                    )}
                  </div>

                  {/* Order Card Footer Action */}
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #334155', backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                      Payment: <strong style={{ color: '#CBD5E1', fontWeight: 500 }}>{order.paymentLabel || 'Cash'}</strong>
                    </span>

                    {order.status === 'new' || (!isPreparing && !isReady && order.status !== 'completed') ? (
                      <button
                        onClick={() => updateOrderStatus(orderIdStr, 'preparing')}
                        disabled={actionLoadingSet.has(orderIdStr)}
                        style={{
                          backgroundColor: '#FF5E14',
                          color: '#FFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          cursor: actionLoadingSet.has(orderIdStr) ? 'not-allowed' : 'pointer',
                          opacity: actionLoadingSet.has(orderIdStr) ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {actionLoadingSet.has(orderIdStr) ? (
                          <>
                            <RefreshCw size={14} style={{ animation: 'foodypay-spin 0.8s linear infinite' }} />
                            <span>Starting...</span>
                          </>
                        ) : (
                          <>
                            <Flame size={15} />
                            <span>Accept & Start Cooking</span>
                          </>
                        )}
                      </button>
                    ) : isPreparing ? (
                      <button
                        onClick={() => updateOrderStatus(orderIdStr, 'ready')}
                        disabled={actionLoadingSet.has(orderIdStr)}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#FFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          cursor: actionLoadingSet.has(orderIdStr) ? 'not-allowed' : 'pointer',
                          opacity: actionLoadingSet.has(orderIdStr) ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {actionLoadingSet.has(orderIdStr) ? (
                          <>
                            <RefreshCw size={14} style={{ animation: 'foodypay-spin 0.8s linear infinite' }} />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            <span>Mark Ready to Serve</span>
                          </>
                        )}
                      </button>
                    ) : order.status === 'ready' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => updateOrderStatus(orderIdStr, 'completed')}
                          disabled={actionLoadingSet.has(orderIdStr)}
                          style={{
                            backgroundColor: '#059669',
                            color: '#FFF',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: actionLoadingSet.has(orderIdStr) ? 'not-allowed' : 'pointer',
                            opacity: actionLoadingSet.has(orderIdStr) ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {actionLoadingSet.has(orderIdStr) ? (
                            <>
                              <RefreshCw size={14} style={{ animation: 'foodypay-spin 0.8s linear infinite' }} />
                              <span>Ending...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Complete & End Order</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => updateOrderStatus(orderIdStr, 'preparing')}
                          disabled={actionLoadingSet.has(orderIdStr)}
                          style={{
                            backgroundColor: '#334155',
                            color: '#94A3B8',
                            border: '1px solid #475569',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            fontWeight: 500,
                            fontSize: '11px',
                            cursor: actionLoadingSet.has(orderIdStr) ? 'not-allowed' : 'pointer',
                            opacity: actionLoadingSet.has(orderIdStr) ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Move Back to Active Cooking"
                        >
                          {actionLoadingSet.has(orderIdStr) ? (
                            <RefreshCw size={12} style={{ animation: 'foodypay-spin 0.8s linear infinite' }} />
                          ) : (
                            <RotateCcw size={12} />
                          )}
                          <span>Back</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={true}
                        style={{
                          backgroundColor: '#1E293B',
                          color: '#10B981',
                          border: '1px solid #10B981',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Completed / Served</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Quick Add Counter POS Order Modal */}
      {isCounterOrderModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15,23,42,0.8)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#1E293B',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            padding: '20px',
            border: '1px solid #334155',
            color: '#F8FAFC'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>Create Counter Kitchen Ticket</h3>
              <button onClick={() => setIsCounterOrderModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCounterOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Table / Order Type</label>
                <input
                  type="text"
                  value={counterForm.table}
                  onChange={(e) => setCounterForm({ ...counterForm, table: e.target.value })}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Customer Name</label>
                <input
                  type="text"
                  value={counterForm.customer}
                  onChange={(e) => setCounterForm({ ...counterForm, customer: e.target.value })}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Items (format: Dish xQty, Dish xQty)</label>
                <input
                  type="text"
                  required
                  value={counterForm.items}
                  onChange={(e) => setCounterForm({ ...counterForm, items: e.target.value })}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Chef Instruction Note</label>
                <input
                  type="text"
                  value={counterForm.note}
                  onChange={(e) => setCounterForm({ ...counterForm, note: e.target.value })}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
              >
                Send Ticket to Kitchen Display
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
