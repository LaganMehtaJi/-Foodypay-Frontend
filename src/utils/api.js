export const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Register user with form data (including logo file upload)
 */
export async function registerApi(formData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

/**
 * Login user with email & password
 */
export async function loginApi(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

/**
 * Google Auth API
 */
export async function googleAuthApi(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Google Auth failed');
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

export async function fetchDishesApi(token) {
  const response = await fetch(`${API_BASE_URL}/dishes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch catalog dishes');
  return data.data;
}

export async function createDishApi(token, formData) {
  const response = await fetch(`${API_BASE_URL}/dishes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create dish');
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
  const response = await fetch(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settingsData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update settings');
  return data.data;
}
