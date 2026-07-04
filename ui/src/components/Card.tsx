interface CardProps {
  title?: string;
  subtitle?: string;
  colors: any;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function Card({
  title,
  subtitle,
  colors,
  style = {},
  children
}: CardProps) {
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {(title || subtitle) && (
        <div>
          {title && (
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: colors.text }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
