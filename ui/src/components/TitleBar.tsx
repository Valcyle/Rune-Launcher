import { useState } from 'react';

interface TitleBarProps {
  theme: 'dark' | 'light';
  colors: any;
  sendMessageToHost: (msg: { action: string; data?: any }) => void;
}

export default function TitleBar({ theme, colors, sendMessageToHost }: TitleBarProps) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleMinimize = () => {
    sendMessageToHost({ action: 'minimizeWindow' });
  };

  const handleMaximize = () => {
    sendMessageToHost({ action: 'maximizeWindow' });
  };

  const handleClose = () => {
    sendMessageToHost({ action: 'closeWindow' });
  };

  const isDark = theme === 'dark';

  return (
    <header style={{
      width: '100%',
      height: '40px',
      backgroundColor: colors.sidebarBg,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      boxSizing: 'border-box',
      userSelect: 'none',
      transition: 'background-color 0.3s, border-color 0.3s',
      position: 'relative',
      zIndex: 999
    }}>
      {/* Draggable Title Area */}
      <div 
        className="titlebar-drag-region"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
          height: '100%',
          cursor: 'default'
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: 800,
          color: colors.textMuted,
          letterSpacing: '1.2px',
          textTransform: 'uppercase'
        }}>
          Rune Launcher
        </span>
        <span style={{
          fontSize: '9px',
          color: colors.glowGreen,
          backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#e6fbf2',
          padding: '1px 6px',
          borderRadius: '3px',
          fontWeight: 700
        }}>
          v1.0.0
        </span>
      </div>

      {/* Window Controls (Minimize / Maximize / Close) */}
      <div 
        className="titlebar-button"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          gap: '4px'
        }}
      >
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          onMouseEnter={() => setHoveredBtn('min')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            border: 'none',
            background: hoveredBtn === 'min' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: colors.text,
            transition: 'background 0.2s',
            outline: 'none'
          }}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Maximize/Restore Button */}
        <button
          onClick={handleMaximize}
          onMouseEnter={() => setHoveredBtn('max')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            border: 'none',
            background: hoveredBtn === 'max' ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : 'transparent',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: colors.text,
            transition: 'background 0.2s',
            outline: 'none'
          }}
          title="Maximize"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </button>

        {/* Close Button */}
        <button
          onClick={handleClose}
          onMouseEnter={() => setHoveredBtn('close')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            border: 'none',
            background: hoveredBtn === 'close' ? '#ef4444' : 'transparent',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: hoveredBtn === 'close' ? '#ffffff' : colors.text,
            transition: 'all 0.2s',
            outline: 'none'
          }}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
