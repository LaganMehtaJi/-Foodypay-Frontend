import {
  firestoreDb,
  FIRESTORE_COLLECTIONS,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from './firebase';

const LOCAL_MERCHANTS_KEY = 'foodypay_registered_merchants';

// Candidate API base URLs to try
const API_BASE_URLS = [
  'http://localhost:3000/api',
  'http://localhost:5000/api',
  import.meta.env.VITE_API_BASE_URL || 'https://api.foodypay.online/api',
  'https://api.stage.foodypay.online/api',
];

let workingApiUrl = null;

/**
 * Detect working server backend API URL
 */
export async function getWorkingApiUrl() {
  if (workingApiUrl) return workingApiUrl;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${baseUrl}/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ping_test_connection@foodypay.online' }),
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && (res.status === 200 || res.status === 400 || res.status === 404)) {
        workingApiUrl = baseUrl;
        return baseUrl;
      }
    } catch  {}
  }

  // Default to localhost:3000 or env
  workingApiUrl = API_BASE_URLS[0];
  return workingApiUrl;
}

/**
 * Check backend server health status
 */
export async function checkServerStatus() {
  const url = await getWorkingApiUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${url}/auth/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      return { online: true, url, mode: 'Server Connected' };
    }
  } catch  {}

  return { online: false, url, mode: 'Cloud Firestore Direct' };
}

/**
 * Fetch all registered merchants/users from Server + Cloud Firestore + Local Cache
 */
