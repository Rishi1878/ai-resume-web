# AI Resume Intelligence — Web App

A full-stack web application wrapping the AI Resume Analyzer backend with a React frontend.

## Project Structure

```
ai-resume-web/
├── backend/              # FastAPI Python API
│   ├── api.py            # FastAPI app (NEW)
│   ├── resume_parser.py  # Original NLP parser
│   ├── embedder.py       # Sentence embeddings
│   ├── job_matcher.py    # Hybrid scoring
│   ├── pdf_reader.py     # PDF extraction
│   ├── requirements.txt  # Python deps
│   └── Dockerfile
├── frontend/             # React + Vite UI
│   ├── src/
│   │   ├── App.jsx       # Main UI component
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── nginx.conf        # Nginx SPA + proxy config
│   └── Dockerfile
└── docker-compose.yml    # Full stack orchestration
```

---

## Option 1 — Docker (recommended, works anywhere)

### Prerequisites
- Docker + Docker Compose installed

### Steps

```bash
# 1. Build and start both services
docker compose up --build

# 2. Open in browser
open http://localhost
```

The first build takes ~5–10 minutes (downloading ML models). Subsequent starts are fast.

To run in background:
```bash
docker compose up -d --build
```

To stop:
```bash
docker compose down
```

---

## Option 2 — Run locally (dev mode)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Start API server
uvicorn api:app --reload --port 8000
```

API is now at http://localhost:8000
Swagger docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend

# Install Node dependencies
npm install

# Start dev server (proxies /analyze to localhost:8000)
npm run dev
```

Frontend is now at http://localhost:5173

---

## Option 3 — Deploy to Render (free tier, public URL)

### Backend (Web Service)

1. Push your project to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your repo, set:
   - **Root directory**: `backend`
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
   - **Start command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
4. Deploy → copy the URL (e.g. `https://resume-api.onrender.com`)

### Frontend (Static Site)

1. In `frontend/vite.config.js`, remove the proxy block (not needed for production)
2. Go to Render → New → Static Site
3. Connect your repo, set:
   - **Root directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `dist`
   - **Environment variable**: `VITE_API_URL=https://resume-api.onrender.com`
4. Deploy → your site is live!

> **Note**: Render's free tier sleeps after 15 min of inactivity. First request after sleep takes ~30s.

---

## Option 4 — Deploy to Railway

Railway is slightly easier and keeps services awake on free tier.

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# From project root
railway init
railway up
```

Set environment variable `VITE_API_URL` in Railway dashboard after deploying the backend.

---

## Option 5 — VPS / Cloud VM (DigitalOcean, AWS EC2, etc.)

```bash
# On your server
git clone <your-repo>
cd ai-resume-web

# Install Docker
curl -fsSL https://get.docker.com | sh

# Start
docker compose up -d --build

# Optional: set up Nginx reverse proxy + SSL with Certbot
```

---

## API Reference

### POST /analyze

Accepts multipart form data:

| Field   | Type          | Description                              |
|---------|---------------|------------------------------------------|
| `file`  | File (PDF/TXT)| Resume file upload                       |
| `text`  | string        | Raw resume text (alternative to `file`)  |
| `top_k` | int (1–8)     | Number of role matches to return (default 5) |

Response:
```json
{
  "parsed": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "skills": ["python", "pytorch", "nlp"],
    "skill_categories": { "ml_ai": ["nlp", "pytorch"] },
    "experience_years": 3,
    ...
  },
  "matches": [
    {
      "rank": 1,
      "title": "NLP / LLM Engineer",
      "final_score": 0.825,
      "semantic_score": 0.852,
      "ats_score": 0.789,
      "matched_required": ["python", "nlp", "transformers"],
      "missing_required": [],
      "recommendation": "Strong fit (82% match)...",
      ...
    }
  ]
}
```

---

## Notes

- The ML model (MiniLM-L6-v2) is ~90MB and is baked into the Docker image at build time.
- First startup without Docker takes ~30s as the model initialises.
- No database required — the web app is stateless (database features from the original CLI are optional and not wired into the API).
- File size limit: 20MB (configurable in `nginx.conf`).
