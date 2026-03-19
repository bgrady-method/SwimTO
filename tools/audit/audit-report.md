# SwimTO Data Audit Report

*Generated: 2026-03-19T20:21:24.416Z*

## Executive Summary

| Metric | Count |
|--------|-------|
| Seed Pools | 31 |
| Toronto Pools (unique locations) | 122 |
| Matched | 31 |
| Unmatched (in seed, not in Toronto) | 0 |
| Missing (in Toronto, not in seed) | 91 |
| Field Discrepancies | 50 |

> **Schedule Note:** ALL schedules in SeedData are algorithmically generated and do NOT reflect real Toronto schedules. Real drop-in schedule data is available via the Toronto Open Data API.

## Adversarial Review Summary

| Review Path | Count |
|-------------|-------|
| agreed | 31 |

## Pool Audit Overview

| # | Seed Pool | Match | Review Path | Toronto Pool | Issues |
|---|-----------|-------|-------------|-------------|--------|
| 1 | Pam McConnell Aquatic Centre | confirmed | agreed | Pam McConnell Aquatic Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Phone(MISMATCH) |
| 2 | John Innes Community Recreation Centre | confirmed | agreed | John Innes Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 3 | Sunnyside Gus Ryder Outdoor Pool | confirmed | agreed | Sunnyside Gus Ryder Outdoor Pool | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH), Website(UNVERIFIABLE) |
| 4 | Riverdale Park East | confirmed | agreed | Riverdale Park East | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 5 | Donald D. Summerville Olympic Pools | confirmed | agreed | Donald D. Summerville Olympic Pools | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH), Website(UNVERIFIABLE) |
| 6 | Harrison Pool | confirmed | agreed | Harrison Pool | Address(MISMATCH), Length (meters)(MISMATCH), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 7 | Scadding Court Community Centre | confirmed | agreed | Scadding Court Community Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 8 | North Toronto Memorial Community Centre | probable | agreed | North Toronto Memorial Community Centre | Address(MISMATCH), Pool Type(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 9 | Matty Eckler Recreation Centre | confirmed | agreed | Matty Eckler Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 10 | Wellesley Community Centre | confirmed | agreed | Wellesley Community Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 11 | Dennis R. Timbrell Resource Centre | confirmed | agreed | Dennis R. Timbrell Resource Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 12 | Agincourt Community Recreation Centre | confirmed | agreed | Agincourt Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 13 | Centennial Recreation Centre - Scarborough | confirmed | agreed | Centennial Recreation Centre - Scarborough | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 14 | Douglas Snow Aquatic Centre | confirmed | agreed | Douglas Snow Aquatic Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 15 | Joseph J. Piccininni Community Recreation Centre | confirmed | agreed | Joseph J. Piccininni Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 16 | Monarch Park | confirmed | agreed | Monarch Park | Address(MISMATCH), Length (meters)(MISMATCH), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 17 | Christie Pits Park | confirmed | agreed | Christie Pits Park | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 18 | Greenwood Park | confirmed | agreed | Greenwood Park | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 19 | McGregor Park Community Centre | confirmed | agreed | McGregor Park Community Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 20 | Rouge Valley Community Recreation Centre | confirmed | agreed | Rouge Valley Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 21 | Weston Lions Park | confirmed | agreed | Weston Lions Park | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 22 | Grandravine Community Recreation Centre | confirmed | agreed | Grandravine Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 23 | Etobicoke Olympium | confirmed | agreed | Etobicoke Olympium | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 24 | S.H. Armstrong Community Recreation Centre | confirmed | agreed | S.H. Armstrong Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 25 | Leaside Gardens Indoor Pool | probable | agreed | Leaside Gardens Indoor Pool | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH), Phone(UNVERIFIABLE), Website(UNVERIFIABLE) |
| 26 | Wallace Emerson Community Recreation Centre | confirmed | agreed | Wallace Emerson Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE), Accessibility(MISMATCH) |
| 27 | Gus Ryder Pool and Health Club | confirmed | agreed | Gus Ryder Pool and Health Club | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 28 | Jimmie Simpson Recreation Centre | confirmed | agreed | Jimmie Simpson Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 29 | Parkdale Community Recreation Centre | confirmed | agreed | Parkdale Community Recreation Centre | Address(MISMATCH), Length (meters)(MISMATCH), Lane Count(UNVERIFIABLE) |
| 30 | Annette Community Recreation Centre | confirmed | agreed | Annette Community Recreation Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |
| 31 | Roding Community Centre | confirmed | agreed | Roding Community Centre | Address(MISMATCH), Length (meters)(UNVERIFIABLE), Lane Count(UNVERIFIABLE) |

