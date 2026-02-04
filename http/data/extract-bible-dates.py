#!/usr/bin/env python3
"""
Extract all date/time references from the KJV Bible.
Outputs a structured JSON catalog for analysis.
"""

import re
import json
from collections import defaultdict

# Hebrew month names (various spellings)
HEBREW_MONTHS = [
    r'\b(Nisan|Abib)\b',      # Month 1
    r'\b(Zif|Ziv|Iyar)\b',    # Month 2
    r'\b(Sivan)\b',           # Month 3
    r'\b(Tammuz)\b',          # Month 4
    r'\b(Ab)\b',              # Month 5
    r'\b(Elul)\b',            # Month 6
    r'\b(Ethanim|Tishri)\b',  # Month 7
    r'\b(Bul)\b',             # Month 8
    r'\b(Chisleu|Kislev)\b',  # Month 9
    r'\b(Tebeth|Tevet)\b',    # Month 10
    r'\b(Sebat|Shevat)\b',    # Month 11
    r'\b(Adar)\b',            # Month 12
]

# Number words for matching
NUM_WORDS = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
    'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
    'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18,
    'nineteenth': 19, 'twentieth': 20, 'one and twentieth': 21,
    'two and twentieth': 22, 'three and twentieth': 23, 'four and twentieth': 24,
    'five and twentieth': 25, 'six and twentieth': 26, 'seven and twentieth': 27,
    'eight and twentieth': 28, 'nine and twentieth': 29, 'thirtieth': 30,
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
    'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
    'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40,
    'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80,
    'ninety': 90, 'hundred': 100, 'thousand': 1000,
    'threescore': 60, 'fourscore': 80,
}

# Patterns to extract
PATTERNS = {
    # Month references
    'month_name': r'\b(Nisan|Abib|Zif|Ziv|Sivan|Tammuz|Elul|Ethanim|Bul|Chisleu|Chislev|Tebeth|Sebat|Adar)\b',
    
    # Ordinal month (first month, second month, etc.)
    'ordinal_month': r'\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+month\b',
    
    # Day of month patterns
    'day_of_month': r'\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|one and twentieth|two and twentieth|three and twentieth|four and twentieth|five and twentieth|six and twentieth|seven and twentieth|eight and twentieth|nine and twentieth|thirtieth)\s+(?:day\s+)?(?:of\s+the\s+month|day)\b',
    
    # Numeric day patterns
    'numeric_day': r'\b(\d+)(?:st|nd|rd|th)?\s+day\b',
    
    # Year of reign patterns
    'reign_year': r'\b(?:in\s+the\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|one and twentieth|two and twentieth|three and twentieth|four and twentieth|five and twentieth|six and twentieth|seven and twentieth|eight and twentieth|nine and twentieth|thirtieth|fortieth|one and fortieth|\d+)(?:st|nd|rd|th)?\s+year\s+(?:of\s+)?(?:the\s+reign\s+of\s+)?(?:king\s+)?(\w+)',
    
    # Generic year patterns
    'year_of': r'\b(?:in\s+the\s+)?(\w+)\s+year\s+of\s+(\w+)',
    
    # Age patterns (X years old)
    'age': r'\b(\w+(?:\s+and\s+\w+)?(?:\s+hundred)?(?:\s+and\s+\w+)?)\s+years?\s+old\b',
    
    # Lifespan patterns (lived X years)
    'lifespan': r'\b(?:lived|was)\s+(?:an?\s+)?(\w+(?:\s+hundred)?(?:\s+and\s+\w+)?(?:\s+and\s+\w+)?)\s+years?\b',
    
    # Begat at age patterns
    'begat_age': r'\b(?:lived|was)\s+(\w+(?:\s+hundred)?(?:\s+and\s+\w+)?)\s+years?,?\s+and\s+begat\b',
    
    # Duration patterns (N days/months/years)
    'duration_days': r'\b(\w+(?:\s+and\s+\w+)?(?:\s+hundred)?(?:\s+thousand)?(?:\s+and\s+\w+)?)\s+days?\b',
    'duration_months': r'\b(\w+(?:\s+and\s+\w+)?)\s+months?\b',
    'duration_years': r'\b(\w+(?:\s+hundred)?(?:\s+and\s+\w+)?(?:\s+and\s+\w+)?)\s+years?\b',
    'duration_weeks': r'\b(\w+)\s+weeks?\b',
    
    # Sabbath references
    'sabbath': r'\b(sabbath|sabbaths)\b',
    
    # Passover and feast references
    'feast': r'\b(passover|unleavened bread|pentecost|tabernacles|atonement|trumpets|purim|dedication)\b',
    
    # New moon
    'new_moon': r'\b(new moon)\b',
    
    # Jubilee
    'jubilee': r'\b(jubile|jubilee)\b',
    
    # After X time patterns
    'after_time': r'\bafter\s+(\w+(?:\s+and\s+\w+)?(?:\s+hundred)?(?:\s+and\s+\w+)?)\s+(days?|months?|years?|weeks?)\b',
    
    # At the end of patterns
    'end_of': r'\bat\s+the\s+end\s+of\s+(\w+(?:\s+and\s+\w+)?(?:\s+hundred)?)\s+(days?|months?|years?)\b',
    
    # In the days of
    'in_days_of': r'\bin\s+the\s+days\s+of\s+(\w+)',
    
    # Generation patterns
    'generation': r'\b(\w+)\s+generations?\b',
}

