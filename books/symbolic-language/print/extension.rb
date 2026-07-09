# Asciidoctor extension for the print build of "The Bible's Symbolic Language".
#
#   * QuoteCitationTreeprocessor — moves a quote's attribution into a right-aligned
#     citation paragraph INSIDE the quote, and marks the quote unbreakable.
#   * TradePdfConverter — PDF converter overrides:
#       - quote paragraphs are not first-line indented
#       - chapter epigraphs render above the chapter title
#       - PAGE-BOTTOM FOOTNOTES (see below)
#
# Page-bottom footnotes (dynamic, per-page MEASURED reserve)
# -----------------------------------------------------------
# asciidoctor-pdf renders footnotes as endnotes at chapter end. We want them at
# the foot of the page that carries the marker, WITHOUT making footnote-free
# pages pay for the space. asciidoctor regenerates the margin box from the page
# margin, so the live lever that sticks is set_page_margin (not a height hack);
# and the footer is drawn from the page EDGE, so shrinking a page's content area
# does not move the page number.
#
# The reserve is MEASURED per page, not fixed: each detected note's typeset
# height is computed (footnotes theme font, content width) and accumulated, so a
# page carrying two long notes gets a band big enough for both. (A fixed band
# overflowed: the spillover was drawn ON TOP of body text on following pages.)
#
# build.rb drives a short converging loop over this converter:
#   - $fn_reserve_pages : Hash page => band points to reserve on this pass
#   - $fn_flush         : whether to draw the notes (only the final pass)
#   - $fn_detected_pages: OUT — Hash page => band points actually needed
# It re-renders until detected == reserved (a fixed point), then does one final
# pass that draws the notes.

require 'asciidoctor'
require 'asciidoctor/extensions'
require 'asciidoctor-pdf'
require 'json'

