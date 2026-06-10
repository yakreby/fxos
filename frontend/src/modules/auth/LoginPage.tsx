import { useState, type FormEvent } from 'react'
import { FxButton, FxIcon, useToast } from '../../fx-ui'
import { useSession } from '../../core/auth/SessionContext'

/**
 * LoginPage — cookie tabanlı gerçek giriş ekranı.
 * E-posta + şifre `/api/auth/login`'e gider; başarılıysa oturum cookie'si set edilir.
 */
export function LoginPage() {
  const { login } = useSession()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await login(email, password, rememberMe)
      if (result.ok) {
        toast.success('Giriş başarılı. Hoş geldin!', { title: 'FxOs' })
      } else {
        toast.error(result.message ?? 'Giriş başarısız.', { title: 'Giriş hatası' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fx-login">
      <div className="fx-login__hero">
        <img className="fx-login__hero-logo" src="/images/fxos-logo-transparent.png" alt="FxOs" />
        <div className="fx-login__hero-title">
          <span className="fx-text-brand">Fx</span>Os
        </div>
        <div className="fx-login__hero-copy">
          © {new Date().getFullYear()}{' '}
          <a href="https://formexgroup.com" target="_blank" rel="noopener noreferrer">Formex Group</a>
          {' · '}Tüm hakları saklıdır
        </div>
        <div className="fx-login__hero-foot">
          <FxIcon name="shield" size={16} /> Güvenli oturum · zero-waste operasyon
        </div>
      </div>

      <div className="fx-login__form-side">
        <form className="fx-login__card" onSubmit={handleSubmit}>
          <div className="fx-login__brand">
            <img className="fx-login__brand-logo" src="/images/fxos-logo-transparent.png" alt="" />
            <div>
              <div className="fx-login__title">Giriş Yap</div>
              <div className="fx-login__sub">Hesabınla panele eriş</div>
            </div>
          </div>

          <div className="fx-field">
            <label className="fx-label" htmlFor="login-email">E-posta</label>
            <input
              id="login-email"
              className="fx-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@formex.com"
              autoComplete="username"
              required
              disabled={submitting}
            />
          </div>

          <div className="fx-field">
            <label className="fx-label" htmlFor="login-password">Şifre</label>
            <input
              id="login-password"
              className="fx-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={submitting}
            />
          </div>

          <label className="fx-login__remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={submitting}
            />
            <span>Beni hatırla</span>
          </label>

          <FxButton type="submit" variant="primary" disabled={submitting}>
            <FxIcon name="log-out" size={17} style={{ transform: 'rotate(180deg)' }} />
            {submitting ? ' Giriş yapılıyor…' : ' Giriş Yap'}
          </FxButton>
        </form>
      </div>
    </div>
  )
}
