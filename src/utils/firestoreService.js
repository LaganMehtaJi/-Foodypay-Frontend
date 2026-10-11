import {
  firestoreDb,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  FIRESTORE_COLLECTIONS,
} from './firebase';

/**
 * Clean object of undefined fields before writing to Firestore
 */
const sanitizeDoc = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined && typeof val !== 'function') {
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeDoc(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
};

// ============================================================================
// ORDERS REAL-TIME SUBSCRIPTION & CRUD
// ============================================================================

/**
 * Subscribe to real-time live orders from Firestore.
 * Sub-second notification when customer places order or status changes.
 */
export function subscribeToOrders(businessIdOrFilter, onUpdate, onError) {
  try {
    const ordersRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS);
    let q;
    if (businessIdOrFilter && businessIdOrFilter !== 'all' && businessIdOrFilter !== 'master') {
      const bid = String(businessIdOrFilter).trim().toUpperCase();
      // Strict restaurant isolation: match exact businessId / merchantFilter only
      q = query(
        ordersRef,
        where('merchantFilter', '==', bid),
        limit(250)
      );
    } else {
      // Master view sees all
      q = query(ordersRef, limit(300));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const ordersList = [];
        snapshot.forEach((docSnap) => {
          ordersList.push({
            id: docSnap.id,
            _id: docSnap.id,
            ...docSnap.data(),
          });
        });

        // Sort descending by createdAt or timestamp
        ordersList.sort((a, b) => {
          const tA = new Date(a.createdAt || a.date || 0).getTime();
          const tB = new Date(b.createdAt || b.date || 0).getTime();
          return tB - tA;
        });

        if (typeof onUpdate === 'function') {
          onUpdate(ordersList);
        }
      },
      (err) => {
        console.warn('Firestore Orders onSnapshot notice:', err.message);
        if (typeof onError === 'function') onError(err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to Firestore orders:', err.message);
    return () => {};
  }
}

/**
 * Save / Create an order directly in Cloud Firestore (storing businessId for multi-tenancy)
 */
export async function saveOrderToFirestore(orderData) {
  try {
    const orderId = String(orderData._id || orderData.id || orderData.orderId || `fp_${Date.now()}`);
    const orderDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, orderId);

    const bId = String(orderData.businessId || orderData.foodypayId || orderData.merchantId || orderData.user || 'FP-348330');

    const docPayload = sanitizeDoc({
      ...orderData,
      _id: orderId,
      id: orderId,
      businessId: bId,
      merchantId: bId,
      foodypayId: bId,
      merchantFilter: bId,
      updatedAt: new Date().toISOString(),
      createdAt: orderData.createdAt || new Date().toISOString(),
    });

    await setDoc(orderDocRef, docPayload, { merge: true });
    return { success: true, id: orderId };
  } catch (err) {
    console.warn('saveOrderToFirestore warning:', err.message);
    return null;
  }
}

/**
 * Update order status, seen flags, or fields in Cloud Firestore
 */
export async function updateOrderInFirestore(orderId, updateFields) {
  try {
    if (!orderId) return;
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, String(orderId));
    const cleanUpdate = sanitizeDoc({
      ...updateFields,
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(docRef, cleanUpdate);
    return { success: true };
  } catch (err) {
    // If doc didn't exist yet, create with setDoc merge
    try {
      const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, String(orderId));
      await setDoc(docRef, sanitizeDoc(updateFields), { merge: true });
      return { success: true };
    } catch (e) {
      console.warn('updateOrderInFirestore warning:', e.message);
      return null;
    }
  }
}

/**
 * Move order table in Cloud Firestore
 */
export async function moveKotTableInFirestore(orderId, targetTable) {
  return updateOrderInFirestore(orderId, {
    table: targetTable,
    tableName: targetTable,
    movedAt: new Date().toISOString(),
  });
}

/**
 * Delete order from Cloud Firestore
 */
export async function deleteOrderFromFirestore(orderId) {
  try {
    if (!orderId) return;
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, String(orderId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.warn('deleteOrderFromFirestore warning:', err.message);
    return null;
  }
}

// ============================================================================
// CUSTOMER DUES (KHATA / UDHAAR) IN CLOUD FIRESTORE
// ============================================================================

/**
 * Subscribe to Customer Dues in Cloud Firestore
 */
export function subscribeToCustomerDues(phone, onUpdate, onError) {
  try {
    const duesRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.DUES);
    let q = query(duesRef, limit(150));
    if (phone) {
      q = query(duesRef, where('phone', '==', String(phone).trim()), limit(100));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const dues = [];
        snapshot.forEach((snap) => {
          dues.push({ id: snap.id, ...snap.data() });
        });
        if (typeof onUpdate === 'function') onUpdate(dues);
      },
      (err) => {
        console.warn('Firestore Customer Dues subscribe notice:', err.message);
        if (typeof onError === 'function') onError(err);
      }
    );
  } catch (err) {
    console.warn('subscribeToCustomerDues error:', err.message);
    return () => {};
  }
}

