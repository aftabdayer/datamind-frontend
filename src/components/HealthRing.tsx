

interface Props { score: number; grade: string }

const GRADE_COLOR: Record<string, string> = {
  Excellent: '#4ade80', Good: '#60a5fa', Fair: '#fbbf24', Poor: '#f87171',
}

export default function HealthRing({ score, grade }: Props) {
  const color = GRADE_COLOR[grade] || '#8b5cf6'
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle
          cx={45} cy={45} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '1.4rem', color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{grade}</span>
      </div>
    </div>
  )
}
