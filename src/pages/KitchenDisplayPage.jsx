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
import { playFoodPreparing, playFoodReady } from '../utils/soundEffects';
import { fetchOrdersApi, fetchPublicOrdersApi, updateOrderStatusApi } from '../utils/api';

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

  // Order Status Updates (No bell alarm triggered on Kitchen Tab)
  const updateOrderStatus = (orderId, newStatus) => {
    if (orderId) {
      try {
        const raw = localStorage.getItem('foodypay_seen_order_ids');
        const seenSet = raw ? new Set(JSON.parse(raw)) : new Set();
        seenSet.add(String(orderId));
        localStorage.setItem('foodypay_seen_order_ids', JSON.stringify(Array.from(seenSet)));
      } catch (e) {}
    }

    const updated = orders.map((o) => {
      const currentId = o._id || o.id || o.orderId;
      if (currentId === orderId || String(currentId) === String(orderId)) {
        return {
          ...o,
          status: newStatus,
          seen: true,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    setOrders(updated);
    try {
      localStorage.setItem('foodypay_crm_orders_v3', JSON.stringify(updated));
      window.dispatchEvent(new Event('foodypay_order_created'));
      const bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.postMessage({ type: 'ORDER_UPDATED', orders: updated });
      bc.close();
    } catch (e) {}

    if (newStatus === 'ready' || newStatus === 'completed') {
      try {
        playFoodReady();
      } catch (e) {}
      if (onShowToast) onShowToast(`️ Order ${orderId} marked Ready to Serve!`);
    }

    const token = localStorage.getItem('foodypay_token');
    if (token && orderId) {
      const targetObj = orders.find((o) => (o._id || o.id || o.orderId) === orderId || String(o._id || o.id || o.orderId) === String(orderId));
      const targetId = (targetObj && targetObj._id) || orderId;
      updateOrderStatusApi(token, targetId, newStatus).catch(() => {});
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
  // Active queue: status === 'new' or status === 'preparing'
  // Completed history: status === 'ready' or status === 'completed'
  const activeOrders = orders.filter((o) => o.status === 'new' || o.status === 'preparing');
  const completedOrders = orders.filter((o) => o.status === 'ready' || o.status === 'completed');

  const displayedOrders =
    kitchenTabFilter === 'active'
      ? activeOrders
      : kitchenTabFilter === 'completed'
      ? completedOrders
      : orders;

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
              const orderIdStr = order._id || order.id || order.orderId;
              const isReady = order.status === 'ready' || order.status === 'completed';
              const isPreparing = order.status === 'preparing';

              return (
                <div
                  key={orderIdStr}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '16px',
                    border: isReady ? '1px solid #10B981' : isPreparing ? '1.5px solid #FF5E14' : '1px solid #334155',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                  }}
                >
                  {/* Order Card Header */}
                  <div style={{
                    backgroundColor: isReady ? 'rgba(16,185,129,0.15)' : isPreparing ? 'rgba(255,94,20,0.15)' : '#0F172A',
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
                            ✓ PAID
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px', fontWeight: 400 }}>
                        Customer: <strong style={{ color: '#E2E8F0', fontWeight: 500 }}>{order.customer || 'Diner'}</strong> • {order.time || 'Today'}
                      </div>
                    </div>

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

                    {!isReady ? (
                      <button
                        onClick={() => updateOrderStatus(orderIdStr, 'ready')}
                        style={{
                          backgroundColor: '#10B981',
                          color: '#FFF',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        ️ Ready to Serve
                      </button>
                    ) : (
                      <button
                        onClick={() => updateOrderStatus(orderIdStr, 'preparing')}
                        style={{
                          backgroundColor: '#334155',
                          color: '#94A3B8',
                          border: '1px solid #475569',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontWeight: 500,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RotateCcw size={12} /> Move Back to Active
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
