import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ManualDebloatModal } from '../src/renderer/src/components/ManualDebloatModal';

describe('ManualDebloatModal', () => {
  it('renders protected packages as disabled checkboxes with shield', () => {
    const packages = [
      { packageName: 'com.google.android.katniss', isProtected: true, isRecommended: false, category: 'system-protected' as const, description: 'Bảo vệ hệ thống' },
      { packageName: 'com.smartdevice.myapp', isProtected: false, isRecommended: true, category: 'recommended' as const, description: 'App rác' }
    ];

    render(
      <ManualDebloatModal
        isOpen={true}
        onClose={() => {}}
        packages={packages}
        selectedPackages={['com.smartdevice.myapp']}
        onTogglePackage={() => {}}
        onSave={() => {}}
      />
    );

    expect(screen.getByText('com.google.android.katniss')).toBeDefined();
    expect(screen.getAllByText('Bảo vệ hệ thống').length).toBeGreaterThan(0);
    expect(screen.getByText('com.smartdevice.myapp')).toBeDefined();

    // Check that protected package checkbox is disabled
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0].disabled).toBe(true);
    expect(checkboxes[1].disabled).toBe(false);
  });
});
