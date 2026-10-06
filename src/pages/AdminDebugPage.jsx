import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  DollarSign,
  Package,
  Utensils,
  Store,
  Mail,
  Phone,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Eye,
  EyeOff,
  Crown,
  LogIn,
  LogOut,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Briefcase,
  CreditCard,
  CheckCircle2,
  XCircle,
  Settings,
  ShieldAlert,
  Building2,
  Activity,
  Plus,
  Star,
  MapPin,
  Truck,
} from 'lucide-react';
import {
  fetchRegisteredUsersApi,
  deleteUserApi,
  deleteUserByEmailApi,
  toggleUserLockApi,
  updateUserSubscriptionApi,
  fetchPublicOrdersApi,
  fetchDeliveryZonesApi,
  createDeliveryZoneApi,
  updateDeliveryZoneApi,
  deleteDeliveryZoneApi,
  fetchStoresApi,
  createStoreApi,
  updateStoreApi,
  deleteStoreApi,
  assignStoreZonesApi,
  assignStoreOwnerEmailApi,
} from '../utils/api';

export default function AdminDebugPage({ onShowToast }) {
  const navigate = useNavigate();

  // Admin Security Password Gate (Master Password: 12345678)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('foodypay_admin_authed') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');

  // Main Admin Navigation Tabs: 'merchants' | 'customers' | 'orders' | 'subscription_settings'
  const [activeTab, setActiveTab] = useState('merchants');

  // Real Registered Users & Merchants Data
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [globalOrders, setGlobalOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'locked' | 'paid'

  // Account Lock Modal State
  const [lockModalUser, setLockModalUser] = useState(null);
  const [lockReasonInput, setLockReasonInput] = useState('Subscription Payment Required');

  // Subscription Pricing Modal State
  const [subModalUser, setSubModalUser] = useState(null);
  const [subForm, setSubForm] = useState({
    price: 499,
    plan: 'Pro Business Plan',
    status: 'Active',
    expiry: '',
  });

  // Delete Confirmation Modal State
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [confirmEmailInput, setConfirmEmailInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Featured Homepage Store State
  const [featuredMerchantId, setFeaturedMerchantId] = useState(() => {
    try {
      return localStorage.getItem('foodypay_featured_merchant_id') || '';
    } catch (e) {
      return '';
    }
  });

  // Delivery Zones & Stores Management State for Super Admin
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
    coveredSectors: '',
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

  // Multiple Featured Stores State
  const [featuredStoreIds, setFeaturedStoreIds] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_featured_store_ids');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const single = localStorage.getItem('foodypay_featured_merchant_id');
    return single ? [single] : [];
  });

  const handleToggleFeaturedStore = (user) => {
    const targetId = user.foodypayId || user._id;
    setFeaturedStoreIds((prev) => {
      let next;
      if (prev.includes(targetId)) {
        next = prev.filter((id) => id !== targetId);
        if (onShowToast) onShowToast(`Removed "${user.businessName || user.name}" from Featured Stores`);
      } else {
        next = [...prev, targetId];
        if (onShowToast) onShowToast(`⭐ Added "${user.businessName || user.name}" to Featured Stores!`);
      }
      try {
        localStorage.setItem('foodypay_featured_store_ids', JSON.stringify(next));
        if (next.length > 0) {
          localStorage.setItem('foodypay_featured_merchant_id', next[0]);
        }
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}
      return next;
    });
  };

  // Location & Sectors Modal State
  const [locationModalUser, setLocationModalUser] = useState(null);
  const [locationForm, setLocationForm] = useState({
    address: '',
    city: 'Mohali',
    state: 'Punjab',
    pincode: '',
    latitude: 30.7046,
    longitude: 76.7179,
    deliveryRadius: 5,
    coveredSectors: '',
    isWhiteLabel: false,
  });

  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [customSectorInput, setCustomSectorInput] = useState('');

  const handleOpenLocationModal = (user) => {
    setLocationModalUser(user);
    setLocationSearchQuery('');
    setLocationSearchResults([]);
    setCustomSectorInput('');
    setLocationForm({
      address: user.address || '',
      city: user.city || 'Mohali',
      state: user.state || 'Punjab',
      pincode: user.pincode || '',
      latitude: user.latitude || 30.7046,
      longitude: user.longitude || 76.7179,
      deliveryRadius: user.deliveryRadius || 5,
      coveredSectors: user.coveredSectors || 'Sector 71, Mataur, Mohali',
      isWhiteLabel: Boolean(user.isWhiteLabel || user.subscriptionPlan?.toLowerCase().includes('white label')),
    });
  };

  const POPULAR_SECTORS_MAP = [
    { name: 'Sector 71, Mohali, Punjab', sectorTag: 'Sector 71', lat: 30.7046, lon: 76.7179 },
    { name: 'Sector 70, Mohali, Punjab', sectorTag: 'Sector 70', lat: 30.6978, lon: 76.7112 },
    { name: 'Sector 68, Mohali, Punjab', sectorTag: 'Sector 68', lat: 30.6890, lon: 76.7210 },
    { name: 'Sector 67, Mohali, Punjab', sectorTag: 'Sector 67', lat: 30.6805, lon: 76.7285 },
    { name: 'Sector 62, Mohali, Punjab', sectorTag: 'Sector 62', lat: 30.7001, lon: 76.7360 },
    { name: 'Sector 82, Mohali, Punjab', sectorTag: 'Sector 82', lat: 30.6650, lon: 76.7200 },
    { name: 'Phase 7, Mohali, Punjab', sectorTag: 'Phase 7', lat: 30.7090, lon: 76.7220 },
    { name: 'Phase 3B2, Mohali, Punjab', sectorTag: 'Phase 3B2', lat: 30.7180, lon: 76.7150 },
    { name: 'Phase 5, Mohali, Punjab', sectorTag: 'Phase 5', lat: 30.7230, lon: 76.7080 },
    { name: 'Phase 10, Mohali, Punjab', sectorTag: 'Phase 10', lat: 30.6860, lon: 76.7350 },
    { name: 'Phase 11, Mohali, Punjab', sectorTag: 'Phase 11', lat: 30.6780, lon: 76.7400 },
    { name: 'Aerocity, Mohali, Punjab', sectorTag: 'Aerocity', lat: 30.6400, lon: 76.7450 },
    { name: 'IT City, Mohali, Punjab', sectorTag: 'IT City', lat: 30.6300, lon: 76.7600 },
    { name: 'Sector 17, Chandigarh', sectorTag: 'Sector 17', lat: 30.7415, lon: 76.7794 },
    { name: 'Sector 35, Chandigarh', sectorTag: 'Sector 35', lat: 30.7290, lon: 76.7680 },
    { name: 'Sector 22, Chandigarh', sectorTag: 'Sector 22', lat: 30.7380, lon: 76.7720 },
    { name: 'Sector 43, Chandigarh', sectorTag: 'Sector 43', lat: 30.7220, lon: 76.7550 },
    { name: 'Zirakpur, Punjab', sectorTag: 'Zirakpur', lat: 30.6420, lon: 76.8170 },
    { name: 'Kharar, Punjab', sectorTag: 'Kharar', lat: 30.7460, lon: 76.6470 },
  ];

  // LIVE DEBOUNCED AUTOCOMPLETE SEARCH EFFECT
  useEffect(() => {
    if (!locationSearchQuery || locationSearchQuery.trim().length < 1) {
      setLocationSearchResults([]);
      return;
    }
    const q = locationSearchQuery.trim().toLowerCase();

    // 1. Instant local matching suggestions
    const localMatches = POPULAR_SECTORS_MAP.filter(
      (item) => item.name.toLowerCase().includes(q) || item.sectorTag.toLowerCase().includes(q)
    ).map((item) => ({
      display_name: item.name,
      lat: item.lat,
      lon: item.lon,
      sectorTag: item.sectorTag,
      isLocal: true,
    }));

    setLocationSearchResults(localMatches);

    // 2. Debounced API search for wider Google/OSM locations
    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchQuery + ' Mohali Chandigarh')}&addressdetails=1&limit=5`
        );
        const apiData = await res.json();
        if (Array.isArray(apiData) && apiData.length > 0) {
          const remoteMatches = apiData.map((item) => ({
            display_name: item.display_name,
            lat: Number(item.lat),
            lon: Number(item.lon),
            sectorTag: item.display_name.split(',')[0],
            isLocal: false,
          }));

          setLocationSearchResults((prev) => {
            const combined = [...localMatches];
            remoteMatches.forEach((rm) => {
              if (!combined.some((c) => Math.abs(c.lat - rm.lat) < 0.005 && Math.abs(c.lon - rm.lon) < 0.005)) {
                combined.push(rm);
              }
            });
            return combined;
          });
        }
      } catch (err) {
        console.warn('Live geocoding error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [locationSearchQuery]);

  const handleSearchGoogleLocation = async (qStr) => {
    const query = qStr !== undefined ? qStr : locationSearchQuery;
    if (!query.trim()) return;
    setIsSearchingLocation(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setLocationSearchResults(data);
      }
    } catch (err) {
      console.warn('Geocoding search note:', err);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectSearchResult = (place) => {
    const lat = Number(place.lat).toFixed(4);
    const lon = Number(place.lon).toFixed(4);
    const rawName = place.sectorTag || (place.display_name ? place.display_name.split(',')[0] : place.name || locationSearchQuery);
    const sectorToAdd = rawName.trim();

    let currentSectors = locationForm.coveredSectors.split(',').map((s) => s.trim()).filter(Boolean);
    if (sectorToAdd && !currentSectors.includes(sectorToAdd)) {
      currentSectors.push(sectorToAdd);
    }

    setLocationForm((prev) => ({
      ...prev,
      latitude: Number(lat),
      longitude: Number(lon),
      address: place.display_name || prev.address,
      coveredSectors: currentSectors.join(', '),
    }));

    setLocationSearchResults([]);
    setLocationSearchQuery('');
    if (onShowToast) {
      onShowToast(`📍 Map Updated to "${sectorToAdd}" (Lat: ${lat}, Lng: ${lon}) & Sector added!`);
    }
  };

  const handleToggleQuickSector = (secName) => {
    let currentSectors = locationForm.coveredSectors.split(',').map((s) => s.trim()).filter(Boolean);
    if (currentSectors.includes(secName)) {
      currentSectors = currentSectors.filter((s) => s !== secName);
    } else {
      currentSectors.push(secName);
    }
    setLocationForm((prev) => ({
      ...prev,
      coveredSectors: currentSectors.join(', '),
    }));
  };

  const handleAddCustomSector = (e) => {
    e.preventDefault();
    if (!customSectorInput.trim()) return;
    const secName = customSectorInput.trim();
    let currentSectors = locationForm.coveredSectors.split(',').map((s) => s.trim()).filter(Boolean);
    if (!currentSectors.includes(secName)) {
      currentSectors.push(secName);
    }
    setLocationForm((prev) => ({
      ...prev,
      coveredSectors: currentSectors.join(', '),
    }));
    setCustomSectorInput('');
  };

  const handleSaveLocationSubmit = async (e) => {
    e.preventDefault();
    if (!locationModalUser) return;
    const targetUserId = locationModalUser._id;

    const updatedData = {
      ...locationModalUser,
      ...locationForm,
      address: locationForm.address,
      city: locationForm.city,
      state: locationForm.state,
      pincode: locationForm.pincode,
      latitude: Number(locationForm.latitude),
      longitude: Number(locationForm.longitude),
      deliveryRadius: Number(locationForm.deliveryRadius),
      coveredSectors: locationForm.coveredSectors,
      isWhiteLabel: locationForm.isWhiteLabel,
    };

    setRegisteredUsers((prev) =>
      prev.map((u) => (u._id === targetUserId || u.email === locationModalUser.email ? updatedData : u))
    );

    try {
      const rawU = localStorage.getItem('foodypay_user');
      if (rawU) {
        const u = JSON.parse(rawU);
        if (u.email === locationModalUser.email || u._id === targetUserId) {
          localStorage.setItem('foodypay_user', JSON.stringify({ ...u, ...updatedData }));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (e) {}

    if (onShowToast) {
      onShowToast(`📍 Updated Location, Coordinates (${locationForm.latitude}, ${locationForm.longitude}) & Sectors for "${locationModalUser.businessName || locationModalUser.name}"!`);
    }

    setLocationModalUser(null);
  };

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
        if (onShowToast) onShowToast(`Delivery Zone "${zoneForm.name}" updated successfully!`);
      } else {
        await createDeliveryZoneApi(zoneForm);
        if (onShowToast) onShowToast(`New Delivery Zone "${zoneForm.name}" created successfully!`);
      }
      setIsAddZoneModalOpen(false);
      loadDeliveryAndStoresData();
    } catch (err) {
      if (onShowToast) onShowToast(`Error saving zone: ${err.message}`);
    }
  };

  const handleSaveStoreSubmit = async (e) => {
    e.preventDefault();
    if (!storeForm.name.trim() || !storeForm.ownerEmail.trim()) return;

    try {
      if (editingStoreObj) {
        await updateStoreApi(editingStoreObj._id || editingStoreObj.storeId, storeForm);
        if (onShowToast) onShowToast(`Store "${storeForm.name}" updated successfully!`);
      } else {
        await createStoreApi(storeForm);
        if (onShowToast) onShowToast(`New Store "${storeForm.name}" registered successfully!`);
      }
      setIsAddStoreModalOpen(false);
      loadDeliveryAndStoresData();
    } catch (err) {
      if (onShowToast) onShowToast(`Error saving store: ${err.message}`);
    }
  };

  const handleSetFeaturedStore = (user) => {
    const targetId = user.foodypayId || user.merchantId || user._id;
    try {
      localStorage.setItem('foodypay_featured_merchant_id', targetId);
      const featuredPayload = {
        foodypayId: targetId,
        merchantId: targetId,
        businessName: user.businessName || user.name,
        restaurantName: user.businessName || user.name,
        logoUrl: user.logoUrl || '',
        upiId: user.upiId || '7496888449@ptsbi',
        products: user.dishes || [],
      };
      localStorage.setItem('foodypay_featured_homepage_merchant', JSON.stringify(featuredPayload));
      setFeaturedMerchantId(targetId);
      window.dispatchEvent(new Event('storage'));
      if (onShowToast) {
        onShowToast(`⭐ Store "${user.businessName || user.name}" set as DEFAULT Homepage / Store!`);
      }
    } catch (e) {}
  };

  // Global Platform Subscription Settings State
  const [globalSubSettings, setGlobalSubSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_global_subscription_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      platformName: 'FoodyPay Enterprise System',
      defaultMonthlyPrice: 499,
      defaultAnnualPrice: 4999,
      freeTrialDays: 14,
      autoLockExpiredAccounts: true,
      currency: 'INR (₹)',
      supportEmail: 'billing@foodypay.in',
    };
  });

  // Save Global Subscription Settings to localStorage
  const handleSaveGlobalSettings = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('foodypay_global_subscription_settings', JSON.stringify(globalSubSettings));
      if (onShowToast) onShowToast('️ Global Platform Subscription Settings Saved!');
    } catch (e) {}
  };

  // Fetch Live Real Data from Backend Database
  const loadLiveAdminData = async () => {
    setLoadingData(true);
    let liveOrdersList = [];
    try {
      const ordersRes = await fetchPublicOrdersApi();
      if (Array.isArray(ordersRes)) liveOrdersList = ordersRes;
    } catch (e) {}

    try {
      const localOrders = JSON.parse(localStorage.getItem('foodypay_crm_orders_v3') || '[]');
      if (Array.isArray(localOrders) && localOrders.length > 0) {
        liveOrdersList = [...liveOrdersList, ...localOrders];
      }
    } catch (e) {}

    setGlobalOrders(liveOrdersList);

    let activeMerchant = null;
    try {
      const savedUser = localStorage.getItem('foodypay_user');
      if (savedUser) activeMerchant = JSON.parse(savedUser);
    } catch (e) {}

    try {
      const usersRes = await fetchRegisteredUsersApi();
      let rawUsers = (usersRes && usersRes.success && Array.isArray(usersRes.data)) ? usersRes.data : [];

      // Ensure active logged-in merchant is present in rawUsers list if missing
      if (activeMerchant) {
        const exists = rawUsers.some(
          (u) =>
            (u._id && String(u._id) === String(activeMerchant._id)) ||
            (u.foodypayId && activeMerchant.foodypayId && String(u.foodypayId) === String(activeMerchant.foodypayId)) ||
            (u.email && activeMerchant.email && String(u.email).toLowerCase() === String(activeMerchant.email).toLowerCase())
        );
        if (!exists) {
          rawUsers.push(activeMerchant);
        }
      }

      const normalized = rawUsers.map((u) => {
        const isCurrentActive =
          activeMerchant &&
          ((u._id && String(u._id) === String(activeMerchant._id)) ||
            (u.foodypayId && activeMerchant.foodypayId && String(u.foodypayId) === String(activeMerchant.foodypayId)) ||
            (u.email && activeMerchant.email && String(u.email).toLowerCase() === String(activeMerchant.email).toLowerCase()));

        // Filter matching orders
        const matchingOrders = liveOrdersList.filter((o) => {
          if (!o) return false;
          const oUser = String(o.user || '');
          const oMerchantId = String(o.merchantId || '');
          const oFpId = String(o.foodypayId || '');
          const uId = String(u._id || '');
          const uFpId = String(u.foodypayId || '');

          if (oUser && uId && oUser === uId) return true;
          if (oMerchantId && (oMerchantId === uId || oMerchantId === uFpId)) return true;
          if (oFpId && uFpId && oFpId === uFpId) return true;
          if (isCurrentActive && (!o.user && !o.merchantId && !o.foodypayId)) return true; // Unassigned local orders belong to current merchant
          return false;
        });

        // Compute total sales & orders count
        const computedSales = matchingOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
        const dbSales = Number(u.totalSales) || 0;
        const totalSalesVal = Math.max(dbSales, computedSales);
        const totalOrdersVal = Math.max(Number(u.totalOrders) || 0, matchingOrders.length);

        const subPriceVal = u.subscriptionPrice !== undefined && u.subscriptionPrice !== null ? Number(u.subscriptionPrice) : 0;
        const subPlanVal = u.subscriptionPlan || (subPriceVal > 0 ? 'Pro Business Plan' : 'Free Trial (14 Days)');

        return {
          _id: u._id || `user_${Math.random()}`,
          email: u.email || '',
          name: u.name || '',
          businessName: u.businessName || u.name || '',
          contactNo: u.contactNo || u.phone || '',
          logoUrl: u.logo?.url || u.logoUrl || u.picture || '',
          foodypayId: u.foodypayId || '',
          isLocked: Boolean(u.isLocked),
          lockReason: u.lockReason || 'Subscription Payment Required',
          subscriptionPrice: subPriceVal,
          subscriptionStatus: u.subscriptionStatus || (u.isLocked ? 'Locked' : (subPriceVal > 0 ? 'Active' : 'Trial')),
          subscriptionPlan: subPlanVal,
          subscriptionExpiry: u.subscriptionExpiry || '',
          totalSales: totalSalesVal,
          totalOrders: totalOrdersVal,
          totalBilled: u.totalBilled !== undefined ? Number(u.totalBilled) : (subPriceVal > 0 ? subPriceVal : 0),
          dishCount: Number(u.dishCount) || (u.dishes ? u.dishes.length : 0),
          dishes: u.dishes || [],
          createdAt: u.createdAt || new Date().toISOString(),
        };
      });

      setRegisteredUsers(normalized);
      if (onShowToast) onShowToast(' Live Database Records & Sales Reloaded Cleanly!');
    } catch (err) {
      console.warn('Backend load error:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadLiveAdminData();
    }
  }, [isAdminAuthenticated]);

  // Handle Admin Authentication Gate Login
  const handleAdminLoginSubmit = (e) => {
    e.preventDefault();
    if (adminPasswordInput === '12345678') {
      sessionStorage.setItem('foodypay_admin_authed', 'true');
      setIsAdminAuthenticated(true);
      setAdminAuthError('');
      if (onShowToast) onShowToast(' Master Admin Access Granted!');
    } else {
      setAdminAuthError('Incorrect Password! Master Admin password is 12345678.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('foodypay_admin_authed');
    setIsAdminAuthenticated(false);
    setAdminPasswordInput('');
    if (onShowToast) onShowToast(' Logged out of Master Admin Panel');
  };

  // 1. Account Lock / Unlock Handler
  const handleExecuteAccountLockToggle = async () => {
    if (!lockModalUser) return;
    const targetUserId = lockModalUser._id;
    const nextLockedState = !lockModalUser.isLocked;

    try {
      if (targetUserId && !targetUserId.startsWith('user_')) {
        await toggleUserLockApi(targetUserId, nextLockedState, lockReasonInput);
      }
    } catch (err) {
      console.warn('Lock API note:', err.message);
    }

    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u._id === targetUserId) {
          return {
            ...u,
            isLocked: nextLockedState,
            lockReason: lockReasonInput,
            subscriptionStatus: nextLockedState ? 'Locked' : 'Active',
          };
        }
        return u;
      })
    );

    if (onShowToast) {
      onShowToast(
        nextLockedState
          ? ` Account ${lockModalUser.email} is now LOCKED (Subscription Required)`
          : ` Account ${lockModalUser.email} has been UNLOCKED & Activated!`
      );
    }

    setLockModalUser(null);
  };

  // 2. Subscription Pricing Update Handler
  const handleSaveUserSubscription = async (e) => {
    e.preventDefault();
    if (!subModalUser) return;
    const targetUserId = subModalUser._id;
    const isSuspendedVal = subForm.status === 'Suspended' || Boolean(subForm.isSuspended);

    try {
      if (targetUserId && !targetUserId.startsWith('user_')) {
        await updateUserSubscriptionApi(targetUserId, { ...subForm, isSuspended: isSuspendedVal });
      }
    } catch (err) {
      console.warn('Subscription API note:', err.message);
    }

    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u._id === targetUserId || u.email === subModalUser.email) {
          return {
            ...u,
            subscriptionPrice: Number(subForm.price) || 0,
            subscriptionPlan: subForm.plan,
            subscriptionStatus: isSuspendedVal ? 'Suspended' : subForm.status,
            subscriptionExpiry: subForm.expiry,
            isLocked: subForm.status === 'Locked' || subForm.status === 'Expired' || isSuspendedVal,
            isSuspended: isSuspendedVal,
          };
        }
        return u;
      })
    );

    // Sync to currently logged in user if email matches
    try {
      const rawU = localStorage.getItem('foodypay_user');
      if (rawU) {
        const u = JSON.parse(rawU);
        if (u.email === subModalUser.email || u._id === targetUserId || u.foodypayId === subModalUser.foodypayId) {
          const updated = {
            ...u,
            subscriptionPlan: subForm.plan,
            subscriptionPrice: Number(subForm.price) || 0,
            subscriptionStatus: isSuspendedVal ? 'Suspended' : subForm.status,
            subscriptionExpiry: subForm.expiry,
            isLocked: subForm.status === 'Locked' || subForm.status === 'Expired' || isSuspendedVal,
            isSuspended: isSuspendedVal,
          };
          localStorage.setItem('foodypay_user', JSON.stringify(updated));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (err) {}

    if (onShowToast) {
      onShowToast(
        isSuspendedVal
          ? ` Account ${subModalUser.email} has been SUSPENDED!`
          : ` Subscription for ${subModalUser.email} updated to ${subForm.plan} (₹${subForm.price}/mo)!`
      );
    }

    setSubModalUser(null);
  };

  // 3. Delete Account Handler with Confirmation
  const handleExecuteDeleteAccount = async () => {
    if (!deleteModalUser) return;

    if (confirmEmailInput.trim().toLowerCase() !== deleteModalUser.email.trim().toLowerCase()) {
      alert(`Email confirmation does not match! Please type "${deleteModalUser.email}" to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    const targetUserId = deleteModalUser._id;
    const targetEmail = deleteModalUser.email;

    try {
      if (targetUserId && !targetUserId.startsWith('user_')) {
        await deleteUserApi(targetUserId);
      } else {
        await deleteUserByEmailApi(targetEmail);
      }
    } catch (err) {
      console.warn('Delete API note:', err.message);
    }

    setRegisteredUsers((prev) => prev.filter((u) => u._id !== targetUserId && u.email !== targetEmail));

    if (onShowToast) {
      onShowToast(`️ User account (${targetEmail}) deleted permanently from database!`);
    }

    setIsDeleting(false);
    setDeleteModalUser(null);
    setConfirmEmailInput('');
  };

  // Context Switch to Merchant POS Dashboard
  const handleLaunchMerchantDashboard = (user) => {
    try {
      localStorage.setItem('foodypay_user', JSON.stringify(user));
    } catch (e) {}
    if (onShowToast) onShowToast(`Switched active context to ${user.businessName || user.name}`);
    navigate('/dashboard');
  };

  // Password Gate Screen
  if (!isAdminAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0B0F19', color: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '24px', padding: '40px 32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', textAlign: 'center' }}>
          
          <div style={{ width: '68px', height: '68px', borderRadius: '22px', backgroundColor: '#FF5E14', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 25px rgba(255,94,20,0.45)' }}>
            <ShieldCheck size={38} />
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Master Admin Security Access
          </h2>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: '0 0 24px', lineHeight: 1.5 }}>
            Enter Master Admin Password (<strong style={{ color: '#FF5E14' }}>12345678</strong>) to access merchant accounts, subscriptions, &amp; database controls.
          </p>

          {adminAuthError && (
            <div style={{ backgroundColor: '#7F1D1D', border: '1px solid #991B1B', color: '#FECACA', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, marginBottom: '20px' }}>
              ️ {adminAuthError}
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showAdminPassword ? 'text' : 'password'}
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Enter Password (12345678)"
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #374151',
                  backgroundColor: '#030712',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#FF5E14',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 900,
                fontSize: '15.5px',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(255,94,20,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <LogIn size={20} />
              <span>Unlock Admin Console</span>
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #1F2937', fontSize: '12px', color: '#6B7280' }}>
             Protected by FoodyPay Master Admin Security Engine
          </div>
        </div>
      </div>
    );
  }

  // Calculated Metrics
  const totalRegisteredCount = registeredUsers.length;
  const lockedCount = registeredUsers.filter((u) => u.isLocked || u.subscriptionStatus === 'Locked').length;
  const activeCount = registeredUsers.filter((u) => !u.isLocked).length;
  const freeStoresCount = registeredUsers.filter((u) => u.subscriptionPrice === 0 || u.subscriptionPlan?.toLowerCase().includes('free')).length;
  const paidStoresCount = registeredUsers.filter((u) => u.subscriptionPrice > 0 || u.subscriptionPlan?.toLowerCase().includes('growth') || u.subscriptionPlan?.toLowerCase().includes('enterprise') || u.subscriptionPlan?.toLowerCase().includes('pro')).length;
  const whiteLabelStoresCount = registeredUsers.filter((u) => u.isWhiteLabel || u.subscriptionPlan?.toLowerCase().includes('white label') || u.subscriptionPlan?.toLowerCase().includes('enterprise max')).length;
  const featuredStoresCount = registeredUsers.filter((u) => u.isFeatured || featuredStoreIds.includes(u._id) || featuredStoreIds.includes(u.foodypayId)).length;

  const totalPlatformSales = registeredUsers.reduce((s, u) => s + (Number(u.totalSales) || 0), 0);
  const totalPlatformOrders = registeredUsers.reduce((s, u) => s + (Number(u.totalOrders) || 0), 0);
  const totalPlatformDishes = registeredUsers.reduce((s, u) => s + (Number(u.dishCount) || 0), 0);
  const totalMRR = registeredUsers.filter((u) => !u.isLocked).reduce((s, u) => s + (Number(u.subscriptionPrice) || globalSubSettings.defaultMonthlyPrice), 0);

  // Filtered Users List with Subscription Tiers & Featured Filters
  const filteredUsers = registeredUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.businessName || '').toLowerCase().includes(q) ||
      (u.contactNo || '').toLowerCase().includes(q) ||
      (u.coveredSectors || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q) ||
      (u.foodypayId || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'free') return u.subscriptionPrice === 0 || u.subscriptionPlan?.toLowerCase().includes('free');
    if (statusFilter === 'paid') return u.subscriptionPrice > 0 || u.subscriptionPlan?.toLowerCase().includes('growth') || u.subscriptionPlan?.toLowerCase().includes('enterprise') || u.subscriptionPlan?.toLowerCase().includes('pro');
    if (statusFilter === 'white_label') return u.isWhiteLabel || u.subscriptionPlan?.toLowerCase().includes('white label') || u.subscriptionPlan?.toLowerCase().includes('enterprise max');
    if (statusFilter === 'featured') return u.isFeatured || featuredStoreIds.includes(u._id) || featuredStoreIds.includes(u.foodypayId);
    if (statusFilter === 'active') return !u.isLocked;
    if (statusFilter === 'locked') return u.isLocked;
    return true;
  });

  // Extract real customers from users/orders
  const aggregateCustomers = [];
  registeredUsers.forEach((u) => {
    if (u.dishes && u.dishes.length > 0) {
      aggregateCustomers.push({
        name: u.name || 'Diner',
        phone: u.contactNo || '+91 98123 45678',
        email: u.email,
        merchant: u.businessName || u.name,
        ordersCount: u.totalOrders || 1,
        totalSpend: u.totalSales || 450,
      });
    }
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090D16', color: '#F1F5F9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BAR */}
      <header style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: '#FF5E14', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(255,94,20,0.45)' }}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 900, color: '#FFF', letterSpacing: '-0.02em' }}>
                  FoodyPay Platform Admin Console
                </h1>
                <span style={{ fontSize: '11px', backgroundColor: '#334155', color: '#38BDF8', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', border: '1px solid #0EA5E9' }}>
                  PRODUCTION DB
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                Account Management • Subscription Pricing • Lock Controls • Production Database Telemetry
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={loadLiveAdminData}
              disabled={loadingData}
              style={{
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
              <span>{loadingData ? 'Syncing...' : 'Reload DB Data'}</span>
            </button>

            <button
              onClick={() => setActiveTab('delivery_zones')}
              style={{
                backgroundColor: activeTab === 'delivery_zones' ? '#1E40AF' : '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Truck size={15} /> Delivery Zones & Stores
            </button>

            <button
              onClick={() => setActiveTab('subscription_settings')}
              style={{
                backgroundColor: activeTab === 'subscription_settings' ? '#1E40AF' : '#1E293B',
                color: '#F8FAFC',
                border: '1px solid #334155',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Settings size={15} /> Global Settings
            </button>

            <button
              onClick={handleAdminLogout}
              style={{
                backgroundColor: '#7F1D1D',
                color: '#FECACA',
                border: '1px solid #991B1B',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={15} /> Exit Admin
            </button>
          </div>

        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px 24px' }}>

        {/* METRICS CARDS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>REAL MERCHANTS</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#FFF', marginTop: '4px' }}>{totalRegisteredCount}</div>
              <div style={{ fontSize: '12px', color: '#38BDF8', marginTop: '2px', fontWeight: 700 }}>Active Database Accounts</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: '#38BDF8' }}>
              <Building2 size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>ESTIMATED MRR</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#10B981', marginTop: '4px' }}>₹{totalMRR.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '12px', color: '#34D399', marginTop: '2px', fontWeight: 700 }}>Monthly Subscription Revenue</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: '#10B981' }}>
              <CreditCard size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>GROSS SALES</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#F59E0B', marginTop: '4px' }}>₹{totalPlatformSales.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '12px', color: '#FBBF24', marginTop: '2px', fontWeight: 700 }}>{totalPlatformOrders} Total Orders</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: '#F59E0B' }}>
              <DollarSign size={26} />
            </div>
          </div>

          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>LOCKED ACCOUNTS</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: lockedCount > 0 ? '#EF4444' : '#10B981', marginTop: '4px' }}>{lockedCount}</div>
              <div style={{ fontSize: '12px', color: lockedCount > 0 ? '#FCA5A5' : '#6EE7B7', marginTop: '2px', fontWeight: 700 }}>Subscription Locked</div>
            </div>
            <div style={{ backgroundColor: '#1E293B', padding: '12px', borderRadius: '14px', color: lockedCount > 0 ? '#EF4444' : '#10B981' }}>
              <Lock size={26} />
            </div>
          </div>

        </div>

        {/* TABS NAVIGATION BAR */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
          {[
            { id: 'merchants', label: ' Merchant Accounts', count: registeredUsers.length },
            { id: 'customers', label: ' Customers & CRM', count: aggregateCustomers.length || registeredUsers.length },
            { id: 'orders', label: ' Live Orders Feed', count: globalOrders.length },
            { id: 'delivery_zones', label: '🚚 Delivery Zones & Stores', count: (deliveryZones || []).length },
            { id: 'subscription_settings', label: '️ Global Subscription Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: activeTab === tab.id ? '#FF5E14' : '#0F172A',
                color: activeTab === tab.id ? '#FFF' : '#94A3B8',
                border: '1px solid ' + (activeTab === tab.id ? '#FF5E14' : '#1E293B'),
                padding: '11px 22px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
            </button>
          ))}
        </div>

        {/* TAB 1: MERCHANTS & ACCOUNT MANAGEMENT */}
        {activeTab === 'merchants' && (
          <div>
            {/* Search & Filter controls */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search merchant by Email, Business Name, WhatsApp, FoodyPay ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1px solid #1E293B',
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0F172A', padding: '4px', borderRadius: '12px', border: '1px solid #1E293B', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setStatusFilter('all')}
                  style={{
                    backgroundColor: statusFilter === 'all' ? '#1E293B' : 'transparent',
                    color: statusFilter === 'all' ? '#FFF' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  All Accounts ({registeredUsers.length})
                </button>

                <button
                  onClick={() => setStatusFilter('free')}
                  style={{
                    backgroundColor: statusFilter === 'free' ? '#78350F' : 'transparent',
                    color: statusFilter === 'free' ? '#FBBF24' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🆓 Free Stores ({freeStoresCount})
                </button>

                <button
                  onClick={() => setStatusFilter('paid')}
                  style={{
                    backgroundColor: statusFilter === 'paid' ? '#064E3B' : 'transparent',
                    color: statusFilter === 'paid' ? '#34D399' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  💎 Paid Subscriptions ({paidStoresCount})
                </button>

                <button
                  onClick={() => setStatusFilter('white_label')}
                  style={{
                    backgroundColor: statusFilter === 'white_label' ? '#312E81' : 'transparent',
                    color: statusFilter === 'white_label' ? '#A5B4FC' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🏷️ White Label ({whiteLabelStoresCount})
                </button>

                <button
                  onClick={() => setStatusFilter('featured')}
                  style={{
                    backgroundColor: statusFilter === 'featured' ? '#854D0E' : 'transparent',
                    color: statusFilter === 'featured' ? '#FACC15' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  ⭐ Featured Stores ({featuredStoresCount})
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  style={{
                    backgroundColor: statusFilter === 'active' ? '#064E3B' : 'transparent',
                    color: statusFilter === 'active' ? '#34D399' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Active ({activeCount})
                </button>

                <button
                  onClick={() => setStatusFilter('locked')}
                  style={{
                    backgroundColor: statusFilter === 'locked' ? '#7F1D1D' : 'transparent',
                    color: statusFilter === 'locked' ? '#FCA5A5' : '#94A3B8',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Locked ({lockedCount})
                </button>
              </div>
            </div>

            {/* MERCHANTS TABLE */}
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', overflow: 'hidden' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <Building2 size={40} color="#475569" style={{ marginBottom: '10px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFF' }}>No merchant accounts found</div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>Try clearing your search filter.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#161F33', borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '14px 18px' }}>Business Name &amp; Logo</th>
                        <th style={{ padding: '14px 18px' }}>Email &amp; Contact</th>
                        <th style={{ padding: '14px 18px' }}>Active Plan Status</th>
                        <th style={{ padding: '14px 18px' }}>Starting Date</th>
                        <th style={{ padding: '14px 18px' }}>Total Store Sales</th>
                        <th style={{ padding: '14px 18px' }}>SaaS Plan Billed</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right' }}>Account Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const createdDateStr = user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent';

                        const isFreeTrial =
                          user.subscriptionPrice === 0 ||
                          (user.subscriptionPlan && user.subscriptionPlan.toLowerCase().includes('free'));

                        const saasBilledAmount = user.totalBilled !== undefined ? user.totalBilled : (isFreeTrial ? 0 : user.subscriptionPrice || 499);

                        return (
                          <tr key={user._id} style={{ borderBottom: '1px solid #1E293B', backgroundColor: user.isLocked ? '#1A0B0E' : 'transparent' }}>
                            {/* 1. BUSINESS NAME & LOGO */}
                            <td style={{ padding: '16px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {user.logoUrl ? (
                                  <img
                                    src={user.logoUrl}
                                    alt={user.businessName}
                                    style={{
                                      width: '42px',
                                      height: '42px',
                                      borderRadius: '10px',
                                      objectFit: 'cover',
                                      backgroundColor: '#1E293B',
                                      border: '1px solid #334155',
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    backgroundColor: '#1E293B',
                                    border: '1px solid #334155',
                                    display: user.logoUrl ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    color: '#FF5E14',
                                    fontSize: '16px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {user.businessName ? user.businessName.charAt(0).toUpperCase() : 'M'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, color: '#FFF', fontSize: '14.5px' }}>{user.businessName || user.name}</div>
                                  {user.name && user.businessName && user.name !== user.businessName && (
                                    <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '1px' }}>👤 Owner: {user.name}</div>
                                  )}
                                  <div style={{ fontSize: '11.5px', color: '#38BDF8', marginTop: '2px', fontWeight: 600 }}>ID: {user.foodypayId}</div>
                                </div>
                              </div>
                            </td>

                            {/* 2. EMAIL & PHONE */}
                            <td style={{ padding: '16px 18px' }}>
                              <div style={{ color: '#38BDF8', fontWeight: 800, fontSize: '13.5px', wordBreak: 'break-all' }}>
                                📧 {user.email}
                              </div>
                              <div style={{ fontSize: '12.5px', color: '#F1F5F9', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                📞 {user.contactNo || 'No Phone Added'}
                              </div>
                            </td>

                            {/* 3. ACTIVE PLAN STATUS (FREE vs SUBSCRIPTION) */}
                            <td style={{ padding: '16px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    padding: '3px 8px',
                                    borderRadius: '8px',
                                    backgroundColor: isFreeTrial ? '#FEF3C7' : '#DCFCE7',
                                    color: isFreeTrial ? '#D97706' : '#15803D',
                                    border: isFreeTrial ? '1px solid #FCD34D' : '1px solid #86EFAC',
                                  }}
                                >
                                  {isFreeTrial ? '🟡 FREE TRIAL' : '🟢 PRO SUBSCRIPTION'}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 900, color: isFreeTrial ? '#F59E0B' : '#10B981' }}>
                                  ₹{user.subscriptionPrice}/mo
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setSubModalUser(user);
                                  setSubForm({
                                    price: user.subscriptionPrice,
                                    plan: user.subscriptionPlan,
                                    status: user.subscriptionStatus,
                                    expiry: user.subscriptionExpiry ? user.subscriptionExpiry.split('T')[0] : '',
                                  });
                                }}
                                style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', padding: 0, fontSize: '11.5px', fontWeight: 700, marginTop: '4px', textDecoration: 'underline' }}
                              >
                                ✏️ Edit Plan / Pricing
                              </button>
                            </td>

                            {/* 4. STARTING DATE */}
                            <td style={{ padding: '16px 18px' }}>
                              <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{createdDateStr}</div>
                              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Joined Platform</div>
                            </td>

                            {/* 5. TOTAL STORE SALES */}
                            <td style={{ padding: '16px 18px' }}>
                              <div style={{ fontWeight: 900, color: '#F59E0B', fontSize: '15px' }}>₹{user.totalSales.toLocaleString('en-IN')}</div>
                              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{user.totalOrders} Orders • {user.dishCount} Dishes</div>
                            </td>

                            {/* 6. SAAS BILLING PAID SO FAR */}
                            <td style={{ padding: '16px 18px' }}>
                              <div style={{ fontWeight: 900, color: saasBilledAmount > 0 ? '#10B981' : '#94A3B8', fontSize: '14.5px' }}>
                                ₹{saasBilledAmount.toLocaleString('en-IN')}
                              </div>
                              <div style={{ fontSize: '11px', color: saasBilledAmount > 0 ? '#34D399' : '#64748B', marginTop: '2px', fontWeight: 700 }}>
                                {isFreeTrial ? 'Free Trial (Unbilled)' : 'Subscription Paid'}
                              </div>
                            </td>

                            {/* 7. ACCOUNT ACTIONS & LOCK STATUS */}
                            <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                {/* Lock / Unlock Toggle Button */}
                                <button
                                  onClick={() => {
                                    setLockModalUser(user);
                                    setLockReasonInput(user.lockReason || 'Subscription Payment Required');
                                  }}
                                  style={{
                                    backgroundColor: user.isLocked ? '#064E3B' : '#7F1D1D',
                                    color: user.isLocked ? '#6EE7B7' : '#FECACA',
                                    border: 'none',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {user.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                                  <span>{user.isLocked ? 'Unlock' : 'Lock'}</span>
                                </button>

                                {/* Launch Dashboard Context */}
                                <button
                                  onClick={() => handleLaunchMerchantDashboard(user)}
                                  style={{
                                    backgroundColor: '#1E293B',
                                    color: '#38BDF8',
                                    border: '1px solid #334155',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                  title="Open Merchant POS Dashboard"
                                >
                                  Open POS ↗
                                </button>

                                {/* Edit Google Location, Radius & Covered Sectors */}
                                <button
                                  onClick={() => handleOpenLocationModal(user)}
                                  style={{
                                    backgroundColor: '#1E293B',
                                    color: '#10B981',
                                    border: '1px solid #059669',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title="Assign Google Location Coordinates, Radius & Covered Sectors"
                                >
                                  <MapPin size={13} />
                                  <span>📍 Edit Location &amp; Sectors</span>
                                </button>

                                {/* Set / Toggle Featured Store Button */}
                                {(() => {
                                  const userId = user.foodypayId || user.merchantId || user._id;
                                  const isFeat = user.isFeatured || featuredStoreIds.includes(userId) || String(featuredMerchantId) === String(userId);
                                  return (
                                    <button
                                      onClick={() => handleToggleFeaturedStore(user)}
                                      style={{
                                        backgroundColor: isFeat ? '#F59E0B' : '#1E293B',
                                        color: isFeat ? '#0F172A' : '#F59E0B',
                                        border: '1px solid #F59E0B',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                      }}
                                      title="Toggle Featured Store Status"
                                    >
                                      <Star size={13} fill={isFeat ? '#0F172A' : 'none'} />
                                      <span>{isFeat ? '⭐ Featured Store' : '+ Add Featured'}</span>
                                    </button>
                                  );
                                })()}

                                {/* Delete Account Button */}
                                <button
                                  onClick={() => {
                                    setDeleteModalUser(user);
                                    setConfirmEmailInput('');
                                  }}
                                  style={{
                                    backgroundColor: 'transparent',
                                    color: '#EF4444',
                                    border: '1px solid #7F1D1D',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                  }}
                                  title="Delete Merchant Account"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMERS & CRM */}
        {activeTab === 'customers' && (
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
              Aggregate Platform Customers &amp; CRM Database
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {aggregateCustomers.map((c, i) => (
                <div key={i} style={{ backgroundColor: '#161F33', border: '1px solid #1E293B', padding: '16px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#FFF' }}>{c.name}</div>
                  <div style={{ fontSize: '12.5px', color: '#38BDF8', marginTop: '2px' }}> {c.phone} •  {c.email}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>
                    Store: <strong>{c.merchant}</strong> • Orders: {c.ordersCount} • Total Spend: ₹{c.totalSpend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE ORDERS FEED */}
        {activeTab === 'orders' && (
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
              Live Platform Orders Feed Across All Restaurants
            </h3>
            {globalOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                <Package size={36} color="#475569" style={{ marginBottom: '8px' }} />
                <div>No live orders recorded yet in system database.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {globalOrders.map((ord, idx) => (
                  <div key={ord._id || idx} style={{ backgroundColor: '#161F33', border: '1px solid #1E293B', padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#FFF', fontSize: '14px' }}>
                        Order #{ord.orderId || ord._id.slice(-6)} • ₹{ord.total || ord.subtotal || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                        Customer: {ord.customerName || 'Diner'} ({ord.customerPhone || 'N/A'}) • Table: {ord.tableNo || 'Dine-In'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', backgroundColor: '#064E3B', color: '#6EE7B7', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                        {ord.paymentMethod ? ord.paymentMethod.toUpperCase() : 'PAID ONLINE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GLOBAL PLATFORM SUBSCRIPTION SETTINGS */}
        {activeTab === 'subscription_settings' && (
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '16px', padding: '28px', maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Settings size={24} color="#FF5E14" />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#FFF' }}>
                Global Platform Subscription &amp; Policy Settings
              </h2>
            </div>

            <form onSubmit={handleSaveGlobalSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                  Platform Title / System Name
                </label>
                <input
                  type="text"
                  value={globalSubSettings.platformName}
                  onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, platformName: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Default Monthly Subscription Price (₹/mo)
                  </label>
                  <input
                    type="number"
                    value={globalSubSettings.defaultMonthlyPrice}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, defaultMonthlyPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Default Annual Subscription Price (₹/yr)
                  </label>
                  <input
                    type="number"
                    value={globalSubSettings.defaultAnnualPrice}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, defaultAnnualPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Free Trial Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={globalSubSettings.freeTrialDays}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, freeTrialDays: Number(e.target.value) })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#CBD5E1', marginBottom: '6px' }}>
                    Billing &amp; Admin Support Email
                  </label>
                  <input
                    type="email"
                    value={globalSubSettings.supportEmail}
                    onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, supportEmail: e.target.value })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#161F33', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                <input
                  type="checkbox"
                  id="autoLock"
                  checked={globalSubSettings.autoLockExpiredAccounts}
                  onChange={(e) => setGlobalSubSettings({ ...globalSubSettings, autoLockExpiredAccounts: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="autoLock" style={{ fontSize: '13.5px', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>
                  Enforce Lock Policy: Automatically lock accounts when monthly subscription is not renewed.
                </label>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#FF5E14',
                  color: '#FFF',
                  border: 'none',
                  padding: '13px',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={18} /> Save Global Subscription Settings
              </button>
            </form>
          </div>
        )}

        {/* TAB: SUPER ADMIN DELIVERY ZONES & STORES MANAGEMENT */}
        {activeTab === 'delivery_zones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, color: '#FFFFFF' }}>
                    🚚 Delivery Zones &amp; Marketplace Store Registry
                  </h2>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#94A3B8' }}>
                    Master Super Admin control center to manage dynamic delivery zones, GPS radius geofencing, covered sectors, and store assignments.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingZoneObj(null);
                      setZoneForm({ name: '', city: 'Mohali', state: 'Punjab', pincode: '', centerLatitude: 30.7046, centerLongitude: 76.7179, radius: 5, coveredSectors: '', isActive: true });
                      setIsAddZoneModalOpen(true);
                    }}
                    style={{
                      backgroundColor: '#1E40AF',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 20px',
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(30,64,175,0.3)'
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
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '13.5px',
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

              {/* Sub-tabs for Zones vs Stores */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #1E293B', paddingBottom: '12px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setDeliverySubTab('zones')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    backgroundColor: deliverySubTab === 'zones' ? '#1E40AF' : '#1E293B',
                    color: deliverySubTab === 'zones' ? '#FFFFFF' : '#94A3B8',
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
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    backgroundColor: deliverySubTab === 'stores' ? '#1E40AF' : '#1E293B',
                    color: deliverySubTab === 'stores' ? '#FFFFFF' : '#94A3B8',
                  }}
                >
                  🏪 Stores &amp; Owner Email Access ({(storesList || []).length})
                </button>
              </div>

              {/* ZONES CARDS GRID */}
              {deliverySubTab === 'zones' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {(deliveryZones || []).map((zone) => (
                    <div key={zone._id || zone.zoneId} style={{ backgroundColor: '#161F33', borderRadius: '16px', border: '1px solid #1E293B', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                            {zone.zoneId || 'ZONE'}
                          </span>
                          <h4 style={{ margin: '6px 0 2px', fontSize: '18px', fontWeight: 900, color: '#FFF' }}>{zone.name}</h4>
                          <div style={{ fontSize: '12.5px', color: '#94A3B8' }}>📍 {zone.city}{zone.state ? `, ${zone.state}` : ''} {zone.pincode ? `(${zone.pincode})` : ''}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', background: zone.isActive !== false ? '#064E3B' : '#7F1D1D', color: zone.isActive !== false ? '#6EE7B7' : '#FECACA' }}>
                          {zone.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      {(Array.isArray(zone.coveredSectors) ? zone.coveredSectors : (zone.coveredSectors || '').split(',')).filter(Boolean).length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(Array.isArray(zone.coveredSectors) ? zone.coveredSectors : (zone.coveredSectors || '').split(',')).filter(Boolean).map((sec, i) => (
                            <span key={i} style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}>
                              🏷️ {sec.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ backgroundColor: '#0F172A', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#CBD5E1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                              coveredSectors: Array.isArray(zone.coveredSectors) ? zone.coveredSectors.join(', ') : (zone.coveredSectors || ''),
                              isActive: zone.isActive !== false,
                            });
                            setIsAddZoneModalOpen(true);
                          }}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #334155', background: '#1E293B', color: '#FFF', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Edit3 size={14} /> Edit Zone
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete zone "${zone.name}"?`)) {
                              try {
                                await deleteDeliveryZoneApi(zone._id || zone.zoneId);
                                if (onShowToast) onShowToast(`Zone "${zone.name}" deleted successfully.`);
                                loadDeliveryAndStoresData();
                              } catch (err) {
                                if (onShowToast) onShowToast(`Error deleting zone: ${err.message}`);
                              }
                            }
                          }}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #7F1D1D', background: '#451A1D', color: '#FCA5A5', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STORES CARDS GRID */}
              {deliverySubTab === 'stores' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                  {(storesList || []).map((store) => (
                    <div key={store._id || store.storeId} style={{ backgroundColor: '#161F33', borderRadius: '16px', border: '1px solid #1E293B', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#34D399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                            {store.storeId || 'STORE'}
                          </span>
                          <h4 style={{ margin: '6px 0 2px', fontSize: '18px', fontWeight: 900, color: '#FFF' }}>{store.name}</h4>
                          <div style={{ fontSize: '12.5px', color: '#94A3B8' }}>📍 {store.address}, {store.city}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', background: store.isActive !== false ? '#064E3B' : '#7F1D1D', color: store.isActive !== false ? '#6EE7B7' : '#FECACA' }}>
                          {store.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <div style={{ backgroundColor: '#0F172A', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px', color: '#60A5FA' }}>
                        <b>📧 Owner Email Access:</b> <span style={{ fontWeight: 800, textDecoration: 'underline' }}>{store.ownerEmail || 'Not Assigned'}</span>
                        {store.ownerName ? ` (${store.ownerName})` : ''}
                      </div>

                      <div style={{ backgroundColor: '#0F172A', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#CBD5E1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div><b>Store GPS:</b> {store.latitude?.toFixed(4)}, {store.longitude?.toFixed(4)}</div>
                        <div><b>Delivery Radius:</b> {store.deliveryRadius} KM</div>
                        <div><b>GST No:</b> {store.gstNumber || 'N/A'}</div>
                        <div><b>License:</b> {store.licenseNumber || 'N/A'}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '6px' }}>Assigned Delivery Zones:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {Array.isArray(store.deliveryZones) && store.deliveryZones.length > 0 ? (
                            store.deliveryZones.map((z) => (
                              <span key={z._id || z.name} style={{ background: '#1E293B', color: '#38BDF8', padding: '3px 10px', borderRadius: '12px', fontSize: '11.5px', fontWeight: 800, border: '1px solid #334155' }}>
                                📍 {z.name} ({z.city})
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#64748B', fontSize: '12px', fontStyle: 'italic' }}>No zones assigned yet</span>
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
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #1E40AF', background: '#1E3A8A', color: '#93C5FD', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
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
                          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #C2410C', background: '#431407', color: '#FDBA74', fontWeight: 800, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
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
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #334155', background: '#1E293B', color: '#FFF', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Edit3 size={14} /> Edit Details
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete store "${store.name}"?`)) {
                              try {
                                await deleteStoreApi(store._id || store.storeId);
                                if (onShowToast) onShowToast(`Store "${store.name}" deleted successfully.`);
                                loadDeliveryAndStoresData();
                              } catch (err) {
                                if (onShowToast) onShowToast(`Error deleting store: ${err.message}`);
                              }
                            }
                          }}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #7F1D1D', background: '#451A1D', color: '#FCA5A5', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ==========================================================================
          MODAL 1: LOCK / UNLOCK ACCOUNT MODAL
          ========================================================================== */}
      {lockModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '20px', padding: '24px', maxWidth: '480px', width: '100%', color: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: lockModalUser.isLocked ? '#34D399' : '#FCA5A5' }}>
                {lockModalUser.isLocked ? ' Unlock Merchant Account' : ' Lock Merchant Account'}
              </h3>
              <button onClick={() => setLockModalUser(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 16px' }}>
              Target Account: <strong>{lockModalUser.businessName || lockModalUser.name}</strong> ({lockModalUser.email})
            </p>

            {!lockModalUser.isLocked && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Lock Reason / Subscription Requirement Text:
                </label>
                <input
                  type="text"
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setLockModalUser(null)}
                style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAccountLockToggle}
                style={{
                  backgroundColor: lockModalUser.isLocked ? '#047857' : '#DC2626',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                {lockModalUser.isLocked ? 'Confirm Unlock' : 'Confirm Lock Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 2: PER-ACCOUNT SUBSCRIPTION PRICING MODAL
          ========================================================================== */}
      {subModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '20px', padding: '24px', maxWidth: '480px', width: '100%', color: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FFF' }}>
                 Manage Subscription Pricing
              </h3>
              <button onClick={() => setSubModalUser(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUserSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Plan Preset Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Select Subscription Plan Tier
                </label>
                <select
                  value={subForm.plan}
                  onChange={(e) => {
                    const p = e.target.value;
                    let pr = subForm.price;
                    if (p === 'Starter Free') pr = 0;
                    if (p === 'Growth Pro') pr = 35;
                    if (p === 'Enterprise Max') pr = 75;
                    setSubForm({ ...subForm, plan: p, price: pr });
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Starter Free">Starter Free ($0/mo)</option>
                  <option value="Growth Pro">Growth Pro ($35/mo)</option>
                  <option value="Enterprise Max">Enterprise Max ($75/mo)</option>
                  <option value="Custom Plan">Custom Plan</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Monthly Subscription Price ($ or ₹ / month) *
                </label>
                <input
                  type="number"
                  value={subForm.price}
                  onChange={(e) => setSubForm({ ...subForm, price: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Validity / Expiry Duration Quick Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '6px' }}>
                  Set Plan Validity Duration
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: '1 Month', days: 30 },
                    { label: '3 Months', days: 90 },
                    { label: '6 Months', days: 180 },
                    { label: '1 Year', days: 365 },
                    { label: 'Unlimited / Lifetime', days: 0 },
                  ].map((dur) => (
                    <button
                      key={dur.label}
                      type="button"
                      onClick={() => {
                        if (dur.days === 0) {
                          setSubForm({ ...subForm, expiry: '' });
                        } else {
                          const d = new Date();
                          d.setDate(d.getDate() + dur.days);
                          setSubForm({ ...subForm, expiry: d.toISOString().split('T')[0] });
                        }
                      }}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: '#1E293B', border: '1px solid #334155', color: '#38BDF8', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Subscription Expiry Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={subForm.expiry}
                  onChange={(e) => setSubForm({ ...subForm, expiry: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '4px' }}>
                  Subscription Status
                </label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Active">Active (Unlocked)</option>
                  <option value="Trial">Trial Period</option>
                  <option value="Expired">Expired (Locked)</option>
                  <option value="Locked">Locked (Unpaid)</option>
                  <option value="Suspended">⚠️ Suspended (Block Access)</option>
                </select>
              </div>

              {/* Account Suspension Control */}
              <div style={{ background: '#2C1517', border: '1px solid #7F1D1D', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="chkSuspend"
                  checked={subForm.status === 'Suspended' || Boolean(subForm.isSuspended)}
                  onChange={(e) => {
                    const isS = e.target.checked;
                    setSubForm({
                      ...subForm,
                      isSuspended: isS,
                      status: isS ? 'Suspended' : 'Active',
                    });
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="chkSuspend" style={{ fontSize: '12.5px', fontWeight: 800, color: '#FCA5A5', cursor: 'pointer' }}>
                  ⚠️ Suspend Merchant Account (Blocks POS &amp; Customer Menu Access)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSubModalUser(null)}
                  style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#FF5E14', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 3: DELETE USER ACCOUNT CONFIRMATION MODAL
          ========================================================================== */}
      {deleteModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #7F1D1D', borderRadius: '20px', padding: '24px', maxWidth: '500px', width: '100%', color: '#FFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#7F1D1D', color: '#FECACA', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#EF4444' }}>
                  Permanent Account Deletion
                </h3>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Action cannot be undone. Database record will be purged.</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#161F33', border: '1px solid #1E293B', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5 }}>
              Account to Delete: <strong style={{ color: '#FFF' }}>{deleteModalUser.email}</strong><br/>
              Merchant Name: <strong>{deleteModalUser.businessName || deleteModalUser.name}</strong>
            </div>

            <p style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '12px' }}>
              To confirm deletion, please type <strong style={{ color: '#EF4444' }}>{deleteModalUser.email}</strong> below:
            </p>

            <input
              type="text"
              placeholder={`Type ${deleteModalUser.email} to confirm`}
              value={confirmEmailInput}
              onChange={(e) => setConfirmEmailInput(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #7F1D1D', backgroundColor: '#1A0B0E', color: '#FFF', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteModalUser(null)}
                style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDeleteAccount}
                disabled={isDeleting || confirmEmailInput.trim().toLowerCase() !== deleteModalUser.email.trim().toLowerCase()}
                style={{
                  backgroundColor: confirmEmailInput.trim().toLowerCase() === deleteModalUser.email.trim().toLowerCase() ? '#DC2626' : '#334155',
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '13.5px',
                  cursor: confirmEmailInput.trim().toLowerCase() === deleteModalUser.email.trim().toLowerCase() ? 'pointer' : 'not-allowed',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 4: ADD / EDIT DELIVERY ZONE MODAL FOR SUPER ADMIN
          ========================================================================== */}
      {isAddZoneModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsAddZoneModalOpen(false)}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E40AF', borderRadius: '20px', padding: '28px', maxWidth: '540px', width: '100%', color: '#FFF', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={22} color="#38BDF8" />
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>
                  {editingZoneObj ? 'Edit Delivery Zone' : 'Add New Delivery Zone'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsAddZoneModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveZoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Zone Name / Sector (Dynamic) *</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="e.g. Sector 70 or Phase 7 or Downtown"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="Mohali"
                    value={zoneForm.city}
                    onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>State</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="Punjab"
                    value={zoneForm.state}
                    onChange={(e) => setZoneForm({ ...zoneForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Pincode</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="160071"
                    value={zoneForm.pincode}
                    onChange={(e) => setZoneForm({ ...zoneForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', marginBottom: '-6px' }}>
                <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>
                  📍 Google Maps Coordinates &amp; Delivery Radius
                </span>
                <button
                  type="button"
                  style={{ padding: '4px 10px', fontSize: '11.5px', background: '#1E3A8A', color: '#93C5FD', border: '1px solid #1E40AF', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setZoneForm((prev) => ({
                            ...prev,
                            centerLatitude: pos.coords.latitude,
                            centerLongitude: pos.coords.longitude,
                          }));
                          if (onShowToast) onShowToast('📍 Current GPS coordinates loaded!');
                        },
                        () => alert('Could not fetch location.')
                      );
                    }
                  }}
                >
                  📍 Fill My Current GPS Coords
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Center Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="30.7046"
                    value={zoneForm.centerLatitude}
                    onChange={(e) => setZoneForm({ ...zoneForm, centerLatitude: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Center Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="76.7179"
                    value={zoneForm.centerLongitude}
                    onChange={(e) => setZoneForm({ ...zoneForm, centerLongitude: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8' }}>
                    🚀 Interactive Delivery Coverage Radius: <span style={{ color: '#38BDF8', fontSize: '14px', fontWeight: 900 }}>{zoneForm.radius || 5} KM</span>
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                    Area: ~{(Math.PI * Math.pow(Number(zoneForm.radius || 5), 2)).toFixed(1)} sq. km
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="30"
                  step="0.5"
                  style={{ width: '100%', height: '7px', accentColor: '#38BDF8', cursor: 'pointer' }}
                  value={zoneForm.radius || 5}
                  onChange={(e) => setZoneForm({ ...zoneForm, radius: Number(e.target.value) })}
                />

                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, alignSelf: 'center' }}>Quick Presets:</span>
                  {[2, 5, 8, 10, 15, 25].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setZoneForm({ ...zoneForm, radius: val })}
                      style={{
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        borderRadius: '12px',
                        border: '1px solid #1E40AF',
                        background: Number(zoneForm.radius) === val ? '#1E40AF' : '#1E293B',
                        color: Number(zoneForm.radius) === val ? '#FFFFFF' : '#38BDF8',
                        cursor: 'pointer'
                      }}
                    >
                      {val} KM
                    </button>
                  ))}
                </div>
              </div>

              {/* COVERED SECTORS & SUB-LOCATIONS INPUT & TAGS */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  🏷️ Covered Sectors &amp; Sub-Locations in Zone (Comma Separated) *
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="e.g. Sector 70, Sector 71, Mattaur, Phase 7, Sector 61"
                  value={zoneForm.coveredSectors || ''}
                  onChange={(e) => setZoneForm({ ...zoneForm, coveredSectors: e.target.value })}
                />
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                  Click suggested sectors below to quick-add to covered zone list:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {['Sector 70', 'Sector 71', 'Mattaur', 'Phase 7', 'Sector 61', 'Sector 76', 'Phase 8', 'Phase 3B2', 'Sector 68'].map((sec) => {
                    const currentList = (zoneForm.coveredSectors || '').split(',').map(s => s.trim()).filter(Boolean);
                    const isSelected = currentList.includes(sec);
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          let newList;
                          if (isSelected) {
                            newList = currentList.filter(s => s !== sec);
                          } else {
                            newList = [...currentList, sec];
                          }
                          setZoneForm({ ...zoneForm, coveredSectors: newList.join(', ') });
                        }}
                        style={{
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '12px',
                          border: isSelected ? '1px solid #10B981' : '1px dashed #475569',
                          background: isSelected ? '#064E3B' : '#1E293B',
                          color: isSelected ? '#6EE7B7' : '#94A3B8',
                          cursor: 'pointer'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE GOOGLE MAPS PREVIEW CARD */}
              <div style={{ borderRadius: '12px', border: '1px solid #1E40AF', background: '#161F33', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ background: 'linear-gradient(90deg, #1E40AF 0%, #3B82F6 100%)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#FFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 800 }}>
                    <MapPin size={16} color="#93C5FD" />
                    <span>🗺️ Live Google Maps Delivery Zone Preview</span>
                  </div>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Radius: {zoneForm.radius || 5} KM
                  </span>
                </div>

                <div style={{ position: 'relative', height: '220px', width: '100%', background: '#0F172A' }}>
                  {zoneForm.centerLatitude && zoneForm.centerLongitude ? (
                    <iframe
                      title="Google Map Preview"
                      width="100%"
                      height="220"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${zoneForm.centerLatitude},${zoneForm.centerLongitude}&z=${Number(zoneForm.radius || 5) <= 2 ? 15 : Number(zoneForm.radius || 5) <= 5 ? 14 : Number(zoneForm.radius || 5) <= 10 ? 13 : 12}&output=embed`}
                    />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>
                      Enter Latitude &amp; Longitude to view live map preview
                    </div>
                  )}
                </div>

                <div style={{ padding: '10px 14px', background: '#0F172A', fontSize: '11.5px', color: '#93C5FD', borderTop: '1px solid #1E293B', lineHeight: '1.4' }}>
                  <b>🎯 Zone Geofence Coverage:</b> All customers within <b>{zoneForm.radius || 5} KM</b> of center ({zoneForm.centerLatitude || 30.7046}, {zoneForm.centerLongitude || 76.7179}) covering <b>{zoneForm.coveredSectors || 'Sector 70, Sector 71, Mattaur, Phase 7'}</b> will automatically get product availability &amp; delivery access.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="zoneActiveCheck"
                  checked={zoneForm.isActive}
                  onChange={(e) => setZoneForm({ ...zoneForm, isActive: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="zoneActiveCheck" style={{ fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#FFF' }}>
                  Enable Delivery in this Zone (Active)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }} onClick={() => setIsAddZoneModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ backgroundColor: '#1E40AF', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}>
                  {editingZoneObj ? 'Save Changes' : 'Create Delivery Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 5: REGISTER / EDIT STORE MODAL FOR SUPER ADMIN
          ========================================================================== */}
      {isAddStoreModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsAddStoreModalOpen(false)}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #10B981', borderRadius: '20px', padding: '28px', maxWidth: '620px', width: '100%', color: '#FFF', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Store size={22} color="#34D399" />
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900 }}>
                  {editingStoreObj ? 'Edit Store Registration' : 'Register New Store'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsAddStoreModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Store Name *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="e.g. FoodyPay Bistro Mohali"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Owner Name</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="e.g. John Doe"
                    value={storeForm.ownerName}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Owner Email Address (Assigned Access) *</label>
                <input
                  type="email"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="owner@restaurant.com"
                  value={storeForm.ownerEmail}
                  onChange={(e) => setStoreForm({ ...storeForm, ownerEmail: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>GST Number</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="07AAAAA0000A1Z5"
                    value={storeForm.gstNumber}
                    onChange={(e) => setStoreForm({ ...storeForm, gstNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>FSSAI / License Number</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="10020011000123"
                    value={storeForm.licenseNumber}
                    onChange={(e) => setStoreForm({ ...storeForm, licenseNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Address Line *</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="SCO 104, Main Market Road"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="Mohali"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>State</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="Punjab"
                    value={storeForm.state}
                    onChange={(e) => setStoreForm({ ...storeForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Pincode</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="160071"
                    value={storeForm.pincode}
                    onChange={(e) => setStoreForm({ ...storeForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Store Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="30.7046"
                    value={storeForm.latitude}
                    onChange={(e) => setStoreForm({ ...storeForm, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Store Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="76.7179"
                    value={storeForm.longitude}
                    onChange={(e) => setStoreForm({ ...storeForm, longitude: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Delivery Radius (KM) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                    placeholder="5"
                    value={storeForm.deliveryRadius}
                    onChange={(e) => setStoreForm({ ...storeForm, deliveryRadius: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }} onClick={() => setIsAddStoreModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}>
                  {editingStoreObj ? 'Save Changes' : 'Register Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 6: ASSIGN ZONES TO STORE MODAL FOR SUPER ADMIN
          ========================================================================== */}
      {isAssignStoreZonesModalOpen && selectedStoreForZones && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsAssignStoreZonesModalOpen(false)}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #1E40AF', borderRadius: '20px', padding: '28px', maxWidth: '500px', width: '100%', color: '#FFF' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900 }}>
              Assign Delivery Zones for {selectedStoreForZones.name}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {(deliveryZones || []).map((zone) => {
                const isSelected = selectedZoneIdsForStore.includes(zone._id || zone.zoneId);
                return (
                  <label key={zone._id || zone.zoneId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: isSelected ? '#1E3A8A' : '#161F33', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const targetId = zone._id || zone.zoneId;
                        if (e.target.checked) {
                          setSelectedZoneIdsForStore((prev) => [...prev, targetId]);
                        } else {
                          setSelectedZoneIdsForStore((prev) => prev.filter((id) => id !== targetId));
                        }
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13.5px' }}>{zone.name}</div>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>{zone.city} ({zone.radius} KM)</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }} onClick={() => setIsAssignStoreZonesModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#1E40AF', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}
                onClick={async () => {
                  try {
                    await assignStoreZonesApi(selectedStoreForZones._id || selectedStoreForZones.storeId, selectedZoneIdsForStore);
                    if (onShowToast) onShowToast(`Zones updated for ${selectedStoreForZones.name}!`);
                    setIsAssignStoreZonesModalOpen(false);
                    loadDeliveryAndStoresData();
                  } catch (err) {
                    if (onShowToast) onShowToast(`Error assigning zones: ${err.message}`);
                  }
                }}
              >
                Save Assigned Zones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 7: ASSIGN OWNER EMAIL ACCESS MODAL FOR SUPER ADMIN
          ========================================================================== */}
      {isAssignOwnerEmailModalOpen && selectedStoreForOwner && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsAssignOwnerEmailModalOpen(false)}>
          <div style={{ backgroundColor: '#0F172A', border: '1px solid #EA580C', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', color: '#FFF' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900 }}>
              Assign Owner Email Access for {selectedStoreForOwner.name}
            </h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Owner Email Address *</label>
              <input
                type="email"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="merchant@restaurant.com"
                value={assignOwnerEmailInput}
                onChange={(e) => setAssignOwnerEmailInput(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }} onClick={() => setIsAssignOwnerEmailModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#EA580C', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}
                onClick={async () => {
                  try {
                    await assignStoreOwnerEmailApi(selectedStoreForOwner._id || selectedStoreForOwner.storeId, assignOwnerEmailInput);
                    if (onShowToast) onShowToast(`Owner email access updated for ${selectedStoreForOwner.name}!`);
                    setIsAssignOwnerEmailModalOpen(false);
                    loadDeliveryAndStoresData();
                  } catch (err) {
                    if (onShowToast) onShowToast(`Error assigning email: ${err.message}`);
                  }
                }}
              >
                Save Owner Access Email
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==========================================================================
          MODAL 8: ASSIGN GOOGLE LOCATION, COORDINATES, RADIUS & SECTORS MODAL
          ========================================================================== */}
      {locationModalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setLocationModalUser(null)}>
          <div style={{ backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '20px', padding: '28px', maxWidth: '640px', width: '100%', color: '#FFF', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={22} color="#10B981" /> Edit Google Location &amp; Sectors: {locationModalUser.businessName || locationModalUser.name}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>
                  Assign GPS coordinates, Delivery Radius &amp; multiple covered Sectors/Areas for this business.
                </span>
              </div>
              <button type="button" style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }} onClick={() => setLocationModalUser(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLocationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* GOOGLE MAPS LOCATION & SECTOR SEARCH BAR */}
              <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '14px', position: 'relative' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Search size={16} color="#10B981" /> Search Google Location / Sector &amp; Auto-Assign
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Type location e.g. Sector 71 Mohali, Phase 7, Aerocity..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0F172A', color: '#FFF', fontSize: '13.5px', boxSizing: 'border-box' }}
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchGoogleLocation();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={isSearchingLocation}
                    style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={() => handleSearchGoogleLocation()}
                  >
                    {isSearchingLocation ? 'Searching...' : '🔍 Search Map'}
                  </button>
                </div>

                {/* SEARCH RESULTS DROPDOWN */}
                {locationSearchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#0F172A', border: '1.5px solid #10B981', borderRadius: '10px', marginTop: '6px', zIndex: 120, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                    {locationSearchResults.map((place, idx) => (
                      <div
                        key={idx}
                        style={{ padding: '10px 14px', borderBottom: '1px solid #1E293B', cursor: 'pointer', fontSize: '12.5px', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => handleSelectSearchResult(place)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E293B')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <MapPin size={16} color="#10B981" />
                        <div>
                          <strong style={{ color: '#FFF' }}>{place.display_name ? place.display_name.split(',')[0] : place.name}</strong>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{place.display_name} (Lat: {Number(place.lat).toFixed(4)}, Lng: {Number(place.lon).toFixed(4)})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QUICK SECTOR CHIPS & SELECTOR */}
              <div style={{ backgroundColor: '#161F33', border: '1px solid #334155', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚡ Quick Add / Toggle Popular Sectors &amp; Areas:</span>
                  <span style={{ fontSize: '11px', color: '#10B981' }}>Tap sector to add/remove</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Sector 71', 'Sector 70', 'Sector 68', 'Sector 67', 'Sector 62', 'Sector 82',
                    'Phase 7', 'Phase 3B2', 'Phase 5', 'Phase 10', 'Phase 11', 'Aerocity', 'IT City',
                    'Sector 17', 'Sector 35', 'Zirakpur', 'Kharar'
                  ].map((sec) => {
                    const isSelected = locationForm.coveredSectors.split(',').map((s) => s.trim().toLowerCase()).includes(sec.toLowerCase());
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleToggleQuickSector(sec)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          border: isSelected ? '1.5px solid #10B981' : '1px solid #334155',
                          backgroundColor: isSelected ? 'rgba(16,185,129,0.2)' : '#1E293B',
                          color: isSelected ? '#10B981' : '#CBD5E1',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE GOOGLE MAPS PREVIEW IFRAME */}
              <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #334155', height: '180px', backgroundColor: '#1E293B', position: 'relative' }}>
                <iframe
                  title="Google Location Preview"
                  src={`https://maps.google.com/maps?q=${locationForm.latitude},${locationForm.longitude}&z=14&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15,23,42,0.9)', color: '#10B981', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', border: '1px solid #059669' }}>
                  📍 Live Lat: {locationForm.latitude}, Lng: {locationForm.longitude} (Radius: {locationForm.deliveryRadius} KM)
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Street Address Line *</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13.5px', boxSizing: 'border-box' }}
                  value={locationForm.address}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Latitude Coordinate (Lat) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13.5px', boxSizing: 'border-box' }}
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, latitude: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Longitude Coordinate (Lng) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13.5px', boxSizing: 'border-box' }}
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, longitude: e.target.value }))}
                  />
                </div>
              </div>

              {/* DELIVERY RADIUS SLIDER */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Delivery Radius Limit:</span>
                  <span style={{ color: '#10B981' }}>{locationForm.deliveryRadius} KM</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }}
                  value={locationForm.deliveryRadius}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, deliveryRadius: e.target.value }))}
                />
              </div>

              {/* COVERED SECTORS / AREAS TAG MANAGER */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  Multiple Covered Sectors &amp; Areas (Comma Separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 70, Sector 71, Phase 7, Phase 3B2, Aerocity"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13.5px', boxSizing: 'border-box' }}
                  value={locationForm.coveredSectors}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, coveredSectors: e.target.value }))}
                />
                
                {/* ACTIVE SECTOR BADGES */}
                {locationForm.coveredSectors.trim() && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {locationForm.coveredSectors.split(',').map((secStr, sIdx) => {
                      const cleanSec = secStr.trim();
                      if (!cleanSec) return null;
                      return (
                        <span
                          key={sIdx}
                          style={{
                            backgroundColor: '#0F172A',
                            border: '1px solid #10B981',
                            color: '#10B981',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          📍 {cleanSec}
                          <button
                            type="button"
                            onClick={() => handleToggleQuickSector(cleanSec)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 900 }}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                  Customers searching in these sectors will automatically be assigned to this business store.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>City</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }}
                    value={locationForm.city}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>State</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }}
                    value={locationForm.state}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Pincode</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1E293B', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }}
                    value={locationForm.pincode}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, pincode: e.target.value }))}
                  />
                </div>
              </div>

              {/* WHITE LABEL TOGGLE */}
              <div style={{ backgroundColor: '#161F33', border: '1px solid #334155', padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFF' }}>🏷️ White Label Enterprise Account</div>
                  <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>Removes FoodyPay branding, activates custom domain &amp; dedicated app.</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                  checked={locationForm.isWhiteLabel}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, isWhiteLabel: e.target.checked }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }} onClick={() => setLocationModalUser(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: 900, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Save Location &amp; Sectors
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
