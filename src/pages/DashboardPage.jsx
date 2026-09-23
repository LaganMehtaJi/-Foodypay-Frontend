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
  X,
  Menu,
  Cake,
  Share2,
  Trash2,
  CheckCircle2,
  Frown,
  Tag,
  Percent,
} from 'lucide-react';
import {
  playOrderPlaced,
  playFoodPreparing,
  playFoodReady,
  playBillPaid,
  playMilestoneCelebration,
} from '../utils/soundEffects';
import { QrCodeComponent } from '../utils/qrGenerator';
import {
  fetchOrdersApi,
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
} from '../utils/api';
import './Dashboard.css';

// Initial Mock Datasets with Real Food Photography Images
const INITIAL_DISHES = [
  {
    id: 'p1',
    name: 'ITALIAN CHEESE GIANT SLICE',
    category: 'Fast Food',
    price: 199,
    isVeg: true,
    variantsCount: 4,
    inStock: true,
    desc: 'Oversized New York style slice loaded with mozzarella & Italian herbs.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p2',
    name: 'ITALIAN CHEESE Small. Piza',
    category: 'Fast Food',
    price: 240,
    isVeg: true,
    variantsCount: 4,
    inStock: true,
    desc: 'Classic 8-inch hand-tossed crust with aromatic san marzano tomato puree.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p3',
    name: 'Free Stuffed Garlic Bread on Medium Pizza',
    category: 'Fast Food',
    price: 380,
    isVeg: true,
    variantsCount: 4,
    inStock: true,
    desc: 'Signature combo with garlic bread stuffed with liquid cheese & sweet corn.',
    image: 'https://images.unsplash.com/photo-1619881589178-57845347f7d1?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p4',
    name: 'ITALIAN CHEESE. Pizza Large',
    category: 'Fast Food',
    price: 490,
    isVeg: true,
    variantsCount: 4,
    inStock: true,
    desc: '12-inch party pizza with triple cheese blend and garlic butter glaze.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p5',
    name: 'ITALIAN CHEESE MONSTER PIZZA',
    category: 'Fast Food',
    price: 699,
    isVeg: true,
    variantsCount: 4,
    inStock: true,
    desc: 'Giant 16-inch monster crust loaded with gourmet cheeses and toppings.',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p6',
    name: 'Crispy Corn Basket',
    category: 'Starters',
    price: 180,
    isVeg: true,
    variantsCount: 2,
    inStock: true,
    desc: 'Sweet American corn tossed with peri peri spices and bell peppers.',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p7',
    name: 'Paneer Butter Masala',
    category: 'Main Course',
    price: 260,
    isVeg: true,
    variantsCount: 3,
    inStock: true,
    desc: 'Soft paneer cubes simmered in rich creamy tomato and butter gravy.',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p8',
    name: 'Virgin Mint Mojito',
    category: 'Beverages',
    price: 120,
    isVeg: true,
    variantsCount: 1,
    inStock: true,
    desc: 'Fresh garden mint, crushed ice, lime, and sparkling soda.',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p9',
    name: 'Choco Lava Cake',
    category: 'Desserts',
    price: 99,
    isVeg: true,
    variantsCount: 1,
    inStock: true,
    desc: 'Warm chocolate cake with molten center, dusted with powdered sugar.',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p10',
    name: 'Tandoori Chicken Tikka',
    category: 'Starters',
    price: 320,
    isVeg: false,
    variantsCount: 2,
    inStock: true,
    desc: 'Charcoal grilled boneless chicken with hung curd and Kashmiri spices.',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p11',
    name: 'Butter Garlic Naan',
    category: 'Breads',
    price: 50,
    isVeg: true,
    variantsCount: 1,
    inStock: true,
    desc: 'Crisp leavened flatbread brushed with garlic butter.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'p12',
    name: 'Royal Gulab Jamun (2 Pcs)',
    category: 'Desserts',
    price: 90,
    isVeg: true,
    variantsCount: 1,
    inStock: true,
    desc: 'Golden fried khoya dumplings immersed in warm saffron sugar nectar.',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
  },
];

const INITIAL_ORDERS = [
  {
    id: '#FP-1081',
    type: 'Dine-In',
    table: 'Table 1',
    customer: 'Aarav Sharma',
    phone: '+91 98112 34567',
    time: '6m ago',
    timestamp: Date.now() - 6 * 60 * 1000,
    status: 'preparing', // 'new' | 'preparing' | 'ready' | 'completed'
    paymentStatus: 'paid-upi',
    paymentLabel: 'Paid via UPI',
    items: [
      { name: 'ITALIAN CHEESE GIANT SLICE', qty: 2, price: 199, isVeg: true },
      { name: 'Virgin Mint Mojito', qty: 2, price: 120, isVeg: true },
    ],
    note: 'Extra cheese seasonings please.',
    subtotal: 638,
    tax: 32,
    total: 670,
  },
  {
    id: '#FP-1082',
    type: 'Dine-In',
    table: 'Table 2',
    customer: 'Sneha Patel',
    phone: '+91 97234 56789',
    time: '2m ago',
    timestamp: Date.now() - 2 * 60 * 1000,
    status: 'new',
    paymentStatus: 'cash',
    paymentLabel: 'Cash on Counter',
    items: [
      { name: 'Free Stuffed Garlic Bread on Medium Pizza', qty: 1, price: 380, isVeg: true },
      { name: 'ITALIAN CHEESE Small. Piza', qty: 1, price: 240, isVeg: true },
    ],
    note: 'Birthday dining table! Special desserts.',
    subtotal: 620,
    tax: 31,
    total: 651,
  },
  {
    id: '#FP-1083',
    type: 'Takeaway',
    table: 'Counter 1',
    customer: 'Vikram Malhotra',
    phone: '+91 99887 76655',
    time: '15m ago',
    timestamp: Date.now() - 15 * 60 * 1000,
    status: 'ready',
    paymentStatus: 'paid-upi',
    paymentLabel: 'Paid via UPI',
    items: [
      { name: 'ITALIAN CHEESE MONSTER PIZZA', qty: 1, price: 699, isVeg: true },
      { name: 'Choco Lava Cake', qty: 2, price: 99, isVeg: true },
    ],
    note: 'Pack with extra tissue & oregano sachets.',
    subtotal: 897,
    tax: 45,
    total: 942,
  },
  {
    id: '#FP-1084',
    type: 'Dine-In',
    table: 'Table 4',
    customer: 'Kunal Singhania',
    phone: '+91 94567 12345',
    time: '42m ago',
    timestamp: Date.now() - 42 * 60 * 1000,
    status: 'completed',
    paymentStatus: 'paid-upi',
    paymentLabel: 'Paid via UPI',
    items: [
      { name: 'Crispy Corn Basket', qty: 1, price: 180, isVeg: true },
      { name: 'Paneer Butter Masala', qty: 1, price: 260, isVeg: true },
      { name: 'Butter Garlic Naan', qty: 3, price: 50, isVeg: true },
    ],
    note: '',
    subtotal: 590,
    tax: 29,
    total: 619,
  },
];

