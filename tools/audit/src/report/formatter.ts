import { writeFile } from "fs/promises";
import type { AuditReport, PoolAudit, FieldComparison } from "./types.js";

// ── Console Output ──

export function printConsoleSummary(report: AuditReport): void {
  console.log("\n" + "=".repeat(70));
  console.log("  SWIMTO DATA AUDIT REPORT");
  console.log("  Generated: " + report.generatedAt);
  console.log("=".repeat(70));

  const s = report.summary;
  console.log(`\n  Seed Pools:           ${s.totalSeedPools}`);
  console.log(`  Toronto Pools:        ${s.totalTorontoPools}`);
  console.log(`  Matched:              ${s.matchedPools}`);
  console.log(`  Unmatched (seed):     ${s.unmatchedSeedPools}`);
  console.log(`  Missing from seed:    ${s.missingFromSeed}`);
  console.log(`  Field discrepancies:  ${s.fieldsWithDiscrepancies}`);
  console.log(`\n  Schedule: ${s.scheduleNote}`);

  // Pools with issues
  const issueAudits = report.poolAudits.filter(
    (a) =>
      a.matchConfidence === "no_match" ||
      a.matchConfidence === "human_review" ||
      a.fields.some((f) => f.status === "mismatch")
  );

  // Adversarial review summary
  const reviewPaths = report.poolAudits
    .map((a) => a.adversarial?.reviewPath)
    .filter(Boolean);
  if (reviewPaths.length > 0) {
    const pathCounts: Record<string, number> = {};
    for (const p of reviewPaths) {
      pathCounts[p!] = (pathCounts[p!] || 0) + 1;
    }
    console.log(`\n${"─".repeat(70)}`);
    console.log("  ADVERSARIAL REVIEW SUMMARY");
    console.log("─".repeat(70));
    for (const [path, count] of Object.entries(pathCounts)) {
      console.log(`  [${path}]: ${count} pools`);
    }
    const humanReview = report.poolAudits.filter(
      (a) => a.matchConfidence === "human_review"
    );
    if (humanReview.length > 0) {
      console.log(`\n  NEEDS HUMAN REVIEW:`);
      for (const audit of humanReview) {
        const reasons = audit.adversarial?.disputeReasons?.join("; ") ?? "unknown";
        console.log(`    #${audit.seedId} ${audit.seedName} → ${audit.torontoName ?? "none"}`);
        console.log(`      Reasons: ${reasons}`);
      }
    }
  }

  if (issueAudits.length > 0) {
    console.log(`\n${"─".repeat(70)}`);
    console.log("  POOLS WITH ISSUES");
    console.log("─".repeat(70));

    for (const audit of issueAudits) {
      const mismatches = audit.fields.filter((f) => f.status === "mismatch");
      const reviewTag = audit.adversarial?.reviewPath ? ` [${audit.adversarial.reviewPath}]` : "";
      console.log(
        `\n  [${audit.matchConfidence.toUpperCase()}]${reviewTag} #${audit.seedId} ${audit.seedName}`
      );
      if (audit.torontoName) {
        console.log(`    Toronto match: ${audit.torontoName} (Location ID: ${audit.torontoLocationId})`);
      }
      if (audit.adversarial?.disputeReasons && audit.adversarial.disputeReasons.length > 0) {
        console.log(`    Disputes: ${audit.adversarial.disputeReasons.join("; ")}`);
      }
      if (audit.adversarial?.arbiterReasoning) {
        console.log(`    Arbiter: ${audit.adversarial.arbiterReasoning}`);
      }
      for (const m of mismatches) {
        console.log(`    ${m.field}:`);
        console.log(`      Seed:    ${m.seedValue}`);
        console.log(`      Toronto: ${m.torontoValue}`);
        if (m.note) console.log(`      Note:    ${m.note}`);
      }
    }
  }

  // Phantom pools
  if (report.phantomPools.length > 0) {
    console.log(`\n${"─".repeat(70)}`);
    console.log("  PHANTOM POOLS (in seed but not in Toronto data)");
    console.log("─".repeat(70));
    for (const p of report.phantomPools) {
      console.log(`  #${p.id} ${p.name} — ${p.address}`);
    }
  }

  // Missing pools (truncated)
  if (report.missingPools.length > 0) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(
      `  MISSING POOLS (${report.missingPools.length} Toronto pools not in seed data)`
    );
    console.log("─".repeat(70));
    const shown = report.missingPools.slice(0, 20);
    for (const p of shown) {
      console.log(`  [${p.locationId}] ${p.name} — ${p.address} (${p.poolType})`);
    }
    if (report.missingPools.length > 20) {
      console.log(
        `  ... and ${report.missingPools.length - 20} more (see full report)`
      );
    }
  }

  // Swim type mappings
  console.log(`\n${"─".repeat(70)}`);
  console.log("  SWIM TYPE MAPPINGS");
  console.log("─".repeat(70));
  for (const m of report.swimTypeMappings) {
    console.log(`  "${m.seedType}" → ${m.recommendation}`);
  }

  console.log(`\n${"─".repeat(70)}`);
  console.log("  ALL TORONTO SWIM TYPES");
  console.log("─".repeat(70));
  for (const t of report.allTorontoSwimTypes) {
    console.log(`  - ${t}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("  Reports written to: audit-report.json, audit-report.md");
  console.log("=".repeat(70) + "\n");
}

// ── Markdown Output ──

function fieldStatusEmoji(status: string): string {
  switch (status) {
    case "match":
      return "OK";
    case "mismatch":
      return "MISMATCH";
    case "seed_only":
      return "SEED ONLY";
    case "toronto_only":
      return "TORONTO ONLY";
    case "unverifiable":
      return "UNVERIFIABLE";
    default:
      return status;
  }
}

function poolAuditToMarkdown(audit: PoolAudit): string {
  const lines: string[] = [];
  const mismatches = audit.fields.filter((f) => f.status === "mismatch");
  const unverifiable = audit.fields.filter((f) => f.status === "unverifiable");

  const reviewTag = audit.adversarial?.reviewPath ? ` [${audit.adversarial.reviewPath}]` : "";
  lines.push(
    `### #${audit.seedId} ${audit.seedName} — ${audit.matchConfidence.toUpperCase()}${reviewTag}`
  );
  if (audit.torontoName) {
    lines.push(
      `**Toronto match:** ${audit.torontoName} (Location ID: ${audit.torontoLocationId}, matched via: ${audit.matchMethod})`
    );
  } else {
    lines.push("**Toronto match:** NONE");
  }

  if (audit.adversarial?.disputeReasons && audit.adversarial.disputeReasons.length > 0) {
    lines.push(`\n**Dispute reasons:** ${audit.adversarial.disputeReasons.join("; ")}`);
  }
  if (audit.adversarial?.arbiterReasoning) {
    lines.push(`\n**Arbiter ruling:** ${audit.adversarial.arbiterReasoning}`);
  }

  if (mismatches.length === 0 && unverifiable.length === 0) {
    lines.push("\nAll verifiable fields match.");
  } else {
    lines.push("\n| Field | Seed Value | Toronto Value | Status | Note |");
    lines.push("|-------|-----------|---------------|--------|------|");

    for (const f of audit.fields) {
      if (f.status === "match") continue; // Only show issues
      lines.push(
        `| ${f.field} | ${f.seedValue ?? "—"} | ${f.torontoValue ?? "—"} | ${fieldStatusEmoji(f.status)} | ${f.note ?? ""} |`
      );
    }
  }

  if (audit.scheduleComparison) {
    const sc = audit.scheduleComparison;
    lines.push(`\n**Schedule:** ${sc.note}`);
    if (sc.torontoSessionCount > 0) {
      lines.push(
        `- Seed sessions: ${sc.seedSessionCount} | Toronto sessions: ${sc.torontoSessionCount}`
      );
      lines.push(`- Seed swim types: ${sc.seedSwimTypes.join(", ")}`);
      lines.push(`- Toronto swim types: ${sc.torontoSwimTypes.join(", ")}`);
    }
  }

  return lines.join("\n");
}

