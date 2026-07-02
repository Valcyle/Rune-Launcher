import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Profiles from './pages/Profiles';

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

interface ModInfo {
  id: string;
  name: string;
  version: string;
  entrypoint: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'launcher' | 'profiles' | 'console'>('launcher');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Backend States
  const [profiles, setProfiles] = useState<string[]>([]);
  const [activeProfile, setActiveProfile] = useState<string>('Default');
  const [launchStatus, setLaunchStatus] = useState<string>('idle'); // idle, resolving, success, failed
  const [importStatus, setImportStatus] = useState<{ status: string; message: string }>({ status: '', message: '' });
  const [modsList, setModsList] = useState<ModInfo[]>([]);

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
          } else if (event === 'launchStatus') {
            setLaunchStatus(detail.status || 'idle');
          } else if (event === 'importStatus') {
            setImportStatus({ status: detail.status, message: detail.message });
            setTimeout(() => {
              setImportStatus({ status: '', message: '' });
            }, 5000);
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

  // Color mappings
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0a0a0f' : '#f8fafc',
    surface: isDark ? '#12121a' : '#ffffff',
    panel: isDark ? '#181824' : '#f1f5f9',
    border: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    glowGreen: '#10b981',
    glowPurple: '#a855f7',
    sidebarBg: isDark ? '#141419' : '#ffffff',
    sidebarActiveBg: isDark ? '#22222b' : '#e2e8f0',
    shadow: isDark ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.015)'
  };

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      minHeight: '100vh',
      backgroundColor: colors.bg,
      color: colors.text,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      {/* 1. Left Sidebar component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        colors={colors}
      />

      {/* 2. Main Tab View */}
      <main style={{
        flex: 1,
        padding: '40px 48px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        {activeTab === 'launcher' && (
          <Dashboard
            profiles={profiles}
            activeProfile={activeProfile}
            launchStatus={launchStatus}
            importStatus={importStatus}
            modsList={modsList}
            handleProfileChange={handleProfileChange}
            handleLaunch={handleLaunch}
            handleImportClick={handleImportClick}
            theme={theme}
            colors={colors}
          />
        )}

        {activeTab === 'profiles' && (
          <Profiles colors={colors} />
        )}

        {/* Global Keyframes Animation */}
        <style dangerouslySetInnerHTML={{__html: `
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
        `}} />
      </main>
    </div>
  );
}
