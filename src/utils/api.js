export const REMOTE_CLOUD_API_URL = 'https://server-foodypay.onrender.com/api';

/**
 * Dynamic API Base URL resolution for Local, LAN (Mobile on Wi-Fi), and Production (foodypay.in)
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // Localhost or LAN IP (e.g. 192.168.x.x, 10.x.x.x)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `${protocol}//${hostname}:3000/api`;
    }
    // Live domain (foodypay.in) -> Live Render Cloud Backend
    return REMOTE_CLOUD_API_URL;
  }
  return REMOTE_CLOUD_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

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
 * High-speed safe fetch helper with multi-port auto-discovery and Cloud Render fallback
 */
export async function safeFetch(path, options = {}) {
  const cleanPath = path.startsWith('/api') ? path.replace('/api', '') : (path.startsWith('/') ? path : `/${path}`);
  const primaryUrl = `${API_BASE_URL}${cleanPath}`;
  const ports = [3000, 5001, 3001];

  // 1. Try Primary URL
  try {
    const res = await fetch(primaryUrl, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok || contentType.includes('application/json')) {
      const clone = res.clone();
      const text = await clone.text();
      if (text && !text.trim().startsWith('<')) {
        return res;
      }
    }
  } catch (err) {}

  // 2. Try Local Fallback Ports (3000, 5001, 3001) if on local machine / LAN
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isLocal) {
      for (const port of ports) {
        try {
          const testUrl = `http://${hostname}:${port}/api${cleanPath}`;
          const res = await fetch(testUrl, options);
          const clone = res.clone();
          const text = await clone.text();
          if (res.ok && text && !text.trim().startsWith('<')) {
            return res;
          }
        } catch (e) {}
      }
    } else {
      // Production Fallback: Try live Render backend directly
      try {
        const cloudUrl = `${REMOTE_CLOUD_API_URL}${cleanPath}`;
        const res = await fetch(cloudUrl, options);
        const clone = res.clone();
        const text = await clone.text();
        if (res.ok && text && !text.trim().startsWith('<')) {
          return res;
        }
      } catch (cloudErr) {}
    }
  }

  // 3. Fallback to direct fetch
  return fetch(primaryUrl, options);
}

/**
 * Register user with form data (including logo file upload)
 */
