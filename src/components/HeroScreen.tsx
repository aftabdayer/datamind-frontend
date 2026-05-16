

const FEATURES = [
  { icon: '◈', label: 'AI Executive Summary' },
  { icon: '◉', label: 'Smart Visualisations' },
  { icon: '⟋', label: 'Trend Forecasting' },
  { icon: '△', label: 'Anomaly Detection' },
  { icon: '◻', label: 'Chat With Data' },
  { icon: '⬇', label: 'PDF Download' },
]

interface Props { backendStatus?: 'checking' | 'online' | 'waking' }

export default function HeroScreen({ backendStatus = 'checking' }: Props) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '2rem', minHeight: '100vh',
    }}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg,#0e0b20 0%,#130d2e 35%,#0b1530 70%,#0d0d14 100%)',
        border: '1px solid rgba(139,92,246,0.18)',
        borderRadius: 28, padding: '4rem 3rem 3.5rem', textAlign: 'center',
        width: '100%', maxWidth: 900,
        boxShadow: '0 0 100px rgba(99,59,220,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>
        {/* BG glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 60% 20%,rgba(99,59,220,0.14) 0%,transparent 65%), radial-gradient(ellipse at 20% 80%,rgba(59,130,246,0.07) 0%,transparent 50%)',
        }} />

        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
          color: '#a78bfa', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '3.5px',
          textTransform: 'uppercase', padding: '0.35rem 1rem',
          borderRadius: 999, marginBottom: '1.5rem',
        }}>◈ &nbsp; Groq Llama 3.3 · 70B</div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Syne,sans-serif', fontWeight: 800,
          fontSize: 'clamp(2.5rem,6vw,4rem)',
          color: '#f0f0f5', margin: '0 0 1rem', lineHeight: 1.05, letterSpacing: '-2px',
        }}>
          DataMind <span style={{ color: '#a78bfa' }}>AI</span>
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.42)', fontSize: '1rem', margin: '0 auto 2rem',
          maxWidth: 520, lineHeight: 1.75,
        }}>
          Upload any dataset and get a full AI-generated business intelligence report
          — executive summaries, insights, anomaly detection, forecasts, and a beautiful PDF in seconds.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)', fontSize: '0.77rem', fontWeight: 500,
              padding: '0.4rem 0.9rem', borderRadius: 8,
              transition: 'all 0.15s',
            }}>
              <span>{f.icon}</span> {f.label}
            </div>
          ))}
        </div>
      </div>

      <p style={{ marginTop: '1.75rem', fontSize: '0.82rem', color: '#334155', textAlign: 'center' }}>
        Enter your Groq API key and upload a dataset in the sidebar to get started
      </p>
    </div>
  )
}
