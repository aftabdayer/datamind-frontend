
import HealthRing from './HealthRing'

interface Props { report: any; onDownloadPdf: () => void; pdfLoading: boolean }

const HEALTH_BG: Record<string, string> = {
  Excellent: 'linear-gradient(135deg,rgba(5,46,22,0.8),rgba(10,54,34,0.8))',
  Good:      'linear-gradient(135deg,rgba(12,26,58,0.8),rgba(15,37,80,0.8))',
  Fair:      'linear-gradient(135deg,rgba(45,26,0,0.8),rgba(61,36,0,0.8))',
  Poor:      'linear-gradient(135deg,rgba(45,10,10,0.8),rgba(61,16,16,0.8))',
}
const HEALTH_BORDER: Record<string, string> = {
  Excellent: 'rgba(22,163,74,0.45)', Good: 'rgba(59,130,246,0.45)',
  Fair: 'rgba(245,158,11,0.45)',     Poor: 'rgba(239,68,68,0.45)',
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="section-header">
      <div className="section-bar" />
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#f0f0f5', margin: 0 }}>{title}</h2>
      {sub && <span style={{ fontSize: '0.75rem', color: '#475569' }}>{sub}</span>}
    </div>
  )
}

export default function OverviewTab({ report, onDownloadPdf, pdfLoading }: Props) {
  const { meta, health, stats, narratives } = report

  // Parse key findings
  const findings = (narratives.key_findings as string)
    .split('\n').filter((l: string) => l.trim().length > 4)
    .map((l: string) => {
      const m = l.match(/^(\d+)\.\s*(.+?):\s*(.+)$/)
      if (m) return { num: m[1], title: m[2], body: m[3] }
      return { num: '', title: '', body: l }
    })

  const corrs = stats.strong_correlations || []

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Health + KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '0.85rem', alignItems: 'stretch' }}>

        {/* Health card */}
        <div style={{
          gridColumn: 'span 2',
          background: HEALTH_BG[health.grade] || HEALTH_BG.Good,
          border: `1px solid ${HEALTH_BORDER[health.grade] || HEALTH_BORDER.Good}`,
          borderRadius: 16, padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1.25rem',
        }}>
          <HealthRing score={health.score} grade={health.grade} />
          <div>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f0f0f5', margin: '0 0 0.35rem' }}>
              Data Health Analysis
            </p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
              {health.commentary}
            </p>
          </div>
        </div>

        {/* KPI tiles */}
        {[
          { icon: '◈', value: meta.rows.toLocaleString(), label: 'Rows' },
          { icon: '◫', value: meta.cols,                  label: 'Columns' },
          { icon: '⊞', value: meta.numeric_cols,          label: 'Numeric' },
          { icon: '◉', value: meta.cat_cols,              label: 'Categorical' },
        ].map(k => (
          <div key={k.label} className="glass glass-hover" style={{ padding: '1.1rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)' }} />
            <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{k.icon}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#f0f0f5', lineHeight: 1, marginBottom: '0.25rem' }}>{k.value}</div>
            <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Executive Summary */}
      <div>
        <SectionHeader title="Executive Summary" />
        {narratives.exec_summary.split('\n').filter((p: string) => p.trim()).map((p: string, i: number) => (
          <div key={i} className="glass" style={{
            padding: '1.1rem 1.4rem', marginBottom: '0.65rem',
            borderLeft: '2px solid rgba(59,130,246,0.4)',
            background: 'linear-gradient(to right,rgba(59,130,246,0.04),#13131a)',
          }}>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>{p}</p>
          </div>
        ))}
      </div>

      {/* Key Findings */}
      <div>
        <SectionHeader title="Key Findings" sub={`${findings.length} insights`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
          {findings.map((f: any, i: number) => (
            <div key={i} className="glass glass-hover" style={{ padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 7, background: 'rgba(139,92,246,0.15)',
                  color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 700, fontFamily: 'Syne,sans-serif', flexShrink: 0,
                }}>{String(i + 1).padStart(2, '0')}</span>
              </div>
              {f.title && <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0f0f5', margin: '0 0 0.3rem' }}>{f.title}</p>}
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strong Correlations */}
      {corrs.length > 0 && (
        <div>
          <SectionHeader title="Strong Correlations" />
          <div className="glass" style={{ overflow: 'hidden' }}>
            <table className="corr-table">
              <thead>
                <tr>
                  <th>Variable Pair (A &amp; B)</th>
                  <th>Pearson R</th>
                  <th>Strength</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {corrs.map((c: any, i: number) => {
                  const isStrongPos = c.strength === 'Strong' && c.r > 0
                  const isStrongNeg = c.strength === 'Strong' && c.r < 0
                  const conf = Math.min(99.9, Math.abs(c.r) * 105).toFixed(1)
                  return (
                    <tr key={i}>
                      <td style={{ color: '#60a5fa', fontWeight: 600 }}>⇌ {c.col1} &amp; {c.col2}</td>
                      <td style={{ fontWeight: 700, color: isStrongPos ? '#4ade80' : isStrongNeg ? '#f87171' : '#fbbf24' }}>{c.r}</td>
                      <td>
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.55rem',
                          borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.8px',
                          background: isStrongPos ? 'rgba(74,222,128,0.1)' : isStrongNeg ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                          color: isStrongPos ? '#4ade80' : isStrongNeg ? '#f87171' : '#fbbf24',
                          border: `1px solid ${isStrongPos ? 'rgba(74,222,128,0.25)' : isStrongNeg ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.25)'}`,
                        }}>
                          {isStrongPos ? 'Strong Positive' : isStrongNeg ? 'Inverse Strong' : 'Moderate'}
                        </span>
                      </td>
                      <td style={{ color: '#475569' }}>{conf}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Download */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
        <button
          className="btn-primary"
          onClick={onDownloadPdf}
          disabled={pdfLoading}
          style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 18px rgba(5,150,105,0.3)' }}
        >
          {pdfLoading ? '⟳  Generating PDF...' : '⬇  Download PDF Report'}
        </button>
      </div>
    </div>
  )
}
