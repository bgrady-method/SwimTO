using Api.Data;
using Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public class KnowledgeService(AppDbContext db)
{
    public async Task<KnowledgeEntry> SaveAsync(int? poolId, string topic, string fact, string? sourceUrl, double confidence)
    {
        var entry = new KnowledgeEntry
        {
            PoolId = poolId,
            Topic = topic,
            Fact = fact,
            SourceUrl = sourceUrl,
            Confidence = confidence,
            VerifiedAt = DateTime.UtcNow,
        };
        db.KnowledgeEntries.Add(entry);
        await db.SaveChangesAsync();
        return entry;
    }

    public async Task<List<KnowledgeEntry>> GetForPoolAsync(int poolId, string? topic = null)
    {
        var query = db.KnowledgeEntries.Where(k => k.PoolId == poolId);
        if (topic is not null)
            query = query.Where(k => k.Topic == topic);
        return await query.OrderByDescending(k => k.DiscoveredAt).ToListAsync();
    }

    public async Task<List<KnowledgeEntry>> SearchAsync(string query, int limit = 10)
    {
        var lower = query.ToLower();
        return await db.KnowledgeEntries
            .Where(k => k.Fact.ToLower().Contains(lower) || k.Topic.ToLower().Contains(lower))
            .OrderByDescending(k => k.Confidence)
            .ThenByDescending(k => k.DiscoveredAt)
            .Take(limit)
            .ToListAsync();
    }
}
