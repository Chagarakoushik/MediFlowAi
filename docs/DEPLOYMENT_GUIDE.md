# CareFlow AI — Deployment Guide (Vercel & Render)

This guide provides step-by-step instructions for deploying **CareFlow AI** to production:
- **Backend (FastAPI + SQLite + Gemini):** Deployed to [Render](https://render.com) (Free Tier)
- **Frontend (React + Vite + TypeScript):** Deployed to [Vercel](https://vercel.com) (Free Tier)

---

## 1. Backend Deployment on Render

### Method A: Using `render.yaml` Blueprint (Recommended)
1. Fork or push the `MediFlow` repository to your GitHub account.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` in the root of the repository.
6. Under **Environment Variables**:
   - `GEMINI_API_KEY`: (Optional) Paste your Google Gemini API key from [Google AI Studio](https://aistudio.google.com/). If omitted, CareFlow AI operates automatically in Demo / Simulated Mode.
7. Click **Apply Blueprint**. Render will build the environment and launch your service.
8. Note your public backend URL (e.g., `https://careflow-ai-backend.onrender.com`).

### Method B: Manual Web Service Setup
* **Name:** `careflow-ai-backend`
* **Root Directory:** `backend`
* **Runtime:** `Python 3`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
* **Health Check Path:** `/health`
* **Environment Variables:**
  - `ENV`: `production`
  - `DEBUG`: `False`
  - `DATABASE_URL`: `sqlite:///./careflow.db`
  - `GEMINI_API_KEY`: `your_key_here` (optional)
  - `GEMINI_MODEL`: `gemini-1.5-flash`
  - `SIMULATION_MODE_DEFAULT`: `True`

---

## 2. Frontend Deployment on Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your `MediFlow` GitHub repository.
4. In **Project Configuration**:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click `Edit` and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables**:
   - If hosting backend on Render, add:
     - `VITE_API_URL`: `https://careflow-ai-backend.onrender.com`
6. Click **Deploy**. Vercel will build the React SPA and provide a live URL (e.g., `https://careflow-ai.vercel.app`).

---

## 3. n8n Automation Setup (Optional)

1. Open your self-hosted or cloud [n8n instance](https://n8n.io).
2. Click **Add Workflow** → **Import from File...**
3. Select `/automation/n8n_careflow_workflow.json`.
4. The workflow includes:
   - **Webhook Node:** Inbound trigger for approved follow-up payloads
   - **Validation Node:** Enforces staff review sign-off
   - **Channel Switch:** Routes dynamically to Twilio (SMS), WhatsApp Business, or SendGrid (Email)
   - **Slack Triage Desk Alert:** Sends real-time team alerts for high-risk cases
5. Copy the production webhook URL and paste it into the **Automation & n8n** page of CareFlow AI.
