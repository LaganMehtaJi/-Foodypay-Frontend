/**
 * Table Service Requests Management (Call Waiter, Water, Extra Roti, Cutlery, Bill)
 * 
 * Supports:
 * - Customer-facing service request submission with 60s cooldown per request type
 * - Request types: 'waiter', 'water', 'roti', 'cutlery', 'bill', 'custom'
 * - Status workflow: 'pending' (orange) -> 'in_progress' (blue) -> 'completed' (green)
 * - Real-time synchronization via storage event and CustomEvent
 * - Notification history and staff sound alerts
 */

const SERVICE_REQUESTS_KEY = 'foodypay_service_requests_v1';
const REQUEST_COOLDOWNS_KEY = 'foodypay_service_cooldowns_v1';

export const SERVICE_REQUEST_TYPES = [
  { id: 'waiter', label: 'Call Waiter', icon: '🛎️', priority: 'high', description: 'Assistance at table' },
  { id: 'water', label: 'Request Water', icon: '💧', priority: 'medium', description: 'Fresh drinking water' },
  { id: 'roti', label: 'Extra Roti', icon: '🫓', priority: 'high', description: 'Hot breads/rotis' },
  { id: 'cutlery', label: 'Request Cutlery', icon: '🍴', priority: 'medium', description: 'Spoons, forks & tissues' },
  { id: 'bill', label: 'Request Bill', icon: '🧾', priority: 'urgent', description: 'Ready to settle bill' },
  { id: 'custom', label: 'Special Request', icon: '✍️', priority: 'medium', description: 'Custom note for staff' },
];

/**
 * Get all service requests
 */
export function getAllServiceRequests() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(SERVICE_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }
  } catch (e) {
    console.warn('Error reading service requests:', e);
  }
  return [];
}

/**
 * Save service requests to localStorage and dispatch event
 */
export function saveServiceRequests(requests) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(SERVICE_REQUESTS_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('foodypay_service_requests_updated', { detail: requests }));
    return true;
  } catch (e) {
    console.error('Failed to save service requests:', e);
    return false;
  }
}

/**
 * Check if a request type on a specific table is on cooldown
 */
export function checkRequestCooldown(tableId, requestType) {
  try {
    const raw = sessionStorage.getItem(REQUEST_COOLDOWNS_KEY);
    if (raw) {
      const cooldowns = JSON.parse(raw);
      const key = `${tableId}_${requestType}`;
      const expiresAt = cooldowns[key];
      if (expiresAt && Date.now() < expiresAt) {
        const remainingSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
        return { isCoolingDown: true, remainingSeconds };
      }
    }
  } catch  {}
  return { isCoolingDown: false, remainingSeconds: 0 };
}

/**
 * Set cooldown for a request
 */
function setRequestCooldown(tableId, requestType, seconds = 60) {
  try {
    const raw = sessionStorage.getItem(REQUEST_COOLDOWNS_KEY);
    const cooldowns = raw ? JSON.parse(raw) : {};
    const key = `${tableId}_${requestType}`;
    cooldowns[key] = Date.now() + seconds * 1000;
    sessionStorage.setItem(REQUEST_COOLDOWNS_KEY, JSON.stringify(cooldowns));
  } catch  {}
}

/**
 * Submit a service request from customer table
 */
export function createServiceRequest({ tableId, tableName, type, note = '', businessId = 'FP-9896' }) {
  const cleanTable = String(tableName || tableId || 'Table 1').trim();
  const typeObj = SERVICE_REQUEST_TYPES.find((t) => t.id === type) || SERVICE_REQUEST_TYPES[0];

  // Anti-spam cooldown check
  const { isCoolingDown, remainingSeconds } = checkRequestCooldown(cleanTable, type);
  if (isCoolingDown) {
    return {
      success: false,
      message: `Request already sent. Please wait ${remainingSeconds}s before requesting again.`,
      remainingSeconds,
    };
  }

  const newRequest = {
    id: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    businessId,
    tableId: String(tableId || cleanTable),
    tableName: cleanTable,
    type: typeObj.id,
    typeLabel: typeObj.label,
    icon: typeObj.icon,
    priority: typeObj.priority,
    note: String(note || '').trim(),
    status: 'pending', // 'pending' | 'in_progress' | 'completed'
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    acceptedAt: null,
    completedAt: null,
    acceptedBy: null,
  };

  const current = getAllServiceRequests();
  const updated = [newRequest, ...current];
  saveServiceRequests(updated);

  // Set 60-second cooldown
  setRequestCooldown(cleanTable, type, 60);

  // Trigger sound event for staff
  try {
    window.dispatchEvent(new CustomEvent('foodypay_waiter_call_alert', { detail: newRequest }));
  } catch  {}

  return { success: true, request: newRequest };
}

/**
 * Update request status (staff actions: accept / in_progress / completed)
 */
export function updateServiceRequestStatus(requestId, nextStatus, staffName = 'Staff') {
  const current = getAllServiceRequests();
  const now = new Date().toISOString();

  const updated = current.map((req) => {
    if (req.id === requestId) {
      return {
        ...req,
        status: nextStatus,
        updatedAt: now,
        acceptedAt: nextStatus === 'in_progress' ? (req.acceptedAt || now) : req.acceptedAt,
        completedAt: nextStatus === 'completed' ? now : req.completedAt,
        acceptedBy: staffName,
      };
    }
    return req;
  });

  saveServiceRequests(updated);
  return updated.find((r) => r.id === requestId);
}

/**
 * Clear completed requests older than 24 hours
 */
export function purgeOldServiceRequests() {
  const current = getAllServiceRequests();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = current.filter((req) => {
    if (req.status !== 'completed') return true;
    return new Date(req.createdAt).getTime() > cutoff;
  });
  saveServiceRequests(filtered);
}
