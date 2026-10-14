/**
 * Thermal Printing Utility for FoodyPay POS
 * Compatible with standard 58mm (2-inch, ~32 cols) and 80mm (3-inch, ~48 cols) thermal receipt printers,
 * as well as desktop A4/Laser printers.
 */

function formatPrintDate(dateInput) {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleString();
    
    // Format: D/M/YYYY  h:mm a (matching image: 4/6/3036  12:01 am)
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day}/${month}/${year}  ${hours}:${mins} ${ampm}`;
  } catch  {
    return '';
  }
}

function formatKotDateTime(dateInput) {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return { date: '12/10/2026', time: '3:51 AM' };

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${mins} ${ampm}`
    };
  } catch  {
    return { date: '', time: '' };
  }
}

/**
 * Print standard Kitchen Order Ticket (KOT)
 * Matches the exact thermal KOT slip format from user reference image.
 */
export function printThermalKot(order, storeInfo = {}) {
  if (!order) return;

  const restName = storeInfo.restName || storeInfo.businessName || order.restaurantName || 'FoodyPay';
  const tableName = order.table || order.tableNo || 'Table 1';
  const orderType = (order.type || 'Dine-In').toUpperCase();
  const orderNumber = order.orderNumber || order.orderId || (order._id ? '#FP-' + String(order._id).slice(-4) : order.id) || '#FP-1081';
  const dt = formatKotDateTime(order.createdAt || order.date);
  const items = Array.isArray(order.items) ? order.items : [];
  const hasCancelled = items.some((it) => Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled'));
  const activeItems = items.filter((it) => !it.isCancelled && !it.cancelled && it.status !== 'cancelled');
  const totalItemCount = activeItems.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
  const cancelledCount = items.length - activeItems.length;

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '1px';
  printFrame.style.height = '1px';
  printFrame.style.opacity = '0.01';
  printFrame.style.border = 'none';
  printFrame.style.pointerEvents = 'none';
  document.body.appendChild(printFrame);

  const itemsHtml = items.map((it) => {
    const isCancelled = Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled');
    const name = String(it.name || it.title || 'Item').toUpperCase();
    const qty = it.qty || it.quantity || 1;
    const notes = it.notes || it.customization ? `<div class="item-notes">* ${it.notes || it.customization}</div>` : '';
    const cancelBadge = isCancelled ? ` <span style="color:#DC2626; font-size:11px; font-weight:900; background:#FEE2E2; border:1px solid #FCA5A5; padding:1px 5px; border-radius:4px; text-decoration:none !important; display:inline-block;">*** CANCELLED ***</span>` : '';
    const textStyle = isCancelled ? 'text-decoration: line-through; text-decoration-thickness: 2px; opacity: 0.8; color: #DC2626; font-weight: 900;' : '';
    return `
      <div class="item-row" style="${textStyle}">
        <div class="item-name">${name}${cancelBadge}${notes}</div>
        <div class="item-qty">&times; ${qty}</div>
      </div>
    `;
  }).join('');

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>KOT - ${tableName}</title>
        <style>
          @page {
            size: auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 13.5px;
            color: #000000;
            background: #FFFFFF;
            width: 100%;
            max-width: 76mm; /* Standard 58mm & 80mm thermal fit */
            padding: 10px 12px;
            margin: 0 auto;
            line-height: 1.35;
          }
          .text-center {
            text-align: center;
          }
          .store-name {
            font-size: 21px;
            font-weight: 800;
            letter-spacing: -0.3px;
            margin-bottom: 2px;
          }
          .kot-subtitle {
            font-size: 11.5px;
            font-weight: 800;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
          }
          .thick-divider {
            border-top: 2px solid #000000;
            margin: 8px 0;
          }
          .light-divider {
            border-top: 1px solid #CBD5E1;
            margin: 8px 0;
          }
          .meta-grid {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
          }
          .meta-col-left {
            text-align: left;
          }
          .meta-col-right {
            text-align: right;
          }
          .meta-label {
            font-size: 10.5px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .meta-val-large {
            font-size: 15px;
            font-weight: 900;
            color: #000000;
            margin-bottom: 2px;
          }
          .meta-val-sub {
            font-size: 14px;
            font-weight: 800;
            color: #000000;
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.5px;
            padding: 4px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 8px 0;
            font-size: 15px;
            font-weight: 900;
          }
          .item-name {
            flex: 1;
            padding-right: 8px;
            word-break: break-word;
          }
          .item-qty {
            flex: 0 0 45px;
            text-align: right;
            font-size: 15px;
            font-weight: 900;
            white-space: nowrap;
          }
          .item-notes {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            margin-top: 2px;
            text-transform: none;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 0.3px;
            padding: 4px 0;
          }
          .total-val {
            font-size: 15px;
            font-weight: 900;
          }
          .powered-footer {
            text-align: center;
            font-size: 11.5px;
            font-weight: 600;
            color: #475569;
            margin-top: 10px;
            letter-spacing: 0.2px;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="store-name">${restName}</div>
          <div class="kot-subtitle" style="${hasCancelled ? 'color: #DC2626; font-weight: 900;' : ''}">${hasCancelled ? '⚠️ CANCELLED / MODIFIED KOT' : 'KITCHEN ORDER TICKET'}</div>
        </div>

        <div class="thick-divider"></div>

        <div class="meta-grid">
          <div class="meta-col-left">
            <div class="meta-label">TABLE &amp; TYPE</div>
            <div class="meta-val-large">${tableName}</div>
            <div class="meta-val-sub">${orderType}</div>
          </div>
          <div class="meta-col-right">
            <div class="meta-label">ORDER NO</div>
            <div class="meta-val-large" style="font-size: 16px; font-weight: 900; color: #000000;">${orderNumber}</div>
            <div class="meta-val-sub" style="font-size: 11px;">${dt.date} ${dt.time}</div>
          </div>
        </div>

        <div class="thick-divider"></div>

        <div class="items-header">
          <span>ITEM</span>
          <span>QTY</span>
        </div>

        <div class="light-divider"></div>

        <div class="items-list">
          ${itemsHtml}
        </div>

        <div class="thick-divider"></div>

        <div class="total-row">
          <span>TOTAL ACTIVE ITEMS</span>
          <span class="total-val">${totalItemCount}${cancelledCount > 0 ? ` (${cancelledCount} Cancelled)` : ''}</span>
        </div>

        <div class="thick-divider"></div>

        <div class="powered-footer">
          Powered by FoodyPay
        </div>
      </body>
    </html>
  `);
  doc.close();

  const triggerPrint = () => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (err) {
      console.warn('[thermalPrinter] KOT print frame error:', err);
    }
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 2500);
  };

  setTimeout(triggerPrint, 250);
}

function formatReceiptDateTime(dateInput) {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '12/10/2026, 3:51 AM';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}/${month}/${year}, ${hours}:${mins} ${period}`;
  } catch  {
    return '12/10/2026, 3:51 AM';
  }
}

/**
 * Print standard Customer Bill / Final Receipt
 * Formatted cleanly with restaurant name, contact, metadata, items, grand total, and payment status
 */
export function printThermalReceipt(order, storeInfo = {}) {
  if (!order) return;

  const restName = storeInfo.restName || storeInfo.businessName || order.restaurantName || 'FoodyPay';
  const restPhone = storeInfo.phone || storeInfo.contactPhone || order.storePhone || storeInfo.mobile || '+91 7496888449';
  const tableName = String(order.table || order.tableNo || order.tableName || 'Cafe Table 1').replace(/tabel/gi, 'Table');
  const orderType = order.type || order.orderType || 'Dine-In';
  const orderNumber = order.orderNumber || order.orderId || (order._id ? '#FP-' + String(order._id).slice(-4) : order.id) || '#FP-1081';
  const dateTimeStr = formatReceiptDateTime(order.createdAt || order.date);
  
  const customerName = order.customer || order.customerName || order.custName || '';
  const customerPhone = order.phone || order.customerPhone || order.custPhone || '';

  const items = Array.isArray(order.items) ? order.items : [];
  const activeItems = items.filter((it) => !it.isCancelled && !it.cancelled && it.status !== 'cancelled');
  const cancelledItems = items.filter((it) => Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled'));
  const totalItemCount = activeItems.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
  
  // Subtotal calculated strictly from active items (cancelled items are excluded from total)
  const computedSubtotal = activeItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || it.quantity || 1)), 0);
  const subtotal = order.subtotal !== undefined && computedSubtotal === 0 ? Number(order.subtotal) : computedSubtotal;
  const discount = Number(order.discount || 0);
  
  // Tax / GST Calculation (Inclusive GST: Catalog price = Grand Total)
  const gstRate = Number(storeInfo.gstPercent !== undefined ? storeInfo.gstPercent : (order.gstPercent !== undefined ? order.gstPercent : 5));
  const netPayable = order.total !== undefined ? Number(order.total) : Math.max(0, subtotal - discount);
  let taxableBase = order.taxableBase !== undefined ? Number(order.taxableBase) : (order.preTax !== undefined ? Number(order.preTax) : 0);
  let tax = Number(order.tax !== undefined ? order.tax : 0);

  if (gstRate > 0) {
    if (!taxableBase || taxableBase === netPayable || tax === 0) {
      taxableBase = Math.round((netPayable / (1 + gstRate / 100)) * 100) / 100;
      tax = Math.round((netPayable - taxableBase) * 100) / 100;
    }
  } else {
    taxableBase = netPayable;
    tax = 0;
  }
  const grandTotal = netPayable;

  const cgstRate = (gstRate / 2).toFixed(1);
  const sgstRate = (gstRate / 2).toFixed(1);
  const cgstAmount = (tax / 2).toFixed(2);
  const sgstAmount = (tax - Number(cgstAmount)).toFixed(2);
  // Precise payment status detection: Only marked PAID after cashier settlement
  const isDue = Boolean(
    order.paymentStatus === 'due' ||
    order.status === 'due' ||
    String(order.paymentMode || '').toLowerCase() === 'khata' ||
    order.dueMarkedAt
  );

  const isActuallyPaid = Boolean(
    !isDue && (
      order.isPaid === true ||
      order.isPaid === 'true' ||
      String(order.paymentStatus || '').toLowerCase().startsWith('paid') ||
      order.paymentStatus === 'completed'
    ) &&
    order.paymentStatus !== 'unpaid' &&
    order.paymentStatus !== 'pending' &&
    order.isPaid !== false
  );

  // Resolved payment badge text, CSS class, receipt header title & notice
  let paymentBadgeText = '⏳ UNPAID / PAYMENT PENDING';
  let paymentBadgeClass = 'status-unpaid';
  let receiptTitleText = 'ESTIMATE BILL (UNPAID)';
  let paymentNoticeText = '*** ESTIMATE BILL - PLEASE PAY AT COUNTER ***';

  if (isActuallyPaid) {
    paymentBadgeClass = 'status-paid';
    receiptTitleText = 'TAX INVOICE / PAYMENT RECEIPT';
    paymentNoticeText = '*** PAYMENT RECEIVED - THANK YOU! ***';
    const pStatus = String(order.paymentStatus || '').toLowerCase();
    const pMode = String(order.paymentMode || '').toLowerCase();
    const pLabel = String(order.paymentLabel || '');

    if (pStatus === 'paid-cash' || pMode === 'cash' || pLabel.toLowerCase().includes('cash')) {
      paymentBadgeText = '✓ PAID VIA CASH';
    } else if (pStatus === 'paid-upi' || pMode === 'upi' || pLabel.toLowerCase().includes('upi')) {
      paymentBadgeText = '✓ PAID VIA ONLINE UPI';
    } else if (pStatus === 'paid-card' || pMode === 'card' || pLabel.toLowerCase().includes('card')) {
      paymentBadgeText = '✓ PAID VIA CARD (POS SWIPE)';
    } else {
      paymentBadgeText = '✓ PAID / SETTLED';
    }
  } else if (isDue) {
    paymentBadgeClass = 'status-due';
    receiptTitleText = 'KHATA / CREDIT BILL';
    paymentBadgeText = '⚠️ UNPAID / DUE (KHATA ACCOUNT)';
    paymentNoticeText = '*** RECORDED IN KHATA (PAY LATER) ***';
  } else {
    paymentBadgeClass = 'status-unpaid';
    receiptTitleText = 'ESTIMATE BILL (UNPAID)';
    paymentBadgeText = '⏳ UNPAID / PAYMENT PENDING';
    paymentNoticeText = '*** ESTIMATE BILL - PLEASE PAY AT COUNTER ***';
  }

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '1px';
  printFrame.style.height = '1px';
  printFrame.style.opacity = '0.01';
  printFrame.style.border = 'none';
  printFrame.style.pointerEvents = 'none';
  document.body.appendChild(printFrame);

  const itemsHtml = items.map((it) => {
    const isCancelled = Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled');
    const name = String(it.name || it.title || 'Item').toUpperCase();
    const qty = Number(it.qty || it.quantity || 1);
    const unitPrice = Number(it.price || 0);
    const lineTotal = (unitPrice * qty).toFixed(2);
    
    if (isCancelled) {
      return `
        <div class="item-row item-cancelled" style="text-decoration: line-through; text-decoration-thickness: 2px; color: #DC2626; opacity: 0.8; font-weight: 700;">
          <div class="col-item">${name} <span style="font-size: 10px; font-weight: 900; background: #FEE2E2; border: 1px solid #FCA5A5; padding: 1px 4px; border-radius: 4px; text-decoration: none !important; display: inline-block;">[CANCELLED]</span></div>
          <div class="col-qty">${qty}</div>
          <div class="col-price" style="text-decoration: line-through;">₹${lineTotal}</div>
        </div>
      `;
    }

    return `
      <div class="item-row">
        <div class="col-item">${name}</div>
        <div class="col-qty">${qty}</div>
        <div class="col-price">₹${lineTotal}</div>
      </div>
    `;
  }).join('');

  const doc = printFrame.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - ${tableName}</title>
        <style>
          @page {
            size: auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 13px;
            color: #000000;
            background: #FFFFFF;
            width: 100%;
            max-width: 76mm;
            padding: 10px 12px;
            margin: 0 auto;
            line-height: 1.35;
          }
          .text-center {
            text-align: center;
          }
          .store-header {
            text-align: center;
            margin-bottom: 6px;
          }
          .store-name {
            font-size: 19px;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.2px;
          }
          .store-phone {
            font-size: 12px;
            font-weight: 600;
            color: #334155;
            margin-top: 2px;
          }
          .thick-divider {
            border-top: 2px solid #000000;
            margin: 8px 0;
          }
          .light-divider {
            border-top: 1px solid #CBD5E1;
            margin: 6px 0;
          }
          .receipt-title {
            text-align: center;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #0F172A;
            margin: 4px 0 6px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 3.5px 0;
            font-size: 12.5px;
          }
          .meta-label {
            color: #64748B;
            font-weight: 600;
          }
          .meta-value {
            color: #0F172A;
            font-weight: 600;
            text-align: right;
          }
          .meta-value-bold {
            color: #000000;
            font-weight: 800;
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            font-weight: 800;
            color: #0F172A;
            padding: 2px 0;
          }
          .col-item {
            flex: 1;
            text-align: left;
            word-break: break-word;
          }
          .col-qty {
            flex: 0 0 50px;
            text-align: right;
            padding-right: 12px;
            font-weight: 700;
          }
          .col-price {
            flex: 0 0 70px;
            text-align: right;
            font-weight: 800;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 6px 0;
            font-size: 13px;
            font-weight: 700;
            color: #0F172A;
          }
          .grand-total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 16px;
            font-weight: 900;
            color: #0F172A;
            margin: 6px 0 8px 0;
          }
          .status-pill {
            width: 100%;
            padding: 8px 4px;
            border-radius: 6px;
            text-align: center;
            font-size: 13.5px;
            font-weight: 900;
            letter-spacing: 0.3px;
            margin: 8px 0 3px 0;
          }
          .status-paid {
            background: #ECFDF5;
            color: #059669;
            border: 2px solid #059669;
          }
          .status-unpaid {
            background: #FFFBEB;
            color: #B45309;
            border: 2px solid #F59E0B;
          }
          .status-due {
            background: #FFF7ED;
            color: #C2410C;
            border: 2px solid #EA580C;
          }
          .status-notice {
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .status-paid-notice {
            color: #059669;
          }
          .status-unpaid-notice {
            color: #B45309;
          }
          .status-due-notice {
            color: #C2410C;
          }
          .footer-block {
            text-align: center;
            margin-top: 8px;
          }
          .footer-thanks {
            font-size: 13.5px;
            font-weight: 800;
            color: #0F172A;
          }
          .footer-visit {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            margin-top: 2px;
          }
          .footer-powered {
            font-size: 10.5px;
            font-weight: 600;
            color: #64748B;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="store-header">
          <div class="store-name">${restName}</div>
          <div class="store-phone">Ph: ${restPhone}</div>
        </div>

        <div class="thick-divider"></div>

        <div class="receipt-title">${receiptTitleText}</div>

        <div class="meta-row">
          <span class="meta-label">Order No</span>
          <span class="meta-value meta-value-bold" style="font-size: 14px; color: #000000;">${orderNumber}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Order Type</span>
          <span class="meta-value meta-value-bold">${orderType}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Table</span>
          <span class="meta-value meta-value-bold">${tableName}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date &amp; Time</span>
          <span class="meta-value">${dateTimeStr}</span>
        </div>
        ${customerName ? `
          <div class="meta-row">
            <span class="meta-label">Customer</span>
            <span class="meta-value">${customerName}</span>
          </div>
        ` : ''}
        ${customerPhone ? `
          <div class="meta-row">
            <span class="meta-label">Phone</span>
            <span class="meta-value">${customerPhone}</span>
          </div>
        ` : ''}

        <div class="thick-divider"></div>

        <div class="items-header">
          <span class="col-item">ITEM</span>
          <span class="col-qty">QTY</span>
          <span class="col-price">PRICE</span>
        </div>

        <div class="light-divider"></div>

        <div class="items-list">
          ${itemsHtml}
        </div>

        <div class="thick-divider"></div>

        <div class="meta-row">
          <span class="meta-label">Active Items</span>
          <span class="meta-value meta-value-bold">${totalItemCount}${cancelledItems.length > 0 ? ` (${cancelledItems.length} Cancelled)` : ''}</span>
        </div>

        <div class="meta-row">
          <span class="meta-label">Sub Total</span>
          <span class="meta-value meta-value-bold">₹${taxableBase.toFixed(2)}</span>
        </div>

        ${discount > 0 ? `
          <div class="meta-row" style="color: #16A34A;">
            <span class="meta-label">Discount</span>
            <span class="meta-value">-₹${discount.toFixed(2)}</span>
          </div>
        ` : ''}

        ${gstRate > 0 ? `
          <div class="meta-row" style="font-size: 12px; color: #1E293B;">
            <span class="meta-label">SGST ${sgstRate}%</span>
            <span class="meta-value">₹${sgstAmount}</span>
          </div>
          <div class="meta-row" style="font-size: 12px; color: #1E293B;">
            <span class="meta-label">CGST ${cgstRate}%</span>
            <span class="meta-value">₹${cgstAmount}</span>
          </div>
        ` : ''}

        <div class="thick-divider"></div>

        <div class="grand-total-row">
          <span>GRAND TOTAL</span>
          <span>₹${Math.round(grandTotal).toFixed(2)}</span>
        </div>

        <div class="status-pill ${paymentBadgeClass}">
          ${paymentBadgeText}
        </div>
        <div class="status-notice ${paymentBadgeClass}-notice">
          ${paymentNoticeText}
        </div>

        <div class="light-divider"></div>

        <div class="footer-block">
          <div class="footer-thanks">Thank You!</div>
          <div class="footer-visit">Visit Again</div>
          <div class="footer-powered">Powered by FoodyPay</div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  const triggerPrint = () => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (err) {
      console.warn('[thermalPrinter] Print frame error:', err);
    }
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 2500);
  };

  setTimeout(triggerPrint, 250);
}

