using System.ComponentModel.DataAnnotations;
using FxOs.Domain.PreAccounting;

namespace FxOs.Application.PreAccounting;

/* ---- Cari hesap ---- */

/// <summary>Cari için hafif lookup kaydı (dropdown'lar — ör. ürün müşterisi).</summary>
public sealed class AccountLookupDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string TypeLabel { get; init; } = string.Empty;
}

public sealed class AccountListItemDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public AccountType Type { get; init; }
    public string TypeLabel { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public decimal Balance { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class AccountDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public AccountType Type { get; init; }
    public string TypeLabel { get; init; } = string.Empty;
    public string? TaxNumber { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
    public decimal OpeningBalance { get; init; }
    public decimal Balance { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class SaveAccountRequest
{
    [Required(ErrorMessage = "Ünvan/ad zorunludur."), MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public AccountType Type { get; set; } = AccountType.Customer;

    [MaxLength(20)]
    public string? TaxNumber { get; set; }

    [MaxLength(32)]
    public string? Phone { get; set; }

    [EmailAddress(ErrorMessage = "Geçerli bir e-posta giriniz."), MaxLength(256)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public decimal OpeningBalance { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

/* ---- İşlem ---- */

public sealed class TransactionDto
{
    public Guid Id { get; init; }
    public Guid? AccountId { get; init; }
    public TransactionType Type { get; init; }
    public string TypeLabel { get; init; } = string.Empty;
    public TransactionDirection Direction { get; init; }
    public string DirectionLabel { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public DateTime Date { get; init; }
    public PaymentMethod Method { get; init; }
    public string MethodLabel { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Reference { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed class CreateTransactionRequest
{
    /// <summary>MVP: Collection (Tahsilat) / Payment (Ödeme).</summary>
    public TransactionType Type { get; set; } = TransactionType.Collection;

    [Range(0.01, 9999999999999.99, ErrorMessage = "Tutar 0'dan büyük olmalıdır.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Tarih zorunludur.")]
    public DateTime Date { get; set; }

    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Reference { get; set; }
}

/* ---- Etiketler ---- */

public static class PreAccountingLabels
{
    public static string AccountType(AccountType t) => t switch
    {
        Domain.PreAccounting.AccountType.Customer => "Müşteri",
        Domain.PreAccounting.AccountType.Supplier => "Tedarikçi",
        Domain.PreAccounting.AccountType.Both => "Müşteri/Tedarikçi",
        _ => t.ToString(),
    };

    public static string TransactionType(TransactionType t) => t switch
    {
        Domain.PreAccounting.TransactionType.Collection => "Tahsilat",
        Domain.PreAccounting.TransactionType.Payment => "Ödeme",
        Domain.PreAccounting.TransactionType.Income => "Gelir",
        Domain.PreAccounting.TransactionType.Expense => "Gider",
        _ => t.ToString(),
    };

    public static string Direction(TransactionDirection d) =>
        d == TransactionDirection.Debit ? "Borç" : "Alacak";

    public static string Method(PaymentMethod m) => m switch
    {
        PaymentMethod.Cash => "Nakit",
        PaymentMethod.Bank => "Banka",
        PaymentMethod.Card => "Kart",
        PaymentMethod.Other => "Diğer",
        _ => m.ToString(),
    };
}
