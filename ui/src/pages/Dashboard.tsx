import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ModInfo, ExternalInfo, MinecraftVersion } from '../App';
import Select from '../components/Select';
import Button from '../components/Button';
import IconButton from '../components/IconButton';
import Modal from '../components/Modal';
import Toggle from '../components/Toggle';
import Card from '../components/Card';

interface DashboardProps {
  profiles: string[];
  activeProfile: string;
  minecraftVersions: MinecraftVersion[];
  activeVersion: string;
  handleVersionChange: (val: string) => void;
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
  minecraftVersions,
  activeVersion,
  handleVersionChange,
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
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Rotating Tips system
  const tips = [
    "Tip: Drag and drop custom DLL files directly onto the launcher to import them.",
    "Tip: Enable different texture packs under the 'Manage Contents' tab to customize your game.",
    "Tip: You can configure updates and choose between Stable or Beta builds in the Settings tab.",
    "Tip: Rune Launcher isolates your modding environments per profile to keep your game stable.",
    "Tip: If Minecraft is not launched, launcher will attempt to launch it automatically."
  ];
  const [tipIndex, setTipIndex] = useState(0);
  const [tipOpacity, setTipOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipOpacity(0);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % tips.length);
        setTipOpacity(1);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, []);



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
      {/* Main Launcher Dashboard Panel */}
      <Card
        colors={colors}
        style={{
          padding: '28px',
          borderRadius: '12px',
          gap: '20px',
          boxShadow: theme === 'dark'
            ? '0 8px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 8px 30px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.01)',
          border: `1px solid ${colors.border}`,
          marginBottom: '8px'
        }}
      >
        {/* Header Module */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          {/* Left Side: Title & Selectors stacked vertically */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '340px' }}>
            <div>
              <h1 style={{
                fontSize: '36px',
                fontWeight: 800,
                margin: '0 0 6px 0',
                letterSpacing: '-1.2px',
                color: colors.text
              }}>
                {t('dashboard.title')}
              </h1>
              <p style={{ color: colors.textMuted, fontSize: '14.5px', margin: 0, fontWeight: 500 }}>
                {t('dashboard.subtitle')}
              </p>
            </div>

            {/* Version & Profile Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Version Select */}
              <Select
                value={activeVersion}
                onChange={handleVersionChange}
                options={[
                  { value: 'Official', label: 'Official (GDK)' },
                  ...minecraftVersions.map(v => ({ value: v.path, label: v.name }))
                ]}
                colors={colors}
                theme={theme}
                minWidth="190px"
                height="48px"
              />

              <Select
                value={activeProfile}
                onChange={handleProfileChange}
                options={profiles.length > 0 ? profiles.map(p => ({ value: p, label: p })) : [{ value: 'Default', label: 'Default' }]}
                colors={colors}
                theme={theme}
                minWidth="130px"
                height="48px"
              />

              <IconButton
                onClick={() => setShowCreateModal(true)}
                title={t('dashboard.createProfile')}
                colors={colors}
                size="48px"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </IconButton>

              <IconButton
                onClick={handleOpenProfileFolder}
                title="Open Profile Folder"
                colors={colors}
                size="48px"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </IconButton>
            </div>
          </div>

          {/* Right Side: Launch Button (aligns to the right, centered vertically relative to the left block) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
            <Button
              onClick={handleLaunch}
              disabled={launchStatus === 'resolving'}
              variant="primary"
              colors={colors}
              style={{
                padding: '14px 32px',
                fontSize: '24px',
                height: '60px',
                width: '210px',
                backgroundColor: launchStatus === 'resolving' ? '#4b5563' : undefined,
                boxShadow: launchStatus === 'resolving' ? 'none' : `0 4px 14px ${colors.glowGreen}33`
              }}
            >
              {launchStatus === 'resolving' ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px' }} />
                  <span>{t('dashboard.scanningProcess')}</span>
                </>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>{t('dashboard.launchButton')}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Launch Status Notification Panel */}
        {launchStatus !== 'idle' && (
          <div style={{
            padding: '18px 26px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            backgroundColor: launchStatus === 'resolving' ? `${colors.glowGreen}14` : launchStatus === 'success' ? `${colors.glowGreen}1a` : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${launchStatus === 'failed' ? 'rgba(239, 68, 68, 0.2)' : `${colors.glowGreen}33`}`,
            color: launchStatus === 'failed' ? '#ef4444' : colors.glowGreen,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: launchStatus === 'failed' ? '#ef4444' : colors.glowGreen,
              animation: launchStatus === 'resolving' ? 'pulse 1.5s infinite' : 'none'
            }} />
            {launchStatus === 'resolving' && t('dashboard.waitingLaunch')}
            {launchStatus === 'success' && t('dashboard.injectSuccess')}
            {launchStatus === 'failed' && t('dashboard.launchFailed')}
          </div>
        )}

        {/* Rotating Tips Module */}
        <div style={{
          padding: '14px 20px',
          backgroundColor: colors.panel,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${colors.glowGreen}`,
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', color: colors.glowGreen, flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="10" y1="22" x2="14" y2="22" />
            </svg>
          </div>
          <div style={{
            fontSize: '14px',
            color: colors.textMuted,
            fontWeight: 500,
            transition: 'opacity 0.3s ease-in-out',
            opacity: tipOpacity,
            lineHeight: 1.45
          }}>
            {tips[tipIndex]}
          </div>
        </div>
      </Card>

      {/* Split Grid: Installed Mods vs File Drop Importer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px'
      }}>
        {/* Left Column: Mods & Dependencies + Importer */}
        <Card
          title={t('dashboard.profileDependencies')}
          subtitle={t('dashboard.dependenciesDesc')}
          colors={colors}
          style={{ gap: '24px' }}
        >
          {/* Section 1: Client DLLs (externals) */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              {t('dashboard.externalClient')}
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
                    <span style={{ fontSize: '10.5px', color: colors.glowPurple, fontWeight: 600 }}>{t('dashboard.activeInject')}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: colors.textMuted, fontSize: '12px', border: `1px dashed ${colors.border}`, borderRadius: '6px' }}>
                  {t('dashboard.noDlls')}
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

          {/* Section 2: Mod Packages */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              {t('dashboard.installedMods')}
            </h4>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto',
              maxHeight: '160px',
              paddingRight: '4px'
            }}>
              {modsList.length > 0 ? (
                modsList.map((mod) => (
                  <div key={mod.id} style={{
                    padding: '10px 14px',
                    backgroundColor: colors.panel,
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: colors.text }}>{mod.name}</span>
                      <span style={{ fontSize: '10.5px', color: colors.textMuted }}>Version: {mod.version}</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: colors.glowGreen, fontWeight: 600 }}>{t('dashboard.ready')}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: colors.textMuted, fontSize: '12px', border: `1px dashed ${colors.border}`, borderRadius: '6px' }}>
                  {t('dashboard.noMods')}
                </div>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

          {/* Mod Importer Block */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              {t('dashboard.importMod')}
            </h4>
            <div
              onClick={handleImportClick}
              style={{
                border: `2px dashed ${colors.border}`,
                borderRadius: '8px',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: colors.panel,
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.glowGreen;
                e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(16,185,129,0.02)' : 'rgba(16,185,129,0.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.backgroundColor = colors.panel;
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: colors.textMuted }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'block' }}>{t('dashboard.chooseDll')}</span>
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
        </Card>

        {/* Right Column: Manage Contents (Phase 5 Mock UI) */}
        <Card
          title={t('dashboard.manageContents')}
          subtitle={t('dashboard.contentsDesc')}
          colors={colors}
        >
          {/* Tab buttons */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: '2px',
            gap: '12px'
          }}>
            {(['worlds', 'textures', 'skinpacks'] as const).map((tab) => {
              const isActive = contentTab === tab;
              const label = t(`dashboard.${tab}`);
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
                    {t('dashboard.noInstalled', { type: t(`dashboard.${contentTab}`) })}
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
                    {/* Switch/Toggle Button */}
                    <Toggle
                      checked={item.status}
                      onChange={() => toggleItem(item.id)}
                      colors={colors}
                    />

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
          <Button
            onClick={handleAddMockContent}
            variant="secondary"
            colors={colors}
            style={{
              padding: '10px',
              border: `1px dashed ${colors.border}`,
              backgroundColor: 'transparent',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t('dashboard.addMock', { type: t(`dashboard.${contentTab.slice(0, -1)}`) })}</span>
          </Button>
        </Card>
      </div>

      {/* Create Profile Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewProfileName('');
          setErrorMessage('');
        }}
        title={t('dashboard.createProfile')}
        colors={colors}
        width="380px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: '13px' }}>{t('dashboard.createProfileDesc')}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder={t('dashboard.profilePlaceholder')}
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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setNewProfileName('');
                setErrorMessage('');
              }}
              variant="secondary"
              colors={colors}
              style={{ padding: '8px 16px', fontSize: '13px', height: '36px' }}
            >
              {t('dashboard.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              colors={colors}
              style={{ padding: '8px 20px', fontSize: '13px', height: '36px' }}
            >
              {t('dashboard.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
