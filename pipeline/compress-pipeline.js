#!/usr/bin/env node
/**
 * compress-pipeline.js — Compress bloated pipeline files to target density
 * 
 * Runs N files in parallel via API calls. Reads each file + its dependencies,
 * asks AI to compress to target line count while preserving all unique findings.
 * 
 * Usage:
 *   node pipeline/compress-pipeline.js                    # compress all over-limit files
 *   node pipeline/compress-pipeline.js --limit 60         # custom line limit (default 50 for symbols, 60 for contexts)
 *   node pipeline/compress-pipeline.js --parallel 5       # N parallel calls (default 5)
 *   node pipeline/compress-pipeline.js --type symbols     # only symbols
 *   node pipeline/compress-pipeline.js --type contexts    # only contexts
 *   DRY_RUN=1 node pipeline/compress-pipeline.js          # preview what would be compressed
 */

const fs = require('fs');
const path = require('path');

const PIPELINE = path.join(__dirname);
const SYMBOL_LIMIT = 50;   // max lines for symbol studies
const CONTEXT_LIMIT = 60;  // max lines for context files

const args = process.argv.slice(2);
const parallelIdx = args.indexOf('--parallel');
const parallel = parallelIdx >= 0 ? parseInt(args[parallelIdx + 1]) : 5;
const typeIdx = args.indexOf('--type');
const typeFilter = typeIdx >= 0 ? args[typeIdx + 1] : 'all';

async function callAI(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.MODEL || 'claude-sonnet-4-20250514'; // use sonnet for compression — cheaper
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err}`);
  }
  
  const data = await response.json();
  return { text: data.content[0].text, tokens: data.usage };
}

function buildCompressPrompt(filepath, content, limit) {
  const isSymbol = filepath.includes('/symbols/');
  return `Compress this pipeline file to ${limit} lines max. RULES:
- Keep ALL YAML frontmatter unchanged (everything between --- markers)
- Keep ALL unique findings, connections, and discoveries
- REMOVE: verse quotations (cite by reference only), prose explanations, redundant restatements
- REMOVE: information that's already in dependency files (referenced in inputs:)
- USE shorthand: → + || = ≠ ∅ Δ [H] [G] N/M subj: spkr: ctx:
- One line per occurrence/finding. Pattern summaries at end.
- ${isSymbol ? 'Symbol study target: 30-50 lines. Context bag: one line per key occurrence.' : 'Context file target: 40-60 lines. Only write what combining the symbol studies reveals.'}
- Output ONLY the compressed file content, nothing else.

FILE TO COMPRESS (${filepath}):
${content}`;
}

async function findBloatedFiles() {
  const files = [];
  
  if (typeFilter === 'all' || typeFilter === 'symbols') {
    const symDir = path.join(PIPELINE, 'symbols');
    for (const f of fs.readdirSync(symDir).filter(f => f.endsWith('.md'))) {
      const full = path.join(symDir, f);
      const lines = fs.readFileSync(full, 'utf-8').split('\n').length;
      if (lines > SYMBOL_LIMIT) {
        files.push({ path: full, relPath: `symbols/${f}`, lines, limit: SYMBOL_LIMIT, type: 'symbol' });
      }
    }
  }
  
  if (typeFilter === 'all' || typeFilter === 'contexts') {
    const ctxDir = path.join(PIPELINE, 'contexts');
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (!f.endsWith('.md') || f.includes('.identify.')) continue;
        const lines = fs.readFileSync(full, 'utf-8').split('\n').length;
        if (lines > CONTEXT_LIMIT) {
          const rel = path.relative(PIPELINE, full);
          files.push({ path: full, relPath: rel, lines, limit: CONTEXT_LIMIT, type: 'context' });
        }
      }
    };
    walk(ctxDir);
  }
  
  return files.sort((a, b) => b.lines - a.lines); // biggest first
}

async function compressFile(file) {
  const content = fs.readFileSync(file.path, 'utf-8');
  const prompt = buildCompressPrompt(file.relPath, content, file.limit);
  
  try {
    const result = await callAI(prompt);
    const compressed = result.text;
    const newLines = compressed.split('\n').length;
    
    if (process.env.DRY_RUN) {
      console.log(`  [DRY] ${file.relPath}: ${file.lines} → ~${newLines} lines`);
      return { file: file.relPath, before: file.lines, after: newLines, saved: true };
    }
    
    // Backup original
    fs.writeFileSync(file.path + '.bak', content);
    fs.writeFileSync(file.path, compressed);
    
    console.log(`  ✓ ${file.relPath}: ${file.lines} → ${newLines} lines (${result.tokens.input_tokens}+${result.tokens.output_tokens} tok)`);
    return { file: file.relPath, before: file.lines, after: newLines, saved: true };
  } catch (err) {
    console.log(`  ✗ ${file.relPath}: ${err.message}`);
    return { file: file.relPath, before: file.lines, after: file.lines, saved: false, error: err.message };
  }
}

async function runBatch(files, batchSize) {
  const results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`\nBatch ${Math.floor(i/batchSize) + 1}/${Math.ceil(files.length/batchSize)} (${batch.length} files):`);
    const batchResults = await Promise.all(batch.map(f => compressFile(f)));
    results.push(...batchResults);
    if (i + batchSize < files.length) await new Promise(r => setTimeout(r, 1000));
  }
  return results;
}

async function gitSnapshot() {
  const { execSync } = require('child_process');
  try {
    execSync('git add pipeline/', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
    execSync('git commit -m "pipeline: pre-compression snapshot" --allow-empty', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
    console.log('Git snapshot saved — all current versions recoverable.\n');
  } catch (e) {
    console.log('Git snapshot: nothing to commit (clean state).\n');
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.DRY_RUN) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }
  
  // Save current state to git before any compression
  if (!process.env.DRY_RUN) await gitSnapshot();
  
  const files = await findBloatedFiles();
  
  console.log(`\n=== Pipeline Compression ===`);
  console.log(`Found ${files.length} files over limit (${parallel} parallel)\n`);
  
  if (files.length === 0) {
    console.log('Nothing to compress!');
    return;
  }
  
  for (const f of files) {
    console.log(`  ${f.relPath}: ${f.lines} lines (limit: ${f.limit})`);
  }
  
  const results = await runBatch(files, parallel);
  
  const saved = results.filter(r => r.saved);
  const totalBefore = saved.reduce((s, r) => s + r.before, 0);
  const totalAfter = saved.reduce((s, r) => s + r.after, 0);
  
  console.log(`\n=== Done: ${saved.length}/${results.length} compressed ===`);
  console.log(`Total: ${totalBefore} → ${totalAfter} lines (${Math.round((1 - totalAfter/totalBefore) * 100)}% reduction)`);
}

main();
