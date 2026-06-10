import { useEffect, useRef, useState } from 'react'
import { FxIcon, type FxIconName } from '../../fx-ui'

/**
 * OperationFeed — canlı operasyon akışı (Palantir-tarzı): mock olaylar sırayla akar.
 * Toplama / transfer / bekleyen / geri kazanım olayları periyodik üretilir, üstten kayarak girer.
 * İleride gerçek Hareket/Sayım olaylarıyla (ör. SignalR/poll) değiştirilecek.
 */
type OpKind = 'collect' | 'transfer' | 'waiting' | 'recover'

interface OpEvent {
  id: number
  kind: OpKind
  text: string
  time: string
}

const CITIES = [
  'İstanbul', 'Bursa', 'Kocaeli', 'Sakarya', 'İzmir', 'Balıkesir',
  'Eskişehir', 'Ankara', 'Antalya', 'Konya', 'Denizli', 'Trabzon',
]

const KIND_ICON: Record<OpKind, FxIconName> = {
  collect: 'package',
  transfer: 'truck',
  waiting: 'activity',
  recover: 'grid',
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeOp(id: number): OpEvent {
  const kind = pick<OpKind>(['collect', 'transfer', 'waiting', 'recover'])
  const c = pick(CITIES)
  let c2 = pick(CITIES)
  if (c2 === c) c2 = pick(CITIES)
  const t = 4 + Math.floor(Math.random() * 40)
  const text =
    kind === 'collect' ? `${c}'dan ${t}t atık toplandı`
    : kind === 'transfer' ? `${c} → ${c2} transfer başladı`
    : kind === 'waiting' ? `${c} merkezinde ${t}t sevkiyat bekliyor`
    : `${c} ayrıştırma: ${t}t geri kazanım`
  const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  return { id, kind, text, time }
}

export function OperationFeed() {
  const [items, setItems] = useState<OpEvent[]>(() => Array.from({ length: 5 }, (_, i) => makeOp(i)))
  const idRef = useRef(5)

  useEffect(() => {
    const iv = setInterval(() => {
      setItems((prev) => [makeOp(idRef.current++), ...prev].slice(0, 7))
    }, 3200)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="fx-cc-card fx-cc-feed">
      <div className="fx-cc-feed__head">
        <span className="fx-cc-feed__title"><span className="fx-cc-live" /> Canlı Operasyon Akışı</span>
      </div>
      <div className="fx-cc-feed__list">
        {items.map((op) => (
          <div key={op.id} className={`fx-cc-op fx-cc-op--${op.kind}`}>
            <span className="fx-cc-op__icon"><FxIcon name={KIND_ICON[op.kind]} size={14} /></span>
            <span className="fx-cc-op__text">{op.text}</span>
            <span className="fx-cc-op__time">{op.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
