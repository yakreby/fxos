using System.ComponentModel.DataAnnotations;
using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Documents;
using FxOs.Domain.Documents;
using FxOs.Shared.Results;
using FxOs.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonnelEntity = FxOs.Domain.Personnel.Personnel;
using ValidationException = FxOs.Application.Common.Exceptions.ValidationException;

namespace FxOs.API.Controllers;

/// <summary>
/// Belge yönetimi (özlük belgeleri). Liste/oluştur bir personele bağlıdır; dosya içeriği
/// <see cref="IFileStorage"/> ile saklanır (yerel/R2). <c>documents.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Authorize]
public sealed class DocumentsController : ControllerBase
{
    private const long MaxFileBytes = 20 * 1024 * 1024; // 20 MB
    private static readonly string[] AllowedExtensions =
        { ".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".xls", ".xlsx", ".txt" };

    private readonly IUnitOfWork _uow;
    private readonly IFileStorage _storage;

    public DocumentsController(IUnitOfWork uow, IFileStorage storage)
    {
        _uow = uow;
        _storage = storage;
    }

    [HttpGet("api/personnel/{personnelId:guid}/documents")]
    [HasPermission(Permissions.Documents.View)]
    public async Task<IActionResult> List(Guid personnelId, CancellationToken ct)
    {
        var docs = await _uow.Repository<Document>().Query()
            .Where(d => d.PersonnelId == personnelId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(ct);

        var today = DateTime.UtcNow.Date;
        var items = docs.Select(d => ToDto(d, today)).ToList();
        return Ok(Result<IReadOnlyList<DocumentDto>>.Success(items));
    }

    [HttpPost("api/personnel/{personnelId:guid}/documents")]
    [HasPermission(Permissions.Documents.Create)]
    [RequestSizeLimit(MaxFileBytes + (1 * 1024 * 1024))]
    public async Task<IActionResult> Create(Guid personnelId, [FromForm] CreateDocumentForm form, CancellationToken ct)
    {
        if (!await _uow.Repository<PersonnelEntity>().ExistsAsync(personnelId, ct))
            throw new NotFoundException("Personel", personnelId);

        EnsureTypeValid(form.Type);
        ValidateFile(form.File);

        StoredObject stored;
        await using (var stream = form.File.OpenReadStream())
        {
            stored = await _storage.SaveAsync(new StorageSaveRequest
            {
                Content = stream,
                FileName = form.File.FileName,
                ContentType = form.File.ContentType,
                KeyPrefix = $"personnel/{personnelId}",
            }, ct);
        }

        var doc = new Document
        {
            PersonnelId = personnelId,
            Title = form.Title.Trim(),
            Type = form.Type,
            IssueDate = form.IssueDate,
            ExpiryDate = form.ExpiryDate,
            Notes = Normalize(form.Notes),
            StorageKey = stored.Key,
            StorageProvider = stored.Provider,
            FileName = form.File.FileName,
            ContentType = string.IsNullOrWhiteSpace(form.File.ContentType)
                ? "application/octet-stream"
                : form.File.ContentType,
            FileSizeBytes = form.File.Length,
        };

        await _uow.Repository<Document>().AddAsync(doc, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(doc.Id, "Belge yüklendi."));
    }

    [HttpGet("api/documents/{id:guid}/download")]
    [HasPermission(Permissions.Documents.View)]
    public async Task<IActionResult> Download(Guid id, CancellationToken ct)
    {
        var doc = await _uow.Repository<Document>().GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Belge", id);

        var stream = await _storage.OpenReadAsync(doc.StorageKey, ct)
            ?? throw new NotFoundException("Belge dosyası depoda bulunamadı.");

        return File(stream, doc.ContentType, doc.FileName);
    }

    [HttpPut("api/documents/{id:guid}")]
    [HasPermission(Permissions.Documents.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDocumentRequest request, CancellationToken ct)
    {
        EnsureTypeValid(request.Type);

        var repo = _uow.Repository<Document>();
        var doc = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Belge", id);

        doc.Title = request.Title.Trim();
        doc.Type = request.Type;
        doc.IssueDate = request.IssueDate;
        doc.ExpiryDate = request.ExpiryDate;
        doc.Notes = Normalize(request.Notes);

        repo.Update(doc);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Belge güncellendi."));
    }

    [HttpDelete("api/documents/{id:guid}")]
    [HasPermission(Permissions.Documents.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Document>();
        var doc = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Belge", id);

        repo.Remove(doc);
        await _uow.SaveChangesAsync(ct);

        // Kayıt soft-delete; fiziksel dosyayı depodan kaldır (alanı boşa çıkar).
        await _storage.DeleteAsync(doc.StorageKey, ct);

        return Ok(Result.Success("Belge silindi."));
    }

    private static DocumentDto ToDto(Document d, DateTime today)
    {
        int? days = d.ExpiryDate is DateTime exp ? (int)(exp.Date - today).TotalDays : null;
        return new DocumentDto
        {
            Id = d.Id,
            PersonnelId = d.PersonnelId,
            Title = d.Title,
            Type = d.Type,
            TypeLabel = DocumentTypeLabels.Of(d.Type),
            IssueDate = d.IssueDate,
            ExpiryDate = d.ExpiryDate,
            Notes = d.Notes,
            FileName = d.FileName,
            ContentType = d.ContentType,
            FileSizeBytes = d.FileSizeBytes,
            CreatedAt = d.CreatedAt,
            IsExpired = days is < 0,
            DaysToExpiry = days,
        };
    }

    private static void ValidateFile(IFormFile? file)
    {
        if (file is null || file.Length == 0)
            throw new ValidationException("Dosya boş veya seçilmedi.");
        if (file.Length > MaxFileBytes)
            throw new ValidationException("Dosya boyutu 20 MB sınırını aşıyor.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new ValidationException($"İzin verilmeyen dosya türü: {(string.IsNullOrEmpty(ext) ? "(uzantısız)" : ext)}");
    }

    private static void EnsureTypeValid(DocumentType type)
    {
        if (!Enum.IsDefined(type))
            throw new ValidationException("Geçersiz belge türü.");
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

/// <summary>Belge yükleme formu (multipart: meta veri + dosya).</summary>
public sealed class CreateDocumentForm
{
    [Required(ErrorMessage = "Başlık zorunludur."), MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public DocumentType Type { get; set; } = DocumentType.Other;

    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    [Required(ErrorMessage = "Dosya zorunludur.")]
    public IFormFile File { get; set; } = null!;
}
