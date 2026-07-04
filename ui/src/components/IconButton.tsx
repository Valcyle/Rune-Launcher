import { useState } from 'react';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  colors: any;
  size?: string;
  children: React.ReactNode;
}

export default function IconButton({
  onClick,
  title,
  colors,
  size = '48px',
  children
}: IconButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        padding: '12px',
        width: size,
        height: size,
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        backgroundColor: hovered ? colors.panel : colors.surface,
        outline: 'none',
        boxSizing: 'border-box'
      }}
      title={title}
    >
      {children}
    </button>
  );
}
