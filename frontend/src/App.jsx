import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, Zap, User, Mail, Phone, Github, Linkedin,
  GraduationCap, Briefcase, Star, AlertCircle, CheckCircle,
  XCircle, ChevronDown, ChevronUp, Loader2, ArrowRight, RotateCcw
} from 'lucide-react'

// ── API base: empty = same origin (works with Vite proxy in dev, and when
//    the React build is served by the FastAPI server in production).
const API = import.meta.env.VITE_API_URL || ''

// ── Score colour helper ──────────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 0.70) return '#10b981'
  if (score >= 0.50) return '#3b82f6'
  if (score >= 0.35) return '#f59e0b'
  return '#ef4444'
}

function pct(score) { return Math.round(score * 100) }

// ── ScoreBar ────────────────────────────────────────────────────────────────
function ScoreBar({ value, color }) {
  return (
    <div style={{ background: '#1f2d45', borderRadius: 4, height: 6, overflow: 'hidden', flex: 1 }}>
      <div style={{
        width: `${pct(value)}%`,
        height: '100%',
        background: color,
        borderRadius: 4,
        transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  )
}

// ── Pill ────────────────────────────────────────────────────────────────
function Pill({ label, variant = 'default' }) {
  const colors = {
    default: { bg: '#1a2235', border: '#1f2d45', text: '#94a3b8' },
    blue:    { bg: '#1e3a5f', border: '#2563eb', text: '#93c5fd' },
    green:   { bg: '#064e3b', border: '#059669', text: '#6ee7b7' },
    amber:   { bg: '#451a03', border: '#d97706', text: '#fcd34d' },
    red:     { bg: '#4c0519', border: '#dc2626', text: '#fca5a5' },
  }
  const c = colors[variant]
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: 6, padding: '2px 10px', fontSize: 12,
      fontFamily: 'var(--mono)', fontWeight: 500,
    }}>
      {label}
    </span>
  )
}

