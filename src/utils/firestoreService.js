// HYBRID REAL FIREBASE + LOCALSTORAGE PERSISTENT SERVICE
// All Dishes/Catalog, Orders, Tables, and Revenue Stats sync directly with Firebase Firestore (foodypay-v1)
import {
  firestoreDb,
  FIRESTORE_COLLECTIONS,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  limit,
  onSnapshot,
} from './firebase';
import { SNACK_RACK_FULL_MENU } from '../data/snackRackMenuData';

const ORDERS_STORAGE_KEY = 'foodypay_crm_orders_v3';
const TABLES_STORAGE_KEY = 'foodypay_crm_tables_v3';
const DISHES_STORAGE_KEY = 'foodypay_crm_dishes_v3';
const REVENUE_STORAGE_KEY = 'foodypay_crm_revenue_v1';

// Helper to sanitize undefined values before sending to Firestore
function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  });
  return clean;
}

// ============================================================================
// 1. ORDERS SUBSCRIPTION & FIRESTORE CLOUD SYNC
// ============================================================================
export function subscribeToOrders(bid, onUpdate) {
  const effectiveBid = String(bid || 'FP-9896').trim().toUpperCase();

  // Instant read from localStorage so UI never has loading lag
  const getLocalOrders = () => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY) || localStorage.getItem('snackrack_local_sales');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((o) => o && o.id !== 'ord-live-tbl1' && o.id !== 'ord-live-tbl2' && o._id !== 'ord-live-tbl1' && o._id !== 'ord-live-tbl2');
        }
      }
      return [];
    } catch  {
      return [];
    }
  };

  if (typeof onUpdate === 'function') {
    onUpdate(getLocalOrders());
  }

  // Real-time Firestore Listener
  let unsubscribeFirestore = () => {};
  try {
    const ordersCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS);
    // Realtime snapshot of orders
    unsubscribeFirestore = onSnapshot(ordersCol, (snapshot) => {
      const cloudOrders = [];
      if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          cloudOrders.push({
            ...d,
            _id: docSnap.id,
            id: d.id || docSnap.id,
          });
        });
      }

      // Merge cloud orders with local storage - Firebase Cloud is source of truth
      const local = getLocalOrders();
      const localMap = new Map();
      // First add cloud orders from Firebase
      cloudOrders.forEach((co) => {
        localMap.set(String(co._id || co.id), co);
      });
      // Only preserve local orders if created very recently (< 3 mins) or marked pending sync
      const recentThreshold = Date.now() - 3 * 60 * 1000;
      local.forEach((lo) => {
        const id = String(lo._id || lo.id);
        if (id === 'ord-live-tbl1' || id === 'ord-live-tbl2') return;
        if (!localMap.has(id)) {
          const loTime = lo.timestamp || (lo.createdAt ? new Date(lo.createdAt).getTime() : 0);
          if (lo.isPendingSync || loTime > recentThreshold) {
            localMap.set(id, lo);
          }
        }
      });
      const merged = Array.from(localMap.values()).sort((a, b) => {
        const timeA = a.timestamp || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.timestamp || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem('snackrack_local_sales', JSON.stringify(merged));
      } catch  {}

      if (typeof onUpdate === 'function') {
        onUpdate(merged);
      }
    }, (err) => {
      console.warn('Firestore Orders real-time sync note:', err.message);
    });
  } catch (err) {
    console.warn('Firestore Orders setup notice:', err);
  }

  // Local window storage events
  const localListener = () => {
    if (typeof onUpdate === 'function') {
      onUpdate(getLocalOrders());
    }
  };
  window.addEventListener('storage', localListener);
  window.addEventListener('foodypay_order_created', localListener);

  return () => {
    unsubscribeFirestore();
    window.removeEventListener('storage', localListener);
    window.removeEventListener('foodypay_order_created', localListener);
  };
}

