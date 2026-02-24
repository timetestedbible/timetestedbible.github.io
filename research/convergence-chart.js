#!/usr/bin/env node

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/Users/dlarimer/timetested/research/convergence-data.json', 'utf8'));

const { lines, combined } = data;

const marginLeft = 265;
const marginRight = 45;
const marginTop = 60;
const W = 820;

const plotW = W - marginLeft - marginRight;

const logMin = Math.log10(0.005);
const logMax = Math.log10(2.0);

function xPos(pct) {
  const clamped = Math.max(pct, Math.pow(10, logMin));
  const logVal = Math.log10(clamped);
  return marginLeft + Math.max(0, Math.min(plotW, ((logVal - logMin) / (logMax - logMin)) * plotW));
}

// Keep order from data file (strongest argument first)

const barHeight = 24;
const barGap = 7;
const barStartY = marginTop + 10;
const lastBarBottom = barStartY + lines.length * (barHeight + barGap);

// Bell curve layout
const bellGap = 30;
const bellH = 50;
const bellY = lastBarBottom + bellGap + bellH;
const axisY = bellY + 4;
const labelStartY = axisY + 16;

// Total height: just enough to fit axis labels + result text + small padding
const H = labelStartY + 58;

function bellCurvePoints() {
  const points = [];
  for (let i = 0; i <= 300; i++) {
    const pct = Math.pow(10, logMin + (i / 300) * (logMax - logMin));
    const logPct = Math.log(pct);
    const z = (logPct - combined.mu) / combined.sigma;
    const density = Math.exp(-0.5 * z * z);
    points.push({ x: xPos(pct), y: bellY - density * bellH, yBase: bellY });
  }
  return points;
}

const bellPoints = bellCurvePoints();

let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="max-width:100%;height:auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<defs>
  <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#E53935" stop-opacity="0.7"/>
    <stop offset="100%" stop-color="#E53935" stop-opacity="0.1"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="#1a1a2e" rx="12"/>
`;

// Title
svg += `<text x="${W/2}" y="32" text-anchor="middle" fill="#e0e0e0" font-size="18" font-weight="700">Convergence of Evidence: The Remnant Ratio</text>
<text x="${W/2}" y="52" text-anchor="middle" fill="#888" font-size="12">Log scale — each bar shows the range implied by that line of evidence</text>
`;

// Grid lines
const gridPcts = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0];
gridPcts.forEach(pct => {
  const x = xPos(pct);
  svg += `<line x1="${x}" y1="${marginTop}" x2="${x}" y2="${axisY}" stroke="#333" stroke-width="1" stroke-dasharray="4,4"/>`;
  svg += `<text x="${x}" y="${labelStartY}" text-anchor="middle" fill="#888" font-size="11">${pct}%</text>`;
});

// Median line
const medianX = xPos(combined.median);
svg += `<line x1="${medianX}" y1="${marginTop}" x2="${medianX}" y2="${bellY}" stroke="#E53935" stroke-width="2" stroke-dasharray="6,3" opacity="0.8"/>`;

// Bars
lines.forEach((line, i) => {
  const y = barStartY + i * (barHeight + barGap);
  const clampedLow = Math.max(line.low, Math.pow(10, logMin));
  const x1 = xPos(clampedLow);
  const x2 = xPos(line.high);
  const midPct = Math.sqrt(line.low * line.high);
  const midX = xPos(midPct);
  const isClamped = line.low < Math.pow(10, logMin);

  svg += `<text x="${marginLeft - 12}" y="${y + barHeight / 2 + 4}" text-anchor="end" fill="#ccc" font-size="11.5">${line.name}</text>`;
  svg += `<rect x="${x1}" y="${y}" width="${Math.max(x2 - x1, 2)}" height="${barHeight}" fill="${line.color}" opacity="0.6" rx="4"/>`;
  svg += `<rect x="${x1}" y="${y}" width="${Math.max(x2 - x1, 2)}" height="${barHeight}" fill="none" stroke="${line.color}" stroke-width="1.5" rx="4" opacity="0.9"/>`;

  if (isClamped) {
    const ay = y + barHeight / 2;
    svg += `<polygon points="${x1},${ay} ${x1 + 8},${ay - 5} ${x1 + 8},${ay + 5}" fill="${line.color}" opacity="0.9"/>`;
  }

  const dotX = Math.max(x1 + 4, Math.min(x2 - 4, midX));
  svg += `<circle cx="${dotX}" cy="${y + barHeight / 2}" r="3" fill="white" opacity="0.8"/>`;
});

// Bell curve fill
let fillPath = `M ${bellPoints[0].x} ${bellPoints[0].yBase}`;
bellPoints.forEach(p => { fillPath += ` L ${p.x} ${p.y}`; });
fillPath += ` L ${bellPoints[bellPoints.length - 1].x} ${bellPoints[bellPoints.length - 1].yBase} Z`;
svg += `<path d="${fillPath}" fill="url(#bellGrad)"/>`;

// Bell curve stroke
let strokePath = `M ${bellPoints[0].x} ${bellPoints[0].y}`;
bellPoints.forEach(p => { strokePath += ` L ${p.x} ${p.y}`; });
svg += `<path d="${strokePath}" fill="none" stroke="#E53935" stroke-width="2.5"/>`;

// 95% interval shading
const ci95Left = xPos(combined.low95);
const ci95Right = xPos(combined.high95);
svg += `<rect x="${ci95Left}" y="${bellY - bellH - 3}" width="${ci95Right - ci95Left}" height="${bellH + 3}" fill="#E53935" opacity="0.12" rx="2"/>`;

// Result labels — below axis
const resultY = labelStartY + 20;
svg += `<text x="${medianX}" y="${resultY}" text-anchor="middle" fill="#E53935" font-size="15" font-weight="700">${combined.median.toFixed(2)}%</text>`;
svg += `<text x="${medianX}" y="${resultY + 16}" text-anchor="middle" fill="#E53935" font-size="11">Combined median</text>`;
svg += `<text x="${medianX}" y="${resultY + 32}" text-anchor="middle" fill="#999" font-size="10">95% interval: ${combined.low95.toFixed(2)}% – ${combined.high95.toFixed(2)}%</text>`;

svg += `</svg>`;

fs.writeFileSync('/Users/dlarimer/timetested/assets/img/remnant-convergence.svg', svg);
console.log(`Wrote: assets/img/remnant-convergence.svg (${W}x${H})`);
