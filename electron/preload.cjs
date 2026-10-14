const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronHardware', {
  isElectron: true,
  printSilent: (options) => ipcRenderer.invoke('print-silent', options),
  printRawTcp: (ip, port, data) => ipcRenderer.invoke('print-raw-tcp', { ip, port, data }),
  showDesktopNotification: (title, body) => ipcRenderer.invoke('show-desktop-notification', { title, body }),
});
