namespace FxOs.Application.Common.Authorization;

/// <summary>
/// Sistemdeki tüm izinlerin (permission) tek kaynağı. İzinler "modül.aksiyon" biçiminde
/// string'lerdir; rollere claim olarak atanır ve giriş anında kullanıcı principal'ına akar.
/// <see cref="Catalog"/> hem seed (Admin'e tümü) hem de izin matrisi UI'ı için kullanılır.
/// </summary>
public static class Permissions
{
    /// <summary>Rol/kullanıcı claim tipi.</summary>
    public const string ClaimType = "permission";

    public static class Users
    {
        public const string View = "users.view";
        public const string Create = "users.create";
        public const string Update = "users.update";
        public const string Delete = "users.delete";
    }

    public static class Roles
    {
        public const string View = "roles.view";
        public const string Create = "roles.create";
        public const string Update = "roles.update";
        public const string Delete = "roles.delete";
    }

    public static class Personnel
    {
        public const string View = "personnel.view";
        public const string Create = "personnel.create";
        public const string Update = "personnel.update";
        public const string Delete = "personnel.delete";
    }

    public static class Documents
    {
        public const string View = "documents.view";
        public const string Create = "documents.create";
        public const string Update = "documents.update";
        public const string Delete = "documents.delete";
    }

    public static class Definitions
    {
        public const string View = "definitions.view";
        public const string Create = "definitions.create";
        public const string Update = "definitions.update";
        public const string Delete = "definitions.delete";
    }

    public static class Products
    {
        public const string View = "products.view";
        public const string Create = "products.create";
        public const string Update = "products.update";
        public const string Delete = "products.delete";
    }

    public static class GoodsReceipts
    {
        public const string View = "goodsreceipts.view";
        public const string Create = "goodsreceipts.create";
        public const string Update = "goodsreceipts.update";
        public const string Delete = "goodsreceipts.delete";
    }

    public static class Shelves
    {
        public const string View = "shelves.view";
        public const string Create = "shelves.create";
        public const string Update = "shelves.update";
        public const string Delete = "shelves.delete";
    }

    public static class Stock
    {
        public const string View = "stock.view";
        public const string Create = "stock.create";
        public const string Delete = "stock.delete";
    }

    public static class Octabins
    {
        public const string View = "octabins.view";
        public const string Create = "octabins.create";
        public const string Update = "octabins.update";
        public const string Delete = "octabins.delete";
    }

    public static class Separations
    {
        public const string View = "separations.view";
        public const string Create = "separations.create";
        public const string Update = "separations.update";
        public const string Delete = "separations.delete";
    }

    public static class Logs
    {
        public const string View = "logs.view";
    }

    public static class Notifications
    {
        /// <summary>Başka kullanıcılara bildirim gönderme. (Kendi bildirimlerini görmek izin gerektirmez.)</summary>
        public const string Send = "notifications.send";
    }

    public static class PreAccounting
    {
        public const string View = "preaccounting.view";
        public const string Create = "preaccounting.create";
        public const string Update = "preaccounting.update";
        public const string Delete = "preaccounting.delete";
    }

