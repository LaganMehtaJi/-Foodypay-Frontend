export const PRIMARY_API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.foodypay.online/api';
export const EMERGENCY_API_URL = import.meta.env.VITE_EMERGENCY_API_URL || 'https://api.stage.foodypay.online/api';
export const BACKUP_CLOUD_API_URL_1 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_2 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_3 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_4 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_5 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL = EMERGENCY_API_URL;
export const REMOTE_CLOUD_API_URL = PRIMARY_API_URL;

import {
  saveOrderToFirestore,
  updateOrderInFirestore,
  deleteOrderFromFirestore,
  moveKotTableInFirestore,
  saveCustomerDueToFirestore,
  settleCustomerDueInFirestore,
} from './firestoreService';


/**
 * All Configured Server API Endpoints (Primary Production + Emergency Stage)
 */
export const ALL_CONFIGURED_APIS = [
  { id: 'primary', name: 'Primary FoodyPay Production Server', url: PRIMARY_API_URL, type: 'Primary', isPrimary: true },
  { id: 'emergency', name: 'Emergency FoodyPay Stage Server', url: EMERGENCY_API_URL, type: 'Emergency Fallback', isPrimary: false },
];

export const TOTAL_AVAILABLE_APIS_COUNT = ALL_CONFIGURED_APIS.length;

// Internal Failover State Management
let currentActiveApiUrl = PRIMARY_API_URL;
let isEmergencyMode = false;
let lastFailoverTimestamp = 0;
const FAILOVER_COOLDOWN_MS = 60000; // 60 seconds cooldown before retrying primary

/**
 * Dynamic API Base URL Resolution with Failover Recovery
 */
export const getApiBaseUrl = () => {
  if (isEmergencyMode && Date.now() - lastFailoverTimestamp > FAILOVER_COOLDOWN_MS) {
    isEmergencyMode = false;
    currentActiveApiUrl = PRIMARY_API_URL;
  }
  return currentActiveApiUrl;
};

export let API_BASE_URL = getApiBaseUrl();

/**
 * Universal HTML-Safe JSON Parser helper (prevents Unexpected token '<' crashes)
 */
export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text || text.trim().startsWith('<') || text.trim().startsWith('<!DOCTYPE')) {
    throw new Error('Backend server returned an HTML error response. Please verify Node backend is running.');
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON response from backend server.');
  }
}

/**
 * Unified Safe Fetch Helper with Automatic Emergency Failover
 * Attempts primary API (https://api.foodypay.online/api).
 * In case of network errors (server offline, DNS, timeout) or 5xx server errors,
 * seamlessly and transparently fails over to emergency stage API (https://api.stage.foodypay.online/api).
 */
export async function safeFetch(path, options = {}) {
  const cleanPath = path.startsWith('/api') ? path.replace('/api', '') : (path.startsWith('/') ? path : `/${path}`);
  const activeBase = getApiBaseUrl();
  const fallbackBase = activeBase === PRIMARY_API_URL ? EMERGENCY_API_URL : PRIMARY_API_URL;

  const buildUrl = (base) => `${base.replace(/\/+$/, '')}${cleanPath}`;

  try {
    const response = await fetch(buildUrl(activeBase), options);
    // If response is a 5xx server error, failover to emergency
    if (response.status >= 500 && fallbackBase && fallbackBase !== activeBase) {
      console.warn(`[FoodyPay Emergency Failover] Server error ${response.status} on ${activeBase}. Retrying via emergency fallback: ${fallbackBase}`);
      try {
        const fallbackRes = await fetch(buildUrl(fallbackBase), options);
        if (fallbackRes.ok || fallbackRes.status < 500) {
          isEmergencyMode = true;
          currentActiveApiUrl = fallbackBase;
          API_BASE_URL = fallbackBase;
          lastFailoverTimestamp = Date.now();
          return fallbackRes;
        }
      } catch (fallbackErr) {
        console.error('[FoodyPay Emergency Failover] Fallback server also returned error:', fallbackErr);
      }
    } else if (response.ok && isEmergencyMode && activeBase === PRIMARY_API_URL) {
      isEmergencyMode = false;
      currentActiveApiUrl = PRIMARY_API_URL;
      API_BASE_URL = PRIMARY_API_URL;
    }
    return response;
  } catch (netErr) {
    // Network Error (server down, DNS failure, connection refused, CORS failure from 502)
    if (fallbackBase && fallbackBase !== activeBase) {
      console.warn(`[FoodyPay Emergency Failover] Network failure on ${activeBase} (${netErr.message}). Switching to emergency fallback: ${fallbackBase}`);
      try {
        const fallbackRes = await fetch(buildUrl(fallbackBase), options);
        isEmergencyMode = true;
        currentActiveApiUrl = fallbackBase;
        API_BASE_URL = fallbackBase;
        lastFailoverTimestamp = Date.now();
        return fallbackRes;
      } catch (fallbackErr) {
        console.error('[FoodyPay Emergency Failover] Both Primary and Emergency APIs failed:', fallbackErr);
        throw netErr;
      }
    }
    throw netErr;
  }
}

