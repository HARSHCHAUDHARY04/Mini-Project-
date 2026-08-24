# ClaimAssist AI

**AI-assisted claim denial analysis, policy retrieval, clinical evidence matching, and appeal drafting — in one workflow.**

> ⚠️ **Educational prototype.** Uses synthetic/demo patient and insurance data only. Does not connect
> to real EHRs or insurance systems. Does not provide legal or medical advice. Every generated
> appeal is labeled **AI-GENERATED DRAFT — REQUIRES HUMAN REVIEW**. Do not upload real patient
> information.

---

## 1. Project Overview

ClaimAssist AI demonstrates how AI can help healthcare billing teams turn a denied insurance claim
into an evidence-backed appeal. The core workflow:

```
CLAIM → DENIAL ANALYSIS → POLICY RAG → CLINICAL EVIDENCE → REQUIREMENT MATCHING → APPEAL GENERATION → PDF PACKET
```

A billing admin uploads (or loads the bundled demo) a denied claim/EOB, an insurance policy, and
patient clinical notes. The AI service extracts structured data from all three, retrieves the
relevant policy sections via a real RAG pipeline, matches policy requirements against clinical
evidence, computes an explainable appealability score, and drafts a fully cited appeal letter that
a reviewer approves/rejects and can download as a PDF packet.

## 2. Features

- **Claim parsing** — PDF/TXT/CSV/JSON upload with regex-based structured field extraction and a
  manual-correction path when extraction confidence is low.
- **Denial code analysis** — a small demo CARC/RARC-style dictionary (CO-16, CO-18, CO-29, CO-45,
  CO-50, CO-96, CO-97, PR-1, PR-2) with graceful handling of unknown codes.
- **Policy library + real RAG** — PDF/TXT policies are chunked (respecting section/page structure),
  embedded with Sentence-Transformers, and indexed in FAISS by default (or Qdrant Cloud, if
  configured). Retrieval returns citation-ready
  results (`section`, `page`, `relevance`).
- **Clinical evidence extraction** — structured, source-tracked evidence (duration, conservative
  treatment, treatment failure, physician recommendation) pulled deterministically from clinical
  notes so nothing is hallucinated.
- **Requirement matching** — every policy requirement is matched against evidence as
  `MATCH` / `PARTIAL` / `NOT_FOUND` / `CONFLICT` with a confidence score. Missing evidence is never
  auto-marked as satisfied.
- **Explainable appealability score (0–100)** — a weighted, auditable breakdown (policy
  satisfaction, clinical evidence strength, documentation completeness, denial specificity) with a
  disclaimer that it is **not** an approval probability.
- **Evidence-grounded appeal generation** — the letter is assembled from verified evidence with
  inline citations; unmatched requirements explicitly say *"Documentation not found in the provided
  records."* Swappable LLM backend (deterministic mock by default; Google Gemini or Anthropic
  Claude optional).
- **Appeal Review screen** — split-screen review with Regenerate / Edit / Approve / Reject /
  Download PDF.
- **Appeal Packet PDF** — a professional, multi-section PDF (claim summary → denial analysis →
  policy requirements → clinical evidence → generated appeal → evidence & citations).
- **Dashboard & Analytics** — claims/denials/appeals/recovery stats with Recharts visualizations.
- **Demo Mode** — a "Load Demo Case" button that populates the full workflow with a synthetic MRI
  medical-necessity claim so you can demo everything without uploading files.

## 3. Architecture

```
React (Vite + Tailwind)
        |
        v
Node.js / Express API  ---- MongoDB
        |
        v
Python FastAPI AI Service
   ├── Claim Parser
   ├── Document Processor (PyMuPDF)
   ├── Policy Indexer + RAG Engine (Sentence-Transformers + FAISS/Qdrant)
   ├── Clinical Evidence Extractor
   ├── Requirement Extractor + Matcher
   ├── Appealability Scorer
   ├── Appeal Generator (LLM provider abstraction: mock | gemini | anthropic)
   └── PDF Packet Generator (ReportLab)
```

The Node backend owns auth, users, claims, appeals, dashboard analytics, and file metadata, and
orchestrates calls to the Python AI service. The Python service owns all document processing, RAG,
extraction, matching, scoring, and generation logic, and never lets the LLM invent policy sections,
clinical facts, or citations — it only formats evidence that was already retrieved/extracted
upstream.

## 4. Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Recharts, Axios |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT auth |
| AI Service | Python, FastAPI, LangChain-style modular services, Sentence-Transformers, FAISS/Qdrant |
| Document processing | PyMuPDF, pandas |
| PDF generation | ReportLab |

## 5. Project Structure

```
claimassist-ai/
├── client/            React frontend
├── server/             Node/Express backend
├── ai-service/         Python FastAPI AI service
└── data/demo/           Synthetic demo fixtures (claim, policy, clinical notes)
```

## 6. Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB running locally (or a MongoDB Atlas URI)

### 6.1 Clone & install

```bash
# Backend
cd server
npm install
cp .env.example .env   # edit MONGO_URI / JWT_SECRET if needed

# AI service
cd ../ai-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Frontend
cd ../client
npm install
cp .env.example .env
```

> **Note:** `sentence-transformers` will download the `all-MiniLM-L6-v2` model (~80MB) on first
> use. `faiss-cpu` and `sentence-transformers` are the heaviest installs — this is expected.

### 6.2 Environment Variables

**`server/.env`**
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/claimassist
JWT_SECRET=replace-this-with-a-long-random-string
AI_SERVICE_URL=http://127.0.0.1:8000
CLIENT_ORIGIN=http://localhost:5173
```

**`ai-service/.env`**
```
LLM_PROVIDER=gemini      # or "anthropic" or "mock"
LLM_API_KEY=              # your Gemini API key (get one at https://aistudio.google.com/apikey)
LLM_MODEL=gemini-2.5-flash

