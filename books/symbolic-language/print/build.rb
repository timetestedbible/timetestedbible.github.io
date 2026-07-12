#!/usr/bin/env ruby
# Build the trade-paperback (6x9) PDF of "The Bible's Symbolic Language".
#
# Replaces the old bash/awk pipeline with the Asciidoctor Ruby API:
#   - real YAML parsing of each chapter's Jekyll front matter (title, epigraphs)
#   - a treeprocessor extension (extension.rb) for the quote/citation transform
#   - asciidoctor-pdf for rendering, with the trade theme
#
# Usage:
#   ruby build.rb            # BOTH PDFs: print (prepress — the default artifact
#                            # we edit and iterate on) and screen (refined later)
#   ruby build.rb print      # print-ready only: facing pages, gutter margins
#   ruby build.rb screen     # screen only: single pages
#
# Outputs:
#   the-bibles-symbolic-language-print.pdf    (media=prepress)
#   the-bibles-symbolic-language-screen.pdf   (media=screen)
#
# Requires:  gem install asciidoctor-pdf
require 'asciidoctor'
require 'asciidoctor-pdf'
require 'yaml'
require 'json'
require_relative 'extension'
require File.expand_path('../../../_plugins/symbol_macro', __dir__)  # sym: inline macro — glossary xref (PDF) / link (web), shared with the web build

DIR   = __dir__
SRC   = File.expand_path('..', DIR)                       # chapters live one level up
FONTS = File.join(DIR, 'fonts')                           # bundled fonts (Noto Serif Hebrew, OFL) for Hebrew glyphs
NBSP  = '{nbsp}'

# Targets: media => output file. Print (prepress) is the primary artifact.
ALL_TARGETS = {
  'prepress' => File.join(DIR, 'the-bibles-symbolic-language-print.pdf'),
  'screen'   => File.join(DIR, 'the-bibles-symbolic-language-screen.pdf'),
}
# NO_PLATES=1: text-review build — chapter plates skipped (inline diagrams kept),
# separate output name so the print artifact is never clobbered.
ALL_TARGETS.each { |k, v| ALL_TARGETS[k] = v.sub('.pdf', '-noplates.pdf') } if ENV['NO_PLATES']
WANT_EPUB = ['all', 'epub', 'ebook'].include?(ARGV[0] || 'all')
TARGETS = case (ARGV[0] || 'all')
          when 'all'               then ALL_TARGETS
          when 'print', 'prepress' then ALL_TARGETS.slice('prepress')
          when 'screen'            then ALL_TARGETS.slice('screen')
          when 'epub', 'ebook'     then {}
          else abort "Unknown target #{ARGV[0].inspect} — use print, screen, epub, or no argument for all"
          end

# --- Split Jekyll YAML front matter from the AsciiDoc body ---
def split_front_matter(raw)
  if raw =~ /\A---\s*\n(.*?\n)---\s*\n?(.*)\z/m
    [(YAML.safe_load($1) || {}), $2]
  else
    [{}, raw]
  end
end

chapters = Dir.glob(File.join(SRC, '[0-9]*-*.adoc')).sort
abort "No chapter files (NN-name.adoc) in #{SRC}" if chapters.empty?

doc = +<<~ADOC
  = MEAT The Bible's Symbolic Language
  Daniel Larimer
  :doctype: book
  :lang: en
  :notitle:
  :toc: macro
  :toc-title: Contents
  :toclevels: 1
ADOC

# Epigraphs are rendered ABOVE each chapter title by the converter override in
# extension.rb (so we keep real chapters → TOC + bookmarks). Collect them here,
# keyed by chapter id (the slug), and expose via the global the converter reads.
epigraph_map = {}

# Downsized image twins the EPUB needs generated (twin filename => master),
# collected during assembly, produced by the epub branch via sips.
$ebook_image_jobs = {}

front_entries = []
main_entries  = []
chapters.each do |path|
  fm, body = split_front_matter(File.read(path))
  slug  = fm['slug'] || File.basename(path, '.adoc').sub(/^\d+[-_]/, '')
  title = fm['title'] || slug
  epigraph_map[slug] = fm['epigraphs'] if fm['epigraphs'].is_a?(Array) && !fm['epigraphs'].empty?
  (fm['front_matter'] ? front_entries : main_entries) << { slug: slug, title: title, body: body.strip, file: File.basename(path), edition: fm['edition'] }
end