    /// <summary>İzin matrisi için modül-bazlı gruplu katalog (etiketler Türkçe).</summary>
    public static IReadOnlyList<PermissionGroup> Catalog { get; } = new[]
    {
        new PermissionGroup("Users", "Kullanıcılar", new[]
        {
            new PermissionItem(Users.View, "Görüntüleme"),
            new PermissionItem(Users.Create, "Oluşturma"),
            new PermissionItem(Users.Update, "Güncelleme"),
            new PermissionItem(Users.Delete, "Silme"),
        }),
        new PermissionGroup("Roles", "Roller", new[]
        {
            new PermissionItem(Roles.View, "Görüntüleme"),
            new PermissionItem(Roles.Create, "Oluşturma"),
            new PermissionItem(Roles.Update, "Güncelleme"),
            new PermissionItem(Roles.Delete, "Silme"),
        }),
        new PermissionGroup("Personnel", "Personel", new[]
        {
            new PermissionItem(Personnel.View, "Görüntüleme"),
            new PermissionItem(Personnel.Create, "Oluşturma"),
            new PermissionItem(Personnel.Update, "Güncelleme"),
            new PermissionItem(Personnel.Delete, "Silme"),
        }),
        new PermissionGroup("Documents", "Belgeler", new[]
        {
            new PermissionItem(Documents.View, "Görüntüleme"),
            new PermissionItem(Documents.Create, "Yükleme"),
            new PermissionItem(Documents.Update, "Güncelleme"),
            new PermissionItem(Documents.Delete, "Silme"),
        }),
        new PermissionGroup("Definitions", "Tanımlamalar", new[]
        {
            new PermissionItem(Definitions.View, "Görüntüleme"),
            new PermissionItem(Definitions.Create, "Oluşturma"),
            new PermissionItem(Definitions.Update, "Güncelleme"),
            new PermissionItem(Definitions.Delete, "Silme"),
        }),
        new PermissionGroup("Products", "Ürünler", new[]
        {
            new PermissionItem(Products.View, "Görüntüleme"),
            new PermissionItem(Products.Create, "Oluşturma"),
            new PermissionItem(Products.Update, "Güncelleme"),
            new PermissionItem(Products.Delete, "Silme"),
        }),
        new PermissionGroup("GoodsReceipts", "Mal Kabul", new[]
        {
            new PermissionItem(GoodsReceipts.View, "Görüntüleme"),
            new PermissionItem(GoodsReceipts.Create, "Oluşturma"),
            new PermissionItem(GoodsReceipts.Update, "Güncelleme"),
            new PermissionItem(GoodsReceipts.Delete, "Silme"),
        }),
        new PermissionGroup("Shelves", "Raflar", new[]
        {
            new PermissionItem(Shelves.View, "Görüntüleme"),
            new PermissionItem(Shelves.Create, "Oluşturma"),
            new PermissionItem(Shelves.Update, "Güncelleme"),
            new PermissionItem(Shelves.Delete, "Silme"),
        }),
        new PermissionGroup("Stock", "Stok", new[]
        {
            new PermissionItem(Stock.View, "Görüntüleme"),
            new PermissionItem(Stock.Create, "Hareket Ekleme"),
            new PermissionItem(Stock.Delete, "Hareket Silme"),
        }),
        new PermissionGroup("Octabins", "Octabin", new[]
        {
            new PermissionItem(Octabins.View, "Görüntüleme"),
            new PermissionItem(Octabins.Create, "Oluşturma"),
            new PermissionItem(Octabins.Update, "Güncelleme"),
            new PermissionItem(Octabins.Delete, "Silme"),
        }),
        new PermissionGroup("Separations", "Separasyon", new[]
        {
            new PermissionItem(Separations.View, "Görüntüleme"),
            new PermissionItem(Separations.Create, "Oluşturma"),
            new PermissionItem(Separations.Update, "Güncelleme"),
            new PermissionItem(Separations.Delete, "Silme"),
        }),
        new PermissionGroup("Logs", "Loglar", new[]
        {
            new PermissionItem(Logs.View, "Görüntüleme"),
        }),
        new PermissionGroup("Notifications", "Bildirimler", new[]
        {
            new PermissionItem(Notifications.Send, "Gönderme"),
        }),
        new PermissionGroup("PreAccounting", "Ön Muhasebe", new[]
        {
            new PermissionItem(PreAccounting.View, "Görüntüleme"),
            new PermissionItem(PreAccounting.Create, "Oluşturma"),
            new PermissionItem(PreAccounting.Update, "Güncelleme"),
            new PermissionItem(PreAccounting.Delete, "Silme"),
        }),
    };

    /// <summary>Tüm izin anahtarları (düz liste).</summary>
    public static IReadOnlyList<string> All { get; } =
        Catalog.SelectMany(g => g.Items.Select(i => i.Key)).ToArray();

    /// <summary>Verilen anahtarın geçerli (katalogda tanımlı) olup olmadığı.</summary>
    public static bool IsValid(string permission) => All.Contains(permission);
}

/// <summary>İzin kataloğunda bir modül grubu.</summary>
public sealed record PermissionGroup(string Module, string ModuleLabel, IReadOnlyList<PermissionItem> Items);

/// <summary>Tek bir izin (anahtar + insan-okur etiket).</summary>
public sealed record PermissionItem(string Key, string Label);
