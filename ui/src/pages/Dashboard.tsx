import { useState } from 'react';
import PipelineMap from '../components/PipelineMap';
import type { ModInfo, ExternalInfo } from '../App';

interface DashboardProps {
  profiles: string[];
  activeProfile: string;
  launchStatus: string;
  importStatus: { status: string; message: string };
  modsList: ModInfo[];
  externalsList: ExternalInfo[];
  handleProfileChange: (name: string) => void;
  handleCreateProfile: (name: string) => void;
  handleOpenProfileFolder: () => void;
  handleLaunch: () => void;
  handleImportClick: () => void;
  theme: 'dark' | 'light';
  colors: any;
}

export default function Dashboard({
  profiles,
  activeProfile,
  launchStatus,
  importStatus,
  modsList,
  externalsList,
  handleProfileChange,
  handleCreateProfile,
  handleOpenProfileFolder,
  handleLaunch,
  handleImportClick,
  theme,
  colors
}: DashboardProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const trimmed = newProfileName.trim();
    if (!trimmed) {
      setErrorMessage('Profile name cannot be empty.');
      return;
    }

    // Validate name: alphanumeric, dashes, underscores
    const validRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validRegex.test(trimmed)) {
      setErrorMessage('Invalid name. Only letters, numbers, dash (-), and underscore (_) are allowed.');
      return;
    }

    handleCreateProfile(trimmed);
    setNewProfileName('');
    setShowCreateModal(false);
  };

  return (
    <>
      {/* Header Module */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            margin: '0 0 6px 0',
            letterSpacing: '-0.8px',
            color: colors.text
          }}>
            Rune Launcher
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>
            Isolated process loader pipeline & multi-client coordinator
          </p>
        </div>
 
        {/* Profile Picker & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={activeProfile}
              onChange={(e) => handleProfileChange(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.text,
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {profiles.length > 0 ? (
                profiles.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))
              ) : (
                <option value="Default">Default</option>
              )}
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              onMouseEnter={() => setHovered('createBtn')}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                padding: '8px 12px',
                height: '37px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                backgroundColor: hovered === 'createBtn' ? colors.panel : colors.surface,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              title="Create New Profile"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <button
              onClick={handleOpenProfileFolder}
              onMouseEnter={() => setHovered('openFolderBtn')}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                padding: '8px 12px',
                height: '37px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                backgroundColor: hovered === 'openFolderBtn' ? colors.panel : colors.surface,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              title="Open Profile Folder"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
 
          <button
            onClick={handleLaunch}
            onMouseEnter={() => setHovered('launch')}
            onMouseLeave={() => setHovered(null)}
            disabled={launchStatus === 'resolving'}
            style={{
              padding: '9px 20px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: launchStatus === 'resolving' ? 'not-allowed' : 'pointer',
              background: launchStatus === 'resolving' ? '#4b5563' : hovered === 'launch' ? '#059669' : colors.glowGreen,
              color: '#fff',
              transition: 'background 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none'
            }}
          >
            {launchStatus === 'resolving' ? (
              <>
                <div className="spinner" />
                <span>SCANNING PROCESS...</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Launch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Map Component */}
      <PipelineMap launchStatus={launchStatus} colors={colors} />

      {/* Launch Status Notification Panel */}
      {launchStatus !== 'idle' && (
        <div style={{
          padding: '16px 24px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          backgroundColor: launchStatus === 'resolving' ? 'rgba(16, 185, 129, 0.08)' : launchStatus === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${launchStatus === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
          color: launchStatus === 'failed' ? '#ef4444' : '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: launchStatus === 'failed' ? '#ef4444' : '#10b981',
            animation: launchStatus === 'resolving' ? 'pulse 1.5s infinite' : 'none'
          }} />
          {launchStatus === 'resolving' && 'Waiting for game launch... The launcher will automatically inject when Minecraft.Windows.exe is detected.'}
          {launchStatus === 'success' && 'DLL injection successful! Launcher features have been loaded.'}
          {launchStatus === 'failed' && 'Failed to launch the game. Please check the logs for details.'}
        </div>
      )}

      {/* Split Grid: Installed Mods vs File Drop Importer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '32px'
      }}>
        {/* Left Column: Mods & Dependencies */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: colors.text }}>Profile Dependencies</h3>

          {/* Section 1: Client DLLs (externals) */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              External Client (Step 2 DLLs)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {externalsList.length > 0 ? (
                externalsList.map((ext) => (
                  <div key={ext.path} style={{
                    padding: '10px 14px',
                    backgroundColor: colors.panel,
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 600, color: colors.text }}>{ext.name}</span>
                    <span style={{ fontSize: '10.5px', color: colors.glowPurple, fontWeight: 600 }}>Active Inject Target</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: colors.textMuted, fontSize: '12px', border: `1px dashed ${colors.border}`, borderRadius: '6px' }}>
                  No custom client DLLs loaded.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Mod Packages (modsList) */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              Mod Packages (Step 3 DLLs)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modsList.length > 0 ? (
                modsList.map((m) => (
                  <div key={m.id} style={{
                    padding: '14px',
                    backgroundColor: colors.panel,
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: colors.text }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: colors.glowGreen, backgroundColor: theme === 'dark' ? 'rgba(16,185,129,0.08)' : '#e6fbf2', padding: '2px 8px', borderRadius: '2px', fontWeight: 600 }}>v{m.version}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.textMuted }}>
                      <span>Target DLL: `{m.entrypoint}`</span>
                      <span>Dependencies resolved</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: colors.textMuted, fontSize: '12px', border: `1px dashed ${colors.border}`, borderRadius: '6px' }}>
                  No active mods found in this profile.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Importer Card */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: colors.text }}>Import Mod</h3>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '0 0 20px 0' }}>
              Select DLL or .runemod files to add to active profile
            </p>
          </div>

          <div
            onClick={handleImportClick}
            onMouseEnter={() => setHovered('import')}
            onMouseLeave={() => setHovered(null)}
            style={{
              border: `1.5px dashed ${hovered === 'import' ? colors.glowGreen : colors.border}`,
              backgroundColor: hovered === 'import' ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.04)' : '#f0fdf4') : colors.panel,
              borderRadius: '6px',
              padding: '36px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ display: 'inline-block', marginBottom: '8px', color: hovered === 'import' ? colors.glowGreen : colors.textMuted }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'block' }}>Choose DLL or Package</span>
            <span style={{ fontSize: '10.5px', color: colors.textMuted }}>Resolves dependencies dynamically</span>
          </div>

          {importStatus.message && (
            <div style={{
              marginTop: '16px',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center',
              backgroundColor: importStatus.status === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${importStatus.status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              color: importStatus.status === 'success' ? colors.glowGreen : '#ef4444'
            }}>
              {importStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)'
        }}>
          <form onSubmit={handleCreateSubmit} style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            width: '380px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: colors.text }}>Create Profile</h3>
              <p style={{ margin: 0, color: colors.textMuted, fontSize: '13px' }}>Enter a name for the new modding environment.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. Modded-1.20"
                value={newProfileName}
                onChange={(e) => {
                  setNewProfileName(e.target.value);
                  setErrorMessage('');
                }}
                autoFocus
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  background: colors.panel,
                  color: colors.text,
                  fontSize: '13px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              {errorMessage && (
                <span style={{ fontSize: '11px', color: '#ef4444' }}>{errorMessage}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProfileName('');
                  setErrorMessage('');
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: colors.glowGreen,
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
