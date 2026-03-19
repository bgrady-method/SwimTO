import { readFile } from "fs/promises";
import type { SeedPool } from "../report/types.js";

export async function parseSeedData(filePath: string): Promise<SeedPool[]> {
  const content = await readFile(filePath, "utf-8");
  const pools: SeedPool[] = [];

  // Match each pool definition line
  const poolRegex =
    /new\(\)\s*\{\s*Id\s*=\s*(\d+)\s*,\s*Name\s*=\s*"([^"]+)"\s*,\s*Address\s*=\s*"([^"]+)"\s*,\s*Latitude\s*=\s*([\d.]+)\s*,\s*Longitude\s*=\s*(-?[\d.]+)\s*,\s*PoolType\s*=\s*"([^"]+)"\s*,\s*LengthMeters\s*=\s*(\d+)\s*,\s*LaneCount\s*=\s*(\d+)\s*,\s*IsAccessible\s*=\s*(true|false)(?:\s*,\s*Phone\s*=\s*"([^"]*)")?(?:\s*,\s*Website\s*=\s*"([^"]*)")?\s*\}/g;

  let match: RegExpExecArray | null;
  while ((match = poolRegex.exec(content)) !== null) {
    pools.push({
      id: parseInt(match[1]),
      name: match[2],
      address: match[3],
      latitude: parseFloat(match[4]),
      longitude: parseFloat(match[5]),
      poolType: match[6],
      lengthMeters: match[7] ? parseInt(match[7]) : null,
      laneCount: match[8] ? parseInt(match[8]) : null,
      isAccessible: match[9] === "true",
      phone: match[10] || null,
      website: match[11] || null,
    });
  }

  if (pools.length === 0) {
    throw new Error(`Failed to parse any pools from ${filePath}`);
  }

  return pools;
}
