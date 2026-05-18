// BrowserPdf — professional PDF, browser-generated, no backend needed

function esc(s: any): string {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// Split camelCase/PascalCase into words: "MeanProductSales" → "Mean Product Sales"
function splitCamel(s: string): string {
  return s.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').trim()
}

function stripMd(text: string): string {
  if (!text) return ''
  return text
    .replace(/={3,}/g,' ')
    .replace(/^#{1,6}\s*/gm,'')
    .replace(/<\/?strong>/g,'')
    .replace(/\*{1,3}([^*\n]*)\*{1,3}/g,'$1')   // remove **bold**
    .replace(/\*\*/g,'')                           // remove leftover **
    .replace(/^[ \t]*[-*]\s+/gm,'')
    .replace(/\n{3,}/g,'\n\n')
    .trim()
}

function mdToHtml(text: string): string {
  const clean = stripMd(text)
  return clean.split(/\n\n+/).filter(p => p.trim().length > 0)
    .map(p => `<p>${esc(p.replace(/\n/g,' '))}</p>`)
    .join('\n')
}

// Smart block parser: handles numbered lists, double-newline blocks, colon splits
function parseBlocks(text: string): { title: string; body: string }[] {
  const clean = stripMd(text)

  // Try numbered split first: "1. Title\nbody" or "1) Title\nbody"
  const byNumber = clean.split(/\n(?=\d+[.)]\s)/)
  if (byNumber.length > 1) {
    return byNumber.filter(b => b.trim()).map(b => {
      const lines = b.trim().split('\n')
      const firstLine = lines[0].replace(/^\d+[.)]\s*/,'').trim()
      const rest = lines.slice(1).join(' ').trim()
      if (rest) {
        // Clean up title: remove trailing colons, split camelCase
        const title = splitCamel(firstLine.replace(/:$/,'').replace(/\*\*/g,'').trim())
        return { title, body: stripMd(rest) }
      }
      // No rest — try colon split
      const ci = firstLine.indexOf(':')
      if (ci > 0 && ci < 80) {
        const title = splitCamel(firstLine.slice(0, ci).replace(/\*\*/g,'').trim())
        const body  = stripMd(firstLine.slice(ci + 1).trim())
        return { title, body }
      }
      return { title: '', body: splitCamel(firstLine) }
    }).filter(b => b.title || b.body)
  }

  // Fallback: double-newline blocks
  return clean.split(/\n\n+/).filter(p => p.trim().length > 8).map(p => {
    const lines = p.trim().split('\n')
    const first = lines[0].trim()
    const rest  = lines.slice(1).join(' ').trim()
    // Short first line = title
    if (rest && first.length < 90) {
      return { title: splitCamel(first.replace(/\*\*/g,'').replace(/:$/,'')), body: stripMd(rest) }
    }
    // Colon split
    const ci = first.indexOf(':')
    if (ci > 0 && ci < 80) {
      return { title: splitCamel(first.slice(0,ci).replace(/\*\*/g,'')), body: stripMd(p.slice(p.indexOf(':')+1)) }
    }
    return { title: '', body: stripMd(p) }
  })
}

const HC: Record<string,string> = { Excellent:'#16a34a', Good:'#2563eb', Fair:'#d97706', Poor:'#dc2626' }
const SC: Record<string,string> = {
  'Strong Positive':'bg','Strong':'bg','Moderate':'bb','Weak':'bgr','Inverse Strong':'br','Negative':'br'
}

const CHART_NAMES = [
  'Growth Trajectory Over Time',
  'Category Distribution',
  'Correlation Matrix',
  'Statistical Variance (Violin)',
  'Variable Scatter Analysis',
  'Composition Breakdown',
]

