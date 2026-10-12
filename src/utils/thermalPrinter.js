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
  } catch (e) {
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
  } catch (e) {
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
  const dt = formatKotDateTime(order.createdAt || order.date);
  const items = Array.isArray(order.items) ? order.items : [];
  const totalItemCount = items.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0px';
  printFrame.style.height = '0px';
  printFrame.style.border = 'none';
  document.body.appendChild(printFrame);

  const itemsHtml = items.map((it) => {
    const name = String(it.name || it.title || 'Item').toUpperCase();
    const qty = it.qty || it.quantity || 1;
    const notes = it.notes || it.customization ? `<div class="item-notes">* ${it.notes || it.customization}</div>` : '';
    return `
      <div class="item-row">
        <div class="item-name">${name}${notes}</div>
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
          <div class="kot-subtitle">KITCHEN ORDER TICKET</div>
        </div>

        <div class="thick-divider"></div>

        <div class="meta-grid">
          <div class="meta-col-left">
            <div class="meta-label">ORDER TYPE</div>
            <div class="meta-val-large">${orderType}</div>
            <div class="meta-val-sub">${tableName}</div>
          </div>
          <div class="meta-col-right">
            <div class="meta-label">DATE &amp; TIME</div>
            <div class="meta-val-large">${dt.date}</div>
            <div class="meta-val-sub">${dt.time}</div>
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
          <span>TOTAL ITEMS</span>
          <span class="total-val">${totalItemCount}</span>
        </div>

        <div class="thick-divider"></div>

        <div class="powered-footer">
          Powered by FoodyPay
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 1500);
  }, 250);
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
  } catch (e) {
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
  const dateTimeStr = formatReceiptDateTime(order.createdAt || order.date);
  
  const customerName = order.customer || order.customerName || order.custName || '';
  const customerPhone = order.phone || order.customerPhone || order.custPhone || '';

  const items = Array.isArray(order.items) ? order.items : [];
  const totalItemCount = items.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
  
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || order.gst || 0);
  const grandTotal = Number(order.total || (subtotal - discount + tax) || 0);
  
  const isPaid = Boolean(order.isPaid || order.status === 'completed' || order.status === 'paid' || (order.paymentMode && order.paymentMode.toLowerCase() !== 'unpaid' && order.paymentMode.toLowerCase() !== 'khata'));

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0px';
  printFrame.style.height = '0px';
  printFrame.style.border = 'none';
  document.body.appendChild(printFrame);

  const itemsHtml = items.map((it) => {
    const name = String(it.name || it.title || 'Item').toUpperCase();
    const qty = Number(it.qty || it.quantity || 1);
    const unitPrice = Number(it.price || 0);
    const lineTotal = (unitPrice * qty).toFixed(2);
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
            padding: 7px 0;
            border-radius: 6px;
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.3px;
            margin: 8px 0;
          }
          .status-paid {
            background: #ECFDF5;
            color: #059669;
            border: 1px solid #A7F3D0;
          }
          .status-unpaid {
            background: #FFFBEB;
            color: #D97706;
            border: 1px solid #FDE68A;
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

        <div class="receipt-title">BILL / RECEIPT</div>

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
          <span class="meta-label">Total Items</span>
          <span class="meta-value meta-value-bold">${totalItemCount}</span>
        </div>

        <div class="grand-total-row">
          <span>GRAND TOTAL</span>
          <span>₹${grandTotal.toFixed(2)}</span>
        </div>

        <div class="status-pill ${isPaid ? 'status-paid' : 'status-unpaid'}">
          ${isPaid ? '✓ PAID / SETTLED' : '⏳ UNPAID / PENDING'}
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

  setTimeout(() => {
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 1500);
  }, 250);
}

