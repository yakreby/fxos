namespace FxOs.Domain.Octabins;

/// <summary>Octabin'in yaşam döngüsü durumu. Sabit küme olduğu için enum.</summary>
public enum OctabinStatus
{
    /// <summary>Açık — doldurulmakta, düzenlenebilir.</summary>
    Open = 0,

    /// <summary>Dolu — kapatıldı, sevke hazır.</summary>
    Full = 1,

    /// <summary>Sevk edildi — tesisten çıktı, kilitli.</summary>
    Dispatched = 2,
}
