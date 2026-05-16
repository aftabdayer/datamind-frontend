import { useState, useEffect, lazy, Suspense } from 'react'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import HeroScreen from './components/HeroScreen'
import { analyseDataset, generatePDF } from './lib/api'

const OverviewTab         = lazy(() => import('./components/OverviewTab'))
const VisualsTab          = lazy(() => import('./components/VisualsTab'))
const AnomaliesTab        = lazy(() => import('./components/AnomaliesTab'))
const ForecastTab         = lazy(() => import('./components/ForecastTab'))
const RecommendationsTab  = lazy(() => import('./components/RecommendationsTab'))
const ChatTab             = lazy(() => import('./components/ChatTab'))

const DEFAULT_SETTINGS = {
  reportTitle:  'Business Intelligence Report',
  organisation: 'My Organisation',
  analyst:      'DataMind AI',
  tone:         'Professional',
  industry:     'General',
}

// Keep Render backend alive — ping every 4 minutes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
setInterval(() => {
  fetch(`${API_URL}/health`).catch(() => {})
}, 4 * 60 * 1000)

// Warmup call on page load — wakes up Render free tier immediately
fetch(`${API_URL}/api/warmup`).catch(() => {})

const TabFallback = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', minHeight: 300 }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)', borderTop: '2px solid #8b5cf6', animation: 'spin 0.8s linear infinite' }} />
  </div>
)

export default function App() {
  const [activeTab,  setActiveTab]  = useState('overview')
  const [apiKey,     setApiKey]     = useState('')
  const [file,       setFile]       = useState<File | null>(null)
  const [settings,   setSettings]   = useState(DEFAULT_SETTINGS)
  const [report,     setReport]     = useState<any>(null)
  const [loading,    setLoading]    = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error,      setError]      = useState('')
  const [backendStatus, setBackendStatus] = useState<'checking'|'online'|'waking'>('checking')

  function mergeSettings(patch: Partial<typeof DEFAULT_SETTINGS>) {
    setSettings(s => ({ ...s, ...patch }))
  }

  // Check backend status on mount — handles Render free tier cold start
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/api/warmup`, { signal: AbortSignal.timeout(8000) })
        if (r.ok) { setBackendStatus('online'); return }
      } catch {}
      // If warmup failed, backend is waking — show warning and retry
      setBackendStatus('waking')
      setTimeout(async () => {
        try {
          const r2 = await fetch(`${API_URL}/api/warmup`, { signal: AbortSignal.timeout(60000) })
          if (r2.ok) setBackendStatus('online')
        } catch {}
      }, 3000)
    }
    check()
  }, [])

  async function handleGenerate() {
    if (!file || !apiKey) return
    setLoading(true)
    setError('')
    setReport(null)
    // Abort controller — auto-cancel after 3 minutes
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000)
    try {
      const data = await analyseDataset(file, apiKey, settings)
      setReport(data)
      setActiveTab('overview')
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('Request timed out. The backend may be waking up — please try again in 30 seconds.')
      } else {
        setError(e.message || 'Analysis failed. Check your API key and try again.')
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  async function handleDownloadPdf() {
    if (!file || !report) return
    setPdfLoading(true)
    try {
      const blob = await generatePDF(
        file, apiKey,
        {
          report_title: settings.reportTitle, organisation: settings.organisation,
          analyst: settings.analyst, tone: settings.tone, industry: settings.industry,
        },
        {
          exec_summary:       report.narratives.exec_summary,
          key_findings:       report.narratives.key_findings,
          anomaly_narrative:  report.narratives.anomaly_narrative,
          recommendations:    report.narratives.recommendations,
        },
        report.health,
        report.charts,
        report.forecast,
      )
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href    = url
      a.download = `${settings.reportTitle}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      const msg = e?.message || 'Unknown error'
      alert(`PDF generation failed: ${msg}

Tip: Make sure the backend is fully awake — try generating the report again first, then download PDF.`)
    } finally {
      setPdfLoading(false)
    }
  }

  const datasetContext = report
    ? `File: ${report.meta.filename} | Rows: ${report.meta.rows} | Cols: ${report.meta.cols} | ` +
      `Health: ${report.health.grade} (${report.health.score}/100) | ` +
      `Numeric cols: ${Object.keys(report.stats.key_stats || {}).join(', ')} | ` +
      `Anomalies: ${JSON.stringify(report.anomalies).slice(0, 400)}`
    : ''

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0d12' }}>

      <Sidebar
        activeTab={activeTab}    onTabChange={setActiveTab}
        apiKey={apiKey}          onApiKey={setApiKey}
        file={file}              onFile={setFile}
        settings={settings}      onSettings={mergeSettings}
        onGenerate={handleGenerate}
        loading={loading}
        hasReport={!!report}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>

        {report && (
          <TopNav
            organisation={settings.organisation}
            analyst={settings.analyst}
            activeTab={activeTab}
          />
        )}

        {loading && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '1.5rem', minHeight: '100vh',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.06)',
              borderTop: '3px solid #8b5cf6',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f0f0f5', margin: '0 0 0.35rem' }}>Analysing your dataset</p>
              <p style={{ fontSize: '0.85rem', color: '#475569' }}>Running AI analysis, building charts, detecting anomalies...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 12, padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚠</span>
              <p style={{ color: '#f87171', fontSize: '0.9rem', margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        {!loading && !report && !error && <HeroScreen backendStatus={backendStatus} />}

        {!loading && report && (
          <Suspense fallback={<TabFallback />}>
            {activeTab === 'overview'        && <OverviewTab        report={report} onDownloadPdf={handleDownloadPdf} pdfLoading={pdfLoading} />}
            {activeTab === 'visuals'         && <VisualsTab         charts={report.charts} />}
            {activeTab === 'anomalies'       && <AnomaliesTab       report={report} />}
            {activeTab === 'forecast'        && <ForecastTab        forecast={report.forecast} stats={report.stats} />}
            {activeTab === 'recommendations' && <RecommendationsTab recommendations={report.narratives.recommendations} />}
            {activeTab === 'chat'            && <ChatTab            apiKey={apiKey} datasetContext={datasetContext} />}
          </Suspense>
        )}

        {report && (
          <footer style={{
            textAlign: 'center', padding: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: '#334155', fontSize: '0.72rem', letterSpacing: '0.3px', marginTop: 'auto',
          }}>
            © {new Date().getFullYear()} DataMind AI. All rights reserved.
            &nbsp; · &nbsp; <a href="#" style={{ color: '#334155', textDecoration: 'none' }}>Privacy Protocol</a>
            &nbsp; · &nbsp; <a href="#" style={{ color: '#334155', textDecoration: 'none' }}>Terms of Logic</a>
            &nbsp; &nbsp; &nbsp;
            <span style={{ color: '#10b981' }}>●</span> System Operational: v2.0.0
          </footer>
        )}
      </div>
    </div>
  )
}
