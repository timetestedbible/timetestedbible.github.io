#!/usr/bin/env python3
"""
Generate proposed events and durations for gaps in biblical chronology.
Creates a structured output for review and potential addition to v2.
"""

import json
import re
from collections import defaultdict

# Known kings and their kingdoms
KNOWN_KINGS = {
    # Judah kings (United Monarchy)
    'david': {'kingdom': 'Israel (United)', 'epoch': 'david'},
    'solomon': {'kingdom': 'Israel (United)', 'epoch': 'solomon'},
    
    # Judah kings (Divided Kingdom)
    'rehoboam': {'kingdom': 'Judah', 'years': 17},
    'abijah': {'kingdom': 'Judah', 'years': 3},
    'abijam': {'kingdom': 'Judah', 'years': 3},  # Same as Abijah
    'asa': {'kingdom': 'Judah', 'years': 41},
    'jehoshaphat': {'kingdom': 'Judah', 'years': 25},
    'jehoram': {'kingdom': 'Judah', 'years': 8},
    'joram': {'kingdom': 'Judah', 'years': 8},  # Same as Jehoram
    'ahaziah': {'kingdom': 'Judah', 'years': 1},
    'athaliah': {'kingdom': 'Judah', 'years': 6},
    'joash': {'kingdom': 'Judah', 'years': 40},
    'amaziah': {'kingdom': 'Judah', 'years': 29},
    'uzziah': {'kingdom': 'Judah', 'years': 52},
    'azariah': {'kingdom': 'Judah', 'years': 52},  # Same as Uzziah
    'jotham': {'kingdom': 'Judah', 'years': 16},
    'ahaz': {'kingdom': 'Judah', 'years': 16},
    'hezekiah': {'kingdom': 'Judah', 'years': 29},
    'manasseh': {'kingdom': 'Judah', 'years': 55},
    'amon': {'kingdom': 'Judah', 'years': 2},
    'josiah': {'kingdom': 'Judah', 'years': 31},
    'jehoahaz': {'kingdom': 'Judah', 'years': 0.25},  # 3 months
    'jehoiakim': {'kingdom': 'Judah', 'years': 11},
    'jehoiachin': {'kingdom': 'Judah', 'years': 0.25},  # 3 months
    'zedekiah': {'kingdom': 'Judah', 'years': 11},
    
    # Israel kings (Northern Kingdom)
    'jeroboam': {'kingdom': 'Israel', 'years': 22},
    'nadab': {'kingdom': 'Israel', 'years': 2},
    'baasha': {'kingdom': 'Israel', 'years': 24},
    'elah': {'kingdom': 'Israel', 'years': 2},
    'zimri': {'kingdom': 'Israel', 'years': 0.02},  # 7 days
    'omri': {'kingdom': 'Israel', 'years': 12},
    'ahab': {'kingdom': 'Israel', 'years': 22},
    'ahaziah': {'kingdom': 'Israel', 'years': 2},
    'jehoram': {'kingdom': 'Israel', 'years': 12},
    'jehu': {'kingdom': 'Israel', 'years': 28},
    'jehoahaz': {'kingdom': 'Israel', 'years': 17},
    'joash': {'kingdom': 'Israel', 'years': 16},
    'jeroboam ii': {'kingdom': 'Israel', 'years': 41},
    'zechariah': {'kingdom': 'Israel', 'years': 0.5},  # 6 months
    'shallum': {'kingdom': 'Israel', 'years': 0.08},  # 1 month
    'menahem': {'kingdom': 'Israel', 'years': 10},
    'pekahiah': {'kingdom': 'Israel', 'years': 2},
    'pekah': {'kingdom': 'Israel', 'years': 20},
    'hoshea': {'kingdom': 'Israel', 'years': 9},
    
    # Foreign kings
    'nebuchadnezzar': {'kingdom': 'Babylon', 'years': 43},
    'nebuchadrezzar': {'kingdom': 'Babylon', 'years': 43},  # Alternate spelling
    'belshazzar': {'kingdom': 'Babylon', 'years': 3},
    'darius': {'kingdom': 'Persia'},
    'cyrus': {'kingdom': 'Persia', 'years': 9},
    'artaxerxes': {'kingdom': 'Persia'},
    'ahasuerus': {'kingdom': 'Persia'},
    'pharaoh': {'kingdom': 'Egypt'},
    'caesar': {'kingdom': 'Rome'},
    'tiberius': {'kingdom': 'Rome', 'years': 23},
    'herod': {'kingdom': 'Judea'},
}

