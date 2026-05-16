

interface Props {
  organisation: string
  analyst: string
  activeTab: string
}

const TAB_LABELS: Record<string, string> = {
  overview:        'Business Intelligence Report',
  visuals:         'Data Visualisations',
  anomalies:       'Neural Detection',
  forecast:        'Trend Forecast',
  recommendations: 'Recommendations',
  chat:            'Chat With Data',
}

export default function TopNav({ organisation, analyst, activeTab }: Props) {
  return (
    <header style={{
      height: 56,
      background: 'rgba(13,13,18,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 1.5rem',
      gap: '1.5rem',
      position: 'sticky', top: 0, zIndex: 50,
    }}>

      {/* Page title */}
      <h1 style={{
        fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1rem',
        color: '#f0f0f5', flex: 1, letterSpacing: '-0.2px',
      }}>
        {TAB_LABELS[activeTab] || 'DataMind AI'}
      </h1>

      {/* Org + Analyst pills */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[organisation, analyst].map(label => (
          <span key={label} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500,
            padding: '0.3rem 0.8rem', borderRadius: 6,
          }}>{label}</span>
        ))}
      </div>

      {/* Search — decorative UI element */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: '#18181f', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '0.35rem 0.75rem',
        opacity: 0.5,
        title: 'Search coming soon',
      }}>
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>⊕</span>
        <input
          placeholder="Search insights..."
          disabled
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: '#94a3b8', fontSize: '0.8rem', width: 140,
            fontFamily: 'Instrument Sans,sans-serif',
            cursor: 'not-allowed',
          }}
        />
      </div>

      {/* Right icons — decorative, match the Stitch design */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {/* Notifications — decorative */}
        <div title="Notifications (coming soon)" style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#475569', fontSize: '1rem', cursor: 'default',
          transition: 'background 0.15s',
        }}>🔔</div>

        {/* Settings — decorative */}
        <div title="Settings (coming soon)" style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#475569', fontSize: '1rem', cursor: 'default',
        }}>⚙</div>

        {/* Avatar — shows first letter of analyst */}
        <div title={analyst} style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', color: 'white', fontWeight: 700,
          cursor: 'default', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
        }}>{analyst.charAt(0).toUpperCase()}</div>
      </div>
    </header>
  )
}
