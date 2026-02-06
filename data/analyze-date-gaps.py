#!/usr/bin/env python3
"""
Analyze gaps between extracted date references and existing events.
Identify which biblical date references need events/durations.
"""

import json
import re
from collections import defaultdict

def load_data():
    """Load extracted references and existing events."""
    with open('/Users/dlarimer/timetested/http/data/kjv-date-references.json') as f:
        date_refs = json.load(f)
    
    with open('/Users/dlarimer/timetested/http/historical-events-v2.json') as f:
        events_data = json.load(f)
    
    return date_refs, events_data

def build_verse_to_event_map(events_data):
    """Build a map of verse references to event IDs."""
    verse_to_events = defaultdict(list)
    
    for event in events_data.get('events', []):
        event_id = event['id']
        sources = event.get('sources', [])
        for src in sources:
            if src.get('type') == 'scripture':
                ref = src.get('ref', '')
                # Normalize the reference
                verse_to_events[ref].append(event_id)
    
    for duration in events_data.get('durations', []):
        duration_id = duration['id']
        src = duration.get('source', {})
        if src.get('type') == 'scripture':
            ref = src.get('ref', '')
            verse_to_events[ref].append(f"duration:{duration_id}")
    
    return dict(verse_to_events)

def normalize_verse_ref(ref):
    """Normalize verse reference for comparison."""
    # Handle ranges like "Genesis 5:25-27" -> "Genesis 5:25"
    ref = ref.strip()
    if '-' in ref:
        ref = ref.split('-')[0]
    return ref

def find_chronologically_significant_refs(date_refs):
    """Filter for chronologically significant references."""
    significant_types = [
        'reign_year',      # Year of a king's reign
        'year_of',         # Year of something
        'ordinal_month',   # First month, second month, etc.
        'month_name',      # Nisan, Abib, etc.
        'day_of_month',    # Specific day of month
        'age',             # Age references (for genealogy)
        'lifespan',        # Lifespan references
        'begat_age',       # Begetting ages (genealogy)
        'jubilee',         # Jubilee references
    ]
    
    significant = []
    for ref in date_refs['references']:
        if ref['type'] in significant_types:
            significant.append(ref)
    
    return significant

def extract_king_reign_refs(date_refs):
    """Extract specific king reign references."""
    reign_pattern = re.compile(
        r'(?:in\s+the\s+)?'
        r'(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|'
        r'eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|'
        r'eighteenth|nineteenth|twentieth|one and twentieth|two and twentieth|'
        r'three and twentieth|four and twentieth|five and twentieth|six and twentieth|'
        r'seven and twentieth|eight and twentieth|nine and twentieth|thirtieth|'
        r'one and thirtieth|two and thirtieth|three and thirtieth|four and thirtieth|'
        r'five and thirtieth|six and thirtieth|seven and thirtieth|eight and thirtieth|'
        r'nine and thirtieth|fortieth|one and fortieth|\d+)'
        r'(?:st|nd|rd|th)?\s+year\s+(?:of\s+)?(?:the\s+reign\s+of\s+)?'
        r'(?:king\s+)?(\w+)',
        re.IGNORECASE
    )
    
    king_refs = []
    for ref in date_refs['references']:
        if ref['type'] in ['reign_year', 'year_of']:
            text = ref['text'].lower()
            match = reign_pattern.search(text)
            if match:
                year_word = match.group(1)
                person = match.group(2)
                
                # Filter out common non-king words
                non_kings = ['the', 'a', 'an', 'his', 'her', 'their', 'our', 'my', 'your',
                            'rest', 'jubile', 'jubilee', 'release', 'tithe', 'this', 'that',
                            'same', 'next', 'lord', 'god', 'lamb', 'goat', 'bullock', 'ram']
                
                if person.lower() not in non_kings:
                    king_refs.append({
                        'verse': ref['verse'],
                        'year': year_word,
                        'person': person,
                        'text': ref['text'],
                        'match': ref['match']
                    })
    
    return king_refs

def extract_specific_dates(date_refs):
    """Extract specific date references (month + day combinations)."""
    specific_dates = []
    
    # Group references by verse
    by_verse = defaultdict(list)
    for ref in date_refs['references']:
        by_verse[ref['verse']].append(ref)
    
    # Find verses with both month and day
    for verse, refs in by_verse.items():
        month_ref = None
        day_ref = None
        year_ref = None
        
        for ref in refs:
            if ref['type'] in ['month_name', 'ordinal_month']:
                month_ref = ref
            if ref['type'] in ['day_of_month', 'numeric_day']:
                day_ref = ref
            if ref['type'] in ['reign_year', 'year_of']:
                year_ref = ref
        
        if month_ref or day_ref:
            specific_dates.append({
                'verse': verse,
                'month': month_ref['match'] if month_ref else None,
                'day': day_ref['match'] if day_ref else None,
                'year': year_ref['match'] if year_ref else None,
                'text': refs[0]['text'],
                'refs': refs
            })
    
    return specific_dates