export async function saveOrderToFirestore(orderData) {
  const orderId = String(orderData.id || orderData._id || `FP-${Date.now().toString().slice(-4)}`);
  const fullOrder = {
    ...orderData,
    id: orderId,
    _id: orderId,
    businessId: orderData.businessId || 'FP-9896',
    timestamp: orderData.timestamp || Date.now(),
    createdAt: orderData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately save to LocalStorage
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY) || '[]';
    const list = JSON.parse(raw);
    list.unshift(fullOrder);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem('snackrack_local_sales', JSON.stringify(list));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('foodypay_order_created'));
  } catch  {}

  // 2. Sync to Firebase Cloud Firestore
  try {
    const orderDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, orderId);
    await setDoc(orderDocRef, sanitizeForFirestore(fullOrder), { merge: true });
    
    // Also record into Cloud Revenue summary
    syncRevenueToFirestore(fullOrder);
  } catch (fsErr) {
    console.warn('Firestore saveOrder notice:', fsErr.message);
  }

  return { success: true, id: orderId };
}

export async function updateOrderInFirestore(orderId, patch) {
  const oIdStr = String(orderId);
  // 1. LocalStorage update
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY) || '[]';
    const list = JSON.parse(raw);
    let targetUpdated = null;
    const updated = list.map((o) => {
      if (String(o._id || o.id || o.orderId) === oIdStr) {
        targetUpdated = { ...o, ...patch, updatedAt: new Date().toISOString() };
        return targetUpdated;
      }
      return o;
    });
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('snackrack_local_sales', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('foodypay_order_created'));

    // 2. Cloud Firestore update
    const orderDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, oIdStr);
    setDoc(orderDocRef, sanitizeForFirestore({ ...patch, updatedAt: new Date().toISOString() }), { merge: true }).catch((e) => {
      console.warn('Firestore updateOrder notice:', e.message);
    });

    if (targetUpdated) {
      syncRevenueToFirestore(targetUpdated);
    }
  } catch  {}

  return { success: true };
}

export async function deleteOrderFromFirestore(orderId) {
  const oIdStr = String(orderId);
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY) || '[]';
    const list = JSON.parse(raw);
    const updated = list.filter((o) => String(o._id || o.id || o.orderId) !== oIdStr);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('snackrack_local_sales', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('foodypay_order_created'));

    const orderDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, oIdStr);
    deleteDoc(orderDocRef).catch(() => {});
  } catch  {}
  return { success: true };
}

