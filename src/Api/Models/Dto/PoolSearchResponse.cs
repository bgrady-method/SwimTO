namespace Api.Models.Dto;

public class PoolSearchResponse
{
    public List<PoolSearchResult> Results { get; set; } = [];
    public FacetCounts? Facets { get; set; }
}
