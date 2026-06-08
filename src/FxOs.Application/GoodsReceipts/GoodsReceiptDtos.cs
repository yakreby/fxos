using System.ComponentModel.DataAnnotations;
using FxOs.Domain.GoodsReceipts;

namespace FxOs.Application.GoodsReceipts;

/// <summary>Mal kabul listesi satırı (özetlerle).</summary>
public sealed class GoodsReceiptListItemDto
{
    public Guid Id { get; init; }
    public string ReceiptNumber { get; init; } = string.Empty;
    public DateTime ReceiptDate { get; init; }
    public Guid? SupplierId { get; init; }
    public string? SupplierName { get; init; }
    public GoodsReceiptStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public int LineCount { get; init; }
    public decimal TotalQuantity { get; init; }
    public decimal TotalWeight { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Mal kabul detayı (başlık + satırlar).</summary>
public sealed class GoodsReceiptDetailDto
{
    public Guid Id { get; init; }
    public string ReceiptNumber { get; init; } = string.Empty;
    public DateTime ReceiptDate { get; init; }
    public Guid? SupplierId { get; init; }
    public string? SupplierName { get; init; }
    public GoodsReceiptStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public decimal TotalQuantity { get; init; }
    public decimal TotalWeight { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public IReadOnlyList<GoodsReceiptLineDto> Lines { get; init; } = Array.Empty<GoodsReceiptLineDto>();
}

/// <summary>Mal kabul satırı (çözülmüş ürün/raf adıyla).</summary>
public sealed class GoodsReceiptLineDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public Guid? ShelfId { get; init; }
    public string? ShelfCode { get; init; }
    public decimal Quantity { get; init; }
    public decimal? Weight { get; init; }
    public string? Note { get; init; }
}

/// <summary>Mal kabul başlığı oluşturma/güncelleme isteği.</summary>
public sealed class SaveGoodsReceiptRequest
{
    /// <summary>Boş bırakılırsa otomatik üretilir.</summary>
    [MaxLength(50)]
    public string? ReceiptNumber { get; set; }

    [Required(ErrorMessage = "Kabul tarihi zorunludur.")]
    public DateTime ReceiptDate { get; set; }

    public Guid? SupplierId { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

/// <summary>Mal kabul satırı ekleme isteği.</summary>
public sealed class SaveGoodsReceiptLineRequest
{
    [Required(ErrorMessage = "Ürün zorunludur.")]
    public Guid ProductId { get; set; }

    /// <summary>Yerleştirileceği raf (adresleme; opsiyonel).</summary>
    public Guid? ShelfId { get; set; }

    [Range(0.001, 9_999_999, ErrorMessage = "Miktar 0'dan büyük olmalıdır.")]
    public decimal Quantity { get; set; }

    [Range(0, 9_999_999, ErrorMessage = "Tartım negatif olamaz.")]
    public decimal? Weight { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}

/// <summary>GoodsReceiptStatus seçeneği (frontend dropdown'ı için).</summary>
public sealed class GoodsReceiptStatusOption
{
    public GoodsReceiptStatus Value { get; init; }
    public string Label { get; init; } = string.Empty;
}

/// <summary>GoodsReceiptStatus değerlerinin Türkçe etiketleri.</summary>
public static class GoodsReceiptStatusLabels
{
    public static string Of(GoodsReceiptStatus status) => status switch
    {
        GoodsReceiptStatus.Draft => "Taslak",
        GoodsReceiptStatus.Confirmed => "Onaylandı",
        GoodsReceiptStatus.Cancelled => "İptal",
        _ => status.ToString(),
    };

    public static IReadOnlyList<GoodsReceiptStatusOption> All { get; } =
        Enum.GetValues<GoodsReceiptStatus>()
            .Select(s => new GoodsReceiptStatusOption { Value = s, Label = Of(s) })
            .ToList();
}
