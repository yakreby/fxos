namespace FxOs.Domain.PreAccounting;

/// <summary>Ödeme/tahsilat yöntemi.</summary>
public enum PaymentMethod
{
    /// <summary>Nakit.</summary>
    Cash = 0,

    /// <summary>Banka/havale/EFT.</summary>
    Bank = 1,

    /// <summary>Kredi/banka kartı.</summary>
    Card = 2,

    /// <summary>Çek/senet/diğer.</summary>
    Other = 3,
}
