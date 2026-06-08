namespace FxOs.Storage;

/// <summary>Depolama anahtarı (key) üretimi. Guid tabanlı; orijinal ad ayrıca meta veride saklanır.</summary>
internal static class StorageKey
{
    public static string Build(string? prefix, string fileName)
    {
        var ext = Path.GetExtension(fileName);
        var id = Guid.NewGuid().ToString("N");
        var name = id + ext;
        return string.IsNullOrWhiteSpace(prefix) ? name : $"{prefix.Trim('/')}/{name}";
    }
}
