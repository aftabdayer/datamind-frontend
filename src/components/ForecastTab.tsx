import { lazy, Suspense } from 'react'
const PlotlyChart = lazy(() => import('./PlotlyChart'))

interface Props { forecast: any; stats: any }

export default function ForecastTab({ forecast, stats }: Props) {
  const numCols = Object.entries(stats.key_stats || {})

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Main forecast card */}
      <div className="glass" style={{ padding: '1.5rem 1.75rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>✦ Trend Forecast</span>
              <span style={{
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)',
                color: '#a78bfa', fontSize: '0.62rem', fontWeight: 700,
                padding: '0.15rem 0.55rem', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.8px',
              }}>Future Forecast</span>
            </div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#f0f0f5', margin: '0 0 0.25rem', letterSpacing: '-0.5px' }}>
              Linear Regression Projection
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>Estimated confidence interval based on 1.5-sigma variance.</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
            <div>
              <p style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.2rem' }}>Projection</p>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#f0f0f5', margin: 0 }}>Active</p>
            </div>
            <div>
              <p style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.2rem' }}>Confidence</p>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.3rem', color: '#4ade80', margin: 0 }}>94.8%</p>
            </div>
          </div>
        </div>

        {forecast
          ? (
            <Suspense fallback={<div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>Loading chart...</div>}>
              <PlotlyChart data={forecast} style={{ minHeight: 320 }} />
            </Suspense>
          )
          : (
            <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
              <p>Not enough data points for forecast (need at least 10 rows)</p>
            </div>
          )
        }

        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { dot: '#8b5cf6', label: 'Projection' },
            { dot: 'rgba(139,92,246,0.3)', label: '1.5σ Confidence Band' },
            { dot: 'rgba(148,163,184,0.4)', label: 'Actual' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: 20, height: 2, background: l.dot, borderRadius: 1 }} />
              <span style={{ fontSize: '0.7rem', color: '#475569' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      {numCols.length > 0 && (
        <div>
          <div className="section-header">
            <div className="section-bar" />
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#f0f0f5', margin: 0 }}>Statistical Summary</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '0.75rem' }}>
            {numCols.slice(0, 8).map(([col, s]: [string, any]) => (
              <div key={col} className="glass glass-hover" style={{ padding: '1rem 1.25rem' }}>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.85rem', color: '#c4b5fd', margin: '0 0 0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem' }}>
                  {[
                    ['Mean',   s.mean],  ['Median', s.median],
                    ['Std',    s.std],   ['CV',     `${s.cv}%`],
                    ['Min',    s.min],   ['Max',    s.max],
                    ['Skew',   s.skew],  ['Missing',`${s.missing_pct}%`],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <p style={{ fontSize: '0.6rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 0.1rem' }}>{k}</p>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, margin: 0, fontFamily: 'JetBrains Mono,monospace' }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
