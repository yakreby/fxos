import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './FacilityLeafletMap.css'
import type { FacilityNode } from './facility-api'
import { statsFor, statsPopupHtml } from './facility-mock'

/**
 * FacilityLeafletMap — gerçek gezilebilir harita (vanilla Leaflet + CARTO dark tile, key yok).
 *
 * - 'manage': haritaya tıkla → `onMapClick(lat,lng)`; marker'a tıkla → `onMarkerClick(node)`.
 * - 'view': marker'a **tıkla** → tech-style istatistik kartı + haritayı o noktaya ortalar; karttaki
 *   "Merkez Detayları" → `onNodeDetails(node)`.
 *
 * Harita Türkiye'ye sınırlı (maxBounds, sağa-sola kayma yok), zoom-out limitli (minZoom).
 * Sağ üstte fixed lejant + navigasyon paneli. Marker'larda hafif "canlı" pulse.
 * Vanilla Leaflet (react-leaflet değil) → React 19 peer-dep riski yok.
 */

/** Türkiye sınır kutusu — kaydırma/zoom bu alanla sınırlanır (popup'lar sığsın diye payı geniş). */
const TURKEY_BOUNDS: L.LatLngBoundsExpression = [
  [34.0, 23.5],
  [44.5, 47.0],
]

interface FacilityLeafletMapProps {
  nodes: FacilityNode[]
  mode?: 'manage' | 'view'
  onMapClick?: (lat: number, lng: number) => void
  onMarkerClick?: (node: FacilityNode) => void
  /** 'view' modunda istatistik kartındaki "Merkez Detayları" butonu. */
  onNodeDetails?: (node: FacilityNode) => void
}

function markerClass(node: FacilityNode): string {
  if (node.nodeType === 0) return 'fx-lmark fx-lmark--hq'
  if (node.status === 1) return 'fx-lmark fx-lmark--planned'
  if (node.nodeType === 3) return 'fx-lmark fx-lmark--dist'
  return 'fx-lmark fx-lmark--active'
}

export function FacilityLeafletMap({ nodes, mode = 'manage', onMapClick, onMarkerClick, onNodeDetails }: FacilityLeafletMapProps) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const clickRef = useRef(onMapClick)
  const markerClickRef = useRef(onMarkerClick)
  const detailsRef = useRef(onNodeDetails)
  const openNodeRef = useRef<FacilityNode | null>(null)
  const isManage = mode === 'manage'

  // Callback'leri her render sonrası güncel tut (render sırasında ref'e dokunmadan).
  useEffect(() => {
    clickRef.current = onMapClick
    markerClickRef.current = onMarkerClick
    detailsRef.current = onNodeDetails
  })

  // Harita kurulumu (bir kez)
  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const el = elRef.current
    const map = L.map(el, {
      center: [39.2, 35.3],
      zoom: 6,
      minZoom: 6,           // çok fazla zoom-out yok
      maxZoom: 12,
      zoomControl: false,   // navigasyonu sağ üst panele koyuyoruz
      attributionControl: true,
      maxBounds: TURKEY_BOUNDS,
      maxBoundsViscosity: 0.8, // sınırda yumuşak dursun (popup'lar sığabilsin, çok dar olmasın)
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap katkıcıları &copy; CARTO',
    }).addTo(map)

    if (isManage) {
      map.on('click', (e: L.LeafletMouseEvent) => clickRef.current?.(e.latlng.lat, e.latlng.lng))
    }

    // Popup içindeki "Merkez Detayları" butonu (popup HTML dinamik → event delegation).
    const onElClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.fx-mappop__btn') && openNodeRef.current) {
        detailsRef.current?.(openNodeRef.current)
      }
    }
    el.addEventListener('click', onElClick)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    requestAnimationFrame(() => map.invalidateSize())
    return () => {
      el.removeEventListener('click', onElClick)
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [isManage])

  // Marker'ları senkronize et (nodes değişince)
  useEffect(() => {
    const layer = layerRef.current
    const map = mapRef.current
    if (!layer || !map) return
    layer.clearLayers()
    for (const n of nodes) {
      const icon = L.divIcon({
        html: `<span class="${markerClass(n)}"></span>`,
        className: 'fx-lmark-wrap',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })
      const marker = L.marker([n.latitude, n.longitude], { icon, title: n.name })

      if (isManage) {
        marker.bindTooltip(`${n.name} · ${n.city}`, { direction: 'top', offset: [0, -10] })
        marker.on('click', () => markerClickRef.current?.(n))
      } else {
        // Görüntüleme modu: TIKLA → istatistik kartı + haritayı o noktaya ortala.
        marker.bindPopup(statsPopupHtml(n, statsFor(n)), {
          className: 'fx-mappop-wrap',
          closeButton: true,
          offset: [0, -6],
          maxWidth: 280,
          autoPan: true,
          autoPanPadding: [28, 28],
        })
        marker.on('click', () => {
          openNodeRef.current = n
          map.setView([n.latitude, n.longitude], Math.max(map.getZoom(), 7), { animate: true })
          marker.openPopup()
        })
      }
      marker.addTo(layer)
    }
  }, [nodes, isManage])

  return (
    <div className="fx-lmap-wrap">
      <div ref={elRef} className="fx-lmap" />

      {/* Sağ üst: fixed lejant + navigasyon */}
      <div className="fx-lmap-panel">
        <div className="fx-lmap-legend">
          <span className="fx-lmap-legend__row"><i className="fx-lmark-sw fx-lmark-sw--hq" /> Genel Merkez</span>
          <span className="fx-lmap-legend__row"><i className="fx-lmark-sw fx-lmark-sw--active" /> Toplama Merkezi</span>
          <span className="fx-lmap-legend__row"><i className="fx-lmark-sw fx-lmark-sw--dist" /> Dağıtım Merkezi</span>
          <span className="fx-lmap-legend__row"><i className="fx-lmark-sw fx-lmark-sw--planned" /> Planlı</span>
        </div>
        <div className="fx-lmap-nav">
          <button type="button" onClick={() => mapRef.current?.zoomIn()} title="Yakınlaştır" aria-label="Yakınlaştır">+</button>
          <button type="button" onClick={() => mapRef.current?.zoomOut()} title="Uzaklaştır" aria-label="Uzaklaştır">−</button>
          <button type="button" onClick={() => mapRef.current?.fitBounds(TURKEY_BOUNDS)} title="Türkiye'ye sığdır" aria-label="Türkiye'ye sığdır">⤢</button>
        </div>
      </div>
    </div>
  )
}
