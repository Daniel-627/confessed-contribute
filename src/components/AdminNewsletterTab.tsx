// confessed-contribute/src/components/AdminNewsletterTab.tsx

import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

type Subscriber = {
  id: string
  email: string
  name: string | null
  source: string | null
  isActive: boolean
  subscribedAt: string
}

type Props = { getToken: () => Promise<string | null> }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminNewsletterTab({ getToken }: Props) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [showAll,     setShowAll]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [toast,       setToast]       = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = await getToken()
      const data  = await apiFetch<{ subscribers: Subscriber[]; total: number }>(
        `/newsletter/admin${showAll ? '?active=false' : ''}`, token
      )
      setSubscribers(data.subscribers)
      setTotal(data.total)
    } catch (e: any) {
      showToast('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showAll])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function handleRemove(s: Subscriber) {
    if (!confirm(`Unsubscribe ${s.email}?`)) return
    try {
      const token = await getToken()
      await apiFetch(`/newsletter/admin/${s.id}`, token, { method: 'DELETE' })
      showToast('Unsubscribed')
      load()
    } catch (e: any) {
      showToast('Error: ' + e.message)
    }
  }

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`
        .nl-toprow {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .nl-stat {
          background: #0b1929; border: 1px solid rgba(201,169,74,0.15);
          border-radius: 8px; padding: 14px 20px; flex-shrink: 0;
        }
        .nl-stat-num {
          font-family: 'EB Garamond', serif;
          font-size: 28px; color: #C9A94A; line-height: 1;
        }
        .nl-stat-label {
          font-size: 10px; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: rgba(240,236,224,0.3);
          margin-top: 4px;
        }
        .nl-search {
          flex: 1; min-width: 0;
          background: #081422; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px; padding: 9px 14px;
          font-size: 13px; color: #f0ece0;
          font-family: 'Barlow', sans-serif; outline: none;
          transition: border-color .2s;
        }
        .nl-search:focus { border-color: rgba(201,169,74,0.35); }
        .nl-search::placeholder { color: rgba(240,236,224,0.2); }
        .nl-toggle {
          font-size: 11px; font-weight: 600; letter-spacing: .06em;
          color: rgba(240,236,224,0.35); background: none; border: none;
          cursor: pointer; font-family: 'Barlow', sans-serif; padding: 0;
          transition: color .15s; white-space: nowrap;
        }
        .nl-toggle:hover { color: rgba(240,236,224,0.7); }

        .nl-table-wrap { overflow-x: auto; }
        .nl-table { width: 100%; border-collapse: collapse; min-width: 560px; }
        .nl-table th {
          text-align: left; font-size: 10px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          color: rgba(240,236,224,0.3); padding: 0 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap;
        }
        .nl-table td {
          padding: 13px 16px; font-size: 13px; color: rgba(240,236,224,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle;
        }
        .nl-email { font-weight: 600; color: #f0ece0; display: block; }
        .nl-name  { font-size: 11px; color: rgba(240,236,224,0.3); margin-top: 2px; }
        .nl-source {
          font-size: 9px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; padding: 2px 8px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1); color: rgba(240,236,224,0.3);
        }
        .nl-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          display: inline-block; margin-right: 6px;
        }
        .nl-status-dot.active   { background: #81c784; }
        .nl-status-dot.inactive { background: #e57373; }
        .nl-btn-remove {
          background: transparent; border: 1px solid rgba(229,115,115,0.25);
          color: rgba(229,115,115,0.5); padding: 4px 12px; border-radius: 5px;
          font-size: 11px; font-weight: 600; cursor: pointer;
          font-family: 'Barlow', sans-serif; transition: all .2s; white-space: nowrap;
        }
        .nl-btn-remove:hover { border-color: rgba(229,115,115,0.5); color: #e57373; }

        .nl-empty {
          text-align: center; padding: 64px 0;
          font-family: 'EB Garamond', serif; font-size: 18px;
          font-style: italic; color: rgba(240,236,224,0.2);
        }
        .nl-toast {
          position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
          background: #0f2035; border: 1px solid rgba(201,169,74,0.2);
          color: #f0ece0; padding: 12px 24px; border-radius: 8px;
          font-size: 13px; z-index: 300; white-space: nowrap;
          animation: nlSlide .2s ease; font-family: 'Barlow', sans-serif;
        }
        @keyframes nlSlide {
          from { opacity:0; transform:translateX(-50%) translateY(8px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>

      <div className="nl-toprow">
        <div className="nl-stat">
          <div className="nl-stat-num">{total}</div>
          <div className="nl-stat-label">Active subscribers</div>
        </div>
        <input
          className="nl-search"
          placeholder="Search by email or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="nl-toggle" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Show active only' : 'Show all (incl. unsubscribed)'}
        </button>
      </div>

      {loading ? (
        <div className="nl-empty">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="nl-empty">No subscribers yet.</div>
      ) : (
        <div className="nl-table-wrap">
          <table className="nl-table">
            <thead>
              <tr>
                <th>Email / Name</th>
                <th>Source</th>
                <th>Status</th>
                <th>Subscribed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <span className="nl-email">{s.email}</span>
                    {s.name && <span className="nl-name">{s.name}</span>}
                  </td>
                  <td>
                    <span className="nl-source">{s.source ?? 'website'}</span>
                  </td>
                  <td>
                    <span className={`nl-status-dot ${s.isActive ? 'active' : 'inactive'}`} />
                    {s.isActive ? 'Active' : 'Unsubscribed'}
                  </td>
                  <td style={{ fontSize: 11, color: 'rgba(240,236,224,0.25)' }}>
                    {formatDate(s.subscribedAt)}
                  </td>
                  <td>
                    {s.isActive && (
                      <button className="nl-btn-remove" onClick={() => handleRemove(s)}>
                        Unsubscribe
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className="nl-toast">{toast}</div>}
    </>
  )
}
