#!/usr/bin/env python3
"""
Convert LXX Septuagint HTML files to the same format as KJV.txt

Format:
LXX
Updated Brenton English Septuagint
Genesis 1:1	In the beginning God made the heaven and the earth.
Genesis 1:2	But the earth was unsightly and unfurnished...
"""

import os
import re
from pathlib import Path
from html.parser import HTMLParser

# Book code to full name mapping based on index.htm
BOOK_MAP = {
    # Old Testament (canonical)
    'GEN': 'Genesis',
    'EXO': 'Exodus', 
    'LEV': 'Leviticus',
    'NUM': 'Numbers',
    'DEU': 'Deuteronomy',
    'JOS': 'Joshua',
    'JDG': 'Judges',
    'RUT': 'Ruth',
    '1SA': '1 Samuel',  # Kings I in LXX
    '2SA': '2 Samuel',  # Kings II in LXX
    '1KI': '1 Kings',   # Kings III in LXX
    '2KI': '2 Kings',   # Kings IV in LXX
    '1CH': '1 Chronicles',
    '2CH': '2 Chronicles',
    'EZR': 'Ezra',      # Ezra and Nehemiah combined in source
    'NEH': 'Nehemiah',
    'JOB': 'Job',
    'PSA': 'Psalms',
    'PRO': 'Proverbs',
    'ECC': 'Ecclesiastes',
    'SNG': 'Song of Solomon',
    'ISA': 'Isaiah',
    'JER': 'Jeremiah',
    'LAM': 'Lamentations',
    'EZK': 'Ezekiel',
    'DAN': 'Daniel',
    'HOS': 'Hosea',
    'JOL': 'Joel',
    'AMO': 'Amos',
    'OBA': 'Obadiah',
    'JON': 'Jonah',
    'MIC': 'Micah',
    'NAM': 'Nahum',
    'HAB': 'Habakkuk',
    'ZEP': 'Zephaniah',
    'HAG': 'Haggai',
    'ZEC': 'Zechariah',
    'MAL': 'Malachi',
    # Apocrypha/Deuterocanonical
    'TOB': 'Tobit',
    'JDT': 'Judith',
    'ESG': 'Esther (Greek)',
    'DAG': 'Daniel (Greek)',
    'WIS': 'Wisdom',
    'SIR': 'Sirach',
    'BAR': 'Baruch',
    'LJE': 'Epistle of Jeremiah',
    'SUS': 'Susanna',
    'BEL': 'Bel and the Dragon',
    '1MA': '1 Maccabees',
    '2MA': '2 Maccabees',
    '1ES': '1 Esdras',
    'MAN': 'Prayer of Manasseh',
    '3MA': '3 Maccabees',
    '4MA': '4 Maccabees',
    # Special
    'INT': 'Introduction',
}

# Book order for proper sorting
BOOK_ORDER = [
    'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
    '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 
    'JOB', 'PSA', 'PRO', 'ECC', 'SNG',
    'ISA', 'JER', 'LAM', 'EZK',
    'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
    # Apocrypha
    'TOB', 'JDT', 'ESG', 'DAG', 'WIS', 'SIR', 'BAR', 'LJE', 'SUS', 'BEL',
    '1MA', '2MA', '1ES', 'MAN', '3MA', '4MA',
]


