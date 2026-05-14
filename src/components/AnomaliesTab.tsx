

interface Props { report: any }

function getSeverity(line: string): { cls: string; badge: string; label: string } {
  const l = line.toLowerCase()
  if (['extreme','critical','significant','major'].some(w => l.includes(w)))
    return { cls: 'high',   badge: 'crit-badge',  label: 'CRITICAL: HIGH'   }
  if (['moderate','warning','missing','outlier','duplicate','skew'].some(w => l.includes(w)))
    return { cls: 'medium', badge: 'attn-badge',  label: 'ATTENTION: MEDIUM' }
  return   { cls: 'low',    badge: 'info-badge',  label: 'INFO: LOW'         }
}

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  'crit-badge': { background: 'rgba(239,68,68,0.12)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.28)'  },
  'attn-badge': { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.28)' },
  'info-badge': { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.28)' },
}
const TOP_BORDER: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="section-header">
      <div className="section-bar" />
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#f0f0f5', margin: 0 }}>{title}</h2>
    </div>
  )
}

export default function AnomaliesTab({ report }: Props) {
  const { narratives, anomalies } = report
  const lines: string[] = (narratives.anomaly_narrative as string)
    .split('\n').filter((l: string) => l.trim().length > 6)

  const outliers = anomalies.outliers || {}
  const constant = anomalies.constant_columns || []
  const highMiss = anomalies.high_missing || []
  const skewed   = anomalies.high_skewness || {}

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero header — matches Stitch "Neural Detection" */}
      <div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '2rem', color: '#f0f0f5', letterSpacing: '-1px', margin: '0 0 0.3rem' }}>Neural Detection</h2>
        <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>Real-time identification of statistical variance across active datasets.</p>
      </div>

      {/* Anomaly cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {lines.map((line: string, idx: number) => {
          const sev = getSeverity(line)
          const dotIdx = line.indexOf('.')
          const colonIdx = line.indexOf(':')
          let title = '', body = line
          if (dotIdx > 0 && dotIdx < 60) { title = line.slice(0, dotIdx); body = line.slice(dotIdx + 1).trim() }
          else if (colonIdx > 0 && colonIdx < 60) { title = line.slice(0, colonIdx); body = line.slice(colonIdx + 1).trim() }
          else { title = `Anomaly Detection #${idx + 1}` }

          return (
            <div key={idx} className="glass" style={{
              padding: '1.1rem 1.4rem',
              borderTop: `2px solid ${TOP_BORDER[sev.cls]}`,
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '0.18rem 0.6rem',
                  borderRadius: 5, textTransform: 'uppercase', letterSpacing: '1px',
                  ...BADGE_STYLE[sev.badge],
                }}>{sev.label}</span>
                <span style={{ fontSize: '0.72rem', color: '#334155' }}>{idx + 1} of {lines.length}</span>
              </div>
              {title && <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f5', margin: '0 0 0.3rem' }}>{title}</p>}
              <p style={{ fontSize: '0.87rem', color: '#94a3b8', lineHeight: 1.7, margin: '0 0 0.65rem' }}>{body || line}</p>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#334155', cursor: 'pointer' }}>
                Investigate &nbsp;→
              </span>
            </div>
          )
        })}
      </div>

      {/* Outlier Detail Matrix */}
      {Object.keys(outliers).length > 0 && (
        <div>
          <SectionHeader title="Outlier Detail Matrix" />
          <div className="glass" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {['Metric Segment', 'Count', '%', 'Lower Bound', 'Upper Bound', 'Data Min', 'Data Max'].map(h => (
                    <th key={h} style={{
                      background: 'rgba(139,92,246,0.08)', color: '#94a3b8',
                      padding: '0.65rem 1rem', textAlign: 'left',
                      fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(outliers).map(([col, v]: [string, any]) => (
                  <tr key={col} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.8rem 1rem', color: '#a78bfa', fontWeight: 600 }}>{col}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8' }}>{v.count.toLocaleString()}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8' }}>{v.pct}%</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8' }}>{v.lower_bound.toLocaleString()}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8' }}>{v.upper_bound.toLocaleString()}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8' }}>{v.extreme_min.toLocaleString()}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8' }}>{v.extreme_max.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional flags */}
      {(constant.length > 0 || highMiss.length > 0 || Object.keys(skewed).length > 0) && (
        <div>
          <SectionHeader title="Additional Flags" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="glass" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #f87171' }}>
              <p style={{ fontWeight: 700, color: '#f87171', fontSize: '0.82rem', marginBottom: '0.35rem' }}>Constant Columns</p>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{constant.length ? constant.join(', ') : 'None detected'}</p>
            </div>
            <div className="glass" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #fbbf24' }}>
              <p style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.82rem', marginBottom: '0.35rem' }}>High Missing (&gt;20%)</p>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{highMiss.length ? highMiss.join(', ') : 'None detected'}</p>
            </div>
            <div className="glass" style={{ padding: '1rem 1.25rem', borderLeft: '2px solid #fb923c' }}>
              <p style={{ fontWeight: 700, color: '#fb923c', fontSize: '0.82rem', marginBottom: '0.35rem' }}>High Skewness (&gt;2)</p>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                {Object.keys(skewed).length ? Object.entries(skewed).map(([k, v]) => `${k}: ${v}`).join(', ') : 'None detected'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
