#!/usr/bin/env python3
"""
Create a comprehensive verse-to-event index for linking Bible verses
to timeline events and calendar dates.
"""

import json
import re
from collections import defaultdict

def load_data():
    """Load all relevant data files."""
    with open('/Users/dlarimer/timetested/http/historical-events-v2.json') as f:
        events_data = json.load(f)
    
    with open('/Users/dlarimer/timetested/http/data/kjv-date-references.json') as f:
        date_refs = json.load(f)
    
    with open('/Users/dlarimer/timetested/http/data/kjv-proposed-additions.json') as f:
        proposals = json.load(f)
    
    return events_data, date_refs, proposals

def normalize_verse_ref(ref):
    """Normalize a verse reference for matching."""
    # Handle various formats: "Genesis 1:1", "Gen 1:1", "Genesis 1:1-5"
    ref = ref.strip()
    
    # Expand book abbreviations
    abbrevs = {
        'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers',
        'deu': 'Deuteronomy', 'jos': 'Joshua', 'jdg': 'Judges', 'rut': 'Ruth',
        '1sa': '1 Samuel', '2sa': '2 Samuel', '1ki': '1 Kings', '2ki': '2 Kings',
        '1ch': '1 Chronicles', '2ch': '2 Chronicles', 'ezr': 'Ezra', 'neh': 'Nehemiah',
        'est': 'Esther', 'job': 'Job', 'psa': 'Psalms', 'pro': 'Proverbs',
        'ecc': 'Ecclesiastes', 'sol': 'Song of Solomon', 'isa': 'Isaiah',
        'jer': 'Jeremiah', 'lam': 'Lamentations', 'eze': 'Ezekiel', 'dan': 'Daniel',
        'hos': 'Hosea', 'joe': 'Joel', 'amo': 'Amos', 'oba': 'Obadiah',
        'jon': 'Jonah', 'mic': 'Micah', 'nah': 'Nahum', 'hab': 'Habakkuk',
        'zep': 'Zephaniah', 'hag': 'Haggai', 'zec': 'Zechariah', 'mal': 'Malachi',
        'mat': 'Matthew', 'mar': 'Mark', 'luk': 'Luke', 'joh': 'John',
        'act': 'Acts', 'rom': 'Romans', '1co': '1 Corinthians', '2co': '2 Corinthians',
        'gal': 'Galatians', 'eph': 'Ephesians', 'phi': 'Philippians', 'col': 'Colossians',
        '1th': '1 Thessalonians', '2th': '2 Thessalonians', '1ti': '1 Timothy',
        '2ti': '2 Timothy', 'tit': 'Titus', 'phm': 'Philemon', 'heb': 'Hebrews',
        'jam': 'James', '1pe': '1 Peter', '2pe': '2 Peter', '1jo': '1 John',
        '2jo': '2 John', '3jo': '3 John', 'jud': 'Jude', 'rev': 'Revelation'
    }
    
    parts = ref.split()
    if parts and parts[0].lower() in abbrevs:
        parts[0] = abbrevs[parts[0].lower()]
        ref = ' '.join(parts)
    
    return ref

def parse_verse_range(ref):
    """Parse a verse reference that may include a range."""
    # Handle "Genesis 5:25-27" -> ["Genesis 5:25", "Genesis 5:26", "Genesis 5:27"]
    match = re.match(r'(.+?\s+\d+):(\d+)(?:-(\d+))?', ref)
    if not match:
        return [ref]
    
    book_chapter = match.group(1) + ":"
    start_verse = int(match.group(2))
    end_verse = int(match.group(3)) if match.group(3) else start_verse
    
    return [f"{book_chapter}{v}" for v in range(start_verse, end_verse + 1)]

def build_comprehensive_index(events_data, date_refs, proposals):
    """Build a comprehensive index mapping verses to events/durations."""
    index = {}
    
    # Process existing events
    for event in events_data.get('events', []):
        for src in event.get('sources', []):
            if src.get('type') == 'scripture':
                ref = src.get('ref', '')
                verses = parse_verse_range(ref)
                
                for verse in verses:
                    if verse not in index:
                        index[verse] = {
                            'events': [],
                            'durations': [],
                            'date_type': None,
                            'resolution': 'resolved',
                            'can_link_timeline': True,
                            'can_link_calendar': False,
                        }
                    
                    index[verse]['events'].append({
                        'id': event['id'],
                        'title': event['title'],
                        'type': event.get('type'),
                    })
                    
                    # Check if we can link to calendar
                    if event.get('start', {}).get('lunar'):
                        index[verse]['can_link_calendar'] = True
    
    # Process existing durations
    for duration in events_data.get('durations', []):
        src = duration.get('source', {})
        if src.get('type') == 'scripture':
            ref = src.get('ref', '')
            verses = parse_verse_range(ref)
            
            for verse in verses:
                if verse not in index:
                    index[verse] = {
                        'events': [],
                        'durations': [],
                        'date_type': None,
                        'resolution': 'partial',
                        'can_link_timeline': True,
                        'can_link_calendar': False,
                    }
                
                index[verse]['durations'].append({
                    'id': duration['id'],
                    'title': duration['title'],
                })
    
    # Add date reference info
    for ref in date_refs.get('references', []):
        verse = ref['verse']
        
        if verse not in index:
            index[verse] = {
                'events': [],
                'durations': [],
                'date_type': None,
                'resolution': 'unresolved',
                'can_link_timeline': False,
                'can_link_calendar': False,
            }
        
        # Set date type (prioritize more specific types)
        type_priority = {
            'month_name': 10,
            'ordinal_month': 9,
            'day_of_month': 8,
            'reign_year': 7,
            'year_of': 6,
            'begat_age': 5,
            'age': 4,
            'lifespan': 4,
            'feast': 3,
            'sabbath': 2,
            'duration_years': 1,
            'duration_months': 1,
            'duration_days': 1,
        }
        
        current_priority = type_priority.get(index[verse].get('date_type'), 0)
        new_priority = type_priority.get(ref['type'], 0)
        
        if new_priority > current_priority:
            index[verse]['date_type'] = ref['type']
    
    # Add proposed events info
    for proposal in proposals.get('proposed_events', []):
        for src in proposal.get('sources', []):
            ref = src.get('ref', '')
            if ref in index:
                index[ref]['proposed_event'] = proposal['id']
                index[ref]['resolution'] = 'proposed'
    
    return index

