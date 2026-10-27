import React from 'react';

export interface FeatureTileProps {
  title: string;
  description: string;
  tagText: string;
  tagVariant?: 'emerald' | 'indigo' | 'amber' | 'muted';
  checked: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onChange: (checked: boolean) => void;
}

export const FeatureTile: React.FC<FeatureTileProps> = ({
  title,
  description,
  tagText,
  tagVariant = 'indigo',
  checked,
  disabled = false,
  icon,
  onChange
}) => {
  const getTagStyle = () => {
    switch (tagVariant) {
      case 'emerald':
        return { background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.25)' };
      case 'amber':
        return { background: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.25)' };
      case 'muted':
        return { background: 'rgba(255, 255, 255, 0.05)', color: '#64748B', border: '1px solid rgba(255, 255, 255, 0.08)' };
      case 'indigo':
      default:
        return { background: 'rgba(99, 102, 241, 0.12)', color: '#A5B4FC', border: '1px solid rgba(99, 102, 241, 0.25)' };
    }
  };

  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        background: checked
          ? 'linear-gradient(180deg, #16223C 0%, #121A2F 100%)'
          : 'var(--bg-card, #141E33)',
        border: checked
          ? '1px solid rgba(99, 102, 241, 0.45)'
          : '1px solid var(--border-subtle, rgba(255,255,255,0.07))',
        borderRadius: 14,
        padding: 20,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: checked ? '0 0 0 1px rgba(99, 102, 241, 0.4)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: checked ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: checked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: checked ? '#A5B4FC' : '#94A3B8'
          }}
        >
          {icon || (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
              <polyline points="17 2 12 7 7 2" />
            </svg>
          )}
        </div>

        {/* Toggle Switch */}
        <div
          style={{
            width: 40,
            height: 22,
            borderRadius: 22,
            backgroundColor: checked ? '#6366F1' : 'rgba(255, 255, 255, 0.12)',
            position: 'relative',
            transition: '0.2s',
            opacity: disabled ? 0.6 : 1
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              position: 'absolute',
              top: 3,
              left: checked ? 21 : 3,
              transition: '0.2s'
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.55, marginBottom: 14, minHeight: 38 }}>
        {description}
      </div>

      <div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: 5,
            display: 'inline-block',
            ...getTagStyle()
          }}
        >
          {tagText}
        </span>
      </div>
    </div>
  );
};
