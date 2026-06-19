import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import MDEditor from '@uiw/react-md-editor'

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.confessed.faith'

interface SeriesOption {
  id: string
  name: string
  icon: string
}

interface ArticleData {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  seriesId: string | null
  tags: string[]
  status: 'draft' | 'published' | 'suspended' | 'archived'
  coverImageUrl: string | null
}

export default function ArticleEditor() {
  const { id } = useParams<{ id?: string }>()
  const isNew = !id
  const { getToken } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [title, setTitle]         = useState('')
  const [seriesId, setSeriesId]   = useState('')
  const [excerpt, setExcerpt]     = useState('')
  const [content, setContent]     = useState('## Introduction\n\n')
  const [tagsRaw, setTagsRaw]     = useState('')
  const [status, setStatus]       = useState<'draft' | 'published'>('draft')

  // UI state
  const [seriesList, setSeriesList] = useState<SeriesOption[]>([])
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(!isNew)

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const articleIdRef  = useRef<string | null>(id ?? null)

  // Load series list
  useEffect(() => {
    fetch(`${API_BASE}/series`)
      .then(r => r.json())
      .then(d => setSeriesList(d.series ?? []))
      .catch(() => {})
  }, [])

  // Load existing article for edit
  useEffect(() => {
    if (isNew) return
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_BASE}/articles/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        const found: ArticleData | undefined = data.articles.find((a: ArticleData) => a.id === id)
        if (!found) throw new Error('Article not found')
        setTitle(found.title)
        setSeriesId(found.seriesId ?? '')
        setExcerpt(found.excerpt ?? '')
        setContent(found.content)
        setTagsRaw(found.tags?.join(', ') ?? '')
        setStatus(found.status === 'published' ? 'published' : 'draft')
      } catch {
        setError('Could not load article.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isNew, getToken])

  // ---------------------------------------------------------------------------
  // Persist
  // ---------------------------------------------------------------------------
  async function persist(publishNow?: boolean): Promise<boolean> {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.')
      return false
    }
    setSaving(true)
    setError(null)
    try {
      const token  = await getToken()
      const tags   = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
      const body = {
        title: title.trim(),
        content,
        seriesId: seriesId || undefined,
        excerpt: excerpt.trim() || undefined,
        tags,
        status: publishNow ? 'published' : 'draft',
      }

      let res: Response
      if (articleIdRef.current) {
        // Update existing
        res = await fetch(`${API_BASE}/articles/${articleIdRef.current}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        // Create new
        res = await fetch(`${API_BASE}/articles`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Save failed')
      }

      const saved = await res.json()
      articleIdRef.current = saved.article.id
      setStatus(saved.article.status)
      setSaveMsg(publishNow ? 'Published' : 'Saved')
      setTimeout(() => setSaveMsg(null), 2500)
      return true
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  // Auto-save draft every 30 s after first change
  function scheduleAutoSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      if (status !== 'published') persist()
    }, 30_000)
  }

  async function handlePublish() {
    const ok = await persist(true)
    if (ok) navigate('/dashboard/articles')
  }

  async function handleSaveDraft() {
    await persist(false)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div style={{ padding: 48, color: 'rgba(240,236,224,.3)', fontFamily: 'Barlow, sans-serif', fontSize: 13 }}>
        Loading…
      </div>
    )
  }

  return (
    <>
      <style>{`
        /* Force md-editor to use our dark theme tokens */
        [data-color-mode] .w-md-editor {
          background: #080f1a !important;
          border: 1px solid rgba(255,255,255,.07) !important;
          border-radius: 8px !important;
          color: #f0ece0 !important;
          font-family: 'EB Garamond', serif !important;
        }
        [data-color-mode] .w-md-editor-toolbar {
          background: #0b1929 !important;
          border-bottom: 1px solid rgba(255,255,255,.06) !important;
        }
        [data-color-mode] .w-md-editor-toolbar li > button {
          color: rgba(240,236,224,.5) !important;
        }
        [data-color-mode] .w-md-editor-toolbar li > button:hover {
          color: #C9A94A !important;
          background: rgba(201,169,74,.08) !important;
        }
        [data-color-mode] .w-md-editor-text-pre > code,
        [data-color-mode] .w-md-editor-text-input {
          font-family: 'EB Garamond', serif !important;
          font-size: 16px !important;
          line-height: 1.75 !important;
          color: #f0ece0 !important;
          background: transparent !important;
          caret-color: #C9A94A !important;
        }
        [data-color-mode] .wmde-markdown {
          background: transparent !important;
          color: #f0ece0 !important;
          font-family: 'EB Garamond', serif !important;
          font-size: 16px !important;
          line-height: 1.75 !important;
        }
        [data-color-mode] .wmde-markdown h1,
        [data-color-mode] .wmde-markdown h2,
        [data-color-mode] .wmde-markdown h3 {
          font-family: 'EB Garamond', serif !important;
          color: #f0ece0 !important;
          border-bottom: 1px solid rgba(201,169,74,.15) !important;
        }
        [data-color-mode] .wmde-markdown blockquote {
          border-left: 3px solid #C9A94A !important;
          color: rgba(240,236,224,.6) !important;
        }
        [data-color-mode] .wmde-markdown a { color: #C9A94A !important; }
        [data-color-mode] .wmde-markdown code {
          background: rgba(201,169,74,.08) !important;
          color: #C9A94A !important;
        }

        .ae-shell {
          display: flex; flex-direction: column; min-height: 100vh;
          background: #080f1a;
        }
        .ae-topbar {
          display: flex; align-items: center; gap: 16px;
          padding: 14px 48px; border-bottom: 1px solid rgba(255,255,255,.05);
          background: #080f1a; position: sticky; top: 0; z-index: 10;
        }
        .ae-back {
          font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 500;
          color: rgba(240,236,224,.4); background: none; border: none;
          cursor: pointer; padding: 0; letter-spacing: .04em;
        }
        .ae-back:hover { color: #f0ece0; }
        .ae-divider { color: rgba(240,236,224,.15); }
        .ae-doc-status {
          font-family: 'Barlow', sans-serif; font-size: 11px;
          color: rgba(240,236,224,.3); letter-spacing: .06em;
        }
        .ae-spacer { flex: 1; }
        .ae-save-msg {
          font-family: 'Barlow', sans-serif; font-size: 11px;
          color: #81c784; letter-spacing: .06em;
        }
        .ae-btn-draft {
          font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          padding: 8px 18px; border-radius: 6px; cursor: pointer;
          background: transparent; color: rgba(240,236,224,.6);
          border: 1px solid rgba(240,236,224,.15);
          transition: border-color .15s, color .15s;
        }
        .ae-btn-draft:hover { border-color: rgba(240,236,224,.35); color: #f0ece0; }
        .ae-btn-publish {
          font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          padding: 8px 20px; border-radius: 6px; cursor: pointer;
          background: #C9A94A; color: #080f1a; border: none;
          transition: opacity .15s;
        }
        .ae-btn-publish:hover { opacity: .85; }
        .ae-btn-publish:disabled,
        .ae-btn-draft:disabled { opacity: .45; cursor: default; }

        .ae-body { display: flex; flex: 1; gap: 0; }
        .ae-main { flex: 1; padding: 40px 48px; min-width: 0; }

        .ae-title-input {
          width: 100%; background: none; border: none; outline: none;
          font-family: 'EB Garamond', serif; font-size: 34px;
          font-weight: 400; color: #f0ece0;
          border-bottom: 1px solid rgba(255,255,255,.07);
          padding-bottom: 16px; margin-bottom: 28px;
          caret-color: #C9A94A;
        }
        .ae-title-input::placeholder { color: rgba(240,236,224,.2); }

        .ae-sidebar {
          width: 240px; flex-shrink: 0;
          border-left: 1px solid rgba(255,255,255,.05);
          padding: 40px 24px;
          display: flex; flex-direction: column; gap: 24px;
        }
        .ae-field-label {
          font-family: 'Barlow', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase;
          color: rgba(201,169,74,.5); margin-bottom: 7px;
        }
        .ae-select, .ae-input, .ae-textarea {
          width: 100%; background: #081422; border: 1px solid rgba(255,255,255,.08);
          border-radius: 6px; color: #f0ece0; outline: none;
          font-family: 'Barlow', sans-serif; font-size: 12.5px;
          padding: 9px 12px; caret-color: #C9A94A;
        }
        .ae-select:focus, .ae-input:focus, .ae-textarea:focus {
          border-color: rgba(201,169,74,.35);
        }
        .ae-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
        .ae-tags-hint {
          font-family: 'Barlow', sans-serif; font-size: 10px;
          color: rgba(240,236,224,.2); margin-top: 5px;
        }

        .ae-error {
          font-family: 'Barlow', sans-serif; font-size: 12px;
          color: #e57373; margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .ae-topbar { padding: 12px 20px; }
          .ae-main { padding: 24px 20px; }
          .ae-sidebar { display: none; }
          .ae-title-input { font-size: 26px; }
        }
      `}</style>

      <div className="ae-shell" data-color-mode="dark">
        {/* Top bar */}
        <div className="ae-topbar">
          <button className="ae-back" onClick={() => navigate('/dashboard/articles')}>
            ← Articles
          </button>
          <span className="ae-divider">·</span>
          <span className="ae-doc-status">
            {isNew ? 'New article' : status === 'published' ? 'Published' : 'Draft'}
          </span>
          <div className="ae-spacer" />
          {saveMsg && <span className="ae-save-msg">{saveMsg} ✓</span>}
          <button className="ae-btn-draft" onClick={handleSaveDraft} disabled={saving}>
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          {status !== 'published' && (
            <button className="ae-btn-publish" onClick={handlePublish} disabled={saving}>
              Publish
            </button>
          )}
        </div>

        <div className="ae-body">
          {/* Main writing area */}
          <div className="ae-main">
            {error && <p className="ae-error">{error}</p>}
            <input
              className="ae-title-input"
              placeholder="Article title"
              value={title}
              onChange={e => { setTitle(e.target.value); scheduleAutoSave() }}
            />
            <MDEditor
              value={content}
              onChange={v => { setContent(v ?? ''); scheduleAutoSave() }}
              height={520}
              preview="live"
            />
          </div>

          {/* Right sidebar — metadata */}
          <div className="ae-sidebar">
            <div>
              <div className="ae-field-label">Series</div>
              <select
                title="Series"
                className="ae-select"
                value={seriesId}
                onChange={e => setSeriesId(e.target.value)}
              >
                <option value="">— No series —</option>
                {seriesList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="ae-field-label">Excerpt</div>
              <textarea
                className="ae-textarea"
                placeholder="Short summary shown in listings…"
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
              />
            </div>

            <div>
              <div className="ae-field-label">Tags</div>
              <input
                className="ae-input"
                placeholder="reformed, soteriology, …"
                value={tagsRaw}
                onChange={e => setTagsRaw(e.target.value)}
              />
              <p className="ae-tags-hint">Comma-separated</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
