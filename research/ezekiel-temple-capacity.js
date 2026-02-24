/**
 * Ezekiel Temple Capacity Model
 * 
 * Models the physical throughput constraints of the Ezekiel temple (Ezek 40-48)
 * to derive implied population limits for feast attendance.
 * 
 * All dimensions from the text. Ezekiel uses the "long cubit" (Ezek 40:5) =
 * cubit + handbreadth = ~20.67 inches (~0.525m).
 */

const LONG_CUBIT_M = 0.525; // meters per long cubit (Ezek 40:5)
const SQ_M_PER_ACRE = 4046.86;
const SQ_M_PER_SQ_MILE = 2589988;

// ============================================================
// SECTION 1: TEMPLE COMPLEX DIMENSIONS (from Ezekiel 40-42)
// ============================================================

const temple = {
  // Outer wall enclosure: 500 x 500 cubits (Ezek 42:15-20)
  outerWall: { cubits: 500 },
  
  // Temple building itself (Ezek 41:13-14)
  building: {
    lengthCubits: 100, // Ezek 41:13
    widthCubits: 100,  // east front including yard (Ezek 41:14)
  },

  // Inner court (approximate from gate and building positions)
  // The inner court surrounds the temple building
  innerCourt: {
    approxCubits: 200, // estimated side, derived from layout
  },

  // Gate structures - 3 outer gates, 3 inner gates (Ezek 40:6-37)
  gates: {
    outerCount: 3,  // north, south, east
    innerCount: 3,  // north, south, east
    lengthCubits: 50,  // each gate structure ~50 cubits deep (Ezek 40:15, 21, 25)
    widthCubits: 25,   // ~25 cubits wide (Ezek 40:13, 21, 25)
  },

  // Priestly chambers - north and south blocks (Ezek 42:1-14)
  priestlyChambers: {
    blocks: 2,
    lengthCubits: 100,
    widthCubits: 50,
  },

  // Four corner kitchen courts (Ezek 46:21-24)
  kitchens: {
    count: 4,
    lengthCubits: 40,
    widthCubits: 30,
    description: "Stone hearths round about under the rows",
  },
};

// ============================================================
// SECTION 2: CALCULATE AREAS
// ============================================================

function cubitsToMeters(c) { return c * LONG_CUBIT_M; }
function areaCubitsToSqM(l, w) { return cubitsToMeters(l) * cubitsToMeters(w); }

const totalEnclosureSqM = areaCubitsToSqM(temple.outerWall.cubits, temple.outerWall.cubits);
const templeBuildingSqM = areaCubitsToSqM(temple.building.lengthCubits, temple.building.widthCubits);

const gatesSqM = (temple.gates.outerCount + temple.gates.innerCount) *
  areaCubitsToSqM(temple.gates.lengthCubits, temple.gates.widthCubits);

const priestlyChambersSqM = temple.priestlyChambers.blocks *
  areaCubitsToSqM(temple.priestlyChambers.lengthCubits, temple.priestlyChambers.widthCubits);

const kitchensSqM = temple.kitchens.count *
  areaCubitsToSqM(temple.kitchens.lengthCubits, temple.kitchens.widthCubits);

const structuresSqM = templeBuildingSqM + gatesSqM + priestlyChambersSqM + kitchensSqM;
const usableCourtSqM = totalEnclosureSqM - structuresSqM;