# Number word to integer
NUM_WORDS = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
    'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
    'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18,
    'nineteenth': 19, 'twentieth': 20,
    'one and twentieth': 21, 'two and twentieth': 22, 'three and twentieth': 23,
    'four and twentieth': 24, 'five and twentieth': 25, 'six and twentieth': 26,
    'seven and twentieth': 27, 'eight and twentieth': 28, 'nine and twentieth': 29,
    'thirtieth': 30, 'one and thirtieth': 31, 'two and thirtieth': 32,
    'three and thirtieth': 33, 'four and thirtieth': 34, 'five and thirtieth': 35,
    'six and thirtieth': 36, 'seven and thirtieth': 37, 'eight and thirtieth': 38,
    'nine and thirtieth': 39, 'fortieth': 40, 'one and fortieth': 41,
}

def parse_year_number(year_str):
    """Parse year string to integer."""
    year_str = year_str.lower().strip()
    if year_str in NUM_WORDS:
        return NUM_WORDS[year_str]
    if year_str.isdigit():
        return int(year_str)
    return None

def load_data():
    """Load gap analysis data and existing events."""
    with open('/Users/dlarimer/timetested/http/data/kjv-date-gaps.json') as f:
        gaps = json.load(f)
    
    with open('/Users/dlarimer/timetested/http/historical-events-v2.json') as f:
        events_data = json.load(f)
    
    with open('/Users/dlarimer/timetested/http/data/kjv-date-references.json') as f:
        date_refs = json.load(f)
    
    return gaps, events_data, date_refs

def get_existing_king_events(events_data):
    """Get list of existing king-related events."""
    king_events = {}
    for event in events_data.get('events', []):
        event_id = event['id']
        if '-reign' in event_id:
            king_name = event_id.replace('-reign', '')
            king_events[king_name] = event
    return king_events

def propose_king_epoch(king_name, kingdom):
    """Propose an epoch definition for a king."""
    return {
        'name': f'{king_name.title()} King of {kingdom}',
        'start': {
            'relative': {
                'event': f'{king_name}-reign',
                'offset': {'years': 0}
            }
        },
        'reckoning': 'spring-to-spring' if kingdom == 'Israel' else 'fall-to-fall',
        'notes': f'Regnal epoch for {king_name.title()}'
    }

def propose_reign_event(king_name, kingdom, predecessor=None):
    """Propose a reign event for a king."""
    event_id = f'{king_name}-reign'
    
    # Determine start based on predecessor
    start = {}
    if predecessor:
        start = {
            'relative': {
                'event': f'{predecessor}-reign',
                'offset': {'years': KNOWN_KINGS.get(predecessor, {}).get('years', 0)},
                'direction': 'after'
            }
        }
    
    return {
        'id': event_id,
        'title': f'👑 {king_name.title()} Begins to Reign',
        'type': 'reign',
        'description': f'{king_name.title()} becomes king of {kingdom}.',
        'start': start,
        'certainty': 'medium',
        'sources': [],
        'tags': [king_name, 'reign', kingdom.lower(), 'divided-kingdom', 'chronology-anchor']
    }

def propose_reign_duration(king_name, years):
    """Propose a duration for a king's reign."""
    return {
        'id': f'scripture-{king_name}-reign',
        'title': f'{king_name.title()} Reigned {years} Years',
        'from_event': f'{king_name}-reign',
        'claimed': {'years': years},
        'source': {
            'ref': 'TBD',
            'type': 'scripture'
        },
        'notes': f'Reign duration for {king_name.title()}'
    }

