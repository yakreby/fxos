const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

/**
 * PreviewCalendar — aylık takvim ızgarası önizlemesi (Sayım/Randevu gibi takvim view'ları).
 * Hücrelerde mock veri yok; bazı günlerde shimmer "etkinlik" çubukları gösterilir.
 */
export function PreviewCalendar() {
  return (
    <div className="fx-cal">
      <div className="fx-cal__head">
        {WEEKDAYS.map((d) => (
          <div key={d} className="fx-cal__wd">{d}</div>
        ))}
      </div>
      <div className="fx-cal__grid">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="fx-cal__cell">
            {i % 3 === 0 && <span className="fx-skeleton" style={{ width: '70%', height: 9 }} />}
            {i % 5 === 0 && <span className="fx-skeleton" style={{ width: '45%', height: 9 }} />}
          </div>
        ))}
      </div>
    </div>
  )
}
