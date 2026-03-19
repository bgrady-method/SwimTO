import { ckanQueryAll } from "../utils/api-client.js";
import type { TorontoScheduleEntry } from "../report/types.js";

const RESOURCE_ID = "c99ec04f-4540-482c-9ee4-efb38774eab4";

export async function fetchDropInSchedules(): Promise<
  Map<number, TorontoScheduleEntry[]>
> {
  console.log("  Fetching drop-in swim schedules...");
  const records = await ckanQueryAll(RESOURCE_ID, {
    Section: "Swim - Drop-In",
  });

  console.log(`  Got ${records.length} swim drop-in schedule records`);

  const scheduleMap = new Map<number, TorontoScheduleEntry[]>();

  for (const r of records) {
    const locationId = Number(r["Location ID"] ?? r["LocationID"]);
    if (!locationId || isNaN(locationId)) continue;

    const entry: TorontoScheduleEntry = {
      locationId,
      courseTitle: String(r["Course Title"] ?? r["Course_Title"] ?? ""),
      dayOfWeek: String(r["DayOftheWeek"] ?? r["Day of the Week"] ?? ""),
      startHour: Number(r["Start Hour"] ?? r["StartHour"] ?? 0),
      startMinute: Number(r["Start Minute"] ?? r["Start Min"] ?? 0),
      endHour: Number(r["End Hour"] ?? r["EndHour"] ?? 0),
      endMinute: Number(r["End Min"] ?? r["End Minute"] ?? 0),
      firstDate: String(r["First Date"] ?? r["FirstDate"] ?? ""),
      lastDate: String(r["Last Date"] ?? r["LastDate"] ?? ""),
      ageMin: r["Age Min"] != null ? Number(r["Age Min"]) : null,
      ageMax: r["Age Max"] != null ? Number(r["Age Max"]) : null,
    };

    if (!scheduleMap.has(locationId)) {
      scheduleMap.set(locationId, []);
    }
    scheduleMap.get(locationId)!.push(entry);
  }

  console.log(`  Schedules for ${scheduleMap.size} locations`);
  return scheduleMap;
}

/** Get all unique swim course titles from the schedule data */
export function getUniqueSwimTypes(
  scheduleMap: Map<number, TorontoScheduleEntry[]>
): string[] {
  const types = new Set<string>();
  for (const entries of scheduleMap.values()) {
    for (const entry of entries) {
      if (entry.courseTitle) types.add(entry.courseTitle);
    }
  }
  return [...types].sort();
}
