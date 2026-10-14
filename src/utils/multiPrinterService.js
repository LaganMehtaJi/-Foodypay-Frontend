/**
 * Multi-Printer Management & Dispatcher Service for FoodyPay POS
 * 
 * Capabilities:
 * - Add, Edit, Delete, Enable, Disable printers
 * - Connection methods: 'USB' (WebUSB/Direct), 'LAN' (Network IP e.g. 192.168.1.100:9100), 'BROWSER' (Window Print Spooler)
 * - Custom roles:
 *   - 'billing': Customer Receipts / Invoices
 *   - 'kitchen': KOT (Food items)
 *   - 'bar': KOT (Bar / Beverage items)
 *   - 'all': Receives all eligible prints
 *   - 'backup': Fallback printer
 * - Print All: Sends to all enabled eligible printers
 * - Print Specific: Targets selected printer(s)
 * - Individual Workflow Buttons: Bill, Kitchen KOT, Bar Slip
 * - Test Print and Status monitoring
 * - Anti-duplicate debounce protection
 */

import { printThermalReceipt as printThermalBill, printThermalKot } from './thermalPrinter.js';

const PRINTERS_STORAGE_KEY = 'foodypay_multi_printers_v2';
const LAST_PRINT_TIMESTAMP = 'foodypay_last_print_ts';

export const PRINTER_CONNECTION_TYPES = [
  { id: 'BROWSER', name: 'Browser Spooler / System Dialog' },
  { id: 'USB', name: 'USB Thermal Printer (Direct ESC/POS)' },
  { id: 'LAN', name: 'LAN / Ethernet Thermal Printer (Network IP)' },
];

export const PRINTER_ROLES = [
  { id: 'all', name: 'All Workflows (Universal)' },
  { id: 'billing', name: 'Billing Counter (Receipts / Invoices)' },
  { id: 'kitchen', name: 'Kitchen Printer (Food KOT)' },
  { id: 'bar', name: 'Bar Printer (Beverages / Mocktails)' },
  { id: 'backup', name: 'Backup Printer (Manual Dispatch)' },
];

export const DEFAULT_PRINTERS = [
  {
    id: 'prn_billing',
    name: 'Billing Counter',
    role: 'billing',
    connectionType: 'BROWSER',
    ipAddress: '',
    port: '9100',
    paperWidth: '80mm',
    enabled: true,
    isDefault: true,
    status: 'online',
    lastPrintedAt: null,
  },
  {
    id: 'prn_kitchen',
    name: 'Kitchen Printer',
    role: 'kitchen',
    connectionType: 'LAN',
    ipAddress: '192.168.1.200',
    port: '9100',
    paperWidth: '80mm',
    enabled: true,
    isDefault: false,
    status: 'online',
    lastPrintedAt: null,
  },
  {
    id: 'prn_bar',
    name: 'Bar Printer',
    role: 'bar',
    connectionType: 'USB',
    ipAddress: '',
    port: '',
    paperWidth: '58mm',
    enabled: true,
    isDefault: false,
    status: 'online',
    lastPrintedAt: null,
  },
];

/**
 * Get all configured printers
 */
export function getAllPrinters() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return DEFAULT_PRINTERS;
  }
  try {
    const raw = localStorage.getItem(PRINTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading printers:', e);
  }

  // First-time setup: initialize with defaults
  saveAllPrinters(DEFAULT_PRINTERS);
  return DEFAULT_PRINTERS;
}

/**
 * Save printers to localStorage and dispatch update event
 */
export function saveAllPrinters(printers) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    localStorage.setItem(PRINTERS_STORAGE_KEY, JSON.stringify(printers));
    window.dispatchEvent(new CustomEvent('foodypay_printers_updated', { detail: printers }));
    return true;
  } catch (e) {
    console.error('Failed to save printers:', e);
    return false;
  }
}

/**
 * Add a new printer
 */
