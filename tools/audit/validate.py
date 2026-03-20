import json, sqlite3, re
from datetime import datetime, timezone
from collections import defaultdict, Counter

# Load CKAN data
with open('C:/MethodDev/not-a-hackathon/tools/audit/ckan_locations.json') as f:
    ckan_locations = json.load(f)

with open('C:/MethodDev/not-a-hackathon/tools/audit/ckan_geojson.json') as f:
    ckan_geojson = json.load(f)

with open('C:/MethodDev/not-a-hackathon/tools/audit/ckan_schedules.json') as f:
    ckan_schedules = json.load(f)

# CKAN facility type map
indoor_lids = [17,24,27,36,39,42,45,48,58,63,85,100,189,234,243,267,272,282,287,294,308,329,342,357,451,499,507,509,510,523,537,542,567,795,797,891,892,893,896,897,1056,1098,1110,1143,1163,1164,1186,1200,1205,1250,1255,1315,1371,1373,1381,1384,1387,1399,2012,2773,3501,3732,3775,3858]
outdoor_lids = [7,31,70,77,145,189,196,343,352,421,425,433,437,480,502,504,506,508,514,557,575,633,638,642,643,647,664,675,678,690,693,703,704,714,718,732,744,760,768,773,780,840,843,847,857,858,859,867,869,873,876,877,939,963,1007,1093,2006,2642,2750]

pool_type_map = {}
for lid in indoor_lids:
    pool_type_map[lid] = 'Indoor'
for lid in outdoor_lids:
    if lid in pool_type_map:
        pool_type_map[lid] = 'Both'
    else:
        pool_type_map[lid] = 'Outdoor'

all_ckan_lids = set(pool_type_map.keys())

