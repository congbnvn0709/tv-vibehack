import React, { useState, useEffect } from 'react';
import './styles/theme.css';
import { WindowHeader } from './components/WindowHeader';
import { Sidebar } from './components/Sidebar';
import { FeatureTile } from './components/FeatureTile';
import { ActionFooter } from './components/ActionFooter';
import { ConnectModal } from './components/ConnectModal';
import { LogViewer } from './components/LogViewer';
import { ManualDebloatModal } from './components/ManualDebloatModal';
import type { TvProfile } from '../../main/services/profile-service';
import type { ScannedPackage } from '../../main/services/package-scanner';

const FALLBACK_PROFILES: TvProfile[] = [
  { id: 'coocaa-swtv-24ae-4k', name: 'Coocaa SWTV-24AE-4K', debloatListPath: '', packages: new Array(13).fill('') },
  { id: 'xiaomi-mi-tv-4a', name: 'Xiaomi Mi TV 4A', debloatListPath: '', packages: new Array(21).fill('') },
  { id: 'xiaomi-mitv-axso0', name: 'Xiaomi MiTV AXSO0', debloatListPath: '', packages: new Array(29).fill('') },
  { id: 'tcl-g10-google-tv', name: 'TCL G10 Google TV', debloatListPath: '', packages: new Array(18).fill('') },
  { id: 'oneplus-tv-dubai', name: 'OnePlus TV Dubai', debloatListPath: '', packages: new Array(10).fill('') },
  { id: 'sanyo-atv-r2', name: 'Sanyo ATV-R2', debloatListPath: '', packages: new Array(29).fill('') },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('pipeline');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [host, setHost] = useState('192.168.1.21');
  const [port, setPort] = useState(5555);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceModel, setDeviceModel] = useState('Coocaa SWTV-24AE-4K');

  const [profiles, setProfiles] = useState<TvProfile[]>(FALLBACK_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState('coocaa-swtv-24ae-4k');

  // Config toggles
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [doBackup, setDoBackup] = useState(true);
  const [doDebloat, setDoDebloat] = useState(true);
  const [doInstallLauncher, setDoInstallLauncher] = useState(true);
  const [enableKidsMode, setEnableKidsMode] = useState(false);

  // Custom TV & Manual Debloat
  const [customTvName, setCustomTvName] = useState('Tivi khác (Tự cấu hình)');
  const [customDebloatMode, setCustomDebloatMode] = useState<'skip' | 'manual'>('skip');
  const [isManualDebloatOpen, setIsManualDebloatOpen] = useState(false);
  const [isScanningPackages, setIsScanningPackages] = useState(false);
  const [scannedPackages, setScannedPackages] = useState<ScannedPackage[]>([]);
  const [manualSelectedPackages, setManualSelectedPackages] = useState<string[]>([]);

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

  const handleTogglePackage = (pkgName: string) => {
    setManualSelectedPackages(prev =>
      prev.includes(pkgName) ? prev.filter(p => p !== pkgName) : [...prev, pkgName]
    );
  };

  const handleOpenManualDebloat = async () => {
    if (!isConnected) {
      setIsConnectOpen(true);
      return;
    }
    setIsManualDebloatOpen(true);
    setIsScanningPackages(true);
    try {
      if (window.tvApi?.scanPackages) {
        const pkgs = await window.tvApi.scanPackages(host, port);
        setScannedPackages(pkgs);
        // Preselect recommended debloat packages on initial scan if nothing selected yet
        if (manualSelectedPackages.length === 0) {
          const rec = pkgs.filter(p => p.isRecommended && !p.isProtected).map(p => p.packageName);
          setManualSelectedPackages(rec);
        }
      }
    } catch (err) {
      console.error('Lỗi khi quét ứng dụng từ TV:', err);
    } finally {
      setIsScanningPackages(false);
    }
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

    const isCustom = selectedProfileId === 'custom-tv';
    const effectiveDoDebloat = isCustom
      ? customDebloatMode === 'manual' && manualSelectedPackages.length > 0
      : doDebloat;

    const res = await window.tvApi.runPipeline({
      host,
      port,
      doBackup,
      doDebloat: effectiveDoDebloat,
      selectedProfileId: isCustom ? 'custom-tv' : selectedProfileId,
      customPackages: isCustom && customDebloatMode === 'manual' ? manualSelectedPackages : undefined,
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
    if (selectedProfileId === 'custom-tv') {
      if (customDebloatMode === 'manual' && manualSelectedPackages.length > 0) {
        steps.push(`Debloat (${manualSelectedPackages.length} app)`);
      } else {
        steps.push('Bỏ qua Debloat');
      }
    } else if (doDebloat) {
      steps.push('Debloat');
    }
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
                    tagText={
                      selectedProfileId === 'custom-tv'
                        ? customDebloatMode === 'skip'
                          ? 'Tùy chỉnh: Bỏ qua'
                          : `Thủ công: ${manualSelectedPackages.length} app`
                        : `Profile: ${selectedProfileId || 'Chung'}`
                    }
                    tagVariant="indigo"
                    checked={selectedProfileId === 'custom-tv' ? customDebloatMode === 'manual' && doDebloat : doDebloat}
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
                  Repo hỗ trợ sẵn các profile debloat tối ưu cho các dòng TV sau (chọn để áp dụng danh sách app rác cần xóa):
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                  {profiles.map(p => {
                    const isSelected = selectedProfileId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProfileId(p.id);
                          setDeviceModel(p.name);
                        }}
                        style={{
                          background: isSelected ? 'rgba(99, 102, 241, 0.16)' : '#141E33',
                          border: isSelected ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 12,
                          padding: 18,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC' }}>
                            {p.name}
                          </span>
                          {isSelected && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#34D399', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: 4 }}>
                              ✓ Đang chọn
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
                          {p.packages.length} ứng dụng rác được cấu hình dọn dẹp
                        </div>
                      </div>
                    );
                  })}

                  {/* 7th Card: Custom TV */}
                  {(() => {
                    const isCustom = selectedProfileId === 'custom-tv';
                    return (
                      <div
                        key="custom-tv"
                        onClick={() => {
                          setSelectedProfileId('custom-tv');
                          setDeviceModel(customTvName || 'Tivi khác (Tự cấu hình)');
                        }}
                        style={{
                          background: isCustom ? 'rgba(99, 102, 241, 0.16)' : '#141E33',
                          border: isCustom ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 12,
                          padding: 18,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Tivi khác / Tự cấu hình
                          </span>
                          {isCustom && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#34D399', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: 4 }}>
                              ✓ Đang chọn
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
                          Sony, Casper, LG, Android Box... (Bỏ qua hoặc quét app thủ công)
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {selectedProfileId === 'custom-tv' && (
                  <div
                    style={{
                      marginTop: 20,
                      background: '#0B1120',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 14,
                      padding: '20px 24px'
                    }}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#F8FAFC', marginBottom: 6 }}>
                        Tên model hoặc nhãn hiệu tivi của bạn:
                      </label>
                      <input
                        type="text"
                        value={customTvName}
                        onChange={e => {
                          setCustomTvName(e.target.value);
                          setDeviceModel(e.target.value || 'Tivi khác (Tự cấu hình)');
                        }}
                        placeholder="Ví dụ: Sony Bravia X80K, Casper Android TV, Mibox 4K..."
                        style={{
                          width: '100%',
                          maxWidth: 420,
                          background: '#141E33',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          color: '#fff',
                          fontSize: 13,
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', marginBottom: 10 }}>
                      Chọn phương thức dọn dẹp (Debloat):
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      {/* Option 1: Bỏ qua Debloat */}
                      <div
                        onClick={() => setCustomDebloatMode('skip')}
                        style={{
                          background: customDebloatMode === 'skip' ? 'rgba(16, 185, 129, 0.1)' : '#141E33',
                          border: customDebloatMode === 'skip' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 10,
                          padding: 16,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="customDebloatChoice"
                              checked={customDebloatMode === 'skip'}
                              onChange={() => setCustomDebloatMode('skip')}
                            />
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#F8FAFC' }}>
                              Bỏ qua Debloat (Khuyến nghị an toàn)
                            </span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#34D399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 4 }}>
                            An toàn 100%
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, paddingLeft: 24, lineHeight: 1.5 }}>
                          Chỉ cài Launcher tvOS và Kids Mode. Giữ nguyên toàn bộ ứng dụng gốc của TV, không sợ lỗi hay treo máy.
                        </p>
                      </div>

                      {/* Option 2: Debloat thủ công */}
                      <div
                        onClick={() => setCustomDebloatMode('manual')}
                        style={{
                          background: customDebloatMode === 'manual' ? 'rgba(99, 102, 241, 0.12)' : '#141E33',
                          border: customDebloatMode === 'manual' ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 10,
                          padding: 16,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="customDebloatChoice"
                              checked={customDebloatMode === 'manual'}
                              onChange={() => setCustomDebloatMode('manual')}
                            />
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#F8FAFC' }}>
                              Debloat thủ công (Quét từ TV)
                            </span>
                          </div>
                          {manualSelectedPackages.length > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#818CF8', background: 'rgba(99, 102, 241, 0.2)', padding: '2px 8px', borderRadius: 4 }}>
                              Đã chọn: {manualSelectedPackages.length} app
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, paddingLeft: 24, lineHeight: 1.5, marginBottom: 12 }}>
                          Quét trực tiếp app trên TV để bạn chọn app rác cần đóng băng. Khóa bảo vệ 100% Voice Search, HDMI, Remote.
                        </p>
                        <div style={{ paddingLeft: 24 }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setCustomDebloatMode('manual');
                              handleOpenManualDebloat();
                            }}
                            style={{
                              background: '#6366F1',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 14px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <span>Quét và chọn ứng dụng trên TV...</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      <ManualDebloatModal
        isOpen={isManualDebloatOpen}
        onClose={() => setIsManualDebloatOpen(false)}
        packages={scannedPackages}
        selectedPackages={manualSelectedPackages}
        onTogglePackage={handleTogglePackage}
        onSave={() => setIsManualDebloatOpen(false)}
        isLoading={isScanningPackages}
      />
    </div>
  );
}
