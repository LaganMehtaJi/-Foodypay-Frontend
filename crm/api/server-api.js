/**
 * FoodyPay Node.js & MongoDB Server API & Sync Client
 * Completely replaces Firebase SDK with clean, fast REST API communication.
 */
(function () {
  'use strict';

  // Configurable Server Base URL with smart auto-detection
  function getApiBaseUrl() {
    if (window.FOODYPAY_API_URL) return window.FOODYPAY_API_URL.replace(/\/+$/, '');
    const custom = localStorage.getItem('fp_server_url');
    if (custom && custom.trim()) return custom.trim().replace(/\/+$/, '');
    return 'http://localhost:3000/api';
  }

  // Token & User Persistence
  let authToken = localStorage.getItem('fp_auth_token') || '';
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('fp_auth_user') || 'null');
  } catch (e) {
    currentUser = null;
  }

  // Sync State Tracking
  const syncState = {
    status: 'idle', // 'idle' | 'syncing' | 'synced' | 'error'
    lastSync: null,
    error: null,
  };

  // Helper for authenticated fetch
  async function apiFetch(endpoint, options = {}) {
    const baseUrl = getApiBaseUrl();
    let url;

    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      url = endpoint;
    } else {
      let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      // Cleanly normalize so baseUrl (.../api) and endpoint (/api/...) do not duplicate
      if (baseUrl.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
        cleanEndpoint = cleanEndpoint.substring(4);
      } else if (!baseUrl.endsWith('/api') && !cleanEndpoint.startsWith('/api/')) {
        cleanEndpoint = `/api${cleanEndpoint}`;
      }
      url = `${baseUrl}${cleanEndpoint}`;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      return data;
    } catch (err) {
      console.warn(`[ServerAPI] Request failed (${endpoint}):`, err.message);
      throw err;
    }
  }

  function showToastSafe(msg, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      console.log(`[Toast ${type || 'info'}]:`, msg);
    }
  }

  function escH(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Global namespace for FoodyPay Cloud
  window.FPC = window.FPC || {};
  window.FPC.getApiBaseUrl = getApiBaseUrl;
  window.FPC.currentUser = currentUser;
  window.FPC.syncState = syncState;
  window.FPC.apiFetch = apiFetch;

  /* ─────────────────────────────────────────────
     AUTHENTICATION MODULE
  ───────────────────────────────────────────── */
  function updateHeaderBtn() {
    const btn = document.getElementById('btnHeaderAuth');
    if (!btn) return;
    const user = currentUser;
    if (user && authToken) {
      const name = (user.name || user.businessName || (user.email || 'User').split('@')[0]);
      btn.innerHTML = `✅ <span title="${escH(user.email || '')}" style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escH(name)}</span>`;
      btn.style.background = 'rgba(22,163,74,0.3)';
      btn.style.borderColor = 'rgba(74,222,128,0.5)';
      btn.onclick = openAccountPanel;
    } else {
      btn.innerHTML = `🔒 <span>Login</span>`;
      btn.style.background = 'rgba(255,255,255,0.18)';
      btn.style.borderColor = 'rgba(255,255,255,0.35)';
      btn.onclick = openLoginPopup;
    }
  }

  function closeAnyModal() {
    document.getElementById('fpcLoginModal')?.remove();
    document.getElementById('firebaseAuthModal')?.remove();
  }

  let isRegisterMode = false;

  function openLoginPopup() {
    closeAnyModal();
    const m = document.createElement('div');
    m.id = 'fpcLoginModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center';
    
    renderModalContent(m);

    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    setTimeout(() => document.getElementById('fpcEmail')?.focus(), 60);
  }

  function renderModalContent(container) {
    const serverUrl = getApiBaseUrl();
    container.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:26px 22px;width:360px;max-width:94vw;box-shadow:0 16px 48px rgba(0,0,0,.3);font-family:system-ui,-apple-system,sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div>
            <div style="font-size:20px;font-weight:800;color:#0f172a;display:flex;align-items:center;gap:6px">🍔 FoodyPay</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px">${isRegisterMode ? 'New Merchant Registration' : 'Node.js & MongoDB Cloud Sign In'}</div>
          </div>
          <button onclick="document.getElementById('fpcLoginModal').remove()" style="border:0;background:none;font-size:22px;cursor:pointer;color:#94a3b8;line-height:1">✕</button>
        </div>

        <div id="fpcLoginErr" style="display:none;background:#fef2f2;border:1px solid #fecdd3;color:#b91c1c;padding:9px 12px;border-radius:8px;font-size:12.5px;margin-bottom:12px"></div>

        <form id="fpcLoginForm" onsubmit="window.FPC_Auth._submit(event)">
          ${isRegisterMode ? `
            <div style="margin-bottom:10px">
              <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px">Full Name</label>
              <input id="fpcName" type="text" required placeholder="Owner Name"
                style="width:100%;padding:9px 11px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13.5px;outline:none;box-sizing:border-box">
            </div>
            <div style="margin-bottom:10px">
              <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px">Restaurant / Business Name</label>
              <input id="fpcBusinessName" type="text" placeholder="${escH((typeof S !== 'undefined' && S.name) || 'My Restaurant')}"
                style="width:100%;padding:9px 11px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13.5px;outline:none;box-sizing:border-box">
            </div>
          ` : ''}

          <div style="margin-bottom:10px">
            <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px">Email</label>
            <input id="fpcEmail" type="email" required autocomplete="email" placeholder="merchant@foodypay.com"
              style="width:100%;padding:9px 11px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13.5px;outline:none;box-sizing:border-box">
          </div>

          <div style="margin-bottom:14px">
            <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px">Password</label>
            <input id="fpcPassword" type="password" required autocomplete="current-password" placeholder="••••••••"
              style="width:100%;padding:9px 11px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:13.5px;outline:none;box-sizing:border-box">
          </div>

          <button type="submit" id="fpcLoginBtn"
            style="width:100%;background:#e11d48;color:#fff;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:700;cursor:pointer">
            ${isRegisterMode ? 'Create Account & Connect' : 'Sign In to Server'}
          </button>
        </form>

        <div style="margin-top:12px;text-align:center">
          <button type="button" onclick="window.FPC_Auth.toggleMode()" style="background:none;border:none;color:#0284c7;font-size:12.5px;cursor:pointer;font-weight:600">
            ${isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>

        <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;align-items:center">
          <span>Server: ${escH(serverUrl || 'Local:3000')}</span>
          <button type="button" onclick="window.FPC_Auth.changeServerUrl()" style="border:none;background:none;color:#64748b;cursor:pointer;text-decoration:underline">Change</button>
        </div>
      </div>`;
  }

  function toggleMode() {
    isRegisterMode = !isRegisterMode;
    const m = document.getElementById('fpcLoginModal');
    if (m) renderModalContent(m);
  }

  function changeServerUrl() {
    const current = getApiBaseUrl();
    const next = prompt('Enter FoodyPay Node.js Server URL:', current);
    if (next !== null) {
      localStorage.setItem('fp_server_url', next.trim());
      showToastSafe('Server URL updated: ' + (next.trim() || 'default'), 'info');
      const m = document.getElementById('fpcLoginModal');
      if (m) renderModalContent(m);
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('fpcEmail')?.value?.trim() || '';
    const password = document.getElementById('fpcPassword')?.value || '';
    const errBox = document.getElementById('fpcLoginErr');
    const btn = document.getElementById('fpcLoginBtn');

    if (!email || !password) return;
    if (errBox) errBox.style.display = 'none';
    if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

    try {
      let resp;
      if (isRegisterMode) {
        const name = document.getElementById('fpcName')?.value?.trim() || 'Merchant';
        const businessName = document.getElementById('fpcBusinessName')?.value?.trim() || (typeof S !== 'undefined' ? S.name : '');
        resp = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            businessName,
            contactNo: (typeof S !== 'undefined' ? S.phone : '') || '+91 98000 00000',
          }),
        });
      } else {
        resp = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      }

      const userData = resp.data || resp.user || resp;
      authToken = userData.token || '';
      currentUser = userData;

      localStorage.setItem('fp_auth_token', authToken);
      localStorage.setItem('fp_auth_user', JSON.stringify(currentUser));
      if (currentUser.foodypayId) {
        localStorage.setItem('fp_foodypay_id', currentUser.foodypayId);
        localStorage.setItem('fp_system_code', currentUser.foodypayId);
      }
      window.FPC.currentUser = currentUser;

      updateHeaderBtn();
      closeAnyModal();
      showToastSafe(`✅ Connected to Cloud: ${currentUser.businessName || currentUser.name || currentUser.email}`, 'success');

      // Auto-sync / restore data from MongoDB
      setTimeout(() => {
        window.FPC_Sync.fetchAndSyncAll(true);
      }, 300);
    } catch (err) {
      console.error('[Auth] Submit error:', err);
      if (errBox) {
        errBox.textContent = err.message || 'Server authentication failed. Check credentials and server status.';
        errBox.style.display = 'block';
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = isRegisterMode ? 'Create Account & Connect' : 'Sign In to Server';
      }
    }
  }

  function openAccountPanel() {
    closeAnyModal();
    const user = currentUser;
    if (!user) return openLoginPopup();

    const m = document.createElement('div');
    m.id = 'fpcLoginModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center';
    m.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:24px;width:360px;max-width:94vw;box-shadow:0 16px 48px rgba(0,0,0,.3);font-family:system-ui,-apple-system,sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="margin:0;font-size:17px">☁️ FoodyPay Account</h3>
          <button onclick="document.getElementById('fpcLoginModal').remove()" style="border:0;background:none;font-size:22px;cursor:pointer;color:#94a3b8">✕</button>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;font-size:13px;margin-bottom:14px">
          <div style="margin-bottom:5px">🏢 <b>Business:</b> ${escH(user.businessName || user.name || 'Store')}</div>
          <div style="margin-bottom:5px">✉️ <b>Email:</b> ${escH(user.email || '')}</div>
          <div style="margin-bottom:5px">🔑 <b>Merchant ID:</b> <span style="font-weight:700">${escH(user.foodypayId || user._id || '')}</span></div>
          <div>🗄 <b>Database:</b> <span style="color:#16a34a;font-weight:700">MongoDB Atlas Connected</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="document.getElementById('fpcLoginModal').remove();window.FPC_Sync.syncAll(true)"
            style="background:#16a34a;color:#fff;border:none;border-radius:9px;padding:11px;font-size:14px;font-weight:700;cursor:pointer">
            🚀 Sync All to Cloud Now
          </button>
          <button onclick="document.getElementById('fpcLoginModal').remove();window.FPC_Sync.fetchAndSyncAll(true)"
            style="background:#e11d48;color:#fff;border:none;border-radius:9px;padding:11px;font-size:14px;font-weight:700;cursor:pointer">
            📥 Fetch &amp; Sync All (Catalog + Sales)
          </button>
          <button onclick="document.getElementById('fpcLoginModal').remove();goTab('mysaleday')"
            style="border:1.5px solid #e2e8f0;border-radius:9px;padding:10px;font-size:14px;cursor:pointer;background:#fff">
            📊 My Sales Day
          </button>
          <button onclick="window.FPC_Auth._logout()"
            style="border:1.5px solid #fecdd3;color:#dc2626;border-radius:9px;padding:10px;font-size:13px;cursor:pointer;background:#fff">
            Sign Out
          </button>
        </div>
      </div>`;

    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
  }

  function logout() {
    closeAnyModal();
    authToken = '';
    currentUser = null;
    localStorage.removeItem('fp_auth_token');
    localStorage.removeItem('fp_auth_user');
    window.FPC.currentUser = null;
    updateHeaderBtn();
    updateCloudStatusBadge();
    showToastSafe('Signed out from FoodyPay Cloud.', 'info');
  }

  function initAuth() {
    authToken = localStorage.getItem('fp_auth_token') || '';
    try {
      currentUser = JSON.parse(localStorage.getItem('fp_auth_user') || 'null');
    } catch(e) { currentUser = null; }
    window.FPC.currentUser = currentUser;
    updateHeaderBtn();

    if (authToken && currentUser) {
      // Validate session with server silently
      apiFetch('/api/auth/me').then(resp => {
        if (resp && resp.data) {
          currentUser = { ...currentUser, ...resp.data };
          localStorage.setItem('fp_auth_user', JSON.stringify(currentUser));
          window.FPC.currentUser = currentUser;
          updateHeaderBtn();
        }
      }).catch(err => {
        console.warn('[Auth] Session check info:', err.message);
      });

      // Start live polling listener
      initRealtimeListener();

      // Auto-sync catalog and data with MongoDB Atlas on CRM load
      setTimeout(() => {
        fetchAndSyncAll(false);
      }, 500);
    }
  }

  /* ─────────────────────────────────────────────
     SYNC MODULE (Catalog, Sales, Settings via Node.js/MongoDB)
  ───────────────────────────────────────────── */
  let pendingSettlements = [];
  try {
    pendingSettlements = JSON.parse(localStorage.getItem('fp_pending_settlements') || '[]');
  } catch(e) { pendingSettlements = []; }

  let batchFlushTimer = null;
  const BATCH_TARGET = 5;

  function updateCloudStatusBadge() {
    const el = document.getElementById('hdrCloudStatus');
    if (!el) return;
    const pendingCount = (pendingSettlements || []).length;
    if (syncState.status === 'syncing') {
      el.innerHTML = '<span style="color:#fef08a">⏳ Syncing</span>';
    } else if (pendingCount > 0) {
      el.innerHTML = `<span style="color:#93c5fd" title="${pendingCount} settlements queued for next batch">🟢 ${pendingCount}/5 Batch</span>`;
    } else if (syncState.status === 'synced') {
      el.innerHTML = '<span style="color:#bbf7d0">🟢 Synced</span>';
    } else if (syncState.status === 'error') {
      el.innerHTML = '<span style="color:#fca5a5" title="' + escH(syncState.error || 'Error') + '">🔴 Error</span>';
    } else if (currentUser && authToken) {
      el.innerHTML = '<span>🟢 Cloud</span>';
    } else {
      el.innerHTML = '<span>☁️ Cloud</span>';
    }
  }

  function queueSaleSettlement(sale) {
    if (!sale) return;
    const saleId = String(sale.id || sale.end || sale.start || '');
    if (!pendingSettlements.some(s => String(s.id || s.end || s.start || '') === saleId)) {
      pendingSettlements.push(sale);
    }
    try {
      localStorage.setItem('fp_pending_settlements', JSON.stringify(pendingSettlements));
    } catch(e) {}

    updateCloudStatusBadge();

    if (pendingSettlements.length >= BATCH_TARGET) {
      if (batchFlushTimer) { clearTimeout(batchFlushTimer); batchFlushTimer = null; }
      flushSettlementBatch(false);
    } else {
      if (!batchFlushTimer) {
        batchFlushTimer = setTimeout(() => {
          batchFlushTimer = null;
          if (pendingSettlements.length > 0) {
            flushSettlementBatch(false);
          }
        }, 60000); // 1 min auto-flush
      }
    }
  }

  async function flushSettlementBatch(manual = false) {
    if (!authToken || !currentUser) {
      if (manual) {
        showToastSafe('🔒 Sign in to sync sales to MongoDB.', 'info');
        openLoginPopup();
      }
      return;
    }

    syncState.status = 'syncing';
    updateCloudStatusBadge();

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySales = (typeof S !== 'undefined' && S.history ? S.history : []).filter(h => {
        try {
          return h.mode !== 'Cancelled' && new Date(h.end).toISOString().split('T')[0] === todayStr;
        } catch(e) { return false; }
      });

      const sumTotal = todaySales.reduce((acc, h) => acc + (+h.total || 0), 0);
      const sumCash = todaySales.filter(h => h.mode === 'Cash').reduce((acc, h) => acc + (+h.total || 0), 0);
      const sumUPI = todaySales.filter(h => h.mode === 'UPI').reduce((acc, h) => acc + (+h.total || 0), 0);
      const sumCard = todaySales.filter(h => h.mode === 'Card').reduce((acc, h) => acc + (+h.total || 0), 0);
      const sumDue = (typeof S !== 'undefined' && S.history ? S.history : []).filter(h => h.status === 'UNPAID').reduce((acc, h) => acc + (+h.total || 0), 0);

      const payload = {
        date: todayStr,
        sales: pendingSettlements.length > 0 ? pendingSettlements : todaySales.slice(0, 50),
        summary: {
          todayRevenue: sumTotal,
          todayOrdersCount: todaySales.length,
          cashTotal: sumCash,
          upiTotal: sumUPI,
          cardTotal: sumCard,
          dueTotal: sumDue,
        },
      };

      await apiFetch('/api/crm/sales/batch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Clear pending queue upon successful sync
      pendingSettlements = [];
      try { localStorage.removeItem('fp_pending_settlements'); } catch(e) {}

      syncState.status = 'synced';
      syncState.lastSync = new Date().toLocaleTimeString();
      syncState.error = null;
      updateCloudStatusBadge();

      if (manual) showToastSafe('✅ Sales synced to MongoDB successfully!', 'success');
      if (typeof tab !== 'undefined' && tab === 'mysaleday' && typeof render === 'function') render();
    } catch (err) {
      console.error('[Sync] Batch flush error:', err);
      syncState.status = 'error';
      syncState.error = err.message || String(err);
      updateCloudStatusBadge();
      if (manual) showToastSafe('❌ Sync error: ' + (err.message || 'Check connection'), 'error');
    }
  }

  async function syncCatalog(manual = false) {
    if (typeof S === 'undefined') return;
    const fpId = (currentUser && currentUser.foodypayId) || localStorage.getItem('fp_foodypay_id') || (typeof getUniqueMerchantId === 'function' ? getUniqueMerchantId() : 'FP-624358');

    try {
      const cleanProducts = (S.products || []).map(p => ({
        id: p.id,
        name: p.name,
        cat: p.cat,
        diet: p.diet || 'veg',
        vars: p.vars || [],
        price: Array.isArray(p.vars) && p.vars.length > 0 ? Number(p.vars[0]?.p || 0) : Number(p.price || 0),
        img: (p.img && p.img.length > 50000) ? '' : (p.img || ''),
      }));

      await apiFetch('/api/crm/catalog', {
        method: 'POST',
        body: JSON.stringify({
          foodypayId: fpId,
          categories: S.cats || [],
          products: cleanProducts,
          areas: S.areas || [],
        }),
      });

      if (manual) showToastSafe('✅ Catalog saved to MongoDB!', 'success');
    } catch (err) {
      console.error('[Sync] Catalog sync error:', err);
      if (manual) showToastSafe('❌ Catalog sync failed: ' + err.message, 'error');
    }
  }

  let catalogDebounceTimer = null;
  function syncCatalogDebounced() {
    if (catalogDebounceTimer) clearTimeout(catalogDebounceTimer);
    catalogDebounceTimer = setTimeout(() => {
      syncCatalog(false);
    }, 600);
  }

  async function syncSettings(manual = false) {
    if (!authToken || !currentUser || typeof S === 'undefined') return;

    try {
      await apiFetch('/api/crm/settings', {
        method: 'POST',
        body: JSON.stringify({
          name: S.name || '',
          phone: S.phone || '',
          gst: S.gst || {},
          billDesign: S.billDesign || {},
          printers: S.printers || {},
        }),
      });

      if (manual) showToastSafe('✅ Settings saved to MongoDB!', 'success');
    } catch (err) {
      console.error('[Sync] Settings sync error:', err);
      if (manual) showToastSafe('❌ Settings sync failed: ' + err.message, 'error');
    }
  }

  async function syncAll(manual = false) {
    if (!authToken || !currentUser) {
      if (manual) {
        showToastSafe('🔒 Sign in to sync data to MongoDB.', 'info');
        openLoginPopup();
      }
      return;
    }

    if (manual) showToastSafe('🚀 Syncing Catalog, Sales, and Settings to MongoDB...', 'info');
    await flushSettlementBatch(manual);
    await syncCatalog(manual);
    await syncSettings(manual);
  }

  async function fetchAndSyncAll(manual = false) {
    if (!authToken || !currentUser) {
      if (manual) {
        showToastSafe('🔒 Sign in to fetch cloud data.', 'info');
        openLoginPopup();
      }
      return;
    }

    syncState.status = 'syncing';
    updateCloudStatusBadge();
    if (manual) showToastSafe('📥 Fetching latest data from MongoDB...', 'info');

    try {
      const resp = await apiFetch('/api/crm/sync-all');
      const data = resp.data || resp;

      if (typeof S !== 'undefined') {
        // 1. Restore Catalog
        if (data.catalog) {
          if (Array.isArray(data.catalog.products) && data.catalog.products.length > 0) {
            S.products = data.catalog.products;
          } else if (Array.isArray(S.products) && S.products.length > 0) {
            console.log('[Sync] Cloud catalog is empty. Auto-pushing local catalog to MongoDB Atlas...');
            syncCatalog(false);
          }
          if (Array.isArray(data.catalog.categories) && data.catalog.categories.length > 0) {
            S.cats = data.catalog.categories;
          }
          if (Array.isArray(data.catalog.areas) && data.catalog.areas.length > 0) {
            S.areas = data.catalog.areas;
          }
        } else if (Array.isArray(S.products) && S.products.length > 0) {
          console.log('[Sync] Cloud catalog missing. Auto-pushing local catalog to MongoDB Atlas...');
          syncCatalog(false);
        }

        // 2. Restore Sales History
        if (Array.isArray(data.sales) && data.sales.length > 0) {
          const historyMap = new Map();
          (S.history || []).forEach(s => {
            if (!s) return;
            const key = String(s.id || s.end || s.start || '');
            historyMap.set(key, s);
          });

          data.sales.forEach(s => {
            if (!s) return;
            const key = String(s.id || s.end || s.start || '');
            if (!historyMap.has(key)) {
              historyMap.set(key, s);
            }
          });

          S.history = Array.from(historyMap.values()).sort((a, b) => {
            const timeA = new Date(a.end || a.start || 0).getTime() || 0;
            const timeB = new Date(b.end || b.start || 0).getTime() || 0;
            return timeB - timeA;
          });
        }

        // 3. Restore Settings
        if (data.settings) {
          if (data.settings.name && (!S.name || S.name === 'Snack Rack Café' || S.name === 'My Restaurant')) {
            S.name = data.settings.name;
          }
          if (data.settings.phone) {
            S.phone = data.settings.phone;
          }
          if (data.settings.gst) {
            S.gst = { ...S.gst, ...data.settings.gst };
          }
        }

        // Save to localStorage & refresh views
        if (typeof save === 'function') save();
        if (typeof render === 'function') render();
        if (typeof updateNameUI === 'function') updateNameUI();
        const rn = document.getElementById('rn');
        if (rn && S.name) rn.textContent = '🏠 ' + S.name;
      }

      syncState.status = 'synced';
      syncState.lastSync = new Date().toLocaleTimeString();
      syncState.error = null;
      updateCloudStatusBadge();

      const prodCount = (typeof S !== 'undefined' && S.products ? S.products.length : 0);
      const salesCount = (typeof S !== 'undefined' && S.history ? S.history.length : 0);
      showToastSafe(`✅ Cloud Sync Complete: ${prodCount} Items & ${salesCount} Sales synced!`, 'success');
    } catch (err) {
      console.error('[Sync] Full fetch error:', err);
      syncState.status = 'error';
      syncState.error = err.message || String(err);
      updateCloudStatusBadge();
      if (manual) showToastSafe('❌ Cloud fetch failed: ' + (err.message || 'Check connection'), 'error');
    }
  }

  // Real-time live sales poller (every 20s if logged in)
  let livePollTimer = null;
  let lastLiveTimestamp = Date.now();

  function initRealtimeListener() {
    if (livePollTimer) clearInterval(livePollTimer);
    if (!authToken || !currentUser) return;

    livePollTimer = setInterval(async () => {
      if (!authToken || !currentUser) return;
      try {
        const resp = await apiFetch(`/api/crm/sales/live?since=${lastLiveTimestamp}`);
        if (resp && Array.isArray(resp.sales) && resp.sales.length > 0 && typeof S !== 'undefined') {
          let updated = false;
          const map = new Map();
          (S.history || []).forEach(h => map.set(String(h.id || h.end || h.start), h));

          resp.sales.forEach(sale => {
            const key = String(sale.id || sale.end || sale.start);
            if (!map.has(key)) {
              map.set(key, sale);
              updated = true;
            } else {
              const local = map.get(key);
              if (local.status !== sale.status || local.mode !== sale.mode) {
                local.status = sale.status;
                local.mode = sale.mode;
                updated = true;
              }
            }
          });

          if (updated) {
            S.history = Array.from(map.values()).sort((a, b) => (b.end || b.start || 0) - (a.end || a.start || 0));
            if (typeof save === 'function') save();
            if (typeof render === 'function') render();
          }
        }
        if (resp && resp.serverTime) lastLiveTimestamp = resp.serverTime;
      } catch (err) {
        // silent polling catch
      }
    }, 20000);
  }

  // Flush pending on window unload
  window.addEventListener('beforeunload', () => {
    if (pendingSettlements && pendingSettlements.length > 0 && authToken) {
      flushSettlementBatch(false);
    }
  });

  /* ─────────────────────────────────────────────
     LIVE TABLE ORDER POLLING (Contactless QR Orders)
  ───────────────────────────────────────────── */
  let liveOrdersInterval = null;
  const seenOrderIds = new Set();

  function startLiveOrderPolling(callback) {
    if (liveOrdersInterval) clearInterval(liveOrdersInterval);

    const checkNewOrders = async () => {
      const user = currentUser;
      const fpId = user?.foodypayId || localStorage.getItem('fp_foodypay_id') || (typeof getUniqueMerchantId === 'function' ? getUniqueMerchantId() : 'FP-624358');
      if (!fpId) return;

      try {
        const res = await apiFetch(`/api/orders/public?foodypayId=${encodeURIComponent(fpId)}&limit=30`);
        const orders = res.data || [];
        if (Array.isArray(orders) && orders.length > 0) {
          orders.forEach(order => {
            if (order.status === 'settled' || order.status === 'completed' || order.status === 'cancelled') return;
            const oid = String(order.orderId || order._id);
            const itemsHash = (order.items || []).map(i => `${i.name}:${i.qty}:${i.price}`).join('|');
            const sig = `${oid}__${itemsHash}__${order.total}`;

            if (!seenOrderIds.has(sig)) {
              seenOrderIds.add(sig);
              if (typeof callback === 'function') {
                callback(order);
              } else if (typeof window.onNewCloudOrder === 'function') {
                window.onNewCloudOrder(order);
              }
            }
          });
        }
      } catch (err) {
        // silent polling catch
      }
    };

    liveOrdersInterval = setInterval(checkNewOrders, 3000);
    setTimeout(checkNewOrders, 1000);
  }

  /* ─────────────────────────────────────────────
     TABLE ORDER STATUS SYNC (Ordering, KOT Printed, Bill Printed, Settled)
  ───────────────────────────────────────────── */
  async function syncTableStatus(tableId, status, orderData) {
    try {
      const user = currentUser;
      const fpId = user?.foodypayId || localStorage.getItem('fp_foodypay_id') || (typeof getUniqueMerchantId === 'function' ? getUniqueMerchantId() : 'FP-624358');
      if (!fpId || !tableId) return;

      let tableName = tableId;
      if (typeof tinfo === 'function') {
        const inf = tinfo(tableId);
        if (inf && inf.t && inf.t.name) tableName = inf.t.name;
      }

      const ord = orderData || (typeof S !== 'undefined' && S.orders ? S.orders[tableId] : null);
      const isSettled = (status === 'settled' || status === 'completed' || status === 'blank');

      const items = (!isSettled && ord && ord.items) ? ord.items.map(i => ({
        pid: i.pid || i.id || '',
        name: i.name,
        v: i.v || 'Regular',
        price: Number(i.price !== undefined ? i.price : (i.p !== undefined ? i.p : 0)),
        qty: Number(i.qty || 1),
        isVeg: i.isVeg !== false
      })) : [];

      let total = 0;
      if (!isSettled && ord) {
        if (typeof net === 'function') {
          try { total = net(ord); } catch (e) { total = 0; }
        }
        if (!total) {
          total = (items || []).reduce((s, it) => s + (it.price * it.qty), 0);
        }
      }

      const isKot = !!(ord && (ord.kotPrinted || (ord.items && ord.items.some(x => x.kot || x.sent))));
      const isBill = !!(ord && ord.printed);

      await apiFetch('/api/orders/pos/sync-table-status', {
        method: 'POST',
        body: JSON.stringify({
          foodypayId: fpId,
          table: tableId,
          tableName: tableName,
          status: status || (isBill ? 'bill_printed' : (isKot ? 'kot_printed' : 'ordering')),
          kotPrinted: isKot,
          billPrinted: isBill,
          items: items,
          total: total,
          subtotal: total,
          customer: ord?.cust?.name || (ord?.del ? ord.del.name : 'Walk-in Guest'),
          phone: ord?.cust?.phone || (ord?.del ? ord.del.phone : '')
        })
      });
    } catch (err) {
      console.warn('[Sync] syncTableStatus notice:', err.message);
    }
  }

  let tableSyncDebounceTimer = null;
  function syncTableStatusDebounced(tableId, status, orderData) {
    if (tableSyncDebounceTimer) clearTimeout(tableSyncDebounceTimer);
    tableSyncDebounceTimer = setTimeout(() => {
      syncTableStatus(tableId, status, orderData);
    }, 1000);
  }

  /* ─────────────────────────────────────────────
     PUBLIC API EXPORTS
  ───────────────────────────────────────────── */
  window.FPC_Auth = {
    init: initAuth,
    openModal: openLoginPopup,
    closeModal: closeAnyModal,
    updateUI: updateHeaderBtn,
    toggleMode: toggleMode,
    changeServerUrl: changeServerUrl,
    _submit: handleLoginSubmit,
    _logout: logout,
  };

  window.FPC_Sync = {
    syncAll: syncAll,
    fetchAndSyncAll: fetchAndSyncAll,
    syncCatalog: syncCatalog,
    syncCatalogDebounced: syncCatalogDebounced,
    syncSettings: syncSettings,
    flushSettlementBatch: flushSettlementBatch,
    queueSaleSettlement: queueSaleSettlement,
    initRealtimeListener: initRealtimeListener,
    updateBadge: updateCloudStatusBadge,
    startLiveOrderPolling: startLiveOrderPolling,
    syncTableStatus: syncTableStatus,
    syncTableStatusDebounced: syncTableStatusDebounced,
    syncStaffToCloud: (m) => (window.syncStaffToCloud ? window.syncStaffToCloud(m) : Promise.resolve()),
  };

  // Backwards-compatible globals used across index.html
  window.queueSaleSettlement = queueSaleSettlement;
  window.flushSettlementBatch = flushSettlementBatch;
  window.syncCatalogToCloud = syncCatalog;
  window.syncCatalogToCloudDebounced = syncCatalogDebounced;
  window.syncTableStatusToCloud = syncTableStatus;
  window.syncTableStatusToCloudDebounced = syncTableStatusDebounced;
  window.syncSettingsToCloud = syncSettings;
  window.syncStaffToCloud = window.syncStaffToCloud || function(m) {
    if (typeof syncStaffToCloud === 'function') return syncStaffToCloud(m);
    console.log('[Staff Sync] syncStaffToCloud fallback called');
  };
  window.syncAllToFirebase = syncAll;
  window.fetchAndSyncAllFromFirebase = fetchAndSyncAll;
  window.pullFromFirebase = fetchAndSyncAll;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    setTimeout(initAuth, 100);
  }
})();