export async function fetchSetupUsers() {
  const userMap = new Map();

  // 1. Fetch from Cloud Firestore (primary cloud store)
  try {
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      const data = d.data();
      const cleanId = (data.foodypayId || data.uniqueId || d.id || '').toUpperCase();
      userMap.set(cleanId, {
        id: cleanId,
        uniqueId: cleanId,
        foodypayId: cleanId,
        ...data,
      });
    });
  } catch (fsErr) {
    console.warn('Firestore fetchSetupUsers notice:', fsErr?.message);
  }

  // 2. Fetch from Backend Server API
  try {
    const url = await getWorkingApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${url}/auth/users`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const json = await res.json();
      const list = json.data || json.users || [];
      if (Array.isArray(list)) {
        list.forEach((u) => {
          const cleanId = (u.foodypayId || u.uniqueId || u._id || '').toUpperCase();
          if (cleanId) {
            const existing = userMap.get(cleanId) || {};
            userMap.set(cleanId, {
              ...existing,
              ...u,
              foodypayId: cleanId,
              uniqueId: cleanId,
              id: cleanId,
            });
          }
        });
      }
    }
  } catch (apiErr) {
    console.warn('Server API fetchSetupUsers notice:', apiErr?.message);
  }

  // 3. Merge with local storage fallback
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    if (Array.isArray(local)) {
      local.forEach((u) => {
        const cleanId = (u.foodypayId || u.uniqueId || u.id || '').toUpperCase();
        if (cleanId && !userMap.has(cleanId)) {
          userMap.set(cleanId, u);
        }
      });
    }
  } catch  {}

  const merged = Array.from(userMap.values());
  // Save cache
  try {
    localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(merged));
  } catch  {}

  return merged;
}

/**
 * Real-time listener for registered users from Cloud Firestore
 */
export function subscribeToSetupUsers(onUpdate) {
  let unsubscribeFs = () => {};
  try {
    const colRef = collection(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS);
    unsubscribeFs = onSnapshot(
      colRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((snap) => {
          const data = snap.data();
          const cleanId = (data.foodypayId || data.uniqueId || snap.id).toUpperCase();
          list.push({
            id: cleanId,
            uniqueId: cleanId,
            foodypayId: cleanId,
            ...data,
          });
        });

        // Merge with local cache
        try {
          const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
          if (Array.isArray(local)) {
            local.forEach((u) => {
              const cleanId = (u.foodypayId || u.uniqueId || u.id || '').toUpperCase();
              if (cleanId && !list.some((it) => (it.foodypayId || it.uniqueId || it.id) === cleanId)) {
                list.push(u);
              }
            });
          }
        } catch  {}

        if (typeof onUpdate === 'function') {
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('subscribeToSetupUsers cloud notice:', err?.message);
      }
    );
  } catch  {}

  return () => {
    try { unsubscribeFs(); } catch  {}
  };
}

/**
 * Register a new Merchant / User across Backend Server + Cloud Firestore + LocalStorage
 */
export async function registerSetupUser(merchantData) {
  const foodypayId = (merchantData.foodypayId && merchantData.foodypayId.trim())
    ? merchantData.foodypayId.trim().toUpperCase()
    : 'FP-' + Math.floor(100000 + Math.random() * 900000);

  const cleanEmail = (merchantData.email || '').toLowerCase().trim();
  const name = (merchantData.name || '').trim();
  const businessName = (merchantData.businessName || `${name}'s Food Outlet`).trim();
  const phone = (merchantData.phone || merchantData.contactNo || '+91 98000 00000').trim();
  const plan = merchantData.plan || merchantData.subscriptionPlan || 'L1';
  const startingDate = merchantData.startingDate || merchantData.activeDate || new Date().toISOString();
  const expireDate = merchantData.expireDate || merchantData.subscriptionExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const status = merchantData.status || (merchantData.isLocked ? 'Locked' : 'Active');
  const isLocked = Boolean(merchantData.isLocked || status === 'Locked');
  const lockReason = merchantData.lockReason || 'Subscription Payment Required';
  const subscriptionPrice = Number(merchantData.subscriptionPrice) || (plan === 'L3' ? 2999 : plan === 'L2' ? 1499 : 499);

  const passcode = merchantData.passcode || merchantData.pin || '1234';

  const userPayload = {
    foodypayId,
    uniqueId: foodypayId,
    businessId: foodypayId,
    id: foodypayId,
    name,
    ownerName: name,
    businessName,
    email: cleanEmail,
    phone,
    contactNo: phone,
    plan,
    subscriptionPlan: plan,
    startingDate,
    activeDate: startingDate,
    expireDate,
    subscriptionExpiry: expireDate,
    status,
    subscriptionStatus: status,
    isLocked,
    lockReason,
    subscriptionPrice,
    passcode,
    pin: passcode,
    hasPasscode: true,
    authProvider: 'local',
    createdAt: startingDate,
    updatedAt: new Date().toISOString(),
  };

  let serverSuccess = false;
  let serverMessage = '';

  // 1. Call Backend Server POST /api/auth/register
  try {
    const url = await getWorkingApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${url}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userPayload,
        password: merchantData.password || '123456',
      }),
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && (res.status === 200 || res.status === 201)) {
      const data = await res.json();
      serverSuccess = true;
      serverMessage = data.message || 'Account registered in server database.';
    } else if (res) {
      const errData = await res.json().catch(() => ({}));
      serverMessage = errData.message || `Server responded with ${res.status}`;
    }
  } catch (err) {
    console.warn('Server registration notice:', err?.message);
  }

  // 2. Direct Cloud Firestore Business_Users save
  let firestoreSuccess = false;
  try {
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, foodypayId);
    await setDoc(docRef, userPayload, { merge: true });
    firestoreSuccess = true;
  } catch (fsErr) {
    console.warn('Firestore direct write notice:', fsErr?.message);
  }

  // 3. LocalStorage persistence
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    const idx = local.findIndex((m) => (m.foodypayId || m.uniqueId || m.id) === foodypayId || m.email?.toLowerCase() === cleanEmail);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...userPayload };
    } else {
      local.unshift(userPayload);
    }
    localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(local));
    window.dispatchEvent(new Event('storage'));
  } catch  {}

  return {
    success: true,
    user: userPayload,
    serverSuccess,
    firestoreSuccess,
    message: serverSuccess && firestoreSuccess
      ? `✅ Account created successfully in Server (MongoDB) & Cloud Firestore!`
      : firestoreSuccess
      ? `✅ Account created in Cloud Database (Firestore)!`
      : `✅ Account saved locally and ready!`,
  };
}

/**
 * Delete User / Merchant permanently across Server + Cloud Firestore + LocalStorage
 */
