# layout

Uygulama kabuğu: **Sidebar (sol)** · **Header (üst)** · **Content**.

| Dosya | Sorumluluk |
|-------|------------|
| `AppLayout.tsx` | Kabuk grid'i; sidebar collapse state, içerik scroll ref, FxScrollTop + AiBubble |
| `Sidebar.tsx` | FxOs markası + nav; **alt menü / dropdown** ve daraltma desteği |
| `Header.tsx` | Sidebar toggle, fx-debug linki, Formex logosu (tema-duyarlı), tema toggle, bildirim + kullanıcı menüsü |
| `NotificationMenu.tsx` | Bildirim popover'ı (okunmamış sayısı, okundu işaretleme) |
| `AiBubble.tsx` | **Geçici** AI asistan baloncuğu (placeholder) |
| `nav-items.ts` | Navigasyon yapılandırması (modüller, alt menüler, açıklamalar) + `findNavItem`/`findParentKey` |

Tüm modül ekranları bu kabuğun içinde render edilir. Rol bazlı navigasyon görünürlüğü Faz 3'te (Identity) eklenecek.