/**
 * ============================================================================
 * DUAL PRINTER & LAN / NETWORK THERMAL PRINTER CONFIGURATION & DISPATCH
 * ============================================================================
 * Supports:
 * - Printer 1: Billing Counter Printer (USB / Default OS / Network IP)
 * - Printer 2: Kitchen / KOT Printer (Network LAN / WiFi IP, Subnet, Gateway, Port 9100)
 * - Direct 2-copy printing on single trigger (1 Bill + 1 KOT or Dual Copies)
 */

export const DEFAULT_PRINTER_CONFIG = {
  directPrintEnabled: true,
  autoPrintOnOrder: false, // User decides whether to print KOT, Bill, or no print on order creation
  dualPrintEnabled: false, // Never print 2 together; print only the requested slip
  
  // Printer 1: Main Billing Counter Printer
  printer1: {
    name: 'Counter Billing Printer',
    type: 'browser', // 'browser' | 'network'
    role: 'bill', // 'bill' | 'kot' | 'both'
    ip: '192.168.1.100',
    port: 9100,
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    macAddress: '',
    paperWidth: '80mm', // '58mm' | '80mm'
    isDefault: true,
  },

  // Printer 2: Kitchen / LAN / WiFi Network Printer
  printer2: {
    name: 'Kitchen / KOT LAN Printer',
    type: 'network', // 'network' | 'browser'
    role: 'kot', // 'kot' | 'bill' | 'both'
    ip: '192.168.1.200',
    port: 9100,
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    macAddress: '',
    paperWidth: '80mm', // '58mm' | '80mm'
    isDefault: false,
  }
};

