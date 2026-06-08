namespace FxOs.Domain.PreAccounting;

/// <summary>
/// İşlemin cari bakiyesine etkisi. Bakiye = AçılışBakiyesi + ΣBorç − ΣAlacak
/// (pozitif = cari borçlu / bizden alacağımız var).
/// </summary>
public enum TransactionDirection
{
    /// <summary>Borç (bakiyeyi artırır).</summary>
    Debit = 0,

    /// <summary>Alacak (bakiyeyi azaltır).</summary>
    Credit = 1,
}
