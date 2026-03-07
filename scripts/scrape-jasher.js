#!/usr/bin/env node
/**
 * Scrape Jasher (91 chapters) from ccel.org and build classics/jasher.txt blob.
 * Format: ref\x01text\x01 where ref = "Jasher|{chapter}"
 *
 * Source: https://www.ccel.org/a/anonymous/jasher/{N}.htm (N=1-91)
 * 1840 translation. Narrative paragraphs without verse numbers.
 *
 * Usage: node scripts/scrape-jasher.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data/pseudepigrapha-raw/jasher');
const OUT_DIR = path.join(ROOT, 'classics');
const OUTPUT = path.join(OUT_DIR, 'jasher.txt');

const TOTAL_CHAPTERS = 91;
const BASE_URL = 'https://www.ccel.org/a/anonymous/jasher/';
const DELAY_MS = 500;

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Extract clean text from Jasher HTML page.
 * Narrative paragraphs without verse numbers. Strip HTML, headers, navigation.
 */
function extractText(html) {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // The content is in an <OL> with <LI> elements after the </H6> nav block.
  // The H6 tag spans many lines, so match across newlines.
  const h6End = text.search(/<\/h6>/i);
  if (h6End !== -1) {
    text = text.slice(h6End + 5);
  }

  // Cut at footer: <HR> tag before the <ADDRESS> block
  const hrIdx = text.search(/<hr/i);
  if (hrIdx !== -1) {
    text = text.slice(0, hrIdx);
  }

  // Convert <LI> to paragraph breaks (each LI is a paragraph in Jasher)
  text = text.replace(/<li>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '\n');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&#\d+;/g, '');

  // Clean up whitespace: join wrapped lines within each paragraph, keep paragraph breaks
  const rawLines = text.split('\n');
  const paragraphs = [];
  let current = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    } else {
      current.push(trimmed);
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' '));

  return paragraphs.join('\n').trim();
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const records = [];

  for (let ch = 1; ch <= TOTAL_CHAPTERS; ch++) {
    const cacheFile = path.join(RAW_DIR, `${ch}.html`);
    let html;

    if (fs.existsSync(cacheFile)) {
      html = fs.readFileSync(cacheFile, 'utf8');
      process.stdout.write(`  Ch ${ch}: cached\n`);
    } else {
      const url = `${BASE_URL}${ch}.htm`;
      process.stdout.write(`  Ch ${ch}: fetching ${url}...`);
      try {
        html = await fetchPage(url);
        fs.writeFileSync(cacheFile, html, 'utf8');
        process.stdout.write(` ok (${html.length} bytes)\n`);
      } catch (err) {
        process.stdout.write(` FAILED: ${err.message}\n`);
        continue;
      }
      if (ch < TOTAL_CHAPTERS) await sleep(DELAY_MS);
    }

    const text = extractText(html);
    if (text) {
      records.push({ chapter: ch, text });
    } else {
      console.warn(`  WARNING: No text extracted for chapter ${ch}`);
    }
  }

  const SEP = '\x01';
  const blob = records.map(r => `Jasher|${r.chapter}${SEP}${r.text}${SEP}`).join('');
  fs.writeFileSync(OUTPUT, blob, 'utf8');

  console.log(`\nWrote ${records.length} chapters to ${OUTPUT}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
