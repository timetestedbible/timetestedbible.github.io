#!/usr/bin/env node

// Calculate the ratio of perimeter rows to total rows in a field
// for different field sizes and crop spacings.
//
// A square field of area A has side length s = sqrt(A).
// Rows per side = s / row_spacing.
// Total rows (grid) = rows_per_side^2
// Interior rows = (rows_per_side - 2)^2
// Perimeter rows = total - interior = rows_per_side^2 - (rows_per_side - 2)^2
//                = 4 * rows_per_side - 4

const SQ_METERS_PER_ACRE = 4046.86;

// Typical row spacing for ancient/modern crops (meters)
const crops = {
  'Wheat':  { rowSpacing: 0.18 },   // ~7 inches, ancient broadcast/dense planting
  'Barley': { rowSpacing: 0.18 },   // similar to wheat
  'Corn':   { rowSpacing: 0.76 },   // ~30 inches (modern maize rows)
  'Olive':  { rowSpacing: 6.0  },   // ~20 feet between trees
  'Grape':  { rowSpacing: 2.0  },   // ~6.5 feet between vine rows
};

const fieldSizesAcres = [0.5, 1, 2, 5, 10, 20, 50, 100, 500, 1000];

console.log('=== Pe\'ah Edge-to-Area Ratio Calculator ===\n');
console.log('Assumption: square field, one row of crop left unharvested at the perimeter.\n');

for (const [cropName, { rowSpacing }] of Object.entries(crops)) {
  console.log(`--- ${cropName} (row spacing: ${rowSpacing}m / ${(rowSpacing * 39.37).toFixed(1)} inches) ---`);
  console.log(
    'Acres'.padStart(8),
    'Side(m)'.padStart(10),
    'Rows/Side'.padStart(12),
    'Total Rows'.padStart(14),
    'Perimeter'.padStart(12),
    'Edge %'.padStart(10)
  );

  for (const acres of fieldSizesAcres) {
    const areaM2 = acres * SQ_METERS_PER_ACRE;
    const sideM = Math.sqrt(areaM2);
    const rowsPerSide = Math.floor(sideM / rowSpacing);

    if (rowsPerSide < 3) {
      console.log(
        acres.toString().padStart(8),
        sideM.toFixed(1).padStart(10),
        rowsPerSide.toString().padStart(12),
        '—'.padStart(14),
        '—'.padStart(12),
        'too small'.padStart(10)
      );
      continue;
    }

    const totalRows = rowsPerSide * rowsPerSide;
    const interiorRows = (rowsPerSide - 2) * (rowsPerSide - 2);
    const perimeterRows = totalRows - interiorRows;
    const edgePct = (perimeterRows / totalRows) * 100;

    console.log(
      acres.toString().padStart(8),
      sideM.toFixed(1).padStart(10),
      rowsPerSide.toString().padStart(12),
      totalRows.toLocaleString().padStart(14),
      perimeterRows.toLocaleString().padStart(12),
      (edgePct.toFixed(2) + '%').padStart(10)
    );
  }
  console.log('');
}

// Summary table for the blog
console.log('\n=== SIMPLIFIED SUMMARY FOR BLOG ===\n');
console.log('Field Size'.padEnd(14), 'Wheat'.padStart(10), 'Barley'.padStart(10), 'Grape'.padStart(10), 'Olive'.padStart(10));

for (const acres of [1, 5, 10, 20, 50, 100]) {
  const areaM2 = acres * SQ_METERS_PER_ACRE;
  const sideM = Math.sqrt(areaM2);
  const vals = {};

  for (const [cropName, { rowSpacing }] of Object.entries(crops)) {
    const rowsPerSide = Math.floor(sideM / rowSpacing);
    if (rowsPerSide < 3) {
      vals[cropName] = '—';
      continue;
    }
    const totalRows = rowsPerSide * rowsPerSide;
    const interiorRows = (rowsPerSide - 2) * (rowsPerSide - 2);
    const perimeterRows = totalRows - interiorRows;
    const edgePct = (perimeterRows / totalRows) * 100;
    vals[cropName] = edgePct.toFixed(2) + '%';
  }

  console.log(
    (acres + ' acre' + (acres > 1 ? 's' : '')).padEnd(14),
    (vals['Wheat'] || '—').padStart(10),
    (vals['Barley'] || '—').padStart(10),
    (vals['Grape'] || '—').padStart(10),
    (vals['Olive'] || '—').padStart(10)
  );
}
