import React, { useState } from 'react';
import type { ScannedPackage } from '../../../main/services/package-scanner';

interface ManualDebloatModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: ScannedPackage[];
  selectedPackages: string[];
  onTogglePackage: (pkgName: string) => void;
  onSave: () => void;
  isLoading?: boolean;
}

export const ManualDebloatModal: React.FC<ManualDebloatModalProps> = ({
  isOpen,
  onClose,
  packages,
  selectedPackages,
  onTogglePackage,
  onSave,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = packages.filter(p =>
    p.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120
      }}
    >
      <div
        style={{
          width: 680,
          maxHeight: '85vh',
          background: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
              Debloat thủ công (Quét trực tiếp từ TV)
            </h2>
            <p style={{ fontSize: 12.5, color: '#94A3B8' }}>
              Chọn các ứng dụng bạn muốn đóng băng. Các tính năng cốt lõi (Voice, Assistant, HDMI, Remote) đã được khóa bảo vệ.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Search Bar & Summary */}
        <div style={{ padding: '14px 24px', background: '#0B1120', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Tìm kiếm gói ứng dụng (ví dụ: xiaomi, feedback, browser)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: '#141E33',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13,
              outline: 'none'
            }}
          />
          <div style={{ fontSize: 12, color: '#818CF8', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Đã chọn: {selectedPackages.length} app
          </div>
        </div>

        {/* Package List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              Đang gửi lệnh quét toàn bộ ứng dụng từ TV qua ADB...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
              Không tìm thấy ứng dụng nào phù hợp.
            </div>
          ) : (
            filtered.map(pkg => {
              const isSelected = selectedPackages.includes(pkg.packageName);

              return (
                <div
                  key={pkg.packageName}
                  onClick={() => !pkg.isProtected && onTogglePackage(pkg.packageName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 6,
                    background: pkg.isProtected
                      ? 'rgba(16, 185, 129, 0.04)'
                      : isSelected
                      ? 'rgba(99, 102, 241, 0.12)'
                      : '#141E33',
                    border: pkg.isProtected
                      ? '1px solid rgba(16, 185, 129, 0.15)'
                      : isSelected
                      ? '1px solid rgba(99, 102, 241, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: pkg.isProtected ? 'default' : 'pointer',
                    opacity: pkg.isProtected ? 0.85 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={isSelected && !pkg.isProtected}
                      disabled={pkg.isProtected}
                      onChange={() => !pkg.isProtected && onTogglePackage(pkg.packageName)}
                      style={{ cursor: pkg.isProtected ? 'not-allowed' : 'pointer' }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#F8FAFC', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {pkg.packageName}
                      </div>
                      {pkg.description && (
                        <div style={{ fontSize: 11, color: pkg.isProtected ? '#34D399' : '#94A3B8', marginTop: 1 }}>
                          {pkg.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {pkg.isProtected ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34D399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Bảo vệ hệ thống
                      </span>
                    ) : pkg.isRecommended ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#A5B4FC'
                        }}
                      >
                        Gợi ý gỡ
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#0B1120',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94A3B8',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            style={{
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Lưu danh sách ({selectedPackages.length} app)
          </button>
        </div>
      </div>
    </div>
  );
};
