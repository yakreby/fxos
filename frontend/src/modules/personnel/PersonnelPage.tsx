import { useState } from 'react'
import { FxBadge, FxIcon } from '../../fx-ui'
import { PersonnelTab } from './PersonnelTab'
import { LookupTab } from './LookupTab'
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from './personnel-api'

type PersonnelView = 'personnel' | 'departments' | 'positions'

/**
 * Personel modülü — personel kartları + departman ve kadro (lookup) yönetimi.
 * Sekme tabanlı; her sekme kendi verisini yükler.
 */
export function PersonnelPage() {
  const [view, setView] = useState<PersonnelView>('personnel')

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Personel</div>
          <FxBadge tone="brand">Yönetim</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Personel kartları, departman ve kadro tanımları tek panelden yönetilir.
        </div>
      </div>

      <div className="fx-tabs">
        <button type="button" className={`fx-tab ${view === 'personnel' ? 'is-active' : ''}`} onClick={() => setView('personnel')}>
          <FxIcon name="users" size={16} /> Personel
        </button>
        <button type="button" className={`fx-tab ${view === 'departments' ? 'is-active' : ''}`} onClick={() => setView('departments')}>
          <FxIcon name="grid" size={16} /> Departmanlar
        </button>
        <button type="button" className={`fx-tab ${view === 'positions' ? 'is-active' : ''}`} onClick={() => setView('positions')}>
          <FxIcon name="shield" size={16} /> Kadrolar
        </button>
      </div>

      <div className="fx-tab-panel">
        {view === 'personnel' && <PersonnelTab />}
        {view === 'departments' && (
          <LookupTab
            noun="Departman"
            searchPlaceholder="Departman ara…"
            list={listDepartments}
            create={createDepartment}
            update={updateDepartment}
            remove={deleteDepartment}
          />
        )}
        {view === 'positions' && (
          <LookupTab
            noun="Kadro"
            searchPlaceholder="Kadro ara…"
            list={listPositions}
            create={createPosition}
            update={updatePosition}
            remove={deletePosition}
          />
        )}
      </div>
    </>
  )
}
