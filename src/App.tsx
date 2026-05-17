import { useState, useEffect, useRef, lazy, Suspense } from 'react'
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const TabFallback = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', minHeight: 300 }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)', borderTop: '2px solid #8b5cf6', animation: 'spin 0.8s linear infinite' }} />
  </div>
)

type BackendStatus = 'checking' | 'waking' | 'online' | 'failed'

export default function App() {
  const [activeTab,     setActiveTab]     = useState('overview')
  const [apiKey,        setApiKey]        = useState('')
  const [file,          setFile]          = useState<File | null>(null)
  const [settings,      setSettings]      = useState(DEFAULT_SETTINGS)
  const [report,        setReport]        = useState<any>(null)
  const [loading,       setLoading]       = useState(false)
  const [pdfLoading,    setPdfLoading]    = useState(false)
  const [error,         setError]         = useState('')
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')
  const [wakeSeconds,   setWakeSeconds]   = useState(0)
  const wakeTimer  = useRef<any>(null)
  const tickTimer  = useRef<any>(null)
  const keepAlive  = useRef<any>(null)

  useEffect(() => {
    let attempts = 0

    async function tryWarmup() {
      try {
        const r = await fetch(`${API_URL}/api/warmup`, { signal: AbortSignal.timeout(5000) })
        if (r.ok) {
          setBackendStatus('online')
          clearInterval(wakeTimer.current)
          clearInterval(tickTimer.current)
          return true
        }
      } catch {}
      return false
    }

    async function startWarmup() {
      const ok = await tryWarmup()
      if (ok) return

      setBackendStatus('waking')
      setWakeSeconds(0)
      tickTimer.current = setInterval(() => setWakeSeconds(s => s + 1), 1000)

      wakeTimer.current = setInterval(async () => {
        attempts++
        const ok2 = await tryWarmup()
        if (ok2 || attempts >= 10) {
          clearInterval(wakeTimer.current)
          clearInterval(tickTimer.current)
          if (!ok2) setBackendStatus('failed')
        }
      }, 6000)
    }

    startWarmup()

    keepAlive.current = setInterval(() => {
      fetch(`${API_URL}/health`).catch(() => {})
    }, 4 * 60 * 1000)

    return () => {
      clearInterval(wakeTimer.current)
      clearInterval(tickTimer.current)
      clearInterval(keepAlive.current)
    }
  }, [])

  function mergeSettings(patch: Partial<typeof DEFAULT_SETTINGS>) {
    setSettings(s => ({ ...s, ...patch }))
  }

  async function handleGenerate() {
    if (!file || !apiKey) return
    if (backendStatus !== 'online') {
      setError('Server is still waking up — please wait for the status bar to disappear, then try again.')
      return
    }
    setLoading(true)
    setError('')
    setReport(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 180000)
    try {
      const data = await analyseDataset(file, apiKey, settings)
      setReport(data)
      setActiveTab('overview')
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('Request timed out. Please try again.')
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
        { report_title: settings.reportTitle, organisation: settings.organisation, analyst: settings.analyst, tone: settings.tone, industry: settings.industry },
        { exec_summary: report.narratives.exec_summary, key_findings: report.narratives.key_findings, anomaly_narrative: report.narratives.anomaly_narrative, recommendations: report.narratives.recommendations },
        report.health, report.charts, report.forecast,
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${settings.reportTitle}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(`PDF generation failed.\n\nPlease wait a moment and try again — the server may have timed out.`)
    } finally {
      setPdfLoading(false)
    }
  }

  const datasetContext = report
    ? `File: ${report.meta.filename} | Rows: ${report.meta.rows} | Cols: ${report.meta.cols} | Health: ${report.health.grade} (${report.health.score}/100) | Numeric cols: ${Object.keys(report.stats.key_stats || {}).join(', ')} | Anomalies: ${JSON.stringify(report.anomalies).slice(0, 400)}`
    : ''

  const StatusBanner = () => {
    if (backendStatus === 'online') return null
    if (backendStatus === 'failed') return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '0.75rem 1.25rem', margin: '1rem 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: '#f87171' }}>
        <span>⚠</span> Backend unreachable. Please refresh the page.
        <button onClick={() => window.location.reload()} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>Refresh</button>
      </div>
    )
    return (
      <div style={{ background: backendStatus === 'waking' ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)', border: `1px solid ${backendStatus === 'waking' ? 'rgba(245,158,11,0.22)' : 'rgba(59,130,246,0.18)'}`, borderRadius: 10, padding: '0.75rem 1.25rem', margin: '1rem 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.85rem', color: backendStatus === 'waking' ? '#fbbf24' : '#60a5fa' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: backendStatus === 'waking' ? '#f59e0b' : '#3b82f6', animation: 'pulse 1.5s ease-in-out infinite' }} />
        {backendStatus === 'waking'
          ? `⚡ Server waking up... ${wakeSeconds}s — Do not click Generate yet. This takes ~30 seconds.`
          : '⟳ Connecting to server...'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0d12' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <Sidebar
        activeTab={activeTab}   onTabChange={setActiveTab}
        apiKey={apiKey}         onApiKey={setApiKey}
        file={file}             onFile={setFile}
        settings={settings}     onSettings={mergeSettings}
        onGenerate={handleGenerate}
        loading={loading}
        hasReport={!!report}
        backendReady={backendStatus === 'online'}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>

        {report && <TopNav organisation={settings.organisation} analyst={settings.analyst} activeTab={activeTab} />}

        {!report && !loading && <StatusBanner />}

        {loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', minHeight: '100vh' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTop: '3px solid #8b5cf6', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f0f0f5', margin: '0 0 0.35rem' }}>Analysing your dataset</p>
              <p style={{ fontSize: '0.85rem', color: '#475569' }}>Running AI analysis, building charts, detecting anomalies...</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>⚠</span>
              <p style={{ color: '#f87171', fontSize: '0.9rem', margin: 0 }}>{error}</p>
              <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
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
          <footer style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#334155', fontSize: '0.72rem', letterSpacing: '0.3px', marginTop: 'auto' }}>
            © {new Date().getFullYear()} DataMind AI. All rights reserved.
            &nbsp;·&nbsp;<a href="#" style={{ color: '#334155', textDecoration: 'none' }}>Privacy Protocol</a>
            &nbsp;·&nbsp;<a href="#" style={{ color: '#334155', textDecoration: 'none' }}>Terms of Logic</a>
            &nbsp;&nbsp;&nbsp;<span style={{ color: '#10b981' }}>●</span> System Operational: v2.0.0
          </footer>
        )}
      </div>
    </div>
  )
}
