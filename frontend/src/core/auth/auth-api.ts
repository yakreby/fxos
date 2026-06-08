import { api, type ApiResult } from '../api/client'

/** Backend UserDto karşılığı (api/auth/me ve login yanıtı). */
export interface ApiUser {
  id: string
  email: string
  fullName: string | null
  roles: string[]
  permissions: string[]
}

export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

/** Giriş yapar; başarılıysa HttpOnly cookie set edilir, kullanıcı döner. */
export function login(payload: LoginPayload): Promise<ApiResult<ApiUser>> {
  return api.post<ApiUser>('/auth/login', {
    email: payload.email,
    password: payload.password,
    rememberMe: payload.rememberMe ?? true,
  })
}

/** Oturumu kapatır (cookie temizlenir). */
export function logout(): Promise<ApiResult> {
  return api.post('/auth/logout')
}

/** Aktif oturumun kullanıcısını döner; oturum yoksa succeeded=false (401). */
export function me(): Promise<ApiResult<ApiUser>> {
  return api.get<ApiUser>('/auth/me')
}
