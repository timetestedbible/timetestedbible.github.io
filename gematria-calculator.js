/**
 * Gematria Calculator for Strong's Hebrew and Greek Dictionaries
 * 
 * Calculates the numerical value of each word based on ancient
 * letter-number systems (Hebrew gematria and Greek isopsephy).
 */

// Hebrew letter values (standard gematria)
const hebrewValues = {
    // Regular letters
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5,
    'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
    'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60,
    'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100, 'ר': 200,
    'ש': 300, 'ת': 400,
    
    // Final forms (sofit) - standard values (same as regular)
    'ך': 20,  // Final Kaph (some count as 500)
    'ם': 40,  // Final Mem (some count as 600)
    'ן': 50,  // Final Nun (some count as 700)
    'ף': 80,  // Final Pe (some count as 800)
    'ץ': 90,  // Final Tsade (some count as 900)
    
    // Vowel points and cantillation marks (value 0 - ignored)
    'ְ': 0, 'ֱ': 0, 'ֲ': 0, 'ֳ': 0, 'ִ': 0,
    'ֵ': 0, 'ֶ': 0, 'ַ': 0, 'ָ': 0, 'ֹ': 0,
    'ֺ': 0, 'ֻ': 0, 'ּ': 0, 'ׁ': 0, 'ׂ': 0,
    'ׄ': 0, 'ׅ': 0, '֑': 0, '֒': 0, '֓': 0,
    '֔': 0, '֕': 0, '֖': 0, '֗': 0, '֘': 0,
    '֙': 0, '֚': 0, '֛': 0, '֜': 0, '֝': 0,
    '֞': 0, '֟': 0, '֠': 0, '֡': 0, '֢': 0,
    '֣': 0, '֤': 0, '֥': 0, '֦': 0, '֧': 0,
    '֨': 0, '֩': 0, '֪': 0, '֫': 0, '֬': 0,
    '֭': 0, '֮': 0, '֯': 0, 'ֽ': 0, '־': 0,
    'ֿ': 0, '׀': 0, 'ׁ': 0, 'ׂ': 0, '׃': 0,
    'ׇ': 0,
};

// Hebrew final forms with extended values (alternate counting)
const hebrewFinalExtended = {
    'ך': 500,  // Final Kaph
    'ם': 600,  // Final Mem
    'ן': 700,  // Final Nun
    'ף': 800,  // Final Pe
    'ץ': 900,  // Final Tsade
};

// Greek letter values (isopsephy)
const greekValues = {
    // Uppercase
    'Α': 1, 'Β': 2, 'Γ': 3, 'Δ': 4, 'Ε': 5,
    'Ϛ': 6, 'Ζ': 7, 'Η': 8, 'Θ': 9, 'Ι': 10,
    'Κ': 20, 'Λ': 30, 'Μ': 40, 'Ν': 50, 'Ξ': 60,
    'Ο': 70, 'Π': 80, 'Ϙ': 90, 'Ρ': 100, 'Σ': 200,
    'Τ': 300, 'Υ': 400, 'Φ': 500, 'Χ': 600, 'Ψ': 700,
    'Ω': 800, 'Ͳ': 900,
    
    // Lowercase
    'α': 1, 'β': 2, 'γ': 3, 'δ': 4, 'ε': 5,
    'ϛ': 6, 'ζ': 7, 'η': 8, 'θ': 9, 'ι': 10,
    'κ': 20, 'λ': 30, 'μ': 40, 'ν': 50, 'ξ': 60,
    'ο': 70, 'π': 80, 'ϙ': 90, 'ρ': 100, 'σ': 200,
    'ς': 200, // Final sigma
    'τ': 300, 'υ': 400, 'φ': 500, 'χ': 600, 'ψ': 700,
    'ω': 800, 'ͳ': 900,
    
    // Stigma/Digamma variants for 6
    'Ϝ': 6, 'ϝ': 6, 'ϲ': 200, // lunate sigma
    
    // Koppa variants for 90
    'Ϟ': 90, 'ϟ': 90,
    
    // Sampi variants for 900
    'Ϡ': 900, 'ϡ': 900,
    
    // Accents and diacritics (value 0 - ignored)
    '́': 0, '̀': 0, '̂': 0, '̃': 0, '̈': 0,
    'ʼ': 0, 'ʻ': 0, '᾽': 0, '᾿': 0, '῾': 0,
    '´': 0, '`': 0, '῀': 0, '῁': 0, '῍': 0,
    '῎': 0, '῏': 0, '῝': 0, '῞': 0, '῟': 0,
    '῭': 0, '΅': 0, '`': 0, '῾': 0,
};

