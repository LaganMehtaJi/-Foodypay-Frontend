document.addEventListener('DOMContentLoaded', async () => {
  const merchantTag = document.getElementById('merchantTag');
  const unseenCount = document.getElementById('unseenCount');
  const notifList = document.getElementById('notifList');
  const openDashboardBtn = document.getElementById('openDashboardBtn');
  const openOptionsBtn = document.getElementById('openOptionsBtn');

  chrome.storage.sync.get(['apiUrl', 'foodypayId', 'dashboardUrl'], async (items) => {
    const apiBase = items.apiUrl || 'http://localhost:5001/api';
    const merchantId = items.foodypayId || 'FP-985569';
    const dashboardUrl = items.dashboardUrl || 'http://localhost:3000/admin';

    merchantTag.textContent = merchantId;

    try {
      const feedUrl = `${apiBase.replace(/\/$/, '')}/notifications/extension-feed?merchantId=${encodeURIComponent(merchantId)}`;
      const res = await fetch(feedUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          unseenCount.textContent = `${data.unseenOrdersCount || 0} Orders`;
          
          if (Array.isArray(data.notifications) && data.notifications.length > 0) {
            notifList.innerHTML = data.notifications.slice(0, 3).map(n => `
              <div class="notif-item">
                <strong>${n.title}</strong><br/>
                <span style="color:#64748B;">${n.message}</span>
              </div>
            `).join('');
          }
        }
      }
    } catch  {}

    openDashboardBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: dashboardUrl });
    });

    openOptionsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  });
});
