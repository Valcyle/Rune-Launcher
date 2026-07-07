import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '../components/Select';
import Button from '../components/Button';
import Toggle from '../components/Toggle';

interface SettingsProps {
  theme: 'dark' | 'light';
  colors: any;
  appVersion: string;
  onCheckUpdate: (manual: boolean) => void;
  updateStatusText: string;
  isCheckingUpdate: boolean;
  scanThirdParty: boolean;
  onScanThirdPartyChange: (val: boolean) => void;
}

export default function Settings({
  theme,
  colors,
  appVersion,
  onCheckUpdate,
  updateStatusText,
  isCheckingUpdate,
  scanThirdParty,
  onScanThirdPartyChange
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  const [channel, setChannel] = useState<'stable' | 'beta'>('stable');

  useEffect(() => {
    const savedChannel = localStorage.getItem('updateChannel') as 'stable' | 'beta';
    if (savedChannel) {
      setChannel(savedChannel);
    }
  }, []);

  const handleChannelChange = (val: string) => {
    const nextChannel = val as 'stable' | 'beta';
    setChannel(nextChannel);
    localStorage.setItem('updateChannel', nextChannel);
  };

  const channelOptions = [
    { value: 'stable', label: t('settings.stable') },
    { value: 'beta', label: t('settings.beta') }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', textAlign: 'left' }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: colors.text }}>{t('settings.title')}</h2>
        <p style={{ margin: 0, color: colors.textMuted, fontSize: '14px' }}>{t('settings.desc')}</p>
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
            <div style={{ fontWeight: 500, marginBottom: '4px', color: colors.text }}>{t('settings.appVersion')}</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>{t('settings.appVersionDesc')}</div>
          </div>
          <div style={{
            fontFamily: 'monospace',
            backgroundColor: colors.panel,
            padding: '6px 12px',
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
            fontSize: '14px',
            color: colors.text
          }}>
            v{appVersion || '1.0.0'}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

        {/* Update Channel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px', color: colors.text }}>{t('settings.updateChannel')}</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>{t('settings.updateChannelDesc')}</div>
          </div>
          <Select
            value={channel}
            onChange={handleChannelChange}
            options={channelOptions}
            colors={colors}
            theme={theme}
            minWidth="200px"
            height="38px"
          />
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

        {/* Check Update Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px', color: colors.text }}>{t('settings.checkUpdates')}</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>{t('settings.checkUpdatesDesc')}</div>
          </div>
          <Button
            onClick={() => onCheckUpdate(true)}
            disabled={isCheckingUpdate}
            variant={isCheckingUpdate ? 'secondary' : 'primary'}
            colors={colors}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              height: '38px',
              backgroundColor: isCheckingUpdate ? colors.panel : colors.glowPurple,
              boxShadow: isCheckingUpdate ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.2)'
            }}
          >
            {isCheckingUpdate ? t('settings.checking') : t('settings.checkNow')}
          </Button>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

        {/* Language Selection */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px', color: colors.text }}>{t('settings.language')}</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>{t('settings.languageDesc')}</div>
          </div>
          <Select
            value={i18n.language.split('-')[0]} // Normalise code like ja-JP -> ja
            onChange={(val) => {
              i18n.changeLanguage(val);
              localStorage.setItem('language', val);
            }}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ja', label: '日本語' }
            ]}
            colors={colors}
            theme={theme}
            minWidth="200px"
            height="38px"
          />
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: 0 }} />

        {/* Scan Third-Party Versions Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '4px', color: colors.text }}>{t('settings.scanVersions')}</div>
            <div style={{ fontSize: '13px', color: colors.textMuted }}>{t('settings.scanVersionsDesc')}</div>
          </div>
          <Toggle
            checked={scanThirdParty}
            onChange={() => onScanThirdPartyChange(!scanThirdParty)}
            colors={colors}
          />
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
