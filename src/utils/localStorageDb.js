import { SNACK_RACK_FULL_MENU } from '../data/snackRackMenuData';

const STORAGE_KEYS = {
  PRODUCTS: 'snackrack_local_catalog_v6',
  TABLES: 'snackrack_local_tables',
  ACTIVE_ORDERS: 'snackrack_local_active_orders',
  SALES: 'snackrack_local_sales',
  AUTH: 'foodypay_pin_auth'
};

// 1. PRODUCTS / CATALOG
export const getOfflineProducts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS) || localStorage.getItem('foodypay_crm_dishes_v1') || localStorage.getItem('foodypay_crm_dishes_v3');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading products from localStorage:', err);
  }
  return SNACK_RACK_FULL_MENU;
};

export const resetToOfficialMenu = () => {
  saveOfflineProducts(SNACK_RACK_FULL_MENU);
  return SNACK_RACK_FULL_MENU;
};

export const saveOfflineProducts = (products) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem('foodypay_crm_dishes_v1', JSON.stringify(products));
    localStorage.setItem('foodypay_crm_dishes_v3', JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products to localStorage:', err);
  }
};

// 2. TABLES
export const getOfflineTables = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TABLES) || localStorage.getItem('foodypay_crm_tables_v3') || localStorage.getItem('foodypay_crm_tables_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((t) => t && !['tbl-1', 'tbl-2', 'tbl-3', 'tbl-4', 'tbl-5', 'tb_1', 'tb_2', 'tb_3', 'tb_4', 'tb_5', 'tb_6', 'tb_7'].includes(t.id));
      }
    }
  } catch (err) {
    console.error('Error loading tables from localStorage:', err);
  }
  return [];
};

export const saveOfflineTables = (tables) => {
  try {
    if (Array.isArray(tables)) {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
      localStorage.setItem('foodypay_crm_tables_v3', JSON.stringify(tables));
      localStorage.setItem('foodypay_crm_tables_v1', JSON.stringify(tables));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('Error saving tables:', err);
  }
};

// 3. ACTIVE RUNNING ORDERS PER TABLE
export const getActiveOrders = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDERS);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error('Error loading active orders:', err);
  }
  return {};
};

export const saveActiveOrders = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Error saving active orders:', err);
  }
};

// 4. SALES HISTORY (COMPLETED BILLED ORDERS)
export const getSalesHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading sales history:', err);
  }
  return [];
};

export const saveSalesHistory = (sales) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (err) {
    console.error('Error saving sales history:', err);
  }
};

export const recordSale = (saleData) => {
  const currentSales = getSalesHistory();
  const newSale = {
    ...saleData,
    id: saleData.id || `BILL-${Date.now().toString().slice(-6)}`,
    createdAt: saleData.createdAt || new Date().toISOString()
  };
  const updated = [newSale, ...currentSales];
  saveSalesHistory(updated);
  return updated;
};

export const updateSaleStatus = (saleId, newPaymentMethod) => {
  const currentSales = getSalesHistory();
  const updated = currentSales.map((s) => {
    if (s.id === saleId) {
      return {
        ...s,
        paymentMethod: newPaymentMethod,
        isSettled: newPaymentMethod !== 'Not Deposit',
        settledAt: new Date().toISOString()
      };
    }
    return s;
  });
  saveSalesHistory(updated);
  return updated;
};

// 5. SALES SUMMARY METRICS
export const calculateSalesSummary = (salesList) => {
  const sales = salesList || getSalesHistory();
  let totalSales = 0;
  let cashSales = 0;
  let upiSales = 0;
  let notDepositSales = 0;

  sales.forEach((order) => {
    const amt = Number(order.totalAmount || order.finalTotal || order.grandTotal || 0);
    totalSales += amt;

    const pm = (order.paymentMethod || '').toLowerCase().trim();
    if (pm === 'cash') {
      cashSales += amt;
    } else if (pm === 'upi' || pm === 'online') {
      upiSales += amt;
    } else if (pm === 'not deposit' || pm === 'not_deposit' || pm === 'due' || pm === 'credit') {
      notDepositSales += amt;
    } else {
      cashSales += amt;
    }
  });

  return {
    totalSales,
    cashSales,
    upiSales,
    notDepositSales,
    totalOrdersCount: sales.length
  };
};

// 6. EXPORT TO CSV (FOR EXCEL)
export const exportSalesToExcelCsv = () => {
  const sales = getSalesHistory();
  if (!sales || sales.length === 0) {
    alert('No sales records to export yet!');
    return false;
  }

  const headers = [
    'Bill No',
    'Date & Time',
    'Table',
    'Customer Name',
    'Customer Phone',
    'Payment Method',
    'Items Summary',
    'Total Items Qty',
    'Subtotal (Rs)',
    'Discount (Rs)',
    'Grand Total (Rs)'
  ];

  const rows = sales.map((s) => {
    const itemsSummary = (s.items || [])
      .map((it) => `${it.name} (${it.variantName || 'Regular'}) x${it.quantity}`)
      .join('; ');
    const totalQty = (s.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

    return [
      `"${s.id || ''}"`,
      `"${new Date(s.createdAt).toLocaleString('en-IN')}"`,
      `"${s.tableName || ''}"`,
      `"${s.customerName || 'Walk-in'}"`,
      `"${s.customerPhone || ''}"`,
      `"${s.paymentMethod || 'Cash'}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      totalQty,
      s.subtotal || s.totalAmount || 0,
      s.discount || 0,
      s.totalAmount || s.finalTotal || 0
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SnackRack_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};

// 7. EXPORT FULL JSON BACKUP
export const exportFullBackup = () => {
  const backup = {
    exportedAt: new Date().toISOString(),
    storeName: 'Snack Rack',
    products: getOfflineProducts(),
    tables: getOfflineTables(),
    activeOrders: getActiveOrders(),
    sales: getSalesHistory()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SnackRack_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 8. IMPORT BACKUP FILE
export const importBackupFromJson = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.products && Array.isArray(data.products)) {
      saveOfflineProducts(data.products);
    }
    if (data.tables && Array.isArray(data.tables)) {
      saveOfflineTables(data.tables);
    }
    if (data.sales && Array.isArray(data.sales)) {
      saveSalesHistory(data.sales);
    }
    if (data.activeOrders && typeof data.activeOrders === 'object') {
      saveActiveOrders(data.activeOrders);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
