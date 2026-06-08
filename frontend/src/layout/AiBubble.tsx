import { useState } from 'react'
import { FxIcon } from '../fx-ui'

/**
 * AiBubble — GEÇİCİ AI asistan baloncuğu (placeholder).
 * Şimdilik sadece bir panel açar; gerçek asistan entegrasyonu ileride.
 */
export function AiBubble() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div className="fx-ai-panel" role="dialog" aria-label="AI Asistan">
          <div className="fx-ai-panel__head">
            <div className="fx-flex fx-items-center fx-gap-2">
              <FxIcon name="sparkles" size={18} />
              <strong>FxOs Asistan</strong>
            </div>
            <button
              type="button"
              className="fx-ai-panel__close"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
            >
              <FxIcon name="x" size={16} />
            </button>
          </div>
          <div className="fx-ai-panel__body fx-text-muted">
            Yapay zekâ asistanı yakında burada olacak. Operasyon sorularını sorabilecek,
            kayıtları özetletebilecek ve hızlı işlemler yapabileceksin.
          </div>
        </div>
      )}

      <button
        type="button"
        className={`fx-ai-bubble ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="FxOs Asistan"
        aria-label="FxOs Asistan"
      >
        <FxIcon name={open ? 'x' : 'sparkles'} size={22} />
      </button>
    </>
  )
}
