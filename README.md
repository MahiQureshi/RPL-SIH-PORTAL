# AI-Assisted Skill Assessment Tool for Recognition of Prior Learning (RPL)
**Smart India Hackathon (SIH) — National Full-Stack, Offline-Capable Platform**

---

## 1. Executive Summary & Objective

The **AI-Assisted Skill Assessment Tool for RPL** is an enterprise-grade, government-technology platform designed to support informal workers who possess years of practical trade experience but lack formal certification. 

The platform supports:
1. **Informal Experience Self-Declaration:** Captures tools used, tasks performed, and master-craftsman mentorship.
2. **AI-Assisted NCVET Qualification Matching:** Matches declared experience to verified National Occupational Standards (NOS) under the National Qualifications Register (NQR).
3. **Guided Practical Assessment:** Step-by-step practical task checklists with safety requirements (LOTO, PPE) and observable performance criteria.
4. **Standardized Rubric Scoring:** Criterion-level scoring (`COMPETENT`, `PARTIALLY_DEMONSTRATED`, `NOT_DEMONSTRATED`, `NOT_ASSESSED`) with photographic evidence linking.
5. **Human Assessor Review & Sign-Off:** Mandatory human-in-the-loop governance where authorized evaluators review competency profiles and sign off on certification recommendations.
6. **Inter-Assessor Consistency Analytics:** Live statistical evaluation computing **Exact Agreement %**, **Adjacent Agreement %**, and **Cohen's Kappa ($\kappa$)** across dual-assessor trials.
7. **Offline-First Resilience:** Client-side PWA and IndexedDB caching for uninterrupted field assessments with background queue reconciliation upon reconnection.

---

