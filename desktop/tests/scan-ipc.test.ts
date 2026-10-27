import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS } from '../src/shared/types';

describe('Scan IPC Channels', () => {
  it('should define SCAN_PACKAGES channel constant', () => {
    // @ts-ignore
    expect(IPC_CHANNELS.SCAN_PACKAGES).toBe('tv:scan-packages');
  });
});
