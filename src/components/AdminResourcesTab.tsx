// confessed-contribute/src/components/AdminResourcesTab.tsx
import { useEffect, useRef, useState } from 'react'
import {
  fetchResources, createResource, updateResource,
  deleteResource, uploadAsset,
  type ResourceDoc,
} from '../lib/sanity'

const TYPE_OPTIONS = [
  { value: 'pdf_study_guide', label: 'PDF Study Guide' },
  { value: 'confession_text', label: 'Confession Text' },
  { value: 'sermon_outline',  label: 'Sermon Outline' },
  { value: 'curriculum_pack', label: 'Curriculum Pack' },
]

const SERIES_OPTIONS = [
  { value: 'articles-of-faith',   label: 'Articles of Faith' },
  { value: 'the-1689-project',    label: 'The 1689 Project' },
  { value: 'iron-and-ink',        label: 'Iron & Ink' },
  { value: 'other-paths',         label: 'Other Paths' },
  { value: 'reasoned-grace',      label: 'Reasoned Grace' },
  { value: 'the-particular-path', label: 'The Particular Path' },
  { value: 'daily-office',        label: 'Daily Office' },
  { value: 'consistent-truth',    label: 'Consistent Truth' },
  { value: null,                  label: 'General (no series)' },
]

const TYPE_LABELS: Record<string, string> = {
  pdf_study_guide: 'PDF Study Guide',
  confession_text: 'Confession Text',
  sermon_outline:  'Sermon Outline',
  curriculum_pack: 'Curriculum Pack',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminResourcesTab() {
  const [resources,  setResources]  = useState<ResourceDoc[]>([])
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const [file,        setFile]        = useState<File | null>(null)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [resType,     setResType]     = useState('pdf_study_guide')
  const [series,      setSeries]      = useState<string | null>(null)
  const [uploading,   setUploading]   = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try { setResources(await fetchResources()) }
    catch { showToast('Failed to load resources') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function resetForm() {
    setFile(null); setTitle(''); setDescription('')
    setResType('pdf_study_guide'); setSeries(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleUpload() {
    if (!file || !title.trim()) return
    setUploading(true)
    try {
      const assetId = await uploadAsset(file)
      await createResource({ title: title.trim(), description: description.trim(), type: resType, series, fileAssetId: assetId })
      showToast('Resource uploaded and published')
      resetForm()
      setShowUpload(false)
      load()
    } catch (e: any) {
      showToast('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleToggle(r: ResourceDoc) {
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
      showToast('Deleted')
      load()
    } catch { showToast('Delete failed') }
  }

  return (
    <>
      <style>{`
        .rt-toprow { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
        .rt-count { font-size:12px;color:rgba(240,236,224,0.3); }
        .rt-upload-btn { background:#C9A94A;border:none;color:#080f1a;padding:9px 20px;border-radius:7px;font-size:12px;font-weight:700;letter-spacing:.06em;cursor:pointer;font-family:'Barlow',sans-serif;transition:background .2s; }
        .rt-upload-btn:hover { background:#b89840; }
        .rt-panel { background:#0b1929;border:1px solid rgba(201,169,74,0.15);border-radius:12px;padding:28px;margin-bottom:28px;display:flex;flex-direction:column;gap:16px; }
        .rt-panel-title { font-family:'EB Garamond',serif;font-size:18px;color:#f0ece0; }
        .rt-panel-title em { font-style:italic;color:#C9A94A; }
        .rt-drop-zone { border:1.5px dashed rgba(201,169,74,0.25);border-radius:8px;padding:32px 20px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s; }
        .rt-drop-zone:hover { border-color:rgba(201,169,74,0.5);background:rgba(201,169,74,0.04); }
        .rt-drop-zone.has-file { border-color:rgba(129,199,132,0.4);background:rgba(129,199,132,0.04); }
        .rt-drop-text { font-size:13px;color:rgba(240,236,224,0.4);font-family:'Barlow',sans-serif; }
        .rt-drop-file { font-size:12px;color:#81c784;margin-top:6px;font-family:'Barlow',sans-serif; }
        .rt-file-input { display:none; }
        .rt-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
        .rt-label { font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(240,236,224,0.35);margin-bottom:7px;display:block; }
        .rt-input,.rt-select,.rt-textarea { width:100%;background:#081422;border:1px solid rgba(255,255,255,0.08);border-radius:7px;padding:10px 14px;font-size:13px;color:#f0ece0;font-family:'Barlow',sans-serif;outline:none;transition:border-color .2s;box-sizing:border-box;caret-color:#C9A94A; }
        .rt-input:focus,.rt-select:focus,.rt-textarea:focus { border-color:rgba(201,169,74,0.4); }
        .rt-input::placeholder,.rt-textarea::placeholder { color:rgba(240,236,224,0.2); }
        .rt-select option { background:#0b1929; }
        .rt-textarea { resize:vertical;min-height:72px;line-height:1.5; }
        .rt-panel-actions { display:flex;gap:10px;margin-top:4px; }
        .rt-submit-btn { background:#C9A94A;border:none;color:#080f1a;padding:10px 24px;border-radius:7px;font-size:13px;font-weight:700;letter-spacing:.06em;cursor:pointer;font-family:'Barlow',sans-serif;transition:background .2s; }
        .rt-submit-btn:hover { background:#b89840; }
        .rt-submit-btn:disabled { opacity:.5;cursor:not-allowed; }
        .rt-cancel-btn { background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(240,236,224,0.45);padding:10px 20px;border-radius:7px;font-size:13px;cursor:pointer;font-family:'Barlow',sans-serif;transition:all .2s; }
        .rt-cancel-btn:hover { border-color:rgba(255,255,255,0.2);color:rgba(240,236,224,0.8); }
        .rt-table-wrap { overflow-x:auto; }
        .rt-table { width:100%;border-collapse:collapse;min-width:680px; }
        .rt-table th { text-align:left;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(240,236,224,0.3);padding:0 14px 12px;border-bottom:1px solid rgba(255,255,255,0.06);white-space:nowrap; }
        .rt-table td { padding:13px 14px;font-size:13px;color:rgba(240,236,224,0.7);border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle; }
        .rt-title { font-weight:600;color:#f0ece0;display:block;margin-bottom:2px; }
        .rt-desc { font-size:11px;color:rgba(240,236,224,0.25); }
        .rt-type-badge { font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 8px;border-radius:100px;border:1px solid rgba(201,169,74,0.25);color:rgba(201,169,74,0.6);white-space:nowrap; }
        .rt-pub-badge { font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:100px;border:1px solid;white-space:nowrap; }
        .rt-pub-badge.pub { color:#81c784;border-color:rgba(129,199,132,0.3); }
        .rt-pub-badge.draft { color:rgba(240,236,224,0.3);border-color:rgba(255,255,255,0.1); }
        .rt-actions { display:flex;gap:6px;flex-wrap:wrap; }
        .rt-btn-toggle { background:transparent;border:1px solid rgba(201,169,74,0.25);color:rgba(201,169,74,0.6);padding:4px 11px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Barlow',sans-serif;transition:all .2s;white-space:nowrap; }
        .rt-btn-toggle:hover { border-color:rgba(201,169,74,0.5);color:#C9A94A; }
        .rt-btn-view { background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(240,236,224,0.4);padding:4px 11px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Barlow',sans-serif;text-decoration:none;transition:all .2s;white-space:nowrap;display:inline-block; }
        .rt-btn-view:hover { border-color:rgba(255,255,255,0.2);color:#f0ece0; }
        .rt-btn-del { background:transparent;border:1px solid rgba(229,115,115,0.25);color:rgba(229,115,115,0.5);padding:4px 11px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Barlow',sans-serif;transition:all .2s;white-space:nowrap; }
        .rt-btn-del:hover { border-color:rgba(229,115,115,0.5);color:#e57373; }
        .rt-empty { text-align:center;padding:64px 0;font-family:'EB Garamond',serif;font-size:18px;font-style:italic;color:rgba(240,236,224,0.2); }
        .rt-toast { position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#0f2035;border:1px solid rgba(201,169,74,0.2);color:#f0ece0;padding:12px 24px;border-radius:8px;font-size:13px;z-index:300;white-space:nowrap;animation:rtSlide .2s ease;font-family:'Barlow',sans-serif; }
        @keyframes rtSlide { from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @media(max-width:640px){.rt-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="rt-toprow">
        <span className="rt-count">{resources.length} resource{resources.length !== 1 ? 's' : ''}</span>
        <button className="rt-upload-btn" onClick={() => setShowUpload(v => !v)}>
          {showUpload ? 'Cancel' : '+ Upload resource'}
        </button>
      </div>

      {showUpload && (
        <div className="rt-panel">
          <h3 className="rt-panel-title">Upload <em>resource</em></h3>
          <div
            className={`rt-drop-zone${file ? ' has-file' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            <p className="rt-drop-text">{file ? '' : 'Click to select a PDF'}</p>
            {file && <p className="rt-drop-file">{file.name}</p>}
            <input title="File" ref={fileRef} type="file" accept=".pdf" className="rt-file-input"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="rt-label">Title *</label>
            <input className="rt-input" placeholder="Resource title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="rt-label">Description</label>
            <textarea className="rt-textarea" placeholder="Brief description…" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="rt-grid">
            <div>
              <label className="rt-label">Type *</label>
              <select title="Type" className="rt-select" value={resType} onChange={e => setResType(e.target.value)}>
                {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="rt-label">Series</label>
              <select title="Series" className="rt-select" value={series ?? ''} onChange={e => setSeries(e.target.value || null)}>
                {SERIES_OPTIONS.map(s => <option key={String(s.value)} value={s.value ?? ''}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="rt-panel-actions">
            <button className="rt-submit-btn" disabled={uploading || !file || !title.trim()} onClick={handleUpload}>
              {uploading ? 'Uploading…' : 'Upload & publish'}
            </button>
            <button className="rt-cancel-btn" onClick={() => { setShowUpload(false); resetForm() }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rt-empty">Loading…</div>
      ) : resources.length === 0 ? (
        <div className="rt-empty">No resources yet. Upload your first one.</div>
      ) : (
        <div className="rt-table-wrap">
          <table className="rt-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Series</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => {
                const seriesLabel = SERIES_OPTIONS.find(s => s.value === r.series)?.label ?? r.series ?? 'General'
                return (
                  <tr key={r._id}>
                    <td>
                      <span className="rt-title">{r.title}</span>
                      {r.description && <span className="rt-desc">{r.description.slice(0, 60)}{r.description.length > 60 ? '…' : ''}</span>}
                    </td>
                    <td><span className="rt-type-badge">{TYPE_LABELS[r.type] ?? r.type}</span></td>
                    <td style={{ fontSize: 12, color: 'rgba(240,236,224,0.4)' }}>{seriesLabel}</td>
                    <td>
                      <span className={`rt-pub-badge${r.published ? ' pub' : ' draft'}`}>
                        {r.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'rgba(240,236,224,0.25)' }}>{formatDate(r._createdAt)}</td>
                    <td>
                      <div className="rt-actions">
                        <button className="rt-btn-toggle" onClick={() => handleToggle(r)}>
                          {r.published ? 'Unpublish' : 'Publish'}
                        </button>
                        {r.fileUrl && <a className="rt-btn-view" href={r.fileUrl} target="_blank" rel="noopener">View</a>}
                        <button className="rt-btn-del" onClick={() => handleDelete(r)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {toast && <div className="rt-toast">{toast}</div>}
    </>
  )
}
