using FxOs.Domain.Common;

namespace FxOs.Domain.PreAccounting;

/// <summary>
/// Cari hesap (müşteri/tedarikçi). Bakiye işlemlerden hesaplanır
/// (AçılışBakiyesi + ΣBorç − ΣAlacak); entity'de tutulmaz.
/// </summary>
public class Account : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public AccountType Type { get; set; } = AccountType.Customer;

    public string? TaxNumber { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }

    /// <summary>Açılış bakiyesi (pozitif = cari borçlu).</summary>
    public decimal OpeningBalance { get; set; }

    public string? Notes { get; set; }

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
