namespace FxOs.Domain.Common;

/// <summary>
/// Tüm entity'lerin türediği temel sınıf.
/// Kural: Tüm primary key'ler <see cref="Guid"/>'dir; int id KULLANILMAZ.
/// Audit alanları (oluşturma/güncelleme/soft-delete) burada standartlaşır.
/// </summary>
public abstract class BaseEntity
{
    /// <summary>Birincil anahtar (Guid).</summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Kaydın oluşturulduğu an (UTC).</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Kaydı oluşturan kullanıcının Id'si (varsa).</summary>
    public Guid? CreatedBy { get; set; }

    /// <summary>Son güncelleme anı (UTC, varsa).</summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>Son güncelleyen kullanıcının Id'si (varsa).</summary>
    public Guid? UpdatedBy { get; set; }

    /// <summary>Soft-delete bayrağı. Kayıtlar fiziksel olarak silinmez.</summary>
    public bool IsDeleted { get; set; }

    /// <summary>Silinme anı (UTC, soft-delete yapıldıysa).</summary>
    public DateTime? DeletedAt { get; set; }

    /// <summary>Silen kullanıcının Id'si (varsa).</summary>
    public Guid? DeletedBy { get; set; }
}
