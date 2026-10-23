import express from 'express';
import net from 'net';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const router = express.Router();

/**
 * Helper to generate ESC/POS bytes for KOT
 */
function createEscPosKot(order, storeInfo = {}) {
  const restName = storeInfo.restName || storeInfo.businessName || order.restaurantName || 'FoodyPay';
  const tableName = order.table || order.tableNo || 'Table 1';
  const orderType = (order.type || 'Dine-In').toUpperCase();
  const orderNumber = order.orderNumber || order.orderId || (order._id ? '#FP-' + String(order._id).slice(-4) : order.id) || '#FP-1081';
  const items = Array.isArray(order.items) ? order.items : [];
  const dateStr = new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN');

  const ESC = '\x1B';
  const GS = '\x1D';

  let raw = '';
  raw += ESC + '@'; // Initialize
  raw += ESC + 'a' + '\x01'; // Center
  raw += GS + '!' + '\x11'; // Double size
  raw += `${restName}\n`;
  raw += GS + '!' + '\x00'; // Normal size
  raw += `KITCHEN ORDER TICKET (KOT)\n`;
  raw += `--------------------------------\n`;
  raw += ESC + 'a' + '\x00'; // Left align
  raw += `TABLE: ${tableName}  TYPE: ${orderType}\n`;
  raw += `ORDER: ${orderNumber}\n`;
  raw += `TIME:  ${dateStr}\n`;
  raw += `--------------------------------\n`;
  raw += `ITEM                      QTY\n`;
  raw += `--------------------------------\n`;

  let totalQty = 0;
  items.forEach((it) => {
    const isCancelled = Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled');
    const name = (isCancelled ? '[CANCEL] ' : '') + String(it.name || 'Item').slice(0, 22);
    const qty = String(it.qty || 1);
    totalQty += Number(it.qty || 1);
    const line = name.padEnd(24, ' ') + qty.padStart(6, ' ') + '\n';
    raw += line;
  });

  raw += `--------------------------------\n`;
  raw += `TOTAL ITEMS: ${totalQty}\n`;
  raw += `\n\n\n`;
  raw += GS + 'V' + '\x41' + '\x10'; // Cut paper

  return Buffer.from(raw, 'binary');
}

/**
 * Helper to generate text for Bill Receipt
 */
function createReceiptText(order, storeInfo = {}) {
  const restName = storeInfo.restName || storeInfo.businessName || 'FoodyPay Restaurant';
  const restPhone = storeInfo.restPhone || '9876543210';
  const tableName = order.table || 'Table 1';
  const orderNumber = order.orderNumber || order.orderId || '#FP-1081';
  const dateStr = new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN');
  const items = Array.isArray(order.items) ? order.items : [];

  let text = '';
  text += `================================\n`;
  text += `        ${restName}\n`;
  text += `        Ph: ${restPhone}\n`;
  text += `================================\n`;
  text += `ORDER: ${orderNumber}\n`;
  text += `TABLE: ${tableName}   ${(order.type || 'Dine-In').toUpperCase()}\n`;
  text += `DATE:  ${dateStr}\n`;
  if (order.customer && order.customer !== 'Walk-in Guest') {
    text += `CUST:  ${order.customer}\n`;
  }
  text += `--------------------------------\n`;
  text += `ITEM                QTY    PRICE\n`;
  text += `--------------------------------\n`;

  items.forEach((it) => {
    const name = String(it.name || 'Item').slice(0, 18).padEnd(19, ' ');
    const qty = String(it.qty || 1).padStart(3, ' ');
    const amt = String('₹' + ((it.price || 0) * (it.qty || 1))).padStart(8, ' ');
    text += `${name} ${qty} ${amt}\n`;
  });

  text += `--------------------------------\n`;
  text += `Subtotal:               ₹${order.subtotal || 0}\n`;
  if (order.preTax) {
    text += `Pre-Tax (Taxable):      ₹${Number(order.preTax).toFixed(2)}\n`;
    text += `SGST (2.5%):            ₹${Number((order.tax || 0) / 2).toFixed(2)}\n`;
    text += `CGST (2.5%):            ₹${Number((order.tax || 0) / 2).toFixed(2)}\n`;
  }
  if (order.discount > 0) {
    text += `Discount:              -₹${order.discount}\n`;
  }
  text += `================================\n`;
  text += `GRAND TOTAL:            ₹${order.total || order.subtotal || 0}\n`;
  text += `================================\n`;
  text += `      Thank You! Visit Again    \n`;
  text += `       Powered by FoodyPay      \n\n\n\n\n`;

  return text;
}

/**
 * 1. POST /api/print/lan
 * Direct Silent Print to LAN Thermal Printer (Raw TCP port 9100)
 */
