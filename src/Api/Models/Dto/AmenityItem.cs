using System.Text.Json;

namespace Api.Models.Dto;

public class AmenityItem
{
    public required string Name { get; set; }
    public bool Verified { get; set; }

    /// <summary>
    /// Deserialize AmenitiesJson handling both legacy string[] format and new AmenityItem[] format.
    /// </summary>
    public static AmenityItem[]? DeserializeJson(string? json)
    {
        if (json is null) return null;

        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(json);
            if (doc.ValueKind != JsonValueKind.Array || doc.GetArrayLength() == 0)
                return [];

            // Check first element to determine format
            var first = doc[0];
            if (first.ValueKind == JsonValueKind.String)
            {
                // Legacy format: ["Water Slide", "Sauna"]
                return doc.EnumerateArray()
                    .Select(e => new AmenityItem { Name = e.GetString()!, Verified = false })
                    .ToArray();
            }

            // New format: [{"Name":"Water Slide","Verified":false}]
            return JsonSerializer.Deserialize<AmenityItem[]>(json, CaseInsensitiveOptions) ?? [];
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Extract just amenity names from AmenitiesJson (either format). Used for filtering/facets.
    /// </summary>
    public static string[] DeserializeNames(string? json)
    {
        var items = DeserializeJson(json);
        return items?.Select(a => a.Name).ToArray() ?? [];
    }

    private static readonly JsonSerializerOptions CaseInsensitiveOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };
}
