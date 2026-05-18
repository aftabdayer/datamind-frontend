// BrowserPdf — professional PDF generated in browser, no backend needed

function esc(s: any): string {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function stripMd(text: string): string {
  if (!text) return ''
  return text
    .replace(/={3,}/g,'').replace(/^#{1,6}\s*/gm,'').replace(/<\/?strong>/g,'')
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g,'$1').replace(/^[ \t]*[-*]\s+/gm,'')
    .replace(/\n{3,}/g,'\n\n').trim()
}

function mdToHtml(text: string): string {
  return stripMd(text).split(/\n\n+/).filter(p=>p.trim())
    .map(p=>`<p>${esc(p.replace(/\n/g,' '))}</p>`).join('\n')
}

function parseBlocks(text: string): {title:string;body:string}[] {
  const cleaned = stripMd(text)
  const parts = cleaned.split(/\n(?=\d+[.)]\s)/)
  if (parts.length > 1) {
    return parts.map(b=>{
      const lines = b.trim().split('\n')
      const raw = lines[0].replace(/^\d+[.)]\s*/,'').trim()
      const body = lines.slice(1).join(' ').trim()
      if (body) return {title:raw,body}
      const ci = raw.indexOf(':')
      if (ci>0&&ci<60) return {title:raw.slice(0,ci).trim(),body:raw.slice(ci+1).trim()}
      return {title:'',body:raw}
    }).filter(b=>b.title||b.body)
  }
  return cleaned.split(/\n\n+/).filter(p=>p.trim().length>8).map(p=>{
    const lines = p.trim().split('\n')
    if (lines.length>1&&lines[0].length<80) return {title:lines[0].trim(),body:lines.slice(1).join(' ').trim()}
    const ci = lines[0].indexOf(':')
    if (ci>0&&ci<60) return {title:lines[0].slice(0,ci).trim(),body:p.slice(ci+1).trim()}
    return {title:'',body:p.trim()}
  })
}

const HC:Record<string,string>={Excellent:'#16a34a',Good:'#2563eb',Fair:'#d97706',Poor:'#dc2626'}
const SC:Record<string,string>={'Strong Positive':'badge-green','Strong':'badge-green','Moderate':'badge-blue','Weak':'badge-gray','Inverse Strong':'badge-red','Negative':'badge-red'}

