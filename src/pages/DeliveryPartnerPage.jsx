import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Truck,
  Phone,
  MapPin,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ChefHat,
  DollarSign,
  QrCode,
  Check,
  X,
  ShoppingBag,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { playFoodPreparing, playFoodReady } from '../utils/soundEffects';
import { fetchOrdersApi, fetchPublicOrdersApi, updateOrderStatusApi } from '../utils/api';
import { subscribeToOrders } from '../utils/firestoreService';

export default function DeliveryPartnerPage({ onShowToast }) {
  const { restaurantSlug, merchantId } = useParams();

  const formatSlug = (str) => {
    if (!str) return 'Delivery Display System';
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const storeName = formatSlug(restaurantSlug);
  const effectiveMerchantId = merchantId || 'FP-397310';

  // State
  const [orders, setOrders] = useState([]);
  const [deliveryTabFilter, setDeliveryTabFilter] = useState('active'); // 'active' | 'delivered' | 'all'
  const [currentTime, setCurrentTime] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paymentModeMap, setPaymentModeMap] = useState({}); // orderId -> 'Cash' | 'UPI'

  // Load orders from Live Server API / Local Storage
  const loadOrders = () => {};

  useEffect(() => {
    // Purge stale local storage orders cache if any exists
    try {
      localStorage.removeItem('foodypay_crm_orders_v3');
    } catch (e) {}

    // Live real-time Firestore sync
    let unsubscribeFs = () => {};
    try {
      const activeBiz = effectiveMerchantId || merchantId || localStorage.getItem('foodypay_active_business_id') || 'FP-348330';
      unsubscribeFs = subscribeToOrders(activeBiz, (liveOrders) => {
        const orderList = Array.isArray(liveOrders) ? liveOrders : [];
        setOrders(orderList);
      });
    } catch (e) {}

    return () => {
      if (typeof unsubscribeFs === 'function') unsubscribeFs();
    };
  }, [effectiveMerchantId, merchantId]);

  // Live Clock
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

  // Status update handler
  const handleUpdateDeliveryStatus = async (orderId, newStatus, paymentDetails = {}) => {
    const updatedOrders = orders.map((o) => {
      const currentId = o._id || o.id || o.orderId;
      if (currentId === orderId || String(currentId) === String(orderId)) {
        return {
          ...o,
          status: newStatus,
          paymentStatus: paymentDetails.paymentStatus || o.paymentStatus,
          paymentLabel: paymentDetails.paymentLabel || o.paymentLabel,
          paymentMode: paymentDetails.paymentMode || o.paymentMode || paymentModeMap[orderId] || 'Cash',
          seen: true,
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    setOrders(updatedOrders);

    try {
      localStorage.setItem('foodypay_crm_orders_v3', JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event('storage'));
      try {
        const bc = new BroadcastChannel('foodypay_live_orders_channel');
        bc.postMessage({ type: 'STATUS_UPDATED', orderId, newStatus });
        bc.close();
      } catch (e) {}
    } catch (e) {}

    const token = localStorage.getItem('foodypay_token');
    const targetOrder = orders.find(
      (o) => (o._id || o.id || o.orderId) === orderId || String(o._id || o.id || o.orderId) === String(orderId)
    );
    const dbId = targetOrder?._id || orderId;

    if (token && dbId && String(dbId).length === 24) {
      try {
        await updateOrderStatusApi(token, dbId, newStatus);
      } catch (e) {}
    }

    if (soundEnabled) {
      try {
        if (newStatus === 'delivered' || newStatus === 'completed') {
          playFoodReady();
        } else {
          playFoodPreparing();
        }
      } catch (e) {}
    }

    if (onShowToast) {
      const msg =
        newStatus === 'out_for_delivery' || newStatus === 'dispatched'
          ? ` Order #${orderId} Dispatched for Delivery!`
          : newStatus === 'delivered'
          ? ` Order #${orderId} Delivered Successfully!`
          : `Order status updated to ${newStatus.toUpperCase()}`;
      onShowToast(msg);
    }
  };

  // Filter Delivery & Takeaway orders
  const deliveryOrders = orders.filter((o) => {
    const isDeliveryType =
      o.type === 'Home Delivery' ||
      o.type === 'Takeaway' ||
      o.orderType === 'delivery' ||
      o.table?.toLowerCase().includes('delivery') ||
      Boolean(o.address);
    return isDeliveryType || true; // include all if not specifically marked
  });

  const activeDeliveries = deliveryOrders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled'
  );

  const completedDeliveries = deliveryOrders.filter(
    (o) => o.status === 'delivered' || o.status === 'completed'
  );

  const displayedOrders =
    deliveryTabFilter === 'active'
      ? activeDeliveries
      : deliveryTabFilter === 'delivered'
      ? completedDeliveries
      : deliveryOrders;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER BAR */}
      <header
        style={{
          backgroundColor: '#1E293B',
          borderBottom: '1px solid #334155',
          padding: '16px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#334155',
              color: '#F8FAFC',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                }}
              >
                <Truck size={22} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Delivery Partner Portal
              </h1>
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              {storeName} • Real-time Order Dispatch & Delivery Tracking
            </div>
          </div>
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active Deliveries Counter Badge */}
          <div
            style={{
              background: activeDeliveries.length > 0 ? '#F59E0B' : '#334155',
              color: activeDeliveries.length > 0 ? '#000' : '#94A3B8',
              fontWeight: 900,
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Truck size={16} /> {activeDeliveries.length} Active Deliveries
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: '#334155',
              border: 'none',
              color: soundEnabled ? '#10B981' : '#94A3B8',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            {soundEnabled ? 'Sound ON' : 'Muted'}
          </button>

          {/* Link to KDS */}
          <Link
            to={`/${restaurantSlug || 'kitchen'}/${effectiveMerchantId}/kds`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#334155',
              color: '#F8FAFC',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <ChefHat size={16} /> KDS View
          </Link>

          {/* Live Clock */}
          <div
            style={{
              backgroundColor: '#0F172A',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #334155',
              fontSize: '13px',
              fontWeight: 700,
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Clock size={15} /> {currentTime}
          </div>
        </div>
      </header>

      {/* TABS FILTER BAR */}
      <div
        style={{
          backgroundColor: '#1E293B',
          padding: '12px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'active', label: `Pending & Out for Delivery (${activeDeliveries.length})` },
            { id: 'delivered', label: `Delivered (${completedDeliveries.length})` },
            { id: 'all', label: `All Orders (${deliveryOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDeliveryTabFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: deliveryTabFilter === tab.id ? '#F59E0B' : '#334155',
                color: deliveryTabFilter === tab.id ? '#0F172A' : '#94A3B8',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={loadOrders}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            color: '#94A3B8',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <RefreshCw size={14} /> Refresh Orders
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {displayedOrders.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#64748B',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              border: '1px dashed #334155',
              maxWidth: '600px',
              margin: '40px auto',
            }}
          >
            <Truck size={48} color="#475569" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: '0 0 6px 0' }}>
              No Delivery Orders Found
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {deliveryTabFilter === 'active'
                ? 'All delivery items have been successfully dispatched and delivered!'
                : 'No delivery orders in this filter category right now.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px',
            }}
          >
            {displayedOrders.map((ord, idx) => {
              const orderIdStr = ord._id || ord.id || ord.orderId || `ord_${idx}`;
              const displayId = ord.orderId || ord.id || `#FP-${1080 + idx}`;
              const isDelivered = ord.status === 'delivered' || ord.status === 'completed';
              const isOutForDelivery = ord.status === 'out_for_delivery' || ord.status === 'dispatched';
              const isPreparing = ord.status === 'preparing';
              const isPaid = ord.paymentStatus === 'paid' || ord.paymentStatus === 'online';

              const selectedPaymentMode = paymentModeMap[orderIdStr] || ord.paymentMode || 'Cash';

              // Delivery Stepper nodes
              const stepIndex = isDelivered ? 3 : isOutForDelivery ? 2 : isPreparing ? 1 : 0;
              const deliverySteps = ['Placed', 'Kitchen', 'Out for Delivery', 'Delivered'];

              return (
                <div
                  key={orderIdStr}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '16px',
                    border: isOutForDelivery
                      ? '2px solid #F59E0B'
                      : isDelivered
                      ? '1px solid #10B981'
                      : '1px solid #334155',
                    boxShadow: isOutForDelivery
                      ? '0 8px 24px rgba(245, 158, 11, 0.15)'
                      : '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* CARD TOP HEADER */}
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: isOutForDelivery
                        ? 'rgba(245, 158, 11, 0.12)'
                        : isDelivered
                        ? 'rgba(16, 185, 129, 0.12)'
                        : '#0F172A',
                      borderBottom: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '18px',
                            fontWeight: 900,
                            color: '#F8FAFC',
                          }}
                        >
                          {displayId}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: '#334155',
                            color: '#38BDF8',
                          }}
                        >
                          {ord.type || ord.orderType || 'Home Delivery'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        {ord.createdAt
                          ? new Date(ord.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just Now'}
                      </div>
                    </div>

                    {/* STATUS PILL */}
                    <div
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        background: isDelivered
                          ? '#10B981'
                          : isOutForDelivery
                          ? '#F59E0B'
                          : isPreparing
                          ? '#3B82F6'
                          : '#64748B',
                        color: isOutForDelivery ? '#000' : '#FFF',
                      }}
                    >
                      {isDelivered
                        ? 'Delivered'
                        : isOutForDelivery
                        ? 'Out for Delivery'
                        : isPreparing
                        ? 'Kitchen Preparing'
                        : 'Placed'}
                    </div>
                  </div>

                  {/* PROGRESS STEPPER */}
                  <div style={{ padding: '14px 16px', background: '#0F172A', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                      {/* Connecting Line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '10%',
                          right: '10%',
                          height: '3px',
                          background: '#334155',
                          zIndex: 1,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '10%',
                          width: `${(stepIndex / 3) * 80}%`,
                          height: '3px',
                          background: isDelivered ? '#10B981' : '#F59E0B',
                          zIndex: 2,
                          transition: 'width 0.3s ease',
                        }}
                      />

                      {deliverySteps.map((stepLabel, sIdx) => {
                        const isDone = sIdx <= stepIndex;
                        const isCurrent = sIdx === stepIndex;
                        return (
                          <div
                            key={stepLabel}
                            style={{
                              position: 'relative',
                              zIndex: 3,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: isCurrent
                                  ? '#F59E0B'
                                  : isDone
                                  ? '#10B981'
                                  : '#334155',
                                color: isCurrent ? '#000' : '#FFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 900,
                              }}
                            >
                              {isDone ? '' : sIdx + 1}
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                marginTop: '4px',
                                color: isCurrent ? '#F59E0B' : isDone ? '#10B981' : '#64748B',
                                textAlign: 'center',
                              }}
                            >
                              {stepLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CUSTOMER DETAILS & ADDRESS */}
                  <div style={{ padding: '16px', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
                          {ord.customer || 'Walk-in Diner'}
                        </div>
                        {ord.phone && (
                          <a
                            href={`tel:${ord.phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '4px',
                              color: '#38BDF8',
                              fontSize: '13px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              background: 'rgba(56, 189, 248, 0.1)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            <Phone size={14} /> {ord.phone} (Call Customer)
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Delivery Address Box */}
                    <div
                      style={{
                        background: '#0F172A',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <MapPin size={16} color="#F59E0B" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>DELIVERY ADDRESS</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#E2E8F0', marginTop: '2px' }}>
                          {ord.address || ord.table || 'Counter Takeaway / Customer Pickup'}
                        </div>
                      </div>
                      {ord.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ord.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <Navigation size={14} /> Map
                        </a>
                      )}
                    </div>
                  </div>

                  {/* FOOD ITEMS LIST */}
                  <div style={{ padding: '16px', flex: 1, borderBottom: '1px solid #334155' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.5px' }}>
                      ITEMS TO DELIVER ({ord.items ? ord.items.length : 0})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(ord.items || []).map((it, iIdx) => (
                        <div
                          key={iIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: it.isVeg ? '#10B981' : '#EF4444',
                              }}
                            />
                            <span
                              style={{
                                background: '#334155',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 800,
                                fontSize: '12px',
                              }}
                            >
                              {it.qty}x
                            </span>
                            <span style={{ color: '#F1F5F9' }}>{it.name}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: '#94A3B8' }}>
                            ₹{it.price * it.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    {ord.note && (
                      <div
                        style={{
                          marginTop: '12px',
                          fontSize: '12px',
                          color: '#F59E0B',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                        }}
                      >
                         Note: {ord.note}
                      </div>
                    )}
                  </div>

                  {/* PAYMENT & COLLECTION BOX */}
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: '#0F172A',
                      borderBottom: '1px solid #334155',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8' }}>TOTAL AMOUNT</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981' }}>
                          ₹{ord.total || 0}
                        </div>
                      </div>

                      {/* Payment mode selector & collection toggle */}
                      <div>
                        {isPaid ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#064E3B',
                              color: '#34D399',
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            <CheckCircle2 size={15} /> PAID ({ord.paymentMode || 'ONLINE/CASH'})
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Cash / UPI Switch */}
                            <select
                              value={selectedPaymentMode}
                              onChange={(e) =>
                                setPaymentModeMap({
                                  ...paymentModeMap,
                                  [orderIdStr]: e.target.value,
                                })
                              }
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#1E293B',
                                border: '1px solid #475569',
                                color: '#FFF',
                                fontWeight: 700,
                                fontSize: '12px',
                              }}
                            >
                              <option value="Cash"> Cash</option>
                              <option value="UPI"> UPI / QR</option>
                            </select>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDeliveryStatus(orderIdStr, ord.status, {
                                  paymentStatus: 'paid',
                                  paymentLabel: `Paid via ${selectedPaymentMode}`,
                                  paymentMode: selectedPaymentMode,
                                })
                              }
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#10B981',
                                border: 'none',
                                color: '#FFF',
                                fontWeight: 800,
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              Collect ₹{ord.total || 0}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS FOR DELIVERY PARTNER */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {!isDelivered ? (
                      <>
                        {!isOutForDelivery ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateDeliveryStatus(orderIdStr, 'out_for_delivery')}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                              border: 'none',
                              color: '#000',
                              fontWeight: 900,
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            <Truck size={18} /> Out For Delivery (Nikala Gaya)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateDeliveryStatus(orderIdStr, 'delivered', {
                                paymentStatus: 'paid',
                                paymentLabel: `Paid via ${selectedPaymentMode}`,
                                paymentMode: selectedPaymentMode,
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10B981, #059669)',
                              border: 'none',
                              color: '#FFF',
                              fontWeight: 900,
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <CheckCircle2 size={18} /> Mark Delivered & Complete Order
                          </button>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#34D399',
                          fontWeight: 800,
                          fontSize: '13px',
                        }}
                      >
                         Order Delivered & Cash/UPI Collected
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
