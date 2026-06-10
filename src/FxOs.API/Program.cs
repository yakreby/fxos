using System.IO.Compression;
using FxOs.API.Authorization;
using FxOs.API.Common;
using FxOs.API.Middleware;
using FxOs.Application;
using FxOs.Domain.Identity;
using FxOs.Infrastructure;
using FxOs.Persistence;
using FxOs.Persistence.Context;
using FxOs.Persistence.Seed;
using FxOs.Shared.Results;
using FxOs.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.MSSqlServer;

// Açılış (bootstrap) logger'ı: konfigürasyon yüklenmeden önceki hataları da yakalar.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("FxOs API başlatılıyor...");

    var builder = WebApplication.CreateBuilder(args);

    // Ortam-bazlı gizli override (gitignore'lu): gerçek connection string, R2 kimlik bilgileri,
    // seed şifresi gibi sırlar bu dosyada tutulur, repoya girmez. Dev'de
    // "appsettings.Development.local.json", prod'da "appsettings.Production.local.json"
    // (sunucuya FTP ile atılır). Bkz. *.local.json.example.
    builder.Configuration.AddJsonFile(
        $"appsettings.{builder.Environment.EnvironmentName}.local.json",
        optional: true, reloadOnChange: true);

    // --- Serilog: appsettings'ten seviye/sink; DB hazırsa MSSQL sink'i de ekle ---
    builder.Host.UseSerilog((context, services, configuration) =>
    {
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext();

        var connectionString = context.Configuration.GetConnectionString("DefaultConnection");
        var mssqlEnabled = context.Configuration.GetValue<bool>("Serilog:EnableMSSqlSink");
        if (mssqlEnabled && !string.IsNullOrWhiteSpace(connectionString))
        {
            configuration.WriteTo.MSSqlServer(
                connectionString: connectionString,
                sinkOptions: new MSSqlServerSinkOptions
                {
                    TableName = "Logs",
                    SchemaName = "dbo",
                    AutoCreateSqlTable = true
                },
                restrictedToMinimumLevel: LogEventLevel.Warning);
        }
    });

    // --- Katman servisleri (Composition Root) ---
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure();
    builder.Services.AddPersistence(builder.Configuration);
    builder.Services.AddStorage(builder.Configuration);

    // --- Identity (Guid anahtarlı) + EF store'ları ---
    builder.Services
        .AddIdentityCore<ApplicationUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequiredLength = 8;
            options.SignIn.RequireConfirmedAccount = false;
            options.Lockout.MaxFailedAccessAttempts = 5;
        })
        .AddRoles<ApplicationRole>()
        .AddEntityFrameworkStores<FxOsDbContext>()
        .AddSignInManager()
        .AddDefaultTokenProviders();

    // --- Cookie tabanlı kimlik doğrulama (HttpOnly, sliding, 1 hafta) ---
    var expireDays = builder.Configuration.GetValue("Auth:ExpireDays", 7);
    var cookieName = builder.Configuration.GetValue("Auth:CookieName", "FxOs.Auth");

    // SameSite/Secure config'den gelir: dev aynı-site (Lax/SameAsRequest); prod cross-site
    // (frontend vercel.app ↔ API limanyazilim.com) için None/Always. Bkz. appsettings.Production.json.
    var sameSiteMode = Enum.TryParse<SameSiteMode>(
        builder.Configuration.GetValue("Auth:SameSite", "Lax"), ignoreCase: true, out var ss)
        ? ss : SameSiteMode.Lax;
    var cookieSecure = Enum.TryParse<CookieSecurePolicy>(
        builder.Configuration.GetValue("Auth:SecurePolicy", "SameAsRequest"), ignoreCase: true, out var sp)
        ? sp : CookieSecurePolicy.SameAsRequest;

    builder.Services
        .AddAuthentication(IdentityConstants.ApplicationScheme)
        .AddCookie(IdentityConstants.ApplicationScheme, options =>
        {
            options.Cookie.Name = cookieName;
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = sameSiteMode;
            options.Cookie.SecurePolicy = cookieSecure;
            options.ExpireTimeSpan = TimeSpan.FromDays(expireDays);
            options.SlidingExpiration = true;

            // API istemcisi için: yönlendirme yerine Result gövdeli 401/403 döndür.
            options.Events.OnRedirectToLogin = ctx =>
                ApiResponseWriter.WriteResultAsync(
                    ctx.HttpContext, StatusCodes.Status401Unauthorized,
                    Result.Failure("Oturum gerekli. Lütfen giriş yapın."));
            options.Events.OnRedirectToAccessDenied = ctx =>
                ApiResponseWriter.WriteResultAsync(
                    ctx.HttpContext, StatusCodes.Status403Forbidden,
                    Result.Failure("Bu işlem için yetkiniz yok."));
        });

    builder.Services.AddAuthorization();

    // İzin (permission) tabanlı yetkilendirme: "perm:{izin}" policy'lerini dinamik üret + claim kontrolü.
    builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
    builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

    // --- Reverse proxy (Nginx/Apache) TLS sonlandırıyorsa scheme/IP'yi forwarded header'dan al ---
    // IIS/ANCM ile gerekmez (otomatik). ForwardedHeaders:Enabled ile açılır (prod'da true).
    if (builder.Configuration.GetValue("ForwardedHeaders:Enabled", false))
    {
        builder.Services.Configure<ForwardedHeadersOptions>(o =>
        {
            o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            o.KnownNetworks.Clear();
            o.KnownProxies.Clear();
        });
    }

    // --- CORS: frontend origin + kimlik bilgileriyle (cookie) ---
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("FxOsCors", policy => policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
    });

    // --- Response compression (Brotli + Gzip) ---
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.Providers.Add<BrotliCompressionProvider>();
        options.Providers.Add<GzipCompressionProvider>();
        options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
            new[] { "application/json", "application/json; charset=utf-8" });
    });
    builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
    builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

    builder.Services.AddControllers();

    // Model doğrulama hatalarını da standart Result zarfına çevir (ProblemDetails yerine).
    builder.Services.Configure<ApiBehaviorOptions>(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(kvp => kvp.Value?.Errors.Count > 0)
                .SelectMany(kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage))
                .ToArray();

            return new BadRequestObjectResult(Result.Failure("Doğrulama hatası.", errors));
        };
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    var app = builder.Build();

    // --- Açılışta temel rol + admin seed (idempotent) ---
    using (var scope = app.Services.CreateScope())
    {
        try
        {
            await IdentityDataSeeder.SeedAsync(scope.ServiceProvider);
            await DefinitionSeeder.SeedAsync(scope.ServiceProvider);
            await FacilityNodeSeeder.SeedAsync(scope.ServiceProvider);
        }
        catch (Exception seedEx)
        {
            // Seed başarısızlığı API'yi tümden düşürmesin; logla ve devam et.
            Log.Error(seedEx, "Seed sırasında hata oluştu.");
        }
    }

    // --- HTTP pipeline ---
    // Forwarded header'lar en başta işlenmeli (sonraki her şey doğru scheme/IP görsün).
    if (app.Configuration.GetValue("ForwardedHeaders:Enabled", false))
        app.UseForwardedHeaders();

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseResponseCompression();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    else
    {
        // HTTPS yönlendirmesi yalnız üretimde. Dev'de frontend, isteği vite proxy ile
        // http üzerinden gönderir; burada 307→HTTPS yapmak proxy'yi cross-origin'e iter (CORS hatası).
        app.UseHttpsRedirection();
    }

    app.UseCors("FxOsCors");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "FxOs API beklenmedik şekilde sonlandı.");
}
finally
{
    Log.CloseAndFlush();
}
