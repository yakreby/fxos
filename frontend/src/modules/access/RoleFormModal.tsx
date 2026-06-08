import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxCheckbox, useToast } from '../../fx-ui'
import {
  createRole,
  updateRole,
  type RoleDetail,
  type PermissionGroup,
} from './access-api'

interface RoleFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek rol (izinleriyle); null ise yeni kayıt. */
  role: RoleDetail | null
  catalog: PermissionGroup[]
}

/**
 * Rol oluşturma/düzenleme diyaloğu + izin matrisi (modül-bazlı checkbox'lar).
 * Çekirdek rollerde ad salt-okunur; izinler yine düzenlenebilir.
 */
export function RoleFormModal({ open, onClose, onSaved, role, catalog }: RoleFormModalProps) {
  const toast = useToast()
  const isEdit = role !== null

  // State prop'tan başlatılır; parent her açılışta `key` ile yeniden mount eder.
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [permissions, setPermissions] = useState<Set<string>>(new Set(role?.permissions ?? []))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const togglePermission = (key: string, checked: boolean) =>
    setPermissions((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })

  const toggleModule = (group: PermissionGroup, checked: boolean) =>
    setPermissions((prev) => {
      const next = new Set(prev)
      group.items.forEach((i) => (checked ? next.add(i.key) : next.delete(i.key)))
      return next
    })

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    const perms = [...permissions]
    try {
      const result = isEdit
        ? await updateRole(role!.id, { description, permissions: perms })
        : await createRole({ name, description, permissions: perms })

      if (result.succeeded) {
        toast.success(isEdit ? 'Rol güncellendi.' : 'Rol oluşturuldu.')
        onSaved()
        onClose()
      } else {
        setError(result.errors?.length ? result.errors.join(' · ') : (result.message ?? 'İşlem başarısız.'))
      }
    } catch {
      setError('Sunucuya ulaşılamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FxModal
      open={open}
      onClose={onClose}
      title={isEdit ? `Rolü Düzenle — ${role?.name}` : 'Yeni Rol'}
      size="lg"
      footer={
        <>
          <FxButton variant="ghost" onClick={onClose} disabled={submitting}>İptal</FxButton>
          <FxButton variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Kaydediliyor…' : 'Kaydet'}
          </FxButton>
        </>
      }
    >
      <div className="fx-grid fx-grid--form">
        <FxInput
          label="Rol adı"
          required
          placeholder="Örn. Saha Sorumlusu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isEdit}
          hint={isEdit ? 'Rol adı değiştirilemez.' : undefined}
        />
        <FxInput
          label="Açıklama"
          placeholder="Rolün kısa açıklaması (opsiyonel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="fx-label" style={{ marginBottom: 10 }}>İzinler</div>
        <div className="fx-perm-matrix">
          {catalog.map((group) => {
            const allChecked = group.items.every((i) => permissions.has(i.key))
            return (
              <div key={group.module} className="fx-perm-group">
                <div className="fx-perm-group__head">
                  <FxCheckbox
                    label={group.moduleLabel}
                    checked={allChecked}
                    onChange={(e) => toggleModule(group, e.target.checked)}
                  />
                </div>
                <div className="fx-perm-group__items">
                  {group.items.map((item) => (
                    <FxCheckbox
                      key={item.key}
                      label={item.label}
                      checked={permissions.has(item.key)}
                      onChange={(e) => togglePermission(item.key, e.target.checked)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="fx-field__error" role="alert" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}
    </FxModal>
  )
}
