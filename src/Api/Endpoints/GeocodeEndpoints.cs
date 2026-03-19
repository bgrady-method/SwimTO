using Api.Models.Dto;
using Api.Services;

namespace Api.Endpoints;

public static class GeocodeEndpoints
{
    public static void MapGeocodeEndpoints(this WebApplication app)
    {
        app.MapPost("/api/geocode", async (GeocodeRequest request, GeocodingService geocodingService) =>
        {
            var result = await geocodingService.GeocodeAsync(request.Address);
            if (result is null) return Results.NotFound(new { error = "Address not found" });
            return Results.Ok(result);
        });
    }
}
