---
name: toronto-web-navigator
description: Navigate City of Toronto websites, extract structured data from toronto.ca and Open Data Portal, and interact with embedded ArcGIS maps
user_invocable: true
allowedTools:
  - mcp__claude-in-chrome__tabs_create_mcp
  - mcp__claude-in-chrome__tabs_context_mcp
  - mcp__claude-in-chrome__navigate
  - mcp__claude-in-chrome__read_page
  - mcp__claude-in-chrome__get_page_text
  - mcp__claude-in-chrome__javascript_tool
  - mcp__claude-in-chrome__find
  - mcp__claude-in-chrome__computer
  - mcp__claude-in-chrome__form_input
  - mcp__claude-in-chrome__read_network_requests
  - WebFetch
  - WebSearch
  - Write
  - Read
  - Bash
  - Glob
  - Grep
---

# Toronto Web Navigator Skill

You navigate City of Toronto websites, extract data, and work with embedded maps. You know the structure of toronto.ca, the Open Data Portal, and ArcGIS services.

## Data Source Priority

Always check sources in this order:
1. **Open Data Portal API** (structured, machine-readable) — try this FIRST
2. **ArcGIS REST Services** (geospatial, queryable) — try for map/location data
3. **Website scraping** (browser automation) — last resort for data not available via API

## City of Toronto Open Data Portal

### CKAN API Base URL
```
https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/
```

### Key API Endpoints

**Search for datasets:**
```
GET /api/3/action/package_search?q={query}&rows=10
```

**Get dataset details:**
```
GET /api/3/action/package_show?id={dataset-slug}
```

**Get resource data (if datastore enabled):**
```
GET /api/3/action/datastore_search?resource_id={resource-id}&limit=100
```

### Key Datasets

| Domain | Dataset Slug | Format | Description |
|--------|-------------|--------|-------------|
| **Community Centers** | `community-recreation-centres` | CSV, GeoJSON | All community rec centres with locations |
| **Libraries** | `library-branch-general-information` | CSV | Library branches, addresses, hours |
| **Parks** | `parks` | GeoJSON, SHP | Park boundaries and amenities |
| **Cycling Network** | `cycling-network` | GeoJSON, SHP | Bike lanes, trails, paths |
| **TTC Routes** | `ttc-routes-and-schedules` | GTFS | Transit routes, stops, schedules |
| **TTC Subway Stations** | `ttc-subway-shapefiles` | SHP | Subway station locations |
| **Neighbourhoods** | `neighbourhoods` | GeoJSON, SHP | 158 neighbourhood boundaries |
| **Address Points** | `address-points-municipal-toronto-address-points` | SHP, CSV | All municipal addresses |
| **Recreation Programs** | `registered-programs-and-drop-in-courses-offering` | CSV | Program listings |
| **Shelters** | `daily-shelter-overnight-service-occupancy-capacity` | CSV | Shelter capacity data |
| **Washrooms** | `washroom-facilities` | CSV | Public washroom locations |
| **Drinking Water** | `drinking-fountains` | CSV | Drinking fountain locations |

### Fetching Data Pattern

```bash
# Step 1: Get dataset metadata
curl "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=community-recreation-centres"

# Step 2: Find the resource you want (GeoJSON, CSV, etc.) from the response
# Step 3: Fetch the resource URL directly
```

Using WebFetch:
1. Fetch package metadata from CKAN API
2. Parse response to find resource URLs
3. Fetch the actual data resource

## ArcGIS REST Services

### Base URLs
- Primary: `https://gis.toronto.ca/arcgis/rest/services/`
- Services directory: Navigate to base URL to see all available services

### Common Services
- `cot_geospatial/MapServer` — general city feature layers
- `cot_geospatial2/MapServer` — additional feature layers
- `primary/cot_geospatial_mtm/MapServer` — layers in MTM projection

### Query Pattern
```
GET https://gis.toronto.ca/arcgis/rest/services/{service}/MapServer/{layerId}/query
  ?where=1=1
  &outFields=*
  &f=geojson
  &outSR=4326
  &resultRecordCount=1000
  &resultOffset=0
```

### Discovering Layers
```
GET https://gis.toronto.ca/arcgis/rest/services/{service}/MapServer?f=json
```
Returns all layers with IDs, names, and geometry types.

### Spatial Query
```
GET .../query
  ?geometry={xmin},{ymin},{xmax},{ymax}
  &geometryType=esriGeometryEnvelope
  &inSR=4326
  &spatialRel=esriSpatialRelIntersects
  &outFields=*
  &f=geojson
```

## Toronto.ca Website Structure

### Key Sections

