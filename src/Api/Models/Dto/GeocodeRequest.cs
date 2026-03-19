namespace Api.Models.Dto;

public class GeocodeRequest
{
    public required string Address { get; set; }
}

public class GeocodeResult
{
    public double Lat { get; set; }
    public double Lng { get; set; }
    public string? DisplayName { get; set; }
}
