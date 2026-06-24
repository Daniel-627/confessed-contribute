// confessed-contribute/src/lib/sanity.ts
// Sanity API helpers — no SDK, raw fetch

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID ?? 'clfxgc6n'
const DATASET    = 'production'
const API_VER    = 'v2021-10-21'
const TOKEN      = import.meta.env.VITE_SANITY_TOKEN ?? ''

const BASE      = `https://${PROJECT_ID}.api.sanity.io/${API_VER}`
const QUERY_URL = `${BASE}/data/query/${DATASET}`
const MUTATE_URL= `${BASE}/data/mutate/${DATASET}`
const ASSET_URL = `${BASE}/assets/files/${DATASET}`

// ── GROQ query ─────────────────────────────────────────────────────────────

export async function sanityQuery<T = unknown>(groq: string): Promise<T> {
  const url = `${QUERY_URL}?query=${encodeURIComponent(groq)}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  if (!res.ok) throw new Error(`Sanity query failed: ${res.status}`)
  const data = await res.json()
  return data.result as T
}

// ── Mutate ─────────────────────────────────────────────────────────────────

export async function sanityMutate(mutations: unknown[]): Promise<void> {
  const res = await fetch(MUTATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mutations }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.description ?? `Sanity mutate failed: ${res.status}`)
  }
}

// ── Upload file asset ──────────────────────────────────────────────────────

export async function uploadAsset(file: File): Promise<string> {
  const res = await fetch(`${ASSET_URL}?filename=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': file.type || 'application/pdf',
    },
    body: file,
  })
  if (!res.ok) throw new Error(`Asset upload failed: ${res.status}`)
  const data = await res.json()
  return data.document._id as string
}

// ── Create resource ────────────────────────────────────────────────────────

export interface ResourceDoc {
  _id:         string
  _createdAt:  string
  title:       string
  description: string
  type:        string
  series:      string | null
  published:   boolean
  fileRef:     string
  fileUrl:     string
}

export async function createResource(payload: {
  title:       string
  description: string
  type:        string
  series:      string | null
  fileAssetId: string
}): Promise<void> {
  await sanityMutate([{
    create: {
      _type:       'resource',
      title:       payload.title,
      description: payload.description,
      type:        payload.type,
      series:      payload.series,
      published:   true,
      file: {
        _type: 'file',
        asset: { _type: 'reference', _ref: payload.fileAssetId },
      },
    },
  }])
}

export async function updateResource(id: string, patch: Partial<{
  title:       string
  description: string
  type:        string
  series:      string | null
  published:   boolean
}>): Promise<void> {
  await sanityMutate([{
    patch: { id, set: patch },
  }])
}

export async function deleteResource(id: string): Promise<void> {
  await sanityMutate([{ delete: { id } }])
}

export async function fetchResources(): Promise<ResourceDoc[]> {
  const groq = `*[_type == "resource"] | order(_createdAt desc) {
    _id, _createdAt, title, description, type, series, published,
    "fileRef": file.asset._ref,
    "fileUrl": file.asset->url
  }`
  return sanityQuery<ResourceDoc[]>(groq)
}