EMBEDDING_MODEL=all-MiniLM-L6-v2

VECTOR_STORE=faiss        # or "qdrant" for a hosted Qdrant Cloud cluster
VECTOR_INDEX_DIR=./storage/indexes

# Only used when VECTOR_STORE=qdrant (get these from cloud.qdrant.io):
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=claimassist_policy_chunks
QDRANT_VECTOR_SIZE=384

PACKET_OUTPUT_DIR=./storage/packets
```

The appeal letter is always assembled first from verified, evidence-grounded text (see
`ai-service/app/generation/appeal_generator.py`) — the LLM is only ever asked to polish grammar
and phrasing of that already-correct draft under a system instruction that forbids adding any new
fact, policy section, or citation. This holds regardless of which provider you use.

**Never commit real API keys.** Put them only in your local `.env` files (already gitignored).

**`client/.env`**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Never hardcode API keys or commit `.env` files.

## 7. Running Locally

Open three terminals:

```bash
# Terminal 1 — AI service
cd ai-service
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Backend
cd server
npm run seed     # creates demo admin/reviewer accounts (run once)
npm run dev

# Terminal 3 — Frontend
cd client
npm run dev
```

Visit **http://localhost:5173**.

### Demo login
```
admin@claimassist.demo / Demo1234!      (Admin / Billing Staff)
reviewer@claimassist.demo / Demo1234!   (Reviewer)
```

## 8. Demo Workflow

1. Log in.
2. On the Dashboard, click **Load Demo Case**.
3. You'll land on claim `CLM-2026-001` (CO-50 — Medical Necessity, MRI Lumbar Spine).
4. Click **Analyze Claim** — this indexes the bundled synthetic ABC Health MRI policy, retrieves
   the relevant sections via RAG, extracts clinical evidence, matches requirements, and computes
   the appealability score.
5. Explore the **Denial Analysis**, **Policy Evidence**, **Clinical Evidence**, and **AI Analysis**
   tabs.
6. Click **Generate Appeal** to draft a cited appeal letter.
7. On the **Appeal Review** screen: review, edit if needed, **Approve** or **Reject**, then
   **Download PDF** for the full appeal packet.

## 9. API Documentation

### Node/Express (`/api`)
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in, returns JWT |
| GET | `/auth/me` | Current user |
| POST | `/claims/demo` | Load the synthetic demo case |
| POST | `/claims/upload` | Upload + parse a claim/EOB file |
| POST | `/claims` | Create a claim |
| GET | `/claims` | List claims |
| GET | `/claims/:id` | Get a claim |
| PUT | `/claims/:id` | Update a claim |
| DELETE | `/claims/:id` | Delete a claim |
| POST | `/claims/:id/analyze` | Run the full AI pipeline |
| GET | `/claims/:id/analysis` | Get stored analysis |
| POST | `/claims/:id/generate-appeal` | Generate the appeal letter |
| POST | `/policies/upload` | Upload a policy document |
| POST | `/policies/index-text` | Index a policy from raw text (used by demo mode) |
| POST | `/policies/:id/index` | Index an uploaded policy file |
| GET | `/policies` | List policies |
| POST | `/clinical-documents/upload` | Upload a clinical document |
| GET | `/clinical-documents` | List clinical documents |
| POST | `/rag/search` | Direct RAG policy search |
| GET | `/appeals` | List appeals |
| GET | `/appeals/:id` | Get an appeal |
| PUT | `/appeals/:id` | Edit appeal content |
| POST | `/appeals/:id/approve` | Approve/reject an appeal |
| GET | `/appeals/:id/pdf` | Download the appeal packet PDF |
| GET | `/dashboard/stats` | Dashboard/analytics stats |

### Python AI Service (`/ai`)
`POST /parse-claim` · `POST /extract-clinical-evidence` · `POST /index-policy` ·
`POST /retrieve-policy` · `POST /extract-requirements` · `POST /match-evidence` ·
`POST /score-appealability` · `POST /generate-appeal` · `POST /generate-packet` ·
`GET /denial-codes/{code}`

Interactive docs available at `http://localhost:8000/docs` while the AI service is running.

## 10. Database Schema (MongoDB)

`User`, `Patient`, `Claim`, `Policy`, `PolicyChunk`, `ClinicalDocument`, `Analysis`, `Evidence`,
`Appeal` — see `server/src/models/`.

## 11. Project Limitations

- Uses only synthetic/demo data; not connected to any real EHR, clearinghouse, or payer system.
- Claim/clinical extraction is regex/rule-based rather than a full NLP pipeline — reliable for the
  structured demo documents, less so for arbitrary real-world formats.
- The default LLM provider is a deterministic mock (no external API calls); set
  `LLM_PROVIDER=gemini` with a `LLM_API_KEY` to have Google Gemini polish the already
  evidence-grounded draft, or `LLM_PROVIDER=anthropic` to use a Claude model instead.
- No OCR — scanned/image-only PDFs are not supported.
- Vector indexes are stored on local disk (FAISS) by default; a managed Qdrant Cloud backend is
  available via `VECTOR_STORE=qdrant` for a hosted alternative.
- Authentication is a simple two-role (Admin/Reviewer) JWT scheme, not enterprise RBAC/SSO.

## 12. Future Improvements

- OCR support for scanned documents.
- Multi-payer / multi-policy comparison in a single analysis.
- Fine-grained audit trail and e-signature on appeal approval.
- Real payer API integrations (would require moving well beyond prototype scope).
- Configurable requirement-matching rules per policy type.

---

*Generated by ClaimAssist AI — Educational Prototype.*
