using FxOs.Domain.Common;

namespace FxOs.Domain.Facility;

/// <summary>
/// Dijital tesis haritası üzerindeki bir operasyon noktası: genel merkez, saha toplama
/// merkezi veya tesis. Konum <see cref="Latitude"/>/<see cref="Longitude"/> ile coğrafi
/// tutulur (ileride Logistics <c>Location</c> entity'sine doğrudan bağlanabilir).
/// Bu sürümde harita için amaca özel, sade bir entity'dir.
/// </summary>
public class FacilityNode : BaseEntity
{
    /// <summary>Nokta adı (ör. "Formex Genel Merkez", "Tophisar Toplama Merkezi").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Şehir (ör. "İstanbul", "Bursa").</summary>
    public string City { get; set; } = string.Empty;

    /// <summary>Nokta türü (genel merkez / toplama merkezi / tesis).</summary>
    public FacilityNodeType NodeType { get; set; } = FacilityNodeType.CollectionCenter;

    /// <summary>Durum (aktif / planlı / pasif).</summary>
    public FacilityNodeStatus Status { get; set; } = FacilityNodeStatus.Active;

    /// <summary>Enlem (WGS84; -90..90).</summary>
    public double Latitude { get; set; }

    /// <summary>Boylam (WGS84; -180..180).</summary>
    public double Longitude { get; set; }

    /// <summary>Açıklama / not (opsiyonel).</summary>
    public string? Description { get; set; }

    /// <summary>Sıralama (listede/haritada öncelik).</summary>
    public int SortOrder { get; set; }
}
