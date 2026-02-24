#!/usr/bin/env node

// 2 Esdras sub-convergence: combine its individual measures
// into a single combined distribution

const lines = [
  { name: 'Ten-thousandth part (7:68)',    low: 0.005, high: 0.02,   color: '#78909C' },
  { name: 'Gold dust vs clay (8:2)',       low: 0.001, high: 1.25,   color: '#FFC107' },
  { name: 'Wave vs drop (9:16)',           low: 0.00001, high: 0.001, color: '#42A5F5' },
  { name: 'One grape from cluster (9:21)', low: 0.33,  high: 1.00,   color: '#66BB6A' },
  { name: 'Much seed, little yield (8:41)',low: 1.0,   high: 10.0,   color: '#AB47BC' },
];

console.log('=== 2 Esdras Sub-Convergence ===\n');

// Bayesian log-normal combination
let sumMuOverSigSq = 0;
let sumOneOverSigSq = 0;

lines.forEach(l => {
  const logLow = Math.log(l.low);
  const logHigh = Math.log(l.high);
  const mu = (logLow + logHigh) / 2;
  const sigma = (logHigh - logLow) / (2 * 1.96);

  sumMuOverSigSq += mu / (sigma * sigma);
  sumOneOverSigSq += 1 / (sigma * sigma);

  const logWidth = logHigh - logLow;
  console.log(`  ${l.name.padEnd(38)} ${l.low}–${l.high}%  log-μ: ${mu.toFixed(3)}, log-σ: ${sigma.toFixed(3)}, precision: ${(1/logWidth).toFixed(2)}`);
});

const mu = sumMuOverSigSq / sumOneOverSigSq;
const sigma = 1 / Math.sqrt(sumOneOverSigSq);
const median = Math.exp(mu);
const low95 = Math.exp(mu - 1.96 * sigma);
const high95 = Math.exp(mu + 1.96 * sigma);

console.log(`\n  Combined log-μ: ${mu.toFixed(4)}`);
console.log(`  Combined log-σ: ${sigma.toFixed(4)}`);
console.log(`  Combined median: ${median.toFixed(4)}%`);
console.log(`  Combined 95% interval: ${low95.toFixed(4)}% – ${high95.toFixed(4)}%`);

// This becomes the single "Extrabiblical (2 Esdras)" line in the main chart
console.log(`\n  → Use as main chart line: low=${low95.toFixed(4)}, high=${high95.toFixed(4)}`);

const fs = require('fs');
fs.writeFileSync('/Users/dlarimer/timetested/research/convergence-2esdras-data.json', JSON.stringify({
  lines, combined: { mu, sigma, median, low95, high95 }
}, null, 2));
console.log('\nWrote convergence-2esdras-data.json');
