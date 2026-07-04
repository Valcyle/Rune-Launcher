import { useState } from 'react';
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

  // Mock states for Content Management system (Phase 5)
  const [contentTab, setContentTab] = useState<'worlds' | 'textures' | 'skinpacks'>('worlds');
  const [mockWorlds, setMockWorlds] = useState([
    { id: 'w1', name: 'Survival World Pro', size: '154 MB', status: true, detail: 'Last played: 2 hours ago' },
    { id: 'w2', name: 'Creative Test Build', size: '12 MB', status: false, detail: 'Last played: Yesterday' }
  ]);
  const [mockTextures, setMockTextures] = useState([
    { id: 't1', name: 'Faithful 32x HD', size: '18 MB', status: true, detail: 'Author: Vattic' },
    { id: 't2', name: 'Bare Bones Texture', size: '4.5 MB', status: false, detail: 'Author: RobotFast' }
  ]);
  const [mockSkinpacks, setMockSkinpacks] = useState([
    { id: 's1', name: 'Fantasy Warriors Pack', size: '1.2 MB', status: true, detail: '14 custom skins' },
    { id: 's2', name: 'Retro Gaming Skins', size: '0.8 MB', status: false, detail: '8 custom skins' }
  ]);

  const handleAddMockContent = () => {
    const randomId = Math.random().toString(36).substring(2, 7);
    if (contentTab === 'worlds') {
      setMockWorlds([...mockWorlds, { id: randomId, name: `Imported World (${randomId})`, size: '8.4 MB', status: true, detail: 'Last played: Just now' }]);
    } else if (contentTab === 'textures') {
      setMockTextures([...mockTextures, { id: randomId, name: `Imported Texture (${randomId})`, size: '2.1 MB', status: true, detail: 'Author: Unknown' }]);
    } else {
      setMockSkinpacks([...mockSkinpacks, { id: randomId, name: `Imported Skins (${randomId})`, size: '0.4 MB', status: true, detail: '6 custom skins' }]);
    }
  };

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
            fontSize: '36px',
            fontWeight: 800,
            margin: '0 0 8px 0',
            letterSpacing: '-1.2px',
            color: colors.text
          }}>
            Rune Launcher
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '14.5px', margin: 0, fontWeight: 500 }}>
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
                padding: '12px 18px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.text,
                fontSize: '15px',
                fontWeight: 600,
                height: '48px',
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
                padding: '12px',
                width: '48px',
                height: '48px',
                borderRadius: '8px',
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                padding: '12px',
                width: '48px',
                height: '48px',
                borderRadius: '8px',
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              padding: '16px 32px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '20px',
              cursor: launchStatus === 'resolving' ? 'not-allowed' : 'pointer',
              background: launchStatus === 'resolving' ? '#4b5563' : hovered === 'launch' ? '#059669' : colors.glowGreen,
              color: '#fff',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              outline: 'none',
              boxShadow: launchStatus === 'resolving' ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            {launchStatus === 'resolving' ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }} />
                <span>SCANNING PROCESS...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Launch</span>
              </>
            )}
          </button>
        </div>
      </div>

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
        gridTemplateColumns: '1fr 1fr',
        gap: '32px'
      }}>
        {/* Left Column: Mods & Dependencies + Importer */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: colors.text }}>Profile Dependencies</h3>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
              Active mods and client DLL dependencies for this profile
            </p>
          </div>

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

          <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: '4px 0' }} />

          {/* Integrated Importer Section */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              Import New Mod / DLL
            </h4>
            <div
              onClick={handleImportClick}
              onMouseEnter={() => setHovered('import')}
              onMouseLeave={() => setHovered(null)}
              style={{
                border: `1.5px dashed ${hovered === 'import' ? colors.glowGreen : colors.border}`,
                backgroundColor: hovered === 'import' ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.04)' : '#f0fdf4') : colors.panel,
                borderRadius: '6px',
                padding: '24px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ display: 'inline-block', marginBottom: '6px', color: hovered === 'import' ? colors.glowGreen : colors.textMuted }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'block' }}>Choose DLL or Package</span>
              <span style={{ fontSize: '10.5px', color: colors.textMuted }}>Resolves dependencies dynamically</span>
            </div>

            {importStatus.message && (
              <div style={{
                marginTop: '12px',
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

        {/* Right Column: Manage Contents (Phase 5 Mock UI) */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: colors.text }}>Manage Contents</h3>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
              Customize Worlds, Textures, and Skinpacks for this profile (Simulated UI)
            </p>
          </div>

          {/* Tab buttons */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: '2px',
            gap: '12px'
          }}>
            {(['worlds', 'textures', 'skinpacks'] as const).map((tab) => {
              const isActive = contentTab === tab;
              const label = tab.charAt(0).toUpperCase() + tab.slice(1);
              return (
                <button
                  key={tab}
                  onClick={() => setContentTab(tab)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? `2px solid ${colors.glowGreen}` : '2px solid transparent',
                    color: isActive ? colors.text : colors.textMuted,
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    marginBottom: '-2px'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* List items depending on contentTab */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '340px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {/* Render items */}
            {(() => {
              const currentList = contentTab === 'worlds' ? mockWorlds 
                                : contentTab === 'textures' ? mockTextures 
                                : mockSkinpacks;
              
              const toggleItem = (id: string) => {
                if (contentTab === 'worlds') {
                  setMockWorlds(mockWorlds.map(w => w.id === id ? { ...w, status: !w.status } : w));
                } else if (contentTab === 'textures') {
                  setMockTextures(mockTextures.map(t => t.id === id ? { ...t, status: !t.status } : t));
                } else {
                  setMockSkinpacks(mockSkinpacks.map(s => s.id === id ? { ...s, status: !s.status } : s));
                }
              };

              const deleteItem = (id: string) => {
                if (contentTab === 'worlds') {
                  setMockWorlds(mockWorlds.filter(w => w.id !== id));
                } else if (contentTab === 'textures') {
                  setMockTextures(mockTextures.filter(t => t.id !== id));
                } else {
                  setMockSkinpacks(mockSkinpacks.filter(s => s.id !== id));
                }
              };

              if (currentList.length === 0) {
                return (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: colors.textMuted,
                    fontSize: '12px',
                    border: `1px dashed ${colors.border}`,
                    borderRadius: '6px',
                    margin: '10px 0'
                  }}>
                    No {contentTab} installed.
                  </div>
                );
              }

              return currentList.map((item) => (
                <div key={item.id} style={{
                  padding: '12px 14px',
                  backgroundColor: colors.panel,
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  transition: 'opacity 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* SVG Icon depending on tab */}
                    <div style={{ color: item.status ? colors.glowGreen : colors.textMuted, display: 'flex', alignItems: 'center' }}>
                      {contentTab === 'worlds' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                          <path d="M2 12h20" />
                        </svg>
                      )}
                      {contentTab === 'textures' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
                          <path d="M9 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                          <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      )}
                      {contentTab === 'skinpacks' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      <span style={{ fontSize: '11px', color: colors.textMuted }}>{item.detail} • {item.size}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Switch/Toggle Button (Mock) */}
                    <button
                      onClick={() => toggleItem(item.id)}
                      style={{
                        width: '34px',
                        height: '20px',
                        borderRadius: '10px',
                        backgroundColor: item.status ? colors.glowGreen : colors.border,
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        padding: 0,
                        transition: 'background-color 0.2s',
                        outline: 'none'
                      }}
                    >
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        position: 'absolute',
                        top: '3px',
                        left: item.status ? '17px' : '3px',
                        transition: 'left 0.2s'
                      }} />
                    </button>

                    {/* Delete Button (Mock) */}
                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: colors.textMuted,
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.15s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = colors.textMuted}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Quick Import Button */}
          <button
            onClick={handleAddMockContent}
            style={{
              padding: '10px',
              backgroundColor: 'transparent',
              border: `1px dashed ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.glowGreen;
              e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(16, 185, 129, 0.04)' : '#f0fdf4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Mock {contentTab === 'worlds' ? 'World' : contentTab === 'textures' ? 'Texture' : 'Skinpack'}</span>
          </button>
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
