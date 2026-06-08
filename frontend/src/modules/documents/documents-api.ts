import { api, apiUrl, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

export type DocumentType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 99

/** Belge türü seçenekleri (form dropdown'u; backend enum ile birebir). */
export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 0, label: 'Kimlik Fotokopisi' },
  { value: 1, label: 'İş Sözleşmesi' },
  { value: 2, label: 'Diploma' },
  { value: 3, label: 'Sağlık Raporu' },
  { value: 4, label: 'Adli Sicil Kaydı' },
  { value: 5, label: 'İkametgah' },
  { value: 6, label: 'Vesikalık Fotoğraf' },
  { value: 7, label: 'Sertifika' },
  { value: 99, label: 'Diğer' },
]

export interface Doc {
  id: string
  personnelId: string
  title: string
  type: DocumentType
  typeLabel: string
  issueDate: string | null
  expiryDate: string | null
  notes: string | null
  fileName: string
  contentType: string
  fileSizeBytes: number
  createdAt: string
  isExpired: boolean
  daysToExpiry: number | null
}

export interface UpdateDocumentPayload {
  title: string
  type: DocumentType
  issueDate?: string | null
  expiryDate?: string | null
  notes?: string | null
}

/* ---- Uçlar ---- */

export function listDocuments(personnelId: string): Promise<ApiResult<Doc[]>> {
  return api.get<Doc[]>(`/personnel/${personnelId}/documents`)
}

export function uploadDocument(personnelId: string, form: FormData): Promise<ApiResult<string>> {
  return api.postForm<string>(`/personnel/${personnelId}/documents`, form)
}

export function updateDocument(id: string, payload: UpdateDocumentPayload): Promise<ApiResult> {
  return api.put(`/documents/${id}`, payload)
}

export function deleteDocument(id: string): Promise<ApiResult> {
  return api.delete(`/documents/${id}`)
}

/** Dosya indirme bağlantısı (tarayıcı cookie ile aynı origin'den indirir). */
export function documentDownloadUrl(id: string): string {
  return apiUrl(`/documents/${id}/download`)
}
