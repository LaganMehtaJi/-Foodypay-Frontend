// 100% OFFLINE API UTILITIES - ZERO EXTERNAL NETWORK REQUESTS

export const PRIMARY_API_URL = 'http://localhost/api';
export const EMERGENCY_API_URL = 'http://localhost/api';
export const BACKUP_CLOUD_API_URL_1 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_2 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_3 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_4 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL_5 = EMERGENCY_API_URL;
export const BACKUP_CLOUD_API_URL = EMERGENCY_API_URL;
export const REMOTE_CLOUD_API_URL = PRIMARY_API_URL;
export const API_BASE_URL = PRIMARY_API_URL;

export const ALL_CONFIGURED_APIS = [
  { id: 'offline', name: 'Offline Local POS Mode', url: 'offline://localhost', type: 'Offline', isPrimary: true }
];
export const TOTAL_AVAILABLE_APIS_COUNT = 1;

export const getApiBaseUrl = () => 'offline://localhost';
export const parseJsonResponse = async () => ({ success: true });

// Offline Helper Math
export const calculateHaversineDistanceKm = () => 0.5;
export const calculateBikeDeliveryTime = () => '15-20 mins';

// API Functions - All return instant offline data
export const loginApi = async (emailOrId) => ({
  success: true,
  data: {
    token: 'local_token_9896',
    foodypayId: 'FP-9896',
    businessId: 'FP-9896',
    businessName: 'Snack Rack',
    role: 'Restaurant Owner'
  }
});

export const registerApi = async (data) => ({ success: true, data });
export const googleAuthApi = async () => ({ success: true });
export const firebaseAuthApi = async () => ({ success: true });
export const checkEmailExistsApi = async () => ({ exists: false });

export const fetchOrdersApi = async () => {
  try {
    const saved = localStorage.getItem('snackrack_local_sales');
    return saved ? JSON.parse(saved) : [];
  } catch  {
    return [];
  }
};

export const fetchOrderStatsApi = async () => ({
  totalSales: 0,
  todaySales: 0,
  ordersCount: 0
});

export const markOrderSeenApi = async () => ({ success: true });
export const sendToKitchenApi = async () => ({ success: true });
export const createOrderApi = async (data) => ({ success: true, data });
export const updateOrderApi = async () => ({ success: true });
export const updateOrderStatusApi = async () => ({ success: true });

export const fetchDishesApi = async () => [];
export const fetchPublicDishesApi = async () => [];
export const fetchAvailableProductsApi = async () => ({ available: true, dishes: [] });
export const createDishApi = async (dish) => ({ success: true, data: dish });
export const updateDishApi = async () => ({ success: true });
export const toggleDishStockApi = async () => ({ success: true });
export const deleteDishApi = async () => ({ success: true });

export const fetchCustomersApi = async () => [];
export const fetchCouponsApi = async () => [];
export const fetchPublicCouponsApi = async () => [];
export const createCouponApi = async () => ({ success: true });

export const fetchTablesApi = async () => [];
export const createTableApi = async (table) => ({ success: true, data: table });
export const updateTableApi = async () => ({ success: true });
export const deleteTableApi = async () => ({ success: true });

export const fetchSettingsApi = async () => ({
  storeName: 'Snack Rack',
  phone: '7983475688',
  address: 'Thakurpur Road, Premnagar, Dehradun'
});
export const updateSettingsApi = async () => ({ success: true });

export const fetchReviewsApi = async () => [];
export const createReviewApi = async () => ({ success: true });
export const replyReviewApi = async () => ({ success: true });
export const deleteReviewApi = async () => ({ success: true });

export const sendNotificationApi = async () => ({ success: true });
export const createRazorpayOrderApi = async () => ({ success: true, id: 'rzp_mock' });
export const verifyRazorpaySignatureApi = async () => ({ success: true });

export const fetchDeliveryZonesApi = async () => [];
export const createDeliveryZoneApi = async () => ({ success: true });
export const updateDeliveryZoneApi = async () => ({ success: true });
export const deleteDeliveryZoneApi = async () => ({ success: true });

export const fetchStoresApi = async () => [];
export const createStoreApi = async () => ({ success: true });
export const updateStoreApi = async () => ({ success: true });
export const deleteStoreApi = async () => ({ success: true });
export const assignStoreOwnerEmailApi = async () => ({ success: true });
export const assignZonesToStoreApi = async () => ({ success: true });
export const assignStoreZonesApi = async () => ({ success: true });

export const fetchRegisteredUsersApi = async () => {
  try {
    const { fetchSetupUsers } = await import('./setupApiService');
    const users = await fetchSetupUsers();
    return { success: true, data: users };
  } catch  {
    return { success: false, data: [] };
  }
};
export const deleteUserApi = async (id) => {
  try {
    const { deleteSetupUser } = await import('./setupApiService');
    return await deleteSetupUser(id);
  } catch  {
    return { success: true };
  }
};
export const deleteUserByEmailApi = async (email) => {
  try {
    const { deleteSetupUser } = await import('./setupApiService');
    return await deleteSetupUser(null, email);
  } catch  {
    return { success: true };
  }
};
export const toggleUserLockApi = async (id, isLocked, reason) => {
  try {
    const { toggleSetupUserBlock } = await import('./setupApiService');
    return await toggleSetupUserBlock(id, isLocked, reason);
  } catch  {
    return { success: true };
  }
};
export const updateUserSubscriptionApi = async (id, subData) => {
  try {
    const { upgradeSetupUserPlan } = await import('./setupApiService');
    return await upgradeSetupUserPlan(id, subData);
  } catch  {
    return { success: true };
  }
};
export const fetchPublicOrdersApi = async () => [];
export const fetchPublicMerchantApi = async () => ({ businessName: 'Snack Rack', id: 'FP-9896' });
export const createPublicOrderApi = async (order) => ({ success: true, order });
export const checkDeliveryAvailabilityApi = async () => ({ available: true, matchingZones: [] });
export const markKitchenSeenApi = async () => ({ success: true });
