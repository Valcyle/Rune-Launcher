import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import Button from '../components/Button';

interface AboutProps {
  colors: any;
}

export default function About({ colors }: AboutProps) {
  const { t } = useTranslation();

  const handleOpenGitHub = () => {
    // Send postMessage to native backend to open default browser
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        action: 'openUrl',
        data: { url: 'https://github.com/Valcyle/Rune-Launcher' }
      });
    } else {
      window.open('https://github.com/Valcyle/Rune-Launcher', '_blank');
    }
  };

  const handleOpenAuthor = () => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({
        action: 'openUrl',
        data: { url: 'https://github.com/Valcyle' }
      });
    } else {
      window.open('https://github.com/Valcyle', '_blank');
    }
  };

  const techs = [
    { name: 'C++ 20', color: colors.glowPurple },
    { name: 'Win32 API', color: colors.glowPurple },
    { name: 'WebView2', color: colors.glowPurple },
    { name: 'React 19', color: colors.glowGreen },
    { name: 'TypeScript', color: colors.glowGreen },
    { name: 'Vite', color: colors.glowGreen }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', width: '100%' }}>
      <div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: colors.text }}>
          {t('about.title')}
        </h2>
        <p style={{ margin: 0, color: colors.textMuted, fontSize: '14px' }}>
          {t('about.subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Credits */}
        <Card title={t('about.author')} colors={colors} style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: colors.panel,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.text,
                fontSize: '20px',
                fontWeight: 700
              }}>
                V
              </div>
              <div>
                <div style={{ fontWeight: 600, color: colors.text }}>Valcyle</div>
                <div style={{ fontSize: '12px', color: colors.textMuted }}>Main Developer / Maintainer</div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5, margin: '8px 0' }}>
              Rune Launcher is an open-source tool designed to ease Minecraft: Bedrock Edition mod management by automating DLL injection processes and isolating individual profile structures.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Button onClick={handleOpenAuthor} variant="secondary" colors={colors} style={{ padding: '8px 16px', fontSize: '13px', height: '36px' }}>
                GitHub Profile
              </Button>
              <Button onClick={handleOpenGitHub} variant="primary" colors={colors} style={{ padding: '8px 16px', fontSize: '13px', height: '36px', backgroundColor: colors.glowPurple, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}>
                {t('about.repoLink')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Column: Metadata / License */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title={t('about.tech')} subtitle={t('about.techDesc')} colors={colors}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {techs.map((tech) => (
                <span
                  key={tech.name}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    border: `1px solid ${tech.color}45`,
                    color: tech.color
                  }}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          </Card>

          <Card title={t('about.license')} colors={colors}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: colors.text }}>MIT License</div>
              <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
                {t('about.licenseDesc')} Free software for modification and distribution under copyright constraints.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