def generate_missing_kings(gaps, events_data):
    """Generate proposals for missing king events."""
    existing_kings = get_existing_king_events(events_data)
    
    # Group missing refs by king
    by_king = defaultdict(list)
    for ref in gaps.get('missing_reign_refs', []):
        king = ref['person'].lower()
        if king in KNOWN_KINGS:
            by_king[king].append(ref)
    
    proposed_events = []
    proposed_durations = []
    proposed_epochs = {}
    
    for king, refs in by_king.items():
        if king not in existing_kings and king in KNOWN_KINGS:
            info = KNOWN_KINGS[king]
            kingdom = info.get('kingdom', 'Unknown')
            years = info.get('years')
            
            # Propose event
            event = propose_reign_event(king, kingdom)
            
            # Add sources from references
            for ref in refs:
                event['sources'].append({
                    'ref': ref['verse'],
                    'type': 'scripture',
                    'quote': ref['text'][:200]
                })
            
            proposed_events.append(event)
            
            # Propose duration if we know the years
            if years:
                duration = propose_reign_duration(king, years)
                proposed_durations.append(duration)
            
            # Propose epoch
            proposed_epochs[king] = propose_king_epoch(king, kingdom)
    
    return proposed_events, proposed_durations, proposed_epochs

def generate_specific_date_events(gaps, events_data):
    """Generate proposals for specific date references."""
    proposed = []
    
    for ref in gaps.get('missing_specific_dates', []):
        verse = ref['verse']
        month = ref.get('month')
        day = ref.get('day')
        year = ref.get('year')
        text = ref.get('text', '')
        
        # Create a proposed event
        event = {
            'verse': verse,
            'proposed_lunar': {
                'month': month,
                'day': day
            },
            'year_context': year,
            'text_snippet': text[:150],
            'needs_review': True,
            'resolution_status': 'unresolved'
        }
        
        # Try to identify what type of event this is
        text_lower = text.lower()
        if 'passover' in text_lower:
            event['suggested_type'] = 'feast'
            event['suggested_id'] = f'passover-{verse.replace(" ", "-").replace(":", "-")}'
        elif 'tabernacle' in text_lower:
            event['suggested_type'] = 'feast'
            event['suggested_id'] = f'tabernacles-{verse.replace(" ", "-").replace(":", "-")}'
        elif 'temple' in text_lower:
            event['suggested_type'] = 'construction'
        elif 'battle' in text_lower or 'war' in text_lower:
            event['suggested_type'] = 'battle'
        elif 'death' in text_lower or 'died' in text_lower:
            event['suggested_type'] = 'death'
        else:
            event['suggested_type'] = 'biblical-event'
        
        proposed.append(event)
    
    return proposed

def build_verse_index(date_refs, events_data):
    """Build a comprehensive verse-to-event/duration index."""
    index = {}
    
    # Index existing events
    for event in events_data.get('events', []):
        for src in event.get('sources', []):
            if src.get('type') == 'scripture':
                ref = src.get('ref', '')
                if ref not in index:
                    index[ref] = {'events': [], 'durations': [], 'date_refs': []}
                index[ref]['events'].append({
                    'id': event['id'],
                    'title': event['title'],
                    'type': event.get('type')
                })
    
    # Index existing durations
    for duration in events_data.get('durations', []):
        src = duration.get('source', {})
        if src.get('type') == 'scripture':
            ref = src.get('ref', '')
            if ref not in index:
                index[ref] = {'events': [], 'durations': [], 'date_refs': []}
            index[ref]['durations'].append({
                'id': duration['id'],
                'title': duration['title']
            })
    
    # Index date references
    for ref in date_refs.get('references', []):
        verse = ref['verse']
        if verse not in index:
            index[verse] = {'events': [], 'durations': [], 'date_refs': []}
        index[verse]['date_refs'].append({
            'type': ref['type'],
            'match': ref['match'],
            'value': ref.get('value')
        })
    
    return index

