#!/usr/bin/env python3
"""Copyright audit: count verses quoted per Bible translation in each book.

Counts BLOCK quotes ([quote.scripture, REF ...]) at full verse counts (ranges
resolved against the KJV versification) and INLINE quotes (__"..."__ followed
by a parenthetical scripture ref) as one verse per cited verse — publishers'
gratis-use policies count partial verses as verses, so this over-counts
rather than under-counts.

Version resolution:
  MEAT (books/symbolic-language): unlabeled = KJV (house style names every
    exception in the citation).
  TTT (books/time-tested-tradition): unlabeled quotes are text-matched
    against the public-domain texts in bibles/ (KJV, AKJV, ASV, JPS, Darby,
    DRB, Smith's, Brenton LXX). Non-matches = UNIDENTIFIED-MODERN (NKJV /
    ESV / AMP / NASB / NLT per the book's stated preference order) and are
    listed for the author's labeling pass.

Usage: python3 scripts/translation-audit.py books/symbolic-language
       python3 scripts/translation-audit.py books/time-tested-tradition
Writes <bookdir>/translation-audit.md
"""
import glob
import os
import re
import sys
from collections import defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIBLES = os.path.join(REPO, 'bibles')

VERSION_TOKENS = ['NKJV', 'ESV', 'AMP', 'ASV', 'YLT', 'NASB', 'NIV', 'NLT',
                  'KJV', 'JPS', 'LXX', 'Brenton', 'Darby', 'DRB', 'WEB',
                  'BSB', 'BLB']
OWN_RENDERING = re.compile(r'rendered|hearing|consonants|letters|Hebrew(?! \d)', re.I)

BOOK_ALIASES = {
    'psalm': 'Psalms', 'song of solomon': 'Song of Solomon', 'song': 'Song of Solomon',
    'revelations': 'Revelation',
}

def load_versification():
    """{(book, chapter): max_verse} and canonical book names from kjv_strongs."""
    vmax, books = {}, set()
    with open(os.path.join(BIBLES, 'kjv_strongs.txt')) as f:
        for line in f:
            m = re.match(r'^([1-3]? ?[A-Za-z ]+?) (\d+):(\d+)\t', line)
            if not m:
                continue
            b, c, v = m.group(1), int(m.group(2)), int(m.group(3))
            books.add(b)
            vmax[(b, c)] = max(vmax.get((b, c), 0), v)
    return vmax, books

VMAX, CANON = load_versification()

def canon_book(name):
    name = name.strip()
    if name in CANON:
        return name
    low = name.lower()
    if low in BOOK_ALIASES:
        return BOOK_ALIASES[low]
    for b in CANON:  # prefix match (e.g. "1 Cor" from inline refs is not used; be strict)
        if b.lower() == low:
            return b
    return None

REF_RE = re.compile(r'([1-3]? ?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+(?:[-–]\d+(?::\d+)?)?'
                    r'(?:,\s*\d+(?:[-–]\d+)?)*)')

def count_ref_verses(book, chap, verses_part):
    """Count verses in '12', '12-15', '2-3', '17, 19', '5-6, 10', '35:5-36:2'."""
    total = 0
    chap = int(chap)
    for piece in verses_part.split(','):
        piece = piece.strip()
        m = re.match(r'^(\d+)(?:[-–](?:(\d+):)?(\d+))?$', piece)
        if not m:
            continue
        v1 = int(m.group(1))
        if m.group(3) is None:
            total += 1
        elif m.group(2) is None:                     # same-chapter range
            total += max(1, int(m.group(3)) - v1 + 1)
        else:                                        # cross-chapter range
            c2, v2 = int(m.group(2)), int(m.group(3))
            n = (VMAX.get((book, chap), v1) - v1 + 1)
            for c in range(chap + 1, c2):
                n += VMAX.get((book, c), 0)
            n += v2
            total += n
    return total