router.post('/lan', async (req, res) => {
  const { ip, port = 9100, order, storeControls = {} } = req.body;

  if (!ip) {
    return res.status(400).json({ success: false, message: 'Printer IP address is required' });
  }

  try {
    const escPosBuffer = createEscPosKot(order || {}, storeControls);
    const client = new net.Socket();
    client.setTimeout(4500);

    client.connect(Number(port) || 9100, ip, () => {
      client.write(escPosBuffer, () => {
        client.end();
        res.json({
          success: true,
          message: `Directly printed KOT to LAN printer at ${ip}:${port}`,
          ip,
          port,
        });
      });
    });

    client.on('error', (err) => {
      client.destroy();
      console.warn(`[printRoutes] LAN print socket error on ${ip}:${port}:`, err.message);
      res.status(500).json({ success: false, message: `LAN printer error (${ip}:${port}): ${err.message}` });
    });

    client.on('timeout', () => {
      client.destroy();
      res.status(504).json({ success: false, message: `Connection timeout to LAN printer (${ip}:${port})` });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Helper to generate simple readable text for KOT (for Windows Out-Printer)
 */
function createKotText(order, storeInfo = {}) {
  const restName = storeInfo.restName || storeInfo.businessName || order.restaurantName || 'FoodyPay';
  const tableName = order.table || order.tableNo || 'Table 1';
  const orderType = (order.type || 'Dine-In').toUpperCase();
  const orderNumber = order.orderNumber || order.orderId || (order._id ? '#FP-' + String(order._id).slice(-4) : order.id) || '#FP-1081';
  const items = Array.isArray(order.items) ? order.items : [];
  const dateStr = new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN');

  let text = '';
  text += `================================\n`;
  text += `        ${restName}\n`;
  text += `   KITCHEN ORDER TICKET (KOT)\n`;
  text += `================================\n`;
  text += `ORDER: ${orderNumber}\n`;
  text += `TABLE: ${tableName}   ${orderType}\n`;
  text += `TIME:  ${dateStr}\n`;
  text += `--------------------------------\n`;
  text += `ITEM                       QTY\n`;
  text += `--------------------------------\n`;

  let totalQty = 0;
  items.forEach((it) => {
    const isCancelled = Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled');
    const name = ((isCancelled ? '[CANCEL] ' : '') + String(it.name || 'Item')).slice(0, 24).padEnd(25, ' ');
    const qty = String(it.qty || 1).padStart(5, ' ');
    totalQty += Number(it.qty || 1);
    text += `${name} x${qty}\n`;
    if (it.notes || it.customization) {
      text += ` * ${it.notes || it.customization}\n`;
    }
  });

  text += `--------------------------------\n`;
  text += `TOTAL ITEMS: ${totalQty}\n`;
  text += `================================\n\n\n\n\n`;
  return text;
}

/**
 * 2. POST /api/print/windows
 * Direct Silent Print to a Specific Windows Printer by Name (TVS-E RP 3230 or Kitchen)
 */
router.post('/windows', async (req, res) => {
  const { printerName, type = 'bill', order, storeControls = {} } = req.body;

  try {
    const isKot = type === 'kot';
    const textContent = isKot ? createKotText(order || {}, storeControls) : createReceiptText(order || {}, storeControls);

    if (process.platform === 'win32') {
      const tempFile = path.join(os.tmpdir(), `foodypay_print_${Date.now()}.txt`);
      fs.writeFileSync(tempFile, textContent, 'utf-8');

      // Use PowerShell Out-Printer -Name if printerName is provided, else fallback to default printer
      const printerArg = printerName ? `-Name '${printerName.replace(/'/g, "''")}'` : '';
      const psCommand = `powershell -NoProfile -Command "$ErrorActionPreference='Stop'; try { Get-Content -Path '${tempFile}' | Out-Printer ${printerArg}; Remove-Item -Path '${tempFile}' -Force } catch { Get-Content -Path '${tempFile}' | Out-Printer; Remove-Item -Path '${tempFile}' -Force }"`;

      exec(psCommand, (err) => {
        if (err) {
          console.warn(`[printRoutes] Out-Printer warning for ${printerName}:`, err.message);
          return res.status(500).json({ success: false, message: `Print error: ${err.message}` });
        }
        res.json({ success: true, message: `Printed directly to Windows printer: ${printerName || 'Default'}` });
      });
    } else {
      res.json({ success: true, message: 'Mock printed on non-windows platform' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 3. POST /api/print/bill
 * Direct Silent Print (Backward compatibility)
 */
router.post('/bill', async (req, res) => {
  const { printerName, order, storeControls = {} } = req.body;

  try {
    const receiptText = createReceiptText(order || {}, storeControls);

    if (process.platform === 'win32') {
      const tempFile = path.join(os.tmpdir(), `foodypay_bill_${Date.now()}.txt`);
      fs.writeFileSync(tempFile, receiptText, 'utf-8');

      const printerArg = printerName ? `-Name '${printerName.replace(/'/g, "''")}'` : '';
      exec(`powershell -NoProfile -Command "Get-Content -Path '${tempFile}' | Out-Printer ${printerArg}; Remove-Item -Path '${tempFile}'"`, (err) => {
        if (err) {
          console.warn('[printRoutes] Windows Out-Printer warning:', err.message);
          return res.status(500).json({ success: false, message: `Print error: ${err.message}` });
        }
        res.json({ success: true, message: `Bill printed directly to ${printerName || 'Default Printer'}` });
      });
    } else {
      const tempFile = path.join(os.tmpdir(), `foodypay_bill_${Date.now()}.txt`);
      fs.writeFileSync(tempFile, receiptText, 'utf-8');
      exec(`lp "${tempFile}" && rm "${tempFile}"`, (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Bill printed via lp' });
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 3. GET /api/print/status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    lanPrintSupported: true,
    windowsSilentPrintSupported: process.platform === 'win32',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 4. GET /api/print/printers
 */
router.get('/printers', (req, res) => {
  if (process.platform === 'win32') {
    exec('powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"', (err, stdout) => {
      if (err) {
        return res.json({ success: true, printers: ['Default Printer'] });
      }
      const printers = stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      res.json({ success: true, printers: printers.length ? printers : ['Default Printer'] });
    });
  } else {
    res.json({ success: true, printers: ['Default Printer'] });
  }
});

export default router;