## 2. Target Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                              FRONTEND                                                   |
|  React 19 + Vite + Modern Vanilla CSS Token Design System + Lucide Icons + PWA / Service Worker         |
|  IndexedDB (Local Drafts, Sync Queue, Offline Rubric Cache) + Persistent Theme & Multilingual Support   |
+---------------------------------------------------+-----------------------------------------------------+
                                                    | REST API (JSON) + File Uploads (multipart/form-data)
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                           BACKEND API                                                   |
|  FastAPI (Python 3.14) Modular Monolith                                                                 |
|  - Auth & RBAC (Worker, Assessor, Admin) via JWT + BCrypt                                               |
|  - Declarations Engine & Versioning                                                                     |
|  - NSQF Qualification Library & Source Provenance                                                        |
|  - Semantic + Keyword Qualification Matching (Normalized Cosine Similarity & BM25 fallback)             |
|  - Assessment & Assignment Management (Coordinator -> Assessor -> Candidate)                            |
|  - Standardized Rubric Engine (Deterministic Scoring, Criterion-Level Evidence Linking)                  |
|  - Review & Certification Recommendation Sign-Off Workflow                                              |
|  - Inter-Assessor Agreement Analytics (Cohen's Kappa, Exact & Adjacent Agreement)                         |
|  - Audit Log & Sync Reconciliation Engine                                                               |
+---------------------------------------------------+-----------------------------------------------------+
                                                    | SQLAlchemy 2.0 (Async/Sync ORM)
                                                    v
+---------------------------------------------------------------------------------------------------------+
|                                           DATA & STORAGE                                                |
|  - Authoritative DB: SQLite (zero-friction local development) / PostgreSQL (production-ready)            |
|  - Object Storage: Secure Local Evidence Adapter (`/storage/evidence/*`) with access authorization      |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Verified NCVET RPL Qualification Packs (Public Standards)

The platform is seeded with official qualifications from the National Qualifications Register:

| QP Code | Title | NSQF Level | Awarding Body | Core NOS Units Mapped |
|---|---|---|---|---|
| **CON/Q0601** | **General Electrician** | **Level 4** | **CSDCI / NCVET** | `CON/N0601`, `CON/N0602`, `CON/N0603`, `CON/N0605` |
| **ELE/Q3102** | Field Technician - Home Appliances | Level 4 | ESSCI / NCVET | Appliance diagnostics, motor repair, LOTO safety |
| **ASC/Q1402** | Automotive Service Technician | Level 4 | ASDC / NCVET | Brake servicing, electrical diagnostics, engine tuning |
| **CON/Q0102** | Mason General | Level 4 | CSDCI / NCVET | Brickwork, plastering, plumb-line alignment, mortar mix |

---

## 4. Pre-Configured Demo Accounts (For SIH Evaluators)

Evaluators can log in using either standard credentials or the **1-Click Quick Role Switcher** on the header:

| Persona | Role | Email | Password | Preloaded Context |
|---|---|---|---|---|
| **Ramesh Kumar** | **Candidate (Worker)** | `worker@rpl.gov.in` | `Worker@123` | 6.5 yrs practical domestic electrical experience |
| **Sita Devi** | **Candidate (Worker)** | `worker2@rpl.gov.in` | `Worker@123` | 4.0 yrs home appliance servicing experience |
| **Priya Sharma** | **Assessor (Evaluator)** | `assessor@rpl.gov.in` | `Assessor@123` | Lead Technical Evaluator (CSDCI Certified #AS-2024-8841) |
| **Rajesh Varma** | **Assessor (Evaluator)** | `assessor2@rpl.gov.in` | `Assessor@123` | Senior Field Evaluator (CSDCI Certified #AS-2023-4109) |
| **Sanjay Gupta** | **Admin / Coordinator** | `admin@rpl.gov.in` | `Admin@123` | National RPL Quality Coordinator |

---

## 5. Quick Installation & Startup Guide

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- Python `3.10+` or `3.12+` or `3.14+`

### Step 1: Clone or Navigate to Directory
```powershell
cd "c:\Users\Mahi\Desktop\RPL SIH"
```

### Step 2: Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
.\venv\Scripts\python -m app.db.seed
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Step 3: Frontend Setup
In a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 6. End-to-End Test Execution

To verify the complete 10-stage pipeline:
```powershell
cd backend
.\venv\Scripts\python tests/test_e2e_workflows.py
```
**Results:** `ALL 10 END-TO-END ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!`

---

## 7. How to Demonstrate to SIH Hackathon Judges

1. **Public Landing Page (`/`):**
   - Point out the national government-tech visual aesthetics (#38BDF8 Sky Blue, #0B1220 Deep Navy, #D4A72C Muted Gold).
   - Demonstrate the **Theme Toggle** (Light / Dark mode) and **Language Selector** (English, Hindi, Marathi, Bengali, Tamil).
   - Highlight the **Real-Time Online/Offline Indicator**.

2. **Worker Experience Declaration & AI Qualification Matching:**
   - Click the **Worker** demo button (logs in as Ramesh Kumar).
   - Open **Skill Declaration**: show declared tools (Megger, Multimeter, Conduit Bender) and years of experience.
   - Click **View AI Matches**: show the AI matching engine recommending `CON/Q0601 General Electrician (NSQF Level 4)` with 53.2% relevance, explainable alignment bullets, and mapped NOS units.
   - Confirm qualification track.

3. **Assessor Guided Practical Assessment:**
   - Click the **Assessor** demo button on the header (logs in as Priya Sharma).
   - Open candidate Ramesh Kumar's assessment.
   - Walk through the **Guided Practical Tasks** (Safety LOTO setup, Conduit bending, Megger insulation test).
   - Demonstrate the **Standardized Rubric buttons** (`COMPETENT`, `PARTIALLY_DEMONSTRATED`, `NOT_DEMONSTRATED`).
   - Show the **AI Assistance Panel** with image quality observations and note suggestions.

4. **Human Review & Certification Sign-Off:**
   - Click **Review & Sign-Off**.
   - Show the criterion-by-criterion performance breakdown table.
   - Authorize recommendation as `RECOMMENDED_FOR_CERTIFICATION` and click **Execute Official Sign-Off** (triggers confetti animation!).

5. **Competency Profile & Official Printable Dossier:**
   - Click **Open Official Competency Report**.
   - Show the evidence-linked dossier and test the **Print / Export PDF** button.

6. **Admin Command & Inter-Assessor Reliability:**
   - Click the **Admin** demo button (logs in as Sanjay Gupta).
   - Open **Assessor Consistency**: show **Cohen's Kappa = 0.795 (Substantial Agreement)**, **91.7% Exact Agreement**, and the live Dual-Assessor Confusion Matrix.
   - Open **Assignment Manager** to schedule new candidate evaluations.
   - Open **Audit Trail** to show the immutable log of all actions.
   - Open **Offline Sync Center** to show IndexedDB cache management.

---

## 8. 1-Click Online Cloud Deployment (Single Working Prototype Link)

The project includes a multi-stage [Dockerfile](file:///c:/Users/Mahi/Desktop/RPL%20SIH/Dockerfile) and [render.yaml](file:///c:/Users/Mahi/Desktop/RPL%20SIH/render.yaml) blueprint that packages the React frontend and FastAPI backend into a **single, unified service** with automatic SQLite data seeding.

### 1-Click Instant Cloud Deployment
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/MahiQureshi/RPL-SIH-PORTAL)

Click the button above or visit:
👉 **https://render.com/deploy?repo=https://github.com/MahiQureshi/RPL-SIH-PORTAL**

### Option A: Render Dashboard (Manual Free Web Service)
1. Repository is live on GitHub: **[github.com/MahiQureshi/RPL-SIH-PORTAL](https://github.com/MahiQureshi/RPL-SIH-PORTAL)**
2. Go to [Render Dashboard](https://dashboard.render.com/) and sign in with GitHub.
3. Click **New +** > **Web Service**.
4. Select `MahiQureshi/RPL-SIH-PORTAL`.
5. Render auto-detects `Dockerfile` and `render.yaml`. Click **Deploy Web Service**.
6. In ~2 minutes, your live prototype link (e.g. `https://rpl-sih-assessment-portal.onrender.com`) will be active.

### Option B: Railway (Alternative 1-Click)
1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** > **Deploy from GitHub repo** > select `MahiQureshi/RPL-SIH-PORTAL`.
3. Railway automatically builds the container and provides a public HTTPS link under **Settings > Networking**.

### Features of the Unified Deployment:
- **Zero CORS Issues:** Frontend SPA and `/api` are served from the same domain.
- **Auto-Seeded Demo Database:** Ramesh Kumar (Worker), Priya Sharma (Assessor), Sanjay Gupta (Admin), and all NCVET qualification packs work out of the box immediately on cold start.
- **Client-Side SPA Routing:** Direct navigation to `/worker`, `/assessor`, and `/admin` works seamlessly.


