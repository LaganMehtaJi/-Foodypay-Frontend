import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Utensils,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ChevronRight,
  Phone,
  User,
  Sparkles,
  ArrowLeft,
  X,
  CreditCard,
  QrCode,
  Tag,
  Star,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Share2,
  Check,
  Award,
  Gift,
  Cake,
  Download,
  Smartphone,
  Copy,
  Edit3
} from 'lucide-react';
import { playOrderPlaced } from '../utils/soundEffects';
import { QrCodeComponent } from '../utils/qrGenerator';
import { fetchDishesApi, fetchPublicDishesApi, fetchPublicMerchantApi, createReviewApi, createPublicOrderApi } from '../utils/api';

// Default Fallback Dishes (Cleared as requested)
const DEFAULT_DISHES = [];


const AVAILABLE_COUPONS = [
  { code: 'WELCOME50', type: '50% OFF', discount: '50% OFF up to ₹100', minOrder: 199, desc: 'Valid on all food & beverage orders above ₹199', badge: 'POPULAR' },
  { code: 'FLAT50', type: 'FLAT ₹50', discount: 'Flat ₹50 OFF on total bill', minOrder: 299, desc: 'Instant ₹50 discount deducted at checkout', badge: 'BEST VALUE' },
  { code: 'BIRTHDAY50', type: 'BIRTHDAY REWARD', discount: '50% OFF Special Birthday Perk', minOrder: 199, desc: 'Special birthday reward for verified diners', badge: 'BIRTHDAY PERK' },
  { code: 'FIRSTORDER', type: '₹40 OFF', discount: 'Flat ₹40 Discount on First Order', minOrder: 149, desc: 'Welcome bonus for digital table QR self-ordering', badge: 'NEW DINER' }
];