def identify_gaps(date_refs, events_data, verse_to_events):
    """Identify date references without corresponding events."""
    gaps = {
        'missing_reign_refs': [],
        'missing_specific_dates': [],
        'missing_genealogy': [],
        'covered_verses': [],
    }
    
    # Check king reign references
    king_refs = extract_king_reign_refs(date_refs)
    for ref in king_refs:
        verse = ref['verse']
        normalized = normalize_verse_ref(verse)
        
        # Check if verse or its book/chapter is covered
        covered = False
        for existing_ref in verse_to_events.keys():
            if verse in existing_ref or normalized in existing_ref:
                covered = True
                break
            # Also check if the base reference matches
            if existing_ref.startswith(verse.rsplit(':', 1)[0]):
                if verse in existing_ref:
                    covered = True
                    break
        
        if covered:
            gaps['covered_verses'].append(ref)
        else:
            # Check if this is a real king reference
            person = ref['person'].lower()
            known_kings = [
                'david', 'solomon', 'rehoboam', 'abijah', 'abijam', 'asa', 'jehoshaphat',
                'joram', 'ahaziah', 'athaliah', 'joash', 'amaziah', 'uzziah', 'azariah',
                'jotham', 'ahaz', 'hezekiah', 'manasseh', 'amon', 'josiah', 'jehoahaz',
                'jehoiakim', 'jehoiachin', 'zedekiah',
                'jeroboam', 'nadab', 'baasha', 'elah', 'zimri', 'omri', 'ahab',
                'jehu', 'jehoahaz', 'joash', 'jeroboam', 'zechariah', 'shallum',
                'menahem', 'pekahiah', 'pekah', 'hoshea',
                'nebuchadnezzar', 'nebuchadrezzar', 'darius', 'cyrus', 'artaxerxes',
                'ahasuerus', 'xerxes', 'pharaoh', 'caesar', 'tiberius', 'herod', 'pilate',
                'noah', 'abraham', 'isaac', 'jacob', 'moses', 'aaron', 'joshua',
                'saul', 'uzziah', 'belshazzar'
            ]
            
            if person in known_kings:
                gaps['missing_reign_refs'].append(ref)
    
    # Check specific date references
    specific_dates = extract_specific_dates(date_refs)
    for ref in specific_dates:
        verse = ref['verse']
        if verse not in verse_to_events:
            # Only include if it has a month AND (day or year)
            if ref['month'] and (ref['day'] or ref['year']):
                gaps['missing_specific_dates'].append(ref)
    
    # Check genealogy references
    significant = find_chronologically_significant_refs(date_refs)
    for ref in significant:
        if ref['type'] in ['age', 'lifespan', 'begat_age']:
            verse = ref['verse']
            if verse not in verse_to_events:
                gaps['missing_genealogy'].append(ref)
    
    return gaps

def generate_report(gaps, date_refs, events_data):
    """Generate a comprehensive gap analysis report."""
    report = {
        'summary': {
            'total_date_references': len(date_refs['references']),
            'total_existing_events': len(events_data.get('events', [])),
            'total_existing_durations': len(events_data.get('durations', [])),
            'missing_reign_refs': len(gaps['missing_reign_refs']),
            'missing_specific_dates': len(gaps['missing_specific_dates']),
            'missing_genealogy': len(gaps['missing_genealogy']),
            'covered_verses': len(gaps['covered_verses']),
        },
        'missing_reign_refs': gaps['missing_reign_refs'],
        'missing_specific_dates': gaps['missing_specific_dates'],
        'missing_genealogy': gaps['missing_genealogy'][:50],  # Limit for readability
    }
    
    # Group missing reign refs by person
    by_person = defaultdict(list)
    for ref in gaps['missing_reign_refs']:
        by_person[ref['person'].lower()].append(ref)
    
    report['missing_by_person'] = {k: v for k, v in sorted(by_person.items(), key=lambda x: -len(x[1]))}
    
    return report

def main():
    print("Loading data...")
    date_refs, events_data = load_data()
    
    print("Building verse-to-event map...")
    verse_to_events = build_verse_to_event_map(events_data)
    print(f"  Mapped {len(verse_to_events)} verse references to events")
    
    print("Identifying gaps...")
    gaps = identify_gaps(date_refs, events_data, verse_to_events)
    
    print("\n=== GAP ANALYSIS SUMMARY ===")
    print(f"Total date references extracted: {len(date_refs['references'])}")
    print(f"Existing events in v2: {len(events_data.get('events', []))}")
    print(f"Existing durations in v2: {len(events_data.get('durations', []))}")
    print(f"Covered verse references: {len(gaps['covered_verses'])}")
    print(f"Missing reign references: {len(gaps['missing_reign_refs'])}")
    print(f"Missing specific dates: {len(gaps['missing_specific_dates'])}")
    print(f"Missing genealogy refs: {len(gaps['missing_genealogy'])}")
    
    # Generate report
    report = generate_report(gaps, date_refs, events_data)
    
    # Print missing by person
    print("\n=== MISSING REIGN REFERENCES BY PERSON ===")
    for person, refs in list(report['missing_by_person'].items())[:20]:
        print(f"  {person}: {len(refs)} references")
        for ref in refs[:3]:
            print(f"    - {ref['verse']}: {ref['match']}")
    
    # Print missing specific dates
    print("\n=== MISSING SPECIFIC DATES (first 20) ===")
    for ref in report['missing_specific_dates'][:20]:
        print(f"  {ref['verse']}: month={ref['month']}, day={ref['day']}, year={ref['year']}")
    
    # Save report
    output_file = '/Users/dlarimer/timetested/http/data/kjv-date-gaps.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\nFull report saved to {output_file}")
    
    return report

if __name__ == '__main__':
    main()
