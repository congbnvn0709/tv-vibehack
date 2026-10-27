import { describe, it, expect } from 'vitest';
import { ProfileService } from '../src/main/services/profile-service';
import path from 'path';

describe('ProfileService', () => {
  it('should parse debloat text files ignoring comments and empty lines', () => {
    const raw = '# Coocaa bloatware\ncom.smartdevice.myapp # store app\n\ncom.sky.market\n';
    const pkgs = ProfileService.parseDebloatLines(raw);
    expect(pkgs).toEqual(['com.smartdevice.myapp', 'com.sky.market']);
  });

  it('should discover supported profiles from examples directory', () => {
    const examplesDir = path.resolve(__dirname, '../../examples');
    const profiles = ProfileService.loadFromDirectory(examplesDir);
    expect(profiles.length).toBeGreaterThanOrEqual(5);
    const coocaa = profiles.find(p => p.id === 'coocaa-swtv-24ae-4k');
    expect(coocaa).toBeDefined();
    expect(coocaa?.packages.length).toBeGreaterThan(5);
  });
});
