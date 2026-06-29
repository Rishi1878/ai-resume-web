"""
api.py
------
FastAPI backend for the AI Resume Intelligence System.
Exposes a /analyze endpoint that accepts a resume (PDF or text)
and returns structured match results.
"""

import io
import tempfile
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from resume_parser import ResumeParser
from embedder import ResumeEmbedder
from job_matcher import JobMatcher
from pdf_reader import extract_text_from_pdf

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Resume Intelligence API",
    description="Analyze resumes and predict best-matching job roles.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # tighten in production to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Singletons (loaded once at startup) ─────────────────────────────────────
print("[API] Initialising models — this takes ~30s on first run...")
parser   = ResumeParser()
embedder = ResumeEmbedder()
matcher  = JobMatcher(embedder=embedder)
print("[API] Ready.")


# ── Response models ───────────────────────────────────────────────────────────
class MatchResultOut(BaseModel):
    rank: int
    title: str
    final_score: float
    semantic_score: float
    ats_score: float
    matched_required: list
    matched_preferred: list
    missing_required: list
    experience_ok: bool
    recommendation: str


class ParsedResumeOut(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    linkedin: Optional[str]
    github: Optional[str]
    skills: list
    skill_categories: dict
    education: list
    experience_years: Optional[int]
    gpa: Optional[str]


class AnalyzeResponse(BaseModel):
    parsed: ParsedResumeOut
    matches: list[MatchResultOut]


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    top_k: int = Form(5),
):
    """
    Accept either:
    - A PDF/TXT file upload  (multipart field: `file`)
    - Raw resume text        (form field: `text`)
    Returns parsed resume data + top-k role matches.
    """
    resume_text: Optional[str] = None

    if file is not None:
        filename = file.filename or ""
        content  = await file.read()

        if filename.lower().endswith(".pdf"):
            # Write to a temp file so pdfplumber can read it
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            try:
                resume_text = extract_text_from_pdf(tmp_path)
            finally:
                os.unlink(tmp_path)
        else:
            # Treat as plain text
            resume_text = content.decode("utf-8", errors="replace")

    elif text:
        resume_text = text

    if not resume_text or not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No resume content provided. Send a PDF/TXT file or plain text.",
        )

    # ── Parse ────────────────────────────────────────────────────────────────
    parsed = parser.parse(resume_text)

    # ── Match ────────────────────────────────────────────────────────────────
    top_k = max(1, min(top_k, 8))
    results = matcher.match(parsed, top_k=top_k)

    return AnalyzeResponse(
        parsed=ParsedResumeOut(**parsed.to_dict()),
        matches=[MatchResultOut(**r.to_dict()) for r in results],
    )