import { FxCard, FxBadge, FxButton, FxIcon } from '../../fx-ui'
import { useNavigate } from 'react-router-dom'

/**
 * DashboardActivity — son hareketler + yaklaşan görevler. MOCK; ileride Hareket/Görev
 * modüllerinden beslenecek.
 */
interface Movement {
  ref: string
  type: string
  loc: string
  amount: string
  positive: boolean
  time: string
}

interface Task {
  title: string
  due: string
  tag: string
  tone: 'brand' | 'warning' | 'info'
}

const MOVEMENTS: Movement[] = [
  { ref: 'MK-2026-0412', type: 'Mal Kabul', loc: 'Bursa · Tophisar', amount: '+24 t', positive: true, time: '14:20' },
  { ref: 'SV-2026-0388', type: 'Sevkiyat', loc: 'İzmir Dağıtım', amount: '-12 t', positive: false, time: '13:48' },
  { ref: 'SP-2026-0377', type: 'Separasyon', loc: 'Merkez', amount: '+8 t', positive: true, time: '12:55' },
  { ref: 'TR-2026-0205', type: 'Transfer', loc: 'Kocaeli → Ankara', amount: '18 t', positive: true, time: '11:30' },
  { ref: 'MK-2026-0411', type: 'Mal Kabul', loc: 'Sakarya', amount: '+15 t', positive: true, time: '10:12' },
]

const TASKS: Task[] = [
  { title: 'İzmir sevkiyatını planla', due: 'Bugün 16:00', tag: 'Sevkiyat', tone: 'brand' },
  { title: 'Ankara deposu sayımı', due: 'Bugün 18:00', tag: 'Sayım', tone: 'info' },
  { title: 'Tophisar belge yenileme', due: 'Yarın', tag: 'Belge', tone: 'warning' },
  { title: 'Araç 34 FX 120 bakım', due: '13 Haz', tag: 'Araç', tone: 'warning' },
]

export function DashboardActivity() {
  const navigate = useNavigate()
  return (
    <div className="fx-grid fx-grid--2" style={{ marginTop: 'var(--fx-space-6)' }}>
      <FxCard
        title="Son Hareketler"
        action={
          <FxButton variant="ghost" size="sm" onClick={() => navigate('/movements')}>
            <FxIcon name="activity" size={16} /> Tümü
          </FxButton>
        }
      >
        <div className="fx-act-list">
          {MOVEMENTS.map((m) => (
            <div key={m.ref} className="fx-act-row">
              <div className="fx-act-row__main">
                <span className="fx-act-row__ref">{m.ref}</span>
                <span className="fx-act-row__meta">{m.type} · {m.loc}</span>
              </div>
              <span className={`fx-act-row__amount ${m.positive ? 'is-up' : 'is-down'}`}>{m.amount}</span>
              <span className="fx-act-row__time">{m.time}</span>
            </div>
          ))}
        </div>
      </FxCard>

      <FxCard title="Yaklaşan Görevler">
        <div className="fx-act-list">
          {TASKS.map((t) => (
            <div key={t.title} className="fx-task-row">
              <span className="fx-task-row__dot" />
              <div className="fx-act-row__main">
                <span className="fx-task-row__title">{t.title}</span>
                <span className="fx-act-row__meta">{t.due}</span>
              </div>
              <FxBadge tone={t.tone}>{t.tag}</FxBadge>
            </div>
          ))}
        </div>
      </FxCard>
    </div>
  )
}
