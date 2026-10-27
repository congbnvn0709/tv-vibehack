import React from 'react';

interface WindowHeaderProps {
  deviceTarget: string;
  isConnected: boolean;
  onOpenConnect: () => void;
}

export const WindowHeader: React.FC<WindowHeaderProps> = ({
  deviceTarget,
  isConnected,
  onOpenConnect
}) => {
  return (
    <header
      style={{
        background: '#0B1120',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        height: 48,
        padding: '0 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M17 2l-5 5-5-5" />
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: '#F8FAFC' }}>
          TV ViBEHACK
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818CF8',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 4
          }}
        >
          v2.4
        </span>
      </div>

      <button
        onClick={onOpenConnect}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.05)',
          border: isConnected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontFamily: 'monospace',
          color: isConnected ? '#34D399' : '#94A3B8',
          cursor: 'pointer'
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isConnected ? '#10B981' : '#64748B'
          }}
        />
        <span>{isConnected ? deviceTarget : 'Chưa kết nối TV'}</span>
      </button>
    </header>
  );
};
