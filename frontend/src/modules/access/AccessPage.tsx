import { useState } from 'react'
import { FxBadge, FxIcon } from '../../fx-ui'
import { UsersTab } from './UsersTab'
import { RolesTab } from './RolesTab'

type AccessTab = 'users' | 'roles'

/**
 * Identity & Access modülü — Kullanıcılar ve Roller (izin matrisi) yönetimi.
 * Sekme tabanlı; her sekme kendi verisini yükler.
 */
export function AccessPage() {
  const [tab, setTab] = useState<AccessTab>('users')

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Roller &amp; İzinler</div>
          <FxBadge tone="brand">Identity &amp; Access</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Kullanıcı hesapları, rol tanımları ve izin matrisi tek panelden yönetilir.
        </div>
      </div>

      <div className="fx-tabs">
        <button
          type="button"
          className={`fx-tab ${tab === 'users' ? 'is-active' : ''}`}
          onClick={() => setTab('users')}
        >
          <FxIcon name="users" size={16} /> Kullanıcılar
        </button>
        <button
          type="button"
          className={`fx-tab ${tab === 'roles' ? 'is-active' : ''}`}
          onClick={() => setTab('roles')}
        >
          <FxIcon name="shield" size={16} /> Roller
        </button>
      </div>

      <div className="fx-tab-panel">
        {tab === 'users' ? <UsersTab /> : <RolesTab />}
      </div>
    </>
  )
}