export async function generateBrowserPdf(report: any, settings: any) {
  const Plotly = (window as any).Plotly
  const today  = new Date().toLocaleDateString('en-GB',{ day:'numeric', month:'long', year:'numeric' })
  const hColor = HC[report.health?.grade] || '#7c3aed'
  const meta   = report.meta || {}
  const LL     = { paper_bgcolor:'#ffffff', plot_bgcolor:'#f8fafc', font:{ color:'#1e293b', family:'Inter,sans-serif', size:11 } }

  // Capture charts as PNG
  let chartImgs: string[] = []
  let forecastImg = ''
  if (Plotly && report.charts?.length) {
    chartImgs = await Promise.all(
      (report.charts as any[]).slice(0,6).map((c:any,i:number) =>
        Plotly.toImage(
          { data:c.data, layout:{...c.layout,...LL, width:860, height: (i===2||i===3)?420:360 } },
          { format:'png', width:860, height:(i===2||i===3)?420:360 }
        ).catch(()=>'')
      )
    )
    chartImgs = chartImgs.filter(Boolean)
  }
  if (Plotly && report.forecast) {
    forecastImg = await Plotly.toImage(
      { data:report.forecast.data, layout:{...report.forecast.layout,...LL, width:860, height:340} },
      { format:'png', width:860, height:340 }
    ).catch(()=>'')
  }

  const kfB   = parseBlocks(report.narratives?.key_findings   || '')
  const recB  = parseBlocks(report.narratives?.recommendations || '')
  const anomB = parseBlocks(report.narratives?.anomaly_narrative || '')

  // Chart grid — proper labels
  const chartGrid = chartImgs.length > 0 ? `
    <div class="cgrid">
      ${chartImgs.slice(0,2).map((img,i)=>`
        <div class="cbox">
          <div class="clbl">${CHART_NAMES[i]||'Chart '+(i+1)}</div>
          <img src="${img}" alt="${CHART_NAMES[i]||'Chart '+(i+1)}"/>
        </div>`).join('')}
    </div>
    ${chartImgs.slice(2,4).map((img,i)=>`
      <div class="cbox full mt12">
        <div class="clbl">${CHART_NAMES[i+2]||'Chart '+(i+3)}</div>
        <img src="${img}" alt="${CHART_NAMES[i+2]}"/>
      </div>`).join('')}
    <div class="cgrid mt12">
      ${chartImgs.slice(4,6).map((img,i)=>`
        <div class="cbox">
          <div class="clbl">${CHART_NAMES[i+4]||'Chart '+(i+5)}</div>
          <img src="${img}" alt="${CHART_NAMES[i+4]||'Chart '+(i+5)}"/>
        </div>`).join('')}
    </div>
    ${forecastImg ? `
      <div class="cbox full mt12">
        <div class="clbl">Trend Forecast — Linear Regression with Confidence Band</div>
        <img src="${forecastImg}" alt="Forecast"/>
      </div>` : ''}
  ` : '<p class="nd">Charts were not captured. Generate the report again to include charts.</p>'

  // Correlations
  const corrT = report.stats?.correlations?.length ? `
    <h3 class="sh">Notable Correlations</h3>
    <table class="tbl">
      <thead><tr><th>Variable Pair (A &amp; B)</th><th>Pearson R</th><th>Strength</th><th>Confidence</th></tr></thead>
      <tbody>${(report.stats.correlations as any[]).map(c=>`
        <tr>
          <td>${esc(c.col_a)} &amp; ${esc(c.col_b)}</td>
          <td class="mono center"><strong>${c.pearson_r}</strong></td>
          <td><span class="badge ${SC[c.strength]||'bgr'}">${esc(c.strength)}</span></td>
          <td class="center">${c.confidence}%</td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''

  // Stats table
  const statsT = report.stats?.key_stats ? `
    <table class="tbl">
      <thead><tr><th>Column</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Skew</th><th>CV%</th><th>Missing</th></tr></thead>
      <tbody>${Object.entries(report.stats.key_stats).map(([col,s]:any)=>`
        <tr>
          <td class="cn">${esc(col)}</td>
          <td class="mono">${s.mean}</td><td class="mono">${s.median}</td><td class="mono">${s.std}</td>
          <td class="mono">${s.min}</td><td class="mono">${s.max}</td><td class="mono">${s.skew}</td>
          <td class="mono">${s.cv}%</td><td class="mono">${s.missing_pct}%</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<p class="nd">No statistical data available.</p>'

  // Outlier table
  const outlierT = report.anomalies?.outliers?.length ? `
    <h3 class="sh mt20">Outlier Detail Matrix — IQR Method</h3>
    <table class="tbl">
      <thead><tr><th>Column</th><th>Count</th><th>Outlier %</th><th>Lower Bound</th><th>Upper Bound</th><th>Data Max</th></tr></thead>
      <tbody>${(report.anomalies.outliers as any[]).map(o=>`
        <tr>
          <td class="cn">${esc(o.column)}</td>
          <td class="mono center">${o.count}</td><td class="mono center">${o.pct}%</td>
          <td class="mono">${o.lower}</td><td class="mono">${o.upper}</td><td class="mono">${o.data_max}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''

  // Helpers
  const RH = () => `<div class="rh"><div class="rh-l">DataMind AI &nbsp;·&nbsp; ${esc(settings.reportTitle)}</div><div class="rh-r">${today} &nbsp;·&nbsp; Confidential</div></div>`
  const SEC = (n:string, t:string) => `<div class="ey">Section ${n}</div><div class="st">${t}</div>`
  const CARD = (b:{title:string;body:string}, i:number, cls:string, label:string) => `
    <div class="card ${cls}">
      <div class="cnum">${label} ${String(i+1).padStart(2,'0')}</div>
      ${b.title ? `<div class="ctitle">${esc(b.title)}</div>` : ''}
      <div class="cbody">${esc(b.body)}</div>
    </div>`

  const anomCards = anomB.slice(0,6).map((b,i) => {
    const lo = (b.title+' '+b.body).toLowerCase()
    const cls = lo.includes('critical')||lo.includes('severe') ? 'red'
              : lo.includes('outlier')||lo.includes('skew')||lo.includes('missing')||lo.includes('error') ? 'amber'
              : lo.includes('no duplicate')||lo.includes('no missing')||lo.includes('free from')||lo.includes('complete') ? 'green'
              : 'info'
    return CARD(b, i, cls, 'Flag')
  }).join('')

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<title>${esc(settings.reportTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:10pt}
body{font-family:'Inter',sans-serif;color:#1e293b;background:#fff;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:22mm 18mm 22mm 18mm}
@media print{.np{display:none!important}.pb{page-break-before:always}}

/* COVER */
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(155deg,#08081a 0%,#10092a 55%,#061210 100%);color:#fff;padding:56px 56px;position:relative;overflow:hidden}
.cover::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 75% 18%,rgba(124,58,237,.22) 0%,transparent 55%),radial-gradient(ellipse at 12% 88%,rgba(16,185,129,.1) 0%,transparent 48%)}
.ci{position:relative;z-index:1}
.cbadge{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(167,139,250,.4);background:rgba(124,58,237,.12);color:#a78bfa;padding:8px 20px;border-radius:999px;font-size:7pt;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;margin-bottom:44px}
.ctitle{font-family:'Syne',sans-serif;font-size:38pt;font-weight:800;color:#fff;line-height:1.05;margin-bottom:12px;letter-spacing:-1.5px;word-break:break-word}
.csub{font-size:11pt;color:#94a3b8;margin-bottom:44px;font-weight:300}
.crule{width:56px;height:3px;background:linear-gradient(90deg,#7c3aed,#4338ca);border-radius:2px;margin-bottom:38px}
.cmeta{font-size:9.5pt;color:#64748b;line-height:2.4}
.cmeta strong{color:#e2e8f0;font-weight:500}
.hband{display:flex;align-items:center;gap:28px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:26px 32px;margin-top:48px}
.hscore{font-family:'Syne',sans-serif;font-size:48pt;font-weight:800;color:${hColor};line-height:1;flex-shrink:0}
.hgrade{font-size:7.5pt;color:#475569;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:6px;font-weight:600}
.hdesc{font-size:9.5pt;color:#94a3b8;line-height:1.7;max-width:460px}
.kstrip{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:28px}
.kbox{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:18px 10px;text-align:center}
.kval{font-family:'Syne',sans-serif;font-size:17pt;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px}
.klbl{font-size:6pt;color:#475569;text-transform:uppercase;letter-spacing:1.5px;margin-top:6px}

/* RUNNING HEADER */
.rh{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1.5px solid #e2e8f0;margin-bottom:32px}
.rh-l{font-size:7.5pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:1.5px}
.rh-r{font-size:7.5pt;color:#94a3b8}
.rf{margin-top:52px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
.rf-logo{font-family:'Syne',sans-serif;font-weight:700;font-size:9pt;color:#7c3aed}
.rf-txt{font-size:7pt;color:#94a3b8}

/* SECTION */
.ey{font-size:6.5pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px}
.st{font-family:'Syne',sans-serif;font-size:26pt;font-weight:800;color:#0f172a;margin-bottom:28px;padding-bottom:10px;border-bottom:3px solid #7c3aed;display:inline-block;letter-spacing:-.5px}
.sh{font-size:9pt;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:2px;margin:24px 0 12px;padding-bottom:6px;border-bottom:1px solid #f1f5f9}
.mt12{margin-top:12px}.mt20{margin-top:20px}

/* EXEC QUOTE */
.eq{background:#f8fafc;border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;padding:24px 30px;margin-bottom:16px}
.eq p{color:#334155;margin-bottom:14px;line-height:1.85;font-size:10pt}
.eq p:last-child{margin-bottom:0}

/* CARDS — wider, more breathing room */
.cg{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:8px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px 24px;border-top:4px solid #7c3aed;page-break-inside:avoid}
.card.green{border-top-color:#16a34a}.card.amber{border-top-color:#d97706}.card.red{border-top-color:#dc2626}.card.info{border-top-color:#0ea5e9}
.cnum{font-size:6.5pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:10px}
.card.green .cnum{color:#16a34a}.card.amber .cnum{color:#d97706}.card.red .cnum{color:#dc2626}.card.info .cnum{color:#0ea5e9}
.ctitle{font-weight:700;font-size:11pt;color:#0f172a;margin-bottom:10px;line-height:1.35;letter-spacing:-0.2px;word-spacing:1px}
.cbody{font-size:9pt;color:#475569;line-height:1.8}

/* TABLES */
.tbl{width:100%;border-collapse:collapse;font-size:8.5pt;margin:10px 0 20px}
.tbl thead tr{background:#7c3aed}
.tbl th{color:#fff;padding:10px 13px;text-align:left;font-size:7pt;text-transform:uppercase;letter-spacing:1.2px;font-weight:600}
.tbl td{padding:9px 13px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:middle}
.tbl tr:nth-child(even) td{background:#f8fafc}
.tbl tr:last-child td{border-bottom:none}
.mono{font-family:'JetBrains Mono',monospace;font-size:8pt}
.center{text-align:center}
.cn{font-weight:600;color:#0f172a;font-size:8.5pt}

/* BADGES */
.badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.bg{background:#dcfce7;color:#15803d}
.bb{background:#dbeafe;color:#1d4ed8}
.br{background:#fee2e2;color:#b91c1c}
.bgr{background:#f1f5f9;color:#64748b}

/* CHARTS */
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.cbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:13px;overflow:hidden;page-break-inside:avoid}
.cbox.full{grid-column:1/-1}
.clbl{font-size:8pt;font-weight:600;color:#334155;padding:10px 16px;border-bottom:1px solid #e2e8f0;background:#fff;letter-spacing:.2px}
.cbox img{width:100%;display:block;object-fit:contain}
.nd{color:#94a3b8;font-style:italic;padding:16px 0;font-size:9pt}

/* PRINT BUTTON */
.pbt{position:fixed;bottom:28px;right:28px;z-index:9999;background:linear-gradient(135deg,#7c3aed,#4338ca);color:#fff;border:none;border-radius:12px;padding:14px 30px;font-size:11pt;font-weight:700;cursor:pointer;box-shadow:0 8px 28px rgba(124,58,237,.5);font-family:'Inter',sans-serif;transition:transform .15s}
.pbt:hover{transform:translateY(-2px)}
</style></head><body>

<button class="pbt np" onclick="window.print()">⬇ &nbsp;Save as PDF</button>

<!-- COVER -->
<div class="cover"><div class="ci">
<div class="cbadge">◈ DataMind AI &nbsp;·&nbsp; Groq LLaMA 3.3 · 70B</div>
<div class="ctitle">${esc(settings.reportTitle)}</div>
<div class="csub">AI-Generated Business Intelligence Report</div>
<div class="crule"></div>
<div class="cmeta">
  <strong>${esc(settings.organisation)}</strong> &nbsp;·&nbsp; Prepared by <strong>${esc(settings.analyst)}</strong> &nbsp;·&nbsp; ${esc(settings.tone)} Tone<br/>
  Industry: <strong>${esc(settings.industry)}</strong> &nbsp;·&nbsp; ${today}
</div>
<div class="hband">
  <div class="hscore">${report.health?.score ?? '--'}</div>
  <div>
    <div class="hgrade">${esc(report.health?.grade)} — Data Health Score</div>
    <div class="hdesc">This dataset scored <strong>${report.health?.score}/100</strong> on our health assessment, evaluating completeness, consistency, and structural integrity of the data.</div>
  </div>
</div>
<div class="kstrip">
  ${[[meta.rows?.toLocaleString()??'--','Total Rows'],[meta.cols??'--','Columns'],[meta.numeric_cols??'--','Numeric'],[meta.cat_cols??'--','Categorical'],[(meta.missing_pct??0)+'%','Missing'],[meta.duplicate_rows??0,'Duplicates']]
    .map(([v,l])=>`<div class="kbox"><div class="kval">${v}</div><div class="klbl">${l}</div></div>`).join('')}
</div>
</div></div>

<!-- TABLE OF CONTENTS -->
<div class="pb"></div>
${RH()}
<div class="ey">Contents</div>
<div class="st">Table of Contents</div>
<table class="tbl" style="font-size:10pt">
  <thead><tr><th>#</th><th>Section</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td class="mono center">01</td><td><strong>Executive Summary</strong></td><td>Dataset scope, key patterns, and business implications</td></tr>
    <tr><td class="mono center">02</td><td><strong>Key Findings</strong></td><td>Five data-driven insights with specific metrics</td></tr>
    <tr><td class="mono center">03</td><td><strong>Charts &amp; Visualisations</strong></td><td>Trend, distribution, correlation, and composition charts</td></tr>
    <tr><td class="mono center">04</td><td><strong>Statistical Summary</strong></td><td>Descriptive statistics and correlation analysis</td></tr>
    <tr><td class="mono center">05</td><td><strong>Anomalies &amp; Data Quality</strong></td><td>Outliers, missing data, skewness, and data health flags</td></tr>
    <tr><td class="mono center">06</td><td><strong>Actionable Recommendations</strong></td><td>Strategic actions based on the AI analysis</td></tr>
  </tbody>
</table>
<div class="rf"><div class="rf-logo">◈ DataMind AI</div><div class="rf-txt">© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div></div>

<!-- S01 EXEC SUMMARY -->
<div class="pb"></div>
${RH()}
${SEC('01','Executive Summary')}
<div class="eq">${mdToHtml(report.narratives?.exec_summary||'')}</div>
<div class="rf"><div class="rf-logo">◈ DataMind AI</div><div class="rf-txt">© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div></div>

<!-- S02 KEY FINDINGS -->
<div class="pb"></div>
${RH()}
${SEC('02','Key Findings')}
<div class="cg">${kfB.slice(0,6).map((b,i)=>CARD(b,i,'','Finding')).join('')}</div>
${corrT}
<div class="rf"><div class="rf-logo">◈ DataMind AI</div><div class="rf-txt">© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div></div>

<!-- S03 CHARTS -->
<div class="pb"></div>
${RH()}
${SEC('03','Charts &amp; Visualisations')}
${chartGrid}
<div class="rf"><div class="rf-logo">◈ DataMind AI</div><div class="rf-txt">© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div></div>

<!-- S04 STATS -->
<div class="pb"></div>
${RH()}
${SEC('04','Statistical Summary')}
${statsT}
<div class="rf"><div class="rf-logo">◈ DataMind AI</div><div class="rf-txt">© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div></div>

<!-- S05 ANOMALIES -->
<div class="pb"></div>
${RH()}
${SEC('05','Anomalies &amp; Data Quality')}
<div class="cg">${anomCards}</div>
${outlierT}
<div class="rf"><div class="rf-logo">◈ DataMind AI</div><div class="rf-txt">© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div></div>

<!-- S06 RECOMMENDATIONS -->
<div class="pb"></div>
${RH()}
${SEC('06','Actionable Recommendations')}
<div class="cg">${recB.slice(0,6).map((b,i)=>CARD(b,i,'green','Action')).join('')}</div>
<div class="rf"><div class="rf-logo">◈ DataMind AI</div><div class="rf-txt">© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div></div>

</body></html>`

  const win = window.open('','_blank','width=1050,height=800')
  if (!win) { alert('Please allow popups for this site to open the PDF.'); return }
  win.document.write(html)
  win.document.close()
}