| URL Pattern | Content Type |
|-------------|-------------|
| `toronto.ca/services-payments/` | Service listings, how-to guides |
| `toronto.ca/community-people/` | Community centers, recreation, social services |
| `toronto.ca/city-government/` | Council, committees, policies |
| `toronto.ca/data-research-maps/` | Open data, research, interactive maps |
| `toronto.ca/explore-enjoy/` | Parks, recreation, culture, events |
| `toronto.ca/home/311/` | 311 service requests |

### Common Page Patterns

**Service Directory Pages:**
- List format with name, address, phone
- Often have embedded Google Maps or ArcGIS maps
- May link to Open Data for machine-readable version

**Facility Pages:**
- Individual pages per facility (community center, library branch)
- Contain hours, programs, contact info, accessibility
- Address in consistent format

**Committee/Report Pages:**
- PDF documents linked from agenda pages
- Decision documents with item numbers
- Structured agenda format

### Embedded Maps

Toronto.ca uses several map technologies:
1. **ArcGIS Web AppBuilder** — most interactive maps. Look for iframe URLs pointing to `gis.toronto.ca` or `experience.arcgis.com`
2. **ArcGIS StoryMaps** — narrative maps. URLs like `storymaps.arcgis.com`
3. **Google Maps embeds** — simple location markers
4. **Custom map applications** — some departments have custom builds

**Strategy for embedded maps:**
1. Inspect the page for iframe src URLs
2. If ArcGIS-based, extract the service URL and layer IDs
3. Query the ArcGIS REST API directly (faster and more reliable than scraping the map UI)

## Browser Automation Workflow

When the Open Data Portal and ArcGIS APIs don't have what you need:

### 1. Start Session
```
mcp__claude-in-chrome__tabs_context_mcp  → See current browser state
mcp__claude-in-chrome__tabs_create_mcp   → Open new tab
```

### 2. Navigate
```
mcp__claude-in-chrome__navigate → Go to toronto.ca URL
```

### 3. Read Content
```
mcp__claude-in-chrome__read_page → Get rendered page content (visual)
mcp__claude-in-chrome__get_page_text → Get plain text content
```

### 4. Extract Data from Embedded Maps
```
mcp__claude-in-chrome__javascript_tool → Execute JS to:
  - Find iframe src URLs
  - Extract ArcGIS service endpoints
  - Read map layer configurations
  - Pull data from map popups
```

Example JS to find ArcGIS endpoints:
```javascript
// Find all iframes that might contain maps
const iframes = document.querySelectorAll('iframe');
const mapUrls = Array.from(iframes)
  .map(f => f.src)
  .filter(src => src.includes('arcgis') || src.includes('gis.toronto'));
return JSON.stringify(mapUrls);
```

### 5. Search for Specific Content
```
mcp__claude-in-chrome__find → Search visible text on page
```

### 6. Interact with Forms/Filters
```
mcp__claude-in-chrome__form_input → Fill search forms, dropdowns
mcp__claude-in-chrome__computer → Click buttons, interact with UI
```

### 7. Monitor Network Traffic (for discovering APIs)
```
mcp__claude-in-chrome__read_network_requests → See what APIs the page calls
```
This is especially useful for discovering undocumented API endpoints that interactive maps call.

## Data Extraction Output

When extracting data, save in structured format:

```markdown
# Toronto Data: [Topic]

**Source:** [URL or API endpoint]
**Date Extracted:** [YYYY-MM-DD]
**Format:** [GeoJSON / CSV / JSON]

## Summary
[What this data contains]

## Data File
Saved to: `./knowledge-base/research/toronto-[topic]-data.[format]`

## Schema
| Field | Type | Description |
|-------|------|-------------|
| ... | ... | ... |

## API Endpoint (for live data)
```
[The API URL that can be called to get fresh data]
```

## Notes
[Any caveats, update frequency, or data quality notes]
```

## Workflow

1. **Parse user request** — what Toronto data do they need?
2. **Check Open Data Portal first** — search CKAN API for relevant datasets
3. **Check ArcGIS services** — if geospatial data, query REST services
4. **Browser automation** — only if APIs don't have what's needed
5. **Extract and structure data** — normalize to JSON/GeoJSON
6. **Save results** — to `./knowledge-base/research/toronto-[topic].[ext]`
7. **Report findings** — summarize what was found, where it came from, and how to access it

## Integration with Other Skills

- **`map-integration`** → provides geospatial data for map layers
- **`web-research`** → complements with general internet research when Toronto-specific data isn't available
- **`llm-integration`** → extracted data can be used as RAG context for AI features
- **`system-design`** → informs data model design based on available Toronto data