def create_link_info(index, events_data):
    """Create link information for each verse."""
    links = {}
    
    for verse, info in index.items():
        link_data = {
            'verse': verse,
            'has_timeline_link': info['can_link_timeline'],
            'has_calendar_link': info['can_link_calendar'],
            'timeline_target': None,
            'calendar_target': None,
        }
        
        # Set timeline target
        if info['events']:
            link_data['timeline_target'] = {
                'type': 'event',
                'id': info['events'][0]['id'],
                'title': info['events'][0]['title'],
            }
        elif info['durations']:
            link_data['timeline_target'] = {
                'type': 'duration',
                'id': info['durations'][0]['id'],
                'title': info['durations'][0]['title'],
            }
        
        # Set calendar target (if we have lunar date info)
        if info['can_link_calendar'] and info['events']:
            event_id = info['events'][0]['id']
            event = next((e for e in events_data.get('events', []) if e['id'] == event_id), None)
            if event and event.get('start', {}).get('lunar'):
                lunar = event['start']['lunar']
                link_data['calendar_target'] = {
                    'year': lunar.get('year'),
                    'month': lunar.get('month'),
                    'day': lunar.get('day'),
                }
        
        links[verse] = link_data
    
    return links

def generate_statistics(index, links):
    """Generate statistics about the index."""
    stats = {
        'total_verses_with_date_refs': len(index),
        'verses_with_timeline_links': sum(1 for v in links.values() if v['has_timeline_link']),
        'verses_with_calendar_links': sum(1 for v in links.values() if v['has_calendar_link']),
        'by_resolution': defaultdict(int),
        'by_date_type': defaultdict(int),
        'by_book': defaultdict(int),
    }
    
    for verse, info in index.items():
        stats['by_resolution'][info['resolution']] += 1
        if info['date_type']:
            stats['by_date_type'][info['date_type']] += 1
        
        book = verse.split()[0] if verse else 'Unknown'
        stats['by_book'][book] += 1
    
    stats['by_resolution'] = dict(stats['by_resolution'])
    stats['by_date_type'] = dict(stats['by_date_type'])
    stats['by_book'] = dict(stats['by_book'])
    
    return stats

def main():
    print("Loading data...")
    events_data, date_refs, proposals = load_data()
    
    print("Building comprehensive index...")
    index = build_comprehensive_index(events_data, date_refs, proposals)
    print(f"  Indexed {len(index)} verses")
    
    print("Creating link information...")
    links = create_link_info(index, events_data)
    
    print("Generating statistics...")
    stats = generate_statistics(index, links)
    
    # Compile output
    output = {
        'meta': {
            'description': 'Index mapping Bible verses to timeline events and calendar dates',
            'version': '1.0',
            'total_verses': len(index),
        },
        'statistics': stats,
        'index': index,
        'links': links,
    }
    
    # Save output
    output_file = '/Users/dlarimer/timetested/http/data/verse-event-index.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved to {output_file}")
    
    # Print statistics
    print("\n=== INDEX STATISTICS ===")
    print(f"Total verses with date references: {stats['total_verses_with_date_refs']}")
    print(f"Verses with timeline links: {stats['verses_with_timeline_links']}")
    print(f"Verses with calendar links: {stats['verses_with_calendar_links']}")
    
    print("\nBy Resolution Status:")
    for status, count in sorted(stats['by_resolution'].items(), key=lambda x: -x[1]):
        print(f"  {status}: {count}")
    
    print("\nBy Date Type (top 10):")
    for dtype, count in sorted(stats['by_date_type'].items(), key=lambda x: -x[1])[:10]:
        print(f"  {dtype}: {count}")
    
    print("\nBy Book (top 15):")
    for book, count in sorted(stats['by_book'].items(), key=lambda x: -x[1])[:15]:
        print(f"  {book}: {count}")
    
    return output

if __name__ == '__main__':
    main()