// ── MatchCard ────────────────────────────────────────────────────────────────
function MatchCard({ match, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)
  const color = scoreColor(match.final_score)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      transition: 'border-color .2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Header row */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 22px', background: 'none', border: 'none',
        cursor: 'pointer', color: 'var(--text)', textAlign: 'left',
      }}>
        {/* Rank badge */}
        <span style={{
          width: 32, height: 32, borderRadius: '50%',
          background: color + '22', border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color,
          flexShrink: 0,
        }}>
          {match.rank}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{match.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScoreBar value={match.final_score} color={color} />
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color, fontSize: 14, flexShrink: 0 }}>
              {pct(match.final_score)}%
            </span>
          </div>
        </div>

        <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--border)' }}>
          {/* Sub-scores */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16, marginBottom: 18 }}>
            {[
              { label: 'Semantic', value: match.semantic_score },
              { label: 'ATS', value: match.ats_score },
            ].map(({ label, value }) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ScoreBar value={value} color={scoreColor(value)} />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: scoreColor(value), flexShrink: 0 }}>{pct(value)}%</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 2 }}>
              {match.experience_ok
                ? <><CheckCircle size={14} color="#10b981" /><span style={{ fontSize: 12, color: '#10b981' }}>Exp OK</span></>
                : <><XCircle size={14} color="#ef4444" /><span style={{ fontSize: 12, color: '#ef4444' }}>Exp short</span></>
              }
            </div>
          </div>

          {/* Recommendation */}
          <div style={{
            background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: 'var(--text)', marginBottom: 16, lineHeight: 1.5,
            borderLeft: `3px solid ${color}`,
          }}>
            {match.recommendation}
          </div>

          {/* Skills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {match.matched_required.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Matched required</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {match.matched_required.map(s => <Pill key={s} label={s} variant="green" />)}
                </div>
              </div>
            )}
            {match.matched_preferred.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Matched preferred</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {match.matched_preferred.map(s => <Pill key={s} label={s} variant="blue" />)}
                </div>
              </div>
            )}
            {match.missing_required.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Missing required</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {match.missing_required.map(s => <Pill key={s} label={s} variant="red" />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ParsedSection ────────────────────────────────────────────────────────────────
function ParsedSection({ parsed }) {
  const fields = [
    { icon: <User size={14} />,       label: 'Name',       value: parsed.name },
    { icon: <Mail size={14} />,       label: 'Email',      value: parsed.email },
    { icon: <Phone size={14} />,      label: 'Phone',      value: parsed.phone },
    { icon: <Linkedin size={14} />,   label: 'LinkedIn',   value: parsed.linkedin },
    { icon: <Github size={14} />,     label: 'GitHub',     value: parsed.github },
    { icon: <Briefcase size={14} />,  label: 'Experience', value: parsed.experience_years != null ? `${parsed.experience_years} years` : null },
    { icon: <GraduationCap size={14} />, label: 'Education', value: parsed.education?.join(', ') || null },
    { icon: <Star size={14} />,       label: 'GPA',        value: parsed.gpa },
  ].filter(f => f.value)

  const categoryColors = {
    programming: 'blue', ml_ai: 'amber', frameworks: 'green',
    data: 'blue', cloud_devops: 'default', soft_skills: 'default',
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Contact / info */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Extracted info</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {fields.map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: 'var(--muted)', marginTop: 2, flexShrink: 0 }}>{icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: 14, color: 'var(--text)', wordBreak: 'break-all' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills by category */}
      {Object.entries(parsed.skill_categories || {}).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 22 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Skills detected</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(parsed.skill_categories).map(([cat, skills]) => (
              <div key={cat}>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {cat.replace('_', ' ')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {skills.map(s => <Pill key={s} label={s} variant={categoryColors[cat] || 'default'} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── UploadZone ────────────────────────────────────────────────────────────────
function UploadZone({ onFile, dragActive, setDragActive }) {
  const inputRef = useRef()

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile, setDragActive])

  return (
    <div
      onClick={() => inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragActive ? '#3b82f6' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '40px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all .2s',
        background: dragActive ? '#1e3a5f22' : 'transparent',
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      <Upload size={32} color={dragActive ? '#3b82f6' : '#475569'} style={{ marginBottom: 12 }} />
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop your resume here</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>PDF or TXT · or click to browse</div>
    </div>
  )
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('upload')          // 'upload' | 'text'
  const [file, setFile] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const reset = () => { setResult(null); setFile(null); setTextInput(''); setError(null) }

  const handleFile = (f) => {
    setFile(f)
    setError(null)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      if (tab === 'upload' && file) {
        form.append('file', file)
      } else if (tab === 'text' && textInput.trim()) {
        form.append('text', textInput.trim())
      } else {
        setError('Please provide a resume — either upload a file or paste text.')
        setLoading(false)
        return
      }
      form.append('top_k', '5')

      const resp = await fetch(`${API}/analyze`, { method: 'POST', body: form })
      if (!resp.ok) {
        const d = await resp.json().catch(() => ({}))
        throw new Error(d.detail || `Server error ${resp.status}`)
      }
      setResult(await resp.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Results view ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              AI Resume Intelligence
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analysis complete</h1>
          </div>
          <button onClick={reset} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', cursor: 'pointer', fontSize: 13,
          }}>
            <RotateCcw size={14} /> Analyze another
          </button>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left: parsed resume */}
          <ParsedSection parsed={result.parsed} />

          {/* Right: matches */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Top role matches
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.matches.map((m, i) => (
                <MatchCard key={m.title} match={m} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Upload view ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        padding: '16px 32px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Zap size={18} color="#3b82f6" />
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>
          Resume<span style={{ color: '#3b82f6' }}>IQ</span>
        </span>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#1e3a5f', border: '1px solid #2563eb',
              borderRadius: 20, padding: '4px 14px', fontSize: 12,
              color: '#93c5fd', marginBottom: 20, fontFamily: 'var(--mono)',
            }}>
              <Zap size={11} /> NLP · MiniLM-L6 · ATS Scoring
            </div>
            <h1 style={{
              fontSize: 42, fontWeight: 700, lineHeight: 1.1,
              letterSpacing: '-0.03em', marginBottom: 14,
            }}>
              Find your best<br />
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                job match
              </span>
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 380, margin: '0 auto' }}>
              Upload your resume and get instant AI-powered role predictions with skill gap analysis.
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 28,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 8, padding: 4, marginBottom: 20 }}>
              {[
                { id: 'upload', label: 'Upload file', icon: <Upload size={13} /> },
                { id: 'text',   label: 'Paste text',  icon: <FileText size={13} /> },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '8px 12px', borderRadius: 6, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--sans)',
                  background: tab === t.id ? 'var(--surface)' : 'transparent',
                  color: tab === t.id ? 'var(--text)' : 'var(--muted)',
                  boxShadow: tab === t.id ? '0 1px 4px #0004' : 'none',
                  transition: 'all .15s',
                }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Input area */}
            {tab === 'upload' ? (
              <div>
                {file ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#064e3b22', border: '1px solid #059669',
                    borderRadius: 10, padding: '14px 16px',
                  }}>
                    <FileText size={20} color="#10b981" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <button onClick={() => setFile(null)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--muted)', padding: 4,
                    }}>
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <UploadZone onFile={handleFile} dragActive={dragActive} setDragActive={setDragActive} />
                )}
              </div>
            ) : (
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Paste your resume text here…"
                style={{
                  width: '100%', minHeight: 220, background: 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  padding: '14px 16px', color: 'var(--text)', fontFamily: 'var(--sans)',
                  fontSize: 14, resize: 'vertical', outline: 'none', lineHeight: 1.6,
                }}
              />
            )}

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start',
                background: '#4c051922', border: '1px solid #dc2626',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button onClick={submit} disabled={loading} style={{
              marginTop: 18, width: '100%', padding: '13px 20px',
              background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none', borderRadius: 10, color: 'white',
              fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity .15s',
            }}>
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</>
                : <><Zap size={16} /> Analyze resume <ArrowRight size={16} /></>
              }
            </button>
          </div>

          {/* Footer note */}
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, marginTop: 20 }}>
            Powered by MiniLM-L6-v2 embeddings · spaCy NER · ATS scoring
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus { border-color: #3b82f6 !important; }
        @media (max-width: 700px) {
          .results-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}