const INITIAL_CUSTOMERS = [
  {
    id: 'c1',
    name: 'Aarav Sharma',
    phone: '+91 98112 34567',
    ordersCount: 8,
    totalSales: 4250,
    birthday: 'Today',
    isBirthdayToday: true,
    lastOrdered: 'Today at 08:24 PM',
  },
  {
    id: 'c2',
    name: 'Sneha Patel',
    phone: '+91 97234 56789',
    ordersCount: 5,
    totalSales: 2890,
    birthday: 'Today',
    isBirthdayToday: true,
    lastOrdered: 'Today at 08:48 PM',
  },
  {
    id: 'c3',
    name: 'Kunal Singhania',
    phone: '+91 94567 12345',
    ordersCount: 12,
    totalSales: 8400,
    birthday: 'Today',
    isBirthdayToday: true,
    lastOrdered: 'Today at 07:15 PM',
  },
  {
    id: 'c4',
    name: 'Vikram Malhotra',
    phone: '+91 99887 76655',
    ordersCount: 6,
    totalSales: 3950,
    birthday: '14 Oct',
    isBirthdayToday: false,
    lastOrdered: 'Today at 08:12 PM',
  },
  {
    id: 'c5',
    name: 'Pooja Verma',
    phone: '+91 98991 22334',
    ordersCount: 4,
    totalSales: 1820,
    birthday: '22 Nov',
    isBirthdayToday: false,
    lastOrdered: 'Yesterday at 09:30 PM',
  },
  {
    id: 'c6',
    name: 'Rohan Gupta',
    phone: '+91 91234 56780',
    ordersCount: 9,
    totalSales: 6100,
    birthday: '05 Dec',
    isBirthdayToday: false,
    lastOrdered: '3 days ago',
  },
];

const INITIAL_COUPONS = [
  { code: 'WELCOME50', discount: '50% OFF up to ₹100', minOrder: 199, uses: 142, status: 'Active' },
  { code: 'FOODYPAY20', discount: 'Flat 20% OFF', minOrder: 499, uses: 89, status: 'Active' },
  { code: 'WEEKENDTREAT', discount: 'Flat ₹100 OFF', minOrder: 799, uses: 64, status: 'Active' },
  { code: 'BDAYSPECIAL', discount: 'Free Dessert + 20% OFF', minOrder: 399, uses: 31, status: 'Active' },
];

const INITIAL_TABLES = [
  { id: 't1', name: 'Table 1', capacity: 4, section: 'Indoor AC Dining', purpose: 'Contactless Self Ordering', theme: 'acrylic', qrColor: '#1E293B', cornerColor: '#FF5E14', url: 'https://foodypay.in/menu?rest=sharma&table=1', status: 'occupied' },
  { id: 't2', name: 'Table 2', capacity: 2, section: 'Indoor AC Dining', purpose: 'Dine-In Contactless', theme: 'luxury', qrColor: '#F59E0B', cornerColor: '#F59E0B', url: 'https://foodypay.in/menu?rest=sharma&table=2', status: 'occupied' },
  { id: 't3', name: 'Table 3', capacity: 4, section: 'Indoor AC Dining', purpose: 'Contactless Self Ordering', theme: 'neon', qrColor: '#FF5E14', cornerColor: '#FF5E14', url: 'https://foodypay.in/menu?rest=sharma&table=3', status: 'available' },
  { id: 't4', name: 'Table 4', capacity: 6, section: 'Outdoor Garden', purpose: 'Garden Table Ordering', theme: 'acrylic', qrColor: '#059669', cornerColor: '#059669', url: 'https://foodypay.in/menu?rest=sharma&table=4', status: 'available' },
  { id: 't5', name: 'Table 5', capacity: 4, section: 'Outdoor Garden', purpose: 'Garden Table Ordering', theme: 'acrylic', qrColor: '#1E293B', cornerColor: '#FF5E14', url: 'https://foodypay.in/menu?rest=sharma&table=5', status: 'available' },
  { id: 't6', name: 'Table 6', capacity: 8, section: 'VIP Rooftop Lounge', purpose: 'VIP Rooftop Service', theme: 'luxury', qrColor: '#F59E0B', cornerColor: '#F59E0B', url: 'https://foodypay.in/menu?rest=sharma&table=6', status: 'reserved' },
];

