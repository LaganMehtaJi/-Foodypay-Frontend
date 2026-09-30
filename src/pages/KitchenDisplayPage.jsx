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
  Check
} from 'lucide-react';
import { playOrderPlaced, startContinuousAlarm, stopContinuousAlarm } from '../utils/soundEffects';
import { fetchOrdersApi, fetchPublicOrdersApi } from '../utils/api';

export default function KitchenDisplayPage({ onShowToast }) {
  const { restaurantSlug, merchantId } = useParams();

  const formatSlug = (str) => {
    if (!str) return 'Kitchen Display';
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const storeName = formatSlug(restaurantSlug);
  const effectiveMerchantId = merchantId || 'FP-397310';

  // State
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'new' | 'preparing' | 'ready'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isCounterOrderModalOpen, setIsCounterOrderModalOpen] = useState(false);

  // Counter POS Quick Order Form
  const [counterForm, setCounterForm] = useState({
    table: 'Table 1',
    customer: 'Walk-in Diner',
    items: 'Paneer Butter Masala x1, Garlic Naan x2',
    note: 'Serve HOT',
  });

  // Load orders from Live Server API for THIS specific merchant
  const loadOrders = async () => {
    const token = localStorage.getItem('foodypay_token');
    if (token) {
      try {
        const fetched = await fetchOrdersApi(token);
        if (Array.isArray(fetched)) {
          setOrders(fetched);
          return;
        }
      } catch (e) {}
    }

    try {
      const fetchedPublic = await fetchPublicOrdersApi(merchantId, effectiveMerchantId);
      if (Array.isArray(fetchedPublic)) {
        setOrders(fetchedPublic);
        return;
      }
    } catch (e) {}

    // Fallback: load from local storage
    try {
      const saved = localStorage.getItem('foodypay_crm_orders_v3');
      if (saved) {
        setOrders(JSON.parse(saved));
      }
    } catch (e) {}
  };


  useEffect(() => {
    loadOrders();

    const pollInterval = setInterval(loadOrders, 4000);

    // Listen to real-time order updates across tabs
    const handleStorage = (e) => {
      if (!e || e.key === 'foodypay_crm_orders_v3') {
        loadOrders();
      }
    };

    const handleCustomOrderEvent = () => loadOrders();

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
    window.addEventListener('foodypay_order_created', handleCustomOrderEvent);

    return () => {
      clearInterval(pollInterval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('foodypay_order_created', handleCustomOrderEvent);
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

  // Sound Bell Alert for Unseen / New Orders
  useEffect(() => {
    const hasUnseenNew = (orders || []).some(
      (o) => o && !o.seen && o.status === 'new'
    );
    if (hasUnseenNew && soundEnabled) {
      try {
        startContinuousAlarm();
      } catch (e) {}
    } else {
      stopContinuousAlarm();
    }
    return () => {
      stopContinuousAlarm();
    };
  }, [orders, soundEnabled]);

  // Order Status Updates
  const updateOrderStatus = (orderId, newStatus) => {
    stopContinuousAlarm();
    const updated = orders.map((o) => {
      const currentId = o._id || o.id;
      if (currentId === orderId) {
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
  };

  const handleMarkSeen = (orderId) => {
    stopContinuousAlarm();
    updateOrderStatus(orderId, 'preparing');
  };

  // Add Counter POS Order directly to kitchen
  const handleAddCounterOrder = (e) => {
    e.preventDefault();
    const newId = `#FP-${Math.floor(100000 + Math.random() * 900000)}`;

    // Parse simple items text format
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
      total: itemEntries.reduce((sum, item) => sum + item.price * item.qty, 0),
      status: 'new',
      seen: false,
      createdAt: new Date().toISOString(),
      time: 'Just now',
      note: counterForm.note,
    };

    const updated = [newOrderObj, ...orders];
    setOrders(updated);
    try {
      localStorage.setItem('foodypay_crm_orders_v3', JSON.stringify(updated));
      window.dispatchEvent(new Event('foodypay_order_created'));
    } catch (e) {}

    setIsCounterOrderModalOpen(false);
    setCounterForm({ table: 'Table 1', customer: 'Walk-in Diner', items: 'Paneer Butter Masala x1, Garlic Naan x2', note: 'Serve HOT' });
  };

  // Filtered Orders Calculation
  const filteredOrders = orders.filter((o) => {
    if (!o || o.status === 'completed' || o.status === 'served' || o.status === 'cancelled') return false;
    if (filter === 'all') return true;
    if (filter === 'new') return o.status === 'new' || !o.seen;
    if (filter === 'preparing') return o.status === 'preparing';
    if (filter === 'ready') return o.status === 'ready';
    return true;
  });

  const countNew = orders.filter((o) => o && (o.status === 'new' || !o.seen)).length;
  const countPreparing = orders.filter((o) => o && o.status === 'preparing').length;
  const countReady = orders.filter((o) => o && o.status === 'ready').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B0F17', color: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* KDS HEADER BAR */}
      <header
        style={{
          backgroundColor: '#151C28',
          borderBottom: '1.5px solid #2A364F',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          sticky: 'top',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 94, 20, 0.4)',
            }}
          >
            <ChefHat size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.3px' }}>
              Kitchen Display System (KDS)
            </h1>
            <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{storeName}</span>
              <span>•</span>
              <span>Merchant ID: <strong style={{ color: '#FF5E14' }}>{effectiveMerchantId}</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live Clock Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1E293B',
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1px solid #334155',
              fontSize: '14px',
              fontWeight: 800,
              color: '#38BDF8',
            }}
          >
            <Clock size={16} color="#38BDF8" />
            <span>{currentTime}</span>
          </div>

          {/* Sound Mute/Unmute */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: soundEnabled ? '#1E293B' : '#334155',
              border: '1px solid #334155',
              color: soundEnabled ? '#38BDF8' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={soundEnabled ? 'Mute Kitchen Bell' : 'Enable Kitchen Bell'}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={loadOrders}
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#F8FAFC',
              borderRadius: '12px',
              padding: '8px 14px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={16} />
            <span>Sync</span>
          </button>

          {/* Create Counter POS Order Button */}
          <button
            type="button"
            onClick={() => setIsCounterOrderModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 18px',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(255, 94, 20, 0.3)',
            }}
          >
            <Plus size={18} />
            <span>+ Counter POS Order</span>
          </button>

          <Link
            to="/dashboard"
            style={{
              backgroundColor: '#334155',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '8px 14px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={16} />
            <span>POS Dashboard</span>
          </Link>
        </div>
      </header>

      {/* SUB HEADER / FILTER TABS */}
      <main style={{ padding: '24px 32px' }}>
        <div
          style={{
            backgroundColor: '#151C28',
            border: '1.5px solid #2A364F',
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#2A364F',
                color: '#FF5E14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Utensils size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFFFFF' }}>
                Kitchen Display System (KDS Live Orders)
              </h2>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                Real-time kitchen order cards with item photos, customer details, table numbers, and 1-click status actions.
              </div>
            </div>
          </div>

          {/* FILTER BUTTONS */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                backgroundColor: filter === 'all' ? '#FF5E14' : '#1E293B',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              All Kitchen Orders ({orders.filter((o) => o && o.status !== 'completed' && o.status !== 'served' && o.status !== 'cancelled').length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('new')}
              style={{
                backgroundColor: filter === 'new' ? '#EF4444' : '#1E293B',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Bell size={15} />
              <span>New Orders ({countNew})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('preparing')}
              style={{
                backgroundColor: filter === 'preparing' ? '#F59E0B' : '#1E293B',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Flame size={15} />
              <span>Cooking In Progress ({countPreparing})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('ready')}
              style={{
                backgroundColor: filter === 'ready' ? '#10B981' : '#1E293B',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={15} />
              <span>Ready for Service ({countReady})</span>
            </button>
          </div>
        </div>

        {/* ORDERS KITCHEN CARDS GRID */}
        {filteredOrders.length === 0 ? (
          <div
            style={{
              backgroundColor: '#151C28',
              border: '2px dashed #2A364F',
              borderRadius: '24px',
              padding: '60px 20px',
              textAlign: 'center',
              color: '#94A3B8',
              marginTop: '40px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                backgroundColor: '#1E293B',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <ChefHat size={36} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: '0 0 6px 0' }}>
              No Active Kitchen Orders
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
              All kitchen orders have been prepared and served cleanly!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredOrders.map((order) => {
              const orderId = order._id || order.id;
              const isNew = order.status === 'new' || !order.seen;
              const isPreparing = order.status === 'preparing';
              const isReady = order.status === 'ready';

              return (
                <div
                  key={orderId}
                  style={{
                    backgroundColor: '#151C28',
                    border: isNew
                      ? '3px solid #EF4444'
                      : isPreparing
                      ? '3px solid #F59E0B'
                      : '2.5px solid #10B981',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: isNew
                      ? '0 0 20px rgba(239, 68, 68, 0.25)'
                      : '0 4px 16px rgba(0,0,0,0.3)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    {/* CARD HEADER */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                        borderBottom: '1.5px solid #2A364F',
                        paddingBottom: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#F8FAFC' }}>
                          {order.id || orderId}
                        </div>
                        <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '3px' }}>
                          Customer: <strong style={{ color: '#F8FAFC' }}>{order.customer || 'Walk-in'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span
                          style={{
                            backgroundColor: '#FF5E14',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            padding: '4px 12px',
                            borderRadius: '10px',
                            fontSize: '13px',
                          }}
                        >
                          📍 {order.table || 'Table 1'}
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                          ⏱️ {order.time || 'Just now'}
                        </span>
                      </div>
                    </div>

                    {/* ITEMS LIST */}
                    <div
                      style={{
                        backgroundColor: '#1E293B',
                        borderRadius: '14px',
                        padding: '14px',
                        marginBottom: '16px',
                      }}
                    >
                      {(order.items || []).map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 0',
                            borderBottom:
                              idx < (order.items || []).length - 1 ? '1px dashed #334155' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                backgroundColor: '#FF5E14',
                                color: '#FFFFFF',
                                fontWeight: 900,
                                fontSize: '13px',
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {it.qty}x
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '15px', color: '#F8FAFC' }}>
                              {it.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8' }}>
                            ₹{(it.price || 0) * (it.qty || 1)}
                          </span>
                        </div>
                      ))}

                      {order.note && (
                        <div
                          style={{
                            marginTop: '10px',
                            fontSize: '12.5px',
                            color: '#FCA5A5',
                            fontWeight: 800,
                            backgroundColor: '#451A1A',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #7F1D1D',
                          }}
                        >
                          🔥 Chef Note: {order.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CARD ACTION BUTTONS */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {isNew && (
                      <button
                        type="button"
                        onClick={() => handleMarkSeen(orderId)}
                        style={{
                          flex: 1,
                          backgroundColor: '#3B82F6',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Flame size={16} />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(orderId, 'ready')}
                        style={{
                          flex: 1,
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(orderId, 'served')}
                        style={{
                          flex: 1,
                          backgroundColor: '#6366F1',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Check size={16} />
                        <span>Mark Served</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: ADD COUNTER POS ORDER DIRECTLY TO KITCHEN */}
      {isCounterOrderModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#151C28',
              border: '1.5px solid #2A364F',
              borderRadius: '24px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFFFFF' }}>
                + Add Counter POS Kitchen Order
              </h3>
              <button
                type="button"
                onClick={() => setIsCounterOrderModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCounterOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Table / Counter Name
                </label>
                <input
                  type="text"
                  value={counterForm.table}
                  onChange={(e) => setCounterForm({ ...counterForm, table: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={counterForm.customer}
                  onChange={(e) => setCounterForm({ ...counterForm, customer: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Ordered Items (e.g. Paneer Butter Masala x1, Garlic Naan x2)
                </label>
                <textarea
                  rows={3}
                  value={counterForm.items}
                  onChange={(e) => setCounterForm({ ...counterForm, items: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Special Cooking Note
                </label>
                <input
                  type="text"
                  value={counterForm.note}
                  onChange={(e) => setCounterForm({ ...counterForm, note: e.target.value })}
                  placeholder="e.g. Extra spicy, less oil"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    color: '#F8FAFC',
                    fontSize: '14px',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  backgroundColor: '#FF5E14',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 94, 20, 0.4)',
                }}
              >
                🚀 Send Order to Kitchen
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