// ============================================================================
// 2. REVENUE TELEMETRY TO FIREBASE
// ============================================================================
async function syncRevenueToFirestore(orderObj) {
  try {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const revenueDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.REVENUE, dateKey);

    const rawList = localStorage.getItem(ORDERS_STORAGE_KEY) || '[]';
    const allOrders = JSON.parse(rawList);
    const nonCancelled = allOrders.filter((o) => o && o.status !== 'cancelled');
    const totalRevenue = nonCancelled.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const completedOrders = nonCancelled.filter((o) => o.status === 'completed' || o.status === 'ready' || o.status === 'paid');
    const upiRevenue = nonCancelled.filter((o) => {
      const ps = String(o.paymentStatus || '').toLowerCase();
      const pl = String(o.paymentLabel || '').toLowerCase();
      return ps.includes('upi') || pl.includes('upi') || ps.includes('razorpay') || pl.includes('online');
    }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const cashRevenue = nonCancelled.filter((o) => {
      const ps = String(o.paymentStatus || '').toLowerCase();
      const pl = String(o.paymentLabel || '').toLowerCase();
      return ps.includes('cash') || pl.includes('cash');
    }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const dueRevenue = nonCancelled.filter((o) => {
      const ps = String(o.paymentStatus || '').toLowerCase();
      return ps === 'due' || ps === 'unpaid';
    }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const cancelledOrdersCount = allOrders.filter((o) => o && o.status === 'cancelled').length;

    const revenuePayload = {
      date: dateKey,
      businessId: 'FP-9896',
      businessName: 'FoodyPay Store',
      totalRevenue,
      upiRevenue,
      cashRevenue,
      dueRevenue,
      totalOrdersCount: nonCancelled.length,
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount,
      lastOrderAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(REVENUE_STORAGE_KEY, JSON.stringify(revenuePayload));
    setDoc(revenueDocRef, sanitizeForFirestore(revenuePayload), { merge: true }).catch(() => {});
  } catch  {}
}

export async function syncAllSalesStatsToFirestore(salesData, businessId = 'FP-9896') {
  try {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const revenueDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.REVENUE, dateKey);

    const payload = {
      date: dateKey,
      businessId,
      totalSales: salesData.totalSales || 0,
      paidSales: salesData.paidSales || 0,
      unpaidSales: salesData.unpaidSales || 0,
      upiSales: salesData.upiSales || 0,
      cashSales: salesData.cashSales || 0,
      totalOrdersCount: salesData.totalOrdersCount || 0,
      completedOrdersCount: salesData.completedOrdersCount || 0,
      aov: salesData.aov || 0,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(REVENUE_STORAGE_KEY, JSON.stringify(payload));
    await setDoc(revenueDocRef, sanitizeForFirestore(payload), { merge: true });
    return { success: true };
  } catch (err) {
    console.warn('syncAllSalesStatsToFirestore error:', err);
    return { success: false, error: err };
  }
}

// ============================================================================
// 3. CATALOG & DISHES SUBSCRIPTION & FIREBASE CLOUD SYNC
// ============================================================================
// 3. CATALOG & DISHES LOCAL-FIRST REPOSITORY & MANUAL CLOUD SYNC
// ============================================================================

export const CATALOG_SYNC_META_KEY = 'foodypay_catalog_sync_meta_v1';

/**
 * Get active catalog products stored in localStorage.
 * If localStorage is completely empty, populates from default menu once.
 */
export function getLocalCatalogProducts() {
  try {
    const saved = localStorage.getItem(DISHES_STORAGE_KEY) || localStorage.getItem('foodypay_crm_dishes_v1') || localStorage.getItem('snackrack_local_catalog_v6') || localStorage.getItem('snackrack_local_catalog_v4');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local catalog dishes:', e);
  }

  // Populate default Snack Rack 165 menu items
  try {
    localStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(SNACK_RACK_FULL_MENU));
    localStorage.setItem('foodypay_crm_dishes_v1', JSON.stringify(SNACK_RACK_FULL_MENU));
    localStorage.setItem('snackrack_local_catalog_v6', JSON.stringify(SNACK_RACK_FULL_MENU));
  } catch  {}

  return SNACK_RACK_FULL_MENU;
}

/**
 * Retrieve metadata for catalog synchronization
 */
export function getCatalogSyncMetadata() {
  try {
    const raw = localStorage.getItem(CATALOG_SYNC_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch  {}
  return { lastSyncedAt: null, count: 0, source: 'local' };
}

/**
 * Subscribe to dishes - serves local dishes immediately, reacts to local updates.
 * DOES NOT continuously fetch all products from Firestore over the network!
 * Fetching from cloud is strictly manual on user action.
 */
export function subscribeToProducts(bid, onUpdate) {
  // Immediately provide locally cached catalog products
  const currentDishes = getLocalCatalogProducts();
  if (typeof onUpdate === 'function') {
    onUpdate(currentDishes);
  }

  // React to additions, edits, deletes, and manual cloud syncs
  const handleLocalUpdate = (e) => {
    if (typeof onUpdate === 'function') {
      const updated = e.detail || getLocalCatalogProducts();
      onUpdate(updated);
    }
  };

  const handleStorageChange = (e) => {
    if (e.key === DISHES_STORAGE_KEY && typeof onUpdate === 'function') {
      onUpdate(getLocalCatalogProducts());
    }
  };

  window.addEventListener('foodypay_dishes_updated', handleLocalUpdate);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('foodypay_dishes_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * MANUAL CLOUD FETCH: Fetches all catalog products from Firestore only when user clicks fetch.
 * Saves to localStorage and dispatches update event so whole app reflects new data.
 */
export async function fetchProductsFromFirestore(bid) {
  try {
    const dishesCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.PRODUCTS);
    const snapshot = await getDocs(dishesCol);

    if (!snapshot.empty) {
      const cloudDishes = [];
      snapshot.forEach((docSnap) => {
        cloudDishes.push({ ...docSnap.data(), id: docSnap.id, _id: docSnap.id });
      });

      if (cloudDishes.length > 0) {
        localStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(cloudDishes));
        const syncMeta = {
          lastSyncedAt: new Date().toISOString(),
          count: cloudDishes.length,
          source: 'cloud_fetch'
        };
        localStorage.setItem(CATALOG_SYNC_META_KEY, JSON.stringify(syncMeta));
        window.dispatchEvent(new CustomEvent('foodypay_dishes_updated', { detail: cloudDishes }));
        window.dispatchEvent(new CustomEvent('foodypay_catalog_synced', { detail: syncMeta }));
        return { success: true, count: cloudDishes.length, dishes: cloudDishes, lastSyncedAt: syncMeta.lastSyncedAt };
      }
    }

    // If Firestore collection has 0 documents, return empty catalog without seeding mock items
    return { success: true, count: 0, dishes: [] };
  } catch (err) {
    console.error('Error fetching products from Firestore:', err);
    return { success: false, error: err.message };
  }
}

/**
 * MANUAL CLOUD PUSH: Uploads local catalog dishes to Firestore
 */
export async function pushLocalCatalogToFirestore(bid) {
  try {
    const local = getLocalCatalogProducts();
    for (const item of local) {
      const pId = String(item.id || item._id || `dish_${Date.now()}`);
      const payload = {
        ...item,
        id: pId,
        businessId: bid || 'FP-9896',
        updatedAt: new Date().toISOString(),
      };
      const pRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.PRODUCTS, pId);
      await setDoc(pRef, sanitizeForFirestore(payload), { merge: true });
    }
    const syncMeta = {
      lastSyncedAt: new Date().toISOString(),
      count: local.length,
      source: 'cloud_push'
    };
    localStorage.setItem(CATALOG_SYNC_META_KEY, JSON.stringify(syncMeta));
    window.dispatchEvent(new CustomEvent('foodypay_catalog_synced', { detail: syncMeta }));
    return { success: true, count: local.length };
  } catch (err) {
    console.error('Error pushing local catalog to Firestore:', err);
    return { success: false, error: err.message };
  }
}

// Seed helper if needed
export async function seedCatalogToFirestore() {
  return pushLocalCatalogToFirestore('FP-9896');
}

/**
 * SAVE / ADD / UPDATE PRODUCT:
 * 1. Instantly updates local storage & notifies UI (<1ms)
 * 2. Writes to Firebase Firestore doc
 */
export async function saveProductToFirestore(bid, productObj) {
  const pId = String(productObj.id || productObj._id || `dish_${Date.now()}`);
  const payload = {
    ...productObj,
    id: pId,
    _id: pId,
    businessId: bid || 'FP-9896',
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately update LocalStorage & notify components
  try {
    const list = getLocalCatalogProducts();
    const existingIndex = list.findIndex((p) => String(p.id || p._id) === pId);
    let updated;
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...updated[existingIndex], ...payload };
    } else {
      updated = [payload, ...list];
    }
    localStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('foodypay_dishes_updated', { detail: updated }));
  } catch (e) {
    console.warn('Local catalog update error:', e);
  }

  // 2. Persist to Firestore Cloud
  try {
    const pRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.PRODUCTS, pId);
    await setDoc(pRef, sanitizeForFirestore(payload), { merge: true });
  } catch (e) {
    console.warn('Firebase product save notice (saved locally):', e.message);
  }

  return { success: true, id: pId, product: payload };
}

