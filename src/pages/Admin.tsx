// src/pages/Admin.tsx
import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { apiFetch } from '../lib/api'
import AdminEmailTab from '../components/AdminEmailTab'
import AdminResourcesTab from '../components/AdminResourcesTab'
import AdminNewsletterTab from '../components/AdminNewsletterTab'

type Application = {
  id: string
  fullName: string
  desiredTitle: string
  bio: string
  theologicalStatement: string
  churchName?: string
  ministryName?: string
  location?: string
  writingSamples?: string[]
  socialLinks?: Record<string, string>
  submittedAt: string
  status: string
}

type User = {
  id: string
  email: string
  displayName?: string
  role: string
  isActive: boolean
  createdAt: string
}

type ArticleStatus = 'draft' | 'published' | 'suspended' | 'archived'

type Article = {
  id: string
  title: string
  slug: string
  status: ArticleStatus
  authorId: string
  seriesId: string | null
  readingTimeMinutes: number | null
  publishedAt: string | null
  createdAt: string
  suspensionReason: string | null
}

type Tab = 'applications' | 'users' | 'articles' | 'emails' | 'resources' | 'newsletter'

const ROLES = ['regular', 'contributor', 'admin'] as const

const STATUS_META: Record<ArticleStatus, { label: string; color: string; border: string }> = {
  draft:     { label: 'Draft',     color: 'rgba(240,236,224,0.45)', border: 'rgba(240,236,224,0.12)' },
  published: { label: 'Published', color: '#81c784',                border: 'rgba(129,199,132,0.3)'  },
  suspended: { label: 'Suspended', color: '#e57373',                border: 'rgba(229,115,115,0.3)'  },
  archived:  { label: 'Archived',  color: 'rgba(240,236,224,0.3)',  border: 'rgba(240,236,224,0.08)' },
}

const SELF_MANAGED_TABS: Tab[] = ['emails', 'resources', 'newsletter']

