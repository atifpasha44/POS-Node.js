const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  testServer: (url) => ipcRenderer.invoke('test-server', url),
  saveServerConfig: (url) => ipcRenderer.invoke('save-server-config', url),
  getSavedServerConfig: () => ipcRenderer.invoke('get-server-config')
});
