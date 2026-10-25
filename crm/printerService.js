const { BrowserWindow, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile, exec } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

let pdfToPrinter = null;
try {
  pdfToPrinter = require('pdf-to-printer');
} catch (e) {
  console.warn('pdf-to-printer not available or optional:', e.message);
}

class PrinterService {
  constructor() {
    this.cachedPrinters = [];
    this.mainWindow = null;
  }

  setMainWindow(win) {
    this.mainWindow = win;
  }

  // Get all installed printers across Windows, Mac, Linux
  async getPrinters() {
    try {
      // 1. Try native Electron webContents if available (Cross-platform)
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const printers = await this.mainWindow.webContents.getPrintersAsync();
        if (printers && printers.length > 0) {
          this.cachedPrinters = printers.map(p => ({
            name: p.name,
            displayName: p.displayName || p.name,
            description: p.description || '',
            status: (p.status === 0 || p.status === undefined || p.status === '0') ? 'Ready' : (p.isOffline ? 'Offline' : `Status ${p.status}`),
            isDefault: Boolean(p.isDefault),
            isOffline: Boolean(p.isOffline)
          }));
          return this.cachedPrinters;
        }
      }

      // 2. OS-specific fallbacks
      if (os.platform() === 'win32') {
        const script = `
          $ErrorActionPreference = 'Stop'
          Get-CimInstance Win32_Printer |
            Select-Object Name, Default, WorkOffline, PrinterStatus |
            ConvertTo-Json -Compress
        `;
        const { stdout } = await execFileAsync(
          'powershell.exe',
          ['-NoProfile', '-NonInteractive', '-Command', script],
          { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 }
        );
        const trimmed = stdout.trim();
        if (trimmed) {
          const parsed = JSON.parse(trimmed);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          this.cachedPrinters = list.map(p => ({
            name: p.Name,
            displayName: p.Name,
            description: '',
            status: p.WorkOffline ? 'Offline' : 'Ready',
            isDefault: Boolean(p.Default),
            isOffline: Boolean(p.WorkOffline)
          }));
          return this.cachedPrinters;
        }
      } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
        // macOS / Linux CUPS fallback
        const { stdout } = await execAsync('lpstat -p -d');
        const lines = stdout.split('\n');
        let defaultPrinter = '';
        const list = [];
        
        for (const line of lines) {
          if (line.startsWith('system default destination:')) {
            defaultPrinter = line.replace('system default destination:', '').trim();
          } else if (line.startsWith('printer ')) {
            const parts = line.split(' ');
            const pName = parts[1];
            if (pName) {
              list.push({
                name: pName,
                displayName: pName,
                description: '',
                status: line.includes('idle') ? 'Ready' : 'Busy',
                isDefault: false,
                isOffline: line.includes('disabled')
              });
            }
          }
        }

        if (defaultPrinter) {
          list.forEach(p => {
            if (p.name === defaultPrinter) p.isDefault = true;
          });
        }
        this.cachedPrinters = list;
        return list;
      }
    } catch (err) {
      console.error('Error fetching printers:', err);
    }

    return this.cachedPrinters;
  }

  // Find target printer or return default
  async resolvePrinter(targetName) {
    const printers = await this.getPrinters();
    if (!printers || printers.length === 0) {
      throw new Error('No installed printers found on this system.');
    }

    if (targetName && typeof targetName === 'string' && targetName.trim() && targetName.trim().toLowerCase() !== 'default') {
      const cleanTarget = targetName.trim().toLowerCase();

      // 1. Exact match by name or displayName
      let found = printers.find(
        p => (p.name && p.name.trim().toLowerCase() === cleanTarget) ||
             (p.displayName && p.displayName.trim().toLowerCase() === cleanTarget)
      );

      // 2. Substring match (e.g. "POS-80" in "POS-80 Series" or "TM-T82" in "EPSON TM-T82")
      if (!found) {
        found = printers.find(
          p => (p.name && p.name.toLowerCase().includes(cleanTarget)) ||
               (cleanTarget && p.name && cleanTarget.includes(p.name.toLowerCase())) ||
               (p.displayName && p.displayName.toLowerCase().includes(cleanTarget))
        );
      }

      // 3. Alphanumeric normalized match (ignoring dashes, spaces, underscores)
      if (!found) {
        const normTarget = cleanTarget.replace(/[^a-z0-9]/g, '');
        if (normTarget.length >= 2) {
          found = printers.find(p => {
            const normName = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return normName.includes(normTarget) || normTarget.includes(normName);
          });
        }
      }

      if (found) {
        console.log(`[printerService] Resolved target "${targetName}" to device: "${found.name}"`);
        return found.name;
      }

      const availableNames = printers.map(p => `"${p.name}"`).join(', ');
      throw new Error(`Printer "${targetName}" not found or disconnected. Available printers: ${availableNames}`);
    }

    const defaultPrinter = printers.find(p => p.isDefault) || printers[0];
    console.log(`[printerService] Using default printer: "${defaultPrinter.name}"`);
    return defaultPrinter.name;
  }

  // Print HTML content silently
  async printHtml({ html, printerName, options = {} }) {
    if (!html || typeof html !== 'string' || !html.trim()) {
      throw new Error('Valid HTML content string is required.');
    }

    const resolvedPrinter = await this.resolvePrinter(printerName);
    
    // Create a hidden window for silent rendering (do NOT use offscreen:true as it causes blank prints in Chromium)
    const printWindow = new BrowserWindow({
      show: false,
      width: 400,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise(async (resolve, reject) => {
      let timeoutId = setTimeout(() => {
        if (!printWindow.isDestroyed()) printWindow.close();
        reject(new Error('Print job timed out after 30 seconds.'));
      }, 30000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (!printWindow.isDestroyed()) {
          try { printWindow.destroy(); } catch (e) { printWindow.close(); }
        }
      };

      try {
        const isFullDoc = html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html');
        const fullHtml = isFullDoc ? html : `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                @page { margin: 0; }
                body {
                  margin: 0;
                  padding: 8px;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #000000;
                  background: #ffffff;
                }
                img { max-width: 100%; }
                table { width: 100%; border-collapse: collapse; }
              </style>
            </head>
            <body>
              ${html}
            </body>
          </html>
        `;

        await new Promise((resolveLoad, rejectLoad) => {
          printWindow.webContents.once('did-finish-load', resolveLoad);
          printWindow.webContents.once('did-fail-load', (_e, code, desc) => rejectLoad(new Error(`Failed to load HTML: ${desc} (${code})`)));
          printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);
        });

        // Wait a short tick for layout, CSS, and fonts to render
        await new Promise(r => setTimeout(r, options.delayMs !== undefined ? options.delayMs : 10));

        // 1. Virtual PDF Printer Handling (e.g. "Microsoft Print to PDF")
        // Windows Print to PDF cancels silent prints because it expects a save file dialog.
        // We generate the PDF directly using printToPDF and save it to Desktop, opening it for instant preview!
        const lowerName = resolvedPrinter.toLowerCase();
        const isVirtualPdf = lowerName.includes('pdf') || lowerName.includes('xps') || lowerName.includes('onenote');

        if (isVirtualPdf) {
          const desktopDir = (app && typeof app.getPath === 'function') ? app.getPath('desktop') : path.join(os.homedir(), 'Desktop');
          const fileName = `Foodypay_Receipt_${Date.now()}.pdf`;
          const pdfOutPath = path.join(desktopDir, fileName);

          const pdfBuffer = await printWindow.webContents.printToPDF({
            printBackground: options.printBackground !== undefined ? Boolean(options.printBackground) : true,
            marginsType: 1
          });

          fs.writeFileSync(pdfOutPath, pdfBuffer);
          cleanup();

          try {
            if (shell && shell.openPath) {
              shell.openPath(pdfOutPath);
            }
          } catch(e) {}

          return resolve({
            success: true,
            jobId,
            printer: resolvedPrinter,
            pdfSavedPath: pdfOutPath,
            message: `Virtual PDF Print successful! Saved & opened: ${fileName}`
          });
        }

        // 2. Physical Hardware Printer Silent Printing (POS-80, XP-58, USB Thermal, Laser, DeskJet, etc.)
        const printSettings = {
          silent: true,
          printBackground: options.printBackground !== undefined ? Boolean(options.printBackground) : true,
          deviceName: resolvedPrinter,
          color: options.color !== undefined ? Boolean(options.color) : true,
          copies: Number(options.copies) || 1,
          margins: { marginType: options.marginType || 'none' }
        };

        if (options.pageSize) {
          printSettings.pageSize = options.pageSize;
        }

        printWindow.webContents.print(printSettings, (success, failureReason) => {
          cleanup();
          if (success) {
            resolve({
              success: true,
              jobId,
              printer: resolvedPrinter,
              message: `Printed HTML successfully to ${resolvedPrinter}`
            });
          } else {
            reject(new Error(`Printing failed on "${resolvedPrinter}": ${failureReason || 'Unknown error'}`));
          }
        });
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  }

  // Print plain text silently (formatted for receipts/tickets)
  async printText({ text, printerName, options = {} }) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Valid non-empty text string is required.');
    }

    // Windows native direct text mode option if requested
    if (options.rawWindows && os.platform() === 'win32') {
      const resolvedPrinter = await this.resolvePrinter(printerName);
      const script = `
        $ErrorActionPreference = 'Stop'
        $text = $env:FOODYPAY_PRINT_TEXT
        $printer = $env:FOODYPAY_PRINTER_NAME
        $text | Out-Printer -Name $printer
      `;
      await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        {
          windowsHide: true,
          timeout: 25000,
          env: {
            ...process.env,
            FOODYPAY_PRINT_TEXT: text,
            FOODYPAY_PRINTER_NAME: resolvedPrinter
          }
        }
      );
      return {
        success: true,
        jobId: `job_${Date.now()}`,
        printer: resolvedPrinter,
        message: `Raw text printed directly to ${resolvedPrinter}`
      };
    }

    // High quality thermal-friendly receipt HTML layout
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const html = `
      <div style="font-family: 'Courier New', Courier, monospace; font-size: ${options.fontSize || '13px'}; line-height: 1.35; white-space: pre-wrap; word-break: break-word;">
        ${escaped}
      </div>
    `;

    return this.printHtml({ html, printerName, options });
  }

  // Print PDF file / base64 silently
  async printPdf({ pdfData, printerName, options = {} }) {
    if (!pdfData) {
      throw new Error('PDF data is required (file path, URL, or base64 string).');
    }

    const resolvedPrinter = await this.resolvePrinter(printerName);
    let tempFilePath = null;

    try {
      // 1. Determine if pdfData is a local file path, URL, or base64
      if (typeof pdfData === 'string' && fs.existsSync(pdfData)) {
        tempFilePath = pdfData;
      } else {
        const tempFileName = `foodypay_print_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.pdf`;
        tempFilePath = path.join(os.tmpdir(), tempFileName);

        if (typeof pdfData === 'string' && (pdfData.startsWith('http://') || pdfData.startsWith('https://'))) {
          // Download remote PDF
          const res = await fetch(pdfData);
          if (!res.ok) throw new Error(`Failed to download PDF from URL: ${res.statusText}`);
          const arrayBuf = await res.arrayBuffer();
          fs.writeFileSync(tempFilePath, Buffer.from(arrayBuf));
        } else {
          // Base64 string
          let base64Clean = pdfData;
          if (pdfData.includes('base64,')) {
            base64Clean = pdfData.split('base64,')[1];
          }
          const buf = Buffer.from(base64Clean, 'base64');
          fs.writeFileSync(tempFilePath, buf);
        }
      }

      const isVirtualPdf = resolvedPrinter.toLowerCase().includes('pdf') || resolvedPrinter.toLowerCase().includes('xps');
      if (isVirtualPdf) {
        const desktopDir = (app && typeof app.getPath === 'function') ? app.getPath('desktop') : path.join(os.homedir(), 'Desktop');
        const fileName = `Foodypay_Invoice_${Date.now()}.pdf`;
        const finalPdfPath = path.join(desktopDir, fileName);
        fs.copyFileSync(tempFilePath, finalPdfPath);
        try { if (shell && shell.openPath) shell.openPath(finalPdfPath); } catch (e) {}
        return {
          success: true,
          jobId: `job_${Date.now()}`,
          printer: resolvedPrinter,
          pdfSavedPath: finalPdfPath,
          message: `PDF generated and saved to Desktop: ${fileName}`
        };
      }

      // Method A: If on Windows and pdf-to-printer is available, use it (highest reliability for PDF on Windows)
      if (os.platform() === 'win32' && pdfToPrinter) {
        await pdfToPrinter.print(tempFilePath, {
          printer: resolvedPrinter,
          copies: Number(options.copies) || 1
        });

        return {
          success: true,
          jobId: `job_${Date.now()}`,
          printer: resolvedPrinter,
          message: `PDF printed successfully to ${resolvedPrinter}`
        };
      }

      // Method B: Cross-platform Electron PDF Window Silent Printing
      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          plugins: true,
          offscreen: true
        }
      });

      return new Promise(async (resolve, reject) => {
        let timeoutId = setTimeout(() => {
          if (!printWin.isDestroyed()) printWin.close();
          reject(new Error('PDF Print job timed out.'));
        }, 35000);

        try {
          const fileUrl = `file://${tempFilePath.replace(/\\/g, '/')}`;
          await printWin.loadURL(fileUrl);
          await new Promise(r => setTimeout(r, 1200));

          printWin.webContents.print({
            silent: true,
            deviceName: resolvedPrinter,
            copies: Number(options.copies) || 1,
            margins: { marginType: options.marginType || 'none' }
          }, (success, failureReason) => {
            clearTimeout(timeoutId);
            if (!printWin.isDestroyed()) printWin.close();
            if (success) {
              resolve({
                success: true,
                jobId: `job_${Date.now()}`,
                printer: resolvedPrinter,
                message: `PDF printed successfully to ${resolvedPrinter}`
              });
            } else {
              reject(new Error(`PDF printing failed: ${failureReason || 'Unknown error'}`));
            }
          });
        } catch (e) {
          clearTimeout(timeoutId);
          if (!printWin.isDestroyed()) printWin.close();
          reject(e);
        }
      });
    } finally {
      // Clean up temporary file if we created it
      if (tempFilePath && tempFilePath.includes('foodypay_print_') && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (ignore) {}
      }
    }
  }

  // Generate Foodypay sample receipt HTML for 1-click test printing
  generateSampleReceipt(customNote = '') {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    return `
      <div style="width: 280px; font-family: monospace; font-size: 12px; line-height: 1.4; color: #000;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 1px;">FOODYPAY</h2>
          <div style="font-size: 11px; margin-top: 2px;">Smart Cloud POS & Payments</div>
          <div style="font-size: 10px; margin-top: 4px; font-weight: bold; color: #333;">DEVELOPED BY: LAGAN MEHTA</div>
          <div style="font-size: 9px; margin-top: 2px;">Foodypay-Printer-Agent v1.0.0</div>
        </div>

        <div style="font-size: 11px; margin-bottom: 8px;">
          <div><strong>Order:</strong> #FP-${Math.floor(1000 + Math.random() * 9000)}</div>
          <div><strong>Date:</strong> ${dateStr} ${timeStr}</div>
          <div><strong>Type:</strong> DINE-IN (Table #4)</div>
        </div>

        <table style="width: 100%; font-size: 11px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px;">
          <thead>
            <tr style="text-align: left;">
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Veg Paneer Burger</td>
              <td style="text-align: center;">2</td>
              <td style="text-align: right;">₹240.00</td>
            </tr>
            <tr>
              <td>Cold Coffee Frappe</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">₹120.00</td>
            </tr>
            <tr>
              <td>French Fries (L)</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">₹99.00</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 11px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₹459.00</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>CGST (2.5%):</span>
            <span>₹11.48</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>SGST (2.5%):</span>
            <span>₹11.48</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px;">
            <span>TOTAL AMOUNT:</span>
            <span>₹482.00</span>
          </div>
          <div style="font-size: 10px; margin-top: 3px;">Payment: <strong>UPI / Online (Foodypay)</strong></div>
        </div>

        ${customNote ? `<div style="border: 1px dotted #000; padding: 4px; font-size: 10px; margin-bottom: 8px; text-align: center;">${customNote}</div>` : ''}

        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 8px; font-size: 10px;">
          <div>*** TEST PRINT SUCCESSFUL ***</div>
          <div style="margin-top: 2px;">Direct Print Working Without Dialog!</div>
          <div style="margin-top: 4px; font-size: 9px;">Foodypay System | Developed by Lagan Mehta</div>
        </div>
      </div>
    `;
  }
}

module.exports = new PrinterService();
