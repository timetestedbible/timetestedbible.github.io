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

class TradePdfConverter < Asciidoctor::PDF::Converter
  register_for 'pdf'

  FN_RULE_LEN   = 144    # 2in separator rule
  FN_RULE_WIDTH = 0.5
  FN_RULE_GAP   = 5      # gap below the rule, above the first note
  FN_BAND_PAD   = 9      # rule + breathing room added once per footnote page

  # Band points a page must reserve for its notes so far (measured), + padding.
  def fn_band_height pts
    pts + FN_BAND_PAD
  end

  # Measured height of one note at footnotes size across the content width.
  def fn_note_height fn
    spacing = @theme.footnotes_item_spacing || 2
    h = nil
    theme_font :footnotes do
      h = height_of_typeset_text %([#{fn.index}] #{fn.text}),
        inline_format: true, line_height: (@theme.footnotes_line_height || @theme.base_line_height)
    rescue StandardError
      h = nil
    end
    ((h || 24) + spacing).ceil
  end
  EPIGRAPH_INDENT = 40   # left/right margin on chapter epigraphs (keeps lines short, no hyphenation)

  # Style roled cross-references (the sym: glossary macro). asciidoctor-pdf's xref
  # branch makes the internal jump (<a anchor=...>) but omits the role class, so a
  # roled xref loses its styling; re-add the class while keeping the internal anchor.
  def convert_inline_anchor node
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
    out
  end

  # Suppress the built-in chapter-end / doc-end footnote dump.
  def ink_footnotes _node
    nil
  end

  # After a prose block renders, record which page its footnote markers ended on.
  def ink_prose string, opts = {}
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
              ink_prose %([#{fn.index}] #{fn.text}), margin_bottom: spacing, hyphenate: true
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
    return super if scratch? || @float_now
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
    super
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
    super
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
  def convert_paragraph node
    unless scratch? || @in_quote
      flush_table_float
      balance_prose_paragraph node
    end
    result = super
    normalize_page_bottom unless scratch? || @in_quote
    result
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

  # Render the chapter epigraph (if any) ABOVE the chapter title. Real chapters
  # give us the TOC, PDF bookmarks, and running heads; this keeps the epigraph
  # above the title. Data comes from $chapter_epigraphs (set by build.rb).
  # BookBaby: chapters open on the right hand (recto, odd folio). When the
  # next page falls on a verso, insert a spacer — but a TRUE blank: flagging
  # it imported makes ink_running_content skip it (no running head, no
  # folio), while it still occupies a page number so folio parity holds.
  def start_new_chapter _chapter
    start_new_page unless at_page_top?
    unless recto_page?
      state.page.instance_variable_set :@imported_page, true
      start_new_page
    end
  end

  def ink_chapter_title node, title, opts = {}
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
        end
      end
    end
    # Drop the chapter title to about the middle of the page; the epigraph stays
    # above it in the top half. (Guard so a long epigraph never pushes it upward.)
    # "How to Use This Book" is exempt (author's single-page exception): its
    # title stays at the top so the conventions fit on one opening page — and
    # the Glossary starts at the top like the reference section it is.
    unless node.id == 'how-to-use' || node.id == 'glossary'
      mid = bounds.height / 2.0
      move_cursor_to mid if cursor > mid
    end
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