def parse_citation_refs(cit):
    """All scripture refs in a citation string -> [(book, chap, verses_str)]."""
    out = []
    for m in REF_RE.finditer(cit):
        b = canon_book(m.group(1))
        if b:
            out.append((b, m.group(2), m.group(3)))
    return out

def citation_version(cit, default):
    for tok in VERSION_TOKENS:
        if re.search(r'\b' + tok + r'\b', cit):
            return tok
    if OWN_RENDERING.search(cit):
        return 'own-rendering'
    return default

def normalize(text):
    text = re.sub(r'sym:sym-[a-z0-9-]+\[([^\]]*)\]', r'\1', text)
    text = re.sub(r'footnote:[a-z0-9]*\[[^\]]*\]', '', text)
    text = re.sub(r'[_*#]|\{[^}]*\}|\[[^\]]*\]|\([^)]*\)', ' ', text)
    text = re.sub(r'[^a-z0-9 ]', ' ', text.lower())
    return re.sub(r'\s+', ' ', text).strip()

def load_pd_texts():
    """{version: {(book, chap, verse): normalized_text}} for local PD texts."""
    texts = {}
    for ver, fname in [('KJV', 'kjv_strongs.txt'), ('AKJV', 'akjv_strongs.txt'),
                       ('ASV', 'asv_strongs.txt'), ('JPS', 'jps.txt'),
                       ('Darby', 'dbt.txt'), ('DRB', 'drb.txt'),
                       ('Smith', 'slt.txt'), ('LXX-Brenton', 'lxx.txt')]:
        path = os.path.join(BIBLES, fname)
        if not os.path.exists(path):
            continue
        d = {}
        with open(path) as f:
            for line in f:
                m = re.match(r'^([1-3]? ?[A-Za-z ]+?) (\d+):(\d+)\t(.*)', line)
                if m:
                    d[(m.group(1), int(m.group(2)), int(m.group(3)))] = normalize(m.group(4))
        texts[ver] = d
    return texts

def similarity(a, b):
    """Word-level containment of the shorter in the longer."""
    wa, wb = a.split(), b.split()
    if not wa or not wb:
        return 0.0
    sa, sb = set(wa), set(wb)
    return len(sa & sb) / min(len(sa), len(sb))

def identify_version(body, refs, pd_texts):
    """Best PD match over the quote's first ref, else None."""
    norm = normalize(body)
    if not norm:
        return None, 0.0
    best, score = None, 0.0
    for ver, d in pd_texts.items():
        joined = []
        for (b, c, vstr) in refs[:1]:
            c = int(c)
            first = int(re.match(r'\d+', vstr).group(0))
            m = re.match(r'^(\d+)[-–](\d+)$', vstr.split(',')[0].strip())
            last = int(m.group(2)) if m else first
            for v in range(first, min(last, first + 6) + 1):
                t = d.get((b, c, v))
                if t:
                    joined.append(t)
        if not joined:
            continue
        s = similarity(norm, ' '.join(joined))
        if s > score:
            best, score = ver, s
    return best, score

def audit(book_dir):
    is_meat = 'symbolic-language' in book_dir
    default = 'KJV' if is_meat else 'UNLABELED'
    pd_texts = None if is_meat else load_pd_texts()

    block_verses = defaultdict(int)
    block_counts = defaultdict(int)
    inline_verses = defaultdict(int)
    unidentified = []

    # build files only (NN-*.adoc / NNx-*.adoc) — drafts and notes excluded
    for path in sorted(glob.glob(os.path.join(book_dir, '[0-9]*.adoc'))):
        src = open(path).read()
        body_lines = src.split('\n')
        fname = os.path.basename(path)

        # --- block quotes
        for m in re.finditer(r'^\[quote\.scripture, ?([^\]]+)\]\n____\n(.*?)\n____',
                             src, re.M | re.S):
            cit, body = m.group(1), m.group(2)
            refs = parse_citation_refs(cit)
            if not refs:
                continue
            ver = citation_version(cit, default)
            n = sum(count_ref_verses(b, c, v) for b, c, v in refs)
            if ver == 'UNLABELED':
                ver, score = identify_version(body, refs, pd_texts)
                if ver is None or score < 0.75:
                    ver = 'UNIDENTIFIED-MODERN'
                    unidentified.append((fname, cit, ' '.join(normalize(body).split()[:8])))
            block_verses[ver] += n
            block_counts[ver] += 1

        # --- inline quotes: quoted span followed by parenthetical ref
        for m in re.finditer(r'__[“"][^_]{8,}?[”"]__\s*\(([^)]+)\)', src):
            cit = m.group(1)
            refs = parse_citation_refs(cit)
            if not refs:
                continue
            ver = citation_version(cit, 'KJV' if is_meat else 'UNLABELED-inline')
            n = sum(count_ref_verses(b, c, v) for b, c, v in refs)
            inline_verses[ver] += n

    return block_counts, block_verses, inline_verses, unidentified

