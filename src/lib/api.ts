const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function validateKey(apiKey: string): Promise<boolean> {
  const fd = new FormData()
  fd.append('api_key', apiKey)
  const r = await fetch(`${API}/api/validate-key`, { method: 'POST', body: fd })
  const d = await r.json()
  return d.valid === true
}

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

export async function generatePDF(
  file: File,
  apiKey: string,
  settings: Record<string, string>,
  narratives: Record<string, string>,
  health: { score: number; grade: string },
  charts?: any[],
  forecast?: any
): Promise<Blob> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', apiKey)
  Object.entries(settings).forEach(([k, v]) => fd.append(k, v))
  Object.entries(narratives).forEach(([k, v]) => fd.append(k, v))
  fd.append('health_score', String(health.score))
  fd.append('health_grade', health.grade)
  fd.append('charts_json', JSON.stringify(charts || []))
  fd.append('forecast_json', JSON.stringify(forecast || null))

  const r = await fetch(`${API}/api/pdf`, { method: 'POST', body: fd })
  if (!r.ok) throw new Error('PDF generation failed')
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
