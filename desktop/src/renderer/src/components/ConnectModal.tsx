import React, { useState } from 'react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (host: string, port: number) => Promise<boolean>;
  onPair: (host: string, port: number, code: string) => Promise<boolean>;
  currentHost: string;
  currentPort: number;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  onPair,
  currentHost,
  currentPort
}) => {
  const [host, setHost] = useState(currentHost || '192.168.1.21');
  const [port, setPort] = useState(currentPort || 5555);
  const [pairingPort, setPairingPort] = useState(37499);
  const [pairingCode, setPairingCode] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const handlePair = async () => {
    setIsBusy(true);
    setStatusMsg('Đang gửi mã ghép nối không dây...');
    const ok = await onPair(host, pairingPort, pairingCode);
    setIsBusy(false);
    setStatusMsg(ok ? 'Ghép nối thành công! Bây giờ hãy nhấn Kết nối.' : 'Ghép nối thất bại. Vui lòng kiểm tra mã và cổng.');
  };

  const handleConnect = async () => {
    setIsBusy(true);
    setStatusMsg(`Đang kết nối tới ${host}:${port} qua ADB...`);
    const ok = await onConnect(host, port);
    setIsBusy(false);
    if (ok) {
      setStatusMsg('Kết nối thành công!');
      setTimeout(() => onClose(), 600);
    } else {
      setStatusMsg('Không thể kết nối. Hãy chắc chắn tivi và máy tính chung một mạng WiFi.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        style={{
          width: 500,
          background: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>Kết nối Android TV không dây</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 14, lineHeight: 1.5 }}>
          Vào <strong>Cài đặt &gt; Tùy chọn thiết bị &gt; Tùy chọn nhà phát triển &gt; Gỡ lỗi qua Wi-Fi</strong> (Android 11+) hoặc bật <strong>Gỡ lỗi USB</strong> (Android 7 - 10).
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
              Địa chỉ IP của TV
            </label>
            <input
              type="text"
              value={host}
              onChange={e => setHost(e.target.value)}
              style={{
                width: '100%',
                background: '#141E33',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#fff',
                fontSize: 13
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
              Cổng kết nối (Mặc định 5555)
            </label>
            <input
              type="number"
              value={port}
              onChange={e => setPort(Number(e.target.value))}
              style={{
                width: '100%',
                background: '#141E33',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#fff',
                fontSize: 13
              }}
            />
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#818CF8', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
            Thông số ghép nối lần đầu (Pairing - Chỉ cần cho Android 11+)
          </div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 8, lineHeight: 1.4 }}>
            * Nếu dùng Android 7 - 10 hoặc cổng 5555: Bỏ qua mục này và bấm thẳng nút [Kết nối] màu tím bên dưới.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                Cổng ghép nối (Pairing Port)
              </label>
              <input
                type="number"
                value={pairingPort}
                onChange={e => setPairingPort(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: '#141E33',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 13
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                Mã 6 số
              </label>
              <input
                type="text"
                placeholder="123456"
                value={pairingCode}
                onChange={e => setPairingCode(e.target.value)}
                style={{
                  width: '100%',
                  background: '#141E33',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 13
                }}
              />
            </div>
          </div>
        </div>

        {statusMsg && (
          <div style={{ fontSize: 12, color: '#38BDF8', marginBottom: 16, background: 'rgba(56, 189, 248, 0.1)', padding: '8px 12px', borderRadius: 6 }}>
            {statusMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            disabled={isBusy || !pairingCode}
            onClick={handlePair}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid #6366F1',
              color: '#818CF8',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: isBusy || !pairingCode ? 'not-allowed' : 'pointer',
              opacity: isBusy || !pairingCode ? 0.5 : 1
            }}
          >
            1. Ghép nối (Pair)
          </button>

          <button
            disabled={isBusy}
            onClick={handleConnect}
            style={{
              flex: 1,
              background: '#6366F1',
              border: 'none',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer'
            }}
          >
            2. Kết nối (Connect)
          </button>
        </div>
      </div>
    </div>
  );
};
