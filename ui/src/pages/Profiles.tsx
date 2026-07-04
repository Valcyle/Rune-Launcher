import { useState } from 'react';
import type { ModInfo, ExternalInfo } from '../App';

interface ProfilesProps {
  colors: any;
  activeProfile: string;
  modsList: ModInfo[];
  externalsList: ExternalInfo[];
  profileConfig: any;
  handleSaveProfileConfig: (config: any) => void;
  handleDeleteMod: (id: string, isExternal: boolean) => void;
}

export default function Profiles({
  colors,
  activeProfile,
  modsList,
  externalsList,
  profileConfig,
  handleSaveProfileConfig,
  handleDeleteMod
}: ProfilesProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Helper to update config for enabling/disabling items
  const toggleItem = (id: string, isExternal: boolean) => {
    const config = { ...profileConfig };
    const disabledField = isExternal ? 'disabled_externals' : 'disabled_mods';
    
    if (!config[disabledField]) {
      config[disabledField] = [];
    }

    const index = config[disabledField].indexOf(id);
    if (index > -1) {
      // If disabled, enable it (remove from disabled array)
      config[disabledField] = config[disabledField].filter((item: string) => item !== id);
    } else {
      // Disable it (add to disabled array)
      config[disabledField] = [...config[disabledField], id];
    }

    handleSaveProfileConfig(config);
  };

  // Reorders items sequentially
  const moveItem = (index: number, direction: 'up' | 'down', isExternal: boolean) => {
    const config = { ...profileConfig };
    const orderField = isExternal ? 'external_order' : 'mod_order';
    
    if (!config[orderField] || !Array.isArray(config[orderField])) return;

    const newOrder = [...config[orderField]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    // Swap elements in place
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    config[orderField] = newOrder;
    handleSaveProfileConfig(config);
  };

  // Triggers deletion alert
  const performDelete = (id: string, isExternal: boolean) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${id}"? This action will permanently remove the files from disk.`);
    if (confirmed) {
      handleDeleteMod(id, isExternal);
    }
  };

  return (
    <div style={{
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '16px',
      padding: '36px',
      boxShadow: colors.shadow,
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0', color: colors.text }}>
          Profile Customizer: <span style={{ color: colors.glowGreen }}>{activeProfile}</span>
        </h2>
        <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>
          Manage load sequences, toggle mods, and remove dependencies for the active profile.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        marginTop: '12px'
      }}>
        {/* Left Column: Mod Packages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: colors.text, borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>
            Mod Packages (Step 3 DLLs)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {modsList.length > 0 ? (
              modsList.map((m, idx) => (
                <div
                  key={m.id}
                  onMouseEnter={() => setHoveredItem(`mod-${m.id}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    padding: '14px 18px',
                    backgroundColor: colors.panel,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: m.enabled ? 1 : 0.6,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px', color: colors.text }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: colors.textMuted }}>v{m.version}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>ID: {m.id}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Reordering Controls */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'up', false)}
                        disabled={idx === 0}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === 0 ? colors.textMuted : colors.text,
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          outline: 'none'
                        }}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down', false)}
                        disabled={idx === modsList.length - 1}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === modsList.length - 1 ? colors.textMuted : colors.text,
                          cursor: idx === modsList.length - 1 ? 'not-allowed' : 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          outline: 'none'
                        }}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Toggle Switch */}
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '36px',
                      height: '20px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={m.enabled}
                        onChange={() => toggleItem(m.id, false)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: m.enabled ? colors.glowGreen : '#4b5563',
                        transition: '0.2s',
                        borderRadius: '20px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '14px', width: '14px',
                          left: m.enabled ? '18px' : '4px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          transition: '0.2s',
                          borderRadius: '50%'
                        }} />
                      </span>
                    </label>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => performDelete(m.id, false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: hoveredItem === `mod-${m.id}` ? '#ef4444' : colors.textMuted,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'color 0.15s ease',
                        outline: 'none'
                      }}
                      title="Delete mod package"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px', border: `1px dashed ${colors.border}`, borderRadius: '8px' }}>
                No mod packages found in this profile.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: External DLLs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: colors.text, borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>
            External DLL Dependencies (Step 2 DLLs)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {externalsList.length > 0 ? (
              externalsList.map((ext, idx) => (
                <div
                  key={ext.id}
                  onMouseEnter={() => setHoveredItem(`ext-${ext.id}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    padding: '14px 18px',
                    backgroundColor: colors.panel,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: ext.enabled ? 1 : 0.6,
                    transition: 'opacity 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: colors.text }}>{ext.name}</span>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>Path: {ext.path}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Reordering Controls */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'up', true)}
                        disabled={idx === 0}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === 0 ? colors.textMuted : colors.text,
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          outline: 'none'
                        }}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 'down', true)}
                        disabled={idx === externalsList.length - 1}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: idx === externalsList.length - 1 ? colors.textMuted : colors.text,
                          cursor: idx === externalsList.length - 1 ? 'not-allowed' : 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          outline: 'none'
                        }}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Toggle Switch */}
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '36px',
                      height: '20px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={ext.enabled}
                        onChange={() => toggleItem(ext.id, true)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: ext.enabled ? colors.glowGreen : '#4b5563',
                        transition: '0.2s',
                        borderRadius: '20px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '14px', width: '14px',
                          left: ext.enabled ? '18px' : '4px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          transition: '0.2s',
                          borderRadius: '50%'
                        }} />
                      </span>
                    </label>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => performDelete(ext.id, true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: hoveredItem === `ext-${ext.id}` ? '#ef4444' : colors.textMuted,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'color 0.15s ease',
                        outline: 'none'
                      }}
                      title="Delete DLL file"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: colors.textMuted, fontSize: '13px', border: `1px dashed ${colors.border}`, borderRadius: '8px' }}>
                No external DLLs found in this profile.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
