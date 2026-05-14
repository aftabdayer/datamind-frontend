import { lazy, Suspense } from 'react'

const PlotlyChart = lazy(() => import('./PlotlyChart'))

const CHART_TITLES = [
  { title: 'Growth Trajectory',     sub: 'Neural engagement metrics' },
  { title: 'Segment Distribution',  sub: 'Resource allocation by node' },
  { title: 'Correlation Matrix',    sub: 'Feature dependency heatmap' },
  { title: 'Statistical Variance',  sub: 'Probability density function' },
  { title: 'Scatter Analysis',      sub: 'Variable relationship mapping' },
  { title: 'Composition Breakdown', sub: 'Category proportion view' },
  { title: 'Top Segments',          sub: 'Performance ranking by node' },
]

interface Props { charts: any[] }

export default function VisualsTab({ charts }: Props) {
  if (!charts || charts.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#475569' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>◉</p>
        <p>No charts available for this dataset.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.25rem' }}>
        <div>
          <p style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, marginBottom: '0.3rem' }}>Analytics Engine</p>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#f0f0f5', letterSpacing: '-0.5px', margin: 0 }}>Data Visualisations</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📅 Last 30 Days
          </button>
          <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            ⬇ Export Data
          </button>
        </div>
      </div>

      {/* 2-column chart grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {charts.slice(0, 6).map((chart: any, i: number) => {
          const meta = CHART_TITLES[i] || { title: `Chart ${i + 1}`, sub: '' }
          const isLive = i === 0
          return (
            <div key={i} className="glass" style={{
              padding: '1.1rem 1.25rem 0.75rem',
              transition: 'border-color 0.2s',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#f0f0f5', margin: '0 0 0.15rem' }}>{meta.title}</p>
                  <p style={{ fontSize: '0.72rem', color: '#475569', margin: 0 }}>{meta.sub}</p>
                </div>
                {isLive && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '0.2rem 0.55rem' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    <span style={{ fontSize: '0.62rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Live</span>
                  </div>
                )}
              </div>
              <Suspense fallback={<div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>Loading chart...</div>}>
                <PlotlyChart data={chart} style={{ minHeight: 220 }} />
              </Suspense>
            </div>
          )
        })}
      </div>

      {/* Full-width forecast chart if 7th exists */}
      {charts[6] && (
        <div className="glass" style={{ padding: '1.25rem 1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>✦ Trend Forecast</span>
                <span style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.22)', color: '#a78bfa', fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Future Forecast</span>
              </div>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f0f0f5', margin: 0 }}>{CHART_TITLES[6].title}</p>
              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.2rem 0 0' }}>{CHART_TITLES[6].sub}</p>
            </div>
          </div>
          <Suspense fallback={<div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>Loading chart...</div>}>
            <PlotlyChart data={charts[6]} style={{ minHeight: 280 }} />
          </Suspense>
        </div>
      )}

    </div>
  )
}
