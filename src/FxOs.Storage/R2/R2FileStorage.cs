using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace FxOs.Storage.R2;

/// <summary>
/// Cloudflare R2 (S3 uyumlu) depolama. Yapılandırma <c>Storage:R2</c>'den gelir.
/// Kimlik bilgileri tanımlanana kadar aktif edilmez (varsayılan sağlayıcı "local").
/// </summary>
public sealed class R2FileStorage : IFileStorage
{
    private readonly IAmazonS3 _client;
    private readonly string _bucket;

    public string Provider => "r2";

    public R2FileStorage(IOptions<StorageOptions> options)
    {
        var r2 = options.Value.R2;
        if (string.IsNullOrWhiteSpace(r2.ServiceUrl) || string.IsNullOrWhiteSpace(r2.Bucket))
            throw new InvalidOperationException(
                "R2 sağlayıcısı seçili ancak 'Storage:R2' yapılandırması eksik (ServiceUrl/Bucket).");

        _bucket = r2.Bucket;

        var config = new AmazonS3Config
        {
            ServiceURL = r2.ServiceUrl,
            ForcePathStyle = true,
            AuthenticationRegion = "auto",
            // R2, AWS SDK v4'ün varsayılan istek/yanıt checksum davranışını tam desteklemez;
            // yalnızca gerekli olduğunda hesapla/doğrula.
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
        };

        _client = new AmazonS3Client(new BasicAWSCredentials(r2.AccessKey, r2.SecretKey), config);
    }

    public async Task<StoredObject> SaveAsync(StorageSaveRequest request, CancellationToken cancellationToken = default)
    {
        var key = StorageKey.Build(request.KeyPrefix, request.FileName);
        var put = new PutObjectRequest
        {
            BucketName = _bucket,
            Key = key,
            InputStream = request.Content,
            ContentType = request.ContentType,
            DisablePayloadSigning = true,
        };
        await _client.PutObjectAsync(put, cancellationToken);
        return new StoredObject { Key = key, Provider = Provider };
    }

    public async Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.GetObjectAsync(_bucket, key, cancellationToken);
            return response.ResponseStream;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken = default)
        => _client.DeleteObjectAsync(_bucket, key, cancellationToken);
}