class TradePdfConverter < Asciidoctor::PDF::Converter
  register_for 'pdf'

  # --- Scripture index -------------------------------------------------------
  # Every render pass collects the verse citations it inks — keyed by canonical
  # reference, valued by the PHYSICAL page numbers they land on — and the
  # generated "Scripture Index" chapter (appended by build.rb, rendered after
  # the glossary) sets them as printed folios. Because the index is the last
  # chapter, every body page number is already final when it renders; the
  # catalog is per-converter-instance state (init_pdf), so each pass of the
  # footnote loop starts clean and only the final flush pass is kept.
  SX_CANON = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation',
    # Cited extra-canonical books index after Revelation.
    '1 Enoch', '2 Esdras',
  ].freeze

  SX_ALIASES = {
    'Gen' => 'Genesis', 'Ex' => 'Exodus', 'Exod' => 'Exodus', 'Lev' => 'Leviticus',
    'Num' => 'Numbers', 'Deut' => 'Deuteronomy', 'Dt' => 'Deuteronomy', 'Josh' => 'Joshua',
    'Judg' => 'Judges', 'Jdg' => 'Judges', '1 Sam' => '1 Samuel', '2 Sam' => '2 Samuel',
    '1 Kgs' => '1 Kings', '2 Kgs' => '2 Kings', '1 Chr' => '1 Chronicles', '1 Chron' => '1 Chronicles',
    '2 Chr' => '2 Chronicles', '2 Chron' => '2 Chronicles', 'Neh' => 'Nehemiah', 'Esth' => 'Esther',
    'Ps' => 'Psalms', 'Pss' => 'Psalms', 'Psalm' => 'Psalms', 'Prov' => 'Proverbs',
    'Eccl' => 'Ecclesiastes', 'Ecc' => 'Ecclesiastes', 'Song of Songs' => 'Song of Solomon',
    'Song' => 'Song of Solomon', 'Cant' => 'Song of Solomon', 'Isa' => 'Isaiah', 'Jer' => 'Jeremiah',
    'Lam' => 'Lamentations', 'Ezek' => 'Ezekiel', 'Dan' => 'Daniel', 'Hos' => 'Hosea',
    'Obad' => 'Obadiah', 'Mic' => 'Micah', 'Nah' => 'Nahum', 'Hab' => 'Habakkuk',
    'Zeph' => 'Zephaniah', 'Hag' => 'Haggai', 'Zech' => 'Zechariah', 'Mal' => 'Malachi',
    'Matt' => 'Matthew', 'Mt' => 'Matthew', 'Mk' => 'Mark', 'Lk' => 'Luke', 'Jn' => 'John',
    'Rom' => 'Romans', '1 Cor' => '1 Corinthians', '2 Cor' => '2 Corinthians', 'Gal' => 'Galatians',
    'Eph' => 'Ephesians', 'Phil' => 'Philippians', 'Col' => 'Colossians',
    '1 Thess' => '1 Thessalonians', '2 Thess' => '2 Thessalonians', '1 Tim' => '1 Timothy',
    '2 Tim' => '2 Timothy', 'Philem' => 'Philemon', 'Phlm' => 'Philemon', 'Heb' => 'Hebrews',
    'Jas' => 'James', '1 Pet' => '1 Peter', '2 Pet' => '2 Peter', 'Rev' => 'Revelation',
    'Enoch' => '1 Enoch',
  }.freeze

  SX_BOOK_NAMES = (SX_CANON + SX_ALIASES.keys).sort_by { |n| -n.length }.map { |n| Regexp.escape n }.join '|'
  # One citation = Book C:V[-V[:V]] [, V[-V]]* [; C:V ...]* — semicolon segments
  # inherit the book ("Proverbs 3:15; 8:11"), comma items inherit book+chapter
  # ("Matthew 13:44, 38"). A comma item is accepted only when followed by
  # punctuation or end of line, so "(Ps 23:1, 2 Kings 3:4)" cannot swallow the
  # "2" of "2 Kings" as a verse. Bare refs with no book name — "(31:18)" — are
  # never matched (documented limitation).
  SX_VLIST = /(?:\s*,\s*\d{1,3}(?:[-–]\d{1,3})?(?=\s*[^\w\s]|\s*$))*/
  SX_CITE_RX = /\b(#{SX_BOOK_NAMES})\.?\s+(\d{1,3}:\d{1,3}(?:[-–]\d{1,3}(?::\d{1,3})?)?#{SX_VLIST}(?:\s*;\s*\d{1,3}:\d{1,3}(?:[-–]\d{1,3}(?::\d{1,3})?)?#{SX_VLIST})*)/
  SX_VERSE_RX = /\A(\d{1,3}):(\d{1,3}(?:[-–]\d{1,3}(?::\d{1,3})?)?)/
  # Single-chapter books are cited verse-only ("Obadiah 16") and would never
  # match SX_CITE_RX's chapter:verse shape; catch them separately and record
  # under chapter 1. The lookahead rejects chapter:verse forms ("Jude 1:6"),
  # which the main regex owns.
  SX_ONECH_BOOKS = ['Obadiah', 'Philemon', 'Jude', '2 John', '3 John'].freeze
  SX_ONECH_NAMES = (SX_ONECH_BOOKS + ['Obad', 'Philem', 'Phlm']).sort_by { |n| -n.length }.map { |n| Regexp.escape n }.join '|'
  SX_ONECH_RX = /\b(#{SX_ONECH_NAMES})\.?\s+(\d{1,3}(?:[-–]\d{1,3})?)(?!:)#{SX_VLIST}/
  SX_EMDASH = '—'

  # quoted: the citation is a block-quote attribution — the verse is quoted in
  # full on that page, so its locator prints BOLD in the index. Bold wins when
  # the same verse is also cited inline on the same page.
  def sx_record book, chap, vspec, page, quoted
    pages = ((@sx_catalog[book] ||= {})[%(#{chap}:#{vspec})] ||= {})
    pages[page] = (pages[page] || false) | quoted
  end

  # Scan a block's source text for citations and record them against the page
  # range the block rendered across. A block that broke across pages attributes
  # each citation by its character offset: `boundaries` (cumulative text
  # fractions at which the block crossed onto each following page, measured
  # from the rendered geometry) when the caller has them, else linear
  # proportion — refs near the top of the text go to the first page, refs near
  # the end to the last (the seeref tail of a glossary entry).
  def sx_scan text, page_from, page_to = page_from, quoted: false, boundaries: nil
    return if !@sx_catalog || !text.is_a?(::String) || text.empty?
    len = text.length
    page_at = lambda do |offset_begin|
      if page_to > page_from
        fo = offset_begin.to_f / len
        if boundaries && !boundaries.empty?
          (page_from + (boundaries.count { |b| fo >= b })).clamp(page_from, page_to)
        else
          (page_from + (fo * (page_to - page_from + 1)).floor).clamp(page_from, page_to)
        end
      else
        page_from
      end
    end
    text.scan SX_CITE_RX do
      m = Regexp.last_match
      page = page_at.call m.begin(0)
      book = SX_ALIASES[m[1]] || m[1]
      m[2].split(/\s*;\s*/).each do |seg|
        next unless seg =~ SX_VERSE_RX
        chap, rest = $1, $'
        sx_record book, chap, ($2.tr '–', '-'), page, quoted
        rest.scan(/,\s*(\d{1,3}(?:[-–]\d{1,3})?)/) { |(v)| sx_record book, chap, (v.tr '–', '-'), page, quoted }
      end
    end
    text.scan SX_ONECH_RX do
      m = Regexp.last_match
      page = page_at.call m.begin(0)
      book = SX_ALIASES[m[1]] || m[1]
      sx_record book, '1', (m[2].tr '–', '-'), page, quoted
      m[0].scan(/,\s*(\d{1,3}(?:[-–]\d{1,3})?)/) { |(v)| sx_record book, '1', (v.tr '–', '-'), page, quoted }
    end
  end

  SX_FOOTNOTE_RX = /footnote:[\w-]*\[(.*?)\]/m

  # Paragraph-level scan with two accuracy refinements over plain sx_scan:
  #   1. footnote macro BODIES are cut out of the offset space (they render as
  #      a superscript marker, not inline text — a long note would skew every
  #      offset after it) and scanned separately at the marker's position (the
  #      note is drawn at the foot of the marker's own page);
  #   2. when the paragraph broke across pages, the crossing points come from
  #      the rendered geometry (points filled on the first page vs the last)
  #      rather than assuming the text splits evenly.
  def sx_scan_paragraph src, start_page, end_page, start_cursor, quoted: false
    return if !@sx_catalog || !src.is_a?(::String) || src.empty?
    stripped = +''
    notes = []
    last = 0
    src.scan SX_FOOTNOTE_RX do
      m = Regexp.last_match
      stripped << (src[last...m.begin(0)] || '')
      notes << [stripped.length, m[1]]
      stripped << '*'
      last = m.end(0)
    end
    stripped << (src[last..] || '')
    boundaries = nil
    if end_page > start_page
      span    = end_page - start_page
      h_first = start_cursor.to_f
      h_last  = bounds.height - cursor
      total   = h_first + h_last + ((span - 1) * bounds.height)
      total   = 1.0 if total <= 0
      cum = h_first
      boundaries = [cum / total]
      (span - 1).times { cum += bounds.height; boundaries << cum / total }
    end
    sx_scan stripped, start_page, end_page, quoted: quoted, boundaries: boundaries
    slen = [stripped.length, 1].max
    notes.each do |pos, body|
      note_page = if boundaries
                    fo = pos.to_f / slen
                    (start_page + (boundaries.count { |b| fo >= b })).clamp(start_page, end_page)
                  else
                    start_page
                  end
      sx_scan body, note_page, note_page, quoted: quoted
    end
  end

  def sx_scan_table node, page_from, page_to
    return unless @sx_catalog
    texts = []
    rows = node.rows
    [rows.head, rows.body, rows.foot].each do |rowset|
      next unless rowset
      rowset.each do |row|
        row.each do |cell|
          texts << begin
            cell.source
          rescue StandardError
            nil
          end
        end
      end
    end
    sx_scan texts.compact.join("\n"), page_from, page_to
  end

  # Physical page -> printed folio offset, from the same source the running
  # footer uses (page-numbering start-at after-toc).
  def sx_folio_offset
    ((defined?(@index) && @index && @index.start_page_number) ? @index.start_page_number : 1) - 1
  end

  # --- Chapter cross-reference page numbers ----------------------------------
  # Derivation footnotes ("Derived in the link:...[Mountain] chapter.") and the
  # glossary's seeref lines ("see link:...[Trees], ch. 35") carry a live
  # internal PDF jump (convert_inline_anchor), but paper needs the folio too.
  # Each pass records every chapter's start folio keyed by its dest anchor
  # ($sx_chapter_folios, promoted at pass end exactly like the $fn_* pattern);
  # the NEXT pass appends ", p. N" after the link (after its " chapter" /
  # ", ch. N" tail when present) wherever a chapter link appears in footnote
  # text or a glossary description. Forward references need the previous pass's
  # map; backward ones use it too, uniformly. Pass 1 has no map and renders
  # without page numbers; the footnote convergence loop re-renders until the
  # layout (and with it the map) reaches a fixed point, so the final flush
  # prints settled folios.
  SX_CHAPLINK_RX = %r{(<a\b[^>]*\banchor="([^"]+)"[^>]*>.*?</a>)( chapters?\b|,\s*ch\.\s*\d+)?}m

  # The maps are stored per RESERVE SET, because passes with different reserves
  # lay out differently: the flush pass must read the map of the most recent
  # pass with an IDENTICAL reserve (the settled layout it reproduces), not
  # whatever pass ran last — the prune-check pass of the oscillation fallback
  # renders a rejected layout, and its folios must not leak into the flush.
  def sx_reserve_key
    ((defined?($fn_reserve_pages) && $fn_reserve_pages) ? $fn_reserve_pages : {}).sort.inspect
  end

  def sx_chapter_folio_map
    @sx_pass_map ||= begin
      maps = (defined?($sx_folio_maps) && $sx_folio_maps) || {}
      maps[sx_reserve_key] || ((defined?($sx_folio_latest) && $sx_folio_latest) || {})
    end
  end

  def sx_append_chapter_pages text
    map = sx_chapter_folio_map
    return text if !map || map.empty? || !text.is_a?(::String) || !(text.include? 'anchor=')
    text.gsub(SX_CHAPLINK_RX) do
      whole, anchor, tail = $1, $2, $3
      (folio = map[anchor]) ? %(#{whole}#{tail}, p. #{folio}) : %(#{whole}#{tail})
    end
  end

  # Catalog (physical pages) -> canonically ordered entries with printed folios:
  # [[book, [["1:16", [[208, false], [214, true]]], ...]], ...] — each locator a
  # [folio, quoted] pair (quoted = block-quoted in full there, printed bold).
  # The folio offset comes from the same source the running footer uses
  # (page-numbering start-at after-toc); citations inked before folio 1
  # (front-matter colophon pages) are dropped.
  def sx_folio_entries
    return [] if !@sx_catalog || @sx_catalog.empty?
    offset = sx_folio_offset
    SX_CANON.filter_map do |book|
      next unless (verses = @sx_catalog[book])
      entries = verses.filter_map do |vd, pages|
        locs = {}
        pages.each do |p, q|
          f = p - offset
          next if f < 1
          locs[f] = (locs[f] || false) | q
        end
        next if locs.empty?
        next unless vd =~ /\A(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?/
        [[$1.to_i, $2.to_i, $3.to_i, ($4 || $2).to_i], vd, locs.sort]
      end
      next if entries.empty?
      [book, entries.sort_by { |key, _, _| key }.map { |_, vd, locs| [vd, locs] }]
    end
  end

  FN_RULE_LEN   = 144    # 2in separator rule
  FN_RULE_WIDTH = 0.5
  FN_RULE_GAP   = 5      # gap below the rule, above the first note
  FN_BAND_PAD   = 9      # rule + breathing room added once per footnote page

  # Band points a page must reserve for its notes so far (measured), + padding.
  def fn_band_height pts
    pts + FN_BAND_PAD
  end

  # Measured height of one note at footnotes size across the content width.
  # Measure the DISPLAY text (chapter-page suffixes appended) so the reserved
  # band always matches what the flush inks.
  def fn_note_height fn
    spacing = @theme.footnotes_item_spacing || 2
    h = nil
    theme_font :footnotes do
      h = height_of_typeset_text (sx_append_chapter_pages %([#{fn.index}] #{fn.text})),
        inline_format: true, line_height: (@theme.footnotes_line_height || @theme.base_line_height)
    rescue StandardError
      h = nil
    end
    ((h || 24) + spacing).ceil
  end
  EPIGRAPH_INDENT = 40   # left/right margin on chapter epigraphs (keeps lines short, no hyphenation)
  HOW_TO_USE_SINK = 82   # foot-alignment sink for "How to Use This Book" — ink slack below the last line measured ~95pt, but the break test needs a full line height, so the usable slack is less (88 spilled one line). Retune if that chapter's text changes.

  # Style roled cross-references (the sym: glossary macro). asciidoctor-pdf's xref
  # branch makes the internal jump (<a anchor=...>) but omits the role class, so a
  # roled xref loses its styling; re-add the class while keeping the internal anchor.
  def convert_inline_anchor node
    # External links whose visible text IS the target (modulo scheme/case) must
    # not print the bracketed URL twice — "TimeTested.Bible [https://…]". The
    # gem's 'bare' role renders the text alone, hyperlink intact.
    if node.type == :link && (t = node.text) && (tgt = node.target) &&
        (tgt.sub(%r{^https?://}, '').chomp('/').downcase == t.sub(%r{^https?://}, '').chomp('/').downcase)
      node.add_role 'bare' unless node.role? && (node.role.split.include? 'bare')
    end
    if node.type == :xref && (role = node.role) && (refid = node.attributes['refid']) && node.text && !node.attributes['path']
      %(<a anchor="#{derive_anchor_from_id refid}" class="#{role}">#{node.text}</a>).gsub ']', '&#93;'
    elsif node.type == :link && (target = node.target).to_s.start_with?('/books/symbolic-language/')
      # Site-internal chapter links (footnotes, glossary "see" lines) are meaningless
      # as URLs on paper — and media=prepress reveals them as bracketed paths after
      # the link text. Convert them to internal PDF cross-references instead:
      # build.rb anchors every chapter with its slug ([#slug]).
      slug = target.split('/').reject(&:empty?).last
      %(<a anchor="#{derive_anchor_from_id slug}">#{node.text}</a>).gsub ']', '&#93;'
    else
      super
    end
  end

  # init_pdf runs allocate_scratch_prototype (Marshal.dump self) for dry runs;
  # our state (esp. a Document ref) must not exist yet, so set it up AFTER super.
  def init_pdf doc
    super
    @fn_doc = doc
    @fn_queue = {}        # page_number => [footnote, ...]
    @fn_seen = {}         # footnote index => already queued
    @fn_flushing = false
    @sx_catalog = {}      # book => { "chap:verse(-verse)" => { physical page => quoted? } }
    @sx_folios_out = {}   # dest anchor => chapter start folio, collected THIS pass
  end

  # Reserve the foot band on this page by enlarging only its bottom margin, if the
  # driver flagged it as a footnote page. The footer is unaffected (drawn from the
  # page edge). Always (re)assert the correct margin so a prior page's reserve
  # doesn't carry over.
  def init_page doc, _self
    super
    return if @fn_flushing
    @fn_base_margin ||= page_margin.dup
    m = @fn_base_margin
    reserve = (defined?($fn_reserve_pages) && $fn_reserve_pages) ? $fn_reserve_pages : {}
    extra = reserve[page_number]
    target = extra ? [m[0], m[1], m[2] + fn_band_height(extra), m[3]] : m
    set_page_margin target unless page_margin == target
  end

  def convert_document doc
    out = super
    flush_table_float force: true unless scratch?
    flush_page_footnotes if defined?($fn_flush) && $fn_flush
    # Machine-readable index artifact, written once per build from the final
    # (flush) pass of the primary (prepress) target — same folios as the
    # printed Scripture Index.
    write_scripture_index_json if !scratch? && defined?($fn_flush) && $fn_flush && (doc.attr 'media') == 'prepress'
    # Promote this pass's chapter-start-folio map — keyed by the reserve set
    # that produced it (see sx_chapter_folio_map) — after the flush, so
    # measurement and ink within one pass always used the same map.
    unless scratch?
      ($sx_folio_maps ||= {})[sx_reserve_key] = @sx_folios_out
      $sx_folio_latest = @sx_folios_out
    end
    out
  end

  # BookBaby requires the interior page count to be a multiple of 4 and pads
  # with white pages when it isn't; pad here instead so the uploaded file
  # matches the quote (476pp). Done at write time — after convert_document has
  # deleted its trailing orphan page and stamped the running content — so the
  # pad pages exist in the file but carry no folio or running head.
  def write pdf_doc, target
    if @media == 'prepress' && (rem = page_count % 4) != 0
      # start_new_page INSERTS after the current page, and the index inking
      # can leave the cursor mid-document — move to the true end first.
      go_to_page page_count
      (4 - rem).times { start_new_page }
    end
    super
  end

  # Each reference maps to an array of locator objects: {"p" => printed folio,
  # "q" => true when the verse is quoted in full (block-quoted) on that page}.
  def write_scripture_index_json
    entries = sx_folio_entries
    return if entries.empty?
    data = {}
    entries.each do |book, verses|
      verses.each { |vd, locs| data[%(#{book} #{vd})] = locs.map { |f, q| { 'p' => f, 'q' => q } } }
    end
    path = ::File.expand_path '../scripture-index.json', __dir__
    ::File.write path, (::JSON.pretty_generate data)
    warn %(Wrote: #{path}  (scripture index, #{data.size} refs))
  end

  # Suppress the built-in chapter-end / doc-end footnote dump.
  def ink_footnotes _node
    nil
  end

  # After a prose block renders, record which page its footnote markers ended on.
  # Glossary descriptions (dlist items — see traverse_list_item) also get their
  # chapter-link page suffixes appended here, on the way to the page.
  def ink_prose string, opts = {}
    string = sx_append_chapter_pages string if @sx_in_dlist_desc && !@fn_flushing
    return super if @fn_flushing || !@fn_doc
    fresh = string.scan(/_footnotedef_(\d+)/).flatten.map(&:to_i).uniq.reject { |i| @fn_seen[i] }
    return super if fresh.empty?
    result = super
    fresh.each do |i|
      fn = @fn_doc.footnotes.find { |f| f.index == i }
      next unless fn
      @fn_seen[i] = true
      (@fn_queue[page_number] ||= []) << fn
      if defined?($fn_detected_pages) && $fn_detected_pages
        $fn_detected_pages[page_number] = ($fn_detected_pages[page_number] || 0) + fn_note_height(fn)
      end
    end
    result
  end

  # Draw each page's queued notes into its reserved band, above the running footer.
  def flush_page_footnotes
    return unless @fn_queue && !@fn_queue.empty? && @fn_base_margin
    @fn_flushing = true
    spacing = @theme.footnotes_item_spacing || 2
    m = @fn_base_margin
    reserve = (defined?($fn_reserve_pages) && $fn_reserve_pages) ? $fn_reserve_pages : {}
    @fn_queue.each do |pg, fns|
      next if fns.empty?
      go_to_page pg
      pw    = page.dimensions[2] - page.dimensions[0]
      left  = m[3]
      width = pw - m[3] - m[1]
      band  = fn_band_height(reserve[pg] || fns.sum { |fn| fn_note_height fn })
      floor = m[2] + band              # content floor on a reserved page (from page bottom)
      canvas do
        stroke do
          line_width FN_RULE_WIDTH
          stroke_color '000000'
          stroke_horizontal_line left, left + FN_RULE_LEN, at: floor
        end
        bounding_box [left, floor - FN_RULE_GAP], width: width, height: band - FN_RULE_GAP do
          theme_font :footnotes do
            fns.each do |fn|
              ink_prose (sx_append_chapter_pages %([#{fn.index}] #{fn.text})), margin_bottom: spacing, hyphenate: true
            end
          end
        end
      end
    end
    @fn_flushing = false
  end

  # Widow control, where the cost lands: pulling a block down with move_cursor_to
  # opens a hole BETWEEN paragraphs mid-page — visible and ugly. Instead, shorten
  # the CURRENT page's writable area so the block breaks a line earlier and the
  # page simply runs short at the bottom: the ragged-bottom line a human
  # typesetter would leave. init_page re-asserts the proper margin on every new
  # page; normalize_page_bottom runs after the block renders as a safety net for
  # the case where it did not break after all.
  def shorten_page_bottom pts
    cur = page_margin.dup
    set_page_margin [cur[0], cur[1], cur[2] + pts, cur[3]]
    @page_bottom_shortened = true
  end

  def normalize_page_bottom
    return unless @page_bottom_shortened
    @page_bottom_shortened = false
    return unless @fn_base_margin
    m = @fn_base_margin
    reserve = (defined?($fn_reserve_pages) && $fn_reserve_pages) ? $fn_reserve_pages : {}
    extra = reserve[page_number]
    target = extra ? [m[0], m[1], m[2] + fn_band_height(extra), m[3]] : m
    set_page_margin target unless page_margin == target
  end

  # Full-page tables float like figures. A tall table that starts mid-page breaks
  # ugly (rows spill) or, forced unbreakable, shoves to the next page and leaves a
  # hole. Instead: when a table does not fit the space remaining but WOULD fit a
  # single page by itself, defer it — the blocks that follow it in the source flow
  # up to fill the current page, and the table renders whole at the next block
  # boundary that lands at a page top (or wherever it first fits). Reading order
  # shifts by a paragraph or two, exactly like a floated figure in any print book;
  # lead-in prose should reference the table, not colon into it.
  def convert_table node
    return super if scratch?
    if @float_now                           # the real (floated) render
      start_page = page_number
      result = super
      sx_scan_table node, start_page, page_number
      return result
    end
    flush_table_float                       # place any pending float before a new table
    ext = begin
      dry_run { convert_table node }
    rescue StandardError
      nil
    end
    if ext && !ext.single_page?
      # Would it fit on ONE page by itself? Measure from a fresh page top in the
      # scratch document (a split-measurement over-counts by the repeated header).
      fits_alone = begin
        ext2 = dry_run do
          advance_page unless at_page_top?
          convert_table node
        end
        ext2.single_page?
      rescue StandardError
        false
      end
      if fits_alone
        @table_float = node
        return
      end
    end
    start_page = page_number                # the real (in-flow) render
    result = super
    sx_scan_table node, start_page, page_number
    result
  end

  # List-item primary text is inked here, not via convert_paragraph — collect
  # its citations too: glossary seeref lines arrive as :dlist_desc, the Pearl
  # chapter's lexicon notes as :ulist items. Blocks ATTACHED to an item
  # traverse convert_paragraph, so only the primary text is scanned (no double
  # count). Scan the RAW @text ivar, not node.text — re-running substitutions
  # would re-register any inline footnote macro.
  def traverse_list_item node, list_type, opts = {}
    return super if scratch?
    item = list_type == :dlist ? node[1] : node   # qanda passes a [terms, desc] pair
    raw = item.instance_variable_get :@text if item.is_a? ::Asciidoctor::AbstractNode
    start_page = page_number
    prev_desc = @sx_in_dlist_desc
    @sx_in_dlist_desc = true if list_type == :dlist_desc   # seeref chapter links get ", p. N"
    begin
      result = super
    ensure
      @sx_in_dlist_desc = prev_desc
    end
    sx_scan raw, start_page, page_number
    result
  end

  def flush_table_float force: false
    return unless (node = @table_float)
    if at_page_top?
      @table_float = nil
      render_float_table node
    elsif force
      # Even a forced flush should fill the current page if the table fits in
      # what remains — advancing unconditionally left near-empty pages when a
      # figure pushed the float's boundary onto a fresh page.
      @table_float = nil
      ext = begin
        dry_run { convert_table node }
      rescue StandardError
        nil
      end
      advance_page unless at_page_top? || (ext && ext.single_page?)
      render_float_table node
    else
      ext = begin
        dry_run { convert_table node }      # does it fit in what remains here?
      rescue StandardError
        nil
      end
      if ext && ext.single_page?
        @table_float = nil
        render_float_table node
      end
    end
  end

  def render_float_table node
    prev = @float_now
    @float_now = true
    convert_table node
  ensure
    @float_now = prev
  end

  # Any float still pending at a section boundary — including a [discrete]
  # heading — or at document end must land now, inside its own section: a
  # floated table must never drift past the heading of the section that
  # introduced it.
  #
  # Parts render as KICKERS, not pages (author's ruling, 2026-07-05): a
  # dedicated part page plus its forced blank verso cost two near-empty
  # pages per part. Instead the part stays a real level-0 section — so the
  # Contents still groups chapters under it and the PDF outline keeps the
  # hierarchy — but it inks nothing here; ink_chapter_title draws its title
  # as a small line above the opening chapter's title, and registers the
  # part's destination on that same page so TOC numbers and bookmarks land
  # where the part actually begins.
  def convert_section node
    flush_table_float force: true unless scratch?
    if node.document.doctype == 'book' && node.level == 0 && node.sectname == 'part'
      @pending_part = node
      return traverse(node)
    end
    # Back-matter density (author's ruling, 2026-07-05): the glossary packs to
    # reference-apparatus convention — one point below body with tighter
    # leading — while every other chapter keeps the reading spec.
    if node.id == 'glossary'
      saved_size, saved_lh = @theme.base_font_size, @theme.base_line_height
      @theme.base_font_size = 10
      @theme.base_line_height = 0.85
      begin
        super
      ensure
        @theme.base_font_size, @theme.base_line_height = saved_size, saved_lh
      end
      return
    end
    # Scripture Index — the empty chapter build.rb appends; super inks the
    # chapter opening (recto start, running head, TOC + outline destination),
    # then the collected catalog is inked at index density (9pt — reference
    # apparatus conventionally runs 1.5-2pt below body — on the glossary's
    # tight leading).
    if node.id == 'scripture-index'
      saved_size, saved_lh = @theme.base_font_size, @theme.base_line_height
      @theme.base_font_size = 9
      @theme.base_line_height = 0.85
      begin
        super
        unless scratch?
          ink_scripture_index
          node.set_attr 'pdf-page-end', page_number
        end
      ensure
        @theme.base_font_size, @theme.base_line_height = saved_size, saved_lh
      end
      return
    end
    super
  end

  SX_HEAD_SIZE       = 9.5     # book heads a touch above the 9pt entries
  SX_TURNOVER_INDENT = 10.8    # ~0.15in hang for wrapped locator lines
  SX_COLUMNS         = 3       # measured: only ~1% of entries wrap at 3 cols / 9pt
  SX_COLUMN_GAP      = 14      # comfortable gutter (columns land ~100pt each)
  SX_EXTRA           = ['1 Enoch', '2 Esdras'].freeze   # cited outside the 66-book canon

  # One or two italic summary lines computed from the collected catalog at ink
  # time, so they stay current on every build. Canonical counts exclude the
  # extra-canonical tail, which is mentioned separately only when present.
  def sx_stats_line entries
    refs = extra_refs = cites = 0
    books = {}
    chapters = {}
    entries.each do |book, verses|
      if SX_EXTRA.include? book
        extra_refs += verses.size
        next
      end
      books[book] = true
      verses.each do |vd, locs|
        refs += 1
        cites += locs.size
        chapters[[book, vd[/\A\d+/]]] = true
      end
    end
    fmt = ->(n) { n.to_s.gsub(/(\d)(?=(\d{3})+\z)/, '\1,') }
    %(This book cites #{fmt[refs]} passages from #{books.size} of the 66 books of Scripture #{SX_EMDASH} ) +
      %(#{fmt[cites]} citations in all, drawn from #{fmt[chapters.size]} chapters of the Bible) +
      (extra_refs > 0 ? %(, besides #{fmt[extra_refs]} #{extra_refs == 1 ? 'passage' : 'passages'} from books outside the canon.) : '.')
  end

  # Ink the collected scripture index: books in canonical order as bold heads,
  # one verse per line — "1:16 · 208, 214" (middot separator; an en dash reads
  # as a range) — in three dense columns (mirrors the gem's
  # convert_index_section column_box usage). Locators where the verse is
  # block-quoted print bold. Column/page breaks between entries are taken
  # EXPLICITLY (move_past_bottom when the next line cannot fit), so every
  # mid-book break re-opens with a "Book — continued" head; a fresh book head
  # at a column top needs none.
  def ink_scripture_index
    entries = sx_folio_entries
    return if entries.empty?
    theme_font :base do
      ink_prose %(<em>#{sx_stats_line entries}</em>),
        align: :left, size: SX_HEAD_SIZE, margin_bottom: 3, hyphenate: false
      ink_prose '<em>References are to page numbers; bold numbers mark pages where the verse is quoted in full.</em>',
        align: :left, size: SX_HEAD_SIZE, margin_bottom: 10, hyphenate: false
      esc = ->(s) { s.gsub('&', '&amp;').gsub('<', '&lt;').gsub('>', '&gt;') }
      end_cursor = nil
      column_box [bounds.left, cursor], columns: SX_COLUMNS, width: bounds.width, reflow_margins: true, spacer: SX_COLUMN_GAP do
        line_h = height_of_typeset_text 'A'
        first = true
        entries.each do |book, verses|
          # never strand a book head at a column foot with fewer than 2 entries below
          bounds.move_past_bottom if cursor < line_h * 3.6
          ink_prose %(<strong>#{esc[book]}</strong>), align: :left, size: SX_HEAD_SIZE,
            margin_top: (first ? 0 : 5), margin_bottom: 1, hyphenate: false
          verses.each do |vd, locs|
            vd_disp = (SX_ONECH_BOOKS.include? book) ? (vd.sub /\A1:/, '') : vd
            text = %(#{vd_disp} · #{locs.map { |f, q| q ? %(<strong>#{f}</strong>) : f.to_s }.join ', '})
            # keep each entry whole: measure it (at turnover width — the
            # conservative side) and, when it cannot fit what remains of the
            # column, break explicitly and repeat the head as "— continued"
            if cursor < line_h * 6
              h = nil
              indent(SX_TURNOVER_INDENT) { h = height_of_typeset_text text, inline_format: true }
              if cursor < h + 1
                bounds.move_past_bottom
                ink_prose %(<strong>#{esc[book]}</strong> <em>#{SX_EMDASH} continued</em>), align: :left,
                  size: SX_HEAD_SIZE, margin_bottom: 1, hyphenate: false
              end
            end
            ink_prose text, align: :left, margin_bottom: 0, hanging_indent: SX_TURNOVER_INDENT, hyphenate: false
          end
          first = false
        end
        end_cursor = cursor if bounds.current_column == 0
      end
      move_cursor_to end_cursor if end_cursor
    end
  end

  def convert_floating_title node
    flush_table_float force: true unless scratch?
    super
  end

  # Figures come in two renditions: NAME.svg (color, screen + web) and a
  # NAME-print.svg sibling (light-background grayscale, drawn for ink on paper).
  # The prepress build swaps in the print rendition when the sibling exists;
  # the gray PDF derives from prepress, so it inherits the swap.
  def convert_image node
    flush_table_float unless scratch?
    if (node.document.attr 'media') == 'prepress' && (target = node.attr 'target')&.end_with?('.svg') && !target.end_with?('-print.svg')
      print_target = target.sub(/\.svg$/, '-print.svg')
      dir = node.document.attr 'imagesdir'
      node.set_attr 'target', print_target if dir && ::File.exist?(::File.join(dir, print_target))
    end
    super
  end

  # Body paragraphs get a first-line indent (theme prose-text-indent); quote
  # content must not. The converter applies the indent globally, so zero it while
  # a quote (and its citation) renders.
  # asciidoctor-pdf does `alias convert_quote convert_quote_or_verse` at class-load, so the
  # dispatch (convert_quote / convert_verse) binds to the BASE method and bypasses this
  # subclass override. Re-route the aliases through our version.
  def convert_quote node
    convert_quote_or_verse node
  end
  alias convert_verse convert_quote

  def convert_quote_or_verse node
    saved = @theme.prose_text_indent
    @theme.prose_text_indent = 0
    prev_in_quote = @in_quote
    @in_quote = true
    begin
      unless scratch? || prev_in_quote
        flush_table_float
        balance_block_quote node
      end
      super
    ensure
      @in_quote = prev_in_quote
      @theme.prose_text_indent = saved
      normalize_page_bottom unless scratch?
    end
  end

  # Ordinary prose paragraphs need the same widow/orphan control as quotes: never
  # strand a single line of a paragraph on either side of a page break. Quotes
  # balance themselves as a unit (above), so paragraphs inside a quote — including
  # the injected citation — are excluded via @in_quote.
  # Glossary verdict badges (DIVERGENT / NOVEL — see the Introduction's blind
  # test). build.rb rewrites the source macro into an inline role span on the
  # dlist term; this override strips it from the term text and draws the badge
  # RIGHT-ALIGNED on the term's line with a raw prawn text_box (no inline
  # formatting pipeline), after the terms ink at the captured cursor. The badge
  # survives the unbreakable scratch/real double-convert via a node attribute.
  # Glossary entries: spread-aware keep-together (author's ruling 2026-07-08).
  # An entry may FLOW across a spread (verso bottom -> facing recto: no page
  # turn, the eye slides right) but never across a page TURN (recto -> next
  # verso). Short remainders and turn-crossing breaks push the entry whole to
  # the next page, as before.
  def convert_open node
    if node.role == 'glossentry' && !scratch?
      h = (dry_run { traverse node }).single_page_height rescue nil
      if h && h > cursor
        # entry will not fit the remaining page: break across the spread only
        start_new_page if (page_number.odd? || cursor < h * 0.25)
      end
      return traverse node
    end
    super
  end

  def convert_dlist node
    badge = node.attr 'verdictbadge'
    node.items.each do |terms, _dd|
      terms.each do |term|
        src = term.instance_variable_get :@text
        next unless src && (src.include? '[.verdict]#')
        badge ||= src[/\[\.verdict\]#([A-Z]+)#/, 1]
        node.set_attr 'verdictbadge', badge
        term.instance_variable_set :@text, (src.sub /\s*\[\.verdict\]#[A-Z]+#/, '')
      end
    end
    return super unless badge
    y0 = cursor
    result = super
    unless scratch?
      prev_fill = fill_color
      fill_color '777777'
      text_box badge, at: [0, y0 - 1.5], width: bounds.width, align: :right, size: 6.8
      fill_color prev_fill
    end
    result
  end

  def convert_paragraph node
    # [.nohyph] role: suppress hyphenation for this paragraph (the gem guards
    # every hyphenation call with `defined? @hyphenator`) — used where a break
    # would split a brand name ("Bit-Shares" on the About page).
    if (nohyph = node.role? && (node.roles.include? 'nohyph') && (defined? @hyphenator))
      saved_hyphenator = @hyphenator
      remove_instance_variable :@hyphenator
    end
    # Copyright-page blocks are set flush — no book-style first-line indent.
    if (noindent = node.role? && (node.roles.any? { |r| r.start_with? 'copyright' }))
      saved_indent = @theme.prose_text_indent
      @theme.prose_text_indent = 0
    end
    unless scratch? || @in_quote
      flush_table_float
      # poemline units (restated poem line + commentary) get air above so the
      # line-by-line walk doesn't run together visually.
      move_down 5 if (node.role? && node.roles.include?('poemline')) && !at_page_top?
      # display couplets (centered Hebrew + transliteration) breathe wider
      move_down 10 if (node.role? && node.roles.include?('breath')) && !at_page_top?
      balance_prose_paragraph node
    end
    unless scratch?
      start_page = page_number
      start_cursor = cursor
    end
    result = super
    unless scratch?
      # Scripture index: scan the paragraph's source (inline refs, footnote
      # macro text, and the citation paragraphs the quote treeprocessor builds
      # from block-quote attributions — those render inside the quote, so the
      # page recorded is the quote's own page, and their locators print BOLD:
      # the verse is quoted in full there).
      sx_scan_paragraph node.source, start_page, page_number, start_cursor,
        quoted: (node.role? && (node.roles.include? 'citation'))
      normalize_page_bottom unless @in_quote
    end
    result
  ensure
    @theme.prose_text_indent = saved_indent if noindent
    @hyphenator = saved_hyphenator if nohyph
  end

  def balance_prose_paragraph node
    ext = begin
      dry_run { convert_paragraph node }               # measure the natural break from here
    rescue StandardError
      return
    end
    return if ext.single_page?                         # fits on the current page
    lh_mult = @theme.base_line_height || 1.15
    line_h  = nil
    theme_font(:base) { line_h = font.height * lh_mult }
    min_chunk = line_h * 2                             # >= 2 lines on each side of a break
    first_h   = ext.from.cursor
    last_h    = bounds.height - ext.to.cursor
    spans     = ext.to.page - ext.from.page
    if first_h < min_chunk
      # orphan: fewer than 2 lines fit here — send the whole paragraph over.
      advance_page unless at_page_top?
    elsif spans == 1 && last_h < min_chunk
      # widow: the natural break leaves a lone line on the next page. Shorten this
      # page's bottom in whole line-heights so the paragraph breaks a line earlier
      # (a second line follows the widow over; the page runs short at the bottom
      # instead of opening a hole between paragraphs) — unless the first page
      # would drop below the minimum, in which case send the whole paragraph over.
      deficit = min_chunk - last_h
      pull = (deficit / line_h).ceil * line_h
      if first_h - pull >= min_chunk
        shorten_page_bottom pull
      else
        advance_page unless at_page_top?
      end
    end
  end

  # Widow/orphan control for block quotes. asciidoctor-pdf offers only all-or-nothing
  # keep-together, which shoves a too-tall quote wholly onto the next page and leaves a
  # gap. Instead we let long quotes break across pages, but never strand fewer than
  # ~3 lines (2 content lines + the citation) of the quote on any page: measure the
  # quote; if it fits on the current page, do nothing; if a break would leave less
  # than that on either side, push the whole quote (or enough of it) over; otherwise
  # let it break naturally.
  def balance_block_quote node
    ext = begin
      dry_run { convert_quote_or_verse node }        # measure the natural break from here
    rescue StandardError
      return
    end
    return if ext.single_page?                       # fits on the current page — nothing to do
    # Measure the REAL rendered line height. The theme's line-height multiplies the
    # font's own natural height (Gentium Book Plus: 1.465em), NOT the point size —
    # estimating with size x line-height underestimates by that factor and lets a
    # lone line + citation slip past the guard ("yards… — Isaiah 37:30").
    lh_mult = @theme.quote_line_height || @theme.base_line_height || 1.15
    line_h  = nil
    theme_font(:quote) { line_h = font.height * lh_mult }
    # >= 2 content lines + the citation (with its spacing) on any page of the quote.
    min_chunk = line_h * 3
    first_h   = ext.from.cursor                       # the quote's portion on the current page
    last_h    = bounds.height - ext.to.cursor         # the quote's portion on the final page
    spans     = ext.to.page - ext.from.page           # 1 == breaks across two pages
    if first_h < min_chunk
      # fewer than ~2 lines fit here — don't orphan them; send the whole quote over.
      advance_page unless at_page_top?
    elsif spans == 1 && last_h < min_chunk
      # widow: a natural break leaves too little on the next page. Lines move in whole
      # increments, so shorten the page bottom in FULL line-heights (a fractional
      # nudge cannot shift a line): the quote breaks a line earlier and the page
      # runs short at the bottom — unless the first page would then drop below the
      # minimum, in which case send the whole quote over.
      deficit = min_chunk - last_h
      pull = (deficit / line_h).ceil * line_h
      if first_h - pull >= min_chunk
        shorten_page_bottom pull
      else
        advance_page unless at_page_top?
      end
    end
    # otherwise: >= 2 lines here AND >= 2 on the next page -> let super break it naturally
  end

  # Full-page art plates on the VERSO facing a chapter's recto opening.
  # Keyed by chapter id (slug); paths resolve against the document imagesdir
  # (the chapters dir). The plate page is flagged @imported_page exactly like
  # the blank parity spacers — no running head, no folio — and occupies a page
  # number, so folio parity holds. When the chapter would have needed a blank
  # verso spacer anyway, the plate absorbs it (no page-count change); when the
  # chapter would have opened directly after a verso, the plate costs two
  # pages (a true-blank recto spacer + the plate verso).
  CHAPTER_PLATES = {
    'introduction'          => 'five-loaves-plate-print.jpg',
    'the-parables-of-the-kingdom' => 'sower-plate-print.jpg',
    'signs-and-similitudes' => 'moriah-plate-print.jpg',
    'sign-of-jonah'         => 'jonah-plate-print.jpg',
    'gospel'                => 'herald-plate-print.jpg',
    'knowing-faith-love-and-belief' => 'cloak-plate-print.jpg',
    'the-way-the-truth-and-the-life' => 'narrow-path-plate-print.jpg',
    'the-name'              => 'strong-tower-plate-print.jpg',
    'the-seal'              => 'inkhorn-seal-plate-print.jpg',
    'the-coin'              => 'fish-stater-plate-print.jpg',
    'marriage-and-divorce'  => 'hosea-silver-plate-print.jpg',
    'wings'                 => 'hem-plate-print.jpg',
    'orphans-widows-and-the-fatherless' => 'widow-door-plate-print.jpg',
    'the-remnant'           => 'olive-gleanings-plate-print.jpg',
    'heaven-and-hell'       => 'furnace-plate-print.jpg',
    'justice-and-judgment'  => 'gate-judgment-plate-print.jpg',
    'liberty'               => 'jubilee-plate-print.jpg',
    'worship'               => 'temple-worship-plate-print.jpg',
    'the-fear-of-the-lord'  => 'sinai-fear-plate-print.jpg',
    'time-tested-tradition' => 'ttt-cover-plate-print.jpg',
    'path-to-salvation'     => 'tabernacle-path-plate-print.jpg',
    'the-four-winds'        => 'four-horsemen-plate-print.jpg',
    'mountain'              => 'colossus-mountain-plate-print.jpg',
    'sea-and-waters'        => 'peace-be-still-plate-print.jpg',
    'trees'                 => 'kingdom-tree-plate-print.jpg',
    'grass'                 => 'harvest-grass-plate-print.jpg',
    'garments'              => 'wedding-garment-plate-print.jpg',
    'the-bow'               => 'covenant-bow-plate-print.jpg',
    'jacob-israel-and-ephraim' => 'jabbok-plate-print.jpg',
    'butter'                => 'butter-churn-plate-print.jpg',
    'the-other-white-meat'  => 'prodigal-trough-plate-print.jpg',
    'about-the-author'      => 'author-portrait-plate-print.jpg',
    'shadow'                => 'shadow-rock-plate-print.jpg',
    'noah-uncovered'        => 'noah-uncovered-plate-print.jpg',
    'the-fool-and-the-wise' => 'fool-and-wise-plate-print.jpg',
    'light-and-darkness'    => 'lamp-stand-plate-print.jpg',
    'sun-moon-and-stars'    => 'joseph-dream-plate-print.jpg',
    'spoken-once-heard-twice' => 'almond-rod-plate-print.jpg',
    'foreskin'              => 'orchard-keeper-plate-print.jpg',
    'what-is-the-point'     => 'what-is-the-point-plate-print.jpg',
    'lucifers-declared-plan' => 'lucifer-moon-plate-print.jpg',
    'daniel-unsealed'       => 'daniel-sealed-plate-print.jpg',
    'the-pearl'             => 'merchant-pearl-plate-print.jpg',
    'the-fall-of-babylon'   => 'fall-of-babylon-plate-print.jpg',
  }.freeze

  # Fill the trimmed page as fully as the aspect allows, centered — drawn on
  # the page canvas (edge to edge, ignoring margins), so a plate whose aspect
  # matches the 6x9 trim bleeds the full page.
  def ink_chapter_plate chapter, target
    dir = (chapter.document.attr 'imagesdir') || '.'
    path = ::File.join dir, target
    unless ::File.readable? path
      warn %(chapter plate not found, leaving verso blank: #{path})
      return
    end
    canvas do
      image path, fit: [bounds.width, bounds.height], position: :center, vposition: :center
    end
  rescue StandardError => e
    warn %(chapter plate failed (#{e.class}: #{e.message}), leaving verso blank: #{path})
  end

  # Render the chapter epigraph (if any) ABOVE the chapter title. Real chapters
  # give us the TOC, PDF bookmarks, and running heads; this keeps the epigraph
  # above the title. Data comes from $chapter_epigraphs (set by build.rb).
  # BookBaby: chapters open on the right hand (recto, odd folio). When the
  # next page falls on a verso, insert a spacer — but a TRUE blank: flagging
  # it imported makes ink_running_content skip it (no running head, no
  # folio), while it still occupies a page number so folio parity holds.
  # A chapter with a CHAPTER_PLATES entry gets its plate on that facing verso
  # (in place of the blank); the part-kicker case needs no special handling —
  # @pending_part inks on the chapter recto (ink_chapter_title), after the
  # plate verso, so a part-opening chapter with a plate still works.
  def start_new_chapter chapter
    start_new_page unless at_page_top?
    if !scratch? && (plate = CHAPTER_PLATES[chapter && chapter.id])
      if recto_page?
        # parity demands the plate's verso start a leaf later: this empty
        # recto becomes a true-blank spacer, the plate takes the verso after.
        state.page.instance_variable_set :@imported_page, true
        start_new_page
      end
      ink_chapter_plate chapter, plate
      state.page.instance_variable_set :@imported_page, true
      start_new_page                          # the chapter's recto opening
    else
      unless recto_page?
        state.page.instance_variable_set :@imported_page, true
        start_new_page
      end
    end
  end

def ink_chapter_title node, title, opts = {}
    # Record this chapter's start folio under its dest anchor — the map the
    # NEXT pass uses to print ", p. N" after chapter cross-references.
    if !scratch? && node.id && @sx_folios_out && (folio = page_number - sx_folio_offset) >= 1
      @sx_folios_out[derive_anchor_from_id node.id] = folio
    end
    if (part = @pending_part)
      @pending_part = nil
      add_dest_for_block part   # TOC entry + outline bookmark resolve to this page
      esc_part = part.title.to_s.gsub('&', '&amp;').gsub('<', '&lt;').gsub('>', '&gt;')
      theme_font :heading do
        ink_prose %(<font size="10.5">#{esc_part.upcase}</font>), align: :center, margin_bottom: 0, hyphenate: false
      end
      stroke do
        line_width 0.6
        x_mid = bounds.width / 2.0
        horizontal_line x_mid - 54, x_mid + 54, at: cursor - 7
      end
      move_down 18
    end
    epis = (defined?($chapter_epigraphs) && $chapter_epigraphs) ? $chapter_epigraphs[node.id] : nil
    if epis && !epis.empty?
      move_down 48   # small top sink — the epigraph sits in the upper half of the opener
      esc = ->(s) { s.to_s.gsub('&', '&amp;').gsub('<', '&lt;').gsub('>', '&gt;') }
      theme_font :base do
        epis.each do |e|
          indent EPIGRAPH_INDENT, EPIGRAPH_INDENT do
            ink_prose %(<em>#{esc.call(e['quote'])}</em>), align: :center, margin_bottom: 3, hyphenate: false
            ink_prose %(<font size="9">— #{esc.call(e['ref'])}</font>), align: :center, margin_bottom: 16
          end
          sx_scan e['ref'].to_s, page_number unless scratch?
        end
      end
    end
    # Drop the chapter title to about the middle of the page; the epigraph stays
    # above it in the top half. (Guard so a long epigraph never pushes it upward.)
    # The Glossary and Scripture Index start at the top like the reference
    # sections they are. "How to Use This Book" instead hangs from the FOOT of
    # its page (author's ruling, 2026-07-06) — whitespace above, last line on
    # the bottom margin, like a printer's note; HOW_TO_USE_SINK carries the
    # measured drop.
    if node.id == 'how-to-use'
      move_down HOW_TO_USE_SINK
    elsif !(node.id == 'glossary' || node.id == 'scripture-index' || node.id == 'further-studies' || node.id == 'about-the-author')
      mid = bounds.height / 2.0
      move_cursor_to mid if cursor > mid
    end
    # Chapter openers carry no running head (trade convention — the page
    # already displays its own title); the folio footer stays.
    @disable_running_content[:header].add page_number unless scratch?
    super
  end
end

class QuoteCitationTreeprocessor < Asciidoctor::Extensions::Treeprocessor
  EMDASH = "—"

  def process document
    document.find_by(context: :quote).each do |quote|
      # Page-breaking for quotes — with 2-line widow/orphan control — is handled in
      # TradePdfConverter#balance_block_quote, so we do NOT force them unbreakable here.

      attribution = quote.attr 'attribution'
      citetitle   = quote.attr 'citetitle'
      parts = [attribution, citetitle].compact.map(&:to_s).reject(&:empty?)
      next if parts.empty?

      # Remove the native attribution so Asciidoctor-PDF doesn't also render it.
      quote.remove_attr 'attribution'
      quote.remove_attr 'citetitle'

      cite_text = "#{EMDASH} #{parts.join(', ')}"
      # NOTE: no subs on citations — an inline footnote here would render its
      # marker but the page-bottom flush doesn't scan the quote path; anchor
      # footnotes in the prose before the quote instead.
      citation = Asciidoctor::Block.new quote, :paragraph,
        source: cite_text,
        attributes: { 'role' => 'text-right citation' }
      quote.blocks << citation
    end
    nil
  end
end

Asciidoctor::Extensions.register do
  treeprocessor QuoteCitationTreeprocessor
end
