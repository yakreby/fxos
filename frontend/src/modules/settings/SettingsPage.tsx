import { FxCard, FxButton, FxBadge, FxIcon, useToast } from '../../fx-ui'
import { useTheme } from '../../core/theme/ThemeContext'
import { useSession } from '../../core/auth/SessionContext'

/**
 * SettingsPage — temel ayarlar: görünüm (tema), profil (salt-okunur), güvenlik.
 * Gerçek profil düzenleme ve 2FA Faz 1/3'te API'ye bağlanacak.
 */
export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user } = useSession()
  const toast = useToast()

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-page-head__title">Ayarlar</div>
        <div className="fx-page-head__sub">Görünüm, profil ve güvenlik tercihleri</div>
      </div>

      <div className="fx-grid fx-grid--2">
        <div className="fx-flex fx-flex-col fx-gap-4">
          <FxCard title="Görünüm">
            <div className="fx-flex fx-flex-col fx-gap-4">
              <div className="fx-text-muted" style={{ fontSize: 14 }}>Tema tercihi</div>
              <div className="fx-flex fx-gap-2">
                <FxButton
                  variant={theme === 'light' ? 'primary' : 'subtle'}
                  onClick={() => setTheme('light')}
                >
                  <FxIcon name="sun" size={17} /> Aydınlık
                </FxButton>
                <FxButton
                  variant={theme === 'dark' ? 'primary' : 'subtle'}
                  onClick={() => setTheme('dark')}
                >
                  <FxIcon name="moon" size={17} /> Karanlık
                </FxButton>
              </div>
            </div>
          </FxCard>

          <FxCard title="Güvenlik">
            <div className="fx-flex fx-flex-col fx-gap-4">
              <div className="fx-flex fx-items-center fx-justify-between">
                <div>
                  <div style={{ fontWeight: 600 }}>İki Adımlı Doğrulama (2FA)</div>
                  <div className="fx-text-muted" style={{ fontSize: 13 }}>
                    Hesap güvenliği için ek doğrulama katmanı.
                  </div>
                </div>
                <FxBadge tone="warning">Yakında</FxBadge>
              </div>
              <div>
                <FxButton variant="subtle" onClick={() => toast.info('Şifre değiştirme yakında eklenecek.')}>
                  <FxIcon name="shield" size={17} /> Şifre değiştir
                </FxButton>
              </div>
            </div>
          </FxCard>
        </div>

        <FxCard title="Profil">
          <div className="fx-flex fx-flex-col fx-gap-4">
            <div className="fx-field">
              <span className="fx-label">Ad Soyad</span>
              <input className="fx-input" value={user?.name ?? ''} readOnly />
            </div>
            <div className="fx-field">
              <span className="fx-label">E-posta</span>
              <input className="fx-input" value={user?.email ?? ''} readOnly />
            </div>
            <div className="fx-field">
              <span className="fx-label">Rol</span>
              <input className="fx-input" value={user?.role ?? ''} readOnly />
            </div>
            <div>
              <FxButton variant="primary" onClick={() => toast.success('Profil kaydedildi (demo).')}>
                Kaydet
              </FxButton>
            </div>
          </div>
        </FxCard>
      </div>
    </>
  )
}
