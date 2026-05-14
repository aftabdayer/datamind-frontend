

interface Props { recommendations: string }

export default function RecommendationsTab({ recommendations }: Props) {
  const items = recommendations.split('\n').filter(l => l.trim().length > 4)
    .map(l => {
      const m = l.match(/^(\d+)\.\s*(.+?):\s*(.+)$/)
      if (m) return { num: m[1], title: m[2], body: m[3] }
      return { num: '', title: '', body: l }
    })

  const ICONS = ['◈', '◉', '✦', '⊞', '⟋']

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '2rem', color: '#f0f0f5', letterSpacing: '-1px', margin: '0 0 0.3rem' }}>Actionable Recommendations</h2>
        <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>AI-generated strategic actions based on your dataset analysis.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {items.map((item, i) => (
          <div key={i} className="glass glass-hover" style={{
            padding: '1.25rem 1.5rem',
            borderLeft: '2px solid rgba(16,185,129,0.4)',
            background: 'linear-gradient(to right,rgba(16,185,129,0.04),#13131a)',
            display: 'flex', gap: '1.1rem', alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '0.8rem', color: '#34d399',
            }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ flex: 1 }}>
              {item.title && (
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f5', margin: '0 0 0.35rem' }}>{item.title}</p>
              )}
              <p style={{ fontSize: '0.87rem', color: '#94a3b8', lineHeight: 1.75, margin: 0 }}>{item.body}</p>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#1e293b', flexShrink: 0 }}>{ICONS[i % ICONS.length]}</span>
          </div>
        ))}
      </div>

      {/* Deep Intelligence card — matches Stitch design */}
      <div className="glass" style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(67,56,202,0.08))',
        border: '1px solid rgba(139,92,246,0.2)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', margin: '0 auto 0.75rem',
        }}>✦</div>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#c4b5fd', margin: '0 0 0.3rem' }}>Deep Intelligence Active</p>
        <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>Real-time pattern matching is identifying further secondary correlations.</p>
      </div>
    </div>
  )
}
