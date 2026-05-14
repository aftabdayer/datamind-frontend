
import { useEffect, useRef } from 'react'

interface Props {
  data: any
  style?: React.CSSProperties
}

export default function PlotlyChart({ data, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !data) return
    let cancelled = false

    import('plotly.js-dist-min').then((Plotly: any) => {
      if (cancelled || !ref.current) return
      Plotly.react(ref.current, data.data || [], {
        ...data.layout,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 40, r: 16, t: 36, b: 36 },
        font: { color: '#94a3b8', family: 'Instrument Sans, sans-serif', size: 11 },
        xaxis: { ...data.layout?.xaxis, gridcolor: 'rgba(255,255,255,0.05)', linecolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.05)' },
        yaxis: { ...data.layout?.yaxis, gridcolor: 'rgba(255,255,255,0.05)', linecolor: 'rgba(255,255,255,0.05)', zerolinecolor: 'rgba(255,255,255,0.05)' },
        legend: { bgcolor: 'transparent', borderwidth: 0, font: { color: '#94a3b8', size: 10 } },
      }, { responsive: true, displayModeBar: false })
    })

    return () => { cancelled = true }
  }, [data])

  return <div ref={ref} style={{ width: '100%', minHeight: 260, ...style }} />
}
