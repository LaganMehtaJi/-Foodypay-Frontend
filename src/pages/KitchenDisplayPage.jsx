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
  RotateCcw,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Lock
} from 'lucide-react';
import { playFoodPreparing, playFoodReady, startKitchenAlarm, stopKitchenAlarm, sortOrdersNewestFirst } from '../utils/soundEffects';
import { fetchOrdersApi, fetchPublicOrdersApi, updateOrderStatusApi, markKitchenSeenApi } from '../utils/api';
import { subscribeToOrders } from '../utils/firestoreService';
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
  const effectiveMerchantId =
    merchantId ||
    localStorage.getItem('foodypay_active_business_id') ||
    (() => {
      try {
        const u = localStorage.getItem('foodypay_user');
        if (u) return JSON.parse(u).foodypayId || JSON.parse(u).uniqueId;
      } catch (e) {}
      return 'FP-348330';
    })() ||
    'FP-348330';

  // State
  const [orders, setOrders] = useState([]);
  const [kitchenTabFilter, setKitchenTabFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [currentTime, setCurrentTime] = useState('');
  const [isCounterOrderModalOpen, setIsCounterOrderModalOpen] = useState(false);
  const [actionLoadingSet, setActionLoadingSet] = useState(new Set());
  const [showAdminSyncBanner, setShowAdminSyncBanner] = useState(false);

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
          setOrders(sortOrdersNewestFirst(fetchedList));
          return;
        }
      } catch (e) {}
    }

    try {
      const fetchedPublic = await fetchPublicOrdersApi(merchantId, effectiveMerchantId);
      if (Array.isArray(fetchedPublic) && fetchedPublic.length > 0) {
        setOrders(sortOrdersNewestFirst(fetchedPublic));
        return;
      }
    } catch (e) {}

    // Fallback to local storage (only real customer created orders)
    try {
      const saved = localStorage.getItem('foodypay_crm_orders_v3');
      if (saved) {
        setOrders(sortOrdersNewestFirst(JSON.parse(saved)));
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

    // Live real-time Firestore sync for Kitchen KDS
    let unsubscribeFs = () => {};
    try {
      unsubscribeFs = subscribeToOrders(effectiveMerchantId || merchantId, (liveOrders) => {
        if (Array.isArray(liveOrders) && liveOrders.length > 0) {
          setOrders(sortOrdersNewestFirst(liveOrders));
        }
      });
    } catch (e) {}

    const handleStorage = (e) => {
      if (!e || e.key === 'foodypay_crm_orders_v3') {
        loadOrders();
      }
    };

    const handleAdminSync = () => {
      setShowAdminSyncBanner(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    let bc = null;
    try {
      bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.onmessage = (msg) => {
        if (msg && msg.data) {
          if (msg.data.type === 'ADMIN_SETTINGS_UPDATED') {
            handleAdminSync();
            return;
          }
          loadOrders();
        }
      };
    } catch (e) {}

    window.addEventListener('storage', handleStorage);
    window.addEventListener('foodypay_order_created', loadOrders);
    window.addEventListener('foodypay_admin_settings_updated', handleAdminSync);

    return () => {
      if (typeof unsubscribeFs === 'function') unsubscribeFs();
      clearInterval(pollInterval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('foodypay_order_created', loadOrders);
      window.removeEventListener('foodypay_admin_settings_updated', handleAdminSync);
    };
  }, [effectiveMerchantId, merchantId]);

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

  const activeOrders = sortOrdersNewestFirst(
    (orders || []).filter((o) => o && (o.sentToKitchen || o.status === 'preparing' || o.status === 'ready') && o.status !== 'completed' && o.status !== 'cancelled')
  );
  const completedOrders = sortOrdersNewestFirst(
    (orders || []).filter((o) => o && (o.status === 'completed' || o.status === 'cancelled'))
  );

  const displayedOrders = sortOrdersNewestFirst(
    kitchenTabFilter === 'active'
      ? activeOrders
      : kitchenTabFilter === 'completed'
      ? completedOrders
      : (orders || []).filter((o) => o && (o.sentToKitchen || o.status === 'preparing' || o.status === 'ready' || o.status === 'completed'))
  );

  if (!isKitchenAuth) {
    const creds = getPartnerCredentials();
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* TOP HEADER MATCHING LOGIN PAGE */}
        <header className="auth-header">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '34px', objectFit: 'contain' }} />
            <div>
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>FoodyPay</span>
              <span style={{ fontSize: '10.5px', color: '#FF5E14', fontWeight: 800, display: 'block', marginTop: '-3px' }}>Always With You</span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="auth-header-subtext">Store Manager?</span>
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
              Dashboard Login ↗
            </Link>
          </div>
        </header>

        {/* MAIN CONTENT SPLIT CARD MATCHING LOGIN PAGE */}
        <main className="auth-main-container">
          <div className="auth-card-grid">
            {/* LEFT BRANDING PANEL */}
            <div className="auth-left-panel">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 94, 20, 0.15)', color: '#FF5E14', padding: '4px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800, border: '1px solid rgba(255, 94, 20, 0.3)', marginBottom: '16px' }}>
                  <Sparkles size={14} />
                  <span>Smart Kitchen Operating System (KDS)</span>
                </div>

                <h2 style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                  Kitchen Display &amp; Chef Station Controller
                </h2>

                <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: '0 0 20px' }}>
                  Streamline live customer QR table orders, kitchen ticket alarms, dish preparation timers, and counter POS dispatching.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    'Real-Time Order Sync from POS & Table QR',
                    'Continuous Sound Alarm for Incoming Tickets',
                    'Item-Level Preparation & Progress Steppers',
                    'Instant Counter POS Quick Ticket Entry',
                    'Multi-Device Kitchen Display Synchronization',
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
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#F8FAFC' }}>Encrypted Kitchen Pass Authentication</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Active Store KDS Station • FoodyPay Cloud</div>
                </div>
              </div>
            </div>

            {/* RIGHT KDS LOGIN FORM */}
            <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FFF0EB', border: '1.5px solid #FFDCD0', color: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChefHat size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' }}>
                      Kitchen KDS Login
                    </h2>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{storeName}</span>
                  </div>
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Store ID <b>{effectiveMerchantId}</b> is pre-filled. Enter Kitchen Password (e.g. <b>SnackRack400</b>) to access live tickets.
                </p>
              </div>

              {kError && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={16} color="#EF4444" />
                  <div>{kError}</div>
                </div>
              )}

              <form onSubmit={handleKitchenLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Store FoodyPay ID / Kitchen ID
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. FP-348330"
                      value={kInput}
                      onChange={(e) => setKInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        color: '#0F172A',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Kitchen Access Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="password"
                      required
                      autoFocus
                      placeholder="Enter password (e.g. SnackRack400)"
                      value={kPass}
                      onChange={(e) => setKPass(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: '4px',
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FF6B2B 0%, #E84E05 100%)',
                    border: '2px solid #C73E00',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 0 #9E3100, 0 6px 16px rgba(232, 78, 5, 0.28)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Enter Kitchen Display System →
                </button>
              </form>

              <div style={{ marginTop: '18px', backgroundColor: '#FFF0EB', padding: '10px 14px', borderRadius: '10px', border: '1.5px dashed #FFDCD0', fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><b>Store Pass:</b> <code style={{ color: '#E84E05', fontWeight: 800 }}>SnackRack400</code></div>
                <button
                  type="button"
                  onClick={() => {
                    setKInput(effectiveMerchantId || 'FP-348330');
                    setKPass('SnackRack400');
                  }}
                  style={{ background: 'none', border: 'none', color: '#FF5E14', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Auto-fill Password
                </button>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: '12.5px', fontWeight: 700, color: '#64748B', textDecoration: 'none' }}>
                  Back to Store Dashboard Login ↗
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isKdsEnabled) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '36px 32px',
          borderRadius: '20px',
          border: '1.5px solid #E2E8F0',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 12px 35px rgba(15, 23, 42, 0.06)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FFF0EB',
            color: '#FF5E14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1.5px solid #FFDCD0'
          }}>
            <ChefHat size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '10px', color: '#0F172A' }}>
            Kitchen Display System is OFF
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
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
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: '14px',
              width: '100%',
              boxShadow: '0 4px 12px rgba(255,94,20,0.25)'
            }}
          >
            <ArrowLeft size={16} /> Open Dashboard Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Superadmin Settings Update Auto-Refresh Popup Banner */}
      {showAdminSyncBanner && (
        <div style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: '#059669',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: 700,
          fontSize: '14px',
          border: '1px solid #10B981'
        }}>
          <RefreshCw className="animate-spin" size={20} />
          <span>⚡ Superadmin Updated Store Settings & Controls! Auto-refreshing Kitchen KDS in 2s...</span>
        </div>
      )}

      {/* KDS Top Header */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1.5px solid #E2E8F0', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/dashboard" style={{ color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <ArrowLeft size={16} /> Exit KDS
            </Link>
            <div style={{ width: '1px', height: '20px', backgroundColor: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/Logo.png" alt="FoodyPay" style={{ height: '28px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>
                  Kitchen Display System (KDS)
                </h1>
                <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                  {storeName} • Merchant: <strong style={{ color: '#FF5E14' }}>{effectiveMerchantId}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Center Tabs: Active Queue vs History */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setKitchenTabFilter('active')}
              style={{
                border: 'none',
                backgroundColor: kitchenTabFilter === 'active' ? '#FF5E14' : 'transparent',
                color: kitchenTabFilter === 'active' ? '#FFF' : '#64748B',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: kitchenTabFilter === 'active' ? '0 2px 8px rgba(255,94,20,0.3)' : 'none'
              }}
            >
               Active Queue ({activeOrders.length})
            </button>
            <button
              onClick={() => setKitchenTabFilter('completed')}
              style={{
                border: 'none',
                backgroundColor: kitchenTabFilter === 'completed' ? '#10B981' : 'transparent',
                color: kitchenTabFilter === 'completed' ? '#FFF' : '#64748B',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: kitchenTabFilter === 'completed' ? '0 2px 8px rgba(16,185,129,0.3)' : 'none'
              }}
            >
               Ready / Served ({completedOrders.length})
            </button>
            <button
              onClick={() => setKitchenTabFilter('all')}
              style={{
                border: 'none',
                backgroundColor: kitchenTabFilter === 'all' ? '#0F172A' : 'transparent',
                color: kitchenTabFilter === 'all' ? '#FFF' : '#64748B',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              All Orders ({orders.length})
            </button>
          </div>

          {/* Right Clock & Add Ticket Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A', fontSize: '13.5px', fontWeight: 800, backgroundColor: '#F8FAFC', padding: '6px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <Clock size={16} color="#FF5E14" />
              <span>{currentTime}</span>
            </div>

            <button
              onClick={() => setIsCounterOrderModalOpen(true)}
              style={{
                backgroundColor: '#FF5E14',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(255,94,20,0.3)'
              }}
            >
              <Plus size={15} /> Add Counter Ticket
            </button>
          </div>

        </div>
      </header>

      {/* Main KDS Workspace */}
      <main style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        
        {displayedOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '90px 20px', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1.5px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FFF0EB', color: '#FF5E14', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ChefHat size={32} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '19px', fontWeight: 900, color: '#0F172A' }}>
              {kitchenTabFilter === 'active' ? 'No Active Kitchen Orders' : 'No Completed Orders in History'}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: '#64748B' }}>
              {kitchenTabFilter === 'active' ? 'Orders sent to kitchen will appear here automatically with bell sound.' : 'Completed orders will be saved here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
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
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    border: isReady ? '2px solid #10B981' : isPreparing ? '2px solid #FF5E14' : !isKitchenSeen ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                    boxShadow: !isKitchenSeen ? '0 0 20px rgba(37,99,235,0.25)' : '0 8px 25px rgba(15,23,42,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                  }}
                >
                  {/* Order Card Header */}
                  <div style={{
                    backgroundColor: isReady ? '#ECFDF5' : isPreparing ? '#FFF7ED' : !isKitchenSeen ? '#EFF6FF' : '#F8FAFC',
                    padding: '14px 16px',
                    borderBottom: '1.5px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                          {order.id || order.orderId}
                        </span>
                        <span style={{ fontSize: '11.5px', backgroundColor: '#FFEDD5', color: '#C2410C', fontWeight: 800, padding: '3px 9px', borderRadius: '6px' }}>
                           {order.table || 'Table'}
                        </span>
                        {(order.paymentStatus === 'paid-razorpay' || order.paymentStatus === 'paid-upi' || order.paymentStatus === 'paid-cash' || order.paymentStatus === 'paid' || (order.paymentLabel && order.paymentLabel.toLowerCase().includes('paid')) || order.status === 'completed') && (
                          <span style={{ fontSize: '10.5px', backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                             PAID
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', fontWeight: 600 }}>
                        Customer: <strong style={{ color: '#0F172A', fontWeight: 800 }}>{order.customer || 'Diner'}</strong> • {order.time || 'Today'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleMarkKitchenSeen(orderIdStr)}
                        disabled={isKitchenSeen}
                        style={{
                          backgroundColor: isKitchenSeen ? '#E2E8F0' : '#2563EB',
                          color: isKitchenSeen ? '#64748B' : '#FFF',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: isKitchenSeen ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: isKitchenSeen ? 'none' : '0 2px 8px rgba(37,99,235,0.4)'
                        }}
                        title={isKitchenSeen ? "Bell alarm stopped" : "Stop Kitchen Bell Alarm & Acknowledge Order"}
                      >
                        {isKitchenSeen ? (
                          <>
                            <Check size={13} />
                            <span>SEEN</span>
                          </>
                        ) : (
                          <>
                            <Bell size={13} style={{ animation: 'foodypay-spin 1.2s ease infinite' }} />
                            <span>STOP BELL</span>
                          </>
                        )}
                      </button>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: isReady ? '#10B981' : isPreparing ? '#FF5E14' : '#64748B',
                        color: '#FFF'
                      }}>
                        {isReady ? ' READY' : isPreparing ? ' COOKING' : '⏳ NEW'}
                      </span>
                    </div>
                  </div>

                  {/* Order Items List with Per-Item Start Cooking Status */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                              backgroundColor: cookingStatus === 'done' ? '#F0FDF4' : cookingStatus === 'cooking' ? '#FFF7ED' : '#F8FAFC',
                              border: cookingStatus === 'done' ? '1.5px solid #86EFAC' : cookingStatus === 'cooking' ? '1.5px solid #FDBA74' : '1.5px solid #E2E8F0',
                              borderRadius: '12px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 900, color: '#FF5E14' }}>
                                {item.qty}x
                              </span>
                              <span style={{ fontSize: '13.5px', fontWeight: 700, color: cookingStatus === 'done' ? '#94A3B8' : '#0F172A', textDecoration: cookingStatus === 'done' ? 'line-through' : 'none' }}>
                                {item.name}
                              </span>
                            </div>

                            <button
                              onClick={() => toggleItemCooking(orderIdStr, itemIdx)}
                              style={{
                                border: 'none',
                                backgroundColor: cookingStatus === 'done' ? '#10B981' : cookingStatus === 'cooking' ? '#FF5E14' : '#E2E8F0',
                                color: cookingStatus === 'idle' ? '#334155' : '#FFF',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 800,
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
                      <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#92400E', fontWeight: 700, marginTop: '4px' }}>
                         Note: {order.note}
                      </div>
                    )}
                  </div>

                  {/* Order Card Footer Action */}
                  <div style={{ padding: '14px 16px', borderTop: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                      Pay: <strong style={{ color: '#0F172A', fontWeight: 800 }}>{order.paymentLabel || 'Cash'}</strong>
                    </span>

                    {order.status === 'new' || (!isPreparing && !isReady && order.status !== 'completed') ? (
                      <button
                        onClick={() => updateOrderStatus(orderIdStr, 'preparing')}
                        disabled={actionLoadingSet.has(orderIdStr)}
                        style={{
                          background: 'linear-gradient(135deg, #FF6B2B 0%, #E84E05 100%)',
                          color: '#FFF',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: '10px',
                          fontWeight: 900,
                          fontSize: '13px',
                          cursor: actionLoadingSet.has(orderIdStr) ? 'not-allowed' : 'pointer',
                          opacity: actionLoadingSet.has(orderIdStr) ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(232,78,5,0.3)'
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
                            <span>Accept &amp; Start Cooking</span>
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
                          padding: '9px 18px',
                          borderRadius: '10px',
                          fontWeight: 900,
                          fontSize: '13px',
                          cursor: actionLoadingSet.has(orderIdStr) ? 'not-allowed' : 'pointer',
                          opacity: actionLoadingSet.has(orderIdStr) ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
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
                            padding: '9px 16px',
                            borderRadius: '10px',
                            fontWeight: 900,
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
                              <span>Ending...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Complete &amp; End Order</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => updateOrderStatus(orderIdStr, 'preparing')}
                          disabled={actionLoadingSet.has(orderIdStr)}
                          style={{
                            backgroundColor: '#E2E8F0',
                            color: '#475569',
                            border: '1px solid #CBD5E1',
                            padding: '8px 11px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '11.5px',
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
                          backgroundColor: '#F1F5F9',
                          color: '#059669',
                          border: '1.5px solid #A7F3D0',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 900,
                          fontSize: '12.5px',
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
          backgroundColor: 'rgba(15,23,42,0.5)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            border: '1.5px solid #E2E8F0',
            color: '#0F172A',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>Create Counter Kitchen Ticket</h3>
              <button onClick={() => setIsCounterOrderModalOpen(false)} style={{ background: '#F1F5F9', border: 'none', color: '#64748B', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCounterOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Table / Order Type</label>
                <input
                  type="text"
                  value={counterForm.table}
                  onChange={(e) => setCounterForm({ ...counterForm, table: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: '13.5px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Customer Name</label>
                <input
                  type="text"
                  value={counterForm.customer}
                  onChange={(e) => setCounterForm({ ...counterForm, customer: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: '13.5px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Items (format: Dish xQty, Dish xQty)</label>
                <input
                  type="text"
                  required
                  value={counterForm.items}
                  onChange={(e) => setCounterForm({ ...counterForm, items: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: '13.5px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>Chef Instruction Note</label>
                <input
                  type="text"
                  value={counterForm.note}
                  onChange={(e) => setCounterForm({ ...counterForm, note: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: '13.5px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ background: 'linear-gradient(135deg, #FF6B2B 0%, #E84E05 100%)', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', marginTop: '6px', boxShadow: '0 4px 12px rgba(232,78,5,0.3)' }}
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
