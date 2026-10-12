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
    const bid = (businessIdOrFilter && businessIdOrFilter !== 'all' && businessIdOrFilter !== 'master')
      ? String(businessIdOrFilter).trim().toUpperCase()
      : null;

    // Read recent orders and strictly match current businessId
    const q = query(ordersRef, limit(350));

    return onSnapshot(
      q,
      (snapshot) => {
        const ordersList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id;
          const orderObj = {
            ...data,
            firestoreId: docId,
            _id: data._id || docId,
            id: data.id || docId,
          };

          if (!bid) {
            ordersList.push(orderObj);
          } else {
            // Strict restaurant isolation: match exact businessId across all fields
            const docBid = String(
              data.merchantFilter ||
              data.businessId ||
              data.foodypayId ||
              data.merchantId ||
              data.user ||
              ''
            ).trim().toUpperCase();

            if (docBid === bid) {
              ordersList.push(orderObj);
            }
          }
        });

        // Sort descending by createdAt or date
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
export async function updateOrderInFirestore(businessIdOrOrderId, maybeOrderIdOrFields, maybeFields) {
  try {
    let orderId;
    let updateFields;
    if (maybeFields !== undefined) {
      orderId = maybeOrderIdOrFields;
      updateFields = maybeFields || {};
    } else {
      orderId = businessIdOrOrderId;
      updateFields = maybeOrderIdOrFields || {};
    }
    if (!orderId) return null;
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
      const orderId = maybeFields !== undefined ? maybeOrderIdOrFields : businessIdOrOrderId;
      const updateFields = maybeFields !== undefined ? maybeFields : maybeOrderIdOrFields;
      const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS, String(orderId));
      await setDoc(docRef, sanitizeDoc(updateFields || {}), { merge: true });
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
    const bId = (businessId && businessId !== 'all' && businessId !== 'master')
      ? String(businessId).trim().toUpperCase()
      : null;
    const q = query(tablesRef, limit(250));

    return onSnapshot(
      q,
      (snapshot) => {
        const tables = [];
        snapshot.forEach((snap) => {
          const t = { id: snap.id, _id: snap.id, ...snap.data() };
          if (!bId) {
            tables.push(t);
          } else {
            const match = String(t.businessId || t.merchantId || t.foodypayId || t.merchantFilter || '').trim().toUpperCase();
            if (match === bId) {
              tables.push(t);
            }
          }
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
 * Save Table to Cloud Firestore (accepts polymorphic arguments)
 */
export async function saveTableToFirestore(businessIdOrData, maybeData) {
  try {
    const tableData = maybeData !== undefined ? maybeData : businessIdOrData;
    const passedBid = maybeData !== undefined ? businessIdOrData : null;
    const tableId = String(tableData?._id || tableData?.id || `table_${Date.now()}`);
    const bId = String(passedBid || tableData?.businessId || tableData?.foodypayId || tableData?.merchantId || '').trim().toUpperCase();
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.TABLES, tableId);
    await setDoc(docRef, sanitizeDoc({
      ...tableData,
      id: tableId,
      _id: tableId,
      businessId: bId,
      merchantId: bId,
      foodypayId: bId,
      merchantFilter: bId,
    }), { merge: true });
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
      password: businessData.password !== undefined ? businessData.password : undefined,
      kitchenPassword: businessData.kitchenPassword !== undefined ? businessData.kitchenPassword : undefined,
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

/**
 * Permanently block an account (email & uniqueId) so it can NEVER log in or re-register
 */
export async function recordBlockedAccount(email, uniqueId, reason = 'Terminated and permanently deleted by Master SuperAdmin') {
  try {
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanId = uniqueId ? String(uniqueId).trim().toUpperCase() : '';

    const payload = sanitizeDoc({
      email: cleanEmail,
      uniqueId: cleanId,
      reason,
      blockedAt: new Date().toISOString(),
      permanent: true,
    });

    if (cleanEmail) {
      const emailDocId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, '_');
      await setDoc(doc(firestoreDb, FIRESTORE_COLLECTIONS.BLOCKED_ACCOUNTS, `email_${emailDocId}`), payload, { merge: true });
    }
    if (cleanId) {
      await setDoc(doc(firestoreDb, FIRESTORE_COLLECTIONS.BLOCKED_ACCOUNTS, `id_${cleanId}`), payload, { merge: true });
    }
    return { success: true };
  } catch (err) {
    console.warn('recordBlockedAccount warning:', err.message);
    return null;
  }
}

/**
 * Check if an email or Unique ID is in Blocked_Accounts
 */
export async function isAccountBlocked(emailOrId) {
  if (!emailOrId) return false;
  try {
    const clean = String(emailOrId).trim().toLowerCase();
    const cleanUpper = clean.toUpperCase();

    // 1. Direct doc lookup by email
    const emailDocId = clean.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docEmailRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BLOCKED_ACCOUNTS, `email_${emailDocId}`);
    const emailSnap = await getDoc(docEmailRef);
    if (emailSnap.exists()) return true;

    // 2. Direct doc lookup by id
    const docIdRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BLOCKED_ACCOUNTS, `id_${cleanUpper}`);
    const idSnap = await getDoc(docIdRef);
    if (idSnap.exists()) return true;

    // 3. Fallback query
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BLOCKED_ACCOUNTS);
    const q1 = query(colRef, where('email', '==', clean), limit(1));
    const s1 = await getDocs(q1);
    if (!s1.empty) return true;

    const q2 = query(colRef, where('uniqueId', '==', cleanUpper), limit(1));
    const s2 = await getDocs(q2);
    if (!s2.empty) return true;

    return false;
  } catch (err) {
    console.warn('isAccountBlocked check warning:', err.message);
    return false;
  }
}

/**
 * Check if an account is either permanently blocked OR completely absent from Business_Users
 */
export async function isAccountBlockedOrDeleted(email, uniqueId) {
  try {
    // 1. Check if explicitly in Blocked_Accounts
    if (email && (await isAccountBlocked(email))) return true;
    if (uniqueId && (await isAccountBlocked(uniqueId))) return true;

    // 2. Check if it exists in Business_Users
    let found = null;
    if (uniqueId) {
      found = await getBusinessUserByUniqueId(uniqueId);
    }
    if (!found && email) {
      found = await getBusinessUserByEmail(email);
    }

    // If completely absent from Business_Users, it was deleted!
    if (!found) {
      return true;
    }

    if (found.isLocked && String(found.lockReason || '').toLowerCase().includes('delete')) {
      return true;
    }

    return false;
  } catch (err) {
    console.warn('isAccountBlockedOrDeleted warning:', err.message);
    return false;
  }
}

/**
 * Helper to delete all documents matching a query in Firestore
 */
async function deleteQueryDocs(q) {
  try {
    const snap = await getDocs(q);
    const promises = [];
    snap.forEach((d) => {
      promises.push(deleteDoc(d.ref));
    });
    await Promise.all(promises);
    return snap.size;
  } catch (e) {
    console.warn('deleteQueryDocs warning:', e.message);
    return 0;
  }
}

/**
 * PURGE ENTIRE BUSINESS DATA:
 * Deletes Business Profile, Dishes, Products, Tables, Orders, Dues, Coupons
 * and adds to Blocked_Accounts so it can NEVER log in or verify via Google again.
 */
export async function purgeEntireBusinessData(uniqueId, email) {
  const cleanId = uniqueId ? String(uniqueId).trim().toUpperCase() : '';
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';

  try {
    // 1. Record in Blocked_Accounts immediately
    await recordBlockedAccount(cleanEmail, cleanId, 'Permanently Terminated & Deleted by Master SuperAdmin');

    // 2. Delete from Business_Users by ID
    if (cleanId) {
      try {
        await deleteDoc(doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, cleanId));
      } catch (e) {}
    }

    // 3. Delete from Business_Users by Email
    if (cleanEmail) {
      try {
        const busCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
        await deleteQueryDocs(query(busCol, where('email', '==', cleanEmail)));
      } catch (e) {}
    }

    // 4. Delete from USERS collection by Email
    if (cleanEmail) {
      try {
        const usersCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.USERS);
        await deleteQueryDocs(query(usersCol, where('email', '==', cleanEmail)));
      } catch (e) {}
    }

    // 5. Delete all Dishes & Products linked to this business
    if (cleanId) {
      try {
        const dishesCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.DISHES);
        await deleteQueryDocs(query(dishesCol, where('businessId', '==', cleanId)));
        await deleteQueryDocs(query(dishesCol, where('foodypayId', '==', cleanId)));
        await deleteQueryDocs(query(dishesCol, where('merchantId', '==', cleanId)));
      } catch (e) {}
      try {
        const prodCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.PRODUCTS);
        await deleteQueryDocs(query(prodCol, where('businessId', '==', cleanId)));
      } catch (e) {}
    }

    // 6. Delete all Dining Tables linked to this business
    if (cleanId) {
      try {
        const tablesCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.TABLES);
        await deleteQueryDocs(query(tablesCol, where('businessId', '==', cleanId)));
        await deleteQueryDocs(query(tablesCol, where('merchantId', '==', cleanId)));
        await deleteQueryDocs(query(tablesCol, where('foodypayId', '==', cleanId)));
      } catch (e) {}
    }

    // 7. Delete all Orders linked to this business
    if (cleanId) {
      try {
        const ordersCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.ORDERS);
        await deleteQueryDocs(query(ordersCol, where('businessId', '==', cleanId)));
        await deleteQueryDocs(query(ordersCol, where('foodypayId', '==', cleanId)));
        await deleteQueryDocs(query(ordersCol, where('merchantId', '==', cleanId)));
      } catch (e) {}
    }

    // 8. Delete all Customer Dues linked to this business
    if (cleanId) {
      try {
        const duesCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.DUES);
        await deleteQueryDocs(query(duesCol, where('businessId', '==', cleanId)));
      } catch (e) {}
    }

    // 9. Delete all Coupons linked to this business
    if (cleanId) {
      try {
        const coupCol = collection(firestoreDb, FIRESTORE_COLLECTIONS.COUPONS);
        await deleteQueryDocs(query(coupCol, where('businessId', '==', cleanId)));
      } catch (e) {}
    }

    // 10. Clean up client localStorage if this active browser was running this user
    try {
      const activeUserRaw = localStorage.getItem('foodypay_user');
      const activeBizId = localStorage.getItem('foodypay_active_business_id');
      let shouldClear = false;

      if (activeBizId && activeBizId.toUpperCase() === cleanId) {
        shouldClear = true;
      }
      if (activeUserRaw) {
        const parsed = JSON.parse(activeUserRaw);
        if (
          (parsed.email && parsed.email.toLowerCase() === cleanEmail) ||
          (parsed.uniqueId && parsed.uniqueId.toUpperCase() === cleanId) ||
          (parsed.foodypayId && parsed.foodypayId.toUpperCase() === cleanId)
        ) {
          shouldClear = true;
        }
      }

      if (shouldClear) {
        localStorage.removeItem('foodypay_token');
        localStorage.removeItem('foodypay_user');
        localStorage.removeItem('foodypay_active_business_id');
        localStorage.removeItem('foodypay_crm_orders_v3');
        localStorage.removeItem('foodypay_kitchen_logged_in');
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}

    return { success: true };
  } catch (err) {
    console.error('purgeEntireBusinessData critical error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// PRODUCTS / DISHES PER RESTAURANT (MULTI-TENANT BY businessId)
// ============================================================================

/**
 * Save Dish / Product into Firestore linked with Unique businessId
 */
export async function saveProductToFirestore(businessIdOrData, maybeData) {
  try {
    const productData = maybeData !== undefined ? maybeData : businessIdOrData;
    const passedBid = maybeData !== undefined ? businessIdOrData : null;
    const bId = String(passedBid || productData?.businessId || productData?.foodypayId || productData?.merchantId || 'FP-348330').trim().toUpperCase();
    const prodId = String(productData?.id || productData?._id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`);
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.DISHES, prodId);

    const payload = sanitizeDoc({
      ...productData,
      id: prodId,
      _id: prodId,
      businessId: bId,
      merchantId: bId,
      foodypayId: bId,
      merchantFilter: bId,
      updatedAt: new Date().toISOString(),
      createdAt: productData?.createdAt || new Date().toISOString(),
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
    const bId = (businessId && businessId !== 'all' && businessId !== 'master')
      ? String(businessId).trim().toUpperCase()
      : null;
    const q = query(dishesRef, limit(350));

    return onSnapshot(
      q,
      (snapshot) => {
        const dishes = [];
        snapshot.forEach((snap) => {
          const d = { id: snap.id, _id: snap.id, ...snap.data() };
          if (!bId) {
            dishes.push(d);
          } else {
            const dBid = String(d.businessId || d.merchantId || d.foodypayId || d.merchantFilter || d.storeId || '').trim().toUpperCase();
            // Match current business or allow global/store dishes
            if (!dBid || dBid === bId || dBid === 'ALL' || dBid === 'MASTER') {
              dishes.push(d);
            }
          }
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
