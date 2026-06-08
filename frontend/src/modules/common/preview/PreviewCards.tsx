/**
 * PreviewCards — rapor şablonları/kart ızgarası view'ları için shimmer kart önizlemesi.
 */
export function PreviewCards({ cards = 4 }: { cards?: number }) {
  return (
    <div className="fx-preview-cards">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="fx-preview-card">
          <span className="fx-skeleton" style={{ width: '45%', height: 11 }} />
          <span className="fx-skeleton" style={{ width: '80%' }} />
          <span className="fx-skeleton" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  )
}