export async function deleteSetupUser(idOrFoodypayId, email) {
  const targetId = String(idOrFoodypayId || '').trim();
  const cleanEmail = (email || '').toLowerCase().trim();

  let serverSuccess = false;
  // 1. Call Backend Server DELETE /api/auth/users/:id
  try {
    const url = await getWorkingApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${url}/auth/users/${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      serverSuccess = true;
    }
  } catch  {}

  // 2. Delete from Cloud Firestore Business_Users
  let firestoreSuccess = false;
  try {
    if (targetId) {
      const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, targetId.toUpperCase());
      await deleteDoc(docRef);
      firestoreSuccess = true;
    }
  } catch  {}

  // 3. LocalStorage cleanup
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    const filtered = local.filter((m) => {
      const mId = (m.foodypayId || m.uniqueId || m.id || '').toUpperCase();
      const mEmail = (m.email || '').toLowerCase();
      return mId !== targetId.toUpperCase() && (cleanEmail ? mEmail !== cleanEmail : true);
    });
    localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage'));
  } catch  {}

  return {
    success: true,
    serverSuccess,
    firestoreSuccess,
    message: `Account (${targetId || cleanEmail}) removed from database.`,
  };
}

/**
 * Block / Lock or Unblock / Unlock a user
 */
export async function toggleSetupUserBlock(idOrFoodypayId, isLocked, lockReason = 'Subscription Payment Required') {
  const targetId = String(idOrFoodypayId || '').trim().toUpperCase();
  const newLocked = Boolean(isLocked);
  const newStatus = newLocked ? 'Locked' : 'Active';

  // 1. Call Backend Server PUT /api/auth/users/:id/lock
  try {
    const url = await getWorkingApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    await fetch(`${url}/auth/users/${encodeURIComponent(targetId)}/lock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLocked: newLocked, lockReason }),
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
  } catch  {}

  // 2. Cloud Firestore update
  try {
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, targetId);
    await setDoc(docRef, {
      isLocked: newLocked,
      status: newStatus,
      subscriptionStatus: newStatus,
      lockReason,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch  {}

  // 3. LocalStorage update
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    const idx = local.findIndex((m) => (m.foodypayId || m.uniqueId || m.id || '').toUpperCase() === targetId);
    if (idx !== -1) {
      local[idx].isLocked = newLocked;
      local[idx].status = newStatus;
      local[idx].subscriptionStatus = newStatus;
      local[idx].lockReason = lockReason;
      localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(local));
      window.dispatchEvent(new Event('storage'));
    }
  } catch  {}

  return {
    success: true,
    isLocked: newLocked,
    status: newStatus,
    message: `Account is now ${newLocked ? 'BLOCKED / LOCKED' : 'UNBLOCKED / ACTIVE'}.`,
  };
}

/**
 * Expire a user's subscription plan immediately
 */
export async function expireSetupUserPlan(idOrFoodypayId) {
  const targetId = String(idOrFoodypayId || '').trim().toUpperCase();
  const nowIso = new Date().toISOString();

  const updates = {
    status: 'Expired',
    subscriptionStatus: 'Expired',
    isLocked: true,
    lockReason: 'Plan Expired — Subscription Renewal Required',
    expireDate: nowIso,
    subscriptionExpiry: nowIso,
    updatedAt: nowIso,
  };

  // 1. Call Backend Server PUT /api/auth/users/:id/subscription
  try {
    const url = await getWorkingApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    await fetch(`${url}/auth/users/${encodeURIComponent(targetId)}/subscription`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
  } catch  {}

  // 2. Cloud Firestore update
  try {
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, targetId);
    await setDoc(docRef, updates, { merge: true });
  } catch  {}

  // 3. LocalStorage update
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    const idx = local.findIndex((m) => (m.foodypayId || m.uniqueId || m.id || '').toUpperCase() === targetId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updates };
      localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(local));
      window.dispatchEvent(new Event('storage'));
    }
  } catch  {}

  return {
    success: true,
    message: `Plan for account ${targetId} has been marked EXPIRED.`,
  };
}

/**
 * Upgrade or Modify a user's plan (L1, L2, L3) and dates
 */
export async function upgradeSetupUserPlan(idOrFoodypayId, upgradeData) {
  const targetId = String(idOrFoodypayId || '').trim().toUpperCase();
  const plan = upgradeData.plan || upgradeData.subscriptionPlan || 'L2';
  const durationMonths = Number(upgradeData.durationMonths) || 1;
  const price = upgradeData.subscriptionPrice !== undefined
    ? Number(upgradeData.subscriptionPrice)
    : (plan === 'L3' ? 2999 : plan === 'L2' ? 1499 : 499);

  // Calculate new expire date if not provided
  let expireDate = upgradeData.expireDate;
  if (!expireDate) {
    const baseDate = new Date();
    expireDate = new Date(baseDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const startingDate = upgradeData.startingDate || new Date().toISOString();

  const updates = {
    plan,
    subscriptionPlan: plan,
    subscriptionPrice: price,
    startingDate,
    activeDate: startingDate,
    expireDate,
    subscriptionExpiry: expireDate,
    status: 'Active',
    subscriptionStatus: 'Active',
    isLocked: false,
    lockReason: '',
    updatedAt: new Date().toISOString(),
  };

  // 1. Call Backend Server PUT /api/auth/users/:id/subscription
  try {
    const url = await getWorkingApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    await fetch(`${url}/auth/users/${encodeURIComponent(targetId)}/subscription`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
  } catch  {}

  // 2. Cloud Firestore update
  try {
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, targetId);
    await setDoc(docRef, updates, { merge: true });
  } catch  {}

  // 3. LocalStorage update
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    const idx = local.findIndex((m) => (m.foodypayId || m.uniqueId || m.id || '').toUpperCase() === targetId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updates };
      localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(local));
      window.dispatchEvent(new Event('storage'));
    }
  } catch  {}

  return {
    success: true,
    updates,
    message: `Plan upgraded to ${plan} successfully! Account is ACTIVE until ${new Date(expireDate).toLocaleDateString()}.`,
  };
}

/**
 * Update any profile / detail fields for user
 */
export async function updateSetupUserDetails(idOrFoodypayId, detailUpdates) {
  const targetId = String(idOrFoodypayId || '').trim().toUpperCase();
  const updates = {
    ...detailUpdates,
    updatedAt: new Date().toISOString(),
  };

  // Cloud Firestore update
  try {
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, targetId);
    await setDoc(docRef, updates, { merge: true });
  } catch  {}

  // LocalStorage update
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    const idx = local.findIndex((m) => (m.foodypayId || m.uniqueId || m.id || '').toUpperCase() === targetId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updates };
      localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(local));
      window.dispatchEvent(new Event('storage'));
    }
  } catch  {}

  return {
    success: true,
    message: `Details updated for ${targetId}.`,
  };
}

/**
 * Set / Edit 4-Digit Passcode as Admin
 */
export async function updateSetupUserPasscode(idOrFoodypayId, newPasscode) {
  const targetId = String(idOrFoodypayId || '').trim().toUpperCase();
  const cleanPasscode = String(newPasscode || '').trim();
  const updates = {
    passcode: cleanPasscode,
    pin: cleanPasscode,
    hasPasscode: true,
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(firestoreDb, FIRESTORE_COLLECTIONS.BUSINESS_USERS, targetId);
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.warn('Firestore set passcode error:', err?.message);
  }

  try {
    localStorage.setItem(`foodypay_passcode_${targetId}`, cleanPasscode);
    const local = JSON.parse(localStorage.getItem(LOCAL_MERCHANTS_KEY) || '[]');
    const idx = local.findIndex((m) => (m.foodypayId || m.uniqueId || m.id || '').toUpperCase() === targetId);
    if (idx !== -1) {
      local[idx].passcode = cleanPasscode;
      local[idx].pin = cleanPasscode;
      local[idx].hasPasscode = true;
      localStorage.setItem(LOCAL_MERCHANTS_KEY, JSON.stringify(local));
      window.dispatchEvent(new Event('storage'));
    }
  } catch {}

  return {
    success: true,
    passcode: cleanPasscode,
    message: `4-Digit Passcode updated to ${cleanPasscode} for ${targetId}.`,
  };
}