export async function registerApi(formData) {
  const response = await safeFetch('/auth/register', {
    method: 'POST',
    body: formData,
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
  const response = await fetch(`${API_BASE_URL}/auth/users`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch registered users');
  }
  return data;
}

/**
 * Admin: Delete registered user by ID from database
 */
export async function deleteUserApi(userId) {
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete user account');
  }
  return data;
}

/**
 * Admin: Delete registered user by Email from database
 */
export async function deleteUserByEmailApi(email) {
  const response = await fetch(`${API_BASE_URL}/auth/users/email/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete user account');
  }
  return data;
}

/**
 * Admin: Toggle user account lock (requiring subscription)
 */
export async function toggleUserLockApi(userId, isLocked, lockReason) {
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/lock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isLocked, lockReason }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user lock status');
  }
  return data;
}

/**
 * Admin: Update per-account subscription pricing & plan
 */
export async function updateUserSubscriptionApi(userId, subscriptionData) {
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/subscription`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscriptionData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user subscription pricing');
  }
  return data;
}


/**
 * Fetch protected Dashboard summary data using JWT token
 */
export async function getDashboardApi(token) {
  const response = await fetch(`${API_BASE_URL}/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch dashboard data');
  }
  return data;
}

/* ==========================================================================
   CRUD API HELPERS FOR ORDERS, DISHES, CUSTOMERS, COUPONS, TABLES & SETTINGS
   ========================================================================== */

export async function fetchOrdersApi(token) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch orders');
  return data.data;
}

export async function createOrderApi(token, orderData) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create order');
  return data.data;
}

export async function createPublicOrderApi(orderData) {
  const response = await fetch(`${API_BASE_URL}/orders/public`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to submit public order');
  return data.data;
}

export async function createRazorpayOrderApi(payload) {
  const response = await fetch(`${API_BASE_URL}/payments/create-razorpay-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create Razorpay order');
  return data;
}

export async function verifyRazorpaySignatureApi(payload) {
  const response = await fetch(`${API_BASE_URL}/payments/verify-signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to verify Razorpay signature');
  return data;
}


export async function updateOrderStatusApi(token, orderId, status) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update order status');
  return data.data;
}

export async function markOrderSeenApi(token, orderId) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/seen`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to mark order seen');
  return data.data;
}

export async function fetchOrderStatsApi(token) {
  const response = await fetch(`${API_BASE_URL}/orders/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch order stats');
  return data.data;
}

export async function fetchDishesApi(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/dishes${token ? '' : '/public'}`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch catalog dishes');
  return data.data;
}

export async function fetchPublicDishesApi(merchantId, foodypayId) {
  const queryParams = new URLSearchParams();
  if (merchantId) queryParams.append('merchantId', merchantId);
  if (foodypayId) queryParams.append('foodypayId', foodypayId);
  const response = await fetch(`${API_BASE_URL}/dishes/public?${queryParams.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch catalog dishes');
  return data.data;
}

export async function fetchPublicOrdersApi(merchantId, foodypayId) {
  const queryParams = new URLSearchParams();
  if (merchantId) queryParams.append('merchantId', merchantId);
  if (foodypayId) queryParams.append('foodypayId', foodypayId);
  const response = await fetch(`${API_BASE_URL}/orders/public?${queryParams.toString()}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch public orders');
  return data.data;
}

export async function fetchPublicMerchantApi(identifier) {
  const response = await fetch(`${API_BASE_URL}/auth/merchant/${encodeURIComponent(identifier)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch merchant details');
  return data.data;
}


export async function createDishApi(token, dishData) {
  const isFormData = dishData instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${API_BASE_URL}/dishes`, {
    method: 'POST',
    headers,
    body: isFormData ? dishData : JSON.stringify(dishData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create dish');
  return data.data;
}

export async function fetchReviewsApi() {
  const response = await fetch(`${API_BASE_URL}/reviews`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch reviews');
  return data.data || [];
}

export async function createReviewApi(reviewData) {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to post review');
  return data.data;
}

export async function replyReviewApi(reviewId, replyText) {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/reply`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply: replyText }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send reply');
  return data.data;
}

export async function toggleDishStockApi(token, dishId) {
  const response = await fetch(`${API_BASE_URL}/dishes/${dishId}/stock`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to toggle stock');
  return data.data;
}

export async function updateOrderApi(token, orderId, orderData) {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update order');
  return data.data;
}

export async function updateDishApi(token, dishId, dishData) {
  const isFormData = dishData instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/dishes/${dishId}`, {
    method: 'PUT',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
    },
    body: isFormData ? dishData : JSON.stringify(dishData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update dish');
  return data.data;
}

export async function deleteDishApi(token, dishId) {
  const response = await fetch(`${API_BASE_URL}/dishes/${dishId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete dish');
  return data.data;
}

export async function fetchCustomersApi(token) {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch CRM customers');
  return data.data;
}

export async function fetchCouponsApi(token) {
  const response = await fetch(`${API_BASE_URL}/coupons`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
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

    const response = await fetch(`${API_BASE_URL}/coupons/public?${queryParams.toString()}`, { headers });
    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        return [];
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to fetch public coupons');
    }
    const data = await response.json();
    return data.data || [];
  } catch (err) {
    console.warn('Public coupons fetch fallback:', err.message);
    return [];
  }
}

export async function createCouponApi(token, couponData) {
  const response = await fetch(`${API_BASE_URL}/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(couponData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create coupon');
  return data.data;
}

export async function sendNotificationApi(token, notificationData) {
  const response = await fetch(`${API_BASE_URL}/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(notificationData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send notification');
  return data.data;
}

export async function fetchNotificationsApi(token) {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return data.data;
}

export async function fetchTablesApi(token) {
  const response = await fetch(`${API_BASE_URL}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch dining tables');
  return data.data;
}

export async function createTableApi(token, tableData) {
  const response = await fetch(`${API_BASE_URL}/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tableData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create dining table');
  return data.data;
}

export async function updateTableApi(token, tableId, tableData) {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(tableData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update dining table');
  return data.data;
}

export async function deleteTableApi(token, tableId) {
  const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to delete table');
  return data;
}

export async function fetchSettingsApi(token) {
  const response = await fetch(`${API_BASE_URL}/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch settings');
  return data.data;
}

export async function updateSettingsApi(token, settingsData) {
  const isFormData = settingsData instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers,
    body: isFormData ? settingsData : JSON.stringify(settingsData),
  });
  const data = await response.json();
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

export async function assignZonesToStoreApi(storeId, zoneIds) {
  const res = await safeFetch(`/stores/${storeId}/zones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zoneIds }),
  });
  return await parseJsonResponse(res);
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