export async function generateBrowserPdf(report:any,settings:any){
  const Plotly=(window as any).Plotly
  const today=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})
  const hColor=HC[report.health?.grade]||'#7c3aed'
  const meta=report.meta||{}
  const LL={paper_bgcolor:'#ffffff',plot_bgcolor:'#f8fafc',font:{color:'#1e293b',family:'Inter,sans-serif',size:11}}

  let chartImgs:string[]=[]
  let forecastImg=''
  if(Plotly&&report.charts?.length){
    chartImgs=await Promise.all((report.charts as any[]).slice(0,6).map((c:any)=>
      Plotly.toImage({data:c.data,layout:{...c.layout,...LL,width:860,height:380}},{format:'png',width:860,height:380}).catch(()=>'')
    ))
    chartImgs=chartImgs.filter(Boolean)
  }
  if(Plotly&&report.forecast){
    forecastImg=await Plotly.toImage({data:report.forecast.data,layout:{...report.forecast.layout,...LL,width:860,height:340}},{format:'png',width:860,height:340}).catch(()=>'')
  }

  const kfB=parseBlocks(report.narratives?.key_findings||'')
  const recB=parseBlocks(report.narratives?.recommendations||'')
  const anomB=parseBlocks(report.narratives?.anomaly_narrative||'')

  const chartGrid=chartImgs.length>0?`
    <div class="cgrid">
      ${chartImgs.slice(0,2).map((img,i)=>`<div class="cbox"><div class="clbl">Chart ${i+1}</div><img src="${img}"/></div>`).join('')}
    </div>
    ${chartImgs.slice(2,4).map((img,i)=>`<div class="cbox full" style="margin-top:12px"><div class="clbl">Chart ${i+3}</div><img src="${img}"/></div>`).join('')}
    <div class="cgrid" style="margin-top:12px">
      ${chartImgs.slice(4,6).map((img,i)=>`<div class="cbox"><div class="clbl">Chart ${i+5}</div><img src="${img}"/></div>`).join('')}
    </div>
    ${forecastImg?`<div class="cbox full" style="margin-top:12px"><div class="clbl">Trend Forecast — Linear Regression Projection</div><img src="${forecastImg}"/></div>`:''}`
  :'<p class="no-data">Charts were not captured for this export.</p>'

  const corrT=report.stats?.correlations?.length?`
    <h3 class="sub-h">Notable Correlations</h3>
    <table class="tbl"><thead><tr><th>Variable Pair</th><th>Pearson R</th><th>Strength</th><th>Confidence</th></tr></thead><tbody>
    ${(report.stats.correlations as any[]).map(c=>`<tr><td>${esc(c.col_a)} &amp; ${esc(c.col_b)}</td><td class="mono"><strong>${c.pearson_r}</strong></td><td><span class="badge ${SC[c.strength]||'badge-gray'}">${esc(c.strength)}</span></td><td>${c.confidence}%</td></tr>`).join('')}
    </tbody></table>`:''

  const statsT=report.stats?.key_stats?`
    <table class="tbl"><thead><tr><th>Column</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th><th>Skew</th><th>CV%</th><th>Missing</th></tr></thead><tbody>
    ${Object.entries(report.stats.key_stats).map(([col,s]:any)=>`<tr><td class="col-name">${esc(col)}</td><td class="mono">${s.mean}</td><td class="mono">${s.median}</td><td class="mono">${s.std}</td><td class="mono">${s.min}</td><td class="mono">${s.max}</td><td class="mono">${s.skew}</td><td class="mono">${s.cv}%</td><td class="mono">${s.missing_pct}%</td></tr>`).join('')}
    </tbody></table>`:'<p class="no-data">No statistical data available.</p>'

  const outlierT=report.anomalies?.outliers?.length?`
    <h3 class="sub-h" style="margin-top:24px">Outlier Detail Matrix</h3>
    <table class="tbl"><thead><tr><th>Column</th><th>Count</th><th>%</th><th>Lower Bound</th><th>Upper Bound</th><th>Data Max</th></tr></thead><tbody>
    ${(report.anomalies.outliers as any[]).map(o=>`<tr><td class="col-name">${esc(o.column)}</td><td class="mono">${o.count}</td><td class="mono">${o.pct}%</td><td class="mono">${o.lower}</td><td class="mono">${o.upper}</td><td class="mono">${o.data_max}</td></tr>`).join('')}
    </tbody></table>`:''

  const RH=(title:string)=>`<div class="rh"><div class="rh-l">DataMind AI &nbsp;·&nbsp; ${esc(title)}</div><div class="rh-r">${today} &nbsp;·&nbsp; Confidential</div></div>`
  const SEC=(n:string,t:string)=>`<div class="ey">Section ${n}</div><div class="st">${t}</div>`
  const CARD=(b:{title:string;body:string},i:number,cls:string,label:string)=>`
    <div class="card ${cls} nb">
      <div class="cnum">${label} ${String(i+1).padStart(2,'0')}</div>
      ${b.title?`<div class="ctitle">${esc(b.title)}</div>`:''}
      <div class="cbody">${esc(b.body)}</div>
    </div>`

  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${esc(settings.reportTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:10pt}
body{font-family:'Inter',sans-serif;color:#1e293b;background:#fff;line-height:1.7;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:20mm 18mm 22mm 18mm}
@media print{.np{display:none!important}.pb{page-break-before:always}}
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;background:linear-gradient(155deg,#0a0a18 0%,#110c28 55%,#080f14 100%);color:#fff;padding:52px 54px;position:relative;overflow:hidden}
.cover::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 75% 20%,rgba(124,58,237,.2) 0%,transparent 55%),radial-gradient(ellipse at 15% 85%,rgba(16,185,129,.09) 0%,transparent 50%)}
.ci{position:relative;z-index:1}
.cbadge{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(167,139,250,.4);background:rgba(124,58,237,.12);color:#a78bfa;padding:7px 18px;border-radius:999px;font-size:7pt;letter-spacing:2.5px;text-transform:uppercase;font-weight:600;margin-bottom:40px}
.ctitle{font-family:'Syne',sans-serif;font-size:40pt;font-weight:800;color:#fff;line-height:1.05;margin-bottom:14px;letter-spacing:-2px}
.csub{font-size:11pt;color:#94a3b8;margin-bottom:46px;font-weight:300}
.crule{width:56px;height:3px;background:linear-gradient(90deg,#7c3aed,#4338ca);border-radius:2px;margin-bottom:38px}
.cmeta{font-size:9pt;color:#64748b;line-height:2.2}
.cmeta strong{color:#cbd5e1;font-weight:500}
.hband{display:flex;align-items:center;gap:26px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:24px 30px;margin-top:46px}
.hscore{font-family:'Syne',sans-serif;font-size:44pt;font-weight:800;color:${hColor};line-height:1;flex-shrink:0}
.hgrade{font-size:7.5pt;color:#475569;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px}
.hdesc{font-size:9pt;color:#94a3b8;line-height:1.65;max-width:460px}
.kstrip{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:28px}
.kbox{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:11px;padding:16px 8px;text-align:center}
.kval{font-family:'Syne',sans-serif;font-size:16pt;font-weight:800;color:#f1f5f9}
.klbl{font-size:6pt;color:#475569;text-transform:uppercase;letter-spacing:1.2px;margin-top:5px}
.rh{display:flex;justify-content:space-between;align-items:center;padding-bottom:11px;border-bottom:1.5px solid #e2e8f0;margin-bottom:30px}
.rh-l{font-size:7.5pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:1.5px}
.rh-r{font-size:7.5pt;color:#94a3b8}
.rf{margin-top:48px;padding-top:11px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:7pt;color:#94a3b8}
.rf-logo{font-family:'Syne',sans-serif;font-weight:700;font-size:8pt;color:#7c3aed}
.ey{font-size:6.5pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-bottom:7px}
.st{font-family:'Syne',sans-serif;font-size:24pt;font-weight:800;color:#0f172a;margin-bottom:26px;padding-bottom:10px;border-bottom:3px solid #7c3aed;display:inline-block;letter-spacing:-.5px}
.sub-h{font-size:9.5pt;font-weight:600;color:#334155;text-transform:uppercase;letter-spacing:1.5px;margin:22px 0 10px;padding-bottom:6px;border-bottom:1px solid #f1f5f9}
.eq{background:#f8fafc;border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;padding:22px 28px;margin-bottom:14px}
.eq p{color:#334155;margin-bottom:12px;line-height:1.8}.eq p:last-child{margin-bottom:0}
.cgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;page-break-inside:avoid}
.cbox.full{grid-column:1/-1}
.clbl{font-size:8pt;font-weight:600;color:#475569;padding:9px 14px;border-bottom:1px solid #e2e8f0;background:#fff}
.cbox img{width:100%;display:block;object-fit:contain}
.no-data{color:#94a3b8;font-style:italic;padding:14px 0;font-size:9pt}
.cg{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:6px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:13px;padding:18px 20px;border-top:4px solid #7c3aed}
.card.green{border-top-color:#16a34a}.card.amber{border-top-color:#d97706}.card.red{border-top-color:#dc2626}.card.info{border-top-color:#0ea5e9}
.nb{page-break-inside:avoid}
.cnum{font-size:6.5pt;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px}
.card.green .cnum{color:#16a34a}.card.amber .cnum{color:#d97706}.card.red .cnum{color:#dc2626}
.ctitle{font-weight:700;font-size:10.5pt;color:#0f172a;margin-bottom:8px;line-height:1.3}
.cbody{font-size:9pt;color:#475569;line-height:1.75}
.tbl{width:100%;border-collapse:collapse;font-size:8.5pt;margin:10px 0 20px}
.tbl thead tr{background:#7c3aed}.tbl th{color:#fff;padding:9px 12px;text-align:left;font-size:7pt;text-transform:uppercase;letter-spacing:1px;font-weight:600}
.tbl td{padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:middle}
.tbl tr:nth-child(even) td{background:#f8fafc}.tbl tr:last-child td{border-bottom:none}
.mono{font-family:'JetBrains Mono',monospace;font-size:8pt}
.col-name{font-weight:600;color:#0f172a}
.badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.badge-green{background:#dcfce7;color:#15803d}.badge-blue{background:#dbeafe;color:#1d4ed8}
.badge-amber{background:#fef3c7;color:#b45309}.badge-red{background:#fee2e2;color:#b91c1c}.badge-gray{background:#f1f5f9;color:#64748b}
.pb-btn{position:fixed;bottom:28px;right:28px;z-index:9999;background:linear-gradient(135deg,#7c3aed,#4338ca);color:#fff;border:none;border-radius:12px;padding:14px 30px;font-size:11pt;font-weight:700;cursor:pointer;box-shadow:0 8px 28px rgba(124,58,237,.45);font-family:'Inter',sans-serif}
</style></head><body>
<button class="pb-btn np" onclick="window.print()">⬇&nbsp; Save as PDF</button>

<!-- COVER -->
<div class="cover"><div class="ci">
<div class="cbadge">◈ DataMind AI &nbsp;·&nbsp; Groq LLaMA 3.3 · 70B</div>
<div class="ctitle">${esc(settings.reportTitle)}</div>
<div class="csub">AI-Generated Business Intelligence Report</div>
<div class="crule"></div>
<div class="cmeta"><strong>${esc(settings.organisation)}</strong> &nbsp;·&nbsp; Prepared by <strong>${esc(settings.analyst)}</strong> &nbsp;·&nbsp; ${esc(settings.tone)} Tone<br/>Industry: <strong>${esc(settings.industry)}</strong> &nbsp;·&nbsp; ${today}</div>
<div class="hband">
  <div class="hscore">${report.health?.score??'--'}</div>
  <div><div class="hgrade">${esc(report.health?.grade)} — Data Health Score</div>
  <div class="hdesc">This dataset scored <strong>${report.health?.score}/100</strong> on our data health assessment, evaluating completeness, consistency, and structural quality.</div></div>
</div>
<div class="kstrip">
${[[meta.rows?.toLocaleString()??'--','Total Rows'],[meta.cols??'--','Columns'],[meta.numeric_cols??'--','Numeric'],[meta.cat_cols??'--','Categorical'],[(meta.missing_pct??0)+'%','Missing'],[meta.duplicate_rows??0,'Duplicates']].map(([v,l])=>`<div class="kbox"><div class="kval">${v}</div><div class="klbl">${l}</div></div>`).join('')}
</div>
</div></div>

<!-- S01 EXEC SUMMARY -->
<div class="pb"></div>
${RH(settings.reportTitle)}
${SEC('01','Executive Summary')}
<div class="eq">${mdToHtml(report.narratives?.exec_summary||'')}</div>

<!-- S02 KEY FINDINGS -->
<div class="pb"></div>
${RH(settings.reportTitle)}
${SEC('02','Key Findings')}
<div class="cg">${kfB.slice(0,6).map((b,i)=>CARD(b,i,'','Finding')).join('')}</div>
${corrT}

<!-- S03 CHARTS -->
<div class="pb"></div>
${RH(settings.reportTitle)}
${SEC('03','Charts &amp; Visualisations')}
${chartGrid}

<!-- S04 STATS -->
<div class="pb"></div>
${RH(settings.reportTitle)}
${SEC('04','Statistical Summary')}
${statsT}

<!-- S05 ANOMALIES -->
<div class="pb"></div>
${RH(settings.reportTitle)}
${SEC('05','Anomalies &amp; Data Quality')}
<div class="cg">${anomB.slice(0,6).map((b,i)=>{
  const lo=(b.title+b.body).toLowerCase()
  const cls=lo.includes('critical')||lo.includes('severe')?'red':lo.includes('outlier')||lo.includes('skew')||lo.includes('missing')?'amber':lo.includes('no duplicate')||lo.includes('no missing')?'green':'info'
  return CARD(b,i,cls,'Flag')
}).join('')}</div>
${outlierT}

<!-- S06 RECOMMENDATIONS -->
<div class="pb"></div>
${RH(settings.reportTitle)}
${SEC('06','Actionable Recommendations')}
<div class="cg">${recB.slice(0,6).map((b,i)=>CARD(b,i,'green','Action')).join('')}</div>

<div class="rf">
  <div class="rf-logo">◈ DataMind AI</div>
  <div>© ${new Date().getFullYear()} DataMind AI &nbsp;·&nbsp; AI-Generated Report &nbsp;·&nbsp; ${esc(settings.organisation)} &nbsp;·&nbsp; Confidential</div>
</div>
</body></html>`

  const win=window.open('','_blank','width=1000,height=780')
  if(!win){alert('Please allow popups to generate the PDF.');return}
  win.document.write(html)
  win.document.close()
}
