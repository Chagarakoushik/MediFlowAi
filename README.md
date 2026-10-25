# CareFlow AI — Smart Healthcare Follow-up Assistant

[![React](https://img.shields.io/badge/React-19.x-blue.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python)](https://python.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-SQLAlchemy-003B57.svg?logo=sqlite)](https://sqlite.org/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-8E75B2.svg?logo=google)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **AI Growth & Automation Associate Technical Assessment Project**  
> *Enterprise-grade full-stack healthcare communications and follow-up management platform with defensive prompt engineering, human-in-the-loop review, and n8n webhook automation.*

---

## 🏥 Problem Statement & Solution

In outpatient healthcare, poor follow-up communication directly causes:
- **Preventable readmissions** from ignored surgical site infections or medication titration errors.
- **High clinic no-show rates (15–30%)**, costing medical centers thousands per provider daily.
- **Patient dissatisfaction** from generic, impersonal, or confusing discharge reminders.

**CareFlow AI** solves this by generating personalized, empathetic, multi-channel appointment follow-up reminders using **Google Gemini AI**, while enforcing **ironclad clinical safety boundaries**:
1. **Never provides medical diagnoses** or contradicts attending physicians.
2. **Never modifies pharmaceutical dosages** or prescribes off-label treatments.
3. **Escalates acute red-flag symptoms** (chest pain, dyspnea, post-op fever >101°F) to **Emergency 911 / ER triage**.
4. **Mandates licensed human review** before any communication can be dispatched.

---

## ⚡ Core Features

- **Executive Healthcare Dashboard:** Real-time KPI cards, interactive 7-day capacity trend chart, specialty distribution, delivery channel breakdown, and priority review queue.
- **Appointments & Patients Directory:** Complete CRUD operations, multi-parameter search (patient name, phone, doctor, clinical notes), and filtering by specialty, risk level, and review status.
- **AI Reminder Studio:** Channel-specific generation for **SMS, WhatsApp, Email, and Phone Scripts** in English, Spanish, French, and Hindi. Includes real-time AI safety audits and live mobile mockups.
- **Prompt Engineering Lab:** Side-by-side benchmark comparison between **Basic, Improved, and Safety-Aware prompts** on identical clinical stress cases, complete with latency, character counts, and adherence scores.
- **Outbound Automation & n8n Integration:** Dispatch approved reminders to an n8n webhook pipeline with mock simulation mode, live execution audit logs, and an interactive JSON payload inspector.
- **Zero-Config Demo Mode:** Runs seamlessly out of the box without requiring a paid Gemini API key. Clearly distinguishes simulated outputs from live AI responses.
- **Fictional Patient Sandbox:** 100% fictional patient cohorts spanning Cardiology, Endocrinology, Orthopedics, Pediatrics, Neurology, Pulmonology, and General Surgery.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS Design System, Lucide React Icons |
| **Backend** | FastAPI, Python 3.12, Pydantic v2, Uvicorn, httpx, python-dotenv |
| **Database** | SQLite with SQLAlchemy ORM (auto-seeds realistic fictional data on start) |
| **AI Engine** | Google Gemini API (`gemini-1.5-flash`) + CareFlow Simulated Clinical Engine |
| **Automation** | n8n Webhook Integration, JSON payload dispatcher, and execution logger |
| **Deployment** | Vercel (Frontend SPA) + Render (FastAPI Web Service) |

---

## 📂 Project Architecture

```
MediFlow/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app, lifespan seeder, CORS
│   │   ├── config.py                  # Environment settings & Gemini key verification
│   │   ├── database.py                # SQLAlchemy engine & SQLite session
│   │   ├── models.py                  # Appointments, AutomationLogs, PromptLabTests
│   │   ├── schemas.py                 # Pydantic validation & response schemas
│   │   ├── crud.py                    # Filtered queries & dashboard aggregations
│   │   ├── seed_data.py               # Fictional clinical dataset & benchmark test cases
│   │   ├── services/
│   │   │   ├── gemini_service.py      # Live Gemini API + Simulated fallback & safety audit
│   │   │   ├── prompt_lab_service.py  # 3-tier prompt evaluation engine
│   │   │   └── automation_service.py  # n8n webhook dispatcher & mock simulator
│   │   └── routes/
│   │       ├── appointments.py        # CRUD, multi-filter search, seed reset
│   │       ├── reminders.py           # Generate reminder, staff review, dispatch
│   │       ├── prompt_lab.py          # Benchmark test cases & 3-tier comparisons
│   │       ├── automation.py          # Webhook ping, batch dispatch, audit logs
│   │       └── stats.py               # Dashboard KPI metrics & 7-day trend
│   ├── requirements.txt               # Backend dependencies
│   ├── .env.example                   # Environment configuration template
│   ├── run.py                         # Local backend server runner
│   ├── test_backend.py                # Comprehensive automated backend test suite
│   └── Procfile                       # Render deployment process declaration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/                # Sidebar, Header, SafetyBanner
│   │   │   ├── Dashboard/             # StatCards, 7-Day Trend Chart, Priority Queue
│   │   │   ├── Appointments/          # Patient Table, Filters, Add/Edit Modals
│   │   │   ├── ReminderStudio/        # Multi-channel preview, Safety Audit, Staff Sign-off
│   │   │   ├── PromptLab/             # 3-Tier Side-by-Side Prompt Comparison View
│   │   │   ├── Automation/            # n8n Webhook Config, Logs, Payload Inspector
│   │   │   └── Common/                # Floating Toast Notifications
│   │   ├── context/
│   │   │   └── AppContext.tsx         # Global state, active tab, toast queue
│   │   ├── services/
│   │   │   └── api.ts                 # Full backend REST client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── App.tsx                    # Main component assembler
│   │   ├── index.css                  # Custom healthcare design system
│   │   └── main.tsx                   # React root entrypoint
│   ├── package.json                   # Frontend npm dependencies
│   ├── tsconfig.json                  # TypeScript compiler settings
│   ├── vite.config.ts                 # Vite server & API proxy config
│   ├── index.html                     # HTML root with Plus Jakarta Sans font
│   └── vercel.json                    # Vercel SPA rewrite config
├── automation/
│   └── n8n_careflow_workflow.json      # Complete importable n8n workflow template
├── docs/
│   ├── PROMPT_DOCUMENTATION.md        # Comprehensive 3-tier prompt evaluation report
│   ├── PRESENTATION_SCRIPT.md         # 2–3 minute video presentation script
│   └── DEPLOYMENT_GUIDE.md            # Step-by-step Vercel and Render instructions
├── render.yaml                        # Render blueprint configuration
├── vercel.json                        # Root Vercel SPA configuration
├── .gitignore                         # Git exclusion rules
└── README.md                          # Main project documentation
```

---

## 🚀 Quick Start Guide (Local Setup)

### Prerequisites
- **Node.js** (v18+ or v22+) & `npm`
- **Python** (v3.10+ or v3.12+)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/careflow-ai.git
cd careflow-ai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set up your Gemini API Key in .env
# If left blank, CareFlow AI operates automatically in Demo / Simulated Mode!
cp .env.example .env

# Run automated backend test suite
python test_backend.py

# Launch FastAPI development server
python run.py
```
> The backend server starts at **`http://localhost:8000`**.  
> Interactive Swagger API docs are available at **`http://localhost:8000/docs`**.

---

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
> The frontend application starts at **`http://localhost:5173`**.

---

## 🧪 Automated Testing & Verification

CareFlow AI includes an automated backend test suite that verifies all 8 core subsystems:
```bash
cd backend
python test_backend.py
```
**Test Results:**
- `[PASS]` Database initialization and fictional cohort seeding (8 patients)
- `[PASS]` Multi-parameter search & department filtering
- `[PASS]` Safety audit intercepting dangerous unauthorized prescriptions
- `[PASS]` Simulated AI Reminder generation with proper formatting
- `[PASS]` Human-in-the-loop staff review sign-off requirement
- `[PASS]` Automation webhook simulation and audit logging
- `[PASS]` Prompt Lab 3-tier comparison with 98% safety score
- `[PASS]` Executive dashboard KPI and trend calculations

To test production frontend compilation:
```bash
cd frontend
npm run build
```

---

## 🔒 Clinical Safety & Human-in-the-Loop Architecture

```
[Patient Data & Instructions]
             ↓
[Gemini AI / Simulated Engine]
             ↓
[CareFlow Safety Audit Guardrail]
  • Check: Direct Diagnosis Attempts? (Blocked)
  • Check: Medication Dosage Tampering? (Blocked)
  • Check: Emergency Red Flags (Chest Pain, Fever >101°F)? (Forces 911 / ER alert)
             ↓
[Mandatory Licensed Staff Review]
  • Nurse / Care Coordinator inspects & edits draft
  • Logs audit remarks & signs with clinical credentials
  • Approves draft
             ↓
[n8n Automation Webhook Queue]
  • Dispatches via Twilio SMS, WhatsApp Business, or SendGrid Email
```

---

## 📊 Documentation Directory

- **[Prompt Engineering Documentation](docs/PROMPT_DOCUMENTATION.md):** In-depth technical analysis comparing Basic, Improved, and Safety-Aware prompts across 4 clinical benchmark cases, failure modes, and lessons learned.
- **[Video Presentation Script](docs/PRESENTATION_SCRIPT.md):** 2.5-minute presentation script with visual timing cues for video submission.
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md):** Detailed step-by-step instructions for deploying to Vercel and Render.
- **[n8n Demo Workflow](automation/n8n_careflow_workflow.json):** Importable workflow definition for n8n.

---

## 🚢 Publishing to GitHub

To publish this project to your GitHub profile:
```bash
git init
git add .
git commit -m "feat: initial commit of CareFlow AI full-stack application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/careflow-ai.git
git push -u origin main
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
