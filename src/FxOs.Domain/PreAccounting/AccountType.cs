namespace FxOs.Domain.PreAccounting;

/// <summary>Cari hesap türü.</summary>
public enum AccountType
{
    /// <summary>Müşteri.</summary>
    Customer = 0,

    /// <summary>Tedarikçi.</summary>
    Supplier = 1,

    /// <summary>Hem müşteri hem tedarikçi.</summary>
    Both = 2,
}
