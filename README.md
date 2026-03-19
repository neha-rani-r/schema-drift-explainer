# Schema Drift Explainer

> Month 2 of 12 — DataForge Series by [Neha Rani](https://www.linkedin.com/in/neha-rani-r/)

Paste two schemas (JSON Schema / Apache Avro / SQL DDL). Get an AI-powered breakdown of every drift — what changed, severity level, why it matters downstream, and exactly how to fix it.

**Live demo:** https://neha-rani-r.github.io/schema-drift-explainer

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React + TypeScript + Vite | Free |
| Hosting | GitHub Pages | Free |
| CI/CD | GitHub Actions | Free |
| AI Proxy | Cloudflare Workers | Free (100k req/day) |
| AI Model | Groq — Llama 3.3 70B | Free tier |

**Total cost: $0/month**

---

## Deployment Guide

### Step 1 — Fork & clone

```bash
git clone https://github.com/neha-rani-r/schema-drift-explainer.git
cd schema-drift-explainer
npm install
```

### Step 2 — Deploy the Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create**
2. Choose **Create Worker** → name it `schema-drift-proxy`
3. Click **Edit Code**, paste the contents of `worker.js`, click **Deploy**
4. Go to **Settings** → **Variables** → add:
   - Variable name: `GROQ_API_KEY`
   - Value: your key from [console.groq.com](https://console.groq.com)
5. Note your Worker URL: `https://schema-drift-proxy.YOUR_SUBDOMAIN.workers.dev`

> ⚠️ Never use `wrangler` CLI — it detects the React app and overwrites the Worker.

### Step 3 — Add GitHub secret

In your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

- Name: `VITE_WORKER_URL`
- Value: `https://schema-drift-proxy.YOUR_SUBDOMAIN.workers.dev`

### Step 4 — Enable GitHub Pages

Go to **Settings** → **Pages**:
- Source: **GitHub Actions**
- Save

### Step 5 — Push to deploy

```bash
git add .
git commit -m "feat: schema drift explainer"
git push origin main
```

GitHub Actions will build and deploy automatically. Your app will be live at:
`https://neha-rani-r.github.io/schema-drift-explainer`

### Local development

```bash
cp .env.example .env.local
# Edit .env.local with your Worker URL
npm run dev
```

---

## Features

- **Schema formats:** JSON Schema, Apache Avro, SQL DDL (auto-detected)
- **Severity classification:** Breaking / Warning / Safe / Info
- **Drift details:** field-level diff, downstream impact, migration fix
- **Filter by severity** — focus on breaking changes first
- **Export as Markdown** — paste into ADRs, PRs, or runbooks
- **3 built-in samples** — try without pasting anything

---

## Part of DataForge Series

| Month | App | Status |
|---|---|---|
| 1 | DataForge.ai — DE Artifact Generator | ✅ Live |
| 2 | Schema Drift Explainer | ✅ Live |
| 3–12 | Coming monthly | 🔜 |

---

_Built with React, Groq, and Cloudflare Workers. Zero cloud spend._
