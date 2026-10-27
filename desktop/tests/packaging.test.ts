import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Electron Packaging Configuration', () => {
  it('should define targets for both mac and win in electron-builder config', () => {
    const configPath = path.resolve(__dirname, '../electron-builder.yml');
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('mac:');
    expect(content).toContain('win:');
    expect(content).toContain('extraResources:');
  });
});