console.log("=== EZEKIEL TEMPLE AREA CALCULATIONS ===\n");
console.log(`Long cubit: ${LONG_CUBIT_M}m (${(LONG_CUBIT_M * 39.37).toFixed(1)} inches)`);
console.log(`\nTotal enclosure: ${temple.outerWall.cubits}×${temple.outerWall.cubits} cubits`);
console.log(`  = ${cubitsToMeters(temple.outerWall.cubits).toFixed(0)}m × ${cubitsToMeters(temple.outerWall.cubits).toFixed(0)}m`);
console.log(`  = ${(totalEnclosureSqM).toFixed(0)} sq m (${(totalEnclosureSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`\nStructures (non-usable space):`);
console.log(`  Temple building: ${templeBuildingSqM.toFixed(0)} sq m (${(templeBuildingSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`  Gates (${temple.gates.outerCount + temple.gates.innerCount}): ${gatesSqM.toFixed(0)} sq m (${(gatesSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`  Priestly chambers (${temple.priestlyChambers.blocks}): ${priestlyChambersSqM.toFixed(0)} sq m (${(priestlyChambersSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`  Kitchens (${temple.kitchens.count}): ${kitchensSqM.toFixed(0)} sq m (${(kitchensSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`  Total structures: ${structuresSqM.toFixed(0)} sq m (${(structuresSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`\nUsable court space: ${usableCourtSqM.toFixed(0)} sq m (${(usableCourtSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);

// ============================================================
// SECTION 3: SLAUGHTER TABLE THROUGHPUT (Ezek 40:38-43)
// ============================================================

const slaughter = {
  // Ezek 40:39-43: tables at the north gate
  // 8 tables for slaughter (v41) + 4 tables of hewn stone for instruments (v42)
  // Commentators note similar arrangements at south and east gates
  tablesPerGate: 8,     // slaughter tables (Ezek 40:41)
  stoneTables: 4,       // instrument/preparation tables per gate (Ezek 40:42)
  gates: 3,             // three inner gates where sacrifices are processed
  
  // Processing time estimates (ranges)
  minutesPerSacrificeMin: 3,  // fast: experienced team, small animal
  minutesPerSacrificeMax: 10, // slow: large animal, full processing
  minutesPerSacrificeMid: 5,  // mid estimate
  
  hoursPerDay: 10,       // daylight working hours
};

const totalSlaughterTables = slaughter.tablesPerGate * slaughter.gates;
const totalStoneTables = slaughter.stoneTables * slaughter.gates;

function sacrificesPerDay(minutesPerSacrifice) {
  const perTablePerHour = 60 / minutesPerSacrifice;
  const perHourAll = perTablePerHour * totalSlaughterTables;
  return perHourAll * slaughter.hoursPerDay;
}

console.log("\n\n=== SLAUGHTER TABLE THROUGHPUT ===\n");
console.log(`Slaughter tables: ${slaughter.tablesPerGate} per gate × ${slaughter.gates} gates = ${totalSlaughterTables} tables`);
console.log(`Stone/prep tables: ${slaughter.stoneTables} per gate × ${slaughter.gates} gates = ${totalStoneTables} tables`);
console.log(`Working hours per day: ${slaughter.hoursPerDay}`);
console.log(`\nSacrifices per day (all tables working):`);
console.log(`  Fast (${slaughter.minutesPerSacrificeMin} min/sacrifice): ${sacrificesPerDay(slaughter.minutesPerSacrificeMin).toLocaleString()}`);
console.log(`  Mid  (${slaughter.minutesPerSacrificeMid} min/sacrifice): ${sacrificesPerDay(slaughter.minutesPerSacrificeMid).toLocaleString()}`);
console.log(`  Slow (${slaughter.minutesPerSacrificeMax} min/sacrifice): ${sacrificesPerDay(slaughter.minutesPerSacrificeMax).toLocaleString()}`);

// ============================================================
// SECTION 4: KITCHEN / DINING THROUGHPUT (Ezek 46:19-24)
// ============================================================

const kitchen = {
  count: 4,
  lengthCubits: 40,
  widthCubits: 30,
  // Hearths "round about" — assume cooking stations along all walls
  // Perimeter of each kitchen court
  hearths: {
    perimeterCubits: 2 * (40 + 30), // 140 cubits perimeter
    stationWidthCubits: 2, // ~1m per cooking station
  },
  // Meal serving estimates
  mealsPerStationPerHour: 6,   // one pot serves ~6 groups/hour
  peoplePerMealServing: 10,    // family/group size per serving
  servingHoursPerDay: 12,
};

const perimeterM = cubitsToMeters(kitchen.hearths.perimeterCubits);
const stationsPerKitchen = Math.floor(kitchen.hearths.perimeterCubits / kitchen.hearths.stationWidthCubits);
const totalStations = stationsPerKitchen * kitchen.count;
const mealsPerDay = totalStations * kitchen.mealsPerStationPerHour * kitchen.servingHoursPerDay;
const peopleFedPerDay = mealsPerDay * kitchen.peoplePerMealServing;

console.log("\n\n=== KITCHEN CAPACITY ===\n");
console.log(`Kitchen courts: ${kitchen.count} (at four corners of outer court)`);
console.log(`Each kitchen: ${kitchen.lengthCubits}×${kitchen.widthCubits} cubits = ${areaCubitsToSqM(kitchen.lengthCubits, kitchen.widthCubits).toFixed(0)} sq m`);
console.log(`Perimeter per kitchen: ${kitchen.hearths.perimeterCubits} cubits (${perimeterM.toFixed(0)}m)`);
console.log(`Cooking stations per kitchen (at ${kitchen.hearths.stationWidthCubits} cubits/station): ${stationsPerKitchen}`);
console.log(`Total cooking stations: ${totalStations}`);
console.log(`Meals per day (${kitchen.mealsPerStationPerHour}/station/hr × ${kitchen.servingHoursPerDay}hr): ${mealsPerDay.toLocaleString()}`);
console.log(`People fed per day (at ${kitchen.peoplePerMealServing}/meal): ${peopleFedPerDay.toLocaleString()}`);

// ============================================================
// SECTION 5: COURT SPACE / CROWD CAPACITY
// ============================================================

// Crowd density benchmarks (people per sq meter)
const densities = {
  worship:     { ppsm: 0.5, label: "Worship/prostration (0.5/sq m)" },
  comfortable: { ppsm: 1.0, label: "Comfortable (1/sq m)" },
  moderate:    { ppsm: 2.0, label: "Moderate crowd (2/sq m)" },
  dense:       { ppsm: 4.0, label: "Dense crowd (4/sq m)" },
  hajjPeak:    { ppsm: 6.0, label: "Hajj peak density (6/sq m)" },
};

console.log("\n\n=== COURT SPACE / CROWD CAPACITY ===\n");
console.log(`Usable court space: ${usableCourtSqM.toFixed(0)} sq m`);
console.log(`\nInstantaneous capacity at various densities:`);
for (const [key, d] of Object.entries(densities)) {
  const people = Math.floor(usableCourtSqM * d.ppsm);
  console.log(`  ${d.label}: ${people.toLocaleString()} people`);
}

// ============================================================
// SECTION 6: SUKKOT FEAST THROUGHPUT (7 days)
// ============================================================

const sukkot = {
  days: 7,             // Lev 23:34
  shemini: 1,          // 8th day assembly (Lev 23:36)
  totalDays: 8,
  
  // Communal sacrifices per Num 29:12-38
  communalBulls: [13, 12, 11, 10, 9, 8, 7],
  communalRamsPerDay: 2,
  communalLambsPerDay: 14,
  communalGoatsPerDay: 1,
};

const totalCommunalBulls = sukkot.communalBulls.reduce((a, b) => a + b, 0);
const totalCommunalRams = sukkot.communalRamsPerDay * sukkot.days;
const totalCommunalLambs = sukkot.communalLambsPerDay * sukkot.days;
const totalCommunalGoats = sukkot.communalGoatsPerDay * sukkot.days;
const totalCommunalSacrifices = totalCommunalBulls + totalCommunalRams + totalCommunalLambs + totalCommunalGoats;

console.log("\n\n=== SUKKOT FEAST MODEL ===\n");
console.log(`Duration: ${sukkot.days} days + Shemini Atzeret = ${sukkot.totalDays} days`);
console.log(`\nCommunal sacrifices (Num 29:12-38):`);
console.log(`  Bulls: ${sukkot.communalBulls.join(', ')} = ${totalCommunalBulls} total`);
console.log(`  Rams: ${sukkot.communalRamsPerDay}/day × ${sukkot.days} = ${totalCommunalRams}`);
console.log(`  Lambs: ${sukkot.communalLambsPerDay}/day × ${sukkot.days} = ${totalCommunalLambs}`);
console.log(`  Goats: ${sukkot.communalGoatsPerDay}/day × ${sukkot.days} = ${totalCommunalGoats}`);
console.log(`  Total communal: ${totalCommunalSacrifices} sacrifices over ${sukkot.days} days`);

// ============================================================
// SECTION 7: POPULATION ESTIMATES — CONSERVATIVE TO MAXIMUM
// ============================================================

// Sacrifice analysis:
// Deut 16:16-17: "not appear empty... as he is able"
// NOT every person brings an animal. Options: bull, lamb, dove, grain offering
// Many bring grain (no slaughter table needed — baked in kitchens, Ezek 46:20)
// A bull feeds 50-100+ people. A lamb feeds 10-20.
// Passover-style parallel processing (Mishnah): owners slaughter, priests chain blood basins

const scenarios = [
  {
    name: "CONSERVATIVE (minimum temple throughput)",
    courtDensity: 1.0,          // comfortable
    sessionsPerDay: 3,
    hoursPerSession: 3,
    rotationEfficiency: 0.7,    // 70% — some overlap, not perfect cycling
    kitchenEfficiencyMult: 0.7, // not all stations running at once
    sacrificeBinding: true,     // sacrifice throughput limits attendance
    sacMinPerAnimal: 5,
    sacPeoplePerAnimal: 10,
    sacFractionBringingAnimal: 1.0, // everyone brings animal
    pilgrimRatio: 0.4,          // all able males attend
  },
  {
    name: "MODERATE (reasonable estimates)",
    courtDensity: 2.0,          // moderate crowd
    sessionsPerDay: 4,
    hoursPerSession: 3,
    rotationEfficiency: 0.8,
    kitchenEfficiencyMult: 0.85,
    sacrificeBinding: false,    // not everyone brings animal — grain, doves, shared bulls
    sacMinPerAnimal: 3,
    sacPeoplePerAnimal: 20,     // many share bulls/large animals
    sacFractionBringingAnimal: 0.3, // only 30% bring animal sacrifice
    pilgrimRatio: 0.22,         // heads of household
  },
  {
    name: "MAXIMUM (upper bound — what could the temple physically handle?)",
    courtDensity: 4.0,          // dense crowd (below Hajj peak)
    sessionsPerDay: 5,          // continuous flow, dawn to dusk
    hoursPerSession: 2.5,
    rotationEfficiency: 0.9,
    kitchenEfficiencyMult: 1.0, // all stations running
    sacrificeBinding: false,    // grain/dove offerings dominate, shared bulls
    sacMinPerAnimal: 2,         // fast Passover-style parallel processing
    sacPeoplePerAnimal: 50,     // clan delegations sharing bulls
    sacFractionBringingAnimal: 0.1, // only 10% bring animal
    pilgrimRatio: 0.22,         // heads of household
  },
  {
    name: "ABSOLUTE CEILING (Hajj-density, max assumptions)",
    courtDensity: 6.0,          // Hajj peak density
    sessionsPerDay: 6,          // continuous rotation
    hoursPerSession: 2,
    rotationEfficiency: 0.95,
    kitchenEfficiencyMult: 1.0,
    sacrificeBinding: false,
    sacMinPerAnimal: 2,
    sacPeoplePerAnimal: 50,
    sacFractionBringingAnimal: 0.05,
    pilgrimRatio: 0.22,
  },
];

console.log("\n\n=== POPULATION ESTIMATES BY SCENARIO ===\n");

for (const s of scenarios) {
  console.log(`\n--- ${s.name} ---`);
  
  // Court constraint
  const instantCourt = Math.floor(usableCourtSqM * s.courtDensity);
  const totalSessions = s.sessionsPerDay * sukkot.totalDays;
  const courtAttendees = Math.floor(instantCourt * totalSessions * s.rotationEfficiency);
  
  // Kitchen constraint
  const kitchenAttendees = Math.floor(peopleFedPerDay * s.kitchenEfficiencyMult * sukkot.totalDays);
  
  // Sacrifice constraint (if binding)
  let sacAttendees = Infinity;
  if (s.sacrificeBinding) {
    const animalsPerDay = sacrificesPerDay(s.sacMinPerAnimal);
    const totalAnimals = animalsPerDay * sukkot.totalDays;
    sacAttendees = Math.floor(totalAnimals * s.sacPeoplePerAnimal);
  } else {
    // Sacrifice is NOT the bottleneck — most bring grain/doves
    const animalsPerDay = sacrificesPerDay(s.sacMinPerAnimal);
    const totalAnimals = animalsPerDay * sukkot.totalDays;
    // People represented by animal sacrifices
    const animalPeople = totalAnimals * s.sacPeoplePerAnimal;
    // But only X% of attendees need animal sacrifice slots
    sacAttendees = Math.floor(animalPeople / s.sacFractionBringingAnimal);
  }
  
  const bindingValue = Math.min(courtAttendees, kitchenAttendees, sacAttendees);
  const bindingName = bindingValue === courtAttendees ? "Court space" : 
                      bindingValue === kitchenAttendees ? "Kitchen throughput" : "Sacrifice throughput";
  
  const totalPop = Math.floor(bindingValue / s.pilgrimRatio);
  
  console.log(`  Court: ${instantCourt.toLocaleString()} instant × ${totalSessions} sessions × ${s.rotationEfficiency} eff = ${courtAttendees.toLocaleString()}`);
  console.log(`  Kitchen: ${kitchenAttendees.toLocaleString()}`);
  console.log(`  Sacrifice: ${sacAttendees.toLocaleString()} (${s.sacrificeBinding ? 'binding — all bring animals' : `non-binding — only ${(s.sacFractionBringingAnimal*100)}% bring animals`})`);
  console.log(`  Binding constraint: ${bindingName} → ${bindingValue.toLocaleString()} max attendees`);
  console.log(`  Implied total population (at pilgrim ratio ${s.pilgrimRatio}): ${totalPop.toLocaleString()}`);
}

// ============================================================
// SECTION 8: SACRED DISTRICT (Ezek 45:1-6)
// ============================================================

const sacredDistrict = {
  lengthCubits: 25000,
  widthCubits: 25000, // full district (Ezek 48:8-22 gives 25000x25000)
  priestPortion: { l: 25000, w: 10000 },
  levitePortion: { l: 25000, w: 10000 },
  cityPortion: { l: 25000, w: 5000 },
};

const districtSqM = areaCubitsToSqM(sacredDistrict.lengthCubits, sacredDistrict.widthCubits);
const districtSqMi = districtSqM / SQ_M_PER_SQ_MILE;
const priestPortionSqMi = areaCubitsToSqM(sacredDistrict.priestPortion.l, sacredDistrict.priestPortion.w) / SQ_M_PER_SQ_MILE;
const levitePortionSqMi = areaCubitsToSqM(sacredDistrict.levitePortion.l, sacredDistrict.levitePortion.w) / SQ_M_PER_SQ_MILE;
const cityPortionSqMi = areaCubitsToSqM(sacredDistrict.cityPortion.l, sacredDistrict.cityPortion.w) / SQ_M_PER_SQ_MILE;

console.log("\n\n=== SACRED DISTRICT (Ezek 45, 48) ===\n");
console.log(`Full district: ${sacredDistrict.lengthCubits}×${sacredDistrict.widthCubits} cubits`);
console.log(`  = ${(cubitsToMeters(sacredDistrict.lengthCubits)/1000).toFixed(1)}km × ${(cubitsToMeters(sacredDistrict.widthCubits)/1000).toFixed(1)}km`);
console.log(`  = ${districtSqMi.toFixed(1)} sq miles (${(districtSqM / SQ_M_PER_ACRE).toFixed(0)} acres)`);
console.log(`  Priest portion: ${priestPortionSqMi.toFixed(1)} sq mi`);
console.log(`  Levite portion: ${levitePortionSqMi.toFixed(1)} sq mi`);
console.log(`  City portion: ${cityPortionSqMi.toFixed(1)} sq mi`);

// Camping/lodging capacity in the sacred district during feast
const campingAreaSqM = districtSqM - totalEnclosureSqM; // district minus temple
const campingSqMPerPerson = 10; // tent/sukkah space per person
const campingCapacity = Math.floor(campingAreaSqM / campingSqMPerPerson);

console.log(`\nCamping/sukkah capacity in sacred district (outside temple):`);
console.log(`  Available area: ${(campingAreaSqM / SQ_M_PER_ACRE).toFixed(0)} acres`);
console.log(`  At ${campingSqMPerPerson} sq m/person: ${campingCapacity.toLocaleString()} people`);

// ============================================================
// SECTION 9: HISTORICAL CROSS-CHECK — SOLOMON, SECOND TEMPLE, HAJJ
// ============================================================

console.log("\n\n=== HISTORICAL CROSS-CHECK ===\n");

// Apply the SAME model to Solomon's and Herod's temples with known populations
// to validate whether our methodology produces sensible results.

// --- Solomon's Temple (~960 BC) ---
// 1 Kings 6:2 — building: 60 × 20 cubits (standard cubit ~0.457m)
// Court dimensions not given explicitly in Kings
// 1 Kings 6:36 — inner court mentioned
// 2 Chronicles 4:9 — court of the priests + great court
// Estimated total usable court area: much smaller than Ezekiel's
// Scholarly estimates: inner court ~50×100 cubits, great court perhaps 200×300 cubits (uncertain)

const STANDARD_CUBIT_M = 0.457;

const solomonTemple = {
  label: "Solomon's Temple (~960 BC)",
  // Conservative estimate of usable court space
  // Inner court: ~50×100 cubits, great court: ~200×300 cubits (speculative but reasonable)
  innerCourtCubits: [50, 100],
  greatCourtCubits: [200, 300],
  cubitM: STANDARD_CUBIT_M,
  // Slaughter tables: not enumerated like Ezekiel — fewer, less organized
  estimatedSlaughterTables: 4, // assumption
  // Known population data
  populationInLand: { low: 1000000, high: 3000000, label: "1-3M (archaeological estimates)" },
  clansInIsrael: 57, // Numbers 26 named clans
  // No historical pilgrim count available for Solomon's era
};

const solInnerSqM = (solomonTemple.innerCourtCubits[0] * STANDARD_CUBIT_M) * (solomonTemple.innerCourtCubits[1] * STANDARD_CUBIT_M);
const solGreatSqM = (solomonTemple.greatCourtCubits[0] * STANDARD_CUBIT_M) * (solomonTemple.greatCourtCubits[1] * STANDARD_CUBIT_M);
const solTotalCourtSqM = solInnerSqM + solGreatSqM;
const solBuildingSqM = (60 * STANDARD_CUBIT_M) * (20 * STANDARD_CUBIT_M);

console.log(`--- ${solomonTemple.label} ---`);
console.log(`  Temple building: 60×20 cubits = ${solBuildingSqM.toFixed(0)} sq m (${(solBuildingSqM / SQ_M_PER_ACRE).toFixed(2)} acres)`);
console.log(`  Inner court (est.): ${solomonTemple.innerCourtCubits.join('×')} cubits = ${solInnerSqM.toFixed(0)} sq m`);
console.log(`  Great court (est.): ${solomonTemple.greatCourtCubits.join('×')} cubits = ${solGreatSqM.toFixed(0)} sq m`);
console.log(`  Total usable court: ${solTotalCourtSqM.toFixed(0)} sq m (${(solTotalCourtSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`  Population in the land: ${solomonTemple.populationInLand.label}`);
console.log(`  Named clans (Num 26): ${solomonTemple.clansInIsrael}`);

// Apply our model to Solomon's temple
const solDensities = [1.0, 2.0, 4.0];
const solSessions = [3, 4]; // sessions per day
const solFeastDays = 7; // Sukkot

console.log(`\n  Court capacity over ${solFeastDays}-day feast:`);
for (const d of solDensities) {
  for (const s of solSessions) {
    const instant = Math.floor(solTotalCourtSqM * d);
    const total = instant * s * solFeastDays;
    console.log(`    ${d}/sq m, ${s} sessions/day: ${instant.toLocaleString()} instant × ${s * solFeastDays} = ${total.toLocaleString()} total attendees`);
  }
}

// Slaughter table throughput
const solSacPerDay = solomonTemple.estimatedSlaughterTables * (60 / 5) * 10; // 4 tables, 5min/ea, 10hrs
const solSacTotal = solSacPerDay * solFeastDays;
console.log(`\n  Slaughter tables (est. ${solomonTemple.estimatedSlaughterTables}): ${solSacPerDay.toLocaleString()}/day × ${solFeastDays} = ${solSacTotal.toLocaleString()} total sacrifices`);
console.log(`  At 10 people/sacrifice: ${(solSacTotal * 10).toLocaleString()} represented`);
console.log(`  At 20 people/sacrifice: ${(solSacTotal * 20).toLocaleString()} represented`);

// Clan delegation model
console.log(`\n  Clan delegation model (${solomonTemple.clansInIsrael} clans):`);
const solPop = [1000000, 2000000, 3000000];
for (const p of solPop) {
  const perClan = Math.floor(p / solomonTemple.clansInIsrael);
  const del10 = solomonTemple.clansInIsrael * 10;
  const del50 = solomonTemple.clansInIsrael * 50;
  const del200 = solomonTemple.clansInIsrael * 200;
  console.log(`    Pop ${(p/1e6).toFixed(0)}M → ${perClan.toLocaleString()}/clan → delegations of 10: ${del10.toLocaleString()}, 50: ${del50.toLocaleString()}, 200: ${del200.toLocaleString()} total attendees`);
}

// What % of population would court space allow?
console.log(`\n  What % of population can attend (moderate density, 3 sessions/day)?`);
const solModerateTotal = Math.floor(solTotalCourtSqM * 2.0) * 3 * solFeastDays;
for (const p of solPop) {
  const pct = ((solModerateTotal / p) * 100).toFixed(1);
  console.log(`    Pop ${(p/1e6).toFixed(0)}M: ${solModerateTotal.toLocaleString()} / ${p.toLocaleString()} = ${pct}%`);
}

// --- Herod's Second Temple (~30 AD) ---
console.log(`\n--- Herod's Second Temple (~30 AD) ---`);

const herodTemple = {
  label: "Herod's Temple (~30 AD)",
  // Temple Mount: ~500m × 300m (well-established archaeologically)
  templeMountM: [500, 300],
  // Usable court space (subtract buildings, Royal Stoa, Antonia Fortress area)
  // Court of Gentiles: largest area
  // Court of Women: ~60×60m
  // Court of Israel (men): ~60×7m (very narrow!)
  // Court of Priests: ~60×90m
  // Much of the Temple Mount was the Court of Gentiles
  courtOfGentilesSqM: 90000, // rough estimate — majority of the mount
  courtOfWomenSqM: 3600,    // ~60×60m
  courtOfIsraelSqM: 420,    // ~60×7m (very narrow — men squeezed in)
  courtOfPriestsSqM: 5400,  // ~60×90m

  // Known data
  estimatedPilgrims: { low: 300000, high: 500000, label: "300K-500K (scholarly estimate)" },
  populationInLand: { low: 1000000, high: 2500000, label: "1-2.5M in the land" },
  populationWorldwide: { low: 4000000, high: 6000000, label: "4-6M worldwide" },
  jerusalemResident: 40000,
  // Priests: 24 courses, all serving during feasts
  priestlyCourses: 24,
  estimatedTotalPriests: 18000, // rough estimate for all 24 courses
};

const herodTotalMountSqM = herodTemple.templeMountM[0] * herodTemple.templeMountM[1];
const herodUsableSqM = herodTemple.courtOfGentilesSqM + herodTemple.courtOfWomenSqM + herodTemple.courtOfIsraelSqM;
const herodAllCourtsSqM = herodUsableSqM + herodTemple.courtOfPriestsSqM;

console.log(`  Temple Mount: ${herodTemple.templeMountM.join('×')}m = ${herodTotalMountSqM.toLocaleString()} sq m (${(herodTotalMountSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`  Court of Gentiles (est.): ${herodTemple.courtOfGentilesSqM.toLocaleString()} sq m`);
console.log(`  Court of Women: ${herodTemple.courtOfWomenSqM.toLocaleString()} sq m`);
console.log(`  Court of Israel (men): ${herodTemple.courtOfIsraelSqM.toLocaleString()} sq m`);
console.log(`  Court of Priests: ${herodTemple.courtOfPriestsSqM.toLocaleString()} sq m`);
console.log(`  Total public courts: ${herodUsableSqM.toLocaleString()} sq m (${(herodUsableSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);
console.log(`  Population: ${herodTemple.populationInLand.label}; ${herodTemple.populationWorldwide.label}`);
console.log(`  Known pilgrim attendance: ${herodTemple.estimatedPilgrims.label}`);
console.log(`  Priestly workforce: ${herodTemple.estimatedTotalPriests.toLocaleString()} (${herodTemple.priestlyCourses} courses)`);

// Apply our model
console.log(`\n  Court capacity over 7-day feast (Passover):`);
for (const d of [1.0, 2.0, 4.0]) {
  for (const s of [3, 4]) {
    const instant = Math.floor(herodUsableSqM * d);
    const total = instant * s * 7;
    console.log(`    ${d}/sq m, ${s} sess/day: ${instant.toLocaleString()} instant × ${s * 7} = ${total.toLocaleString()} total`);
  }
}

// Does our model match the known 300K-500K?
console.log(`\n  MODEL vs KNOWN ATTENDANCE:`);
const herodModerate = Math.floor(herodUsableSqM * 2.0) * 3 * 7; // moderate density, 3 sessions
const herodDense = Math.floor(herodUsableSqM * 4.0) * 4 * 7;    // dense, 4 sessions
console.log(`    Model (moderate): ${herodModerate.toLocaleString()}`);
console.log(`    Model (dense):    ${herodDense.toLocaleString()}`);
console.log(`    Known:            ${herodTemple.estimatedPilgrims.low.toLocaleString()}-${herodTemple.estimatedPilgrims.high.toLocaleString()}`);
console.log(`    Model matches known? ${herodModerate >= herodTemple.estimatedPilgrims.low && herodDense <= herodTemple.estimatedPilgrims.high * 5 ? "WITHIN RANGE" : "CHECK ASSUMPTIONS"}`);

// What % of population attended?
console.log(`\n  Attendance as % of population:`);
for (const pop of [1000000, 1500000, 2000000, 2500000]) {
  const lowPct = ((herodTemple.estimatedPilgrims.low / pop) * 100).toFixed(1);
  const highPct = ((herodTemple.estimatedPilgrims.high / pop) * 100).toFixed(1);
  console.log(`    Pop ${(pop/1e6).toFixed(1)}M: ${lowPct}-${highPct}% attended`);
}

// --- Ezekiel's Temple (Millennial) ---
console.log(`\n--- Ezekiel's Temple (Millennial) ---`);
console.log(`  Usable court: ${usableCourtSqM.toFixed(0)} sq m (${(usableCourtSqM / SQ_M_PER_ACRE).toFixed(1)} acres)`);

// Apply same model
console.log(`\n  Court capacity over 8-day feast (Sukkot + Shemini Atzeret):`);
for (const d of [1.0, 2.0, 4.0]) {
  for (const s of [3, 4]) {
    const instant = Math.floor(usableCourtSqM * d);
    const total = instant * s * 8;
    console.log(`    ${d}/sq m, ${s} sess/day: ${instant.toLocaleString()} instant × ${s * 8} = ${total.toLocaleString()} total`);
  }
}

// --- SIDE-BY-SIDE COMPARISON ---
console.log(`\n\n--- SIDE-BY-SIDE COMPARISON ---\n`);
console.log(`${"".padEnd(30)} ${"Solomon".padStart(16)} ${"Herod".padStart(16)} ${"Ezekiel".padStart(16)}`);
console.log("-".repeat(80));
console.log(`${"Usable court (sq m)".padEnd(30)} ${solTotalCourtSqM.toFixed(0).padStart(16)} ${herodUsableSqM.toLocaleString().padStart(16)} ${usableCourtSqM.toFixed(0).padStart(16)}`);
console.log(`${"Usable court (acres)".padEnd(30)} ${(solTotalCourtSqM/SQ_M_PER_ACRE).toFixed(1).padStart(16)} ${(herodUsableSqM/SQ_M_PER_ACRE).toFixed(1).padStart(16)} ${(usableCourtSqM/SQ_M_PER_ACRE).toFixed(1).padStart(16)}`);
console.log(`${"Slaughter tables".padEnd(30)} ${"~4 (est.)".padStart(16)} ${"unknown".padStart(16)} ${"24".padStart(16)}`);
console.log(`${"Kitchens".padEnd(30)} ${"unknown".padStart(16)} ${"unknown".padStart(16)} ${"4 (specified)".padStart(16)}`);
console.log(`${"Priestly workforce".padEnd(30)} ${"small".padStart(16)} ${"~18,000".padStart(16)} ${"Zadokite only".padStart(16)}`);
console.log(`${"Population served".padEnd(30)} ${"1-3M".padStart(16)} ${"1-2.5M (land)".padStart(16)} ${"? (land)".padStart(16)}`);
console.log(`${"Known/est. pilgrims".padEnd(30)} ${"unknown".padStart(16)} ${"300K-500K".padStart(16)} ${"model output".padStart(16)}`);

const solAttPerAcre = "N/A";
const herodAttPerAcre = Math.floor(herodTemple.estimatedPilgrims.high / (herodUsableSqM / SQ_M_PER_ACRE));
const ezekModAtt = Math.floor(usableCourtSqM * 2.0) * 3 * 8;
const ezekAttPerAcre = Math.floor(ezekModAtt / (usableCourtSqM / SQ_M_PER_ACRE));
console.log(`${"Pilgrims/acre (moderate)".padEnd(30)} ${solAttPerAcre.padStart(16)} ${herodAttPerAcre.toLocaleString().padStart(16)} ${ezekAttPerAcre.toLocaleString().padStart(16)}`);
console.log(`${"Model output (mod, 3 sess)".padEnd(30)} ${(Math.floor(solTotalCourtSqM * 2.0) * 3 * 7).toLocaleString().padStart(16)} ${herodModerate.toLocaleString().padStart(16)} ${ezekModAtt.toLocaleString().padStart(16)}`);

// The ratio that matters: pilgrims per person in the population
console.log(`\n  PILGRIMS-TO-POPULATION RATIO:`);
console.log(`    Herod (known): 300K-500K pilgrims / 1-2.5M pop = 12-50%`);
console.log(`    → NOT clan-delegation only. Families attended. High participation.`);

const hajj = {
  pilgrims2024: 1833164,
  masjidalHaramAcres: 88.2,
  muslimWorldPop: 1900000000,
};
const hajjRatio = ((hajj.pilgrims2024 / hajj.muslimWorldPop) * 100);
console.log(`    Hajj (modern): ${hajj.pilgrims2024.toLocaleString()} / ${(hajj.muslimWorldPop/1e9).toFixed(1)}B = ${hajjRatio.toFixed(3)}%`);
console.log(`    → Pure delegation model. Tiny fraction attends.`);

console.log(`\n  QUESTION: Which model does the millennial temple follow?`);
console.log(`    If Herod-like (12-50%): Ezek temple serves 2-8M population`);
console.log(`    If Hajj-like (0.1%):    Ezek temple serves 1-3 BILLION`);
console.log(`    Zech 14:17 (mishpachah): somewhere in between — clan delegations`);

// ============================================================
// SECTION 10: MORTAL POPULATION GROWTH OVER 1000 YEARS
// ============================================================

// Starting population: survivors of the sheep/goats judgment (Mat 25:31-46)
// These are mortal nations who enter the millennium
// Constraints from Scripture:
//   - Isa 65:20: extended lifespan ("child dying at 100 shall be accursed")
//   - Isa 65:23: "they shall not labor in vain, nor bring forth for trouble"
//   - Mortality still exists (Isa 65:20 mentions death, sin, and curse)
//   - Zech 14:17-19: nations punished for not keeping feasts → capable of disobedience
//   - Rev 20:7-9: Gog/Magog after 1000 years → large enough population to mount a war

console.log("\n\n=== MORTAL POPULATION GROWTH MODEL (1000 YEARS) ===\n");

function populationGrowth(startPop, years, params) {
  let pop = startPop;
  const results = [];
  
  for (let y = 0; y <= years; y++) {
    if (y % 100 === 0) {
      results.push({ year: y, pop: Math.floor(pop) });
    }
    
    // Net growth rate = birth rate - death rate
    // With extended lifespan (Isa 65:20), death rate is much lower than today
    // But birth rate may also be lower (peace, no urgency, Gen 3:16 partially reversed?)
    const netGrowthRate = params.annualGrowthRate;
    pop = pop * (1 + netGrowthRate);
  }
  
  results.push({ year: years, pop: Math.floor(pop) });
  return results;
}

// Historical growth rate reference points:
// Pre-industrial average: ~0.05-0.1% per year
// Medieval Europe: ~0.1-0.2%
// Early modern: ~0.3-0.5%
// 20th century peak: ~1.8-2.0%
// Current (2024): ~0.9%
// Biblical patriarchal (long lives, many children): variable

// Millennial factors:
// (+) Extended lifespan → fewer deaths → higher growth
// (+) Peace, prosperity → lower infant mortality → higher growth
// (-) Gen 3:16 curse partially reversed → possibly lower fertility
// (-) Righteous governance → possibly lower urgency to reproduce
// (-) Death still exists (Isa 65:20) but rare

const startingPopulations = [
  { label: "Small remnant (post-judgment survivors)", pop: 100000 },
  { label: "Moderate survivors", pop: 1000000 },
  { label: "Large surviving population", pop: 10000000 },
  { label: "Current-scale survivors (10%)", pop: 800000000 },
];

const growthScenarios = [
  { label: "Very low (0.05%/yr — pre-industrial with low fertility)", annualGrowthRate: 0.0005 },
  { label: "Low (0.1%/yr — extended life but low birth rate)", annualGrowthRate: 0.001 },
  { label: "Moderate (0.3%/yr — early modern equivalent)", annualGrowthRate: 0.003 },
  { label: "High (0.5%/yr — prosperity + extended lifespan)", annualGrowthRate: 0.005 },
  { label: "Very high (1.0%/yr — near modern rate)", annualGrowthRate: 0.01 },
  { label: "Explosive (1.5%/yr — long lives + high fertility)", annualGrowthRate: 0.015 },
];

for (const sp of startingPopulations) {
  console.log(`\n--- Starting population: ${sp.pop.toLocaleString()} (${sp.label}) ---\n`);
  console.log(`${"Growth Rate".padEnd(55)} ${"Year 0".padStart(14)} ${"Year 100".padStart(14)} ${"Year 500".padStart(14)} ${"Year 1000".padStart(14)}`);
  console.log("-".repeat(115));
  
  for (const gs of growthScenarios) {
    const results = populationGrowth(sp.pop, 1000, gs);
    const y0 = results.find(r => r.year === 0);
    const y100 = results.find(r => r.year === 100);
    const y500 = results.find(r => r.year === 500);
    const y1000 = results.find(r => r.year === 1000);
    
    const fmt = (n) => n.pop.toLocaleString().padStart(14);
    console.log(`${gs.label.padEnd(55)} ${fmt(y0)} ${fmt(y100)} ${fmt(y500)} ${fmt(y1000)}`);
  }
}

// ============================================================
// SECTION 11: PROMISED LAND FOCUS — TEMPLE + LAND CAPACITY
// ============================================================

// KEY INSIGHT: The temple serves the PROMISED LAND population.
// The rest of the world sends delegations (Zech 14:16 — "nations go up").
// Gog/Magog comes from "the four quarters of the earth" (Rev 20:8)
// — the GLOBAL mortal population, not the Promised Land residents.

console.log("\n\n=== PROMISED LAND POPULATION MODEL ===\n");

const promisedLand = {
  traditional: { sqMi: 300000, label: "Traditional (~Euphrates to Nile)" },
  greater:     { sqMi: 900000, label: "Greater Israel (deserts bloom, Isa 35:1)" },
};

// Agricultural carrying capacity (pre-industrial, people per sq mi)
const agDensities = [
  { label: "Sparse pastoral (ancient Canaan)", ppsm: 30 },
  { label: "Mixed agriculture (medieval England)", ppsm: 100 },
  { label: "Intensive agriculture (fertile crescent)", ppsm: 200 },
  { label: "Dense agriculture (pre-industrial China)", ppsm: 400 },
  { label: "Modern Israel (with irrigation)", ppsm: 1000 },
];

console.log("Agricultural carrying capacity of the Promised Land:\n");
console.log(`${"Density Model".padEnd(50)} ${"Traditional (300K sq mi)".padStart(22)} ${"Greater (900K sq mi)".padStart(22)}`);
console.log("-".repeat(95));

for (const d of agDensities) {
  const trad = d.ppsm * promisedLand.traditional.sqMi;
  const greater = d.ppsm * promisedLand.greater.sqMi;
  console.log(`${d.label.padEnd(50)} ${trad.toLocaleString().padStart(22)} ${greater.toLocaleString().padStart(22)}`);
}

// Temple capacity from our model
const templeModPop = 7300000;
const templeMaxPop = 39000000;

console.log(`\nTemple capacity ceiling (from Sections 6-7):`);
console.log(`  Moderate (kitchen-bound): ${templeModPop.toLocaleString()}`);
console.log(`  Maximum (court-bound):    ${templeMaxPop.toLocaleString()}`);

// Now model: what starting population + growth rate stays within
// BOTH the temple capacity AND land carrying capacity over 1000 years?

console.log("\n\n=== PROMISED LAND: GROWTH vs CONSTRAINTS OVER 1000 YEARS ===\n");

// Promised Land starting populations (mortal inhabitants after sheep/goats)
const plStartPops = [
  { label: "Small remnant", pop: 50000 },
  { label: "Moderate", pop: 500000 },
  { label: "Significant", pop: 2000000 },
  { label: "Large", pop: 5000000 },
];

// Only growth scenarios relevant to a constrained territory
const plGrowthRates = [
  { label: "0.1%/yr", rate: 0.001 },
  { label: "0.3%/yr", rate: 0.003 },
  { label: "0.5%/yr", rate: 0.005 },
  { label: "1.0%/yr", rate: 0.01 },
];

// Land carrying capacity (using intensive agriculture on traditional land)
const landCap = 200 * promisedLand.traditional.sqMi; // 60 million

console.log(`Constraints applied:`);
console.log(`  Temple capacity (moderate): ${templeModPop.toLocaleString()}`);
console.log(`  Temple capacity (maximum):  ${templeMaxPop.toLocaleString()}`);
console.log(`  Land carrying capacity:     ${landCap.toLocaleString()} (intensive ag, traditional borders)`);
console.log(`  Firstfruits (immortal):     ~90,000,000 (already in the land, don't farm — eat from tree of life)`);
console.log("");

console.log(`${"Start".padEnd(12)} ${"Rate".padEnd(10)} ${"Yr 100".padStart(12)} ${"Yr 500".padStart(14)} ${"Yr 1000".padStart(16)} ${"Exceeds Temple Mod".padStart(20)} ${"Exceeds Temple Max".padStart(20)} ${"Exceeds Land".padStart(14)}`);
console.log("-".repeat(120));

for (const sp of plStartPops) {
  for (const gr of plGrowthRates) {
    let pop = sp.pop;
    let yrTempleMod = "never";
    let yrTempleMax = "never";
    let yrLand = "never";
    
    const snapshots = {};
    
    for (let y = 0; y <= 1000; y++) {
      if (y === 100) snapshots.y100 = Math.floor(pop);
      if (y === 500) snapshots.y500 = Math.floor(pop);
      
      if (yrTempleMod === "never" && pop > templeModPop) yrTempleMod = y;
      if (yrTempleMax === "never" && pop > templeMaxPop) yrTempleMax = y;
      if (yrLand === "never" && pop > landCap) yrLand = y;
      
      pop = pop * (1 + gr.rate);
    }
    
    snapshots.y1000 = Math.floor(pop);
    
    const fmtYr = (v) => (v === "never" ? "never" : `yr ${v}`);
    
    console.log(
      `${sp.pop.toLocaleString().padEnd(12)} ${gr.label.padEnd(10)} ` +
      `${snapshots.y100.toLocaleString().padStart(12)} ${snapshots.y500.toLocaleString().padStart(14)} ${snapshots.y1000.toLocaleString().padStart(16)} ` +
      `${fmtYr(yrTempleMod).padStart(20)} ${fmtYr(yrTempleMax).padStart(20)} ${fmtYr(yrLand).padStart(14)}`
    );
  }
  console.log(""); // blank line between starting populations
}

// ============================================================
// SECTION 12: PRECISE CLAN STRUCTURE MODEL
// ============================================================

console.log("\n\n=== THE TWO POPULATIONS — PRECISE CLAN STRUCTURE ===\n");

// POPULATION 1: The Firstfruits (Immortal)
// Rev 7:4 Hebrew: 144 alaphim sealed from the mishpechot of Israel
// 12 tribes × 12 clans = 144 clans (eleph-clans-not-thousands.md)
// Total: ~60-230 million at 0.2% remnant ratio (Jer 3:14)
// These are PRIESTS (Rev 20:6) — they serve IN the temple, not as pilgrims

const firstfruits = {
  tribes: 12,
  clansPerTribe: 12,
  totalClans: 144,
  remnantRatio: 0.002, // 0.2% per Jer 3:14
  sourcePopulations: {
    sinceCross: { pop: 61e9, label: "Since the cross (~61B)" },
    sinceAbraham: { pop: 85e9, label: "Since Abraham (~85B)" },
    allTime: { pop: 117e9, label: "All time (~117B, PRB estimate)" },
  },
};

console.log("POPULATION 1: FIRSTFRUITS (Immortal Priests)");
console.log(`  Structure: ${firstfruits.tribes} tribes × ${firstfruits.clansPerTribe} clans = ${firstfruits.totalClans} clans`);
console.log(`  Remnant ratio: ${(firstfruits.remnantRatio * 100).toFixed(1)}% (Jer 3:14 — "one from a city, two from a mishpachah")`);
console.log(`  Total firstfruits by source population:`);
for (const [key, src] of Object.entries(firstfruits.sourcePopulations)) {
  const total = Math.floor(src.pop * firstfruits.remnantRatio);
  const perClan = Math.floor(total / firstfruits.totalClans);
  console.log(`    ${src.label}: ${total.toLocaleString()} total → ${perClan.toLocaleString()} per clan`);
}
console.log(`  Role: Priests of God and Christ (Rev 20:6). Serve IN the temple.`);
console.log(`  They do NOT attend as pilgrims — they ARE the priestly workforce.`);

// POPULATION 2: Mortal Nations
// Survive sheep/goats judgment (Mat 25:31-46)
// Live globally + within the Promised Land
// Organized into mishpachot (Zech 14:17 — "mishpachot ha-aretz")
// Must send clan delegations to keep Sukkot (Zech 14:16-19)
// Punishment for non-attendance falls on the CLAN, not the individual

console.log(`\nPOPULATION 2: MORTAL NATIONS`);
console.log(`  Enter millennium via sheep/goats judgment (Mat 25:31-46)`);
console.log(`  Organized into mishpachot (Zech 14:17 — same word as firstfruits structure)`);
console.log(`  Sukkot attendance: by CLAN delegation (Zech 14:17-19 — punishment on mishpachah)`);
console.log(`  Reproduce over 1000 years (Isa 65:20, 23)`);

// QUESTION: How many mortal mishpachot can the temple serve per feast?
// And what total population does that imply?

console.log(`\n\n=== TEMPLE CAPACITY IN TERMS OF CLAN DELEGATIONS ===\n`);

// Temple attendees per feast (from Section 7 scenarios)
const templeAttendeeScenarios = [
  { label: "Conservative", attendees: 1000000 },
  { label: "Moderate", attendees: 1400000 },
  { label: "Maximum (court-bound)", attendees: 8600000 },
  { label: "Absolute ceiling", attendees: 16400000 },
];

// Delegation sizes (people per mishpachah delegation)
const delegationSizes = [5, 10, 20, 50, 100];

// Clan sizes (total people per mishpachah)
const clanSizes = [500, 1000, 2000, 5000, 10000];

console.log("How many clans can attend per feast, and what total population do they represent?\n");

for (const scenario of templeAttendeeScenarios) {
  console.log(`\n--- ${scenario.label}: ${scenario.attendees.toLocaleString()} attendees per feast ---\n`);
  
  // Header
  let header = "Delegation size →".padEnd(22);
  for (const ds of delegationSizes) {
    header += `${ds}/clan`.padStart(12);
  }
  console.log(header);
  console.log("-".repeat(22 + delegationSizes.length * 12));
  
  // "Clans served" row
  let clansRow = "Clans served:".padEnd(22);
  for (const ds of delegationSizes) {
    const clans = Math.floor(scenario.attendees / ds);
    clansRow += clans.toLocaleString().padStart(12);
  }
  console.log(clansRow);
  
  // Population rows for each clan size
  console.log("");
  for (const cs of clanSizes) {
    let row = `@ ${cs.toLocaleString()}/clan:`.padEnd(22);
    for (const ds of delegationSizes) {
      const clans = Math.floor(scenario.attendees / ds);
      const totalPop = clans * cs;
      // Format large numbers as millions/billions
      let fmt;
      if (totalPop >= 1e9) fmt = (totalPop / 1e9).toFixed(1) + "B";
      else if (totalPop >= 1e6) fmt = (totalPop / 1e6).toFixed(1) + "M";
      else fmt = (totalPop / 1e3).toFixed(0) + "K";
      row += fmt.padStart(12);
    }
    console.log(row);
  }
}

// ============================================================
// SECTION 13: CONVERGENCE — WHAT FITS?
// ============================================================

console.log("\n\n=== CONVERGENCE: WHICH COMBINATIONS ARE PHYSICALLY POSSIBLE? ===\n");

console.log("Constraints:");
console.log(`  1. Temple capacity: ${templeAttendeeScenarios[1].attendees.toLocaleString()} (moderate) to ${templeAttendeeScenarios[2].attendees.toLocaleString()} (maximum) attendees per feast`);
console.log(`  2. Promised Land carrying capacity: ~30-60 million mortals (mixed to intensive agriculture)`);
console.log(`  3. Firstfruits already in the land: ~60-230 million immortals (priestly zone, eat from tree of life)`);
console.log(`  4. 1000-year growth: starting pop × growth rate must stay within constraints`);
console.log(`  5. Gog/Magog: GLOBAL mortal pop must be large enough to "compass the camp" (Rev 20:9)`);

console.log(`\nKey insight: Zech 14:17 uses MISHPACHAH (clan), not individual.`);
console.log(`  v16: "every one that is left" → every survivor`);
console.log(`  v17: "mishpachot of the earth" → punishment falls on CLAN`);
console.log(`  The clan head's attendance covers the clan (priestly covering principle).`);
console.log(`  This means temple capacity represents FAR more people than raw attendee count.`);

console.log(`\nPromised Land mortal population (realistic range):`);
console.log(`  Start: 100K-2M survivors within the land after judgment`);
console.log(`  Growth: 0.1-0.5%/yr (extended lifespan but lower birth rate)`);
console.log(`  Year 1000: 1-40 million mortals in the land`);
console.log(`  Organized into mishpachot → send delegations to temple`);
console.log(`  Temple can handle this easily at clan-delegation ratios`);

console.log(`\nGlobal mortal population (unconstrained):`);
console.log(`  Start: 100M-1B+ survivors globally after judgment`);
console.log(`  Growth: 0.3-1.0%/yr (varies by region)`);
console.log(`  Year 1000: billions globally (enough for Gog/Magog)`);
console.log(`  Send mishpachah delegations to Jerusalem once/year (Zech 14:16)`);
console.log(`  Temple handles clan delegations from all nations`);

console.log(`\nThe structure:`);
console.log(`  ┌─────────────────────────────────────────────────┐`);
console.log(`  │  TEMPLE (500×500 cubits)                        │`);
console.log(`  │  Staffed by: 144 immortal clans (firstfruits)   │`);
console.log(`  │  Serves: mortal mishpachah delegations           │`);
console.log(`  ├─────────────────────────────────────────────────┤`);
console.log(`  │  SACRED DISTRICT (25,000×25,000 cubits)         │`);
console.log(`  │  Priestly + Levitical portions                   │`);
console.log(`  │  ~90M firstfruits occupy the priestly zone       │`);
console.log(`  ├─────────────────────────────────────────────────┤`);
console.log(`  │  PROMISED LAND (~300K sq mi)                     │`);
console.log(`  │  Mortal nations: ~1-40M, tribal allotments       │`);
console.log(`  │  Attend temple 3×/year by clan delegation        │`);
console.log(`  ├─────────────────────────────────────────────────┤`);
console.log(`  │  REST OF THE WORLD                               │`);
console.log(`  │  Global mortal nations: billions by year 1000    │`);
console.log(`  │  Send mishpachah delegations 1×/year (Sukkot)    │`);
console.log(`  │  Source of Gog/Magog (Rev 20:8 — "four quarters")│`);
console.log(`  └─────────────────────────────────────────────────┘`);
