---
name: map-integration
description: Implement interactive maps with Toronto geospatial data — React Leaflet, ArcGIS REST services, GeoJSON, coordinate systems
user_invocable: true
allowedTools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
---

# Map Integration Skill

You implement interactive maps in React applications using Toronto geospatial data. Covers library selection, data sourcing, component architecture, and performance optimization.

## Library Decision Matrix

| Library | Free? | Tile Source | React Support | Best For | Recommendation |
|---------|-------|-----------|---------------|----------|----------------|
| **React Leaflet** | Yes (OSM tiles) | OpenStreetMap, Mapbox, etc. | `react-leaflet` | Most projects, open data | **Default choice** |
| **Mapbox GL JS** | Free tier (50K loads/mo) | Mapbox | `react-map-gl` | Beautiful styling, 3D | When visuals matter |
| **Google Maps** | $200 free credit/mo | Google | `@vis.gl/react-google-maps` | Familiar UX, Street View | When users expect Google |
| **ArcGIS JS API** | Free (basic) | Esri | `@arcgis/core` | Heavy GIS, ArcGIS data | When using ArcGIS services heavily |

**Default for this project:** React Leaflet with OpenStreetMap tiles. Free, open, works great with Toronto Open Data.

## Setup

### Install Packages

```bash
cd client
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

### Add Leaflet CSS

In `client/index.html` or `main.tsx`:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

Or in `main.tsx`:
```typescript
import 'leaflet/dist/leaflet.css';
```

### Fix Default Marker Icons (Leaflet + Vite issue)

```typescript
// client/src/lib/leaflet-setup.ts
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
```

Import this in `main.tsx` before any map components.

## Toronto Center Coordinates

```typescript
const TORONTO_CENTER: [number, number] = [43.6532, -79.3832]; // City Hall
const TORONTO_BOUNDS: [[number, number], [number, number]] = [
  [43.58, -79.64],  // SW corner
  [43.86, -79.12],  // NE corner
];
const DEFAULT_ZOOM = 12;
```

## Base Map Component

```tsx
// client/src/components/Map/BaseMap.tsx
import { MapContainer, TileLayer } from 'react-leaflet';
import type { ReactNode } from 'react';

interface BaseMapProps {
  children?: ReactNode;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export function BaseMap({
  children,
  center = [43.6532, -79.3832],
  zoom = 12,
  className = 'h-[600px] w-full'
}: BaseMapProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}
```

## City of Toronto Geospatial Data Sources

### Open Data Portal (CKAN API)

Base URL: `https://ckan0.cf.opendata.inter.prod-toronto.ca`

**Key datasets:**

| Dataset | CKAN Package | Format | Contains |
|---------|-------------|--------|----------|
| Community Centers | `community-recreation-centres` | CSV/GeoJSON | Name, address, lat/lng, programs |
| Libraries | `library-branch-general-information` | CSV/GeoJSON | Branch name, address, hours |
| Parks | `parks` | GeoJSON/SHP | Park boundaries, amenities |
| Cycling Network | `cycling-network` | GeoJSON/SHP | Bike lanes, paths, trails |
| TTC Routes | `ttc-routes-and-schedules` | GTFS | Routes, stops, schedules |
| Address Points | `address-points-municipal-toronto-address-points` | SHP/GeoJSON | All addresses with coordinates |
| Neighbourhoods | `neighbourhoods` | GeoJSON/SHP | 158 neighbourhood boundaries |

**API Pattern to fetch a dataset:**
```typescript
// 1. Get package metadata
const pkg = await fetch('https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=community-recreation-centres');
const { result } = await pkg.json();

// 2. Find the GeoJSON resource
const geojsonResource = result.resources.find(
  (r: any) => r.format.toUpperCase() === 'GEOJSON'
);

// 3. Fetch the data
const data = await fetch(geojsonResource.url);
const geojson = await data.json();
```

### ArcGIS REST Services

Base URL: `https://gis.toronto.ca/arcgis/rest/services/`

**Key services:**
- `cot_geospatial/MapServer` — general city layers
- `cot_geospatial2/MapServer` — additional layers
- `primary/cot_geospatial_mtm/MapServer` — MTM projection layers

**Query pattern:**
```
GET https://gis.toronto.ca/arcgis/rest/services/cot_geospatial/MapServer/{layerId}/query
  ?where=1=1
  &outFields=*
  &f=geojson
  &resultRecordCount=1000
  &resultOffset=0
```

**Important:** ArcGIS paginates at 1000 records by default. Use `resultOffset` to paginate:
```typescript
async function fetchAllFeatures(layerUrl: string): Promise<any[]> {
  let allFeatures: any[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const url = `${layerUrl}/query?where=1%3D1&outFields=*&f=geojson&resultRecordCount=${pageSize}&resultOffset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.features || data.features.length === 0) break;
    allFeatures = allFeatures.concat(data.features);
    if (data.features.length < pageSize) break;
    offset += pageSize;
  }

  return allFeatures;
}
```

## Coordinate Systems

| System | EPSG | Used By | Notes |
|--------|------|---------|-------|
| **WGS84** | 4326 | Leaflet, GeoJSON standard, GPS | Lat/lng in degrees. **Use this.** |
| **Web Mercator** | 3857 | Google Maps, Mapbox, tile servers | Meters. Leaflet handles internally. |
| **UTM Zone 17N** | 26917 | City of Toronto surveys, some ArcGIS layers | Meters. Must convert. |
| **MTM Zone 10** | 2019 | Some older Toronto datasets | Meters. Must convert. |

**If ArcGIS returns coordinates in UTM/MTM:**
Add `&outSR=4326` to the query to get WGS84 coordinates directly:
```
?where=1=1&outFields=*&f=geojson&outSR=4326
```

## Backend GeoJSON API

### .NET GeoJSON Endpoint

```csharp
// Simple GeoJSON proxy with caching
app.MapGet("/api/geo/{dataset}", async (string dataset, IMemoryCache cache, HttpClient http) =>
{
    var cacheKey = $"geo_{dataset}";
    if (cache.TryGetValue(cacheKey, out string? cached))
        return Results.Content(cached!, "application/geo+json");

    var ckanUrl = $"https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id={dataset}";
    var pkg = await http.GetFromJsonAsync<CkanResponse>(ckanUrl);
    var geojsonResource = pkg?.Result?.Resources?.FirstOrDefault(r =>
        r.Format.Equals("GEOJSON", StringComparison.OrdinalIgnoreCase));

    if (geojsonResource is null)
        return Results.NotFound($"No GeoJSON resource found for {dataset}");

    var geojson = await http.GetStringAsync(geojsonResource.Url);
    cache.Set(cacheKey, geojson, TimeSpan.FromHours(1));

    return Results.Content(geojson, "application/geo+json");
});
```

## React Map Layer Patterns

### GeoJSON Layer with Popups

```tsx
import { GeoJSON, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { BaseMap } from './BaseMap';

export function CommunityCentersMap() {
  const { data, isLoading } = useQuery({
    queryKey: ['community-centers'],
    queryFn: () => fetch('/api/geo/community-recreation-centres').then(r => r.json()),
  });

  if (isLoading) return <div>Loading map...</div>;

  return (
    <BaseMap>
      {data && (
        <GeoJSON
          data={data}
          onEachFeature={(feature, layer) => {
            layer.bindPopup(`
              <strong>${feature.properties.NAME}</strong><br/>
              ${feature.properties.ADDRESS}
            `);
          }}
        />
      )}
    </BaseMap>
  );
}
```

### Marker Clustering (for large datasets)

```bash
npm install react-leaflet-cluster
```

```tsx
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Marker, Popup } from 'react-leaflet';

