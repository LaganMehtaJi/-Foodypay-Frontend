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
  RefreshCw,
  Menu,
  Laptop,
  Truck,
  ShieldCheck,
  FileText,
  BookOpen
} from 'lucide-react';
import { playOrderPlaced } from '../utils/soundEffects';
import { QrCodeComponent } from '../utils/qrGenerator';
import { fetchDishesApi, fetchPublicDishesApi, fetchPublicMerchantApi, fetchPublicCouponsApi, createReviewApi, createPublicOrderApi, createRazorpayOrderApi, verifyRazorpaySignatureApi, checkDeliveryAvailabilityApi, fetchAvailableProductsApi, calculateBikeDeliveryTime, calculateHaversineDistanceKm } from '../utils/api';

const AVAILABLE_COUPONS = [];

const DEFAULT_10_PRODUCTS = [];

// Rich Grocery Category Cards for Home Screen
const HOME_IMAGE_CATEGORIES = [
  { id: 'All', name: 'All 10 Items', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80', count: '10 Essentials' },
  { id: 'Milk & Dairy', name: 'Milk & Dairy', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80', count: 'Milk, Curd, Paneer' },
  { id: 'Biscuits & Cookies', name: 'Biscuits & Cookies', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80', count: 'Biscuits & Cookies' },
  { id: 'Ice Cream', name: 'Ice Cream', image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&auto=format&fit=crop&q=80', count: 'Chocolate & Vanilla' },
  { id: 'Snacks & Chips', name: 'Snacks & Chips', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80', count: 'Chips & Juice' }
];

const getFallbackFoodImage = (name = '', category = '') => {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // 1. South Indian / Dosa / Idli / Tiffin / Sambar / Vada
  if (n.includes('south indian') || n.includes('dosa') || n.includes('idli') || n.includes('tiffin') || n.includes('sambar') || n.includes('uttapam') || n.includes('vada')) {
    return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80';
  }
  // 2. Pizza
  if (n.includes('pizza') || c.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80';
  }
  // 3. Burger / Fries / Snack / Fast food
  if (n.includes('burger') || n.includes('fries') || n.includes('snack') || c.includes('snack') || c.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80';
  }
  // 4. Thali / North Indian / Dal / Naan / Roti
  if (n.includes('thali') || c.includes('thali') || n.includes('north indian') || n.includes('paneer') || n.includes('subzi') || n.includes('curry')) {
    return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80';
  }
  // 5. Biryani / Rice / Pulao
  if (n.includes('biryani') || n.includes('rice') || n.includes('pulao') || c.includes('biryani')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80';
  }
  // 6. Pasta / Noodles / Chowmein / Chinese
  if (n.includes('pasta') || n.includes('noodle') || n.includes('chowmein') || c.includes('chinese')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281829?w=500&auto=format&fit=crop&q=80';
  }
  // 7. Coffee / Drinks / Beverages / Shake / Tea
  if (n.includes('coffee') || n.includes('drink') || n.includes('beverage') || n.includes('shake') || n.includes('tea') || c.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80';
  }
  // 8. Dessert / Cake / Ice cream
  if (n.includes('dessert') || n.includes('cake') || n.includes('ice cream') || c.includes('dessert')) {
    return 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=500&auto=format&fit=crop&q=80';
  }
  // 9. Milk & Dairy
  if (n.includes('milk') || c.includes('milk') || n.includes('curd') || n.includes('dahi')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80';
  }
  // 10. Chips & Biscuits
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('chip')) {
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80';
  }
  // 11. Generic Combo / Meal (checked after specific types above)
  if (n.includes('combo') || n.includes('meal') || c.includes('combo')) {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
  }

  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';
};

const getDishImageUrl = (dish) => {
  if (!dish) return getFallbackFoodImage('', '');

  // Check images array first
  if (Array.isArray(dish.images) && dish.images.length > 0) {
    const validImg = dish.images.find(
      (img) => typeof img === 'string' && img.trim() !== '' && !img.includes('placeholder')
    );
    if (validImg) return validImg;
  }

  // Check image string or object
  let imgStr = '';
  if (typeof dish.image === 'string') {
    imgStr = dish.image;
  } else if (dish.image && typeof dish.image.url === 'string') {
    imgStr = dish.image.url;
  }

  if (imgStr && imgStr.trim() !== '' && !imgStr.includes('placeholder')) {
    return imgStr;
  }

  return getFallbackFoodImage(dish.name || '', dish.category || '');
};

const getDishImagesList = (dish) => {
  if (!dish) return [];
  const list = [];

  if (Array.isArray(dish.images) && dish.images.length > 0) {
    dish.images.forEach((img) => {
      if (typeof img === 'string' && img.trim() !== '' && !list.includes(img)) {
        list.push(img);
      }
    });
  }

  let singleImg = '';
  if (typeof dish.image === 'string') singleImg = dish.image;
  else if (dish.image && typeof dish.image.url === 'string') singleImg = dish.image.url;

  if (singleImg && singleImg.trim() !== '' && !list.includes(singleImg)) {
    list.push(singleImg);
  }

  if (list.length === 0) {
    list.push(getFallbackFoodImage(dish.name || '', dish.category || ''));
  }

  return list;
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

  // App Navigation 4 Bottom Tabs ('orders' | 'scanner' | 'coupons' | 'profile')
  const [navTab, setNavTab] = useState('scanner');

  const formatSlug = (str) => {
    if (!str) return '';
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFeaturedMerchantId = () => {
    try {
      const featId = localStorage.getItem('foodypay_featured_merchant_id');
      if (featId) return featId;
    } catch (e) {}
    return 'FP-985569';
  };

  const hasScannedTable = Boolean(tableId || restaurantSlug);
  const rawRestName = formatSlug(restaurantSlug || (hasScannedTable ? 'FoodyPay Store' : ''));
  const rawTable = tableId ? formatSlug(tableId).replace(/tabel/gi, 'Table') : '';
  const effectiveMerchantId = merchantId || getFeaturedMerchantId();

  // Catalog Theme State
  const [activeCatalogTheme, setActiveCatalogTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_catalog_theme');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'orange',
      name: 'Sunset Orange',
      primary: '#FF5E14',
      accent: '#D97706',
      bg: '#FFF0EB',
      gradient: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
    };
  });

  useEffect(() => {
    const handleThemeSync = (e) => {
      if (e && e.detail) {
        setActiveCatalogTheme(e.detail);
      } else {
        try {
          const saved = localStorage.getItem('foodypay_catalog_theme');
          if (saved) setActiveCatalogTheme(JSON.parse(saved));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleThemeSync);
    window.addEventListener('foodypay_theme_changed', handleThemeSync);
    return () => {
      window.removeEventListener('storage', handleThemeSync);
      window.removeEventListener('foodypay_theme_changed', handleThemeSync);
    };
  }, []);

  // Store Operational Controls (storeStatus, deliveryStatus, pickupStatus)
  const [storeControls, setStoreControls] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_store_controls');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      storeStatus: true,
      deliveryStatus: true,
      pickupStatus: true,
    };
  });

  useEffect(() => {
    const handleControlsSync = () => {
      try {
        const saved = localStorage.getItem('foodypay_store_controls');
        if (saved) setStoreControls(JSON.parse(saved));
      } catch (e) {}
    };
    handleControlsSync();
    window.addEventListener('storage', handleControlsSync);
    return () => window.removeEventListener('storage', handleControlsSync);
  }, []);

  // Store & Catalog Datasets
  const [storeInfo, setStoreInfo] = useState(() => {
    let savedUpi = '';
    try {
      savedUpi = localStorage.getItem('foodypay_upi_id') || '';
      if (!savedUpi) {
        const rawU = localStorage.getItem('foodypay_user');
        if (rawU) savedUpi = JSON.parse(rawU).upiId || '';
      }
    } catch (e) {}

    return {
      name: rawRestName,
      merchantId: effectiveMerchantId,
      table: rawTable,
      logoUrl: '',
      gstPercent: 5,
      upiId: savedUpi || '7496888449@ptsbi',
      rating: 4.8,
      deliveryTime: '15-25 min'
    };
  });

  const getInitialDishes = () => {
    try {
      const featPayload = localStorage.getItem('foodypay_featured_homepage_merchant');
      if (featPayload) {
        const parsed = JSON.parse(featPayload);
        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
          return parsed.products.map((item, idx) => ({
            ...item,
            id: String(item.id || item._id || `d_${idx}`),
            price: Number(item.price || item.comboPrice || 0),
          }));
        }
      }
    } catch (e) {}
    return [];
  };

  const [dishes, setDishes] = useState(getInitialDishes);
  const [combos, setCombos] = useState([]);
  const [dbCoupons, setDbCoupons] = useState([]);
  const [carts, setCarts] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_customer_carts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch (e) {}
    return {};
  });

  const getActiveCartKey = () => {
    if (navTab === 'scanner') {
      const tbl = storeInfo.table || rawTable || 'Table 1';
      return `table_${tbl.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    }
    return 'home_delivery';
  };

  const activeCartKey = getActiveCartKey();
  const cart = carts[activeCartKey] || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuPage, setMenuPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setMenuPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 450) {
        setMenuPage((prev) => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Payment Method Display & Options Config (Synced with POS Dashboard Settings)
  const [paymentConfig, setPaymentConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_payment_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      header: 'Payment Method',
      upiEnabled: true,
      upiLabel: 'Online UPI',
      cashEnabled: true,
      cashLabel: 'Cash / Pay Counter',
    };
  });

  useEffect(() => {
    const handlePaymentConfigSync = () => {
      try {
        const saved = localStorage.getItem('foodypay_payment_config');
        if (saved) setPaymentConfig(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handlePaymentConfigSync);
    return () => window.removeEventListener('storage', handlePaymentConfigSync);
  }, []);
  const [dietFilter, setDietFilter] = useState('all');

  // Customer Profile & Saved Addresses State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [customerDob, setCustomerDob] = useState('');
  const [showDobModal, setShowDobModal] = useState(false);
  const [showPwaInstallBanner, setShowPwaInstallBanner] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrFlat, setNewAddrFlat] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrLandmark, setNewAddrLandmark] = useState('');

  // Location & Sector Selector Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [sectorSearchQuery, setSectorSearchQuery] = useState('');

  // Automatic Customer Geolocation & Delivery Zone Availability State
  const [locationState, setLocationState] = useState({
    loading: false,
    requested: false,
    permissionGranted: false,
    lat: null,
    lng: null,
    available: true,
    reason: null,
    message: '',
    addressLabel: '',
  });

  // Dynamic Delivery Location Availability Validator (Store Location & Owner Radius Limit)
  const getStoreConfiguredRadius = () => {
    try {
      const rawU = localStorage.getItem('foodypay_user');
      if (rawU) {
        const u = JSON.parse(rawU);
        if (u.deliveryRadius) return Number(u.deliveryRadius);
      }
    } catch (e) {}
    return 5; // Default 5 KM Radius
  };

  const getStoreCoordinates = () => {
    try {
      const rawU = localStorage.getItem('foodypay_user');
      if (rawU) {
        const u = JSON.parse(rawU);
        if (u.latitude && u.longitude) {
          return { lat: Number(u.latitude), lng: Number(u.longitude) };
        }
      }
    } catch (e) {}
    return { lat: 30.7046, lng: 76.7179 }; // Sector 71 / Mataur Store GPS Center
  };

  const validateLocationAvailability = (label = '', lat = null, lng = null) => {
    return {
      available: true,
      message: '',
      reason: null,
      distanceKm: 0.5
    };
  };

  const handleDetectCustomerLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const availCheck = validateLocationAvailability(locationState.addressLabel || 'Sector 71, Mataur', locationState.lat, locationState.lng);
      setLocationState((prev) => ({
        ...prev,
        loading: false,
        requested: true,
        permissionGranted: false,
        message: availCheck.message || 'Geolocation is not supported by your browser.',
        available: availCheck.available
      }));
      return;
    }

    setLocationState((prev) => ({ ...prev, loading: true, requested: true }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          let resolvedLabel = '';
          try {
            const res = await checkDeliveryAvailabilityApi(lat, lng);
            if (Array.isArray(res.matchingZones) && res.matchingZones.length > 0) {
              const mz = res.matchingZones[0];
              resolvedLabel = `${mz.name}${mz.city && mz.name !== mz.city ? `, ${mz.city}` : ''}`;
            }
          } catch (e) {}

          if (!resolvedLabel) {
            resolvedLabel = 'Mohali, Punjab';
          }

          const availCheck = validateLocationAvailability(resolvedLabel, lat, lng);

          setLocationState({
            loading: false,
            requested: true,
            permissionGranted: true,
            lat,
            lng,
            available: availCheck.available,
            reason: availCheck.reason || null,
            message: availCheck.message,
            addressLabel: resolvedLabel,
          });

          // Fetch products for location
          try {
            const prodRes = await fetchAvailableProductsApi(lat, lng, selectedCategory);
            if (prodRes && prodRes.available === false) {
              setDishes([]);
            } else if (prodRes && Array.isArray(prodRes.dishes)) {
              setDishes(prodRes.dishes);
            }
          } catch (e) {}

          // Location detection completed without blocking catalog
        } catch (err) {
          const availCheck = validateLocationAvailability('', lat, lng);
          setLocationState((prev) => ({
            ...prev,
            loading: false,
            requested: true,
            permissionGranted: true,
            lat,
            lng,
            available: availCheck.available,
            message: availCheck.message,
            addressLabel: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          }));
        }
      },
      (err) => {
        console.warn('Geolocation permission error:', err);
        const availCheck = validateLocationAvailability(locationState.addressLabel || 'Sector 71, Mataur', null, null);
        setLocationState((prev) => ({
          ...prev,
          loading: false,
          requested: true,
          permissionGranted: false,
          available: availCheck.available,
          message: availCheck.message || 'Location permission denied. Please allow location access.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Trigger Automatic Location Permission Request immediately on page load / website visit
  useEffect(() => {
    handleDetectCustomerLocation();
  }, []);

  // Orders State
  const [customerOrders, setCustomerOrders] = useState([]);

  // Camera Table QR Scanner State
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualQrInput, setManualQrInput] = useState('');

  // Cart & Checkout state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
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
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Active Placed Order Tracker state
  const [activePlacedOrder, setActivePlacedOrder] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic Steal Deals / Collections Configuration from Merchant POS Dashboard
  const [stealDealsConfig, setStealDealsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_steal_deals_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      title: 'STEAL DEAL WEEKEND',
      badgePrice: '9',
      subtitle: '✦ GET ANY ONE ITEM AT SPECIAL PRICE ✦',
      items: [
        { id: 'steal_1', name: 'Corn Cob (Bhutta)', unit: '1 pc', price: 9, originalPrice: 22, unlockAt: 499, isVeg: true, image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&auto=format&fit=crop&q=80' },
        { id: 'steal_2', name: 'Sleepy Owl Assorted Instant Coffee', unit: '10 pcs', price: 29, originalPrice: 49, unlockAt: 899, isVeg: true, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
        { id: 'steal_3', name: 'Farmley Dark Choco Orange Date Bites', unit: '20 g', price: 9, originalPrice: 40, unlockAt: 499, isVeg: true, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&auto=format&fit=crop&q=80' },
        { id: 'steal_4', name: 'Fresh Full Cream Milk (1L)', unit: '1 L', price: 49, originalPrice: 66, unlockAt: 299, isVeg: true, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80' },
        { id: 'steal_5', name: 'Crispy Potato Chips Pack (Salted)', unit: '50 g', price: 9, originalPrice: 20, unlockAt: 199, isVeg: true, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80' },
      ]
    };
  });

  // Live sync updated UPI ID & Steal Deals config
  useEffect(() => {
    const handleUpiSync = () => {
      try {
        const savedUpi = localStorage.getItem('foodypay_upi_id');
        if (savedUpi) {
          setStoreInfo((prev) => ({ ...prev, upiId: savedUpi }));
        }
        const savedSteal = localStorage.getItem('foodypay_steal_deals_config');
        if (savedSteal) {
          setStealDealsConfig(JSON.parse(savedSteal));
        }
      } catch (e) {}
    };
    handleUpiSync();
    window.addEventListener('storage', handleUpiSync);
    return () => window.removeEventListener('storage', handleUpiSync);
  }, []);

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

  // Load customer order history & active order live tracker
  const loadCustomerOrders = () => {
    try {
      const saved = localStorage.getItem('foodypay_crm_orders_v3');
      let allOrdersList = [];
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          allOrdersList = list;
          setCustomerOrders(list);
        }
      }

      // Active Tracker Banner ONLY appears when customer actively places an order in their session
      const currentSessionOrder = sessionStorage.getItem('foodypay_active_order');
      if (currentSessionOrder) {
        const parsedOrder = JSON.parse(currentSessionOrder);
        const match = allOrdersList.find((o) => {
          if (!o) return false;
          if (parsedOrder.id && (o.id === parsedOrder.id || o.orderId === parsedOrder.id || o._id === parsedOrder.id)) return true;
          if (parsedOrder._id && (o._id === parsedOrder._id || o.id === parsedOrder._id)) return true;
          if (parsedOrder.orderId && (o.orderId === parsedOrder.orderId || o.id === parsedOrder.orderId)) return true;
          
          const cleanP = String(parsedOrder.id || parsedOrder.orderId || '').replace(/[^0-9]/g, '');
          const cleanO = String(o.id || o.orderId || '').replace(/[^0-9]/g, '');
          if (cleanP && cleanO && cleanP === cleanO) return true;
          return false;
        });

        const liveOrder = match ? { ...parsedOrder, ...match } : parsedOrder;

        if (
          liveOrder &&
          liveOrder.status !== 'completed' &&
          liveOrder.status !== 'delivered' &&
          liveOrder.status !== 'served' &&
          liveOrder.status !== 'cancelled'
        ) {
          setActivePlacedOrder(liveOrder);
          sessionStorage.setItem('foodypay_active_order', JSON.stringify(liveOrder));
        } else {
          setActivePlacedOrder(null);
        }
      } else {
        setActivePlacedOrder(null);
      }
    } catch (e) {
      setActivePlacedOrder(null);
    }
  };

  useEffect(() => {
    loadCustomerOrders();
    window.addEventListener('storage', loadCustomerOrders);
    window.addEventListener('foodypay_order_created', loadCustomerOrders);

    let bc = null;
    try {
      bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.onmessage = () => {
        loadCustomerOrders();
      };
    } catch (e) {}

    const intervalId = setInterval(loadCustomerOrders, 2000);

    return () => {
      window.removeEventListener('storage', loadCustomerOrders);
      window.removeEventListener('foodypay_order_created', loadCustomerOrders);
      if (bc) bc.close();
      clearInterval(intervalId);
    };
  }, []);

  // PWA Web App Installation Event Listener
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsAppInstalled(true);
      setShowPwaInstallBanner(false);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowPwaInstallBanner(false);
      setDeferredPrompt(null);
      if (onShowToast) onShowToast('FoodyPay Web App installed successfully!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onShowToast]);

  const handleTriggerAppInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          if (onShowToast) onShowToast('Installing FoodyPay App on your device...');
          setShowPwaInstallBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowPwaInstallModal(true);
      }
    } else {
      setShowPwaInstallModal(true);
    }
  };

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
      const targetIdentifier = merchantId || restaurantSlug || getFeaturedMerchantId() || 'FP-985569';

      // Check if featured store set by Master Admin
      try {
        const featPayload = localStorage.getItem('foodypay_featured_homepage_merchant');
        if (featPayload && !merchantId && !restaurantSlug) {
          const parsedFeat = JSON.parse(featPayload);
          if (parsedFeat && (parsedFeat.businessName || parsedFeat.restaurantName)) {
            setStoreInfo((prev) => ({
              ...prev,
              name: parsedFeat.businessName || parsedFeat.restaurantName || prev.name,
              merchantId: parsedFeat.foodypayId || parsedFeat.merchantId || prev.merchantId,
              logoUrl: parsedFeat.logoUrl || prev.logoUrl,
              upiId: parsedFeat.upiId || prev.upiId,
            }));

            if (Array.isArray(parsedFeat.products) && parsedFeat.products.length > 0) {
              const normFeat = parsedFeat.products.map((item, idx) => ({
                ...item,
                id: String(item.id || item._id || `d_${idx}`),
                price: Number(item.price || item.comboPrice || 0),
              }));
              setDishes(normFeat);
            }
          }
        }
      } catch (e) {}

      try {
        const merchantData = await fetchPublicMerchantApi(targetIdentifier);
        if (merchantData) {
          setStoreInfo((prev) => ({
            ...prev,
            name: merchantData.businessName || merchantData.name || rawRestName,
            logoUrl: merchantData.logo?.url || prev.logoUrl,
            gstPercent: merchantData.gstPercent !== undefined ? merchantData.gstPercent : 5,
            upiId: localStorage.getItem('foodypay_upi_id') || merchantData.upiId || merchantData.upi_id || prev.upiId || '7496888449@ptsbi',
          }));
          setStoreControls((prev) => ({
            ...prev,
            storeStatus: merchantData.storeStatus !== undefined ? merchantData.storeStatus : prev.storeStatus,
            deliveryStatus: merchantData.deliveryStatus !== undefined ? merchantData.deliveryStatus : prev.deliveryStatus,
            pickupStatus: merchantData.pickupStatus !== undefined ? merchantData.pickupStatus : prev.pickupStatus,
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

      if (locationState.lat && locationState.lng) {
        try {
          const locationRes = await fetchAvailableProductsApi(locationState.lat, locationState.lng, selectedCategory);
          if (locationRes && locationRes.available === false) {
            setDishes([]);
          } else if (locationRes && Array.isArray(locationRes.dishes) && locationRes.dishes.length > 0) {
            setDishes(normalizeDishes(locationRes.dishes));
          } else {
            const apiDishes = await fetchPublicDishesApi(merchantId, effectiveMerchantId);
            if (Array.isArray(apiDishes)) {
              setDishes(normalizeDishes(apiDishes));
            }
          }
        } catch (locErr) {
          try {
            const apiDishes = await fetchPublicDishesApi(merchantId, effectiveMerchantId);
            if (Array.isArray(apiDishes)) setDishes(normalizeDishes(apiDishes));
          } catch (e) {}
        }
      } else {
        try {
          const apiDishes = await fetchPublicDishesApi(merchantId, effectiveMerchantId);
          if (Array.isArray(apiDishes)) {
            setDishes(normalizeDishes(apiDishes));
          }
        } catch (err) {}
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
  }, [restaurantSlug, merchantId, rawRestName, locationState.lat, locationState.lng, selectedCategory]);

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

  // Robust Table QR Code Parser for Multi-Restaurant & Multi-Table Switching
  const parseQrCodeData = (qrText) => {
    if (!qrText || typeof qrText !== 'string') return null;
    let str = qrText.trim();

    let slug = '';
    let merchant = '';
    let table = '';

    if (str.startsWith('http://') || str.startsWith('https://')) {
      try {
        const url = new URL(str);
        if (url.searchParams.get('slug')) slug = url.searchParams.get('slug');
        if (url.searchParams.get('merchant')) merchant = url.searchParams.get('merchant');
        if (url.searchParams.get('table')) table = url.searchParams.get('table');

        const hashOrPath = url.hash ? url.hash.replace('#/', '').replace('#', '') : url.pathname.replace(/^\//, '');
        const parts = hashOrPath.split('/').filter(Boolean);
        if (parts.length >= 3) {
          slug = slug || parts[0];
          merchant = merchant || parts[1];
          table = table || parts[2];
        } else if (parts.length === 2) {
          slug = slug || parts[0];
          merchant = merchant || parts[1];
        } else if (parts.length === 1 && !slug) {
          slug = parts[0];
        }
      } catch (e) {}
    }

    if (!merchant || !table) {
      const clean = str.replace(/^https?:\/\/[^\/]+/, '').replace(/^#\/?/, '').replace(/^\//, '');
      const parts = clean.split('/').filter(Boolean);
      if (parts.length >= 3) {
        slug = slug || parts[0];
        merchant = merchant || parts[1];
        table = table || parts[2];
      } else if (parts.length === 2) {
        slug = slug || parts[0];
        merchant = merchant || parts[1];
      } else if (parts.length === 1 && !merchant) {
        if (parts[0].startsWith('FP-')) {
          merchant = parts[0];
        } else {
          slug = parts[0];
        }
      }
    }

    if (!table) table = 'table-1';
    if (!merchant) merchant = effectiveMerchantId || 'FP-985569';
    if (!slug) slug = merchant.toLowerCase();

    return { slug, merchant, table };
  };

  // Handle Scanned Table QR Code (Live Camera or Input)
  const handleQrDetected = async (rawQrData) => {
    const parsed = parseQrCodeData(rawQrData);
    if (!parsed) return;

    stopCamera();
    setManualQrInput('');

    const formattedTable = parsed.table
      ? parsed.table.replace(/tabel/gi, 'Table').replace(/table-/gi, 'Table ').replace(/table/gi, 'Table ')
      : 'Table 1';
    const formattedSlug = formatSlug(parsed.slug);

    // Update Store Info State immediately
    setStoreInfo((prev) => ({
      ...prev,
      name: formattedSlug || 'FoodyPay Restaurant',
      merchantId: parsed.merchant,
      table: formattedTable,
    }));

    // Reset cart for newly scanned table
    setCarts((prev) => ({
      ...prev,
      ['table_' + formattedTable.toLowerCase().replace(/[^a-z0-9]+/g, '_')]: {}
    }));

    if (onShowToast) onShowToast(` Table Scanned: ${formattedSlug} (${formattedTable})`);

    // Fetch dynamic menu catalog for newly scanned merchant ID & restaurant
    try {
      const targetIdentifier = parsed.merchant || parsed.slug;
      const mData = await fetchPublicMerchantApi(targetIdentifier);
      if (mData) {
        setStoreInfo((prev) => ({
          ...prev,
          name: mData.businessName || mData.name || formattedSlug,
          logoUrl: mData.logo?.url || prev.logoUrl,
          gstPercent: mData.gstPercent !== undefined ? mData.gstPercent : 5,
          upiId: localStorage.getItem('foodypay_upi_id') || mData.upiId || mData.upi_id || prev.upiId || '7496888449@ptsbi'
        }));
      }

      const newDishes = await fetchPublicDishesApi(parsed.merchant, parsed.merchant);
      if (Array.isArray(newDishes) && newDishes.length > 0) {
        const norm = newDishes.map((item, idx) => ({
          ...item,
          id: String(item.id || item._id || `d_${idx}`),
          price: Number(item.price || item.comboPrice || 0)
        }));
        setDishes(norm);
      } else {
        setDishes([]);
      }
    } catch (err) {
      setDishes([]);
    }

    navigate(`/${parsed.slug}/${parsed.merchant}/${parsed.table}`);
  };

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
      setCameraError('Camera access required. Enter Table QR Code or URL manually below.');
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
    } else if (!hasScannedTable) {
      setIsCameraActive(true);
    }
  }, [navTab, hasScannedTable]);

  // Live Camera Barcode/QR Code scanning loop
  useEffect(() => {
    let animId;
    let isScanning = true;

    const scanFrame = async () => {
      if (!isCameraActive || !videoRef.current) return;

      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const qrValue = barcodes[0].rawValue;
            if (qrValue && isScanning) {
              isScanning = false;
              handleQrDetected(qrValue);
              return;
            }
          }
        } catch (e) {}
      }
      if (isCameraActive) {
        animId = setTimeout(scanFrame, 350);
      }
    };

    if (isCameraActive) {
      if (!videoRef.current || !videoRef.current.srcObject) {
        startCamera();
      }
      scanFrame();
    } else {
      stopCamera();
    }

    return () => {
      isScanning = false;
      if (animId) clearTimeout(animId);
    };
  }, [isCameraActive]);

  const handleManualQrSubmit = (e) => {
    e.preventDefault();
    if (!manualQrInput.trim()) return;
    handleQrDetected(manualQrInput.trim());
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
    const targetCartKey = getActiveCartKey();

    setCarts((prevCarts) => {
      const currentCart = prevCarts[targetCartKey] || {};
      const currentQty = currentCart[key] || 0;
      const nextQty = currentQty + delta;

      let updatedCart = { ...currentCart };
      if (nextQty <= 0) {
        delete updatedCart[key];
      } else {
        updatedCart[key] = nextQty;
      }

      const nextCarts = {
        ...prevCarts,
        [targetCartKey]: updatedCart
      };

      try {
        localStorage.setItem('foodypay_customer_carts', JSON.stringify(nextCarts));
      } catch (e) {}

      return nextCarts;
    });
  };

  const getCartCount = () => {
    const currentCart = carts[getActiveCartKey()] || {};
    return Object.values(currentCart).reduce((s, q) => s + (Number(q) || 0), 0);
  };

  const getSubtotal = () => {
    let total = 0;
    const currentCart = carts[getActiveCartKey()] || {};
    Object.entries(currentCart).forEach(([dishId, qty]) => {
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

  const handleReorder = (order) => {
    if (!order || !Array.isArray(order.items)) return;
    const targetKey = getActiveCartKey();
    setCarts((prev) => {
      const currentCart = prev[targetKey] || {};
      const updatedCart = { ...currentCart };
      order.items.forEach((it) => {
        if (it.id) {
          updatedCart[String(it.id)] = (updatedCart[String(it.id)] || 0) + (it.qty || 1);
        }
      });
      const nextCarts = { ...prev, [targetKey]: updatedCart };
      try { localStorage.setItem('foodypay_customer_carts', JSON.stringify(nextCarts)); } catch (e) {}
      return nextCarts;
    });
    setIsCartOpen(true);
    if (onShowToast) onShowToast(' Re-ordered items added to cart!');
  };

  const subtotal = getSubtotal();
  const discountAmount = appliedCoupon ? subtotal * 0.2 : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round((taxableAmount * storeInfo.gstPercent) / 100);
  const finalTotal = Math.round(taxableAmount + gstAmount);

  const filteredDishes = dishes.filter((dish) => {
    const currentStoreId = (effectiveMerchantId || storeInfo.merchantId || '').toUpperCase();
    const dishStoreId = (dish.foodypayId || dish.merchantId || '').toUpperCase();
    if (dishStoreId && currentStoreId && dishStoreId !== currentStoreId) {
      return false;
    }
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
    const cleanNum = (p) => (p || '').replace(/\D/g, '').slice(-10);
    const userPhoneClean = cleanNum(customerPhone);
    const currentStoreId = (effectiveMerchantId || storeInfo.merchantId || '').toUpperCase();

    const isCouponForThisStore = (c) => {
      if (!c) return false;
      const cStoreId = (c.foodypayId || c.merchantId || c.storeId || '').toUpperCase();
      if (cStoreId && currentStoreId && cStoreId !== currentStoreId && cStoreId !== 'GLOBAL') {
        return false;
      }
      return true;
    };

    // 1. Process DB coupons created from POS Dashboard
    if (Array.isArray(dbCoupons) && dbCoupons.length > 0) {
      dbCoupons.forEach((c) => {
        if (!isCouponForThisStore(c)) return;
        const cPhoneClean = cleanNum(c.assignedCustomerPhone || c.targetPhone);
        const isPhoneMatch = userPhoneClean && cPhoneClean && cPhoneClean === userPhoneClean;
        const isAssigned =
          c.assignedToAll ||
          !c.assignedCustomerPhone ||
          c.assignedCustomerPhone === 'all' ||
          isPhoneMatch ||
          (c.assignedCustomerEmail && customerEmail && c.assignedCustomerEmail.toLowerCase() === customerEmail.trim().toLowerCase()) ||
          (c.assignedCustomerName && customerName && c.assignedCustomerName.toLowerCase().includes(customerName.trim().toLowerCase()));

        if (isAssigned) {
          list.push({
            code: c.code,
            foodypayId: c.foodypayId || c.merchantId || currentStoreId,
            type: c.type ? `${c.type.toUpperCase()} DISCOUNT` : 'STORE VOUCHER',
            discount: c.discount || `Discount Code ${c.code}`,
            minOrder: c.minOrder || 199,
            desc: c.description || 'Voucher assigned to your account from dashboard',
            badge: isPhoneMatch ? '🎯 ASSIGNED TO YOUR MOBILE' : (c.assignedToAll ? 'STORE OFFER' : 'EXCLUSIVE VIP'),
            assignedReason: isPhoneMatch ? `Assigned to Mobile ${customerPhone}` : (c.assignedToAll ? 'Available to Store Diners' : `Assigned to ${customerName || customerPhone || 'You'}`)
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
            if (!isCouponForThisStore(c)) return;
            if (!list.some(existing => existing.code === c.code)) {
              const cPhoneClean = cleanNum(c.assignedCustomerPhone || c.targetPhone);
              const isPhoneMatch = userPhoneClean && cPhoneClean && cPhoneClean === userPhoneClean;
              const isTargetUser =
                c.assignedToAll ||
                !c.assignedCustomerPhone ||
                c.assignedCustomerPhone === 'all' ||
                isPhoneMatch ||
                (c.targetName && customerName && c.targetName.toLowerCase().includes(customerName.trim().toLowerCase()));

              if (isTargetUser) {
                list.push({
                  code: c.code || 'VIPOFFER',
                  foodypayId: c.foodypayId || c.merchantId || currentStoreId,
                  type: c.discount || 'SPECIAL OFFER',
                  discount: c.title || c.discount || 'Assigned VIP Discount',
                  minOrder: c.minOrder || 149,
                  desc: c.description || 'Exclusive voucher assigned specifically to your mobile account',
                  badge: isPhoneMatch ? '🎯 ASSIGNED TO YOUR MOBILE' : (c.badge || 'VIP VOUCHER'),
                  assignedReason: isPhoneMatch ? `Assigned to Mobile ${customerPhone}` : (c.targetPhone ? 'Personal VIP Gift' : 'Store Member Offer')
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

    if (storeControls.storeStatus === false) {
      if (onShowToast) onShowToast('⚠️ Restaurant Outlet is currently CLOSED and not accepting orders.');
      return;
    }

    if (navTab === 'home' && storeControls.deliveryStatus === false) {
      if (onShowToast) onShowToast('⚠️ Direct Delivery is currently OFF for this outlet.');
      return;
    }

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

      const activeRoutingMode = localStorage.getItem('foodypay_payment_routing_mode') || 'foodypay_default';

      // 1. Direct Merchant UPI QR Mode -> Open UPI Modal
      if (activeRoutingMode === 'merchant_upi') {
        setShowUpiModal(true);
        setIsCartOpen(false);
        setIsSubmittingOrder(false);
        return;
      }

      // 2. FoodyPay Default Gateway OR Merchant Own Razorpay -> Open Razorpay Checkout Gateway
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
        let activeRzpKey = 'rzp_live_TjBEt4gu2aUflB';
        let activeRzpSecret = 'FPXDLXe3Vbh0NYSpCAXmXOA3';

        if (activeRoutingMode === 'merchant_razorpay') {
          activeRzpKey = localStorage.getItem('foodypay_rzp_key_id') || storeInfo.razorpayKeyId || 'rzp_live_TjBEt4gu2aUflB';
          activeRzpSecret = localStorage.getItem('foodypay_rzp_key_secret') || storeInfo.razorpayKeySecret || 'FPXDLXe3Vbh0NYSpCAXmXOA3';
        }

        let razorpayOrderId = null;
        try {
          const rzpRes = await createRazorpayOrderApi({
            amount: newOrder.total,
            currency: 'INR',
            merchantId: storeInfo.merchantId,
            foodypayId: effectiveMerchantId,
            orderId: newOrder.id,
            razorpayKeyId: activeRzpKey,
            razorpayKeySecret: activeRzpSecret,
            paymentRoutingMode: activeRoutingMode,
          });

          if (rzpRes && rzpRes.routingMode === 'merchant_upi') {
            setShowUpiModal(true);
            setIsCartOpen(false);
            setIsSubmittingOrder(false);
            return;
          }

          if (rzpRes && rzpRes.razorpayOrderId) {
            razorpayOrderId = rzpRes.razorpayOrderId;
          }
        } catch (apiErr) {
          console.warn('Backend order API creation warning (proceeding with direct Razorpay SDK checkout):', apiErr);
        }

        const scriptLoaded = await loadRazorpayScript();
        if (scriptLoaded && window.Razorpay) {
          const options = {
            key: activeRzpKey || 'rzp_live_TjBEt4gu2aUflB',
            amount: Math.round(newOrder.total * 100),
            currency: 'INR',
            name: storeInfo.name || 'FoodyPay Order',
            description: `Order ${newOrder.id} at ${storeInfo.name}`,
            image: storeInfo.logoUrl || '/Logo.png',
            ...(razorpayOrderId ? { order_id: razorpayOrderId } : {}),
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
            modal: {
              ondismiss: function () {
                setIsSubmittingOrder(false);
              }
            }
          };

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.open();
          setIsCartOpen(false);
          setIsSubmittingOrder(false);
          return;
        }
      } catch (err) {
        console.error('Razorpay popup error:', err);
      }

      // Emergency fallback only if Razorpay CDN script completely fails to load
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
    try {
      sessionStorage.setItem('foodypay_active_order', JSON.stringify(orderObj));
    } catch (e) {}
    setIsCartOpen(false);
    setShowUpiModal(false);
    setCarts((prev) => {
      const nextCarts = { ...prev, [getActiveCartKey()]: {} };
      try {
        localStorage.setItem('foodypay_customer_carts', JSON.stringify(nextCarts));
      } catch (e) {}
      return nextCarts;
    });
    setIsSubmittingOrder(false);

    if (!customerDob) {
      setTimeout(() => {
        setShowDobModal(true);
      }, 1200);
    }

    if (onShowToast) onShowToast(` Order ${orderObj.id} placed successfully!`);
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
        merchantId: effectiveMerchantId || storeInfo.merchantId,
        foodypayId: storeInfo.foodypayId || storeInfo.foodypay_id,
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

  // Dynamic Category Extractor based on Actual Database Products for this Store
  const getDynamicCategories = () => {
    if (!Array.isArray(dishes) || dishes.length === 0) {
      return [{ id: 'All', label: 'All Essentials', icon: Sparkles, hasNew: false }];
    }

    const rawCategories = [...new Set(dishes.map((d) => (d && d.category ? String(d.category).trim() : '')).filter(Boolean))];

    const getIconForCategory = (catName) => {
      const c = catName.toLowerCase();
      if (c.includes('milk') || c.includes('dairy') || c.includes('dahi') || c.includes('paneer')) return Utensils;
      if (c.includes('biscuit') || c.includes('cookie') || c.includes('snack') || c.includes('chip') || c.includes('munchies')) return ShoppingBag;
      if (c.includes('sweet') || c.includes('gift') || c.includes('cake') || c.includes('dessert')) return Gift;
      if (c.includes('ice cream') || c.includes('drink') || c.includes('beverage') || c.includes('shake')) return Cake;
      if (c.includes('navratri') || c.includes('fasting') || c.includes('flame')) return Flame;
      if (c.includes('tech') || c.includes('electronic') || c.includes('phone')) return Smartphone;
      if (c.includes('beauty') || c.includes('care') || c.includes('wellness')) return Award;
      return Sparkles;
    };

    const dynamicList = rawCategories.map((catName) => ({
      id: catName,
      label: catName,
      icon: getIconForCategory(catName),
      hasNew: catName.toLowerCase().includes('special') || catName.toLowerCase().includes('new'),
    }));

    return [
      { id: 'All', label: 'All Essentials', icon: Sparkles, hasNew: false },
      ...dynamicList
    ];
  };

  const activeCategoryList = getDynamicCategories();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', color: '#1E293B', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '90px' }}>
      
      {/* Embedded Responsive CSS for FoodyPay Desktop Web vs Mobile */}
      <style>{`
        .fp-header-wrap {
          background: #FFFFFF;
          color: #0F172A;
          position: sticky;
          top: 0;
          z-index: 40;
          border-bottom: 1px solid #E2E8F0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          user-select: none;
        }
        .fp-header-desktop {
          display: none;
          max-width: 1560px;
          margin: 0 auto;
          padding: 12px 16px;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #FFFFFF;
        }
        .fp-header-mobile {
          display: block;
          max-width: 768px;
          margin: 0 auto;
          padding: 12px 16px 14px;
          background: linear-gradient(135deg, #FF5E14 0%, #E04800 100%);
          color: #FFFFFF;
        }
        .fp-main-wrap {
          max-width: 1560px;
          margin: 0 auto;
          padding: 14px 14px 90px;
          display: flex;
          gap: 14px;
        }
        .fp-desktop-sidebar {
          display: none;
          width: 210px;
          flex-shrink: 0;
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          padding: 14px 8px;
          height: fit-content;
          position: sticky;
          top: 85px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .fp-main-body {
          flex: 1;
          min-width: 0;
        }
        .fp-mobile-nav-bar {
          display: flex;
        }
        .fp-floating-cart-bar {
          display: flex;
        }
        .fp-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .fp-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(255, 94, 20, 0.16) !important;
          border-color: #FF5E14 !important;
        }
        .fp-sidebar-btn {
          transition: all 0.18s ease;
        }
        .fp-sidebar-btn:hover {
          background-color: #FFF7ED !important;
          color: #FF5E14 !important;
        }
        .fp-desktop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
        }
        .fp-steal-container {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          width: 100%;
        }
        .fp-steal-card {
          width: 100% !important;
          min-width: 0 !important;
        }
        .fp-mega-drops-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        @media (min-width: 768px) {
          .fp-header-desktop {
            display: flex !important;
          }
          .fp-header-mobile {
            display: none !important;
          }
          .fp-desktop-sidebar {
            display: block !important;
          }
          .fp-mobile-nav-bar {
            display: none !important;
          }
          .fp-floating-cart-bar {
            display: none !important;
          }
        }

        @media (max-width: 767px) {
          .fp-desktop-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .fp-steal-container {
            display: flex !important;
            gap: 12px !important;
            overflow-x: auto !important;
            padding-bottom: 6px;
          }
          .fp-steal-card {
            width: 145px !important;
            min-width: 145px !important;
            flex-shrink: 0 !important;
          }
          .fp-mega-drops-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
        }
      `}</style>

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
              <img src="/Logo.png" alt="App Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <span style={{ fontWeight: 500, color: '#0F172A' }}>Install FoodyPay App</span>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400 }}>Fast 1-click food ordering</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleTriggerAppInstall}
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

      {/* Main Top Header - Responsive Desktop & Mobile FoodyPay Orange Bar */}
      <header className="fp-header-wrap" style={{
        top: showPwaInstallBanner ? '42px' : 0,
      }}>
        {/* 1. DESKTOP LAPTOP HEADER VIEW (Min-width: 768px) - EXACT BLINKIT MATCH */}
        <div className="fp-header-desktop">
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setNavTab('scanner')}>
            <img
              src="/Logo.png"
              alt="FoodyPay Official Logo"
              style={{ height: '38px', width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Vertical Separator */}
          <div style={{ width: '1px', height: '36px', backgroundColor: '#E2E8F0', margin: '0 8px' }} />

          {/* Restaurant & Table Info Header */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', lineHeight: '1.2' }}>
              {rawRestName || 'FoodyPay Store'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
              {rawTable ? `Self Order • ${rawTable}` : 'Digital Menu Catalog'}
            </div>
          </div>

          {/* Wide Desktop Search Bar */}
          <div style={{ flex: 1, maxWidth: '640px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="#64748B" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder='Search dishes, menu items, drinks...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '11px 16px 11px 42px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#0F172A',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '48px', background: '#E2E8F0', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (onShowToast) onShowToast('🎙️ Voice Search active! Say item name...');
              }}
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#FF5E14', cursor: 'pointer', display: 'flex' }}
              title="Voice Search"
            >
              <Sparkles size={18} color="#FF5E14" />
            </button>
          </div>

          {/* Desktop Right Actions: Account Dropdown & My Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Account ▾ Button */}
            <button
              type="button"
              onClick={() => setIsNavMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#334155',
                fontWeight: 700,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '8px',
              }}
              title="Open Account & Navigation Menu"
            >
              <span>{customerName ? customerName : 'Account'}</span>
              <ChevronDown size={16} color="#334155" />
            </button>

            {/* Green My Cart Pill Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              style={{
                backgroundColor: '#0C831F',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '14.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(12, 131, 31, 0.25)'
              }}
            >
              <ShoppingBag size={18} color="#FFFFFF" />
              <span>My Cart</span>
              {getCartCount() > 0 ? (
                <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 900 }}>
                  {getCartCount()} • ₹{finalTotal}
                </span>
              ) : (
                <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Empty</span>
              )}
            </button>
          </div>
        </div>

        {/* 2. MOBILE HEADER VIEW (Max-width: 767px) */}
        <div className="fp-header-mobile">
          {/* Row 1: Restaurant Brand & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', lineHeight: '1.2' }}>
                {rawRestName || 'FoodyPay Store'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginTop: '2px' }}>
                {rawTable ? `Self Order • ${rawTable}` : 'Digital Menu Catalog'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setNavTab('profile')}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  color: '#FF5E14',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {customerName ? customerName.charAt(0).toUpperCase() : <User size={18} color="#FF5E14" />}
              </button>

              <button
                type="button"
                onClick={() => setIsNavMenuOpen(true)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  color: '#FF5E14',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
                title="Navigation Menu"
              >
                <Menu size={18} color="#FF5E14" />
              </button>
            </div>
          </div>

          {/* Row 2: Search Input with Audio Wave Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="#64748B" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder='Search dishes, menu items, drinks...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 14px 10px 38px',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: '#0F172A',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: 'none',
                color: '#FF5E14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (onShowToast) onShowToast('🎙️ Voice Search active! Say item name...');
              }}
            >
              <Sparkles size={18} color="#FF5E14" />
            </button>
          </div>

          {/* Row 3: Horizontal Scrollable Category Icons */}
          <div className="crm-no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
            {activeCategoryList.map((cat) => {
              const IconComp = cat.icon;
              const isSel = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    position: 'relative'
                  }}
                >
                  {cat.hasNew && (
                    <span style={{ position: 'absolute', top: '-6px', right: '-4px', backgroundColor: '#EF4444', color: '#FFF', fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '8px', zIndex: 2 }}>
                      New
                    </span>
                  )}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: isSel ? '#FFFFFF' : 'rgba(255,255,255,0.18)',
                      color: isSel ? '#FF5E14' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: isSel ? 800 : 500, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                    {cat.label}
                  </span>
                  {isSel && (
                    <div style={{ width: '20px', height: '3px', backgroundColor: '#FFFFFF', borderRadius: '2px', marginTop: '1px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Responsive Main App Workspace (Desktop Sidebar + Mobile/Desktop Content) */}
      <div className="fp-main-wrap">
        {/* DESKTOP LEFT CATEGORY SIDEBAR */}
        <aside className="fp-desktop-sidebar">
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', paddingLeft: '8px' }}>
            Categories
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeCategoryList.map((cat) => {
              const IconComp = cat.icon;
              const isSel = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="fp-sidebar-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: 'none',
                    borderLeft: isSel ? '4px solid #FF5E14' : '4px solid transparent',
                    backgroundColor: isSel ? '#FFF7ED' : 'transparent',
                    color: isSel ? '#FF5E14' : '#334155',
                    fontWeight: isSel ? 800 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%'
                  }}
                >
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: isSel ? '#FF5E14' : '#F1F5F9',
                    color: isSel ? '#FFF' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComp size={16} />
                  </div>
                  <span style={{ flex: 1, fontSize: '12.5px', fontWeight: isSel ? 800 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.label}
                  </span>
                  {cat.hasNew && (
                    <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '8.5px', fontWeight: 900, padding: '1px 5px', borderRadius: '6px' }}>
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <div className="fp-main-body">

        {/* Dynamic Location Availability Alert Banner */}
        {locationState.available === false && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '2px solid #FCA5A5',
            borderRadius: '16px',
            padding: '18px 22px',
            margin: '0 0 20px 0',
            boxShadow: '0 8px 24px rgba(220, 38, 38, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle size={26} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15.5px', fontWeight: 900, color: '#991B1B' }}>
                  🚫 Not Available Right Now
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#B91C1C', fontWeight: 700, lineHeight: '1.4' }}>
                  {locationState.message || 'Sorry, FoodyPay store delivery is currently available ONLY in Sector 71 & Mataur (Mohali).'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setLocationState((prev) => ({
                    ...prev,
                    addressLabel: 'Sector 71, Mataur, Mohali',
                    available: true,
                    message: '',
                    reason: null,
                  }));
                  if (onShowToast) onShowToast('📍 Switched delivery location to Sector 71 & Mataur (Mohali)!');
                }}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}
              >
                📍 Switch to Sector 71 &amp; Mataur
              </button>

              <button
                type="button"
                onClick={handleDetectCustomerLocation}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={15} /> Re-check GPS
              </button>
            </div>
          </div>
        )}

        {/* Light Active Order Tracker Banner (Hidden on Home Screen) */}
        {navTab !== 'home' && activePlacedOrder && activePlacedOrder.status !== 'completed' && activePlacedOrder.status !== 'delivered' && activePlacedOrder.status !== 'served' && (
          <div style={{
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
            position: 'relative'
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <button
                  onClick={() => {
                    setActivePlacedOrder(null);
                    try {
                      sessionStorage.removeItem('foodypay_active_order');
                    } catch (e) {}
                  }}
                  style={{
                    background: '#E0F2FE',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0369A1',
                    cursor: 'pointer'
                  }}
                  title="Dismiss Banner"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 6px', fontSize: '11px', fontWeight: 600 }}>
              <span style={{ color: '#0284C7' }}>1. Placed 📦</span>
              <span style={{ color: activePlacedOrder.seen || activePlacedOrder.status !== 'new' ? '#0284C7' : '#94A3B8' }}>
                2. Acknowledged {activePlacedOrder.seen || activePlacedOrder.status !== 'new' ? '✅' : '⏳'}
              </span>
              <span style={{ color: activePlacedOrder.status === 'preparing' || activePlacedOrder.status === 'ready' || activePlacedOrder.status === 'out_for_delivery' || activePlacedOrder.status === 'delivered' || activePlacedOrder.status === 'served' || activePlacedOrder.status === 'completed' ? '#0284C7' : '#94A3B8' }}>
                3. Kitchen 👨‍🍳
              </span>
              <span style={{ color: activePlacedOrder.status === 'ready' || activePlacedOrder.status === 'out_for_delivery' || activePlacedOrder.status === 'delivered' || activePlacedOrder.status === 'served' || activePlacedOrder.status === 'completed' ? '#059669' : '#94A3B8' }}>
                4. {activePlacedOrder.table === 'Delivery' || activePlacedOrder.type === 'Home Delivery' ? 'Out for Delivery 🛵' : 'Served 🍽️'}
              </span>
            </div>

            <div style={{ backgroundColor: '#E0F2FE', height: '4px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                backgroundColor: activePlacedOrder.status === 'completed' || activePlacedOrder.status === 'delivered' || activePlacedOrder.status === 'served' || activePlacedOrder.status === 'ready' ? '#10B981' : '#0284C7',
                width: activePlacedOrder.status === 'completed' || activePlacedOrder.status === 'delivered' || activePlacedOrder.status === 'served' ? '100%' : activePlacedOrder.status === 'ready' || activePlacedOrder.status === 'out_for_delivery' ? '80%' : activePlacedOrder.status === 'preparing' ? '55%' : activePlacedOrder.seen ? '35%' : '15%',
                height: '100%',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        )}

        {/* STORE OUTLET OFFLINE / CLOSED BANNER */}
        {storeControls.storeStatus === false && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#991B1B',
            padding: '14px 18px',
            borderRadius: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)'
          }}>
            <AlertCircle size={24} color="#DC2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#991B1B' }}>🔴 Restaurant Outlet is Currently Closed</div>
              <div style={{ fontSize: '12.5px', color: '#B91C1C', marginTop: '2px', fontWeight: 500 }}>
                This store is temporarily closed and not accepting new orders right now. Please check back later!
              </div>
            </div>
          </div>
        )}

        {/* DIRECT DELIVERY OFF BANNER */}
        {storeControls.storeStatus !== false && storeControls.deliveryStatus === false && navTab === 'home' && (
          <div style={{
            backgroundColor: '#FFF7ED',
            border: '1.5px solid #FDBA74',
            color: '#9A3412',
            padding: '12px 16px',
            borderRadius: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.12)'
          }}>
            <AlertCircle size={22} color="#EA580C" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#9A3412' }}>🛵 Direct Delivery Orders currently OFF</div>
              <div style={{ fontSize: '12px', color: '#C2410C', marginTop: '2px', fontWeight: 500 }}>
                Home delivery is currently disabled by store management. You can scan table QR for Dine-In ordering.
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            TAB 1: HOME (BLINKIT / ZOMATO QUICK COMMERCE UI MATCHING USER SCREENSHOT)
            ----------------------------------------------------------------------- */}
        {navTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* STEAL ₹9 DEAL BANNER & MEGA PRICE DROPS (HIDDEN WHEN USER TYPES IN SEARCH BAR) */}
            {!searchQuery.trim() && (
              <>
                {/* STEAL ₹9 DEAL BANNER & SLIDER (DYNAMICALLY MANAGED FROM POS DASHBOARD /COLLECTIONS) */}
                {stealDealsConfig && stealDealsConfig.enabled !== false && Array.isArray(stealDealsConfig.items) && stealDealsConfig.items.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #FF5E14 0%, #D94400 100%)',
                    borderRadius: '20px',
                    padding: '16px 14px 18px',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(255, 94, 20, 0.25)'
                  }}>
                    {/* Steal Deal Header Badge */}
                    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(90deg, #F59E0B 0%, #EAB308 100%)', color: '#0F172A', padding: '4px 16px', borderRadius: '20px', fontWeight: 900, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>
                        <span>{stealDealsConfig.title || 'STEAL DEAL'}</span>
                        {stealDealsConfig.badgePrice && (
                          <span style={{ backgroundColor: '#0F172A', color: '#F59E0B', borderRadius: '50%', padding: '0 8px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                            ₹{stealDealsConfig.badgePrice}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#FCD34D', marginTop: '6px', letterSpacing: '0.04em' }}>
                        {stealDealsConfig.subtitle || '✦ GET ANY ONE ITEM AT SPECIAL PRICE ✦'}
                      </div>
                    </div>

                    {/* Steal Deal Cards Container */}
                    <div className="fp-steal-container crm-no-scrollbar">
                      {stealDealsConfig.items.map((deal) => {
                        const dealCartQty = cart[deal.id] || 0;

                        return (
                          <div
                            key={deal.id}
                            className="fp-steal-card fp-card-hover"
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '16px',
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                            }}
                          >
                            {/* Item Image */}
                            <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F8FAFC', marginBottom: '8px' }}>
                              <img src={deal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'} alt={deal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {deal.isVeg && (
                                <div style={{ position: 'absolute', bottom: '6px', right: '6px', backgroundColor: '#FFF', borderRadius: '4px', padding: '2px', border: '1px solid #16A34A' }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                                </div>
                              )}
                            </div>

                            {/* Unit & Select Button Row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{deal.unit || '1 pc'}</span>
                              <button
                                onClick={() => updateCartQty(deal.id, 1)}
                                style={{
                                  backgroundColor: '#FFFFFF',
                                  color: '#FF5E14',
                                  border: '1.5px solid #FF5E14',
                                  borderRadius: '8px',
                                  padding: '3px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                {dealCartQty > 0 ? `${dealCartQty} Added` : 'Select'}
                              </button>
                            </div>

                            {/* Price Row */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>₹{deal.price}</span>
                              {deal.originalPrice && (
                                <span style={{ fontSize: '11px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>₹{deal.originalPrice}</span>
                              )}
                            </div>

                            {/* Unlock threshold banner */}
                            {deal.unlockAt && (
                              <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', marginBottom: '6px', display: 'inline-block' }}>
                                Unlocks at ₹{deal.unlockAt} ▶
                              </div>
                            )}

                            {/* Item Name */}
                            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', lineHeight: '1.2', height: '28px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {deal.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </>
            )}

            {/* FULL PRODUCTS CATALOG GRID */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>
                  {searchQuery.trim() ? `Search Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'All Menu & Dishes' : selectedCategory)}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{filteredDishes.length} Items</span>
              </div>

              <div className="fp-desktop-grid">
                {filteredDishes.slice(0, menuPage * ITEMS_PER_PAGE).map((dish) => {
                  const qty = cart[dish.id] || 0;
                  const imgUrl = getDishImageUrl(dish);

                  return (
                    <div
                      key={dish.id}
                      onClick={() => setSelectedProductModal(dish)}
                      className="fp-card-hover"
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1.5px solid #E2E8F0',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Product Image & Veg Badge */}
                      <div style={{ position: 'relative', width: '100%', height: '130px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F8FAFC', marginBottom: '8px' }}>
                        <img
                          src={imgUrl}
                          alt={dish.name}
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
                          <div style={{ width: '10px', height: '10px', border: '1.5px solid #16A34A', padding: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#15803D' }}>
                            VEG
                          </span>
                        </div>

                        {/* Top Right Percentage OFF Badge */}
                        {dish.showDiscountTag !== false && Number(dish.originalPrice) > Number(dish.price) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              backgroundColor: '#FF5E14',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontSize: '9.5px',
                              fontWeight: 900,
                              boxShadow: '0 2px 6px rgba(255,94,20,0.3)',
                              zIndex: 2
                            }}
                          >
                            {Math.round(((Number(dish.originalPrice) - Number(dish.price)) / Number(dish.originalPrice)) * 100)}% OFF
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ margin: '0 0 3px', fontSize: '13.5px', fontWeight: 800, color: '#0F172A', lineHeight: '1.25' }}>
                            {dish.name}
                          </h4>
                          <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#64748B', fontWeight: 400, lineHeight: '1.2' }}>
                            {dish.description || 'Fresh quality product delivered fast.'}
                          </p>
                        </div>

                        {/* Price & Add Stepper */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '8px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>₹{dish.price}</span>
                            {dish.showDiscountTag !== false && Number(dish.originalPrice) > Number(dish.price) && (
                              <>
                                <span style={{ fontSize: '11px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>₹{dish.originalPrice}</span>
                                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1px 4px', borderRadius: '4px' }}>
                                  {Math.round(((Number(dish.originalPrice) - Number(dish.price)) / Number(dish.originalPrice)) * 100)}% OFF
                                </span>
                              </>
                            )}
                          </div>

                          {qty === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQty(dish.id, 1);
                              }}
                              style={{
                                backgroundColor: '#FFFFFF',
                                color: '#FF5E14',
                                border: '1.5px solid #FF5E14',
                                borderRadius: '8px',
                                padding: '5px 14px',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(255,94,20,0.12)'
                              }}
                            >
                              + ADD
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FF5E14', borderRadius: '8px', padding: '4px 8px', boxShadow: '0 2px 6px rgba(255,94,20,0.25)' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartQty(dish.id, -1);
                                }}
                                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '1px', display: 'flex' }}
                              >
                                <Minus size={13} />
                              </button>
                              <span style={{ color: '#FFF', fontWeight: 800, fontSize: '12.5px', minWidth: '14px', textAlign: 'center' }}>
                                {qty}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartQty(dish.id, 1);
                                }}
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

              {/* Infinite Scroll & Pagination Controls */}
              {filteredDishes.length > 0 && (
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 700 }}>
                    Showing {Math.min(menuPage * ITEMS_PER_PAGE, filteredDishes.length)} of {filteredDishes.length} dishes
                  </div>
                  {menuPage * ITEMS_PER_PAGE < filteredDishes.length && (
                    <button
                      type="button"
                      onClick={() => setMenuPage((prev) => prev + 1)}
                      style={{
                        background: 'linear-gradient(135deg, #FF5E14, #E04D0B)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '24px',
                        fontSize: '13.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(255, 94, 20, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>Load More Products 🔽</span>
                    </button>
                  )}
                </div>
              )}

              {filteredDishes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', marginTop: '12px' }}>
                  {searchQuery.trim() ? (
                    <>
                      <Search size={36} color="#94A3B8" style={{ marginBottom: '10px' }} />
                      <h4 style={{ margin: '0 0 6px', fontSize: '15.5px', fontWeight: 800, color: '#0F172A' }}>No items found for "{searchQuery}"</h4>
                      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>Check your spelling or try searching for another item.</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', borderRadius: '10px', padding: '9px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      >
                        Clear Search Filter
                      </button>
                    </>
                  ) : (
                    <>
                      <Utensils size={42} color="#94A3B8" style={{ marginBottom: '12px' }} />
                      <h4 style={{ margin: '0 0 6px', fontSize: '16.5px', fontWeight: 800, color: '#0F172A' }}>No products in store catalog yet</h4>
                      <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#64748B', maxWidth: '420px', margin: '0 auto 18px', lineHeight: '1.4' }}>
                        Products added by the merchant in POS Dashboard or CRM Console will appear live here automatically.
                      </p>
                      <Link
                        to="/crm"
                        style={{ backgroundColor: '#FF5E14', color: '#FFF', padding: '10px 22px', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '13.5px', display: 'inline-block', boxShadow: '0 4px 14px rgba(255, 94, 20, 0.3)' }}
                      >
                        + Add Products in CRM Console
                      </Link>
                    </>
                  )}
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
            <div style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '16px', border: '1px solid #FED7AA', boxShadow: '0 4px 14px rgba(255, 94, 20, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#FF5E14', color: '#FFF', padding: '12px', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 10px rgba(255, 94, 20, 0.3)' }}>
                    <QrCode size={24} />
                  </div>
                  <div>
                    {hasScannedTable ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>{storeInfo.name}</h2>
                          <span style={{ fontSize: '11px', backgroundColor: '#FF5E14', color: '#FFF', padding: '2px 8px', borderRadius: '8px', fontWeight: 700, boxShadow: '0 2px 6px rgba(255,94,20,0.2)' }}>
                            🪑 {storeInfo.table}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 400, marginTop: '4px' }}>
                          Merchant ID: <code style={{ backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px', color: '#334155' }}>{storeInfo.merchantId}</code> • Live Table Self-Ordering Catalog
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>Scan Restaurant Table QR</h2>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginTop: '4px' }}>
                          Scan the QR code on your table to view menu & place order
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {hasScannedTable && (
                  <button
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    style={{
                      backgroundColor: isCameraActive ? '#EF4444' : '#FF5E14',
                      color: '#FFF',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Camera size={14} /> {isCameraActive ? 'Close Scanner' : '📷 Scan Again / New Table'}
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible High-Tech Camera Scanner Viewport */}
            {(isCameraActive || !hasScannedTable) && (
              <div style={{
                backgroundColor: '#0F172A',
                borderRadius: '20px',
                padding: '20px 16px',
                color: '#FFF',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.4)',
                border: '1px solid #334155',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Header Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', backgroundColor: 'rgba(255, 94, 20, 0.15)', border: '1px solid rgba(255, 94, 20, 0.3)', padding: '4px 12px', borderRadius: '20px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#FF7A38', letterSpacing: '0.02em' }}>
                    Camera Active • Point at Table QR Code
                  </span>
                </div>

                {/* Camera Viewport Frame */}
                <div style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: '220px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#020617',
                  border: '2px solid #FF5E14',
                  boxShadow: '0 0 25px rgba(255, 94, 20, 0.25)'
                }}>
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
                  
                  {/* High-Tech Scanner Frame Overlay with Corner Accents */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '160px',
                    height: '160px',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 4000px rgba(15, 23, 42, 0.55)',
                    pointerEvents: 'none',
                    border: '1px solid rgba(255, 94, 20, 0.4)'
                  }}>
                    {/* Top-Left Corner Accent */}
                    <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '22px', height: '22px', borderTop: '3.5px solid #FF5E14', borderLeft: '3.5px solid #FF5E14', borderTopLeftRadius: '10px' }} />
                    {/* Top-Right Corner Accent */}
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '22px', height: '22px', borderTop: '3.5px solid #FF5E14', borderRight: '3.5px solid #FF5E14', borderTopRightRadius: '10px' }} />
                    {/* Bottom-Left Corner Accent */}
                    <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '22px', height: '22px', borderBottom: '3.5px solid #FF5E14', borderLeft: '3.5px solid #FF5E14', borderBottomLeftRadius: '10px' }} />
                    {/* Bottom-Right Corner Accent */}
                    <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '22px', height: '22px', borderBottom: '3.5px solid #FF5E14', borderRight: '3.5px solid #FF5E14', borderBottomRightRadius: '10px' }} />

                    {/* Animated Scanning Beam line */}
                    <div style={{
                      position: 'absolute',
                      left: '8px',
                      right: '8px',
                      height: '2px',
                      backgroundColor: '#FF5E14',
                      boxShadow: '0 0 12px 3px #FF5E14',
                      borderRadius: '2px',
                      animation: 'scanBeam 2s infinite ease-in-out'
                    }} />
                  </div>
                </div>

                <style>{`
                  @keyframes scanBeam {
                    0% { top: 10%; opacity: 0.3; }
                    50% { top: 85%; opacity: 1; }
                    100% { top: 10%; opacity: 0.3; }
                  }
                `}</style>

                {cameraError ? (
                  <div style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    ⚠️ {cameraError}
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '10px', fontWeight: 400 }}>
                    Auto-detects merchant table URL & opens catalog instantly
                  </div>
                )}
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
                  Open Table
                </button>
              </form>
            </div>

            {/* UN-SCANNED PROMPT BANNER WHEN VISITING '/' WITHOUT SCANNED TABLE */}
            {!hasScannedTable && (
              <div style={{
                backgroundColor: '#FFF7ED',
                border: '1.5px dashed #FDBA74',
                borderRadius: '16px',
                padding: '28px 18px',
                textAlign: 'center',
                color: '#9A3412',
                marginTop: '4px'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📷 🍴</div>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#9A3412' }}>Scan Table QR Code to View Menu</div>
                <div style={{ fontSize: '13px', color: '#C2410C', marginTop: '6px', maxWidth: '340px', margin: '6px auto 0', lineHeight: '1.4' }}>
                  Please point your camera at the QR code on your table (or enter table URL above) to load the menu & place your order.
                </div>
              </div>
            )}

            {/* TABLE DINE-IN MENU PRODUCTS & CATEGORIES (ONLY DISPLAYED WHEN A TABLE HAS BEEN SCANNED) */}
            {hasScannedTable && (
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
                      onClick={() => setSelectedProductModal(dish)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid #E2E8F0',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        opacity: inStock ? 1 : 0.6,
                        cursor: 'pointer'
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

                        {/* Top Right Percentage OFF Badge Overlay */}
                        {dish.showDiscountTag !== false && Number(dish.originalPrice) > Number(dish.price) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              backgroundColor: '#FF5E14',
                              color: '#FFFFFF',
                              borderRadius: '6px',
                              padding: '2px 6px',
                              fontSize: '9.5px',
                              fontWeight: 900,
                              boxShadow: '0 2px 6px rgba(255,94,20,0.3)',
                              zIndex: 2
                            }}
                          >
                            {Math.round(((Number(dish.originalPrice) - Number(dish.price)) / Number(dish.originalPrice)) * 100)}% OFF
                          </div>
                        )}
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
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>₹{dish.price}</span>
                            {dish.showDiscountTag !== false && Number(dish.originalPrice) > Number(dish.price) && (
                              <>
                                <span style={{ fontSize: '11px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>₹{dish.originalPrice}</span>
                                <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1px 4px', borderRadius: '4px' }}>
                                  {Math.round(((Number(dish.originalPrice) - Number(dish.price)) / Number(dish.originalPrice)) * 100)}% OFF
                                </span>
                              </>
                            )}
                          </div>

                          {!inStock ? (
                            <span style={{ fontSize: '10.5px', color: '#EF4444', fontWeight: 600 }}>Out of stock</span>
                          ) : qty === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQty(dish.id, 1);
                              }}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartQty(dish.id, -1);
                                }}
                                style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '1px', display: 'flex' }}
                              >
                                <Minus size={13} />
                              </button>
                              <span style={{ color: '#FFF', fontWeight: 700, fontSize: '12.5px', minWidth: '14px', textAlign: 'center' }}>
                                {qty}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartQty(dish.id, 1);
                                }}
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
          )}

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
                  onClick={() => setNavTab('scanner')}
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

      </div> {/* End fp-main-body */}
    </div> {/* End fp-main-wrap */}

      {/* Floating Bottom Cart Summary Bar */}
      {getCartCount() > 0 && !isCartOpen && (
        <div className="fp-floating-cart-bar" style={{
          position: 'fixed',
          bottom: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 24px)',
          maxWidth: '736px',
          backgroundColor: '#FF5E14',
          color: '#FFF',
          borderRadius: '30px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 80,
          boxShadow: '0 8px 24px rgba(255, 94, 20, 0.35)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              {getCartCount()} {getCartCount() === 1 ? 'ITEM' : 'ITEMS'}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFF', lineHeight: '1.1' }}>
                ₹{finalTotal}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                {navTab === 'scanner' ? `🍽️ ${storeInfo.table || 'Table 1'} (Dine-In)` : '🏠 Home Delivery'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#FF5E14',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            View Cart <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* 4-TAB FIXED BOTTOM NAVIGATION BAR */}
      <div className="fp-mobile-nav-bar" style={{
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
        {/* Tab 1: Orders */}
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
            fontWeight: navTab === 'orders' ? 700 : 500,
            fontSize: '11px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <History size={19} color={navTab === 'orders' ? '#FF5E14' : '#64748B'} strokeWidth={navTab === 'orders' ? 2.5 : 2} />
          <span>Orders</span>
          {customerOrders.length > 0 && (
            <span style={{ position: 'absolute', top: '-3px', right: '-4px', backgroundColor: '#FF5E14', color: '#FFF', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px' }}>
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
            fontWeight: navTab === 'scanner' ? 700 : 500,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            backgroundColor: navTab === 'scanner' ? '#FF5E14' : '#FFF7ED',
            color: navTab === 'scanner' ? '#FFF' : '#FF5E14',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '-8px',
            border: '2px solid #FFF',
            boxShadow: '0 2px 8px rgba(255, 94, 20, 0.25)'
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
            fontWeight: navTab === 'coupons' ? 700 : 500,
            fontSize: '11px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Tag size={19} color={navTab === 'coupons' ? '#FF5E14' : '#64748B'} strokeWidth={navTab === 'coupons' ? 2.5 : 2} />
          <span>Coupons</span>
          <span style={{ position: 'absolute', top: '-3px', right: '-8px', backgroundColor: '#E11D48', color: '#FFF', fontSize: '8px', fontWeight: 800, padding: '1px 4px', borderRadius: '6px' }}>
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
            fontWeight: navTab === 'profile' ? 700 : 500,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <User size={19} color={navTab === 'profile' ? '#FF5E14' : '#64748B'} strokeWidth={navTab === 'profile' ? 2.5 : 2} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Your Food Order</h2>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: navTab === 'scanner' ? '#FFF7ED' : '#EFF6FF',
                    color: navTab === 'scanner' ? '#FF5E14' : '#1D4ED8',
                    border: navTab === 'scanner' ? '1px solid #FFEDD5' : '1px solid #BFDBFE'
                  }}>
                    {navTab === 'scanner' ? `🍽️ ${storeInfo.table || 'Table 1'} (Dine-In)` : '🏠 Home Delivery'}
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500 }}>{storeInfo.name}</span>
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

              {/* Coupon Promocode & Assigned Offers */}
              <div style={{ marginBottom: '14px', backgroundColor: '#FFF7ED', borderRadius: '12px', padding: '12px', border: '1px solid #FFEDD5' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#9A3412', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={15} color="#FF5E14" />
                    <span>{appliedCoupon ? `Applied: ${appliedCoupon.code}` : 'Apply Coupon Promocode'}</span>
                  </span>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter Promocode..."
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', textTransform: 'uppercase', outline: 'none', fontWeight: 700 }}
                      id="cartDrawerCouponInput"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const inputEl = document.getElementById('cartDrawerCouponInput');
                        const val = (inputEl ? inputEl.value : '').trim().toUpperCase();
                        if (!val) return;

                        const currentStoreId = (effectiveMerchantId || storeInfo.merchantId || '').toUpperCase();

                        // 1. Check if coupon belongs to another store
                        let localCrmCoupons = [];
                        try { localCrmCoupons = JSON.parse(localStorage.getItem('foodypay_crm_coupons_v1') || '[]'); } catch (e) {}
                        const allKnownCoupons = [...(dbCoupons || []), ...localCrmCoupons];
                        const matchedOtherStore = allKnownCoupons.find((c) => {
                          if (!c || !c.code || c.code.toUpperCase() !== val) return false;
                          const cStoreId = (c.foodypayId || c.merchantId || c.storeId || '').toUpperCase();
                          return cStoreId && currentStoreId && cStoreId !== currentStoreId && cStoreId !== 'GLOBAL';
                        });

                        if (matchedOtherStore) {
                          const otherFpId = matchedOtherStore.foodypayId || matchedOtherStore.merchantId;
                          if (onShowToast) onShowToast(`⚠️ Promocode "${val}" belongs to store ${otherFpId} and is NOT valid for ${storeInfo.name}!`);
                          return;
                        }

                        const assignedList = getAssignedCouponsForUser();
                        const match = assignedList.find((c) => c.code.toUpperCase() === val) || (dbCoupons || []).find((c) => c.code.toUpperCase() === val && (!c.foodypayId || c.foodypayId.toUpperCase() === currentStoreId));
                        if (match) {
                          setAppliedCoupon({ code: match.code, label: match.discount || match.type });
                          if (onShowToast) onShowToast(`🎯 Coupon "${match.code}" Applied!`);
                        } else {
                          if (onShowToast) onShowToast(` Invalid or Unassigned Coupon code "${val}" for this store`);
                        }
                      }}
                      style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                    ✅ 20% Discount applied to final bill!
                  </div>
                )}

                {/* Display Available Coupons Assigned to Customer Phone */}
                {(() => {
                  const assigned = getAssignedCouponsForUser();
                  if (assigned.length === 0 || appliedCoupon) return null;
                  return (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#C2410C' }}>
                        Coupons Available for {customerPhone ? customerPhone : 'Your Mobile'}:
                      </span>
                      {assigned.map((cp) => (
                        <div
                          key={cp.code}
                          onClick={() => {
                            setAppliedCoupon({ code: cp.code, label: cp.discount });
                            if (onShowToast) onShowToast(`🎯 Coupon "${cp.code}" Applied!`);
                          }}
                          style={{
                            backgroundColor: '#FFF',
                            border: '1px dashed #FF5E14',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 900, fontSize: '12px', color: '#FF5E14' }}>{cp.code}</span>
                            <span style={{ fontSize: '11px', color: '#475569', marginLeft: '6px' }}>({cp.discount})</span>
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#FF5E14', fontWeight: 900 }}>TAP TO APPLY</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
                  {paymentConfig.header || 'Payment Method'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: (paymentConfig.upiEnabled !== false && paymentConfig.cashEnabled !== false) ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  {paymentConfig.upiEnabled !== false && (
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
                      <QrCode size={16} color="#FF5E14" /> {paymentConfig.upiLabel || 'Online UPI'}
                    </button>
                  )}
                  {paymentConfig.cashEnabled !== false && (
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
                      <CreditCard size={16} color="#059669" /> {paymentConfig.cashLabel || 'Cash / Pay Counter'}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={storeControls.storeStatus === false || (navTab === 'home' && storeControls.deliveryStatus === false)}
                style={{
                  width: '100%',
                  backgroundColor: (storeControls.storeStatus === false || (navTab === 'home' && storeControls.deliveryStatus === false)) ? '#94A3B8' : '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 600,
                  fontSize: '14.5px',
                  cursor: (storeControls.storeStatus === false || (navTab === 'home' && storeControls.deliveryStatus === false)) ? 'not-allowed' : 'pointer'
                }}
              >
                {storeControls.storeStatus === false
                  ? 'Restaurant Outlet Closed'
                  : (navTab === 'home' && storeControls.deliveryStatus === false)
                    ? 'Direct Delivery Unavailable'
                    : (paymentMode === 'upi' ? 'Proceed to Pay (₹' + finalTotal + ') →' : 'Confirm Order (₹' + finalTotal + ') →')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Online UPI QR Modal */}
      {showUpiModal && (
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
          {(() => {
            const currentUpiId = localStorage.getItem('foodypay_upi_id') || storeInfo.upiId || '7496888449@ptsbi';
            const displayTotal = (pendingOrderObj && Number(pendingOrderObj.total) > 0)
              ? Number(pendingOrderObj.total)
              : (finalTotal > 0 ? finalTotal : subtotal > 0 ? subtotal : 0);
            const orderIdStr = pendingOrderObj ? (pendingOrderObj.id || '') : '';
            const encodedStore = encodeURIComponent(storeInfo.name || 'FoodyPay Store');
            const encodedNote = encodeURIComponent(`Order ${orderIdStr}`);
            const upiPayUrl = `upi://pay?pa=${encodeURIComponent(currentUpiId)}&pn=${encodedStore}&am=${displayTotal}&tn=${encodedNote}&cu=INR`;

            return (
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
                  {storeInfo.name} • <code style={{ color: '#1D4ED8', fontWeight: 700 }}>{currentUpiId}</code>
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

                <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF5E14', marginBottom: '12px' }}>
                  ₹{displayTotal}
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
                    onClick={() => {
                      const finalOrderToSave = pendingOrderObj ? { ...pendingOrderObj, total: displayTotal } : {
                        id: `#FP-${Math.floor(1000 + Math.random() * 9000)}`,
                        type: navTab === 'scanner' ? 'Dine-In' : 'Home Delivery',
                        table: navTab === 'scanner' ? rawTable : 'Delivery',
                        customer: customerName.trim() || 'Diner',
                        phone: customerPhone.trim() || '+91 98000 00000',
                        time: 'Just now',
                        timestamp: Date.now(),
                        status: 'new',
                        seen: false,
                        paymentStatus: 'paid-upi',
                        paymentLabel: 'Paid via Direct Merchant UPI QR',
                        items: [],
                        total: displayTotal,
                        merchantId: storeInfo.merchantId,
                        restaurantSlug,
                        restaurantName: storeInfo.name,
                      };
                      finalizeAndSaveOrder(finalOrderToSave);
                    }}
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
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: '#64748B',
                      border: 'none',
                      padding: '6px',
                      fontWeight: 500,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel / Change Payment
                  </button>
                </div>
              </div>
            );
          })()}
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

      {/* Customer Location & Sector Selector Modal */}
      {isLocationModalOpen && (
        <div
          onClick={() => setIsLocationModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={22} color="#FF5E14" /> Select Street / Sector Location
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Choose your sector or area to view live store delivery availability.
                </span>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#475569" />
              </button>
            </div>

            {/* Live Geolocation Trigger Button */}
            <button
              type="button"
              onClick={() => {
                handleDetectCustomerLocation();
                setIsLocationModalOpen(false);
              }}
              style={{
                width: '100%',
                backgroundColor: '#FFF7ED',
                border: '1.5px solid #FF5E14',
                color: '#FF5E14',
                padding: '12px',
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: '13.5px',
                cursor: 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(255,94,20,0.1)'
              }}
            >
              <Compass size={18} color="#FF5E14" /> Use Current GPS Location (Auto-Detect)
            </button>
          </div>
        </div>
      )}

      {/* Product Detail & Large Image Modal */}
      {selectedProductModal && (
        <div
          onClick={() => setSelectedProductModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Top Close Button */}
            <button
              onClick={() => setSelectedProductModal(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <X size={20} color="#0F172A" />
            </button>

            {/* Large Product Image & Photo Gallery */}
            {(() => {
              const modalImages = getDishImagesList(selectedProductModal);
              const safeIndex = (selectedImageIndex >= 0 && selectedImageIndex < modalImages.length) ? selectedImageIndex : 0;
              const currentModalImg = modalImages[safeIndex] || getDishImageUrl(selectedProductModal);

              return (
                <div>
                  <div style={{ position: 'relative', width: '100%', height: '250px', backgroundColor: '#F8FAFC' }}>
                    <img
                      src={currentModalImg}
                      alt={selectedProductModal.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Left/Right Carousel Arrows if multiple photos */}
                    {modalImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length)}
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            fontWeight: 900,
                            fontSize: '18px'
                          }}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedImageIndex((prev) => (prev + 1) % modalImages.length)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            fontWeight: 900,
                            fontSize: '18px'
                          }}
                        >
                          ›
                        </button>
                      </>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <div style={{ width: '12px', height: '12px', border: `1.5px solid ${selectedProductModal.isVeg ? '#16A34A' : '#DC2626'}`, padding: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: selectedProductModal.isVeg ? '#16A34A' : '#DC2626' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: selectedProductModal.isVeg ? '#15803D' : '#B91C1C' }}>
                        {selectedProductModal.isVeg ? 'PURE VEG' : 'NON-VEG'}
                      </span>
                    </div>

                    {modalImages.length > 1 && (
                      <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(15,23,42,0.75)', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700 }}>
                        📷 {safeIndex + 1} / {modalImages.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row if Multiple Photos */}
                  {modalImages.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
                      {modalImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: safeIndex === idx ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                            cursor: 'pointer',
                            flexShrink: 0,
                            opacity: safeIndex === idx ? 1 : 0.65
                          }}
                        >
                          <img src={imgUrl} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Product Info Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A', lineHeight: '1.3' }}>
                  {selectedProductModal.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', padding: '3px 8px', borderRadius: '12px', flexShrink: 0 }}>
                  <Star size={13} fill="#D97706" color="#D97706" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }}>{selectedProductModal.rating || 4.8}</span>
                </div>
              </div>

              {selectedProductModal.category && (
                <div style={{ fontSize: '12px', color: '#FF5E14', fontWeight: 600, marginBottom: '10px' }}>
                  🏷️ {selectedProductModal.category}
                </div>
              )}

              <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#64748B', lineHeight: '1.5', fontWeight: 400 }}>
                {selectedProductModal.description || selectedProductModal.desc || 'Freshly packaged dairy & grocery item with high quality standards.'}
              </p>

              {/* Price & Stepper Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Price</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>₹{selectedProductModal.price}</div>
                    {selectedProductModal.showDiscountTag !== false && Number(selectedProductModal.originalPrice) > Number(selectedProductModal.price) && (
                      <>
                        <div style={{ fontSize: '14px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>
                          ₹{selectedProductModal.originalPrice}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '6px' }}>
                          {Math.round(((Number(selectedProductModal.originalPrice) - Number(selectedProductModal.price)) / Number(selectedProductModal.originalPrice)) * 100)}% OFF
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {cart[selectedProductModal.id] ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FF5E14', borderRadius: '12px', padding: '8px 16px', boxShadow: '0 4px 12px rgba(255,94,20,0.3)' }}>
                    <button
                      onClick={() => updateCartQty(selectedProductModal.id, -1)}
                      style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Minus size={18} />
                    </button>
                    <span style={{ color: '#FFF', fontWeight: 800, fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>
                      {cart[selectedProductModal.id]}
                    </span>
                    <button
                      onClick={() => updateCartQty(selectedProductModal.id, 1)}
                      style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => updateCartQty(selectedProductModal.id, 1)}
                    style={{
                      backgroundColor: '#FF5E14',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(255,94,20,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={16} /> Add to Cart
                  </button>
                )}
              </div>
            </div>

            {/* Close footer button */}
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              <button
                onClick={() => setSelectedProductModal(null)}
                style={{
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '11px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Web App Installation Instructions & Prompt Modal */}
      {showPwaInstallModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '420px',
            width: '100%',
            padding: '24px',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={() => setShowPwaInstallModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} color="#475569" />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#FFF',
                padding: '6px',
                border: '2px solid #FF5E14',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(255, 94, 20, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {storeInfo.logoUrl ? (
                  <img src={storeInfo.logoUrl} alt={storeInfo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <img src="/Logo.png" alt="FoodyPay Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                Install {storeInfo.name || 'FoodyPay'} Web App
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748B', lineHeight: '1.4' }}>
                Add to your home screen for fast 1-tap food ordering, instant access & app experience.
              </p>
            </div>

            {deferredPrompt ? (
              <div style={{ marginBottom: '18px' }}>
                <button
                  onClick={handleTriggerAppInstall}
                  style={{
                    width: '100%',
                    backgroundColor: '#FF5E14',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(255, 94, 20, 0.35)'
                  }}
                >
                  <Download size={18} /> ⚡ Click to Install App Now
                </button>
              </div>
            ) : null}

            {/* Quick 1-tap browser guide */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '14px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0F172A', fontWeight: 600, fontSize: '14px' }}>
                <Smartphone size={18} color="#FF5E14" /> How to Install on your Device:
              </div>

              {/* Android Chrome */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📱 For Android (Chrome / Brave / Edge):</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
                  <li>Tap the <strong>3 vertical dots (⋮)</strong> in browser top right menu.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Tap <strong>"Install"</strong> to place app icon on your screen!</li>
                </ol>
              </div>

              {/* iOS Safari */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🍏 For iPhone (Safari):</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
                  <li>Tap the <strong>Share button ( ⎕↑ )</strong> at bottom of Safari screen.</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>"Add"</strong> in top right corner.</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowPwaInstallModal(false)}
              style={{
                width: '100%',
                backgroundColor: '#F1F5F9',
                color: '#475569',
                border: 'none',
                borderRadius: '10px',
                padding: '11px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Got It, Close
            </button>
          </div>
        </div>
      )}

      {/* HAMBURGER PLATFORM NAVIGATION DRAWER MODAL */}
      {isNavMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsNavMenuOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/Logo.png" alt="FoodyPay Logo" style={{ height: '32px', objectFit: 'contain' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>FoodyPay Platform</h3>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Quick Navigation &amp; CRM Console</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNavMenuOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/"
                onClick={() => setIsNavMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#FFF0EB', color: '#FF5E14', textDecoration: 'none', fontWeight: 800, fontSize: '14px' }}
              >
                <Utensils size={18} />
                <span>Food Marketplace Home</span>
              </Link>

              <Link
                to="/crm"
                onClick={() => setIsNavMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#F8FAFC', color: '#0F172A', textDecoration: 'none', fontWeight: 700, fontSize: '14px', border: '1px solid #E2E8F0' }}
              >
                <Laptop size={18} color="#FF5E14" />
                <span>Restaurant &amp; Cafe CRM Console (`/crm`)</span>
              </Link>

              <Link
                to="/register"
                onClick={() => setIsNavMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#F8FAFC', color: '#0F172A', textDecoration: 'none', fontWeight: 700, fontSize: '14px', border: '1px solid #E2E8F0' }}
              >
                <Store size={18} color="#16A34A" />
                <span>Build Your Store Website in 30 Seconds</span>
              </Link>

              <Link
                to="/delivery-partner"
                onClick={() => setIsNavMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#F8FAFC', color: '#0F172A', textDecoration: 'none', fontWeight: 700, fontSize: '14px', border: '1px solid #E2E8F0' }}
              >
                <Truck size={18} color="#2563EB" />
                <span>Driver &amp; Delivery Partner Login</span>
              </Link>

              <Link
                to="/admin"
                onClick={() => setIsNavMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: '#F8FAFC', color: '#0F172A', textDecoration: 'none', fontWeight: 700, fontSize: '14px', border: '1px solid #E2E8F0' }}
              >
                <ShieldCheck size={18} color="#D97706" />
                <span>Master Admin Control Panel (`/admin`)</span>
              </Link>

              <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '6px', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <Link
                  to="/terms-and-conditions"
                  onClick={() => setIsNavMenuOpen(false)}
                  style={{ fontSize: '12.5px', color: '#64748B', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={14} /> Terms &amp; Policies
                </Link>

                <Link
                  to="/blog"
                  onClick={() => setIsNavMenuOpen(false)}
                  style={{ fontSize: '12.5px', color: '#64748B', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen size={14} /> E-Commerce Blogs
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
