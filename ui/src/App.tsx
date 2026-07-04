import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';
import Settings from './pages/Settings';
import About from './pages/About';
import TitleBar from './components/TitleBar';
import Modal from './components/Modal';
import Button from './components/Button';
import './i18n';
import './App.css';

declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessage: (message: any) => void;
        addEventListener: (type: string, listener: (event: any) => void) => void;
        removeEventListener: (type: string, listener: (event: any) => void) => void;
      };
    };
  }
}

export interface ModInfo {
  id: string;
  name: string;
  version: string;
  entrypoint: string;
  enabled: boolean;
}

export interface ExternalInfo {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
}

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'launcher' | 'profiles' | 'settings' | 'about'>('launcher');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Backend States
  const [profiles, setProfiles] = useState<string[]>([]);
  const [activeProfile, setActiveProfile] = useState<string>('Default');
  const [launchStatus, setLaunchStatus] = useState<string>('idle'); // idle, resolving, success, failed
  const [importStatus, setImportStatus] = useState<{ status: string; message: string }>({ status: '', message: '' });
  const [modsList, setModsList] = useState<ModInfo[]>([]);
  const [externalsList, setExternalsList] = useState<ExternalInfo[]>([]);
  const [profileConfig, setProfileConfig] = useState<any>({
    disabled_mods: [],
    disabled_externals: [],
    mod_order: [],
    external_order: []
  });

  // Update States
  const [appVersion, setAppVersion] = useState<string>('Loading...');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateStatusText, setUpdateStatusText] = useState<string>('');
  const [updatePayload, setUpdatePayload] = useState<{ version: string; url: string; notes: string } | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [updateProcessStatus, setUpdateProcessStatus] = useState<'idle' | 'downloading' | 'applying' | 'failed'>('idle');

  // Toast States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Parse version string (e.g. "1.0.0-beta.1" -> { numbers: [1, 0, 0], prerelease: "beta.1" })
  const parseSemVer = (versionStr: string) => {
    const cleanStr = versionStr.replace(/^v/, '');
    const [mainPart, prereleasePart] = cleanStr.split('-');
    const numbers = mainPart.split('.').map(Number);
    return { numbers, prerelease: prereleasePart || null };
  };

  // Compare two SemVer versions
  const compareSemVer = (v1: string, v2: string): number => {
    const ver1 = parseSemVer(v1);
    const ver2 = parseSemVer(v2);

    for (let i = 0; i < 3; i++) {
      const n1 = ver1.numbers[i] || 0;
      const n2 = ver2.numbers[i] || 0;
      if (n1 < n2) return -1;
      if (n1 > n2) return 1;
    }

    if (ver1.prerelease && !ver2.prerelease) return -1;
    if (!ver1.prerelease && ver2.prerelease) return 1;
    if (!ver1.prerelease && !ver2.prerelease) return 0;

    if (ver1.prerelease! < ver2.prerelease!) return -1;
    if (ver1.prerelease! > ver2.prerelease!) return 1;
    return 0;
  };

  //never change this code unless it really needs to be changed (It is auto update system which is so important)
  const checkUpdates = async (currentVer: string, manual: boolean) => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    setUpdateStatusText('Checking for updates...');

    try {
      const channel = localStorage.getItem('updateChannel') || 'stable';
      let url = 'https://api.github.com/repos/Valcyle/Rune-Launcher/releases';
      if (channel === 'stable') {
        url = 'https://api.github.com/repos/Valcyle/Rune-Launcher/releases/latest';
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('GitHub API request failed');

      let latestRelease;
      if (channel === 'stable') {
        latestRelease = await res.json();
      } else {
        const releases = await res.json();
        if (!Array.isArray(releases) || releases.length === 0) {
          throw new Error('No releases found');
        }
        latestRelease = releases[0];
      }

      const remoteVersion = latestRelease.tag_name;
      const hasUpdate = compareSemVer(currentVer, remoteVersion) < 0;

      // Find the exe asset
      const exeAsset = latestRelease.assets?.find((a: any) => a.name.endsWith('.exe'));
      const downloadUrl = exeAsset ? exeAsset.browser_download_url : null;

      if (hasUpdate && downloadUrl) {
        setUpdatePayload({
          version: remoteVersion,
          url: downloadUrl,
          notes: latestRelease.body || 'No release notes provided.'
        });
        setUpdateStatusText(`New update available: ${remoteVersion}`);
        setShowUpdateModal(true);
      } else {
        setUpdateStatusText('Rune Launcher is up to date.');
        if (manual) {
          showToast('Rune Launcher is already up to date!', 'success');
        }
      }
    } catch (err) {
      console.error(err);
      setUpdateStatusText('Failed to check for updates.');
      if (manual) {
        showToast('Failed to check for updates. Please try again.', 'error');
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    let listenerRegistered = false;

    const handleMessage = (e: any) => {
      try {
        const payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        console.log("[DEBUG-React] Received message from C++:", payload);
        if (payload && payload.event && payload.detail) {
          const { event, detail } = payload;

          if (event === 'profilesUpdated') {
            setProfiles(detail.profiles || []);
            setActiveProfile(detail.active || 'Default');
            setModsList(detail.mods || []);
            setExternalsList(detail.externals || []);
            setProfileConfig(detail.config || {
              disabled_mods: [],
              disabled_externals: [],
              mod_order: [],
              external_order: []
            });
            if (detail.version) {
              setAppVersion(detail.version);
            }
          } else if (event === 'launchStatus') {
            setLaunchStatus(detail.status || 'idle');
          } else if (event === 'importStatus') {
            setImportStatus({ status: detail.status, message: detail.message });
            setTimeout(() => {
              setImportStatus({ status: '', message: '' });
            }, 5000);
          } else if (event === 'appVersion') {
            const ver = detail.version || '1.0.0';
            setAppVersion(ver);
            setTimeout(() => {
              checkUpdates(ver, false);
            }, 1000);
          } else if (event === 'updateStatus') {
            setUpdateProcessStatus(detail.status);
            if (detail.status === 'failed') {
              showToast('Automatic update failed to download or install.', 'error');
              setUpdateProcessStatus('idle');
            }
          } else if (event === 'createProfileStatus') {
            const { status, message } = detail;
            showToast(message, status === 'success' ? 'success' : 'error');
          } else if (event === 'deleteModStatus') {
            const { status, message } = detail;
            showToast(message, status === 'success' ? 'success' : 'error');
          }
        }
      } catch (err) {
        console.error("[DEBUG-React] Message parse error:", err);
      }
    };

    const initWebViewConnection = () => {
      console.log("[DEBUG-React] Checking for window.chrome.webview...");
      if (window.chrome?.webview) {
        console.log("[DEBUG-React] WebView2 found! Registering listener.");
        window.chrome.webview.addEventListener('message', handleMessage);
        listenerRegistered = true;
        sendMessageToHost({ action: 'getProfiles' });
        sendMessageToHost({ action: 'getAppVersion' });
      } else {
        setTimeout(initWebViewConnection, 50);
      }
    };

    initWebViewConnection();

    return () => {
      if (listenerRegistered && window.chrome?.webview) {
        window.chrome.webview.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const sendMessageToHost = (msg: { action: string; data?: any }) => {
    console.log("[DEBUG-React] Sending message to host:", msg);
    if (window.chrome?.webview?.postMessage) {
      window.chrome.webview.postMessage(msg);
    } else {
      console.warn('Host IPC Simulation (No Native Host):', msg);
    }
  };

  const handleProfileChange = (name: string) => {
    sendMessageToHost({ action: 'switchProfile', data: { name } });
  };

  const handleLaunch = () => {
    if (launchStatus === 'resolving') return;
    sendMessageToHost({ action: 'launchGame' });
  };

  const handleImportClick = () => {
    sendMessageToHost({ action: 'selectAndImportFile' });
  };

  const handleCreateProfile = (name: string) => {
    sendMessageToHost({ action: 'createProfile', data: { name } });
  };

  const handleOpenProfileFolder = () => {
    sendMessageToHost({ action: 'openProfileFolder' });
  };

  const handleSaveProfileConfig = (config: any) => {
    sendMessageToHost({ action: 'saveProfileConfig', data: { profile: activeProfile, config } });
  };

  const handleDeleteMod = (id: string, isExternal: boolean) => {
    sendMessageToHost({ action: 'deleteMod', data: { profile: activeProfile, id, isExternal } });
  };

  // Color mappings
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0e0f12' : '#f1f3f5',
    surface: isDark ? '#15171e' : '#ffffff',
    panel: isDark ? '#1b1e26' : '#f8fafc',
    border: isDark ? '#242835' : '#e4e4e7',
    text: isDark ? '#e3e3e6' : '#18181b',
    textMuted: isDark ? '#8c8c93' : '#71717a',
    glowGreen: '#10b981',
    glowPurple: '#8b5cf6',
    sidebarBg: isDark ? '#121318' : '#ffffff',
    sidebarActiveBg: isDark ? '#20232c' : '#e4e4e7',
    shadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100vh',
      backgroundColor: colors.bg,
      color: colors.text,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Native Drag Resize Overlays (Transparent border overlays to catch resizing clicks) */}
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'left' } })}
        style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', cursor: 'w-resize', zIndex: 9999, pointerEvents: 'auto' }}
      />
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'right' } })}
        style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', cursor: 'e-resize', zIndex: 9999, pointerEvents: 'auto' }}
      />
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'bottom' } })}
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', cursor: 's-resize', zIndex: 9999, pointerEvents: 'auto' }}
      />
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'top' } })}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', cursor: 'n-resize', zIndex: 9999, pointerEvents: 'auto' }}
      />
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'bottom-left' } })}
        style={{ position: 'absolute', bottom: 0, left: 0, width: '8px', height: '8px', cursor: 'sw-resize', zIndex: 10000, pointerEvents: 'auto' }}
      />
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'bottom-right' } })}
        style={{ position: 'absolute', bottom: 0, right: 0, width: '8px', height: '8px', cursor: 'se-resize', zIndex: 10000, pointerEvents: 'auto' }}
      />
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'top-left' } })}
        style={{ position: 'absolute', top: 0, left: 0, width: '8px', height: '8px', cursor: 'nw-resize', zIndex: 10000, pointerEvents: 'auto' }}
      />
      <div
        onMouseDown={() => sendMessageToHost({ action: 'dragResize', data: { direction: 'top-right' } })}
        style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', cursor: 'ne-resize', zIndex: 10000, pointerEvents: 'auto' }}
      />

      {/* 1. Custom Top Title Bar */}
      <TitleBar
        theme={theme}
        colors={colors}
        sendMessageToHost={sendMessageToHost}
        appVersion={appVersion}
      />

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 40px)',
        overflow: 'hidden'
      }}>
        {/* 2. Left Sidebar component */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          setTheme={setTheme}
          colors={colors}
        />

        {/* 3. Main Tab View */}
        <main style={{
          flex: 1,
          padding: '32px 40px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          boxSizing: 'border-box'
        }}>
          <div key={activeTab} className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: 1, width: '100%' }}>
            {activeTab === 'launcher' && (
              <Dashboard
                profiles={profiles}
                activeProfile={activeProfile}
                launchStatus={launchStatus}
                importStatus={importStatus}
                modsList={modsList}
                externalsList={externalsList}
                handleProfileChange={handleProfileChange}
                handleCreateProfile={handleCreateProfile}
                handleOpenProfileFolder={handleOpenProfileFolder}
                handleLaunch={handleLaunch}
                handleImportClick={handleImportClick}
                theme={theme}
                colors={colors}
              />
            )}

            {activeTab === 'profiles' && (
              <Profiles
                colors={colors}
                activeProfile={activeProfile}
                modsList={modsList}
                externalsList={externalsList}
                profileConfig={profileConfig}
                handleSaveProfileConfig={handleSaveProfileConfig}
                handleDeleteMod={handleDeleteMod}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                theme={theme}
                colors={colors}
                appVersion={appVersion}
                onCheckUpdate={(manual) => checkUpdates(appVersion, manual)}
                updateStatusText={updateStatusText}
                isCheckingUpdate={isCheckingUpdate}
              />
            )}

            {activeTab === 'about' && (
              <About
                colors={colors}
              />
            )}
          </div>

          {/* Global Keyframes Animation */}
          <style dangerouslySetInnerHTML={{
            __html: `
            .page-fade-in {
              animation: pageFadeIn 0.80s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              display: flex;
              flex-direction: column;
              flex: 1;
              width: 100%;
              transform-origin: top center;
            }
            @keyframes pageFadeIn {
              0% { opacity: 0; transform: scale(0.985) translateY(10px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            .sidebar-tooltip {
              visibility: hidden;
              opacity: 0;
              position: absolute;
              left: 52px;
              top: 50%;
              transform: translateY(-50%) translateX(-8px);
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.3px;
              white-space: nowrap;
              pointer-events: none;
              transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
              z-index: 1000;
            }
            .sidebar-btn-container:hover .sidebar-tooltip {
              visibility: visible;
              opacity: 1;
              transform: translateY(-50%) translateX(0);
            }
            .spinner {
              width: 14px;
              height: 14px;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-top: 2px solid #fff;
              borderRadius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.5; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(0.95); opacity: 0.5; }
            }
            body {
              margin: 0;
              padding: 0;
            }
            @keyframes toastSlideIn {
              0% { transform: translateY(20px) scale(0.95); opacity: 0; }
              100% { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}} />
        </main>
      </div>

      {/* Update Available Modal */}
      {updatePayload && (
        <Modal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title={t('dashboard.updateAvailable')}
          colors={colors}
          width="450px"
        >
          <p style={{ margin: '0 0 10px 0', color: colors.textMuted, fontSize: '13px' }}>{t('dashboard.updateDesc')}</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
            <span style={{ fontSize: '13px', padding: '3px 8px', borderRadius: '4px', backgroundColor: colors.panel, border: `1px solid ${colors.border}`, color: colors.text }}>v{appVersion}</span>
            <span style={{ color: colors.textMuted }}>➔</span>
            <span style={{ fontSize: '13px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.1)', border: `1px solid ${colors.glowPurple}`, color: colors.glowPurple, fontWeight: 500 }}>v{updatePayload.version}</span>
          </div>
          <div style={{
            backgroundColor: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '12px 16px',
            maxHeight: '140px',
            overflowY: 'auto',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            color: colors.textMuted,
            lineHeight: 1.5,
            textAlign: 'left'
          }}>
            {updatePayload.notes}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              onClick={() => setShowUpdateModal(false)}
              variant="secondary"
              colors={colors}
              style={{ padding: '8px 16px', fontSize: '13px', height: '36px' }}
            >
              {t('dashboard.remindLater')}
            </Button>
            <Button
              onClick={() => {
                setShowUpdateModal(false);
                sendMessageToHost({ action: 'triggerUpdate', data: { url: updatePayload.url } });
              }}
              variant="primary"
              colors={colors}
              style={{ backgroundColor: colors.glowPurple, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)', padding: '8px 20px', fontSize: '13px', height: '36px' }}
            >
              {t('dashboard.updateNow')}
            </Button>
          </div>
        </Modal>
      )}

      {/* Downloading/Applying Overlay */}
      {updateProcessStatus !== 'idle' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(10, 11, 14, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20000,
          gap: '16px',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="spinner" style={{ width: '32px', height: '32px', border: `3px solid ${colors.border}`, borderTop: `3px solid ${colors.glowPurple}` }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>
              {updateProcessStatus === 'downloading' ? 'Downloading Update...' : 'Applying Update...'}
            </div>
            <div style={{ color: colors.textMuted, fontSize: '13px' }}>
              {updateProcessStatus === 'downloading' ? 'Please keep launcher open. Retrying if network issues occur.' : 'Launcher is restarting to complete update.'}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: colors.surface,
          border: `1px solid ${toast.type === 'success' ? colors.glowGreen : toast.type === 'error' ? '#ef4444' : colors.border}`,
          borderRadius: '8px',
          padding: '12px 20px',
          color: colors.text,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          zIndex: 30000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          fontSize: '14px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: toast.type === 'success' ? colors.glowGreen : toast.type === 'error' ? '#ef4444' : colors.glowPurple
          }} />
          {toast.message}
        </div>
      )}
    </div>
  );
}
