import { useState, useEffect } from 'react';

interface SettingsProps {
  colors: any;
  appVersion: string;
  onCheckUpdate: (manual: boolean) => void;
  updateStatusText: string;
  isCheckingUpdate: boolean;
}

export default function Settings({ colors, appVersion, onCheckUpdate, updateStatusText, isCheckingUpdate }: SettingsProps) {
  const [channel, setChannel] = useState<'stable' | 'beta'>('stable');

  useEffect(() => {
    const savedChannel = localStorage.getItem('updateChannel') as 'stable' | 'beta';
    if (savedChannel) {
      setChannel(savedChannel);
    }
  }, []);

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextChannel = e.target.value as 'stable' | 'beta';
    setChannel(nextChannel);
    localStorage.setItem('updateChannel', nextChannel);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600 }}>Settings</h2>
        <p style={{ margin: 0, color: colors.textMuted, fontSize: '14px' }}>Configure launcher update settings and application preferences.</p>
      </div>

      <div style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Version Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>App Version</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>Current installed version of Rune Launcher</div>
          </div>
          <div style={{
            fontFamily: 'monospace',
            backgroundColor: colors.panel,
            padding: '6px 12px',
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
            fontSize: '14px'
          }}>
            v{appVersion || '1.0.0'}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

        {/* Update Channel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>Update Channel</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>Choose between stable releases or experimental beta builds</div>
          </div>
          <select
            value={channel}
            onChange={handleChannelChange}
            style={{
              backgroundColor: colors.panel,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              outline: 'none',
              fontSize: '14px'
            }}
          >
            <option value="stable">Stable (Recommended)</option>
            <option value="beta">Beta (Experimental)</option>
          </select>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

        {/* Check Update Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>Check for Updates</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>Manually query GitHub for new update payloads</div>
          </div>
          <button
            onClick={() => onCheckUpdate(true)}
            disabled={isCheckingUpdate}
            style={{
              backgroundColor: isCheckingUpdate ? colors.panel : colors.glowPurple,
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              cursor: isCheckingUpdate ? 'default' : 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'background-color 0.2s',
              opacity: isCheckingUpdate ? 0.7 : 1
            }}
          >
            {isCheckingUpdate ? 'Checking...' : 'Check Now'}
          </button>
        </div>

        {updateStatusText && (
          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: updateStatusText.includes('available') ? colors.glowGreen : colors.textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: updateStatusText.includes('available') ? colors.glowGreen : colors.textMuted
            }} />
            {updateStatusText}
          </div>
        )}
      </div>
    </div>
  );
}
