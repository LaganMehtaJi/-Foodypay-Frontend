const { app, BrowserWindow, ipcMain, Notification, Tray, Menu } = require('electron');
const path = require('path');
const net = require('net');

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 680,
    title: 'FoodyPay POS - Restaurant Billing & Kitchen Display',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    autoHideMenuBar: true,
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ----------------------------------------------------------------------------
// IPC Hardware Bridge: Silent Thermal Printing & Raw TCP Network Printing
// ----------------------------------------------------------------------------
ipcMain.handle('print-silent', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: options.silent !== undefined ? options.silent : true,
        printBackground: true,
        deviceName: options.deviceName || '',
        margins: { marginType: 'none' },
      },
      (success, failureReason) => {
        if (!success) {
          resolve({ success: false, error: failureReason });
        } else {
          resolve({ success: true });
        }
      }
    );
  });
});

// Raw TCP socket printing to LAN Thermal Printers (port 9100)
ipcMain.handle('print-raw-tcp', async (event, { ip, port = 9100, data }) => {
  return new Promise((resolve) => {
    if (!ip) return resolve({ success: false, error: 'No IP specified' });

    const client = new net.Socket();
    client.setTimeout(4000);

    client.connect(Number(port), ip, () => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
      client.write(buffer, () => {
        client.end();
        resolve({ success: true, method: 'tcp_socket', ip, port });
      });
    });

    client.on('error', (err) => {
      client.destroy();
      resolve({ success: false, error: err.message });
    });

    client.on('timeout', () => {
      client.destroy();
      resolve({ success: false, error: 'Connection timed out to thermal printer' });
    });
  });
});

// Desktop Notification
ipcMain.handle('show-desktop-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'FoodyPay Alert',
      body: body || 'New Order / Service Request received.',
      icon: path.join(__dirname, '../public/favicon.ico'),
    }).show();
    return true;
  }
  return false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
