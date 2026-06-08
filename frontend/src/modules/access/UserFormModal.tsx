import { useState } from 'react'
import { FxModal, FxButton, FxInput, FxCheckbox, useToast } from '../../fx-ui'
import {
  createUser,
  updateUser,
  type AccessUser,
  type RoleListItem,
} from './access-api'

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  /** Düzenlenecek kullanıcı; null ise yeni kayıt. */
  user: AccessUser | null
  availableRoles: RoleListItem[]
}

/**
 * Kullanıcı oluşturma/düzenleme diyaloğu. E-posta düzenlemede salt-okunur,
 * şifre yalnız yeni kayıtta sorulur. Roller checkbox listesiyle atanır.
 */
export function UserFormModal({ open, onClose, onSaved, user, availableRoles }: UserFormModalProps) {
  const toast = useToast()
  const isEdit = user !== null

  // State prop'tan başlatılır; parent her açılışta `key` değiştirerek bu bileşeni
  // yeniden mount eder (türetilmiş-state effect'ine gerek kalmaz).
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [roles, setRoles] = useState<string[]>(user?.roles ?? [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleRole = (name: string, checked: boolean) =>
    setRoles((prev) => (checked ? [...new Set([...prev, name])] : prev.filter((r) => r !== name)))

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = isEdit
        ? await updateUser(user!.id, { fullName, isActive, roles })
        : await createUser({ email, password, fullName, isActive, roles })

      if (result.succeeded) {
        toast.success(isEdit ? 'Kullanıcı güncellendi.' : 'Kullanıcı oluşturuldu.')
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
      title={isEdit ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}
      size="md"
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
          label="E-posta"
          type="email"
          required
          placeholder="ornek@firma.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isEdit}
          hint={isEdit ? 'E-posta değiştirilemez.' : undefined}
        />
        {!isEdit && (
          <FxInput
            label="Şifre"
            type="password"
            required
            placeholder="En az 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="En az 8 karakter."
          />
        )}
        <FxInput
          label="Ad Soyad"
          placeholder="Örn. Ahmet Yılmaz"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="fx-grid__full"
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="fx-label" style={{ marginBottom: 8 }}>Roller</div>
        <div className="fx-demo-row">
          {availableRoles.map((r) => (
            <FxCheckbox
              key={r.id}
              label={r.name}
              checked={roles.includes(r.name)}
              onChange={(e) => toggleRole(r.name, e.target.checked)}
            />
          ))}
          {availableRoles.length === 0 && <span className="fx-text-muted">Rol bulunamadı.</span>}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <FxCheckbox label="Hesap aktif" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
      </div>

      {error && (
        <div className="fx-field__error" role="alert" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}
    </FxModal>
  )
}
