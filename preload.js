const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveNote: (text) => ipcRenderer.invoke('save-note', text),
  loadNote: () => ipcRenderer.invoke('load-note'),
  saveAs: (text) => ipcRenderer.invoke('save-as', text),
  newNote: () => ipcRenderer.invoke('new-note'),
  openFile: () => ipcRenderer.invoke('open-file'),
  onMenuAction: (channel, callback) => ipcRenderer.on(channel, callback),
  smartSave: (text, filePath) => ipcRenderer.invoke('smart-save', text, filePath) // NEW
});


