import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.confessed.faith'

type ArticleStatus = 'draft' | 'published' | 'suspended' | 'archived'

interface Article {
  id: string
  title: string
  slug: string
  status: ArticleStatus
  readingTimeMinutes: number | null
  viewCount: number
  publishedAt: string | null
  updatedAt: string
  series?: { name: string; icon: string } | null
}

const STATUS_STYLES: Record<ArticleStatus, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'Draft',     color: 'rgba(240,236,224,0.45)', bg: 'rgba(240,236,224,0.06)', border: 'rgba(240,236,224,0.12)' },
  published: { label: 'Published', color: '#81c784',                bg: 'rgba(129,199,132,0.08)', border: 'rgba(129,199,132,0.25)' },
  suspended: { label: 'Suspended', color: '#e57373',                bg: 'rgba(229,115,115,0.08)', border: 'rgba(229,115,115,0.25)' },
  archived:  { label: 'Archived',  color: 'rgba(240,236,224,0.3)',  bg: 'rgba(240,236,224,0.04)', border: 'rgba(240,236,224,0.08)' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ArticlesPage() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_BASE}/articles/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Failed to load articles')
        const data = await res.json()
        setArticles(data.articles)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    })()
  }, [getToken])

  const drafts    = articles.filter(a => a.status === 'draft')
  const published = articles.filter(a => a.status === 'published')
  const other     = articles.filter(a => a.status !== 'draft' && a.status !== 'published')

  return (
    <>
      <style>{`
        .ap-wrap { padding: 40px 48px; max-width: 900px; }
        .ap-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; }
        .ap-title { font-family: 'EB Garamond', serif; font-size: 28px; color: #f0ece0; }
        .ap-title em { font-style: italic; color: #C9A94A; }
        .ap-new-btn {
          font-family: 'Barlow', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: .1em; text-transform: uppercase;
          padding: 9px 20px; border-radius: 6px; cursor: pointer;
          background: #C9A94A; color: #080f1a; border: none;
          transition: opacity .15s;
        }
        .ap-new-btn:hover { opacity: .85; }

        .ap-section-label {
          font-family: 'Barlow', sans-serif; font-size: 10px; font-weight: 700;
          letter-spacing: .16em; text-transform: uppercase;
          color: rgba(201,169,74,.45); margin: 28px 0 10px;
        }
        .ap-empty {
          font-family: 'EB Garamond', serif; font-style: italic;
          font-size: 14px; color: rgba(240,236,224,.25);
          padding: 16px 0;
        }

        .ap-row {
          display: flex; align-items: center; gap: 16px;
          padding: 14px 18px; background: #0b1929;
          border: 1px solid rgba(255,255,255,.05); border-radius: 8px;
          margin-bottom: 6px; cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .ap-row:hover { border-color: rgba(201,169,74,.2); background: #0d1e34; }

        .ap-series-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }
        .ap-row-body { flex: 1; min-width: 0; }
        .ap-row-title {
          font-family: 'Barlow', sans-serif; font-size: 13.5px; font-weight: 600;
          color: #f0ece0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ap-row-meta {
          font-family: 'Barlow', sans-serif; font-size: 11px;
          color: rgba(240,236,224,.3); margin-top: 2px;
        }

        .ap-status-badge {
          font-family: 'Barlow', sans-serif; font-size: 9px; font-weight: 700;
          letter-spacing: .1em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 100px; white-space: nowrap;
          border: 1px solid;
        }
        .ap-views {
          font-family: 'Barlow', sans-serif; font-size: 11px;
          color: rgba(240,236,224,.25); white-space: nowrap; min-width: 50px; text-align: right;
        }
        .ap-date {
          font-family: 'Barlow', sans-serif; font-size: 11px;
          color: rgba(240,236,224,.2); white-space: nowrap; min-width: 90px; text-align: right;
        }

        .ap-error { color: #e57373; font-family: 'Barlow', sans-serif; font-size: 13px; padding: 24px 0; }
        .ap-loading { color: rgba(240,236,224,.3); font-family: 'Barlow', sans-serif; font-size: 13px; padding: 24px 0; }

        @media (max-width: 640px) {
          .ap-wrap { padding: 24px 20px; }
          .ap-views, .ap-date { display: none; }
        }
      `}</style>

      <div className="ap-wrap">
        <div className="ap-header">
          <h1 className="ap-title">My <em>articles</em></h1>
          <button className="ap-new-btn" onClick={() => navigate('/dashboard/articles/new')}>
            + New article
          </button>
        </div>

        {loading && <p className="ap-loading">Loading…</p>}
        {error   && <p className="ap-error">{error}</p>}

        {!loading && !error && (
          <>
            <Section label="Drafts" articles={drafts} onOpen={id => navigate(`/dashboard/articles/${id}/edit`)} />
            <Section label="Published" articles={published} onOpen={id => navigate(`/dashboard/articles/${id}/edit`)} />
            {other.length > 0 && (
              <Section label="Other" articles={other} onOpen={id => navigate(`/dashboard/articles/${id}/edit`)} />
            )}
            {articles.length === 0 && (
              <p className="ap-empty">You haven't written anything yet. Start your first article.</p>
            )}
          </>
        )}
      </div>
    </>
  )
}

function Section({
  label,
  articles,
  onOpen,
}: {
  label: string
  articles: Article[]
  onOpen: (id: string) => void
}) {
  return (
    <>
      <div className="ap-section-label">{label}</div>
      {articles.length === 0 ? (
        <p className="ap-empty">None yet.</p>
      ) : (
        articles.map(a => {
          const s = STATUS_STYLES[a.status]
          return (
            <div key={a.id} className="ap-row" onClick={() => onOpen(a.id)}>
              <span className="ap-series-icon">{a.series?.icon ?? '✎'}</span>
              <div className="ap-row-body">
                <div className="ap-row-title">{a.title}</div>
                <div className="ap-row-meta">
                  {a.series?.name ?? 'No series'}
                  {a.readingTimeMinutes ? ` · ${a.readingTimeMinutes} min read` : ''}
                </div>
              </div>
              <span
                className="ap-status-badge"
                style={{ color: s.color, background: s.bg, borderColor: s.border }}
              >
                {s.label}
              </span>
              <span className="ap-views">{a.viewCount > 0 ? `${a.viewCount} views` : ''}</span>
              <span className="ap-date">
                {a.status === 'published' ? formatDate(a.publishedAt) : `Saved ${formatDate(a.updatedAt)}`}
              </span>
            </div>
          )
        })
      )}
    </>
  )
}
