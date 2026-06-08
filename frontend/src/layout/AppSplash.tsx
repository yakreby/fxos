/**
 * AppSplash — oturum geri yüklenirken (me çağrısı sürerken) gösterilen
 * kısa bekleme ekranı. Login/route titremesini önler.
 */
export function AppSplash() {
  return (
    <div className="fx-app-splash">
      <img className="fx-app-splash__logo" src="/images/fxos-logo.png" alt="FxOs" />
      <div className="fx-app-splash__text">Yükleniyor…</div>
    </div>
  )
}
