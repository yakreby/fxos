/**
 * FxOs API istemcisi — ince fetch sarmalayıcı.
 * Cookie tabanlı auth için `credentials: 'include'` zorunlu.
 * Backend tüm yanıtları Result/Result<T> zarfıyla döndürür.
 *
 * Not: Tam tipli istemci ve hata/notification entegrasyonu Faz 2'de gelişecek.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export interface ApiResult<T = unknown> {
  succeeded: boolean
  message?: string | null
  errors?: string[]
  data?: T
}

/**
 * Global 401 (oturum süresi doldu) işleyicisi. SessionContext açılışta kaydeder;
 * auth uçları (login/me) hariç herhangi bir istek 401 dönerse tetiklenir →
 * oturum temizlenir, router otomatik /login'e düşer.
 */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  // FormData (dosya yükleme) gönderiminde Content-Type'ı tarayıcı (boundary ile) belirler.
  const isForm = init?.body instanceof FormData
  const baseHeaders: Record<string, string> = isForm ? {} : { 'Content-Type': 'application/json' }

  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { ...baseHeaders, ...(init?.headers ?? {}) },
    ...init,
  })

  // Auth uçları kendi 401'ini yönetir (login hatası, me ile oturum yoklama).
  // Diğer her 401: oturum düşmüştür → global işleyiciyi tetikle.
  if (response.status === 401 && !path.startsWith('/auth/')) {
    onUnauthorized?.()
  }

  // Yanıt gövdesi boş olabilir (204 vb.)
  const text = await response.text()
  const body = text ? (JSON.parse(text) as ApiResult<T>) : ({ succeeded: response.ok } as ApiResult<T>)
  return body
}

/** Tam URL üreten yardımcı (ör. dosya indirme bağlantısı). */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`
}

export interface DownloadResult {
  ok: boolean
  status: number
  message?: string
}

/** Content-Disposition başlığından dosya adını çıkarır (filename* önceliklidir). */
function parseFilename(contentDisposition: string): string | null {
  const star = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (star) {
    try { return decodeURIComponent(star[1]) } catch { return star[1] }
  }
  const quoted = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return quoted ? quoted[1] : null
}

/**
 * Bir dosyayı (CSV/Excel/PDF vb.) indirir: cookie-auth ile blob çeker, dosya adını
 * Content-Disposition'dan alır ve tarayıcıda indirmeyi tetikler.
 */
export async function downloadFile(
  path: string,
  params?: Record<string, string | undefined>,
  fallbackName = 'export',
): Promise<DownloadResult> {
  const qs = new URLSearchParams()
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') qs.set(k, v)
    }
  }
  const url = `${BASE_URL}${path}${qs.toString() ? `?${qs.toString()}` : ''}`

  const response = await fetch(url, { credentials: 'include' })
  if (response.status === 401) onUnauthorized?.()

  if (!response.ok) {
    let message: string | undefined
    try {
      const t = await response.text()
      if (t) message = (JSON.parse(t) as ApiResult).message ?? undefined
    } catch { /* gövde okunamadı */ }
    return { ok: false, status: response.status, message }
  }

  const blob = await response.blob()
  const name = parseFilename(response.headers.get('Content-Disposition') ?? '') ?? fallbackName
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objUrl
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objUrl)
  return { ok: true, status: response.status }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }),
  /** Multipart/form-data gönderimi (dosya yükleme). */
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),
  put: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'PUT', body: payload ? JSON.stringify(payload) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