export default function CustomerMenuPage({ onShowToast }) {
  const { restaurantSlug, merchantId, tableId } = useParams();
  const navigate = useNavigate();

  // App Navigation Tab ('menu' | 'coupons' | 'profile')
  const [navTab, setNavTab] = useState('menu');

  const formatSlug = (str) => {
    if (!str) return '';
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const rawRestName = formatSlug(restaurantSlug || 'Lagan Da Dhaba');
  const rawTable = tableId ? formatSlug(tableId) : 'Table 1';
  const effectiveMerchantId = merchantId || 'FP-985569';

  // Store & Catalog Datasets
  const [storeInfo, setStoreInfo] = useState({
    name: rawRestName,
    merchantId: effectiveMerchantId,
    table: rawTable,
    logoUrl: '',
    gstPercent: 5,
    upiId: 'lagandhaba@icici',
  });

  const [dishes, setDishes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [cart, setCart] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState('all');

  // Customer Profile State (persisted in localStorage except order history)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDob, setCustomerDob] = useState('');
  const [showDobModal, setShowDobModal] = useState(false);
  const [showPwaInstallBanner, setShowPwaInstallBanner] = useState(true);

  // Cart & Checkout state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [chefNote, setChefNote] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi'); // 'upi' | 'cash'
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');

  // Online UPI QR Modal state
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [pendingOrderObj, setPendingOrderObj] = useState(null);

  // Rating & Feedback Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Active Placed Order Tracker state
  const [activePlacedOrder, setActivePlacedOrder] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load saved customer profile details (excluding orders) from localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('foodypay_customer_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name) setCustomerName(p.name);
        if (p.phone) setCustomerPhone(p.phone);
        if (p.dob) setCustomerDob(p.dob);
      }
    } catch (e) {}
  }, []);

  // Auto-save user profile details (name, phone, dob) to localStorage whenever updated
  useEffect(() => {
    try {
      if (customerName || customerPhone || customerDob) {
        const profile = { name: customerName, phone: customerPhone, dob: customerDob };
        localStorage.setItem('foodypay_customer_profile', JSON.stringify(profile));
      }
    } catch (e) {}
  }, [customerName, customerPhone, customerDob]);

  // Load menu dataset dynamically from Server API (Pure Live Data)
  const loadDynamicMenu = async () => {
    try {
      const targetIdentifier = merchantId || restaurantSlug || 'FP-985569';

      // 1. Fetch Merchant Info from Live Server
      try {
        const merchantData = await fetchPublicMerchantApi(targetIdentifier);
        if (merchantData) {
          setStoreInfo((prev) => ({
            ...prev,
            name: merchantData.businessName || merchantData.name || rawRestName,
            logoUrl: merchantData.logo?.url || prev.logoUrl,
            gstPercent: merchantData.gstPercent !== undefined ? merchantData.gstPercent : 5,
            upiId: merchantData.upiId || 'lagandhaba@icici',
          }));
        }
      } catch (e) {
        // Fallback to name from URL slug if server details unavailable
      }

      const normalizeDishes = (list) => {
        if (!Array.isArray(list)) return [];
        return list.map((item, idx) => ({
          ...item,
          id: String(item.id || item._id || `d_${idx}_${(item.name || 'dish').toLowerCase().replace(/[^a-z0-9]/g, '_')}`),
          price: Number(item.price || item.comboPrice || 0),
        }));
      };

      // 2. Fetch Catalog Dishes for THIS specific merchant from Live Server API
      try {
        const apiDishes = await fetchPublicDishesApi(merchantId, effectiveMerchantId);
        if (Array.isArray(apiDishes)) {
          setDishes(normalizeDishes(apiDishes));
        } else {
          setDishes([]);
        }
      } catch (err) {
        setDishes([]);
      }


      const savedMeals = localStorage.getItem('foodypay_crm_meals_v1');
      if (savedMeals) {
        const parsedMeals = JSON.parse(savedMeals);
        if (Array.isArray(parsedMeals)) {
          const isSample = (name = '') => {
            const n = name.toLowerCase();
            return n.includes('thali') || n.includes('pizza & starter') || n.includes('snack & beverage') || n.includes('tiffin combo') || n.includes('party meal');
          };
          const cleanCombos = parsedMeals.filter(m => m && m.name && !isSample(m.name));
          setCombos(normalizeDishes(cleanCombos));
        } else {
          setCombos([]);
        }
      } else {
        setCombos([]);
      }
    } catch (e) {
      setDishes([]);
      setCombos([]);
    }
  };

  useEffect(() => {
    loadDynamicMenu();
    window.addEventListener('storage', loadDynamicMenu);
    return () => window.removeEventListener('storage', loadDynamicMenu);
  }, [restaurantSlug, merchantId, rawRestName]);

  // Dynamically update favicon, apple-touch-icon, and PWA Web App Manifest with uploaded store logo
  useEffect(() => {
    const effectiveLogo = storeInfo.logoUrl || '/Logo.png';
    const effectiveName = storeInfo.name || 'FoodyPay App';

    document.title = `${effectiveName} | Digital Ordering`;

    // 1. Update <link rel="icon">
    let iconLink = document.querySelector("link[rel*='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = effectiveLogo;

    // 2. Update <link rel="apple-touch-icon"> for iOS Add to Home Screen
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = effectiveLogo;

    // 3. Update PWA Web App Manifest JSON Blob
    try {
      const manifestObj = {
        name: effectiveName,
        short_name: effectiveName,
        description: `Official Digital QR Menu & Ordering App for ${effectiveName}`,
        start_url: window.location.href,
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#FF5E14',
        icons: [
          {
            src: effectiveLogo,
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      };
      const manifestBlob = new Blob([JSON.stringify(manifestObj)], { type: 'application/json' });
      const manifestBlobUrl = URL.createObjectURL(manifestBlob);

      let manifestLink = document.querySelector("link[rel='manifest']");
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestBlobUrl;
    } catch (e) {}
  }, [storeInfo.logoUrl, storeInfo.name]);

  // Live order tracker sync with localStorage
  useEffect(() => {
    if (!activePlacedOrder) return;
    const syncOrderStatus = () => {
      try {
        const saved = localStorage.getItem('foodypay_crm_orders_v3');
        if (saved) {
          const parsed = JSON.parse(saved);
          const current = parsed.find((o) => (o.id === activePlacedOrder.id || o._id === activePlacedOrder._id));
          if (current) {
            setActivePlacedOrder(current);
          }
        }
      } catch (e) {}
    };

    const timer = setInterval(syncOrderStatus, 1000);
    window.addEventListener('storage', syncOrderStatus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', syncOrderStatus);
    };
  }, [activePlacedOrder?.id]);

  const categories = ['All', ...new Set(dishes.map((d) => d.category || 'General'))];

  const updateCartQty = (dishId, delta) => {
    if (!dishId || dishId === 'undefined') return;
    const key = String(dishId);
    setCart((prev) => {
      const current = prev[key] || 0;
      const next = current + delta;
      if (next <= 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  };

  const getCartCount = () => Object.values(cart).reduce((s, q) => s + (Number(q) || 0), 0);

  const getSubtotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([dishId, qty]) => {
      if (!dishId || dishId === 'undefined' || !qty || qty <= 0) return;
      const strId = String(dishId);
      const dish = dishes.find((d) => String(d.id) === strId) || combos.find((c) => String(c.id) === strId);
      if (dish) {
        const unitPrice = Number(dish.price || dish.comboPrice || 0);
        total += unitPrice * Number(qty);
      }
    });
    return total;
  };

  const subtotal = getSubtotal();
  const discountAmount = appliedCoupon ? subtotal * 0.2 : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round((taxableAmount * storeInfo.gstPercent) / 100);
  const finalTotal = Math.round(taxableAmount + gstAmount);

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dish.desc && dish.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || dish.category === selectedCategory;
    const matchesDiet =
      dietFilter === 'all' ||
      (dietFilter === 'veg' && dish.isVeg) ||
      (dietFilter === 'nonveg' && !dish.isVeg);
    return matchesSearch && matchesCat && matchesDiet;
  });

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    if (['WELCOME50', 'FLAT50'].includes(couponInput.trim().toUpperCase())) {
      setAppliedCoupon({ code: couponInput.trim().toUpperCase(), label: 'Special Discount Applied!' });
      if (onShowToast) onShowToast('🎉 Promo Coupon Applied!');
    } else {
      if (onShowToast) onShowToast('❌ Invalid Code. Try WELCOME50');
    }
  };

  const handleInitiateOrder = (e) => {
    e.preventDefault();

    if (getCartCount() === 0) {
      if (onShowToast) onShowToast('Your cart is empty!');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter your name for kitchen order identification!');
      return;
    }

    const orderItems = Object.entries(cart).map(([dishId, qty]) => {
      const dish = dishes.find((d) => d.id === dishId) || combos.find((c) => c.id === dishId) || {};
      const unitPrice = Number(dish.price || dish.comboPrice || 0);
      return {
        id: dish.id || dishId,
        name: dish.name || 'Special Item',
        qty: Number(qty) || 1,
        price: unitPrice,
        isVeg: dish.isVeg !== false,
      };
    });

    const calculatedSubtotal = orderItems.reduce((acc, it) => acc + (it.price * it.qty), 0);
    const calculatedDiscount = appliedCoupon ? Math.round(calculatedSubtotal * 0.2) : 0;
    const taxable = Math.max(0, calculatedSubtotal - calculatedDiscount);
    const calculatedTax = Math.round((taxable * (storeInfo.gstPercent || 5)) / 100);
    const calculatedTotal = taxable + calculatedTax;

    const newOrderId = `#FP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: newOrderId,
      type: 'Dine-In',
      table: rawTable,
      customer: customerName.trim(),
      phone: customerPhone.trim() || '+91 98000 00000',
      time: 'Just now',
      timestamp: Date.now(),
      status: 'new',
      seen: false, // Unseen by Dashboard staff -> triggers continuous bell alarm!
      paymentStatus: paymentMode === 'upi' ? 'paid-upi' : 'cash',
      paymentLabel: paymentMode === 'upi' ? 'Paid via Online UPI' : 'Cash on Counter',
      items: orderItems,
      note: chefNote.trim(),
      subtotal: calculatedSubtotal,
      discount: calculatedDiscount,
      tax: calculatedTax,
      total: calculatedTotal,
      merchantId: storeInfo.merchantId,
      restaurantSlug,
      restaurantName: storeInfo.name,
    };

    if (paymentMode === 'upi') {
      setPendingOrderObj(newOrder);
      setShowUpiModal(true);
      setIsCartOpen(false);
    } else {
      finalizeAndSaveOrder(newOrder);
    }
  };

  const finalizeAndSaveOrder = async (orderObj) => {
    try {
      const existingKey = 'foodypay_crm_orders_v3';
      const existing = localStorage.getItem(existingKey);
      let list = existing ? JSON.parse(existing) : [];
      list = [orderObj, ...list];
      localStorage.setItem(existingKey, JSON.stringify(list));

      playOrderPlaced();
      window.dispatchEvent(new Event('foodypay_order_created'));
    } catch (err) {
      console.error('Error saving order locally:', err);
    }

    try {
      await createPublicOrderApi({
        merchantId: storeInfo.merchantId,
        foodypayId: foodypayId,
        type: orderObj.type,
        table: orderObj.table,
        customer: orderObj.customer,
        phone: orderObj.phone,
        items: orderObj.items,
        note: orderObj.note,
        paymentStatus: orderObj.paymentStatus,
        paymentLabel: orderObj.paymentLabel,
        subtotal: orderObj.subtotal,
        discount: orderObj.discount,
        tax: orderObj.tax,
        total: orderObj.total,
      });
    } catch (err) {
      console.error('Error saving order to backend server:', err);
    }

    setActivePlacedOrder(orderObj);
    setIsCartOpen(false);
    setShowUpiModal(false);
    setCart({});

    // Check if customer DOB is not yet collected -> Prompt for Date of Birth after 1st order!
    if (!customerDob) {
      setTimeout(() => {
        setShowDobModal(true);
      }, 1200);
    }

    if (onShowToast) onShowToast(`🎉 Order ${orderObj.id} sent to kitchen!`);
  };


  // Submit Date of Birth after First Order -> Syncs customer into Dashboard CRM!
  const handleSaveDobSubmit = (e) => {
    e.preventDefault();
    if (!customerDob) return;

    try {
      const dobDate = new Date(customerDob);
      const formattedDate = dobDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const now = new Date();
      const isToday = now.getMonth() === dobDate.getMonth() && now.getDate() === dobDate.getDate();

      const profile = { name: customerName, phone: customerPhone, dob: customerDob };
      localStorage.setItem('foodypay_customer_profile', JSON.stringify(profile));

      // Create & Sync customer profile into Dashboard Customer CRM
      const newCustObj = {
        id: `c_${Date.now()}`,
        name: customerName.trim() || 'Dine-In Guest',
        phone: customerPhone.trim() || '+91 98000 00000',
        ordersCount: 1,
        totalSales: activePlacedOrder?.total || 250,
        birthday: formattedDate || 'Today',
        isBirthdayToday: isToday,
        lastOrdered: 'Just now',
      };

      const savedCusts = localStorage.getItem('foodypay_crm_customers_v1');
      let custs = savedCusts ? JSON.parse(savedCusts) : [];
      custs = [newCustObj, ...custs];
      localStorage.setItem('foodypay_crm_customers_v1', JSON.stringify(custs));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}

    setShowDobModal(false);
    if (onShowToast) onShowToast('🎁 Birthday saved! You will receive special gift offers on your birthday!');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    const newReview = {
      id: `rev_${Date.now()}`,
      customerName: customerName.trim() || 'Dine-In Guest',
      customerPhone: customerPhone.trim() || '+91 98000 00000',
      rating: ratingStars,
      feedback: feedbackText.trim(),
      dishOrdered: activePlacedOrder?.items?.map((i) => i.name).join(', ') || 'Table Dining Order',
      tableNo: rawTable,
      date: 'Just now',
      sentiment: ratingStars >= 4 ? 'positive' : ratingStars === 3 ? 'neutral' : 'negative',
      reply: null,
    };

    try {
      await createReviewApi({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '+91 98000 00000',
        rating: ratingStars,
        feedback: feedbackText.trim(),
        dishOrdered: activePlacedOrder?.items?.map((i) => i.name).join(', ') || 'Table Dining Order',
        tableNo: rawTable,
      });
      window.dispatchEvent(new Event('foodypay_review_created'));
    } catch (err) {
      console.warn('API review post error:', err);
    }

    setShowRatingModal(false);
    if (onShowToast) onShowToast('⭐ Thank you! Review saved directly to Dashboard.');
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const upiPayUrl = `upi://pay?pa=${storeInfo.upiId}&pn=${encodeURIComponent(storeInfo.name)}&am=${finalTotal}&cu=INR`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '90px' }}>
      
      {/* Mobile PWA / Web-App Extension Install Banner */}
      {showPwaInstallBanner && (
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFF',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px', border: '1px solid #FF5E14' }}>
              {storeInfo.logoUrl ? (
                <img src={storeInfo.logoUrl} alt={storeInfo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <img src="/Logo.png" alt="App Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
            <div>
              <strong>Install {storeInfo.name} App</strong>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Download app for exclusive offers &amp; live kitchen alerts!</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                alert(`📲 Web App Ready! Add ${storeInfo.name} to your Mobile Home Screen for 1-click ordering & birthday discounts.`);
                setShowPwaInstallBanner(false);
              }}
              style={{
                backgroundColor: '#FF5E14',
                color: '#FFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={13} /> Download App
            </button>
            <button
              onClick={() => setShowPwaInstallBanner(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: showPwaInstallBanner ? '44px' : 0,
        zIndex: 40,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {storeInfo.logoUrl ? (
                <img
                  src={storeInfo.logoUrl}
                  alt={storeInfo.name}
                  style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E2E8F0' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  boxShadow: '0 4px 12px rgba(255,94,20,0.3)'
                }}>
                  {storeInfo.name.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                    {storeInfo.name}
                  </h1>
                  <span style={{ fontSize: '10px', backgroundColor: '#DEF7EC', color: '#03543F', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    🟢 LIVE CATALOG
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px', color: '#64748B' }}>
                  <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontWeight: 700, padding: '2px 6px', borderRadius: '6px' }}>
                    Merchant ID: {storeInfo.merchantId}
                  </span>
                  <span>•</span>
                  <span style={{ backgroundColor: '#FFEDD5', color: '#C2410C', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                    📍 {storeInfo.table}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleShareLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#F1F5F9',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                {copiedLink ? <Check size={14} color="#16A34A" /> : <Share2 size={14} />}
                {copiedLink ? 'Copied!' : 'Share'}
              </button>

              <button
                onClick={() => setNavTab('profile')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: navTab === 'profile' ? '#FF5E14' : '#FFEDD5',
                  color: navTab === 'profile' ? '#FFFFFF' : '#C2410C',
                  border: '1.5px solid #FF5E14',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(255,94,20,0.15)'
                }}
                title="My Profile"
              >
                {customerName ? customerName.charAt(0).toUpperCase() : <User size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '16px 16px 100px' }}>

        {/* Live Order Tracker Banner */}
        {activePlacedOrder && (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #3B82F6',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 14px rgba(59,130,246,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={24} color="#2563EB" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E40AF' }}>
                    Order Placed! {activePlacedOrder.id}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#3B82F6' }}>
                    {activePlacedOrder.table} • {storeInfo.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRatingModal(true)}
                style={{
                  backgroundColor: '#FFF',
                  border: '1.5px solid #F59E0B',
                  color: '#D97706',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Star size={14} fill="#F59E0B" /> Give Rating &amp; Feedback
              </button>
            </div>

            {/* Dynamic Status Stepper */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 8px', fontSize: '11px', fontWeight: 700 }}>
              <span style={{ color: '#2563EB' }}>1. Order Placed ✓</span>
              <span style={{ color: activePlacedOrder.seen || activePlacedOrder.status !== 'new' ? '#2563EB' : '#94A3B8' }}>
                2. Staff Acknowledged {activePlacedOrder.seen || activePlacedOrder.status !== 'new' ? '👁️' : '⏳'}
              </span>
              <span style={{ color: activePlacedOrder.status === 'preparing' || activePlacedOrder.status === 'ready' || activePlacedOrder.status === 'completed' ? '#2563EB' : '#94A3B8' }}>
                3. Kitchen Preparing {activePlacedOrder.status === 'preparing' ? '🍳' : ''}
              </span>
              <span style={{ color: activePlacedOrder.status === 'ready' || activePlacedOrder.status === 'completed' ? '#16A34A' : '#94A3B8' }}>
                4. Food Ready / Served 🍽️
              </span>
            </div>

            <div style={{ backgroundColor: '#DBEAFE', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                backgroundColor: activePlacedOrder.status === 'completed' || activePlacedOrder.status === 'ready' ? '#16A34A' : '#2563EB',
                width: activePlacedOrder.status === 'completed' || activePlacedOrder.status === 'ready' ? '100%' : activePlacedOrder.status === 'preparing' ? '70%' : activePlacedOrder.seen ? '45%' : '20%',
                height: '100%',
                transition: 'width 0.4s ease'
              }} />
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#1E3A8A' }}>
              <span>Items: <strong>{activePlacedOrder.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</strong></span>
              <span>Total: <strong>₹{activePlacedOrder.total} ({activePlacedOrder.paymentLabel})</strong></span>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            VIEW 1: COUPONS & OFFERS TAB
            ----------------------------------------------------------------------- */}
        {navTab === 'coupons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ backgroundColor: '#FFEDD5', color: '#FF5E14', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                  <Tag size={22} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>Available Promo Coupons &amp; Offers</h2>
                  <div style={{ fontSize: '12.5px', color: '#64748B' }}>Apply coupons to get instant discounts on your order bill at {storeInfo.name}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {AVAILABLE_COUPONS.map((cp) => {
                const isApplied = appliedCoupon?.code === cp.code;
                return (
                  <div
                    key={cp.code}
                    style={{
                      backgroundColor: '#FFF',
                      borderRadius: '18px',
                      border: isApplied ? '2px solid #16A34A' : '1.5px dashed #FF5E14',
                      padding: '16px',
                      boxShadow: '0 4px 14px rgba(255,94,20,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ backgroundColor: isApplied ? '#DCFCE7' : '#FFEDD5', color: isApplied ? '#15803D' : '#C2410C', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>
                          {isApplied ? '✓ ACTIVE COUPON' : cp.badge}
                        </span>
                        <h3 style={{ margin: '8px 0 2px', fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>
                          {cp.discount}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                          {cp.desc}
                        </p>
                      </div>

                      <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.5px' }}>
                        {cp.code}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Min Order: ₹{cp.minOrder}</span>
                      <button
                        onClick={() => {
                          setAppliedCoupon({ code: cp.code, label: cp.discount });
                          if (onShowToast) onShowToast(`🎉 Promo Coupon ${cp.code} Applied!`);
                          setNavTab('menu');
                        }}
                        style={{
                          backgroundColor: isApplied ? '#16A34A' : '#FF5E14',
                          color: '#FFF',
                          border: 'none',
                          padding: '7px 16px',
                          borderRadius: '10px',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 3px 10px rgba(255,94,20,0.2)'
                        }}
                      >
                        {isApplied ? '✓ APPLIED' : 'APPLY COUPON'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            VIEW 2: MY PROFILE & BIRTHDAY REWARDS TAB
            ----------------------------------------------------------------------- */}
        {navTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Profile Header Card */}
            <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '24px', boxShadow: '0 4px 14px rgba(255,94,20,0.3)' }}>
                {customerName ? customerName.charAt(0).toUpperCase() : <User size={26} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#0F172A' }}>
                    {customerName || 'Dine-In Guest'}
                  </h2>
                  <span style={{ fontSize: '10px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                    ⭐ VIP GUEST
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                  {customerPhone || '+91 Mobile Not Added'} • Dining at <strong>{storeInfo.name} ({storeInfo.table})</strong>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#FF5E14" /> Update My Personal Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name (e.g. Rahul Sharma)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mobile Number (For order updates)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98123 45678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Date of Birth (For Birthday Offers &amp; Gifts 🎂)
                  </label>
                  <input
                    type="date"
                    value={customerDob}
                    onChange={(e) => setCustomerDob(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FF5E14', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 700 }}
                  />
                </div>

                <button
                  onClick={() => {
                    const profile = { name: customerName, phone: customerPhone, dob: customerDob };
                    localStorage.setItem('foodypay_customer_profile', JSON.stringify(profile));
                    if (onShowToast) onShowToast('💾 Profile Details Saved!');
                  }}
                  style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
                >
                  Save Profile Details
                </button>
              </div>
            </div>

            {/* Birthday Perk Alert Card */}
            <div style={{ backgroundColor: '#FFF7ED', border: '1.5px solid #FFD8A8', borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ backgroundColor: '#FFEDD5', color: '#C2410C', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                <Cake size={26} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, color: '#9A3412' }}>
                  {customerDob ? '🎂 Birthday Reward Active!' : '🎁 Unlock Birthday Special Perks!'}
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#C2410C', lineHeight: '1.4' }}>
                  {customerDob
                    ? `Your birthday is set for ${new Date(customerDob).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}. ${storeInfo.name} will send you automatic birthday gifts & 50% OFF coupons!`
                    : `Enter your Date of Birth above to receive free birthday treats & exclusive coupons from ${storeInfo.name}!`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            VIEW 3: MAIN FOOD MENU TAB
            ----------------------------------------------------------------------- */}
        {navTab === 'menu' && (
          <>
            {/* Search & Diet Toggle */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search dishes, snacks, beverages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    fontSize: '14px',
                    backgroundColor: '#FFF',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: '3px', borderRadius: '12px' }}>
                <button
                  onClick={() => setDietFilter('all')}
                  style={{
                    border: 'none',
                    backgroundColor: dietFilter === 'all' ? '#FFF' : 'transparent',
                    color: dietFilter === 'all' ? '#0F172A' : '#64748B',
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '99px',
                    cursor: 'pointer'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setDietFilter('veg')}
                  style={{
                    border: 'none',
                    backgroundColor: dietFilter === 'veg' ? '#16A34A' : 'transparent',
                    color: dietFilter === 'veg' ? '#FFF' : '#16A34A',
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '99px',
                    cursor: 'pointer'
                  }}
                >
                  🟢 Veg
                </button>
                <button
                  onClick={() => setDietFilter('nonveg')}
                  style={{
                    border: 'none',
                    backgroundColor: dietFilter === 'nonveg' ? '#DC2626' : 'transparent',
                    color: dietFilter === 'nonveg' ? '#FFF' : '#DC2626',
                    fontWeight: 700,
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '99px',
                    cursor: 'pointer'
                  }}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>

            {/* Categories Bar */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', scrollbarWidth: 'none' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: selectedCategory === cat ? 'none' : '1px solid #E2E8F0',
                    backgroundColor: selectedCategory === cat ? '#FF5E14' : '#FFF',
                    color: selectedCategory === cat ? '#FFF' : '#475569',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: selectedCategory === cat ? '0 4px 10px rgba(255,94,20,0.25)' : 'none'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Combos Section - Only rendered if merchant created custom meal combos! */}
            {combos.length > 0 && selectedCategory === 'All' && !searchQuery && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Sparkles color="#FF5E14" size={20} />
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Chef Special Meal Combos</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {combos.map((combo) => (
                    <div
                      key={combo.id}
                      style={{
                        backgroundColor: '#FFF',
                        borderRadius: '16px',
                        border: '1px solid #FFE4D6',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <img
                        src={combo.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'}
                        alt={combo.name}
                        style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '10px', backgroundColor: '#FFEDD5', color: '#C2410C', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>
                          SAVINGS COMBO
                        </span>
                        <h3 style={{ margin: '4px 0 2px', fontSize: '14px', fontWeight: 700 }}>{combo.name}</h3>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {combo.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '15px', color: '#FF5E14' }}>₹{combo.comboPrice}</span>
                          <button
                            onClick={() => {
                              updateCartQty(combo.id, 1);
                              if (onShowToast) onShowToast(`Added ${combo.name} to Cart!`);
                            }}
                            style={{
                              backgroundColor: '#FF5E14',
                              color: '#FFF',
                              border: 'none',
                              padding: '4px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + Add Combo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dish List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDishes.map((dish) => {
                const qty = cart[dish.id] || 0;
                const inStock = dish.inStock !== false;
                return (
                  <div
                    key={dish.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      padding: '14px',
                      display: 'flex',
                      gap: '14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      opacity: inStock ? 1 : 0.6
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img
                        src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'}
                        alt={dish.name}
                        style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #F1F5F9' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80';
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: dish.isVeg ? '#16A34A' : '#DC2626'
                      }}>
                        {dish.isVeg ? '🟢 VEG' : '🔴 NON-VEG'}
                      </span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                          {dish.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                          {dish.desc || 'Prepared fresh with high quality ingredients.'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                        <div>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>₹{dish.price}</span>
                        </div>

                        {!inStock ? (
                          <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 800, backgroundColor: '#FEF2F2', padding: '4px 10px', borderRadius: '8px' }}>
                            Sold Out
                          </span>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => updateCartQty(dish.id, 1)}
                            style={{
                              backgroundColor: '#FFF',
                              color: '#FF5E14',
                              border: '1.5px solid #FF5E14',
                              borderRadius: '10px',
                              padding: '6px 16px',
                              fontSize: '13px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(255,94,20,0.1)'
                            }}
                          >
                            + ADD
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FF5E14', borderRadius: '10px', padding: '4px 8px' }}>
                            <button
                              onClick={() => updateCartQty(dish.id, -1)}
                              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ color: '#FFF', fontWeight: 800, fontSize: '14px', minWidth: '16px', textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() => updateCartQty(dish.id, 1)}
                              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* Floating Bottom Cart Summary Bar (Renders when cart has items) */}
      {getCartCount() > 0 && navTab === 'menu' && (
        <div style={{
          position: 'fixed',
          bottom: '74px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '736px',
          backgroundColor: '#0F172A',
          color: '#FFF',
          borderRadius: '16px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 80,
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.4)'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>{getCartCount()} ITEMS ADDED</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFF' }}>
              ₹{finalTotal} <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>(₹{subtotal} + 5% GST)</span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: '#FF5E14',
              color: '#FFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255,94,20,0.4)'
            }}
          >
            View Cart &amp; Pay <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* APP-LIKE FIXED BOTTOM NAVIGATION BAR */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 90,
        boxShadow: '0 -4px 18px rgba(0,0,0,0.06)'
      }}>
        <button
          onClick={() => setNavTab('menu')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: navTab === 'menu' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'menu' ? 800 : 600,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <Utensils size={20} color={navTab === 'menu' ? '#FF5E14' : '#64748B'} />
          <span>Menu</span>
        </button>

        <button
          onClick={() => setNavTab('coupons')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: navTab === 'coupons' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'coupons' ? 800 : 600,
            fontSize: '11px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Tag size={20} color={navTab === 'coupons' ? '#FF5E14' : '#64748B'} />
          <span>Coupons</span>
          <span style={{ position: 'absolute', top: '-4px', right: '-8px', backgroundColor: '#FF5E14', color: '#FFF', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '8px' }}>
            OFFERS
          </span>
        </button>

        <button
          onClick={() => setNavTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: navTab === 'profile' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'profile' ? 800 : 600,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <User size={20} color={navTab === 'profile' ? '#FF5E14' : '#64748B'} />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            color: getCartCount() > 0 ? '#FF5E14' : '#64748B',
            fontWeight: getCartCount() > 0 ? 800 : 600,
            fontSize: '11px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <ShoppingBag size={20} color={getCartCount() > 0 ? '#FF5E14' : '#64748B'} />
          <span>Cart</span>
          {getCartCount() > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-6px', backgroundColor: '#FF5E14', color: '#FFF', fontSize: '10px', fontWeight: 900, padding: '1px 6px', borderRadius: '10px' }}>
              {getCartCount()}
            </span>
          )}
        </button>
      </div>

      {/* Checkout Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            overflowY: 'auto',
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>Your Food Order</h2>
                <span style={{ fontSize: '12px', color: '#64748B' }}>{storeInfo.name} • <strong>{storeInfo.table}</strong></span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            <form onSubmit={handleInitiateOrder}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Your Name <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name (e.g. Rahul Sharma)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Dine-In Table
                  </label>
                  <input
                    type="text"
                    disabled
                    value={storeInfo.table}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#475569',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '14px', marginBottom: '20px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '6px' }}>
                  <span>Item Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
                  <span>GST Tax ({storeInfo.gstPercent}%)</span>
                  <span>+₹{gstAmount}</span>
                </div>
                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  <span>Total Amount Payable</span>
                  <span style={{ color: '#FF5E14' }}>₹{finalTotal}</span>
                </div>
              </div>

              {/* Payment Option Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Select Payment Option
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    style={{
                      border: paymentMode === 'upi' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                      backgroundColor: paymentMode === 'upi' ? '#FFF7ED' : '#FFF',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: paymentMode === 'upi' ? '#C2410C' : '#475569'
                    }}
                  >
                    <QrCode size={18} color="#FF5E14" /> Pay via Online UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    style={{
                      border: paymentMode === 'cash' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                      backgroundColor: paymentMode === 'cash' ? '#FFF7ED' : '#FFF',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: paymentMode === 'cash' ? '#C2410C' : '#475569'
                    }}
                  >
                    <CreditCard size={18} color="#059669" /> Cash at Counter
                  </button>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,94,20,0.35)'
                }}
              >
                {paymentMode === 'upi' ? 'Proceed to Online UPI Payment (₹' + finalTotal + ') →' : 'Send Order to Kitchen (₹' + finalTotal + ') →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Online UPI QR Payment Modal */}
      {showUpiModal && pendingOrderObj && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '24px',
            maxWidth: '420px',
            width: '100%',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>
              Scan QR & Pay via UPI
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
              Merchant: <strong>{storeInfo.name}</strong> • UPI: <code>{storeInfo.upiId}</code>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'inline-block', marginBottom: '16px' }}>
              <QrCodeComponent
                text={upiPayUrl}
                size={180}
                qrColor="#0F172A"
                cornerColor="#FF5E14"
                showLogo={true}
              />
            </div>

            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FF5E14', marginBottom: '16px' }}>
              ₹{pendingOrderObj.total}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => finalizeAndSaveOrder(pendingOrderObj)}
                style={{
                  width: '100%',
                  backgroundColor: '#16A34A',
                  color: '#FFF',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                ✅ Confirm Payment Success & Send to Kitchen
              </button>

              <button
                onClick={() => setShowUpiModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel / Change Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date of Birth Prompt Modal (Appears After First Order) */}
      {showDobModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowDobModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
            >
              <X size={16} color="#475569" />
            </button>

            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#FFEDD5', color: '#C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Cake size={32} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>
              🎂 Get Birthday Gifts &amp; Free Offers!
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
              Enter your Date of Birth below. On your Birthday, <strong>{storeInfo.name}</strong> will send you an automated special birthday discount &amp; complimentary dish!
            </p>

            <form onSubmit={handleSaveDobSubmit}>
              <div style={{ marginBottom: '18px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Select Your Date of Birth <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={customerDob}
                  onChange={(e) => setCustomerDob(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #FF5E14',
                    fontSize: '15px',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFF7ED',
                    color: '#C2410C'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255,94,20,0.35)'
                }}
              >
                🎁 Save Birthday &amp; Claim Birthday Offers
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Rating & Feedback Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowRatingModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
            >
              <X size={16} color="#475569" />
            </button>

            <form onSubmit={handleSubmitReview}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Award size={36} color="#FF5E14" style={{ marginBottom: '6px' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Rate Your Dining Experience</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748B' }}>
                  How was your ordering &amp; food experience at <strong>{storeInfo.name}</strong>?
                </p>
              </div>

              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <Star
                      size={32}
                      color="#F59E0B"
                      fill={star <= ratingStars ? '#F59E0B' : 'transparent'}
                    />
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Feedback &amp; Comments <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us what you loved about the food &amp; QR service..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                ⭐ Submit Feedback to Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
