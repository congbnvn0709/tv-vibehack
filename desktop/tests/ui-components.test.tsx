import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureTile } from '../src/renderer/src/components/FeatureTile';

describe('FeatureTile Component', () => {
  it('renders title, description and tag correctly', () => {
    render(
      <FeatureTile
        title="Sao lưu an toàn"
        description="Trích xuất dữ liệu gốc"
        tagText="Khuyến nghị"
        tagVariant="emerald"
        checked={true}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Sao lưu an toàn')).toBeDefined();
    expect(screen.getByText('Khuyến nghị')).toBeDefined();
    expect(screen.getByText('Trích xuất dữ liệu gốc')).toBeDefined();
  });
});
