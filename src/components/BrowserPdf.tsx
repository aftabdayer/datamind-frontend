/**
 * BrowserPdf — generates a professional PDF entirely in the browser.
 * Opens a styled print window; user clicks Print → Save as PDF.
 * Zero backend calls, zero timeouts, works with any file size.
 */

function cleanMd(text: string): string {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s*/gm, '')
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '<strong>$1</strong>')
    .replace(/^[ \t]*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function mdToHtml(text: string): string {
  const cleaned = cleanMd(text)
  return cleaned
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

function parseBlocks(text: string): { title: string; body: string }[] {
  const cleaned = cleanMd(text)
  // Try splitting by numbered items or double newline
  const blocks = cleaned.split(/\n(?=\d+[.)]\s|#{1,3}\s)/)
  if (blocks.length > 1) {
    return blocks.map(b => {
      const lines = b.trim().split('\n')
      const titleRaw = lines[0].replace(/^[\d.)\-#\s]+/, '').replace(/<\/?strong>/g, '').trim()
      const body = lines.slice(1).join('\n').trim()
      if (body) return { title: titleRaw, body }
      if (titleRaw.includes(':')) {
        const idx = titleRaw.indexOf(':')
        return { title: titleRaw.slice(0, idx).trim(), body: titleRaw.slice(idx + 1).trim() }
      }
      return { title: '', body: titleRaw }
    }).filter(b => b.title || b.body)
  }
  return cleaned.split('\n').filter(l => l.trim().length > 4).map(l => ({ title: '', body: l.trim() }))
}

export async function generateBrowserPdf(report: any, settings: any) {
  const Plotly = (window as any).Plotly
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // Capture charts as data URLs
  let chartImgs: string[] = []
  let forecastImg = ''
  if (Plotly && report.charts?.length) {
    chartImgs = await Promise.all(
      report.charts.slice(0, 6).map((c: any) =>
        Plotly.toImage(
          { data: c.data, layout: { ...c.layout, width: 900, height: 420, paper_bgcolor: '#ffffff', plot_bgcolor: '#f8fafc', font: { color: '#1e293b', family: 'Inter,sans-serif' } } },
          { format: 'png', width: 900, height: 420 }
        ).catch(() => '')
      )
    )
    chartImgs = chartImgs.filter(Boolean)
  }
  if (Plotly && report.forecast) {
    forecastImg = await Plotly.toImage(
      { data: report.forecast.data, layout: { ...report.forecast.layout, width: 900, height: 380, paper_bgcolor: '#ffffff', plot_bgcolor: '#f8fafc', font: { color: '#1e293b', family: 'Inter,sans-serif' } } },
      { format: 'png', width: 900, height: 380 }
    ).catch(() => '')
  }

  const kfBlocks  = parseBlocks(report.narratives.key_findings)
  const recBlocks = parseBlocks(report.narratives.recommendations)
  const anomBlocks = parseBlocks(report.narratives.anomaly_narrative)

  const healthColor = { Excellent: '#16a34a', Good: '#2563eb', Fair: '#d97706', Poor: '#dc2626' }[report.health.grade as string] || '#7c3aed'

  const chartGrid = chartImgs.length > 0 ? `
    <div class="chart-grid">
      ${chartImgs.map((img, i) => `
        <div class="chart-card ${i === 2 || i === 3 ? 'full' : ''}">
          <img src="${img}" alt="Chart ${i + 1}" />
        </div>
      `).join('')}
    </div>
    ${forecastImg ? `
      <div class="chart-card full" style="margin-top:16px">
        <div class="chart-label">Trend Forecast — Linear Regression Projection</div>
        <img src="${forecastImg}" alt="Forecast" />
      </div>
    ` : ''}
  ` : '<p class="no-data">Charts were not available for this export.</p>'

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${escHtml(settings.reportTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;color:#1e293b;background:#fff;font-size:10pt;line-height:1.6}
  @page{size:A4;margin:18mm 16mm 18mm 16mm}
  @media print{
    .no-print{display:none!important}
    .page-break{page-break-before:always}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }

  /* ── COVER ── */
  .cover{min-height:100vh;display:flex;flex-direction:column;justify-content:center;background:#0d0d1a;color:#fff;padding:60px 50px;position:relative}
  .cover-badge{display:inline-block;border:1px solid rgba(139,92,246,0.5);color:#a78bfa;padding:6px 16px;border-radius:999px;font-size:8pt;letter-spacing:2px;text-transform:uppercase;margin-bottom:40px}
  .cover-title{font-family:'Syne',sans-serif;font-size:36pt;font-weight:800;color:#fff;line-height:1.1;margin-bottom:12px;letter-spacing:-1px}
  .cover-sub{font-size:12pt;color:#94a3b8;margin-bottom:48px}
  .cover-divider{width:60px;height:3px;background:linear-gradient(90deg,#7c3aed,#4338ca);border-radius:2px;margin-bottom:40px}
  .cover-meta{font-size:9pt;color:#64748b;line-height:2}
  .cover-meta strong{color:#cbd5e1}
  .cover-health{margin-top:48px;display:flex;align-items:center;gap:20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px 28px}
  .health-score{font-family:'Syne',sans-serif;font-size:36pt;font-weight:800;color:${healthColor};line-height:1}
  .health-label{font-size:8pt;color:#475569;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px}
  .health-desc{font-size:9pt;color:#94a3b8;max-width:400px}
  .cover-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-top:32px}
  .stat-box{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 10px;text-align:center}
  .stat-val{font-family:'Syne',sans-serif;font-size:16pt;font-weight:800;color:#f1f5f9}
  .stat-lbl{font-size:6.5pt;color:#475569;text-transform:uppercase;letter-spacing:1px;margin-top:4px}

  /* ── HEADER / FOOTER ── */
  .page-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:2px solid #e2e8f0;margin-bottom:28px}
  .page-header-left{font-family:'Syne',sans-serif;font-weight:700;font-size:9pt;color:#7c3aed;text-transform:uppercase;letter-spacing:1px}
  .page-header-right{font-size:8pt;color:#94a3b8}
  .page-footer{margin-top:40px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:7.5pt;color:#94a3b8}

  /* ── SECTION ── */
  .section{padding:0 0 24px}
  .section-eyebrow{font-size:7pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:6px}
  .section-title{font-family:'Syne',sans-serif;font-size:22pt;font-weight:800;color:#0f172a;margin-bottom:20px;padding-bottom:10px;border-bottom:3px solid #7c3aed;display:inline-block}
  .section-divider{border:none;border-top:1px solid #e2e8f0;margin:32px 0}

  /* ── EXEC SUMMARY ── */
  .exec-box{background:#f8fafc;border-left:4px solid #7c3aed;border-radius:0 10px 10px 0;padding:20px 24px;margin-bottom:16px}
  .exec-box p{margin-bottom:10px;color:#334155;line-height:1.75}
  .exec-box p:last-child{margin-bottom:0}

  /* ── CARDS ── */
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;border-left:4px solid #7c3aed}
  .card.green{border-left-color:#16a34a}
  .card.amber{border-left-color:#d97706}
  .card.red{border-left-color:#dc2626}
  .card-num{font-size:7pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px}
  .card-title{font-weight:700;font-size:10pt;color:#0f172a;margin-bottom:6px}
  .card-body{font-size:9pt;color:#475569;line-height:1.6}

  /* ── CORR TABLE ── */
  .data-table{width:100%;border-collapse:collapse;font-size:9pt;margin:16px 0}
  .data-table th{background:#7c3aed;color:#fff;padding:8px 12px;text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:1px;font-weight:600}
  .data-table td{padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155}
  .data-table tr:nth-child(even) td{background:#f8fafc}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
  .badge-green{background:#dcfce7;color:#16a34a}
  .badge-blue{background:#dbeafe;color:#1d4ed8}
  .badge-amber{background:#fef3c7;color:#d97706}
  .badge-red{background:#fee2e2;color:#dc2626}

  /* ── CHARTS ── */
  .chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
  .chart-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
  .chart-card.full{grid-column:1/-1}
  .chart-card img{width:100%;display:block}
  .chart-label{font-size:8pt;font-weight:600;color:#475569;padding:8px 14px;border-bottom:1px solid #e2e8f0;background:#fff}
  .no-data{color:#94a3b8;font-style:italic;padding:20px 0}

  /* ── PRINT BUTTON ── */
  .print-btn{position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#7c3aed,#4338ca);color:#fff;border:none;border-radius:12px;padding:14px 28px;font-size:11pt;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(124,58,237,0.4);font-family:'Inter',sans-serif;z-index:9999}
</style>
</head>
<body>

<button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-badge">◈ DataMind AI · Groq LLaMA 3.3 · 70B</div>
  <div class="cover-title">${escHtml(settings.reportTitle)}</div>
  <div class="cover-sub">AI-Generated Business Intelligence Report</div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    <strong>${escHtml(settings.organisation)}</strong> &nbsp;·&nbsp; Prepared by <strong>${escHtml(settings.analyst)}</strong> &nbsp;·&nbsp; ${escHtml(settings.tone)} tone<br/>
    Industry: <strong>${escHtml(settings.industry)}</strong> &nbsp;·&nbsp; ${today}
  </div>
  <div class="cover-health">
    <div>
      <div class="health-score">${report.health.score}</div>
      <div class="health-label">${report.health.grade}</div>
    </div>
    <div class="health-desc">Data Health Score — ${report.health.score}/100 (${report.health.grade}). This dataset has been analysed for quality, completeness, and reliability.</div>
  </div>
  <div class="cover-stats">
    ${[
      [report.meta.rows.toLocaleString(), 'Rows'],
      [report.meta.cols, 'Columns'],
      [report.meta.numeric, 'Numeric'],
      [report.meta.categorical, 'Categorical'],
      [report.meta.missing_pct + '%', 'Missing'],
      [report.meta.duplicates, 'Duplicates'],
    ].map(([v, l]) => `<div class="stat-box"><div class="stat-val">${v}</div><div class="stat-lbl">${l}</div></div>`).join('')}
  </div>
</div>

<!-- SECTION 01: EXEC SUMMARY -->
<div class="page-break"></div>
<div class="page-header">
  <div class="page-header-left">DataMind AI — ${escHtml(settings.reportTitle)}</div>
  <div class="page-header-right">${today}</div>
</div>
<div class="section">
  <div class="section-eyebrow">Section 01</div>
  <div class="section-title">Executive Summary</div>
  <div class="exec-box">${mdToHtml(report.narratives.exec_summary)}</div>
</div>

<!-- SECTION 02: KEY FINDINGS -->
<hr class="section-divider"/>
<div class="section">
  <div class="section-eyebrow">Section 02</div>
  <div class="section-title">Key Findings</div>
  <div class="cards">
    ${kfBlocks.slice(0, 6).map((b, i) => `
      <div class="card">
        <div class="card-num">${String(i + 1).padStart(2, '0')}</div>
        ${b.title ? `<div class="card-title">${escHtml(b.title)}</div>` : ''}
        <div class="card-body">${escHtml(b.body)}</div>
      </div>
    `).join('')}
  </div>
  ${report.stats?.correlations?.length ? `
    <div class="section-eyebrow" style="margin-top:20px">Strong Correlations</div>
    <table class="data-table">
      <thead><tr><th>Variable Pair (A &amp; B)</th><th>Pearson R</th><th>Strength</th><th>Confidence</th></tr></thead>
      <tbody>
        ${report.stats.correlations.map((c: any) => `
          <tr>
            <td>${escHtml(c.col_a)} &amp; ${escHtml(c.col_b)}</td>
            <td><strong>${c.pearson_r}</strong></td>
            <td><span class="badge ${c.strength?.includes('Strong') ? 'badge-green' : c.strength?.includes('Moderate') ? 'badge-blue' : 'badge-amber'}">${escHtml(c.strength || '')}</span></td>
            <td>${c.confidence}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}
</div>

<!-- SECTION 03: CHARTS -->
<div class="page-break"></div>
<div class="page-header">
  <div class="page-header-left">DataMind AI — ${escHtml(settings.reportTitle)}</div>
  <div class="page-header-right">${today}</div>
</div>
<div class="section">
  <div class="section-eyebrow">Section 03</div>
  <div class="section-title">Charts &amp; Visualisations</div>
  ${chartGrid}
</div>

<!-- SECTION 04: STATISTICAL SUMMARY -->
<div class="page-break"></div>
<div class="page-header">
  <div class="page-header-left">DataMind AI — ${escHtml(settings.reportTitle)}</div>
  <div class="page-header-right">${today}</div>
</div>
<div class="section">
  <div class="section-eyebrow">Section 04</div>
  <div class="section-title">Statistical Summary</div>
  ${report.stats?.key_stats ? `
    <table class="data-table">
      <thead><tr><th>Column</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Skew</th><th>Missing</th></tr></thead>
      <tbody>
        ${Object.entries(report.stats.key_stats).map(([col, s]: [string, any]) => `
          <tr>
            <td><strong>${escHtml(col)}</strong></td>
            <td>${s.mean}</td><td>${s.median}</td><td>${s.std}</td>
            <td>${s.min}</td><td>${s.max}</td><td>${s.skew}</td>
            <td>${s.missing_pct}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}
</div>

<!-- SECTION 05: ANOMALIES -->
<div class="page-break"></div>
<div class="page-header">
  <div class="page-header-left">DataMind AI — ${escHtml(settings.reportTitle)}</div>
  <div class="page-header-right">${today}</div>
</div>
<div class="section">
  <div class="section-eyebrow">Section 05</div>
  <div class="section-title">Anomalies &amp; Data Quality</div>
  <div class="cards">
    ${anomBlocks.slice(0, 6).map((b) => {
      const lo = (b.title + b.body).toLowerCase()
      const cls = lo.includes('critical') || lo.includes('severe') ? 'red' : lo.includes('outlier') || lo.includes('skew') || lo.includes('missing') ? 'amber' : 'green'
      return `
        <div class="card ${cls}">
          ${b.title ? `<div class="card-title">${escHtml(b.title)}</div>` : ''}
          <div class="card-body">${escHtml(b.body)}</div>
        </div>
      `
    }).join('')}
  </div>
  ${report.anomalies?.outliers?.length ? `
    <div class="section-eyebrow" style="margin-top:20px">Outlier Detail Matrix</div>
    <table class="data-table">
      <thead><tr><th>Column</th><th>Count</th><th>%</th><th>Lower Bound</th><th>Upper Bound</th><th>Data Max</th></tr></thead>
      <tbody>
        ${report.anomalies.outliers.map((o: any) => `
          <tr><td>${escHtml(o.column)}</td><td>${o.count}</td><td>${o.pct}%</td><td>${o.lower}</td><td>${o.upper}</td><td>${o.data_max}</td></tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}
</div>

<!-- SECTION 06: RECOMMENDATIONS -->
<div class="page-break"></div>
<div class="page-header">
  <div class="page-header-left">DataMind AI — ${escHtml(settings.reportTitle)}</div>
  <div class="page-header-right">${today}</div>
</div>
<div class="section">
  <div class="section-eyebrow">Section 06</div>
  <div class="section-title">Actionable Recommendations</div>
  <div class="cards">
    ${recBlocks.slice(0, 6).map((b, i) => `
      <div class="card green">
        <div class="card-num">${String(i + 1).padStart(2, '0')}</div>
        ${b.title ? `<div class="card-title">${escHtml(b.title)}</div>` : ''}
        <div class="card-body">${escHtml(b.body)}</div>
      </div>
    `).join('')}
  </div>
</div>

<div class="page-footer">
  <span>© ${new Date().getFullYear()} DataMind AI. All rights reserved. · AI-Generated Report · ${escHtml(settings.organisation)}</span>
  <span>Confidential</span>
</div>

</body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Please allow popups to generate PDF'); return }
  win.document.write(html)
  win.document.close()
}
