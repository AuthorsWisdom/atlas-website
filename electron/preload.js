const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getKey: (provider) => ipcRenderer.invoke('get-key', provider),
  setKey: (provider, key) => ipcRenderer.invoke('set-key', provider, key),
  deleteKey: (provider) => ipcRenderer.invoke('delete-key', provider),
  getData: (key) => ipcRenderer.invoke('get-data', key),
  setData: (key, value) => ipcRenderer.invoke('set-data', key, value),
});
