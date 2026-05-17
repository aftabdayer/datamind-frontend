# 🧠 DataMind AI — Frontend (Next.js)

> **Self-serve BI report generator** — upload any CSV or Excel file and get AI-written analysis, interactive charts, forecasts, and a downloadable PDF report in under 60 seconds.

👉 **[Live App](https://datamind-ai-frontend.vercel.app/)** &nbsp;|&nbsp; ⚙️ **[Backend Repo](https://github.com/aftabdayer/datamind-backend)**

---

## What It Does

DataMind AI eliminates the gap between raw data and business decisions. Any non-technical user can upload a spreadsheet and walk away with a professional BI report — no SQL, no Python, no waiting for an analyst.

| Feature | Details |
|---------|---------|
| 📊 **Auto Charts** | Trend, distribution, correlation heatmap, scatter, violin — built automatically from your data |
| 🤖 **AI Analysis** | Executive summary, key findings, and recommendations via Groq LLM |
| 📈 **Trend Forecast** | Linear regression forecast with future projection |
| ⚠️ **Data Quality Score** | Flags outliers, skewness, and missing values before you interpret results |
| 📄 **PDF Export** | Full professional report bundling all charts, forecasts, and AI findings |
| 💬 **Chat With Data** | Ask follow-up questions about your dataset in natural language |

**Report turnaround: hours → under 60 seconds.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js · TypeScript · Tailwind CSS |
| Backend | FastAPI · Python · Plotly · ReportLab |
| AI | Groq API · LLaMA3 |
| Deployment | Vercel (frontend) · Render (backend) |

---

## Architecture

```
datamind-frontend/           ← This repo (Next.js + TypeScript)
datamind-backend/            ← FastAPI + analysis engine + PDF generator
    ├── main.py              ← API routes
    ├── data_analyzer.py     ← Statistical analysis + data quality scoring
    └── report_generator.py  ← ReportLab PDF builder
```

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/aftabdayer/datamind-frontend.git
cd datamind-frontend

# 2. Install dependencies
npm install

# 3. Set environment variable
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 4. Run dev server
npm run dev
```

For the backend, see → [datamind-backend](https://github.com/aftabdayer/datamind-backend)

---

## Origin

> This is the full-stack Next.js + FastAPI version of DataMind AI.  
> The original Streamlit prototype is preserved at [datamind-ai](https://github.com/aftabdayer/datamind-ai) — it shows the evolution from a single-file prototype to a production full-stack app.

---

## Author

**Aftab Dayer** · [LinkedIn](https://linkedin.com/in/aftabdayer) · [GitHub](https://github.com/aftabdayer)  
NIT Hamirpur 2025 · IEEE Published · Microsoft Power BI Certified (PL-300)
