const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function analyseDataset(
  file: File,
  apiKey: string,
  settings: { reportTitle: string; organisation: string; analyst: string; tone: string; industry: string }
) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', apiKey)
  fd.append('report_title', settings.reportTitle)
  fd.append('organisation', settings.organisation)
  fd.append('analyst', settings.analyst)
  fd.append('tone', settings.tone)
  fd.append('industry', settings.industry)

  const r = await fetch(`${API}/api/analyse`, { method: 'POST', body: fd })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${r.status}`)
  }
  return r.json()
}

// PDF now sends pre-computed JSON data — no file re-upload, no timeout
export async function generatePDF(
  file: File,
  apiKey: string,
  settings: Record<string, string>,
  narratives: Record<string, string>,
  health: { score: number; grade: string },
  charts?: any[],
  forecast?: any,
  stats?: any,
  anomalies?: any,
  meta?: any
): Promise<Blob> {
  const payload = {
    report_title:      settings.report_title      || 'Business Intelligence Report',
    organisation:      settings.organisation       || 'My Organisation',
    analyst:           settings.analyst            || 'DataMind AI',
    tone:              settings.tone               || 'Professional',
    industry:          settings.industry           || 'General',
    filename:          file.name,
    exec_summary:      narratives.exec_summary     || '',
    key_findings:      narratives.key_findings     || '',
    anomaly_narrative: narratives.anomaly_narrative || '',
    recommendations:   narratives.recommendations  || '',
    health_score:      health.score,
    health_grade:      health.grade,
    stats_json:        JSON.stringify(stats     || {}),
    anomalies_json:    JSON.stringify(anomalies || {}),
    meta_json:         JSON.stringify(meta      || {}),
  }

  const r = await fetch(`${API}/api/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: 'PDF generation failed' }))
    throw new Error(err.detail || 'PDF generation failed')
  }
  return r.blob()
}

export async function chatWithData(
  apiKey: string,
  message: string,
  history: { role: string; content: string }[],
  datasetContext: string
) {
  const r = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, message, history, dataset_context: datasetContext }),
  })
  if (!r.ok) throw new Error('Chat failed')
  return r.json()
}
