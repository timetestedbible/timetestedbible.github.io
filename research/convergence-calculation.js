#!/usr/bin/env node

const fs = require('fs');

// Load 2 Esdras combined result
const esdras = JSON.parse(fs.readFileSync('/Users/dlarimer/timetested/research/convergence-2esdras-data.json', 'utf8'));

const lines = [
  { name: 'Demographic (Elijah/Paul)',     low: 0.35,  high: 0.70,  color: '#FF9800' },
  { name: 'Prophetic (Jer 3:14)',          low: 0.10,  high: 0.20,  color: '#2196F3' },
  { name: 'Agricultural (olive gleaning)', low: 0.03,  high: 0.50,  color: '#8BC34A' },
  { name: 'Metallurgical (refining yield)',low: 0.01,  high: 1.00,  color: '#FFC107' },
  { name: 'Wisdom (Solomon Eccl 7:28)',    low: 0.03,  high: 0.10,  color: '#E91E63' },
  { name: 'Ecological (lion/prey)',        low: 0.14,  high: 1.00,  color: '#795548' },
  { name: 'Typological (Israel/nations)',  low: 0.12,  high: 0.52,  color: '#00BCD4' },
  { name: 'Spatial (land density)',        low: 0.15,  high: 0.25,  color: '#4CAF50' },
  { name: 'Extrabiblical (2 Esdras)',      low: +esdras.combined.low95.toFixed(4), high: +esdras.combined.high95.toFixed(4), color: '#607D8B' },
  { name: 'Geometric (pe\'ah field edge)', low: 0.25,  high: 0.51,  color: '#9C27B0' },
];

console.log('=== Main Convergence (with 2 Esdras as pre-combined line) ===\n');

let sumMuOverSigSq = 0;
let sumOneOverSigSq = 0;

lines.forEach(l => {
  const logLow = Math.log(l.low);
  const logHigh = Math.log(l.high);
  const mu = (logLow + logHigh) / 2;
  const sigma = (logHigh - logLow) / (2 * 1.96);

  sumMuOverSigSq += mu / (sigma * sigma);
  sumOneOverSigSq += 1 / (sigma * sigma);

  console.log(`  ${l.name.padEnd(38)} ${l.low}–${l.high}%  log-σ: ${sigma.toFixed(3)}`);
});

const combinedMu = sumMuOverSigSq / sumOneOverSigSq;
const combinedSigma = 1 / Math.sqrt(sumOneOverSigSq);
const combinedMedian = Math.exp(combinedMu);
const combined95Low = Math.exp(combinedMu - 1.96 * combinedSigma);
const combined95High = Math.exp(combinedMu + 1.96 * combinedSigma);

console.log(`\n  Combined median: ${combinedMedian.toFixed(4)}%`);
console.log(`  Combined 95%: ${combined95Low.toFixed(4)}% – ${combined95High.toFixed(4)}%`);

// Ranked
const ranked = lines.map(l => ({
  ...l,
  logWidth: Math.log(l.high) - Math.log(l.low),
})).sort((a, b) => a.logWidth - b.logWidth);

console.log('\nRanked by precision:');
ranked.forEach((l, i) => {
  console.log(`  ${(i+1).toString().padStart(2)}. ${l.name.padEnd(38)} (log-width: ${l.logWidth.toFixed(2)})`);
});

// Applied
console.log(`\n  Current gen (8.2B): ~${Math.round(8.2e9 * combinedMedian / 100).toLocaleString()} people`);
console.log(`  All post-Christ (~43B): ~${Math.round(43e9 * combinedMedian / 100).toLocaleString()} people`);

fs.writeFileSync('/Users/dlarimer/timetested/research/convergence-data.json', JSON.stringify({
  lines,
  combined: { mu: combinedMu, sigma: combinedSigma, median: combinedMedian, low95: combined95Low, high95: combined95High }
}, null, 2));
console.log('\nWrote convergence-data.json');
