namespace FxOs.Domain.Facility;

/// <summary>Harita düğümünün durumu (görsel: aktif=parlak, planlı=soluk).</summary>
public enum FacilityNodeStatus
{
    /// <summary>Aktif — faal nokta.</summary>
    Active = 0,

    /// <summary>Planlı — henüz faal değil, yol haritasında.</summary>
    Planned = 1,

    /// <summary>Pasif — geçici/kapalı.</summary>
    Inactive = 2,
}
