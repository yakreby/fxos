import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedLayout } from './core/auth/ProtectedLayout'
import { PublicOnlyRoute } from './core/auth/PublicOnlyRoute'
import { LoginPage } from './modules/auth/LoginPage'
import { DashboardPage } from './modules/dashboard/DashboardPage'
import { SettingsPage } from './modules/settings/SettingsPage'
import { AccessPage } from './modules/access/AccessPage'
import { PersonnelPage } from './modules/personnel/PersonnelPage'
import { PersonnelDetailPage } from './modules/personnel/PersonnelDetailPage'
import { PreAccountingPage } from './modules/pre-accounting/PreAccountingPage'
import { AccountDetailPage } from './modules/pre-accounting/AccountDetailPage'
import { DefinitionsPage } from './modules/definitions/DefinitionsPage'
import { ProductsPage } from './modules/products/ProductsPage'
import { ProductDetailPage } from './modules/products/ProductDetailPage'
import { GoodsReceiptsPage } from './modules/goods-receipts/GoodsReceiptsPage'
import { GoodsReceiptDetailPage } from './modules/goods-receipts/GoodsReceiptDetailPage'
import { StockPage } from './modules/stock/StockPage'
import { ShelvesPage } from './modules/stock/ShelvesPage'
import { StockMovementsPage } from './modules/stock/StockMovementsPage'
import { OctabinsPage } from './modules/octabins/OctabinsPage'
import { OctabinDetailPage } from './modules/octabins/OctabinDetailPage'
import { SeparationsPage } from './modules/separations/SeparationsPage'
import { SeparationDetailPage } from './modules/separations/SeparationDetailPage'
import { FacilityDashboardPage } from './modules/facility/FacilityDashboardPage'
// Leaflet ağır olduğundan harita yönetim sayfası lazy yüklenir (ana bundle'dan ayrı chunk).
const FacilityMapPage = lazy(() =>
  import('./modules/facility/FacilityMapPage').then((m) => ({ default: m.FacilityMapPage })),
)
import { ExpensesPage } from './modules/expenses/ExpensesPage'
import { NotificationsPage } from './modules/notifications/NotificationsPage'
import { LogsPage } from './modules/logs/LogsPage'
import { ModuleShell } from './modules/common/ModuleShell'
import { ShowcasePage } from './fx-ui-showcase/ShowcasePage'

/**
 * Henüz inşa edilmemiş modüller — `ModuleShell` (yapım aşamasında iskeleti) gösterir.
 * Bir modül geliştirilince buradan çıkarılıp kendi sayfa bileşeni + rotası eklenir.
 * Açıklamalar/planned notları nav-items'tan gelir; detaylı plan: docs/MODULES.md.
 */
const PLACEHOLDER_KEYS = [
  // Tesis Operasyonu
  'outbound', 'appointments',
  // Sevkiyat & Lojistik
  'shipment-planning', 'shipment-requests', 'route-planning', 'routes',
  'logistics-movements', 'dispatch', 'vehicles',
  // Sayım & Saha
  'count-dashboard', 'counts', 'field-photos', 'panorama', 'point-reports',
  // Ürün & Tanımlar
  'haccp',
  // İK / Muhasebe
  'leave', 'work-report', 'personnel-expenses',
  // Belgeler / Sistem
  'document-list', 'document-reminders', 'reports', 'sms', 'mail',
] as const

/**
 * Uygulama yönlendirmesi (react-router).
 * - /login: yalnız oturumsuz (PublicOnlyRoute).
 * - Korumalı alan: ProtectedLayout (auth + AppLayout kabuğu) altında sayfalar.
 * Her modülün açık rotası vardır; gerçek sayfalar bileşenleriyle, kalanlar ModuleShell ile.
 */
export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Gerçek modüller */}
        <Route path="personnel" element={<PersonnelPage />} />
        <Route path="personnel/:id" element={<PersonnelDetailPage />} />
        <Route path="pre-accounting" element={<PreAccountingPage />} />
        <Route path="pre-accounting/:id" element={<AccountDetailPage />} />
        <Route path="definitions" element={<DefinitionsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="goods-receipt" element={<GoodsReceiptsPage />} />
        <Route path="goods-receipt/:id" element={<GoodsReceiptDetailPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="shelves" element={<ShelvesPage />} />
        <Route path="movements" element={<StockMovementsPage />} />
        <Route path="octabin" element={<OctabinsPage />} />
        <Route path="octabin/:id" element={<OctabinDetailPage />} />
        <Route path="separation" element={<SeparationsPage />} />
        <Route path="separation/:id" element={<SeparationDetailPage />} />

        {/* View-specific placeholder'lar (gerçek düzen, veri yok) */}
        <Route path="facility-dashboard" element={<FacilityDashboardPage />} />
        <Route
          path="locations"
          element={
            <Suspense fallback={<div className="fx-text-muted" style={{ padding: 24 }}>Harita yükleniyor…</div>}>
              <FacilityMapPage />
            </Suspense>
          }
        />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="access" element={<AccessPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="fx-debug" element={<ShowcasePage />} />

        {/* Yapım aşamasındaki modüller (iskelet) */}
        {PLACEHOLDER_KEYS.map((key) => (
          <Route key={key} path={key} element={<ModuleShell navKey={key} />} />
        ))}

        {/* Bilinmeyen korumalı yol → panele dön. */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