# (status, gratis verse limit or None) — policies archived in books/copyright-policies/
LIMITS = {
    'KJV': ('public domain (US)', None), 'AKJV': ('public domain', None),
    'ASV': ('public domain', None), 'YLT': ('public domain', None),
    'JPS': ('public domain (1917)', None), 'Darby': ('public domain', None),
    'DRB': ('public domain', None), 'Smith': ('public domain', None),
    'LXX': ('public domain (Brenton 1851)', None), 'LXX-Brenton': ('public domain (Brenton 1851)', None),
    'BSB': ('public domain (CC0, Bible Hub)', None), 'BLB': ('public domain (CC0, Bible Hub)', None),
    'own-rendering': ('author’s own rendering', None),
    'Hebrew': ('author’s rendering of Hebrew Gospels', None),
    'NKJV': ('© Thomas Nelson', 500),
    'ESV': ('© Crossway', 500),
    'AMP': ('© Lockman', 1000),
    'NASB': ('© Lockman', 1000),
    'NLT': ('© Tyndale', 500),
    'NIV': ('© Biblica/Zondervan', 500),
}

def main():
    book_dir = os.path.join(REPO, sys.argv[1]) if not os.path.isabs(sys.argv[1]) else sys.argv[1]
    bc, bv, iv, unid = audit(book_dir)
    vers = sorted(set(bv) | set(iv), key=lambda v: -(bv.get(v, 0) + iv.get(v, 0)))
    out = ['# Translation audit — verses quoted per version',
           '',
           f'Generated by scripts/translation-audit.py over `{os.path.relpath(book_dir, REPO)}/*.adoc`.',
           'Block quotes count every verse in the cited range; inline quotes count each',
           'cited verse (partial verses count as verses under publishers’ policies).',
           'Gratis limits and required notices: books/copyright-policies/.',
           '',
           '| version | status | block quotes | verses (blocks) | verses (inline) | total | gratis limit | headroom |',
           '|---|---|---|---|---|---|---|---|']
    for v in vers:
        status, limit = LIMITS.get(v, ('UNKNOWN — identify & label', None))
        tot = bv.get(v, 0) + iv.get(v, 0)
        lim = str(limit) if limit else '—'
        head = (f'{limit - tot} ({"OK" if tot <= limit else "OVER"})') if limit else '—'
        out.append(f'| {v} | {status} | {bc.get(v, 0)} | {bv.get(v, 0)} | {iv.get(v, 0)} | {tot} | {lim} | {head} |')
    if unid:
        out += ['', f'## Unidentified quotes ({len(unid)}) — need version labels', '',
                '| file | citation | opening words |', '|---|---|---|']
        for f, c, w in unid:
            out.append(f'| {f} | {c} | {w}… |')
    dest = os.path.join(book_dir, 'translation-audit.md')
    open(dest, 'w').write('\n'.join(out) + '\n')
    print(f'wrote {dest}')
    for line in out[6:len(vers) + 8]:
        print(line)

if __name__ == '__main__':
    main()
