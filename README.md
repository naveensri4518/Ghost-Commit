# CommitGhost 👻

> **Your Unfinished Code. Your Next Business.**

CommitGhost analyzes any public GitHub repository and surfaces three viable, monetizable product opportunities directly grounded in its existing code, architecture, and technology.

Powered by **local Ollama inference** with `qwen2.5:3b` and a glassmorphism developer dashboard inspired by Vercel minimalism.

---

## ✨ Features

- **Repository Deep Scan**: Fetches metadata, primary languages, directory tree, manifest dependencies, and key entry point code via the GitHub REST API (no personal token required).
- **Architecture Grounding**: Grounded suggestions based on actual code files—not generic boilerplate ideas.
- **3 Actionable Business Opportunities**:
  - Punchy product name and target customer persona
  - Concrete problem solved and proposed solution
  - **Codebase Leverage**: Explains how the existing repository code jumpstarts development
  - **Pricing Hypothesis**: Monetization model clearly identified as an unvalidated market hypothesis
  - **MVP Implementation Blueprint**: Step-by-step checklist to reach a working v1
  - **Technical Difficulty Rating**: 1 to 5 scale (from trivial wrapper to deep infra)
- **1-Click Markdown Export**: Copy structured business briefs to your clipboard for pitch decks or planning docs.
- **Privacy & Security First**:
  - Code is **never executed**.
  - All inference happens on your local machine via Ollama (`qwen2.5:3b`).
  - No repository code or prompt content is sent to third-party AI APIs.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React |
| **Backend** | Python 3.13, FastAPI, Uvicorn, HTTPX, Pydantic |
| **AI Inference** | Ollama (`qwen2.5:3b`) at `http://localhost:11434` |
| **Data Provider** | GitHub REST API v3 |
| **Design** | Purple Glassmorphism, Inter typography, Obsidian Dark (`#050505`) |

---

## 🚀 Quickstart

### 1. Prerequisites

- **Python 3.10+** (tested on Python 3.13)
- **Node.js 18+** & **npm**
- **Ollama** installed with `qwen2.5:3b`:
  ```powershell
  ollama list
  # If qwen2.5:3b is not present:
  ollama pull qwen2.5:3b
  ```

---

### 2. Run the Backend (PowerShell Terminal 1)

```powershell
cd "c:\Users\Naveensri\Downloads\hack sunday\backend"

# (Optional) Set up a virtual environment if desired:
# python -m venv venv
# .\venv\Scripts\Activate.ps1

# Install requirements (if not already installed)
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will be live at: `http://127.0.0.1:8000`  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`

---

### 3. Run the Frontend (PowerShell Terminal 2)

```powershell
cd "c:\Users\Naveensri\Downloads\hack sunday\frontend"

# Install dependencies (already prepared)
npm install

# Start Vite dev server
npm run dev
```

The frontend will be live at: `http://localhost:5173`

---

## 🔌 API Endpoints

### `GET /api/health`
Checks Ollama connectivity, model availability, and GitHub status.

**Response:**
```json
{
  "status": "healthy",
  "ollama_connected": true,
  "ollama_model": "qwen2.5:3b",
  "model_available": true,
  "github_auth": false
}
```

---

### `POST /api/analyze`
Analyzes a repository and returns structured business opportunities.

**Request:**
```json
{
  "repo_url": "https://github.com/expressjs/express"
}
```

**Response:**
```json
{
  "repo_overview": {
    "name": "expressjs/express",
    "description": "Fast, unopinionated, minimalist web framework for node.",
    "summary": "Core middleware-driven HTTP server abstractions with routing and plugin pipelines.",
    "key_technologies": ["Node.js", "JavaScript", "HTTP"],
    "primary_languages": ["JavaScript"],
    "stars": 64000,
    "forks": 12000,
    "repo_url": "https://github.com/expressjs/express"
  },
  "opportunities": [
    {
      "product_name": "API Route Shield",
      "problem_solved": "Developers lack automated rate limiting and bot protection middleware.",
      "target_customer": "Indie hackers and SaaS engineers building Node APIs.",
      "proposed_solution": "A drop-in security plugin with cloud analytics dashboard.",
      "how_existing_code_helps": "Plugs directly into Express's Router and layer dispatch stack.",
      "pricing_hypothesis": "$19/mo per protected service (Unvalidated pricing hypothesis)",
      "mvp_implementation_plan": [
        "Create custom middleware wrapper",
        "Add Redis-based token bucket limiter",
        "Build telemetry logging client",
        "Launch npm package and self-service onboarding"
      ],
      "difficulty": 2
    }
  ]
}
```

---

## 🔒 Security & Safe Handling

- **Untrusted Input Handling**: All repository files and names are treated as untrusted text.
- **Zero Execution**: Code files are parsed as plain text without ever evaluating or executing them.
- **Rate Limit Safeguards**: Public GitHub API calls are bounded, with clean 403 / 404 notifications. Optional `GITHUB_TOKEN` support increases hourly limits from 60 to 5,000.
