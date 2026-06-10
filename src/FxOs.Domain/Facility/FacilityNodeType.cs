namespace FxOs.Domain.Facility;

/// <summary>Harita düğümünün türü. Sabit küme olduğu için enum.</summary>
public enum FacilityNodeType
{
    /// <summary>Genel merkez (ana tesis/yönetim).</summary>
    Headquarters = 0,

    /// <summary>Saha toplama merkezi (atık/ürün toplama noktası).</summary>
    CollectionCenter = 1,

    /// <summary>Tesis (işleme/depolama).</summary>
    Facility = 2,

    /// <summary>Dağıtım merkezi (bölgesel dağıtım/sevkiyat noktası).</summary>
    DistributionCenter = 3,
}