export function ClusteredMarkersMap({ points }: { points: GeoPoint[] }) {
  return (
    <BaseMap>
      <MarkerClusterGroup>
        {points.map(point => (
          <Marker key={point.id} position={[point.lat, point.lng]}>
            <Popup>{point.name}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </BaseMap>
  );
}
```

### ArcGIS Layer via esri-leaflet

```bash
npm install esri-leaflet
npm install -D @types/esri-leaflet
```

```tsx
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';

function ArcGISLayer({ url }: { url: string }) {
  const map = useMap();

  useEffect(() => {
    const layer = esri.featureLayer({ url }).addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, url]);

  return null;
}
```

## Performance Strategies

| Dataset Size | Strategy | Implementation |
|-------------|----------|----------------|
| < 500 features | Direct GeoJSON render | `<GeoJSON data={data} />` |
| 500–5,000 | Marker clustering | `react-leaflet-cluster` |
| 5,000–50,000 | Viewport-based loading | Load only visible bbox via API query |
| 50,000+ | Vector tiles | Use Mapbox GL JS or pre-generated tiles |

### Viewport-Based Loading

```tsx
function ViewportLoader() {
  const map = useMap();

  useEffect(() => {
    const loadData = async () => {
      const bounds = map.getBounds();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      const data = await fetch(`/api/geo/features?bbox=${bbox}`).then(r => r.json());
      // Update layer with data
    };

    map.on('moveend', loadData);
    loadData();

    return () => { map.off('moveend', loadData); };
  }, [map]);

  return null;
}
```

## Geocoding for Toronto

| Option | Free? | Best For |
|--------|-------|----------|
| **Toronto Address Points** | Yes | Exact Toronto addresses (download from Open Data) |
| **Nominatim (OSM)** | Yes (rate limited) | General geocoding, fair quality for Toronto |
| **Mapbox Geocoding** | Free tier (100K req/mo) | Good quality, fast |
| **Google Geocoding** | $200 credit/mo | Best quality |

**For MVP:** Use the Toronto Address Points dataset for Toronto-specific geocoding, Nominatim as fallback.

## Workflow

1. **Assess requirements:** What data on the map? How many features? Interactivity needed?
2. **Choose library:** Default to React Leaflet unless Mapbox/ArcGIS has clear advantages
3. **Identify data sources:** Check Toronto Open Data first, then ArcGIS REST services
4. **Design data flow:** Frontend → API proxy → Toronto data source (with caching)
5. **Implement incrementally:**
   - Base map with Toronto center
   - First data layer (simplest dataset)
   - Popups/tooltips
   - Additional layers
   - Clustering or viewport loading if needed
   - Polish (custom icons, legends, controls)

## Integration with Other Skills

- **`toronto-web-navigator`** → discovers data sources and ArcGIS endpoints
- **`dotnet-react-scaffold`** → provides the React + .NET project to add maps to
- **`llm-integration`** → LLM can answer location-based questions using map data
- **`web-research`** → research specific geospatial libraries or APIs
- **`system-design`** → architecture for geospatial data pipeline
