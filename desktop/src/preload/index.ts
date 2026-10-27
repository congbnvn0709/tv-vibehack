import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, RunPipelineOptions, TvApi } from '../shared/types';

export const api: TvApi = {
  pairTv: (host: string, port: number, code: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PAIR, host, port, code),

  connectTv: (host: string, port: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONNECT, host, port),

  getDeviceInfo: (host: string, port: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_DEVICE_INFO, host, port),

  getProfiles: () =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_PROFILES),

  scanPackages: (host: string, port: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.SCAN_PACKAGES, host, port),

  runPipeline: (options: RunPipelineOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.RUN_PIPELINE, options),

  restoreStock: (host: string, port: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.RESTORE, host, port),

  onLog: (callback: (log: string) => void) => {
    const subscription = (_event: any, value: string) => callback(value);
    ipcRenderer.on(IPC_CHANNELS.ON_LOG, subscription);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_LOG, subscription);
  }
};

contextBridge.exposeInMainWorld('tvApi', api);