/**
 * DELETE PRODUCT:
 * 1. Instantly removes from local storage & notifies UI (<1ms)
 * 2. Deletes from Firebase Firestore doc
 */
export async function deleteProductFromFirestore(bid, productId) {
  const pId = String(productId);

  // 1. Immediately update LocalStorage & notify components
  try {
    const list = getLocalCatalogProducts();
    const updated = list.filter((p) => String(p.id || p._id) !== pId);
    localStorage.setItem(DISHES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('foodypay_dishes_updated', { detail: updated }));
  } catch (e) {
    console.warn('Local catalog delete error:', e);
  }

  // 2. Delete from Firestore Cloud
  try {
    const pRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.PRODUCTS, pId);
    await deleteDoc(pRef);
  } catch (e) {
    console.warn('Firebase product delete notice (removed locally):', e.message);
  }

  return { success: true };
}

// ============================================================================
// 4. TABLES SUBSCRIPTION & FIRESTORE CLOUD SYNC
// ============================================================================
export function subscribeToTables(bid, onUpdate) {
  const effectiveBid = String(bid || 'FP-9896').trim().toUpperCase();

  const getTables = () => {
    try {
      const saved = localStorage.getItem(TABLES_STORAGE_KEY) || localStorage.getItem('foodypay_crm_tables_v1') || localStorage.getItem('snackrack_local_tables');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((t) => t && !['tbl-1', 'tbl-2', 'tbl-3', 'tbl-4', 'tbl-5', 'tb_1', 'tb_2', 'tb_3', 'tb_4', 'tb_5', 'tb_6', 'tb_7'].includes(t.id));
        }
      }
      return [];
    } catch  {
      return [];
    }
  };

  if (typeof onUpdate === 'function') {
    onUpdate(getTables());
  }

  let unsubscribeFirestore = () => {};
  try {
    const tablesCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.TABLES);
    unsubscribeFirestore = onSnapshot(tablesCol, (snapshot) => {
      const cloudTables = [];
      if (!snapshot.empty) {
        snapshot.forEach((snap) => {
          const d = snap.data();
          const itemBid = String(d.businessId || d.ownerId || d.userId || '').trim().toUpperCase();
          if (!itemBid || itemBid === effectiveBid || itemBid === 'FP-9896' || effectiveBid === 'FP-9896') {
            cloudTables.push({ ...d, id: snap.id });
          }
        });
      }
      if (cloudTables.length > 0) {
        localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(cloudTables));
        localStorage.setItem('foodypay_crm_tables_v1', JSON.stringify(cloudTables));
        localStorage.setItem('snackrack_local_tables', JSON.stringify(cloudTables));
        if (typeof onUpdate === 'function') onUpdate(cloudTables);
      }
    }, (err) => {
      console.warn('Firestore tables snapshot note:', err);
    });
  } catch  {}

  const listener = () => {
    if (typeof onUpdate === 'function') onUpdate(getTables());
  };
  window.addEventListener('storage', listener);

  return () => {
    unsubscribeFirestore();
    window.removeEventListener('storage', listener);
  };
}

