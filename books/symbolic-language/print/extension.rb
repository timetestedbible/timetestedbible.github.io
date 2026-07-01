# Asciidoctor extension for the print build of "The Bible's Symbolic Language".
#
#   * QuoteCitationTreeprocessor — moves a quote's attribution into a right-aligned
#     citation paragraph INSIDE the quote, and marks the quote unbreakable.
#   * TradePdfConverter — PDF converter overrides:
#       - quote paragraphs are not first-line indented
#       - chapter epigraphs render above the chapter title
#       - PAGE-BOTTOM FOOTNOTES (see below)
#
# Page-bottom footnotes (dynamic, per-page reserve)
# -------------------------------------------------
# asciidoctor-pdf renders footnotes as endnotes at chapter end. We want them at
# the foot of the page that carries the marker, WITHOUT making footnote-free
# pages pay for the space. asciidoctor regenerates the margin box from the page
# margin, so the live lever that sticks is set_page_margin (not a height hack);
# and the footer is drawn from the page EDGE, so shrinking a page's content area
# does not move the page number.
#
# build.rb drives a short converging loop over this converter:
#   - $fn_reserve_pages : pages to shrink (give a foot band) on this pass
#   - $fn_flush         : whether to draw the notes (only the final pass)
#   - $fn_detected_pages: OUT — pages where markers actually landed this pass
# It re-renders until the detected set matches the reserved set (a fixed point),
# then does one final pass that draws the notes.

require 'asciidoctor'
require 'asciidoctor/extensions'
require 'asciidoctor-pdf'

class TradePdfConverter < Asciidoctor::PDF::Converter
  register_for 'pdf'

  FN_RESERVE    = 36.0   # 0.5in band added to the bottom margin of footnote pages
  FN_RULE_LEN   = 144    # 2in separator rule
  FN_RULE_WIDTH = 0.5
  FN_RULE_GAP   = 5      # gap below the rule, above the first note
  EPIGRAPH_INDENT = 40   # left/right margin on chapter epigraphs (keeps lines short, no hyphenation)

  # Style roled cross-references (the sym: glossary macro). asciidoctor-pdf's xref
  # branch makes the internal jump (<a anchor=...>) but omits the role class, so a
  # roled xref loses its styling; re-add the class while keeping the internal anchor.
  def convert_inline_anchor node
    if node.type == :xref && (role = node.role) && (refid = node.attributes['refid']) && node.text && !node.attributes['path']
      %(<a anchor="#{derive_anchor_from_id refid}" class="#{role}">#{node.text}</a>).gsub ']', '&#93;'
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
    reserve = (defined?($fn_reserve_pages) && $fn_reserve_pages) ? $fn_reserve_pages : []
    target = reserve.include?(page_number) ? [m[0], m[1], m[2] + FN_RESERVE, m[3]] : m
    set_page_margin target unless page_margin == target
  end

  def convert_document doc
    out = super
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
      ($fn_detected_pages ||= []) << page_number if defined?($fn_detected_pages)
    end
    result
  end

  # Draw each page's queued notes into its reserved band, above the running footer.
  def flush_page_footnotes
    return unless @fn_queue && !@fn_queue.empty? && @fn_base_margin
    @fn_flushing = true
    spacing = @theme.footnotes_item_spacing || 2
    m = @fn_base_margin
    @fn_queue.each do |pg, fns|
      next if fns.empty?
      go_to_page pg
      pw    = page.dimensions[2] - page.dimensions[0]
      left  = m[3]
      width = pw - m[3] - m[1]
      floor = m[2] + FN_RESERVE        # content floor on a reserved page (from page bottom)
      canvas do
        stroke do
          line_width FN_RULE_WIDTH
          stroke_color '000000'
          stroke_horizontal_line left, left + FN_RULE_LEN, at: floor
        end
        bounding_box [left, floor - FN_RULE_GAP], width: width, height: FN_RESERVE - FN_RULE_GAP do
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

  # Body paragraphs get a first-line indent (theme prose-text-indent); quote
  # content must not. The converter applies the indent globally, so zero it while
  # a quote (and its citation) renders.
  def convert_quote_or_verse node
    saved = @theme.prose_text_indent
    @theme.prose_text_indent = 0
    begin
      super
    ensure
      @theme.prose_text_indent = saved
    end
  end

  # Render the chapter epigraph (if any) ABOVE the chapter title. Real chapters
  # give us the TOC, PDF bookmarks, and running heads; this keeps the epigraph
  # above the title. Data comes from $chapter_epigraphs (set by build.rb).
  def ink_chapter_title node, title, opts = {}
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
    mid = bounds.height / 2.0
    move_cursor_to mid if cursor > mid
    super
  end
end

class QuoteCitationTreeprocessor < Asciidoctor::Extensions::Treeprocessor
  EMDASH = "—"

  def process document
    document.find_by(context: :quote).each do |quote|
      # Keep the quote (and the citation we add below) together on one page.
      quote.set_option 'unbreakable'

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
