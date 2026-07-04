import { useState } from 'react';

interface ButtonProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  colors: any;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function Button({
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  colors,
  style = {},
  children
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);

  let bg = colors.surface;
  let fg = colors.text;
  let border = `1px solid ${colors.border}`;
  let shadow = 'none';

  if (variant === 'primary') {
    bg = disabled ? '#4b5563' : colors.glowGreen;
    fg = '#fff';
    border = 'none';
    shadow = disabled ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)';
  } else if (variant === 'secondary') {
    bg = colors.surface;
    fg = colors.text;
    border = `1px solid ${colors.border}`;
  } else if (variant === 'danger') {
    bg = '#ef4444';
    fg = '#fff';
    border = 'none';
  }

  // Clean up undefined properties from style overrides to prevent them from wiping out default styles
  const cleanStyle = { ...style };
  if (cleanStyle.backgroundColor === undefined) delete cleanStyle.backgroundColor;
  if (cleanStyle.background === undefined) delete cleanStyle.background;
  if (cleanStyle.color === undefined) delete cleanStyle.color;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '12px 24px',
        borderRadius: '8px',
        border,
        fontWeight: 700,
        fontSize: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: bg,
        color: fg,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        outline: 'none',
        boxShadow: shadow,
        boxSizing: 'border-box',
        filter: (!disabled && hovered) ? 'brightness(1.08)' : 'none',
        transform: (!disabled && hovered) ? 'translateY(-1.5px)' : 'none',
        ...cleanStyle
      }}
    >
      {children}
    </button>
  );
}
