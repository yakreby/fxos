using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Stock;

namespace FxOs.Application.Stock;

/* ---- Raf ---- */

/// <summary>Raf kaydı + doluluk (hareketlerden hesaplanan).</summary>
public sealed class ShelfDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public decimal? Capacity { get; init; }
    public bool IsActive { get; init; }
    public string? Notes { get; init; }

    /// <summary>Raftaki eldeki miktar (Σ giriş − Σ çıkış).</summary>
    public decimal QuantityOnHand { get; init; }
    /// <summary>Raftaki eldeki ağırlık (KG).</summary>
    public decimal WeightOnHand { get; init; }
    /// <summary>Rafta stok bulunan ürün çeşidi sayısı.</summary>
    public int ProductCount { get; init; }
}

/// <summary>Raf oluşturma/güncelleme isteği.</summary>
public sealed class SaveShelfRequest
{
    [Required(ErrorMessage = "Kod zorunludur."), MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Ad zorunludur."), MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Range(0, 9_999_999, ErrorMessage = "Kapasite negatif olamaz.")]
    public decimal? Capacity { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

/* ---- Stok durumu (hesaplanan) ---- */

/// <summary>Ürün bazında eldeki stok (hareketlerden hesaplanır).</summary>
public sealed class StockItemDto
{
    public Guid ProductId { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public decimal QuantityOnHand { get; init; }
    public decimal WeightOnHand { get; init; }
}

/* ---- Stok hareketi ---- */

public sealed class StockMovementListItemDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public Guid? ShelfId { get; init; }
    public string? ShelfCode { get; init; }
    public StockDirection Direction { get; init; }
    public string DirectionLabel { get; init; } = string.Empty;
    public StockMovementType Type { get; init; }
    public string TypeLabel { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal? Weight { get; init; }
    public DateTime MovementDate { get; init; }
    public string? Reference { get; init; }
    public string? Note { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Manuel stok hareketi oluşturma isteği.</summary>
public sealed class SaveStockMovementRequest
{
    [Required(ErrorMessage = "Ürün zorunludur.")]
    public Guid ProductId { get; set; }

    public Guid? ShelfId { get; set; }

    public StockDirection Direction { get; set; }

    public StockMovementType Type { get; set; } = StockMovementType.Adjustment;

    [Range(0.001, 9_999_999, ErrorMessage = "Miktar 0'dan büyük olmalıdır.")]
    public decimal Quantity { get; set; }

    [Range(0, 9_999_999, ErrorMessage = "Ağırlık negatif olamaz.")]
    public decimal? Weight { get; set; }

    [Required(ErrorMessage = "Tarih zorunludur.")]
    public DateTime MovementDate { get; set; }

    [MaxLength(100)]
    public string? Reference { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}

/// <summary>Raflar arası transfer isteği (iki hareket üretir: kaynak çıkış + hedef giriş).</summary>
public sealed class TransferRequest
{
    [Required(ErrorMessage = "Ürün zorunludur.")]
    public Guid ProductId { get; set; }

    [Required(ErrorMessage = "Kaynak raf zorunludur.")]
    public Guid FromShelfId { get; set; }

    [Required(ErrorMessage = "Hedef raf zorunludur.")]
    public Guid ToShelfId { get; set; }

    [Range(0.001, 9_999_999, ErrorMessage = "Miktar 0'dan büyük olmalıdır.")]
    public decimal Quantity { get; set; }

    [Range(0, 9_999_999, ErrorMessage = "Ağırlık negatif olamaz.")]
    public decimal? Weight { get; set; }

    [Required(ErrorMessage = "Tarih zorunludur.")]
    public DateTime MovementDate { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}

/* ---- Etiketler / seçenekler ---- */

public sealed class StockEnumOption
{
    public int Value { get; init; }
    public string Label { get; init; } = string.Empty;
}

/// <summary>Stok form/filtre meta verisi (yön + hareket türü seçenekleri).</summary>
public sealed class StockMetaDto
{
    public IReadOnlyList<StockEnumOption> Directions { get; init; } = Array.Empty<StockEnumOption>();
    public IReadOnlyList<StockEnumOption> MovementTypes { get; init; } = Array.Empty<StockEnumOption>();
}

public static class StockLabels
{
    public static string Direction(StockDirection d) => d switch
    {
        StockDirection.In => "Giriş",
        StockDirection.Out => "Çıkış",
        _ => d.ToString(),
    };

    public static string MovementType(StockMovementType t) => t switch
    {
        StockMovementType.Receipt => "Mal Kabul",
        StockMovementType.Issue => "Çıkış",
        StockMovementType.Transfer => "Transfer",
        StockMovementType.Adjustment => "Düzeltme",
        StockMovementType.Count => "Sayım",
        _ => t.ToString(),
    };

    public static IReadOnlyList<StockEnumOption> Directions { get; } =
        Enum.GetValues<StockDirection>()
            .Select(d => new StockEnumOption { Value = (int)d, Label = Direction(d) })
            .ToList();

    public static IReadOnlyList<StockEnumOption> MovementTypes { get; } =
        Enum.GetValues<StockMovementType>()
            .Select(t => new StockEnumOption { Value = (int)t, Label = MovementType(t) })
            .ToList();
}