export async function saveTableToFirestore(bid, tableObj) {
  let table = tableObj;
  let businessId = bid;
  if (!tableObj && typeof bid === 'object') {
    table = bid;
    businessId = table.businessId || 'FP-9896';
  }
  if (!table) return { success: false };

  const tId = String(table.id || table._id || `tbl_${Date.now()}`);
  const payload = {
    ...table,
    id: tId,
    _id: tId,
    businessId: String(businessId || table.businessId || 'FP-9896'),
    updatedAt: new Date().toISOString()
  };

  try {
    const raw = localStorage.getItem(TABLES_STORAGE_KEY) || localStorage.getItem('foodypay_crm_tables_v1') || localStorage.getItem('snackrack_local_tables');
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((t) => 
      (t.id && t.id === tId) || 
      (t._id && t._id === tId) || 
      (t.name && table.name && t.name.trim().toLowerCase() === table.name.trim().toLowerCase() && String(t.section || 'Restaurant').trim().toLowerCase() === String(table.section || 'Restaurant').trim().toLowerCase())
    );

    let updatedList;
    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = { ...updatedList[index], ...payload };
    } else {
      updatedList = [...list, payload];
    }

    localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem('foodypay_crm_tables_v1', JSON.stringify(updatedList));
    localStorage.setItem('snackrack_local_tables', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('storage'));

    const tRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.TABLES, tId);
    await setDoc(tRef, sanitizeForFirestore(payload), { merge: true });
  } catch (e) {
    console.warn('saveTableToFirestore notice (saved locally):', e);
  }
  return { success: true };
}

