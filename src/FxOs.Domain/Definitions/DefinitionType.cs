namespace FxOs.Domain.Definitions;

/// <summary>
/// Bir <see cref="Definition"/> kaydının hangi lookup kümesine ait olduğunu belirten ayraç.
/// Eski sistemin serbest-string "defType" deseninin (WASTELOC/WASTETYPE…) type-safe karşılığı:
/// tüm tanım listeleri tek tabloda tutulur, bu enum ile gruplanır, diğer modüller FK ile bağlanır.
/// </summary>
public enum DefinitionType
{
    /// <summary>Atık lokasyonu / nokta (ör. İzmir Depo, İzaydaş, AGT Atık).</summary>
    WasteLocation = 0,

    /// <summary>Atık tipi (ör. OKTABİN, PALET-150103).</summary>
    WasteType = 1,

    /// <summary>İade grubu (ör. BİYOYAKIT-KATI, İMHA-CAM).</summary>
    ReturnGroup = 2,

    /// <summary>Atık grubu (ör. GERİ KAZANIM-KATI).</summary>
    WasteGroup = 3,

    /// <summary>İşlem türü (ör. BİYOYAKIT, ENDÜSTRİYEL).</summary>
    ProcessType = 4,

    /// <summary>Ürün grubu.</summary>
    ProductGroup = 5,
}