export default function Admin() {
  const { getToken } = useAuth()
  const { user: currentUser } = useUser()
  const [tab, setTab] = useState<Tab>('applications')

  const [applications, setApplications] = useState<Application[]>([])
  const [users,        setUsers]        = useState<User[]>([])
  const [articles,     setArticles]     = useState<Article[]>([])

  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState<Application | null>(null)
  const [reason,        setReason]        = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [roleUpdating,  setRoleUpdating]  = useState<string | null>(null)
  const [toast,         setToast]         = useState<string | null>(null)

  const [suspendTarget,  setSuspendTarget]  = useState<Article | null>(null)
  const [suspendReason,  setSuspendReason]  = useState('')
  const [suspendLoading, setSuspendLoading] = useState(false)

  async function load() {
    if (SELF_MANAGED_TABS.includes(tab)) { setLoading(false); return }

    setLoading(true)
    try {
      const token = await getToken()
      if (tab === 'applications') {
        const data = await apiFetch<{ applications: Application[] }>('/admin/applications', token)
        setApplications(data.applications)
      } else if (tab === 'users') {
        const data = await apiFetch<{ users: User[] }>('/admin/users', token)
        setUsers(data.users)
      } else if (tab === 'articles') {
        const data = await apiFetch<{ articles: Article[] }>('/admin/articles', token)
        setArticles(data.articles)
      }
    } catch (e: any) {
      showToast('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function approve(id: string) {
    setActionLoading(true)
    try {
      const token = await getToken()
      await apiFetch(`/admin/applications/${id}/approve`, token, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || null }),
      })
      showToast('Application approved')
      setSelected(null); setReason(''); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading(false) }
  }

  async function reject(id: string) {
    if (!reason.trim()) { showToast('Reason is required for rejection'); return }
    setActionLoading(true)
    try {
      const token = await getToken()
      await apiFetch(`/admin/applications/${id}/reject`, token, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      showToast('Application rejected')
      setSelected(null); setReason(''); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setActionLoading(false) }
  }

  async function suspend(id: string) {
    if (!confirm('Suspend this user?')) return
    try {
      const token = await getToken()
      await apiFetch(`/admin/users/${id}/suspend`, token, { method: 'PUT' })
      showToast('User suspended'); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
  }

  async function reactivate(id: string) {
    try {
      const token = await getToken()
      await apiFetch(`/admin/users/${id}/reactivate`, token, { method: 'PUT' })
      showToast('User reactivated'); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
  }

  async function changeRole(id: string, newRole: string, currentRole: string) {
    if (newRole === currentRole) return
    if (!confirm(`Change this user's role from ${currentRole} to ${newRole}?`)) { load(); return }
    setRoleUpdating(id)
    try {
      const token = await getToken()
      await apiFetch(`/admin/users/${id}/role`, token, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      })
      showToast(`Role changed to ${newRole}`); load()
    } catch (e: any) { showToast('Error: ' + e.message); load() }
    finally { setRoleUpdating(null) }
  }

  async function suspendArticle() {
    if (!suspendTarget) return
    setSuspendLoading(true)
    try {
      const token = await getToken()
      await apiFetch(`/admin/articles/${suspendTarget.id}/suspend`, token, {
        method: 'PUT',
        body: JSON.stringify({ reason: suspendReason || null }),
      })
      showToast('Article suspended')
      setSuspendTarget(null); setSuspendReason(''); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
    finally { setSuspendLoading(false) }
  }

  async function reinstateArticle(id: string, title: string) {
    if (!confirm(`Reinstate "${title}"?`)) return
    try {
      const token = await getToken()
      await apiFetch(`/admin/articles/${id}/reinstate`, token, { method: 'PUT' })
      showToast('Article reinstated'); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&family=Barlow:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .adm { min-height: calc(100vh - 60px); background: #080f1a; font-family: 'Barlow', sans-serif; color: #f0ece0; display: flex; flex-direction: column; }
        .adm-header { padding: 32px 48px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .adm-title { font-family: 'EB Garamond', serif; font-size: 28px; color: #f0ece0; margin-bottom: 20px; }
        .adm-title em { font-style: italic; color: #C9A94A; }
        .adm-tabs { display: flex; gap: 0; overflow-x: auto; scrollbar-width: none; }
        .adm-tabs::-webkit-scrollbar { display: none; }
        .adm-tab { padding: 10px 24px; font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; border: none; background: transparent; color: rgba(240,236,224,0.35); border-bottom: 2px solid transparent; transition: all .2s; font-family: 'Barlow', sans-serif; white-space: nowrap; flex-shrink: 0; }
        .adm-tab.active { color: #C9A94A; border-bottom-color: #C9A94A; }
        .adm-tab:hover  { color: rgba(240,236,224,0.7); }
        .adm-body { flex: 1; padding: 32px 48px; }
        .adm-empty { text-align: center; padding: 80px 0; font-family: 'EB Garamond', serif; font-size: 18px; font-style: italic; color: rgba(240,236,224,0.2); }
        .app-list { display: flex; flex-direction: column; gap: 12px; }
        .app-card { background: #0b1929; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; transition: border-color .2s, background .2s; }
        .app-card:hover { border-color: rgba(201,169,74,0.2); background: #0f2035; }
        .app-card-left { flex: 1; min-width: 0; }
        .app-card-name { font-size: 15px; font-weight: 600; color: #f0ece0; margin-bottom: 3px; }
        .app-card-meta { font-size: 12px; color: rgba(240,236,224,0.35); }
        .app-card-date { font-size: 11px; color: rgba(240,236,224,0.25); flex-shrink: 0; }
        .user-table-wrap { overflow-x: auto; }
        .user-table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .user-table th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(240,236,224,0.3); padding: 0 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
        .user-table td { padding: 14px 16px; font-size: 13px; color: rgba(240,236,224,0.7); border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .role-select { font-size: 9px; font-weight: 700; letter-spacing: .1em; padding: 4px 10px; border-radius: 100px; border: 1px solid; text-transform: uppercase; font-family: 'Barlow', sans-serif; background: transparent; cursor: pointer; appearance: none; -webkit-appearance: none; transition: opacity .2s; }
        .role-select:disabled { opacity: 0.5; cursor: wait; }
        .role-select option { background: #0b1929; color: #f0ece0; font-weight: 600; }
        .role-select.admin       { color: #81c784; border-color: rgba(129,199,132,0.3); }
        .role-select.contributor { color: #C9A94A; border-color: rgba(201,169,74,0.3); }
        .role-select.regular     { color: rgba(240,236,224,0.5); border-color: rgba(255,255,255,0.15); }
        .user-status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        .user-status-dot.active   { background: #81c784; }
        .user-status-dot.inactive { background: #e57373; }
        .btn-suspend { background: transparent; border: 1px solid rgba(229,115,115,0.3); color: rgba(229,115,115,0.6); padding: 5px 12px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'Barlow', sans-serif; transition: all .2s; white-space: nowrap; }
        .btn-suspend:hover { border-color: rgba(229,115,115,0.6); color: #e57373; }
        .btn-reactivate { background: transparent; border: 1px solid rgba(129,199,132,0.3); color: rgba(129,199,132,0.6); padding: 5px 12px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'Barlow', sans-serif; transition: all .2s; white-space: nowrap; }
        .btn-reactivate:hover { border-color: rgba(129,199,132,0.6); color: #81c784; }
        .self-tag { font-size: 9px; font-weight: 600; letter-spacing: .08em; color: rgba(240,236,224,0.25); text-transform: uppercase; }
        .art-table-wrap { overflow-x: auto; }
        .art-table { width: 100%; border-collapse: collapse; min-width: 680px; }
        .art-table th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(240,236,224,0.3); padding: 0 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
        .art-table td { padding: 14px 16px; font-size: 13px; color: rgba(240,236,224,0.7); border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .art-title { font-weight: 600; color: #f0ece0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 320px; display: block; }
        .art-status-badge { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 3px 9px; border-radius: 100px; border: 1px solid; white-space: nowrap; }
        .art-reason { font-size: 11px; color: rgba(229,115,115,0.6); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; margin-top: 2px; }
        .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(4,13,24,0.92); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
        .modal { background: #0b1929; border: 1px solid rgba(201,169,74,0.15); border-radius: 14px; width: 100%; max-width: 600px; max-height: 85vh; overflow-y: auto; padding: 32px; }
        .modal-title { font-family: 'EB Garamond', serif; font-size: 24px; color: #f0ece0; margin-bottom: 4px; }
        .modal-title em { font-style: italic; color: #C9A94A; }
        .modal-meta { font-size: 12px; color: rgba(240,236,224,0.35); margin-bottom: 24px; }
        .modal-section { margin-bottom: 20px; }
        .modal-label { font-size: 10px; font-weight: 700; letter-spacing: .12em; color: rgba(240,236,224,0.35); text-transform: uppercase; margin-bottom: 6px; }
        .modal-text { font-size: 14px; color: rgba(240,236,224,0.7); line-height: 1.7; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px 14px; border: 1px solid rgba(255,255,255,0.06); }
        .modal-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 24px 0; }
        .modal-reason-label { font-size: 12px; font-weight: 600; color: rgba(240,236,224,0.5); margin-bottom: 8px; }
        .modal-reason { width: 100%; background: #081422; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #f0ece0; font-family: 'Barlow', sans-serif; resize: vertical; min-height: 80px; outline: none; transition: border-color .2s; }
        .modal-reason:focus { border-color: rgba(201,169,74,0.4); }
        .modal-actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn-approve { flex: 1; background: #C9A94A; border: none; color: #080f1a; padding: 11px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Barlow', sans-serif; transition: background .2s; }
        .btn-approve:hover { background: #b89840; }
        .btn-approve:disabled { opacity: .5; cursor: not-allowed; }
        .btn-reject { flex: 1; background: transparent; border: 1px solid rgba(229,115,115,0.3); color: rgba(229,115,115,0.7); padding: 11px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Barlow', sans-serif; transition: all .2s; }
        .btn-reject:hover { border-color: rgba(229,115,115,0.6); color: #e57373; }
        .btn-reject:disabled { opacity: .5; cursor: not-allowed; }
        .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(240,236,224,0.45); padding: 11px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'Barlow', sans-serif; transition: all .2s; }
        .btn-cancel:hover { border-color: rgba(255,255,255,0.2); color: rgba(240,236,224,0.8); }
        .toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #0f2035; border: 1px solid rgba(201,169,74,0.2); color: #f0ece0; padding: 12px 24px; border-radius: 8px; font-size: 13px; z-index: 300; white-space: nowrap; animation: slideUp .2s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @media (max-width: 768px) {
          .adm-header { padding: 24px 20px 0; }
          .adm-body   { padding: 24px 20px; }
          .adm-tab    { padding: 10px 12px; font-size: 11px; letter-spacing: .04em; }
          .modal      { padding: 24px 20px; }
          .modal-actions { flex-direction: column; }
        }
      `}</style>

      <div className="adm">
        <div className="adm-header">
          <h1 className="adm-title">Admin <em>Panel</em></h1>
          <div className="adm-tabs">
            <button className={`adm-tab${tab === 'applications' ? ' active' : ''}`} onClick={() => setTab('applications')}>
              Applications{applications.length > 0 ? ` (${applications.length})` : ''}
            </button>
            <button className={`adm-tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>Users</button>
            <button className={`adm-tab${tab === 'articles' ? ' active' : ''}`} onClick={() => setTab('articles')}>Articles</button>
            <button className={`adm-tab${tab === 'emails' ? ' active' : ''}`} onClick={() => setTab('emails')}>Emails</button>
            <button className={`adm-tab${tab === 'resources' ? ' active' : ''}`} onClick={() => setTab('resources')}>Resources</button>
            <button className={`adm-tab${tab === 'newsletter' ? ' active' : ''}`} onClick={() => setTab('newsletter')}>Newsletter</button>
          </div>
        </div>

        <div className="adm-body">
          {loading ? (
            <div className="adm-empty">Loading…</div>

          ) : tab === 'applications' ? (
            applications.length === 0 ? (
              <div className="adm-empty">No pending applications</div>
            ) : (
              <div className="app-list">
                {applications.map(app => (
                  <div key={app.id} className="app-card" onClick={() => { setSelected(app); setReason('') }}>
                    <div className="app-card-left">
                      <p className="app-card-name">{app.fullName}</p>
                      <p className="app-card-meta">
                        {app.desiredTitle}
                        {app.churchName ? ` · ${app.churchName}` : ''}
                        {app.location   ? ` · ${app.location}`   : ''}
                      </p>
                    </div>
                    <span className="app-card-date">{new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )

          ) : tab === 'users' ? (
            users.length === 0 ? (
              <div className="adm-empty">No users found</div>
            ) : (
              <div className="user-table-wrap">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Name / Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      const isSelf = u.id === currentUser?.publicMetadata?.dbId || u.email === currentUser?.primaryEmailAddress?.emailAddress
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#f0ece0' }}>{u.displayName ?? '—'}</div>
                            <div style={{ fontSize: 11, color: 'rgba(240,236,224,0.3)', marginTop: 2 }}>{u.email}</div>
                          </td>
                          <td>
                            {isSelf ? (
                              <span className={`role-select ${u.role}`} style={{ cursor: 'default' }}>{u.role}</span>
                            ) : (
                              <select title={`Change role for ${u.displayName ?? u.email}`} className={`role-select ${u.role}`} value={u.role} disabled={roleUpdating === u.id} onChange={e => changeRole(u.id, e.target.value, u.role)}>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            )}
                          </td>
                          <td>
                            <span className={`user-status-dot ${u.isActive ? 'active' : 'inactive'}`} />
                            {u.isActive ? 'Active' : 'Suspended'}
                          </td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            {isSelf ? <span className="self-tag">You</span>
                              : u.isActive
                                ? <button className="btn-suspend" onClick={() => suspend(u.id)}>Suspend</button>
                                : <button className="btn-reactivate" onClick={() => reactivate(u.id)}>Reactivate</button>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )

          ) : tab === 'articles' ? (
            articles.length === 0 ? (
              <div className="adm-empty">No articles yet</div>
            ) : (
              <div className="art-table-wrap">
                <table className="art-table">
                  <thead>
                    <tr><th>Title</th><th>Status</th><th>Published</th><th></th></tr>
                  </thead>
                  <tbody>
                    {articles.map(a => {
                      const s = STATUS_META[a.status]
                      return (
                        <tr key={a.id}>
                          <td><span className="art-title">{a.title}</span></td>
                          <td>
                            <span className="art-status-badge" style={{ color: s.color, borderColor: s.border }}>{s.label}</span>
                            {a.status === 'suspended' && a.suspensionReason && (
                              <span className="art-reason" title={a.suspensionReason}>{a.suspensionReason}</span>
                            )}
                          </td>
                          <td style={{ color: 'rgba(240,236,224,0.3)', fontSize: 12 }}>
                            {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td>
                            {a.status === 'suspended' ? (
                              <button className="btn-reactivate" onClick={() => reinstateArticle(a.id, a.title)}>Reinstate</button>
                            ) : a.status === 'published' ? (
                              <button className="btn-suspend" onClick={() => { setSuspendTarget(a); setSuspendReason('') }}>Suspend</button>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )

          ) : tab === 'resources' ? (
            <AdminResourcesTab />

          ) : tab === 'newsletter' ? (
            <AdminNewsletterTab getToken={getToken} />

          ) : (
            <AdminEmailTab getToken={getToken} />
          )}
        </div>
      </div>

      {/* Application detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="modal">
            <h2 className="modal-title"><em>{selected.fullName}</em></h2>
            <p className="modal-meta">
              {selected.desiredTitle}
              {selected.churchName ? ` · ${selected.churchName}` : ''}
              {selected.location   ? ` · ${selected.location}`   : ''}
              {' · Applied '}{new Date(selected.submittedAt).toLocaleDateString()}
            </p>
            <div className="modal-section">
              <p className="modal-label">Bio</p>
              <p className="modal-text">{selected.bio}</p>
            </div>
            <div className="modal-section">
              <p className="modal-label">Theological Statement</p>
              <p className="modal-text">{selected.theologicalStatement}</p>
            </div>
            {selected.writingSamples && selected.writingSamples.length > 0 && (
              <div className="modal-section">
                <p className="modal-label">Writing Samples</p>
                <div className="modal-text">
                  {selected.writingSamples.map((url, i) => (
                    <div key={i}><a href={url} target="_blank" rel="noopener" style={{ color: '#C9A94A' }}>{url}</a></div>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-divider" />
            <p className="modal-reason-label">
              Note / Reason <span style={{ color: 'rgba(240,236,224,0.3)', fontWeight: 400 }}>(required for rejection)</span>
            </p>
            <textarea className="modal-reason" placeholder="Add a note for the applicant…" value={reason} onChange={e => setReason(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-approve" disabled={actionLoading} onClick={() => approve(selected.id)}>
                {actionLoading ? 'Processing…' : 'Approve'}
              </button>
              <button className="btn-reject" disabled={actionLoading} onClick={() => reject(selected.id)}>Reject</button>
              <button className="btn-cancel" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend article modal */}
      {suspendTarget && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSuspendTarget(null) }}>
          <div className="modal">
            <h2 className="modal-title">Suspend <em>article</em></h2>
            <p className="modal-meta" style={{ marginBottom: 20 }}>"{suspendTarget.title}"</p>
            <p className="modal-reason-label">Reason <span style={{ color: 'rgba(240,236,224,0.3)', fontWeight: 400 }}>(optional)</span></p>
            <textarea className="modal-reason" placeholder="Why is this article being suspended?" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-reject" style={{ flex: 1 }} disabled={suspendLoading} onClick={suspendArticle}>
                {suspendLoading ? 'Suspending…' : 'Suspend article'}
              </button>
              <button className="btn-cancel" onClick={() => setSuspendTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