/**
 * Calculate Hebrew gematria value
 * @param {string} word - Hebrew word
 * @param {boolean} useFinalExtended - Use extended values for final letters
 * @returns {number} - Gematria value
 */
function calculateHebrewGematria(word, useFinalExtended = false) {
    if (!word) return 0;
    
    let total = 0;
    const chars = [...word]; // Handle Unicode properly
    
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        
        // Check if it's a final letter and we're using extended values
        if (useFinalExtended && hebrewFinalExtended[char] !== undefined) {
            total += hebrewFinalExtended[char];
        } else if (hebrewValues[char] !== undefined) {
            total += hebrewValues[char];
        }
        // Skip characters not in the value table (spaces, punctuation, etc.)
    }
    
    return total;
}

/**
 * Calculate Greek isopsephy value
 * @param {string} word - Greek word
 * @returns {number} - Isopsephy value
 */
function calculateGreekIsopsephy(word) {
    if (!word) return 0;
    
    let total = 0;
    const chars = [...word]; // Handle Unicode properly
    
    for (const char of chars) {
        if (greekValues[char] !== undefined) {
            total += greekValues[char];
        }
        // Skip characters not in the value table
    }
    
    return total;
}

/**
 * Strip vowel points from Hebrew word (for comparison)
 * @param {string} word - Hebrew word with vowel points
 * @returns {string} - Consonants only
 */
function stripHebrewVowels(word) {
    if (!word) return '';
    return [...word].filter(char => {
        const val = hebrewValues[char];
        return val !== undefined && val > 0;
    }).join('');
}

/**
 * Process Strong's Hebrew Dictionary and calculate gematria
 * @param {Object} dictionary - Strong's Hebrew dictionary object
 * @returns {Object} - Dictionary with gematria values added
 */
function processHebrewDictionary(dictionary) {
    const result = {};
    
    for (const [strongs, entry] of Object.entries(dictionary)) {
        const lemma = entry.lemma || '';
        const gematria = calculateHebrewGematria(lemma);
        const gematriaExtended = calculateHebrewGematria(lemma, true);
        const consonants = stripHebrewVowels(lemma);
        
        result[strongs] = {
            ...entry,
            gematria: gematria,
            gematria_extended: gematriaExtended !== gematria ? gematriaExtended : undefined,
            consonants: consonants !== lemma ? consonants : undefined
        };
    }
    
    return result;
}

/**
 * Process Strong's Greek Dictionary and calculate isopsephy
 * @param {Object} dictionary - Strong's Greek dictionary object
 * @returns {Object} - Dictionary with isopsephy values added
 */
function processGreekDictionary(dictionary) {
    const result = {};
    
    for (const [strongs, entry] of Object.entries(dictionary)) {
        const lemma = entry.lemma || '';
        const isopsephy = calculateGreekIsopsephy(lemma);
        
        result[strongs] = {
            ...entry,
            gematria: isopsephy
        };
    }
    
    return result;
}

/**
 * Create a gematria index (value -> list of Strong's numbers)
 * @param {Object} dictionary - Dictionary with gematria values
 * @returns {Object} - Index by gematria value
 */
function createGematriaIndex(dictionary) {
    const index = {};
    
    for (const [strongs, entry] of Object.entries(dictionary)) {
        const value = entry.gematria;
        if (value && value > 0) {
            if (!index[value]) {
                index[value] = [];
            }
            index[value].push({
                strongs: strongs,
                lemma: entry.lemma,
                def: entry.strongs_def || entry.kjv_def
            });
        }
    }
    
    return index;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateHebrewGematria,
        calculateGreekIsopsephy,
        stripHebrewVowels,
        processHebrewDictionary,
        processGreekDictionary,
        createGematriaIndex,
        hebrewValues,
        greekValues
    };
}

// Export for browser usage
if (typeof window !== 'undefined') {
    window.GematriaCalculator = {
        calculateHebrewGematria,
        calculateGreekIsopsephy,
        stripHebrewVowels,
        processHebrewDictionary,
        processGreekDictionary,
        createGematriaIndex,
        hebrewValues,
        greekValues
    };
}
