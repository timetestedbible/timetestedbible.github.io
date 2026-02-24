/**
 * Clan Size — 200yr Lifespan, 8 Kids, 3yr Spacing
 * 
 * Conservative, textually grounded:
 *   - 8 kids (normal large family today)
 *   - 3yr spacing, born ages 20-41
 *   - 200yr lifespan (na'ar at 100 = "child", so ~200yr is plausible minimum)
 *   - People DIE at 200
 */

const KIDS = 8;
const SPACING = 3;
const START_AGE = 20;
const LIFESPAN = 200;

const childAges = [];
for (let i = 0; i < KIDS; i++) {
  childAges.push(START_AGE + i * SPACING);
}

function fmt(n) {
  if (n >= 1e15) return (n / 1e15).toFixed(1) + "Q";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

// Memoized recursive count
const memoBorn = new Map();
function totalBornFrom(bornYear, targetYear) {
  if (bornYear > targetYear) return 0;
  const key = `${bornYear}:${targetYear}`;
  if (memoBorn.has(key)) return memoBorn.get(key);
  let count = 1;
  for (const age of childAges) {
    count += totalBornFrom(bornYear + age, targetYear);
  }
  memoBorn.set(key, count);
  return count;
}

function clanTotalBorn(targetYear) {
  memoBorn.clear();
  let total = 2;
  for (const age of childAges) {
    total += totalBornFrom(age, targetYear);
  }
  return total;
}

function clanAlive(targetYear) {
  const born = clanTotalBorn(targetYear);
  const dead = targetYear > LIFESPAN ? clanTotalBorn(targetYear - LIFESPAN) : 0;
  return born - dead;
}

console.log("=== CLAN SIZE: 200yr LIFESPAN, 8 KIDS, 3yr SPACING ===\n");
console.log(`Kids born at parent ages: ${childAges.join(', ')}`);
console.log(`Lifespan: ${LIFESPAN} years`);
console.log(`One founding couple.\n`);

const years = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 250, 300, 400, 500, 600, 800, 1000];

console.log(`${"Year".padEnd(8)} ${"Total born".padStart(14)} ${"Living".padStart(14)} ${"Dead".padStart(14)}`);
console.log("-".repeat(52));

for (const y of years) {
  const born = clanTotalBorn(y);
  const alive = clanAlive(y);
  const dead = born - alive;
  console.log(`${y.toString().padEnd(8)} ${fmt(born).padStart(14)} ${fmt(alive).padStart(14)} ${fmt(dead).padStart(14)}`);
}

// ============================================================
// PATRIARCH COUNT
// ============================================================

console.log("\n\n=== PATRIARCHS ===\n");
console.log("With 200yr lifespan, patriarch = someone near end of life.");
console.log("Let's define patriarch as 100+ years old (past na'ar stage).\n");

console.log(`${"Year".padEnd(8)} ${"Living".padStart(14)} ${"Age 100+".padStart(14)} ${"Age <100".padStart(14)}`);
console.log("-".repeat(52));

for (const y of [100, 200, 300, 400, 500, 600, 800, 1000]) {
  const alive = clanAlive(y);
  // Age 100+ = born before (y-100) AND born after (y-200) [still alive]
  const bornBefore100ago = clanTotalBorn(Math.max(0, y - 100));
  const dead = y > LIFESPAN ? clanTotalBorn(Math.max(0, y - LIFESPAN)) : 0;
  const elders = Math.max(0, bornBefore100ago - dead);
  const young = alive - elders;
  
  console.log(`${y.toString().padEnd(8)} ${fmt(alive).padStart(14)} ${fmt(elders).padStart(14)} ${fmt(young).padStart(14)}`);
}

// ============================================================
// TEMPLE CHECK
// ============================================================

console.log("\n\n=== TEMPLE CAPACITY (250K) vs ELDERS (100+) ===\n");

const templeCapacity = 250000;

for (const y of [200, 300, 400, 500, 600, 800, 1000]) {
  const bornBefore100ago = clanTotalBorn(Math.max(0, y - 100));
  const dead = y > LIFESPAN ? clanTotalBorn(Math.max(0, y - LIFESPAN)) : 0;
  const elders = Math.max(0, bornBefore100ago - dead);
  
  console.log(`Yr ${y}: ${fmt(elders)} elders → ${elders <= templeCapacity ? "FITS" : "OVERFLOW " + fmt(elders - templeCapacity)}`);
}

// ============================================================
// GLOBAL POPULATION FROM MULTIPLE FOUNDING COUPLES
// ============================================================

console.log("\n\n=== GLOBAL POPULATION (multiple founding couples) ===\n");

const startCouples = [10, 100, 1000, 10000, 100000];

for (const y of [200, 300, 500, 1000]) {
  const perCouple = clanAlive(y);
  console.log(`Year ${y} (${fmt(perCouple)} alive per couple):`);
  for (const sc of startCouples) {
    console.log(`  ${sc.toLocaleString()} couples → ${fmt(sc * perCouple)}`);
  }
  console.log("");
}

// ============================================================
// GOG/MAGOG CHECK
// ============================================================

console.log("\n=== GOG/MAGOG: 'AS THE SAND OF THE SEA' (Rev 20:8) ===\n");

const alive1000 = clanAlive(1000);
console.log(`One couple at yr 1000: ${fmt(alive1000)} living`);
console.log("");
console.log("Is this enough for 'sand of the sea'?");
for (const sc of [100, 1000, 10000]) {
  const total = sc * alive1000;
  console.log(`  ${sc.toLocaleString()} founding couples → ${fmt(total)} global population`);
}
console.log(`\nCurrent world: 8 billion`);
console.log(`Grains of sand on earth: ~7.5 × 10^18`);