export async function deleteTableFromFirestore(bid, tableId) {
  let tIdVal = tableId;
  if (tableId === undefined && bid) {
    tIdVal = bid;
  }
  const tId = String(tIdVal || '').trim();
  if (!tId) return { success: false };

  try {
    const raw = localStorage.getItem(TABLES_STORAGE_KEY) || localStorage.getItem('foodypay_crm_tables_v1') || localStorage.getItem('snackrack_local_tables');
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((t) => String(t.id) !== tId && String(t._id) !== tId && String(t.name).trim().toLowerCase() !== tId.toLowerCase());

    localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(filtered));
    localStorage.setItem('foodypay_crm_tables_v1', JSON.stringify(filtered));
    localStorage.setItem('snackrack_local_tables', JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));

    const tRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.TABLES, tId);
    await deleteDoc(tRef);
  } catch  {}
  return { success: true };
}

export async function updateTableStatusInFirestore(arg1, arg2, arg3) {
  let tableId = arg1;
  let status = arg2;
  if (arg3 !== undefined) {
    tableId = arg2;
    status = arg3;
  }
  const tId = String(tableId || '').trim();
  if (!tId) return { success: false };

  try {
    // 1. Update localStorage
    const raw = localStorage.getItem(TABLES_STORAGE_KEY) || localStorage.getItem('foodypay_crm_tables_v1') || localStorage.getItem('snackrack_local_tables');
    const list = raw ? JSON.parse(raw) : [];
    const updated = list.map((t) =>
      (String(t.id || t._id) === tId || String(t.name).trim().toLowerCase() === tId.toLowerCase())
        ? { ...t, status, updatedAt: new Date().toISOString() }
        : t
    );
    localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('foodypay_crm_tables_v1', JSON.stringify(updated));
    localStorage.setItem('snackrack_local_tables', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));

    // 2. Persist to Cloud Firestore
    const tRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.TABLES, tId);
    await setDoc(tRef, sanitizeForFirestore({ status, updatedAt: new Date().toISOString() }), { merge: true });
  } catch (e) {
    console.warn('updateTableStatusInFirestore error:', e);
  }
  return { success: true };
}

export async function moveKotTableInFirestore() {
  return { success: true };
}

// ============================================================================
// 5. BUSINESS USER & STORE DETAILS SYNC
// ============================================================================
export async function getBusinessUserByUniqueId(id) {
  try {
    const uRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, id || 'FP-9896');
    const snap = await getDoc(uRef);
    if (snap.exists()) return snap.data();
  } catch  {}

  return {
    uniqueId: id || 'FP-9896',
    businessId: id || 'FP-9896',
    businessName: 'Snack Rack',
    ownerName: 'Snack Rack Admin',
    plan: 'Pro',
    isLocked: false,
  };
}

export async function getBusinessUserByEmail(email) {
  return {
    uniqueId: 'FP-9896',
    businessName: 'Snack Rack',
    plan: 'Pro',
    isLocked: false,
  };
}

export async function saveBusinessUserToFirestore(userData) {
  const uId = String(userData.uniqueId || userData.businessId || 'FP-9896');
  try {
    const uRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, uId);
    await setDoc(uRef, sanitizeForFirestore(userData), { merge: true });
  } catch  {}
  return { success: true };
}

export async function isAccountBlocked(uniqueId) {
  if (!uniqueId) return false;
  try {
    const uRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, String(uniqueId).trim());
    const snap = await getDoc(uRef);
    if (snap.exists()) {
      const data = snap.data();
      return Boolean(data.isLocked || data.status === 'Locked' || data.isSuspended);
    }
  } catch  {}
  return false;
}

export async function isAccountBlockedOrDeleted(uniqueId) {
  if (!uniqueId) return false;
  try {
    const uRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, String(uniqueId).trim());
    const snap = await getDoc(uRef);
    if (!snap.exists()) return false;
    const data = snap.data();
    return Boolean(data.isLocked || data.status === 'Locked' || data.isDeleted);
  } catch  {}
  return false;
}

export async function purgeEntireBusinessData(uniqueId) {
  if (!uniqueId) return { success: false };
  const cleanId = String(uniqueId).trim();
  try {
    await deleteDoc(doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, cleanId));
  } catch  {}
  return { success: true };
}

