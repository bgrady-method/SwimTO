const CKAN_BASE = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search";
const RATE_LIMIT_MS = 500;
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

let lastRequestTime = 0;

async function rateLimitedDelay(delayMs: number = RATE_LIMIT_MS): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < delayMs) {
    await new Promise((r) => setTimeout(r, delayMs - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function fetchWithRetry(url: string, delayMs?: number): Promise<unknown> {
  await rateLimitedDelay(delayMs);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "SwimTO-Audit/1.0 (toronto-pool-finder)" },
      });
      clearTimeout(timeout);

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        console.warn(`  [retry ${attempt}/${MAX_RETRIES}] ${response.status} from ${url}`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
      }

      return await response.json();
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (attempt === MAX_RETRIES) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  [retry ${attempt}/${MAX_RETRIES}] ${msg}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  throw new Error(`Exhausted retries for ${url}`);
}

export interface CkanResponse {
  success: boolean;
  result: {
    records: Record<string, unknown>[];
    total: number;
    _links?: { next?: string };
  };
}

export async function ckanQuery(
  resourceId: string,
  filters?: Record<string, string>,
  limit = 100,
  offset = 0
): Promise<CkanResponse> {
  const params = new URLSearchParams({
    resource_id: resourceId,
    limit: String(limit),
    offset: String(offset),
  });
  if (filters) {
    params.set("filters", JSON.stringify(filters));
  }
  const url = `${CKAN_BASE}?${params}`;
  return (await fetchWithRetry(url)) as CkanResponse;
}

export async function ckanQueryAll(
  resourceId: string,
  filters?: Record<string, string>,
  pageSize = 100
): Promise<Record<string, unknown>[]> {
  const allRecords: Record<string, unknown>[] = [];
  let offset = 0;

  while (true) {
    const response = await ckanQuery(resourceId, filters, pageSize, offset);
    const records = response.result.records;
    if (records.length === 0) break;
    allRecords.push(...records);
    offset += pageSize;
    if (allRecords.length >= response.result.total) break;
  }

  return allRecords;
}