# Load DB data
conn = sqlite3.connect('C:/MethodDev/not-a-hackathon/src/Api/swimto.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute('SELECT * FROM Pools')
db_pools = {row['TorontoLocationId']: dict(row) for row in cur.fetchall()}

cur.execute('SELECT * FROM Schedules')
db_schedules_raw = [dict(row) for row in cur.fetchall()]

# Build DB pool id -> locationid map
db_poolid_to_lid = {}
for lid, p in db_pools.items():
    db_poolid_to_lid[p['Id']] = lid

# Group DB schedules by location id
db_schedules_by_lid = defaultdict(list)
for s in db_schedules_raw:
    pid = s['PoolId']
    if pid in db_poolid_to_lid:
        lid = db_poolid_to_lid[pid]
        db_schedules_by_lid[lid].append(s)

# Group CKAN schedules by location id
ckan_schedules_by_lid = defaultdict(list)
for s in ckan_schedules:
    ckan_schedules_by_lid[s['Location ID']].append(s)

conn.close()

# --- VALIDATION ---
issues = []
pool_status_map = {}

def add_issue(lid, name, severity, category, check_id, field, expected, actual, details, fix=""):
    issues.append({
        "poolLocationId": lid,
        "poolName": name or "Unknown",
        "severity": severity,
        "category": category,
        "checkId": check_id,
        "field": field,
        "expected": str(expected) if expected is not None else "null",
        "actual": str(actual) if actual is not None else "null",
        "details": details,
        "suggestedFix": fix
    })

def digits_only(s):
    if not s:
        return ""
    return re.sub(r'[^\d]', '', str(s))

def build_ckan_address(loc):
    parts = []
    sno = str(loc.get('Street No') or '').strip()
    sname = str(loc.get('Street Name') or '').strip()
    stype = str(loc.get('Street Type') or '').strip()
    sdir = str(loc.get('Street Direction') or '').strip()
    if sno and sno != 'None':
        parts.append(sno)
    if sname and sname != 'None':
        parts.append(sname)
    if stype and stype != 'None':
        parts.append(stype)
    if sdir and sdir != 'None':
        parts.append(sdir)
    return ' '.join(parts)

# Check P-01 through P-11 for each CKAN pool
for lid in sorted(all_ckan_lids):
    pool_name_ckan = ""
    loc = ckan_locations.get(str(lid))
    if loc:
        pool_name_ckan = loc.get('Location Name', '')

    # P-01: Pool exists in DB
    if lid not in db_pools:
        add_issue(lid, pool_name_ckan, "critical", "attribute", "P-01", "Existence",
                  "Pool should exist for LocationId %d" % lid, "Missing from DB",
                  "CKAN pool location %d (%s) has no DB record" % (lid, pool_name_ckan),
                  "Add pool record to database")
        pool_status_map[str(lid)] = {"status": "fail", "issueCount": 1}
        continue

    db_pool = db_pools[lid]
    db_name = db_pool['Name'] or ''

    # P-02: Name match (case-insensitive)
    if loc:
        ckan_name = (loc.get('Location Name') or '').strip()
        if ckan_name.lower() != db_name.lower():
            add_issue(lid, db_name, "major", "attribute", "P-02", "Name",
                      ckan_name, db_name,
                      "Name mismatch: CKAN='%s' vs DB='%s'" % (ckan_name, db_name),
                      "Update DB name to '%s'" % ckan_name)

    # P-03: Address match
    if loc:
        ckan_address = build_ckan_address(loc)
        db_address = (db_pool['Address'] or '').strip()
        # Normalize for comparison
        norm_ckan = re.sub(r'[.\s]+$', '', ckan_address).lower().strip()
        norm_db = re.sub(r'[.\s]+$', '', db_address).lower().strip()
        norm_ckan = re.sub(r'\s+', ' ', norm_ckan)
        norm_db = re.sub(r'\s+', ' ', norm_db)
        # Also remove trailing periods within
        norm_ckan = norm_ckan.replace('.', '')
        norm_db = norm_db.replace('.', '')
        if norm_ckan != norm_db:
            add_issue(lid, db_name, "minor", "attribute", "P-03", "Address",
                      ckan_address, db_address,
                      "Address mismatch: CKAN='%s' vs DB='%s'" % (ckan_address, db_address),
                      "Update DB address to '%s'" % ckan_address)

    # P-04, P-05: Coordinates
    geo = ckan_geojson.get(str(lid))
    if geo:
        geom_str = geo.get('geometry', '{}')
        try:
            geom = json.loads(geom_str)
            coords = geom.get('coordinates', [0, 0])
            ckan_lng = float(coords[0])
            ckan_lat = float(coords[1])
        except Exception:
            ckan_lng, ckan_lat = 0.0, 0.0

        db_lat = float(db_pool['Latitude'] or 0)
        db_lng = float(db_pool['Longitude'] or 0)

        # P-04: Latitude
        if db_lat == 0.0:
            add_issue(lid, db_name, "critical", "attribute", "P-04", "Latitude",
                      ckan_lat, db_lat,
                      "Latitude is zero in DB (CKAN has %s)" % ckan_lat,
                      "Set latitude to %s" % ckan_lat)
        else:
            lat_diff = abs(db_lat - ckan_lat)
            if lat_diff > 0.01:
                # >0.01 degrees is ~1.1km, critical
                add_issue(lid, db_name, "critical", "attribute", "P-04", "Latitude",
                          ckan_lat, db_lat,
                          "Latitude differs by %.6f degrees (~%.0f meters) - likely wrong location" % (lat_diff, lat_diff * 111000),
                          "Update latitude to %s" % ckan_lat)
            elif lat_diff > 0.001:
                add_issue(lid, db_name, "major", "attribute", "P-04", "Latitude",
                          ckan_lat, db_lat,
                          "Latitude differs by %.6f degrees (~%.0f meters)" % (lat_diff, lat_diff * 111000),
                          "Update latitude to %s" % ckan_lat)

        # P-05: Longitude
        if db_lng == 0.0:
            add_issue(lid, db_name, "critical", "attribute", "P-05", "Longitude",
                      ckan_lng, db_lng,
                      "Longitude is zero in DB (CKAN has %s)" % ckan_lng,
                      "Set longitude to %s" % ckan_lng)
        else:
            lng_diff = abs(db_lng - ckan_lng)
            if lng_diff > 0.01:
                # >0.01 degrees is ~780m at Toronto's latitude, critical
                add_issue(lid, db_name, "critical", "attribute", "P-05", "Longitude",
                          ckan_lng, db_lng,
                          "Longitude differs by %.6f degrees (~%.0f meters) - likely wrong location" % (lng_diff, lng_diff * 78000),
                          "Update longitude to %s" % ckan_lng)
            elif lng_diff > 0.001:
                add_issue(lid, db_name, "major", "attribute", "P-05", "Longitude",
                          ckan_lng, db_lng,
                          "Longitude differs by %.6f degrees (~%.0f meters)" % (lng_diff, lng_diff * 78000),
                          "Update longitude to %s" % ckan_lng)
    else:
        # No GeoJSON record for this pool - flag as info
        add_issue(lid, db_name, "info", "attribute", "P-04", "GeoJSON",
                  "GeoJSON record", "Missing",
                  "No GeoJSON record in CKAN for location %d - cannot validate coordinates" % lid,
                  "Coordinates cannot be cross-referenced with CKAN GeoJSON")
        db_lat = float(db_pool['Latitude'] or 0)
        db_lng = float(db_pool['Longitude'] or 0)
        if db_lat == 0.0:
            add_issue(lid, db_name, "critical", "attribute", "P-04", "Latitude",
                      "non-zero", db_lat,
                      "Latitude is zero in DB and no GeoJSON record exists for this location",
                      "Manually look up coordinates for this location")
        if db_lng == 0.0:
            add_issue(lid, db_name, "critical", "attribute", "P-05", "Longitude",
                      "non-zero", db_lng,
                      "Longitude is zero in DB and no GeoJSON record exists for this location",
                      "Manually look up coordinates for this location")

    # P-06: Toronto bounds
    db_lat = float(db_pool['Latitude'] or 0)
    db_lng = float(db_pool['Longitude'] or 0)
    if db_lat != 0.0 and db_lng != 0.0:
        if not (43.58 <= db_lat <= 43.86):
            add_issue(lid, db_name, "critical", "attribute", "P-06", "Latitude (bounds)",
                      "[43.58, 43.86]", db_lat,
                      "Latitude %s is outside Toronto bounds" % db_lat,
                      "Fix latitude coordinate")
        if not (-79.65 <= db_lng <= -79.10):
            add_issue(lid, db_name, "critical", "attribute", "P-06", "Longitude (bounds)",
                      "[-79.65, -79.10]", db_lng,
                      "Longitude %s is outside Toronto bounds" % db_lng,
                      "Fix longitude coordinate")

    # P-07: PoolType
    ckan_type = pool_type_map.get(lid, 'Unknown')
    db_type = db_pool['PoolType'] or ''
    if ckan_type.lower() != db_type.lower():
        add_issue(lid, db_name, "major", "attribute", "P-07", "PoolType",
                  ckan_type, db_type,
                  "PoolType mismatch: CKAN=%s vs DB=%s" % (ckan_type, db_type),
                  "Update PoolType to '%s'" % ckan_type)

    # P-08: IsAccessible
    if loc:
        ckan_access = (loc.get('Accessibility') or '').strip()
        ckan_accessible = ckan_access in ('Fully Accessible', 'Partially Accessible')
        db_accessible = bool(db_pool['IsAccessible'])
        if ckan_accessible != db_accessible:
            add_issue(lid, db_name, "minor", "attribute", "P-08", "IsAccessible",
                      ckan_accessible, db_accessible,
                      "Accessibility mismatch: CKAN='%s' -> %s vs DB=%s" % (ckan_access, ckan_accessible, db_accessible),
                      "Update IsAccessible to %s" % ckan_accessible)

    # P-09: Phone
    if geo:
        ckan_phone = geo.get('PHONE', '') or ''
        if ckan_phone == 'None':
            ckan_phone = ''
        db_phone = db_pool['Phone'] or ''
        ckan_digits = digits_only(ckan_phone)
        db_digits = digits_only(db_phone)
        if ckan_digits and db_digits:
            if ckan_digits != db_digits:
                add_issue(lid, db_name, "minor", "attribute", "P-09", "Phone",
                          ckan_phone, db_phone,
                          "Phone mismatch: CKAN='%s' vs DB='%s'" % (ckan_phone, db_phone),
                          "Update phone to '%s'" % ckan_phone)
        elif ckan_digits and not db_digits:
            add_issue(lid, db_name, "minor", "attribute", "P-09", "Phone",
                      ckan_phone, "null/empty",
                      "Phone missing in DB, CKAN has '%s'" % ckan_phone,
                      "Set phone to '%s'" % ckan_phone)

    # P-10: Website
    if geo:
        ckan_url = geo.get('URL', '') or ''
        if ckan_url == 'None':
            ckan_url = ''
        db_url = db_pool['Website'] or ''
        if ckan_url and db_url:
            # Compare path query params
            ckan_qs = ckan_url.split('?')[-1] if '?' in ckan_url else ckan_url
            db_qs = db_url.split('?')[-1] if '?' in db_url else db_url
            if ckan_qs.lower().rstrip('/') != db_qs.lower().rstrip('/'):
                add_issue(lid, db_name, "minor", "attribute", "P-10", "Website",
                          ckan_url, db_url,
                          "Website URL mismatch",
                          "Update website to '%s'" % ckan_url)
        elif ckan_url and not db_url:
            add_issue(lid, db_name, "minor", "attribute", "P-10", "Website",
                      ckan_url, "null/empty",
                      "Website missing in DB, CKAN has URL",
                      "Set website to '%s'" % ckan_url)

    # P-11: IsActive
    if not db_pool['IsActive']:
        add_issue(lid, db_name, "critical", "attribute", "P-11", "IsActive",
                  True, False,
                  "Pool is in CKAN (active) but DB has IsActive=false",
                  "Set IsActive to true")

    # Schedule checks
    ckan_sched_count = len(ckan_schedules_by_lid.get(lid, []))
    db_sched_count = len(db_schedules_by_lid.get(lid, []))

    # S-01: Has Schedules
    if ckan_sched_count > 0 and db_sched_count == 0:
        add_issue(lid, db_name, "major", "schedule", "S-01", "HasSchedules",
                  "%d schedules" % ckan_sched_count, "0 schedules",
                  "CKAN has %d schedule records but DB has none" % ckan_sched_count,
                  "Import schedules from CKAN")
    elif ckan_sched_count == 0 and db_sched_count > 0:
        add_issue(lid, db_name, "info", "schedule", "S-01", "HasSchedules",
                  "0 schedules", "%d schedules" % db_sched_count,
                  "DB has %d schedules but CKAN has none (may be seasonal/no drop-in)" % db_sched_count,
                  "Verify schedules are correct")

    # S-02: Schedule Count
    if ckan_sched_count > 0 and db_sched_count > 0:
        if ckan_sched_count != db_sched_count:
            add_issue(lid, db_name, "info", "schedule", "S-02", "ScheduleCount",
                      ckan_sched_count, db_sched_count,
                      "Schedule count mismatch: CKAN=%d vs DB=%d" % (ckan_sched_count, db_sched_count),
                      "Review schedule import logic")

    # S-03: SwimType Coverage
    if ckan_sched_count > 0:
        ckan_titles = set(s.get('Course Title', '') for s in ckan_schedules_by_lid.get(lid, []))
        db_types = set(s['SwimType'] for s in db_schedules_by_lid.get(lid, []))
        ckan_titles_norm = {t.strip().lower() for t in ckan_titles if t}
        db_types_norm = {t.strip().lower() for t in db_types if t}
        missing_types = ckan_titles_norm - db_types_norm
        if missing_types:
            add_issue(lid, db_name, "major", "schedule", "S-03", "SwimTypeCoverage",
                      str(sorted(ckan_titles_norm)), str(sorted(db_types_norm)),
                      "DB missing swim types from CKAN: %s" % sorted(missing_types),
                      "Add missing swim types to schedule import")

    # Count issues for this pool
    pool_issue_count = sum(1 for i in issues if i['poolLocationId'] == lid)
    pool_status_map[str(lid)] = {
        "status": "fail" if pool_issue_count > 0 else "pass",
        "issueCount": pool_issue_count
    }

# --- Global Checks ---

# G-01: Every DB pool with TorontoLocationId exists in CKAN
for lid, db_pool in db_pools.items():
    if lid and lid not in all_ckan_lids:
        add_issue(lid, db_pool['Name'], "critical", "global", "G-01", "CKANExistence",
                  "Should exist in CKAN", "Not found",
                  "DB pool %s (LocationId=%s) not found in CKAN facilities" % (db_pool['Name'], lid),
                  "Remove phantom pool or verify location ID")

# G-02: Every DB pool has a TorontoLocationId
for lid, db_pool in db_pools.items():
    if not lid:
        add_issue(0, db_pool['Name'], "major", "global", "G-02", "TorontoLocationId",
                  "non-null", "null",
                  "DB pool '%s' has no TorontoLocationId" % db_pool['Name'],
                  "Look up and set the TorontoLocationId")

# G-03: No phantom active pools
db_active_lids = {lid for lid, p in db_pools.items() if p['IsActive']}
phantom = db_active_lids - all_ckan_lids
for lid in phantom:
    db_pool = db_pools[lid]
    add_issue(lid, db_pool['Name'], "critical", "global", "G-03", "PhantomPool",
              "Should be in CKAN", "Active in DB but not in CKAN",
              "Pool %s is active in DB but not in CKAN facilities" % db_pool['Name'],
              "Deactivate pool or verify location ID")

# G-04: Duplicate coordinates check
coord_groups = defaultdict(list)
for lid, db_pool in db_pools.items():
    lat = float(db_pool['Latitude'] or 0)
    lng = float(db_pool['Longitude'] or 0)
    if lat != 0.0 and lng != 0.0:
        key = (round(lat, 7), round(lng, 7))
        coord_groups[key].append((lid, db_pool['Name'], db_pool['Address']))

for (lat, lng), group in coord_groups.items():
    if len(group) > 1:
        names = ", ".join("%s (lid=%s, addr=%s)" % (n, l, a) for l, n, a in group)
        for lid, name, addr in group:
            add_issue(lid, name, "major", "global", "G-04", "DuplicateCoordinates",
                      "Unique coordinates per pool", "(%s, %s)" % (lat, lng),
                      "Duplicate coordinates shared with: %s" % names,
                      "Look up correct coordinates for each pool separately")

# --- Compute Summary ---
severity_counts = Counter(i['severity'] for i in issues)
pools_with_critical_major = set()
for i in issues:
    if i['severity'] in ('critical', 'major'):
        pools_with_critical_major.add(i['poolLocationId'])

total_pools = len(all_ckan_lids)
pools_without_issues = sum(1 for lid in all_ckan_lids if pool_status_map.get(str(lid), {}).get('issueCount', 0) == 0)
pools_with_issues = total_pools - pools_without_issues
accuracy = ((total_pools - len(pools_with_critical_major)) / total_pools * 100) if total_pools > 0 else 0

report = {
    "metadata": {
        "iteration": 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ckanPoolCount": len(all_ckan_lids),
        "dbPoolCount": len(db_pools),
        "ckanScheduleCount": len(ckan_schedules),
        "dbScheduleCount": len(db_schedules_raw)
    },
    "overallAccuracy": round(accuracy, 2),
    "poolsWithIssues": pools_with_issues,
    "poolsWithoutIssues": pools_without_issues,
    "issueSummary": {
        "critical": severity_counts.get('critical', 0),
        "major": severity_counts.get('major', 0),
        "minor": severity_counts.get('minor', 0),
        "info": severity_counts.get('info', 0)
    },
    "issues": issues,
    "poolStatusMap": pool_status_map
}

with open('C:/MethodDev/not-a-hackathon/tools/audit/validation-report-1.json', 'w') as f:
    json.dump(report, f, indent=2)

print("=== VALIDATION REPORT SUMMARY ===")
print("CKAN Pool Count: %d" % report['metadata']['ckanPoolCount'])
print("DB Pool Count: %d" % report['metadata']['dbPoolCount'])
print("CKAN Schedule Count: %d" % report['metadata']['ckanScheduleCount'])
print("DB Schedule Count: %d" % report['metadata']['dbScheduleCount'])
print("Overall Accuracy: %.2f%%" % report['overallAccuracy'])
print("Pools with issues: %d" % report['poolsWithIssues'])
print("Pools without issues: %d" % report['poolsWithoutIssues'])
print("Critical: %d" % report['issueSummary']['critical'])
print("Major: %d" % report['issueSummary']['major'])
print("Minor: %d" % report['issueSummary']['minor'])
print("Info: %d" % report['issueSummary']['info'])
print("Total issues: %d" % len(issues))
print()
print("=== CRITICAL ISSUES ===")
for i in [x for x in issues if x['severity'] == 'critical']:
    print("  [%s] %s (lid=%s): %s" % (i['checkId'], i['poolName'], i['poolLocationId'], i['details']))
print()
print("=== MAJOR ISSUES ===")
for i in [x for x in issues if x['severity'] == 'major']:
    print("  [%s] %s (lid=%s): %s" % (i['checkId'], i['poolName'], i['poolLocationId'], i['details']))
print()
print("=== MINOR ISSUES ===")
for i in [x for x in issues if x['severity'] == 'minor']:
    print("  [%s] %s (lid=%s): %s" % (i['checkId'], i['poolName'], i['poolLocationId'], i['details']))
