// confessed-contribute/src/components/AdminResourcesTab.tsx

import { useEffect, useRef, useState } from 'react'
import {
  fetchResources, createResource, updateResource,
  deleteResource, uploadAsset,
  type ResourceDoc,
} from '../lib/sanity'

const TYPES = [
  { value: 'study-guide',     label: 'Study Guide' },
  { value: 'confession-text', label: 'Confession Text' },
  { value: 'sermon-outline',  label: 'Sermon Outline' },
  { value: 'curriculum-pack', label: 'Curriculum Pack' },
]

const SERIES = [
  { value: '',                  label: '— No series —' },
  { value: 'articles-of-faith',   label: 'Articles of Faith' },
  { value: 'the-1689-project',    label: 'The 1689 Project' },
  { value: 'iron-and-ink',        label: 'Iron & Ink' },
  { value: 'other-paths',         label: 'Other Paths' },
  { value: 'reasoned-grace',      label: 'Reasoned Grace' },
  { value: 'the-particular-path', label: 'The Particular Path' },
  { value: 'daily-office',        label: 'Daily Office' },
  { value: 'consistent-truth',    label: 'Consistent Truth' },
]

type Modal = 'new' | { doc: ResourceDoc } | null

export default function AdminResourcesTab() {
  const [resources, setResources] = useState<ResourceDoc[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<Modal>(null)
  const [toast,     setToast]     = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try { setResources(await fetchResources()) }
    catch { showToast('Failed to load resources') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function togglePublish(r: ResourceDoc) {
    try {
      await updateResource(r._id, { published: !r.published })
      showToast(r.published ? 'Unpublished' : 'Published')
      load()
    } catch { showToast('Failed to update') }
  }

  async function handleDelete(r: ResourceDoc) {
    if (!confirm(`Delete "${r.title}"? This cannot be undone.`)) return
    try {
      await deleteResource(r._id)
      showToast('Resource deleted')
      load()
    } catch { showToast('Failed to delete') }
  }

  return (
    <>
      <style>{`
        .rt-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .rt-add-btn {
          background: #C9A94A; border: none; color: #080f1a;
          padding: 9px 20px; border-radius: 6px;
          font-size: 12px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; cursor: pointer;
          font-family: 'Barlow', sans-serif; transition: background .2s;
        }
        .rt-add-btn:hover { background: #b89840; }

        .rt-empty {
          text-align: center; padding: 64px 0;
          font-family: 'EB Garamond', serif; font-size: 18px;
          font-style: italic; color: rgba(240,236,224,0.2);
        }

        .rt-table-wrap { overflow-x: auto; }
        .rt-table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .rt-table th {
          text-align: left; font-size: 10px; font-weight: 700;
          letter-spacing: .12em; text-transform: uppercase;
          color: rgba(240,236,224,0.3); padding: 0 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap;
        }
        .rt-table td {
          padding: 14px 16px; font-size: 13px; color: rgba(240,236,224,0.7);
          border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle;
        }
        .rt-title { font-weight: 600; color: #f0ece0; display: block; margin-bottom: 2px; }
        .rt-desc  { font-size: 11px; color: rgba(240,236,224,0.3); }

        .rt-type-badge {
          font-size: 9px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; padding: 3px 8px; border-radius: 100px;
          border: 1px solid rgba(201,169,74,0.25); color: rgba(201,169,74,0.6);
          white-space: nowrap;
        }
        .rt-pub-badge {
          font-size: 9px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; padding: 3px 8px; border-radius: 100px;
          white-space: nowrap;
        }
        .rt-pub-badge.pub   { color: #81c784; border: 1px solid rgba(129,199,132,0.3); }
        .rt-pub-badge.draft { color: rgba(240,236,224,0.3); border: 1px solid rgba(255,255,255,0.1); }

        .rt-actions { display: flex; gap: 8px; flex-wrap: nowrap; }
        .rt-btn {
          background: transparent; font-size: 11px; font-weight: 600;
          padding: 5px 12px; border-radius: 5px; cursor: pointer;
          font-family: 'Barlow', sans-serif; transition: all .2s; white-space: nowrap;
        }
        .rt-btn-edit   { border: 1px solid rgba(255,255,255,0.1); color: rgba(240,236,224,0.5); }
        .rt-btn-edit:hover { border-color: rgba(255,255,255,0.25); color: #f0ece0; }
        .rt-btn-pub    { border: 1px solid rgba(129,199,132,0.3); color: rgba(129,199,132,0.6); }
        .rt-btn-pub:hover { border-color: rgba(129,199,132,0.6); color: #81c784; }
        .rt-btn-unpub  { border: 1px solid rgba(240,236,224,0.15); color: rgba(240,236,224,0.4); }
        .rt-btn-unpub:hover { border-color: rgba(240,236,224,0.3); color: rgba(240,236,224,0.7); }
        .rt-btn-del    { border: 1px solid rgba(229,115,115,0.3); color: rgba(229,115,115,0.6); }
        .rt-btn-del:hover { border-color: rgba(229,115,115,0.6); color: #e57373; }
      `}</style>

      <div className="rt-header">
        <span /> {/* spacer */}
        <button className="rt-add-btn" onClick={() => setModal('new')}>
          + Add resource
        </button>
      </div>

      {loading ? (
        <div className="rt-empty">Loading…</div>
      ) : resources.length === 0 ? (
        <div className="rt-empty">No resources yet. Add your first one.</div>
      ) : (
        <div className="rt-table-wrap">
          <table className="rt-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Series</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => (
                <tr key={r._id}>
                  <td>
                    <span className="rt-title">{r.title}</span>
                    {r.description && <span className="rt-desc">{r.description.slice(0, 60)}{r.description.length > 60 ? '…' : ''}</span>}
                  </td>
                  <td>
                    <span className="rt-type-badge">
                      {TYPES.find(t => t.value === r.type)?.label ?? r.type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'rgba(240,236,224,0.35)' }}>
                    {SERIES.find(s => s.value === r.series)?.label ?? '—'}
                  </td>
                  <td>
                    <span className={`rt-pub-badge ${r.published ? 'pub' : 'draft'}`}>
                      {r.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="rt-actions">
                      <button className="rt-btn rt-btn-edit" onClick={() => setModal({ doc: r })}>Edit</button>
                      <button
                        className={`rt-btn ${r.published ? 'rt-btn-unpub' : 'rt-btn-pub'}`}
                        onClick={() => togglePublish(r)}
                      >
                        {r.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="rt-btn rt-btn-del" onClick={() => handleDelete(r)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ResourceModal
          doc={modal === 'new' ? null : modal.doc}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); showToast(modal === 'new' ? 'Resource added' : 'Resource updated') }}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#0f2035', border: '1px solid rgba(201,169,74,0.2)',
          color: '#f0ece0', padding: '12px 24px', borderRadius: 8,
          fontSize: 13, zIndex: 300, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

function ResourceModal({
  doc, onClose, onSaved,
}: {
  doc: ResourceDoc | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !doc
  const fileRef = useRef<HTMLInputElement>(null)

  const [title,       setTitle]       = useState(doc?.title ?? '')
  const [description, setDescription] = useState(doc?.description ?? '')
  const [type,        setType]        = useState(doc?.type ?? 'study-guide')
  const [series,      setSeries]      = useState(doc?.series ?? '')
  const [file,        setFile]        = useState<File | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (isNew && !file)  { setError('Please select a PDF file'); return }
    setSaving(true)
    setError(null)
    try {
      if (isNew && file) {
        const assetId = await uploadAsset(file)
        await createResource({
          title: title.trim(),
          description: description.trim(),
          type,
          series: series || null,
          fileAssetId: assetId,
        })
      } else if (doc) {
        await updateResource(doc._id, {
          title: title.trim(),
          description: description.trim(),
          type,
          series: series || null,
        })
      }
      onSaved()
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        .rm-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(4,13,24,0.92); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .rm-modal {
          background: #0b1929; border: 1px solid rgba(201,169,74,0.15);
          border-radius: 14px; width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto; padding: 32px;
        }
        .rm-title { font-family: 'EB Garamond', serif; font-size: 22px; color: #f0ece0; margin-bottom: 24px; }
        .rm-title em { font-style: italic; color: #C9A94A; }
        .rm-label {
          font-size: 10px; font-weight: 700; letter-spacing: .14em;
          text-transform: uppercase; color: rgba(240,236,224,0.35);
          margin-bottom: 7px; display: block;
        }
        .rm-field { margin-bottom: 18px; }
        .rm-input, .rm-select, .rm-textarea {
          width: 100%; background: #081422;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          padding: 10px 14px; font-size: 13px; color: #f0ece0;
          font-family: 'Barlow', sans-serif; outline: none;
          transition: border-color .2s; box-sizing: border-box;
          caret-color: #C9A94A;
        }
        .rm-input:focus, .rm-select:focus, .rm-textarea:focus { border-color: rgba(201,169,74,0.4); }
        .rm-select { cursor: pointer; }
        .rm-select option { background: #0b1929; }
        .rm-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
        .rm-file-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(240,236,224,0.6); padding: 9px 16px; border-radius: 6px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: 'Barlow', sans-serif; transition: all .2s;
        }
        .rm-file-btn:hover { border-color: rgba(201,169,74,0.3); color: #f0ece0; }
        .rm-file-name { font-size: 11px; color: rgba(240,236,224,0.35); margin-top: 6px; }
        .rm-error { font-size: 12px; color: #e57373; margin-bottom: 16px; padding: 8px 12px; background: rgba(229,115,115,0.06); border: 1px solid rgba(229,115,115,0.2); border-radius: 6px; }
        .rm-actions { display: flex; gap: 10px; margin-top: 24px; }
        .rm-save {
          flex: 1; background: #C9A94A; border: none; color: #080f1a;
          padding: 11px; border-radius: 8px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: 'Barlow', sans-serif; transition: background .2s;
        }
        .rm-save:hover { background: #b89840; }
        .rm-save:disabled { opacity: .5; cursor: not-allowed; }
        .rm-cancel {
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: rgba(240,236,224,0.45); padding: 11px 20px; border-radius: 8px;
          font-size: 13px; cursor: pointer; font-family: 'Barlow', sans-serif;
        }
        .rm-cancel:hover { border-color: rgba(255,255,255,0.2); color: rgba(240,236,224,0.8); }
      `}</style>

      <div className="rm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="rm-modal">
          <h2 className="rm-title">{isNew ? <>Add <em>resource</em></> : <>Edit <em>resource</em></>}</h2>

          <div className="rm-field">
            <label className="rm-label">Title *</label>
            <input className="rm-input" placeholder="Resource title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="rm-field">
            <label className="rm-label">Description</label>
            <textarea className="rm-textarea" placeholder="Brief description…" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="rm-field">
            <label className="rm-label">Type *</label>
            <select title="Select a type" className="rm-select" value={type} onChange={e => setType(e.target.value)}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="rm-field">
            <label className="rm-label">Series</label>
            <select title="Select a series" className="rm-select" value={series} onChange={e => setSeries(e.target.value)}>
              {SERIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {isNew && (
            <div className="rm-field">
              <label className="rm-label">PDF File *</label>
              <input
                title="Choose PDF file"
                ref={fileRef} type="file" accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <button className="rm-file-btn" onClick={() => fileRef.current?.click()}>
                Choose PDF
              </button>
              {file && <p className="rm-file-name">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
            </div>
          )}

          {error && <p className="rm-error">{error}</p>}

          <div className="rm-actions">
            <button className="rm-save" onClick={handleSave} disabled={saving}>
              {saving ? (isNew ? 'Uploading…' : 'Saving…') : (isNew ? 'Upload & save' : 'Save changes')}
            </button>
            <button className="rm-cancel" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}
