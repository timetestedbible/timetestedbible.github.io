// Preload script runs before web page loads
// Use this to safely expose Node.js APIs to the renderer if needed

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  restartApp: () => ipcRenderer.send('restart-app'),
  revertToBuiltin: () => ipcRenderer.invoke('revert-to-builtin'),
  listBundles: () => ipcRenderer.invoke('list-bundles'),
  switchToVersion: (v) => ipcRenderer.invoke('switch-to-version', v)
});