# Front matter (e.g. the copyright page): rendered BEFORE the Contents as untitled
# colophon pages — no chapter heading, no TOC entry, and, sitting ahead of the body,
# no running head or page number. Flag a file with `front_matter: true` in its YAML.
front_entries.each do |c|
  doc << "\n" << c[:body] << "\n\n<<<\n"
  warn "  · #{c[:title]}  (front matter, #{c[:file]})"
end

# Contents — placed here, after the front matter and before the chapters.
# (Print/screen only: the EPUB carries its own navigation document.)
doc << "\nifndef::ebook-edition[]\ntoc::[]\nendif::[]\n"

# --- Parts: the book's seven movements. Keyed by the slug of the chapter that
# OPENS each part. Emitted as bare level-0 headings — extension.rb renders each
# as a KICKER above its opening chapter's title (no part page, no blank verso;
# author's ruling 2026-07-05) while the Contents and PDF outline keep the
# part/chapter hierarchy.
PARTS = {
  'introduction'       => 'Part One — The Method',
  'gospel'             => 'Part Two — The Doctrine',
  'what-is-the-point'  => 'Part Three — The Point',
  'sun-moon-and-stars' => 'Part Four — The Calendar',
  'the-four-winds'     => 'Part Five — The Prophecy',
  'mountain'           => 'Part Six — Symbol Studies',
  'glossary'           => 'Part Seven — The Glossary',
}

# Back matter, rendered AFTER the generated Scripture Index: the Bibliography
# (sources page, both editions), the Further Studies pointer page (print-only;
# a compact section, not a full chapter opening — author's ruling 2026-07-07),
# then About the Author closes the book.
BACK_SLUGS = %w[bibliography further-studies about-the-author].freeze
back_entries = main_entries.select { |c| BACK_SLUGS.include? c[:slug] }
                           .sort_by { |c| BACK_SLUGS.index c[:slug] }
main_entries -= back_entries

