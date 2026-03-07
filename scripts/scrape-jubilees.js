#!/usr/bin/env node
/**
 * Scrape Jubilees (50 chapters) from pseudepigrapha.com and build classics/jubilees.txt blob.
 * Format: ref\x01text\x01 where ref = "Jubilees|{chapter}"
 *
 * Source: https://www.pseudepigrapha.com/jubilees/{N}.htm (N=1-50)
 * R.H. Charles (1913) translation.
 *
 * Usage: node scripts/scrape-jubilees.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data/pseudepigrapha-raw/jubilees');
const OUT_DIR = path.join(ROOT, 'classics');
const OUTPUT = path.join(OUT_DIR, 'jubilees.txt');

const TOTAL_CHAPTERS = 50;
const BASE_URL = 'https://www.pseudepigrapha.com/jubilees/';
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
 * Extract clean text from Jubilees HTML page.
 * The pages have verse-numbered text: "1. And the angel..."
 * Strip HTML tags, headers, navigation, etc.
 */
function extractText(html) {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Content is in an <OL> with <LI> elements. Find the <OL> block.
  const olStart = text.search(/<ol>/i);
  if (olStart !== -1) {
    text = text.slice(olStart);
  }

  // Cut at </OL> or navigation/footer
  const olEnd = text.search(/<\/ol>/i);
  if (olEnd !== -1) {
    text = text.slice(0, olEnd);
  }

  // Convert <LI> to paragraph separators
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

  // Clean up whitespace: join wrapped lines within each paragraph
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
  // Create raw cache directory
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
  const blob = records.map(r => `Jubilees|${r.chapter}${SEP}${r.text}${SEP}`).join('');
  fs.writeFileSync(OUTPUT, blob, 'utf8');

  console.log(`\nWrote ${records.length} chapters to ${OUTPUT}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
