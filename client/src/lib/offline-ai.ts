import type { PoolSearchResult } from '@/types/pool';
import { DAY_NAMES_FULL } from '@/types/pool';

export type OfflineAIProvider = 'chrome-prompt-api' | 'keyword-fallback';

const BASE_SYSTEM_PROMPT = `You are SwimTO, a helpful assistant for finding public swimming pools in Toronto.
You are running OFFLINE with cached pool data. Answer questions using the pool data provided below.
When recommending pools, mention the pool name, type (Indoor/Outdoor), distance, and relevant schedule times.
If the user asks about something not covered by the cached data, suggest they reconnect or use the Explore tab filters.
Keep responses concise and helpful. Use markdown formatting.`;

function buildSystemPrompt(pools?: PoolSearchResult[]): string {
  if (!pools?.length) {
    return `${BASE_SYSTEM_PROMPT}\n\nNo cached pool data is available. Suggest the user use the Explore tab to browse pools or reconnect to the internet for full functionality.`;
  }

  let prompt = `${BASE_SYSTEM_PROMPT}\n\n## Cached Pool Data (${pools.length} pools)\n`;

  for (const pool of pools) {
    const attrs: string[] = [pool.poolType];
    if (pool.distanceKm != null) attrs.push(`${pool.distanceKm.toFixed(1)}km away`);
    if (pool.laneCount) attrs.push(`${pool.laneCount} lanes`);
    if (pool.isAccessible) attrs.push('accessible');

    prompt += `\n### ${pool.name}\n`;
    prompt += `${attrs.join(' · ')} — ${pool.address}\n`;

    if (pool.matchingSchedules.length > 0) {
      // Group schedules by swim type for compact representation
      const byType: Record<string, string[]> = {};
      for (const s of pool.matchingSchedules) {
        if (!byType[s.swimType]) byType[s.swimType] = [];
        byType[s.swimType].push(`${DAY_NAMES_FULL[s.dayOfWeek]} ${s.startTime}–${s.endTime}`);
      }
      for (const [type, times] of Object.entries(byType)) {
        // Show up to 4 times per type to keep prompt manageable
        const shown = times.slice(0, 4);
        const extra = times.length > 4 ? ` (+${times.length - 4} more)` : '';
        prompt += `- **${type}**: ${shown.join(', ')}${extra}\n`;
      }
    }
  }

  return prompt;
}

export async function detectOfflineAI(): Promise<OfflineAIProvider> {
  try {
    if (globalThis.LanguageModel) {
      const availability = await globalThis.LanguageModel.availability();
      if (availability === 'readily' || availability === 'after-download') {
        return 'chrome-prompt-api';
      }
    }
  } catch { /* not available */ }

  return 'keyword-fallback';
}

interface OfflineAISession {
  prompt(msg: string): AsyncGenerator<string>;
  destroy(): void;
}

export async function createOfflineAISession(
  provider: OfflineAIProvider,
  pools?: PoolSearchResult[]
): Promise<OfflineAISession> {
  if (provider === 'chrome-prompt-api') {
    return createChromeSession(pools);
  }
  return createKeywordSession(pools);
}

async function createChromeSession(pools?: PoolSearchResult[]): Promise<OfflineAISession> {
  const systemPrompt = buildSystemPrompt(pools);
  const session = await globalThis.LanguageModel!.create({ systemPrompt });

  return {
    async *prompt(msg: string) {
      const stream = session.promptStreaming(msg);
      const reader = stream.getReader();
      let prevText = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Chrome Prompt API returns accumulated text, yield only the new portion
          const newText = typeof value === 'string' ? value.slice(prevText.length) : '';
          prevText = typeof value === 'string' ? value : prevText;
          if (newText) yield newText;
        }
      } finally {
        reader.releaseLock();
      }
    },
    destroy() {
      session.destroy();
    },
  };
}