export function getPrinterSettings() {
  try {
    const raw = localStorage.getItem('foodypay_printer_settings_v1');
    if (raw) {
      return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(raw) };
    }
  } catch  {}
  return DEFAULT_PRINTER_CONFIG;
}

export function savePrinterSettings(settings) {
  try {
    localStorage.setItem('foodypay_printer_settings_v1', JSON.stringify(settings));
    window.dispatchEvent(new Event('foodypay_printer_updated'));
    return true;
  } catch  {
    return false;
  }
}

/**
 * Direct ESC/POS payload generator for Raw TCP/Network Printing
 */
export function generateEscPosKot(order, storeInfo = {}) {
  const restName = storeInfo.restName || storeInfo.businessName || 'FoodyPay';
  const tableName = order.table || 'Table 1';
  const orderType = (order.type || 'Dine-In').toUpperCase();
  const orderNumber = order.orderNumber || order.orderId || (order._id ? '#FP-' + String(order._id).slice(-4) : order.id) || '#FP-1081';
  const dt = formatKotDateTime(order.createdAt || order.date);
  const items = Array.isArray(order.items) ? order.items : [];

  const hasCancelled = items.some((it) => Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled'));
  const activeItems = items.filter((it) => !it.isCancelled && !it.cancelled && it.status !== 'cancelled');
  const totalActiveQty = activeItems.reduce((s, i) => s + Number(i.qty || 1), 0);
  const cancelledQty = items.length - activeItems.length;

  let text = `\x1B\x40`; // Initialize printer
  text += `\x1B\x61\x01`; // Center align
  text += `\x1D\x21\x11${restName}\n`; // Double size
  text += `\x1D\x21\x00${hasCancelled ? '⚠️ CANCELLED / MODIFIED KOT' : 'KITCHEN ORDER TICKET (KOT)'}\n`;
  text += `--------------------------------\n`;
  text += `\x1B\x61\x00`; // Left align
  text += `ORDER NO: ${orderNumber}\n`;
  text += `TABLE: ${tableName}   TYPE: ${orderType}\n`;
  text += `TIME: ${dt.date} ${dt.time}\n`;
  text += `--------------------------------\n`;
  text += `ITEM                       QTY\n`;
  text += `--------------------------------\n`;

  items.forEach((it) => {
    const isCancelled = Boolean(it.isCancelled || it.cancelled || it.status === 'cancelled');
    const baseName = String(it.name || 'Item').toUpperCase();
    const name = (isCancelled ? `[CANCELLED] ${baseName}` : baseName).slice(0, 24);
    const qty = String(it.qty || 1).padStart(4, ' ');
    text += `${name.padEnd(24, ' ')} x${qty}\n`;
  });

  text += `--------------------------------\n`;
  text += `TOTAL ACTIVE ITEMS: ${totalActiveQty}${cancelledQty > 0 ? ` (${cancelledQty} Cancelled)` : ''}\n`;
  text += `\n\n\n\x1D\x56\x41\x10`; // Full Cut with feed
  return text;
}

/**
 * Direct Print Dual Order (1 Click -> Prints on Printer 1 & Printer 2)
 * Dispatches Bill to Printer 1 and KOT to Printer 2 simultaneously.
 */
export async function executeDualPrint(order, storeInfo = {}, targetMode = 'both') {
  if (!order) return { success: false, message: 'No order data' };
  const settings = getPrinterSettings();

  // If Network LAN print is configured for Printer 2 (Kitchen), attempt local network bridge / fetch
  if (settings.printer2?.type === 'network' && settings.printer2?.ip) {
    try {
      const kotData = generateEscPosKot(order, storeInfo);
      // Attempt sending to local network printer gateway / raw socket port
      fetch(`http://${settings.printer2.ip}:${settings.printer2.port || 9100}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: kotData,
        mode: 'no-cors'
      }).catch(() => {
        // Fallback: browser frame
      });
    } catch  {}
  }

  // Printer 1: Print Customer Bill / Receipt
  if (targetMode === 'both' || targetMode === 'bill') {
    printThermalReceipt(order, storeInfo);
  }

  // Printer 2: Print Kitchen KOT Slip
  if (targetMode === 'both' || targetMode === 'kot') {
    setTimeout(() => {
      printThermalKot(order, storeInfo);
    }, 600);
  }

  return { success: true };
}

export const printThermalBill = printThermalReceipt;