export function generateMarkdownReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push("# SwimTO Data Audit Report");
  lines.push(`\n*Generated: ${report.generatedAt}*\n`);

  // Executive Summary
  lines.push("## Executive Summary\n");
  const s = report.summary;
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Seed Pools | ${s.totalSeedPools} |`);
  lines.push(`| Toronto Pools (unique locations) | ${s.totalTorontoPools} |`);
  lines.push(`| Matched | ${s.matchedPools} |`);
  lines.push(`| Unmatched (in seed, not in Toronto) | ${s.unmatchedSeedPools} |`);
  lines.push(`| Missing (in Toronto, not in seed) | ${s.missingFromSeed} |`);
  lines.push(`| Field Discrepancies | ${s.fieldsWithDiscrepancies} |`);
  lines.push(`\n> **Schedule Note:** ${s.scheduleNote}\n`);

  // Adversarial Review Summary
  const reviewPaths = report.poolAudits
    .map((a) => a.adversarial?.reviewPath)
    .filter(Boolean);
  if (reviewPaths.length > 0) {
    const pathCounts: Record<string, number> = {};
    for (const p of reviewPaths) {
      pathCounts[p!] = (pathCounts[p!] || 0) + 1;
    }
    lines.push("## Adversarial Review Summary\n");
    lines.push("| Review Path | Count |");
    lines.push("|-------------|-------|");
    for (const [path, count] of Object.entries(pathCounts)) {
      lines.push(`| ${path} | ${count} |`);
    }

    const humanReview = report.poolAudits.filter(
      (a) => a.matchConfidence === "human_review"
    );
    if (humanReview.length > 0) {
      lines.push("\n### Needs Human Review\n");
      lines.push("| # | Seed Pool | Proposed Match | Dispute Reasons |");
      lines.push("|---|-----------|---------------|-----------------|");
      for (const audit of humanReview) {
        const reasons = audit.adversarial?.disputeReasons?.join("; ") ?? "—";
        lines.push(
          `| ${audit.seedId} | ${audit.seedName} | ${audit.torontoName ?? "—"} | ${reasons} |`
        );
      }
    }
    lines.push("");
  }

  // Overview table
  lines.push("## Pool Audit Overview\n");
  lines.push(
    "| # | Seed Pool | Match | Review Path | Toronto Pool | Issues |"
  );
  lines.push("|---|-----------|-------|-------------|-------------|--------|");

  for (const audit of report.poolAudits) {
    const issues = audit.fields.filter(
      (f) => f.status === "mismatch" || f.status === "unverifiable"
    );
    const issueStr = issues.map((i) => `${i.field}(${fieldStatusEmoji(i.status)})`).join(", ");
    const reviewPath = audit.adversarial?.reviewPath ?? "—";
    lines.push(
      `| ${audit.seedId} | ${audit.seedName} | ${audit.matchConfidence} | ${reviewPath} | ${audit.torontoName ?? "—"} | ${issueStr || "—"} |`
    );
  }

  // Detailed audits (only pools with issues)
  const issueAudits = report.poolAudits.filter(
    (a) =>
      a.matchConfidence === "no_match" ||
      a.matchConfidence === "human_review" ||
      a.fields.some((f) => f.status === "mismatch")
  );

  if (issueAudits.length > 0) {
    lines.push("\n## Detailed Discrepancies\n");
    for (const audit of issueAudits) {
      lines.push(poolAuditToMarkdown(audit));
      lines.push("");
    }
  }

  // Phantom pools
  if (report.phantomPools.length > 0) {
    lines.push("## Phantom Pools (In Seed, Not In Toronto Data)\n");
    lines.push(
      "These pools exist in SeedData but could not be matched to any Toronto Open Data record. They may be non-city facilities.\n"
    );
    lines.push("| # | Name | Address |");
    lines.push("|---|------|---------|");
    for (const p of report.phantomPools) {
      lines.push(`| ${p.id} | ${p.name} | ${p.address} |`);
    }
    lines.push("");
  }

  // Missing pools
  if (report.missingPools.length > 0) {
    lines.push("## Missing Pools (In Toronto Data, Not In Seed)\n");
    lines.push(
      `${report.missingPools.length} Toronto pool locations are not represented in SeedData.\n`
    );
    lines.push("| Location ID | Name | Address | Type | District |");
    lines.push("|-------------|------|---------|------|----------|");
    for (const p of report.missingPools) {
      lines.push(
        `| ${p.locationId} | ${p.name} | ${p.address} | ${p.poolType} | ${p.district ?? "—"} |`
      );
    }
    lines.push("");
  }

  // Swim type mappings
  lines.push("## Swim Type Mapping Recommendations\n");
  lines.push("| Seed Type | Toronto Types | Recommendation |");
  lines.push("|-----------|--------------|----------------|");
  for (const m of report.swimTypeMappings) {
    lines.push(
      `| ${m.seedType} | ${m.torontoTypes.join(", ") || "—"} | ${m.recommendation} |`
    );
  }

  lines.push("\n### All Toronto Swim Course Titles\n");
  for (const t of report.allTorontoSwimTypes) {
    lines.push(`- ${t}`);
  }

  return lines.join("\n");
}

// ── File Writers ──

export async function writeJsonReport(
  report: AuditReport,
  filePath: string
): Promise<void> {
  await writeFile(filePath, JSON.stringify(report, null, 2), "utf-8");
}

export async function writeMarkdownReport(
  report: AuditReport,
  filePath: string
): Promise<void> {
  await writeFile(filePath, generateMarkdownReport(report), "utf-8");
}
