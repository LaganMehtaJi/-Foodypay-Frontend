import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
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
  Edit3,
  Home as HomeIcon,
  MapPin,
  Briefcase,
  Camera,
  History,
  Flame,
  Compass,
  Trash2,
  Mail,
  Store,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { playOrderPlaced } from '../utils/soundEffects';
import { QrCodeComponent } from '../utils/qrGenerator';
import { fetchDishesApi, fetchPublicDishesApi, fetchPublicMerchantApi, fetchPublicCouponsApi, createReviewApi, createPublicOrderApi, createRazorpayOrderApi, verifyRazorpaySignatureApi } from '../utils/api';

const AVAILABLE_COUPONS = [];

// Rich Image-Based Category Cards for Food Delivery Home Screen
const HOME_IMAGE_CATEGORIES = [
  { id: 'All', name: 'All Items', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&auto=format&fit=crop&q=80', count: '10+ Items' },
  { id: 'Pizza', name: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80', count: 'Cheesy Slices' },
  { id: 'Burgers', name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80', count: 'Juicy Buns' },
  { id: 'Main Course', name: 'Thalis & Mains', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80', count: 'Rich Meals' },
  { id: 'Beverages', name: 'Drinks & Shakes', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300&auto=format&fit=crop&q=80', count: 'Cool Beverages' },
  { id: 'Desserts', name: 'Desserts', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300&auto=format&fit=crop&q=80', count: 'Sweet Treats' },
  { id: 'Snacks', name: 'Snacks & Starters', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=300&auto=format&fit=crop&q=80', count: 'Quick Bites' },
  { id: 'Healthy', name: 'Salads & Bowls', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80', count: 'Fresh Greens' }
];

const getFallbackFoodImage = (name = '', category = '') => {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('pizza') || c.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80';
  if (n.includes('burger') || c.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80';
  if (n.includes('fries') || n.includes('snack') || c.includes('starter')) return 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=80';
  if (n.includes('shake') || n.includes('drink') || n.includes('coke') || n.includes('coffee') || c.includes('beverage')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80';
  if (n.includes('roll') || n.includes('wrap')) return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80';
  if (n.includes('paneer') || n.includes('thali') || n.includes('dal') || n.includes('curry') || n.includes('roti') || n.includes('naan')) return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80';
  if (n.includes('cake') || n.includes('dessert') || n.includes('sweet') || n.includes('ice cream')) return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
};

const getDishImageUrl = (dish) => {
  if (dish && typeof dish.image === 'string' && dish.image.trim() !== '' && !dish.image.includes('placeholder')) {
    return dish.image;
  }
  return getFallbackFoodImage(dish ? dish.name : '', dish ? dish.category : '');
};

export default function CustomerMenuPage({ onShowToast }) {
  const routeParams = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract parameters from route params, hash routing (#/), or search query
  const getEffectiveParams = () => {
    let slug = routeParams.restaurantSlug;
    let merchant = routeParams.merchantId;
    let table = routeParams.tableId;

    if (!slug || slug === 'undefined') {
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.get('slug')) slug = queryParams.get('slug');
      if (queryParams.get('merchant')) merchant = queryParams.get('merchant');
      if (queryParams.get('table')) table = queryParams.get('table');

      if (location.hash && location.hash.includes('/')) {
        const parts = location.hash.replace('#/', '').replace('#', '').split('/');
        if (parts.length >= 2) {
          slug = parts[0];
          merchant = parts[1];
          table = parts[2] || table;
        }
      }
    }

    return {
      restaurantSlug: slug,
      merchantId: merchant,
      tableId: table,
    };
  };

  const { restaurantSlug, merchantId, tableId } = getEffectiveParams();

  // App Navigation 5 Bottom Tabs ('home' | 'orders' | 'scanner' | 'coupons' | 'profile')
  const [navTab, setNavTab] = useState('home');

  const formatSlug = (str) => {
    if (!str) return '';
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const rawRestName = formatSlug(restaurantSlug || 'FoodyPay Store');
  const rawTable = tableId ? formatSlug(tableId).replace(/tabel/gi, 'Table') : 'Table 1';
  const effectiveMerchantId = merchantId || 'FP-985569';

  // Store & Catalog Datasets
  const [storeInfo, setStoreInfo] = useState({
    name: rawRestName,
    merchantId: effectiveMerchantId,
    table: rawTable,
    logoUrl: '',
    gstPercent: 5,
    upiId: 'lagandhaba@icici',
    rating: 4.8,
    deliveryTime: '15-25 min'
  });

  const [dishes, setDishes] = useState([]);
  const [combos, setCombos] = useState([]);
  const [dbCoupons, setDbCoupons] = useState([]);
  const [cart, setCart] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState('all');

  // Customer Profile & Saved Addresses State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [customerDob, setCustomerDob] = useState('');
  const [showDobModal, setShowDobModal] = useState(false);
  const [showPwaInstallBanner, setShowPwaInstallBanner] = useState(true);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrFlat, setNewAddrFlat] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');

  // Orders State
  const [customerOrders, setCustomerOrders] = useState([]);

  // Camera Table QR Scanner State
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualQrInput, setManualQrInput] = useState('');

  // Cart & Checkout state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [chefNote, setChefNote] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi'); // 'upi' | 'cash'
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Online UPI QR Modal state
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [pendingOrderObj, setPendingOrderObj] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Rating & Feedback Modal State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  // Active Placed Order Tracker state
  const [activePlacedOrder, setActivePlacedOrder] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load saved customer profile & addresses from localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('foodypay_customer_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name) setCustomerName(p.name);
        if (p.phone) setCustomerPhone(p.phone);
        if (p.dob) setCustomerDob(p.dob);
        if (p.email) setCustomerEmail(p.email);
        if (p.photo) setCustomerPhoto(p.photo);
      }

      const savedAddrs = localStorage.getItem('foodypay_saved_addresses');
      if (savedAddrs) {
        const parsed = JSON.parse(savedAddrs);
        if (Array.isArray(parsed)) {
          const realAddrs = parsed.filter(a => a.text && !a.text.includes('Sector 62, Noida') && !a.text.includes('DLF Phase 2'));
          setSavedAddresses(realAddrs);
          localStorage.setItem('foodypay_saved_addresses', JSON.stringify(realAddrs));
        } else {
          setSavedAddresses([]);
        }
      } else {
        setSavedAddresses([]);
      }
    } catch (e) {}
  }, []);

  // Load customer order history
  const loadCustomerOrders = () => {
    try {
      const saved = localStorage.getItem('foodypay_crm_orders_v3');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          setCustomerOrders(list);
          if (list.length > 0 && !activePlacedOrder) {
            const latest = list[0];
            if (latest.status !== 'completed' && latest.status !== 'cancelled') {
              setActivePlacedOrder(latest);
            }
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadCustomerOrders();
    window.addEventListener('storage', loadCustomerOrders);
    return () => window.removeEventListener('storage', loadCustomerOrders);
  }, []);

  // Auto-save user profile details to localStorage
  useEffect(() => {
    try {
      if (customerName || customerPhone || customerDob || customerEmail || customerPhoto) {
        const profile = { name: customerName, phone: customerPhone, dob: customerDob, email: customerEmail, photo: customerPhoto };
        localStorage.setItem('foodypay_customer_profile', JSON.stringify(profile));
      }
    } catch (e) {}
  }, [customerName, customerPhone, customerDob, customerEmail, customerPhoto]);

  // Load menu dataset dynamically from Server API
  const loadDynamicMenu = async () => {
    try {
      const targetIdentifier = merchantId || restaurantSlug || 'FP-985569';

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
      } catch (e) {}

      const normalizeDishes = (list) => {
        if (!Array.isArray(list)) return [];
        return list.map((item, idx) => ({
          ...item,
          id: String(item.id || item._id || `d_${idx}_${(item.name || 'dish').toLowerCase().replace(/[^a-z0-9]/g, '_')}`),
          price: Number(item.price || item.comboPrice || 0),
        }));
      };

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
      try {
        const apiCoupons = await fetchPublicCouponsApi(customerPhone, customerEmail, effectiveMerchantId);
        if (Array.isArray(apiCoupons)) {
          setDbCoupons(apiCoupons);
        }
      } catch (cpErr) {}
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

  // Dynamic favicon & title
  useEffect(() => {
    const effectiveLogo = storeInfo.logoUrl || '/Logo.png';
    const effectiveName = storeInfo.name || 'FoodyPay App';
    document.title = `${effectiveName} | Food Delivery & Dine-In`;

    let iconLink = document.querySelector("link[rel*='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = effectiveLogo;
  }, [storeInfo.logoUrl, storeInfo.name]);

  // Camera QR Code Scanner controls
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      setCameraError('Unable to open camera feed. Enter Table QR Code or URL manually below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (navTab !== 'scanner') {
      stopCamera();
    }
  }, [navTab]);

  const handleManualQrSubmit = (e) => {
    e.preventDefault();
    if (!manualQrInput.trim()) return;

    let target = manualQrInput.trim();
    if (target.startsWith('http://') || target.startsWith('https://')) {
      try {
        const parsedUrl = new URL(target);
        target = parsedUrl.pathname + parsedUrl.hash;
      } catch (err) {}
    }

    if (onShowToast) onShowToast(` Switching to Table QR: ${target}`);
    if (target.includes('/')) {
      navigate(target.startsWith('/') ? target : `/${target}`);
    } else {
      navigate(`/${target}/${effectiveMerchantId}/table-1`);
    }
    setIsCameraActive(false);
  };

  // Saved Addresses handlers
  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddrText.trim()) return;

    const newAddr = {
      id: `addr_${Date.now()}`,
      label: newAddrLabel,
      flat: newAddrFlat.trim(),
      text: newAddrText.trim(),
      landmark: newAddrLandmark.trim(),
      isDefault: savedAddresses.length === 0,
    };

    const updated = [newAddr, ...savedAddresses];
    setSavedAddresses(updated);
    localStorage.setItem('foodypay_saved_addresses', JSON.stringify(updated));

    setNewAddrText('');
    setNewAddrFlat('');
    setNewAddrLandmark('');
    setShowAddressForm(false);
    if (onShowToast) onShowToast(` Saved address (${newAddrLabel}) added!`);
  };

  const handleDeleteAddress = (id) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem('foodypay_saved_addresses', JSON.stringify(updated));
    if (onShowToast) onShowToast('Address removed');
  };

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

  const getAssignedCouponsForUser = () => {
    let list = [];

    // 1. Process DB coupons created from POS Dashboard
    if (Array.isArray(dbCoupons) && dbCoupons.length > 0) {
      dbCoupons.forEach((c) => {
        const isAssigned =
          c.assignedToAll ||
          (c.assignedCustomerPhone && customerPhone && c.assignedCustomerPhone.includes(customerPhone.trim())) ||
          (c.assignedCustomerEmail && customerEmail && c.assignedCustomerEmail.toLowerCase() === customerEmail.trim().toLowerCase()) ||
          (c.assignedCustomerName && customerName && c.assignedCustomerName.toLowerCase().includes(customerName.trim().toLowerCase()));

        if (isAssigned) {
          list.push({
            code: c.code,
            type: c.type ? `${c.type.toUpperCase()} DISCOUNT` : 'STORE VOUCHER',
            discount: c.discount || `Discount Code ${c.code}`,
            minOrder: c.minOrder || 199,
            desc: c.description || 'Voucher assigned to your account from dashboard',
            badge: c.assignedToAll ? 'STORE OFFER' : 'EXCLUSIVE VIP',
            assignedReason: c.assignedToAll ? 'Available to Store Diners' : `Assigned to ${customerName || customerPhone || 'You'}`
          });
        }
      });
    }

    // 2. Process Local CRM coupons created from POS Dashboard (if any)
    try {
      const savedCrmCoupons = localStorage.getItem('foodypay_crm_coupons_v1');
      if (savedCrmCoupons) {
        const parsed = JSON.parse(savedCrmCoupons);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (!list.some(existing => existing.code === c.code)) {
              const isTargetUser =
                c.assignedToAll ||
                (c.targetPhone && customerPhone && c.targetPhone.includes(customerPhone.trim())) ||
                (c.targetName && customerName && c.targetName.toLowerCase().includes(customerName.trim().toLowerCase()));

              if (isTargetUser) {
                list.push({
                  code: c.code || 'VIPOFFER',
                  type: c.discount || 'SPECIAL OFFER',
                  discount: c.title || c.discount || 'Assigned VIP Discount',
                  minOrder: c.minOrder || 149,
                  desc: c.description || 'Exclusive voucher assigned specifically to your mobile account',
                  badge: c.badge || 'VIP VOUCHER',
                  assignedReason: c.targetPhone ? 'Personal VIP Gift' : 'Store Member Offer'
                });
              }
            }
          });
        }
      }
    } catch (e) {}

    return list;
  };

  const handleInitiateOrder = async (e) => {
    e.preventDefault();
    if (isSubmittingOrder) return;

    if (getCartCount() === 0) {
      if (onShowToast) onShowToast('Your cart is empty!');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter your name for order identification!');
      return;
    }

    setIsSubmittingOrder(true);

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
      type: navTab === 'scanner' ? 'Dine-In' : 'Home Delivery',
      table: navTab === 'scanner' ? rawTable : 'Delivery',
      customer: customerName.trim(),
      phone: customerPhone.trim() || '+91 98000 00000',
      time: 'Just now',
      timestamp: Date.now(),
      status: 'new',
      seen: false,
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

    if (paymentMode === 'upi' || paymentMode === 'razorpay') {
      setPendingOrderObj(newOrder);

      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      try {
        const rzpRes = await createRazorpayOrderApi({
          amount: newOrder.total,
          currency: 'INR',
          merchantId: storeInfo.merchantId,
          foodypayId: effectiveMerchantId,
          orderId: newOrder.id,
        });

        if (rzpRes && rzpRes.routingMode === 'merchant_upi') {
          setShowUpiModal(true);
          setIsCartOpen(false);
          setIsSubmittingOrder(false);
          return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (scriptLoaded && window.Razorpay && rzpRes && rzpRes.razorpayOrderId) {
          const options = {
            key: rzpRes.keyId || 'rzp_test_FoodyPayDefaultKey123',
            amount: rzpRes.amount,
            currency: rzpRes.currency || 'INR',
            name: storeInfo.name || 'FoodyPay Order',
            description: `Order ${newOrder.id} at ${storeInfo.name}`,
            image: storeInfo.logoUrl || '/Logo.png',
            order_id: rzpRes.razorpayOrderId,
            handler: async function (response) {
              try {
                await verifyRazorpaySignatureApi({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: newOrder.id,
                  merchantId: storeInfo.merchantId,
                });
              } catch (e) {}

              const paidOrder = {
                ...newOrder,
                paymentStatus: 'paid-razorpay',
                paymentLabel: 'Paid via Razorpay',
              };
              finalizeAndSaveOrder(paidOrder);
            },
            prefill: {
              name: customerName,
              contact: customerPhone,
            },
            theme: {
              color: '#FF5E14',
            },
          };

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.open();
          setIsCartOpen(false);
          setIsSubmittingOrder(false);
          return;
        }
      } catch (err) {}

      setShowUpiModal(true);
      setIsCartOpen(false);
      setIsSubmittingOrder(false);
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
      setCustomerOrders(list);

      playOrderPlaced();
      window.dispatchEvent(new Event('foodypay_order_created'));

      const bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.postMessage({ type: 'ORDER_CREATED', order: orderObj });
      bc.close();
    } catch (err) {}

    try {
      await createPublicOrderApi({
        merchantId: storeInfo.merchantId,
        foodypayId: effectiveMerchantId,
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
    } catch (err) {}

    setActivePlacedOrder(orderObj);
    setIsCartOpen(false);
    setShowUpiModal(false);
    setCart({});
    setIsSubmittingOrder(false);

    if (!customerDob) {
      setTimeout(() => {
        setShowDobModal(true);
      }, 1200);
    }

    if (onShowToast) onShowToast(` Order ${orderObj.id} placed successfully!`);
  };

  const handleReorder = (order) => {
    if (!order || !order.items) return;
    const newCart = { ...cart };
    order.items.forEach(item => {
      const key = String(item.id || item._id);
      newCart[key] = (newCart[key] || 0) + (Number(item.qty) || 1);
    });
    setCart(newCart);
    setNavTab('home');
    setIsCartOpen(true);
    if (onShowToast) onShowToast(' Previous order items added to cart!');
  };

  const handleSaveDobSubmit = (e) => {
    e.preventDefault();
    if (!customerDob) return;

    try {
      const dobDate = new Date(customerDob);
      const formattedDate = dobDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const now = new Date();
      const isToday = now.getMonth() === dobDate.getMonth() && now.getDate() === dobDate.getDate();

      const profile = { name: customerName, phone: customerPhone, dob: customerDob, email: customerEmail, photo: customerPhoto };
      localStorage.setItem('foodypay_customer_profile', JSON.stringify(profile));

      const newCustObj = {
        id: `c_${Date.now()}`,
        name: customerName.trim() || 'Guest',
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
    if (onShowToast) onShowToast(' Birthday saved! You will receive special gift offers on your birthday!');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    try {
      await createReviewApi({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '+91 98000 00000',
        rating: ratingStars,
        feedback: feedbackText.trim(),
        dishOrdered: activePlacedOrder?.items?.map((i) => i.name).join(', ') || 'Food Order',
        tableNo: rawTable,
      });
      window.dispatchEvent(new Event('foodypay_review_created'));
    } catch (err) {}

    setShowRatingModal(false);
    if (onShowToast) onShowToast('⭐ Thank you! Review submitted.');
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const upiPayUrl = `upi://pay?pa=${storeInfo.upiId}&pn=${encodeURIComponent(storeInfo.name)}&am=${finalTotal}&cu=INR`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', color: '#1E293B', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '90px' }}>
      
      {/* Light Mobile PWA Web App Install Banner */}
      {showPwaInstallBanner && (
        <div style={{
          backgroundColor: '#F8FAFC',
          color: '#334155',
          borderBottom: '1px solid #E2E8F0',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontWeight: 400,
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px', border: '1px solid #CBD5E1' }}>
              {storeInfo.logoUrl ? (
                <img src={storeInfo.logoUrl} alt={storeInfo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <img src="/Logo.png" alt="App Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )}
            </div>
            <div>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Install FoodyPay App</span>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>Fast 1-click food ordering</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                alert(` FoodyPay Web App Ready! Add to your Home Screen for fast 1-click food ordering.`);
                setShowPwaInstallBanner(false);
              }}
              style={{
                backgroundColor: '#FF5E14',
                color: '#FFF',
                border: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={12} /> Install
            </button>
            <button
              onClick={() => setShowPwaInstallBanner(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '15px', fontWeight: 400 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header - Clean Delivery Style Header on Home, Table Info on Scanner */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #F1F5F9',
        position: 'sticky',
        top: showPwaInstallBanner ? '42px' : 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        userSelect: 'none'
      }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            
            {/* Left Header Brand info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {storeInfo.logoUrl ? (
                <img
                  src={storeInfo.logoUrl}
                  alt={storeInfo.name}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FFF7ED',
                  color: '#FF5E14',
                  border: '1px solid #FFEDD5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                  fontSize: '17px',
                  flexShrink: 0
                }}>
                  {storeInfo.name.charAt(0)}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navTab === 'home' ? (
                  /* REGULAR FOOD DELIVERY HEADER (NO Table No or QR Info) */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em' }}>
                        FoodyPay Delivery
                      </h1>
                      <span style={{ fontSize: '10px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '12px', fontWeight: 500 }}>
                         15-25 min
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="#FF5E14" />
                      <span>{savedAddresses.length > 0 ? savedAddresses[0].text : 'Select Delivery Location'}</span>
                    </div>
                  </>
                ) : (
                  /* SCANNER / TABLE DINE-IN HEADER */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#0F172A', letterSpacing: '-0.01em' }}>
                        {storeInfo.name}
                      </h1>
                      <span style={{ fontSize: '10px', backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                         Live QR Menu
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', fontWeight: 400 }}>
                      <span style={{ backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 500, padding: '1px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                        {storeInfo.merchantId}
                      </span>
                      <span style={{ backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 500, padding: '1px 6px', borderRadius: '4px', border: '1px solid #FFEDD5' }}>
                         {storeInfo.table}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={handleShareLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '5px 10px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  color: '#475569',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none'
                }}
              >
                {copiedLink ? <Check size={13} color="#16A34A" /> : <Share2 size={13} />}
                <span>{copiedLink ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={() => setNavTab('profile')}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: navTab === 'profile' ? '#FF5E14' : '#FFF7ED',
                  color: navTab === 'profile' ? '#FFFFFF' : '#C2410C',
                  border: '1px solid #FFEDD5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                  lineHeight: 1
                }}
                title="My Profile"
              >
                {customerName ? customerName.charAt(0).toUpperCase() : <User size={15} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Workspace */}
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '14px 14px 90px' }}>

        {/* Light Active Order Tracker Banner */}
        {activePlacedOrder && (
          <div style={{
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#0284C7" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 600, color: '#0369A1' }}>
                    Active Order {activePlacedOrder.id}
                  </h3>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#0284C7', fontWeight: 400 }}>
                    {activePlacedOrder.type} • {activePlacedOrder.table !== 'Delivery' ? activePlacedOrder.table : 'Home Delivery'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRatingModal(true)}
                style={{
                  backgroundColor: '#FFF',
                  border: '1px solid #FCD34D',
                  color: '#D97706',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Star size={13} fill="#F59E0B" /> Rate Food
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 6px', fontSize: '11px', fontWeight: 500 }}>
              <span style={{ color: '#0284C7' }}>1. Placed </span>
              <span style={{ color: activePlacedOrder.seen || activePlacedOrder.status !== 'new' ? '#0284C7' : '#94A3B8' }}>
                2. Acknowledged {activePlacedOrder.seen || activePlacedOrder.status !== 'new' ? '️' : '⏳'}
              </span>
              <span style={{ color: activePlacedOrder.status === 'preparing' || activePlacedOrder.status === 'ready' || activePlacedOrder.status === 'completed' ? '#0284C7' : '#94A3B8' }}>
                3. Preparing 
              </span>
              <span style={{ color: activePlacedOrder.status === 'ready' || activePlacedOrder.status === 'completed' ? '#059669' : '#94A3B8' }}>
                4. Delivered / Served ️
              </span>
            </div>

            <div style={{ backgroundColor: '#E0F2FE', height: '4px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                backgroundColor: activePlacedOrder.status === 'completed' || activePlacedOrder.status === 'ready' ? '#10B981' : '#0284C7',
                width: activePlacedOrder.status === 'completed' || activePlacedOrder.status === 'ready' ? '100%' : activePlacedOrder.status === 'preparing' ? '70%' : activePlacedOrder.seen ? '45%' : '20%',
                height: '100%',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 1: HOME (REGULAR FOOD DELIVERY HOME SCREEN - NO TABLE / QR INFO)
            ----------------------------------------------------------------------- */}
        {navTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Delivery Style Search Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              border: '1px solid #FED7AA',
              borderRadius: '16px',
              padding: '16px',
              color: '#9A3412'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ backgroundColor: '#FFF', color: '#C2410C', padding: '2px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 500, border: '1px solid #FFEDD5' }}>
                   Express Food Delivery
                </span>
                <span style={{ fontSize: '11.5px', color: '#C2410C', fontWeight: 500 }}>
                  Offer 50% OFF Applied
                </span>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#7C2D12', lineHeight: '1.3' }}>
                What are you craving today?
              </h2>

              {/* Light Search Box */}
              <div style={{ position: 'relative', marginTop: '12px' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search dishes, burgers, pizza, thalis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid #FDBA74',
                    outline: 'none',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    boxSizing: 'border-box',
                    fontWeight: 400
                  }}
                />
              </div>
            </div>

            {/* CLEAR IMAGE-BASED CATEGORY CARDS (Replaces small icons) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Explore Categories</h3>
                <span style={{ fontSize: '11.5px', color: '#FF5E14', fontWeight: 500 }}>{HOME_IMAGE_CATEGORIES.length} Categories</span>
              </div>

              {/* Horizontal Scrollable Image Category Cards */}
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
                {HOME_IMAGE_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: '#FFF',
                        border: isSelected ? '2px solid #FF5E14' : '1px solid #E2E8F0',
                        borderRadius: '14px',
                        padding: '6px',
                        cursor: 'pointer',
                        minWidth: '94px',
                        maxWidth: '94px',
                        boxShadow: isSelected ? '0 3px 10px rgba(255,94,20,0.15)' : '0 1px 3px rgba(0,0,0,0.03)',
                        flexShrink: 0,
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        style={{ width: '82px', height: '64px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '11.5px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#FF5E14' : '#0F172A', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                        {cat.name}
                      </span>
                      <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 400 }}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Diet Filter Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: '8px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#475569' }}>Dietary Filter</span>
              <div style={{ display: 'flex', backgroundColor: '#F8FAFC', padding: '2px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                <button
                  onClick={() => setDietFilter('all')}
                  style={{ border: 'none', backgroundColor: dietFilter === 'all' ? '#FFF' : 'transparent', color: dietFilter === 'all' ? '#0F172A' : '#64748B', fontWeight: 500, fontSize: '11.5px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  All
                </button>
                <button
                  onClick={() => setDietFilter('veg')}
                  style={{ border: 'none', backgroundColor: dietFilter === 'veg' ? '#10B981' : 'transparent', color: dietFilter === 'veg' ? '#FFF' : '#10B981', fontWeight: 500, fontSize: '11.5px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                   Veg
                </button>
                <button
                  onClick={() => setDietFilter('nonveg')}
                  style={{ border: 'none', backgroundColor: dietFilter === 'nonveg' ? '#EF4444' : 'transparent', color: dietFilter === 'nonveg' ? '#FFF' : '#EF4444', fontWeight: 500, fontSize: '11.5px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                   Non-Veg
                </button>
              </div>
            </div>

            {/* BLINKIT-STYLE PRODUCTS GRID (REPLACES POPULAR DISHES) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                  {selectedCategory === 'All' ? 'Instant Food Items' : `${selectedCategory}`}
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 400 }}>{filteredDishes.length} Items</span>
              </div>

              {filteredDishes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', backgroundColor: '#FFF', borderRadius: '14px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
                  <Utensils size={32} color="#94A3B8" style={{ marginBottom: '6px' }} />
                  <div style={{ fontSize: '14.5px', fontWeight: 500, color: '#0F172A' }}>No dishes found</div>
                  <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: 400 }}>Try adjusting your search or diet filter.</div>
                </div>
              ) : (
                /* Blinkit-Style Responsive Product Cards Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                  {filteredDishes.map((dish) => {
                    const qty = cart[dish.id] || 0;
                    const inStock = dish.inStock !== false;
                    const imgUrl = getDishImageUrl(dish);

                    return (
                      <div
                        key={dish.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          border: '1px solid #E2E8F0',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                          opacity: inStock ? 1 : 0.6
                        }}
                      >
                        {/* Product Image & Veg/Non-Veg Badge */}
                        <div style={{ position: 'relative', width: '100%', height: '135px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F8FAFC', marginBottom: '10px' }}>
                          <img
                            src={imgUrl}
                            alt={dish.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackFoodImage(dish.name, dish.category);
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              left: '6px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                              border: '1px solid #E2E8F0'
                            }}
                          >
                            <div style={{ width: '11px', height: '11px', border: `1.5px solid ${dish.isVeg ? '#16A34A' : '#DC2626'}`, padding: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: dish.isVeg ? '#16A34A' : '#DC2626' }} />
                            </div>
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: dish.isVeg ? '#15803D' : '#B91C1C' }}>
                              {dish.isVeg ? 'VEG' : 'NON-VEG'}
                            </span>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0F172A', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {dish.name}
                            </h4>
                            <p style={{ margin: '0 0 10px', fontSize: '11.5px', color: '#64748B', fontWeight: 400, lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {dish.desc || 'Prepared fresh with high quality ingredients.'}
                            </p>
                          </div>

                          {/* Price & Add Stepper */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>₹{dish.price}</span>

                            {!inStock ? (
                              <span style={{ fontSize: '10.5px', color: '#EF4444', fontWeight: 600 }}>Out of stock</span>
                            ) : qty === 0 ? (
                              <button
                                onClick={() => updateCartQty(dish.id, 1)}
                                style={{
                                  backgroundColor: '#FFF7ED',
                                  color: '#FF5E14',
                                  border: '1.5px solid #FF5E14',
                                  borderRadius: '8px',
                                  padding: '5px 14px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 4px rgba(255,94,20,0.1)'
                                }}
                              >
                                + ADD
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#FF5E14', borderRadius: '8px', padding: '4px 8px', boxShadow: '0 2px 6px rgba(255,94,20,0.25)' }}>
                                <button
                                  onClick={() => updateCartQty(dish.id, -1)}
                                  style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '1px', display: 'flex' }}
                                >
                                  <Minus size={13} />
                                </button>
                                <span style={{ color: '#FFF', fontWeight: 700, fontSize: '12.5px', minWidth: '14px', textAlign: 'center' }}>
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateCartQty(dish.id, 1)}
                                  style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '1px', display: 'flex' }}
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 3: SCANNER (ENTRY POINT FOR TABLE DINE-IN ORDERING & QR SCAN)
            ----------------------------------------------------------------------- */}
        {navTab === 'scanner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Table Dine-In Status Card & Scan Again Option */}
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ backgroundColor: '#FFF7ED', color: '#FF5E14', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                    <QrCode size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>{storeInfo.name}</h2>
                      <span style={{ fontSize: '10px', backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5', padding: '1px 6px', borderRadius: '6px', fontWeight: 500 }}>
                         {storeInfo.table}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400, marginTop: '2px' }}>
                      Merchant ID: <code>{storeInfo.merchantId}</code> • Direct Table Self-Ordering
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  style={{
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <RefreshCw size={12} /> {isCameraActive ? 'Close Scanner' : 'Scan Again'}
                </button>
              </div>
            </div>

            {/* Collapsible Camera Scanner Feed */}
            {isCameraActive && (
              <div style={{
                backgroundColor: '#1E293B',
                borderRadius: '16px',
                padding: '16px',
                color: '#FFF',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '100%', maxWidth: '280px', height: '180px', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '2px solid #FF5E14' }}>
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '130px', height: '130px', border: '2px dashed #FF5E14', borderRadius: '12px' }} />
                </div>
                {cameraError && <div style={{ fontSize: '11.5px', color: '#FCA5A5', marginTop: '8px' }}>{cameraError}</div>}
              </div>
            )}

            {/* Manual Table URL or QR Code Input */}
            <div style={{ backgroundColor: '#FFF', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <form onSubmit={handleManualQrSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter table QR URL (e.g. lagan-da-dhaba/FP-431317/table-2)..."
                  value={manualQrInput}
                  onChange={(e) => setManualQrInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 400
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#FF5E14',
                    color: '#FFF',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontWeight: 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Switch Table
                </button>
              </form>
            </div>

            {/* TABLE DINE-IN MENU PRODUCTS & CATEGORIES */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                  {storeInfo.name} Menu ({storeInfo.table})
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 400 }}>{filteredDishes.length} Items</span>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px', scrollbarWidth: 'none' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      border: selectedCategory === cat ? '1px solid #FF5E14' : '1px solid #E2E8F0',
                      backgroundColor: selectedCategory === cat ? '#FFF7ED' : '#FFF',
                      color: selectedCategory === cat ? '#C2410C' : '#475569',
                      fontWeight: 500,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Table Products Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                {filteredDishes.map((dish) => {
                  const qty = cart[dish.id] || 0;
                  const inStock = dish.inStock !== false;
                  const imgUrl = getDishImageUrl(dish);

                  return (
                    <div
                      key={dish.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        opacity: inStock ? 1 : 0.6
                      }}
                    >
                      {/* Product Image & Veg/Non-Veg Badge */}
                      <div style={{ position: 'relative', width: '100%', height: '135px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F8FAFC', marginBottom: '10px' }}>
                        <img
                          src={imgUrl}
                          alt={dish.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getFallbackFoodImage(dish.name, dish.category);
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          <div style={{ width: '11px', height: '11px', border: `1.5px solid ${dish.isVeg ? '#16A34A' : '#DC2626'}`, padding: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: dish.isVeg ? '#16A34A' : '#DC2626' }} />
                          </div>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: dish.isVeg ? '#15803D' : '#B91C1C' }}>
                            {dish.isVeg ? 'VEG' : 'NON-VEG'}
                          </span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#0F172A', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {dish.name}
                          </h4>
                          <p style={{ margin: '0 0 10px', fontSize: '11.5px', color: '#64748B', fontWeight: 400, lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {dish.desc || 'Prepared fresh with high quality ingredients.'}
                          </p>
                        </div>

                        {/* Price & Add Stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>₹{dish.price}</span>

                          {!inStock ? (
                            <span style={{ fontSize: '10.5px', color: '#EF4444', fontWeight: 600 }}>Out of stock</span>
                          ) : qty === 0 ? (
                            <button
                              onClick={() => updateCartQty(dish.id, 1)}
                              style={{
                                backgroundColor: '#FFF7ED',
                                color: '#FF5E14',
                                border: '1.5px solid #FF5E14',
                                borderRadius: '8px',
                                padding: '5px 14px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(255,94,20,0.1)'
                              }}
                            >
                              + ADD
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#FF5E14', borderRadius: '8px', padding: '4px 8px', boxShadow: '0 2px 6px rgba(255,94,20,0.25)' }}>
                              <button
                                onClick={() => updateCartQty(dish.id, -1)}
                                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '1px', display: 'flex' }}
                              >
                                <Minus size={13} />
                              </button>
                              <span style={{ color: '#FFF', fontWeight: 700, fontSize: '12.5px', minWidth: '14px', textAlign: 'center' }}>
                                {qty}
                              </span>
                              <button
                                onClick={() => updateCartQty(dish.id, 1)}
                                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '1px', display: 'flex' }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 2: ORDERS (Customer Complete Order History)
            ----------------------------------------------------------------------- */}
        {navTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <History size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>My Food Orders</h2>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                    Track order history for {customerName || 'Guest'}
                  </div>
                </div>
              </div>
            </div>

            {customerOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                <ShoppingBag size={36} color="#94A3B8" style={{ marginBottom: '8px' }} />
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 500, color: '#0F172A' }}>No Orders Placed Yet</h3>
                <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748B', fontWeight: 400 }}>Explore menu to place your first food order!</p>
                <button
                  onClick={() => setNavTab('home')}
                  style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 500, fontSize: '12.5px', cursor: 'pointer' }}
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customerOrders.map((order, idx) => (
                  <div
                    key={order.id || idx}
                    style={{
                      backgroundColor: '#FFF',
                      borderRadius: '14px',
                      border: '1px solid #E2E8F0',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '14.5px', color: '#0F172A' }}>{order.id}</span>
                          <span style={{ fontSize: '10.5px', backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 500, padding: '1px 6px', borderRadius: '6px' }}>
                            {order.table || order.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', fontWeight: 400 }}>
                          {order.restaurantName || storeInfo.name} • {order.time || 'Today'}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 500,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        backgroundColor: order.status === 'completed' || order.status === 'ready' ? '#ECFDF5' : '#F0F9FF',
                        color: order.status === 'completed' || order.status === 'ready' ? '#047857' : '#0369A1'
                      }}>
                        {order.status === 'completed' ? ' SERVED' : order.status === 'ready' ? '️ READY' : order.status === 'preparing' ? ' PREPARING' : '⏳ PLACED'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {order.items?.map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#334155', fontWeight: 400 }}>
                          <span>{it.qty}x {it.name}</span>
                          <span style={{ fontWeight: 500 }}>₹{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>Payment: </span>
                        <span style={{ fontSize: '11.5px', color: '#0F172A', fontWeight: 500 }}>{order.paymentLabel || 'UPI'}</span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#FF5E14' }}>
                        Total: ₹{order.total}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <button
                        onClick={() => handleReorder(order)}
                        style={{
                          flex: 1,
                          backgroundColor: '#FFF7ED',
                          color: '#FF5E14',
                          border: '1px solid #FFEDD5',
                          padding: '7px',
                          borderRadius: '8px',
                          fontWeight: 500,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                         Re-order
                      </button>

                      <button
                        onClick={() => {
                          setActivePlacedOrder(order);
                          setShowRatingModal(true);
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: '#F8FAFC',
                          color: '#475569',
                          border: '1px solid #E2E8F0',
                          padding: '7px',
                          borderRadius: '8px',
                          fontWeight: 500,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        ⭐ Rate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 4: COUPONS (Assigned VIP Offers)
            ----------------------------------------------------------------------- */}
        {navTab === 'coupons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#FFF7ED', color: '#FF5E14', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <Tag size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Coupons Assigned to You</h2>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                    Unlocked vouchers for {customerName ? customerName : 'you'}
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              const assignedList = getAssignedCouponsForUser();
              if (assignedList.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '36px 20px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
                    <Tag size={32} color="#94A3B8" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#0F172A' }}>No Assigned Coupons Available</div>
                    <div style={{ fontSize: '12px', marginTop: '2px', fontWeight: 400 }}>Update profile to unlock personalized vouchers.</div>
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {assignedList.map((cp) => {
                    const isApplied = appliedCoupon?.code === cp.code;
                    return (
                      <div
                        key={cp.code}
                        style={{
                          backgroundColor: '#FFF',
                          borderRadius: '14px',
                          border: isApplied ? '1.5px solid #10B981' : '1px dashed #FF5E14',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span style={{ backgroundColor: isApplied ? '#ECFDF5' : '#FFF7ED', color: isApplied ? '#047857' : '#C2410C', fontSize: '9.5px', fontWeight: 500, padding: '2px 6px', borderRadius: '6px' }}>
                                {isApplied ? ' ACTIVE' : cp.badge}
                              </span>
                              <span style={{ backgroundColor: '#F8FAFC', color: '#475569', fontSize: '9.5px', fontWeight: 400, padding: '2px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                {cp.assignedReason}
                              </span>
                            </div>

                            <h3 style={{ margin: '3px 0 2px', fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                              {cp.discount}
                            </h3>
                            <p style={{ margin: 0, fontSize: '11.5px', color: '#64748B', fontWeight: 400, lineHeight: '1.35' }}>
                              {cp.desc}
                            </p>
                          </div>

                          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
                            {cp.code}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>Min Order: ₹{cp.minOrder}</span>
                          <button
                            onClick={() => {
                              setAppliedCoupon({ code: cp.code, label: cp.discount });
                              if (onShowToast) onShowToast(` Coupon ${cp.code} Applied!`);
                              setNavTab('home');
                            }}
                            style={{
                              backgroundColor: isApplied ? '#10B981' : '#FF5E14',
                              color: '#FFF',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '11.5px',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            {isApplied ? ' APPLIED' : 'APPLY'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 5: PROFILE & MULTIPLE SAVED ADDRESSES
            ----------------------------------------------------------------------- */}
        {navTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Profile Header */}
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFF7ED', color: '#FF5E14', border: '1px solid #FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '20px', overflow: 'hidden' }}>
                {customerPhoto ? (
                  <img src={customerPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  customerName ? customerName.charAt(0).toUpperCase() : <User size={22} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
                    {customerName || 'Guest Diner'}
                  </h2>
                  <span style={{ fontSize: '9.5px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '1px 6px', borderRadius: '6px', fontWeight: 500 }}>
                    VIP
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: 400 }}>
                  {customerPhone || 'Mobile Not Added'} • {customerEmail || 'Email Not Added'}
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14.5px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={16} color="#FF5E14" /> Personal Information
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontWeight: 400 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98123 45678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontWeight: 400 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontWeight: 400 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>
                    Date of Birth (For Birthday Offers )
                  </label>
                  <input
                    type="date"
                    value={customerDob}
                    onChange={(e) => setCustomerDob(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #FF5E14', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFF7ED', color: '#C2410C', fontWeight: 500 }}
                  />
                </div>

                <button
                  onClick={() => {
                    const profile = { name: customerName, phone: customerPhone, dob: customerDob, email: customerEmail, photo: customerPhoto };
                    localStorage.setItem('foodypay_customer_profile', JSON.stringify(profile));
                    if (onShowToast) onShowToast(' Profile saved!');
                  }}
                  style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: 500, fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}
                >
                  Save Profile Details
                </button>
              </div>
            </div>

            {/* MULTIPLE SAVED ADDRESSES SECTION */}
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#FF5E14" /> Saved Delivery Addresses
                </h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  style={{ backgroundColor: '#FFF7ED', color: '#C2410C', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 500, cursor: 'pointer' }}
                >
                  {showAddressForm ? 'Cancel' : '+ Add Address'}
                </button>
              </div>

              {/* Add New Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '10px', marginBottom: '10px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#475569', marginBottom: '3px' }}>Label</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['Home', 'Office', 'Other'].map(lbl => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setNewAddrLabel(lbl)}
                          style={{
                            border: newAddrLabel === lbl ? '1px solid #FF5E14' : '1px solid #CBD5E1',
                            backgroundColor: newAddrLabel === lbl ? '#FFF7ED' : '#FFF',
                            color: newAddrLabel === lbl ? '#C2410C' : '#475569',
                            fontWeight: 500,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {lbl === 'Home' ? ' Home' : lbl === 'Office' ? ' Office' : ' Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="House / Flat / Floor No."
                      value={newAddrFlat}
                      onChange={(e) => setNewAddrFlat(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', fontWeight: 400 }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="Street Address, Sector, City..."
                      value={newAddrText}
                      onChange={(e) => setNewAddrText(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', fontWeight: 400 }}
                    />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={newAddrLandmark}
                      onChange={(e) => setNewAddrLandmark(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box', fontWeight: 400 }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ width: '100%', backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 500, fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    Save Address
                  </button>
                </form>
              )}

              {/* Saved Address Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedAddresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 12px', color: '#64748B', fontSize: '12px', fontWeight: 400, border: '1px dashed #CBD5E1', borderRadius: '10px', backgroundColor: '#F8FAFC' }}>
                    No saved addresses yet. Click <strong>"+ Add Address"</strong> above to save your Home or Office location.
                  </div>
                ) : (
                  savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>
                          {addr.label === 'Home' ? '' : addr.label === 'Office' ? '' : ''}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{addr.label}</span>
                            {addr.isDefault && (
                              <span style={{ fontSize: '9px', backgroundColor: '#ECFDF5', color: '#047857', fontWeight: 500, padding: '1px 5px', borderRadius: '4px' }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '1px', fontWeight: 400 }}>
                            {addr.flat ? `${addr.flat}, ` : ''}{addr.text}
                          </div>
                          {addr.landmark && (
                            <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '1px', fontWeight: 400 }}>
                              Landmark: {addr.landmark}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '3px' }}
                        title="Delete Address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Birthday Perk Alert Card */}
            <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#FFEDD5', color: '#C2410C', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                <Cake size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: '#9A3412' }}>
                  {customerDob ? ' Birthday Perk Active!' : ' Unlock Birthday Offers!'}
                </h4>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#C2410C', lineHeight: '1.35', fontWeight: 400 }}>
                  {customerDob
                    ? `Birthday saved for ${new Date(customerDob).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}.`
                    : `Add your Date of Birth above to receive free birthday treats & vouchers!`}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Cart Summary Bar */}
      {getCartCount() > 0 && navTab === 'home' && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 28px)',
          maxWidth: '736px',
          backgroundColor: '#0F172A',
          color: '#FFF',
          borderRadius: '14px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 80,
          boxShadow: '0 6px 20px rgba(15,23,42,0.25)'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>{getCartCount()} ITEMS ADDED</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFF' }}>
              ₹{finalTotal} <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>(₹{subtotal} + 5% GST)</span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: '#FF5E14',
              color: '#FFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 500,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            View Cart &amp; Pay <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 5-TAB FIXED BOTTOM NAVIGATION BAR */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 90
      }}>
        {/* Tab 1: Home */}
        <button
          onClick={() => setNavTab('home')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: navTab === 'home' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'home' ? 600 : 400,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <HomeIcon size={19} color={navTab === 'home' ? '#FF5E14' : '#64748B'} />
          <span>Home</span>
        </button>

        {/* Tab 2: Orders */}
        <button
          onClick={() => setNavTab('orders')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: navTab === 'orders' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'orders' ? 600 : 400,
            fontSize: '11px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <History size={19} color={navTab === 'orders' ? '#FF5E14' : '#64748B'} />
          <span>Orders</span>
          {customerOrders.length > 0 && (
            <span style={{ position: 'absolute', top: '-3px', right: '-4px', backgroundColor: '#0284C7', color: '#FFF', fontSize: '9px', fontWeight: 500, padding: '1px 4px', borderRadius: '6px' }}>
              {customerOrders.length}
            </span>
          )}
        </button>

        {/* Tab 3: Scanner */}
        <button
          onClick={() => setNavTab('scanner')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: navTab === 'scanner' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'scanner' ? 600 : 400,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            backgroundColor: navTab === 'scanner' ? '#FF5E14' : '#FFF7ED',
            color: navTab === 'scanner' ? '#FFF' : '#C2410C',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '-8px',
            border: '1px solid #FFEDD5'
          }}>
            <QrCode size={18} />
          </div>
          <span>Scanner</span>
        </button>

        {/* Tab 4: Coupons */}
        <button
          onClick={() => setNavTab('coupons')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: navTab === 'coupons' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'coupons' ? 600 : 400,
            fontSize: '11px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Tag size={19} color={navTab === 'coupons' ? '#FF5E14' : '#64748B'} />
          <span>Coupons</span>
          <span style={{ position: 'absolute', top: '-3px', right: '-8px', backgroundColor: '#FF5E14', color: '#FFF', fontSize: '8.5px', fontWeight: 500, padding: '1px 4px', borderRadius: '6px' }}>
            OFFERS
          </span>
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={() => setNavTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            color: navTab === 'profile' ? '#FF5E14' : '#64748B',
            fontWeight: navTab === 'profile' ? 600 : 400,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <User size={19} color={navTab === 'profile' ? '#FF5E14' : '#64748B'} />
          <span>Profile</span>
        </button>
      </div>

      {/* Checkout Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)',
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
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            overflowY: 'auto',
            padding: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Your Food Order</h2>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 400 }}>{storeInfo.name} • {navTab === 'scanner' ? storeInfo.table : 'Home Delivery'}</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} color="#475569" />
              </button>
            </div>

            <form onSubmit={handleInitiateOrder}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Your Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name (e.g. Rahul Sharma)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 11px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 400
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 11px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontWeight: 400
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                    Order Location
                  </label>
                  <input
                    type="text"
                    disabled
                    value={navTab === 'scanner' ? storeInfo.table : (savedAddresses.length > 0 ? savedAddresses[0].label : 'Home Delivery')}
                    style={{
                      width: '100%',
                      padding: '9px 11px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#475569',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '12px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748B', marginBottom: '5px', fontWeight: 400 }}>
                  <span>Item Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748B', marginBottom: '6px', fontWeight: 400 }}>
                  <span>GST Tax ({storeInfo.gstPercent}%)</span>
                  <span>+₹{gstAmount}</span>
                </div>
                <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#FF5E14' }}>₹{finalTotal}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '6px' }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    style={{
                      border: paymentMode === 'upi' ? '1.5px solid #FF5E14' : '1px solid #CBD5E1',
                      backgroundColor: paymentMode === 'upi' ? '#FFF7ED' : '#FFF',
                      padding: '10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 500,
                      fontSize: '12.5px',
                      color: paymentMode === 'upi' ? '#C2410C' : '#475569'
                    }}
                  >
                    <QrCode size={16} color="#FF5E14" /> Online UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    style={{
                      border: paymentMode === 'cash' ? '1.5px solid #FF5E14' : '1px solid #CBD5E1',
                      backgroundColor: paymentMode === 'cash' ? '#FFF7ED' : '#FFF',
                      padding: '10px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 500,
                      fontSize: '12.5px',
                      color: paymentMode === 'cash' ? '#C2410C' : '#475569'
                    }}
                  >
                    <CreditCard size={16} color="#059669" /> Cash / Pay Counter
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
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  cursor: 'pointer'
                }}
              >
                {paymentMode === 'upi' ? 'Proceed to Pay (₹' + finalTotal + ') →' : 'Confirm Order (₹' + finalTotal + ') →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Online UPI QR Modal */}
      {showUpiModal && pendingOrderObj && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>
              Scan &amp; Pay via UPI
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px', fontWeight: 400 }}>
              {storeInfo.name} • <code>{storeInfo.upiId}</code>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'inline-block', marginBottom: '10px' }}>
              <QrCodeComponent
                text={upiPayUrl}
                size={160}
                qrColor="#0F172A"
                cornerColor="#FF5E14"
                showLogo={true}
              />
            </div>

            <div style={{ fontSize: '20px', fontWeight: 600, color: '#FF5E14', marginBottom: '12px' }}>
              ₹{pendingOrderObj.total}
            </div>

            <div style={{ marginBottom: '14px', width: '100%', textAlign: 'left' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 500, color: '#475569', marginBottom: '6px', textAlign: 'center' }}>
                Tap to Pay direct via UPI app:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <a
                  href={upiPayUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#1E293B', fontWeight: 500, fontSize: '12px', textDecoration: 'none'
                  }}
                >
                   Google Pay
                </a>

                <a
                  href={upiPayUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#5F259F', fontWeight: 500, fontSize: '12px', textDecoration: 'none'
                  }}
                >
                   PhonePe
                </a>

                <a
                  href={upiPayUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#00BAF2', fontWeight: 500, fontSize: '12px', textDecoration: 'none'
                  }}
                >
                   Paytm
                </a>

                <a
                  href={upiPayUrl}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #FF5E14', backgroundColor: '#FFF7ED', color: '#FF5E14', fontWeight: 500, fontSize: '12px', textDecoration: 'none'
                  }}
                >
                   Pay Any UPI
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => finalizeAndSaveOrder(pendingOrderObj)}
                style={{
                  width: '100%',
                  backgroundColor: '#10B981',
                  color: '#FFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                 Confirm Payment &amp; Send Order
              </button>

              <button
                onClick={() => setShowUpiModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 400, fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel / Change Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date of Birth Prompt Modal */}
      {showDobModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '20px',
            maxWidth: '380px',
            width: '100%',
            padding: '20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowDobModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
            >
              <X size={15} color="#475569" />
            </button>

            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#FFF7ED', color: '#C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Cake size={26} />
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>
               Birthday Gifts &amp; Offers!
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748B', lineHeight: '1.4', fontWeight: 400 }}>
              Enter your Date of Birth to unlock special birthday perks from <strong>{storeInfo.name}</strong>!
            </p>

            <form onSubmit={handleSaveDobSubmit}>
              <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Date of Birth <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={customerDob}
                  onChange={(e) => setCustomerDob(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #FF5E14',
                    fontSize: '14px',
                    fontWeight: 500,
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
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                 Save Birthday
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rating & Feedback Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '100%',
            padding: '20px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowRatingModal(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}
            >
              <X size={15} color="#475569" />
            </button>

            <form onSubmit={handleSubmitReview}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <Award size={32} color="#FF5E14" style={{ marginBottom: '4px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Rate Your Experience</h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B', fontWeight: 400 }}>
                  How was your ordering at <strong>{storeInfo.name}</strong>?
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                  >
                    <Star
                      size={28}
                      color="#F59E0B"
                      fill={star <= ratingStars ? '#F59E0B' : 'transparent'}
                    />
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#334155', marginBottom: '4px' }}>
                  Feedback <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell us what you loved..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 11px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 400
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
                  borderRadius: '10px',
                  padding: '11px',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  cursor: 'pointer'
                }}
              >
                ⭐ Submit Feedback
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
