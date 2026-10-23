const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printHtmlSilent: (options) => ipcRenderer.invoke('print-html-silent', options),
  printRaw: (options) => ipcRenderer.invoke('print-raw', options),
  kickDrawer: (printerName) => ipcRenderer.invoke('kick-drawer', printerName),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
});

// Remove all "Download Desktop App" links inside Desktop Application and ensure inputs are always focusable
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('is-electron');
  if (document.body) document.body.classList.add('is-electron');
  document.querySelectorAll('.download-desktop-link, .desktop-only-hide, #btnHeaderDownloadApp, #btnSideDownloadApp').forEach(el => el.remove());

  // Guarantee that clicking any input or textarea explicitly focuses it for keyboard entry
  document.addEventListener('click', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      e.target.focus();
    }
  }, true);
});
