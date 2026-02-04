#!/usr/bin/env node
/**
 * Generate Gematria Database
 * 
 * This script processes the Strong's Hebrew and Greek dictionaries
 * and generates JSON files with gematria values for each word.
 * 
 * Usage: node generate-gematria-db.js
 * 
 * Output:
 *   - data/hebrew-gematria.json - Hebrew words with gematria values
 *   - data/greek-gematria.json - Greek words with isopsephy values
 *   - data/gematria-index.json - Index by numerical value
 */

const fs = require('fs');
const path = require('path');

// Import the gematria calculator
const {
    calculateHebrewGematria,
    calculateGreekIsopsephy,
    stripHebrewVowels,
    createGematriaIndex
} = require('./gematria-calculator.js');

// Read the Strong's dictionaries
// They're JS files that export their dictionaries

console.log('Loading Strong\'s Hebrew Dictionary...');
const hebrewDict = require('./strongs-hebrew-dictionary.js');
console.log(`  Loaded ${Object.keys(hebrewDict).length} Hebrew entries`);

console.log('Loading Strong\'s Greek Dictionary...');
const greekDict = require('./strongs-greek-dictionary.js');
console.log(`  Loaded ${Object.keys(greekDict).length} Greek entries`);

// Process Hebrew dictionary
console.log('\nCalculating Hebrew gematria values...');
const hebrewGematria = {};
let hebrewCount = 0;

for (const [strongs, entry] of Object.entries(hebrewDict)) {
    const lemma = entry.lemma || '';
    const gematria = calculateHebrewGematria(lemma);
    const gematriaExtended = calculateHebrewGematria(lemma, true);
    const consonants = stripHebrewVowels(lemma);
    
    hebrewGematria[strongs] = {
        lemma: lemma,
        xlit: entry.xlit,
        gematria: gematria,
        def: entry.strongs_def
    };
    
    // Add extended value only if different
    if (gematriaExtended !== gematria) {
        hebrewGematria[strongs].gematria_extended = gematriaExtended;
    }
    
    hebrewCount++;
}
console.log(`  Calculated gematria for ${hebrewCount} Hebrew words`);

// Process Greek dictionary
console.log('\nCalculating Greek isopsephy values...');
const greekGematria = {};
let greekCount = 0;

for (const [strongs, entry] of Object.entries(greekDict)) {
    const lemma = entry.lemma || '';
    const gematria = calculateGreekIsopsephy(lemma);
    
    greekGematria[strongs] = {
        lemma: lemma,
        translit: entry.translit,
        gematria: gematria,
        def: entry.strongs_def
    };
    
    greekCount++;
}
console.log(`  Calculated isopsephy for ${greekCount} Greek words`);

// Create combined index by value
console.log('\nBuilding gematria index...');
const gematriaIndex = {};

// Add Hebrew entries to index
for (const [strongs, entry] of Object.entries(hebrewGematria)) {
    const value = entry.gematria;
    if (value && value > 0) {
        if (!gematriaIndex[value]) {
            gematriaIndex[value] = { hebrew: [], greek: [] };
        }
        gematriaIndex[value].hebrew.push({
            strongs: strongs,
            lemma: entry.lemma,
            xlit: entry.xlit,
            def: entry.def
        });
    }
}

// Add Greek entries to index
for (const [strongs, entry] of Object.entries(greekGematria)) {
    const value = entry.gematria;
    if (value && value > 0) {
        if (!gematriaIndex[value]) {
            gematriaIndex[value] = { hebrew: [], greek: [] };
        }
        gematriaIndex[value].greek.push({
            strongs: strongs,
            lemma: entry.lemma,
            translit: entry.translit,
            def: entry.def
        });
    }
}

// Sort index entries
const sortedIndex = {};
const sortedKeys = Object.keys(gematriaIndex).map(Number).sort((a, b) => a - b);
for (const key of sortedKeys) {
    sortedIndex[key] = gematriaIndex[key];
}

console.log(`  Created index with ${Object.keys(sortedIndex).length} unique values`);

// Find some interesting examples
console.log('\n=== Notable Gematria Values ===');

const notableValues = [7, 8, 12, 26, 37, 70, 77, 86, 153, 358, 666, 888];

for (const value of notableValues) {
    if (sortedIndex[value]) {
        const entry = sortedIndex[value];
        console.log(`\n${value}:`);
        if (entry.hebrew.length > 0) {
            console.log(`  Hebrew (${entry.hebrew.length}):`);
            entry.hebrew.slice(0, 3).forEach(h => {
                console.log(`    ${h.strongs}: ${h.lemma} (${h.xlit}) - ${h.def?.substring(0, 50)}...`);
            });
        }
        if (entry.greek.length > 0) {
            console.log(`  Greek (${entry.greek.length}):`);
            entry.greek.slice(0, 3).forEach(g => {
                console.log(`    ${g.strongs}: ${g.lemma} (${g.translit}) - ${g.def?.substring(0, 50)}...`);
            });
        }
    }
}

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Write output files
console.log('\n\nWriting output files...');

fs.writeFileSync(
    path.join(dataDir, 'hebrew-gematria.json'),
    JSON.stringify(hebrewGematria, null, 2)
);
console.log('  Written: data/hebrew-gematria.json');

fs.writeFileSync(
    path.join(dataDir, 'greek-gematria.json'),
    JSON.stringify(greekGematria, null, 2)
);
console.log('  Written: data/greek-gematria.json');

fs.writeFileSync(
    path.join(dataDir, 'gematria-index.json'),
    JSON.stringify(sortedIndex, null, 2)
);
console.log('  Written: data/gematria-index.json');

// Create a compact version for web use
const compactHebrew = {};
for (const [strongs, entry] of Object.entries(hebrewGematria)) {
    compactHebrew[strongs] = [entry.lemma, entry.gematria];
}

const compactGreek = {};
for (const [strongs, entry] of Object.entries(greekGematria)) {
    compactGreek[strongs] = [entry.lemma, entry.gematria];
}

fs.writeFileSync(
    path.join(dataDir, 'gematria-compact.json'),
    JSON.stringify({ hebrew: compactHebrew, greek: compactGreek })
);
console.log('  Written: data/gematria-compact.json (minified for web)');

console.log('\n✓ Gematria database generation complete!');
