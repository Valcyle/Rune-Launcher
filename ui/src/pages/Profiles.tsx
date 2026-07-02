
interface ProfilesProps {
  colors: any;
}

export default function Profiles({ colors }: ProfilesProps) {
  return (
    <div style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '36px',
      boxShadow: colors.shadow
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: colors.text }}>Profile Directory Settings</h2>
      <p style={{ color: colors.textMuted, fontSize: '13px', margin: '0 0 24px 0' }}>
        ランチャーのプロファイル配置やグローバルデータパスを構成します。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '16px',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: colors.text }}>RuneCore.dll Hook Path</h4>
            <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>インジェクターのベースフックライブラリのパスを指定します。</p>
          </div>
          <code style={{ fontSize: '12px', background: colors.panel, padding: '4px 8px', borderRadius: '4px', color: colors.text }}>
            [Launcher Root]/RuneCore.dll
          </code>
        </div>
      </div>
    </div>
  );
}