/**
 * Register user with form data (including logo file upload)
 */
export async function registerApi(userData) {
  const isFormData = typeof FormData !== 'undefined' && userData instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  const body = isFormData ? userData : JSON.stringify(userData);

  const response = await safeFetch('/auth/register', {
    method: 'POST',
    headers,
    body,
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

/**
 * Login user with email & password
 */
export async function loginApi(email, password) {
  const response = await safeFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

/**
 * Google Auth API
 */
export async function googleAuthApi(payload) {
  const response = await safeFetch('/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Google Auth failed');
  }
  return data;
}

/**
 * Firebase Auth Sync API (Syncs Firebase UID & ID Tokens with MongoDB Backend)
 */
export async function firebaseAuthApi(payload) {
  const response = await safeFetch('/auth/firebase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Firebase Auth sync failed');
  }
  return data;
}

/**
 * Check if registered email exists in system database
 */
export async function checkEmailExistsApi(email) {
  const response = await safeFetch('/auth/check-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: (email || '').trim() }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'No account found with this email address.');
  }
  return data;
}

/**
 * Admin: Fetch all registered users from database
 */
export async function fetchRegisteredUsersApi() {
  const response = await safeFetch('/auth/users');
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch registered users');
  }
  return data;
}

/**
 * Admin: Delete registered user by ID from database
 */
export async function deleteUserApi(userId) {
  const response = await safeFetch(`/auth/users/${userId}`, {
    method: 'DELETE',
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete user account');
  }
  return data;
}

/**
 * Admin: Delete registered user by Email from database
 */
export async function deleteUserByEmailApi(email) {
  const response = await safeFetch(`/auth/users/email/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete user account');
  }
  return data;
}

/**
 * Admin: Toggle user account lock (requiring subscription)
 */
export async function toggleUserLockApi(userId, isLocked, lockReason) {
  const response = await safeFetch(`/auth/users/${userId}/lock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isLocked, lockReason }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user lock status');
  }
  return data;
}

/**
 * Admin: Update per-account subscription pricing & plan
 */
export async function updateUserSubscriptionApi(userId, subscriptionData) {
  const response = await safeFetch(`/auth/users/${userId}/subscription`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscriptionData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user subscription pricing');
  }
  return data;
}


/**
 * Fetch protected Dashboard summary data using JWT token
 */
export async function getDashboardApi(token) {
  const response = await safeFetch('/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard data');
  }
  return data;
}

/* ==========================================================================
   CRUD API HELPERS FOR ORDERS, DISHES, CUSTOMERS, COUPONS, TABLES & SETTINGS
   ========================================================================== */

