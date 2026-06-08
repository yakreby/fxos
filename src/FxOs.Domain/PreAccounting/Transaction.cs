using FxOs.Domain.Common;

namespace FxOs.Domain.PreAccounting;

/// <summary>
/// Finansal işlem (tek tablo: yön + tür). Bir cariye bağlı olabilir (tahsilat/ödeme)
/// veya genel olabilir (gelir/gider — ileride). Bakiye etkisi <see cref="Direction"/> ile.
/// </summary>
public class Transaction : BaseEntity
{
    /// <summary>İlgili cari (tahsilat/ödeme için zorunlu; gelir/gider için null olabilir).</summary>
    public Guid? AccountId { get; set; }
    public Account? Account { get; set; }

    public TransactionType Type { get; set; }
    public TransactionDirection Direction { get; set; }

    /// <summary>İşlem tutarı (pozitif).</summary>
    public decimal Amount { get; set; }

    /// <summary>İşlem tarihi.</summary>
    public DateTime Date { get; set; }

    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

    /// <summary>Açıklama (opsiyonel).</summary>
    public string? Description { get; set; }

    /// <summary>Referans/belge no (opsiyonel).</summary>
    public string? Reference { get; set; }
}
