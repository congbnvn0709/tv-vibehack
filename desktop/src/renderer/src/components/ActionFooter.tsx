import React from 'react';

interface ActionFooterProps {
  stepsSummary: string;
  isExecuting: boolean;
  onRestore: () => void;
  onExecute: () => void;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({
  stepsSummary,
  isExecuting,
  onRestore,
  onExecute
}) => {
  return (
    <footer
      style={{
        background: '#0B1120',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        padding: '16px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
          Tiến trình:
        </span>
        <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
          {stepsSummary}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onRestore}
          disabled={isExecuting}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#94A3B8',
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            opacity: isExecuting ? 0.5 : 1
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Khôi phục launcher gốc</span>
        </button>

        <button
          onClick={onExecute}
          disabled={isExecuting}
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #3B82F6 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '10px 24px',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
            opacity: isExecuting ? 0.7 : 1
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>{isExecuting ? 'Đang thực thi...' : 'Bắt đầu cài đặt ngay'}</span>
        </button>
      </div>
    </footer>
  );
};
