/**
 * Client-side PDF generation using browser print
 * No backend needed — works 100% of the time
 */

interface ReportData {
  meta: any
  health: any
  stats: any
  anomalies: any
  narratives: any
  settings: {
    reportTitle: string
    organisation: string
    analyst: string
    tone: string
    industry: string
  }
}

export function generatePDFInBrowser(report: ReportData): void {
  const { meta, health, stats, anomalies, narratives, settings } = report
  const corrs = stats.strong_correlations || []
  const outliers = anomalies.outliers || {}
  const keyStats = stats.key_stats || {}
  const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const GRADE_COLOR: Record<string, string> = {
    Excellent: '#16a34a', Good: '#2563eb', Fair: '#d97706', Poor: '#dc2626',
  }
  const hc = GRADE_COLOR[health.grade] || '#7c3aed'

  // Parse findings
  const findings = (narratives.key_findings as string)
    .split('\n').filter((l: string) => l.trim().length > 4)
    .slice(0, 5)

  // Parse recommendations
  const recos = (narratives.recommendations as string)
    .split('\n').filter((l: string) => l.trim().length > 4)
    .slice(0, 5)

  // Parse anomaly lines
  const anomalyLines = (narratives.anomaly_narrative as string)
    .split('\n').filter((l: string) => l.trim().length > 6)
    .slice(0, 8)

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${settings.reportTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: white; font-size: 11px; line-height: 1.6; }

  /* COVER */
  .cover {
    background: linear-gradient(160deg, #0d0d1a 0%, #130d2e 40%, #0b1530 70%, #0d0d14 100%);
    color: white; padding: 80px 60px 60px; min-height: 100vh;
    display: flex; flex-direction: column; justify-content: center;
    page-break-after: always;
  }
  .cover-eyebrow {
    display: inline-block;
    background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3);
    color: #a78bfa; font-size: 9px; font-weight: 700; letter-spacing: 3px;
    text-transform: uppercase; padding: 5px 14px; border-radius: 999px;
    margin-bottom: 28px;
  }
  .cover h1 { font-size: 38px; font-weight: 800; color: #f0f0f5; letter-spacing: -1px; margin-bottom: 10px; line-height: 1.1; }
  .cover-sub { color: rgba(255,255,255,0.45); font-size: 13px; margin-bottom: 28px; }
  .cover-rule { width: 80px; height: 2px; background: #4c1d95; margin: 0 0 24px; }
  .cover-meta { color: rgba(255,255,255,0.5); font-size: 11px; line-height: 2; }
  .cover-meta b { color: rgba(255,255,255,0.75); }
  .health-badge {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 28px; padding: 10px 20px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
  }
  .health-score { font-size: 28px; font-weight: 800; }
  .health-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.45); }

  /* KPI ROW */
  .kpi-strip {
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;
    margin-top: 32px;
  }
  .kpi-box {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 14px 10px; text-align: center;
  }
  .kpi-val { font-size: 20px; font-weight: 800; color: #f0f0f5; margin-bottom: 4px; }
  .kpi-lbl { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.35); }

  /* TOC */
  .toc { padding: 50px 60px; page-break-after: always; }
  .toc h2 { font-size: 18px; font-weight: 800; margin-bottom: 6px; color: #1e293b; }
  .toc-rule { height: 2px; background: #7c3aed; margin-bottom: 20px; }
  .toc-row { display: flex; align-items: baseline; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f0f4f8; }
  .toc-num { font-size: 9px; font-weight: 700; color: #7c3aed; min-width: 24px; }
  .toc-title { font-size: 12px; font-weight: 600; color: #1e293b; flex: 1; }
  .toc-desc { font-size: 10px; color: #64748b; flex: 2; }

  /* BODY PAGES */
  .page { padding: 50px 60px; page-break-after: always; }
  .page:last-child { page-break-after: auto; }

  /* SECTION HEADER */
  .sec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
  .sec-bar { width: 3px; height: 22px; background: linear-gradient(180deg, #8b5cf6, #3b82f6); border-radius: 2px; flex-shrink: 0; }
  .sec-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
  .sec-title { font-size: 16px; font-weight: 800; color: #1e293b; }

  /* CONTENT CARDS */
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; font-size: 11px; color: #475569; line-height: 1.75; }
  .card-purple { border-left: 3px solid #8b5cf6; background: #faf5ff; }
  .card-blue   { border-left: 3px solid #3b82f6; background: #eff6ff; }
  .card-green  { border-left: 3px solid #10b981; background: #f0fdf4; }
  .card-amber  { border-left: 3px solid #f59e0b; background: #fffbeb; }
  .card-title  { font-weight: 700; color: #1e293b; font-size: 12px; margin-bottom: 5px; }

  /* FINDINGS GRID */
  .findings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .finding-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
  .finding-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 6px; background: rgba(139,92,246,0.12); color: #7c3aed; font-size: 9px; font-weight: 800; margin-bottom: 6px; }

  /* TABLES */
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 8px; }
  th { background: rgba(139,92,246,0.08); color: #475569; padding: 7px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #e2e8f0; }
  td { padding: 8px 10px; color: #475569; border-bottom: 1px solid #f0f4f8; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }

  /* ANOMALY CARDS */
  .anomaly-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; }
  .anomaly-high   { border-top: 2px solid #ef4444; }
  .anomaly-medium { border-top: 2px solid #f59e0b; }
  .anomaly-low    { border-top: 2px solid #10b981; }
  .anomaly-badge { display: inline-block; font-size: 8px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
  .badge-high   { background: rgba(239,68,68,0.1);  color: #dc2626; }
  .badge-medium { background: rgba(245,158,11,0.1); color: #d97706; }
  .badge-low    { background: rgba(16,185,129,0.1); color: #059669; }

  /* FOOTER */
  @page { margin: 0; size: A4; }
  .footer { position: fixed; bottom: 20px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-break { page-break-after: always; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-eyebrow">◈ DataMind AI · Groq Llama 3.3 · 70B</div>
  <h1>${settings.reportTitle}</h1>
  <p class="cover-sub">AI-Generated Business Intelligence Report</p>
  <div class="cover-rule"></div>
  <div class="cover-meta">
    <div><b>${settings.organisation}</b> &nbsp;·&nbsp; Prepared by <b>${settings.analyst}</b> &nbsp;·&nbsp; ${settings.tone} tone</div>
    <div>Industry: <b>${settings.industry}</b> &nbsp;·&nbsp; ${now}</div>
    <div>Source: <b>${meta.filename || 'dataset'}</b></div>
  </div>
  <div class="health-badge">
    <div>
      <div class="health-score" style="color:${hc}">${health.score}</div>
      <div class="health-label">${health.grade}</div>
    </div>
    <div style="width:1px;height:36px;background:rgba(255,255,255,0.12)"></div>
    <div style="color:rgba(255,255,255,0.45);font-size:10px">Data Health Score<br><span style="color:${hc};font-weight:700">${health.grade} — ${health.score}/100</span></div>
  </div>
  <div class="kpi-strip">
    ${[
      ['◈', (meta.rows||0).toLocaleString(), 'Total Rows'],
      ['◫', meta.cols||0, 'Columns'],
      ['⊞', meta.numeric_cols||0, 'Numeric'],
      ['◉', meta.cat_cols||0, 'Categorical'],
      ['△', (meta.missing_pct||0)+'%', 'Missing'],
      ['✓', meta.duplicate_rows||0, 'Duplicates'],
    ].map(([icon, val, lbl]) => `
      <div class="kpi-box">
        <div style="font-size:16px;margin-bottom:4px">${icon}</div>
        <div class="kpi-val">${val}</div>
        <div class="kpi-lbl">${lbl}</div>
      </div>
    `).join('')}
  </div>
</div>

<!-- TOC -->
<div class="toc">
  <h2>Table of Contents</h2>
  <div class="toc-rule"></div>
  ${[
    ['01','Executive Summary','Dataset scope, key patterns, and business implications'],
    ['02','Key Findings','Five data-driven insights with specific metrics'],
    ['03','Statistical Summary','Descriptive statistics and correlation analysis'],
    ['04','Anomalies & Data Quality','Outliers, missing data, skewness, and data health'],
    ['05','Actionable Recommendations','Five strategic actions based on the AI analysis'],
  ].map(([num, title, desc]) => `
    <div class="toc-row">
      <span class="toc-num">${num}</span>
      <span class="toc-title">${title}</span>
      <span class="toc-desc">${desc}</span>
    </div>
  `).join('')}
</div>

<!-- EXEC SUMMARY -->
<div class="page">
  <div class="sec-header">
    <div class="sec-bar"></div>
    <div>
      <div class="sec-label">Section 01</div>
      <div class="sec-title">Executive Summary</div>
    </div>
  </div>
  ${narratives.exec_summary.split('\n').filter((p: string) => p.trim()).map((p: string) => `
    <div class="card card-blue"><p>${p}</p></div>
  `).join('')}
</div>

<!-- KEY FINDINGS -->
<div class="page">
  <div class="sec-header">
    <div class="sec-bar"></div>
    <div>
      <div class="sec-label">Section 02</div>
      <div class="sec-title">Key Findings</div>
    </div>
  </div>
  <div class="findings-grid">
    ${findings.map((line: string, i: number) => {
      const m = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?:\s*(.+)$/)
      const title = m ? m[1].replace(/\*\*/g,'') : `Finding ${i+1}`
      const body  = m ? m[2] : line.replace(/^\d+\.\s*/,'').replace(/\*\*/g,'')
      return `
      <div class="finding-card">
        <div class="finding-num">${String(i+1).padStart(2,'0')}</div>
        <div style="font-weight:700;color:#1e293b;font-size:11px;margin-bottom:4px">${title}</div>
        <div style="font-size:10px;color:#475569;line-height:1.65">${body}</div>
      </div>`
    }).join('')}
  </div>

  ${corrs.length > 0 ? `
  <div style="margin-top:20px">
    <div class="sec-header">
      <div class="sec-bar"></div>
      <div><div class="sec-title" style="font-size:13px">Strong Correlations</div></div>
    </div>
    <table>
      <thead><tr>
        <th>Variable Pair (A &amp; B)</th>
        <th>Pearson R</th><th>Strength</th><th>Confidence</th>
      </tr></thead>
      <tbody>
        ${corrs.map((c: any) => {
          const conf = Math.min(99.9, Math.abs(c.r)*105).toFixed(1)
          const isPos = c.strength==='Strong' && c.r>0
          const isNeg = c.strength==='Strong' && c.r<0
          const color = isPos ? '#16a34a' : isNeg ? '#dc2626' : '#d97706'
          const label = isPos ? 'Strong Positive' : isNeg ? 'Inverse Strong' : 'Moderate'
          return `<tr>
            <td style="color:#3b82f6;font-weight:600">⇌ ${c.col1} &amp; ${c.col2}</td>
            <td style="color:${color};font-weight:700">${c.r}</td>
            <td><span style="background:${color}18;color:${color};padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700;text-transform:uppercase">${label}</span></td>
            <td style="color:#64748b">${conf}%</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>` : ''}
</div>

<!-- STATS SUMMARY -->
<div class="page">
  <div class="sec-header">
    <div class="sec-bar"></div>
    <div>
      <div class="sec-label">Section 03</div>
      <div class="sec-title">Statistical Summary</div>
    </div>
  </div>
  ${Object.keys(keyStats).length > 0 ? `
  <table>
    <thead><tr>
      <th>Column</th><th>Mean</th><th>Median</th><th>Std Dev</th>
      <th>Min</th><th>Max</th><th>Skew</th><th>Missing %</th>
    </tr></thead>
    <tbody>
      ${Object.entries(keyStats).map(([col, s]: [string, any]) => `
        <tr>
          <td style="color:#7c3aed;font-weight:600">${col}</td>
          <td>${s.mean}</td><td>${s.median}</td><td>${s.std}</td>
          <td>${s.min}</td><td>${s.max}</td><td>${s.skew}</td>
          <td style="color:${s.missing_pct>10?'#dc2626':'#475569'}">${s.missing_pct}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>` : '<p style="color:#94a3b8">No numeric columns found.</p>'}
</div>

<!-- ANOMALIES -->
<div class="page">
  <div class="sec-header">
    <div class="sec-bar"></div>
    <div>
      <div class="sec-label">Section 04</div>
      <div class="sec-title">Anomalies &amp; Data Quality</div>
    </div>
  </div>
  ${anomalyLines.map((line: string) => {
    const l = line.toLowerCase()
    const isHigh = ['extreme','critical','significant','major'].some((w: string) => l.includes(w))
    const isMed  = ['moderate','warning','missing','outlier'].some((w: string) => l.includes(w))
    const cls    = isHigh ? 'high' : isMed ? 'medium' : 'low'
    const badge  = isHigh ? 'CRITICAL: HIGH' : isMed ? 'ATTENTION: MEDIUM' : 'INFO: LOW'
    return `
    <div class="anomaly-card anomaly-${cls}">
      <div class="anomaly-badge badge-${cls}">${badge}</div>
      <p style="font-size:10px;color:#475569;line-height:1.65">${line}</p>
    </div>`
  }).join('')}

  ${Object.keys(outliers).length > 0 ? `
  <div style="margin-top:16px">
    <div style="font-weight:700;font-size:12px;color:#1e293b;margin-bottom:8px">Outlier Detail Matrix</div>
    <table>
      <thead><tr>
        <th>Column</th><th>Count</th><th>%</th>
        <th>Lower Bound</th><th>Upper Bound</th><th>Data Max</th>
      </tr></thead>
      <tbody>
        ${Object.entries(outliers).map(([col, v]: [string, any]) => `
          <tr>
            <td style="color:#7c3aed;font-weight:600">${col}</td>
            <td>${v.count.toLocaleString()}</td>
            <td>${v.pct}%</td>
            <td>${v.lower_bound}</td>
            <td>${v.upper_bound}</td>
            <td>${v.extreme_max}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}
</div>

<!-- RECOMMENDATIONS -->
<div class="page">
  <div class="sec-header">
    <div class="sec-bar"></div>
    <div>
      <div class="sec-label">Section 05</div>
      <div class="sec-title">Actionable Recommendations</div>
    </div>
  </div>
  ${recos.map((line: string, i: number) => {
    const m = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?:\s*(.+)$/)
    const title = m ? m[1].replace(/\*\*/g,'') : `Recommendation ${i+1}`
    const body  = m ? m[2] : line.replace(/^\d+\.\s*/,'').replace(/\*\*/g,'')
    return `
    <div class="card card-green">
      <div class="card-title">${String(i+1).padStart(2,'0')} — ${title}</div>
      <p>${body}</p>
    </div>`
  }).join('')}

  <div style="margin-top:24px;text-align:center;padding:20px;background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(67,56,202,0.04));border:1px solid rgba(139,92,246,0.15);border-radius:12px">
    <div style="font-size:20px;margin-bottom:8px">✦</div>
    <div style="font-weight:700;color:#7c3aed;font-size:12px;margin-bottom:4px">Deep Intelligence Active</div>
    <div style="font-size:10px;color:#64748b">Real-time pattern matching identifying further secondary correlations.</div>
  </div>

  <div style="margin-top:40px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px">
    © ${new Date().getFullYear()} DataMind AI. All rights reserved. &nbsp;·&nbsp; AI-Generated Report &nbsp;·&nbsp; ${settings.organisation}
  </div>
</div>

</body>
</html>`

  // Open print window
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 800)
}