def analyze_resolvability(index, events_data):
    """Analyze which date references can be resolved."""
    resolvable = []
    unresolvable = []
    
    # Get list of existing epochs
    epochs = set(events_data.get('epochs', {}).keys())
    
    # Get list of existing events
    event_ids = set(e['id'] for e in events_data.get('events', []))
    
    for verse, data in index.items():
        has_event = len(data['events']) > 0
        has_duration = len(data['durations']) > 0
        date_refs = data['date_refs']
        
        for date_ref in date_refs:
            ref_type = date_ref['type']
            
            # Check resolvability
            if has_event or has_duration:
                resolvable.append({
                    'verse': verse,
                    'type': ref_type,
                    'linked_to': data['events'] + data['durations']
                })
            elif ref_type in ['sabbath', 'new_moon', 'feast', 'jubilee']:
                # These can be resolved by pattern
                resolvable.append({
                    'verse': verse,
                    'type': ref_type,
                    'resolution': 'pattern-based'
                })
            else:
                unresolvable.append({
                    'verse': verse,
                    'type': ref_type,
                    'match': date_ref['match'],
                    'reason': 'no linked event or duration'
                })
    
    return resolvable, unresolvable

def main():
    print("Loading data...")
    gaps, events_data, date_refs = load_data()
    
    print("\nGenerating proposals for missing kings...")
    proposed_events, proposed_durations, proposed_epochs = generate_missing_kings(gaps, events_data)
    
    print(f"  Proposed {len(proposed_events)} new king events")
    print(f"  Proposed {len(proposed_durations)} new durations")
    print(f"  Proposed {len(proposed_epochs)} new epochs")
    
    print("\nGenerating proposals for specific dates...")
    specific_date_proposals = generate_specific_date_events(gaps, events_data)
    print(f"  Proposed {len(specific_date_proposals)} specific date events")
    
    print("\nBuilding verse index...")
    verse_index = build_verse_index(date_refs, events_data)
    print(f"  Indexed {len(verse_index)} verses")
    
    print("\nAnalyzing resolvability...")
    resolvable, unresolvable = analyze_resolvability(verse_index, events_data)
    print(f"  Resolvable: {len(resolvable)}")
    print(f"  Unresolvable: {len(unresolvable)}")
    
    # Compile output
    output = {
        'summary': {
            'proposed_events': len(proposed_events),
            'proposed_durations': len(proposed_durations),
            'proposed_epochs': len(proposed_epochs),
            'specific_date_proposals': len(specific_date_proposals),
            'indexed_verses': len(verse_index),
            'resolvable_refs': len(resolvable),
            'unresolvable_refs': len(unresolvable),
        },
        'proposed_events': proposed_events,
        'proposed_durations': proposed_durations,
        'proposed_epochs': proposed_epochs,
        'specific_date_proposals': specific_date_proposals,
        'verse_index': verse_index,
        'resolvable': resolvable[:100],  # Sample
        'unresolvable': unresolvable[:100],  # Sample
    }
    
    # Save output
    output_file = '/Users/dlarimer/timetested/http/data/kjv-proposed-additions.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nSaved proposals to {output_file}")
    
    # Print proposed events
    print("\n=== PROPOSED KING EVENTS ===")
    for event in proposed_events[:10]:
        print(f"  {event['id']}: {event['title']}")
        if event['sources']:
            print(f"    First ref: {event['sources'][0]['ref']}")
    
    # Print some unresolvable
    print("\n=== SAMPLE UNRESOLVABLE (need events) ===")
    by_type = defaultdict(list)
    for u in unresolvable:
        by_type[u['type']].append(u)
    
    for ref_type, refs in list(by_type.items())[:5]:
        print(f"  {ref_type}: {len(refs)} unresolved")
        for ref in refs[:2]:
            print(f"    - {ref['verse']}: {ref['match']}")
    
    return output

if __name__ == '__main__':
    main()
