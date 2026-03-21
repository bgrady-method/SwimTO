using Api.Data;
using Api.Endpoints;
using Api.Services;
using Api.Services.DataSync;
using dotenv.net;
using Microsoft.EntityFrameworkCore;
using Serilog;

// Load .env from project root (two levels up from src/Api/)
DotEnv.Load(new DotEnvOptions(envFilePaths: [
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"),
]));

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((ctx, config) => config
    .ReadFrom.Configuration(ctx.Configuration)
    .WriteTo.Console());

// CORS for React dev server
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// EF Core + SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=swimto.db"));

// Caching
builder.Services.AddMemoryCache();

// HTTP clients
builder.Services.AddHttpClient("Nominatim", client =>
{
    client.BaseAddress = new Uri("https://nominatim.openstreetmap.org/search");
    client.DefaultRequestHeaders.Add("User-Agent", "SwimTO/1.0 (toronto-pool-finder)");
});

builder.Services.AddHttpClient("TorontoOpenData", client =>
{
    client.BaseAddress = new Uri("https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/");
    client.DefaultRequestHeaders.Add("User-Agent", "SwimTO/1.0 (toronto-pool-finder)");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// HTTP client for web fetching
builder.Services.AddHttpClient("WebFetch", client =>
{
    client.DefaultRequestHeaders.Add("User-Agent", "SwimTO/1.0 (toronto-pool-finder)");
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Services
builder.Services.AddScoped<PoolRankingService>();
builder.Services.AddScoped<PoolSearchService>();
builder.Services.AddScoped<GeocodingService>();
builder.Services.AddScoped<WebFetchService>();
builder.Services.AddScoped<KnowledgeService>();
builder.Services.AddScoped<ChatToolExecutor>();
builder.Services.AddScoped<ChatService>();

// Data sync
builder.Services.AddScoped<TorontoOpenDataClient>();
builder.Services.AddScoped<PoolDataSyncService>();
builder.Services.AddScoped<PoolEnrichmentService>();
builder.Services.AddHostedService<PoolDataSyncBackgroundService>();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseCors();

app.UseDefaultFiles();
app.UseStaticFiles();

// API endpoints
app.MapGet("/api/health", async (AppDbContext db) =>
{
    var lastSync = await db.DataSyncLogs
        .OrderByDescending(l => l.StartedAt)
        .FirstOrDefaultAsync(l => l.Status == "Success");

    var poolCount = await db.Pools.CountAsync(p => p.IsActive);
    var scheduleCount = await db.Schedules.CountAsync();

    return Results.Ok(new
    {
        status = "healthy",
        dataSync = new
        {
            lastSuccess = lastSync?.CompletedAt,
            status = lastSync?.Status ?? "Never",
            poolCount,
            scheduleCount,
        }
    });
});

app.MapGet("/api/data-version", async (AppDbContext db) =>
{
    var lastSync = await db.DataSyncLogs
        .OrderByDescending(l => l.StartedAt)
        .FirstOrDefaultAsync(l => l.Status == "Success");

    if (lastSync?.CompletedAt is null)
        return Results.Ok(new { version = 0L, lastUpdated = (string?)null });

    var version = new DateTimeOffset(lastSync.CompletedAt.Value, TimeSpan.Zero).ToUnixTimeSeconds();
    return Results.Ok(new { version, lastUpdated = lastSync.CompletedAt.Value.ToString("O") });
});

app.MapPoolEndpoints();
app.MapGeocodeEndpoints();
app.MapChatEndpoints();

// SPA fallback for production
app.MapFallbackToFile("index.html");

// Ensure database schema is created (sync service handles data population)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();

    // Add columns/tables that were added after initial DB creation
    // EnsureCreatedAsync() won't modify an existing database
    var conn = db.Database.GetDbConnection();
    await conn.OpenAsync();
    using var cmd = conn.CreateCommand();

    // Enable WAL mode for concurrent reads during background writes
    cmd.CommandText = "PRAGMA journal_mode=WAL";
    await cmd.ExecuteNonQueryAsync();

    // Check and add missing columns to Pools table
    cmd.CommandText = "PRAGMA table_info(Pools)";
    var existingColumns = new HashSet<string>();
    using (var reader = await cmd.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync())
            existingColumns.Add(reader.GetString(1));
    }

    string[] alterStatements = [];
    if (!existingColumns.Contains("AmenitiesJson"))
        alterStatements = [.. alterStatements, "ALTER TABLE Pools ADD COLUMN AmenitiesJson TEXT"];
    if (!existingColumns.Contains("TorontoLocationId"))
        alterStatements = [.. alterStatements, "ALTER TABLE Pools ADD COLUMN TorontoLocationId INTEGER"];
    if (!existingColumns.Contains("ImageUrl"))
        alterStatements = [.. alterStatements, "ALTER TABLE Pools ADD COLUMN ImageUrl TEXT"];

    foreach (var sql in alterStatements)
    {
        cmd.CommandText = sql;
        await cmd.ExecuteNonQueryAsync();
        Log.Information("Applied schema migration: {Sql}", sql);
    }

    // Create KnowledgeEntries table if missing
    cmd.CommandText = """
        CREATE TABLE IF NOT EXISTS KnowledgeEntries (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            PoolId INTEGER,
            Topic TEXT NOT NULL,
            Fact TEXT NOT NULL,
            SourceUrl TEXT,
            Confidence REAL NOT NULL DEFAULT 0,
            DiscoveredAt TEXT NOT NULL DEFAULT (datetime('now')),
            VerifiedAt TEXT,
            FOREIGN KEY (PoolId) REFERENCES Pools(Id) ON DELETE SET NULL
        )
        """;
    await cmd.ExecuteNonQueryAsync();
}

app.Run();
