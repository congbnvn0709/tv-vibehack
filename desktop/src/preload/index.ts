import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  ping: () => ipcRenderer.invoke('ping')
};

contextBridge.exposeInMainWorld('tvApi', api);