export async function fetchOrdersApi(token) {
  const response = await safeFetch('/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
  return data.data;
}

export async function createOrderApi(token, orderData) {
  saveOrderToFirestore(orderData).catch(() => {});
  const response = await safeFetch('/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to create order');
  if (data.data) {
    saveOrderToFirestore(data.data).catch(() => {});
  }
  return data.data;
}

export async function createPublicOrderApi(orderData) {
  saveOrderToFirestore(orderData).catch(() => {});
  const response = await safeFetch('/orders/public', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to submit public order');
  if (data.data) {
    saveOrderToFirestore(data.data).catch(() => {});
  }
  return data.data;
}

export async function createRazorpayOrderApi(payload) {
  const response = await safeFetch('/payments/create-razorpay-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to create Razorpay order');
  return data;
}

export async function verifyRazorpaySignatureApi(payload) {
  const response = await safeFetch('/payments/verify-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to verify Razorpay signature');
  return data;
}


export async function updateOrderStatusApi(token, orderId, status) {
  updateOrderInFirestore(orderId, { status, kitchenSeen: true }).catch(() => {});
  const path = token ? `/orders/${orderId}/status` : `/orders/public/${orderId}/status`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await safeFetch(path, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status, kitchenSeen: true }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to update order status');
  return data.data;
}

export async function sendToKitchenApi(token, orderId) {
  updateOrderInFirestore(orderId, { sentToKitchen: true, kitchenSeen: false }).catch(() => {});
  const response = await safeFetch(`/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sentToKitchen: true, kitchenSeen: false }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to send order to kitchen');
  return data.data;
}

export async function markOrderSeenApi(token, orderId) {
  updateOrderInFirestore(orderId, { seen: true }).catch(() => {});
  const response = await safeFetch(`/orders/${orderId}/seen`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to mark order seen');
  return data.data;
}

export async function markKitchenSeenApi(token, orderId) {
  updateOrderInFirestore(orderId, { kitchenSeen: true }).catch(() => {});
  const path = token ? `/orders/${orderId}/kitchen-seen` : `/orders/public/${orderId}/kitchen-seen`;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await safeFetch(path, {
    method: 'PUT',
    headers,
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to mark kitchen order seen');
  return data.data;
}

export async function fetchOrderStatsApi(token) {
  const response = await safeFetch('/orders/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch order stats');
  return data.data;
}

export async function fetchDishesApi(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await safeFetch(`/dishes${token ? '' : '/public'}`, { headers });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch catalog dishes');
  return data.data;
}

export async function fetchPublicDishesApi(merchantId, foodypayId) {
  const queryParams = new URLSearchParams();
  if (merchantId) queryParams.append('merchantId', merchantId);
  if (foodypayId) queryParams.append('foodypayId', foodypayId);
  const response = await safeFetch(`/dishes/public?${queryParams.toString()}`);
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch catalog dishes');
  return data.data;
}

export async function fetchPublicOrdersApi(merchantId, foodypayId) {
  const queryParams = new URLSearchParams();
  if (merchantId) queryParams.append('merchantId', merchantId);
  if (foodypayId) queryParams.append('foodypayId', foodypayId);
  const response = await safeFetch(`/orders/public?${queryParams.toString()}`);
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch public orders');
  return data.data;
}

export async function fetchPublicMerchantApi(identifier) {
  if (!identifier || identifier === 'undefined') return null;
  try {
    const response = await safeFetch(`/auth/merchant/${encodeURIComponent(identifier)}`);
    if (!response.ok) return null;
    const data = await parseJsonResponse(response);
    return data.data || null;
  } catch (err) {
    return null;
  }
}


export async function createDishApi(token, dishData) {
  const isFormData = dishData instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await safeFetch('/dishes', {
    method: 'POST',
    headers,
    body: isFormData ? dishData : JSON.stringify(dishData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to create dish');
  return data.data;
}

export async function fetchReviewsApi(token, params = {}) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let queryStr = '';
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    if (params.merchantId) searchParams.append('merchantId', params.merchantId);
    if (params.foodypayId) searchParams.append('foodypayId', params.foodypayId);
    if (params.userId) searchParams.append('userId', params.userId);
    queryStr = `?${searchParams.toString()}`;
  }
  const response = await safeFetch(`/reviews${queryStr}`, { headers });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch reviews');
  return data.data || [];
}

export async function createReviewApi(reviewData, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await safeFetch('/reviews', {
    method: 'POST',
    headers,
    body: JSON.stringify(reviewData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to post review');
  return data.data;
}

export async function replyReviewApi(reviewId, replyText, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await safeFetch(`/reviews/${reviewId}/reply`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ reply: replyText }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to send reply');
  return data.data;
}

export async function deleteReviewApi(reviewId, token) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await safeFetch(`/reviews/${reviewId}`, {
    method: 'DELETE',
    headers,
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to delete review');
  return data;
}

export async function toggleDishStockApi(token, dishId) {
  const response = await safeFetch(`/dishes/${dishId}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to toggle stock');
  return data.data;
}

export async function updateOrderApi(token, orderId, orderData) {
  const response = await safeFetch(`/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to update order');
  return data.data;
}

export async function updateDishApi(token, dishId, dishData) {
  const isFormData = dishData instanceof FormData;
  const response = await safeFetch(`/dishes/${dishId}`, {
    method: 'PUT',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
    },
    body: isFormData ? dishData : JSON.stringify(dishData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to update dish');
  return data.data;
}

export async function deleteDishApi(token, dishId) {
  const response = await safeFetch(`/dishes/${dishId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to delete dish');
  return data.data;
}

export async function fetchCustomersApi(token) {
  const response = await safeFetch('/customers', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch CRM customers');
  return data.data;
}

export async function fetchCouponsApi(token) {
  const response = await safeFetch('/coupons', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch coupons');
  return data.data;
}

export async function fetchPublicCouponsApi(phone, email, merchantId) {
  try {
    const queryParams = new URLSearchParams();
    if (phone) queryParams.append('phone', phone);
    if (email) queryParams.append('email', email);
    if (merchantId) queryParams.append('merchantId', merchantId);

    const token = localStorage.getItem('foodypay_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await safeFetch(`/coupons/public?${queryParams.toString()}`, { headers });
    if (!response.ok) {
      return [];
    }
    const data = await parseJsonResponse(response);
    return data.data || [];
  } catch (err) {
    return [];
  }
}

export async function createCouponApi(token, couponData) {
  const response = await safeFetch('/coupons', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(couponData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to create coupon');
  return data.data;
}

export async function sendNotificationApi(token, notificationData) {
  const response = await safeFetch('/notifications/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(notificationData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to send notification');
  return data.data;
}

export async function fetchNotificationsApi(token) {
  const response = await safeFetch('/notifications', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return data.data;
}

export async function fetchTablesApi(token) {
  const response = await safeFetch('/tables', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch dining tables');
  return data.data;
}

export async function createTableApi(token, tableData) {
  const response = await safeFetch('/tables', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tableData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to create dining table');
  return data.data;
}

export async function updateTableApi(token, tableId, tableData) {
  const response = await safeFetch(`/tables/${tableId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tableData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to update dining table');
  return data.data;
}

export async function deleteTableApi(token, tableId) {
  const response = await safeFetch(`/tables/${tableId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to delete table');
  return data;
}

export async function fetchSettingsApi(token) {
  const response = await safeFetch('/settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to fetch settings');
  return data.data;
}

export async function updateSettingsApi(token, settingsData) {
  const isFormData = settingsData instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await safeFetch('/settings', {
    method: 'PUT',
    headers,
    body: isFormData ? settingsData : JSON.stringify(settingsData),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data.message || 'Failed to update settings');
  return data.data;
}

// ============================================================================
// DYNAMIC DELIVERY ZONES & STORE MANAGEMENT APIS
// ============================================================================

export async function fetchDeliveryZonesApi() {
  const res = await safeFetch('/delivery/zones');
  const data = await parseJsonResponse(res);
  return data.data || [];
}

export async function createDeliveryZoneApi(zoneData) {
  const res = await safeFetch('/delivery/zones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zoneData),
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

export async function updateDeliveryZoneApi(id, zoneData) {
  const res = await safeFetch(`/delivery/zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zoneData),
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

export async function deleteDeliveryZoneApi(id) {
  const res = await safeFetch(`/delivery/zones/${id}`, {
    method: 'DELETE',
  });
  return await parseJsonResponse(res);
}

export async function fetchStoresApi() {
  const res = await safeFetch('/stores');
  const data = await parseJsonResponse(res);
  return data.data || [];
}

export async function createStoreApi(storeData) {
  const res = await safeFetch('/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData),
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

export async function updateStoreApi(id, storeData) {
  const res = await safeFetch(`/stores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(storeData),
  });
  const data = await parseJsonResponse(res);
  return data.data;
}

export async function deleteStoreApi(id) {
  const res = await safeFetch(`/stores/${id}`, {
    method: 'DELETE',
  });
  return await parseJsonResponse(res);
}

export async function assignStoreOwnerEmailApi(storeId, ownerEmail) {
  const res = await safeFetch('/stores/assign-owner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, ownerEmail }),
  });
  const data = await parseJsonResponse(res);
  return data;
}

export async function assignStoreZonesApi(storeId, zoneIds) {
  const res = await safeFetch(`/stores/${storeId}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zoneIds }),
  });
  return await parseJsonResponse(res);
}

export async function assignZonesToStoreApi(storeId, zoneIds) {
  return assignStoreZonesApi(storeId, zoneIds);
}

export async function checkDeliveryAvailabilityApi(lat, lng) {
  const res = await safeFetch(`/customer/delivery-availability?lat=${lat}&lng=${lng}`);
  return await parseJsonResponse(res);
}

export async function fetchAvailableProductsApi(lat, lng, category = 'All') {
  let url = `/customer/available-products`;
  if (lat && lng) {
    url += `?lat=${lat}&lng=${lng}&category=${encodeURIComponent(category)}`;
  } else if (category && category !== 'All') {
    url += `?category=${encodeURIComponent(category)}`;
  }
  const res = await safeFetch(url);
  return await parseJsonResponse(res);
}

/**
 * Haversine formula to calculate straight line distance in KM between 2 lat/lng points
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5; // fallback 2.5 km
  const R = 6371; // Earth radius in KM
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return Math.max(0.3, Math.round(km * 10) / 10);
}

/**
 * Calculates real bike/motorcycle delivery time in minutes based on Distance & City Traffic + Food Prep Buffer
 */
export function calculateBikeDeliveryTime(lat1, lon1, lat2, lon2) {
  const distanceKm = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
  // Bike riding time in minutes (25 km/h avg city speed => 2.4 mins per KM) + 8 mins kitchen prep buffer
  const ridingTimeMins = Math.ceil(distanceKm * 2.4);
  const totalMins = Math.max(8, ridingTimeMins + 8);
  return {
    distanceKm,
    formattedDistance: `${distanceKm} KM`,
    transitMins: ridingTimeMins,
    prepMins: 8,
    totalMins,
    formattedTime: `${totalMins} mins`,
    label: `${totalMins} minutes`
  };
}

/**
 * Customer Due (Khata / Udhaar) APIs
 */
export async function fetchCustomerDuesApi(token, phone = '') {
  try {
    const res = await safeFetch(`/customer-dues${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return await parseJsonResponse(res);
  } catch (err) {
    console.warn('Backend due sync notice:', err.message);
    return null;
  }
}

export async function updateCustomerDueStatusApi(token, payload) {
  if (payload && (payload.dueId || payload.id)) {
    settleCustomerDueInFirestore(payload.dueId || payload.id, payload).catch(() => {});
  }
  try {
    const res = await safeFetch(`/customer-dues/settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return await parseJsonResponse(res);
  } catch (err) {
    console.warn('Backend due settle notice:', err.message);
    return null;
  }
}

export async function moveKotTableApi(token, orderId, targetTable) {
  moveKotTableInFirestore(orderId, targetTable).catch(() => {});
  try {
    const res = await safeFetch(`/orders/${orderId}/move-table`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetTable }),
    });
    return await parseJsonResponse(res);
  } catch (err) {
    console.warn('Backend move table notice:', err.message);
    return null;
  }
}


