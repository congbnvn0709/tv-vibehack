import React from 'react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  selectedModelName: string;
  deviceEndpoint: string;
  isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  selectedModelName,
  deviceEndpoint,
  isConnected
}) => {
  const navItem = (id: string, label: string, icon: React.ReactNode, badge?: string) => {
    const active = currentTab === id;
    return (
      <div
        onClick={() => onSelectTab(id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 8,
          color: active ? '#F8FAFC' : '#94A3B8',
          background: active ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
          border: active ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          marginBottom: 2
        }}
      >
        <span style={{ color: active ? '#818CF8' : '#64748B' }}>{icon}</span>
        <span>{label}</span>
        {badge && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#94A3B8'
            }}
          >
            {badge}
          </span>
        )}
      </div>
    );
  };

  return (
    <aside
      style={{
        width: 220,
        background: '#0F172A',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        flexShrink: 0
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#64748B', padding: '6px 10px' }}>
          Thiết lập
        </div>
        {navItem('connect', 'Kết nối TV', (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        ), isConnected ? 'OK' : undefined)}

        {navItem('select-tv', 'Chọn loại TV', (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="15" rx="2" />
            <polyline points="17 2 12 7 7 2" />
          </svg>
        ), selectedModelName.split(' ')[0])}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', color: '#64748B', padding: '6px 10px' }}>
          Quy trình
        </div>
        {navItem('pipeline', 'Cấu hình chạy', (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
        ))}

        {navItem('logs', 'Nhật ký ADB', (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        ))}

        {navItem('restore', 'Khôi phục gốc', (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        ))}
      </div>

      <div
        style={{
          marginTop: 'auto',
          background: '#141E33',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: 10,
          padding: 12
        }}
      >
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748B', fontWeight: 600, marginBottom: 4 }}>
          Thiết bị nhận
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', marginBottom: 2 }}>
          {selectedModelName}
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
          {deviceEndpoint}
        </div>
      </div>
    </aside>
  );
};
