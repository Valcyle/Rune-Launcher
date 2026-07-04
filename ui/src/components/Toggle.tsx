interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  colors: any;
  disabled?: boolean;
}

export default function Toggle({
  checked,
  onChange,
  colors,
  disabled = false
}: ToggleProps) {
  return (
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      style={{
        width: '34px',
        height: '20px',
        borderRadius: '10px',
        backgroundColor: checked ? colors.glowGreen : colors.border,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        padding: 0,
        transition: 'background-color 0.2s',
        outline: 'none',
        opacity: disabled ? 0.6 : 1,
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: '3px',
          left: checked ? '17px' : '3px',
          transition: 'left 0.2s'
        }}
      />
    </button>
  );
}