/**
 * Save Due Record in Cloud Firestore
 */
export async function saveCustomerDueToFirestore(dueData) {
  try {
    const dueId = String(dueData.id || dueData._id || `due_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    const dueDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.DUES, dueId);

    const payload = sanitizeDoc({
      ...dueData,
      id: dueId,
      status: dueData.status || 'unpaid', // 'unpaid' | 'paid' | 'partial'
      createdAt: dueData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await setDoc(dueDocRef, payload, { merge: true });
    return { success: true, id: dueId, data: payload };
  } catch (err) {
    console.warn('saveCustomerDueToFirestore warning:', err.message);
    return null;
  }
}

/**
 * Settle Customer Due Record in Cloud Firestore
 */
export async function settleCustomerDueInFirestore(dueId, settleDetails = {}) {
  try {
    if (!dueId) return null;
    const dueDocRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.DUES, String(dueId));
    const payload = sanitizeDoc({
      status: 'paid',
      isPaid: true,
      clearedAt: new Date().toISOString(),
      settledMode: settleDetails.mode || 'Cash',
      settledAmount: settleDetails.amount,
      note: settleDetails.note || 'Settled and cleared',
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(dueDocRef, payload);
    return { success: true, data: payload };
  } catch (err) {
    console.warn('settleCustomerDueInFirestore warning:', err.message);
    return null;
  }
}

// ============================================================================
// TABLES IN CLOUD FIRESTORE
// ============================================================================

/**
 * Subscribe to Dining Tables in Cloud Firestore
 */
export function subscribeToTables(businessId, onUpdate, onError) {
  try {
    const tablesRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.TABLES);
    let q;
    if (businessId && businessId !== 'all' && businessId !== 'master') {
      const bId = String(businessId).trim().toUpperCase();
      q = query(tablesRef, where('businessId', '==', bId), limit(200));
    } else {
      q = query(tablesRef, limit(200));
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const tables = [];
        snapshot.forEach((snap) => {
          tables.push({ id: snap.id, _id: snap.id, ...snap.data() });
        });
        if (typeof onUpdate === 'function') onUpdate(tables);
      },
      (err) => {
        console.warn('Firestore Tables subscribe notice:', err.message);
        if (typeof onError === 'function') onError(err);
      }
    );
  } catch (err) {
    console.warn('subscribeToTables error:', err.message);
    return () => {};
  }
}

/**
 * Save Table to Cloud Firestore
 */
export async function saveTableToFirestore(tableData) {
  try {
    const tableId = String(tableData._id || tableData.id || `table_${Date.now()}`);
    const bId = String(tableData.businessId || tableData.foodypayId || tableData.merchantId || '').trim().toUpperCase();
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.TABLES, tableId);
    await setDoc(docRef, sanitizeDoc({ ...tableData, id: tableId, _id: tableId, businessId: bId }), { merge: true });
    return { success: true, id: tableId };
  } catch (err) {
    console.warn('saveTableToFirestore warning:', err.message);
    return null;
  }
}

/**
 * Update Table status (available / occupied / reserved) in Cloud Firestore
 */
export async function updateTableStatusInFirestore(tableId, status) {
  try {
    if (!tableId) return;
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.TABLES, String(tableId));
    await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    return { success: true };
  } catch (err) {
    console.warn('updateTableStatusInFirestore warning:', err.message);
    return null;
  }
}

/**
 * Delete Table from Cloud Firestore
 */
export async function deleteTableFromFirestore(tableId) {
  try {
    if (!tableId) return;
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.TABLES, String(tableId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.warn('deleteTableFromFirestore warning:', err.message);
    return null;
  }
}

// ============================================================================
// BUSINESS_USERS (CAFE & RESTAURANT UNIQUE ID, PLAN & MULTI-TENANT PROFILES)
// ============================================================================

/**
 * Calculates start and expiry dates based on business plan tier
 * Plans: 'Free' (14 Days), 'Basic' (30 Days), 'Growth' (90 Days), 'Pro' (365 Days)
 */
export function calculatePlanDates(plan = 'Free', customStartDate = null) {
  const start = customStartDate ? new Date(customStartDate) : new Date();
  const expire = new Date(start);

  const normalizedPlan = (plan || 'Free').toLowerCase();
  if (normalizedPlan.includes('pro')) {
    expire.setDate(expire.getDate() + 365);
  } else if (normalizedPlan.includes('growth')) {
    expire.setDate(expire.getDate() + 90);
  } else if (normalizedPlan.includes('basic')) {
    expire.setDate(expire.getDate() + 30);
  } else {
    // Free trial default: 14 days
    expire.setDate(expire.getDate() + 14);
  }

  return {
    startingDate: start.toISOString(),
    expireDate: expire.toISOString(),
  };
}

/**
 * Create or Update a Cafe / Restaurant Business Profile in Cloud Firestore (Business_Users)
 */
export async function saveBusinessUserToFirestore(businessData) {
  try {
    const rawId = businessData.uniqueId || businessData.businessId || businessData.foodypayId || businessData._id || businessData.id;
    const uniqueId = rawId ? String(rawId).trim().toUpperCase() : `FP-${Math.floor(100000 + Math.random() * 900000)}`;

    const planName = businessData.plan || 'Free';
    const dates = calculatePlanDates(planName, businessData.startingDate);

    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, uniqueId);

    const payload = sanitizeDoc({
      uniqueId,
      businessId: uniqueId,
      id: uniqueId,
      _id: uniqueId,
      businessName: businessData.businessName || businessData.name || 'My Restaurant',
      ownerName: businessData.ownerName || businessData.name || '',
      email: (businessData.email || '').trim().toLowerCase(),
      phone: businessData.phone || businessData.contactNo || '',
      plan: planName, // 'Free' | 'Basic' | 'Growth' | 'Pro'
      startingDate: businessData.startingDate || dates.startingDate,
      expireDate: businessData.expireDate || dates.expireDate,
      address: businessData.address || '',
      city: businessData.city || 'Mohali',
      state: businessData.state || 'Punjab',
      logoUrl: businessData.logoUrl || businessData.logo?.url || '',
      upiId: businessData.upiId || '7496888449@ptsbi',
      isLocked: Boolean(businessData.isLocked),
      lockReason: businessData.lockReason || 'Subscription Payment Required',
      status: businessData.isLocked ? 'Locked' : (new Date(dates.expireDate) < new Date() ? 'Expired' : 'Active'),
      createdAt: businessData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, payload, { merge: true });
    return { success: true, uniqueId, data: payload };
  } catch (err) {
    console.warn('saveBusinessUserToFirestore error:', err.message);
    return null;
  }
}

/**
 * Get Business details by Unique ID from Business_Users
 */
export async function getBusinessUserByUniqueId(uniqueId) {
  if (!uniqueId) return null;
  try {
    const cleanId = String(uniqueId).trim().toUpperCase();
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, uniqueId: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.warn('getBusinessUserByUniqueId error:', err.message);
    return null;
  }
}

/**
 * Get Business details by Email from Business_Users
 */
export async function getBusinessUserByEmail(email) {
  if (!email) return null;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
    const q = query(colRef, where('email', '==', cleanEmail), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, uniqueId: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.warn('getBusinessUserByEmail error:', err.message);
    return null;
  }
}

/**
 * Fetch ALL Businesses from Business_Users (Master Admin View)
 */
export async function getAllBusinessUsersFromFirestore() {
  try {
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
    const snap = await getDocs(colRef);
    const businesses = [];
    snap.forEach((d) => {
      businesses.push({ id: d.id, uniqueId: d.id, ...d.data() });
    });
    return businesses;
  } catch (err) {
    console.warn('getAllBusinessUsersFromFirestore error:', err.message);
    return [];
  }
}

/**
 * Real-time listener for ALL Businesses in Business_Users (Master Admin Live Feed)
 */
export function subscribeToBusinessUsers(onUpdate, onError) {
  try {
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((snap) => {
          list.push({ id: snap.id, uniqueId: snap.id, ...snap.data() });
        });
        if (typeof onUpdate === 'function') onUpdate(list);
      },
      (err) => {
        console.warn('subscribeToBusinessUsers error:', err.message);
        if (typeof onError === 'function') onError(err);
      }
    );
  } catch (err) {
    console.warn('subscribeToBusinessUsers subscribe error:', err.message);
    return () => {};
  }
}

/**
 * Update Business User Plan, Dates or Lock Status in Firestore
 */
export async function updateBusinessUserInFirestore(uniqueId, updates) {
  if (!uniqueId) return null;
  try {
    const cleanId = String(uniqueId).trim().toUpperCase();
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, cleanId);

    const payload = sanitizeDoc({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, payload, { merge: true });
    return { success: true };
  } catch (err) {
    console.warn('updateBusinessUserInFirestore error:', err.message);
    return null;
  }
}

/**
 * Delete Business from Business_Users in Cloud Firestore
 */
export async function deleteBusinessUserFromFirestore(uniqueId) {
  if (!uniqueId) return null;
  try {
    const cleanId = String(uniqueId).trim().toUpperCase();
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, cleanId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.warn('deleteBusinessUserFromFirestore error:', err.message);
    return null;
  }
}

// ============================================================================
// PRODUCTS / DISHES PER RESTAURANT (MULTI-TENANT BY businessId)
// ============================================================================

/**
 * Save Dish / Product into Firestore linked with Unique businessId
 */
export async function saveProductToFirestore(businessId, productData) {
  try {
    const bId = String(businessId || productData.businessId || productData.foodypayId || 'FP-348330').trim().toUpperCase();
    const prodId = String(productData.id || productData._id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.DISHES, prodId);

    const payload = sanitizeDoc({
      ...productData,
      id: prodId,
      _id: prodId,
      businessId: bId,
      merchantId: bId,
      foodypayId: bId,
      updatedAt: new Date().toISOString(),
      createdAt: productData.createdAt || new Date().toISOString(),
    });

    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: prodId, data: payload };
  } catch (err) {
    console.warn('saveProductToFirestore error:', err.message);
    return null;
  }
}

/**
 * Subscribe to Products / Dishes filtered by businessId in Cloud Firestore
 */
export function subscribeToProducts(businessId, onUpdate, onError) {
  try {
    const dishesRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.DISHES);
    let q;
    if (businessId && businessId !== 'all' && businessId !== 'master') {
      const bId = String(businessId).trim().toUpperCase();
      // Strict restaurant isolation: show only dishes created by this businessId
      q = query(dishesRef, where('businessId', '==', bId), limit(250));
    } else {
      q = query(dishesRef, limit(250));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const dishes = [];
        snapshot.forEach((snap) => {
          dishes.push({ id: snap.id, _id: snap.id, ...snap.data() });
        });
        if (typeof onUpdate === 'function') onUpdate(dishes);
      },
      (err) => {
        console.warn('subscribeToProducts notice:', err.message);
        if (typeof onError === 'function') onError(err);
      }
    );
  } catch (err) {
    console.warn('subscribeToProducts error:', err.message);
    return () => {};
  }
}

/**
 * Delete Product from Cloud Firestore
 */
export async function deleteProductFromFirestore(productId) {
  if (!productId) return null;
  try {
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.DISHES, String(productId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.warn('deleteProductFromFirestore error:', err.message);
    return null;
  }
}

// ============================================================================
// CUSTOMERS, COUPONS & SETTINGS PER RESTAURANT (MULTI-TENANT)
// ============================================================================

export async function saveCustomerToFirestore(businessId, customerData) {
  try {
    const bId = String(businessId || customerData.businessId || 'FP-348330').trim().toUpperCase();
    const custId = String(customerData.id || customerData._id || `cust_${customerData.phone || Date.now()}`);
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.CUSTOMERS, custId);

    const payload = sanitizeDoc({
      ...customerData,
      id: custId,
      _id: custId,
      businessId: bId,
      merchantId: bId,
      updatedAt: new Date().toISOString(),
      createdAt: customerData.createdAt || new Date().toISOString(),
    });

    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: custId };
  } catch (err) {
    console.warn('saveCustomerToFirestore error:', err.message);
    return null;
  }
}

export async function saveCouponToFirestore(businessId, couponData) {
  try {
    const bId = String(businessId || couponData.businessId || 'FP-348330').trim().toUpperCase();
    const couponId = String(couponData.id || couponData._id || `coupon_${Date.now()}`);
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.COUPONS, couponId);

    const payload = sanitizeDoc({
      ...couponData,
      id: couponId,
      _id: couponId,
      businessId: bId,
      merchantId: bId,
      updatedAt: new Date().toISOString(),
      createdAt: couponData.createdAt || new Date().toISOString(),
    });

    await setDoc(docRef, payload, { merge: true });
    return { success: true, id: couponId };
  } catch (err) {
    console.warn('saveCouponToFirestore error:', err.message);
    return null;
  }
}

export async function saveSettingsToFirestore(businessId, settingsData) {
  try {
    const bId = String(businessId || settingsData.businessId || 'FP-348330').trim().toUpperCase();
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.SETTINGS, bId);

    const payload = sanitizeDoc({
      ...settingsData,
      businessId: bId,
      merchantId: bId,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(docRef, payload, { merge: true });
    return { success: true, businessId: bId };
  } catch (err) {
    console.warn('saveSettingsToFirestore error:', err.message);
    return null;
  }
}

export async function getSettingsFromFirestore(businessId) {
  if (!businessId) return null;
  try {
    const bId = String(businessId).trim().toUpperCase();
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.SETTINGS, bId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('getSettingsFromFirestore error:', err.message);
    return null;
  }
}
