namespace FxOs.Domain.PreAccounting;

/// <summary>Finansal işlem türü. MVP'de Tahsilat/Ödeme kullanılır; Gelir/Gider ileride.</summary>
public enum TransactionType
{
    /// <summary>Tahsilat (cariden para girişi).</summary>
    Collection = 0,

    /// <summary>Ödeme (cariye para çıkışı).</summary>
    Payment = 1,

    /// <summary>Gelir (genel).</summary>
    Income = 2,

    /// <summary>Gider (genel).</summary>
    Expense = 3,
}