class HTMLTextExtractor(HTMLParser):
    """Extract text from HTML, handling verse spans specially."""
    
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_verse_span = False
        self.current_verse = None
        self.verses = {}  # verse_num -> text
        self.current_text = []
        self.skip_content = False
        
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        
        # Skip navigation and footer content
        if tag == 'ul' and attrs_dict.get('class') == 'tnav':
            self.skip_content = True
        elif tag == 'div' and attrs_dict.get('class') in ('footnote', 'copyright'):
            self.skip_content = True
        
        # Check for verse span
        if tag == 'span' and attrs_dict.get('class') == 'verse':
            # Save previous verse text if exists
            if self.current_verse is not None:
                self.verses[self.current_verse] = ' '.join(self.current_text).strip()
                self.current_text = []
            
            # Extract verse number from id like "V1", "V2", etc.
            verse_id = attrs_dict.get('id', '')
            if verse_id.startswith('V'):
                try:
                    self.current_verse = int(verse_id[1:])
                except ValueError:
                    pass
            self.in_verse_span = True
    
    def handle_endtag(self, tag):
        if tag == 'span' and self.in_verse_span:
            self.in_verse_span = False
        if tag == 'ul':
            self.skip_content = False
        if tag == 'div':
            # Check if we're leaving a footnote/copyright div
            pass
            
    def handle_data(self, data):
        if self.skip_content:
            return
            
        # Skip the verse number text inside verse span
        if self.in_verse_span:
            return
            
        # Add text to current verse
        if self.current_verse is not None:
            # Clean up the text
            text = data.strip()
            if text:
                # Replace non-breaking space
                text = text.replace('\u00a0', ' ')
                self.current_text.append(text)
    
    def finalize(self):
        """Save the last verse."""
        if self.current_verse is not None and self.current_text:
            self.verses[self.current_verse] = ' '.join(self.current_text).strip()


def parse_html_file(filepath):
    """Parse an HTML file and extract verses."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    parser = HTMLTextExtractor()
    parser.feed(content)
    parser.finalize()
    
    return parser.verses


def extract_book_chapter(filename):
    """Extract book code and chapter number from filename like 'GEN01.htm' or 'PSA048.htm'."""
    basename = os.path.basename(filename)
    name = basename.replace('.htm', '')
    
    # Match patterns like GEN01, PSA048, 1SA01, etc.
    # Pattern: optional number prefix + 2-3 letters + chapter number
    match = re.match(r'^(\d?[A-Z]{2,3})(\d+)$', name)
    if match:
        book_code = match.group(1)
        chapter = int(match.group(2))
        return book_code, chapter
    
    return None, None


def clean_verse_text(text):
    """Clean up verse text."""
    # Remove extra whitespace
    text = ' '.join(text.split())
    # Remove any remaining HTML entities
    text = text.replace('&nbsp;', ' ')
    return text.strip()


def get_book_sort_key(book_code):
    """Get sort key for book ordering."""
    try:
        return BOOK_ORDER.index(book_code)
    except ValueError:
        return 999  # Put unknown books at the end


def main():
    html_dir = Path('/Users/dlarimer/timetested/englxxup_html')
    output_file = Path('/Users/dlarimer/timetested/http/lxx.txt')
    
    # Collect all verses by book and chapter
    all_verses = {}  # (book_code, chapter) -> {verse_num: text}
    
    # Find all chapter files (exclude index files like GEN.htm, TOB.htm)
    htm_files = list(html_dir.glob('*.htm'))
    
    chapter_files = []
    for f in htm_files:
        book_code, chapter = extract_book_chapter(f.name)
        if book_code and chapter:
            chapter_files.append((f, book_code, chapter))
    
    print(f"Found {len(chapter_files)} chapter files to process")
    
    # Process each file
    for filepath, book_code, chapter in sorted(chapter_files, key=lambda x: (get_book_sort_key(x[1]), x[2])):
        if book_code == 'INT':  # Skip introduction
            continue
            
        verses = parse_html_file(filepath)
        if verses:
            all_verses[(book_code, chapter)] = verses
            print(f"  {filepath.name}: {len(verses)} verses")
    
    # Write output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('LXX\n')
        f.write('Updated Brenton English Septuagint\n')
        
        # Sort by book order, then chapter
        for (book_code, chapter), verses in sorted(
            all_verses.items(), 
            key=lambda x: (get_book_sort_key(x[0][0]), x[0][1])
        ):
            book_name = BOOK_MAP.get(book_code, book_code)
            
            # Sort verses by number
            for verse_num in sorted(verses.keys()):
                text = clean_verse_text(verses[verse_num])
                if text:
                    f.write(f'{book_name} {chapter}:{verse_num}\t{text}\n')
    
    print(f"\nOutput written to {output_file}")
    
    # Count total verses
    total = sum(len(v) for v in all_verses.values())
    print(f"Total verses: {total}")


if __name__ == '__main__':
    main()
