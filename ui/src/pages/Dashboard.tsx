import { useState } from 'react';
import PipelineMap from '../components/PipelineMap';

interface ModInfo {
  id: string;
  name: string;
  version: string;
  entrypoint: string;
}

interface DashboardProps {
  profiles: string[];
  activeProfile: string;
  launchStatus: string;
  importStatus: { status: string; message: string };
  modsList: ModInfo[];
  handleProfileChange: (name: string) => void;
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
  handleProfileChange,
  handleLaunch,
  handleImportClick,
  theme,
  colors
}: DashboardProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <>
      {/* Header Module */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 900,
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px',
            background: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Rune Launcher
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>
            Isolated process loader pipeline & multi-client coordinator
          </p>
        </div>

        {/* Profile Picker & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <select
            value={activeProfile}
            onChange={(e) => handleProfileChange(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              fontSize: '13.5px',
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
            onClick={handleLaunch}
            onMouseEnter={() => setHovered('launch')}
            onMouseLeave={() => setHovered(null)}
            disabled={launchStatus === 'resolving'}
            style={{
              padding: '11px 24px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '14.5px',
              cursor: launchStatus === 'resolving' ? 'not-allowed' : 'pointer',
              background: launchStatus === 'resolving' ? '#4b5563' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              boxShadow: hovered === 'launch' && launchStatus !== 'resolving' ? '0 4px 15px rgba(16, 185, 129, 0.25)' : 'none',
              transform: hovered === 'launch' && launchStatus !== 'resolving' ? 'translateY(-1px)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              outline: 'none'
            }}
          >
            {launchStatus === 'resolving' ? (
              <>
                <div className="spinner" />
                <span>SCANNING PROCESS...</span>
              </>
            ) : (
              <span>LOAD PIPELINE</span>
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
          borderRadius: '12px',
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
          {launchStatus === 'resolving' && 'ゲーム起動待機中... マインクラフト統合版プロセス (Minecraft.Windows.exe) を検知すると自動インジェクションを実行します。'}
          {launchStatus === 'success' && 'DLLインジェクションに成功しました！ランチャー機能がロードされました。'}
          {launchStatus === 'failed' && 'ゲーム起動処理に失敗しました。詳細についてはログをご確認ください。'}
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
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: colors.text }}>Profile Dependencies</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {modsList.length > 0 ? (
              modsList.map((m) => (
                <div key={m.id} style={{
                  padding: '14px',
                  backgroundColor: colors.panel,
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: colors.text }}>{m.name}</span>
                    <span style={{ fontSize: '11px', color: colors.glowGreen, backgroundColor: theme === 'dark' ? 'rgba(16,185,129,0.08)' : '#e6fbf2', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>v{m.version}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.textMuted }}>
                    <span>Target DLL: `{m.entrypoint}`</span>
                    <span>Dependencies resolved</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px' }}>
                No active mods found in this profile.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Importer Card */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: colors.text }}>Import Mod</h3>
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
              backgroundColor: colors.panel,
              borderRadius: '12px',
              padding: '36px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📥</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'block' }}>Choose DLL or Package</span>
            <span style={{ fontSize: '10.5px', color: colors.textMuted }}>Resolves dependencies dynamically</span>
          </div>

          {importStatus.message && (
            <div style={{
              marginTop: '16px',
              padding: '10px',
              borderRadius: '8px',
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
    </>
  );
}