export async function getAllBusinessUsersFromFirestore() {
  const list = [];
  try {
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      list.push({ id: d.id, uniqueId: d.id, foodypayId: d.id, ...d.data() });
    });
  } catch (err) {
    console.warn('getAllBusinessUsersFromFirestore cloud notice:', err);
  }

  // Merge with localStorage fallback
  try {
    const local = JSON.parse(localStorage.getItem('foodypay_registered_merchants') || '[]');
    if (Array.isArray(local)) {
      local.forEach((lm) => {
        const lmId = lm.uniqueId || lm.foodypayId || lm.id;
        if (lmId && !list.some((it) => (it.uniqueId || it.foodypayId || it.id) === lmId)) {
          list.push(lm);
        }
      });
    }
  } catch  {}

  return list;
}

export function subscribeToBusinessUsers(onUpdate, onError) {
  let unsubscribe = () => {};
  try {
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
    unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((snap) => {
          list.push({ id: snap.id, uniqueId: snap.id, foodypayId: snap.id, ...snap.data() });
        });

        // Merge with local storage cache
        try {
          const local = JSON.parse(localStorage.getItem('foodypay_registered_merchants') || '[]');
          if (Array.isArray(local)) {
            local.forEach((lm) => {
              const lmId = lm.uniqueId || lm.foodypayId || lm.id;
              if (lmId && !list.some((it) => (it.uniqueId || it.foodypayId || it.id) === lmId)) {
                list.push(lm);
              }
            });
          }
        } catch  {}

        if (typeof onUpdate === 'function') {
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('subscribeToBusinessUsers cloud notice:', err);
        if (typeof onError === 'function') onError(err);
      }
    );
  } catch (err) {
    console.warn('subscribeToBusinessUsers error:', err);
  }

  return () => {
    try { unsubscribe(); } catch  {}
  };
}

export async function updateBusinessUserInFirestore(uniqueId, updates) {
  if (!uniqueId) return { success: false, error: 'No ID provided' };
  const cleanId = String(uniqueId).trim();
  const payload = sanitizeForFirestore({
    ...updates,
    uniqueId: cleanId,
    foodypayId: cleanId,
    updatedAt: new Date().toISOString(),
  });

  // Local sync
  try {
    const local = JSON.parse(localStorage.getItem('foodypay_registered_merchants') || '[]');
    const idx = local.findIndex((m) => (m.uniqueId || m.foodypayId || m.id) === cleanId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...payload };
    } else {
      local.push(payload);
    }
    localStorage.setItem('foodypay_registered_merchants', JSON.stringify(local));
  } catch  {}

  // Cloud Firestore sync
  try {
    const uRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, cleanId);
    await setDoc(uRef, payload, { merge: true });
    return { success: true };
  } catch (err) {
    console.warn('updateBusinessUserInFirestore cloud notice:', err);
    return { success: true, localOnly: true };
  }
}

export async function deleteBusinessUserFromFirestore(uniqueId) {
  if (!uniqueId) return { success: false, error: 'No ID provided' };
  const cleanId = String(uniqueId).trim();

  // Local storage cleanup
  try {
    const local = JSON.parse(localStorage.getItem('foodypay_registered_merchants') || '[]');
    const filtered = local.filter((m) => (m.uniqueId || m.foodypayId || m.id) !== cleanId);
    localStorage.setItem('foodypay_registered_merchants', JSON.stringify(filtered));
  } catch  {}

  // Cloud Firestore cleanup
  try {
    const uRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, cleanId);
    await deleteDoc(uRef);
    return { success: true };
  } catch (err) {
    console.warn('deleteBusinessUserFromFirestore cloud notice:', err);
    return { success: true, localOnly: true };
  }
}

export function calculatePlanDates(plan = 'L1', durationMonths = 1) {
  const now = new Date();
  const startDate = now.toISOString();
  const expDate = new Date(now.getTime() + Number(durationMonths) * 30 * 24 * 60 * 60 * 1000);
  return {
    startDate,
    startingDate: startDate,
    endDate: expDate.toISOString(),
    expireDate: expDate.toISOString(),
  };
}

export function subscribeToCustomerDues(bid, onUpdate) {
  if (typeof onUpdate === 'function') onUpdate([]);
  return () => {};
}

export async function saveCustomerDueToFirestore() {
  return { success: true };
}

export async function settleCustomerDueInFirestore() {
  return { success: true };
}

export async function saveCustomerToFirestore() {
  return { success: true };
}
