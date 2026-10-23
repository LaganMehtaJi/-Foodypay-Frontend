const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const printerService = require('./printerService');
const PrintServer = require('./PrintServer/server');

let mainWindow = null;
let printServerInstance = null;

// 1. In-process FoodyPay Print Engine
function startPrintServer() {
  try {
    printServerInstance = new PrintServer(19090);
    printServerInstance.start().catch(err => {
      console.warn('[PrintServer] Could not start on port 19090:', err.message);
    });
  } catch (err) {
    console.warn('[PrintServer] Startup error:', err.message);
  }
}

function createWindow() {
  const appIcon = process.platform === 'win32' && require('fs').existsSync(path.join(__dirname, 'Logo.ico'))
    ? path.join(__dirname, 'Logo.ico')
    : path.join(__dirname, 'Logo.png');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'Foodypay.in',
    icon: appIcon,
    autoHideMenuBar: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Enable standard text editing shortcuts (Cut, Copy, Paste, Undo, Redo, Select All)
  // across all input fields while completely removing the visual menu bar
  const isMac = process.platform === 'darwin';
  const menuTemplate = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  // Remove the visual menu bar on Windows so it never steals keyboard focus
  mainWindow.removeMenu();

  // Attach mainWindow to printerService so it has access to webContents printer APIs
  printerService.setMainWindow(mainWindow);

  mainWindow.loadFile('index.html');
  mainWindow.maximize();

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.focus();
    mainWindow.webContents.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 2. Native Silent Printing IPC Handlers powered by printerService
ipcMain.handle('get-printers', async () => {
  try {
    return await printerService.getPrinters();
  } catch (e) {
    console.error('get-printers error:', e);
    return [];
  }
});

ipcMain.handle('print-html-silent', async (event, { printer, html, width = 80, drawerKick = false }) => {
  try {
    const targetPrinter = (!printer || printer === 'default') ? '' : printer;
    return await printerService.printHtml({
      html,
      printerName: targetPrinter,
      options: {
        pageSize: (width === 58 || width === '58mm') ? { width: 58000, height: 200000 } : { width: 80000, height: 200000 },
        drawerKick: Boolean(drawerKick)
      }
    });
  } catch (e) {
    console.error('print-html-silent error:', e);
    throw e;
  }
});

ipcMain.handle('print-raw', async (event, { printer, text, html, base64, autoCut = true, drawerKick = false }) => {
  try {
    const targetPrinter = (!printer || printer === 'default') ? '' : printer;
    if (html) {
      return await printerService.printHtml({
        html,
        printerName: targetPrinter,
        options: { autoCut, drawerKick }
      });
    }
    if (base64) {
      return await printerService.printPdf({
        pdfData: base64,
        printerName: targetPrinter,
        options: { autoCut, drawerKick }
      });
    }
    return await printerService.printText({
      text,
      printerName: targetPrinter,
      options: { autoCut, drawerKick }
    });
  } catch (e) {
    console.error('print-raw error:', e);
    throw e;
  }
});

ipcMain.handle('kick-drawer', async (event, printer) => {
  try {
    const targetPrinter = (!printer || printer === 'default') ? '' : printer;
    return await printerService.printText({
      text: '\x1B\x70\x00\x19\xFA',
      printerName: targetPrinter,
      options: { rawWindows: true }
    });
  } catch (e) {
    console.error('kick-drawer error:', e);
    throw e;
  }
});

// App Lifecycle
app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.foodypay.poscrm');
  }
  startPrintServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});