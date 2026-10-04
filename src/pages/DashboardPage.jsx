import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Home,
  Package,
  TrendingUp,
  QrCode,
  Megaphone,
  Users,
  Settings,
  CreditCard,
  Plus,
  Search,
  Eye,
  Printer,
  Clock,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Calendar,
  Gift,
  Utensils,
  ChevronRight,
  ChevronDown,
  Store,
  Truck,
  ShoppingBag,
  MoreVertical,
  SlidersHorizontal,
  Upload,
  Lock,
  Edit3,
  Phone,
  User,
  Sparkles,
  ChefHat,
  Bell,
  ShieldCheck,
  Palette,
  X,
  LogOut,
  Menu,
  Cake,
  Share2,
  Trash2,
  CheckCircle2,
  Frown,
  Tag,
  Percent,
  Star,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import {
  playOrderPlaced,
  playFoodPreparing,
  playFoodReady,
  playBillPaid,
  playMilestoneCelebration,
  startContinuousAlarm,
  stopContinuousAlarm,
} from '../utils/soundEffects';
import { QrCodeComponent } from '../utils/qrGenerator';
import {
  fetchOrdersApi,
  fetchOrderStatsApi,
  markOrderSeenApi,
  createOrderApi,
  updateOrderApi,
  updateOrderStatusApi,
  fetchDishesApi,
  createDishApi,
  updateDishApi,
  toggleDishStockApi,
  deleteDishApi,
  fetchCustomersApi,
  fetchCouponsApi,
  createCouponApi,
  fetchTablesApi,
  createTableApi,
  updateTableApi,
  deleteTableApi,
  fetchSettingsApi,
  updateSettingsApi,
  fetchReviewsApi,
  createReviewApi,
  replyReviewApi,
  sendNotificationApi,
  createRazorpayOrderApi,
  verifyRazorpaySignatureApi,
  fetchDeliveryZonesApi,
  createDeliveryZoneApi,
  updateDeliveryZoneApi,
  deleteDeliveryZoneApi,
  fetchStoresApi,
  createStoreApi,
  updateStoreApi,
  deleteStoreApi,
  assignStoreOwnerEmailApi,
  assignZonesToStoreApi,
} from '../utils/api';
import './Dashboard.css';

// Initial Mock Datasets (Cleared as requested)
const INITIAL_DISHES = [];

const INITIAL_ORDERS = [];

const INITIAL_CUSTOMERS = [];

const get20DaysAheadDate = (days = 20) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 999;
  const exp = new Date(expiryDate);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatExpiryDisplay = (expiryDate) => {
  if (!expiryDate) return 'No Expiry';
  const exp = new Date(expiryDate);
  const now = new Date();
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires Today';
  return `Expires in ${diffDays} days (${exp.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })})`;
};

const INITIAL_COUPONS = [];

const INITIAL_TABLES = [];


export default function DashboardPage({ onShowToast }) {
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('home_orders');
  const [catalogSubmenuOpen, setCatalogSubmenuOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoImgFailed, setLogoImgFailed] = useState(false);
  const [kitchenFilter, setKitchenFilter] = useState('all'); // 'all' | 'new' | 'preparing' | 'ready'

  // FoodyPay Credits Balance
  const [creditsBalance, setCreditsBalance] = useState(2450);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live Clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const token = localStorage.getItem('foodypay_token');

  // Auth Redirect: If no token, redirect to /login
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  // Logout Handler
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your FoodyPay POS Dashboard?')) {
      localStorage.removeItem('foodypay_token');
      localStorage.removeItem('foodypay_user');
      addToast('Logged out successfully');
      navigate('/login');
    }
  };

  // Datasets - default to empty array if user token is present, otherwise fallback
  const [orders, setOrders] = useState([]);
  const [todayStats, setTodayStats] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState('');
  const [coupons, setCoupons] = useState([]);
  const [tables, setTables] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [cardsPerRow, setCardsPerRow] = useState(4);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Current logged in merchant user state synced with localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('foodypay_user');
      return u ? JSON.parse(u) : {};
    } catch (e) {
      return {};
    }
  });

  const [storeControls, setStoreControls] = useState(() => {
    let savedKds = true;
    let savedUpi = '';
    let savedRzpKey = '';
    let savedRzpSec = '';
    let savedRoutingMode = '';
    try {
      const rawKds = localStorage.getItem('foodypay_kds_enabled');
      if (rawKds !== null) savedKds = JSON.parse(rawKds);
      savedUpi = localStorage.getItem('foodypay_upi_id') || '';
      savedRzpKey = localStorage.getItem('foodypay_rzp_key_id') || '';
      savedRzpSec = localStorage.getItem('foodypay_rzp_key_secret') || '';
      savedRoutingMode = localStorage.getItem('foodypay_payment_routing_mode') || '';
    } catch(e) {}

    try {
      const savedUser = localStorage.getItem('foodypay_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return {
          foodypayId: u.foodypayId || 'FP-985569',
          storeStatus: true,
          deliveryStatus: true,
          pickupStatus: true,
          kdsEnabled: savedKds,
          paymentRoutingMode: savedRoutingMode || u.paymentRoutingMode || 'foodypay_default',
          razorpayKeyId: savedRzpKey || u.razorpayKeyId || 'rzp_live_TjBEt4gu2aUflB',
          razorpayKeySecret: savedRzpSec || u.razorpayKeySecret || 'FPXDLXe3Vbh0NYSpCAXmXOA3',
          storeType: 'Business to Customer (B2C)',
          restName: u.businessName || u.name || "My Restaurant",
          phone: u.contactNo || u.phone || '',
          logoUrl: u.logo?.url || '',
          address: u.address || 'India',
          upiId: savedUpi || u.upiId || 'merchant@icici',
          gstPercent: 5,
          lockMarketingTab: false,
          lockTableCrud: false,
          lockOrderDeletion: false,
          lockSettingsPanel: false,
        };
      }
    } catch (e) {}
    return {
      foodypayId: '',
      storeStatus: true,
      deliveryStatus: true,
      pickupStatus: true,
      kdsEnabled: savedKds,
      paymentRoutingMode: savedRoutingMode || 'foodypay_default',
      razorpayKeyId: savedRzpKey || 'rzp_live_TjBEt4gu2aUflB',
      razorpayKeySecret: savedRzpSec || 'FPXDLXe3Vbh0NYSpCAXmXOA3',
      storeType: 'Business to Customer (B2C)',
      restName: "My Restaurant",
      phone: '',
      logoUrl: '',
      address: '',
      upiId: savedUpi || 'merchant@icici',
      gstPercent: 5,
      lockMarketingTab: false,
      lockTableCrud: false,
      lockOrderDeletion: false,
      lockSettingsPanel: false,
    };
  });

  // Customer Groups Cohorts State for Telemetry & Targeted Campaigns
  const [customerGroups, setCustomerGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_crm_groups_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('foodypay_crm_groups_v1', JSON.stringify(customerGroups));
    } catch (e) {}
  }, [customerGroups]);

  useEffect(() => {
    if (coupons && coupons.length > 0) {
      try {
        const storeFpId = storeControls.foodypayId || currentUser.foodypayId || 'FP-985569';
        const taggedCoupons = coupons.map((c) => ({
          ...c,
          foodypayId: c.foodypayId || c.merchantId || storeFpId,
          merchantId: c.merchantId || c.foodypayId || storeFpId,
        }));
        localStorage.setItem('foodypay_crm_coupons_v1', JSON.stringify(taggedCoupons));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
    }
  }, [coupons, storeControls.foodypayId, currentUser.foodypayId]);

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [activeGroupDetail, setActiveGroupDetail] = useState(null);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    spendRule: 'all',
    daysRule: 'all',
    foodCategory: 'all',
  });

  // Targeted Campaign State in Marketing
  const [campaignTargetGroup, setCampaignTargetGroup] = useState('grp_1');
  const [campaignCouponCode, setCampaignCouponCode] = useState('WELCOME50');
  const [campaignDispatchMode, setCampaignDispatchMode] = useState('all_group'); // 'all_group' | 'random_n' | 'specific_phone'
  const [campaignRandomCount, setCampaignRandomCount] = useState(2);
  const [campaignTargetPhone, setCampaignTargetPhone] = useState('');

  // Assign Mobile Modal State for Coupon Cards
  const [isAssignMobileModalOpen, setIsAssignMobileModalOpen] = useState(false);
  const [selectedCouponForAssignModal, setSelectedCouponForAssignModal] = useState(null);
  const [assignMobileInput, setAssignMobileInput] = useState('');

  // Custom Notification Broadcast State (Specific User, All, Random, Group)
  const [isCustomNotifyModalOpen, setIsCustomNotifyModalOpen] = useState(false);
  const [notifyAudienceMode, setNotifyAudienceMode] = useState('all_users'); // 'specific_user' | 'all_users' | 'random_n' | 'group'
  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('grp_1');
  const [randomNotifyCount, setRandomNotifyCount] = useState(3);
  const [notifyTitle, setNotifyTitle] = useState(' Special Gift Offer from FoodyPay');
  const [notifyMessage, setNotifyMessage] = useState('Hey {name}! We have a special discount for you at {storeName}. Use code FEST20 for 20% OFF on your next visit!');

  // Steal Deals / Collections Configuration State
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

  const [isAddStealItemModalOpen, setIsAddStealItemModalOpen] = useState(false);
  const [newStealItemForm, setNewStealItemForm] = useState({
    name: '',
    unit: '1 pc',
    price: 9,
    originalPrice: 20,
    unlockAt: 199,
    isVeg: true,
    image: '',
  });

  const saveStealDealsConfig = (newConfig) => {
    setStealDealsConfig(newConfig);
    try {
      localStorage.setItem('foodypay_steal_deals_config', JSON.stringify(newConfig));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const handleToggleStealDeals = () => {
    const updated = { ...stealDealsConfig, enabled: !stealDealsConfig.enabled };
    saveStealDealsConfig(updated);
    addToast(`Steal Deals Banner is now ${updated.enabled ? 'ON (Visible on Homepage)' : 'OFF (Hidden on Homepage)'}`, updated.enabled ? <CheckCircle2 color="#10B981" /> : <Lock color="#EF4444" />);
  };

  const handleAddStealItem = (e) => {
    e.preventDefault();
    if (!newStealItemForm.name.trim()) return;

    const newItem = {
      id: 'steal_' + Date.now(),
      name: newStealItemForm.name.trim(),
      unit: newStealItemForm.unit || '1 pc',
      price: Number(newStealItemForm.price) || 9,
      originalPrice: Number(newStealItemForm.originalPrice) || 20,
      unlockAt: Number(newStealItemForm.unlockAt) || 199,
      isVeg: newStealItemForm.isVeg,
      image: newStealItemForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    };

    const updated = {
      ...stealDealsConfig,
      items: [...(stealDealsConfig.items || []), newItem]
    };
    saveStealDealsConfig(updated);
    setIsAddStealItemModalOpen(false);
    setNewStealItemForm({ name: '', unit: '1 pc', price: 9, originalPrice: 20, unlockAt: 199, isVeg: true, image: '' });
    addToast(`Added deal item "${newItem.name}" to Steal Deals collection!`, <CheckCircle2 color="#10B981" />);
  };

  const handleDeleteStealItem = (itemId) => {
    const updated = {
      ...stealDealsConfig,
      items: (stealDealsConfig.items || []).filter(i => i.id !== itemId)
    };
    saveStealDealsConfig(updated);
    addToast('Removed item from Steal Deals collection', <Trash2 color="#EF4444" />);
  };

  // Payment Options Config State (Header Title & Payment Buttons Customization)
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

  const savePaymentConfig = (newConfig) => {
    setPaymentConfig(newConfig);
    try {
      localStorage.setItem('foodypay_payment_config', JSON.stringify(newConfig));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  // Customizable Order Status Stepper Labels State
  const [statusStepLabels, setStatusStepLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_status_step_labels');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      step1: 'Placed',
      step2: 'Kitchen',
      step3: 'Out for Delivery',
      step4: 'Delivered',
    };
  });

  const saveStatusStepLabels = (newLabels) => {
    setStatusStepLabels(newLabels);
    try {
      localStorage.setItem('foodypay_status_step_labels', JSON.stringify(newLabels));
    } catch (e) {}
    const stepArr = [
      newLabels.step1 || 'Placed',
      newLabels.step2 || 'Kitchen',
      newLabels.step3 || 'Out for Delivery',
      newLabels.step4 || 'Delivered',
    ];
    setStoreControls((prev) => {
      const updated = {
        ...prev,
        customStepsDelivery: stepArr,
        customStepsDineIn: stepArr,
      };
      try {
        localStorage.setItem('foodypay_store_controls', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  // Orders & Catalog Pagination States
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(12);

  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPerPage, setCatalogPerPage] = useState(10);

  const [notifyChannel, setNotifyChannel] = useState('push_whatsapp'); // 'push_whatsapp' | 'whatsapp_only' | 'push_only'

  // Selected Catalog Color Theme state
  const [selectedCatalogTheme, setSelectedCatalogTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_catalog_theme');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'orange',
      name: 'Sunset Orange (Default)',
      primary: '#FF5E14',
      accent: '#D97706',
      bg: '#FFF0EB',
      gradient: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
    };
  });

  // Feature Upgrade Modal State (for locking Pro features on Free Plan)
  const [upgradeModalFeature, setUpgradeModalFeature] = useState(null);

  useEffect(() => {
    const syncUserData = () => {
      try {
        const u = localStorage.getItem('foodypay_user');
        if (u) {
          setCurrentUser(JSON.parse(u));
        }
      } catch (e) {}
    };
    window.addEventListener('storage', syncUserData);
    return () => window.removeEventListener('storage', syncUserData);
  }, []);

  // Account Suspension Status Check
  const isAccountSuspended = Boolean(
    currentUser.isSuspended ||
    storeControls.isSuspended ||
    currentUser.subscriptionStatus === 'Suspended' ||
    storeControls.subscriptionStatus === 'Suspended'
  );

  // Dynamic Subscription Expiry Check
  const subExpiryDateStr = currentUser.subscriptionExpiry || storeControls.subscriptionExpiry || currentUser.expiryDate || storeControls.expiryDate;
  
  const isSubscriptionExpired = (() => {
    if (!subExpiryDateStr) return false;
    if (String(subExpiryDateStr).toLowerCase().includes('unlimited') || String(subExpiryDateStr).toLowerCase().includes('lifetime')) return false;
    const expTime = new Date(subExpiryDateStr).getTime();
    if (isNaN(expTime)) return false;
    const expDateObj = new Date(subExpiryDateStr);
    if (!String(subExpiryDateStr).includes('T')) {
      expDateObj.setHours(23, 59, 59, 999);
    }
    return Date.now() > expDateObj.getTime();
  })();

  const userPlanStr = String(currentUser.subscriptionPlan || storeControls.subscriptionPlan || (JSON.parse(localStorage.getItem('foodypay_user') || '{}').subscriptionPlan) || 'Starter Free').toLowerCase();
  const isBaseEnterpriseMax = userPlanStr.includes('enterprise') || userPlanStr.includes('max') || userPlanStr.includes('75');
  const isBaseGrowthPro = !isBaseEnterpriseMax && (userPlanStr.includes('growth') || userPlanStr.includes('pro') || userPlanStr.includes('35') || userPlanStr.includes('active pro'));
  
  // Expiry forces account back to Starter Free plan
  const isEnterpriseMax = isBaseEnterpriseMax && !isSubscriptionExpired;
  const isGrowthPro = isBaseGrowthPro && !isSubscriptionExpired;
  const isFreePlan = !isEnterpriseMax && !isGrowthPro;

  // Feature Lock Rules:
  const isKdsLocked = isFreePlan;
  const isMarketingLocked = isFreePlan;
  const isCustomersLocked = isFreePlan;
  const isReviewsLocked = isFreePlan;

  // Delivery Partner View, Themes & Branding, Grow -> Locked on Free Plan AND Growth Pro (requires Enterprise Max)
  const isDeliveryPartnerLocked = isFreePlan || isGrowthPro;
  const isThemesLocked = isFreePlan || isGrowthPro;
  const isGrowLocked = isFreePlan || isGrowthPro;

  // Dynamic Database-Driven Delivery Zones & Store Management State
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [deliverySubTab, setDeliverySubTab] = useState('zones'); // 'zones' | 'stores'
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [editingZoneObj, setEditingZoneObj] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    city: 'Mohali',
    state: 'Punjab',
    pincode: '',
    centerLatitude: 30.7046,
    centerLongitude: 76.7179,
    radius: 5,
    isActive: true,
  });

  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [editingStoreObj, setEditingStoreObj] = useState(null);
  const [storeForm, setStoreForm] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    gstNumber: '',
    licenseNumber: '',
    address: '',
    city: 'Mohali',
    state: 'Punjab',
    pincode: '',
    latitude: 30.7046,
    longitude: 76.7179,
    deliveryRadius: 5,
    isActive: true,
  });

  const [isAssignStoreZonesModalOpen, setIsAssignStoreZonesModalOpen] = useState(false);
  const [selectedStoreForZones, setSelectedStoreForZones] = useState(null);
  const [selectedZoneIdsForStore, setSelectedZoneIdsForStore] = useState([]);

  const [isAssignOwnerEmailModalOpen, setIsAssignOwnerEmailModalOpen] = useState(false);
  const [selectedStoreForOwner, setSelectedStoreForOwner] = useState(null);
  const [assignOwnerEmailInput, setAssignOwnerEmailInput] = useState('');

  const loadDeliveryAndStoresData = async () => {
    try {
      const [zones, stores] = await Promise.all([
        fetchDeliveryZonesApi(),
        fetchStoresApi(),
      ]);
      if (Array.isArray(zones)) setDeliveryZones(zones);
      if (Array.isArray(stores)) setStoresList(stores);
    } catch (err) {
      console.warn('Delivery and stores sync error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'delivery_zones') {
      loadDeliveryAndStoresData();
    }
  }, [activeTab]);

  const handleSaveZoneSubmit = async (e) => {
    e.preventDefault();
    if (!zoneForm.name.trim()) return;

    try {
      if (editingZoneObj) {
        await updateDeliveryZoneApi(editingZoneObj._id || editingZoneObj.zoneId, zoneForm);
        addToast(`Delivery Zone "${zoneForm.name}" updated successfully!`);
      } else {
        await createDeliveryZoneApi(zoneForm);
        addToast(`New Delivery Zone "${zoneForm.name}" created successfully!`);
      }
      setIsAddZoneModalOpen(false);
      loadDeliveryAndStoresData();
    } catch (err) {
      addToast(`Error saving zone: ${err.message}`);
    }
  };

  const handleSaveStoreSubmit = async (e) => {
    e.preventDefault();
    if (!storeForm.name.trim() || !storeForm.ownerEmail.trim()) return;

    try {
      if (editingStoreObj) {
        await updateStoreApi(editingStoreObj._id || editingStoreObj.storeId, storeForm);
        addToast(`Store "${storeForm.name}" updated successfully!`);
      } else {
        await createStoreApi(storeForm);
        addToast(`New Store "${storeForm.name}" registered successfully!`);
      }
      setIsAddStoreModalOpen(false);
      loadDeliveryAndStoresData();
    } catch (err) {
      addToast(`Error saving store: ${err.message}`);
    }
  };

  const handleAssignZonesToStoreSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStoreForZones) return;

    try {
      await assignZonesToStoreApi(selectedStoreForZones._id || selectedStoreForZones.storeId, selectedZoneIdsForStore);
      addToast(`Updated delivery zones for ${selectedStoreForZones.name}!`);
      setIsAssignStoreZonesModalOpen(false);
      loadDeliveryAndStoresData();
    } catch (err) {
      addToast(`Error assigning zones: ${err.message}`);
    }
  };

  const handleAssignOwnerEmailSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStoreForOwner || !assignOwnerEmailInput.trim()) return;

    try {
      await assignStoreOwnerEmailApi(selectedStoreForOwner._id || selectedStoreForOwner.storeId, assignOwnerEmailInput.trim());
      addToast(`Assigned store access to email ${assignOwnerEmailInput.trim()}!`);
      setIsAssignOwnerEmailModalOpen(false);
      loadDeliveryAndStoresData();
    } catch (err) {
      addToast(`Error assigning owner email: ${err.message}`);
    }
  };

  // Calculate Total Sales collected specifically via Razorpay Online Payment Gateway
  const razorpaySalesTotal = (orders || []).reduce((acc, o) => {
    const pStatus = String(o.paymentStatus || '').toLowerCase();
    const pLabel = String(o.paymentLabel || '').toLowerCase();
    const isRazorpay =
      pStatus === 'paid-razorpay' ||
      pStatus === 'paid-online' ||
      pLabel.includes('razorpay') ||
      (pStatus === 'paid-upi' && pLabel.includes('online')) ||
      (pStatus === 'paid' && (pLabel.includes('razorpay') || pLabel.includes('online')));
    if (isRazorpay) {
      return acc + (Number(o.total) || 0);
    }
    return acc;
  }, 0);

  // Razorpay SDK Script Loader for Subscription Purchases
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Process Subscription Upgrade & Unlock ONLY after verified Razorpay Payment Callback
  const handleRazorpaySubscriptionPurchase = async (targetPlan, targetPriceUSD) => {
    const planNameLower = String(targetPlan).toLowerCase();
    const priceInINR = planNameLower.includes('enterprise') || planNameLower.includes('max') ? 5999 : (planNameLower.includes('growth') || planNameLower.includes('pro') ? 2999 : (Number(targetPriceUSD) * 85 || 2999));
    const amountInPaise = priceInINR * 100;

    // 1. Load Razorpay script first
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      alert('Failed to load Razorpay Payment Gateway SDK. Please check internet connection.');
      return;
    }

    const activeRzpKey = storeControls.razorpayKeyId || 'rzp_live_TjBEt4gu2aUflB';

    // 2. Try backend order API creation with fast 1-second timeout
    let razorpayOrderId = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const rzpRes = await createRazorpayOrderApi({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_${Date.now()}`,
        notes: {
          plan: targetPlan,
          merchantId: storeControls.foodypayId || currentUser.foodypayId || 'FP-MERCHANT'
        }
      }, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (rzpRes && rzpRes.razorpayOrderId) {
        razorpayOrderId = rzpRes.razorpayOrderId;
      }
    } catch (e) {
      console.warn('Proceeding with direct Razorpay SDK checkout:', e.message);
    }

    const options = {
      key: activeRzpKey,
      amount: amountInPaise,
      currency: 'INR',
      name: 'FoodyPay POS Subscription',
      description: `Upgrade Plan to ${targetPlan} (Paid via Razorpay)`,
      image: storeControls.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
      ...(razorpayOrderId ? { order_id: razorpayOrderId } : {}),
      prefill: {
        name: storeControls.restName || currentUser.name || 'Merchant User',
        email: currentUser.email || 'merchant@foodypay.com',
        contact: storeControls.phone || currentUser.phone || '9999999999',
      },
      theme: {
        color: '#FF5E14',
      },
      handler: async function (response) {
        // VERIFY RAZORPAY PAYMENT CALLBACK
        console.log('Razorpay Subscription Payment Successful Callback:', response);
        const paymentId = response.razorpay_payment_id || `pay_${Date.now()}`;

        if (response.razorpay_order_id && response.razorpay_payment_id && response.razorpay_signature) {
          try {
            await verifyRazorpaySignatureApi({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch (err) {
            console.warn('Razorpay signature verification note:', err);
          }
        }

        // Set 1 Month (30 days) subscription validity from today
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 30);
        const expDateIsoStr = expDate.toISOString().split('T')[0];

        // UNLOCK PLAN ONLY AFTER VERIFIED RAZORPAY PAYMENT CALLBACK!
        const updatedUser = {
          ...JSON.parse(localStorage.getItem('foodypay_user') || '{}'),
          subscriptionPlan: targetPlan,
          subscriptionPrice: Number(targetPriceUSD) || (planNameLower.includes('enterprise') ? 75 : 35),
          subscriptionStatus: 'Active',
          subscriptionExpiry: expDateIsoStr,
          isLocked: false,
          isSuspended: false,
          razorpayPaymentId: paymentId,
          paidVia: 'Paid by Razorpay',
        };

        localStorage.setItem('foodypay_user', JSON.stringify(updatedUser));
        setStoreControls((prev) => ({
          ...prev,
          subscriptionPlan: targetPlan,
          subscriptionPrice: Number(targetPriceUSD) || (planNameLower.includes('enterprise') ? 75 : 35),
          subscriptionStatus: 'Active',
          subscriptionExpiry: expDateIsoStr,
          isSuspended: false,
        }));

        setCurrentUser(updatedUser);
        window.dispatchEvent(new Event('storage'));
        playMilestoneCelebration();
        addToast(`🎉 Paid by Razorpay (${paymentId})! Plan ${targetPlan} unlocked until ${expDateIsoStr}.`, <CheckCircle2 size={18} color="#10B981" />);
        setUpgradeModalFeature(null);
      },
      modal: {
        ondismiss: function () {
          addToast('⚠️ Subscription payment cancelled or dismissed. Features remain locked.', <AlertCircle size={18} color="#EF4444" />);
        }
      }
    };

    try {
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response) {
        alert(`Payment Failed: ${response.error?.description || 'Transaction declined by bank'}`);
      });
      rzpInstance.open();
    } catch (err) {
      console.error('Razorpay popup launch error:', err);
      alert('Error launching Razorpay payment window. Please check pop-up settings in your browser.');
    }
  };


  // Dynamically sync favicon, apple-touch-icon, and PWA manifest logo in head when store logo changes
  useEffect(() => {
    if (!storeControls.logoUrl) return;
    const effectiveLogo = storeControls.logoUrl;
    const effectiveName = storeControls.restName || 'FoodyPay POS';

    // 1. Update <link rel="icon">
    let iconLink = document.querySelector("link[rel*='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = effectiveLogo;

    // 2. Update <link rel="apple-touch-icon">
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
  }, [storeControls.logoUrl, storeControls.restName]);

  // Customer Reviews & Feedback Dataset State (Loaded only from server DB API)
  const [reviews, setReviews] = useState([]);

  const reloadServerReviews = async () => {
    try {
      const data = await fetchReviewsApi();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (e) {
      console.warn('Failed to fetch reviews from server:', e);
    }
  };

  useEffect(() => {
    reloadServerReviews();
    window.addEventListener('foodypay_review_created', reloadServerReviews);
    return () => {
      window.removeEventListener('foodypay_review_created', reloadServerReviews);
    };
  }, []);

  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewSentimentFilter, setReviewSentimentFilter] = useState('all');

  // Reply Modal State
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [activeReplyReview, setActiveReplyReview] = useState(null);
  const [replyTextInput, setReplyTextInput] = useState('');

  // Add Manual Review Modal State
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    customerName: '',
    customerPhone: '',
    rating: 5,
    feedback: '',
    dishOrdered: 'Paneer Butter Masala',
    tableNo: 'Table 1',
  });

  const handleSaveReplySubmit = async (e) => {
    e.preventDefault();
    if (!activeReplyReview || !replyTextInput.trim()) return;

    const revTargetId = activeReplyReview._id || activeReplyReview.id;
    try {
      const updatedRev = await replyReviewApi(revTargetId, replyTextInput.trim());
      setReviews((prev) =>
        prev.map((r) => ((r._id || r.id) === revTargetId ? updatedRev : r))
      );
    } catch (err) {
      setReviews((prev) =>
        prev.map((r) => {
          if ((r._id || r.id) === revTargetId) {
            return { ...r, reply: replyTextInput.trim() };
          }
          return r;
        })
      );
    }

    addToast(` Saved response for ${activeReplyReview.customerName}'s review!`, <Check size={18} />);
    setIsReplyModalOpen(false);
    setActiveReplyReview(null);
    setReplyTextInput('');
  };

  const handleAddReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewForm.customerName.trim() || !newReviewForm.feedback.trim()) return;

    const ratingVal = Number(newReviewForm.rating) || 5;
    const reviewData = {
      customerName: newReviewForm.customerName.trim(),
      customerPhone: newReviewForm.customerPhone.trim() || '+91 98000 00000',
      rating: ratingVal,
      feedback: newReviewForm.feedback.trim(),
      dishOrdered: newReviewForm.dishOrdered.trim() || 'Counter Order',
      tableNo: newReviewForm.tableNo || 'Table 1',
    };

    try {
      const createdRev = await createReviewApi(reviewData);
      setReviews((prev) => [createdRev, ...prev]);
    } catch (err) {
      const newR = {
        id: `rev_${Date.now()}`,
        ...reviewData,
        date: 'Just now',
        sentiment: ratingVal >= 4 ? 'positive' : ratingVal === 3 ? 'neutral' : 'negative',
        reply: null,
      };
      setReviews((prev) => [newR, ...prev]);
    }

    addToast(`⭐ Added review from ${newReviewForm.customerName}!`, <Star size={18} />);
    setIsAddReviewModalOpen(false);
  };

  // Custom Meal Collections / Combo Bundles Dataset State (Cleared sample combos; merchant created combos only)
  const [mealsCollection, setMealsCollection] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_crm_meals_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const SAMPLE_MEALS = ['Royal Deluxe North Indian Thali', 'Weekend Pizza & Starter Feast', 'Student Snack & Beverage Combo', 'South Indian Tiffin Combo', 'Special Party Meal Combo'];
          return parsed.filter(m => m && m.name && !SAMPLE_MEALS.includes(m.name));
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('foodypay_crm_meals_v1', JSON.stringify(mealsCollection));
    } catch {}
  }, [mealsCollection]);

  // Modal State for Custom Meal Collection Builder
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMealObj, setEditingMealObj] = useState(null);
  const [mealForm, setMealForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    category: 'Thali & Full Meals',
    comboPrice: '',
    items: [
      { name: 'Paneer Butter Masala', qty: 1, individualPrice: 240 },
      { name: 'Butter Naan', qty: 2, individualPrice: 80 },
    ],
  });

  const handleOpenCreateMeal = () => {
    setEditingMealObj(null);
    setMealForm({
      name: 'Special Party Meal Combo',
      description: 'Delicious curated combo meal with special savings.',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      category: 'Thali & Full Meals',
      comboPrice: '399',
      items: [
        { name: 'Paneer Butter Masala', qty: 1, individualPrice: 240 },
        { name: 'Dal Makhani', qty: 1, individualPrice: 180 },
        { name: 'Butter Naan', qty: 2, individualPrice: 80 },
      ],
    });
    setIsMealModalOpen(true);
  };

  const handleOpenEditMeal = (meal) => {
    setEditingMealObj(meal);
    setMealForm({
      name: meal.name || '',
      description: meal.description || '',
      imageUrl: meal.imageUrl || '',
      category: meal.category || 'Thali & Full Meals',
      comboPrice: String(meal.comboPrice || ''),
      items: (meal.items && meal.items.length > 0) ? meal.items : [{ name: '', qty: 1, individualPrice: 0 }],
    });
    setIsMealModalOpen(true);
  };

  const handleDeleteMeal = (mealId, mealName) => {
    if (!window.confirm(`Are you sure you want to delete ${mealName}?`)) return;
    setMealsCollection((prev) => prev.filter((m) => m.id !== mealId));
    addToast(`️ Deleted ${mealName} from Collections!`, <Trash2 size={16} />);
  };

  const handleSaveMealSubmit = (e) => {
    e.preventDefault();
    if (!mealForm.name.trim()) return;

    const validItems = mealForm.items.filter((it) => it.name.trim() !== '');
    if (validItems.length === 0) {
      addToast('Please add at least one food item inside the meal combo.', <Frown size={16} />);
      return;
    }

    const calculatedSum = validItems.reduce((s, it) => s + (Number(it.individualPrice) || 0) * (Number(it.qty) || 1), 0);
    const finalComboPrice = Number(mealForm.comboPrice) || Math.round(calculatedSum * 0.8);

    const mealData = {
      name: mealForm.name.trim(),
      description: mealForm.description.trim(),
      imageUrl: mealForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      category: mealForm.category || 'Thali & Full Meals',
      status: 'Active',
      items: validItems.map((it) => ({
        name: it.name.trim(),
        qty: Number(it.qty) || 1,
        individualPrice: Number(it.individualPrice) || 0,
      })),
      comboPrice: finalComboPrice,
    };

    if (editingMealObj) {
      setMealsCollection((prev) =>
        prev.map((m) => (m.id === editingMealObj.id ? { ...m, ...mealData } : m))
      );
      addToast(`Updated Custom Meal "${mealData.name}"!`, <Check size={18} />);
    } else {
      const newMeal = { ...mealData, id: `meal_${Date.now()}` };
      setMealsCollection((prev) => [newMeal, ...prev]);
      addToast(`Created Custom Meal "${newMeal.name}"!`, <Utensils size={18} />);
    }

    setIsMealModalOpen(false);
    setEditingMealObj(null);
  };

  // Unique Table URL Generator: Domain / BusinessName / FoodypayId / TableNo
  const getUniqueTableUrl = (tableName, customUrl = '') => {
    const currentOrigin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://foodypay.in';

    const isLocalHost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
    const effectiveOrigin = isLocalHost
      ? currentOrigin
      : 'https://foodypay.in';

    const bizSlug = (storeControls.restName || 'foodypay')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const tableSlug = (tableName || 'table-1')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const fpId = storeControls.foodypayId || 'FP-985569';

    if (customUrl && customUrl.trim()) {
      let trimmed = customUrl.trim();
      // Replace legacy localhost / 127.0.0.1 origins with effective live origin
      if (!isLocalHost && (trimmed.includes('localhost') || trimmed.includes('127.0.0.1'))) {
        trimmed = trimmed.replace(/^https?:\/\/[^\/]+/, effectiveOrigin);
      }
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      if (trimmed.includes('.')) {
        return `https://${trimmed}`;
      }
      // If customUrl is plain text (e.g. "TheFoodypay"), format it into valid web URL!
      const customSlug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return `${effectiveOrigin}/${customSlug}/${fpId}/${tableSlug}`;
    }

    return `${effectiveOrigin}/${bizSlug}/${fpId}/${tableSlug}`;
  };

  const sendBrowserNotification = (title, body) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/Logo.png' });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification(title, { body, icon: '/Logo.png' });
            }
          });
        }
      }
    } catch (e) {
      // notification fallback
    }
  };

  // Listen & poll for real-time customer table orders created on customer menu website
  useEffect(() => {
    // Helper functions for persistent seen & notified order tracking
    const getSeenIds = () => {
      try {
        const raw = localStorage.getItem('foodypay_seen_order_ids');
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch (e) {
        return new Set();
      }
    };

    const getNotifiedIds = () => {
      try {
        const raw = localStorage.getItem('foodypay_notified_order_ids');
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch (e) {
        return new Set();
      }
    };

    const markIdNotifiedInStorage = (id) => {
      if (!id) return;
      try {
        const notifiedSet = getNotifiedIds();
        notifiedSet.add(String(id));
        localStorage.setItem('foodypay_notified_order_ids', JSON.stringify(Array.from(notifiedSet)));
      } catch (e) {}
    };

    const notifyIfNewOrder = (order) => {
      if (!order) return;
      const oId = String(order._id || order.id || order.orderId || '');
      if (!oId) return;

      const seenSet = getSeenIds();
      const notifiedSet = getNotifiedIds();

      const isSeen = Boolean(order.seen || seenSet.has(oId));
      const isNotified = notifiedSet.has(oId);
      const isNewStatus = !order.status || order.status === 'new';

      if (!isSeen && !isNotified && isNewStatus) {
        markIdNotifiedInStorage(oId);

        const displayId = order.orderId || (order._id ? `#FP-${String(order._id).slice(-4)}` : order.id) || 'Order';
        const rawTableStr = order.tableName || order.table || order.tableNo || (order.tableNumber ? `Table ${order.tableNumber}` : 'Table 1');
        const displayTable = String(rawTableStr).replace(/tabel/gi, 'Table');
        const displayCustomer = order.customerName || order.customer || order.name || 'Customer';

        triggerSound(playOrderPlaced);
        addToast(`Live Order Received! ${displayId} from ${displayTable} (${displayCustomer})`, <Bell size={18} />);
        sendBrowserNotification('New FoodyPay Order!', `${displayId} - ${displayTable} (${displayCustomer})`);
      }
    };

    const handleNewOrderEvent = () => {
      try {
        const savedOrders = localStorage.getItem('foodypay_crm_orders_v3');
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          setOrders(parsed);
          if (Array.isArray(parsed)) {
            parsed.forEach((order) => notifyIfNewOrder(order));
          }
        }
      } catch (e) {
        console.error('Error handling new order event:', e);
      }
    };

    // Polling backend database every 5 seconds for new customer orders
    const pollBackendOrders = async () => {
      const token = localStorage.getItem('foodypay_token');
      if (!token) return;
      try {
        const res = await fetchOrdersApi(token);
        const fetchedOrders = res.orders || (Array.isArray(res) ? res : []);
        if (res.todayStats) setTodayStats(res.todayStats);
        if (Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
          const seenSet = getSeenIds();
          const statusRank = { new: 1, new_seen: 1, preparing: 2, ready: 3, completed: 4, cancelled: 5 };

          setOrders((prevLocalOrders) => {
            const localMap = new Map();
            (prevLocalOrders || []).forEach((lo) => {
              const idKey = String(lo._id || lo.id || lo.orderId);
              localMap.set(idKey, lo);
            });

            const merged = fetchedOrders.map((o) => {
              const oId = String(o._id || o.id || o.orderId);
              const localOrd = localMap.get(oId);

              let effectiveStatus = o.status;
              if (localOrd && localOrd.status) {
                const localR = statusRank[localOrd.status] || 1;
                const remoteR = statusRank[o.status] || 1;
                // Preserve local stage if local has progressed further (e.g., preparing vs new)
                if (localR > remoteR) {
                  effectiveStatus = localOrd.status;
                }
              }

              const localIsPaid = localOrd && (localOrd.paymentStatus === 'paid-upi' || localOrd.paymentStatus === 'paid-razorpay' || localOrd.paymentStatus === 'paid-cash' || localOrd.paymentStatus === 'paid');
              const effectivePaymentStatus = localIsPaid ? localOrd.paymentStatus : (o.paymentStatus || 'unpaid');
              const effectivePaymentLabel = localIsPaid ? localOrd.paymentLabel : (o.paymentLabel || 'Payment Pending');

              return {
                ...o,
                status: effectiveStatus,
                paymentStatus: effectivePaymentStatus,
                paymentLabel: effectivePaymentLabel,
                seen: Boolean(o.seen || (localOrd && localOrd.seen) || seenSet.has(oId)),
              };
            });

            merged.forEach((order) => notifyIfNewOrder(order));
            return merged;
          });
        }
      } catch (err) {
        // silent catch during polling
      }
    };

    const pollInterval = setInterval(pollBackendOrders, 5000);

    let bc = null;
    try {
      bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.onmessage = (msg) => {
        if (msg && msg.data) {
          handleNewOrderEvent();
          pollBackendOrders();
        }
      };
    } catch (e) {}

    window.addEventListener('foodypay_order_created', handleNewOrderEvent);
    window.addEventListener('storage', handleNewOrderEvent);
    return () => {
      clearInterval(pollInterval);
      if (bc) bc.close();
      window.removeEventListener('foodypay_order_created', handleNewOrderEvent);
      window.removeEventListener('storage', handleNewOrderEvent);
    };
  }, [soundEnabled]);


  // Continuous Bell Alarm Controller for Unseen Orders
  useEffect(() => {
    if (!soundEnabled) {
      stopContinuousAlarm();
      return;
    }

    const seenSet = (() => {
      try {
        const raw = localStorage.getItem('foodypay_seen_order_ids');
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch (e) {
        return new Set();
      }
    })();

    const hasUnseen = (orders || []).some((o) => {
      if (!o) return false;
      const oId = String(o._id || o.id || o.orderId);
      return !o.seen && !seenSet.has(oId) && o.status === 'new';
    });

    if (hasUnseen) {
      startContinuousAlarm();
    } else {
      stopContinuousAlarm();
    }

    return () => {
      stopContinuousAlarm();
    };
  }, [orders, soundEnabled]);

  const handleMarkOrderSeen = async (orderId) => {
    stopContinuousAlarm();
    if (!orderId) return;

    try {
      const raw = localStorage.getItem('foodypay_seen_order_ids');
      const seenSet = raw ? new Set(JSON.parse(raw)) : new Set();
      seenSet.add(String(orderId));
      localStorage.setItem('foodypay_seen_order_ids', JSON.stringify(Array.from(seenSet)));
    } catch (e) {}

    setOrders((prev) =>
      prev.map((o) => {
        const oId = o._id || o.id || o.orderId;
        if (oId === orderId || String(oId) === String(orderId)) {
          return { ...o, seen: true };
        }
        return o;
      })
    );
    if (token) {
      const orderObj = orders.find((o) => (o._id || o.id || o.orderId) === orderId);
      const targetId = (orderObj && orderObj._id) || orderId;
      if (targetId && !String(targetId).startsWith('ord_')) {
        try {
          const res = await markOrderSeenApi(token, targetId);
          if (res && res.todayStats) setTodayStats(res.todayStats);
        } catch (err) {}
      }
    }

    try {
      const bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.postMessage({ type: 'ORDER_SEEN', orderId });
      bc.close();
    } catch (e) {}

    addToast('️ Order marked as SEEN! Alarm bell stopped.', <Check size={18} />);
  };

  const handleMarkAllSeen = async () => {
    stopContinuousAlarm();
    try {
      const raw = localStorage.getItem('foodypay_seen_order_ids');
      const seenSet = raw ? new Set(JSON.parse(raw)) : new Set();
      (orders || []).forEach((o) => {
        const oId = o._id || o.id || o.orderId;
        if (oId) seenSet.add(String(oId));
      });
      localStorage.setItem('foodypay_seen_order_ids', JSON.stringify(Array.from(seenSet)));
    } catch (e) {}

    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        seen: true,
      }))
    );
    if (token) {
      orders.forEach(async (o) => {
        if (o._id && !String(o._id).startsWith('ord_')) {
          try {
            await markOrderSeenApi(token, o._id);
          } catch (e) {}
        }
      });
    }

    try {
      const bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.postMessage({ type: 'ALL_ORDERS_SEEN' });
      bc.close();
    } catch (e) {}

    addToast('️ All orders marked SEEN! Alarm bell stopped.', <Check size={18} />);
  };

  const handleStartPreparingOrder = (orderId) => {
    handleUpdateOrderStatus(orderId, 'preparing');
  };

  // Fetch all user datasets from Backend Node.js API
  useEffect(() => {
    async function loadBackendData() {
      if (!token) {
        setOrders(INITIAL_ORDERS);
        setDishes(INITIAL_DISHES);
        setCustomers(INITIAL_CUSTOMERS);
        setCoupons(INITIAL_COUPONS);
        setTables(INITIAL_TABLES);
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      try {
        const [ordersRes, dishesRes, customersRes, couponsRes, tablesRes, settingsRes, reviewsRes] = await Promise.allSettled([
          fetchOrdersApi(token),
          fetchDishesApi(token),
          fetchCustomersApi(token),
          fetchCouponsApi(token),
          fetchTablesApi(token),
          fetchSettingsApi(token),
          fetchReviewsApi(),
        ]);

        if (ordersRes.status === 'fulfilled') {
          const val = ordersRes.value;
          if (val && Array.isArray(val.orders)) {
            setOrders(val.orders);
            if (val.todayStats) setTodayStats(val.todayStats);
          } else if (Array.isArray(val)) {
            setOrders(val);
          } else {
            setOrders(INITIAL_ORDERS);
          }
        } else setOrders(INITIAL_ORDERS);

        if (dishesRes.status === 'fulfilled' && Array.isArray(dishesRes.value)) setDishes(dishesRes.value);
        else setDishes(INITIAL_DISHES);

        if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value)) setReviews(reviewsRes.value);

        if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value)) setCustomers(customersRes.value);
        else setCustomers(INITIAL_CUSTOMERS);

        if (couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value)) setCoupons(couponsRes.value);
        else setCoupons(INITIAL_COUPONS);

        if (tablesRes.status === 'fulfilled' && Array.isArray(tablesRes.value)) setTables(tablesRes.value);
        else setTables(INITIAL_TABLES);
        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          const s = settingsRes.value;
          let uBusName = '';
          try {
            const uStr = localStorage.getItem('foodypay_user');
            if (uStr) {
              const uObj = JSON.parse(uStr);
              uBusName = uObj.businessName || '';
            }
          } catch (e) {}

          setStoreControls((prev) => {
            const effectiveName = uBusName || (s.restName && s.restName !== 'Lagan Da Dhaba' ? s.restName : prev.restName) || "My Restaurant";

            return {
              ...prev,
              restName: effectiveName,
              phone: s.phone || prev.phone,
              address: s.address || prev.address,
              upiId: s.upiId || prev.upiId,
              gstPercent: s.gstPercent !== undefined ? s.gstPercent : prev.gstPercent,
              storeStatus: s.storeStatus !== undefined ? s.storeStatus : prev.storeStatus,
            };
          });
          if (s.creditsBalance !== undefined) setCreditsBalance(s.creditsBalance);
        }
      } catch (err) {
        console.warn('API sync error, using fallback state:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadBackendData();
  }, [token]);

  // LocalStorage sync
  useEffect(() => {
    try {
      localStorage.setItem('foodypay_crm_orders_v3', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('foodypay_crm_customers_v1', JSON.stringify(customers));
    } catch {}
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('foodypay_crm_dishes_v3', JSON.stringify(dishes));
    } catch {}
  }, [dishes]);

  // Toast Helper
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, icon = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const triggerSound = (fn) => {
    if (soundEnabled && typeof fn === 'function') {
      try {
        fn();
      } catch (e) {
        console.warn('Audio blocked:', e);
      }
    }
  };

  // ==========================================================================
  // 1. MANUAL ORDER CREATOR MODAL ("CREATE A MANUAL ORDER")
  // ==========================================================================
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [manualOrderType, setManualOrderType] = useState('Dine-In');
  const [manualTable, setManualTable] = useState('Table 1');
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualItems, setManualItems] = useState({});
  const [manualPaymentMode, setManualPaymentMode] = useState('Cash on Counter');
  
  // New manual order states
  const [manualSearch, setManualSearch] = useState('');
  const [manualCategory, setManualCategory] = useState('All');
  const [manualGstEnabled, setManualGstEnabled] = useState(false);
  const [manualDiscount, setManualDiscount] = useState('');
  const [manualCoupon, setManualCoupon] = useState('');

  // Bill Settlement & UPI QR Scanner states
  const [activeBillSettlementOrder, setActiveBillSettlementOrder] = useState(null);
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);
  const [settleDiscount, setSettleDiscount] = useState('');
  const [settleCouponInput, setSettleCouponInput] = useState('');
  const [settleCouponApplied, setSettleCouponApplied] = useState(null);

  // Order Details Modal state (view light / completed / cancelled card details)
  const [viewingOrderDetails, setViewingOrderDetails] = useState(null);

  // Keyboard navigation refs
  const manualCustRef = React.useRef(null);
  const manualPhoneRef = React.useRef(null);
  const manualTableRef = React.useRef(null);
  const manualSearchRef = React.useRef(null);
  const manualDiscountRef = React.useRef(null);

  const inputNavOrder = [manualCustRef, manualPhoneRef, manualTableRef, manualSearchRef, manualDiscountRef];

  const handleInputKeyDown = (e, currentIndex) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % inputNavOrder.length;
      if (inputNavOrder[nextIndex]?.current) {
        inputNavOrder[nextIndex].current.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + inputNavOrder.length) % inputNavOrder.length;
      if (inputNavOrder[prevIndex]?.current) {
        inputNavOrder[prevIndex].current.focus();
      }
    }
  };

  const handleOpenManualOrder = () => {
    setEditingOrderId(null);
    setManualOrderType('Dine-In');
    setManualTable('Table 1');
    setManualCustomer('');
    setManualPhone('');
    setManualItems({});
    setManualPaymentMode('Cash on Counter');
    setManualSearch('');
    setManualCategory('All');
    setManualGstEnabled(false);
    setManualDiscount('');
    setManualCoupon('');
    setIsManualOrderOpen(true);
  };

  // Context-Aware Global Keyboard Shortcuts: Pressing 1-6 changes cards per row layout; 'C' opens creation modal
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Do NOT trigger shortcut if Ctrl, Alt, or Meta key is held (e.g. Ctrl+C for copy)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const activeElement = document.activeElement;
      const tagName = activeElement ? activeElement.tagName.toUpperCase() : '';
      const isInput =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        (activeElement && activeElement.isContentEditable);

      const isModalOpen =
        isManualOrderOpen ||
        Boolean(editingOrderId) ||
        Boolean(viewingOrderDetails) ||
        Boolean(activeBillSettlementOrder) ||
        showUpiQrModal ||
        Boolean(document.querySelector('.crm-modal-backdrop'));

      // If typing in any input field or when Create Manual Order modal (or any modal) is open, do not trigger shortcuts!
      if (isInput || isModalOpen) return;

      // Handle number keys 1 to 6 to set cards per row layout
      if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const colNum = parseInt(e.key, 10);
        setCardsPerRow(colNum);
        addToast(`Layout Updated: ${colNum} Card${colNum > 1 ? 's' : ''} per Row`, <SlidersHorizontal size={16} />);
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();

        if (activeTab === 'catalog') {
          setIsAddProductModalOpen(true);
        } else if (activeTab === 'utilities') {
          handleOpenAddTableModal();
        } else if (activeTab === 'marketing') {
          setIsCreateCouponOpen(true);
        } else {
          // Default fallback (Home / Orders tab): Open Create Manual Order POS Modal
          handleOpenManualOrder();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [
    activeTab,
    isManualOrderOpen,
    editingOrderId,
    viewingOrderDetails,
    activeBillSettlementOrder,
    showUpiQrModal,
  ]);

  const handleEditOrder = (order) => {
    if (order.status !== 'new') {
      addToast('Cooking has already started! Order items are locked.', <Lock size={18} />);
      return;
    }

    setEditingOrderId(order._id || order.id);
    setManualOrderType(order.type || 'Dine-In');
    setManualTable(order.table || 'Table 1');
    setManualCustomer(order.customer || '');
    setManualPhone(order.phone || '');
    setManualDiscount(order.discount || '');
    setManualPaymentMode(order.paymentLabel || 'Cash on Counter');
    setManualSearch('');
    setManualCategory('All');

    const itemsMap = {};
    (order.items || []).forEach((it, idx) => {
      const key = `item_${idx}_${Date.now()}`;
      itemsMap[key] = {
        dishId: key,
        name: it.name,
        price: it.price,
        qty: it.qty,
        isVeg: it.isVeg !== undefined ? it.isVeg : true,
      };
    });
    setManualItems(itemsMap);
    setIsManualOrderOpen(true);
  };

  const handleUpdateItemQty = (itemKey, delta, dishObj = null, options = {}) => {
    setManualItems((prev) => {
      const existing = prev[itemKey];
      if (!existing && delta < 1) return prev;
      const currentQty = existing ? existing.qty : 0;
      const nextQty = currentQty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[itemKey];
        return copy;
      }
      const dish = dishObj || (dishes || []).find((d) => d.id === itemKey || d._id === itemKey);
      const price = options.price || (existing ? existing.price : (dish ? dish.price : 100));
      const name = options.name || (existing ? existing.name : (dish ? dish.name : 'Custom Item'));
      const isVeg = dish ? dish.isVeg : true;

      return {
        ...prev,
        [itemKey]: {
          dishId: dish ? (dish.id || dish._id) : itemKey,
          name,
          price,
          qty: nextQty,
          isVeg,
          sizeName: options.sizeName || (existing ? existing.sizeName : ''),
          bunName: options.bunName || (existing ? existing.bunName : ''),
          toppings: options.toppings || (existing ? existing.toppings : []),
        },
      };
    });
  };

  const handleClearAllSampleData = () => {
    if (!window.confirm('Are you sure you want to clear all sample data (orders, reviews, meal combos)? All new data will be created fresh!')) return;
    try {
      localStorage.removeItem('foodypay_crm_orders_v3');
      localStorage.removeItem('foodypay_crm_reviews_v1');
      localStorage.removeItem('foodypay_crm_meals_v1');
      localStorage.removeItem('foodypay_crm_customers_v1');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('foodypay_orders_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}

    setOrders([]);
    setCustomers([]);
    setReviews([]);
    setMealsCollection([]);
    addToast(' All sample data wiped cleanly! Database is completely fresh.', <Check size={18} />);
  };

  const manualSubtotal = Object.values(manualItems).reduce((sum, item) => sum + item.price * item.qty, 0);
  const mDiscountAmt = Number(manualDiscount) || 0;
  const manualTax = manualGstEnabled ? Math.round((manualSubtotal - mDiscountAmt) * 0.05) : 0;
  const manualTotal = Math.max(0, manualSubtotal - mDiscountAmt + manualTax);

  const handleCreateManualOrderSubmit = async (e) => {
    e.preventDefault();
    if (manualSubtotal <= 0) {
      addToast('Please select at least 1 food item for the order.', <Utensils size={18} />);
      return;
    }

    const formattedItems = Object.values(manualItems).map((it) => {
      let displayName = it.name;
      const extras = [];
      if (it.sizeName) extras.push(it.sizeName);
      if (it.bunName) extras.push(it.bunName);
      if (it.toppings && it.toppings.length > 0) extras.push(...it.toppings);
      if (extras.length > 0) displayName += ` [${extras.join(', ')}]`;

      return {
        name: displayName,
        qty: it.qty,
        price: it.price,
        isVeg: it.isVeg,
      };
    });

    const newOrderPayload = {
      type: manualOrderType,
      table: manualOrderType === 'Dine-In' ? manualTable : manualOrderType === 'Takeaway' ? 'Counter 1' : 'Home Delivery',
      customer: manualCustomer.trim() || 'Walk-in Guest',
      phone: manualPhone.trim() || '',
      paymentStatus: manualPaymentMode.includes('UPI') ? 'paid-upi' : 'cash',
      paymentLabel: manualPaymentMode,
      items: formattedItems,
      note: manualCoupon ? `Applied Coupon: ${manualCoupon}` : editingOrderId ? 'Order items updated from counter' : 'Manual Order Created from Counter',
      subtotal: manualSubtotal,
      discount: mDiscountAmt,
      tax: manualTax,
      total: manualTotal,
    };

    if (editingOrderId) {
      // Edit existing order
      if (token) {
        try {
          const updated = await updateOrderApi(token, editingOrderId, newOrderPayload);
          setOrders((prev) => prev.map((o) => (o._id === editingOrderId || o.id === editingOrderId ? updated : o)));
        } catch (err) {
          console.warn('API error updating order:', err);
        }
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === editingOrderId || o._id === editingOrderId ? { ...o, ...newOrderPayload } : o))
        );
      }
      addToast(`Order ${editingOrderId} updated successfully!`, <Check size={18} />);
    } else {
      // Create new order
      const nextId = `#FP-${1080 + orders.length + 1}`;
      if (token) {
        try {
          const createdOrder = await createOrderApi(token, newOrderPayload);
          setOrders((prev) => [{ ...createdOrder, seen: true }, ...prev]);
          const updatedCustomers = await fetchCustomersApi(token);
          setCustomers(updatedCustomers || []);
          const stats = await fetchOrderStatsApi(token);
          if (stats) setTodayStats(stats);
        } catch (err) {
          console.warn('API error creating order:', err);
        }
      } else {
        const newOrder = {
          ...newOrderPayload,
          id: nextId,
          _id: 'ord_' + Date.now(),
          time: 'Just now',
          timestamp: Date.now(),
          status: 'new',
          seen: true, // Auto-seen for manual orders
        };
        setOrders((prev) => [newOrder, ...prev]);
      }

      triggerSound(playOrderPlaced);
      confetti({ particleCount: 75, spread: 75, origin: { y: 0.3 } });
      addToast(`Manual Order ${nextId} created!`, <Check size={18} />);
    }

    setIsManualOrderOpen(false);
    setEditingOrderId(null);
  };

  // Bill Settlement Handlers
  const handleOpenBillSettlement = (order) => {
    setActiveBillSettlementOrder(order);
    setShowUpiQrModal(false);
    setSettleDiscount('');
    setSettleCouponInput('');
    setSettleCouponApplied(null);
  };

  const getSettleCalculations = () => {
    if (!activeBillSettlementOrder) return { subtotal: 0, discountVal: 0, finalTotal: 0 };
    const subtotal = activeBillSettlementOrder.total || 0;
    let discountVal = Number(settleDiscount) || 0;

    if (settleCouponApplied) {
      if (typeof settleCouponApplied.discount === 'number') {
        discountVal += settleCouponApplied.discount;
      } else if (typeof settleCouponApplied.discount === 'string' && settleCouponApplied.discount.includes('%')) {
        const pct = parseFloat(settleCouponApplied.discount) || 0;
        discountVal += (subtotal * pct) / 100;
      } else if (typeof settleCouponApplied.discount === 'string' && settleCouponApplied.discount.includes('₹')) {
        const flat = parseFloat(settleCouponApplied.discount.replace('₹', '')) || 0;
        discountVal += flat;
      } else if (settleCouponApplied.discountValue) {
        discountVal += Number(settleCouponApplied.discountValue);
      } else {
        discountVal += 50;
      }
    }

    discountVal = Math.min(discountVal, subtotal);
    const finalTotal = Math.max(0, subtotal - discountVal);
    return { subtotal, discountVal, finalTotal };
  };

  const handleApplySettleCoupon = () => {
    if (!settleCouponInput.trim()) return;
    const inputCode = settleCouponInput.trim().toUpperCase();
    const matched = (coupons || []).find((c) => (c.code || '').toUpperCase() === inputCode);

    if (matched) {
      setSettleCouponApplied(matched);
      addToast(`Coupon "${matched.code}" APPLIED!`, <Check size={18} />);
    } else if (inputCode === 'FOOD10' || inputCode === 'WELCOME50' || inputCode === 'DISCOUNT10') {
      setSettleCouponApplied({ code: inputCode, discount: '10%' });
      addToast(`Promo Code "${inputCode}" APPLIED! Saved 10%`, <Check size={18} />);
    } else {
      setSettleCouponApplied({ code: inputCode, discount: '₹50 OFF' });
      addToast(`Promo Code "${inputCode}" applied! (₹50 discount)`, <Check size={18} />);
    }
  };

  const handleSettleBillCash = async () => {
    if (!activeBillSettlementOrder) return;
    const orderId = activeBillSettlementOrder._id || activeBillSettlementOrder.id;
    const { finalTotal } = getSettleCalculations();

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId || ord._id === orderId
          ? { ...ord, total: finalTotal, status: 'completed', seen: true, paymentStatus: 'cash', paymentLabel: 'Cash on Counter' }
          : ord
      )
    );

    if (token) {
      try {
        await updateOrderApi(token, orderId, { ...activeBillSettlementOrder, total: finalTotal, status: 'completed', seen: true, paymentStatus: 'cash' });
        const stats = await fetchOrderStatsApi(token);
        if (stats) setTodayStats(stats);
      } catch (err) {}
    }

    triggerSound(playBillPaid);
    confetti({ particleCount: 60, spread: 60 });
    addToast(`Bill for Order ${activeBillSettlementOrder.orderId || orderId} settled (₹${finalTotal}) via CASH!`, <Check size={18} />);
    setActiveBillSettlementOrder(null);
  };

  const handleSettleBillUpiConfirm = async () => {
    if (!activeBillSettlementOrder) return;
    const orderId = activeBillSettlementOrder._id || activeBillSettlementOrder.id;
    const { finalTotal } = getSettleCalculations();

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId || ord._id === orderId
          ? { ...ord, total: finalTotal, status: 'completed', seen: true, paymentStatus: 'paid-upi', paymentLabel: 'Paid via UPI QR' }
          : ord
      )
    );

    if (token) {
      try {
        await updateOrderApi(token, orderId, { ...activeBillSettlementOrder, total: finalTotal, status: 'completed', seen: true, paymentStatus: 'paid-upi' });
        const stats = await fetchOrderStatsApi(token);
        if (stats) setTodayStats(stats);
      } catch (err) {}
    }

    triggerSound(playBillPaid);
    confetti({ particleCount: 90, spread: 80 });
    addToast(`Payment of ₹${finalTotal} received via UPI QR!`, <Check size={18} />);
    setShowUpiQrModal(false);
    setActiveBillSettlementOrder(null);
  };

  // Status Progression
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    stopContinuousAlarm();
    if (orderId) {
      try {
        const raw = localStorage.getItem('foodypay_seen_order_ids');
        const seenSet = raw ? new Set(JSON.parse(raw)) : new Set();
        seenSet.add(String(orderId));
        localStorage.setItem('foodypay_seen_order_ids', JSON.stringify(Array.from(seenSet)));
      } catch (e) {}
    }

    setOrders((prev) => {
      const updated = prev.map((ord) => {
        const ordId = ord._id || ord.id || ord.orderId;
        if (ordId === orderId || String(ordId) === String(orderId)) {
          return { ...ord, seen: true, status: newStatus, updatedAt: new Date().toISOString() };
        }
        return ord;
      });
      try {
        localStorage.setItem('foodypay_crm_orders_v3', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (token) {
      try {
        const orderObj = orders.find((o) => (o._id || o.id || o.orderId) === orderId || String(o._id || o.id || o.orderId) === String(orderId));
        const targetId = (orderObj && orderObj._id) || orderId;
        await updateOrderStatusApi(token, targetId, newStatus);
      } catch (err) {
        console.warn('API error updating status:', err);
      }
    }

    try {
      const bc = new BroadcastChannel('foodypay_live_orders_channel');
      bc.postMessage({ type: 'ORDER_UPDATED', orderId, newStatus });
      bc.close();
      window.dispatchEvent(new Event('foodypay_order_created'));
    } catch (e) {}

    if (newStatus === 'preparing') {
      triggerSound(playFoodPreparing);
      addToast(`Order ${orderId} is being prepared in the kitchen.`, <ChefHat size={18} />);
    } else if (newStatus === 'ready') {
      triggerSound(playFoodReady);
      addToast(`Order ${orderId} is Ready for Serving!`, <Bell size={18} />);
    } else if (newStatus === 'completed') {
      triggerSound(playBillPaid);
      addToast(`Order ${orderId} settled and delivered!`, <Check size={18} />);
    }
  };

  // ==========================================================================
  // 2. CATALOG & PRODUCTS
  // ==========================================================================
  const [selectedCategory, setSelectedCategory] = useState('Fast Food');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [showEditUrlInput, setShowEditUrlInput] = useState(false);
  const [showAddUrlInput, setShowAddUrlInput] = useState(false);
  const [editProductForm, setEditProductForm] = useState(null);
  const [allCategories, setAllCategories] = useState(['Fast Food', 'Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts']);

  const [productLogoFile, setProductLogoFile] = useState(null);
  const [productLogoPreview, setProductLogoPreview] = useState(null);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Fast Food',
    price: '',
    originalPrice: '',
    showDiscountTag: true,
    isVeg: true,
    isSpecial: false,
    desc: '',
    variantsCount: 1,
    image: '',
    images: [],
  });

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductLogoFile(file);
      const url = URL.createObjectURL(file);
      setProductLogoPreview(url);

      // Read as Data URL to support multiple photos and persistence
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setNewProductForm((prev) => {
          const currentImgs = Array.isArray(prev.images) && prev.images.length > 0 ? [...prev.images] : [];
          if (!currentImgs.includes(dataUrl)) currentImgs.unshift(dataUrl);
          return {
            ...prev,
            images: currentImgs,
            image: dataUrl,
          };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductMultiImageChange = (e, isEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        if (isEdit) {
          setEditProductForm((prev) => {
            if (!prev) return prev;
            const currentImgs = Array.isArray(prev.images) && prev.images.length > 0
              ? [...prev.images]
              : (prev.image ? [typeof prev.image === 'string' ? prev.image : prev.image.url] : []);
            if (!currentImgs.includes(dataUrl)) currentImgs.push(dataUrl);
            return {
              ...prev,
              images: currentImgs,
              image: currentImgs[0] || dataUrl,
            };
          });
        } else {
          setNewProductForm((prev) => {
            const currentImgs = Array.isArray(prev.images) && prev.images.length > 0
              ? [...prev.images]
              : (prev.image ? [prev.image] : []);
            if (!currentImgs.includes(dataUrl)) currentImgs.push(dataUrl);
            return {
              ...prev,
              images: currentImgs,
              image: currentImgs[0] || dataUrl,
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddCustomCategory = (e) => {
    if (e) e.preventDefault();
    const trimmed = customCategoryInput.trim();
    if (trimmed) {
      if (!allCategories.includes(trimmed)) {
        setAllCategories((prev) => [...prev, trimmed]);
      }
      setNewProductForm((prev) => ({ ...prev, category: trimmed }));
      setCustomCategoryInput('');
      setIsAddingNewCat(false);
      addToast(`New Category "${trimmed}" created & selected!`, <Check size={16} />);
    }
  };

  const filteredDishes = (dishes || []).filter((d) => {
    if (!d) return false;
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    const dishNameStr = typeof d.name === 'string' ? d.name : '';
    const matchesSearch = dishNameStr.toLowerCase().includes((catalogSearch || '').toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToggleProductStock = async (dishId) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId || d._id === dishId) {
          const nextVal = !d.inStock;
          addToast(`${d.name} is now ${nextVal ? 'In Stock' : 'Sold Out'}`);
          return { ...d, inStock: nextVal };
        }
        return d;
      })
    );

    if (token) {
      try {
        const dishObj = dishes.find((d) => d.id === dishId || d._id === dishId);
        if (dishObj && dishObj._id) {
          await toggleDishStockApi(token, dishObj._id);
        }
      } catch (err) {
        console.warn('API error toggling stock:', err);
      }
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim() || !newProductForm.price) return;

    const rawImages = Array.isArray(newProductForm.images) && newProductForm.images.length > 0
      ? newProductForm.images
      : [productLogoPreview || newProductForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'];
    const finalImage = rawImages[0];

    if (token) {
      try {
        const formData = new FormData();
        formData.append('name', newProductForm.name.trim().toUpperCase());
        formData.append('category', newProductForm.category);
        formData.append('price', newProductForm.price);
        formData.append('isVeg', newProductForm.isVeg);
        formData.append('isSpecial', newProductForm.isSpecial);
        formData.append('desc', newProductForm.desc || 'Prepared fresh with high quality ingredients.');
        formData.append('images', JSON.stringify(rawImages));
        if (productLogoFile) {
          formData.append('image', productLogoFile);
        } else if (newProductForm.image) {
          formData.append('imageUrl', newProductForm.image);
        }

        const createdDish = await createDishApi(token, formData);
        const fullCreatedDish = {
          ...(createdDish || {}),
          images: rawImages,
          image: finalImage,
        };
        setDishes((prev) => [fullCreatedDish, ...prev]);
      } catch (err) {
        console.warn('API error creating dish:', err);
      }
    } else {
      const newDish = {
        id: 'p_' + Date.now(),
        _id: 'p_' + Date.now(),
        name: newProductForm.name.trim().toUpperCase(),
        category: newProductForm.category,
        price: Number(newProductForm.price),
        originalPrice: newProductForm.originalPrice ? Number(newProductForm.originalPrice) : null,
        showDiscountTag: newProductForm.showDiscountTag !== false,
        isVeg: newProductForm.isVeg,
        isSpecial: newProductForm.isSpecial,
        isPinned: newProductForm.isSpecial,
        variantsCount: 1,
        inStock: true,
        desc: newProductForm.desc || 'Prepared fresh with high quality ingredients.',
        image: finalImage,
        images: rawImages,
      };
      setDishes((prev) => [newDish, ...prev]);
    }

    setIsAddProductModalOpen(false);
    setProductLogoFile(null);
    setProductLogoPreview(null);
    setNewProductForm({
      name: '',
      category: newProductForm.category,
      price: '',
      originalPrice: '',
      showDiscountTag: true,
      isVeg: true,
      isSpecial: false,
      desc: '',
      variantsCount: 1,
      image: '',
      images: [],
    });
    triggerSound(playMilestoneCelebration);
    addToast(`Added product "${newProductForm.name}" with ${rawImages.length} photo(s)!`, <Check size={18} />);
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    if (!editProductForm || !editProductForm.name.trim() || !editProductForm.price) return;

    const dishId = editProductForm._id || editProductForm.id;
    const finalImagesList = Array.isArray(editProductForm.images) && editProductForm.images.length > 0
      ? editProductForm.images
      : [editProductForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'];
    const primaryImg = finalImagesList[0];

    const updateData = {
      name: editProductForm.name.trim().toUpperCase(),
      category: editProductForm.category,
      price: Number(editProductForm.price),
      originalPrice: editProductForm.originalPrice ? Number(editProductForm.originalPrice) : null,
      showDiscountTag: editProductForm.showDiscountTag !== false,
      isVeg: editProductForm.isVeg,
      isSpecial: editProductForm.isSpecial,
      desc: editProductForm.desc || 'Prepared fresh with high quality ingredients.',
      sizes: editProductForm.sizes,
      images: finalImagesList,
      image: primaryImg,
    };

    if (token && dishId) {
      try {
        const updatedDish = await updateDishApi(token, dishId, updateData);
        const mergedUpdated = {
          ...(updatedDish || {}),
          ...updateData,
        };
        setDishes((prev) =>
          prev.map((dish) => ((dish._id || dish.id) === dishId ? mergedUpdated : dish))
        );
      } catch (err) {
        console.warn('API error updating dish:', err);
      }
    } else {
      setDishes((prev) => 
        prev.map((dish) => {
          if ((dish._id || dish.id) === dishId) {
            return {
              ...dish,
              ...updateData,
              variantsCount: editProductForm.sizes?.length || 1,
              images: finalImagesList,
              image: primaryImg,
              isPinned: editProductForm.isPinned || editProductForm.isSpecial,
            };
          }
          return dish;
        })
      );
    }
    addToast('Product & Photos Updated Successfully!', <Check size={14}/>);
    setIsEditProductModalOpen(false);
    setEditProductForm(null);
  };

  const handleDeleteDish = async (dishId) => {
    if (!window.confirm('Are you sure you want to delete this dish from your catalog?')) return;
    setDishes((prev) => prev.filter((d) => (d._id || d.id) !== dishId));
    if (token && dishId) {
      try {
        await deleteDishApi(token, dishId);
      } catch (err) {
        console.warn('API error deleting dish:', err);
      }
    }
    addToast('Product removed from catalog', <Trash2 size={16} />);
  };

  // ==========================================================================
  // 3. MARKETING & BIRTHDAY NOTIFICATIONS
  // ==========================================================================
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);
  const [editingCouponObj, setEditingCouponObj] = useState(null);
  const [isAssignCouponModalOpen, setIsAssignCouponModalOpen] = useState(false);
  const [selectedCustForCoupon, setSelectedCustForCoupon] = useState(null);
  const [assignCouponCode, setAssignCouponCode] = useState('');
  const [assignCouponDiscount, setAssignCouponDiscount] = useState('20% OFF');

  const [newCouponForm, setNewCouponForm] = useState({
    code: 'FEST20',
    type: 'percentage', // 'percentage', 'flat', 'bogo', 'referral', 'combo'
    discountValue: '20',
    maxDiscount: '100',
    minOrder: 299,
    expiryDate: get20DaysAheadDate(20),
    description: '20% OFF on all orders',
    assignedCustomerPhone: '',
    assignedCustomerName: '',
  });

  const handleOpenCreateCoupon = (targetCust = null) => {
    if (storeControls.lockMarketingTab) {
      addToast(' Marketing & Coupon Builder is Locked in Store Settings!', <Lock size={18} />);
      return;
    }
    setEditingCouponObj(null);
    setNewCouponForm({
      code: targetCust ? `VIP${(targetCust.name || 'USER').slice(0, 3).toUpperCase()}${Math.floor(10 + Math.random() * 90)}` : `FEAST${Math.floor(10 + Math.random() * 90)}`,
      type: 'percentage',
      discountValue: '20',
      maxDiscount: '100',
      minOrder: 299,
      expiryDate: get20DaysAheadDate(20),
      description: targetCust ? `Exclusive VIP offer for ${targetCust.name}` : '20% OFF on all orders',
      assignedCustomerPhone: targetCust ? (targetCust.phone || '') : '',
      assignedCustomerName: targetCust ? (targetCust.name || '') : '',
    });
    setIsCreateCouponOpen(true);
  };

  const handleEditCoupon = (coupon) => {
    if (storeControls.lockMarketingTab) {
      addToast(' Marketing & Coupon Builder is Locked in Store Settings!', <Lock size={18} />);
      return;
    }
    setEditingCouponObj(coupon);
    setNewCouponForm({
      code: coupon.code || '',
      type: coupon.type || 'percentage',
      discountValue: String(coupon.discountValue !== undefined ? coupon.discountValue : 20),
      maxDiscount: String(coupon.maxDiscount !== undefined ? coupon.maxDiscount : 100),
      minOrder: coupon.minOrder || 0,
      expiryDate: coupon.expiryDate || get20DaysAheadDate(20),
      description: coupon.description || coupon.discount || '',
      assignedCustomerPhone: coupon.assignedCustomerPhone || coupon.targetPhone || '',
      assignedCustomerName: coupon.assignedCustomerName || coupon.targetName || '',
    });
    setIsCreateCouponOpen(true);
  };

  const handleDeleteCoupon = (coupon) => {
    if (storeControls.lockMarketingTab) {
      addToast(' Marketing & Coupon Builder is Locked in Store Settings!', <Lock size={18} />);
      return;
    }
    setCoupons((prev) => prev.filter((c) => (c._id || c.id || c.code) !== (coupon._id || coupon.id || coupon.code)));
    addToast(`Deleted Promocode "${coupon.code}"`, <Trash2 size={16} />);
  };

  const handleToggleCouponStatus = (coupon) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if ((c._id || c.id || c.code) === (coupon._id || coupon.id || coupon.code)) {
          const nextStatus = c.status === 'Active' ? 'Expired' : 'Active';
          addToast(`Promocode "${c.code}" is now ${nextStatus}`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleGenerateRandomCouponCode = () => {
    const prefixes = {
      percentage: ['OFF', 'SAVE', 'FEAST', 'SPECIAL', 'DEAL'],
      flat: ['FLAT', 'CASH', 'SAVER', 'DISCOUNT', 'LESS'],
      bogo: ['BOGO', 'FREE1', 'BUY1GET1', 'PAIR'],
      referral: ['REFER', 'SHARE', 'EARN', 'FRIEND'],
      combo: ['COMBO', 'BUNDLE', 'MEAL', 'PARTY'],
    };
    const prefList = prefixes[newCouponForm.type] || ['PROMO'];
    const p = prefList[Math.floor(Math.random() * prefList.length)];
    const val = newCouponForm.discountValue || '50';
    setNewCouponForm((prev) => ({ ...prev, code: `${p}${val}` }));
  };

  const [bdayAutoSend, setBdayAutoSend] = useState(true);
  const [isEditBdayModalOpen, setIsEditBdayModalOpen] = useState(false);
  const [bdayConfig, setBdayConfig] = useState({
    couponCode: 'BDAYSPECIAL',
    offerDetail: 'Free Choco Lava Cake + 20% OFF',
    message: ' Happy Birthday {name}! Wish you a delicious day! Enjoy {offer} on your visit to {storeName}. Redeem Code: {code}',
  });

  const birthdayCustomers = customers.filter((c) => c.isBirthdayToday);

  const handleToggleBdayAutoSend = () => {
    setBdayAutoSend((prev) => {
      const nextVal = !prev;
      addToast(
        nextVal
          ? ' Automatic Birthday Offers Turned ON! Offers will be sent automatically on birthdays.'
          : ' Automatic Birthday Offers Turned OFF! Automatic sending paused.',
        <Sparkles size={16} />
      );
      return nextVal;
    });
  };

  const handleSendBirthdayPushNotification = () => {
    if (!bdayAutoSend && birthdayCustomers.length === 0) {
      addToast('No birthday customers celebrating today.', <Gift size={18} />);
    }

    if (creditsBalance < 15) {
      addToast('Insufficient FoodyPay Credits. Please recharge credits.', <CreditCard size={18} />);
      return;
    }

    setCreditsBalance((prev) => prev - 15);
    triggerSound(playMilestoneCelebration);
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.3 } });

    const count = birthdayCustomers.length > 0 ? birthdayCustomers.length : 1;
    addToast(
      `Push Notification & WhatsApp Gift (${bdayConfig.couponCode}) sent to ${count} Birthday Customer(s)!`,
      <Gift size={18} />
    );
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    if (!newCouponForm.code.trim()) return;

    let discountText = '';
    if (newCouponForm.type === 'percentage') {
      discountText = `${newCouponForm.discountValue}% OFF${newCouponForm.maxDiscount ? ` up to ₹${newCouponForm.maxDiscount}` : ''}`;
    } else if (newCouponForm.type === 'flat') {
      discountText = `Flat ₹${newCouponForm.discountValue} OFF (-₹${newCouponForm.discountValue} from Total Bill)`;
    } else if (newCouponForm.type === 'bogo') {
      discountText = newCouponForm.description || `Buy 1 Get 1 Free (BOGO Offer)`;
    } else if (newCouponForm.type === 'referral') {
      discountText = `Refer & Earn ₹${newCouponForm.discountValue || 50} Cashback`;
    } else if (newCouponForm.type === 'combo') {
      discountText = newCouponForm.description || `Special Combo Offer (-₹${newCouponForm.discountValue || 100} OFF)`;
    }

    if (editingCouponObj) {
      // Edit mode
      setCoupons((prev) =>
        prev.map((c) => {
          if ((c._id || c.id || c.code) === (editingCouponObj._id || editingCouponObj.id || editingCouponObj.code)) {
            return {
              ...c,
              code: newCouponForm.code.trim().toUpperCase(),
              type: newCouponForm.type,
              discount: discountText,
              discountValue: Number(newCouponForm.discountValue) || 0,
              maxDiscount: Number(newCouponForm.maxDiscount) || 0,
              minOrder: Number(newCouponForm.minOrder) || 0,
              expiryDate: newCouponForm.expiryDate || get20DaysAheadDate(20),
              description: newCouponForm.description || '',
              assignedToAll: !newCouponForm.assignedCustomerPhone.trim(),
              assignedCustomerPhone: newCouponForm.assignedCustomerPhone.trim(),
              targetPhone: newCouponForm.assignedCustomerPhone.trim(),
              assignedCustomerName: newCouponForm.assignedCustomerName.trim(),
              targetName: newCouponForm.assignedCustomerName.trim(),
            };
          }
          return c;
        })
      );
      addToast(`Updated Promocode "${newCouponForm.code.trim().toUpperCase()}"!`, <Check size={18} />);
    } else {
      // Create new mode
      const isGlobal = !newCouponForm.assignedCustomerPhone.trim();
      const newC = {
        id: `cp_${Date.now()}`,
        code: newCouponForm.code.trim().toUpperCase(),
        type: newCouponForm.type,
        discount: discountText,
        discountValue: Number(newCouponForm.discountValue) || 0,
        maxDiscount: Number(newCouponForm.maxDiscount) || 0,
        minOrder: Number(newCouponForm.minOrder) || 0,
        expiryDate: newCouponForm.expiryDate || get20DaysAheadDate(20),
        description: newCouponForm.description || '',
        assignedToAll: isGlobal,
        assignedCustomerPhone: newCouponForm.assignedCustomerPhone.trim(),
        targetPhone: newCouponForm.assignedCustomerPhone.trim(),
        assignedCustomerEmail: newCouponForm.assignedCustomerEmail || '',
        assignedCustomerName: newCouponForm.assignedCustomerName.trim(),
        targetName: newCouponForm.assignedCustomerName.trim(),
        uses: 0,
        status: 'Active',
      };

      if (token) {
        try {
          const createdCoupon = await createCouponApi(token, newC);
          setCoupons((prev) => [createdCoupon || newC, ...prev]);
        } catch (err) {
          setCoupons((prev) => [newC, ...prev]);
        }
      } else {
        setCoupons((prev) => [newC, ...prev]);
      }

      triggerSound(playMilestoneCelebration);
      const toastMsg = isGlobal
        ? `Activated Store Promocode "${newC.code}"!`
        : `Assigned Promocode "${newC.code}" to Mobile: ${newC.assignedCustomerPhone}!`;
      addToast(toastMsg, <Gift size={18} />);
    }

    setIsCreateCouponOpen(false);
    setEditingCouponObj(null);
  };

  const handleCreateCustomerGroupSubmit = (e) => {
    e.preventDefault();
    if (!newGroupForm.name.trim()) return;

    const matchingCusts = (customers || []).filter((c) => {
      if (newGroupForm.spendRule === 'high' && (c.totalSales || 0) < 500) return false;
      if (newGroupForm.spendRule === 'mid' && ((c.totalSales || 0) < 200 || (c.totalSales || 0) > 500)) return false;
      if (newGroupForm.spendRule === 'budget' && (c.totalSales || 0) >= 200) return false;
      return true;
    });

    const memberIds = matchingCusts.length > 0 ? matchingCusts.map((c) => c.id || c._id) : ['c1', 'c2'];
    const totalSalesSum = matchingCusts.reduce((s, c) => s + (c.totalSales || 0), 0) || 5400;
    const avgBillVal = Math.round(totalSalesSum / (matchingCusts.length || 1)) || 380;

    const newGrp = {
      id: `grp_${Date.now()}`,
      name: newGroupForm.name.trim(),
      description: newGroupForm.description || `Custom Segment (${newGroupForm.spendRule} bill, ${newGroupForm.daysRule} days, ${newGroupForm.foodCategory} category)`,
      spendRule: newGroupForm.spendRule,
      daysRule: newGroupForm.daysRule,
      foodCategory: newGroupForm.foodCategory,
      memberIds,
      avgBill: avgBillVal,
      totalSales: totalSalesSum,
      favoriteItem: newGroupForm.foodCategory === 'Fast Food' ? 'ITALIAN CHEESE GIANT SLICE' : 'Paneer Butter Masala',
    };

    setCustomerGroups((prev) => [newGrp, ...prev]);
    addToast(`Created Customer Group "${newGrp.name}" with ${memberIds.length} members!`, <Check size={18} />);
    setIsAddGroupModalOpen(false);
    setNewGroupForm({
      name: '',
      description: '',
      spendRule: 'all',
      daysRule: 'all',
      foodCategory: 'all',
    });
  };

  const handleDispatchTargetedCampaign = (e) => {
    if (e) e.preventDefault();
    if (!campaignCouponCode) return;

    if (campaignDispatchMode === 'specific_phone') {
      if (!campaignTargetPhone.trim()) {
        addToast('Please enter or select a customer mobile number!', <Frown size={18} />);
        return;
      }
      const cleanPhone = campaignTargetPhone.trim();
      setCoupons((prev) =>
        prev.map((c) => {
          if (c.code === campaignCouponCode) {
            return {
              ...c,
              assignedCustomerPhone: cleanPhone,
              targetPhone: cleanPhone,
              assignedToAll: false,
            };
          }
          return c;
        })
      );
      triggerSound(playMilestoneCelebration);
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.3 } });
      addToast(
        `🎯 Promocode "${campaignCouponCode}" assigned to Mobile ${cleanPhone}! Available in Customer Web App.`,
        <Gift size={18} />
      );
      return;
    }

    const targetGrp = customerGroups.find((g) => g.id === campaignTargetGroup) || customerGroups[0];
    const targetMembersCount = targetGrp ? targetGrp.memberIds.length : (customers || []).length;
    const countToSend = campaignDispatchMode === 'random_n' ? Math.min(Number(campaignRandomCount) || 1, targetMembersCount) : targetMembersCount;

    if (creditsBalance < 20) {
      addToast('Insufficient FoodyPay Credits. Please recharge credits.', <CreditCard size={18} />);
      return;
    }

    setCreditsBalance((prev) => prev - 20);
    triggerSound(playMilestoneCelebration);
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.3 } });

    addToast(
      ` Promocode "${campaignCouponCode}" dispatched to ${countToSend} customer(s) in group "${targetGrp ? targetGrp.name : 'Target Segment'}"!`,
      <Gift size={18} />
    );
  };

  const handleSaveAssignMobileSubmit = (e) => {
    e.preventDefault();
    if (!selectedCouponForAssignModal) return;

    const cleanPhone = assignMobileInput.trim();
    setCoupons((prev) =>
      prev.map((c) => {
        if ((c._id || c.id || c.code) === (selectedCouponForAssignModal._id || selectedCouponForAssignModal.id || selectedCouponForAssignModal.code)) {
          return {
            ...c,
            assignedCustomerPhone: cleanPhone,
            targetPhone: cleanPhone,
            assignedToAll: !cleanPhone,
          };
        }
        return c;
      })
    );

    triggerSound(playMilestoneCelebration);
    addToast(
      cleanPhone
        ? `🎯 Promocode "${selectedCouponForAssignModal.code}" assigned to Mobile ${cleanPhone}! Available in Customer Web App.`
        : `Promocode "${selectedCouponForAssignModal.code}" is now available to all store diners!`,
      <Gift size={18} />
    );

    setIsAssignMobileModalOpen(false);
    setSelectedCouponForAssignModal(null);
    setAssignMobileInput('');
  };

  const handleSendCustomNotificationSubmit = async (e) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyMessage.trim()) return;

    if (creditsBalance < 15) {
      addToast('Insufficient FoodyPay Credits. Please recharge credits.', <CreditCard size={18} />);
      return;
    }

    let targetDesc = '';
    let targetPhone = '';
    let targetEmail = '';
    let targetName = '';

    if (notifyAudienceMode === 'all_users') {
      targetDesc = `ALL ${(customers || []).length || 6} Customers`;
    } else if (notifyAudienceMode === 'specific_user') {
      const targetCust = (customers || []).find((c) => (c.id || c._id) === selectedCustId) || customers[0];
      if (targetCust) {
        targetDesc = `${targetCust.name} (${targetCust.phone})`;
        targetPhone = targetCust.phone || '';
        targetEmail = targetCust.email || '';
        targetName = targetCust.name || '';
      } else {
        targetDesc = 'Selected Customer';
      }
    } else if (notifyAudienceMode === 'random_n') {
      targetDesc = `${randomNotifyCount} Random Customer(s)`;
    } else if (notifyAudienceMode === 'group') {
      const matchGrp = customerGroups.find((g) => g.id === selectedGroupId);
      targetDesc = `Group "${matchGrp ? matchGrp.name : 'Target Segment'}" (${matchGrp ? matchGrp.memberIds.length : 3} Members)`;
    }

    const payload = {
      title: notifyTitle.trim(),
      message: notifyMessage.trim(),
      audienceMode: notifyAudienceMode,
      targetCustomerPhone: targetPhone,
      targetCustomerEmail: targetEmail,
      targetCustomerName: targetName,
      channel: notifyChannel,
      metadata: {
        storeName: storeControls.restName,
        foodypayId: storeControls.foodypayId,
      },
    };

    try {
      await sendNotificationApi(token, payload);
    } catch (err) {
      console.warn('Notification API fallback sync:', err);
    }

    // Broadcast channel for real-time Chrome Extension alerts
    try {
      const bc = new BroadcastChannel('foodypay_push_notifications_channel');
      bc.postMessage({ type: 'NEW_PUSH_ALERT', notification: payload });
      bc.close();
    } catch (bcErr) {}

    setCreditsBalance((prev) => prev - 15);
    triggerSound(playMilestoneCelebration);
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.3 } });

    const channelText = notifyChannel === 'push_whatsapp' ? 'WhatsApp & Chrome Extension Push' : notifyChannel === 'whatsapp_only' ? 'WhatsApp' : 'Chrome Extension Push';

    addToast(
      ` Persistent Push Notification "${notifyTitle}" dispatched to ${targetDesc} via ${channelText}!`,
      <Bell size={18} />
    );
    setIsCustomNotifyModalOpen(false);
  };

  // Table QR Standee Modal & Customizer State
  const [activeStandeeTable, setActiveStandeeTable] = useState(null);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [editingTableObj, setEditingTableObj] = useState(null);
  const [tableLogoFile, setTableLogoFile] = useState(null);
  const [tableLogoPreview, setTableLogoPreview] = useState(null);

  const [tableForm, setTableForm] = useState({
    name: '',
    purpose: 'Contactless Self Ordering',
    section: 'Indoor AC Dining',
    capacity: 4,
    url: '',
    theme: 'acrylic', // 'acrylic' | 'luxury' | 'neon'
    qrColor: '#1E293B',
    cornerColor: '#FF5E14',
    logoUrl: '',
  });

  // Table Customizer Keyboard navigation refs
  const tableNameRef = React.useRef(null);
  const tableCapacityRef = React.useRef(null);
  const tableSectionRef = React.useRef(null);
  const tablePurposeRef = React.useRef(null);
  const tableQrColorRef = React.useRef(null);
  const tableCornerColorRef = React.useRef(null);

  const tableInputNavOrder = [
    tableNameRef,
    tableCapacityRef,
    tableSectionRef,
    tablePurposeRef,
    tableQrColorRef,
    tableCornerColorRef,
  ];

  const handleTableInputKeyDown = (e, currentIndex) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tableInputNavOrder.length;
      if (tableInputNavOrder[nextIndex]?.current) {
        tableInputNavOrder[nextIndex].current.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tableInputNavOrder.length) % tableInputNavOrder.length;
      if (tableInputNavOrder[prevIndex]?.current) {
        tableInputNavOrder[prevIndex].current.focus();
      }
    }
  };

  const handleTableLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTableLogoFile(file);
      const url = URL.createObjectURL(file);
      setTableLogoPreview(url);
      setTableForm((prev) => ({ ...prev, logoUrl: url }));
    }
  };

  const handleOpenAddTableModal = (tableToEdit = null) => {
    if (storeControls.lockTableCrud) {
      addToast(' Table QR Modifications (Add/Edit/Delete) are Locked in Store Settings!', <Lock size={18} />);
      return;
    }
    setTableLogoFile(null);
    setTableLogoPreview(tableToEdit?.logoUrl || null);
    if (tableToEdit) {
      setEditingTableObj(tableToEdit);
      setTableForm({
        name: tableToEdit.name || 'Table 1',
        purpose: tableToEdit.purpose || 'Contactless Self Ordering',
        section: tableToEdit.section || 'Indoor AC Dining',
        capacity: tableToEdit.capacity || 4,
        url: getUniqueTableUrl(tableToEdit.name, tableToEdit.url),
        theme: tableToEdit.theme || 'acrylic',
        qrColor: tableToEdit.qrColor || '#1E293B',
        cornerColor: tableToEdit.cornerColor || '#FF5E14',
        logoUrl: tableToEdit.logoUrl || '',
      });
    } else {
      setEditingTableObj(null);
      const nextNum = tables.length + 1;
      const tableName = `Table ${nextNum}`;
      setTableForm({
        name: tableName,
        purpose: 'Contactless Self Ordering',
        section: 'Indoor AC Dining',
        capacity: 4,
        url: getUniqueTableUrl(tableName),
        theme: 'acrylic',
        qrColor: '#1E293B',
        cornerColor: '#FF5E14',
        logoUrl: '',
      });
    }
    setIsAddTableModalOpen(true);
  };

  const handleSaveTableSubmit = async (e) => {
    e.preventDefault();
    if (!tableForm.name.trim()) return;

    const targetUrl = getUniqueTableUrl(tableForm.name, tableForm.url);
    const finalLogo = tableLogoPreview || tableForm.logoUrl || '';

    const newTableData = {
      name: tableForm.name.trim(),
      purpose: tableForm.purpose.trim() || 'Contactless Self Ordering',
      section: tableForm.section.trim() || 'Indoor AC Dining',
      capacity: Number(tableForm.capacity) || 4,
      url: targetUrl,
      theme: tableForm.theme || 'acrylic',
      qrColor: tableForm.qrColor || '#1E293B',
      cornerColor: tableForm.cornerColor || '#FF5E14',
      logoUrl: finalLogo,
      status: 'available',
    };

    if (editingTableObj) {
      let updatedTable = { ...editingTableObj, ...newTableData };
      if (token && editingTableObj._id && !editingTableObj._id.startsWith('t_')) {
        try {
          const apiRes = await updateTableApi(token, editingTableObj._id, newTableData);
          if (apiRes) updatedTable = apiRes;
        } catch (err) {
          console.warn('Failed to update table on backend:', err.message);
        }
      }
      setTables((prev) =>
        prev.map((t) => (t.id === editingTableObj.id || t._id === editingTableObj._id ? updatedTable : t))
      );
      addToast(`Updated ${tableForm.name} QR Standee!`, <Check size={18} />);
    } else {
      let createdTable = {
        ...newTableData,
        id: 't_' + Date.now(),
        _id: 't_' + Date.now(),
      };
      if (token) {
        try {
          const apiRes = await createTableApi(token, newTableData);
          if (apiRes) createdTable = apiRes;
        } catch (err) {
          console.warn('Failed to save table on backend:', err.message);
        }
      }
      setTables((prev) => [...prev, createdTable]);
      addToast(`Created ${tableForm.name} QR Code!`, <Check size={18} />);
    }

    setIsAddTableModalOpen(false);
    setEditingTableObj(null);
    setTableLogoFile(null);
    setTableLogoPreview(null);
  };

  const handleDeleteTable = async (tableObj) => {
    if (storeControls.lockTableCrud) {
      addToast(' Table QR Modifications (Add/Edit/Delete) are Locked in Store Settings!', <Lock size={18} />);
      return;
    }
    const tableId = tableObj._id || tableObj.id;
    if (!window.confirm(`Are you sure you want to delete ${tableObj.name} QR Code?`)) return;

    if (token && tableObj._id && !tableObj._id.startsWith('t_')) {
      try {
        await deleteTableApi(token, tableObj._id);
      } catch (err) {
        console.warn('Failed to delete table on backend:', err.message);
      }
    }

    setTables((prev) => prev.filter((t) => (t._id || t.id) !== tableId));
    addToast(`Deleted ${tableObj.name} QR Code!`, <Check size={18} />);
  };

  // Day-Wise Calendar & Date Range Filter State
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'today' | 'yesterday' | 'last_7' | 'last_30' | 'this_month' | 'custom' | 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Orders Filter & Global Order Search
  const [orderTabFilter, setOrderTabFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

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

  const filteredOrders = (orders || []).filter((o) => {
    if (!o) return false;

    // Date Range & Calendar filter check
    const matchesDate = isOrderInDateRange(o, dateRangeFilter, customStartDate, customEndDate);
    if (!matchesDate) return false;

    const query = (orderSearchQuery || '').trim().toLowerCase();

    if (query) {
      const custName = String(o.customer || o.customerName || o.name || '').toLowerCase();
      const custPhone = String(o.phone || o.customerPhone || o.contactNo || o.mobile || '').toLowerCase();
      const orderIdStr = String(o.orderId || o.id || o._id || '').toLowerCase();
      const tableStr = String(o.table || o.type || '').toLowerCase();
      const statusStr = String(o.status || '').toLowerCase();
      const payStatusStr = String(o.paymentStatus || o.paymentLabel || '').toLowerCase();
      const itemsStr = Array.isArray(o.items)
        ? o.items.map((i) => `${i.name || ''} ${i.qty || ''}`).join(' ').toLowerCase()
        : '';

      return (
        custName.includes(query) ||
        custPhone.includes(query) ||
        orderIdStr.includes(query) ||
        tableStr.includes(query) ||
        statusStr.includes(query) ||
        payStatusStr.includes(query) ||
        itemsStr.includes(query)
      );
    }

    if (orderTabFilter === 'all') return true;
    return o.status === orderTabFilter;
  });

  return (
    <div className="crm-layout">
      {/* ==========================================================================
          FULL-SCREEN ACCOUNT SUSPENDED BLOCKER OVERLAY
          ========================================================================== */}
      {isAccountSuspended && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              padding: '36px 30px',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              border: '2px solid #EF4444',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Lock size={38} />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FEE2E2',
                color: '#991B1B',
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: '20px',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <AlertCircle size={14} /> Account Status: Suspended
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: '0 0 10px 0' }}>
              Merchant Account Suspended
            </h2>

            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              Your FoodyPay POS store account (ID: <strong style={{ color: '#1D4ED8' }}>{storeControls.foodypayId || currentUser.foodypayId || 'FP-MERCHANT'}</strong>) has been suspended by the administrator.
              <br /><br />
              You can no longer process orders, accept payments, or manage your store while suspended.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href={`https://wa.me/917496888449?text=${encodeURIComponent(`Hello FoodyPay Support, my merchant account (${storeControls.restName || 'Restaurant'}, ID: ${storeControls.foodypayId || currentUser.foodypayId || 'FP'}) is currently suspended. Please help me reactivate it.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: '#25D366',
                  color: '#FFFFFF',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '15px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                }}
              >
                <Phone size={18} /> Contact Support on WhatsApp
              </a>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} /> Log Out of Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="crm-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
          }}
        />
      )}

      {/* ==========================================================================
          1. CLEAN WHITE SIDEBAR (Ref: Image 1 & 3)
          ========================================================================== */}
      <aside className={`crm-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''}`}>
        <div 
          className="crm-sidebar-brand" 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          title={isSidebarCollapsed ? "Click logo to expand sidebar" : "Click logo to collapse sidebar"}
          style={{ cursor: 'pointer' }}
        >
          <a href="/" className="crm-brand-group" onClick={(e) => e.preventDefault()}>
            {storeControls.logoUrl && !logoImgFailed ? (
              <img
                src={storeControls.logoUrl}
                alt={storeControls.restName || "FoodyPay Logo"}
                className="crm-brand-img"
                style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: '#FFFFFF', padding: '2px', borderRadius: '10px', border: '1px solid #CBD5E1', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', flexShrink: 0 }}
                onError={() => setLogoImgFailed(true)}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px',
                  boxShadow: '0 4px 10px rgba(255, 94, 20, 0.3)',
                  flexShrink: 0,
                }}
              >
                <Utensils size={22} color="#FFFFFF" />
              </div>
            )}
            {!isSidebarCollapsed && (
              <div className="crm-brand-details">
                <div className="crm-brand-title">{storeControls.restName || "My Restaurant"}</div>
                <div className="crm-brand-subtitle">
                  <span className="crm-brand-live-dot" /> Cloud POS Active
                </div>
              </div>
            )}
          </a>
          <button
            type="button"
            className="crm-sidebar-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              background: '#F1F5F9',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F172A',
              transition: 'all 0.2s',
            }}
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="crm-sidebar-menu">
          {/* 1. Home / Orders */}
          <button
            type="button"
            title="Home / Orders"
            className={`crm-menu-link ${activeTab === 'home_orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('home_orders');
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon">
                <Home size={20} />
              </span>
              <span>Home / Orders</span>
            </div>
            <ChevronRight size={16} className="crm-menu-chevron" />
          </button>

          {/* 1.5 Kitchen Display System (KDS) - Opens Standalone Screen (Hidden if Locked) */}
          {!isKdsLocked && (
            <button
              type="button"
              title="Open Kitchen Display (KDS) in New Tab"
              className="crm-menu-link"
              onClick={() => {
                if (storeControls.kdsEnabled === false) {
                  addToast(' Kitchen Display System (KDS) is turned OFF in Settings!', <Lock size={18} />);
                  return;
                }
                const slug = (storeControls.restName || 'thefoodypay').toLowerCase().replace(/\s+/g, '-');
                const mid = storeControls.foodypayId || 'FP-790044';
                window.open(`/${slug}/${mid}/KitchenDisplaySystem`, '_blank');
                setMobileMenuOpen(false);
              }}
            >
              <div className="crm-menu-link-left">
                <span className="crm-menu-icon">
                  <ChefHat size={20} color={storeControls.kdsEnabled === false ? '#94A3B8' : '#FF5E14'} />
                </span>
                <span style={{ color: storeControls.kdsEnabled === false ? '#94A3B8' : 'inherit' }}>Kitchen Display (KDS)</span>
              </div>
              {storeControls.kdsEnabled === false ? (
                <span className="crm-badge-new" style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                  OFF
                </span>
              ) : (() => {
                const pendingCount = (orders || []).filter((o) => o && (o.status === 'new' || o.status === 'preparing')).length;
                return pendingCount > 0 ? (
                  <span className="crm-badge-new" style={{ background: '#FFF0EB', color: '#FF5E14', fontSize: '11px', fontWeight: 900, padding: '2px 8px', borderRadius: '10px' }}>
                    {pendingCount} Active
                  </span>
                ) : null;
              })()}
            </button>
          )}

          {/* 1.6 Delivery Partner View / Portal (Hidden if Locked) */}
          {!isDeliveryPartnerLocked && (
            <button
              type="button"
              title="Open Delivery Partner Portal in New Tab"
              className="crm-menu-link"
              onClick={() => {
                const slug = (storeControls.restName || 'thefoodypay').toLowerCase().replace(/\s+/g, '-');
                const mid = storeControls.foodypayId || 'FP-790044';
                window.open(`/${slug}/${mid}/delivery-partner`, '_blank');
                setMobileMenuOpen(false);
              }}
            >
              <div className="crm-menu-link-left">
                <span className="crm-menu-icon">
                  <Truck size={20} color="#F59E0B" />
                </span>
                <span>Delivery Partner View</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '10px' }}>
                LIVE
              </span>
            </button>
          )}

          {/* 2. Catalog / Products */}
          <div>
            <button
              type="button"
              title="Catalog / Products"
              className={`crm-menu-link ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('catalog');
                setCatalogSubmenuOpen(!catalogSubmenuOpen);
              }}
            >
              <div className="crm-menu-link-left">
                <span className="crm-menu-icon">
                  <Package size={20} />
                </span>
                <span>Catalog / Products</span>
              </div>
              <span className="crm-menu-chevron">
                {catalogSubmenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>

            {catalogSubmenuOpen && !isSidebarCollapsed && (
              <div className="crm-submenu-list">
                <button
                  type="button"
                  className={`crm-submenu-item ${activeTab === 'catalog' && selectedCategory === 'Fast Food' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('catalog');
                    setSelectedCategory('Fast Food');
                  }}
                >
                  <span>Products</span>
                </button>
                <button
                  type="button"
                  className={`crm-submenu-item ${activeTab === 'catalog_collections' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('catalog_collections');
                    setMobileMenuOpen(false);
                  }}
                >
                  <span>Collections / Steal Deals</span>
                  <span className="crm-badge-new" style={{ background: stealDealsConfig.enabled ? '#DCFCE7' : '#F1F5F9', color: stealDealsConfig.enabled ? '#15803D' : '#64748B', padding: '1px 6px' }}>
                    {stealDealsConfig.enabled ? 'ON' : 'OFF'}
                  </span>
                </button>
                {!isReviewsLocked && (
                  <button
                    type="button"
                    className={`crm-submenu-item ${activeTab === 'customer_reviews' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('customer_reviews');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span>Customer Reviews</span>
                    <span className="crm-badge-new" style={{ background: '#FEF3C7', color: '#D97706', padding: '1px 6px' }}>4.8 ⭐</span>
                  </button>
                )}
                <button
                  type="button"
                  className="crm-submenu-item"
                  onClick={() => addToast('Diner Wishlist feature activated!')}
                >
                  <span>Wishlists</span>
                  <span className="crm-badge-new">New</span>
                </button>
                {!isThemesLocked && (
                  <button
                    type="button"
                    className={`crm-submenu-item ${activeTab === 'catalog_themes' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('catalog_themes');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span>Themes &amp; Branding</span>
                    <span className="crm-badge-new" style={{ background: '#E0E7FF', color: '#4F46E5', padding: '1px 6px' }}>8 Presets</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. Grow (Hidden if Locked) */}
          {!isGrowLocked && (
            <button
              type="button"
              title="Grow"
              className={`crm-menu-link ${activeTab === 'grow' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('grow');
                setMobileMenuOpen(false);
              }}
            >
              <div className="crm-menu-link-left">
                <span className="crm-menu-icon">
                  <TrendingUp size={20} color="#16A34A" />
                </span>
                <span>Grow</span>
              </div>
            </button>
          )}

          {/* Delivery & Stores Management (Database-driven) */}
          <button
            type="button"
            title="Delivery & Store Management"
            className={`crm-menu-link ${activeTab === 'delivery_zones' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('delivery_zones');
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon">
                <Truck size={20} color="#3B82F6" />
              </span>
              <span>Delivery & Stores</span>
            </div>
            <span className="crm-badge-new" style={{ background: '#DBEAFE', color: '#1E40AF', padding: '1px 6px' }}>Zones</span>
          </button>

          {/* 4. Utilities (Table QR Generator) */}
          <button
            type="button"
            title="Utilities (QR Tables)"
            className={`crm-menu-link ${activeTab === 'utilities' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('utilities');
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon">
                <QrCode size={20} />
              </span>
              <span>Utilities (QR Tables)</span>
            </div>
          </button>

          {/* 5. Marketing (Hidden if Locked) */}
          {!isMarketingLocked && !storeControls.lockMarketingTab && (
            <button
              type="button"
              title="Marketing"
              className={`crm-menu-link ${activeTab === 'marketing' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('marketing');
                setMobileMenuOpen(false);
              }}
            >
              <div className="crm-menu-link-left">
                <span className="crm-menu-icon">
                  <Megaphone size={20} color="#FF5E14" />
                </span>
                <span>Marketing</span>
              </div>
            </button>
          )}

          {/* 6. Customers (Hidden if Locked) */}
          {!isCustomersLocked && (
            <button
              type="button"
              title="Customers"
              className={`crm-menu-link ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('customers');
                setMobileMenuOpen(false);
              }}
            >
              <div className="crm-menu-link-left">
                <span className="crm-menu-icon">
                  <Users size={20} color="#0D9488" />
                </span>
                <span>Customers</span>
              </div>
            </button>
          )}

          {/* 6.5 Customer Reviews (Hidden if Locked) */}
          {!isReviewsLocked && (
            <button
              type="button"
              title="Customer Reviews"
              className={`crm-menu-link ${activeTab === 'customer_reviews' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('customer_reviews');
                setMobileMenuOpen(false);
              }}
            >
              <div className="crm-menu-link-left">
                <span className="crm-menu-icon">
                  <Star size={20} color="#F59E0B" />
                </span>
                <span>Customer Reviews</span>
              </div>
            </button>
          )}

          {/* 7. Settings */}
          <button
            type="button"
            title="Settings"
            className={`crm-menu-link ${activeTab === 'store_controls' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('store_controls');
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon">
                <Settings size={20} />
              </span>
              <span>Settings</span>
            </div>
          </button>

          {/* LOGOUT LINK */}
          <button
            type="button"
            title="Log Out"
            className="crm-menu-link"
            style={{ color: '#EF4444', marginTop: '6px' }}
            onClick={handleLogout}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon" style={{ color: '#EF4444' }}>
                <LogOut size={20} />
              </span>
              <span>Log Out</span>
            </div>
          </button>
        </nav>

        {/* BOTTOM SIDEBAR CARD: FoodyPay Account (Razorpay Payments Only) */}
        <div 
          className="crm-sidebar-credits-card"
          title={`FoodyPay Account: ₹${razorpaySalesTotal.toLocaleString()} (Collected via Razorpay)`}
          onClick={() => {
            setActiveTab('home_orders');
            setOrderSearchQuery('Razorpay');
            addToast(`Showing orders paid via Razorpay (Total: ₹${razorpaySalesTotal.toLocaleString()})`);
          }}
        >
          <div className="crm-credits-icon-box">
            <CreditCard size={22} color="#1D4ED8" />
          </div>
          <div className="crm-credits-info">
            <span className="crm-credits-title">FoodyPay Account</span>
            <div className="crm-credits-amount">₹{razorpaySalesTotal.toLocaleString()}</div>
          </div>
          <button
            type="button"
            className="crm-credits-add-btn"
            style={{
              background: '#EFF8FF',
              border: '1.5px solid #B2DDFF',
              color: '#1D4ED8',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('home_orders');
              setOrderSearchQuery('Razorpay');
              addToast(`Filtered orders: Total ₹${razorpaySalesTotal.toLocaleString()} received via Razorpay`);
            }}
          >
            Razorpay
          </button>
        </div>
      </aside>

      {/* ==========================================================================
          2. MAIN CONTENT AREA
          ========================================================================== */}
      <main className="crm-main">
        {/* TOPBAR */}
        <header className="crm-header-bar" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', background: '#FFFFFF', padding: '16px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div className="crm-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="crm-desktop-hamburger"
              style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              title="Toggle Sidebar Navigation"
            >
              <Menu size={20} color="#0F172A" />
            </button>
            <div>
              <h1 className="crm-page-heading" style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activeTab === 'home_orders' && <><Home size={22} color="#1D4ED8" /> Home / Orders Overview</>}
                {activeTab === 'kitchen' && <><ChefHat size={22} color="#FF5E14" /> Kitchen Display System (KDS)</>}
                {activeTab === 'catalog' && <><Package size={22} color="#1D4ED8" /> Catalog / Products</>}
                {activeTab === 'catalog_collections' && <><Utensils size={22} color="#FF5E14" /> Meal Collections & Custom Combos</>}
                {activeTab === 'catalog_themes' && <><Palette size={22} color="#F59E0B" /> Catalog Themes & Branding Customizer</>}
                {activeTab === 'grow' && <><TrendingUp size={22} color="#16A34A" /> Grow / Business Telemetry</>}
                {activeTab === 'utilities' && <><QrCode size={22} color="#6366F1" /> Utilities & Table QR Generator</>}
                {activeTab === 'marketing' && <><Megaphone size={22} color="#FF5E14" /> Marketing & Birthday Push Notifications</>}
                {activeTab === 'customers' && <><Users size={22} color="#0D9488" /> Customers Directory & Loyalty</>}
                {activeTab === 'customer_reviews' && <><Star size={22} color="#F59E0B" fill="#F59E0B" /> Customer Reviews & Diner Feedback</>}
                {activeTab === 'store_controls' && <><Settings size={22} color="#475569" /> Store Controls & Security Settings</>}
              </h1>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '3px' }}>
                {storeControls.restName} • Merchant ID: <strong style={{ color: '#1D4ED8' }}>{storeControls.foodypayId}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live Clock Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', padding: '7px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>
              <Clock size={15} color="#1D4ED8" />
              <span>{currentTime}</span>
            </div>

            {/* Sound Mute/Unmute */}
            <button
              type="button"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: soundEnabled ? '#1D4ED8' : '#94A3B8',
              }}
              title={soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                addToast(soundEnabled ? ' Sound Alerts Muted' : ' Sound Alerts Enabled');
              }}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Quick Manual Order Button */}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
              }}
              onClick={() => handleOpenManualOrder()}
            >
              <Plus size={16} />
              <span>Counter POS Order</span>
            </button>

            {/* Logout Header Button */}
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                color: '#DC2626',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Log Out of Merchant Account"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* ==========================================================================
            EXPIRED SUBSCRIPTION WARNING BANNER
            ========================================================================== */}
        {isSubscriptionExpired && (
          <div
            style={{
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
              border: '2px solid #FCA5A5',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(220, 38, 38, 0.25)',
                }}
              >
                <Lock size={24} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ Your Subscription Plan Has Expired!
                  <span style={{ fontSize: '11.5px', background: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 800 }}>
                    Starter Free Active
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#7F1D1D', marginTop: '3px', fontWeight: 500 }}>
                  Your subscription valid until <strong>{subExpiryDateStr}</strong> has ended. All Growth Pro &amp; Enterprise Max features (KDS, Marketing, CRM, Themes) are now locked.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setUpgradeModalFeature({
                  title: 'Renew Subscription Plan',
                  badge: 'EXPIRED',
                  description: 'Your previous subscription has ended. Choose a plan to unlock all features instantly.',
                });
              }}
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} /> Upgrade / Renew Plan
            </button>
          </div>
        )}

        {/* ==========================================================================
            VIEW 1: HOME / ORDERS
            ========================================================================== */}
        {activeTab === 'home_orders' && (
          <div className="crm-orders-page-wrap">
            {/* DATE RANGE & DAY-WISE CALENDAR SELECTION HEADER BAR (Ref: User Screenshot) */}
            {(() => {
              const periodOrdersList = (orders || []).filter((o) => isOrderInDateRange(o, dateRangeFilter, customStartDate, customEndDate));
              const periodTotalSalesAmt = periodOrdersList.reduce((sum, o) => sum + (o ? (Number(o.total) || 0) : 0), 0);
              const getFilterLabel = () => {
                if (dateRangeFilter === 'today') return "Today's";
                if (dateRangeFilter === 'yesterday') return "Yesterday's";
                if (dateRangeFilter === 'last_7') return "Last 7 Days";
                if (dateRangeFilter === 'last_30') return "Last 30 Days";
                if (dateRangeFilter === 'this_month') return "This Month's";
                if (dateRangeFilter === 'custom') return "Custom Range";
                return "All Time";
              };

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '16px',
                      backgroundColor: '#FFFFFF',
                      padding: '12px 18px',
                      borderRadius: '16px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                        Orders &amp; Sales Summary
                      </h3>
                      {dateRangeFilter !== 'all' && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '3px 10px', borderRadius: '12px' }}>
                          Filter: {getFilterLabel()} ({periodOrdersList.length} Orders)
                        </span>
                      )}
                    </div>

                    {/* DAY-WISE CALENDAR & DATE RANGE SELECTOR (MATCHING USER SCREENSHOT) */}
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
                            borderRadius: '10px',
                            padding: '8px 36px 8px 34px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#1E293B',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            outline: 'none',
                          }}
                        >
                          <option value="today">📅 Today</option>
                          <option value="yesterday">📅 Yesterday</option>
                          <option value="last_7">📅 Last 7 days</option>
                          <option value="last_30">📅 Last 30 days</option>
                          <option value="this_month">📅 This Month</option>
                          <option value="custom">🗓️ Custom Date Range (Day-Wise Calendar)</option>
                          <option value="all">🌐 All Time (All Sales)</option>
                        </select>
                        <Calendar size={16} color="#475569" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
                        <ChevronDown size={15} color="#475569" style={{ position: 'absolute', right: '10px', pointerEvents: 'none' }} />
                      </div>

                      {/* CUSTOM DAY-WISE CALENDAR PICKERS */}
                      {dateRangeFilter === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>From:</div>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: '#0F172A' }}
                          />
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B' }}>To:</div>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: '#0F172A' }}
                          />
                          {(customStartDate || customEndDate) && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomStartDate('');
                                setCustomEndDate('');
                              }}
                              style={{ border: 'none', background: '#E2E8F0', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 SPATIOUS KPI CARDS WITH DYNAMIC DATE RANGE STATS */}
                  <div className="crm-kpi-banner-grid">
                    <div className="crm-kpi-card">
                      <div>
                        <div className="crm-kpi-label" style={{ fontWeight: 600, color: '#475569' }}>
                          {getFilterLabel()} Orders
                        </div>
                        <div className="crm-kpi-value">{periodOrdersList.length}</div>
                      </div>
                      <div className="crm-kpi-icon-box" style={{ background: '#EFF6FF', color: '#1D4ED8', width: '56px', height: '56px' }}>
                        <ShoppingBag size={26} />
                      </div>
                    </div>

                    <div className="crm-kpi-card">
                      <div>
                        <div className="crm-kpi-label" style={{ fontWeight: 600, color: '#475569' }}>
                          {getFilterLabel()} Sales
                        </div>
                        <div className="crm-kpi-value" style={{ color: '#059669' }}>
                          ₹{periodTotalSalesAmt.toLocaleString()}
                        </div>
                      </div>
                      <div className="crm-kpi-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
                        <CreditCard size={26} />
                      </div>
                    </div>

                    <div className="crm-kpi-card">
                      <div>
                        <div className="crm-kpi-label">Active Kitchen Tickets</div>
                        <div className="crm-kpi-value" style={{ color: '#FF5E14' }}>
                          {(orders || []).filter((o) => o && (o.status === 'new' || o.status === 'preparing')).length}
                        </div>
                      </div>
                      <div className="crm-kpi-icon-box" style={{ background: '#FFF0EB', color: '#FF5E14' }}>
                        <ChefHat size={26} />
                      </div>
                    </div>

                    <div className="crm-kpi-card">
                      <div>
                        <div className="crm-kpi-label">Tables Occupied</div>
                        <div className="crm-kpi-value">
                          {tables.filter((t) => t.status === 'occupied').length} / {tables.length}
                        </div>
                      </div>
                      <div className="crm-kpi-icon-box" style={{ background: '#FFFBEB', color: '#D97706' }}>
                        <Store size={26} />
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* FILTER BAR WITH CARDS PER ROW SELECTOR & ORDER SEARCH */}
            <div className="crm-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '1 1 auto' }}>
                <div className="crm-filter-tabs">
                  {[
                    { key: 'all', label: 'All Orders' },
                    { key: 'new', label: 'New Orders' },
                    { key: 'preparing', label: 'In Kitchen' },
                    { key: 'ready', label: 'Ready to Serve' },
                    { key: 'completed', label: 'Completed' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`crm-filter-tab ${orderTabFilter === f.key && !orderSearchQuery ? 'active' : ''}`}
                      onClick={() => {
                        setOrderTabFilter(f.key);
                        setOrderSearchQuery('');
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* GLOBAL ORDER SEARCH BOX (SEARCH BY NAME, PHONE, ORDER #, TABLE, DISH) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    flex: '1 1 260px',
                    maxWidth: '380px',
                  }}
                >
                  <Search size={16} color="#64748B" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search Order #, Name, Mobile, Table, Dish..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#0F172A',
                      background: 'transparent',
                    }}
                  />
                  {orderSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setOrderSearchQuery('')}
                      style={{
                        border: 'none',
                        background: '#E2E8F0',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#475569',
                        padding: 0,
                        flexShrink: 0,
                      }}
                      title="Clear Search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* 1 to 6 CARDS PER ROW SELECTOR CONTROL */}
                <div className="crm-grid-columns-control">
                  <span className="crm-grid-control-label">
                    <SlidersHorizontal size={14} /> Cards / Row:
                  </span>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`crm-grid-col-btn ${cardsPerRow === num ? 'active' : ''}`}
                      onClick={() => setCardsPerRow(num)}
                      title={num === 1 ? '1 Card per Row (Full Width)' : `${num} Cards per Row`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-create-order-primary"
                  onClick={handleOpenManualOrder}
                  title="Create counter or dine-in order"
                >
                  <Plus size={18} />
                  <span>Create Manual Order</span>
                </button>
              </div>
            </div>

            {/* SEARCH ACTIVE STATUS BANNER */}
            {orderSearchQuery.trim() && (
              <div
                style={{
                  margin: '12px 0 4px 0',
                  fontSize: '12.5px',
                  color: '#1E293B',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#EFF6FF',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #BFDBFE',
                }}
              >
                <span>
                  🔍 Showing <b>{filteredOrders.length}</b> orders matching "<b>{orderSearchQuery}</b>" across all sections (Paid & Unpaid)
                </span>
                <button
                  type="button"
                  onClick={() => setOrderSearchQuery('')}
                  style={{ border: 'none', background: 'transparent', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* EMPTY SEARCH STATE */}
            {orderSearchQuery.trim() && filteredOrders.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px dashed #CBD5E1',
                  margin: '16px 0',
                }}
              >
                <Search size={40} color="#94A3B8" style={{ marginBottom: '12px' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  No orders found matching "{orderSearchQuery}"
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B' }}>
                  Try searching by Customer Name, Phone Number, Order ID (e.g. #FP-1086), Table or Dish name across all orders (Paid & Unpaid).
                </p>
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => setOrderSearchQuery('')}
                  style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}
                >
                  Clear Search Filter
                </button>
              </div>
            )}

            {/* ORDERS GRID - DYNAMIC COLUMNS (1 TO 6 LIMITS) */}
            <div
              className="crm-orders-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: cardsPerRow === 1 ? '1fr' : `repeat(${cardsPerRow}, minmax(min(100%, 220px), 1fr))`,
                gap: '14px',
              }}
            >
              {(filteredOrders || []).slice((ordersPage - 1) * ordersPerPage, ordersPage * ordersPerPage).map((order, idx) => {
                const orderKey = order._id || order.id || `ord_${idx}`;
                const orderDisplayId = order.orderId || order.id || '#FP-1081';
                const isDeliveryOrder =
                  order.type === 'Home Delivery' ||
                  order.type === 'Takeaway' ||
                  order.orderType === 'delivery' ||
                  Boolean(order.address) ||
                  String(order.table || '').toLowerCase().includes('delivery');

                const activeWorkflowSteps = [
                  statusStepLabels?.step1 || (isDeliveryOrder ? 'Placed' : 'Placed'),
                  statusStepLabels?.step2 || (isDeliveryOrder ? 'Kitchen' : 'Kitchen'),
                  statusStepLabels?.step3 || (isDeliveryOrder ? 'Out for Delivery' : 'Ready'),
                  statusStepLabels?.step4 || (isDeliveryOrder ? 'Delivered' : 'Served'),
                ];

                const stepIndex =
                  order.status === 'completed' || order.status === 'served' || order.status === 'delivered'
                    ? 3
                    : order.status === 'out_for_delivery' || order.status === 'dispatched' || order.status === 'ready'
                    ? 2
                    : order.status === 'preparing'
                    ? 1
                    : 0;

                const isOrderPaid =
                  order.paymentStatus === 'paid-razorpay' ||
                  order.paymentStatus === 'paid-upi' ||
                  order.paymentStatus === 'paid-cash' ||
                  order.paymentStatus === 'paid' ||
                  (order.paymentLabel && order.paymentLabel.toLowerCase().includes('paid')) ||
                  order.status === 'completed' ||
                  order.status === 'delivered';

                return (
                  <div
                    key={orderKey}
                    className={`crm-order-card ${
                      order.status === 'completed'
                        ? 'completed-card crm-order-card-clickable'
                        : order.status === 'cancelled'
                        ? 'cancelled-card crm-order-card-clickable'
                        : `active-card ${order.status || 'new'}`
                    }`}
                    style={{
                      border: isOrderPaid ? '2px solid #86EFAC' : '1px solid #E2E8F0',
                      boxShadow: isOrderPaid ? '0 4px 14px rgba(34, 197, 94, 0.12)' : undefined,
                    }}
                    onClick={() => {
                      if (order.status === 'completed' || order.status === 'cancelled') {
                        setViewingOrderDetails(order);
                      }
                    }}
                  >
                    <div className="crm-order-card-header" style={{ backgroundColor: isOrderPaid ? '#F0FDF4' : '#FFFFFF' }}>
                      <div className="crm-order-id-group">
                        <span className="crm-order-id">{orderDisplayId}</span>
                        <span className="crm-table-tag highlight">{String(order.table || 'Table 1').replace(/tabel/gi, 'Table')}</span>
                        {isOrderPaid ? (
                          <span style={{ fontSize: '11px', fontWeight: 900, color: '#15803D', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} color="#16A34A" /> PAID (COLLECTED)
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#C2410C', backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', padding: '2px 8px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} color="#EA580C" /> UNPAID
                          </span>
                        )}
                      </div>

                      {order.status === 'completed' ? (
                        <span className="crm-completed-badge">
                          <CheckCircle2 size={13} /> Paid &amp; Served
                        </span>
                      ) : order.status === 'cancelled' ? (
                        <span className="crm-cancelled-badge">
                          <Frown size={13} /> Voided
                        </span>
                      ) : (
                        <span className={`crm-status-pill ${order.status || 'new'}`}>
                          {order.status ? order.status.toUpperCase() : 'NEW'}
                        </span>
                      )}
                    </div>

                    <div className="crm-progress-track">
                      <div className="crm-progress-steps">
                        <div className="crm-progress-line-back" />
                        <div
                          className="crm-progress-line-fill"
                          style={{
                            width: order.status === 'cancelled' ? '100%' : `${(stepIndex / 3) * 100}%`,
                            background: order.status === 'cancelled' ? '#EF4444' : order.status === 'completed' ? '#10B981' : undefined,
                          }}
                        />
                        {activeWorkflowSteps.map((l, idx) => (
                          <div
                            key={`${l}_${idx}`}
                            className={`crm-step-node ${order.status === 'cancelled' ? 'cancelled' : idx <= stepIndex ? 'done' : ''} ${idx === stepIndex && order.status !== 'cancelled' ? 'current' : ''}`}
                          >
                            <div className="crm-step-circle">
                              {order.status === 'cancelled' ? '' : idx <= stepIndex ? '' : idx + 1}
                            </div>
                            <span className="crm-step-label">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="crm-order-card-body">
                      <div className="crm-customer-meta">
                        <span className="crm-customer-name">
                          <User size={16} /> {order.customer}
                        </span>
                        <span className="crm-customer-phone">
                          <Phone size={14} /> {order.phone}
                        </span>
                      </div>

                      <div className="crm-order-items-list">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="crm-item-row">
                            <div className="crm-item-name-qty">
                              <span className={it.isVeg ? 'crm-veg-dot' : 'crm-nonveg-dot'} />
                              <span className="crm-qty-badge">{it.qty}x</span>
                              <span style={{ fontWeight: 600 }}>{it.name}</span>
                            </div>
                            <span style={{ fontWeight: 700 }}>₹{it.price * it.qty}</span>
                          </div>
                        ))}
                      </div>

                      {/* PROMINENT PAYMENT COLLECTION STATUS BANNER */}
                      {isOrderPaid ? (
                        <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '10px', padding: '8px 12px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#15803D' }}>
                            <CheckCircle2 size={16} color="#16A34A" />
                            <span>Already Collected ✓</span>
                          </div>
                          <span style={{ fontSize: '11.5px', fontWeight: 900, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '6px', border: '1px solid #86EFAC' }}>
                            {order.paymentLabel || 'Paid Online'}
                          </span>
                        </div>
                      ) : (
                        <div style={{ backgroundColor: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: '10px', padding: '8px 12px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#C2410C' }}>
                            <AlertCircle size={16} color="#EA580C" />
                            <span>Bill Pending</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBillSettlement(order);
                            }}
                            style={{ backgroundColor: '#EA580C', color: '#FFFFFF', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)' }}
                          >
                            Collect ₹{order.total}
                          </button>
                        </div>
                      )}

                      {order.note && (
                        <div className="crm-special-note">
                          <Edit3 size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{order.note}</span>
                        </div>
                      )}
                    </div>

                    <div className="crm-order-card-footer" onClick={(e) => e.stopPropagation()}>
                      <div className="crm-order-total-row">
                        <div>
                          <div className="crm-total-amount">₹{order.total}</div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: isOrderPaid ? '#15803D' : '#C2410C', marginTop: '1px' }}>
                            {isOrderPaid ? '✓ Payment Received' : '⏳ Bill Pending'}
                          </div>
                        </div>
                        <span
                          className={`crm-payment-pill ${order.paymentStatus}`}
                          style={{
                            fontWeight: 900,
                            backgroundColor: isOrderPaid ? '#DCFCE7' : '#FFF7ED',
                            color: isOrderPaid ? '#15803D' : '#C2410C',
                            border: isOrderPaid ? '1.5px solid #86EFAC' : '1.5px solid #FDBA74',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        >
                          {isOrderPaid ? '✓ ' : '⏳ '}{order.paymentLabel || (isOrderPaid ? 'Paid' : 'Unpaid')}
                        </span>
                      </div>

                      <div className="crm-card-actions-grid">
                        {(order.status === 'new' || order.status === 'new_seen') && (
                          <>
                            <button
                              type="button"
                              className="crm-btn-action"
                              disabled={order.seen}
                              style={{
                                backgroundColor: order.seen ? '#64748B' : '#2563EB',
                                color: '#FFF',
                                fontWeight: 800,
                                opacity: order.seen ? 0.8 : 1,
                                cursor: order.seen ? 'not-allowed' : 'pointer',
                                border: order.seen ? '1px solid #475569' : 'none',
                              }}
                              onClick={() => !order.seen && handleMarkOrderSeen(order._id || order.id)}
                              title={order.seen ? "Order Acknowledged (Bell Stopped)" : "Acknowledge Order & Stop Bell Alarm"}
                            >
                              {order.seen ? <Check size={16} /> : <Eye size={16} />}
                              <span>{order.seen ? '✓ SEEN (BELL STOPPED)' : '️ SEEN (STOP BELL)'}</span>
                            </button>
                            <button
                              type="button"
                              className="crm-btn-action fire"
                              onClick={() => handleStartPreparingOrder(order._id || order.id)}
                              title="Start Cooking in Kitchen"
                            >
                              <ChefHat size={16} />
                              <span>Start Cooking</span>
                            </button>
                            <button
                              type="button"
                              className="crm-btn-action edit"
                              onClick={() => handleEditOrder(order)}
                              title="Edit Order items before cooking"
                            >
                              <Edit3 size={16} />
                              <span>Edit Order</span>
                            </button>
                            <button
                              type="button"
                              className="crm-btn-action settle"
                              onClick={() => handleOpenBillSettlement(order)}
                              title="Settle Bill Cash/UPI"
                            >
                              <CreditCard size={16} />
                              <span>Bill Settlement</span>
                            </button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div className="crm-locked-cooking-badge">
                              <Lock size={14} />
                              <span>In Kitchen (Cooking) — Item Editing Locked</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="crm-btn-action ready-btn"
                                style={{ flex: 1 }}
                                onClick={() => handleUpdateOrderStatus(order._id || order.id, 'ready')}
                              >
                                <Bell size={16} />
                                <span>Food is Ready</span>
                              </button>
                              <button
                                type="button"
                                className="crm-btn-action settle"
                                style={{ flex: 1 }}
                                onClick={() => handleOpenBillSettlement(order)}
                              >
                                <CreditCard size={16} />
                                <span>Settle Bill</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {(order.status === 'ready' || order.status === 'out_for_delivery' || order.status === 'dispatched') && (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(isDeliveryOrder || storeControls.workflowMode === 'delivery') && order.status === 'ready' && (
                              <button
                                type="button"
                                className="crm-btn-action fire full-w"
                                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#000', fontWeight: 900 }}
                                onClick={() => handleUpdateOrderStatus(order._id || order.id, 'out_for_delivery')}
                              >
                                <Truck size={17} />
                                <span>Out for Delivery (Nikala Gaya)</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="crm-btn-action settle full-w"
                              onClick={() => {
                                if (isDeliveryOrder && (order.status === 'out_for_delivery' || order.status === 'dispatched')) {
                                  handleUpdateOrderStatus(order._id || order.id, 'delivered');
                                } else {
                                  handleOpenBillSettlement(order);
                                }
                              }}
                            >
                              <CheckCircle2 size={17} />
                              <span>
                                {isDeliveryOrder
                                  ? order.status === 'out_for_delivery' || order.status === 'dispatched'
                                    ? 'Mark Delivered & Complete'
                                    : 'Bill Settlement & Complete'
                                  : 'Bill Settlement & Complete'}
                              </span>
                            </button>
                          </div>
                        )}

                        {order.status === 'completed' && (
                          <div style={{ width: '100%', display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="crm-btn-secondary"
                              style={{ flex: 1 }}
                              onClick={() => setViewingOrderDetails(order)}
                            >
                              <Eye size={16} />
                              <span>View Receipt</span>
                            </button>
                            <button
                              type="button"
                              className="crm-btn-secondary"
                              style={{ flex: 1 }}
                              onClick={() => window.print()}
                            >
                              <Printer size={15} />
                              <span>Print KOT</span>
                            </button>
                          </div>
                        )}

                        {order.status === 'cancelled' && (
                          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FEF2F2', border: '1px solid #FECACA', padding: '8px 12px', borderRadius: '10px', color: '#DC2626', fontSize: '12px', fontWeight: 800 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Frown size={15} />
                              <span>Order Cancelled &amp; Voided</span>
                            </div>
                            <button
                              type="button"
                              className="crm-btn-secondary"
                              style={{ fontSize: '11.5px', padding: '4px 10px', borderColor: '#FCA5A5', color: '#B91C1C', background: '#FFFFFF' }}
                              onClick={() => handleUpdateOrderStatus(order._id || order.id, 'new')}
                            >
                              Re-open Order
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Orders Pagination Controls */}
            {(filteredOrders || []).length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '14px 20px', borderRadius: '16px', border: '1.5px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                  Showing {Math.min((ordersPage - 1) * ordersPerPage + 1, (filteredOrders || []).length)} - {Math.min(ordersPage * ordersPerPage, (filteredOrders || []).length)} of {(filteredOrders || []).length} orders
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={ordersPage === 1}
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      background: ordersPage === 1 ? '#F1F5F9' : '#FFFFFF',
                      color: ordersPage === 1 ? '#94A3B8' : '#0F172A',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: ordersPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ◀ Prev
                  </button>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#1D4ED8', padding: '4px 10px', background: '#EFF6FF', borderRadius: '6px' }}>
                    Page {ordersPage} of {Math.ceil((filteredOrders || []).length / ordersPerPage) || 1}
                  </span>

                  <button
                    type="button"
                    disabled={ordersPage * ordersPerPage >= (filteredOrders || []).length}
                    onClick={() => setOrdersPage((p) => p + 1)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      background: ordersPage * ordersPerPage >= (filteredOrders || []).length ? '#F1F5F9' : '#FFFFFF',
                      color: ordersPage * ordersPerPage >= (filteredOrders || []).length ? '#94A3B8' : '#0F172A',
                      fontWeight: 800,
                      fontSize: '12.5px',
                      cursor: ordersPage * ordersPerPage >= (filteredOrders || []).length ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================================================
            VIEW 1.5: KITCHEN DISPLAY SYSTEM (KDS)
            ========================================================================== */}
        {activeTab === 'kitchen' && (
          <div style={{ padding: '24px 36px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', color: '#FFF', padding: '20px 24px', borderRadius: '18px', boxShadow: '0 8px 24px rgba(15,23,42,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChefHat size={28} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Kitchen Display System (KDS)</h2>
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>Live Chef Screen • Auto-Ringing Bell for Unseen Orders</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {['all', 'new', 'preparing', 'ready'].map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setKitchenFilter(filterKey)}
                    style={{
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: kitchenFilter === filterKey ? '#FF5E14' : '#1E293B',
                      color: '#FFF'
                    }}
                  >
                    {filterKey === 'all' ? 'All Orders' : filterKey === 'new' ? ' New / Unseen' : filterKey === 'preparing' ? ' Preparing' : ' Ready'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {(orders || []).filter((o) => {
                if (!o || o.status === 'completed' || o.status === 'cancelled') return false;
                if (kitchenFilter === 'all') return true;
                if (kitchenFilter === 'new') return o.status === 'new' || !o.seen;
                if (kitchenFilter === 'preparing') return o.status === 'preparing';
                if (kitchenFilter === 'ready') return o.status === 'ready';
                return true;
              }).map((order) => (
                <div
                  key={order.id || order._id}
                  style={{
                    backgroundColor: '#FFF',
                    borderRadius: '18px',
                    border: !order.seen || order.status === 'new' ? '2.5px solid #EF4444' : order.status === 'preparing' ? '2.5px solid #FF5E14' : '2px solid #E2E8F0',
                    padding: '18px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{order.id}</span>
                      <span style={{ marginLeft: '10px', backgroundColor: '#FFEDD5', color: '#C2410C', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', fontSize: '13px' }}>
                        {String(order.table || 'Table 1').replace(/tabel/gi, 'Table')}
                      </span>
                    </div>
                    <span style={{
                      backgroundColor: !order.seen || order.status === 'new' ? '#FEF2F2' : order.status === 'preparing' ? '#FFF7ED' : '#F0FDF4',
                      color: !order.seen || order.status === 'new' ? '#DC2626' : order.status === 'preparing' ? '#C2410C' : '#16A34A',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {!order.seen || order.status === 'new' ? ' BELL RINGING' : order.status === 'preparing' ? ' Cooking' : '️ Food Ready'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
                    <span>Customer: <strong>{order.customer}</strong></span>
                    <span>⏱️ {order.time || '6m ago'}</span>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: idx < order.items.length - 1 ? '1px dashed #E2E8F0' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ backgroundColor: '#FF5E14', color: '#FFF', fontWeight: 900, fontSize: '13px', padding: '2px 8px', borderRadius: '6px' }}>
                            {it.qty}x
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{it.name}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>₹{(it.price || 0) * (it.qty || 1)}</span>
                      </div>
                    ))}
                    {order.note && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#DC2626', fontWeight: 700, backgroundColor: '#FEF2F2', padding: '6px 10px', borderRadius: '6px' }}>
                        Note: {order.note}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(order.status === 'new' || order.status === 'new_seen') && (
                      <>
                        <button
                          disabled={order.seen}
                          onClick={() => !order.seen && handleMarkOrderSeen(order._id || order.id)}
                          style={{
                            flex: 1,
                            backgroundColor: order.seen ? '#64748B' : '#3B82F6',
                            color: '#FFF',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            opacity: order.seen ? 0.8 : 1,
                            cursor: order.seen ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          {order.seen ? <Check size={16} /> : <Eye size={16} />}
                          <span>{order.seen ? '✓ SEEN (STOPPED)' : '️ SEEN (STOP BELL)'}</span>
                        </button>
                        <button
                          onClick={() => handleStartPreparingOrder(order._id || order.id)}
                          style={{ flex: 1, backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                        >
                           START COOKING
                        </button>
                      </>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order._id || order.id, 'ready')}
                        style={{ width: '100%', backgroundColor: '#16A34A', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                      >
                        ️ MARK IT'S READY! (RING READY BELL)
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order._id || order.id, 'completed')}
                        style={{ width: '100%', backgroundColor: '#0F172A', color: '#FFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                      >
                         MARK SERVED TO TABLE
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW 2: CATALOG / PRODUCTS (Ref: Image 2 with Real Food Images)
            ========================================================================== */}
        {activeTab === 'catalog' && (
          <div className="crm-catalog-split-view">
            {/* LEFT COLUMN: ALL CATEGORIES */}
            <aside className="crm-categories-sidebar">
              <div className="crm-cat-sidebar-header">ALL CATEGORIES</div>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`crm-cat-item-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span>{cat}</span>
                  <MoreVertical size={16} className="crm-cat-dots" />
                </button>
              ))}
            </aside>

            {/* CENTER COLUMN: PRODUCTS TABLE WITH FOOD IMAGES */}
            <section className="crm-products-main-col">
              <div className="crm-selected-cat-header">
                <div className="crm-selected-cat-title">
                  <Utensils size={20} color="#1D4ED8" />
                  <span>{selectedCategory}</span>
                </div>
                <button
                  type="button"
                  className="crm-seo-link"
                  style={{ background: 'none', border: 'none' }}
                  onClick={() => addToast('SEO Settings: Search keywords saved!')}
                >
                  Edit SEO settings
                </button>
              </div>

              {/* Products Table with Real Photos */}
              <table className="crm-product-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Product Name</th>
                    <th style={{ width: '15%' }}>Category</th>
                    <th style={{ width: '15%' }}>Price</th>
                    <th style={{ width: '15%' }}>Stock</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredDishes || []).slice((catalogPage - 1) * catalogPerPage, catalogPage * catalogPerPage).map((dish, idx) => {
                    const dishKey = dish._id || dish.id || `dish_${idx}`;
                    const dishImgUrl = (Array.isArray(dish.images) && dish.images[0])
                      ? dish.images[0]
                      : (typeof dish.image === 'string' ? dish.image : (dish.image?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'));
                    const hasMultiPhotos = Array.isArray(dish.images) && dish.images.length > 1;

                    return (
                      <tr key={dishKey}>
                        <td>
                          <div className="crm-product-info-cell">
                            {/* Real Food Image Thumbnail */}
                            <div className="crm-prod-thumb-box" style={{ position: 'relative' }}>
                              <img
                                src={dishImgUrl}
                                alt={dish.name}
                                className="crm-prod-thumb-img"
                                loading="lazy"
                              />
                              {hasMultiPhotos && (
                                <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(15,23,42,0.85)', color: '#FFF', fontSize: '9px', fontWeight: 800, padding: '1px 4px', borderRadius: '4px' }}>
                                  📷 {dish.images.length}
                                </span>
                              )}
                            </div>
                          <div>
                            <div className="crm-prod-name-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{dish.name}</span>
                              {(dish.isSpecial || dish.isPinned) && (
                                <span style={{ fontSize: '11px', background: '#FFF7ED', color: '#EA580C', border: '1px solid #FFEDD5', padding: '2px 7px', borderRadius: '10px', fontWeight: 800 }}>
                                  ⭐ Special
                                </span>
                              )}
                              {hasMultiPhotos && (
                                <span style={{ fontSize: '10.5px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                                  {dish.images.length} Photos
                                </span>
                              )}
                            </div>
                            {dish.desc && (
                              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {dish.desc}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                              <span className="crm-prod-variants-badge">
                                View {dish.variantsCount || 1} variants
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditProductForm({
                                    ...dish,
                                    sizes: dish.sizes && dish.sizes.length > 0 ? dish.sizes : [{ name: 'Regular', price: dish.price, qty: 100 }],
                                    images: dish.images && dish.images.length > 0 ? dish.images : (dishImgUrl ? [dishImgUrl] : [])
                                  });
                                  setIsEditProductModalOpen(true);
                                }}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  border: '1.5px solid #3B82F6',
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Edit Product Details & Images"
                              >
                                <Edit3 size={13} color="#1D4ED8" /> Edit Product
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#475569', fontSize: '13px', background: '#F1F5F9', display: 'inline-block', padding: '4px 10px', borderRadius: '6px' }}>
                          {dish.category || 'Uncategorized'}
                        </div>
                      </td>
                      <td>
                        <div className="crm-prod-price" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>₹{dish.price}</span>
                            {dish.showDiscountTag !== false && Number(dish.originalPrice) > Number(dish.price) && (
                              <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontSize: '12px' }}>
                                ₹{dish.originalPrice}
                              </span>
                            )}
                          </div>
                          {dish.showDiscountTag !== false && Number(dish.originalPrice) > Number(dish.price) ? (
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '6px', width: 'fit-content' }}>
                              🔥 {Math.round(((Number(dish.originalPrice) - Number(dish.price)) / Number(dish.originalPrice)) * 100)}% OFF
                            </span>
                          ) : dish.showDiscountTag === false && Number(dish.originalPrice) > Number(dish.price) ? (
                            <span style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>
                              (Discount tag hidden)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <label className="crm-blue-switch">
                          <input
                            type="checkbox"
                            checked={dish.inStock}
                            onChange={() => handleToggleProductStock(dish._id || dish.id)}
                          />
                          <span className="crm-blue-slider" />
                        </label>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            type="button"
                            style={{
                              padding: '6px 14px',
                              borderRadius: '10px',
                              border: '1.5px solid #93C5FD',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              fontSize: '12.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 4px rgba(29, 78, 216, 0.08)'
                            }}
                            title="Edit Product Details & Photos"
                            onClick={() => {
                              setEditProductForm({
                                ...dish,
                                sizes: dish.sizes && dish.sizes.length > 0 ? dish.sizes : [{ name: 'Regular', price: dish.price, qty: 100 }],
                                images: dish.images && dish.images.length > 0 ? dish.images : (dishImgUrl ? [dishImgUrl] : [])
                              });
                              setIsEditProductModalOpen(true);
                            }}
                          >
                            <Edit3 size={15} color="#1D4ED8" />
                            <span>Edit</span>
                          </button>
                          <button 
                            type="button"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '10px',
                              border: '1.5px solid #FECACA',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '12.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            title="Delete Dish"
                            onClick={() => handleDeleteDish(dish._id || dish.id)}
                          >
                            <Trash2 size={15} color="#DC2626" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Catalog Table Pagination Controls */}
              {(filteredDishes || []).length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '12px 18px', borderRadius: '12px', border: '1.5px solid #E2E8F0', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569' }}>
                      Showing {Math.min((catalogPage - 1) * catalogPerPage + 1, (filteredDishes || []).length)} - {Math.min(catalogPage * catalogPerPage, (filteredDishes || []).length)} of {(filteredDishes || []).length} dishes
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Rows:</span>
                      <select
                        value={catalogPerPage}
                        onChange={(e) => {
                          setCatalogPerPage(Number(e.target.value));
                          setCatalogPage(1);
                        }}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: 700 }}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={catalogPage === 1}
                      onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        background: catalogPage === 1 ? '#F1F5F9' : '#FFFFFF',
                        color: catalogPage === 1 ? '#94A3B8' : '#0F172A',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: catalogPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ◀ Prev
                    </button>

                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1D4ED8', padding: '3px 8px', background: '#EFF6FF', borderRadius: '6px' }}>
                      Page {catalogPage} of {Math.ceil((filteredDishes || []).length / catalogPerPage) || 1}
                    </span>

                    <button
                      type="button"
                      disabled={catalogPage * catalogPerPage >= (filteredDishes || []).length}
                      onClick={() => setCatalogPage((p) => p + 1)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        background: catalogPage * catalogPerPage >= (filteredDishes || []).length ? '#F1F5F9' : '#FFFFFF',
                        color: catalogPage * catalogPerPage >= (filteredDishes || []).length ? '#94A3B8' : '#0F172A',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: catalogPage * catalogPerPage >= (filteredDishes || []).length ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT COLUMN: ACTION PILLS (Ref: Image 2 with Lucide Icons) */}
            <aside className="crm-right-action-column">
              <button
                type="button"
                className="crm-pill-action-btn black"
                onClick={() => setIsAddProductModalOpen(true)}
              >
                <Lock size={14} />
                <span>ADD PRODUCT</span>
              </button>
              <button
                type="button"
                className="crm-pill-action-btn black"
                onClick={() => {
                  if (filteredDishes && filteredDishes.length > 0) {
                    const targetDish = filteredDishes[0];
                    setEditProductForm({
                      ...targetDish,
                      sizes: targetDish.sizes && targetDish.sizes.length > 0 ? targetDish.sizes : [{ name: 'Regular', price: targetDish.price, qty: 100 }],
                      images: targetDish.images && targetDish.images.length > 0 ? targetDish.images : (targetDish.image ? [typeof targetDish.image === 'string' ? targetDish.image : targetDish.image.url] : [])
                    });
                    setIsEditProductModalOpen(true);
                    addToast(`Editing product "${targetDish.name}". Use table Edit button to edit any product.`);
                  } else {
                    addToast('No products available to edit.');
                  }
                }}
              >
                <Edit3 size={14} />
                <span>EDIT PRODUCT</span>
              </button>
              <button
                type="button"
                className="crm-pill-action-btn outline"
                onClick={() => addToast('Bulk Upload CSV template downloaded.')}
              >
                <Upload size={14} />
                <span>BULK UPLOAD</span>
              </button>
              <button
                type="button"
                className="crm-pill-action-btn outline"
                onClick={() => addToast('Filters & Sorting applied.')}
              >
                <SlidersHorizontal size={14} />
                <span>SORT &amp; FILTER</span>
              </button>
            </aside>
          </div>
        )}

        {/* ==========================================================================
            VIEW 2.5: CATALOG THEMES & BRANDING CUSTOMIZER
            ========================================================================== */}
        {activeTab === 'catalog_themes' && (
          <div style={{ padding: '32px 42px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header Banner */}
            <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: '20px', padding: '28px 32px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.2)' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  <Sparkles size={14} color="#F59E0B" /> Storefront Theme Engine
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
                  Digital Catalog &amp; QR Menu Branding
                </h2>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px', maxWidth: '600px' }}>
                  Customize the look, colors, and header accents for your online customer menu. Changes sync instantly across all scanned QR codes and live orders.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const defaultTheme = {
                      id: 'orange',
                      name: 'Sunset Orange (Default)',
                      primary: '#FF5E14',
                      accent: '#D97706',
                      bg: '#FFF0EB',
                      gradient: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
                    };
                    setSelectedCatalogTheme(defaultTheme);
                    localStorage.setItem('foodypay_catalog_theme', JSON.stringify(defaultTheme));
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new CustomEvent('foodypay_theme_changed', { detail: defaultTheme }));
                    addToast('Reset storefront theme to Sunset Orange');
                  }}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <RefreshCw size={16} /> Reset Default
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('foodypay_catalog_theme', JSON.stringify(selectedCatalogTheme));
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new CustomEvent('foodypay_theme_changed', { detail: selectedCatalogTheme }));
                    addToast(`Theme "${selectedCatalogTheme.name}" published live!`);
                  }}
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle2 size={18} /> Publish Theme Live
                </button>
              </div>
            </div>

            {/* Grid Layout: Left Presets, Right Live Phone Mockup */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '28px', alignItems: 'start' }}>
              {/* Presets Column */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Palette size={20} color="#FF5E14" /> Select Color Theme Preset
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {[
                    {
                      id: 'orange',
                      name: 'Sunset Orange (Default)',
                      desc: 'Energetic, warm & appetizing',
                      primary: '#FF5E14',
                      accent: '#D97706',
                      bg: '#FFF0EB',
                      gradient: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
                    },
                    {
                      id: 'emerald',
                      name: 'Emerald Green (Eco Fresh)',
                      desc: 'Fresh, organic & healthy vibes',
                      primary: '#10B981',
                      accent: '#059669',
                      bg: '#ECFDF5',
                      gradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                    },
                    {
                      id: 'violet',
                      name: 'Royal Violet (Luxury Bistro)',
                      desc: 'Elegant, premium & modern dining',
                      primary: '#8B5CF6',
                      accent: '#6D28D9',
                      bg: '#F5F3FF',
                      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
                    },
                    {
                      id: 'crimson',
                      name: 'Spicy Crimson (Hot Grill)',
                      desc: 'Bold, spicy & barbecue theme',
                      primary: '#EF4444',
                      accent: '#B91C1C',
                      bg: '#FEF2F2',
                      gradient: 'linear-gradient(135deg, #EF4444 0%, #991B1B 100%)',
                    },
                    {
                      id: 'ocean',
                      name: 'Ocean Blue (Seafood & Cafe)',
                      desc: 'Cool, serene & coastal cafe',
                      primary: '#3B82F6',
                      accent: '#1D4ED8',
                      bg: '#EFF6FF',
                      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                    },
                    {
                      id: 'midnight',
                      name: 'Midnight Dark (Noir Premium)',
                      desc: 'Sleek dark mode aesthetic',
                      primary: '#1E293B',
                      accent: '#0F172A',
                      bg: '#F8FAFC',
                      gradient: 'linear-gradient(135deg, #334155 0%, #0F172A 100%)',
                    },
                    {
                      id: 'amber',
                      name: 'Golden Amber (Bakery & Treats)',
                      desc: 'Warm golden hues for desserts',
                      primary: '#F59E0B',
                      accent: '#D97706',
                      bg: '#FFFBEB',
                      gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
                    },
                    {
                      id: 'rosegold',
                      name: 'Rose Gold (Sweets & Shakes)',
                      desc: 'Chic, pink & sweet indulge',
                      primary: '#EC4899',
                      accent: '#BE185D',
                      bg: '#FDF2F8',
                      gradient: 'linear-gradient(135deg, #EC4899 0%, #9D174D 100%)',
                    },
                  ].map((theme) => {
                    const isSelected = selectedCatalogTheme.id === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          setSelectedCatalogTheme(theme);
                          localStorage.setItem('foodypay_catalog_theme', JSON.stringify(theme));
                          window.dispatchEvent(new Event('storage'));
                          window.dispatchEvent(new CustomEvent('foodypay_theme_changed', { detail: theme }));
                          addToast(`Theme preview set to ${theme.name}`);
                        }}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '16px',
                          border: isSelected ? `2.5px solid ${theme.primary}` : '1.5px solid #E2E8F0',
                          padding: '18px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? `0 8px 20px -4px ${theme.primary}33` : '0 2px 4px rgba(0,0,0,0.02)',
                          transform: isSelected ? 'translateY(-2px)' : 'none',
                        }}
                      >
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: theme.primary, color: '#FFFFFF', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={14} />
                          </div>
                        )}
                        <div style={{ height: '48px', borderRadius: '12px', background: theme.gradient, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: '13px', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                          {theme.name.split(' ')[0]} Theme
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>
                          {theme.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                          {theme.desc}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.primary, border: '2px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1' }} title="Primary Color" />
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.accent, border: '2px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1' }} title="Accent Color" />
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: theme.bg, border: '2px solid #FFFFFF', boxShadow: '0 0 0 1px #CBD5E1' }} title="Background Tint" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Mobile Phone Mockup */}
              <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', position: 'sticky', top: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><Smartphone size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Live Menu Mockup</span>
                  <span style={{ background: selectedCatalogTheme.bg, color: selectedCatalogTheme.primary, padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>{selectedCatalogTheme.id.toUpperCase()}</span>
                </div>

                {/* Smartphone Frame */}
                <div style={{ width: '100%', borderRadius: '28px', border: '8px solid #0F172A', background: '#F8FAFC', overflow: 'hidden', boxShadow: '0 12px 28px rgba(0,0,0,0.15)' }}>
                  {/* Notch */}
                  <div style={{ background: '#0F172A', height: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '4px', background: '#334155', borderRadius: '2px' }} />
                  </div>

                  {/* Header Banner Mockup */}
                  <div style={{ background: selectedCatalogTheme.gradient, padding: '16px 14px', color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFFFFF', color: selectedCatalogTheme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
                        {storeControls.restName.charAt(0) || 'F'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px' }}>{storeControls.restName || 'FoodyPay Bistro'}</div>
                        <div style={{ fontSize: '10px', opacity: 0.9 }}>📍 Table 4 • Quick Digital Order</div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content Mockup */}
                  <div style={{ padding: '12px' }}>
                    {/* Search bar mockup */}
                    <div style={{ background: '#FFFFFF', borderRadius: '10px', padding: '8px 10px', fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
                      <Search size={12} /> Search menu items...
                    </div>

                    {/* Category Tabs */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'hidden' }}>
                      <div style={{ background: selectedCatalogTheme.primary, color: '#FFFFFF', padding: '5px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ★ Best Sellers
                      </div>
                      <div style={{ background: selectedCatalogTheme.bg, color: '#475569', padding: '5px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Starter &amp; Snacks
                      </div>
                      <div style={{ background: selectedCatalogTheme.bg, color: '#475569', padding: '5px 10px', borderRadius: '14px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Beverages
                      </div>
                    </div>

                    {/* Food Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#0F172A' }}>Paneer Tikka Roll</div>
                          <div style={{ fontWeight: 800, fontSize: '12px', color: selectedCatalogTheme.primary, marginTop: '2px' }}>₹160</div>
                        </div>
                        <button type="button" style={{ background: selectedCatalogTheme.bg, border: `1.5px solid ${selectedCatalogTheme.primary}`, color: selectedCatalogTheme.primary, borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 800 }}>
                          ADD +
                        </button>
                      </div>

                      <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#0F172A' }}>Cold Coffee Float</div>
                          <div style={{ fontWeight: 800, fontSize: '12px', color: selectedCatalogTheme.primary, marginTop: '2px' }}>₹120</div>
                        </div>
                        <button type="button" style={{ background: selectedCatalogTheme.bg, border: `1.5px solid ${selectedCatalogTheme.primary}`, color: selectedCatalogTheme.primary, borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 800 }}>
                          ADD +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Navigation Mockup */}
                  <div style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '8px 12px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', color: selectedCatalogTheme.primary }}>
                      <Utensils size={14} />
                      <div style={{ fontSize: '9px', fontWeight: 700 }}>Menu</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                      <ShoppingBag size={14} />
                      <div style={{ fontSize: '9px', fontWeight: 600 }}>Cart (2)</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#94A3B8' }}>
                      <QrCode size={14} />
                      <div style={{ fontSize: '9px', fontWeight: 600 }}>Pay</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW 2.6: CATALOG COLLECTIONS & STEAL DEALS BANNER MANAGER
            ========================================================================== */}
        {activeTab === 'catalog_collections' && (
          <div style={{ padding: '32px 42px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header Banner */}
            <div style={{ background: 'linear-gradient(135deg, #FF5E14 0%, #D94400 100%)', borderRadius: '20px', padding: '28px 32px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 10px 25px -5px rgba(255,94,20,0.3)' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  <Sparkles size={14} color="#F59E0B" /> Homepage Collections Manager
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
                  Steal Deals &amp; Weekend Offers Banner
                </h2>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '14px', maxWidth: '600px' }}>
                  Turn ON/OFF the promotional Steal Deals banner on your homepage `/`, customize banner titles, add deal items, and set special prices &amp; unlock thresholds.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Large ON/OFF Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleStealDeals}
                  style={{
                    backgroundColor: stealDealsConfig.enabled !== false ? '#10B981' : '#64748B',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    fontWeight: 900,
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: stealDealsConfig.enabled !== false ? '0 4px 14px rgba(16,185,129,0.4)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {stealDealsConfig.enabled !== false ? <CheckCircle2 size={20} /> : <Lock size={20} />}
                  <span>{stealDealsConfig.enabled !== false ? 'BANNER STATUS: ON (VISIBLE)' : 'BANNER STATUS: OFF (HIDDEN)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddStealItemModalOpen(true)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#FF5E14',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                  }}
                >
                  <Plus size={18} /> + Add Deal Item
                </button>
              </div>
            </div>

            {/* Section 1: Banner Header & Subtitle Settings Form */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#FF5E14" /> Customize Banner Titles &amp; Subtitle
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Main Header Title:
                  </label>
                  <input
                    type="text"
                    value={stealDealsConfig.title || ''}
                    onChange={(e) => saveStealDealsConfig({ ...stealDealsConfig, title: e.target.value })}
                    placeholder="e.g. STEAL DEAL WEEKEND"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 700, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Badge Price (₹):
                  </label>
                  <input
                    type="text"
                    value={stealDealsConfig.badgePrice || ''}
                    onChange={(e) => saveStealDealsConfig({ ...stealDealsConfig, badgePrice: e.target.value })}
                    placeholder="e.g. 9"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 800, color: '#FF5E14', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Subtitle Tagline:
                  </label>
                  <input
                    type="text"
                    value={stealDealsConfig.subtitle || ''}
                    onChange={(e) => saveStealDealsConfig({ ...stealDealsConfig, subtitle: e.target.value })}
                    placeholder="e.g. ✦ GET ANY ONE ITEM AT SPECIAL PRICE ✦"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', fontWeight: 600, outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Steal Deal Items Collection Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={20} color="#FF5E14" /> Configured Deal Items ({(stealDealsConfig.items || []).length} Items)
                </h3>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                  Items displayed on customer homepage `/`
                </span>
              </div>

              {(stealDealsConfig.items || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#FFFFFF', borderRadius: '20px', border: '2px dashed #CBD5E1', color: '#64748B' }}>
                  <Tag size={40} color="#94A3B8" style={{ marginBottom: '12px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>No items in Steal Deals collection</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '13px' }}>Click "+ Add Deal Item" above to add products to your Steal Deal offer banner.</p>
                  <button
                    onClick={() => setIsAddStealItemModalOpen(true)}
                    style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    + Add First Deal Item
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {(stealDealsConfig.items || []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1.5px solid #E2E8F0',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        position: 'relative'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteStealItem(item.id)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 }}
                        title="Remove Item from Collection"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div style={{ width: '100%', height: '120px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F8FAFC', marginBottom: '10px' }}>
                        <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>{item.unit || '1 pc'}</span>
                          <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                            Unlocks at ₹{item.unlockAt || 199}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '6px', lineHeight: '1.3' }}>
                          {item.name}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 900, color: '#FF5E14' }}>₹{item.price}</span>
                          {item.originalPrice && (
                            <span style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>₹{item.originalPrice}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW 3: GROW / BUSINESS TELEMETRY & CUSTOMER GROUPS
            ========================================================================== */}
        {activeTab === 'grow' && (
          <div style={{ padding: '32px 42px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* 1. TELEMETRY HIGHLIGHT CARDS (Top Dish, Top Combo, AOV, Repeat Rate) */}
            <div className="crm-kpi-banner-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="crm-kpi-card" style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0' }}>
                <div>
                  <div className="crm-kpi-label" style={{ fontWeight: 700, color: '#64748B', fontSize: '12.5px' }}>MOST ORDERED DISH</div>
                  {(() => {
                    const itemCounts = {};
                    (orders || []).forEach(o => {
                      (o.items || []).forEach(it => {
                        if (!it.name) return;
                        const q = Number(it.qty) || 1;
                        const p = Number(it.price) || 0;
                        if (!itemCounts[it.name]) itemCounts[it.name] = { qty: 0, sales: 0 };
                        itemCounts[it.name].qty += q;
                        itemCounts[it.name].sales += q * p;
                      });
                    });
                    let topDishName = 'No Orders Recorded';
                    let topQty = 0;
                    let topSales = 0;
                    Object.keys(itemCounts).forEach(k => {
                      if (itemCounts[k].qty > topQty) {
                        topQty = itemCounts[k].qty;
                        topDishName = k;
                        topSales = itemCounts[k].sales;
                      }
                    });
                    return (
                      <>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{topDishName}</div>
                        <div style={{ fontSize: '12px', color: topQty > 0 ? '#059669' : '#64748B', fontWeight: 700, marginTop: '2px' }}>
                          {topQty > 0 ? ` ${topQty} Orders • ₹${topSales.toLocaleString()} Sales` : '₹0 Sales'}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="crm-kpi-icon-box" style={{ background: '#FEF3C7', color: '#D97706', width: '50px', height: '50px' }}>
                  <Utensils size={24} />
                </div>
              </div>

              <div className="crm-kpi-card" style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0' }}>
                <div>
                  <div className="crm-kpi-label" style={{ fontWeight: 700, color: '#64748B', fontSize: '12.5px' }}>BEST SELLING COMBO</div>
                  {(() => {
                    const comboCounts = {};
                    (orders || []).forEach(o => {
                      (o.items || []).forEach(it => {
                        if (!it.name || !it.name.toLowerCase().includes('combo')) return;
                        const q = Number(it.qty) || 1;
                        const p = Number(it.price) || 0;
                        if (!comboCounts[it.name]) comboCounts[it.name] = { qty: 0, sales: 0 };
                        comboCounts[it.name].qty += q;
                        comboCounts[it.name].sales += q * p;
                      });
                    });
                    let topComboName = 'No Combos Sold Yet';
                    let topQty = 0;
                    let topSales = 0;
                    Object.keys(comboCounts).forEach(k => {
                      if (comboCounts[k].qty > topQty) {
                        topQty = comboCounts[k].qty;
                        topComboName = k;
                        topSales = comboCounts[k].sales;
                      }
                    });
                    return (
                      <>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{topComboName}</div>
                        <div style={{ fontSize: '12px', color: topQty > 0 ? '#2563EB' : '#64748B', fontWeight: 700, marginTop: '2px' }}>
                          {topQty > 0 ? ` ${topQty} Combos Sold • ₹${topSales.toLocaleString()}` : '₹0 Sales'}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="crm-kpi-icon-box" style={{ background: '#EFF6FF', color: '#1D4ED8', width: '50px', height: '50px' }}>
                  <Package size={24} />
                </div>
              </div>

              <div className="crm-kpi-card" style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0' }}>
                <div>
                  <div className="crm-kpi-label" style={{ fontWeight: 700, color: '#64748B', fontSize: '12.5px' }}>AVERAGE BILL VALUE (AOV)</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>
                    ₹{orders && orders.length > 0 ? Math.round(orders.reduce((s, o) => s + (Number(o.total) || 0), 0) / orders.length) : 0} / order
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>Calculated across total live orders</div>
                </div>
                <div className="crm-kpi-icon-box" style={{ background: '#ECFDF5', color: '#059669', width: '50px', height: '50px' }}>
                  <CreditCard size={24} />
                </div>
              </div>

              <div className="crm-kpi-card" style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0' }}>
                <div>
                  <div className="crm-kpi-label" style={{ fontWeight: 700, color: '#64748B', fontSize: '12.5px' }}>CUSTOMER REPEAT RATE</div>
                  {(() => {
                    const customerMap = {};
                    (orders || []).forEach(o => {
                      const key = o.customer || o.phone;
                      if (!key) return;
                      customerMap[key] = (customerMap[key] || 0) + 1;
                    });
                    const uniqueCount = Object.keys(customerMap).length;
                    const repeatCount = Object.values(customerMap).filter(cnt => cnt > 1).length;
                    const repeatRate = uniqueCount > 0 ? ((repeatCount / uniqueCount) * 100).toFixed(1) : '0.0';
                    return (
                      <>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: '#7C3AED', marginTop: '4px' }}>{repeatRate}%</div>
                        <div style={{ fontSize: '12px', color: Number(repeatRate) > 0 ? '#7C3AED' : '#64748B', fontWeight: 700, marginTop: '2px' }}>
                          {Number(repeatRate) > 0 ? ' High Loyalty Retention' : 'No repeat orders recorded'}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="crm-kpi-icon-box" style={{ background: '#F3E8FF', color: '#7C3AED', width: '50px', height: '50px' }}>
                  <Users size={24} />
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER GROUPS & COHORTS SEGMENTATION SECTION */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '18px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={22} color="#FF5E14" />
                    <span>Customer Intelligence Groups (Smart Cohorts)</span>
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    Automated user groups created using filters: Spending Range, Days of Week (Mon-Sun), &amp; Food Categories.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-create-order-primary"
                  onClick={() => setIsAddGroupModalOpen(true)}
                >
                  <Plus size={18} />
                  <span>+ Create Customer Group</span>
                </button>
              </div>

              {/* GROUPS CARDS GRID */}
              {customerGroups && customerGroups.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {customerGroups.map((grp) => (
                    <div
                      key={grp.id}
                      style={{
                        background: '#F8FAFC',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{grp.name}</div>
                          <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>{grp.description}</div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                          {grp.memberIds ? grp.memberIds.length : 0} Members
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 700 }}>AVG BILL</span>
                          <b style={{ color: '#059669', fontSize: '14px' }}>₹{grp.avgBill || 0}</b>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '11px', fontWeight: 700 }}>FAVORITE ITEM</span>
                          <b style={{ color: '#0F172A', fontSize: '13px' }}>{grp.favoriteItem || 'N/A'}</b>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="crm-btn-secondary"
                          style={{ fontSize: '12px', padding: '7px 8px', borderRadius: '8px' }}
                          onClick={() => setActiveGroupDetail(grp)}
                        >
                          <Eye size={14} />
                          <span>View Analytics</span>
                        </button>
                        <button
                          type="button"
                          className="btn-create-order-primary"
                          style={{ fontSize: '12px', padding: '7px 8px', borderRadius: '8px' }}
                          onClick={() => {
                            setCampaignTargetGroup(grp.id);
                            setActiveTab('marketing');
                            addToast(`Switched to Marketing: Target group "${grp.name}" selected!`, <Sparkles size={16} />);
                          }}
                        >
                          <Megaphone size={14} />
                          <span>Target Offer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '36px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1.5px dashed #CBD5E1', color: '#64748B' }}>
                  <Users size={32} color="#94A3B8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>No Customer Intelligence Groups Created</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Click "+ Create Customer Group" above to add dynamic diner cohorts.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW 4: UTILITIES (Table QR Generator with 3 Themes & Custom Colors)
            ========================================================================== */}
        {activeTab === 'utilities' && (
          <div style={{ padding: '32px 42px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0' }}>
                  Contactless Table QR Generator (3 Themes &amp; Custom Colors)
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                  Customize QR codes with dynamic colors, themes, table labels, and destination URLs.
                </p>
              </div>

              <button
                type="button"
                className="btn-create-order-primary"
                onClick={() => handleOpenAddTableModal(null)}
              >
                <Plus size={18} />
                <span>+ Add Table QR</span>
              </button>
            </div>

            {/* 3-COLUMN RESPONSIVE GRID */}
            <div className="crm-tables-grid">
              {(tables || []).map((t, idx) => {
                const tableKey = t._id || t.id || `tbl_${idx}`;
                const targetUrl = getUniqueTableUrl(t.name, t.url);
                const themeLabel = t.theme === 'luxury' ? 'Luxury Gold' : t.theme === 'neon' ? 'Vibrant Neon' : 'Acrylic Clean';

                return (
                  <div key={tableKey} className="crm-table-qr-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="crm-table-card-top">
                      <div className="crm-table-title">
                        <Store size={18} color="#1D4ED8" />
                        <span>{t.name}</span>
                        <span className="crm-table-capacity-pill">{t.capacity || 4} Pax</span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: t.theme === 'luxury' ? '#FEF3C7' : t.theme === 'neon' ? '#FFEDD5' : '#E0F2FE',
                          color: t.theme === 'luxury' ? '#92400E' : t.theme === 'neon' ? '#C2410C' : '#0369A1',
                        }}
                      >
                        {themeLabel}
                      </span>
                    </div>

                    {/* REAL-TIME STANDEE PREVIEW MATCHING UI */}
                    <div
                      style={{
                        borderRadius: '20px',
                        padding: '16px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        backgroundColor: t.theme === 'luxury' ? '#0F172A' : t.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                        color: t.theme === 'luxury' ? '#F59E0B' : t.theme === 'neon' ? '#FFFFFF' : '#0F172A',
                        border: t.theme === 'luxury' ? '3px solid #F59E0B' : t.theme === 'neon' ? '3px solid #FF5E14' : '2.5px solid #0F172A',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', letterSpacing: '-0.01em' }}>
                        {storeControls.restName || "My Restaurant"}
                      </div>

                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          padding: '4px 14px',
                          borderRadius: '16px',
                          backgroundColor: t.theme === 'luxury' ? '#F59E0B' : t.theme === 'neon' ? '#FFFFFF' : '#FF5E14',
                          color: t.theme === 'luxury' ? '#0F172A' : t.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                          marginBottom: '10px',
                          letterSpacing: '0.04em',
                          boxShadow: '0 3px 10px rgba(255, 94, 20, 0.25)',
                          display: 'inline-block',
                        }}
                      >
                        {t.name || 'Table 1'}
                      </div>

                      <div
                        style={{
                          padding: '10px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '16px',
                          border: '1.5px solid #E2E8F0',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                          display: 'inline-flex',
                        }}
                      >
                        <QrCodeComponent
                          text={targetUrl}
                          size={140}
                          qrColor={t.qrColor || '#1E293B'}
                          cornerColor={t.cornerColor || '#FF5E14'}
                          showLogo={true}
                          logoUrl={t.logoUrl || storeControls.logoUrl || ''}
                          bgColor="#FFFFFF"
                        />
                      </div>

                      <div style={{ fontSize: '11px', marginTop: '10px', fontWeight: 400, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <QrCode size={13} />
                        <span>{t.purpose || 'Contactless Self Ordering'}</span>
                      </div>

                      {/* POWERED BY FOODYPAY BRANDING */}
                      <div
                        style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: t.theme === 'neon' ? '1px dashed rgba(255,255,255,0.3)' : '1px dashed #E2E8F0',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: t.theme === 'neon' ? '#FFFFFF' : '#64748B',
                        }}
                      >
                        <Sparkles size={12} color={t.theme === 'neon' ? '#FFFFFF' : '#FF5E14'} />
                        <span style={{ opacity: 0.85 }}>Powered by</span>
                        <span style={{ color: t.theme === 'neon' ? '#FFFFFF' : '#FF5E14', fontWeight: 500, fontSize: '11.5px' }}>
                          FoodyPay
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 400, wordBreak: 'break-all', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#FF5E14', textDecoration: 'underline', fontWeight: 500 }}
                        title="Click to open & test live customer menu"
                      >
                        {targetUrl} 
                      </a>
                    </div>

                    <div className="crm-table-card-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <button
                        type="button"
                        className="crm-btn-secondary"
                        onClick={() => handleOpenAddTableModal(t)}
                        style={{ fontSize: '12px', padding: '8px 6px', borderRadius: '10px' }}
                      >
                        <Edit3 size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn-create-order-primary"
                        onClick={() => setActiveStandeeTable(t)}
                        style={{ fontSize: '12px', padding: '8px 6px', borderRadius: '10px' }}
                      >
                        <Printer size={14} />
                        <span>Print</span>
                      </button>
                      <button
                        type="button"
                        className="crm-btn-secondary"
                        onClick={() => handleDeleteTable(t)}
                        style={{
                          fontSize: '12px',
                          padding: '8px 6px',
                          borderRadius: '10px',
                          color: '#EF4444',
                          borderColor: '#FECACA',
                          background: '#FEF2F2',
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW 5: MARKETING & BIRTHDAY PUSH NOTIFICATIONS
            ========================================================================== */}
        {activeTab === 'marketing' && (
          <div style={{ padding: '32px 42px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="crm-marketing-container">
            {/* 1. TODAY'S BIRTHDAY CUSTOMERS BANNER WITH CAKE ICON & AUTO-SEND TOGGLE */}
            <div className="crm-birthday-alert-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Top Controls Row: Auto-Send Switch & Edit Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #FED7AA', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={15} color="#EA580C" />
                    <span>Automatic Birthday Offer Dispatch:</span>
                  </span>

                  {/* Switch Toggle */}
                  <label className="crm-blue-switch" style={{ width: '46px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={bdayAutoSend}
                      onChange={handleToggleBdayAutoSend}
                    />
                    <span className="crm-blue-slider" style={{ borderRadius: '24px' }} />
                  </label>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '14px',
                      backgroundColor: bdayAutoSend ? '#DCFCE7' : '#F1F5F9',
                      color: bdayAutoSend ? '#15803D' : '#64748B',
                      border: bdayAutoSend ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                    }}
                  >
                    {bdayAutoSend ? ' AUTO-SEND ACTIVE' : ' AUTO-SEND OFF (Manual Trigger Only)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditBdayModalOpen(true)}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #FDBA74',
                    color: '#C2410C',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Edit3 size={14} color="#EA580C" />
                  <span>Configure Birthday Offer &amp; Message</span>
                </button>
              </div>

              {/* Main Content Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div className="crm-birthday-alert-left">
                  <Cake size={44} color="#EA580C" style={{ flexShrink: 0 }} />
                  <div>
                    <div className="crm-bday-title">
                      {birthdayCustomers.length} Customer(s) Celebrating Birthday Today{birthdayCustomers.length > 0 ? `: ${birthdayCustomers.map((c) => c.name).join(', ')}!` : '!'}
                    </div>
                    <div className="crm-bday-subtitle">
                      Greeting &amp; Offer: <b>{bdayConfig.offerDetail}</b> (Promocode: <code>{bdayConfig.couponCode}</code>)
                      <br />
                      <span style={{ fontSize: '12.5px', opacity: 0.9 }}>
                        Message: "{bdayConfig.message.replace('{name}', 'Diner').replace('{offer}', bdayConfig.offerDetail).replace('{code}', bdayConfig.couponCode).replace('{storeName}', storeControls.restName || 'FoodyPay Store')}"
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <button
                    type="button"
                    className="crm-btn-send-bday"
                    onClick={handleSendBirthdayPushNotification}
                  >
                    <Gift size={18} />
                    <span>Send Birthday Push Offer</span>
                  </button>
                  <span style={{ fontSize: '11.5px', color: '#C2410C', fontWeight: 700 }}>
                    {bdayAutoSend ? ' Auto-sending is ACTIVE' : '️ Auto-sending is OFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. TARGETED CUSTOMER GROUP CAMPAIGNS PANEL */}
            <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Megaphone size={20} color="#1D4ED8" />
                    <span>Targeted Group Campaign Execution</span>
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                    Select customer group &amp; allocate coupons (Send to All or Random N Members for experimentation).
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '3px 10px', borderRadius: '12px' }}>
                   Segment Campaign Active
                </span>
              </div>

              <form onSubmit={handleDispatchTargetedCampaign} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end' }}>
                <div className="crm-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>1. Target Customer Group *</label>
                  <select
                    className="crm-input"
                    value={campaignTargetGroup}
                    onChange={(e) => setCampaignTargetGroup(e.target.value)}
                  >
                    {(customerGroups || []).map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.name} ({grp.memberIds ? grp.memberIds.length : 3} Members)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>2. Select Coupon to Dispatch *</label>
                  <select
                    className="crm-input"
                    value={campaignCouponCode}
                    onChange={(e) => setCampaignCouponCode(e.target.value)}
                  >
                    {(coupons || []).map((cp) => (
                      <option key={cp.code} value={cp.code}>
                        {cp.code} - ({cp.discount})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="crm-form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>3. Allocation Strategy *</label>
                  <select
                    className="crm-input"
                    value={campaignDispatchMode}
                    onChange={(e) => setCampaignDispatchMode(e.target.value)}
                  >
                    <option value="all_group">Send to ALL Group Members</option>
                    <option value="random_n">Selective / Random N Members</option>
                    <option value="specific_phone">🎯 Assign to Specific Mobile Number</option>
                  </select>
                </div>

                {campaignDispatchMode === 'random_n' && (
                  <div className="crm-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Random N Members Count *</label>
                    <input
                      type="number"
                      className="crm-input"
                      placeholder="e.g. 2"
                      value={campaignRandomCount}
                      onChange={(e) => setCampaignRandomCount(e.target.value)}
                    />
                  </div>
                )}

                {campaignDispatchMode === 'specific_phone' && (
                  <div className="crm-form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Customer Mobile Number *</label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. 9876543210"
                      value={campaignTargetPhone}
                      onChange={(e) => setCampaignTargetPhone(e.target.value)}
                    />
                  </div>
                )}

                <button type="submit" className="btn-create-order-primary" style={{ height: '42px' }}>
                  <Sparkles size={16} />
                  <span>Dispatch Campaign</span>
                </button>
              </form>
            </div>

            {/* 3. ACTIVE COUPONS & PROMOCODES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '19px', fontWeight: 800, margin: '0 0 6px 0' }}>
                  Discount Coupons &amp; Promocodes
                </h3>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                  Active promocodes diners can redeem during checkout on table QR or counter.
                </p>
              </div>

              <button
                type="button"
                className="btn-create-order-primary"
                onClick={handleOpenCreateCoupon}
              >
                <Plus size={18} />
                <span>Create Coupon</span>
              </button>
            </div>

            <div className="crm-coupons-grid">
              {(coupons || []).map((coupon, idx) => {
                const daysLeft = getDaysUntilExpiry(coupon.expiryDate);
                const isExpiring = daysLeft >= 0 && daysLeft <= 5;

                return (
                  <div
                    key={coupon._id || coupon.id || coupon.code || idx}
                    className="crm-coupon-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative',
                      border: isExpiring ? '2px solid #F97316' : '1.5px solid #E2E8F0',
                      backgroundColor: isExpiring ? '#FFFBFA' : '#FFFFFF',
                    }}
                  >
                    {/* 5-DAY EARLY EXPIRY WARNING BADGE */}
                    {isExpiring && (
                      <div
                        style={{
                          background: '#FFF7ED',
                          border: '1px solid #FFEDD5',
                          color: '#C2410C',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          padding: '5px 10px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <span>⏱ EXPIRING SOON ({daysLeft === 0 ? 'Today' : `${daysLeft} days left`})</span>
                        <button
                          type="button"
                          style={{
                            background: '#EA580C',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() =>
                            addToast(
                              `Expiry Warning Reminder for ${coupon.code} sent to targeted customer group!`,
                              <Sparkles size={14} />
                            )
                          }
                        >
                          Send Warning
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="crm-coupon-code-pill">{coupon.code}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleCouponStatus(coupon)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          title="Click to toggle status"
                        >
                          <span className={coupon.status === 'Active' ? 'crm-status-badge-green' : 'crm-status-badge-red'}>
                            ● {coupon.status || 'Active'}
                          </span>
                        </button>

                        {/* ASSIGN MOBILE BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCouponForAssignModal(coupon);
                            setAssignMobileInput(coupon.assignedCustomerPhone || coupon.targetPhone || '');
                            setIsAssignMobileModalOpen(true);
                          }}
                          title="Assign to Specific Customer Mobile Number"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #FFEDD5',
                            background: '#FFF7ED',
                            color: '#FF5E14',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Phone size={13} color="#FF5E14" />
                          <span>Assign Mobile</span>
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleEditCoupon(coupon)}
                          title="Edit Promocode"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Edit3 size={13} color="#2563EB" />
                          <span>Edit</span>
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon)}
                          title="Delete Promocode"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Trash2 size={13} color="#DC2626" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A' }}>
                      {coupon.discount}
                    </div>

                    {(coupon.assignedCustomerPhone || coupon.targetPhone) ? (
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#C2410C', background: '#FFF7ED', border: '1px solid #FFEDD5', padding: '3px 8px', borderRadius: '6px', width: 'fit-content', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} color="#FF5E14" />
                        <span>Assigned Mobile: {coupon.assignedCustomerPhone || coupon.targetPhone} {coupon.assignedCustomerName ? `(${coupon.assignedCustomerName})` : ''}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#15803D', background: '#DCFCE7', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                        ● Available to All Diners
                      </div>
                    )}

                    <div style={{ fontSize: '12.5px', color: isExpiring ? '#EA580C' : '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      <span>{formatExpiryDisplay(coupon.expiryDate)}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B', borderTop: '1px dashed #E2E8F0', paddingTop: '8px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Min. Order: <b>₹{coupon.minOrder || 0}</b></span>
                      <span>Redeemed: <b>{coupon.uses || 0} times</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW: DATABASE-DRIVEN DELIVERY ZONES & STORE MANAGEMENT
            ========================================================================== */}
        {activeTab === 'delivery_zones' && (
          <div style={{ padding: '32px 42px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)', borderRadius: '20px', padding: '28px 32px', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 10px 25px -5px rgba(30,64,175,0.3)' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  <Truck size={14} color="#93C5FD" /> Multi-Zone Marketplace System
                </div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
                  Delivery Zones &amp; Store Management
                </h2>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '14px', maxWidth: '680px' }}>
                  100% Database-Driven Location Engine. Add unlimited sectors, areas, cities, and stores, set store delivery radii, and assign store access by owner email. ZERO hardcoded sectors!
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingZoneObj(null);
                    setZoneForm({ name: '', city: 'Mohali', state: 'Punjab', pincode: '', centerLatitude: 30.7046, centerLongitude: 76.7179, radius: 5, isActive: true });
                    setIsAddZoneModalOpen(true);
                  }}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#1E40AF',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                  }}
                >
                  <Plus size={18} /> + Add Delivery Zone
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingStoreObj(null);
                    setStoreForm({ name: '', ownerName: '', ownerEmail: '', gstNumber: '', licenseNumber: '', address: '', city: 'Mohali', state: 'Punjab', pincode: '', latitude: 30.7046, longitude: 76.7179, deliveryRadius: 5, isActive: true });
                    setIsAddStoreModalOpen(true);
                  }}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                  }}
                >
                  <Store size={18} /> + Register New Store
                </button>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E2E8F0', paddingBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setDeliverySubTab('zones')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: deliverySubTab === 'zones' ? '#1E40AF' : '#F1F5F9',
                  color: deliverySubTab === 'zones' ? '#FFFFFF' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                📍 Delivery Zones ({(deliveryZones || []).length})
              </button>

              <button
                type="button"
                onClick={() => setDeliverySubTab('stores')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: deliverySubTab === 'stores' ? '#1E40AF' : '#F1F5F9',
                  color: deliverySubTab === 'stores' ? '#FFFFFF' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                🏪 Stores &amp; Owner Access ({(storesList || []).length})
              </button>
            </div>

            {/* TAB 1: DELIVERY ZONES LIST */}
            {deliverySubTab === 'zones' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                    Active Database Delivery Zones
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                    Each zone defines dynamic GPS center coordinates &amp; coverage radius (KM)
                  </span>
                </div>

                {(deliveryZones || []).length === 0 ? (
                  <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1.5px solid #E2E8F0', textAlign: 'center' }}>
                    <MapPin size={40} color="#94A3B8" style={{ marginBottom: '12px' }} />
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#334155' }}>No Delivery Zones Created Yet</h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>Click "+ Add Delivery Zone" to create dynamic sector or area coverage zones.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {deliveryZones.map((zone) => (
                      <div key={zone._id || zone.zoneId} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#3B82F6', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                              {zone.zoneId || 'ZONE'}
                            </span>
                            <h4 style={{ margin: '6px 0 2px', fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>{zone.name}</h4>
                            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>📍 {zone.city}{zone.state ? `, ${zone.state}` : ''} {zone.pincode ? `(${zone.pincode})` : ''}</div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', background: zone.isActive !== false ? '#DCFCE7' : '#FEF2F2', color: zone.isActive !== false ? '#15803D' : '#DC2626' }}>
                            {zone.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div><b>Center GPS:</b> {zone.centerLatitude?.toFixed(4)}, {zone.centerLongitude?.toFixed(4)}</div>
                          <div><b>Coverage Radius:</b> {zone.radius} KM</div>
                          <div><b>Assigned Stores:</b> {zone.assignedStoresCount !== undefined ? zone.assignedStoresCount : 0}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingZoneObj(zone);
                              setZoneForm({
                                name: zone.name || '',
                                city: zone.city || 'Mohali',
                                state: zone.state || 'Punjab',
                                pincode: zone.pincode || '',
                                centerLatitude: zone.centerLatitude || 30.7046,
                                centerLongitude: zone.centerLongitude || 76.7179,
                                radius: zone.radius || 5,
                                isActive: zone.isActive !== false,
                              });
                              setIsAddZoneModalOpen(true);
                            }}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Edit3 size={14} /> Edit Zone
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete zone "${zone.name}"?`)) {
                                try {
                                  await deleteDeliveryZoneApi(zone._id || zone.zoneId);
                                  addToast(`Zone "${zone.name}" deleted successfully.`);
                                  loadDeliveryAndStoresData();
                                } catch (err) {
                                  addToast(`Error deleting zone: ${err.message}`);
                                }
                              }
                            }}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STORES LIST & OWNER EMAIL ASSIGNMENT */}
            {deliverySubTab === 'stores' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                    Registered Marketplace Stores &amp; Owner Access
                  </h3>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                    Assign stores to delivery zones &amp; bind owner email address for merchant portal access
                  </span>
                </div>

                {(storesList || []).length === 0 ? (
                  <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1.5px solid #E2E8F0', textAlign: 'center' }}>
                    <Store size={40} color="#94A3B8" style={{ marginBottom: '12px' }} />
                    <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#334155' }}>No Stores Registered Yet</h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>Click "+ Register New Store" to add a store location and map it to delivery zones.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                    {storesList.map((store) => (
                      <div key={store._id || store.storeId} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', padding: '2px 8px', borderRadius: '6px' }}>
                              {store.storeId || 'STORE'}
                            </span>
                            <h4 style={{ margin: '6px 0 2px', fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{store.name}</h4>
                            <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>📍 {store.address}, {store.city}</div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', background: store.isActive !== false ? '#DCFCE7' : '#FEF2F2', color: store.isActive !== false ? '#15803D' : '#DC2626' }}>
                            {store.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>

                        <div style={{ background: '#EFF6FF', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px', color: '#1E40AF' }}>
                          <b>📧 Owner Email Access:</b> <span style={{ fontWeight: 800, textDecoration: 'underline' }}>{store.ownerEmail || 'Not Assigned'}</span>
                          {store.ownerName ? ` (${store.ownerName})` : ''}
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <div><b>Store GPS:</b> {store.latitude?.toFixed(4)}, {store.longitude?.toFixed(4)}</div>
                          <div><b>Delivery Radius:</b> {store.deliveryRadius} KM</div>
                          <div><b>GST No:</b> {store.gstNumber || 'N/A'}</div>
                          <div><b>License:</b> {store.licenseNumber || 'N/A'}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>Assigned Delivery Zones:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Array.isArray(store.deliveryZones) && store.deliveryZones.length > 0 ? (
                              store.deliveryZones.map((z) => (
                                <span key={z._id || z.name} style={{ background: '#DBEAFE', color: '#1E40AF', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800 }}>
                                  📍 {z.name} ({z.city})
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>No zones assigned yet</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStoreForZones(store);
                              setSelectedZoneIdsForStore(Array.isArray(store.deliveryZones) ? store.deliveryZones.map((z) => z._id) : []);
                              setIsAssignStoreZonesModalOpen(true);
                            }}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #93C5FD', background: '#EFF6FF', color: '#1E40AF', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          >
                            <MapPin size={14} /> Assign Zones
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStoreForOwner(store);
                              setAssignOwnerEmailInput(store.ownerEmail || '');
                              setIsAssignOwnerEmailModalOpen(true);
                            }}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FDBA74', background: '#FFF7ED', color: '#C2410C', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          >
                            <User size={14} /> Assign Owner Email
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStoreObj(store);
                              setStoreForm({
                                name: store.name || '',
                                ownerName: store.ownerName || '',
                                ownerEmail: store.ownerEmail || '',
                                gstNumber: store.gstNumber || '',
                                licenseNumber: store.licenseNumber || '',
                                address: store.address || '',
                                city: store.city || 'Mohali',
                                state: store.state || 'Punjab',
                                pincode: store.pincode || '',
                                latitude: store.latitude || 30.7046,
                                longitude: store.longitude || 76.7179,
                                deliveryRadius: store.deliveryRadius || 5,
                                isActive: store.isActive !== false,
                              });
                              setIsAddStoreModalOpen(true);
                            }}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Edit3 size={14} /> Edit Details
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete store "${store.name}"?`)) {
                                try {
                                  await deleteStoreApi(store._id || store.storeId);
                                  addToast(`Store "${store.name}" deleted successfully.`);
                                  loadDeliveryAndStoresData();
                                } catch (err) {
                                  addToast(`Error deleting store: ${err.message}`);
                                }
                              }
                            }}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================================================
            VIEW 6: CUSTOMERS CRM (Ref: Image 4 with Lucide Icons)
            ========================================================================== */}
        {activeTab === 'customers' && (
          <div className="crm-customers-container">
            <div className="crm-customers-stats-banner">
              <div className="crm-cust-stat-item">
                <span className="crm-cust-stat-label">Total Customers</span>
                <span className="crm-cust-stat-value">{(customers || []).length}</span>
              </div>
              <div className="crm-cust-stat-item">
                <span className="crm-cust-stat-label">Total Orders</span>
                <span className="crm-cust-stat-value">{(customers || []).reduce((s, c) => s + (c.ordersCount || 0), 0)}</span>
              </div>
              <div className="crm-cust-stat-item">
                <span className="crm-cust-stat-label">Total Sales</span>
                <span className="crm-cust-stat-value">₹{(customers || []).reduce((s, c) => s + (c.totalSales || 0), 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="crm-cust-toolbar">
              <div className="crm-search-box">
                <Search size={17} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search by Name/Mobile..."
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-create-order-primary"
                  onClick={() => {
                    setNotifyAudienceMode('all_users');
                    setIsCustomNotifyModalOpen(true);
                  }}
                >
                  <Bell size={16} />
                  <span>Send Notification Broadcast</span>
                </button>
              </div>
            </div>

            <table className="crm-cust-table">
              <thead>
                <tr>
                  <th>Contact | Customer Name</th>
                  <th>Orders</th>
                  <th>Sale</th>
                  <th>Birthday</th>
                  <th>Last Ordered / Actions</th>
                </tr>
              </thead>
              <tbody>
                {((customers || []).filter((c) => {
                  if (!c) return false;
                  const q = (custSearch || '').toLowerCase();
                  return (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
                })).map((c, idx) => (
                  <tr key={c._id || c.id || idx}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{c.phone}</div>
                    </td>
                    <td>
                      <b>{c.ordersCount || 1}</b>
                    </td>
                    <td>
                      <b style={{ color: '#1D4ED8' }}>₹{(c.totalSales || 0).toLocaleString()}</b>
                    </td>
                    <td>
                      {c.isBirthdayToday ? (
                        <span className="crm-bday-tag">
                          <Gift size={13} />
                          <span>Birthday Today!</span>
                        </span>
                      ) : (
                        <span style={{ color: '#64748B' }}>{c.birthday || 'Not Set'}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                          {c.lastOrdered || 'Recently'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenCreateCoupon(c)}
                            style={{
                              background: '#FFF7ED',
                              border: '1px solid #FFEDD5',
                              color: '#FF5E14',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={`Assign Personal Coupon to ${c.name} (${c.phone})`}
                          >
                            <Tag size={13} color="#FF5E14" />
                            <span>Assign Coupon</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustId(c.id || c._id);
                              setNotifyAudienceMode('specific_user');
                              setNotifyTitle(` Special Personal Offer for ${c.name}`);
                              setNotifyMessage(`Hi ${c.name}! We have an exclusive offer for you at ${storeControls.restName || 'our store'}. Use code FEST20 for 20% OFF!`);
                              setIsCustomNotifyModalOpen(true);
                            }}
                            style={{
                              background: '#EFF6FF',
                              border: '1px solid #BFDBFE',
                              color: '#1D4ED8',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title={`Send Personal Notification to ${c.name}`}
                          >
                            <Bell size={13} />
                            <span>Notify</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==========================================================================
            VIEW 7: STORE CONTROLS (Ref: Image 5)
            ========================================================================== */}
        {/* ==========================================================================
            VIEW 7: STORE CONTROLS & SECURITY LOCKS
            ========================================================================== */}
        {activeTab === 'store_controls' && (
          <div className="crm-store-controls-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
            {/* Store Operations & Status */}
            <div className="crm-control-section-card">
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={20} color="#1D4ED8" /> Store Operations & Status
              </div>

              {/* Store status */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Store Outlet Status</span>
                  <span className={storeControls.storeStatus ? 'crm-status-badge-green' : 'crm-status-badge-gray'}>
                    {storeControls.storeStatus ? ' Open for Orders' : ' Closed'}
                  </span>
                </div>
                <label className="crm-blue-switch">
                  <input
                    type="checkbox"
                    checked={storeControls.storeStatus}
                    onChange={() => {
                      const next = !storeControls.storeStatus;
                      setStoreControls((prev) => ({ ...prev, storeStatus: next }));
                      addToast(`Restaurant Outlet is now ${next ? 'OPEN' : 'CLOSED'}`);
                    }}
                  />
                  <span className="crm-blue-slider" />
                </label>
              </div>

              {/* Direct Delivery status */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Direct Delivery Status</span>
                  <span className={storeControls.deliveryStatus ? 'crm-status-badge-green' : 'crm-status-badge-gray'}>
                    {storeControls.deliveryStatus ? ' Accepting Delivery' : ' Delivery Off'}
                  </span>
                </div>
                <label className="crm-blue-switch">
                  <input
                    type="checkbox"
                    checked={storeControls.deliveryStatus}
                    onChange={() => {
                      const next = !storeControls.deliveryStatus;
                      setStoreControls((prev) => ({ ...prev, deliveryStatus: next }));
                      addToast(`Direct Delivery orders are now ${next ? 'OPEN' : 'CLOSED'}`);
                    }}
                  />
                  <span className="crm-blue-slider" />
                </label>
              </div>

              {/* Takeaway / Pickup status */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Takeaway & Pickup Counter</span>
                  <span className={storeControls.pickupStatus ? 'crm-status-badge-green' : 'crm-status-badge-gray'}>
                    {storeControls.pickupStatus ? ' Accepting Pickup' : ' Pickup Off'}
                  </span>
                </div>
                <label className="crm-blue-switch">
                  <input
                    type="checkbox"
                    checked={storeControls.pickupStatus}
                    onChange={() => {
                      const next = !storeControls.pickupStatus;
                      setStoreControls((prev) => ({ ...prev, pickupStatus: next }));
                      addToast(`Takeaway / Pickup counter is now ${next ? 'OPEN' : 'CLOSED'}`);
                    }}
                  />
                  <span className="crm-blue-slider" />
                </label>
              </div>

              {/* Kitchen Display System (KDS) status toggle */}
              <div className="crm-control-row" style={{ paddingTop: '12px', borderTop: '1px dashed #E2E8F0' }}>
                <div className="crm-control-name-status">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="crm-control-label">Kitchen Display System (KDS)</span>
                    <span className={storeControls.kdsEnabled !== false ? 'crm-status-badge-green' : 'crm-status-badge-gray'}>
                      {storeControls.kdsEnabled !== false ? ' KDS Active (ON)' : ' KDS Disabled (OFF)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px' }}>
                    URL: <code>https://foodypay.in/{(storeControls.restName || 'thefoodypay').toLowerCase().replace(/\s+/g, '-')}/{storeControls.foodypayId || 'FP-790044'}/KitchenDisplaySystem</code>
                  </div>
                </div>
                <label className="crm-blue-switch">
                  <input
                    type="checkbox"
                    checked={storeControls.kdsEnabled !== false}
                    onChange={() => {
                      const next = !(storeControls.kdsEnabled !== false);
                      setStoreControls((prev) => ({ ...prev, kdsEnabled: next }));
                      try {
                        localStorage.setItem('foodypay_kds_enabled', JSON.stringify(next));
                        window.dispatchEvent(new Event('storage'));
                      } catch (e) {}
                      addToast(`Kitchen Display System (KDS) is now ${next ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`);
                    }}
                  />
                  <span className="crm-blue-slider" />
                </label>
              </div>
            </div>

            {/* Order Status Stepper & Delivery Workflow Settings */}
            <div className="crm-control-section-card">
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#F59E0B" /> Order Status Workflow & Stepper Settings (Dine-In vs Delivery)
              </div>
              <div style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '14px' }}>
                Customize how order status steps (Placed ➔ Kitchen ➔ Delivery Ke Liye Nikala ➔ Delivered) appear on order cards & delivery screens.
              </div>

              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>WORKFLOW MODE</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {[
                      { id: 'auto', label: '⚡ Auto Dynamic (Dine-In: Placed ➔ Kitchen ➔ Ready ➔ Served | Delivery: Placed ➔ Kitchen ➔ Out for Delivery ➔ Delivered)' },
                      { id: 'dine_in', label: '🍽️ Dine-In Mode (Placed ➔ Kitchen ➔ Ready ➔ Served)' },
                      { id: 'delivery', label: '🚀 Delivery & Store Mode (Placed ➔ Kitchen ➔ Out for Delivery ➔ Delivered)' },
                    ].map((mode) => (
                      <label
                        key={mode.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: (storeControls.workflowMode || 'auto') === mode.id ? '2px solid #2563EB' : '1px solid #CBD5E1',
                          background: (storeControls.workflowMode || 'auto') === mode.id ? '#EFF6FF' : '#FFFFFF',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: (storeControls.workflowMode || 'auto') === mode.id ? '#1E40AF' : '#334155',
                          flex: '1 1 250px',
                        }}
                      >
                        <input
                          type="radio"
                          name="workflowMode"
                          value={mode.id}
                          checked={(storeControls.workflowMode || 'auto') === mode.id}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStoreControls((prev) => ({ ...prev, workflowMode: val }));
                            localStorage.setItem('foodypay_workflow_mode', val);
                            addToast(`Order Workflow Mode set to: ${val.toUpperCase()}`);
                          }}
                        />
                        {mode.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Order Status Stepper Step Names Customizer */}
                <div style={{ paddingTop: '12px', borderTop: '1px dashed #CBD5E1' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SlidersHorizontal size={16} color="#FF5E14" /> Customize Status Step Names (Placed ➔ Kitchen ➔ Delivery ➔ Served)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '3px' }}>Step 1 Name (New)</label>
                      <input
                        type="text"
                        placeholder="Placed"
                        value={statusStepLabels.step1}
                        onChange={(e) => setStatusStepLabels({ ...statusStepLabels, step1: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '3px' }}>Step 2 Name (Preparing)</label>
                      <input
                        type="text"
                        placeholder="Kitchen"
                        value={statusStepLabels.step2}
                        onChange={(e) => setStatusStepLabels({ ...statusStepLabels, step2: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '3px' }}>Step 3 Name (Ready/Transit)</label>
                      <input
                        type="text"
                        placeholder="Out for Delivery / Ready"
                        value={statusStepLabels.step3}
                        onChange={(e) => setStatusStepLabels({ ...statusStepLabels, step3: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '3px' }}>Step 4 Name (Final)</label>
                      <input
                        type="text"
                        placeholder="Delivered / Served"
                        value={statusStepLabels.step4}
                        onChange={(e) => setStatusStepLabels({ ...statusStepLabels, step4: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      saveStatusStepLabels(statusStepLabels);
                      addToast('Saved Custom Status Step Names!', <CheckCircle2 size={16} color="#10B981" />);
                    }}
                    style={{ background: '#1D4ED8', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save Step Names
                  </button>
                </div>

                {/* Delivery Partner Screen Quick Link Button (Hidden if feature is LOCKED) */}
                {!isDeliveryPartnerLocked && (
                  <div style={{ paddingTop: '12px', borderTop: '1px dashed #CBD5E1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        🚚 Delivery Partner Portal Link
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                        URL: <code>https://foodypay.in/{(storeControls.restName || 'thefoodypay').toLowerCase().replace(/\s+/g, '-')}/{storeControls.foodypayId || 'FP-790044'}/delivery-partner</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        style={{ padding: '8px 14px', borderRadius: '8px', background: '#F59E0B', color: '#000', border: 'none', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          const slug = (storeControls.restName || 'thefoodypay').toLowerCase().replace(/\s+/g, '-');
                          const mid = storeControls.foodypayId || 'FP-790044';
                          window.open(`/${slug}/${mid}/delivery-partner`, '_blank');
                        }}
                      >
                        <Truck size={15} /> Open Delivery View
                      </button>
                      <button
                        type="button"
                        style={{ padding: '8px 14px', borderRadius: '8px', background: '#0F172A', color: '#FFF', border: 'none', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => {
                          const slug = (storeControls.restName || 'thefoodypay').toLowerCase().replace(/\s+/g, '-');
                          const mid = storeControls.foodypayId || 'FP-790044';
                          navigator.clipboard.writeText(`${window.location.origin}/${slug}/${mid}/delivery-partner`);
                          addToast('Copied Delivery Partner View URL to clipboard!');
                        }}
                      >
                        <Copy size={15} /> Copy URL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Taxation & GST Rate Setup */}
            <div className="crm-control-section-card">
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={20} color="#16A34A" /> Taxation & GST Tax Rate Setup
              </div>
              <div style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '14px' }}>
                Set up automated GST tax calculation applied at checkout for all digital QR & counter orders.
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px' }}>CURRENT ACTIVE GST RATE</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    {storeControls.gstPercent || 5}% <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>F&B Compliant</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[5, 12, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: (storeControls.gstPercent || 5) === rate ? '2px solid #16A34A' : '1px solid #CBD5E1',
                        background: (storeControls.gstPercent || 5) === rate ? '#DCFCE7' : '#FFFFFF',
                        color: (storeControls.gstPercent || 5) === rate ? '#15803D' : '#334155',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => {
                        setStoreControls((prev) => ({ ...prev, gstPercent: rate }));
                        addToast(`GST Tax Rate updated to ${rate}%!`, <Percent size={18} />);
                      }}
                    >
                      {rate}% {rate === 5 ? '(Standard)' : rate === 12 ? '(AC Dining)' : '(Luxury)'}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={storeControls.gstPercent !== undefined ? storeControls.gstPercent : 5}
                    onChange={(e) => setStoreControls((prev) => ({ ...prev, gstPercent: Math.max(0, Math.min(40, Number(e.target.value) || 0)) }))}
                    style={{ width: '70px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontWeight: 800, fontSize: '14px', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>%</span>
                  <button
                    type="button"
                    style={{ padding: '8px 14px', borderRadius: '8px', background: '#0F172A', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => addToast(`Saved Custom GST Rate: ${storeControls.gstPercent || 0}%`, <Check size={16} />)}
                  >
                    Save Rate
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Slate & Reset Data Card */}
            <div className="crm-control-section-card" style={{ border: '1.5px solid #FECACA', background: '#FFF5F5' }}>
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626' }}>
                <Trash2 size={20} color="#DC2626" /> Clean Slate Database Reset
              </div>
              <div style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '14px' }}>
                Wipe all sample mock data (sample orders, sample reviews, sample meal combos, sample customers). Database will start completely 100% fresh for new orders!
              </div>

              <button
                type="button"
                onClick={handleClearAllSampleData}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={16} />
                <span> Clear All Sample Data &amp; Reset Fresh</span>
              </button>
            </div>

            {/* Security & Permission Locks */}
            <div className="crm-control-section-card">
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} color="#DC2626" /> Security & Permission Locks
              </div>
              <div style={{ fontSize: '13.5px', color: '#64748B', marginBottom: '14px' }}>
                Lock down critical store modules to prevent unauthorized staff operations, coupon tampering, or table QR deletion.
              </div>

              {/* Lock Marketing & Coupon Builder */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Lock Marketing & Promocode Builder</span>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                    Freeze creation, edit, and deletion of discount codes and campaign broadcasts.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={storeControls.lockMarketingTab ? 'crm-status-badge-gray' : 'crm-status-badge-green'} style={{ color: storeControls.lockMarketingTab ? '#DC2626' : '#16A34A', background: storeControls.lockMarketingTab ? '#FEE2E2' : '#DCFCE7', fontWeight: 700 }}>
                    {storeControls.lockMarketingTab ? ' Locked' : ' Active'}
                  </span>
                  <label className="crm-blue-switch">
                    <input
                      type="checkbox"
                      checked={storeControls.lockMarketingTab}
                      onChange={() => {
                        const next = !storeControls.lockMarketingTab;
                        setStoreControls((prev) => ({ ...prev, lockMarketingTab: next }));
                        addToast(next ? ' Marketing & Promocode Engine LOCKED!' : ' Marketing Engine UNLOCKED!', <Lock size={18} />);
                      }}
                    />
                    <span className="crm-blue-slider" />
                  </label>
                </div>
              </div>

              {/* Lock Table QR Standees CRUD */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Lock Table QR Code CRUD Operations</span>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                    Prevent staff from adding, editing, or deleting active table QR standees.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={storeControls.lockTableCrud ? 'crm-status-badge-gray' : 'crm-status-badge-green'} style={{ color: storeControls.lockTableCrud ? '#DC2626' : '#16A34A', background: storeControls.lockTableCrud ? '#FEE2E2' : '#DCFCE7', fontWeight: 700 }}>
                    {storeControls.lockTableCrud ? ' Locked' : ' Active'}
                  </span>
                  <label className="crm-blue-switch">
                    <input
                      type="checkbox"
                      checked={storeControls.lockTableCrud}
                      onChange={() => {
                        const next = !storeControls.lockTableCrud;
                        setStoreControls((prev) => ({ ...prev, lockTableCrud: next }));
                        addToast(next ? ' Table QR Modifications LOCKED!' : ' Table QR Operations UNLOCKED!', <Lock size={18} />);
                      }}
                    />
                    <span className="crm-blue-slider" />
                  </label>
                </div>
              </div>

              {/* Lock Order Deletion & Voiding */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Lock Order Deletion & Voiding</span>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                    Disable cashier ability to delete, erase, or void placed customer orders.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={storeControls.lockOrderDeletion ? 'crm-status-badge-gray' : 'crm-status-badge-green'} style={{ color: storeControls.lockOrderDeletion ? '#DC2626' : '#16A34A', background: storeControls.lockOrderDeletion ? '#FEE2E2' : '#DCFCE7', fontWeight: 700 }}>
                    {storeControls.lockOrderDeletion ? ' Locked' : ' Active'}
                  </span>
                  <label className="crm-blue-switch">
                    <input
                      type="checkbox"
                      checked={storeControls.lockOrderDeletion}
                      onChange={() => {
                        const next = !storeControls.lockOrderDeletion;
                        setStoreControls((prev) => ({ ...prev, lockOrderDeletion: next }));
                        addToast(next ? ' Order Deletion & Voiding LOCKED!' : ' Order Deletion UNLOCKED!', <Lock size={18} />);
                      }}
                    />
                    <span className="crm-blue-slider" />
                  </label>
                </div>
              </div>

              {/* Lock Store Settings Panel */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Lock Store Settings Panel</span>
                  <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                    Protect store controls, UPI configuration, and business details with password lock.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={storeControls.lockSettingsPanel ? 'crm-status-badge-gray' : 'crm-status-badge-green'} style={{ color: storeControls.lockSettingsPanel ? '#DC2626' : '#16A34A', background: storeControls.lockSettingsPanel ? '#FEE2E2' : '#DCFCE7', fontWeight: 700 }}>
                    {storeControls.lockSettingsPanel ? ' Locked' : ' Active'}
                  </span>
                  <label className="crm-blue-switch">
                    <input
                      type="checkbox"
                      checked={storeControls.lockSettingsPanel}
                      onChange={() => {
                        const next = !storeControls.lockSettingsPanel;
                        setStoreControls((prev) => ({ ...prev, lockSettingsPanel: next }));
                        addToast(next ? ' Store Settings Panel LOCKED!' : ' Store Settings UNLOCKED!', <Lock size={18} />);
                      }}
                    />
                    <span className="crm-blue-slider" />
                  </label>
                </div>
              </div>
            </div>

            {/* Store Profile & Configuration */}
            <div className="crm-control-section-card">
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={20} color="#6366F1" /> Store Profile & Merchant Credentials
              </div>

              {/* Store Logo Config Row */}
              <div className="crm-control-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {storeControls.logoUrl && !logoImgFailed ? (
                    <img
                      src={storeControls.logoUrl}
                      alt="Store Logo"
                      style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                      onError={() => setLogoImgFailed(true)}
                    />
                  ) : (
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '18px',
                      }}
                    >
                      <Utensils size={22} color="#FFFFFF" />
                    </div>
                  )}

                  <div>
                    <div className="crm-control-label">Restaurant Brand Logo</div>
                    <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                      {storeControls.logoUrl && !logoImgFailed ? 'Custom logo active' : 'Default vibrant logo badge active'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Paste Logo Image URL..."
                    value={storeControls.logoUrl || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setLogoImgFailed(false);
                      setStoreControls((prev) => ({ ...prev, logoUrl: url }));
                    }}
                    style={{ width: '220px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                  />
                  <button
                    type="button"
                    style={{ padding: '7px 14px', borderRadius: '8px', background: '#1D4ED8', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                    onClick={() => {
                      addToast('Saved Store Brand Logo!', <Check size={16} />);
                    }}
                  >
                    Save Logo
                  </button>
                </div>
              </div>

              <div className="crm-control-row">
                <div>
                  <div className="crm-control-label">FoodyPay Merchant ID</div>
                  <div style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700 }}>{storeControls.foodypayId}</div>
                </div>
                <span className="crm-status-badge-green">Verified Merchant</span>
              </div>

              <div className="crm-control-row">
                <div>
                  <div className="crm-control-label">Restaurant Business Name</div>
                  <div style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700 }}>{storeControls.restName}</div>
                </div>
                <button
                  type="button"
                  style={{ color: '#1D4ED8', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => addToast('Store details saved in FoodyPay Profile!')}
                >
                  Edit Name
                </button>
              </div>

              <div className="crm-control-row">
                <div>
                  <div className="crm-control-label">Store Type</div>
                  <div style={{ fontSize: '13.5px', color: '#64748B' }}>{storeControls.storeType}</div>
                </div>
                <button
                  type="button"
                  style={{ color: '#1D4ED8', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => addToast('Store Type is B2C (Business to Customer)')}
                >
                  Change
                </button>
              </div>

              <div className="crm-control-row">
                <div>
                  <div className="crm-control-label">UPI Receiver Virtual Address</div>
                  <div style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 700 }}>{storeControls.upiId}</div>
                </div>
                <button
                  type="button"
                  style={{ color: '#1D4ED8', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => addToast('UPI Receiver ID linked with ICICI Bank settlement account!')}
                >
                  Edit UPI
                </button>
              </div>
            </div>

            {/* Payment Routing & Razorpay Gateway Section */}
            <div className="crm-control-section-card" style={{ marginTop: '20px' }}>
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#10B981" /> Payment Gateway & Routing Controls
              </div>

              <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                Select how customer order payments are collected and routed at checkout.
              </div>

              {/* 3 Routing Modes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {/* Mode 1: FoodyPay Gateway (Default) */}
                <div
                  onClick={() => setStoreControls((prev) => ({ ...prev, paymentRoutingMode: 'foodypay_default' }))}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: storeControls.paymentRoutingMode === 'foodypay_default' ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                    backgroundColor: storeControls.paymentRoutingMode === 'foodypay_default' ? '#FFF0EB' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span> FoodyPay Gateway (Default)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
                    Zero-config instant Razorpay payment collection via FoodyPay default gateway.
                  </div>
                </div>

                {/* Mode 2: Merchant Own Razorpay */}
                <div
                  onClick={() => setStoreControls((prev) => ({ ...prev, paymentRoutingMode: 'merchant_razorpay' }))}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: storeControls.paymentRoutingMode === 'merchant_razorpay' ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                    backgroundColor: storeControls.paymentRoutingMode === 'merchant_razorpay' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span> Merchant Own Razorpay</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
                    Directly collect funds into your own Razorpay merchant account using API keys.
                  </div>
                </div>

                {/* Mode 3: Direct Merchant UPI QR */}
                <div
                  onClick={() => setStoreControls((prev) => ({ ...prev, paymentRoutingMode: 'merchant_upi' }))}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: storeControls.paymentRoutingMode === 'merchant_upi' ? '2px solid #10B981' : '1px solid #CBD5E1',
                    backgroundColor: storeControls.paymentRoutingMode === 'merchant_upi' ? '#ECFDF5' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span> Direct Merchant UPI QR</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
                    Diners scan your store's direct UPI QR code (`upiId`) to send payments.
                  </div>
                </div>
              </div>

              {/* Input fields based on selected mode */}
              {storeControls.paymentRoutingMode === 'merchant_razorpay' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      placeholder="rzp_live_xxxxxxxxxxxx"
                      value={storeControls.razorpayKeyId || ''}
                      onChange={(e) => setStoreControls((prev) => ({ ...prev, razorpayKeyId: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                      Razorpay Key Secret
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={storeControls.razorpayKeySecret || ''}
                      onChange={(e) => setStoreControls((prev) => ({ ...prev, razorpayKeySecret: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              {storeControls.paymentRoutingMode === 'merchant_upi' && (
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Direct Merchant UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    placeholder="merchant@icici"
                    value={storeControls.upiId || ''}
                    onChange={(e) => setStoreControls((prev) => ({ ...prev, upiId: e.target.value }))}
                    style={{ width: '100%', maxWidth: '360px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={async () => {
                  try {
                    const rzpKey = storeControls.razorpayKeyId || 'rzp_live_TjBEt4gu2aUflB';
                    const rzpSec = storeControls.razorpayKeySecret || 'FPXDLXe3Vbh0NYSpCAXmXOA3';
                    const mode = storeControls.paymentRoutingMode || 'foodypay_default';
                    const upi = storeControls.upiId || 'merchant@icici';

                    localStorage.setItem('foodypay_payment_routing_mode', mode);
                    localStorage.setItem('foodypay_rzp_key_id', rzpKey);
                    localStorage.setItem('foodypay_rzp_key_secret', rzpSec);
                    localStorage.setItem('foodypay_upi_id', upi);

                    const rawU = localStorage.getItem('foodypay_user');
                    if (rawU) {
                      const parsedU = JSON.parse(rawU);
                      parsedU.paymentRoutingMode = mode;
                      parsedU.razorpayKeyId = rzpKey;
                      parsedU.razorpayKeySecret = rzpSec;
                      parsedU.upiId = upi;
                      localStorage.setItem('foodypay_user', JSON.stringify(parsedU));
                    }
                    window.dispatchEvent(new Event('storage'));
                  } catch (e) {}

                  if (token) {
                    try {
                      await updateSettingsApi(token, {
                        paymentRoutingMode: storeControls.paymentRoutingMode || 'foodypay_default',
                        razorpayKeyId: storeControls.razorpayKeyId || 'rzp_live_TjBEt4gu2aUflB',
                        razorpayKeySecret: storeControls.razorpayKeySecret || 'FPXDLXe3Vbh0NYSpCAXmXOA3',
                        upiId: storeControls.upiId,
                      });
                    } catch (e) {}
                  }
                  addToast(' Razorpay Live Payment Gateway configured & saved successfully!', <Check size={18} />);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#FF5E14',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 94, 20, 0.3)',
                }}
              >
                Save Payment Settings
              </button>
            </div>

            {/* Payment Methods Label & Display Customization Section */}
            <div className="crm-control-section-card" style={{ marginTop: '20px' }}>
              <div className="crm-control-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={20} color="#FF5E14" /> Checkout Payment Options &amp; Label Customization
              </div>

              <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                Customize the payment section header and button texts shown to diners during web app cart checkout.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                {/* 1. Header Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Payment Section Title Header
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Payment Method / Select Payment Option"
                    value={paymentConfig.header || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, header: e.target.value })}
                    style={{ width: '100%', maxWidth: '400px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                  {/* 2. Option 1: Online UPI */}
                  <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                        <QrCode size={18} color="#FF5E14" /> Option 1: Online UPI
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: paymentConfig.upiEnabled !== false ? '#16A34A' : '#64748B' }}>
                        <input
                          type="checkbox"
                          checked={paymentConfig.upiEnabled !== false}
                          onChange={(e) => savePaymentConfig({ ...paymentConfig, upiEnabled: e.target.checked })}
                        />
                        {paymentConfig.upiEnabled !== false ? 'ENABLED' : 'DISABLED'}
                      </label>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                        Button Label Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Online UPI / Scan & Pay"
                        value={paymentConfig.upiLabel || ''}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, upiLabel: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  {/* 3. Option 2: Cash / Pay Counter */}
                  <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                        <CreditCard size={18} color="#059669" /> Option 2: Cash / Pay Counter
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: paymentConfig.cashEnabled !== false ? '#16A34A' : '#64748B' }}>
                        <input
                          type="checkbox"
                          checked={paymentConfig.cashEnabled !== false}
                          onChange={(e) => savePaymentConfig({ ...paymentConfig, cashEnabled: e.target.checked })}
                        />
                        {paymentConfig.cashEnabled !== false ? 'ENABLED' : 'DISABLED'}
                      </label>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                        Button Label Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cash / Pay Counter"
                        value={paymentConfig.cashLabel || ''}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, cashLabel: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', fontWeight: 600 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  savePaymentConfig(paymentConfig);
                  addToast('Saved Payment Method Button Labels & Settings!', <CheckCircle2 size={18} color="#10B981" />);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#FF5E14',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 94, 20, 0.3)',
                }}
              >
                Save Payment Display Labels
              </button>
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW 8: CUSTOMER REVIEWS & FEEDBACK
            ========================================================================== */}
        {activeTab === 'customer_reviews' && (
          <div className="crm-reviews-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Title Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Star size={26} color="#F59E0B" fill="#F59E0B" /> Customer Reviews & Diner Feedback
                </h2>
                <div style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px' }}>
                  Live ratings, reviews, and feedback collected from digital QR standees and counter checkouts.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
                  }}
                  onClick={() => {
                    setNewReviewForm({
                      customerName: '',
                      customerPhone: '',
                      rating: 5,
                      feedback: '',
                      dishOrdered: 'Paneer Butter Masala',
                      tableNo: 'Table 1',
                    });
                    setIsAddReviewModalOpen(true);
                  }}
                >
                  <Plus size={18} /> Add Customer Feedback
                </button>
              </div>
            </div>

            {/* Top Analytics Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Overall Rating Score */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#FEF3C7', padding: '14px', borderRadius: '12px', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={32} fill="#F59E0B" color="#F59E0B" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AVERAGE RATING</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                    {((reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / (reviews.length || 1))).toFixed(1)}{' '}
                    <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>/ 5.0</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                    Based on {reviews.length} verified ratings
                  </div>
                </div>
              </div>

              {/* Total Feedback Count */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#EFF6FF', padding: '14px', borderRadius: '12px', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={32} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL REVIEWS</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {reviews.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                    {reviews.filter((r) => r.reply).length} Replied by Store
                  </div>
                </div>
              </div>

              {/* Positive Sentiment Rate */}
              <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#DCFCE7', padding: '14px', borderRadius: '12px', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ThumbsUp size={32} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>POSITIVE SATISFACTION</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
                    {Math.round((reviews.filter((r) => r.rating >= 4).length / (reviews.length || 1)) * 100)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, marginTop: '2px' }}>
                    4 & 5 Ratings
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter Controls Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '16px 20px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search reviews by customer name, phone, feedback or dish..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '14px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Rating Filter Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: reviewRatingFilter === 'all' ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                    background: reviewRatingFilter === 'all' ? '#EFF6FF' : '#FFFFFF',
                    color: reviewRatingFilter === 'all' ? '#1D4ED8' : '#475569',
                  }}
                  onClick={() => setReviewRatingFilter('all')}
                >
                  All ({reviews.length})
                </button>
                {[5, 4, 3, 2, 1].map((star) => {
                  const cnt = reviews.filter((r) => Number(r.rating) === star).length;
                  return (
                    <button
                      key={star}
                      type="button"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: reviewRatingFilter === star ? '2px solid #F59E0B' : '1px solid #CBD5E1',
                        background: reviewRatingFilter === star ? '#FEF3C7' : '#FFFFFF',
                        color: reviewRatingFilter === star ? '#D97706' : '#475569',
                      }}
                      onClick={() => setReviewRatingFilter(star)}
                    >
                      <span>{star}</span> <Star size={12} fill="#F59E0B" color="#F59E0B" /> ({cnt})
                    </button>
                  );
                })}
              </div>

              {/* Sentiment Filter Dropdown */}
              <select
                value={reviewSentimentFilter}
                onChange={(e) => setReviewSentimentFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#334155',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Sentiments</option>
                <option value="positive"> Positive Only</option>
                <option value="neutral"> Neutral Only</option>
                <option value="negative"> Critical / Negative</option>
              </select>
            </div>

            {/* Reviews Cards List */}
            {(() => {
              const filteredList = reviews.filter((r) => {
                if (!r) return false;
                if (reviewRatingFilter !== 'all' && Number(r.rating) !== Number(reviewRatingFilter)) return false;
                if (reviewSentimentFilter !== 'all' && r.sentiment !== reviewSentimentFilter) return false;
                if (reviewSearch.trim()) {
                  const q = reviewSearch.toLowerCase().trim();
                  const nameMatch = (r.customerName || '').toLowerCase().includes(q);
                  const phoneMatch = (r.customerPhone || '').toLowerCase().includes(q);
                  const feedbackMatch = (r.feedback || '').toLowerCase().includes(q);
                  const dishMatch = (r.dishOrdered || '').toLowerCase().includes(q);
                  if (!nameMatch && !phoneMatch && !feedbackMatch && !dishMatch) return false;
                }
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <Frown size={48} color="#94A3B8" style={{ marginBottom: '12px' }} />
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#334155' }}>No reviews found</h3>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                      Try adjusting your search query or rating filter options.
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredList.map((r) => {
                    const stars = Array.from({ length: 5 }, (_, i) => i < r.rating);
                    const isPos = r.rating >= 4 || r.sentiment === 'positive';
                    const isNeu = r.rating === 3 || r.sentiment === 'neutral';

                    return (
                      <div
                        key={r.id}
                        style={{
                          background: '#FFFFFF',
                          padding: '20px 24px',
                          borderRadius: '16px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Top Card Bar: Customer Info + Rating */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                background: isPos ? '#DCFCE7' : isNeu ? '#FEF3C7' : '#FEE2E2',
                                color: isPos ? '#15803D' : isNeu ? '#D97706' : '#DC2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '16px',
                              }}
                            >
                              {(r.customerName || 'G').charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A' }}>{r.customerName}</span>
                                <span style={{ fontSize: '12px', background: '#F1F5F9', padding: '2px 8px', borderRadius: '12px', color: '#475569', fontWeight: 600 }}>
                                  {r.tableNo || 'Table 1'}
                                </span>
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span> {r.customerPhone}</span>
                                <span>•</span>
                                <span> {r.date}</span>
                              </div>
                            </div>
                          </div>

                          {/* Rating Stars & Sentiment Badge */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              {stars.map((filled, idx) => (
                                <Star
                                  key={idx}
                                  size={18}
                                  fill={filled ? '#F59E0B' : 'none'}
                                  color={filled ? '#F59E0B' : '#CBD5E1'}
                                />
                              ))}
                              <span style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A', marginLeft: '6px' }}>
                                {r.rating}.0
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: isPos ? '#DCFCE7' : isNeu ? '#FEF3C7' : '#FEE2E2',
                                color: isPos ? '#15803D' : isNeu ? '#D97706' : '#DC2626',
                              }}
                            >
                              {isPos ? ' Positive Review' : isNeu ? ' Neutral Feedback' : ' Critical Review'}
                            </span>
                          </div>
                        </div>

                        {/* Feedback Content Text Quote */}
                        <div
                          style={{
                            background: '#F8FAFC',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            borderLeft: `4px solid ${isPos ? '#16A34A' : isNeu ? '#F59E0B' : '#DC2626'}`,
                            fontSize: '14px',
                            color: '#1E293B',
                            lineHeight: '1.5',
                            fontWeight: 500,
                          }}
                        >
                          "{r.feedback}"
                        </div>

                        {/* Ordered Item Tags */}
                        {r.dishOrdered && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                            <Utensils size={14} color="#64748B" />
                            <span>Ordered Items:</span>
                            <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              {r.dishOrdered}
                            </span>
                          </div>
                        )}

                        {/* Merchant Store Reply Section */}
                        {r.reply ? (
                          <div
                            style={{
                              background: '#F0FDFA',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              border: '1px solid #CCFBF1',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0D9488', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Store size={14} /> Store Response from Merchant
                              </div>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: '#0D9488', fontSize: '12px', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => {
                                  setActiveReplyReview(r);
                                  setReplyTextInput(r.reply || '');
                                  setIsReplyModalOpen(true);
                                }}
                              >
                                Edit Reply
                              </button>
                            </div>
                            <div style={{ fontSize: '13px', color: '#115E59', fontWeight: 600 }}>
                              "{r.reply}"
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                              No reply sent yet to customer
                            </span>
                            <button
                              type="button"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                background: '#F1F5F9',
                                color: '#1E293B',
                                border: '1px solid #CBD5E1',
                                fontSize: '12.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                setActiveReplyReview(r);
                                setReplyTextInput('');
                                setIsReplyModalOpen(true);
                              }}
                            >
                              <MessageSquare size={14} /> Reply to Customer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ==========================================================================
            VIEW 9: CATALOG COLLECTIONS — CUSTOM MEALS & COMBOS BUILDER
            ========================================================================== */}
        {activeTab === 'catalog_collections' && (
          <div className="crm-collections-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Title Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Utensils size={26} color="#FF5E14" /> Meal Collections & Custom Combo Builder
                </h2>
                <div style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px' }}>
                  Create custom meal bundles with food photos, itemized individual price breakdown, and special discounted combo price.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#FF5E14',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255, 94, 20, 0.25)',
                  }}
                  onClick={handleOpenCreateMeal}
                >
                  <Plus size={18} /> + Create Custom Meal Combo
                </button>
              </div>
            </div>

            {/* Custom Meals Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {mealsCollection.map((meal) => {
                const totalIndividualSum = (meal.items || []).reduce(
                  (sum, it) => sum + (Number(it.individualPrice) || 0) * (Number(it.qty) || 1),
                  0
                );
                const comboPrice = Number(meal.comboPrice) || totalIndividualSum;
                const savings = Math.max(0, totalIndividualSum - comboPrice);
                const savingsPct = totalIndividualSum > 0 ? Math.round((savings / totalIndividualSum) * 100) : 0;

                return (
                  <div
                    key={meal.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '18px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Meal Photo Header */}
                    <div style={{ position: 'relative', height: '190px', width: '100%', background: '#F1F5F9', overflow: 'hidden' }}>
                      <img
                        src={meal.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                        alt={meal.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                        <span style={{ background: '#0F172A', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {meal.category || 'Meal Combo'}
                        </span>
                      </div>

                      {savings > 0 && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#DC2626', color: '#FFFFFF', fontSize: '12px', fontWeight: 900, padding: '4px 10px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)' }}>
                           SAVE ₹{savings} ({savingsPct}% OFF)
                        </div>
                      )}
                    </div>

                    {/* Meal Body Content */}
                    <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>{meal.name}</h3>
                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', lineHeight: '1.4' }}>
                          {meal.description}
                        </div>
                      </div>

                      {/* Itemized Food Breakdown List with Individual Prices */}
                      <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                          <span>INCLUDED FOOD ITEMS ({(meal.items || []).length})</span>
                          <span>INDIVIDUAL PRICE</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(meal.items || []).map((it, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#334155' }}>
                              <span style={{ fontWeight: 600 }}>
                                • {it.name} <span style={{ color: '#64748B', fontSize: '12px' }}>(x{it.qty || 1})</span>
                              </span>
                              <span style={{ fontWeight: 700, color: '#475569' }}>
                                ₹{(Number(it.individualPrice) || 0) * (Number(it.qty) || 1)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, color: '#64748B' }}>
                          <span>Total Items Individual Value:</span>
                          <span style={{ textDecoration: savings > 0 ? 'line-through' : 'none', color: savings > 0 ? '#94A3B8' : '#334155', fontWeight: 800 }}>
                            ₹{totalIndividualSum}
                          </span>
                        </div>
                      </div>

                      {/* Combo Pricing & Discount Footer Banner */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#DCFCE7', padding: '12px 16px', borderRadius: '12px', border: '1px solid #BBF7D0', marginTop: 'auto' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>SPECIAL MEAL BUNDLE PRICE</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#15803D' }}>
                            ₹{comboPrice}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: '#16A34A',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                            onClick={() => addToast(`Order ${meal.name} Combo added to POS cart!`, <Check size={16} />)}
                          >
                            Select Meal Combo
                          </button>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                        <button
                          type="button"
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            background: '#F1F5F9',
                            color: '#1E293B',
                            border: '1px solid #CBD5E1',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                          onClick={() => handleOpenEditMeal(meal)}
                        >
                          <Edit3 size={14} /> Edit Meal
                        </button>

                        <button
                          type="button"
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => handleDeleteMeal(meal.id, meal.name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================================================
            VIEW 10: KITCHEN DISPLAY SYSTEM (KDS / COOKING DISPLAY)
            ========================================================================== */}
        {activeTab === 'kitchen' && (
          <div className="crm-kitchen-kds-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Title Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', background: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ChefHat size={28} color="#FF5E14" /> Kitchen Display System (KDS Live Orders)
                </h2>
                <div style={{ fontSize: '13.5px', color: '#64748B', marginTop: '4px' }}>
                  Real-time kitchen order cards with item photos, customer details, table numbers, and 1-click "Start Cooking" & "Mark Ready" status buttons.
                </div>
              </div>

              {/* Kitchen Filter Tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { key: 'all', label: `All Kitchen Orders (${(orders || []).filter((o) => o && o.status !== 'completed').length})` },
                  { key: 'new', label: ` New Orders (${(orders || []).filter((o) => o && o.status === 'new').length})` },
                  { key: 'preparing', label: `‍ Cooking In Progress (${(orders || []).filter((o) => o && o.status === 'preparing').length})` },
                  { key: 'ready', label: ` Ready for Service (${(orders || []).filter((o) => o && o.status === 'ready').length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: kitchenFilter === tab.key ? '2px solid #FF5E14' : '1px solid #CBD5E1',
                      background: kitchenFilter === tab.key ? '#FFF0EB' : '#FFFFFF',
                      color: kitchenFilter === tab.key ? '#FF5E14' : '#475569',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => setKitchenFilter(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kitchen Orders Cards Grid */}
            {(() => {
              const activeKitchenOrders = (orders || []).filter((o) => {
                if (!o) return false;
                if (kitchenFilter === 'all') return o.status !== 'completed';
                return o.status === kitchenFilter;
              });

              if (activeKitchenOrders.length === 0) {
                return (
                  <div style={{ background: '#FFFFFF', padding: '50px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <ChefHat size={56} color="#CBD5E1" style={{ marginBottom: '14px' }} />
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#334155' }}>No Active Kitchen Orders</h3>
                    <div style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px' }}>
                      All kitchen orders have been prepared and served cleanly!
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {activeKitchenOrders.map((ord) => {
                    const isNew = ord.status === 'new';
                    const isCooking = ord.status === 'preparing';
                    const isReady = ord.status === 'ready';

                    return (
                      <div
                        key={ord.id || ord._id}
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '18px',
                          border: isNew ? '2px solid #F97316' : isCooking ? '2px solid #1D4ED8' : '2px solid #16A34A',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Card Top Header: Order ID + Table No + Time */}
                        <div
                          style={{
                            background: isNew ? '#FFF7ED' : isCooking ? '#EFF6FF' : '#DCFCE7',
                            padding: '14px 18px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{ord.id}</span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  background: '#0F172A',
                                  color: '#FFFFFF',
                                }}
                              >
                                {ord.table || 'Table 1'}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span> {ord.customer || 'Guest Diner'}</span>
                              {ord.phone && <span style={{ color: '#64748B', fontWeight: 500 }}>({ord.phone})</span>}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} /> {ord.time || 'Just now'}
                            </div>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 900,
                                padding: '3px 8px',
                                borderRadius: '10px',
                                marginTop: '4px',
                                display: 'inline-block',
                                background: isNew ? '#FFEDD5' : isCooking ? '#DBEAFE' : '#BBF7D0',
                                color: isNew ? '#C2410C' : isCooking ? '#1E40AF' : '#15803D',
                              }}
                            >
                              {isNew ? ' NEW ORDER' : isCooking ? '‍ COOKING' : ' READY'}
                            </span>
                          </div>
                        </div>

                        {/* Middle Body: Ordered Food Items List with Food Images */}
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            ORDERED FOOD ITEMS ({(ord.items || []).length})
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(ord.items || []).map((item, idx) => {
                              const matchDish = (dishes || []).find((d) => (d.name || '').toLowerCase().includes((item.name || '').toLowerCase()));
                              const itemImg = matchDish
                                ? (typeof matchDish.image === 'string' ? matchDish.image : (matchDish.image?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80'))
                                : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80';

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: '#F8FAFC',
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                  }}
                                >
                                  {/* Food Item Image Thumbnail */}
                                  <img
                                    src={itemImg}
                                    alt={item.name}
                                    style={{
                                      width: '48px',
                                      height: '48px',
                                      borderRadius: '10px',
                                      objectFit: 'cover',
                                      flexShrink: 0,
                                      border: '1px solid #CBD5E1',
                                    }}
                                  />

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ color: item.isVeg !== false ? '#16A34A' : '#DC2626', fontSize: '10px' }}>
                                        {item.isVeg !== false ? '' : ''}
                                      </span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                      Rate: ₹{item.price} each
                                    </div>
                                  </div>

                                  {/* Quantity Badge */}
                                  <div style={{ background: '#FF5E14', color: '#FFFFFF', padding: '4px 10px', borderRadius: '8px', fontWeight: 900, fontSize: '14px' }}>
                                    x {item.qty || 1}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Special Instructions Note */}
                          {ord.note && (
                            <div style={{ background: '#FFF7ED', borderLeft: '4px solid #F97316', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#C2410C', fontWeight: 600 }}>
                              <strong>Chef Note:</strong> "{ord.note}"
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions Bar: Click "Start Cooking" or "Its Ready" */}
                        <div style={{ padding: '14px 18px', background: '#FAFAFA', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '10px' }}>
                          {isNew && (
                            <button
                              type="button"
                              style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: '#1D4ED8',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 10px rgba(29, 78, 216, 0.25)',
                              }}
                              onClick={() => {
                                setOrders((prev) =>
                                  prev.map((o) => ((o.id === ord.id || o._id === ord._id) ? { ...o, status: 'preparing' } : o))
                                );
                                triggerSound(playOrderPlaced);
                                addToast(`‍ Started Cooking ${ord.id} for ${ord.table || 'Table 1'}!`, <ChefHat size={18} />);
                              }}
                            >
                              <ChefHat size={18} /> Start Cooking
                            </button>
                          )}

                          {isCooking && (
                            <button
                              type="button"
                              style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)',
                              }}
                              onClick={() => {
                                setOrders((prev) =>
                                  prev.map((o) => ((o.id === ord.id || o._id === ord._id) ? { ...o, status: 'ready' } : o))
                                );
                                triggerSound(playMilestoneCelebration);
                                confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
                                addToast(` Order ${ord.id} is READY for ${ord.table || 'Table 1'}!`, <CheckCircle2 size={18} />);
                              }}
                            >
                              <CheckCircle2 size={18} /> Mark Its Ready!
                            </button>
                          )}

                          {isReady && (
                            <button
                              type="button"
                              style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                              }}
                              onClick={() => {
                                setOrders((prev) =>
                                  prev.map((o) => ((o.id === ord.id || o._id === ord._id) ? { ...o, status: 'completed' } : o))
                                );
                                addToast(`️ Order ${ord.id} Served / Completed!`, <Check size={18} />);
                              }}
                            >
                              <Utensils size={18} /> Mark Served & Complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* ==========================================================================
          MODAL 1: CREATE / EDIT MANUAL ORDER (Wide 2-Column POS Modal with Keyboard Navigation)
          ========================================================================== */}
      {isManualOrderOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsManualOrderOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="crm-modal-card crm-modal-card-wide" style={{ maxWidth: '1180px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header" style={{ padding: '12px 20px', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>
                  {editingOrderId ? `Edit Order: ${editingOrderId}` : 'Counter POS — Create Manual Order'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Use keyboard <kbd className="crm-kbd">←</kbd> <kbd className="crm-kbd">→</kbd> or <kbd className="crm-kbd">Enter</kbd> to move focus between fields.
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => {
                  setIsManualOrderOpen(false);
                  setEditingOrderId(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrderSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="crm-manual-order-container" style={{ flex: 1, minHeight: 0, display: 'flex', gap: '16px', overflow: 'hidden', padding: '12px 18px' }}>
                {/* LEFT COLUMN: CART & CUSTOMER DETAILS */}
                <div className="crm-pos-left-col" style={{ width: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '6px' }}>
                  {/* Order Type Selector */}
                  <div className="crm-order-type-tabs" style={{ marginBottom: '8px' }}>
                    {[
                      { key: 'Dine-In', icon: <Store size={15} />, label: 'Dine-In' },
                      { key: 'Takeaway', icon: <ShoppingBag size={15} />, label: 'Takeaway' },
                      { key: 'Delivery', icon: <Truck size={15} />, label: 'Delivery' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        className={`crm-order-type-tab ${manualOrderType === t.key ? 'active' : ''}`}
                        onClick={() => setManualOrderType(t.key)}
                        style={{ padding: '8px' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          {t.icon}
                          <span>{t.label}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Customer & Table Inputs in 2-Column Grid */}
                  <div className="crm-form-grid" style={{ gap: '8px', marginBottom: '8px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontSize: '12px' }}>Customer Name <span className="req">*</span></label>
                      <input
                        ref={manualCustRef}
                        type="text"
                        className="crm-input"
                        style={{ padding: '7px 10px', fontSize: '13px' }}
                        placeholder="Customer Name (e.g. Rahul)"
                        value={manualCustomer}
                        onChange={(e) => setManualCustomer(e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, 0)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="crm-form-group">
                      <label style={{ fontSize: '12px' }}>Mobile Number</label>
                      <input
                        ref={manualPhoneRef}
                        type="text"
                        className="crm-input"
                        style={{ padding: '7px 10px', fontSize: '13px' }}
                        placeholder="Mobile Number"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, 1)}
                      />
                    </div>
                  </div>

                  {manualOrderType === 'Dine-In' && (
                    <div className="crm-form-group" style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px' }}>Select Dining Table</label>
                      <select
                        ref={manualTableRef}
                        className="crm-input"
                        style={{ padding: '7px 10px', fontSize: '13px' }}
                        value={manualTable}
                        onChange={(e) => setManualTable(e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, 2)}
                      >
                        {tables.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.capacity} Pax) — {t.section}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Live Cart Items Summary */}
                  <div className="crm-cart-summary-box" style={{ padding: '8px 10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        SELECTED ITEMS ({Object.values(manualItems).reduce((sum, i) => sum + i.qty, 0)})
                      </label>
                      {Object.keys(manualItems).length > 0 && (
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => setManualItems({})}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {Object.keys(manualItems).length === 0 ? (
                      <div className="crm-empty-cart-state" style={{ padding: '14px 8px' }}>
                        <Utensils size={24} color="#94A3B8" />
                        <div style={{ fontWeight: 700, marginTop: '4px', color: '#64748B', fontSize: '13px' }}>Cart is empty</div>
                        <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Select items from the food list on the right</div>
                      </div>
                    ) : (
                      <div className="crm-cart-items-scroll" style={{ maxHeight: '140px' }}>
                        {Object.entries(manualItems).map(([itemKey, item]) => (
                          <div key={itemKey} className="crm-cart-item-row" style={{ padding: '6px 10px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={item.isVeg ? 'crm-veg-dot' : 'crm-nonveg-dot'} />
                                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>{item.name}</span>
                              </div>
                              {(item.sizeName || item.bunName || (item.toppings && item.toppings.length > 0)) && (
                                <div style={{ fontSize: '11px', color: '#1D4ED8', fontWeight: 700, marginTop: '1px' }}>
                                  {[item.sizeName, item.bunName, ...(item.toppings || [])].filter(Boolean).join(' • ')}
                                </div>
                              )}
                              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                                ₹{item.price} × {item.qty} = <b>₹{item.price * item.qty}</b>
                              </div>
                            </div>

                            <div className="crm-qty-counter">
                              <button
                                type="button"
                                className="crm-qty-btn"
                                style={{ width: '26px', height: '26px' }}
                                onClick={() => handleUpdateItemQty(itemKey, -1)}
                              >
                                -
                              </button>
                              <span style={{ fontWeight: 900, minWidth: '18px', textAlign: 'center', fontSize: '13px' }}>
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                className="crm-qty-btn"
                                style={{ width: '26px', height: '26px' }}
                                onClick={() => handleUpdateItemQty(itemKey, 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Charges, Tax & Discounts in 2 Columns */}
                  <div className="crm-form-grid" style={{ gap: '8px', marginBottom: '8px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontSize: '11.5px' }}>Flat Discount (₹)</label>
                      <input
                        ref={manualDiscountRef}
                        type="number"
                        className="crm-input"
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                        placeholder="0"
                        value={manualDiscount}
                        onChange={(e) => setManualDiscount(e.target.value)}
                        onKeyDown={(e) => handleInputKeyDown(e, 4)}
                      />
                    </div>

                    <div className="crm-form-group" style={{ justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 800, color: '#334155', marginTop: '12px' }}>
                        <input
                          type="checkbox"
                          checked={manualGstEnabled}
                          onChange={(e) => setManualGstEnabled(e.target.checked)}
                          style={{ accentColor: '#1D4ED8', width: '15px', height: '15px' }}
                        />
                        <span>Apply 5% GST Tax</span>
                      </label>
                    </div>
                  </div>

                  {/* Bill Summary Box */}
                  <div className="crm-bill-breakdown-card" style={{ padding: '10px 12px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
                      <span>Subtotal:</span>
                      <b>₹{manualSubtotal}</b>
                    </div>
                    {mDiscountAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px', color: '#059669' }}>
                        <span>Discount:</span>
                        <b>- ₹{mDiscountAmt}</b>
                      </div>
                    )}
                    {manualGstEnabled && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
                        <span>GST Tax (5%):</span>
                        <b>+ ₹{manualTax}</b>
                      </div>
                    )}
                    <div className="crm-bill-total-row" style={{ paddingTop: '6px', marginTop: '4px', fontSize: '15px' }}>
                      <span>Total Amount:</span>
                      <span className="crm-bill-total-val" style={{ fontSize: '18px' }}>₹{manualTotal}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="crm-form-group" style={{ marginTop: '6px', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11.5px' }}>Payment Method</label>
                    <select
                      className="crm-input"
                      style={{ padding: '6px 10px', fontSize: '12.5px' }}
                      value={manualPaymentMode}
                      onChange={(e) => setManualPaymentMode(e.target.value)}
                    >
                      <option value="Cash on Counter">Cash on Counter</option>
                      <option value="Paid via UPI (Counter QR)">Paid via UPI (Counter QR)</option>
                      <option value="POS Card Machine">Credit / Debit Card (POS Machine)</option>
                      <option value="Unpaid / Pay Later">Pay Later on Table Departure</option>
                    </select>
                  </div>
                </div>

                {/* RIGHT COLUMN: FOOD SEARCH, CATEGORIES & DISH CARDS */}
                <div className="crm-pos-right-col" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1.5px solid #E2E8F0', paddingLeft: '16px' }}>
                  {/* Search Bar */}
                  <div style={{ position: 'relative', marginBottom: '8px', flexShrink: 0 }}>
                    <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      ref={manualSearchRef}
                      type="text"
                      className="crm-input"
                      style={{ paddingLeft: '36px', padding: '7px 12px 7px 36px', fontSize: '13px' }}
                      placeholder="Search food by name (e.g. Pizza, Burger, Mojito)..."
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                      onKeyDown={(e) => handleInputKeyDown(e, 3)}
                    />
                  </div>

                  {/* Category Pills Filter */}
                  <div className="crm-pos-cat-pills" style={{ marginBottom: '8px', flexShrink: 0 }}>
                    {['All', ...allCategories].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`crm-pos-cat-pill ${manualCategory === cat ? 'active' : ''}`}
                        onClick={() => setManualCategory(cat)}
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Dishes Cards Grid */}
                  <div className="crm-pos-dishes-grid" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                    {(dishes || [])
                      .filter((d) => {
                        if (!d) return false;
                        const matchCat = manualCategory === 'All' || d.category === manualCategory;
                        const matchSearch = (d.name || '').toLowerCase().includes((manualSearch || '').toLowerCase());
                        return matchCat && matchSearch;
                      })
                      .map((d) => {
                        const dKey = d._id || d.id;
                        const dishImg = typeof d.image === 'string' ? d.image : (d.image?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80');
                        const qtyInCart = manualItems[dKey] ? manualItems[dKey].qty : 0;

                        return (
                          <div key={dKey} className="crm-pos-food-card">
                            <div className="crm-pos-food-img-box">
                              <img src={dishImg} alt={d.name} loading="lazy" />
                              <div className="pos-badge-container">
                                <span className={d.isVeg ? 'crm-veg-dot' : 'crm-nonveg-dot'} />
                              </div>
                              {d.isSpecial && <span className="pos-special-badge">Special</span>}
                            </div>

                            <div className="crm-pos-food-details">
                              <div className="crm-pos-food-name">{d.name}</div>
                              {d.desc && <div className="crm-pos-food-desc">{d.desc}</div>}

                              <div className="crm-pos-food-footer">
                                <div className="crm-pos-food-price">₹{d.price}</div>

                                {qtyInCart > 0 ? (
                                  <div className="crm-pos-qty-pill">
                                    <button type="button" onClick={() => handleUpdateItemQty(dKey, -1, d)}>
                                      -
                                    </button>
                                    <span>{qtyInCart}</span>
                                    <button type="button" onClick={() => handleUpdateItemQty(dKey, 1, d)}>
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="crm-pos-add-btn"
                                    onClick={() => handleUpdateItemQty(dKey, 1, d)}
                                  >
                                    <Plus size={13} /> ADD
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="crm-modal-footer" style={{ padding: '12px 20px', borderTop: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => {
                    setIsManualOrderOpen(false);
                    setEditingOrderId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create-order-primary">
                  <Check size={16} />
                  <span>{editingOrderId ? 'Update Order Details' : 'Place Order & Print KOT'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: BILL SETTLEMENT & ONLINE UPI QR SCANNER POPUP WITH DISCOUNT & COUPON
          ========================================================================== */}
      {activeBillSettlementOrder && (() => {
        const { subtotal, discountVal, finalTotal } = getSettleCalculations();

        return (
          <div className="crm-modal-backdrop" onClick={() => setActiveBillSettlementOrder(null)}>
            <div className="crm-modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
              <div className="crm-modal-header">
                <h3> Bill Settlement — {activeBillSettlementOrder.orderId || activeBillSettlementOrder.id}</h3>
                <button
                  type="button"
                  className="crm-modal-close-btn"
                  onClick={() => setActiveBillSettlementOrder(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="crm-modal-body">
                {!showUpiQrModal ? (
                  <div>
                    <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E2E8F0', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#64748B', fontSize: '13.5px' }}>Customer:</span>
                        <b>{activeBillSettlementOrder.customer} ({activeBillSettlementOrder.table})</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#64748B', fontSize: '13.5px' }}>Order Type:</span>
                        <b>{activeBillSettlementOrder.type}</b>
                      </div>
                      <div style={{ borderTop: '1.5px dashed #CBD5E1', paddingTop: '8px', marginTop: '8px' }}>
                        {(activeBillSettlementOrder.items || []).map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                            <span>{it.qty}x {it.name}</span>
                            <b>₹{it.price * it.qty}</b>
                          </div>
                        ))}
                      </div>

                      {/* DISCOUNT & COUPON CODE APPLIED SECTION */}
                      <div style={{ borderTop: '1.5px dashed #CBD5E1', paddingTop: '10px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '3px' }}>
                              Manual Discount (₹)
                            </label>
                            <input
                              type="number"
                              className="crm-input"
                              style={{ padding: '6px 10px', fontSize: '13px' }}
                              placeholder="0"
                              value={settleDiscount}
                              onChange={(e) => setSettleDiscount(e.target.value)}
                            />
                          </div>
                          <div style={{ flex: 1.2 }}>
                            <label style={{ fontSize: '11px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '3px' }}>
                              Apply Coupon Code
                            </label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                type="text"
                                className="crm-input"
                                style={{ padding: '6px 10px', fontSize: '12.5px', textTransform: 'uppercase' }}
                                placeholder="e.g. FOOD10"
                                value={settleCouponInput}
                                onChange={(e) => setSettleCouponInput(e.target.value)}
                              />
                              <button
                                type="button"
                                className="crm-btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px', background: '#2563EB', color: '#FFF', borderColor: '#2563EB' }}
                                onClick={handleApplySettleCoupon}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>

                        {settleCouponApplied && (
                          <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#15803D', fontWeight: 800 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Tag size={13} /> Coupon "{settleCouponApplied.code}" Active
                            </span>
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: 800, fontSize: '12px' }}
                              onClick={() => setSettleCouponApplied(null)}
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {discountVal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16A34A', fontWeight: 800 }}>
                            <span>Total Discount:</span>
                            <span>- ₹{discountVal}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ borderTop: '1.5px solid #0F172A', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900 }}>
                        <span>Total Payable:</span>
                        <span style={{ color: '#1D4ED8' }}>₹{finalTotal}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
                      Select Payment Method for Settlement:
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                      <button
                        type="button"
                        className="crm-btn-settle-option cash"
                        onClick={handleSettleBillCash}
                      >
                        <CreditCard size={20} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: '15px' }}> Cash Settlement</div>
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>Collect ₹{finalTotal} cash on counter</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="crm-btn-settle-option upi"
                        onClick={() => setShowUpiQrModal(true)}
                      >
                        <QrCode size={20} />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, fontSize: '15px' }}> Online UPI QR Scanner</div>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>Generate payment QR for Google Pay / PhonePe / Paytm</div>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      SCAN &amp; PAY UPI QR CODE
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', margin: '4px 0 14px 0' }}>
                      ₹{finalTotal}.00
                    </div>

                    <div style={{ display: 'inline-block', padding: '16px', background: '#FFFFFF', borderRadius: '18px', border: '2.5px solid #1D4ED8', boxShadow: '0 8px 24px rgba(29, 78, 216, 0.15)' }}>
                      <QrCodeComponent
                        text={`upi://pay?pa=${storeControls.upiId}&pn=${encodeURIComponent(storeControls.restName)}&am=${finalTotal}&cu=INR`}
                        size={200}
                        qrColor="#0F172A"
                        cornerColor="#1D4ED8"
                      />
                    </div>

                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '10px', marginBottom: '12px', fontWeight: 600 }}>
                      Scan QR code or tap below to launch payment app directly:
                    </div>

                    {/* DIRECT UPI APP SELECTION BUTTONS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                      <a
                        href={`upi://pay?pa=${storeControls.upiId}&pn=${encodeURIComponent(storeControls.restName)}&am=${finalTotal}&cu=INR`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: '1.5px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#1E293B',
                          fontWeight: 800,
                          fontSize: '13px',
                          textDecoration: 'none'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}></span> Google Pay
                      </a>

                      <a
                        href={`upi://pay?pa=${storeControls.upiId}&pn=${encodeURIComponent(storeControls.restName)}&am=${finalTotal}&cu=INR`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: '1.5px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#5F259F',
                          fontWeight: 800,
                          fontSize: '13px',
                          textDecoration: 'none'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}></span> PhonePe
                      </a>

                      <a
                        href={`upi://pay?pa=${storeControls.upiId}&pn=${encodeURIComponent(storeControls.restName)}&am=${finalTotal}&cu=INR`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: '1.5px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#00BAF2',
                          fontWeight: 800,
                          fontSize: '13px',
                          textDecoration: 'none'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}></span> Paytm
                      </a>

                      <a
                        href={`upi://pay?pa=${storeControls.upiId}&pn=${encodeURIComponent(storeControls.restName)}&am=${finalTotal}&cu=INR`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: '1.5px solid #1D4ED8',
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          fontWeight: 900,
                          fontSize: '13px',
                          textDecoration: 'none'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}></span> Pay Any UPI
                      </a>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button
                        type="button"
                        className="crm-btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => setShowUpiQrModal(false)}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="btn-create-order-primary"
                        style={{ flex: 2, background: '#059669' }}
                        onClick={handleSettleBillUpiConfirm}
                      >
                        <Check size={18} />
                        <span>Confirm Payment Received</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==========================================================================
          MODAL: VIEW FULL ORDER DETAILS (Triggered when clicking Completed / Cancelled cards)
          ========================================================================== */}
      {viewingOrderDetails && (
        <div className="crm-modal-backdrop" onClick={() => setViewingOrderDetails(null)}>
          <div className="crm-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3> Order Receipt — {viewingOrderDetails.orderId || viewingOrderDetails.id}</h3>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setViewingOrderDetails(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="crm-modal-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>{viewingOrderDetails.customer}</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    {viewingOrderDetails.phone} • {viewingOrderDetails.table} ({viewingOrderDetails.type})
                  </div>
                </div>
                {viewingOrderDetails.status === 'completed' ? (
                  <span className="crm-completed-badge">
                    <CheckCircle2 size={13} /> Paid &amp; Served
                  </span>
                ) : viewingOrderDetails.status === 'cancelled' ? (
                  <span className="crm-cancelled-badge">
                    <Frown size={13} /> Voided
                  </span>
                ) : (
                  <span className={`crm-status-pill ${viewingOrderDetails.status || 'new'}`}>
                    {(viewingOrderDetails.status || 'NEW').toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.04em', marginBottom: '6px' }}>
                ORDER ITEMS SUMMARY
              </div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
                {(viewingOrderDetails.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderBottom: idx === (viewingOrderDetails.items || []).length - 1 ? 'none' : '1px solid #F1F5F9',
                      fontSize: '13px',
                      background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={it.isVeg ? 'crm-veg-dot' : 'crm-nonveg-dot'} />
                      <span>{it.name}</span>
                      <span style={{ fontWeight: 800, color: '#2563EB', fontSize: '12px' }}>x{it.qty}</span>
                    </div>
                    <b style={{ color: '#0F172A' }}>₹{it.price * it.qty}</b>
                  </div>
                ))}
              </div>

              <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>Total Paid Amount:</span>
                <span style={{ fontWeight: 900, fontSize: '18px', color: '#2563EB' }}>₹{viewingOrderDetails.total}</span>
              </div>
            </div>

            <div className="crm-modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="crm-btn-secondary"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Print KOT</span>
              </button>
              <button
                type="button"
                className="btn-create-order-primary"
                onClick={() => setViewingOrderDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL: EDIT PRODUCT
          ========================================================================== */}
      {isEditProductModalOpen && editProductForm && (
        <div className="crm-modal-backdrop" onClick={() => setIsEditProductModalOpen(false)}>
          <div className="crm-modal-card crm-modal-card-wide-product" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>Edit Product / Dish</h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Update dish details, photo, sizes &amp; customization options</div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsEditProductModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditProductSubmit}>
              <div className="crm-modal-body">
                <div className="crm-product-modal-grid">
                  {/* LEFT COLUMN: Basic Product Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontWeight: 800 }}>Product Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className="crm-input"
                        required
                        placeholder="e.g. Classic Margherita Pizza"
                        value={editProductForm.name}
                        onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="crm-form-group">
                        <label style={{ fontWeight: 800 }}>Category</label>
                        <select
                          className="crm-input"
                          value={editProductForm.category}
                          onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                        >
                          {allCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="crm-form-group">
                        <label style={{ fontWeight: 800 }}>Selling Price (₹) <span className="req">*</span></label>
                        <input
                          type="number"
                          className="crm-input"
                          required
                          placeholder="e.g. 150"
                          value={editProductForm.price}
                          onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                        />
                      </div>

                      <div className="crm-form-group">
                        <label style={{ fontWeight: 800 }}>Original Price / MRP (₹)</label>
                        <input
                          type="number"
                          className="crm-input"
                          placeholder="e.g. 200"
                          value={editProductForm.originalPrice || ''}
                          onChange={(e) => setEditProductForm({ ...editProductForm, originalPrice: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Live Discount Calculation Badge */}
                    {Number(editProductForm.originalPrice) > Number(editProductForm.price) && Number(editProductForm.price) > 0 && (
                      <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔥 Discount Calculated:</span>
                          <span style={{ background: '#10B981', color: '#FFF', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>
                            {Math.round(((Number(editProductForm.originalPrice) - Number(editProductForm.price)) / Number(editProductForm.originalPrice)) * 100)}% OFF
                          </span>
                          <span style={{ color: '#059669', fontSize: '12px' }}>(Save ₹{Number(editProductForm.originalPrice) - Number(editProductForm.price)})</span>
                        </div>
                      </div>
                    )}

                    {/* Toggle Option: Show or Hide Discount Tag on Customer Menu */}
                    <div className="crm-form-group" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '10px 14px', borderRadius: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={editProductForm.showDiscountTag !== false}
                            onChange={(e) => setEditProductForm({ ...editProductForm, showDiscountTag: e.target.checked })}
                            style={{ width: '17px', height: '17px', accentColor: '#1D4ED8' }}
                          />
                          <div>
                            <span>🏷️ Show % OFF Badge &amp; Strikethrough Price on Menu</span>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400, marginTop: '1px' }}>
                              Enable to show discount tag (e.g. 25% OFF) to customers on storefront.
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: (editProductForm.showDiscountTag !== false) ? '#DCFCE7' : '#F1F5F9', color: (editProductForm.showDiscountTag !== false) ? '#15803D' : '#64748B' }}>
                          {(editProductForm.showDiscountTag !== false) ? 'SHOW ON MENU' : 'HIDE'}
                        </span>
                      </label>
                    </div>

                    <div className="crm-form-group">
                      <label style={{ fontWeight: 800 }}>Dietary Type</label>
                      <div className="crm-dietary-toggle-group">
                        <button
                          type="button"
                          className={`crm-dietary-pill-option ${editProductForm.isVeg === true ? 'veg-active' : ''}`}
                          onClick={() => setEditProductForm({ ...editProductForm, isVeg: true })}
                        >
                          <span className="crm-veg-dot" /> Pure Veg
                        </button>
                        <button
                          type="button"
                          className={`crm-dietary-pill-option ${editProductForm.isVeg === false ? 'nonveg-active' : ''}`}
                          onClick={() => setEditProductForm({ ...editProductForm, isVeg: false })}
                        >
                          <span className="crm-nonveg-dot" /> Non-Veg
                        </button>
                      </div>
                    </div>

                    <div className="crm-form-group" style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', padding: '10px 14px', borderRadius: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#C2410C', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={editProductForm.isSpecial || false}
                          onChange={(e) => setEditProductForm({ ...editProductForm, isSpecial: e.target.checked })}
                          style={{ width: '17px', height: '17px', accentColor: '#FF5E14' }}
                        />
                        <span>⭐ Mark as Chef's Special / Featured Dish</span>
                      </label>
                    </div>

                    <div className="crm-form-group">
                      <label style={{ fontWeight: 800 }}>Description</label>
                      <textarea
                        rows={3}
                        className="crm-input"
                        placeholder="Short appetizing description..."
                        value={editProductForm.desc || ''}
                        onChange={(e) => setEditProductForm({ ...editProductForm, desc: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Photo Picker & Size Variations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* MULTI-PHOTO GALLERY PICKER */}
                    <div className="crm-food-photo-card" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <label style={{ margin: 0, fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                            Product Photos Gallery ({editProductForm.images?.length || (editProductForm.image ? 1 : 0)})
                          </label>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                            Upload single or multiple photos from PC/Mobile. Tap a photo to set as main cover.
                          </div>
                        </div>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => setShowEditUrlInput(!showEditUrlInput)}
                        >
                          {showEditUrlInput ? ' Hide URL' : '+ Add Image URL'}
                        </button>
                      </div>

                      {/* Main Active Photo Preview Box */}
                      <div className="crm-food-photo-preview-box" style={{ height: '180px', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', marginBottom: '12px', position: 'relative' }}>
                        {(editProductForm.images?.[0] || editProductForm.image) ? (
                          <img src={editProductForm.images?.[0] || editProductForm.image} alt="Dish Main Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', paddingTop: '50px' }}>
                            📷 No Photo Selected. Click below to add photos.
                          </div>
                        )}
                        <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15,23,42,0.8)', color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                          ★ Main Cover Photo
                        </span>
                      </div>

                      {/* Thumbnails list of multiple uploaded photos */}
                      {(editProductForm.images && editProductForm.images.length > 0) && (
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                          {editProductForm.images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              style={{
                                position: 'relative',
                                width: '60px',
                                height: '60px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: imgIdx === 0 ? '2.5px solid #FF5E14' : '1px solid #CBD5E1',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                              onClick={() => {
                                const reordered = [imgUrl, ...editProductForm.images.filter((_, idx) => idx !== imgIdx)];
                                setEditProductForm({ ...editProductForm, images: reordered, image: imgUrl });
                              }}
                              title={imgIdx === 0 ? 'Main Cover Photo' : 'Click to set as Main Cover'}
                            >
                              <img src={imgUrl} alt={`Uploaded ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  const filtered = editProductForm.images.filter((_, idx) => idx !== imgIdx);
                                  setEditProductForm({
                                    ...editProductForm,
                                    images: filtered,
                                    image: filtered[0] || '',
                                  });
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Remove Photo"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Upload Input & Buttons */}
                      <input
                        id="editDishMultiFileInput"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleProductMultiImageChange(e, true)}
                        style={{ display: 'none' }}
                      />

                      <button
                        type="button"
                        className="crm-btn-secondary"
                        style={{ fontSize: '12.5px', padding: '8px 14px', width: '100%', justifyContent: 'center', marginBottom: '10px', fontWeight: 800, backgroundColor: '#FFFFFF' }}
                        onClick={() => document.getElementById('editDishMultiFileInput').click()}
                      >
                         Upload Photos from PC / Mobile (Multiple)
                      </button>

                      {showEditUrlInput && (
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          <input
                            type="text"
                            className="crm-input"
                            style={{ fontSize: '12px', padding: '6px 10px', flex: 1 }}
                            placeholder="Paste photo URL (e.g. Unsplash)"
                            id="editCustomUrlField"
                          />
                          <button
                            type="button"
                            className="crm-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                            onClick={() => {
                              const el = document.getElementById('editCustomUrlField');
                              const urlVal = (el ? el.value : '').trim();
                              if (urlVal) {
                                const current = editProductForm.images || [];
                                const updated = [...current, urlVal];
                                setEditProductForm({ ...editProductForm, images: updated, image: updated[0] });
                                if (el) el.value = '';
                                addToast('Added photo to gallery!');
                              }
                            }}
                          >
                            + Add URL
                          </button>
                        </div>
                      )}

                      {/* Preset Food Photos Buttons */}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Quick Add Preset Photos:</span>
                        <div className="crm-photo-presets-grid">
                          {[
                            { label: ' Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Thali', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281829?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Drink', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Dessert', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80' },
                          ].map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              className="crm-photo-preset-btn"
                              onClick={() => {
                                const currentImgs = editProductForm.images || [];
                                const updated = [...currentImgs, p.url];
                                setEditProductForm({ ...editProductForm, image: updated[0], images: updated });
                              }}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Product Sizes & Variations */}
                    <div className="crm-form-group" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '12px 14px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ margin: 0, fontWeight: 800, fontSize: '13px' }}>Product Sizes &amp; Price Variations</label>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => {
                            const currentSizes = editProductForm.sizes || [];
                            setEditProductForm({
                              ...editProductForm,
                              sizes: [...currentSizes, { name: 'Large', price: Number(editProductForm.price || 199) + 80 }],
                            });
                          }}
                        >
                          + Add Size Variant
                        </button>
                      </div>

                      {(!editProductForm.sizes || editProductForm.sizes.length === 0) ? (
                        <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                          Standard single size (₹{editProductForm.price || 0})
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {editProductForm.sizes.map((sz, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="crm-input"
                                style={{ flex: 2, padding: '5px 10px', fontSize: '12.5px' }}
                                placeholder="Size (e.g. Medium)"
                                value={sz.name}
                                onChange={(e) => {
                                  const updated = [...editProductForm.sizes];
                                  updated[sIdx].name = e.target.value;
                                  setEditProductForm({ ...editProductForm, sizes: updated });
                                }}
                              />
                              <input
                                type="number"
                                className="crm-input"
                                style={{ flex: 1, padding: '5px 10px', fontSize: '12.5px' }}
                                placeholder="Price ₹"
                                value={sz.price}
                                onChange={(e) => {
                                  const updated = [...editProductForm.sizes];
                                  updated[sIdx].price = Number(e.target.value);
                                  setEditProductForm({ ...editProductForm, sizes: updated });
                                }}
                              />
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 900, cursor: 'pointer', padding: '4px 6px' }}
                                onClick={() => {
                                  const updated = editProductForm.sizes.filter((_, idx) => idx !== sIdx);
                                  setEditProductForm({ ...editProductForm, sizes: updated });
                                }}
                              >
                                
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setIsEditProductModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary">
                  <Check size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 2: ADD PRODUCT MODAL (Wide 2-Column POS Layout & Clean Photo Picker)
          ========================================================================== */}
      {isAddProductModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddProductModalOpen(false)}>
          <div className="crm-modal-card crm-modal-card-wide-product" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>+ Add New Product to Catalog</h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Fill food details, photo &amp; dietary type to list on your digital menu</div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsAddProductModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit}>
              <div className="crm-modal-body">
                <div className="crm-product-modal-grid">
                  {/* LEFT COLUMN: Basic Product Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontWeight: 800 }}>Food / Product Name <span className="req">*</span></label>
                      <input
                        type="text"
                        className="crm-input"
                        placeholder="e.g. ITALIAN CHEESE GIANT SLICE"
                        value={newProductForm.name}
                        onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="crm-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ margin: 0, fontWeight: 800 }}>Category <span className="req">*</span></label>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                        >
                          {isAddingNewCat ? ' Cancel' : '+ Create New Category'}
                        </button>
                      </div>

                      {isAddingNewCat ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="crm-input"
                            placeholder="e.g. Soups & Salads"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-create-order-primary"
                            style={{ padding: '8px 14px', fontSize: '13px', flexShrink: 0 }}
                            onClick={handleAddCustomCategory}
                          >
                            Add Category
                          </button>
                        </div>
                      ) : (
                        <select
                          className="crm-input"
                          value={newProductForm.category}
                          onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                        >
                          {allCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="crm-form-group">
                        <label style={{ fontWeight: 800 }}>Selling Price (₹) <span className="req">*</span></label>
                        <input
                          type="number"
                          className="crm-input"
                          placeholder="e.g. 180"
                          value={newProductForm.price}
                          onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                          required
                        />
                      </div>

                      <div className="crm-form-group">
                        <label style={{ fontWeight: 800 }}>Original Price / MRP (₹)</label>
                        <input
                          type="number"
                          className="crm-input"
                          placeholder="e.g. 240"
                          value={newProductForm.originalPrice || ''}
                          onChange={(e) => setNewProductForm({ ...newProductForm, originalPrice: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Live Discount Calculation Badge */}
                    {Number(newProductForm.originalPrice) > Number(newProductForm.price) && Number(newProductForm.price) > 0 && (
                      <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔥 Discount Calculated:</span>
                          <span style={{ background: '#10B981', color: '#FFF', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>
                            {Math.round(((Number(newProductForm.originalPrice) - Number(newProductForm.price)) / Number(newProductForm.originalPrice)) * 100)}% OFF
                          </span>
                          <span style={{ color: '#059669', fontSize: '12px' }}>(Save ₹{Number(newProductForm.originalPrice) - Number(newProductForm.price)})</span>
                        </div>
                      </div>
                    )}

                    {/* Toggle Option: Show or Hide Discount Tag on Customer Menu */}
                    <div className="crm-form-group" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '10px 14px', borderRadius: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={newProductForm.showDiscountTag !== false}
                            onChange={(e) => setNewProductForm({ ...newProductForm, showDiscountTag: e.target.checked })}
                            style={{ width: '17px', height: '17px', accentColor: '#1D4ED8' }}
                          />
                          <div>
                            <span>🏷️ Show % OFF Badge &amp; Strikethrough Price on Menu</span>
                            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 400, marginTop: '1px' }}>
                              Enable to show discount tag (e.g. 25% OFF) to customers on storefront.
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: (newProductForm.showDiscountTag !== false) ? '#DCFCE7' : '#F1F5F9', color: (newProductForm.showDiscountTag !== false) ? '#15803D' : '#64748B' }}>
                          {(newProductForm.showDiscountTag !== false) ? 'SHOW ON MENU' : 'HIDE'}
                        </span>
                      </label>
                    </div>

                      <div className="crm-form-group">
                        <label style={{ fontWeight: 800 }}>Dietary Type</label>
                        <div className="crm-dietary-toggle-group">
                          <button
                            type="button"
                            className={`crm-dietary-pill-option ${newProductForm.isVeg === true ? 'veg-active' : ''}`}
                            onClick={() => setNewProductForm({ ...newProductForm, isVeg: true })}
                          >
                            <span className="crm-veg-dot" /> Veg
                          </button>
                          <button
                            type="button"
                            className={`crm-dietary-pill-option ${newProductForm.isVeg === false ? 'nonveg-active' : ''}`}
                            onClick={() => setNewProductForm({ ...newProductForm, isVeg: false })}
                          >
                            <span className="crm-nonveg-dot" /> Non-Veg
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="crm-form-group" style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', padding: '10px 14px', borderRadius: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 800, color: '#C2410C', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={newProductForm.isSpecial || false}
                          onChange={(e) => setNewProductForm({ ...newProductForm, isSpecial: e.target.checked })}
                          style={{ width: '17px', height: '17px', accentColor: '#FF5E14' }}
                        />
                        <span>⭐ Mark as Chef's Special / Featured Dish</span>
                      </label>
                    </div>

                    <div className="crm-form-group">
                      <label style={{ fontWeight: 800 }}>Small Description</label>
                      <textarea
                        rows={3}
                        className="crm-input"
                        placeholder="e.g. Oversized New York style slice loaded with mozzarella & Italian herbs."
                        value={newProductForm.desc}
                        onChange={(e) => setNewProductForm({ ...newProductForm, desc: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Food Photo Upload & Quick Presets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* MULTI-PHOTO GALLERY PICKER */}
                    <div className="crm-food-photo-card" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <label style={{ margin: 0, fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                            Upload Food Photos ({newProductForm.images?.length || (newProductForm.image ? 1 : 0)})
                          </label>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                            Select single or multiple photos. First photo will be main card photo.
                          </div>
                        </div>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => setShowAddUrlInput(!showAddUrlInput)}
                        >
                          {showAddUrlInput ? ' Hide URL' : '+ Add Image URL'}
                        </button>
                      </div>

                      {/* Main Active Photo Preview Box */}
                      <div
                        className="crm-food-photo-preview-box"
                        style={{ height: '180px', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', marginBottom: '12px', position: 'relative', cursor: 'pointer' }}
                        onClick={() => document.getElementById('addDishMultiFileInput').click()}
                      >
                        {(newProductForm.images?.[0] || productLogoPreview || newProductForm.image) ? (
                          <img src={newProductForm.images?.[0] || productLogoPreview || newProductForm.image} alt="Dish Main Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', paddingTop: '50px' }}>
                            📷 Click to Upload Computer / Mobile Photos
                          </div>
                        )}
                        <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15,23,42,0.8)', color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                          ★ Main Cover Photo
                        </span>
                      </div>

                      {/* Thumbnails list of multiple uploaded photos */}
                      {(newProductForm.images && newProductForm.images.length > 0) && (
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
                          {newProductForm.images.map((imgUrl, imgIdx) => (
                            <div
                              key={imgIdx}
                              style={{
                                position: 'relative',
                                width: '60px',
                                height: '60px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: imgIdx === 0 ? '2.5px solid #FF5E14' : '1px solid #CBD5E1',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                              onClick={() => {
                                const reordered = [imgUrl, ...newProductForm.images.filter((_, idx) => idx !== imgIdx)];
                                setNewProductForm({ ...newProductForm, images: reordered, image: imgUrl });
                              }}
                              title={imgIdx === 0 ? 'Main Cover Photo' : 'Click to set as Main Cover'}
                            >
                              <img src={imgUrl} alt={`Uploaded ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  const filtered = newProductForm.images.filter((_, idx) => idx !== imgIdx);
                                  setNewProductForm({
                                    ...newProductForm,
                                    images: filtered,
                                    image: filtered[0] || '',
                                  });
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Remove Photo"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* File Upload Input & Buttons */}
                      <input
                        id="addDishMultiFileInput"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleProductMultiImageChange(e, false)}
                        style={{ display: 'none' }}
                      />

                      <button
                        type="button"
                        className="crm-btn-secondary"
                        style={{ fontSize: '12.5px', padding: '8px 14px', width: '100%', justifyContent: 'center', marginBottom: '10px', fontWeight: 800, backgroundColor: '#FFFFFF' }}
                        onClick={() => document.getElementById('addDishMultiFileInput').click()}
                      >
                         Choose Photos from Computer / Mobile (Multiple)
                      </button>

                      {showAddUrlInput && (
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          <input
                            type="text"
                            className="crm-input"
                            style={{ fontSize: '12px', padding: '6px 10px', flex: 1 }}
                            placeholder="Paste photo URL (e.g. Unsplash)"
                            id="addCustomUrlField"
                          />
                          <button
                            type="button"
                            className="crm-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                            onClick={() => {
                              const el = document.getElementById('addCustomUrlField');
                              const urlVal = (el ? el.value : '').trim();
                              if (urlVal) {
                                const current = newProductForm.images || [];
                                const updated = [...current, urlVal];
                                setNewProductForm({ ...newProductForm, images: updated, image: updated[0] });
                                if (el) el.value = '';
                                addToast('Added photo to gallery!');
                              }
                            }}
                          >
                            + Add URL
                          </button>
                        </div>
                      )}

                      {/* Preset Food Photos Buttons */}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>Or Quick Add Preset Photo:</span>
                        <div className="crm-photo-presets-grid">
                          {[
                            { label: ' Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Thali', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281829?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Drink', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80' },
                            { label: ' Dessert', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80' },
                          ].map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              className="crm-photo-preset-btn"
                              onClick={() => {
                                const currentImgs = newProductForm.images || [];
                                const updated = [...currentImgs, p.url];
                                setNewProductForm({ ...newProductForm, image: updated[0], images: updated });
                              }}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => {
                    setIsAddProductModalOpen(false);
                    setProductLogoFile(null);
                    setProductLogoPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create-order-primary">
                  <Check size={18} />
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3: ADVANCED CREATE COUPON & EXPERIMENTAL OFFER BUILDER MODAL
          ========================================================================== */}
      {isCreateCouponOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsCreateCouponOpen(false)}>
          <div className="crm-modal-card crm-coupon-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>
                  {editingCouponObj ? `Edit Promocode (${editingCouponObj.code})` : 'Create Coupon & Offer Promocode'}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Supports % OFF, Flat ₹ Cash Minus, BOGO, Referral &amp; Combos (Default 20-Day Expiry)
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsCreateCouponOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit}>
              <div className="crm-modal-body" style={{ gap: '16px' }}>
                {/* 1. Offer Type Selector */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>Offer Type / Campaign Category *</label>
                  <div className="crm-offer-type-selector">
                    {[
                      { id: 'percentage', label: '% Percentage OFF' },
                      { id: 'flat', label: '₹ Flat Cash Minus' },
                      { id: 'bogo', label: ' Buy 1 Get 1 Free' },
                      { id: 'referral', label: ' Refer & Earn' },
                      { id: 'combo', label: ' Combo Bundle' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`crm-offer-type-btn ${newCouponForm.type === t.id ? 'active' : ''}`}
                        onClick={() => {
                          setNewCouponForm({ ...newCouponForm, type: t.id });
                        }}
                      >
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Promocode Code Input & Auto Generator */}
                <div className="crm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0, fontWeight: 800 }}>Coupon Promocode *</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                      onClick={handleGenerateRandomCouponCode}
                    >
                       Auto Code
                    </button>
                  </div>
                  <input
                    type="text"
                    className="crm-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.05em' }}
                    placeholder="e.g. FEST20, FLAT50, BOGO2026"
                    value={newCouponForm.code}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                {/* 3. Dynamic Discount Amount / Details based on selected type */}
                {newCouponForm.type === 'percentage' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontWeight: 800 }}>Discount Percentage (%) *</label>
                      <input
                        type="number"
                        className="crm-input"
                        placeholder="e.g. 20"
                        value={newCouponForm.discountValue}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: e.target.value })}
                        required
                      />
                    </div>
                    <div className="crm-form-group">
                      <label style={{ fontWeight: 800 }}>Max Discount Cap (₹)</label>
                      <input
                        type="number"
                        className="crm-input"
                        placeholder="e.g. 100 (Optional)"
                        value={newCouponForm.maxDiscount}
                        onChange={(e) => setNewCouponForm({ ...newCouponForm, maxDiscount: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {newCouponForm.type === 'flat' && (
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>Flat Discount / Bill Minus Amount (₹) *</label>
                    <input
                      type="number"
                      className="crm-input"
                      placeholder="e.g. 50 (Deducts ₹50 directly from total bill)"
                      value={newCouponForm.discountValue}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: e.target.value })}
                      required
                    />
                    <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: 700 }}>
                       Diner gets flat ₹{newCouponForm.discountValue || 50} subtracted directly from their final checkout bill.
                    </div>
                  </div>
                )}

                {newCouponForm.type === 'bogo' && (
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>BOGO Offer Description *</label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. Buy 1 Medium Pizza Get 1 Free"
                      value={newCouponForm.description}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, description: e.target.value })}
                      required
                    />
                  </div>
                )}

                {newCouponForm.type === 'referral' && (
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>Referral Cashback Amount (₹) *</label>
                    <input
                      type="number"
                      className="crm-input"
                      placeholder="e.g. 50 Cashback for Referrer & Friend"
                      value={newCouponForm.discountValue}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: e.target.value })}
                      required
                    />
                  </div>
                )}

                {newCouponForm.type === 'combo' && (
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>Combo Special Title *</label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. Family Meal Combo Pack - Flat ₹100 OFF"
                      value={newCouponForm.description}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, description: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* 4. Minimum Order Amount & Target Customer Mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>Minimum Order Amount (₹)</label>
                    <input
                      type="number"
                      className="crm-input"
                      placeholder="e.g. 299 (0 for no minimum)"
                      value={newCouponForm.minOrder}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, minOrder: e.target.value })}
                    />
                  </div>

                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} color="#FF5E14" /> Target Mobile Number (Optional)
                    </label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. 9876543210 (Blank = All)"
                      value={newCouponForm.assignedCustomerPhone}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, assignedCustomerPhone: e.target.value })}
                    />
                  </div>
                </div>

                {/* 5. Expiration Date (Default: +20 Days, Editable Date Picker + Presets) */}
                <div className="crm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ margin: 0, fontWeight: 800 }}>Expiration Date (Default: 20 Days)</label>
                    <span style={{ fontSize: '12px', color: '#FF5E14', fontWeight: 800 }}>
                      {formatExpiryDisplay(newCouponForm.expiryDate)}
                    </span>
                  </div>

                  <input
                    type="date"
                    className="crm-input"
                    value={newCouponForm.expiryDate}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, expiryDate: e.target.value })}
                    required
                  />

                  {/* Preset Duration Buttons */}
                  <div className="crm-preset-days-grid">
                    {[
                      { label: '7 Days', days: 7 },
                      { label: '20 Days (Default)', days: 20 },
                      { label: '30 Days', days: 30 },
                      { label: '60 Days', days: 60 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className={`crm-preset-day-btn ${newCouponForm.expiryDate === get20DaysAheadDate(p.days) ? 'active' : ''}`}
                        onClick={() => setNewCouponForm({ ...newCouponForm, expiryDate: get20DaysAheadDate(p.days) })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Live Coupon Preview Box */}
                <div className="crm-coupon-preview-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '15px', color: '#92400E' }}>
                       {newCouponForm.code || 'CODE'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#C2410C', background: '#FFFFFF', padding: '2px 8px', borderRadius: '12px' }}>
                      ● Active
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#78350F' }}>
                    {newCouponForm.type === 'percentage'
                      ? `${newCouponForm.discountValue || 0}% OFF${newCouponForm.maxDiscount ? ` up to ₹${newCouponForm.maxDiscount}` : ''}`
                      : newCouponForm.type === 'flat'
                      ? `Flat ₹${newCouponForm.discountValue || 0} OFF (-₹${newCouponForm.discountValue || 0} Total)`
                      : newCouponForm.type === 'bogo'
                      ? `Buy 1 Get 1 Free`
                      : newCouponForm.type === 'referral'
                      ? `Refer & Earn ₹${newCouponForm.discountValue || 50} Cashback`
                      : (newCouponForm.description || 'Combo Special')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#92400E', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Min Order: <b>₹{newCouponForm.minOrder || 0}</b></span>
                    <span>⏱ {formatExpiryDisplay(newCouponForm.expiryDate)}</span>
                  </div>
                </div>
              </div>

              <div className="crm-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                {editingCouponObj ? (
                  <button
                    type="button"
                    className="crm-btn-secondary"
                    onClick={() => {
                      setIsCreateCouponOpen(false);
                      handleDeleteCoupon(editingCouponObj);
                      setEditingCouponObj(null);
                    }}
                    style={{ color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Promocode</span>
                  </button>
                ) : (
                  <div />
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="crm-btn-secondary"
                    onClick={() => {
                      setIsCreateCouponOpen(false);
                      setEditingCouponObj(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-create-order-primary">
                    <Check size={18} />
                    <span>{editingCouponObj ? 'Save Changes' : 'Activate Coupon'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3.5: CONFIGURE BIRTHDAY GREETING & COUPON MODAL
          ========================================================================== */}
      {isEditBdayModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsEditBdayModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}> Configure Birthday Offer &amp; Message</h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Set custom happy birthday message template and offer coupon code.
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsEditBdayModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addToast('Birthday Greeting & Coupon Settings Saved!', <Check size={18} />);
                setIsEditBdayModalOpen(false);
              }}
            >
              <div className="crm-modal-body" style={{ gap: '16px' }}>
                {/* Auto-Send Toggle inside Modal */}
                <div style={{ background: '#FFF7ED', border: '1.5px solid #FDBA74', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#9A3412' }}>
                      Automatic Birthday Dispatch Switch
                    </div>
                    <div style={{ fontSize: '12px', color: '#C2410C' }}>
                      When ON, system automatically sends birthday offers on customer birthdays.
                    </div>
                  </div>

                  <label className="crm-blue-switch" style={{ width: '46px', height: '24px' }}>
                    <input
                      type="checkbox"
                      checked={bdayAutoSend}
                      onChange={handleToggleBdayAutoSend}
                    />
                    <span className="crm-blue-slider" style={{ borderRadius: '24px' }} />
                  </label>
                </div>

                {/* Coupon Code Select / Input */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>Select or Enter Birthday Promocode *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <select
                      className="crm-input"
                      value={bdayConfig.couponCode}
                      onChange={(e) => {
                        const selCode = e.target.value;
                        const match = (coupons || []).find((cp) => cp.code === selCode);
                        setBdayConfig((prev) => ({
                          ...prev,
                          couponCode: selCode,
                          offerDetail: match ? match.discount : prev.offerDetail,
                        }));
                      }}
                    >
                      <option value="BDAYSPECIAL">BDAYSPECIAL (Default)</option>
                      {(coupons || []).map((cp) => (
                        <option key={cp.code} value={cp.code}>
                          {cp.code} - ({cp.discount})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. BDAYSPECIAL"
                      value={bdayConfig.couponCode}
                      onChange={(e) => setBdayConfig({ ...bdayConfig, couponCode: e.target.value.toUpperCase() })}
                      style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 800 }}
                      required
                    />
                  </div>
                </div>

                {/* Offer Detail */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>Offer Detail / Freebie Description *</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Free Choco Lava Cake + 20% OFF"
                    value={bdayConfig.offerDetail}
                    onChange={(e) => setBdayConfig({ ...bdayConfig, offerDetail: e.target.value })}
                    required
                  />
                </div>

                {/* Happy Birthday Message Template */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>Happy Birthday WhatsApp &amp; Push Greeting Template *</label>
                  <textarea
                    className="crm-input"
                    rows={4}
                    value={bdayConfig.message}
                    onChange={(e) => setBdayConfig({ ...bdayConfig, message: e.target.value })}
                    placeholder="Use placeholders: {name}, {offer}, {code}, {storeName}"
                    required
                    style={{ lineHeight: 1.5 }}
                  />
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                    Placeholders: <code>{`{name}`}</code>, <code>{`{offer}`}</code>, <code>{`{code}`}</code>, <code>{`{storeName}`}</code>
                  </div>
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => setIsEditBdayModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create-order-primary">
                  <Check size={18} />
                  <span>Save Birthday Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3.6: CREATE CUSTOMER GROUP MODAL (Smart Filters)
          ========================================================================== */}
      {isAddGroupModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddGroupModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>+ Create Customer Intelligence Group</h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Filter users by Bill Spend, Days of Week (Mon-Sun), and Food Order Categories.
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsAddGroupModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerGroupSubmit}>
              <div className="crm-modal-body" style={{ gap: '16px' }}>
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>Group Name *</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Weekend VIP Party Diners"
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>Group Description / Purpose</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Target for high-value weekend combo deals"
                    value={newGroupForm.description}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                  />
                </div>

                {/* Filter 1: Bill Spend Range */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>1. Filter by Bill Spending Range</label>
                  <select
                    className="crm-input"
                    value={newGroupForm.spendRule}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, spendRule: e.target.value })}
                  >
                    <option value="all">All Spending Levels (Default)</option>
                    <option value="high">High Spenders (Total Spend &gt; ₹500)</option>
                    <option value="mid">Regular Spenders (Total Spend ₹200 - ₹500)</option>
                    <option value="budget">Budget Diners (Total Spend &lt; ₹200)</option>
                  </select>
                </div>

                {/* Filter 2: Preferred Order Days */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>2. Filter by Ordering Days of Week</label>
                  <select
                    className="crm-input"
                    value={newGroupForm.daysRule}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, daysRule: e.target.value })}
                  >
                    <option value="all">All Days (Mon - Sun)</option>
                    <option value="weekend">Weekend Diners (Fri, Sat, Sun)</option>
                    <option value="weekday">Weekday Diners (Mon, Tue, Wed, Thu)</option>
                  </select>
                </div>

                {/* Filter 3: Preferred Food Category */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>3. Filter by Food Category Preference</label>
                  <select
                    className="crm-input"
                    value={newGroupForm.foodCategory}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, foodCategory: e.target.value })}
                  >
                    <option value="all">All Food Categories</option>
                    <option value="Fast Food">Fast Food, Pizzas &amp; Burgers</option>
                    <option value="Main Course">Main Course &amp; Thali Diners</option>
                    <option value="Beverages">Beverages, Drinks &amp; Desserts</option>
                  </select>
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => setIsAddGroupModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create-order-primary">
                  <Check size={18} />
                  <span>Create Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3.7: GROUP ANALYTICS & MEMBERS DRAWER MODAL
          ========================================================================== */}
      {activeGroupDetail && (
        <div className="crm-modal-backdrop" onClick={() => setActiveGroupDetail(null)}>
          <div className="crm-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>{activeGroupDetail.name} Analytics</h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {activeGroupDetail.description}
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setActiveGroupDetail(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="crm-modal-body" style={{ gap: '16px' }}>
              {/* Group KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>MEMBERS</span>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#1D4ED8' }}>
                    {activeGroupDetail.memberIds ? activeGroupDetail.memberIds.length : 3} Users
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>GROUP AVG BILL</span>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>
                    ₹{activeGroupDetail.avgBill || 450}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>FAVORITE FOOD</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                    {activeGroupDetail.favoriteItem || 'Paneer Butter Masala'}
                  </div>
                </div>
              </div>

              {/* Members List */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  Group Members List:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {(customers || []).slice(0, 4).map((c) => (
                    <div key={c.id || c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>{c.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{c.phone}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1D4ED8' }}>₹{(c.totalSales || 2400).toLocaleString()}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748B' }}>{c.ordersCount || 5} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="crm-modal-footer">
              <button
                type="button"
                className="crm-btn-secondary"
                onClick={() => setActiveGroupDetail(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-create-order-primary"
                onClick={() => {
                  setCampaignTargetGroup(activeGroupDetail.id);
                  setActiveGroupDetail(null);
                  setActiveTab('marketing');
                  addToast(`Targeting campaign for ${activeGroupDetail.name}!`, <Sparkles size={16} />);
                }}
              >
                <Megaphone size={16} />
                <span>Target Offer in Marketing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3.8: CUSTOM PUSH & WHATSAPP NOTIFICATION BROADCAST MODAL
          ========================================================================== */}
      {isCustomNotifyModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsCustomNotifyModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}> Custom Push &amp; WhatsApp Notification Broadcast</h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Send personal custom message to a specific customer, all users, random N customers, or group.
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsCustomNotifyModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendCustomNotificationSubmit}>
              <div className="crm-modal-body" style={{ gap: '16px' }}>
                {/* Target Audience Mode Selector */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>1. Select Target Audience / Recipients *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    {[
                      { id: 'all_users', label: ' All Customers Broadcast' },
                      { id: 'specific_user', label: ' Specific Personal Customer' },
                      { id: 'random_n', label: ' Random N Customers' },
                      { id: 'group', label: ' Smart Customer Group' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        className={`crm-offer-type-btn ${notifyAudienceMode === mode.id ? 'active' : ''}`}
                        onClick={() => setNotifyAudienceMode(mode.id)}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional inputs based on audience mode */}
                {notifyAudienceMode === 'specific_user' && (
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>Select Specific Customer *</label>
                    <select
                      className="crm-input"
                      value={selectedCustId}
                      onChange={(e) => {
                        setSelectedCustId(e.target.value);
                        const match = (customers || []).find((c) => (c.id || c._id) === e.target.value);
                        if (match) {
                          setNotifyTitle(` Special Personal Offer for ${match.name}`);
                          setNotifyMessage(`Hi ${match.name}! Enjoy a special treat from us at ${storeControls.restName || 'FoodyPay Store'}. Use code FEST20!`);
                        }
                      }}
                    >
                      <option value="">-- Choose Customer --</option>
                      {(customers || []).map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name} ({c.phone}) - {c.ordersCount || 1} orders
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {notifyAudienceMode === 'random_n' && (
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>How many Random Customers to target? *</label>
                    <input
                      type="number"
                      className="crm-input"
                      placeholder="e.g. 5"
                      value={randomNotifyCount}
                      onChange={(e) => setRandomNotifyCount(e.target.value)}
                    />
                  </div>
                )}

                {notifyAudienceMode === 'group' && (
                  <div className="crm-form-group">
                    <label style={{ fontWeight: 800 }}>Select Target Smart Customer Group *</label>
                    <select
                      className="crm-input"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                    >
                      {(customerGroups || []).map((grp) => (
                        <option key={grp.id} value={grp.id}>
                          {grp.name} ({grp.memberIds ? grp.memberIds.length : 3} Members)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delivery Channel Selector */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>2. Delivery Channel *</label>
                  <select
                    className="crm-input"
                    value={notifyChannel}
                    onChange={(e) => setNotifyChannel(e.target.value)}
                  >
                    <option value="push_whatsapp"> WhatsApp &amp; Mobile Push Notification (Combined)</option>
                    <option value="whatsapp_only"> WhatsApp Message Only</option>
                    <option value="push_only"> Mobile Push Notification Only</option>
                  </select>
                </div>

                {/* Notification Title */}
                <div className="crm-form-group">
                  <label style={{ fontWeight: 800 }}>3. Notification Heading / Subject *</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g.  Special Discount Just For You!"
                    value={notifyTitle}
                    onChange={(e) => setNotifyTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Quick Message Templates */}
                <div className="crm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ margin: 0, fontWeight: 800 }}>4. Message Text Content *</label>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>Use <code>{`{name}`}</code>, <code>{`{storeName}`}</code></span>
                  </div>

                  {/* Preset Template Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '6px 0' }}>
                    {[
                      {
                        label: ' We Miss You (15% OFF)',
                        title: ' We Miss Seeing You at FoodyPay!',
                        msg: 'Hey {name}! We miss your visit at {storeName}. Enjoy 15% OFF on your order today! Code: MISSU15',
                      },
                      {
                        label: ' Weekend Party Deal',
                        title: ' Weekend Pizza & Starter Combo Offer',
                        msg: 'Weekend alert! Enjoy free Garlic Bread on Large Pizza orders at {storeName}. Order on table QR now!',
                      },
                      {
                        label: '⭐ VIP Exclusive Cashback',
                        title: '⭐ Exclusive VIP ₹100 Cashback Voucher',
                        msg: 'Dear {name}, as a valued VIP diner, here is flat ₹100 OFF on your next bill at {storeName}. Code: VIP100',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setNotifyTitle(preset.title);
                          setNotifyMessage(preset.msg);
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="crm-input"
                    rows={4}
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    placeholder="Type your notification message..."
                    required
                    style={{ lineHeight: 1.5 }}
                  />
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => setIsCustomNotifyModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create-order-primary">
                  <Bell size={18} />
                  <span>Send Broadcast Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 4: ADD / EDIT TABLE QR CUSTOMIZER MODAL (Wide 2-Column Split with Live Real-Time Preview)
          ========================================================================== */}
      {isAddTableModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddTableModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="crm-modal-card crm-modal-card-wide" style={{ maxWidth: '940px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header" style={{ padding: '16px 24px', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>
                  {editingTableObj ? `Edit ${editingTableObj.name} QR Code` : '+ Add Table QR & Customizer'}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                  Customize theme, logo, and colors with live real-time preview on the right.
                </div>
              </div>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsAddTableModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTableSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="crm-manual-order-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px', gap: '18px', display: 'flex' }}>
                {/* LEFT COLUMN: FORM INPUTS & CUSTOMIZER */}
                <div className="crm-pos-left-col" style={{ width: '460px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Table Name & Pax */}
                  <div className="crm-form-grid" style={{ gap: '10px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Table Name / Number *</label>
                      <input
                        ref={tableNameRef}
                        type="text"
                        className="crm-input"
                        placeholder="e.g. Table 1 or VIP Booth 4"
                        value={tableForm.name}
                        onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                        onKeyDown={(e) => handleTableInputKeyDown(e, 0)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="crm-form-group">
                      <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Capacity (Pax)</label>
                      <input
                        ref={tableCapacityRef}
                        type="number"
                        className="crm-input"
                        placeholder="4"
                        value={tableForm.capacity}
                        onChange={(e) => setTableForm({ ...tableForm, capacity: e.target.value })}
                        onKeyDown={(e) => handleTableInputKeyDown(e, 1)}
                      />
                    </div>
                  </div>

                  {/* Section & Purpose */}
                  <div className="crm-form-grid" style={{ gap: '10px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Section / Area</label>
                      <input
                        ref={tableSectionRef}
                        type="text"
                        className="crm-input"
                        placeholder="e.g. Indoor AC Dining"
                        value={tableForm.section}
                        onChange={(e) => setTableForm({ ...tableForm, section: e.target.value })}
                        onKeyDown={(e) => handleTableInputKeyDown(e, 2)}
                      />
                    </div>

                    <div className="crm-form-group">
                      <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Purpose / Label</label>
                      <input
                        ref={tablePurposeRef}
                        type="text"
                        className="crm-input"
                        placeholder="e.g. Contactless Self Ordering"
                        value={tableForm.purpose}
                        onChange={(e) => setTableForm({ ...tableForm, purpose: e.target.value })}
                        onKeyDown={(e) => handleTableInputKeyDown(e, 3)}
                      />
                    </div>
                  </div>

                  {/* Standee Theme Selector (3 Themes) */}
                  <div className="crm-form-group">
                    <label style={{ fontSize: '12.5px', fontWeight: 700 }}>Select Standee Theme (3 Distinct Styles)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      {[
                        { key: 'acrylic', label: 'Acrylic Clean', bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A' },
                        { key: 'luxury', label: 'Luxury Gold', bg: '#0F172A', border: '#F59E0B', text: '#F59E0B' },
                        { key: 'neon', label: 'Vibrant Neon', bg: '#FF5E14', border: '#FF5E14', text: '#FFFFFF' },
                      ].map((th) => (
                        <button
                          key={th.key}
                          type="button"
                          onClick={() => {
                            const nextQrColor = th.key === 'luxury' ? '#F59E0B' : th.key === 'neon' ? '#FF5E14' : '#1E293B';
                            const nextCornerColor = th.key === 'luxury' ? '#F59E0B' : '#FF5E14';
                            setTableForm({ ...tableForm, theme: th.key, qrColor: nextQrColor, cornerColor: nextCornerColor });
                          }}
                          style={{
                            padding: '9px 6px',
                            borderRadius: '10px',
                            border: `2px solid ${tableForm.theme === th.key ? '#FF5E14' : th.border}`,
                            backgroundColor: th.bg,
                            color: th.text,
                            fontWeight: 800,
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: tableForm.theme === th.key ? '0 0 10px rgba(255, 94, 20, 0.4)' : 'none'
                          }}
                        >
                          {th.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Custom Logo for QR Code */}
                  <div className="crm-form-group" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '10px 14px', borderRadius: '12px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={15} color="#FF5E14" />
                      <span>Upload Custom Logo for Center of QR Code</span>
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: '2px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {tableLogoPreview ? (
                          <img src={tableLogoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Upload size={16} color="#64748B" />
                        )}
                      </div>
                      <input
                        id="tableLogoFileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleTableLogoChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="crm-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => document.getElementById('tableLogoFileInput').click()}
                      >
                        {tableLogoFile ? tableLogoFile.name : 'Choose Custom Logo...'}
                      </button>
                      {tableLogoPreview && (
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                          onClick={() => {
                            setTableLogoFile(null);
                            setTableLogoPreview(null);
                            setTableForm((prev) => ({ ...prev, logoUrl: '' }));
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR Module & Corner Accent Colors + Quick Preset Swatches */}
                  <div className="crm-form-grid" style={{ gap: '10px' }}>
                    <div className="crm-form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>QR Module Color</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={tableForm.qrColor}
                          onChange={(e) => setTableForm({ ...tableForm, qrColor: e.target.value })}
                          style={{ width: '34px', height: '34px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }}
                        />
                        <input
                          ref={tableQrColorRef}
                          type="text"
                          className="crm-input"
                          value={tableForm.qrColor}
                          onChange={(e) => setTableForm({ ...tableForm, qrColor: e.target.value })}
                          onKeyDown={(e) => handleTableInputKeyDown(e, 4)}
                          style={{ fontFamily: 'monospace', fontSize: '12.5px', padding: '6px 8px' }}
                        />
                      </div>
                    </div>

                    <div className="crm-form-group">
                      <label style={{ fontSize: '12px', fontWeight: 700 }}>Corner Accent Color</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={tableForm.cornerColor}
                          onChange={(e) => setTableForm({ ...tableForm, cornerColor: e.target.value })}
                          style={{ width: '34px', height: '34px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }}
                        />
                        <input
                          ref={tableCornerColorRef}
                          type="text"
                          className="crm-input"
                          value={tableForm.cornerColor}
                          onChange={(e) => setTableForm({ ...tableForm, cornerColor: e.target.value })}
                          onKeyDown={(e) => handleTableInputKeyDown(e, 5)}
                          style={{ fontFamily: 'monospace', fontSize: '12.5px', padding: '6px 8px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Color Swatches */}
                  <div className="crm-form-group">
                    <label style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Preset Color Palettes:</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      {[
                        { name: 'Dark', qr: '#1E293B', corner: '#FF5E14' },
                        { name: 'Gold', qr: '#F59E0B', corner: '#F59E0B' },
                        { name: 'Orange', qr: '#FF5E14', corner: '#FF5E14' },
                        { name: 'Green', qr: '#059669', corner: '#059669' },
                        { name: 'Blue', qr: '#1D4ED8', corner: '#1D4ED8' },
                        { name: 'Purple', qr: '#7C3AED', corner: '#7C3AED' },
                      ].map((sw) => (
                        <button
                          key={sw.name}
                          type="button"
                          title={sw.name}
                          onClick={() => setTableForm({ ...tableForm, qrColor: sw.qr, cornerColor: sw.corner })}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: sw.qr,
                            border: `2px solid ${tableForm.qrColor === sw.qr ? '#0F172A' : '#CBD5E1'}`,
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: LIVE REAL-TIME STANDEE & QR PREVIEW */}
                <div className="crm-pos-right-col" style={{ flex: '1 1 340px', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={15} color="#FF5E14" />
                    <span>LIVE REAL-TIME STANDEE PREVIEW</span>
                  </div>

                  {/* THEMED PREVIEW CARD */}
                  <div
                    style={{
                      width: '250px',
                      borderRadius: '22px',
                      padding: '20px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      backgroundColor: tableForm.theme === 'luxury' ? '#0F172A' : tableForm.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                      color: tableForm.theme === 'luxury' ? '#F59E0B' : tableForm.theme === 'neon' ? '#FFFFFF' : '#0F172A',
                      border: tableForm.theme === 'luxury' ? '3px solid #F59E0B' : tableForm.theme === 'neon' ? '3px solid #FF5E14' : '3px solid #0F172A',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', letterSpacing: '-0.01em' }}>
                      {storeControls.restName || "My Restaurant"}
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        padding: '4px 14px',
                        borderRadius: '16px',
                        backgroundColor: tableForm.theme === 'luxury' ? '#F59E0B' : tableForm.theme === 'neon' ? '#FFFFFF' : '#FF5E14',
                        color: tableForm.theme === 'luxury' ? '#0F172A' : tableForm.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                        marginBottom: '10px',
                        letterSpacing: '0.04em',
                        boxShadow: '0 3px 10px rgba(255, 94, 20, 0.25)',
                      }}
                    >
                      {tableForm.name || 'Table 1'}
                    </div>

                    <div
                      style={{
                        padding: '10px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1.5px solid #E2E8F0',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                        display: 'inline-flex',
                      }}
                    >
                      <QrCodeComponent
                        text={getUniqueTableUrl(tableForm.name, tableForm.url)}
                        size={140}
                        qrColor={tableForm.qrColor}
                        cornerColor={tableForm.cornerColor}
                        showLogo={true}
                        logoUrl={tableLogoPreview || tableForm.logoUrl || storeControls.logoUrl || ''}
                        bgColor="#FFFFFF"
                      />
                    </div>

                    <div style={{ fontSize: '11px', marginTop: '10px', fontWeight: 400, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <QrCode size={13} />
                      <span>{tableForm.purpose || 'Contactless Self Ordering'}</span>
                    </div>

                    {/* POWERED BY FOODYPAY BRANDING */}
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: tableForm.theme === 'neon' ? '1px dashed rgba(255,255,255,0.3)' : '1px dashed #E2E8F0',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: tableForm.theme === 'neon' ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      <Sparkles size={12} color={tableForm.theme === 'neon' ? '#FFFFFF' : '#FF5E14'} />
                      <span style={{ opacity: 0.85 }}>Powered by</span>
                      <span style={{ color: tableForm.theme === 'neon' ? '#FFFFFF' : '#FF5E14', fontWeight: 500, fontSize: '11.5px' }}>
                        FoodyPay
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="crm-modal-footer" style={{ padding: '14px 24px', borderTop: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexShrink: 0 }}>
                {editingTableObj ? (
                  <button
                    type="button"
                    className="crm-btn-secondary"
                    onClick={() => {
                      setIsAddTableModalOpen(false);
                      handleDeleteTable(editingTableObj);
                    }}
                    style={{ color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2' }}
                  >
                    <Trash2 size={16} />
                    <span>Delete QR</span>
                  </button>
                ) : (
                  <div />
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="crm-btn-secondary"
                    onClick={() => setIsAddTableModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-create-order-primary">
                    <Check size={18} />
                    <span>Save QR Table</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 5: PRINTABLE TABLE STANDEE MODAL (3 Themes)
          ========================================================================== */}
      {activeStandeeTable && (
        <div className="crm-modal-backdrop" onClick={() => setActiveStandeeTable(null)}>
          <div className="crm-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>{activeStandeeTable.name} Standee ({activeStandeeTable.theme ? activeStandeeTable.theme.toUpperCase() : 'ACRYLIC'})</h3>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setActiveStandeeTable(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="crm-modal-body" style={{ alignItems: 'center' }}>
              {/* THEMED STANDEE CONTAINER */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  borderRadius: '24px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '14px',
                  position: 'relative',
                  backgroundColor: activeStandeeTable.theme === 'luxury' ? '#0F172A' : activeStandeeTable.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                  color: activeStandeeTable.theme === 'luxury' ? '#F59E0B' : activeStandeeTable.theme === 'neon' ? '#FFFFFF' : '#0F172A',
                  border: activeStandeeTable.theme === 'luxury' ? '3px solid #F59E0B' : activeStandeeTable.theme === 'neon' ? '3px solid #FF8C00' : '2px solid #E2E8F0',
                  boxShadow: activeStandeeTable.theme === 'luxury' ? '0 10px 30px rgba(245, 158, 11, 0.25)' : activeStandeeTable.theme === 'neon' ? '0 10px 30px rgba(255, 94, 20, 0.35)' : '0 10px 30px rgba(0,0,0,0.08)'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                  {storeControls.restName || 'Lagan Da Dhaba'}
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '5px 16px',
                    borderRadius: '20px',
                    backgroundColor: activeStandeeTable.theme === 'luxury' ? '#F59E0B' : activeStandeeTable.theme === 'neon' ? '#FFFFFF' : '#FF5E14',
                    color: activeStandeeTable.theme === 'luxury' ? '#0F172A' : activeStandeeTable.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                    letterSpacing: '0.05em',
                    boxShadow: '0 3px 10px rgba(255, 94, 20, 0.25)',
                  }}
                >
                  {(activeStandeeTable.name || 'TABLE 1').toUpperCase()} • {activeStandeeTable.purpose || activeStandeeTable.section || 'Contactless Self Ordering'}
                </div>

                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '18px',
                    border: '1.5px solid #E2E8F0',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                    display: 'inline-flex',
                  }}
                >
                  <QrCodeComponent
                    text={getUniqueTableUrl(activeStandeeTable.name, activeStandeeTable.url)}
                    size={170}
                    showLogo={true}
                    qrColor={activeStandeeTable.qrColor || (activeStandeeTable.theme === 'luxury' ? '#F59E0B' : '#1E293B')}
                    cornerColor={activeStandeeTable.cornerColor || (activeStandeeTable.theme === 'luxury' ? '#F59E0B' : '#FF5E14')}
                    bgColor="#FFFFFF"
                  />
                </div>

                <p style={{ fontSize: '12.5px', margin: 0, opacity: 0.95, lineHeight: 1.4, fontWeight: 400 }}>
                  <span style={{ fontWeight: 500 }}>Scan with Camera to Order &amp; Pay</span>
                  <br />
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>No app download needed • Fast &amp; Contactless</span>
                </p>

                {/* POWERED BY FOODYPAY BRANDING */}
                <div
                  style={{
                    marginTop: '6px',
                    paddingTop: '10px',
                    borderTop: activeStandeeTable.theme === 'neon' ? '1px dashed rgba(255,255,255,0.3)' : '1px dashed #E2E8F0',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: activeStandeeTable.theme === 'neon' ? '#FFFFFF' : '#64748B',
                  }}
                >
                  <Sparkles size={13} color={activeStandeeTable.theme === 'neon' ? '#FFFFFF' : '#FF5E14'} />
                  <span style={{ opacity: 0.85 }}>Powered by</span>
                  <span style={{ color: activeStandeeTable.theme === 'neon' ? '#FFFFFF' : '#FF5E14', fontWeight: 500, fontSize: '12px' }}>
                    FoodyPay
                  </span>
                </div>
              </div>
            </div>

            <div className="crm-modal-footer">
              <button
                type="button"
                className="btn-create-order-primary"
                onClick={() => window.print()}
              >
                <Printer size={16} />
                <span>Print Standee</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 9: STORE REPLY TO CUSTOMER REVIEW
          ========================================================================== */}
      {isReplyModalOpen && activeReplyReview && (
        <div className="crm-modal-backdrop" onClick={() => setIsReplyModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="crm-modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="#1D4ED8" /> Store Reply to {activeReplyReview.customerName}
              </h3>
              <button type="button" className="crm-modal-close-btn" onClick={() => setIsReplyModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid #1D4ED8', fontSize: '13px', color: '#334155' }}>
                <strong>Customer Feedback:</strong> "{activeReplyReview.feedback}"
              </div>

              <div className="crm-form-group">
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Merchant Response Text <span className="req">*</span></label>
                <textarea
                  className="crm-input"
                  rows={4}
                  placeholder="Type your official store response to this customer..."
                  value={replyTextInput}
                  onChange={(e) => setReplyTextInput(e.target.value)}
                  required
                  style={{ resize: 'vertical', fontSize: '13.5px', lineHeight: '1.5' }}
                />
              </div>

              {/* Quick Template Chips */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.5px', marginBottom: '6px' }}>QUICK TEMPLATE RESPONSES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    'Thank you for the wonderful feedback! So glad you enjoyed the food.',
                    'Thank you for dining with us! We look forward to welcoming you again soon.',
                    'We appreciate your feedback! We are optimizing kitchen speed during peak hours.',
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      style={{ fontSize: '12px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
                      onClick={() => setReplyTextInput(tpl)}
                    >
                      "{tpl}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="crm-modal-footer" style={{ marginTop: '8px' }}>
                <button type="button" className="crm-btn-secondary" onClick={() => setIsReplyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#1D4ED8' }}>
                  Save & Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 10: ADD MANUAL CUSTOMER REVIEW & FEEDBACK
          ========================================================================== */}
      {isAddReviewModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddReviewModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="crm-modal-card" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} color="#F59E0B" fill="#F59E0B" /> Add Customer Review & Rating
              </h3>
              <button type="button" className="crm-modal-close-btn" onClick={() => setIsAddReviewModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
              <div className="crm-form-grid" style={{ gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px' }}>Customer Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Rahul Sharma"
                    value={newReviewForm.customerName}
                    onChange={(e) => setNewReviewForm((prev) => ({ ...prev, customerName: e.target.value }))}
                    required
                  />
                </div>

                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px' }}>Mobile Number</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. +91 98765 43210"
                    value={newReviewForm.customerPhone}
                    onChange={(e) => setNewReviewForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="crm-form-grid" style={{ gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px' }}>Table No / Channel</label>
                  <select
                    className="crm-input"
                    value={newReviewForm.tableNo}
                    onChange={(e) => setNewReviewForm((prev) => ({ ...prev, tableNo: e.target.value }))}
                  >
                    <option value="Table 1">Table 1</option>
                    <option value="Table 2">Table 2</option>
                    <option value="Table 3">Table 3</option>
                    <option value="Table 4">Table 4</option>
                    <option value="Takeaway Counter">Takeaway Counter</option>
                    <option value="Direct Delivery">Direct Delivery</option>
                  </select>
                </div>

                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px' }}>Dish / Items Ordered</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Paneer Butter Masala, Garlic Naan"
                    value={newReviewForm.dishOrdered}
                    onChange={(e) => setNewReviewForm((prev) => ({ ...prev, dishOrdered: e.target.value }))}
                  />
                </div>
              </div>

              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px' }}>Star Rating <span className="req">*</span></label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transition: 'transform 0.15s ease',
                        transform: newReviewForm.rating >= star ? 'scale(1.15)' : 'scale(1)',
                      }}
                      onClick={() => setNewReviewForm((prev) => ({ ...prev, rating: star }))}
                    >
                      <Star size={28} fill={newReviewForm.rating >= star ? '#F59E0B' : 'none'} color={newReviewForm.rating >= star ? '#F59E0B' : '#CBD5E1'} />
                    </button>
                  ))}
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', marginLeft: '8px' }}>
                    {newReviewForm.rating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px' }}>Customer Feedback & Comments <span className="req">*</span></label>
                <textarea
                  className="crm-input"
                  rows={3}
                  placeholder="Write the customer's exact feedback comments..."
                  value={newReviewForm.feedback}
                  onChange={(e) => setNewReviewForm((prev) => ({ ...prev, feedback: e.target.value }))}
                  required
                />
              </div>

              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setIsAddReviewModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary">
                  Save Customer Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 11: CREATE / EDIT CUSTOM MEAL COLLECTION BUILDER
          ========================================================================== */}
      {isMealModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsMealModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="crm-modal-card" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header" style={{ padding: '16px 20px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={20} color="#FF5E14" /> {editingMealObj ? `Edit Custom Meal: ${editingMealObj.name}` : '+ Create Custom Meal Combo Collection'}
              </h3>
              <button type="button" className="crm-modal-close-btn" onClick={() => setIsMealModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMealSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="crm-form-grid" style={{ gap: '12px' }}>
                  <div className="crm-form-group">
                    <label style={{ fontSize: '12.5px' }}>Meal Bundle Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. Royal North Indian Thali"
                      value={mealForm.name}
                      onChange={(e) => setMealForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="crm-form-group">
                    <label style={{ fontSize: '12.5px' }}>Category Tag</label>
                    <select
                      className="crm-input"
                      value={mealForm.category}
                      onChange={(e) => setMealForm((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Thali & Full Meals">Thali & Full Meals</option>
                      <option value="Family Combos">Family Combos</option>
                      <option value="Snacks & Drinks">Snacks & Drinks</option>
                      <option value="Breakfast & Tiffin">Breakfast & Tiffin</option>
                      <option value="Party Bundles">Party Bundles</option>
                    </select>
                  </div>
                </div>

                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px' }}>Meal Cover Photo Image URL</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={mealForm.imageUrl}
                    onChange={(e) => setMealForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  />
                  {mealForm.imageUrl && (
                    <div style={{ marginTop: '8px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={mealForm.imageUrl} alt="Meal Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px' }}>Short Description</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Complete wholesome lunch thali with Paneer, Dal, Naan, Rice & Sweet"
                    value={mealForm.description}
                    onChange={(e) => setMealForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* ITEMIZATION BUILDER: Food Items inside Meal */}
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                      Food Items included in Meal Combo
                    </label>
                    <button
                      type="button"
                      style={{ background: '#1D4ED8', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() =>
                        setMealForm((prev) => ({
                          ...prev,
                          items: [...prev.items, { name: '', qty: 1, individualPrice: 0 }],
                        }))
                      }
                    >
                      + Add Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mealForm.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="crm-input"
                          placeholder="Food Item Name (e.g. Paneer Masala)"
                          value={it.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMealForm((prev) => {
                              const copy = [...prev.items];
                              copy[idx].name = val;
                              return { ...prev, items: copy };
                            });
                          }}
                          style={{ flex: 2, fontSize: '12.5px' }}
                        />

                        <input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Qty"
                          value={it.qty}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setMealForm((prev) => {
                              const copy = [...prev.items];
                              copy[idx].qty = val;
                              return { ...prev, items: copy };
                            });
                          }}
                          style={{ width: '60px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', textAlign: 'center' }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={it.individualPrice}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setMealForm((prev) => {
                                const copy = [...prev.items];
                                copy[idx].individualPrice = val;
                                return { ...prev, items: copy };
                              });
                            }}
                            style={{ width: '80px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                          />
                        </div>

                        {mealForm.items.length > 1 && (
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                            onClick={() =>
                              setMealForm((prev) => ({
                                ...prev,
                                items: prev.items.filter((_, i) => i !== idx),
                              }))
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Calculated Sum Summary */}
                  {(() => {
                    const sum = mealForm.items.reduce((s, it) => s + (Number(it.individualPrice) || 0) * (Number(it.qty) || 1), 0);
                    return (
                      <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        <span>Total Individual Value Sum:</span>
                        <span>₹{sum}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* SPECIAL COMBO PRICE SETTER */}
                <div style={{ background: '#DCFCE7', padding: '14px', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 900, color: '#15803D' }}>
                      Special Meal Bundle Discounted Price <span className="req">*</span>
                    </label>
                    <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>
                      Set a discounted price lower than total individual sum to offer attractive savings!
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#15803D' }}>₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 499"
                      value={mealForm.comboPrice}
                      onChange={(e) => setMealForm((prev) => ({ ...prev, comboPrice: e.target.value }))}
                      style={{ width: '100px', padding: '8px 10px', borderRadius: '8px', border: '2px solid #16A34A', fontWeight: 900, fontSize: '16px', textAlign: 'center' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="crm-modal-footer" style={{ padding: '14px 20px', flexShrink: 0 }}>
                <button type="button" className="crm-btn-secondary" onClick={() => setIsMealModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#FF5E14' }}>
                  Save Custom Meal Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 12: ASSIGN COUPON TO SPECIFIC MOBILE NUMBER
          ========================================================================== */}
      {isAssignMobileModalOpen && selectedCouponForAssignModal && (
        <div className="crm-modal-backdrop" onClick={() => setIsAssignMobileModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="crm-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={20} color="#FF5E14" /> Assign Promocode "{selectedCouponForAssignModal.code}"
              </h3>
              <button type="button" className="crm-modal-close-btn" onClick={() => setIsAssignMobileModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignMobileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
              <div style={{ background: '#FFF7ED', padding: '12px', borderRadius: '10px', border: '1px solid #FFEDD5', fontSize: '13px', color: '#C2410C', fontWeight: 600 }}>
                Discount Offer: <strong>{selectedCouponForAssignModal.discount}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#9A3412', marginTop: '2px', display: 'block' }}>
                  Assigning a coupon to a customer mobile number makes it automatically unlock in their Web App Cart Checkout.
                </span>
              </div>

              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px', fontWeight: 800 }}>
                  Target Customer Mobile Number (10 digits)
                </label>
                <input
                  type="text"
                  className="crm-input"
                  placeholder="e.g. 9876543210"
                  value={assignMobileInput}
                  onChange={(e) => setAssignMobileInput(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Quick Customer Selection Dropdown */}
              {(customers || []).length > 0 && (
                <div className="crm-form-group">
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                    Or Pick from Registered Customers CRM:
                  </label>
                  <select
                    className="crm-input"
                    style={{ fontSize: '13px' }}
                    onChange={(e) => {
                      if (e.target.value) setAssignMobileInput(e.target.value);
                    }}
                  >
                    <option value="">-- Select Customer --</option>
                    {(customers || []).map((c) => (
                      <option key={c.id || c._id} value={c.phone}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => {
                    setAssignMobileInput('');
                  }}
                  title="Make available to all store diners"
                >
                  Clear (Make Global)
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#FF5E14' }}>
                  Save & Assign Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW STEAL DEAL ITEM */}
      {isAddStealItemModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddStealItemModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="crm-modal-card" style={{ maxWidth: '480px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#FF5E14" /> Add Steal Deal Offer Item
              </h3>
              <button type="button" className="crm-modal-close-btn" onClick={() => setIsAddStealItemModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStealItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Item Name <span className="req">*</span></label>
                <input
                  type="text"
                  className="crm-input"
                  placeholder="e.g. Corn Cob / Instant Coffee Pack"
                  value={newStealItemForm.name}
                  onChange={(e) => setNewStealItemForm({ ...newStealItemForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Deal Price (₹) <span className="req">*</span></label>
                  <input
                    type="number"
                    min="0"
                    className="crm-input"
                    placeholder="e.g. 9"
                    value={newStealItemForm.price}
                    onChange={(e) => setNewStealItemForm({ ...newStealItemForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>MRP Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="crm-input"
                    placeholder="e.g. 25"
                    value={newStealItemForm.originalPrice}
                    onChange={(e) => setNewStealItemForm({ ...newStealItemForm, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Quantity Unit</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. 1 pc / 100g / 1 L"
                    value={newStealItemForm.unit}
                    onChange={(e) => setNewStealItemForm({ ...newStealItemForm, unit: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Unlock Threshold (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="crm-input"
                    placeholder="e.g. 199 or 499"
                    value={newStealItemForm.unlockAt}
                    onChange={(e) => setNewStealItemForm({ ...newStealItemForm, unlockAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Image URL</label>
                <input
                  type="text"
                  className="crm-input"
                  placeholder="https://images.unsplash.com/..."
                  value={newStealItemForm.image}
                  onChange={(e) => setNewStealItemForm({ ...newStealItemForm, image: e.target.value })}
                />
              </div>

              <div className="crm-modal-footer" style={{ marginTop: '8px' }}>
                <button type="button" className="crm-btn-secondary" onClick={() => setIsAddStealItemModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#FF5E14' }}>
                  Add to Steal Deals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPGRADE SUBSCRIPTION MODAL FOR PRO / ENTERPRISE FEATURE LOCKING */}
      {upgradeModalFeature && (
        <div className="crm-modal-backdrop" onClick={() => setUpgradeModalFeature(null)}>
          <div
            className="crm-modal-card"
            style={{ maxWidth: '520px', padding: '32px', textAlign: 'center', borderRadius: '24px', border: '1px solid #CBD5E1', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}>
              <Lock size={32} color="#DC2626" />
            </div>

            <div style={{ display: 'inline-block', background: '#FEF3C7', color: '#B45309', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              🔒 {upgradeModalFeature.requiredPlan || 'Higher Plan Required'}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', margin: '0 0 8px 0' }}>
              Unlock {upgradeModalFeature.title}
            </h2>

            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {upgradeModalFeature.desc} This feature requires {upgradeModalFeature.requiredPlan || 'Growth Pro or Enterprise Max plan'}. Upgrade your plan today to unlock!
            </p>

            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                  ⭐ {upgradeModalFeature.requiredPlan?.includes('Enterprise') ? 'Enterprise Max Plan ($75/mo)' : 'Growth Pro Plan ($35/mo)'}
                </span>
                <span style={{ fontWeight: 900, fontSize: '18px', color: '#FF5E14' }}>
                  {upgradeModalFeature.requiredPlan?.includes('Enterprise') ? '$75' : '$35'} <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>/ month</span>
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {upgradeModalFeature.requiredPlan?.includes('Enterprise') ? (
                  <>
                    <li>✓ Delivery Partner View</li>
                    <li>✓ Catalog Themes &amp; Branding</li>
                    <li>✓ Grow Telemetry Analytics</li>
                    <li>✓ 0% Order Commission</li>
                    <li>✓ Custom Domain Website</li>
                    <li>✓ 24/7 VIP Account Manager</li>
                  </>
                ) : (
                  <>
                    <li>✓ Kitchen Display (KDS)</li>
                    <li>✓ Customers CRM &amp; Loyalty</li>
                    <li>✓ Diner Reviews Console</li>
                    <li>✓ Marketing Push Campaigns</li>
                    <li>✓ 1% Lower QR Commission</li>
                    <li>✓ 24/7 Priority Support</li>
                  </>
                )}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setUpgradeModalFeature(null)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetPlan = upgradeModalFeature.requiredPlan?.includes('Enterprise') ? 'Enterprise Max' : 'Growth Pro';
                  const targetPrice = targetPlan === 'Enterprise Max' ? 75 : 35;
                  handleRazorpaySubscriptionPurchase(targetPlan, targetPrice);
                }}
                style={{ flex: 1.5, padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #FF5E14 0%, #D97706 100%)', color: '#FFFFFF', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,94,20,0.3)' }}
              >
                💳 Pay &amp; Unlock with Razorpay ({upgradeModalFeature.requiredPlan?.includes('Enterprise') ? '₹5,999 / $75' : '₹2,999 / $35'})
              </button>
            </div>

            {/* MANUAL RAZORPAY TXN ID VERIFICATION OPTION */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const targetPlan = upgradeModalFeature.requiredPlan?.includes('Enterprise') ? 'Enterprise Max' : 'Growth Pro';
                  const targetPrice = targetPlan === 'Enterprise Max' ? 75 : 35;
                  const txnId = window.prompt(`Already Paid via Razorpay?\nEnter your Razorpay Payment Transaction ID (e.g. pay_P123456789):`);
                  if (txnId && txnId.trim().length >= 5) {
                    const cleanTxn = txnId.trim();
                    const expDate = new Date();
                    expDate.setDate(expDate.getDate() + 30);
                    const expDateIsoStr = expDate.toISOString().split('T')[0];

                    const updatedUser = {
                      ...JSON.parse(localStorage.getItem('foodypay_user') || '{}'),
                      subscriptionPlan: targetPlan,
                      subscriptionPrice: targetPrice,
                      subscriptionStatus: 'Active',
                      subscriptionExpiry: expDateIsoStr,
                      isLocked: false,
                      isSuspended: false,
                      razorpayPaymentId: cleanTxn,
                      paidVia: 'Paid by Razorpay (Verified Txn ID)',
                    };

                    localStorage.setItem('foodypay_user', JSON.stringify(updatedUser));
                    setStoreControls((prev) => ({
                      ...prev,
                      subscriptionPlan: targetPlan,
                      subscriptionPrice: targetPrice,
                      subscriptionStatus: 'Active',
                      subscriptionExpiry: expDateIsoStr,
                      isSuspended: false,
                    }));
                    setCurrentUser(updatedUser);
                    window.dispatchEvent(new Event('storage'));
                    playMilestoneCelebration();
                    addToast(`🎉 Verified Razorpay Txn ID (${cleanTxn})! ${targetPlan} unlocked until ${expDateIsoStr}.`, <CheckCircle2 size={18} color="#10B981" />);
                    setUpgradeModalFeature(null);
                  } else if (txnId !== null) {
                    alert('Invalid Razorpay Payment Transaction ID! Please check your Razorpay payment receipt.');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1D4ED8',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                🔍 Already paid via Razorpay? Click here to enter Payment Txn ID &amp; Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. ADD / EDIT DELIVERY ZONE MODAL */}
      {isAddZoneModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddZoneModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '540px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={22} color="#1E40AF" />
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>
                  {editingZoneObj ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}
                </h3>
              </div>
              <button type="button" className="crm-btn-icon" onClick={() => setIsAddZoneModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveZoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Zone Name / Sector (Dynamic) *</label>
                <input
                  type="text"
                  required
                  className="crm-input"
                  placeholder="e.g. Sector 70 or Phase 7 or Downtown"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>City *</label>
                  <input
                    type="text"
                    required
                    className="crm-input"
                    placeholder="Mohali"
                    value={zoneForm.city}
                    onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>State</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="Punjab"
                    value={zoneForm.state}
                    onChange={(e) => setZoneForm({ ...zoneForm, state: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Pincode</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="160071"
                    value={zoneForm.pincode}
                    onChange={(e) => setZoneForm({ ...zoneForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', marginBottom: '-6px' }}>
                <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                  📍 Google Maps Coordinates & Delivery Radius
                </span>
                <button
                  type="button"
                  className="crm-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setZoneForm((prev) => ({
                            ...prev,
                            centerLatitude: pos.coords.latitude,
                            centerLongitude: pos.coords.longitude,
                          }));
                          addToast('📍 Current GPS coordinates loaded into form!');
                        },
                        () => addToast('⚠️ Could not fetch location. Please enter manually or check permissions.')
                      );
                    }
                  }}
                >
                  📍 Fill My Current GPS Coords
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Center Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="crm-input"
                    placeholder="30.7046"
                    value={zoneForm.centerLatitude}
                    onChange={(e) => setZoneForm({ ...zoneForm, centerLatitude: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Center Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="crm-input"
                    placeholder="76.7179"
                    value={zoneForm.centerLongitude}
                    onChange={(e) => setZoneForm({ ...zoneForm, centerLongitude: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Zone Radius (KM) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="crm-input"
                    placeholder="5"
                    value={zoneForm.radius}
                    onChange={(e) => setZoneForm({ ...zoneForm, radius: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '-8px' }}>
                💡 Tip: Open <a href={`https://www.google.com/maps/@${zoneForm.centerLatitude || 30.7046},${zoneForm.centerLongitude || 76.7179},15z`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontWeight: 700 }}>Google Maps</a>, right-click any sector (e.g. Sector 71, Mattaur) to copy exact Lat & Lng.
              </div>

              {/* LIVE GOOGLE MAPS VISUALIZATION PREVIEW CARD */}
              <div style={{
                borderRadius: '12px',
                border: '1.5px solid #BFDBFE',
                background: '#F8FAFC',
                overflow: 'hidden',
                marginTop: '4px',
                boxShadow: '0 2px 8px rgba(30,64,175,0.06)'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #1E40AF 0%, #3B82F6 100%)',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  color: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 800 }}>
                    <MapPin size={16} color="#93C5FD" />
                    <span>🗺️ Live Google Maps Delivery Zone Preview</span>
                  </div>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Radius: {zoneForm.radius || 5} KM
                  </span>
                </div>

                <div style={{ position: 'relative', height: '220px', width: '100%', background: '#E2E8F0' }}>
                  {zoneForm.centerLatitude && zoneForm.centerLongitude ? (
                    <iframe
                      title="Google Map Preview"
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${zoneForm.centerLatitude},${zoneForm.centerLongitude}&z=14&output=embed`}
                    />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '13px' }}>
                      Enter Latitude & Longitude to view live map preview
                    </div>
                  )}

                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}>
                    <div>
                      <span style={{ color: '#60A5FA', fontWeight: 700 }}>📍 Target Zone Center:</span> {Number(zoneForm.centerLatitude || 0).toFixed(4)}, {Number(zoneForm.centerLongitude || 0).toFixed(4)}
                    </div>
                    <a
                      href={`https://www.google.com/maps/@${zoneForm.centerLatitude || 30.7046},${zoneForm.centerLongitude || 76.7179},15z`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#93C5FD', fontWeight: 800, textDecoration: 'underline' }}
                    >
                      Open Full Map ↗
                    </a>
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: '#EFF6FF', fontSize: '11.5px', color: '#1E3A8A', borderTop: '1px solid #DBEAFE', lineHeight: '1.4' }}>
                  <b>🎯 Zone Geofence Coverage:</b> All customers within <b>{zoneForm.radius || 5} KM</b> of center ({zoneForm.centerLatitude || 30.7046}, {zoneForm.centerLongitude || 76.7179}) covering sectors like <i>Sector 70, Sector 71, Mattaur, Sector 61</i> will automatically get product availability & delivery access.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="zoneActiveCheck"
                  checked={zoneForm.isActive}
                  onChange={(e) => setZoneForm({ ...zoneForm, isActive: e.target.checked })}
                />
                <label htmlFor="zoneActiveCheck" style={{ fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  Enable Delivery in this Zone (Active)
                </label>
              </div>

              <div className="crm-modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="crm-btn-secondary" onClick={() => setIsAddZoneModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#1E40AF' }}>
                  {editingZoneObj ? 'Save Changes' : 'Create Delivery Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD / EDIT STORE MODAL */}
      {isAddStoreModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddStoreModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '620px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Store size={22} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>
                  {editingStoreObj ? 'Edit Store Registration' : 'Register New Store'}
                </h3>
              </div>
              <button type="button" className="crm-btn-icon" onClick={() => setIsAddStoreModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Store Name *</label>
                  <input
                    type="text"
                    required
                    className="crm-input"
                    placeholder="e.g. FoodyPay Bistro Mohali"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Owner Name</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. John Doe"
                    value={storeForm.ownerName}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Owner Email Address (Assigned Access) *</label>
                <input
                  type="email"
                  required
                  className="crm-input"
                  placeholder="owner@restaurant.com"
                  value={storeForm.ownerEmail}
                  onChange={(e) => setStoreForm({ ...storeForm, ownerEmail: e.target.value })}
                />
                <span style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  Admin can assign/change this email to give specific merchant access.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>GST Number</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="07AAAAA0000A1Z5"
                    value={storeForm.gstNumber}
                    onChange={(e) => setStoreForm({ ...storeForm, gstNumber: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>FSSAI / License Number</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="10020011000123"
                    value={storeForm.licenseNumber}
                    onChange={(e) => setStoreForm({ ...storeForm, licenseNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Address Line *</label>
                <input
                  type="text"
                  required
                  className="crm-input"
                  placeholder="SCO 104, Main Market Road"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>City *</label>
                  <input
                    type="text"
                    required
                    className="crm-input"
                    placeholder="Mohali"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>State</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="Punjab"
                    value={storeForm.state}
                    onChange={(e) => setStoreForm({ ...storeForm, state: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Pincode</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="160071"
                    value={storeForm.pincode}
                    onChange={(e) => setStoreForm({ ...storeForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', marginBottom: '-6px' }}>
                <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                  📍 Store GPS Coordinates & Delivery Radius
                </span>
                <button
                  type="button"
                  className="crm-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px', background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setStoreForm((prev) => ({
                            ...prev,
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                          }));
                          addToast('📍 Current GPS coordinates loaded into store form!');
                        },
                        () => addToast('⚠️ Could not fetch location. Please enter manually.')
                      );
                    }
                  }}
                >
                  📍 Fill My Current GPS Coords
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Store Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="crm-input"
                    placeholder="30.7046"
                    value={storeForm.latitude}
                    onChange={(e) => setStoreForm({ ...storeForm, latitude: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Store Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="crm-input"
                    placeholder="76.7179"
                    value={storeForm.longitude}
                    onChange={(e) => setStoreForm({ ...storeForm, longitude: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Delivery Radius (KM) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="crm-input"
                    placeholder="5"
                    value={storeForm.deliveryRadius}
                    onChange={(e) => setStoreForm({ ...storeForm, deliveryRadius: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '-8px' }}>
                💡 Tip: Right-click any location on <a href={`https://www.google.com/maps/@${storeForm.latitude || 30.7046},${storeForm.longitude || 76.7179},15z`} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 700 }}>Google Maps</a> to copy Latitude & Longitude.
              </div>

              {/* LIVE GOOGLE MAPS VISUALIZATION PREVIEW CARD FOR STORE */}
              <div style={{
                borderRadius: '12px',
                border: '1.5px solid #A7F3D0',
                background: '#F0FDF4',
                overflow: 'hidden',
                marginTop: '4px',
                boxShadow: '0 2px 8px rgba(16,185,129,0.06)'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  color: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 800 }}>
                    <Store size={16} color="#A7F3D0" />
                    <span>🗺️ Live Store Location & Delivery Radius Preview</span>
                  </div>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Store Radius: {storeForm.deliveryRadius || 5} KM
                  </span>
                </div>

                <div style={{ position: 'relative', height: '220px', width: '100%', background: '#E2E8F0' }}>
                  {storeForm.latitude && storeForm.longitude ? (
                    <iframe
                      title="Store Google Map Preview"
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${storeForm.latitude},${storeForm.longitude}&z=14&output=embed`}
                    />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '13px' }}>
                      Enter Latitude & Longitude to view live map preview
                    </div>
                  )}

                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between'
                  }}>
                    <div>
                      <span style={{ color: '#34D399', fontWeight: 700 }}>🏪 Store GPS Location:</span> {Number(storeForm.latitude || 0).toFixed(4)}, {Number(storeForm.longitude || 0).toFixed(4)}
                    </div>
                    <a
                      href={`https://www.google.com/maps/@${storeForm.latitude || 30.7046},${storeForm.longitude || 76.7179},15z`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6EE7B7', fontWeight: 800, textDecoration: 'underline' }}
                    >
                      Open Full Map ↗
                    </a>
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: '#ECFDF5', fontSize: '11.5px', color: '#065F46', borderTop: '1px solid #D1FAE5', lineHeight: '1.4' }}>
                  <b>🎯 Store Delivery Geofence:</b> This store will automatically serve all customers within <b>{storeForm.deliveryRadius || 5} KM</b> (covering Sector 70, Sector 71, Mattaur, etc.).
                </div>
              </div>

              <div className="crm-modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="crm-btn-secondary" onClick={() => setIsAddStoreModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#10B981' }}>
                  {editingStoreObj ? 'Save Changes' : 'Register Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSIGN ZONES TO STORE MODAL */}
      {isAssignStoreZonesModalOpen && selectedStoreForZones && (
        <div className="crm-modal-backdrop" onClick={() => setIsAssignStoreZonesModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '500px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>
                  Assign Delivery Zones for {selectedStoreForZones.name}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Select all dynamic zones this store is eligible to fulfill orders for.
                </span>
              </div>
              <button type="button" className="crm-btn-icon" onClick={() => setIsAssignStoreZonesModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignZonesToStoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', padding: '6px' }}>
                {(deliveryZones || []).length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#64748B' }}>No delivery zones created yet. Please create zones first.</div>
                ) : (
                  deliveryZones.map((z) => {
                    const isChecked = selectedZoneIdsForStore.includes(z._id);
                    return (
                      <label key={z._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedZoneIdsForStore([...selectedZoneIdsForStore, z._id]);
                            } else {
                              setSelectedZoneIdsForStore(selectedZoneIdsForStore.filter((id) => id !== z._id));
                            }
                          }}
                        />
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>📍 {z.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748B' }}>{z.city} • {z.radius} KM Radius</div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="crm-modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="crm-btn-secondary" onClick={() => setIsAssignStoreZonesModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#1E40AF' }}>
                  Save Zone Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ASSIGN STORE OWNER EMAIL MODAL */}
      {isAssignOwnerEmailModalOpen && selectedStoreForOwner && (
        <div className="crm-modal-backdrop" onClick={() => setIsAssignOwnerEmailModalOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '460px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>
                  Assign Owner Email for {selectedStoreForOwner.name}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Enter the email address of the merchant/store manager who has permissions to edit this store.
                </span>
              </div>
              <button type="button" className="crm-btn-icon" onClick={() => setIsAssignOwnerEmailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignOwnerEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="crm-form-group">
                <label style={{ fontSize: '12.5px', fontWeight: 800 }}>Store Owner Email Address *</label>
                <input
                  type="email"
                  required
                  className="crm-input"
                  placeholder="owner@restaurant.com"
                  value={assignOwnerEmailInput}
                  onChange={(e) => setAssignOwnerEmailInput(e.target.value)}
                />
              </div>

              <div className="crm-modal-footer" style={{ marginTop: '12px' }}>
                <button type="button" className="crm-btn-secondary" onClick={() => setIsAssignOwnerEmailModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary" style={{ background: '#C2410C' }}>
                  Assign Store Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING TOASTS */}
      <div className="crm-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="crm-toast-item">
            {t.icon && <span>{t.icon}</span>}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
