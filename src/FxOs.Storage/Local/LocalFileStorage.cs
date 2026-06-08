using Microsoft.Extensions.Options;

namespace FxOs.Storage.Local;

/// <summary>
/// Yerel disk depolama. Kök klasör <see cref="LocalStorageOptions.RootPath"/>'ten gelir;
/// göreli verilirse çalışma dizinine göre çözümlenir. Geliştirme/varsayılan sağlayıcı.
/// </summary>
public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _root;

    public string Provider => "local";

    public LocalFileStorage(IOptions<StorageOptions> options)
    {
        var rootPath = options.Value.Local.RootPath;
        _root = Path.IsPathRooted(rootPath)
            ? rootPath
            : Path.Combine(Directory.GetCurrentDirectory(), rootPath);
        Directory.CreateDirectory(_root);
    }

    public async Task<StoredObject> SaveAsync(StorageSaveRequest request, CancellationToken cancellationToken = default)
    {
        var key = StorageKey.Build(request.KeyPrefix, request.FileName);
        var path = ResolvePath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        await using var fs = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None);
        await request.Content.CopyToAsync(fs, cancellationToken);

        return new StoredObject { Key = key, Provider = Provider };
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken = default)
    {
        var path = ResolvePath(key);
        if (!File.Exists(path)) return Task.FromResult<Stream?>(null);

        Stream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream?>(stream);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        var path = ResolvePath(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    /// <summary>Anahtarı kök klasör altına güvenli (traversal'sız) tam yola çözer.</summary>
    private string ResolvePath(string key)
    {
        var safe = key.Replace('\\', '/').TrimStart('/');
        var full = Path.GetFullPath(Path.Combine(_root, safe));
        var rootFull = Path.GetFullPath(_root);
        if (!full.StartsWith(rootFull, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Geçersiz depolama anahtarı.");
        return full;
    }
}
