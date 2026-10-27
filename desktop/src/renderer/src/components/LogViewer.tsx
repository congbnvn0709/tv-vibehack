import React, { useEffect, useRef } from 'react';

interface LogViewerProps {
  logs: string[];
  onClear: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, onClear }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#070A11',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          background: '#0B1120',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>
          Nhật ký thực thi ADB
        </span>
        <button
          onClick={onClear}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#64748B',
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Xóa log
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: 1.6,
          color: '#E2E8F0',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#475569' }}>Chưa có nhật ký nào...</div>
        ) : (
          logs.map((line, idx) => (
            <div
              key={idx}
              style={{
                color: line.includes('❌') || line.includes('error') || line.includes('Exception')
                  ? '#F87171'
                  : line.includes('✓') || line.includes('Success')
                  ? '#34D399'
                  : line.startsWith('$')
                  ? '#818CF8'
                  : '#CBD5E1'
              }}
            >
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
