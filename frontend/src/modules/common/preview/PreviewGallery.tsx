/**
 * PreviewGallery — fotoğraf/panorama arşivi gibi görsel ızgara view'ları için
 * shimmer karo önizlemesi. Mock görsel yok.
 */
export function PreviewGallery({ tiles = 8 }: { tiles?: number }) {
  return (
    <div className="fx-gallery">
      {Array.from({ length: tiles }).map((_, i) => (
        <div key={i} className="fx-skeleton fx-skeleton--fill fx-gallery__tile" />
      ))}
    </div>
  )
}
