namespace FxOs.Domain.Documents;

/// <summary>
/// Özlük/belge türü. İlk aşamada enum (sabit küme); ileride gerekirse
/// lookup tablosuna terfi edilebilir.
/// </summary>
public enum DocumentType
{
    /// <summary>Kimlik fotokopisi.</summary>
    IdentityCard = 0,

    /// <summary>İş sözleşmesi.</summary>
    Contract = 1,

    /// <summary>Diploma / öğrenim belgesi.</summary>
    Diploma = 2,

    /// <summary>Sağlık raporu.</summary>
    HealthReport = 3,

    /// <summary>Adli sicil kaydı.</summary>
    CriminalRecord = 4,

    /// <summary>İkametgah belgesi.</summary>
    ResidenceCertificate = 5,

    /// <summary>Vesikalık fotoğraf.</summary>
    Photo = 6,

    /// <summary>Sertifika / kurs belgesi.</summary>
    Certificate = 7,

    /// <summary>Diğer.</summary>
    Other = 99,
}
