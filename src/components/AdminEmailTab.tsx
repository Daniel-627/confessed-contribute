// src/components/AdminEmailTab.tsx
//
// Drop this component into Admin.tsx and render it when tab === 'emails'
// Import at top of Admin.tsx:
//   import AdminEmailTab from '../components/AdminEmailTab'
// Add to tab bar:
//   <button className={`adm-tab${tab === 'emails' ? ' active' : ''}`} onClick={() => setTab('emails')}>Emails</button>
// Add to body:
//   ) : tab === 'emails' ? (
//     <AdminEmailTab getToken={getToken} />

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiFetch } from '../lib/api'

type User = {
  id: string
  email: string
  displayName?: string
  role: string
}

const EMAIL_TYPES = [
  { value: 'welcome',                          label: 'Welcome email' },
  { value: 'contributor_approved',             label: 'Contributor approved' },
  { value: 'contributor_rejected',             label: 'Contributor rejected' },
  { value: 'contributor_application_received', label: 'Application received' },
  { value: 'custom',                           label: 'Custom message' },
]

type Props = { getToken: () => Promise<string | null> }

export default function AdminEmailTab({ getToken }: Props) {
  const [users,       setUsers]       = useState<User[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [emailType,   setEmailType]   = useState('welcome')
  const [subject,     setSubject]     = useState('')
  const [body,        setBody]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [result,      setResult]      = useState<{ sent: number; failed: number } | null>(null)
  const [search,      setSearch]      = useState('')

  useEffect(() => {
    ;(async () => {
      const token = await getToken()
      const data  = await apiFetch<{ users: User[] }>('/admin/users', token)
      setUsers(data.users)
      setLoading(false)
    })()
  }, [])

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function toggleUser(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(u => u.id)))
    }
  }

  async function send() {
    if (!selected.size) return
    if (emailType === 'custom' && (!subject.trim() || !body.trim())) return
    setSending(true)
    setResult(null)
    try {
      const token = await getToken()
      const res   = await apiFetch<{ sent: number; failed: number }>('/admin/send-email', token, {
        method: 'POST',
        body: JSON.stringify({
          userIds: Array.from(selected),
          type:    emailType,
          subject: subject.trim() || undefined,
          body:    body.trim()    || undefined,
        }),
      })
      setResult(res)
      setSelected(new Set())
    } catch (e: any) {
      setResult({ sent: 0, failed: selected.size })
    } finally {
      setSending(false)
    }
  }

  const isCustom = emailType === 'custom'

  return (
    <>
      <style>{`
        .et-wrap { display: grid; grid-template-columns: 1fr 360px; gap: 32px; }

        /* User list */
        .et-list-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .et-search {
          flex: 1; min-width: 0;
          background: #081422; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 9px 14px;
          font-size: 13px; color: #f0ece0;
          font-family: 'Barlow', sans-serif; outline: none;
          transition: border-color .2s;
        }
        .et-search:focus { border-color: rgba(201,169,74,0.35); }
        .et-search::placeholder { color: rgba(240,236,224,0.2); }
        .et-select-all {
          font-size: 11px; font-weight: 600; letter-spacing: .06em;
          color: rgba(201,169,74,0.6); background: none; border: none;
          cursor: pointer; font-family: 'Barlow', sans-serif;
          white-space: nowrap; padding: 0;
          transition: color .15s;
        }
        .et-select-all:hover { color: #C9A94A; }

        .et-table-wrap { overflow-x: auto; }
        .et-table { width: 100%; border-collapse: collapse; }
        .et-table th {
          text-align: left; font-size: 10px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          color: rgba(240,236,224,0.3); padding: 0 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .et-table td {
          padding: 12px 16px; font-size: 13px;
          color: rgba(240,236,224,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .et-table tr.selected td { background: rgba(201,169,74,0.04); }
        .et-table tr:hover td { background: rgba(255,255,255,0.02); cursor: pointer; }
        .et-checkbox {
          width: 16px; height: 16px;
          accent-color: #C9A94A; cursor: pointer;
        }
        .et-name { font-weight: 600; color: #f0ece0; }
        .et-email { font-size: 11px; color: rgba(240,236,224,0.3); margin-top: 2px; }
        .et-role {
          font-size: 9px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; padding: 2px 8px;
          border-radius: 100px; border: 1px solid; white-space: nowrap;
        }
        .et-role.admin       { color: #81c784; border-color: rgba(129,199,132,0.3); }
        .et-role.contributor { color: #C9A94A; border-color: rgba(201,169,74,0.3); }
        .et-role.regular     { color: rgba(240,236,224,0.4); border-color: rgba(255,255,255,0.12); }

        /* Compose panel */
        .et-compose {
          background: #0b1929;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 24px;
          display: flex; flex-direction: column; gap: 18px;
          align-self: start;
          position: sticky; top: 24px;
        }
        .et-compose-title {
          font-family: 'EB Garamond', serif;
          font-size: 18px; color: #f0ece0;
        }
        .et-compose-title em { font-style: italic; color: #C9A94A; }
        .et-label {
          font-size: 10px; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: rgba(240,236,224,0.35);
          margin-bottom: 7px; display: block;
        }
        .et-select, .et-input, .et-textarea {
          width: 100%; background: #081422;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 10px 14px;
          font-size: 13px; color: #f0ece0;
          font-family: 'Barlow', sans-serif; outline: none;
          transition: border-color .2s; box-sizing: border-box;
          caret-color: #C9A94A;
        }
        .et-select:focus, .et-input:focus, .et-textarea:focus {
          border-color: rgba(201,169,74,0.4);
        }
        .et-select option { background: #0b1929; }
        .et-textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
        .et-input::placeholder, .et-textarea::placeholder {
          color: rgba(240,236,224,0.2);
        }

        .et-selected-count {
          font-size: 12px; color: rgba(240,236,224,0.35);
          padding: 8px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px; text-align: center;
        }
        .et-selected-count strong { color: #C9A94A; }

        .et-send-btn {
          width: 100%; background: #C9A94A; border: none; color: #080f1a;
          padding: 12px; border-radius: 8px;
          font-size: 13px; font-weight: 700; letter-spacing: .06em;
          cursor: pointer; font-family: 'Barlow', sans-serif;
          transition: background .2s;
        }
        .et-send-btn:hover { background: #b89840; }
        .et-send-btn:disabled { opacity: .45; cursor: not-allowed; }

        .et-result {
          font-size: 12px; text-align: center;
          padding: 10px; border-radius: 6px;
        }
        .et-result.ok {
          color: #81c784; background: rgba(129,199,132,0.06);
          border: 1px solid rgba(129,199,132,0.2);
        }
        .et-result.err {
          color: #e57373; background: rgba(229,115,115,0.06);
          border: 1px solid rgba(229,115,115,0.2);
        }

        .et-empty {
          text-align: center; padding: 60px 0;
          font-family: 'EB Garamond', serif; font-size: 17px;
          font-style: italic; color: rgba(240,236,224,0.2);
        }

        @media (max-width: 900px) {
          .et-wrap { grid-template-columns: 1fr; }
          .et-compose { position: static; }
        }
      `}</style>

      <div className="et-wrap">
        {/* User list */}
        <div>
          <div className="et-list-header">
            <input
              className="et-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="et-select-all" onClick={toggleAll}>
              {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {loading ? (
            <div className="et-empty">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="et-empty">No users found</div>
          ) : (
            <div className="et-table-wrap">
              <table className="et-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Name / Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr
                      key={u.id}
                      className={selected.has(u.id) ? 'selected' : ''}
                      onClick={() => toggleUser(u.id)}
                    >
                      <td>
                        <input
                          title={`Select ${u.displayName ?? u.email}`}
                          type="checkbox"
                          className="et-checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleUser(u.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <div className="et-name">{u.displayName ?? '—'}</div>
                        <div className="et-email">{u.email}</div>
                      </td>
                      <td>
                        <span className={`et-role ${u.role}`}>{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Compose panel */}
        <div className="et-compose">
          <h2 className="et-compose-title">Send <em>email</em></h2>

          <div>
            <label className="et-label">Email type</label>
            <select
              title="Select email type"
              className="et-select"
              value={emailType}
              onChange={e => setEmailType(e.target.value)}
            >
              {EMAIL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {isCustom && (
            <>
              <div>
                <label className="et-label">Subject</label>
                <input
                  className="et-input"
                  placeholder="Email subject…"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="et-label">Message</label>
                <textarea
                  className="et-textarea"
                  placeholder="Write your message here…"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="et-selected-count">
            <strong>{selected.size}</strong> recipient{selected.size !== 1 ? 's' : ''} selected
          </div>

          {result && (
            <div className={`et-result ${result.failed === 0 ? 'ok' : 'err'}`}>
              {result.sent} sent · {result.failed} failed
            </div>
          )}

          <button
            className="et-send-btn"
            disabled={sending || !selected.size || (isCustom && (!subject.trim() || !body.trim()))}
            onClick={send}
          >
            {sending ? 'Sending…' : `Send to ${selected.size || 0} recipient${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </>
  )
}
