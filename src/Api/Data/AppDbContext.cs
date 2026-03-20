using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Pool> Pools => Set<Pool>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<DataSyncLog> DataSyncLogs => Set<DataSyncLog>();
    public DbSet<KnowledgeEntry> KnowledgeEntries => Set<KnowledgeEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Pool>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Address).IsRequired().HasMaxLength(300);
            entity.Property(e => e.PoolType).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => new { e.Latitude, e.Longitude });
            entity.HasIndex(e => e.TorontoLocationId).IsUnique().HasFilter("TorontoLocationId IS NOT NULL");
        });

        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SwimType).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Pool)
                .WithMany(p => p.Schedules)
                .HasForeignKey(e => e.PoolId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.PoolId, e.DayOfWeek });
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SessionId).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.SessionId).IsUnique();
        });

        modelBuilder.Entity<DataSyncLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SyncType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.StartedAt);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            entity.HasOne(e => e.ChatSession)
                .WithMany(s => s.Messages)
                .HasForeignKey(e => e.ChatSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<KnowledgeEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Topic).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Fact).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.SourceUrl).HasMaxLength(500);
            entity.HasIndex(e => new { e.PoolId, e.Topic });
            entity.HasOne(e => e.Pool)
                .WithMany()
                .HasForeignKey(e => e.PoolId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
