// Preload script runs before web page loads
// Use this to safely expose Node.js APIs to the renderer if needed

const { contextBridge } = require('electron');

// Expose a minimal API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true
});

// Log that we're running in Electron (for debugging)
console.log('Time Tested Bible - Running in Electron');
