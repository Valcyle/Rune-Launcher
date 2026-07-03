
interface PipelineMapProps {
  launchStatus: string;
  colors: any;
}

export default function PipelineMap({ launchStatus, colors }: PipelineMapProps) {
  return (
    <div style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '24px 30px',
      boxShadow: colors.shadow
    }}>
      <h3 style={{
        fontSize: '12px',
        fontWeight: 700,
        margin: '0 0 20px 0',
        textTransform: 'uppercase',
        color: colors.textMuted,
        letterSpacing: '0.5px'
      }}>
        Pipeline Map (Injection Order)
      </h3>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        padding: '10px 0'
      }}>
        {/* Connecting pipeline line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '40px',
          right: '40px',
          height: '2px',
          backgroundColor: launchStatus === 'resolving' ? colors.glowGreen : colors.border,
          zIndex: 1,
          transform: 'translateY(-50%)',
          transition: 'background-color 0.4s'
        }} />

        {/* Node 1: RuneCore.dll */}
        <div style={{ zIndex: 2, textAlign: 'center', width: '120px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: colors.panel,
            border: `1.5px solid ${colors.glowGreen}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px',
            marginBottom: '8px',
            color: colors.text
          }}>
            1
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>RuneCore.dll</div>
          <div style={{ fontSize: '10px', color: colors.textMuted }}>Host core hook</div>
        </div>

        {/* Node 2: External Client DLLs */}
        <div style={{ zIndex: 2, textAlign: 'center', width: '120px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: colors.panel,
            border: `1.5px solid ${colors.glowPurple}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px',
            marginBottom: '8px',
            color: colors.text
          }}>
            2
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>External Client</div>
          <div style={{ fontSize: '10px', color: colors.textMuted }}>Custom client libs</div>
        </div>

        {/* Node 3: Profiles Mod Packages */}
        <div style={{ zIndex: 2, textAlign: 'center', width: '120px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: colors.panel,
            border: `1.5px solid ${colors.border}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '12px',
            marginBottom: '8px',
            color: colors.text
          }}>
            3
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>Mods List</div>
          <div style={{ fontSize: '10px', color: colors.textMuted }}>`entrypoint` DLLs</div>
        </div>
      </div>
    </div>
  );
}
