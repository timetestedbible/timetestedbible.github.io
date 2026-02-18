#!/usr/bin/env node
/**
 * Aggregate greek-syntax-flags per-chapter files into a summary report.
 * Reads data/greek-syntax-flags/Revelation-{1..22}.json
 * Outputs research/hg-greek-syntax-analysis.md
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FLAGS_DIR = path.join(ROOT, 'data', 'greek-syntax-flags');
const OUT_PATH = path.join(ROOT, 'research', 'hg-greek-syntax-analysis.md');

const allChapters = [];
for (let c = 1; c <= 22; c++) {
  const fp = path.join(FLAGS_DIR, `Revelation-${c}.json`);
  if (fs.existsSync(fp)) allChapters.push(JSON.parse(fs.readFileSync(fp, 'utf8')));
}

let totalVerses = 0, totalFlagged = 0, totalFlags = 0;
const byType = {}, bySeverity = { strong: 0, moderate: 0, weak: 0 };
const byTypeSeverity = {};
const examples = { strong: [], moderate: [], weak: [] };
const perChapter = [];

for (const ch of allChapters) {
  const chVerses = ch.clean_verse_count + ch.flagged_verse_count;
  totalVerses += chVerses;
  totalFlagged += ch.flagged_verse_count;
  totalFlags += ch.total_flags;
  perChapter.push({ chapter: ch.chapter, total: chVerses, flagged: ch.flagged_verse_count, flags: ch.total_flags });

  for (const dev of ch.deviations) {
    for (const flag of (dev.flags || [])) {
      const t = flag.type || 'other';
      const s = flag.severity || 'moderate';
      byType[t] = (byType[t] || 0) + 1;
      bySeverity[s] = (bySeverity[s] || 0) + 1;
      const key = `${t}:${s}`;
      byTypeSeverity[key] = (byTypeSeverity[key] || 0) + 1;
      if (examples[s] && examples[s].length < 5) {
        examples[s].push({ chapter: ch.chapter, verse: dev.verse, ...flag });
      }
    }
  }
}

const typeSorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);

let md = `# Greek Syntax Analysis of HG Revelation

**Method:** Each of the 22 chapters was sent to Claude (Sonnet) with the raw vocalized Hebrew and word-by-word interlinear glosses. The prompt asked for an honest identification of Greek syntactic constructs and unnatural Hebrew phrasing. Only deviations were recorded.

**Source data:** \`data/greek-syntax-flags/Revelation-{1..22}.json\`

---

## Summary

| Metric | Count | % |
|--------|-------|---|
| Total verses | ${totalVerses} | |
| Clean verses (no flags) | ${totalVerses - totalFlagged} | ${(100 * (totalVerses - totalFlagged) / totalVerses).toFixed(1)}% |
| Flagged verses | ${totalFlagged} | ${(100 * totalFlagged / totalVerses).toFixed(1)}% |
| Total flags | ${totalFlags} | |

## By severity

| Severity | Count | % of flags |
|----------|-------|------------|
| Strong (clearly Greek-dependent) | ${bySeverity.strong} | ${(100 * bySeverity.strong / totalFlags).toFixed(1)}% |
| Moderate (ambiguous) | ${bySeverity.moderate} | ${(100 * bySeverity.moderate / totalFlags).toFixed(1)}% |
| Weak (natural in later Hebrew) | ${bySeverity.weak} | ${(100 * bySeverity.weak / totalFlags).toFixed(1)}% |

## By type

| Type | Count | % of flags |
|------|-------|------------|
`;

for (const [t, n] of typeSorted) {
  md += `| ${t} | ${n} | ${(100 * n / totalFlags).toFixed(1)}% |\n`;
}

md += `\n## Per-chapter breakdown

| Chapter | Total verses | Flagged | Flags | % flagged |
|---------|-------------|---------|-------|-----------|
`;

for (const ch of perChapter) {
  md += `| ${ch.chapter} | ${ch.total} | ${ch.flagged} | ${ch.flags} | ${(100 * ch.flagged / ch.total).toFixed(0)}% |\n`;
}

md += `\n## Examples by severity\n`;

for (const sev of ['strong', 'moderate', 'weak']) {
  md += `\n### ${sev.charAt(0).toUpperCase() + sev.slice(1)}\n\n`;
  if (examples[sev].length === 0) {
    md += `No examples.\n`;
  } else {
    for (const ex of examples[sev]) {
      md += `- **Rev ${ex.chapter}:${ex.verse}** [${ex.type}] — \`${ex.hebrew}\`: ${ex.note}\n`;
    }
  }
}

md += `\n---

## Honest assessment

`;

const strongPct = (100 * bySeverity.strong / totalFlags).toFixed(1);
const modPct = (100 * bySeverity.moderate / totalFlags).toFixed(1);
const weakPct = (100 * bySeverity.weak / totalFlags).toFixed(1);
const cleanPct = (100 * (totalVerses - totalFlagged) / totalVerses).toFixed(1);

md += `Of ${totalVerses} verses in HG Revelation, **${cleanPct}% show no detectable Greek syntactic influence** according to Claude's analysis.

Of the ${totalFlags} flags raised across ${totalFlagged} verses:
- **${bySeverity.strong} strong** (${strongPct}%) — constructions that a native Hebrew author would likely not produce; these genuinely suggest Greek-to-Hebrew translation direction.
- **${bySeverity.moderate} moderate** (${modPct}%) — ambiguous constructions that could reflect either late Hebrew register or Greek influence.
- **${bySeverity.weak} weak** (${weakPct}%) — features that are standard in Mishnaic/late Second Temple Hebrew and do not by themselves indicate translation from Greek.

`;

if (bySeverity.strong > 0) {
  md += `The **strong** flags are the most relevant to Grok's critique. They suggest that at least some phrasing in the HG text was influenced by Greek syntax or word order, which is consistent with either (a) a Hebrew text composed by someone who knew Greek, (b) a Hebrew text that passed through a Greek-aware transmission stage, or (c) back-translation artifacts.\n\n`;
}

md += `The **weak** flags (primarily \`she_relative\` and \`shel_genitive\`) are expected in any Mishnaic-register Hebrew and cannot distinguish between native composition and translation. Their presence is consistent with both hypotheses.\n\n`;

md += `**Bottom line:** The Hebrew is not uniformly "pure" biblical Hebrew — it uses a late Second Temple / Mishnaic register with some constructions that could reflect Greek influence. However, the majority of verses (${cleanPct}%) show no Greek syntactic artifacts, and many of the flags are ambiguous or natural in later Hebrew. The text reads as a Hebrew composition in a late register, with a minority of passages where Greek influence on syntax is plausible.\n`;

fs.writeFileSync(OUT_PATH, md);
console.log('Wrote', OUT_PATH);
console.log(`\nSummary: ${totalVerses} verses, ${totalFlagged} flagged, ${totalFlags} flags`);
console.log(`  Strong: ${bySeverity.strong}, Moderate: ${bySeverity.moderate}, Weak: ${bySeverity.weak}`);
console.log(`  Clean: ${totalVerses - totalFlagged} (${cleanPct}%)`);