## Detailed Discrepancies

### #1 Pam McConnell Aquatic Centre — CONFIRMED [agreed]
**Toronto match:** Pam McConnell Aquatic Centre (Location ID: 2012, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 640 Dundas St E, Toronto | 640 DUNDAS ST E | MISMATCH |  |
| Coordinates | 43.6598, -79.3592 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 8 | 3 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Phone | 416-338-2237 |  416-338-2237 | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 152
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Adapted Leisure Swim, Aquatic Fitness: Shallow, Aquatic Fitness: Shallow (Women), Lane Swim, Lane Swim (Women), Lane Swim: Older Adult, Leisure Swim, Leisure Swim (Women), Leisure Swim: Older Adult, Leisure Swim: Open and Inclusive, Leisure Swim: Preschool

### #2 John Innes Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** John Innes Community Recreation Centre (Location ID: 63, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 150 Sherbourne St, Toronto | 150 SHERBOURNE ST | MISMATCH |  |
| Coordinates | 43.6555, -79.3675 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 48
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Shallow, Lane Swim

### #3 Sunnyside Gus Ryder Outdoor Pool — CONFIRMED [agreed]
**Toronto match:** Sunnyside Gus Ryder Outdoor Pool (Location ID: 433, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 1755 Lake Shore Blvd W, Toronto | 1755 Lake Shore Blvd W | MISMATCH |  |
| Coordinates | 43.6372, -79.4535 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 50 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | false | Partially Accessible | MISMATCH |  |
| Phone | 416-392-0749 | — | SEED ONLY |  |
| Website | — | — | UNVERIFIABLE |  |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #4 Riverdale Park East — CONFIRMED [agreed]
**Toronto match:** Riverdale Park East (Location ID: 343, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 550 Broadview Ave, Toronto | 550 Broadview Ave | MISMATCH |  |
| Coordinates | 43.6687, -79.3536 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | true | None | MISMATCH |  |
| Phone | — | None | TORONTO ONLY |  |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #5 Donald D. Summerville Olympic Pools — CONFIRMED [agreed]
**Toronto match:** Donald D. Summerville Olympic Pools (Location ID: 437, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 1867 Lake Shore Blvd E, Toronto | 1867 Lake Shore Blvd E | MISMATCH |  |
| Coordinates | 43.6613, -79.3157 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 50 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 8 | 3 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | true | None | MISMATCH |  |
| Phone | 416-392-0748 | — | SEED ONLY |  |
| Website | — | — | UNVERIFIABLE |  |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #6 Harrison Pool — CONFIRMED [agreed]
**Toronto match:** Harrison Pool (Location ID: 45, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 15 Stephanie St, Toronto | 15 STEPHANIE ST | MISMATCH |  |
| Coordinates | 43.654, -79.391 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | 20 yards (~18m) | MISMATCH | Converted from yards |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | false | Partially Accessible | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 29 | Toronto sessions: 49
- Seed swim types: Aquafit, Family, Lane Swim, Leisure Swim
- Toronto swim types: Lane Swim, Leisure Swim

### #7 Scadding Court Community Centre — CONFIRMED [agreed]
**Toronto match:** Scadding Court Community Centre (Location ID: 1098, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 707 Dundas St W, Toronto | 707 DUNDAS ST W | MISMATCH |  |
| Coordinates | 43.6522, -79.401 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 88
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Adapted Leisure Swim, Aquatic Fitness: Shallow, Lane Swim, Lane Swim (Women), Lane Swim: Quiet (No Music), Leisure Swim, Leisure Swim (Women), Leisure Swim: Preschool

### #8 North Toronto Memorial Community Centre — PROBABLE [agreed]
**Toronto match:** North Toronto Memorial Community Centre (Location ID: 189, matched via: address_address_match)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 200 Eglinton Ave W, Toronto | 200 EGLINTON AVE W | MISMATCH |  |
| Coordinates | 43.7066, -79.405 | — | SEED ONLY | No coordinates in Toronto data |
| Pool Type | Indoor | Both | MISMATCH |  |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 2 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 28 | Toronto sessions: 201
- Seed swim types: Family, Lane Swim, Leisure Swim, Women Only
- Toronto swim types: Adapted Leisure Swim, Aquatic Fitness: Arthritis, Aquatic Fitness: Deep, Aquatic Fitness: Shallow, Lane Swim, Lane Swim: Older Adult, Lane Swim: Quiet (No Music), Leisure Swim, Leisure Swim: Preschool

### #9 Matty Eckler Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Matty Eckler Recreation Centre (Location ID: 234, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 953 Gerrard St E, Toronto | 953 GERRARD ST E | MISMATCH |  |
| Coordinates | 43.667, -79.338 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | false | Partially Accessible | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 29 | Toronto sessions: 145
- Seed swim types: Aquafit, Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Shallow, Lane Swim, Leisure Swim, Leisure Swim: Older Adult

### #10 Wellesley Community Centre — CONFIRMED [agreed]
**Toronto match:** Wellesley Community Centre (Location ID: 451, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 495 Sherbourne St, Toronto | 495 SHERBOURNE ST | MISMATCH |  |
| Coordinates | 43.665, -79.374 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 29 | Toronto sessions: 239
- Seed swim types: Family, Lane Swim, Leisure Swim, Older Adult
- Toronto swim types: Aquatic Fitness: Boot Camp, Aquatic Fitness: Deep, Aquatic Fitness: Shallow, Aquatic Fitness: Shallow (Women), Aquatic Fitness: Walking, Lane Swim, Lane Swim (Men), Lane Swim (Women), Lane Swim: Older Adult, Leisure Swim, Leisure Swim (Women), Leisure Swim: Older Adult, Leisure Swim: Open and Inclusive, Leisure Swim: Preschool, Leisure Swim: Youth, Level Up - Drop In Lessons (Youth)

### #11 Dennis R. Timbrell Resource Centre — CONFIRMED [agreed]
**Toronto match:** Dennis R. Timbrell Resource Centre (Location ID: 1056, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 29 St Dennis Dr, Toronto | 29 ST DENNIS DR | MISMATCH |  |
| Coordinates | 43.7175, -79.34 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 120
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Shallow, Lane Swim, Leisure Swim, Leisure Swim (Women), Leisure Swim - March Break

### #12 Agincourt Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Agincourt Community Recreation Centre (Location ID: 523, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 31 Glen Watford Dr, Toronto | 31 GLEN WATFORD DR | MISMATCH |  |
| Coordinates | 43.7888, -79.281 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 31 | Toronto sessions: 270
- Seed swim types: Aquafit, Family, Lane Swim, Leisure Swim, Women Only
- Toronto swim types: Aquatic Fitness: Shallow, Lane Swim, Lane Swim: Older Adult, Leisure Swim, Leisure Swim: Preschool

### #13 Centennial Recreation Centre - Scarborough — CONFIRMED [agreed]
**Toronto match:** Centennial Recreation Centre - Scarborough (Location ID: 537, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 1967 Ellesmere Rd, Toronto | 1967 ELLESMERE RD | MISMATCH |  |
| Coordinates | 43.7713, -79.2458 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | true | None | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 124
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Deep, Aquatic Fitness: Shallow, Lane Swim, Lane Swim: Older Adult, Leisure Swim, Leisure Swim (Men)

### #14 Douglas Snow Aquatic Centre — CONFIRMED [agreed]
**Toronto match:** Douglas Snow Aquatic Centre (Location ID: 567, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 5100 Yonge St, Toronto | 5100 YONGE ST | MISMATCH |  |
| Coordinates | 43.725, -79.431 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | false | Partially Accessible | MISMATCH |  |
| Phone | — | None | TORONTO ONLY |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 202
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Arthritis, Aquatic Fitness: Shallow, Lane Swim: Long Course (50m), Lane Swim: Older Adult, Lane Swim: Short Course (25m), Leisure Swim, Leisure Swim: Preschool

### #15 Joseph J. Piccininni Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Joseph J. Piccininni Community Recreation Centre (Location ID: 509, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 1369 St Clair Ave W, Toronto | 1369 ST CLAIR AVE W | MISMATCH |  |
| Coordinates | 43.6773, -79.4523 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | false | Partially Accessible | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 32 | Toronto sessions: 186
- Seed swim types: Aquafit, Family, Lane Swim, Leisure Swim, Older Adult
- Toronto swim types: Aquatic Fitness: Shallow, Lane Swim, Leisure Swim, Leisure Swim (Women), Leisure Swim: Preschool

### #16 Monarch Park — CONFIRMED [agreed]
**Toronto match:** Monarch Park (Location ID: 145, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 115 Felstead Ave, Toronto | 115 Felstead Ave | MISMATCH |  |
| Coordinates | 43.678, -79.338 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | 25m | MISMATCH |  |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | true | None | MISMATCH |  |
| Phone | — | None | TORONTO ONLY |  |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #17 Christie Pits Park — CONFIRMED [agreed]
**Toronto match:** Christie Pits Park (Location ID: 196, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 750 Bloor St W, Toronto | 750 Bloor St W | MISMATCH |  |
| Coordinates | 43.6647, -79.425 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 4 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Phone | — | None | TORONTO ONLY |  |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #18 Greenwood Park — CONFIRMED [agreed]
**Toronto match:** Greenwood Park (Location ID: 70, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 150 Greenwood Ave, Toronto | 150 Greenwood Ave | MISMATCH |  |
| Coordinates | 43.67, -79.327 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Phone | — | None | TORONTO ONLY |  |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #19 McGregor Park Community Centre — CONFIRMED [agreed]
**Toronto match:** McGregor Park Community Centre (Location ID: 506, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 2231 Lawrence Ave E, Toronto | 2231 LAWRENCE AVE E | MISMATCH |  |
| Coordinates | 43.7468, -79.273 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #20 Rouge Valley Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Rouge Valley Community Recreation Centre (Location ID: 3858, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 8450 Sheppard Ave E, Toronto | 8450 SHEPPARD AVE E | MISMATCH |  |
| Coordinates | 43.792, -79.162 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 2 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | true | None | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 31 | Toronto sessions: 87
- Seed swim types: Family, Lane Swim, Leisure Swim, Older Adult, Women Only
- Toronto swim types: Aquatic Fitness: Deep, Aquatic Fitness: Deep (Women), Aquatic Fitness: Shallow, Aquatic Fitness: Shallow (Women), Aquatic Fitness: Walking, Lane Swim, Lane Swim (Women), Lane Swim: Older Adult, Lane Swim: Quiet (No Music), Leisure Swim, Leisure Swim: Adult, Leisure Swim: Preschool

### #21 Weston Lions Park — CONFIRMED [agreed]
**Toronto match:** Weston Lions Park (Location ID: 508, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 2125 Lawrence Ave W, Toronto | 2125 Lawrence Ave W | MISMATCH |  |
| Coordinates | 43.7134, -79.5167 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 2 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | true | None | MISMATCH |  |
| Phone | — | None | TORONTO ONLY |  |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #22 Grandravine Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Grandravine Community Recreation Centre (Location ID: 647, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 23 Grandravine Dr, Toronto | 23 GRANDRAVINE DR | MISMATCH |  |
| Coordinates | 43.738, -79.47 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

### #23 Etobicoke Olympium — CONFIRMED [agreed]
**Toronto match:** Etobicoke Olympium (Location ID: 892, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 590 Rathburn Rd, Toronto | 590 RATHBURN RD | MISMATCH |  |
| Coordinates | 43.6539, -79.5575 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 50 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 8 | 2 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 128
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Shallow, Lane Swim, Lane Swim: Long Course (50m), Lane Swim: Older Adult, Lane Swim: Short Course (25m), Leisure Swim, Leisure Swim: Family

### #24 S.H. Armstrong Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** S.H. Armstrong Community Recreation Centre (Location ID: 267, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 56 Woodfield Rd, Toronto | 56 WOODFIELD RD | MISMATCH |  |
| Coordinates | 43.6713, -79.317 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | false | Partially Accessible | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 31 | Toronto sessions: 16
- Seed swim types: Aquafit, Family, Lane Swim, Leisure Swim, Women Only
- Toronto swim types: Aquatic Fitness: Shallow (Women), Lane Swim, Leisure Swim, Leisure Swim (Women)

### #25 Leaside Gardens Indoor Pool — PROBABLE [agreed]
**Toronto match:** Leaside Gardens Indoor Pool (Location ID: 542, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 1073 Millwood Rd, Toronto | 1073 Millwood Rd None | MISMATCH |  |
| Coordinates | 43.705, -79.361 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | true | None | MISMATCH |  |
| Phone | — | — | UNVERIFIABLE |  |
| Website | — | — | UNVERIFIABLE |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 29 | Toronto sessions: 156
- Seed swim types: Family, Lane Swim, Leisure Swim, Older Adult
- Toronto swim types: Aquatic Fitness: Arthritis, Aquatic Fitness: Shallow, Lane Swim, Leisure Swim

### #26 Wallace Emerson Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Wallace Emerson Community Recreation Centre (Location ID: 294, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 1260 Dufferin St, Toronto | 1260 DUFFERIN ST | MISMATCH |  |
| Coordinates | 43.663, -79.436 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |
| Accessibility | false | Partially Accessible | MISMATCH |  |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 111
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Arthritis, Aquatic Fitness: Shallow, Lane Swim, Leisure Swim, Leisure Swim: Adult, Leisure Swim: Preschool

### #27 Gus Ryder Pool and Health Club — CONFIRMED [agreed]
**Toronto match:** Gus Ryder Pool and Health Club (Location ID: 896, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 1 Faustina Dr, Toronto | 1 FAUSTINA DR | MISMATCH |  |
| Coordinates | 43.601, -79.505 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 29 | Toronto sessions: 187
- Seed swim types: Aquafit, Family, Lane Swim, Leisure Swim
- Toronto swim types: Aquatic Fitness: Arthritis, Aquatic Fitness: Boot Camp, Aquatic Fitness: Shallow, Aquatic Fitness: Walking, Lane Swim, Leisure Swim, Leisure Swim (Women)

### #28 Jimmie Simpson Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Jimmie Simpson Recreation Centre (Location ID: 58, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 870 Queen St E, Toronto | 870 QUEEN ST E | MISMATCH |  |
| Coordinates | 43.6595, -79.3401 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 2 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 28 | Toronto sessions: 95
- Seed swim types: Family, Lane Swim, Leisure Swim, Women Only
- Toronto swim types: Aquatic Fitness: Shallow, Lane Swim, Leisure Swim, Leisure Swim: Older Adult, Leisure Swim: Preschool

### #29 Parkdale Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Parkdale Community Recreation Centre (Location ID: 243, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 75 Lansdowne Ave, Toronto | 75 LANSDOWNE AVE | MISMATCH |  |
| Coordinates | 43.6421, -79.4443 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | 25m | MISMATCH |  |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 26 | Toronto sessions: 26
- Seed swim types: Family, Lane Swim, Leisure Swim
- Toronto swim types: Lane Swim, Leisure Swim

### #30 Annette Community Recreation Centre — CONFIRMED [agreed]
**Toronto match:** Annette Community Recreation Centre (Location ID: 17, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 333 Annette St, Toronto | 333 ANNETTE ST | MISMATCH |  |
| Coordinates | 43.662, -79.468 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 4 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** Seed schedules are algorithmically generated — replace with Toronto data
- Seed sessions: 32 | Toronto sessions: 167
- Seed swim types: Aquafit, Family, Lane Swim, Leisure Swim, Older Adult
- Toronto swim types: Aquatic Fitness: Arthritis, Aquatic Fitness: Deep, Aquatic Fitness: Shallow, Lane Swim, Lane Swim: Older Adult, Leisure Swim

### #31 Roding Community Centre — CONFIRMED [agreed]
**Toronto match:** Roding Community Centre (Location ID: 744, matched via: pool_type_exact)

| Field | Seed Value | Toronto Value | Status | Note |
|-------|-----------|---------------|--------|------|
| Address | 600 Roding St, Toronto | 600 RODING ST | MISMATCH |  |
| Coordinates | 43.7535, -79.5225 | — | SEED ONLY | No coordinates in Toronto data |
| Length (meters) | 25 | — | UNVERIFIABLE | No length data in Toronto description |
| Lane Count | 6 | 1 tank(s) | UNVERIFIABLE | Toronto provides tank count, not lane count |

**Schedule:** NO SCHEDULE DATA from Toronto for this location

## Missing Pools (In Toronto Data, Not In Seed)

91 Toronto pool locations are not represented in SeedData.

| Location ID | Name | Address | Type | District |
|-------------|------|---------|------|----------|
| 24 | Beaches Recreation Centre | 6 WILLIAMSON RD | Indoor | Toronto and East York |
| 27 | Bedford Park Community Centre | 81 RANLEIGH AVE | Indoor | North York |
| 36 | Earl Beatty Community Centre | 455 GLEBEHOLME BLVD | Indoor | Toronto and East York |
| 39 | Frankland Community Centre | 816 LOGAN AVE | Indoor | Toronto and East York |
| 42 | Antibes Community Centre | 140 ANTIBES DR | Indoor | North York |
| 48 | Hillcrest Community Centre | 1339 BATHURST ST | Indoor | Toronto and East York |
| 85 | Main Square Community Recreation Centre | 245 MAIN ST | Indoor | Toronto and East York |
| 100 | Mary McCormick Recreation Centre | 66 SHERIDAN AVE | Indoor | Toronto and East York |
| 272 | St. Lawrence Community Recreation Centre | 230 THE ESPLANADE | Indoor | Toronto and East York |
| 282 | Swansea Community Recreation Centre | 15 WALLER AVE | Indoor | Toronto and East York |
| 287 | Trinity Community Recreation Centre | 155 CRAWFORD ST | Indoor | Toronto and East York |
| 308 | Fairmount Park Community Centre | 1757 GERRARD ST E | Indoor | Toronto and East York |
| 329 | East York Community Recreation Centre | 1081 1/2 PAPE AVE | Indoor | Toronto and East York |
| 342 | Northview Heights Secondary School | 550 FINCH AVE W | Indoor | North York |
| 357 | Humber Community Pool | 205 HUMBER COLLEGE BLVD | Indoor | Etobicoke York |
| 499 | Cummer Park Community Centre | 6000 LESLIE ST | Indoor | North York |
| 507 | Birchmount Community Centre | 93 BIRCHMOUNT RD | Indoor | Scarborough |
| 510 | Runnymede Collegiate Institute | 569 JANE ST | Indoor | Toronto and East York |
| 795 | The Elms Community School and Pool | 45 Golfdown Dr | Indoor | Etobicoke York |
| 797 | Norseman Community School and Pool | 105 NORSEMAN ST | Indoor | Etobicoke York |
| 891 | Memorial Pool and Health Club | 44 MONTGOMERY RD | Indoor | Etobicoke York |
| 893 | Albion Pool and Health Club | 1485 ALBION RD | Indoor | Etobicoke York |
| 897 | Alderwood Pool | 2 ORIANNA DR | Indoor | Etobicoke York |
| 1110 | Albert Campbell Collegiate Institute | 1550 SANDHURST CIR | Indoor | Scarborough |
| 1143 | Cedarbrae Collegiate Institute | 550 MARKHAM RD | Indoor | Scarborough |
| 1163 | CW Jefferys Collegiate Institute | 340 SENTINEL RD | Indoor | Etobicoke York |
| 1164 | DA Morrison Middle School | 271 GLEDHILL AVE | Indoor | Toronto and East York |
| 1186 | Emery Collegiate Institute | 3395 WESTON RD | Indoor | Etobicoke York |
| 1200 | Georges Vanier Secondary School | 3000 DON MILLS RD E | Indoor | North York |
| 1205 | Gordon A. Brown Middle School | 2800 ST CLAIR AVE E | Indoor | Toronto and East York |
| 1250 | L'Amoreaux Collegiate Institute | 2501 BRIDLETOWNE CIR | Indoor | Scarborough |
| 1255 | Lester B. Pearson Collegiate Institute | 150 TAPSCOTT RD | Indoor | Scarborough |
| 1315 | Sir Oliver Mowat Collegiate Institute | 5400 LAWRENCE AVE E | Indoor | Scarborough |
| 1371 | Vaughan Road Academy | 529 VAUGHAN RD | Indoor | Toronto and East York |
| 1373 | Victoria Park Collegiate Institute | 15 WALLINGFORD RD | Indoor | North York |
| 1381 | West Hill Collegiate Institute | 350 MORNINGSIDE AVE | Indoor | Scarborough |
| 1384 | Weston Collegiate Institute | 100 PINE ST | Indoor | Etobicoke York |
| 1387 | Wexford Collegiate Institute | 1176 PHARMACY AVE | Indoor | Scarborough |
| 1399 | York Mills Collegiate Institute | 490 YORK MILLS RD | Indoor | North York |
| 2773 | Toronto Pan Am Sports Centre | 875 MORNINGSIDE AVE | Indoor | Scarborough |
| 3501 | York Recreation Centre | 115 BLACK CREEK DR | Indoor | Etobicoke York |
| 3732 | One Yonge Community Recreation Centre | 24 Freeland St | Indoor | Toronto East York |
| 3775 | Ethennonnhawahstihnen' Community Recreation Centre and Library | 100 Ethennonnhawahstihnen' Lane | Indoor | North York |
| 7 | Broadlands Community Recreation Centre | 19 CASTLEGROVE BLVD | Outdoor | North York |
| 31 | Alexandra Park | 275 Bathurst St | Outdoor | Toronto and East York |
| 77 | High Park | 1873 Bloor St W | Outdoor | Toronto and East York |
| 352 | Kidstown - Water Park | 3159 Birchmount Rd None | Outdoor | Scarborough |
| 421 | Stan Wadlow Park | 888 Cosburn Ave | Outdoor | Toronto and East York |
| 425 | Leaside Park | 5 Leaside Park Dr | Outdoor | North York |
| 480 | Amesbury Sports Complex | 155 CULFORD RD | Outdoor | Etobicoke York |
| 502 | Fairbank Memorial Park | 2213 Dufferin St | Outdoor | Toronto and East York |
| 504 | Smythe Park | 61 Black Creek Blvd | Outdoor | Etobicoke York |
| 514 | Earlscourt Park | 1200 Lansdowne Ave | Outdoor | Toronto and East York |
| 557 | Blantyre Park | 180 Fallingbrook Rd | Outdoor | Scarborough |
| 575 | Driftwood Community Recreation Centre | 4401 JANE ST | Outdoor | Etobicoke York |
| 633 | Heron Park Community Recreation Centre | 292 MANSE RD | Outdoor | Scarborough |
| 638 | Glen Long Community Centre | 35 GLEN LONG AVE | Outdoor | North York |
| 642 | Gord and Irene Risk Community Recreation Centre | 2650 FINCH AVE W | Outdoor | Etobicoke York |
| 643 | Goulding Community Recreation Centre | 45 GOULDING AVE | Outdoor | North York |
| 664 | Irving W. Chapley Community Centre | 205 WILMINGTON AVE | Outdoor | North York |
| 675 | Lawrence Heights Community Centre | 5 REPLIN RD | Outdoor | North York |
| 678 | Ledbury Park | 160 Ledbury St | Outdoor | North York |
| 690 | Knob Hill Park | 625 Brimley Rd | Outdoor | Scarborough |
| 693 | Mitchell Field Community Centre | 89 CHURCH AVE | Outdoor | North York |
| 703 | Northwood Community Centre | 15 CLUBHOUSE CRT | Outdoor | Etobicoke York |
| 704 | Maryvale Park | 5 Trestleside Grv | Outdoor | Scarborough |
| 714 | Oriole Community Recreation Centre | 2975 DON MILLS RD W | Outdoor | North York |
| 718 | Parkway Forest Park | 80 Parkway Forest Dr | Outdoor | North York |
| 732 | Pleasantview Community Centre | 545 VAN HORNE AVE | Outdoor | North York |
| 760 | Domenico DiLuca Community Recreation Centre | 25 STANLEY RD | Outdoor | Etobicoke York |
| 768 | Halbert Park | 24 Rockwood Dr | Outdoor | Scarborough |
| 773 | Wedgewood Park - Etobicoke | 15 Swan Ave | Outdoor | Etobicoke York |
| 780 | Oakdale Community Centre | 350 GRANDRAVINE DR | Outdoor | Etobicoke York |
| 840 | Eringate Park | 100 Eringate Dr | Outdoor | Etobicoke York |
| 843 | Gihon Spring Park | 75 Gihon Spring Dr | Outdoor | Etobicoke York |
| 847 | Lambton - Kingsway Park | 37 Marquis Ave | Outdoor | Etobicoke York |
| 857 | Ourland Park | 18 Ourland Ave | Outdoor | Etobicoke York |
| 858 | Park Lawn Park | 330 Park Lawn Rd | Outdoor | Etobicoke York |
| 859 | Pine Point Park | 4 Conan Rd | Outdoor | Etobicoke York |
| 867 | Rotary Peace Park | 25 Eleventh St | Outdoor | Etobicoke York |
| 869 | Smithfield Park | 173 Mount Olive Dr | Outdoor | Etobicoke York |
| 873 | West Deane Park | 19 Sedgebrook Cres | Outdoor | Etobicoke York |
| 876 | Westgrove Park | 15 Redgrave Dr | Outdoor | Etobicoke York |
| 877 | Silver Creek Park | 44 Strathdee Dr | Outdoor | Etobicoke York |
| 939 | Amos Waites Park | 2441 Lake Shore Blvd W | Outdoor | Etobicoke York |
| 963 | Flagstaff Park | 42 Mercury Rd | Outdoor | Etobicoke York |
| 1007 | Fairhaven Park | 100 Golfwood Hts | Outdoor | Etobicoke York |
| 1093 | O'Connor Community Centre | 1386 VICTORIA PARK AVE | Outdoor | Toronto and East York |
| 2006 | Westmount Park | 22 Arcade Dr | Outdoor | Etobicoke York |
| 2642 | Dennis Flynn Park | 370 The West Mall | Outdoor | Etobicoke York |
| 2750 | Stanley Park South - Toronto | 700 Wellington St W | Outdoor | Toronto and East York |

## Swim Type Mapping Recommendations

| Seed Type | Toronto Types | Recommendation |
|-----------|--------------|----------------|
| Lane Swim | Lane Swim | Map to: Lane Swim |
| Leisure Swim | Leisure Swim | Map to: Leisure Swim |
| Older Adult | Lane Swim: Older Adult, Leisure Swim: Older Adult | Map to: Lane Swim: Older Adult, Leisure Swim: Older Adult |
| Women Only | Leisure Swim (Women), Lane Swim (Women) | Map to: Leisure Swim (Women), Lane Swim (Women) |
| Aquafit | Aquatic Fitness: Walking, Aquatic Fitness: Mind Body, Aquatic Fitness | Map to: Aquatic Fitness: Walking, Aquatic Fitness: Mind Body, Aquatic Fitness |
| Family | Leisure Swim: Family | Map to: Leisure Swim: Family |

### All Toronto Swim Course Titles

- Adapted Leisure Swim
- Aquatic Fitness: Arthritis
- Aquatic Fitness: Boot Camp
- Aquatic Fitness: Circuit Training
- Aquatic Fitness: Deep
- Aquatic Fitness: Deep (Women)
- Aquatic Fitness: Mind Body
- Aquatic Fitness: Shallow
- Aquatic Fitness: Shallow (Women)
- Aquatic Fitness: Walking
- Aquatic Fitness: Water Walking
- Humber College Swim
- Lane Swim
- Lane Swim (Men)
- Lane Swim (Women)
- Lane Swim: Long Course (50m)
- Lane Swim: Older Adult
- Lane Swim: Quiet (No Music)
- Lane Swim: Short Course (25m)
- Leisure Swim
- Leisure Swim (Men)
- Leisure Swim (Women)
- Leisure Swim - March Break
- Leisure Swim: Adapted
- Leisure Swim: Adult
- Leisure Swim: Adult (Therapeutic Time)
- Leisure Swim: Family
- Leisure Swim: Older Adult
- Leisure Swim: Open and Inclusive
- Leisure Swim: Preschool
- Leisure Swim: Preschool (Girls)
- Leisure Swim: Youth
- Level Up - Drop In Lessons (Youth)