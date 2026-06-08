namespace FxOs.Domain.Personnel;

/// <summary>Personelin istihdam durumu.</summary>
public enum PersonnelStatus
{
    /// <summary>Aktif çalışan.</summary>
    Active = 0,

    /// <summary>İzinde (geçici olarak görevde değil).</summary>
    OnLeave = 1,

    /// <summary>İşten ayrılmış.</summary>
    Terminated = 2,
}