def parse_number(text):
    """Convert number words to integer."""
    text = text.lower().strip()
    
    # Direct numeric
    if text.isdigit():
        return int(text)
    
    # Check for compound numbers like "nine hundred and sixty nine"
    total = 0
    current = 0
    
    words = text.replace('-', ' ').split()
    
    for word in words:
        if word == 'and':
            continue
        if word in NUM_WORDS:
            num = NUM_WORDS[word]
            if num == 100:
                current = current * 100 if current else 100
            elif num == 1000:
                current = current * 1000 if current else 1000
                total += current
                current = 0
            elif num >= 100:
                total += current
                current = num
            else:
                current += num
        else:
            # Unknown word
            pass
    
    total += current
    return total if total > 0 else None

def extract_references(kjv_file):
    """Extract all date/time references from KJV."""
    references = []
    
    with open(kjv_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines[2:]:  # Skip header lines
        line = line.strip()
        if not line or '\t' not in line:
            continue
        
        parts = line.split('\t', 1)
        if len(parts) != 2:
            continue
        
        ref, text = parts
        text_lower = text.lower()
        
        for pattern_name, pattern in PATTERNS.items():
            matches = re.finditer(pattern, text_lower, re.IGNORECASE)
            for match in matches:
                ref_data = {
                    'verse': ref,
                    'type': pattern_name,
                    'match': match.group(0),
                    'groups': match.groups(),
                    'text': text,
                    'start': match.start(),
                    'end': match.end()
                }
                
                # Parse numeric value if applicable
                if match.groups():
                    parsed = parse_number(match.group(1))
                    if parsed:
                        ref_data['value'] = parsed
                
                references.append(ref_data)
    
    return references

def categorize_references(references):
    """Categorize references by type and book."""
    by_type = defaultdict(list)
    by_book = defaultdict(list)
    by_verse = defaultdict(list)
    
    for ref in references:
        by_type[ref['type']].append(ref)
        book = ref['verse'].split()[0]
        by_book[book].append(ref)
        by_verse[ref['verse']].append(ref)
    
    return {
        'by_type': dict(by_type),
        'by_book': dict(by_book),
        'by_verse': dict(by_verse),
    }

def extract_reign_references(references):
    """Extract and structure reign-related references."""
    reign_refs = []
    
    for ref in references:
        if ref['type'] in ['reign_year', 'year_of']:
            reign_refs.append({
                'verse': ref['verse'],
                'match': ref['match'],
                'year_ordinal': ref.get('value'),
                'person': ref['groups'][-1] if ref['groups'] else None,
                'text': ref['text']
            })
    
    return reign_refs

def extract_genealogy_ages(references):
    """Extract genealogy-related age references."""
    genealogy = []
    
    for ref in references:
        if ref['type'] in ['age', 'lifespan', 'begat_age']:
            genealogy.append({
                'verse': ref['verse'],
                'type': ref['type'],
                'match': ref['match'],
                'value': ref.get('value'),
                'text': ref['text']
            })
    
    return genealogy

def main():
    kjv_file = '/Users/dlarimer/timetested/http/kjv.txt'
    
    print("Extracting date/time references from KJV...")
    references = extract_references(kjv_file)
    print(f"Found {len(references)} total references")
    
    # Categorize
    categorized = categorize_references(references)
    
    # Print summary by type
    print("\n=== Summary by Type ===")
    for type_name, refs in sorted(categorized['by_type'].items(), key=lambda x: -len(x[1])):
        print(f"  {type_name}: {len(refs)}")
    
    # Extract specific categories
    reign_refs = extract_reign_references(references)
    genealogy_refs = extract_genealogy_ages(references)
    
    # Build output structure
    output = {
        'meta': {
            'source': 'KJV Bible',
            'total_references': len(references),
            'extraction_patterns': list(PATTERNS.keys()),
        },
        'summary': {
            'by_type': {k: len(v) for k, v in categorized['by_type'].items()},
            'by_book': {k: len(v) for k, v in categorized['by_book'].items()},
        },
        'references': references,
        'reign_references': reign_refs,
        'genealogy_references': genealogy_refs,
        'verses_with_dates': list(categorized['by_verse'].keys()),
    }
    
    # Save to JSON
    output_file = '/Users/dlarimer/timetested/http/data/kjv-date-references.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved to {output_file}")
    
    # Print some interesting findings
    print("\n=== Month Name References ===")
    for ref in categorized['by_type'].get('month_name', [])[:20]:
        print(f"  {ref['verse']}: {ref['match']}")
    
    print("\n=== Reign Year References (first 20) ===")
    for ref in reign_refs[:20]:
        print(f"  {ref['verse']}: {ref['match']}")
    
    return output

if __name__ == '__main__':
    main()
