const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  verifyManagerPin: (pin) => ipcRenderer.invoke('verify-pin', pin)
});