export default function DashboardPage({ onShowToast }) {
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('home_orders');
  const [catalogSubmenuOpen, setCatalogSubmenuOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Datasets - default to empty array if user token is present, otherwise fallback
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [tables, setTables] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [cardsPerRow, setCardsPerRow] = useState(4);

  const [storeControls, setStoreControls] = useState(() => {
    try {
      const savedUser = localStorage.getItem('foodypay_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        return {
          foodypayId: u.foodypayId || 'FP-849201',
          storeStatus: true,
          deliveryStatus: true,
          pickupStatus: true,
          storeType: 'Business to Customer (B2C)',
          restName: u.businessName || u.name || "My Restaurant",
          phone: u.contactNo || u.phone || '',
          logoUrl: u.logo?.url || '',
          address: 'Connaught Place, New Delhi',
          upiId: 'sharmafoody@icici',
          gstPercent: 5,
        };
      }
    } catch (e) {}
    return {
      foodypayId: 'FP-849201',
      storeStatus: true,
      deliveryStatus: true,
      pickupStatus: true,
      storeType: 'Business to Customer (B2C)',
      restName: "My Restaurant",
      phone: '',
      logoUrl: '',
      address: '',
      upiId: '',
      gstPercent: 5,
    };
  });

  // Unique Table URL Generator: Domain / BusinessName / FoodypayId / TableNo
  const getUniqueTableUrl = (tableName, customUrl = '') => {
    if (customUrl && customUrl.trim()) return customUrl.trim();
    const bizSlug = (storeControls.restName || 'sharmas-kitchen')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const tableSlug = (tableName || 'table-1')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const fpId = storeControls.foodypayId || 'FP-849201';
    return `https://foodypay.in/${bizSlug}/${fpId}/${tableSlug}`;
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
        const [ordersRes, dishesRes, customersRes, couponsRes, tablesRes, settingsRes] = await Promise.allSettled([
          fetchOrdersApi(token),
          fetchDishesApi(token),
          fetchCustomersApi(token),
          fetchCouponsApi(token),
          fetchTablesApi(token),
          fetchSettingsApi(token),
        ]);

        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) setOrders(ordersRes.value);
        else setOrders(INITIAL_ORDERS);

        if (dishesRes.status === 'fulfilled' && Array.isArray(dishesRes.value)) setDishes(dishesRes.value);
        else setDishes(INITIAL_DISHES);

        if (customersRes.status === 'fulfilled' && Array.isArray(customersRes.value)) setCustomers(customersRes.value);
        else setCustomers(INITIAL_CUSTOMERS);

        if (couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value)) setCoupons(couponsRes.value);
        else setCoupons(INITIAL_COUPONS);

        if (tablesRes.status === 'fulfilled' && Array.isArray(tablesRes.value)) setTables(tablesRes.value);
        else setTables(INITIAL_TABLES);
        if (settingsRes.status === 'fulfilled' && settingsRes.value) {
          const s = settingsRes.value;
          setStoreControls((prev) => ({
            ...prev,
            restName: s.restName || prev.restName,
            phone: s.phone || prev.phone,
            address: s.address || prev.address,
            upiId: s.upiId || prev.upiId,
            gstPercent: s.gstPercent !== undefined ? s.gstPercent : prev.gstPercent,
            storeStatus: s.storeStatus !== undefined ? s.storeStatus : prev.storeStatus,
          }));
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

  // Context-Aware Global Keyboard Shortcut: Pressing single 'C' or 'c' outside input fields opens the creation modal for the active page
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

      if (isInput) return;

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
  }, [activeTab]);

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
          setOrders((prev) => [createdOrder, ...prev]);
          const updatedCustomers = await fetchCustomersApi(token);
          setCustomers(updatedCustomers || []);
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
          ? { ...ord, total: finalTotal, status: 'completed', paymentStatus: 'cash', paymentLabel: 'Cash on Counter' }
          : ord
      )
    );

    if (token) {
      try {
        await updateOrderApi(token, orderId, { ...activeBillSettlementOrder, total: finalTotal, status: 'completed', paymentStatus: 'cash' });
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
          ? { ...ord, total: finalTotal, status: 'completed', paymentStatus: 'paid-upi', paymentLabel: 'Paid via UPI QR' }
          : ord
      )
    );

    if (token) {
      try {
        await updateOrderApi(token, orderId, { ...activeBillSettlementOrder, total: finalTotal, status: 'completed', paymentStatus: 'paid-upi' });
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
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId || ord._id === orderId ? { ...ord, status: newStatus } : ord))
    );

    if (token) {
      try {
        const orderObj = orders.find((o) => o.id === orderId || o._id === orderId);
        if (orderObj && orderObj._id) {
          await updateOrderStatusApi(token, orderObj._id, newStatus);
        }
      } catch (err) {
        console.warn('API error updating status:', err);
      }
    }

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
    isVeg: true,
    isSpecial: false,
    desc: '',
    variantsCount: 1,
    image: '',
  });

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductLogoFile(file);
      setProductLogoPreview(URL.createObjectURL(file));
    }
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

    const finalImage = productLogoPreview || newProductForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

    if (token) {
      try {
        const formData = new FormData();
        formData.append('name', newProductForm.name.trim().toUpperCase());
        formData.append('category', newProductForm.category);
        formData.append('price', newProductForm.price);
        formData.append('isVeg', newProductForm.isVeg);
        formData.append('isSpecial', newProductForm.isSpecial);
        formData.append('desc', newProductForm.desc || 'Prepared fresh with high quality ingredients.');
        if (productLogoFile) {
          formData.append('image', productLogoFile);
        } else if (newProductForm.image) {
          formData.append('imageUrl', newProductForm.image);
        }

        const createdDish = await createDishApi(token, formData);
        setDishes((prev) => [createdDish, ...prev]);
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
        isVeg: newProductForm.isVeg,
        isSpecial: newProductForm.isSpecial,
        isPinned: newProductForm.isSpecial,
        variantsCount: 1,
        inStock: true,
        desc: newProductForm.desc || 'Prepared fresh with high quality ingredients.',
        image: {
          url: finalImage,
        },
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
      isVeg: true,
      isSpecial: false,
      desc: '',
      variantsCount: 1,
      image: '',
    });
    triggerSound(playMilestoneCelebration);
    addToast(`Added product "${newProductForm.name}" to catalog!`, <Check size={18} />);
  };

  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    if (!editProductForm || !editProductForm.name.trim() || !editProductForm.price) return;

    setDishes((prev) => 
      prev.map(dish => {
        if (dish.id === editProductForm.id) {
          return {
            ...dish,
            name: editProductForm.name.trim().toUpperCase(),
            category: editProductForm.category,
            price: Number(editProductForm.price),
            isVeg: editProductForm.isVeg,
            variantsCount: editProductForm.sizes.length,
            sizes: editProductForm.sizes,
            desc: editProductForm.desc || 'Prepared fresh with high quality ingredients.',
            images: editProductForm.images?.length ? editProductForm.images : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'],
            image: editProductForm.images?.[0] || editProductForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
            isPinned: editProductForm.isPinned,
          };
        }
        return dish;
      })
    );
    addToast('Product Updated Successfully', <Check size={14}/>);
    setIsEditProductModalOpen(false);
    setEditProductForm(null);
  };

  // ==========================================================================
  // 3. MARKETING & BIRTHDAY NOTIFICATIONS
  // ==========================================================================
  const [isCreateCouponOpen, setIsCreateCouponOpen] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discount: '',
    minOrder: 299,
  });

  const birthdayCustomers = customers.filter((c) => c.isBirthdayToday);

  const handleSendBirthdayPushNotification = () => {
    if (creditsBalance < 15) {
      addToast('Insufficient FoodyPay Credits. Please recharge credits.', <CreditCard size={18} />);
      return;
    }

    setCreditsBalance((prev) => prev - 15);
    triggerSound(playMilestoneCelebration);
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.3 } });

    addToast(
      `Push Notification & WhatsApp Gift Coupon (BDAYSPECIAL) sent to ${birthdayCustomers.length} Birthday Customers!`,
      <Gift size={18} />
    );
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    if (!newCouponForm.code.trim() || !newCouponForm.discount.trim()) return;

    if (token) {
      try {
        const createdCoupon = await createCouponApi(token, {
          code: newCouponForm.code.trim().toUpperCase(),
          discount: newCouponForm.discount.trim(),
          minOrder: Number(newCouponForm.minOrder) || 199,
        });
        setCoupons((prev) => [createdCoupon, ...prev]);
      } catch (err) {
        console.warn('API error creating coupon:', err);
      }
    } else {
      const newC = {
        code: newCouponForm.code.trim().toUpperCase(),
        discount: newCouponForm.discount.trim(),
        minOrder: Number(newCouponForm.minOrder) || 199,
        uses: 0,
        status: 'Active',
      };
      setCoupons((prev) => [newC, ...prev]);
    }

    setIsCreateCouponOpen(false);
    addToast(`Coupon "${newCouponForm.code.toUpperCase()}" created and active!`, <Check size={18} />);
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

  // Orders Filter
  const [orderTabFilter, setOrderTabFilter] = useState('all');
  const filteredOrders = (orders || []).filter((o) => {
    if (!o) return false;
    if (orderTabFilter === 'all') return true;
    return o.status === orderTabFilter;
  });

  return (
    <div className="crm-layout">
      {/* ==========================================================================
          1. CLEAN WHITE SIDEBAR (Ref: Image 1 & 3)
          ========================================================================== */}
      <aside className={`crm-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="crm-sidebar-brand">
          <a href="/" className="crm-brand-group">
            <img
              src={storeControls.logoUrl || "/Logo.png"}
              alt="FoodyPay Logo"
              className="crm-brand-img"
              style={{ objectFit: 'cover', borderRadius: '10px' }}
            />
            <div>
              <div className="crm-brand-title">{storeControls.restName}</div>
              <div className="crm-brand-subtitle">
                <span className="crm-brand-live-dot" /> Cloud POS Active
              </div>
            </div>
          </a>
        </div>

        <nav className="crm-sidebar-menu">
          {/* 1. Home / Orders */}
          <button
            type="button"
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

          {/* 2. Catalog / Products */}
          <div>
            <button
              type="button"
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

            {catalogSubmenuOpen && (
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
                  className="crm-submenu-item"
                  onClick={() => {
                    setActiveTab('catalog');
                    setSelectedCategory('All');
                  }}
                >
                  <span>Collections</span>
                </button>
                <button
                  type="button"
                  className="crm-submenu-item"
                  onClick={() => addToast('Customer Reviews: 4.8/5 Star rating average across 180 diners!')}
                >
                  <span>Customer Reviews</span>
                </button>
                <button
                  type="button"
                  className="crm-submenu-item"
                  onClick={() => addToast('Diner Wishlist feature activated!')}
                >
                  <span>Wishlists</span>
                  <span className="crm-badge-new">New</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Grow */}
          <button
            type="button"
            className={`crm-menu-link ${activeTab === 'grow' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('grow');
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon">
                <TrendingUp size={20} />
              </span>
              <span>Grow</span>
            </div>
          </button>

          {/* 4. Utilities (Table QR Generator) */}
          <button
            type="button"
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

          {/* 5. Marketing */}
          <button
            type="button"
            className={`crm-menu-link ${activeTab === 'marketing' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('marketing');
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon">
                <Megaphone size={20} />
              </span>
              <span>Marketing</span>
            </div>
          </button>

          {/* 6. Customers */}
          <button
            type="button"
            className={`crm-menu-link ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('customers');
              setMobileMenuOpen(false);
            }}
          >
            <div className="crm-menu-link-left">
              <span className="crm-menu-icon">
                <Users size={20} />
              </span>
              <span>Customers</span>
            </div>
          </button>

          {/* 7. Settings */}
          <button
            type="button"
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
        </nav>

        {/* BOTTOM SIDEBAR CARD: FoodyPay credits */}
        <div className="crm-sidebar-credits-card">
          <div className="crm-credits-icon-box">
            <CreditCard size={22} color="#1D4ED8" />
          </div>
          <div className="crm-credits-info">
            <span className="crm-credits-title">FoodyPay credits</span>
            <div className="crm-credits-amount">₹{creditsBalance.toLocaleString()}</div>
          </div>
          <button
            type="button"
            style={{
              background: '#EFF8FF',
              border: '1.5px solid #B2DDFF',
              color: '#1D4ED8',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            onClick={() => {
              setCreditsBalance((prev) => prev + 1000);
              addToast('Recharged ₹1,000 FoodyPay credits!', <Check size={18} />);
              triggerSound(playMilestoneCelebration);
            }}
          >
            + Add
          </button>
        </div>
      </aside>

      {/* ==========================================================================
          2. MAIN CONTENT AREA
          ========================================================================== */}
      <main className="crm-main">
        {/* TOPBAR */}
        <header className="crm-header-bar">
          <div className="crm-header-left">
            <h1 className="crm-page-heading">
              {activeTab === 'home_orders' && 'Home / Orders'}
              {activeTab === 'catalog' && 'Catalog / Products'}
              {activeTab === 'grow' && 'Grow / Business Telemetry'}
              {activeTab === 'utilities' && 'Utilities & Table QR Generator'}
              {activeTab === 'marketing' && 'Marketing & Birthday Push Notifications'}
              {activeTab === 'customers' && 'Customers Directory & Loyalty'}
              {activeTab === 'store_controls' && 'Store controls'}
            </h1>
          </div>
        </header>

        {/* ==========================================================================
            VIEW 1: HOME / ORDERS
            ========================================================================== */}
        {activeTab === 'home_orders' && (
          <div className="crm-orders-page-wrap">
            {/* 4 SPATIOUS KPI CARDS WITH LUCIDE ICONS */}
            <div className="crm-kpi-banner-grid">
              <div className="crm-kpi-card">
                <div>
                  <div className="crm-kpi-label" style={{ fontWeight: 600, color: '#475569' }}>Today's Orders</div>
                  <div className="crm-kpi-value">{orders.length}</div>
                </div>
                <div className="crm-kpi-icon-box" style={{ background: '#EFF6FF', color: '#1D4ED8', width: '56px', height: '56px' }}>
                  <ShoppingBag size={26} />
                </div>
              </div>

              <div className="crm-kpi-card">
                <div>
                  <div className="crm-kpi-label" style={{ fontWeight: 600, color: '#475569' }}>Today's Sales</div>
                  <div className="crm-kpi-value" style={{ color: '#059669' }}>₹{(orders || []).reduce((sum, o) => sum + (o ? (Number(o.total) || 0) : 0), 0).toLocaleString()}</div>
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

            {/* FILTER BAR WITH CARDS PER ROW SELECTOR */}
            <div className="crm-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    className={`crm-filter-tab ${orderTabFilter === f.key ? 'active' : ''}`}
                    onClick={() => setOrderTabFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
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

            {/* ORDERS GRID - DYNAMIC COLUMNS (1 TO 6 LIMITS) */}
            <div
              className="crm-orders-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: cardsPerRow === 1 ? '1fr' : `repeat(${cardsPerRow}, minmax(min(100%, 220px), 1fr))`,
                gap: '14px',
              }}
            >
              {(filteredOrders || []).map((order, idx) => {
                const orderKey = order._id || order.id || `ord_${idx}`;
                const orderDisplayId = order.orderId || order.id || '#FP-1081';
                const stepIndex =
                  order.status === 'new' ? 0 : order.status === 'preparing' ? 1 : order.status === 'ready' ? 2 : 3;

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
                    onClick={() => {
                      if (order.status === 'completed' || order.status === 'cancelled') {
                        setViewingOrderDetails(order);
                      }
                    }}
                  >
                    <div className="crm-order-card-header">
                      <div className="crm-order-id-group">
                        <span className="crm-order-id">{orderDisplayId}</span>
                        <span className="crm-table-tag highlight">{order.table}</span>
                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>({order.type})</span>
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
                        {['Placed', 'Kitchen', 'Ready', 'Served'].map((l, idx) => (
                          <div
                            key={l}
                            className={`crm-step-node ${order.status === 'cancelled' ? 'cancelled' : idx <= stepIndex ? 'done' : ''} ${idx === stepIndex && order.status !== 'cancelled' ? 'current' : ''}`}
                          >
                            <div className="crm-step-circle">
                              {order.status === 'cancelled' ? '✕' : idx <= stepIndex ? '✓' : idx + 1}
                            </div>
                            <span className="crm-step-label">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="crm-order-card-body">
                      <div className="crm-customer-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} /> {order.customer}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

                      {order.note && (
                        <div className="crm-special-note">
                          <Edit3 size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{order.note}</span>
                        </div>
                      )}
                    </div>

                    <div className="crm-order-card-footer" onClick={(e) => e.stopPropagation()}>
                      <div className="crm-order-total-row">
                        <div className="crm-total-amount">₹{order.total}</div>
                        <span className={`crm-payment-pill ${order.paymentStatus}`}>{order.paymentLabel}</span>
                      </div>

                      <div className="crm-card-actions-grid">
                        {order.status === 'new' && (
                          <>
                            <button
                              type="button"
                              className="crm-btn-action fire"
                              onClick={() => handleUpdateOrderStatus(order._id || order.id, 'preparing')}
                              title="Start Cooking in Kitchen"
                            >
                              <ChefHat size={15} />
                              <span>Start Cooking</span>
                            </button>
                            <button
                              type="button"
                              className="crm-btn-action edit"
                              onClick={() => handleEditOrder(order)}
                              title="Edit Order items before cooking"
                            >
                              <Edit3 size={15} />
                              <span>Edit Order</span>
                            </button>
                            <button
                              type="button"
                              className="crm-btn-action settle"
                              onClick={() => handleOpenBillSettlement(order)}
                              title="Settle Bill Cash/UPI"
                            >
                              <CreditCard size={15} />
                              <span>Bill Settlement</span>
                            </button>
                            <button
                              type="button"
                              className="crm-btn-action cancel"
                              onClick={() => handleUpdateOrderStatus(order._id || order.id, 'cancelled')}
                              title="Cancel Order"
                            >
                              <X size={15} />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}

                        {order.status === 'preparing' && (
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="crm-locked-cooking-badge">
                              <Lock size={13} />
                              <span>In Kitchen (Cooking) — Item Editing Locked</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="crm-btn-action ready-btn"
                                style={{ flex: 1 }}
                                onClick={() => handleUpdateOrderStatus(order._id || order.id, 'ready')}
                              >
                                <Bell size={15} />
                                <span>Food is Ready</span>
                              </button>
                              <button
                                type="button"
                                className="crm-btn-action settle"
                                style={{ flex: 1 }}
                                onClick={() => handleOpenBillSettlement(order)}
                              >
                                <CreditCard size={15} />
                                <span>Settle Bill</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {order.status === 'ready' && (
                          <button
                            type="button"
                            className="crm-btn-action settle full-w"
                            onClick={() => handleOpenBillSettlement(order)}
                          >
                            <CreditCard size={16} />
                            <span>Bill Settlement &amp; Complete</span>
                          </button>
                        )}

                        {order.status === 'completed' && (
                          <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="crm-btn-secondary"
                              style={{ flex: 1 }}
                              onClick={() => setViewingOrderDetails(order)}
                            >
                              <Eye size={15} />
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
                  {(filteredDishes || []).map((dish, idx) => {
                    const dishKey = dish._id || dish.id || `dish_${idx}`;
                    const dishImgUrl = typeof dish.image === 'string' ? dish.image : (dish.image?.url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80');

                    return (
                      <tr key={dishKey}>
                        <td>
                          <div className="crm-product-info-cell">
                            {/* Real Food Image Thumbnail */}
                            <div className="crm-prod-thumb-box">
                              <img
                                src={dishImgUrl}
                                alt={dish.name}
                                className="crm-prod-thumb-img"
                                loading="lazy"
                              />
                            </div>
                          <div>
                            <div className="crm-prod-name-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{dish.name}</span>
                              {(dish.isSpecial || dish.isPinned) && (
                                <span style={{ fontSize: '11px', background: '#FFF7ED', color: '#EA580C', border: '1px solid #FFEDD5', padding: '2px 7px', borderRadius: '10px', fontWeight: 800 }}>
                                  ⭐ Special
                                </span>
                              )}
                            </div>
                            {dish.desc && (
                              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {dish.desc}
                              </div>
                            )}
                            <span className="crm-prod-variants-badge">
                              View {dish.variantsCount || 1} variants
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#475569', fontSize: '13px', background: '#F1F5F9', display: 'inline-block', padding: '4px 10px', borderRadius: '6px' }}>
                          {dish.category || 'Uncategorized'}
                        </div>
                      </td>
                      <td>
                        <div className="crm-prod-price">₹{dish.price}</div>
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
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="crm-edit-icon-btn"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                          onClick={() => {
                            setEditProductForm({
                              ...dish,
                              sizes: dish.sizes && dish.sizes.length > 0 ? dish.sizes : [{ name: 'Regular', price: dish.price, qty: 100 }],
                              images: dish.images && dish.images.length > 0 ? dish.images : (dishImgUrl ? [dishImgUrl] : [])
                            });
                            setIsEditProductModalOpen(true);
                          }}
                        >
                           <Edit3 size={18}/>
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
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
                onClick={() => addToast('Bulk Edit Mode: Edit prices of all items.')}
              >
                <Lock size={14} />
                <span>BULK EDIT</span>
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
            VIEW 3: GROW (Analytics)
            ========================================================================== */}
        {activeTab === 'grow' && (
          <div style={{ padding: '32px 42px' }}>
            <div className="crm-analytics-grid">
              <div className="crm-analytics-card">
                <div className="crm-analytics-card-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={20} color="#1D4ED8" />
                    <span>Peak Dining Rush (Orders Volume)</span>
                  </div>
                </div>
                <div className="crm-bar-chart">
                  {[
                    { label: '12 PM', val: 35 },
                    { label: '1 PM', val: 75 },
                    { label: '2 PM', val: 85 },
                    { label: '3 PM', val: 40 },
                    { label: '5 PM', val: 30 },
                    { label: '7 PM', val: 80 },
                    { label: '8 PM', val: 100 },
                    { label: '9 PM', val: 95 },
                    { label: '10 PM', val: 60 },
                  ].map((b, idx) => (
                    <div key={idx} className="crm-bar-col">
                      <div className="crm-bar-fill" style={{ height: `${b.val}%` }} />
                      <span className="crm-bar-label">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="crm-analytics-card">
                <div className="crm-analytics-card-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Utensils size={20} color="#FF5E14" />
                    <span>Category Share</span>
                  </div>
                </div>
                <div className="crm-progress-cat-list">
                  {[
                    { name: 'Fast Food / Pizzas', percent: 52, color: '#1570EF' },
                    { name: 'Starters & Appetizers', percent: 24, color: '#F79009' },
                    { name: 'Beverages & Drinks', percent: 14, color: '#12B76A' },
                    { name: 'Desserts & Sweets', percent: 10, color: '#7A5AF8' },
                  ].map((c, idx) => (
                    <div key={idx} className="crm-cat-row">
                      <div className="crm-cat-meta">
                        <span>{c.name}</span>
                        <span>{c.percent}%</span>
                      </div>
                      <div className="crm-cat-bar-bg">
                        <div className="crm-cat-bar-fill" style={{ width: `${c.percent}%`, background: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                      <div style={{ fontSize: '13.5px', fontWeight: 900, marginBottom: '6px' }}>
                        {storeControls.restName || "Sharma's Kitchen"}
                      </div>

                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 900,
                          padding: '4px 14px',
                          borderRadius: '16px',
                          backgroundColor: t.theme === 'luxury' ? '#F59E0B' : t.theme === 'neon' ? '#FFFFFF' : '#FF5E14',
                          color: t.theme === 'luxury' ? '#0F172A' : t.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                          marginBottom: '12px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {t.name || 'Table 1'}
                      </div>

                      <QrCodeComponent
                        text={targetUrl}
                        size={145}
                        qrColor={t.qrColor || '#1E293B'}
                        cornerColor={t.cornerColor || '#FF5E14'}
                        showLogo={true}
                        logoUrl={t.logoUrl || storeControls.logoUrl || ''}
                        bgColor={t.theme === 'luxury' ? '#1E293B' : '#FFFFFF'}
                      />

                      <div style={{ fontSize: '11px', marginTop: '10px', fontWeight: 700, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <QrCode size={13} />
                        <span>{t.purpose || 'Contactless Self Ordering'}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#64748B', fontWeight: 600, wordBreak: 'break-all' }}>
                      {targetUrl.replace('https://', '')}
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
            {/* 1. TODAY'S BIRTHDAY CUSTOMERS BANNER WITH CAKE ICON */}
            <div className="crm-birthday-alert-card">
              <div className="crm-birthday-alert-left">
                <Cake size={44} color="#EA580C" style={{ flexShrink: 0 }} />
                <div>
                  <div className="crm-bday-title">
                    {birthdayCustomers.length} Customers Celebrating Birthday Today: {birthdayCustomers.map((c) => c.name).join(', ')}!
                  </div>
                  <div className="crm-bday-subtitle">
                    Automate birthday loyalty! Send a personalized WhatsApp greeting &amp; Push Offer: <b>Free Choco Lava Cake + 20% OFF (`BDAYSPECIAL`)</b>.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="crm-btn-send-bday"
                onClick={handleSendBirthdayPushNotification}
              >
                <Gift size={18} />
                <span>Send Birthday Push Offer</span>
              </button>
            </div>

            {/* 2. ACTIVE COUPONS & PROMOCODES */}
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
                onClick={() => setIsCreateCouponOpen(true)}
              >
                <Plus size={18} />
                <span>Create Coupon</span>
              </button>
            </div>

            <div className="crm-coupons-grid">
              {(coupons || []).map((coupon, idx) => (
                <div key={coupon._id || coupon.id || idx} className="crm-coupon-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="crm-coupon-code-pill">{coupon.code}</span>
                    <span className="crm-status-badge-green">● {coupon.status || 'Active'}</span>
                  </div>
                  <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A' }}>
                    {coupon.discount}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Min. Order: <b>₹{coupon.minOrder || 199}</b> • Redeemed: <b>{coupon.uses || 0} times</b>
                  </div>
                </div>
              ))}
            </div>
            </div>
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
                <input type="text" placeholder="Search by Name/Mobile..." />
              </div>

              <div style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                Sort: <b>Last Ordered At (Newest First)</b>
              </div>
            </div>

            <table className="crm-cust-table">
              <thead>
                <tr>
                  <th>Contact | Customer Name</th>
                  <th>Orders</th>
                  <th>Sale</th>
                  <th>Birthday</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(customers || []).map((c, idx) => (
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
                        <span style={{ color: '#64748B' }}>{c.birthday}</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        style={{
                          background: '#EFF8FF',
                          border: '1.5px solid #B2DDFF',
                          color: '#1D4ED8',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                        onClick={() => {
                          addToast(`Offer notification sent to ${c.name} via WhatsApp & Push!`, <Check size={16} />);
                          triggerSound(playOrderPlaced);
                        }}
                      >
                        <Megaphone size={14} />
                        <span>Send Offer</span>
                      </button>
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
        {activeTab === 'store_controls' && (
          <div className="crm-store-controls-page">
            <div className="crm-control-section-card">
              <div className="crm-control-card-title">Controls</div>

              {/* Store status */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Store status</span>
                  <span className={storeControls.storeStatus ? 'crm-status-badge-green' : 'crm-status-badge-gray'}>
                    {storeControls.storeStatus ? 'Open' : 'Closed'}
                  </span>
                </div>
                <label className="crm-blue-switch">
                  <input
                    type="checkbox"
                    checked={storeControls.storeStatus}
                    onChange={() => {
                      const next = !storeControls.storeStatus;
                      setStoreControls({ ...storeControls, storeStatus: next });
                      addToast(`Restaurant Store is now ${next ? 'OPEN' : 'CLOSED'}`);
                    }}
                  />
                  <span className="crm-blue-slider" />
                </label>
              </div>

              {/* Delivery status */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Delivery status</span>
                  <span className={storeControls.deliveryStatus ? 'crm-status-badge-green' : 'crm-status-badge-gray'}>
                    {storeControls.deliveryStatus ? 'Open' : 'Closed'}
                  </span>
                </div>
                <label className="crm-blue-switch">
                  <input
                    type="checkbox"
                    checked={storeControls.deliveryStatus}
                    onChange={() => {
                      const next = !storeControls.deliveryStatus;
                      setStoreControls({ ...storeControls, deliveryStatus: next });
                      addToast(`Direct Delivery orders are now ${next ? 'OPEN' : 'CLOSED'}`);
                    }}
                  />
                  <span className="crm-blue-slider" />
                </label>
              </div>

              {/* Pick up status */}
              <div className="crm-control-row">
                <div className="crm-control-name-status">
                  <span className="crm-control-label">Pick up status</span>
                  <span className={storeControls.pickupStatus ? 'crm-status-badge-green' : 'crm-status-badge-gray'}>
                    {storeControls.pickupStatus ? 'Open' : 'Closed'}
                  </span>
                </div>
                <label className="crm-blue-switch">
                  <input
                    type="checkbox"
                    checked={storeControls.pickupStatus}
                    onChange={() => {
                      const next = !storeControls.pickupStatus;
                      setStoreControls({ ...storeControls, pickupStatus: next });
                      addToast(`Takeaway / Pickup counter is now ${next ? 'OPEN' : 'CLOSED'}`);
                    }}
                  />
                  <span className="crm-blue-slider" />
                </label>
              </div>
            </div>

            <div className="crm-control-section-card">
              <div className="crm-control-card-title">Store settings</div>

              <div className="crm-control-row">
                <div>
                  <div className="crm-control-label">Store type</div>
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
                  <div className="crm-control-label">UPI Receiver ID</div>
                  <div style={{ fontSize: '13.5px', color: '#64748B' }}>{storeControls.upiId}</div>
                </div>
                <button
                  type="button"
                  style={{ color: '#1D4ED8', background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => addToast('UPI linked with ICICI Bank!')}
                >
                  Edit
                </button>
              </div>
            </div>
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
                <h3>🧾 Bill Settlement — {activeBillSettlementOrder.orderId || activeBillSettlementOrder.id}</h3>
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
                          <div style={{ fontWeight: 800, fontSize: '15px' }}>💵 Cash Settlement</div>
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
                          <div style={{ fontWeight: 800, fontSize: '15px' }}>📱 Online UPI QR Scanner</div>
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

                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '12px', fontWeight: 600 }}>
                      Scan using Google Pay, PhonePe, Paytm, or BHIM UPI app
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
              <h3>🧾 Order Receipt — {viewingOrderDetails.orderId || viewingOrderDetails.id}</h3>
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
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Edit Product / Dish</h3>
              <button
                type="button"
                className="crm-btn-icon-only"
                onClick={() => setIsEditProductModalOpen(false)}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>
            <form onSubmit={handleEditProductSubmit}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Product Name <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Classic Margherita Pizza"
                    value={editProductForm.name}
                    onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  />
                </div>

                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label>Category</label>
                    <select
                      value={editProductForm.category}
                      onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-form-group">
                    <label>Base Price (₹) <span className="req">*</span></label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 199"
                      value={editProductForm.price}
                      onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="crm-form-row">
                  <div className="crm-form-group">
                    <label>Dietary</label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="editVegType"
                          checked={editProductForm.isVeg === true}
                          onChange={() => setEditProductForm({ ...editProductForm, isVeg: true })}
                        />
                        <span className="crm-veg-dot" /> Veg
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="editVegType"
                          checked={editProductForm.isVeg === false}
                          onChange={() => setEditProductForm({ ...editProductForm, isVeg: false })}
                        />
                        <span className="crm-nonveg-dot" /> Non-Veg
                      </label>
                    </div>
                  </div>
                </div>

                <div className="crm-form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    className="crm-input"
                    placeholder="https://images.unsplash.com/..."
                    value={editProductForm.images?.[0] || editProductForm.image || ''}
                    onChange={(e) => setEditProductForm({ ...editProductForm, image: e.target.value, images: [e.target.value] })}
                  />
                  {(editProductForm.images?.[0] || editProductForm.image) && (
                    <img src={editProductForm.images?.[0] || editProductForm.image} alt="Preview" style={{ marginTop: '10px', height: '65px', borderRadius: '8px', objectFit: 'cover' }} />
                  )}
                </div>

                {/* Product Sizes & Variations */}
                <div className="crm-form-group" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', padding: '14px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0, fontWeight: 800 }}>Product Sizes &amp; Price Variations</label>
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
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      Standard single size (₹{editProductForm.price || 0})
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {editProductForm.sizes.map((sz, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="crm-input"
                            style={{ flex: 2, padding: '6px 10px', fontSize: '13px' }}
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
                            style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
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
                            style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 900, cursor: 'pointer', padding: '4px 8px' }}
                            onClick={() => {
                              const updated = editProductForm.sizes.filter((_, idx) => idx !== sIdx);
                              setEditProductForm({ ...editProductForm, sizes: updated });
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inner Layer & Customizations (Bun Choice & Extra Toppings) */}
                <div className="crm-form-group" style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', padding: '14px', borderRadius: '12px' }}>
                  <label style={{ color: '#C2410C', fontWeight: 800, margin: 0, marginBottom: '6px' }}>
                    🍔 Inner Layer &amp; Customization Options (Buns &amp; Toppings)
                  </label>
                  <div style={{ fontSize: '12.5px', color: '#9A3412', marginBottom: '8px' }}>
                    Allows customers and counter staff to choose inner layer bun type or add extra toppings.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['Sesame Bun (Free)', 'Whole Wheat (+₹20)', 'Brioche Bun (+₹30)', 'Gluten-Free (+₹35)', 'Extra Cheese (+₹40)', 'Jalapeno & Mushrooms (+₹30)'].map((opt) => (
                      <span key={opt} style={{ background: '#FFFFFF', border: '1px solid #FDBA74', color: '#C2410C', padding: '4px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: 700 }}>
                        ✓ {opt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="crm-form-group">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    className="crm-input"
                    placeholder="Short appetizing description..."
                    value={editProductForm.desc || ''}
                    onChange={(e) => setEditProductForm({ ...editProductForm, desc: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setIsEditProductModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="crm-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MODAL 2: ADD PRODUCT MODAL (With Image URL field)
          ========================================================================== */}
      {isAddProductModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsAddProductModalOpen(false)}>
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>+ Add New Product to Catalog</h3>
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
                {/* 1. Food Name */}
                <div className="crm-form-group">
                  <label>Food / Product Name *</label>
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

                {/* 2. Category Selection & Inline Create Category */}
                <div className="crm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Category *</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                    >
                      {isAddingNewCat ? '✕ Cancel' : '+ Create New Category'}
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
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 3. Base Price & Dietary Type */}
                <div className="crm-form-grid" style={{ marginBottom: 0 }}>
                  <div className="crm-form-group">
                    <label>Base Price (₹) *</label>
                    <input
                      type="number"
                      className="crm-input"
                      placeholder="e.g. 240"
                      value={newProductForm.price}
                      onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="crm-form-group">
                    <label>Dietary Type</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                        <input
                          type="radio"
                          name="addVegType"
                          checked={newProductForm.isVeg === true}
                          onChange={() => setNewProductForm({ ...newProductForm, isVeg: true })}
                        />
                        <span className="crm-veg-dot" /> Veg
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
                        <input
                          type="radio"
                          name="addVegType"
                          checked={newProductForm.isVeg === false}
                          onChange={() => setNewProductForm({ ...newProductForm, isVeg: false })}
                        />
                        <span className="crm-nonveg-dot" /> Non-Veg
                      </label>
                    </div>
                  </div>
                </div>

                {/* 4. Special Item Checkbox */}
                <div className="crm-form-group" style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5', padding: '12px 16px', borderRadius: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: '#C2410C', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={newProductForm.isSpecial}
                      onChange={(e) => setNewProductForm({ ...newProductForm, isSpecial: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#FF5E14' }}
                    />
                    <span>⭐ Mark as Chef's Special / Featured Dish</span>
                  </label>
                </div>

                {/* 5. Food Image Upload + URL Fallback */}
                <div className="crm-form-group">
                  <label>Upload Food Photo (Computer or URL)</label>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '12px',
                        border: '2px dashed #CBD5E1',
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('addDishFileInput').click()}
                    >
                      {productLogoPreview ? (
                        <img src={productLogoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '24px' }}>📷</span>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        id="addDishFileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="crm-btn-secondary"
                        style={{ fontSize: '13px', padding: '6px 12px', alignSelf: 'flex-start' }}
                        onClick={() => document.getElementById('addDishFileInput').click()}
                      >
                        {productLogoFile ? productLogoFile.name : 'Choose Image File...'}
                      </button>
                      <input
                        type="text"
                        className="crm-input"
                        placeholder="Or paste image URL (e.g. Unsplash)"
                        value={newProductForm.image}
                        onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                        style={{ fontSize: '13px', padding: '6px 10px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Small Description */}
                <div className="crm-form-group">
                  <label>Small Description</label>
                  <textarea
                    rows={2}
                    className="crm-input"
                    placeholder="e.g. Oversized New York style slice loaded with mozzarella & Italian herbs."
                    value={newProductForm.desc}
                    onChange={(e) => setNewProductForm({ ...newProductForm, desc: e.target.value })}
                  />
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
          MODAL 3: CREATE COUPON MODAL
          ========================================================================== */}
      {isCreateCouponOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsCreateCouponOpen(false)}>
          <div className="crm-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Create Discount Coupon</h3>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsCreateCouponOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Coupon Code (Promocode) *</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. SAVE30, FESTIVE100"
                    value={newCouponForm.code}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="crm-form-group">
                  <label>Discount Value *</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. 30% OFF or Flat ₹100 OFF"
                    value={newCouponForm.discount}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discount: e.target.value })}
                    required
                  />
                </div>

                <div className="crm-form-group">
                  <label>Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    className="crm-input"
                    value={newCouponForm.minOrder}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, minOrder: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => setIsCreateCouponOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create-order-primary">
                  <Check size={18} />
                  <span>Activate Coupon</span>
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
                    <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '6px' }}>
                      {storeControls.restName || "Sharma's Kitchen"}
                    </div>

                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 900,
                        padding: '5px 16px',
                        borderRadius: '18px',
                        backgroundColor: tableForm.theme === 'luxury' ? '#F59E0B' : tableForm.theme === 'neon' ? '#FFFFFF' : '#FF5E14',
                        color: tableForm.theme === 'luxury' ? '#0F172A' : tableForm.theme === 'neon' ? '#FF5E14' : '#FFFFFF',
                        marginBottom: '14px',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {tableForm.name || 'Table 1'}
                    </div>

                    <QrCodeComponent
                      text={getUniqueTableUrl(tableForm.name, tableForm.url)}
                      size={150}
                      qrColor={tableForm.qrColor}
                      cornerColor={tableForm.cornerColor}
                      showLogo={true}
                      logoUrl={tableLogoPreview || tableForm.logoUrl || storeControls.logoUrl || ''}
                      bgColor={tableForm.theme === 'luxury' ? '#1E293B' : '#FFFFFF'}
                    />

                    <div style={{ fontSize: '11px', marginTop: '12px', fontWeight: 700, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <QrCode size={13} />
                      <span>{tableForm.purpose || 'Scan QR for Contactless Digital Menu'}</span>
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
                <img
                  src={storeControls.logoUrl || "/Logo.png"}
                  alt="FoodyPay Logo"
                  style={{ height: '42px', objectFit: 'contain', display: 'block' }}
                />
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{storeControls.restName}</div>
                
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    padding: '4px 14px',
                    borderRadius: '20px',
                    backgroundColor: activeStandeeTable.theme === 'luxury' ? '#1E293B' : activeStandeeTable.theme === 'neon' ? '#FFFFFF' : '#F1F5F9',
                    color: activeStandeeTable.theme === 'luxury' ? '#F59E0B' : activeStandeeTable.theme === 'neon' ? '#FF5E14' : '#1D4ED8',
                    letterSpacing: '0.05em'
                  }}
                >
                  {(activeStandeeTable.name || 'TABLE 1').toUpperCase()} • {activeStandeeTable.purpose || activeStandeeTable.section || 'Contactless Ordering'}
                </div>

                <QrCodeComponent
                  text={getUniqueTableUrl(activeStandeeTable.name, activeStandeeTable.url)}
                  size={170}
                  showLogo={true}
                  qrColor={activeStandeeTable.qrColor || (activeStandeeTable.theme === 'luxury' ? '#F59E0B' : '#1E293B')}
                  cornerColor={activeStandeeTable.cornerColor || (activeStandeeTable.theme === 'luxury' ? '#F59E0B' : '#FF5E14')}
                  bgColor={activeStandeeTable.theme === 'luxury' ? '#1E293B' : '#FFFFFF'}
                />

                <p style={{ fontSize: '12.5px', margin: 0, opacity: 0.95, lineHeight: 1.4 }}>
                  <strong>Scan with Camera to Order</strong>
                  <br />
                  No app download needed • Fast &amp; Contactless
                </p>
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
