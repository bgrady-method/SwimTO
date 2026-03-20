using System.Net;
using HtmlAgilityPack;

namespace Api.Services;

public class WebFetchService(IHttpClientFactory httpClientFactory, ILogger<WebFetchService> logger)
{
    private const int MaxContentLength = 8000;
    private static readonly HashSet<string> BlockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];
    private static readonly string[] StripTags = ["script", "style", "nav", "footer", "header", "noscript", "svg"];

    public async Task<string> FetchAsync(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return "Error: Invalid URL format.";

        if (uri.Scheme != "https")
            return "Error: Only HTTPS URLs are allowed.";

        if (BlockedHosts.Contains(uri.Host) || IsPrivateIp(uri.Host))
            return "Error: Access to private/local addresses is blocked.";

        try
        {
            var client = httpClientFactory.CreateClient("WebFetch");
            var response = await client.GetAsync(uri);
            if (!response.IsSuccessStatusCode)
                return $"Error: HTTP {(int)response.StatusCode} {response.ReasonPhrase}";

            var html = await response.Content.ReadAsStringAsync();
            return ExtractText(html);
        }
        catch (TaskCanceledException)
        {
            return "Error: Request timed out.";
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "WebFetch failed for {Url}", url);
            return $"Error: Failed to fetch page - {ex.Message}";
        }
    }

    private static string ExtractText(string html)
    {
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Remove unwanted tags
        foreach (var tag in StripTags)
        {
            var nodes = doc.DocumentNode.SelectNodes($"//{tag}");
            if (nodes != null)
                foreach (var node in nodes)
                    node.Remove();
        }

        var text = doc.DocumentNode.InnerText;

        // Clean up whitespace
        text = System.Text.RegularExpressions.Regex.Replace(text, @"[ \t]+", " ");
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\n\s*\n+", "\n\n");
        text = text.Trim();

        if (text.Length > MaxContentLength)
            text = text[..MaxContentLength] + "\n\n[Content truncated]";

        return text;
    }

    private static bool IsPrivateIp(string host)
    {
        if (!IPAddress.TryParse(host, out var ip)) return false;
        var bytes = ip.GetAddressBytes();
        return bytes[0] switch
        {
            10 => true,
            172 => bytes[1] >= 16 && bytes[1] <= 31,
            192 => bytes[1] == 168,
            _ => false,
        };
    }
}
