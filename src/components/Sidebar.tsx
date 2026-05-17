import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const NAV = [
  { id: 'overview',        icon: '⊞', label: 'Overview'        },
  { id: 'visuals',         icon: '◉', label: 'Visuals'          },
  { id: 'anomalies',       icon: '△', label: 'Anomalies'        },
  { id: 'forecast',        icon: '⟋', label: 'Forecast'         },
  { id: 'recommendations', icon: '✦', label: 'Recommendations'  },
  { id: 'chat',            icon: '◻', label: 'Chat'             },
]

const TONES      = ['Professional', 'Executive', 'Technical', 'Casual']
const INDUSTRIES = ['General', 'Finance', 'Retail', 'Healthcare', 'Technology', 'Manufacturing', 'Marketing']

interface Props {
  activeTab:     string
  onTabChange:   (t: string) => void
  apiKey:        string
  onApiKey:      (k: string) => void
  file:          File | null
  onFile:        (f: File | null) => void
  settings:      { reportTitle: string; organisation: string; analyst: string; tone: string; industry: string }
  onSettings:    (s: Partial<Props['settings']>) => void
  onGenerate:    () => void
  loading:       boolean
  hasReport:     boolean
  backendReady:  boolean
}

export default function Sidebar({
  activeTab, onTabChange, apiKey, onApiKey,
  file, onFile, settings, onSettings, onGenerate, loading, hasReport, backendReady,
}: Props) {
  const [showKey, setShowKey] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'application/json': ['.json'] },
    maxFiles: 1,
  })

  return (
    <aside style={{
      width: 240, minWidth: 240, height: '100vh', position: 'sticky', top: 0,
      background: '#0a0a0f', borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.25rem 0.85rem',
      gap: '0.25rem',
    }}>

      {/* Brand */}
      <div style={{ paddingBottom: '1rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
          }}>◈</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f0f0f5', letterSpacing: '-0.3px' }}>DataMind</span>
        </div>
        <p style={{ fontSize: '0.62rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginLeft: 40 }}>AI Business Intelligence</p>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '2px', padding: '0 0.5rem', marginBottom: '0.3rem' }}>Navigation</p>
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => onTabChange(n.id)}
            className={`nav-item${activeTab === n.id ? ' active' : ''}`}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* API Key */}
        <div>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.4rem' }}>🔑 Groq API Key</p>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => onApiKey(e.target.value)}
              placeholder="gsk_..."
              style={{
                flex: 1, background: '#18181f', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '0.45rem 0.65rem', color: '#f0f0f5',
                fontSize: '0.78rem', fontFamily: 'JetBrains Mono,monospace', outline: 'none',
              }}
            />
            <button onClick={() => setShowKey(v => !v)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem' }}>
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ fontSize: '0.68rem', color: '#7c3aed', textDecoration: 'none', marginTop: 4, display: 'block' }}>Get free key →</a>
        </div>

        {/* File upload */}
        <div>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.4rem' }}>📁 Dataset</p>
          {file ? (
            <div style={{
              background: '#18181f', border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 10, padding: '0.6rem 0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                <p style={{ fontSize: '0.68rem', color: '#475569' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button onClick={() => onFile(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              style={{
                background: isDragActive ? 'rgba(139,92,246,0.08)' : '#18181f',
                border: `2px dashed ${isDragActive ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, padding: '1rem 0.75rem', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input {...getInputProps()} />
              <p style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>⊕</p>
              <p style={{ fontSize: '0.75rem', color: '#475569' }}>Drop CSV / XLSX / JSON</p>
            </div>
          )}
        </div>

        {/* Report settings */}
        <div>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>⚙ Report Settings</p>
          {[
            { label: 'Report Title',  key: 'reportTitle',  type: 'text' },
            { label: 'Organisation',  key: 'organisation', type: 'text' },
            { label: 'Analyst Name',  key: 'analyst',      type: 'text' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{f.label}</p>
              <input
                value={(settings as any)[f.key]}
                onChange={e => onSettings({ [f.key]: e.target.value })}
                style={{
                  width: '100%', background: '#18181f', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 7, padding: '0.4rem 0.6rem', color: '#f0f0f5',
                  fontSize: '0.78rem', fontFamily: 'Instrument Sans,sans-serif', outline: 'none',
                }}
              />
            </div>
          ))}
          {[
            { label: 'Tone',     key: 'tone',     opts: TONES },
            { label: 'Industry', key: 'industry', opts: INDUSTRIES },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.65rem', color: '#475569', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{f.label}</p>
              <select
                value={(settings as any)[f.key]}
                onChange={e => onSettings({ [f.key]: e.target.value })}
                style={{
                  width: '100%', background: '#18181f', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 7, padding: '0.4rem 0.6rem', color: '#f0f0f5',
                  fontSize: '0.78rem', outline: 'none', cursor: 'pointer',
                }}
              >
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Generate button */}
        <button
          className="btn-primary"
          onClick={onGenerate}
          disabled={!file || !apiKey || loading || !backendReady}
          style={{ width: '100%', marginTop: '0.25rem', opacity: !backendReady ? 0.5 : 1 }}
        >
          {loading ? '⟳  Analysing...'
            : !backendReady ? '⏳  Server Waking Up...'
            : '🚀  Generate Report'}
        </button>

      </div>
    </aside>
  )
}
