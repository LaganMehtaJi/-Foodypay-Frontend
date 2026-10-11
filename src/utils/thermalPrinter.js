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

/**
 * Print standard Customer Bill / Final Receipt
 * Formatted with restaurant branding, items, taxes, totals, and payment status
 */
export function printThermalReceipt(order, storeInfo = {}) {
  if (!order) return;

  const restName = storeInfo.restName || storeInfo.businessName || order.restaurantName || 'Restaurant';
  const restAddress = storeInfo.address || '';
  const restPhone = storeInfo.phone || '';
  const gstNo = storeInfo.gstNumber || storeInfo.gstin || '';
  const fssai = storeInfo.fssai || '';
  const tableName = order.table || order.tableNo || 'Dine-In';
  const orderType = order.type || 'Dine In';
  const orderId = order.orderId || order.id || '';
  const dateTimeStr = formatPrintDate(order.createdAt || order.date);
  const items = Array.isArray(order.items) ? order.items : [];
  const totalItemCount = items.reduce((sum, item) => sum + Number(item.qty || item.quantity || 1), 0);
  
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const tax = Number(order.tax || order.gst || 0);
  const grandTotal = Number(order.total || (subtotal - discount + tax) || 0);
  const paymentMode = order.paymentMode || order.paymentMethod || (order.isPaid ? 'Paid' : 'Pending');

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0px';
  printFrame.style.height = '0px';
  printFrame.style.border = 'none';
  document.body.appendChild(printFrame);

  const itemsHtml = items.map((it, idx) => {
    const name = it.name || it.title || 'Item';
    const qty = it.qty || it.quantity || 1;
    const price = Number(it.price || 0);
    const lineTotal = price * qty;
    return `
      <div class="item-row">
        <div class="item-name">${idx + 1}. ${name}</div>
        <div class="item-qty">${qty}</div>
        <div class="item-price">₹${lineTotal}</div>
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
        <title>Receipt #${orderId}</title>
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
            font-family: 'Courier New', Courier, monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.25;
            color: #000000;
            background: #FFFFFF;
            width: 100%;
            max-width: 76mm;
            padding: 6px 8px;
            margin: 0 auto;
          }
          .text-center {
            text-align: center;
          }
          .rest-title {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .rest-sub {
            font-size: 11.5px;
            font-weight: 600;
            margin: 1px 0;
          }
          .bill-title {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            margin: 4px 0 2px 0;
          }
          .solid-divider {
            border-top: 1.5px solid #000000;
            margin: 4px 0;
          }
          .dashed-divider {
            border-top: 1px dashed #000000;
            margin: 5px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            font-weight: 700;
            margin: 2px 0;
          }
          .col-headers {
            display: flex;
            justify-content: space-between;
            font-size: 12.5px;
            font-weight: 900;
            padding: 2px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 4px 0;
            font-size: 12.5px;
            font-weight: 700;
          }
          .item-name {
            flex: 1;
            padding-right: 6px;
            word-break: break-word;
          }
          .item-qty {
            flex: 0 0 24px;
            text-align: center;
            font-weight: 800;
          }
          .item-price {
            flex: 0 0 45px;
            text-align: right;
            font-weight: 900;
          }
          .calc-row {
            display: flex;
            justify-content: space-between;
            font-size: 12.5px;
            font-weight: 700;
            margin: 3px 0;
          }
          .grand-total-row {
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: 900;
            margin: 4px 0;
          }
          .pay-status-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            font-weight: 800;
            margin: 3px 0;
          }
          .footer-msg {
            text-align: center;
            font-size: 12px;
            font-weight: 800;
            margin-top: 8px;
          }
          .footer-branding {
            text-align: center;
            font-size: 10.5px;
            font-weight: 600;
            margin-top: 4px;
            letter-spacing: 0.3px;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="rest-title">${restName}</div>
          ${restAddress ? `<div class="rest-sub">${restAddress}</div>` : ''}
          ${restPhone ? `<div class="rest-sub">Ph: ${restPhone}</div>` : ''}
          ${gstNo ? `<div class="rest-sub">GSTIN: ${gstNo}</div>` : ''}
          ${fssai ? `<div class="rest-sub">FSSAI: ${fssai}</div>` : ''}
          <div class="bill-title">TAX INVOICE</div>
        </div>

        <div class="solid-divider"></div>

        <div class="meta-row">
          <span>Table: <strong>${tableName}</strong></span>
          <span>${orderType}</span>
        </div>
        <div class="meta-row">
          <span>Order #${orderId}</span>
          <span>${dateTimeStr}</span>
        </div>
        ${order.customer ? `<div class="meta-row"><span>Customer: ${order.customer}</span><span>${order.phone || ''}</span></div>` : ''}

        <div class="solid-divider"></div>

        <div class="col-headers">
          <span style="flex: 1;">ITEM</span>
          <span style="flex: 0 0 24px; text-align: center;">QTY</span>
          <span style="flex: 0 0 45px; text-align: right;">PRICE</span>
        </div>

        <div class="dashed-divider"></div>

        <div class="items-container">
          ${itemsHtml}
        </div>

        <div class="dashed-divider"></div>

        <div class="calc-row">
          <span>Items Qty:</span>
          <span>${totalItemCount}</span>
        </div>
        ${discount > 0 ? `
          <div class="calc-row">
            <span>Discount:</span>
            <span>- ₹${discount}</span>
          </div>
        ` : ''}
        ${tax > 0 ? `
          <div class="calc-row">
            <span>GST / Taxes:</span>
            <span>+ ₹${tax}</span>
          </div>
        ` : ''}

        <div class="solid-divider"></div>

        <div class="grand-total-row">
          <span>GRAND TOTAL:</span>
          <span>₹${grandTotal}</span>
        </div>

        <div class="dashed-divider"></div>

        <div class="pay-status-row">
          <span>Payment Mode:</span>
          <span>${paymentMode.toUpperCase()}</span>
        </div>
        <div class="pay-status-row">
          <span>Status:</span>
          <span>${order.isPaid ? 'PAID' : (order.status === 'completed' ? 'SETTLED' : 'UNPAID / KHATA')}</span>
        </div>

        <div class="dashed-divider"></div>

        <div class="footer-msg">
          *** Thank You! Visit Again ***
        </div>
        <div class="footer-branding">
          -- Powered by FoodyPay --
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
