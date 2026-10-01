// FoodyPay Chrome Extension Background Service Worker (Manifest V3)

const DEFAULT_API_URL = 'http://localhost:5001/api';
let lastCheckTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
let knownSeenOrderIds = new Set();

// Setup alarm to poll backend every 10 seconds
chrome.runtime.onInstalled.addListener(() => {
  console.log('FoodyPay Real-Time Push Extension Installed.');
  chrome.alarms.create('foodypay_poll_alarm', { periodInMinutes: 0.2 }); // Every 12 seconds
  fetchRealtimeAlerts();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'foodypay_poll_alarm') {
    fetchRealtimeAlerts();
  }
});

async function fetchRealtimeAlerts() {
  chrome.storage.sync.get(['apiUrl', 'foodypayId', 'soundEnabled'], async (items) => {
    const apiBase = items.apiUrl || DEFAULT_API_URL;
    const merchantId = items.foodypayId || 'FP-985569';

    try {
      const feedUrl = `${apiBase.replace(/\/$/, '')}/notifications/extension-feed?merchantId=${encodeURIComponent(merchantId)}&since=${encodeURIComponent(lastCheckTime)}`;
      const res = await fetch(feedUrl);
      if (!res.ok) return;

      const data = await res.json();
      if (!data || !data.success) return;

      lastCheckTime = new Date().toISOString();

      // Check for new persistent push notifications from backend DB
      if (Array.isArray(data.notifications)) {
        data.notifications.forEach((notif) => {
          triggerChromeDesktopNotification(
            `notif_${notif._id || Date.now()}`,
            `🔔 ${notif.title || 'FoodyPay Alert'}`,
            notif.message || 'You have a new message from FoodyPay Dashboard.'
          );
        });
      }

      // Check for new incoming orders
      if (Array.isArray(data.orders)) {
        data.orders.forEach((order) => {
          const orderId = order._id || order.id || order.orderId;
          if (order.status === 'new' && !order.seen && !knownSeenOrderIds.has(orderId)) {
            knownSeenOrderIds.add(orderId);
            const total = order.subtotal || order.total || 0;
            const itemsSummary = Array.isArray(order.items)
              ? order.items.map(i => `${i.qty}x ${i.name}`).join(', ')
              : 'New Diner Order';

            triggerChromeDesktopNotification(
              `order_${orderId}`,
              `🚨 NEW ORDER #${order.orderId || orderId.slice(-6)} (₹${total})`,
              `Table: ${order.tableNo || order.table || 'Dine-In'}\nItems: ${itemsSummary}`
            );
          }
        });
      }
    } catch (err) {
      console.error('Error fetching FoodyPay extension feed:', err);
    }
  });
}

function triggerChromeDesktopNotification(id, title, message) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icon128.png',
    title: title,
    message: message,
    priority: 2,
    requireInteraction: true,
  });
}

// Open POS Dashboard when desktop push notification is clicked
chrome.notifications.onClicked.addListener((notifId) => {
  chrome.storage.sync.get(['dashboardUrl'], (items) => {
    const targetUrl = items.dashboardUrl || 'http://localhost:3000/admin';
    chrome.tabs.create({ url: targetUrl });
  });
});
