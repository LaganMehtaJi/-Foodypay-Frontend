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
} from 'lucide-react';
import {
  playOrderPlaced,
  playFoodPreparing,
  playFoodReady,
  playBillPaid,
  playMilestoneCelebration,
} from '../utils/soundEffects';
import { QrCodeComponent } from '../utils/qrGenerator';
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
  { id: 't1', name: 'Table 1', capacity: 4, section: 'Indoor AC Dining', status: 'occupied' },
  { id: 't2', name: 'Table 2', capacity: 2, section: 'Indoor AC Dining', status: 'occupied' },
  { id: 't3', name: 'Table 3', capacity: 4, section: 'Indoor AC Dining', status: 'available' },
  { id: 't4', name: 'Table 4', capacity: 6, section: 'Outdoor Garden', status: 'available' },
  { id: 't5', name: 'Table 5', capacity: 4, section: 'Outdoor Garden', status: 'available' },
  { id: 't6', name: 'Table 6', capacity: 8, section: 'VIP Rooftop Lounge', status: 'reserved' },
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

  // Datasets
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_crm_orders_v3');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [dishes, setDishes] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_crm_dishes_v3');
      return saved ? JSON.parse(saved) : INITIAL_DISHES;
    } catch {
      return INITIAL_DISHES;
    }
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_crm_customers_v3');
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_crm_coupons_v3');
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  const [tables, setTables] = useState(() => {
    try {
      const saved = localStorage.getItem('foodypay_crm_tables_v3');
      return saved ? JSON.parse(saved) : INITIAL_TABLES;
    } catch {
      return INITIAL_TABLES;
    }
  });

  const [storeControls, setStoreControls] = useState({
    storeStatus: true,
    deliveryStatus: true,
    pickupStatus: true,
    storeType: 'Business to Customer (B2C)',
    restName: "Sharma's Kitchen Cafe",
    phone: '+91 98765 43210',
    address: 'Connaught Place, New Delhi',
    upiId: 'sharmafoody@icici',
    gstPercent: 5,
  });

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
  // 1. MANUAL ORDER CREATOR MODAL ("cREATE A MANUAL ORDER")
  // ==========================================================================
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualOrderType, setManualOrderType] = useState('Dine-In');
  const [manualTable, setManualTable] = useState('Table 1');
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualItems, setManualItems] = useState({});
  const [manualPaymentMode, setManualPaymentMode] = useState('Cash on Counter');

  const handleOpenManualOrder = () => {
    setManualOrderType('Dine-In');
    setManualTable('Table 1');
    setManualCustomer('Walk-in Guest');
    setManualPhone('+91 98765 00000');
    setManualItems({ [dishes[0]?.id || 'p1']: 1 });
    setIsManualOrderOpen(true);
  };

  const handleUpdateItemQty = (dishId, delta) => {
    setManualItems((prev) => {
      const current = prev[dishId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return { ...prev, [dishId]: next };
    });
  };

  const manualSubtotal = Object.entries(manualItems).reduce((sum, [dishId, qty]) => {
    const dish = dishes.find((d) => d.id === dishId);
    return sum + (dish ? dish.price * qty : 0);
  }, 0);
  const manualTax = Math.round(manualSubtotal * 0.05);
  const manualTotal = manualSubtotal + manualTax;

  const handleCreateManualOrderSubmit = (e) => {
    e.preventDefault();
    if (manualSubtotal <= 0) {
      addToast('Please select at least 1 food item for the order.', <Utensils size={18} />);
      return;
    }

    const nextId = `#FP-${1080 + orders.length + 1}`;
    const formattedItems = Object.entries(manualItems).map(([dishId, qty]) => {
      const dish = dishes.find((d) => d.id === dishId);
      return {
        name: dish ? dish.name : 'Custom Item',
        qty,
        price: dish ? dish.price : 100,
        isVeg: dish ? dish.isVeg : true,
      };
    });

    const newOrder = {
      id: nextId,
      type: manualOrderType,
      table: manualOrderType === 'Dine-In' ? manualTable : manualOrderType === 'Takeaway' ? 'Counter 1' : 'Home Delivery',
      customer: manualCustomer.trim() || 'Walk-in Guest',
      phone: manualPhone.trim() || '+91 98765 00000',
      time: 'Just now',
      timestamp: Date.now(),
      status: 'new',
      paymentStatus: manualPaymentMode.includes('UPI') ? 'paid-upi' : 'cash',
      paymentLabel: manualPaymentMode,
      items: formattedItems,
      note: 'Manual Order Created from Counter',
      subtotal: manualSubtotal,
      tax: manualTax,
      total: manualTotal,
    };

    setOrders((prev) => [newOrder, ...prev]);

    if (manualCustomer.trim()) {
      setCustomers((prev) => {
        const exists = prev.find((c) => c.name.toLowerCase() === manualCustomer.toLowerCase());
        if (!exists) {
          return [
            {
              id: 'c_' + Date.now(),
              name: manualCustomer.trim(),
              phone: manualPhone.trim(),
              ordersCount: 1,
              totalSales: manualTotal,
              birthday: 'Not Set',
              isBirthdayToday: false,
              lastOrdered: 'Just now',
            },
            ...prev,
          ];
        }
        return prev.map((c) =>
          c.name.toLowerCase() === manualCustomer.toLowerCase()
            ? { ...c, ordersCount: c.ordersCount + 1, totalSales: c.totalSales + manualTotal, lastOrdered: 'Just now' }
            : c
        );
      });
    }

    triggerSound(playOrderPlaced);
    confetti({ particleCount: 75, spread: 75, origin: { y: 0.3 } });
    addToast(`Manual Order ${nextId} created for ${newOrder.table}!`, <Check size={18} />);
    setIsManualOrderOpen(false);
  };

  // Status Progression
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );

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
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'Fast Food',
    price: '',
    isVeg: true,
    desc: '',
    variantsCount: 4,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
  });

  const allCategories = ['Fast Food', 'Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts'];

  const filteredDishes = dishes.filter((d) => {
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesSearch = d.name.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToggleProductStock = (dishId) => {
    setDishes((prev) =>
      prev.map((d) => {
        if (d.id === dishId) {
          const nextVal = !d.inStock;
          addToast(`${d.name} is now ${nextVal ? 'In Stock' : 'Sold Out'}`);
          return { ...d, inStock: nextVal };
        }
        return d;
      })
    );
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim() || !newProductForm.price) return;

    const newDish = {
      id: 'p_' + Date.now(),
      name: newProductForm.name.trim().toUpperCase(),
      category: newProductForm.category,
      price: Number(newProductForm.price),
      isVeg: newProductForm.isVeg,
      variantsCount: Number(newProductForm.variantsCount) || 1,
      inStock: true,
      desc: newProductForm.desc || 'Prepared fresh with high quality ingredients.',
      image:
        newProductForm.image ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    };

    setDishes((prev) => [newDish, ...prev]);
    setIsAddProductModalOpen(false);
    triggerSound(playMilestoneCelebration);
    addToast(`Added product "${newDish.name}" to catalog!`, <Check size={18} />);
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

  const handleCreateCouponSubmit = (e) => {
    e.preventDefault();
    if (!newCouponForm.code.trim()) return;

    const newC = {
      code: newCouponForm.code.trim().toUpperCase(),
      discount: newCouponForm.discount.trim(),
      minOrder: Number(newCouponForm.minOrder) || 199,
      uses: 0,
      status: 'Active',
    };

    setCoupons((prev) => [newC, ...prev]);
    setIsCreateCouponOpen(false);
    addToast(`Coupon "${newC.code}" created and active!`, <Check size={18} />);
  };

  // Table QR Standee Modal
  const [activeStandeeTable, setActiveStandeeTable] = useState(null);

  // Orders Filter
  const [orderTabFilter, setOrderTabFilter] = useState('all');
  const filteredOrders = orders.filter((o) => {
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
            <img src="/Logo.png" alt="FoodyPay Logo" className="crm-brand-img" />
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
            <button
              type="button"
              className="crm-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="crm-page-heading">
              {activeTab === 'home_orders' && 'Home / Orders'}
              {activeTab === 'catalog' && 'Catalog/ Products'}
              {activeTab === 'grow' && 'Grow / Business Telemetry'}
              {activeTab === 'utilities' && 'Utilities & Table QR Generator'}
              {activeTab === 'marketing' && 'Marketing & Birthday Push Notifications'}
              {activeTab === 'customers' && 'Customers Directory & Loyalty'}
              {activeTab === 'store_controls' && 'Store controls'}
            </h1>
          </div>

          <div className="crm-header-right">
            <button
              type="button"
              className="btn-view-shop"
              onClick={() => window.open('/create-website', '_blank')}
              title="Preview online storefront"
            >
              <span>VIEW SHOP AS CUSTOMER</span>
              <Eye size={17} />
            </button>

            <button
              type="button"
              className="btn-create-order-primary"
              onClick={handleOpenManualOrder}
              title="Create counter or dine-in order"
            >
              <Plus size={18} />
              <span>Create Manual Order</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13.5px', fontWeight: 600 }}>
              <Clock size={16} />
              <span>{currentTime}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                addToast(soundEnabled ? 'Kitchen sound alerts muted' : 'Kitchen sound alerts activated');
              }}
              style={{
                background: '#F1F5F9',
                border: '1.5px solid #E2E8F0',
                padding: '9px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#475569',
              }}
              title="Audio alert toggle"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
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
                  <div className="crm-kpi-label">Total Orders Today</div>
                  <div className="crm-kpi-value">{orders.length}</div>
                </div>
                <div className="crm-kpi-icon-box" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                  <ShoppingBag size={26} />
                </div>
              </div>

              <div className="crm-kpi-card">
                <div>
                  <div className="crm-kpi-label">Today's Revenue</div>
                  <div className="crm-kpi-value">₹{orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</div>
                </div>
                <div className="crm-kpi-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <CreditCard size={26} />
                </div>
              </div>

              <div className="crm-kpi-card">
                <div>
                  <div className="crm-kpi-label">Active Kitchen Tickets</div>
                  <div className="crm-kpi-value" style={{ color: '#FF5E14' }}>
                    {orders.filter((o) => o.status === 'new' || o.status === 'preparing').length}
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

            {/* FILTER BAR */}
            <div className="crm-filter-bar">
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

              <button
                type="button"
                className="btn-create-order-primary"
                onClick={handleOpenManualOrder}
              >
                <Plus size={18} />
                <span>Create A Manual Order</span>
              </button>
            </div>

            {/* ORDERS GRID */}
            <div className="crm-orders-grid">
              {filteredOrders.map((order) => {
                const stepIndex =
                  order.status === 'new' ? 0 : order.status === 'preparing' ? 1 : order.status === 'ready' ? 2 : 3;

                return (
                  <div key={order.id} className="crm-order-card">
                    <div className="crm-order-card-header">
                      <div className="crm-order-id-group">
                        <span className="crm-order-id">{order.id}</span>
                        <span className="crm-table-tag highlight">{order.table}</span>
                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>({order.type})</span>
                      </div>
                      <span className={`crm-status-pill ${order.status}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="crm-progress-track">
                      <div className="crm-progress-steps">
                        <div className="crm-progress-line-back" />
                        <div
                          className="crm-progress-line-fill"
                          style={{ width: `${(stepIndex / 3) * 100}%` }}
                        />
                        {['Placed', 'Kitchen', 'Ready', 'Served'].map((l, idx) => (
                          <div
                            key={l}
                            className={`crm-step-node ${idx <= stepIndex ? 'done' : ''} ${idx === stepIndex ? 'current' : ''}`}
                          >
                            <div className="crm-step-circle">{idx <= stepIndex ? '✓' : idx + 1}</div>
                            <span className="crm-step-label">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="crm-order-card-body">
                      <div className="crm-customer-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={15} /> {order.customer}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={15} /> {order.phone}
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

                    <div className="crm-order-card-footer">
                      <div className="crm-order-total-row">
                        <div className="crm-total-amount">₹{order.total}</div>
                        <span className={`crm-payment-pill ${order.paymentStatus}`}>{order.paymentLabel}</span>
                      </div>

                      <div className="crm-card-actions">
                        {order.status === 'new' && (
                          <button
                            type="button"
                            className="crm-btn-primary full-w"
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                          >
                            <ChefHat size={16} />
                            <span>Send to Kitchen</span>
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            type="button"
                            className="crm-btn-primary full-w"
                            style={{ background: '#059669' }}
                            onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                          >
                            <Bell size={16} />
                            <span>Food is Ready</span>
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            type="button"
                            className="crm-btn-primary full-w"
                            style={{ background: '#0F172A' }}
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                          >
                            <Check size={16} />
                            <span>Mark Served &amp; Settled</span>
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button
                            type="button"
                            className="crm-btn-secondary full-w"
                            onClick={() => window.print()}
                          >
                            <Printer size={16} />
                            <span>Print KOT Invoice</span>
                          </button>
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
                  {filteredDishes.map((dish) => (
                    <tr key={dish.id}>
                      <td>
                        <div className="crm-product-info-cell">
                          {/* Real Food Image Thumbnail */}
                          <div className="crm-prod-thumb-box">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="crm-prod-thumb-img"
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <div className="crm-prod-name-title">{dish.name}</div>
                            <span className="crm-prod-variants-badge">
                              View {dish.variantsCount || 4} variants
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
                            onChange={() => handleToggleProductStock(dish.id)}
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
                              images: dish.images && dish.images.length > 0 ? dish.images : (dish.image ? [dish.image] : [])
                            });
                            setIsEditProductModalOpen(true);
                          }}
                        >
                           <Edit3 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
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
            VIEW 4: UTILITIES (Table QR Generator)
            ========================================================================== */}
        {activeTab === 'utilities' && (
          <div style={{ padding: '32px 42px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px 0' }}>
                  Contactless Table QR Generator
                </h2>
                <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                  Generate high-resolution printable table stands for contactless diner self-ordering.
                </p>
              </div>

              <button
                type="button"
                className="btn-create-order-primary"
                onClick={() => {
                  const newT = {
                    id: 't_' + Date.now(),
                    name: `Table ${tables.length + 1}`,
                    capacity: 4,
                    section: 'Indoor AC Dining',
                    status: 'available',
                  };
                  setTables((prev) => [...prev, newT]);
                  addToast(`Created ${newT.name} QR Code!`, <Check size={18} />);
                }}
              >
                <Plus size={18} />
                <span>Add Table QR</span>
              </button>
            </div>

            <div className="crm-tables-grid">
              {tables.map((t) => {
                const tableNumber = t.name.replace(/\D/g, '') || '1';
                const url = `https://foodypay.in/menu?rest=sharma&table=${tableNumber}`;

                return (
                  <div key={t.id} className="crm-table-qr-card">
                    <div className="crm-table-card-top">
                      <div className="crm-table-title">
                        <Store size={20} color="#1D4ED8" />
                        <span>{t.name}</span>
                        <span className="crm-table-capacity-pill">{t.capacity} Pax</span>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '14px',
                          background: t.status === 'available' ? '#ECFDF5' : '#FFFBEB',
                          color: t.status === 'available' ? '#027A48' : '#B45309',
                        }}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="crm-qr-preview-box">
                      <QrCodeComponent text={url} size={160} showLogo={true} />
                      <span className="crm-table-url-hint">foodypay.in/menu?table={tableNumber}</span>
                    </div>

                    <div className="crm-table-card-actions">
                      <button
                        type="button"
                        className="btn-create-order-primary full-w"
                        onClick={() => setActiveStandeeTable(t)}
                      >
                        <Printer size={16} />
                        <span>View &amp; Print Standee</span>
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
          <div style={{ position: 'relative' }}>
            {/* Premium Lock Overlay */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(3px)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px'
            }}>
              <div style={{
                background: '#fff',
                padding: '30px 40px',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                <div style={{
                  background: '#F1F5F9',
                  width: '64px', height: '64px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Lock size={32} color="#334155" />
                </div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                  Unlock Marketing &amp; Coupons
                </h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#64748B', lineHeight: '1.5' }}>
                  Upgrade to FoodyPay Pro to create discount coupons, run promotional campaigns, and send automated birthday push notifications.
                </p>
                <button 
                  type="button" 
                  className="crm-btn-primary full-w"
                  onClick={() => alert('Upgrade flow initiated!')}
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>

            <div className="crm-marketing-container" style={{ pointerEvents: 'none', userSelect: 'none' }}>
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
              {coupons.map((coupon, idx) => (
                <div key={idx} className="crm-coupon-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="crm-coupon-code-pill">{coupon.code}</span>
                    <span className="crm-status-badge-green">● {coupon.status}</span>
                  </div>
                  <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A' }}>
                    {coupon.discount}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Min. Order: <b>₹{coupon.minOrder}</b> • Redeemed: <b>{coupon.uses} times</b>
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
                <span className="crm-cust-stat-value">{customers.length}</span>
              </div>
              <div className="crm-cust-stat-item">
                <span className="crm-cust-stat-label">Total Orders</span>
                <span className="crm-cust-stat-value">{customers.reduce((s, c) => s + c.ordersCount, 0)}</span>
              </div>
              <div className="crm-cust-stat-item">
                <span className="crm-cust-stat-label">Total Sales</span>
                <span className="crm-cust-stat-value">₹{customers.reduce((s, c) => s + c.totalSales, 0).toLocaleString()}</span>
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
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{c.phone}</div>
                    </td>
                    <td>
                      <b>{c.ordersCount}</b>
                    </td>
                    <td>
                      <b style={{ color: '#1D4ED8' }}>₹{c.totalSales.toLocaleString()}</b>
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
          MODAL 1: CREATE MANUAL ORDER (With Food Images)
          ========================================================================== */}
      {isManualOrderOpen && (
        <div className="crm-modal-backdrop" onClick={() => setIsManualOrderOpen(false)}>
          <div className="crm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Create A Manual Order</h3>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setIsManualOrderOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrderSubmit}>
              <div className="crm-modal-body">
                {/* Order Types */}
                <div className="crm-order-type-tabs">
                  {[
                    { key: 'Dine-In', icon: <Store size={16} />, label: 'Dine-In' },
                    { key: 'Takeaway', icon: <ShoppingBag size={16} />, label: 'Takeaway' },
                    { key: 'Delivery', icon: <Truck size={16} />, label: 'Delivery' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className={`crm-order-type-tab ${manualOrderType === t.key ? 'active' : ''}`}
                      onClick={() => setManualOrderType(t.key)}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {t.icon}
                        <span>{t.label}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {manualOrderType === 'Dine-In' && (
                  <div className="crm-form-group">
                    <label>Select Table</label>
                    <select
                      className="crm-input"
                      value={manualTable}
                      onChange={(e) => setManualTable(e.target.value)}
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.capacity} Pax) - {t.section}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="crm-form-grid" style={{ marginBottom: 0 }}>
                  <div className="crm-form-group">
                    <label>Customer Name</label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. Rahul Sharma"
                      value={manualCustomer}
                      onChange={(e) => setManualCustomer(e.target.value)}
                      required
                    />
                  </div>

                  <div className="crm-form-group">
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. 98765 43210"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Dish Picker with Real Photos */}
                <div className="crm-form-group">
                  <label>Select Food Items</label>
                  <div className="crm-dish-picker-list">
                    {dishes.map((d) => {
                      const qty = manualItems[d.id] || 0;
                      return (
                        <div key={d.id} className="crm-dish-picker-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={d.image}
                              alt={d.name}
                              className="crm-modal-food-thumb"
                              loading="lazy"
                            />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '14px' }}>{d.name}</div>
                              <div style={{ fontSize: '13px', color: '#1D4ED8', fontWeight: 700 }}>₹{d.price}</div>
                            </div>
                          </div>

                          <div className="crm-qty-counter">
                            {qty > 0 && (
                              <button
                                type="button"
                                className="crm-qty-btn"
                                onClick={() => handleUpdateItemQty(d.id, -1)}
                              >
                                -
                              </button>
                            )}
                            <span style={{ fontWeight: 800, minWidth: '22px', textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              className="crm-qty-btn"
                              onClick={() => handleUpdateItemQty(d.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bill Summary */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotal:</span>
                    <b>₹{manualSubtotal}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>GST (5%):</span>
                    <b>₹{manualTax}</b>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#0F172A',
                      borderTop: '1.5px dashed #CBD5E1',
                      paddingTop: '8px',
                    }}
                  >
                    <span>Total Amount:</span>
                    <span style={{ color: '#1D4ED8' }}>₹{manualTotal}</span>
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="crm-form-group">
                  <label>Payment Method</label>
                  <select
                    className="crm-input"
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

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => setIsManualOrderOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-create-order-primary">
                  <Check size={18} />
                  <span>Place Order &amp; Print KOT</span>
                </button>
              </div>
            </form>
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
                    placeholder="https://..."
                    value={editProductForm.images?.[0] || editProductForm.image || ''}
                    onChange={(e) => setEditProductForm({ ...editProductForm, image: e.target.value, images: [e.target.value] })}
                  />
                  {editProductForm.images?.[0] && (
                    <img src={editProductForm.images[0]} alt="Preview" style={{ marginTop: '10px', height: '60px', borderRadius: '4px' }} />
                  )}
                </div>

                <div className="crm-form-group">
                  <label>Description</label>
                  <textarea
                    rows={2}
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
                <div className="crm-form-group">
                  <label>Product Name *</label>
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

                <div className="crm-form-grid" style={{ marginBottom: 0 }}>
                  <div className="crm-form-group">
                    <label>Category</label>
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
                  </div>

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
                </div>

                <div className="crm-form-group">
                  <label>Food Image URL (Unsplash or CDN)</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newProductForm.image}
                    onChange={(e) => setNewProductForm({ ...newProductForm, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="crm-btn-secondary"
                  onClick={() => setIsAddProductModalOpen(false)}
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
          MODAL 4: PRINTABLE TABLE STANDEE MODAL
          ========================================================================== */}
      {activeStandeeTable && (
        <div className="crm-modal-backdrop" onClick={() => setActiveStandeeTable(null)}>
          <div className="crm-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>{activeStandeeTable.name} QR Standee</h3>
              <button
                type="button"
                className="crm-modal-close-btn"
                onClick={() => setActiveStandeeTable(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="crm-modal-body" style={{ alignItems: 'center' }}>
              <div className="crm-standee-acrylic-card">
                <img src="/Logo.png" alt="FoodyPay" className="crm-standee-logo" />
                <div className="crm-standee-rest-name">{storeControls.restName}</div>
                <div className="crm-standee-table-pill">{activeStandeeTable.name.toUpperCase()}</div>
                <QrCodeComponent
                  text={`https://foodypay.in/menu?rest=sharma&table=${activeStandeeTable.name.replace(/\D/g, '') || '1'}`}
                  size={160}
                  showLogo={true}
                />
                <p className="crm-standee-sub">
                  <strong>Scan with your Camera</strong>
                  <br />
                  to browse digital menu &amp; order contactless.
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
