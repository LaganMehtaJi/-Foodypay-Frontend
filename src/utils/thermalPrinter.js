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

/**
 * Print standard Kitchen Order Ticket (KOT)
 * Matches the exact thermal KOT slip format from user reference image.
 */
export function printThermalKot(order, storeInfo = {}) {
  if (!order) return;

  const restName = storeInfo.restName || storeInfo.businessName || order.restaurantName || 'Restaurant';
  const tableName = order.table || order.tableNo || 'Table 1';
  const orderType = order.type || 'Dine In';
  const dateTimeStr = formatPrintDate(order.createdAt || order.date);
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

  const itemsHtml = items.map((it, idx) => {
    const name = it.name || it.title || 'Item';
    const qty = it.qty || it.quantity || 1;
    const notes = it.notes || it.customization ? `<div class="item-notes">* ${it.notes || it.customization}</div>` : '';
    return `
      <div class="item-row">
        <div class="item-name">${idx + 1}. ${name}${notes}</div>
        <div class="item-qty">${qty}</div>
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
            font-family: 'Courier New', Courier, monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.25;
            color: #000000;
            background: #FFFFFF;
            width: 100%;
            max-width: 76mm; /* Perfect fit for 80mm & 58mm thermal printers */
            padding: 6px 8px;
            margin: 0 auto;
          }
          .text-center {
            text-align: center;
          }
          .kot-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 1.5px;
            margin-bottom: 2px;
          }
          .rest-name {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 6px;
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
            font-size: 12.5px;
            font-weight: 700;
            margin: 2px 0;
          }
          .table-title {
            font-weight: 800;
          }
          .date-row {
            font-size: 12px;
            font-weight: 600;
            margin: 2px 0 4px 0;
          }
          .col-headers {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.5px;
            padding: 2px 0;
          }
          .items-container {
            margin: 4px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 4px 0;
            font-size: 13px;
            font-weight: 700;
          }
          .item-name {
            flex: 1;
            padding-right: 8px;
            word-break: break-word;
          }
          .item-qty {
            flex: 0 0 24px;
            text-align: right;
            font-weight: 900;
            font-size: 14px;
          }
          .item-notes {
            font-size: 11px;
            font-weight: 600;
            margin-top: 2px;
            padding-left: 10px;
          }
          .total-row {
            text-align: right;
            font-size: 12.5px;
            font-weight: 800;
            margin: 6px 0 4px 0;
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
          <div class="kot-title">KOT</div>
          <div class="rest-name">${restName}</div>
        </div>

        <div class="solid-divider"></div>

        <div class="meta-row">
          <span class="table-title">Table: ${tableName}</span>
          <span>${orderType}</span>
        </div>
        <div class="date-row">${dateTimeStr}</div>

        <div class="solid-divider"></div>

        <div class="col-headers">
          <span>ITEM</span>
          <span>QTY</span>
        </div>

        <div class="dashed-divider"></div>

        <div class="items-container">
          ${itemsHtml}
        </div>

        <div class="dashed-divider"></div>

        <div class="total-row">
          Total: ${totalItemCount} ${totalItemCount === 1 ? 'item' : 'items'}
        </div>

        <div class="dashed-divider"></div>

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
