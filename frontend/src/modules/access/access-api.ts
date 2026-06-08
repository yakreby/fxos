import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

export interface AccessUser {
  id: string
  email: string
  fullName: string | null
  isActive: boolean
  roles: string[]
  createdAt?: string
}

export interface RoleListItem {
  id: string
  name: string
  description: string | null
  permissionCount: number
  isSystem: boolean
}

export interface RoleDetail {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: string[]
}

export interface PermissionItem {
  key: string
  label: string
}

export interface PermissionGroup {
  module: string
  moduleLabel: string
  items: PermissionItem[]
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface CreateUserPayload {
  email: string
  password: string
  fullName?: string
  isActive: boolean
  roles: string[]
}

export interface UpdateUserPayload {
  fullName?: string
  isActive: boolean
  roles: string[]
}

export interface CreateRolePayload {
  name: string
  description?: string
  permissions: string[]
}

export interface UpdateRolePayload {
  description?: string
  permissions: string[]
}

/* ---- Users ---- */

export interface UserListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
}

export function listUsers(query: UserListQuery): Promise<ApiResult<Paged<AccessUser>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  return api.get<Paged<AccessUser>>(`/users?${p.toString()}`)
}
export function createUser(payload: CreateUserPayload): Promise<ApiResult<AccessUser>> {
  return api.post<AccessUser>('/users', payload)
}
export function updateUser(id: string, payload: UpdateUserPayload): Promise<ApiResult> {
  return api.put(`/users/${id}`, payload)
}
export function deleteUser(id: string): Promise<ApiResult> {
  return api.delete(`/users/${id}`)
}

/* ---- Roles ---- */

export function listRoles(): Promise<ApiResult<RoleListItem[]>> {
  return api.get<RoleListItem[]>('/roles')
}
export function getRole(id: string): Promise<ApiResult<RoleDetail>> {
  return api.get<RoleDetail>(`/roles/${id}`)
}
export function createRole(payload: CreateRolePayload): Promise<ApiResult<string>> {
  return api.post<string>('/roles', payload)
}
export function updateRole(id: string, payload: UpdateRolePayload): Promise<ApiResult> {
  return api.put(`/roles/${id}`, payload)
}
export function deleteRole(id: string): Promise<ApiResult> {
  return api.delete(`/roles/${id}`)
}

/* ---- Permissions ---- */

export function getPermissionCatalog(): Promise<ApiResult<PermissionGroup[]>> {
  return api.get<PermissionGroup[]>('/permissions')
}
