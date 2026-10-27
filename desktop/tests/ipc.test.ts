import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS } from '../src/shared/types';

describe('IPC Channels', () => {
  it('should define distinct channel constants', () => {
    expect(IPC_CHANNELS.PAIR).toBe('tv:pair');
    expect(IPC_CHANNELS.CONNECT).toBe('tv:connect');
    expect(IPC_CHANNELS.GET_PROFILES).toBe('tv:get-profiles');
    expect(IPC_CHANNELS.RUN_PIPELINE).toBe('tv:run-pipeline');
    expect(IPC_CHANNELS.RESTORE).toBe('tv:restore');
    expect(IPC_CHANNELS.ON_LOG).toBe('tv:on-log');
  });
});
