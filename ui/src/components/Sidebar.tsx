
interface SidebarProps {
  activeTab: 'launcher' | 'profiles' | 'console' | 'settings';
  setActiveTab: (tab: 'launcher' | 'profiles' | 'console' | 'settings') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  colors: any;
}

export default function Sidebar({ activeTab, setActiveTab, theme, setTheme, colors }: SidebarProps) {
  return (
    <aside style={{
      width: '68px',
      backgroundColor: colors.sidebarBg,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0',
      justifyContent: 'space-between',
      transition: 'background-color 0.3s'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.panel,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            color: colors.text
          }}>
            R
          </div>
        </div>

        {/* Dashboard Tab Icon */}
        <button
          onClick={() => setActiveTab('launcher')}
          style={{
            background: 'transparent',
            border: 'none',
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            color: activeTab === 'launcher' ? colors.glowGreen : colors.textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: activeTab === 'launcher' ? (theme === 'dark' ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)') : 'transparent'
          }}
          title="Pipeline Dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
        </button>

        {/* Profiles Tab Icon */}
        <button
          onClick={() => setActiveTab('profiles')}
          style={{
            background: 'transparent',
            border: 'none',
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            color: activeTab === 'profiles' ? colors.glowGreen : colors.textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: activeTab === 'profiles' ? (theme === 'dark' ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)') : 'transparent'
          }}
          title="Profile Configuration"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </button>

        {/* Settings Tab Icon */}
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'transparent',
            border: 'none',
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            color: activeTab === 'settings' ? colors.glowGreen : colors.textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: activeTab === 'settings' ? (theme === 'dark' ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)') : 'transparent'
          }}
          title="Launcher Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{
          background: 'transparent',
          border: 'none',
          color: colors.textMuted,
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {theme === 'dark' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
        )}
      </button>
    </aside>
  );
}
