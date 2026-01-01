const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadDiary: () => ipcRenderer.invoke('load-diary'),
  saveEntry: (entry) => ipcRenderer.invoke('save-entry', entry),
  getEntry: (date) => ipcRenderer.invoke('get-entry', date),
});
