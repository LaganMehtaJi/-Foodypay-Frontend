/**
 * Table Order Dual-Timer Engine for FoodyPay POS & Customer View
 * 
 * Manages two independent timers:
 * - Timer A: Food Preparation Time
 *   Starts: When order is placed (order.createdAt / waitingStartedAt)
 *   Runs: While food is preparing ('waiting', 'in-kitchen', 'cooking')
 *   Stops: When food is marked 'ready' / 'served' / 'eating' (foodReadyAt / foodServedAt)
 * 
 * - Timer B: Dining & Payment Time
 *   Starts: When dine-in session begins / order is placed
 *   Runs: Throughout dining ('waiting', 'eating', 'bill-ready', unpaid)
 *   Stops: When bill is fully paid (paidAt / settledAt)
 * 
 * Persists all timestamps to localStorage / Firestore so refreshing never resets them.
 */

/**
 * Format milliseconds into clean human-readable duration
 * e.g., "12m 34s", "45s", "1h 15m"
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0m 00s';
  const totalSecs = Math.floor(ms / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Format duration in minutes for compact badge
 * e.g., "12 min", "< 1 min", "1 hr 15 min"
 */
export function formatMinutesBadge(ms) {
  if (!ms || ms < 0) return '0 min';
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes === 0) return '< 1 min';
  if (totalMinutes >= 60) {
    const hrs = Math.floor(totalMinutes / 60);
    const rem = totalMinutes % 60;
    return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
  }
  return `${totalMinutes} min`;
}

/**
 * Compute both Timer A & Timer B for any order object
 * 
 * @param {Object} order
 * @param {number} currentTimeMs - Optional, defaults to Date.now()
 * @returns {Object} Timers details
 */
export function getOrderTimers(order, currentTimeMs = Date.now()) {
  if (!order) {
    return {
      prep: { isRunning: false, elapsedMs: 0, formatted: '0m 00s', badge: '0 min', isCompleted: false },
      dining: { isRunning: false, elapsedMs: 0, formatted: '0m 00s', badge: '0 min', isCompleted: false },
    };
  }

  const status = String(order.status || 'new').toLowerCase().trim();
  const isCancelled = Boolean(order.isCancelled || status === 'cancelled');

  // Timestamps
  const placedTime = order.waitingStartedAt || order.timestamp || (order.createdAt ? new Date(order.createdAt).getTime() : currentTimeMs);
  const foodReadyTime = order.foodReadyAt || order.foodServedAt || order.eatingStartedAt || null;
  const paidTime = order.paidAt || (order.isPaid ? (order.updatedAt ? new Date(order.updatedAt).getTime() : currentTimeMs) : null);

  // --------------------------------------------------------------------------
  // TIMER A: FOOD PREPARATION TIME
  // --------------------------------------------------------------------------
  let prepElapsedMs = 0;
  let isPrepRunning = false;
  let isPrepCompleted = false;

  if (isCancelled) {
    prepElapsedMs = 0;
    isPrepRunning = false;
    isPrepCompleted = false;
  } else if (foodReadyTime) {
    // Food has already been marked ready / served -> Timer stopped!
    prepElapsedMs = Math.max(0, foodReadyTime - placedTime);
    isPrepRunning = false;
    isPrepCompleted = true;
  } else if (['ready', 'served', 'eating', 'bill-ready', 'printed', 'paid', 'completed'].includes(status)) {
    // If status indicates food is served but explicit timestamp missing, freeze at last updated
    const fallbackStopTime = order.updatedAt ? new Date(order.updatedAt).getTime() : currentTimeMs;
    prepElapsedMs = Math.max(0, fallbackStopTime - placedTime);
    isPrepRunning = false;
    isPrepCompleted = true;
  } else {
    // Food is still being prepared ('waiting', 'new', 'in-kitchen', 'preparing', 'cooking') -> Timer is active!
    prepElapsedMs = Math.max(0, currentTimeMs - placedTime);
    isPrepRunning = true;
    isPrepCompleted = false;
  }

  // --------------------------------------------------------------------------
  // TIMER B: DINING & PAYMENT TIME
  // --------------------------------------------------------------------------
  let diningElapsedMs = 0;
  let isDiningRunning = false;
  let isDiningCompleted = false;

  if (isCancelled) {
    diningElapsedMs = 0;
    isDiningRunning = false;
    isDiningCompleted = false;
  } else if (paidTime && (status === 'paid' || order.isPaid)) {
    // Bill has been fully paid -> Dining session finished & stopped!
    diningElapsedMs = Math.max(0, paidTime - placedTime);
    isDiningRunning = false;
    isDiningCompleted = true;
  } else {
    // Customer is still dining or bill is unpaid -> Timer is active!
    diningElapsedMs = Math.max(0, currentTimeMs - placedTime);
    isDiningRunning = true;
    isDiningCompleted = false;
  }

  return {
    isCancelled,
    prep: {
      isRunning: isPrepRunning,
      isCompleted: isPrepCompleted,
      elapsedMs: prepElapsedMs,
      formatted: formatDuration(prepElapsedMs),
      badge: formatMinutesBadge(prepElapsedMs),
      startTime: placedTime,
      stopTime: foodReadyTime,
    },
    dining: {
      isRunning: isDiningRunning,
      isCompleted: isDiningCompleted,
      elapsedMs: diningElapsedMs,
      formatted: formatDuration(diningElapsedMs),
      badge: formatMinutesBadge(diningElapsedMs),
      startTime: placedTime,
      stopTime: paidTime,
    },
  };
}

/**
 * Helper to stamp order transition: Food Marked Ready
 */
export function stampFoodReady(order) {
  const now = Date.now();
  return {
    ...order,
    status: 'eating',
    foodReadyAt: order.foodReadyAt || now,
    foodServedAt: order.foodServedAt || now,
    eatingStartedAt: order.eatingStartedAt || now,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to stamp order transition: Bill Fully Paid
 */
export function stampBillPaid(order, paymentMode = 'Cash') {
  const now = Date.now();
  return {
    ...order,
    status: 'paid',
    isPaid: true,
    paymentStatus: 'Paid',
    paymentMode,
    paidAt: order.paidAt || now,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to reopen an order if bill was disputed or table reopened
 */
export function reopenBill(order) {
  return {
    ...order,
    status: 'eating',
    isPaid: false,
    paymentStatus: 'Unpaid',
    paidAt: null,
    updatedAt: new Date().toISOString(),
  };
}