# Main chapters: auto page break, TOC entry, PDF bookmark, running head.
# A chapter whose front matter carries `edition: digital` appears only in the
# screen/web editions (the print run gets its summary elsewhere); `edition:
# print` is the inverse (e.g. the Further Studies pointer page). The whole
# chapter — heading included — is wrapped in a preprocessor conditional on the
# print-edition attribute, which build_target sets only for media=prepress.
main_entries.each do |c|
  if (part = PARTS[c[:slug]])
    doc << "\n= #{part}\n"
    warn "  = #{part}"
  end
  case c[:edition]
  when 'digital' then doc << "\nifndef::print-edition[]\n"
  when 'print'   then doc << "\nifdef::print-edition[]\n"
  end
  body = c[:body]
  if c[:slug] == 'glossary'
    # Keep each glossary entry whole on its page: a split entry strands its
    # see-line at a column top. Every blank-line-delimited [[sym-…]] block is
    # wrapped in an unbreakable open block.
    body = body.split(/\n{2,}/).map { |blk|
      next blk unless blk.lstrip.start_with?('[[sym-')
      # Experiment-verdict badges: the source marks a term with
      # verdict:divergent[] / verdict:novel[] (rendered as a floated span on
      # the web). For print, rewrite the macro as an inline role span on the
      # term line; the theme's `verdict` role sets the small-caps badge look.
      blk = blk.sub(/ verdict:(divergent|novel|word)\[\]/) { %(   [.verdict]##{$1.upcase}#) }
      # see-line chapter numbers are the DIGITAL edition's numbering (the web
      # shows them); no built book prints chapter numbers, so strip them here
      # (print, screen, and epub all assemble from this doc).
      blk = blk.gsub(/\[\.chnum\]#([^#]*)#/, '')
      "[.glossentry]\n--\n#{blk}\n--"
    }.join("\n\n")
  end
  # The ebook cannot run the PDF converter's chapter machinery, so the plate
  # (the COLOR master — the print pipeline uses the grayscale twin) and the
  # epigraphs are injected as ebook-only blocks; the PDF passes never set
  # ebook-edition, so its pagination is untouched.
  ebook_front = +''
  if (plate = TradePdfConverter::CHAPTER_PLATES[c[:slug]])
    color  = plate.sub 'images/print/', 'images/masters/'
    master = [color, plate].find { |f| File.exist? File.join(SRC, f) }
    if master
      # Reference a downsized twin in images/ebook/ (the masters total >100MB;
      # stores charge delivery by the MB). The epub branch generates twins.
      twin = plate.sub 'images/print/', 'images/ebook/'
      $ebook_image_jobs[twin] = master
      ebook_front << "image::#{twin}[#{c[:title]}]\n\n"
    end
  end
  (epigraph_map[c[:slug]] || []).each do |e|
    ebook_front << "[quote]\n____\n_#{e['quote']}_\n#{NBSP}#{NBSP}— #{e['ref']}\n____\n\n"
  end
  doc << "\n[##{c[:slug]}]\n== #{c[:title]}\n\n"
  doc << "ifdef::ebook-edition[]\n\n#{ebook_front}\nendif::[]\n\n" unless ebook_front.empty?
  doc << body << "\n"
  doc << "\nendif::[]\n" if c[:edition]
  warn "  + #{c[:title]}  (#{c[:file]}#{c[:edition] ? ", #{c[:edition]}-only" : ''})"
end

# Scripture Index — generated back matter: an empty chapter the converter
# (extension.rb) intercepts by id and populates at ink time from the verse
# citations collected during the same render pass. It renders after every body
# chapter, so all page numbers it prints are already final; it is populated
# identically on every pass of the footnote loop, so page counts stay
# consistent across passes.
doc << "\nifndef::ebook-edition[]\n[#scripture-index]\n== Scripture Index\nendif::[]\n"
warn '  + Scripture Index  (generated from citations by extension.rb; print/screen only)'

back_entries.each do |c|
  case c[:edition]
  when 'digital' then doc << "\nifndef::print-edition[]\n"
  when 'print'   then doc << "\nifdef::print-edition[]\n"
  end
  doc << "\n[##{c[:slug]}]\n== #{c[:title]}\n\n"
  # Same ebook-only plate injection as the main chapters (the author portrait).
  if (plate = TradePdfConverter::CHAPTER_PLATES[c[:slug]])
    master = [plate.sub('images/print/', 'images/masters/'), plate].find { |f| File.exist? File.join(SRC, f) }
    if master
      twin = plate.sub 'images/print/', 'images/ebook/'
      $ebook_image_jobs[twin] = master
      doc << "ifdef::ebook-edition[]\n\nimage::#{twin}[#{c[:title]}]\n\nendif::[]\n\n"
    end
  end
  doc << c[:body] << "\n"
  doc << "\nendif::[]\n" if c[:edition]
  warn "  + #{c[:title]}  (#{c[:file]}, back matter#{c[:edition] ? ", #{c[:edition]}-only" : ''})"
end

# Inline parenthetical citations render abbreviated in the BUILT editions
# (author's ruling 2026-07-08; the web keeps full names — Jekyll reads the
# sources directly). Block-quote attributions and epigraphs keep full names
# (display typography). The Scripture Index already recognizes these
# abbreviations via SX_ALIASES.
CITE_ABBR = {
  'Genesis'=>'Gen','Exodus'=>'Ex','Leviticus'=>'Lev','Numbers'=>'Num','Deuteronomy'=>'Deut',
  'Joshua'=>'Josh','Judges'=>'Judg','1 Samuel'=>'1 Sam','2 Samuel'=>'2 Sam',
  '1 Kings'=>'1 Kgs','2 Kings'=>'2 Kgs','1 Chronicles'=>'1 Chr','2 Chronicles'=>'2 Chr',
  'Nehemiah'=>'Neh','Esther'=>'Est','Psalms'=>'Ps','Psalm'=>'Ps','Proverbs'=>'Prov',
  'Ecclesiastes'=>'Eccl','Song of Solomon'=>'Song','Isaiah'=>'Isa','Jeremiah'=>'Jer',
  'Lamentations'=>'Lam','Ezekiel'=>'Ezek','Daniel'=>'Dan','Hosea'=>'Hos','Obadiah'=>'Obad',
  'Micah'=>'Mic','Nahum'=>'Nah','Habakkuk'=>'Hab','Zephaniah'=>'Zeph','Haggai'=>'Hag',
  'Zechariah'=>'Zech','Malachi'=>'Mal','Matthew'=>'Matt','Romans'=>'Rom',
  '1 Corinthians'=>'1 Cor','2 Corinthians'=>'2 Cor','Galatians'=>'Gal','Ephesians'=>'Eph',
  'Philippians'=>'Phil','Colossians'=>'Col','1 Thessalonians'=>'1 Thess',
  '2 Thessalonians'=>'2 Thess','1 Timothy'=>'1 Tim','2 Timothy'=>'2 Tim','Philemon'=>'Philem',
  'Hebrews'=>'Heb','James'=>'Jas','1 Peter'=>'1 Pet','2 Peter'=>'2 Pet','Revelation'=>'Rev',
}.freeze
CITE_ABBR_RX = /(?<=[(;] |\()(#{CITE_ABBR.keys.sort_by { |k| -k.length }.map { |k| Regexp.escape k }.join('|')})(?=\.?\s+\d)/
doc.gsub!(CITE_ABBR_RX) { CITE_ABBR[$1] }
warn "  ~ inline citations abbreviated (built editions only)"

$chapter_epigraphs = epigraph_map

# Page-bottom footnotes need to know which pages carry a marker before they are
# laid out (so only those pages get a reserved foot band). Render in a short
# converging loop: each pass reserves the pages found by the previous pass; once
# the detected set matches the reserved set, do one final pass that draws the
# notes. extension.rb reads $fn_reserve_pages / $fn_flush and reports
# $fn_detected_pages. See extension.rb for the rationale.
build_target = lambda do |media, out|
  render = lambda do |reserve_pages, do_flush|
    $fn_reserve_pages  = reserve_pages
    $fn_flush          = do_flush
    $fn_detected_pages = {}
    attrs = {
      'pdf-themesdir'       => DIR,
      # prepress carries 0.125in bleed on all sides (trade-bleed extends trade
      # with page + margin geometry only); screen stays at bare 6x9 trim
      'pdf-theme'           => (media == 'prepress' ? 'trade-bleed' : 'trade'),
      'pdf-fontsdir'        => FONTS,   # base fonts use explicit GEM_FONTS_DIR/ prefixes; Hebrew fonts resolve here
      'media'               => media,
      'hyphens'             => 'en',
      'imagesdir'           => SRC,
      'front-cover-image'   => "image:#{File.join(DIR, 'title-page.svg')}[fit=fill]",
    }
    # The paper edition trims digital-only chapters and long-form proof runs
    # (ifdef/ifndef::print-edition[] in the sources); screen and web keep them.
    attrs['print-edition'] = '' if media == 'prepress'
    Asciidoctor.convert doc,
      backend: 'pdf',
      safe: :unsafe,
      base_dir: SRC,
      to_file: out,
      mkdirs: true,
      attributes: attrs
    $fn_detected_pages.sort.to_h
  end

  fmt = ->(h) { '{' + h.map { |pg, pts| "#{pg}:#{pts}pt" }.join(', ') + '}' }
# Converge on the EXACT fixed point: each pass reserves precisely the bands the
# previous pass needed. When a pass's needs equal its own reserve, the flush is
# guaranteed (that very layout proved the bands sufficient) AND no page carries
# a stale band from an earlier pass — stale bands shorten pages invisibly and
# bump block quotes into phantom gaps. If markers oscillate (a band on page N
# pushing its own marker to N+1 and back), fall back to the old max-union
# reserve, which cannot flip-flop, and grow it until safe.
RESERVE_CACHE = File.join(DIR, ENV['NO_PLATES'] ? '.fn-reserve-noplates.json' : '.fn-reserve.json')
reserve = begin
  JSON.parse(File.read(RESERVE_CACHE)).transform_keys(&:to_i)
rescue StandardError
  {}
end
warn "  footnote reserve warm-start: #{reserve.size} pages cached" unless reserve.empty?
passes  = 0
history = []
loop do
  passes += 1
  detected = render.call reserve, false
  warn "  footnote pass #{passes}: reserved #{fmt.call reserve} -> needed #{fmt.call detected}"
  break if detected == reserve                     # exact fixed point — no stale bands
  if history.include?(detected) || passes >= 10
    # Union ONLY the current state with the detected needs — unioning the whole
    # pass history drags in early-pass page numbers (shifted layouts) and litters
    # the book with stale bands.
    warn "  footnote layout oscillating — reserving the union of the cycle"
    detected.each { |pg, h| reserve[pg] = [reserve[pg] || 0, h].max }
    last_needed = nil
    loop do
      passes += 1
      verify = render.call reserve, false
      warn "  footnote pass #{passes} (union): reserved #{fmt.call reserve} -> needed #{fmt.call verify}"
      last_needed = verify
      break if verify.all? { |pg, h| reserve[pg] && reserve[pg] >= h } || passes >= 16
      verify.each { |pg, h| reserve[pg] = [reserve[pg] || 0, h].max }
    end
    # Prune: union pages the settled layout no longer needs keep a phantom band
    # that shortens the page and bumps block quotes. Try the exact needed-set
    # once; keep it only if a fresh pass proves it sufficient.
    if last_needed && last_needed.keys.sort != reserve.keys.sort
      pruned = {}
      last_needed.each { |pg, h| pruned[pg] = [reserve[pg] || 0, h].max }
      passes += 1
      check = render.call pruned, false
      if check.all? { |pg, h| pruned[pg] && pruned[pg] >= h }
        warn "  footnote pass #{passes} (prune): accepted #{fmt.call pruned}"
        reserve = pruned
      else
        warn "  footnote pass #{passes} (prune): rejected — keeping union"
      end
    end
    break
  end
  history << detected
  reserve = detected.dup
end
warn "  footnote layout settled after #{passes} passes: #{fmt.call reserve}"
File.write(RESERVE_CACHE, JSON.generate(reserve)) rescue nil
render.call reserve, true

  warn "Wrote: #{out}  (media=#{media})"
end

TARGETS.each { |media, out| build_target.call media, out }

# --- EPUB (the ebook edition): one pass, no footnote loop (notes render as
# chapter endnotes), no Scripture Index (no page numbers to index). The ebook
# MATCHES THE PRINT EDITION (author's ruling 2026-07-08): print-edition is set,
# so the digital-only chapters stay web-only; the color plates and epigraphs
# ride in via the ebook-edition blocks injected above.
if WANT_EPUB
  require 'asciidoctor-epub3'
  epub_out = File.join(DIR, 'the-bibles-symbolic-language.epub')

  # Downsized image twins (plates >100MB in the masters; stores charge
  # delivery by the MB): longest side 1600px, JPEG. Regenerated when stale.
  $ebook_image_jobs.each do |twin, master|
    t, m = File.join(SRC, twin), File.join(SRC, master)
    next if File.exist?(t) && File.mtime(t) >= File.mtime(m)
    system('sips', '-Z', '1600', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80',
           m, '--out', t, out: File::NULL, err: File::NULL) or abort "sips failed: #{master}"
    warn "  ~ #{twin}  (ebook twin of #{master})"
  end

  epub_doc = doc.dup

  # Chapter-permalink links become internal cross-references; links to
  # web-only chapters become absolute site URLs (a bare /books/... path
  # would dead-end inside an e-reader).
  aboard = (main_entries + back_entries).reject { |c| c[:edition] == 'digital' }
                                        .map { |c| c[:slug] }
  epub_doc.gsub!(%r{link:/books/symbolic-language/([a-z0-9-]+)/\[([^\]]*)\]}) do
    slug, text = $1, $2
    aboard.include?(slug) ? "<<#{slug},#{text}>>" : %(https://timetested.bible/books/symbolic-language/#{slug}/[#{text}])
  end

  # Glossary verdict badges: restore the macro form (the [.verdict] rewrite
  # above is for the PDF theme role; the ebook takes symbol_macro.rb's
  # floated-span rendering, same as the web).
  epub_doc.gsub!(/ +\[\.verdict\]#([A-Z]+)#/) { %( verdict:#{$1.downcase}[]) }

  # Inline SVG diagrams -> pre-rasterized PNG twins where present (e-readers
  # don't carry the fonts the SVGs assume).
  epub_doc.gsub!(/^image::([\w-]+)\.svg\[/) do
    png = "#{$1}-ebook.png"
    File.exist?(File.join(SRC, png)) ? "image::#{png}[" : "image::#{$1}.svg["
  end

  $fn_reserve_pages, $fn_flush, $fn_detected_pages = {}, false, {}
  Asciidoctor.convert epub_doc,
    backend: 'epub3',
    safe: :unsafe,
    base_dir: SRC,
    to_file: epub_out,
    mkdirs: true,
    attributes: {
      'ebook-edition'     => '',
      'print-edition'     => '',   # the ebook carries the print edition's content
      'docfile'           => File.join(SRC, 'book.adoc'),  # synthetic (doc is a string); gives epub3 a docdir to resolve media against
      'imagesdir'         => '.',  # relative — epub3's media copier joins it to docdir; an absolute dir gets double-joined
      'front-cover-image' => 'cover/front-cover-summit-meat.jpg',
      'epub3-stylesdir'   => File.join(DIR, 'epub-styles'),  # stock gem styles + list-marker fix (see epub3.scss tail)
      'uuid'              => 'urn:isbn:9781736521168',
    }
  warn "Wrote: #{epub_out}  (epub3, print-edition content)"
end
