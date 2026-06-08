using FxOs.Domain.Common;
using FxOs.Domain.Definitions;
using FxOs.Domain.Products;
using FxOs.Domain.Stock;
using PersonnelEntity = FxOs.Domain.Personnel.Personnel;

namespace FxOs.Domain.Separations;

/// <summary>
/// Separasyon (ayrıştırma) talebi. Tesise gelen karışık malzemenin geri kazanım/imha için
/// ayrıştırılması; işlem yapan personele damgalanır (performans takibi). Tek tablo, satırsız.
/// İçerik/işlem/sonuç lookup'ları <see cref="Definition"/> FK'leridir (tür-uyumu doğrulanır).
/// </summary>
public class SeparationRequest : BaseEntity
{
    /// <summary>Talep numarası (benzersiz; boş verilirse otomatik üretilir).</summary>
    public string RequestNumber { get; set; } = string.Empty;

    /// <summary>Talep tarihi.</summary>
    public DateTime RequestDate { get; set; }

    /// <summary>Durum.</summary>
    public SeparationStatus Status { get; set; } = SeparationStatus.Pending;

    /// <summary>İşlemi yapan/atanan personel (performans damgası; opsiyonel).</summary>
    public Guid? AssignedPersonnelId { get; set; }
    public PersonnelEntity? AssignedPersonnel { get; set; }

    /// <summary>Ayrıştırılan atık tipi (Definition, tür=WasteType; opsiyonel).</summary>
    public Guid? WasteTypeId { get; set; }
    public Definition? WasteType { get; set; }

    /// <summary>İşlem türü (Definition, tür=ProcessType; opsiyonel).</summary>
    public Guid? ProcessTypeId { get; set; }
    public Definition? ProcessType { get; set; }

    /// <summary>Sonuç grubu — geri kazanım/imha (Definition, tür=WasteGroup; opsiyonel).</summary>
    public Guid? ResultGroupId { get; set; }
    public Definition? ResultGroup { get; set; }

    /// <summary>İlgili ürün (opsiyonel).</summary>
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }

    /// <summary>Kaynak raf/lokasyon (opsiyonel).</summary>
    public Guid? ShelfId { get; set; }
    public Shelf? Shelf { get; set; }

    /// <summary>İçerik / işlem açıklaması (serbest; opsiyonel).</summary>
    public string? Content { get; set; }

    /// <summary>Ayrıştırılan palet sayısı (opsiyonel).</summary>
    public int? PalletCount { get; set; }

    /// <summary>Ağırlık (KG; opsiyonel).</summary>
    public decimal? Weight { get; set; }

    /// <summary>Tamamlanma tarihi.</summary>
    public DateTime? CompletedDate { get; set; }

    /// <summary>Serbest not (opsiyonel).</summary>
    public string? Notes { get; set; }
}
