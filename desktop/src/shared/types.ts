import type { TvProfile } from '../main/services/profile-service';
import type { AdbDeviceInfo } from '../main/services/adb-service';

export const IPC_CHANNELS = {
  PAIR: 'tv:pair',
  CONNECT: 'tv:connect',
  GET_DEVICE_INFO: 'tv:get-device-info',
  GET_PROFILES: 'tv:get-profiles',
  RUN_PIPELINE: 'tv:run-pipeline',
  RESTORE: 'tv:restore',
  ON_LOG: 'tv:on-log'
} as const;

export interface RunPipelineOptions {
  host: string;
  port: number;
  doBackup: boolean;
  doDebloat: boolean;
  selectedProfileId?: string;
  customPackages?: string[];
  doInstallLauncher: boolean;
  enableKidsMode: boolean;
}

export interface PipelineProgressEvent {
  step: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string;
}

export interface TvApi {
  pairTv: (host: string, port: number, code: string) => Promise<{ success: boolean; message: string }>;
  connectTv: (host: string, port: number) => Promise<{ success: boolean; message: string }>;
  getDeviceInfo: (host: string, port: number) => Promise<AdbDeviceInfo>;
  getProfiles: () => Promise<TvProfile[]>;
  runPipeline: (options: RunPipelineOptions) => Promise<{ success: boolean; log: string[] }>;
  restoreStock: (host: string, port: number) => Promise<{ success: boolean; log: string[] }>;
  onLog: (callback: (log: string) => void) => () => void;
}

declare global {
  interface Window {
    tvApi: TvApi;
  }
}