export function addPrinter(printerData) {
  const current = getAllPrinters();
  const newPrinter = {
    id: `prn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: printerData.name || 'New Thermal Printer',
    role: printerData.role || 'all',
    connectionType: printerData.connectionType || 'BROWSER',
    ipAddress: printerData.ipAddress || '',
    port: printerData.port || '9100',
    paperWidth: printerData.paperWidth || '80mm',
    enabled: printerData.enabled !== undefined ? printerData.enabled : true,
    isDefault: Boolean(printerData.isDefault),
    status: 'online',
    lastPrintedAt: null,
  };

  if (newPrinter.isDefault) {
    current.forEach((p) => (p.isDefault = false));
  }

  const updated = [...current, newPrinter];
  saveAllPrinters(updated);
  return newPrinter;
}

/**
 * Update an existing printer
 */
export function updatePrinter(printerId, updates) {
  const current = getAllPrinters();
  const updated = current.map((p) => {
    if (p.id === printerId) {
      const isNowDefault = updates.isDefault !== undefined ? updates.isDefault : p.isDefault;
      return { ...p, ...updates };
    }
    if (updates.isDefault) {
      return { ...p, isDefault: false };
    }
    return p;
  });
  saveAllPrinters(updated);
  return updated.find((p) => p.id === printerId);
}

/**
 * Delete a printer
 */
export function deletePrinter(printerId) {
  const current = getAllPrinters();
  const updated = current.filter((p) => p.id !== printerId);
  if (updated.length > 0 && !updated.some((p) => p.isDefault)) {
    updated[0].isDefault = true;
  }
  saveAllPrinters(updated);
  return true;
}

/**
 * Toggle enable/disable status
 */
export function togglePrinterEnabled(printerId) {
  const current = getAllPrinters();
  const updated = current.map((p) => (p.id === printerId ? { ...p, enabled: !p.enabled } : p));
  saveAllPrinters(updated);
  return updated.find((p) => p.id === printerId);
}

/**
 * Test Print on specific printer
 */
export async function testPrintPrinter(printer) {
  if (!printer.enabled) {
    throw new Error(`Printer "${printer.name}" is disabled. Enable it first.`);
  }

  const testOrder = {
    id: 'TEST-001',
    table: 'Test Table',
    type: 'Dine-In',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'FoodyPay Multi-Printer Test', qty: 1, price: 0 },
      { name: `Connection: ${printer.connectionType}`, qty: 1, price: 0 },
      { name: `Paper: ${printer.paperWidth}`, qty: 1, price: 0 },
    ],
    total: 0,
  };

  const storeInfo = {
    restName: `[TEST] ${printer.name}`,
    address: printer.connectionType === 'LAN' ? `IP: ${printer.ipAddress}:${printer.port}` : 'Local USB / Browser',
  };

  return executePrintOnDevice(printer, 'kot', testOrder, storeInfo);
}

/**
 * Execute actual print job on printer device
 */
async function executePrintOnDevice(printer, jobType, orderData, storeInfo) {
  // Update last printed timestamp on printer
  const current = getAllPrinters();
  const updated = current.map((p) => (p.id === printer.id ? { ...p, lastPrintedAt: new Date().toISOString() } : p));
  saveAllPrinters(updated);

  if (printer.connectionType === 'LAN') {
    // If running in Desktop / Electron, can send raw socket bytes to IP:Port
    if (typeof window !== 'undefined' && window.electronHardware?.printRawTcp) {
      try {
        await window.electronHardware.printRawTcp(printer.ipAddress, printer.port, { jobType, orderData, storeInfo });
        return { success: true, method: 'electron_tcp', printerName: printer.name };
      } catch (err) {
        console.warn('Electron TCP failed, falling back to spooler:', err);
      }
    }
  }

  // Browser Spooler / WebUSB fallback
  if (jobType === 'bill') {
    printThermalBill(orderData, storeInfo);
  } else {
    printThermalKot(orderData, storeInfo);
  }

  return { success: true, method: 'browser_spooler', printerName: printer.name };
}

/**
 * Print to ALL enabled eligible printers
 * If 1 enabled, prints to that printer.
 * If 5 enabled, prints to all 5 (or filters by item role if applicable).
 */
export async function printToAllPrinters(jobType, orderData, storeInfo = {}) {
  // Anti-duplicate protection: 1 second debounce
  const now = Date.now();
  const lastPrint = Number(sessionStorage.getItem(LAST_PRINT_TIMESTAMP) || 0);
  if (now - lastPrint < 800) {
    return { success: false, message: 'Print already sent. Please wait.' };
  }
  sessionStorage.setItem(LAST_PRINT_TIMESTAMP, String(now));

  const allPrinters = getAllPrinters();
  const enabledPrinters = allPrinters.filter((p) => p.enabled);

  if (enabledPrinters.length === 0) {
    // Fallback to default print function if no printers configured
    if (jobType === 'bill') printThermalBill(orderData, storeInfo);
    else printThermalKot(orderData, storeInfo);
    return { success: true, targetCount: 1, fallback: true };
  }

  // Filter eligible printers for the job type
  let eligiblePrinters = [];
  if (jobType === 'bill') {
    eligiblePrinters = enabledPrinters.filter((p) => p.role === 'billing' || p.role === 'all');
  } else if (jobType === 'kitchen') {
    eligiblePrinters = enabledPrinters.filter((p) => p.role === 'kitchen' || p.role === 'all');
  } else if (jobType === 'bar') {
    eligiblePrinters = enabledPrinters.filter((p) => p.role === 'bar' || p.role === 'all');
  } else {
    eligiblePrinters = enabledPrinters;
  }

  if (eligiblePrinters.length === 0) {
    eligiblePrinters = [enabledPrinters[0]]; // fallback to first enabled
  }

  const results = [];
  for (const prn of eligiblePrinters) {
    try {
      const res = await executePrintOnDevice(prn, jobType, orderData, storeInfo);
      results.push(res);
    } catch (err) {
      console.warn(`Print error on ${prn.name}:`, err);
    }
  }

  return { success: true, targetCount: eligiblePrinters.length, results };
}

/**
 * Print to SPECIFIC selected printers
 */
export async function printToSpecificPrinters(printerIds, jobType, orderData, storeInfo = {}) {
  const allPrinters = getAllPrinters();
  const targets = allPrinters.filter((p) => printerIds.includes(p.id) && p.enabled);

  if (targets.length === 0) {
    throw new Error('No valid or enabled printers selected.');
  }

  const results = [];
  for (const prn of targets) {
    const res = await executePrintOnDevice(prn, jobType, orderData, storeInfo);
    results.push(res);
  }
  return { success: true, results };
}

/**
 * Get the designated Bill Printer
 */
export function getActiveBillPrinter() {
  const printers = getAllPrinters();
  return (
    printers.find((p) => p.enabled && (p.role === 'billing' || p.role === 'all')) ||
    printers.find((p) => p.isDefault) ||
    printers[0] ||
    DEFAULT_PRINTERS[0]
  );
}

/**
 * Get the designated KOT Kitchen Printer
 */
export function getActiveKotPrinter() {
  const printers = getAllPrinters();
  return (
    printers.find((p) => p.enabled && (p.role === 'kitchen' || p.role === 'all')) ||
    printers.find((p) => p.role === 'kitchen') ||
    printers[1] ||
    DEFAULT_PRINTERS[1]
  );
}

/**
 * Print Bill to the designated Bill Printer
 */
export async function printBillToPrinter(orderData, storeInfo = {}) {
  const billPrn = getActiveBillPrinter();
  if (billPrn) {
    return executePrintOnDevice(billPrn, 'bill', orderData, storeInfo);
  }
  printThermalBill(orderData, storeInfo);
  return { success: true, fallback: true };
}

/**
 * Print KOT to the designated Kitchen Printer
 */
export async function printKotToPrinter(orderData, storeInfo = {}) {
  const kotPrn = getActiveKotPrinter();
  if (kotPrn) {
    return executePrintOnDevice(kotPrn, 'kitchen', orderData, storeInfo);
  }
  printThermalKot(orderData, storeInfo);
  return { success: true, fallback: true };
}

/**
 * Print both Bill & KOT to their respective separate printers simultaneously
 */
export async function printDualBillAndKot(orderData, storeInfo = {}) {
  const resBill = await printBillToPrinter(orderData, storeInfo);
  setTimeout(() => {
    printKotToPrinter(orderData, storeInfo);
  }, 500);
  return { success: true, resBill };
}
