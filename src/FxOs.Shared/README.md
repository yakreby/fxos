# FxOs.Shared

> Cross-cutting (kesişen) yardımcı tipler. Katmanlardan bağımsız, herkesin kullandığı primitive'ler.

## Sorumluluk

İş kuralı içermeyen, tüm katmanlarda ortak kullanılan küçük ve kararlı tipleri barındırır: standart sonuç zarfı, sayfalama modelleri, sabitler ve genel helper'lar.

## Bağımlılıklar

```
FxOs.Shared  →  (yok)
```

## İçerik Haritası

| Klasör | İçerik |
|--------|--------|
| `Results/` | `Result`, `Result<T>` — standart API başarı/hata zarfı |
| `Pagination/` | `PaginationRequest`, `PagedResult<T>` — sıralama/arama/sayfalama sözleşmesi (FxTable ile uyumlu) |
| `Constants/` | Uygulama genel sabitleri (ileride) |
| `Helpers/` | Tekrar eden işlemler için genel helper'lar (ileride) |

## Kurallar

- Burada **iş kuralı / domain bilgisi olmaz.** Sadece teknik primitive'ler.
- Mümkün olduğunca **dış bağımlılıksız** kalır.
