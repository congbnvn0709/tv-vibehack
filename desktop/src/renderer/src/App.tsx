import React, { useState, useEffect } from 'react';
import './styles/theme.css';
import { WindowHeader } from './components/WindowHeader';
import { Sidebar } from './components/Sidebar';
import { FeatureTile } from './components/FeatureTile';
import { ActionFooter } from './components/ActionFooter';
import { ConnectModal } from './components/ConnectModal';
import { LogViewer } from './components/LogViewer';
import type { TvProfile } from '../../main/services/profile-service';

export default function App() {
  const [currentTab, setCurrentTab] = useState('pipeline');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [host, setHost] = useState('192.168.1.21');
  const [port, setPort] = useState(5555);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceModel, setDeviceModel] = useState('Coocaa SWTV-24AE-4K');

  const [profiles, setProfiles] = useState<TvProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState('coocaa-swtv-24ae-4k');

  // Config toggles
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [doBackup, setDoBackup] = useState(true);
  const [doDebloat, setDoDebloat] = useState(true);
  const [doInstallLauncher, setDoInstallLauncher] = useState(true);
  const [enableKidsMode, setEnableKidsMode] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to IPC logs
    if (window.tvApi?.onLog) {
      const unsub = window.tvApi.onLog((chunk: string) => {
        setLogs(prev => [...prev, chunk.trim()]);
      });
      return unsub;
    }
  }, []);

  useEffect(() => {
    // Fetch profiles
    if (window.tvApi?.getProfiles) {
      window.tvApi.getProfiles().then(profs => {
        setProfiles(profs);
        if (profs.length > 0 && !selectedProfileId) {
          setSelectedProfileId(profs[0].id);
        }
      });
    }
  }, []);

  const handleConnect = async (h: string, p: number) => {
    setHost(h);
    setPort(p);
    if (!window.tvApi) return false;
    const res = await window.tvApi.connectTv(h, p);
    if (res.success) {
      setIsConnected(true);
      try {
        const info = await window.tvApi.getDeviceInfo(h, p);
        if (info?.model) setDeviceModel(info.model);
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  };

  const handlePair = async (h: string, p: number, code: string) => {
    if (!window.tvApi) return false;
    const res = await window.tvApi.pairTv(h, p, code);
    return res.success;
  };

  const handleExecute = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setCurrentTab('logs');

    if (!window.tvApi) {
      setLogs(prev => [...prev, 'Chạy trên môi trường browser giả lập. Vui lòng chạy trong Electron.']);
      setIsExecuting(false);
      return;
    }

    const res = await window.tvApi.runPipeline({
      host,
      port,
      doBackup,
      doDebloat,
      selectedProfileId,
      doInstallLauncher,
      enableKidsMode
    });

    setIsExecuting(false);
    if (res.success) {
      alert('Đã hoàn thành cài đặt thành công trên tivi!');
    } else {
      alert('Có lỗi xảy ra trong quá trình cài đặt. Hãy xem mục Nhật ký.');
    }
  };

  const handleRestore = async () => {
    if (isExecuting) return;
    if (!confirm('Bạn có chắc chắn muốn khôi phục lại launcher gốc của TV không?')) return;

    setIsExecuting(true);
    setCurrentTab('logs');

    if (window.tvApi) {
      await window.tvApi.restoreStock(host, port);
    }
    setIsExecuting(false);
  };

  const getSummary = () => {
    const steps: string[] = [];
    if (doBackup) steps.push('Sao lưu');
    if (doDebloat) steps.push('Debloat');
    if (doInstallLauncher) steps.push('Cài Launcher');
    if (enableKidsMode) steps.push('Kids Mode');
    return steps.join(' → ') || 'Không chọn tác vụ nào';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <WindowHeader
        deviceTarget={`${host}:${port}`}
        isConnected={isConnected}
        onOpenConnect={() => setIsConnectOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          currentTab={currentTab}
          onSelectTab={t => {
            if (t === 'connect') setIsConnectOpen(true);
            else setCurrentTab(t);
          }}
          selectedModelName={deviceModel}
          deviceEndpoint={`${host}:${port}`}
          isConnected={isConnected}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#090D16' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
            {currentTab === 'pipeline' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                      Cấu hình cài đặt Launcher
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: 13.5 }}>
                      Chọn các tác vụ bạn muốn tự động thực thi trên tivi
                    </p>
                  </div>

                  <div style={{ display: 'flex', background: '#0B1120', padding: 3, borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                    <button
                      onClick={() => {
                        setIsAutoMode(true);
                        setDoBackup(true);
                        setDoDebloat(true);
                        setDoInstallLauncher(true);
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 6,
                        border: 'none',
                        background: isAutoMode ? '#141E33' : 'transparent',
                        color: isAutoMode ? '#F8FAFC' : '#94A3B8',
                        fontWeight: isAutoMode ? 600 : 500,
                        cursor: 'pointer',
                        fontSize: 12.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      <span>Tự động tối ưu</span>
                    </button>
                    <button
                      onClick={() => setIsAutoMode(false)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 6,
                        border: 'none',
                        background: !isAutoMode ? '#141E33' : 'transparent',
                        color: !isAutoMode ? '#F8FAFC' : '#94A3B8',
                        fontWeight: !isAutoMode ? 600 : 500,
                        cursor: 'pointer',
                        fontSize: 12.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Tùy chỉnh tác vụ</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <FeatureTile
                    title="Sao lưu an toàn (Safe Backup)"
                    description="Trích xuất danh sách package gốc, thiết lập HOME và config hiện tại của TV trước khi thay đổi."
                    tagText="Khuyến nghị an toàn"
                    tagVariant="emerald"
                    checked={doBackup}
                    onChange={v => setDoBackup(v)}
                  />

                  <FeatureTile
                    title="Đóng băng ứng dụng rác (Debloat)"
                    description="Vô hiệu hóa các dịch vụ chạy ngầm của nhà sản xuất. Giảm giật lag và giải phóng RAM."
                    tagText={`Profile: ${selectedProfileId || 'Chung'}`}
                    tagVariant="indigo"
                    checked={doDebloat}
                    onChange={v => setDoDebloat(v)}
                  />

                  <FeatureTile
                    title="Cài tvOS Launcher & Thay thế HOME"
                    description="Cài đặt launcher giao diện tvOS mượt mà, gán làm màn hình chính mặc định và cấu hình dock app."
                    tagText="Dock: 4 Apps · Bypass setupwraith"
                    tagVariant="indigo"
                    checked={doInstallLauncher}
                    onChange={v => setDoInstallLauncher(v)}
                  />

                  <FeatureTile
                    title="Chế độ quản lý trẻ em (Kids Mode)"
                    description="Kích hoạt bộ hẹn giờ tắt TV (15/30/45/60 phút) kết hợp khóa màn hình mã PIN bảo vệ con trẻ."
                    tagText="Mã PIN mặc định: 0000"
                    tagVariant="amber"
                    checked={enableKidsMode}
                    onChange={v => setEnableKidsMode(v)}
                  />
                </div>
              </>
            )}

            {currentTab === 'select-tv' && (
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                  Chọn loại TV hỗ trợ Debloat
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 13.5, marginBottom: 20 }}>
                  Repo hỗ trợ sẵn các profile debloat tối ưu cho các dòng TV sau:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {profiles.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProfileId(p.id);
                        setDeviceModel(p.name);
                        alert(`Đã chọn profile: ${p.name}`);
                      }}
                      style={{
                        background: selectedProfileId === p.id ? 'rgba(99, 102, 241, 0.15)' : '#141E33',
                        border: selectedProfileId === p.id ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12,
                        padding: 16,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC', marginBottom: 4 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>
                        {p.packages.length} ứng dụng rác sẽ được dọn dẹp
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentTab === 'logs' && (
              <div style={{ height: '100%' }}>
                <LogViewer logs={logs} onClear={() => setLogs([])} />
              </div>
            )}

            {currentTab === 'restore' && (
              <div style={{ maxWidth: 500 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
                  Khôi phục launcher gốc
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 13.5, marginBottom: 20 }}>
                  Nếu có bất kỳ trục trặc nào, bấm nút bên dưới để hoàn nguyên 100% tivi về giao diện gốc:
                </p>
                <button
                  onClick={handleRestore}
                  style={{
                    background: '#EF4444',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: 10,
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <span>Thực hiện khôi phục ngay</span>
                </button>
              </div>
            )}
          </div>

          <ActionFooter
            stepsSummary={getSummary()}
            isExecuting={isExecuting}
            onRestore={handleRestore}
            onExecute={handleExecute}
          />
        </main>
      </div>

      <ConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onConnect={handleConnect}
        onPair={handlePair}
        currentHost={host}
        currentPort={port}
      />
    </div>
  );
}