// Keyword fallback for browsers without Chrome Prompt API
// Uses cached pool data when available for smarter responses
function createKeywordSession(pools?: PoolSearchResult[]): OfflineAISession {
  const poolList = pools ?? [];

  function findPools(predicate: (p: PoolSearchResult) => boolean, limit = 3): string {
    const matches = poolList.filter(predicate).slice(0, limit);
    if (matches.length === 0) return "I couldn't find matching pools in the cached data.";
    return matches
      .map((p) => `- **${p.name}** (${p.poolType}, ${p.distanceKm.toFixed(1)}km) — ${p.address}`)
      .join('\n');
  }

  const handlers: { pattern: RegExp; respond: (msg: string) => string }[] = [
    {
      pattern: /lane\s*swim/i,
      respond: () => {
        const matches = findPools((p) =>
          p.matchingSchedules.some((s) => s.swimType.toLowerCase().includes('lane swim'))
        );
        return `Here are pools with lane swim sessions:\n\n${matches}\n\nUse the **Explore** tab with the "Lane Swim" filter for more details.`;
      },
    },
    {
      pattern: /family|kids|children/i,
      respond: () => {
        const matches = findPools((p) =>
          p.matchingSchedules.some((s) =>
            /family|leisure/i.test(s.swimType)
          )
        );
        return `Family-friendly pools nearby:\n\n${matches}\n\nTry the **Explore** tab with "Leisure Swim" or "Family" filters.`;
      },
    },
    {
      pattern: /outdoor/i,
      respond: () => {
        const matches = findPools((p) => p.poolType === 'Outdoor');
        return `Outdoor pools:\n\n${matches}\n\nUse the **Explore** tab and set Pool Attributes to "Outdoor".`;
      },
    },
    {
      pattern: /indoor/i,
      respond: () => {
        const matches = findPools((p) => p.poolType === 'Indoor');
        return `Indoor pools nearby:\n\n${matches}\n\nUse the **Explore** tab and set Pool Attributes to "Indoor".`;
      },
    },
    {
      pattern: /accessible|accessibility|wheelchair/i,
      respond: () => {
        const matches = findPools((p) => p.isAccessible);
        return `Accessible pools:\n\n${matches}\n\nAccessible pools are marked with an icon in the **Explore** tab.`;
      },
    },
    {
      pattern: /women|woman/i,
      respond: () => {
        const matches = findPools((p) =>
          p.matchingSchedules.some((s) => /women/i.test(s.swimType))
        );
        return `Pools with women-only sessions:\n\n${matches}\n\nFilter by "Women Only" in the **Explore** tab.`;
      },
    },
    {
      pattern: /aquafit|aqua\s*fit|water\s*aerobics/i,
      respond: () => {
        const matches = findPools((p) =>
          p.matchingSchedules.some((s) => /aqua/i.test(s.swimType))
        );
        return `Pools with Aquafit sessions:\n\n${matches}\n\nFilter by "Aquafit" in the **Explore** tab.`;
      },
    },
    {
      pattern: /older\s*adult|senior/i,
      respond: () => {
        const matches = findPools((p) =>
          p.matchingSchedules.some((s) => /older adult/i.test(s.swimType))
        );
        return `Pools with Older Adult sessions:\n\n${matches}\n\nFilter by "Older Adult" in the **Explore** tab.`;
      },
    },
    {
      pattern: /near|close|nearby|closest/i,
      respond: () => {
        const nearest = [...poolList].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
        if (nearest.length === 0) return 'No cached pool data available. Use the **Explore** tab to search.';
        const list = nearest
          .map((p) => `- **${p.name}** — ${p.distanceKm.toFixed(1)}km (${p.poolType})`)
          .join('\n');
        return `Closest pools to you:\n\n${list}`;
      },
    },
    {
      pattern: /how\s*many|count|total/i,
      respond: () =>
        `There are **${poolList.length} pools** in your cached results. Use the **Explore** tab to browse them all.`,
    },
    {
      pattern: /schedule|time|when|hour/i,
      respond: () =>
        'Use the **Explore** tab to filter by day and time range. Your cached results include full schedule data.',
    },
  ];

  return {
    async *prompt(msg: string) {
      const handler = handlers.find((h) => h.pattern.test(msg));
      const response = handler
        ? handler.respond(msg)
        : poolList.length > 0
          ? `I have **${poolList.length} cached pools** available. Try asking about lane swim, family swim, outdoor pools, accessibility, or nearest pools. You can also use the **Explore** tab to filter and browse.`
          : "I'm offline with no cached pool data. Try the **Explore** tab — any previously loaded results should still be available there.";

      // Stream word-by-word for consistent UX
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield (i === 0 ? '' : ' ') + words[i];
        await new Promise((r) => setTimeout(r, 15));
      }
    },
    destroy() {
      // no-op
    },
  };
}
