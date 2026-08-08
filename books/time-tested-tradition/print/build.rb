#!/usr/bin/env ruby
# Build the trade-paperback (6x9) PDF of "Time Tested Tradition" (2nd edition).
#
# macOS still ships Ruby 2.6 at /usr/bin/ruby. It is too old for this bundle
# and does not see the project's gems. Keep this bootstrap above every require
# so even `ruby build.rb` repairs the interpreter before loading the build.
major, minor = RUBY_VERSION.split('.').first(2).map(&:to_i)
if major < 3 || (major == 3 && minor < 1)
  if ENV['TIMETESTED_RUBY_BOOTSTRAPPED'] == '1'
    abort "The selected replacement Ruby is also too old: #{RUBY_DESCRIPTION}"
  end
  candidates = [
    ENV['TIMETESTED_RUBY'],
    '/opt/homebrew/opt/ruby/bin/ruby', # Apple Silicon Homebrew
    '/usr/local/opt/ruby/bin/ruby',    # Intel Homebrew
  ].compact
  replacement = candidates.find { |path| File.file?(path) && File.executable?(path) }
  unless replacement
    abort <<~MSG
      This build requires Ruby 3.1 or newer; #{RUBY_DESCRIPTION} is too old.
      Install Homebrew Ruby (`brew install ruby`) or set TIMETESTED_RUBY to a
      compatible Ruby executable.
    MSG
  end
  warn "System Ruby #{RUBY_VERSION} detected; restarting with #{replacement}"
  exec({ 'TIMETESTED_RUBY_BOOTSTRAPPED' => '1' }, replacement, File.expand_path(__FILE__), *ARGV)
end

# Resolve the declared project bundle no matter which directory launched the
# script. This keeps the PDF and EPUB renderers on the versions in Gemfile.lock.
repo_root = File.expand_path('../../..', __dir__)
ENV['BUNDLE_GEMFILE'] ||= File.join(repo_root, 'Gemfile')
if ARGV.first == 'setup'
  require 'rbconfig'
  bundle = File.join(File.dirname(RbConfig.ruby), 'bundle')
  abort "Bundler was not found beside #{RbConfig.ruby}" unless File.executable? bundle
  Dir.chdir repo_root
  exec bundle, 'install'
end
begin
  require 'bundler/setup'
rescue Bundler::GemNotFound => e
  abort "#{e.message}\nRun #{File.basename(__FILE__)} setup once to install the locked bundle."
end
#
# Replaces the old bash/awk pipeline with the Asciidoctor Ruby API:
#   - real YAML parsing of each chapter's Jekyll front matter (title, epigraphs)
#   - a treeprocessor extension (extension.rb) for the quote/citation transform
#   - asciidoctor-pdf for rendering, with the trade theme
#
# Usage:
#   ./build.rb               # BOTH PDFs: print (prepress — the default artifact
#                            # we edit and iterate on) and screen (refined later)
#   ./build.rb print         # print-ready only: facing pages, gutter margins
#   ./build.rb screen        # screen only: single pages
#   ./build.rb setup         # first checkout: install the locked bundle
#   ruby build.rb print      # also supported; auto-restarts out of system Ruby
#
# Outputs:
#   time-tested-tradition-print.pdf    (media=prepress)
#   time-tested-tradition-screen.pdf   (media=screen)
#
# First checkout only: bundle install
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
  'prepress' => File.join(DIR, 'time-tested-tradition-print.pdf'),
  'screen'   => File.join(DIR, 'time-tested-tradition-screen.pdf'),
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
# Assembly order: the front-matter `order` field (fractional inserts), falling
# back to the filename prefix — chapters resequence without file renames.
chapters = chapters.sort_by do |path|
  fm, = split_front_matter(File.read(path))
  (fm['order'] || File.basename(path)[/\A[\d.]+/].to_f).to_f
end
abort "No chapter files (NN-name.adoc) in #{SRC}" if chapters.empty?

doc = +<<~ADOC
  = Time Tested Tradition: The Renewed Biblical Calendar
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
# Printed chapter numbers (author's ruling 2026-07-13: "number the books
# fully") are assigned POSITIONALLY after back matter is removed — see the
# $chapter_numbers block below. extension.rb reads the map for the opener's
# CHAPTER N kicker, the numbered Contents entries, and the Scripture Index's
# "(ch N)" locator groups.
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
  # Author's grouping (2026-07-18): evidence rules, the proactive case, the
  # sabbath tests, the year of the cross, then what the evidence demands.
  'introduction'           => 'Part One — The Rules of Evidence',
  'sun-moon-and-stars'     => 'Part Two — The Case for the Biblical Calendar',
  'when-is-the-sabbath'    => 'Part Three — Testing the Sabbath',
  '32-ad-resurrection'     => 'Part Four — The Year of the Cross',
  'herod-the-great'        => 'Part Five — The Reign of Herod the Great',
  'the-path-to-salvation'  => 'Part Six — Salvation and Obedience',
  'evidence-outline'       => 'Part Seven — Reference',
}

# Back matter, rendered AFTER the generated Scripture Index: the Bibliography
# (sources page, both editions), the Further Studies pointer page (print-only;
# a compact section, not a full chapter opening — author's ruling 2026-07-07),
# then About the Author closes the book.
BACK_SLUGS = %w[bibliography further-studies about-the-author].freeze
back_entries = main_entries.select { |c| BACK_SLUGS.include? c[:slug] }
                           .sort_by { |c| BACK_SLUGS.index c[:slug] }
main_entries -= back_entries
# POSITIONAL numbering — the Nth print chapter in assembly order, not
# filename-derived, so the x-inserts (03x, 07x, 15x1, 15x2, 15x4) count and
# every print chapter carries a number (author's ruling 2026-07-18, matching
# MEAT's 2026-07-14 rule). Unnumbered: digital-only chapters, 00- openers,
# and back matter.
NUMBER_EXEMPT_SLUGS = %w[bibliography further-studies about-the-author glossary].freeze
$chapter_numbers = {}
main_entries.each do |c|
  next if NUMBER_EXEMPT_SLUGS.include?(c[:slug]) || c[:edition] == 'digital' || c[:file].start_with?('00')
  $chapter_numbers[c[:slug]] = ($chapter_numbers.size + 1)
end

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
      # Run-in entries (mirrors MEAT's latest layout, author 2026-07-18): the
      # dlist term joins the definition's first line — dictionary convention.
      # The [[sym-…]] anchor becomes the paragraph's block id; [.glossrunin]
      # hangs the turnover lines (extension.rb).
      if blk =~ /\A\[\[(sym-[^\]]+)\]\]([^\n]+?)::[ \t]*(.*)\z/m
        anchor, term, rest = $1, $2, $3
        term = term.sub(/\A(.+?)(\s+\[\.verdict\]#[A-Z]+#)?\z/) { "*#{$1}*#{$2}" }
        blk = "[[#{anchor}]]\n[.glossrunin]\n#{term} #{rest}"
      end
      "[.glossentry]\n--\n#{blk}\n--"
    }.join("\n\n")
  end
  # The ebook cannot run the PDF converter's chapter machinery, so the plate
  # (the COLOR master — the print pipeline uses the grayscale twin) and the
  # epigraphs are injected as ebook-only blocks; the PDF passes never set
  # ebook-edition, so its pagination is untouched.
  # Ebook chapter opening (ported from MEAT, 2026-07-20): the reflow engine
  # has no verso/recto identity, so the opening page joins art and title —
  # the auto chapter header is hidden by CSS (header.chapter-header) and the
  # plate, epigraphs, part kicker, and echoed title flow together at the top.
  ebook_front = +''
  if (plate = TradePdfConverter::CHAPTER_PLATES[c[:slug]])
    color  = plate.sub 'images/print/', 'images/masters/'
    master = [color, plate].find { |f| File.exist? File.join(SRC, f) }
    if master
      # Reference a downsized twin in images/ebook/ (the masters total >100MB;
      # stores charge delivery by the MB). The epub branch generates twins.
      twin = plate.sub 'images/print/', 'images/ebook/'
      $ebook_image_jobs[twin] = master
      # Use a named, quoted alt attribute: positional image attributes treat
      # commas in chapter titles as width/height separators, producing invalid
      # width="..." values in the EPUB XHTML (epubcheck RSC-005).
      ebook_front << "[.chapter-plate]\nimage::#{twin}[alt=\"#{c[:title]}\"]\n\n"
    end
  end
  (epigraph_map[c[:slug]] || []).each do |e|
    ebook_front << "[quote]\n____\n_#{e['quote']}_\n\n[.text-right.citation]\n— #{e['ref']}\n____\n\n"
  end
  ebook_front << "[.part-kicker]\n#{part.upcase}\n\n" if part
  ebook_front << "[.chapter-title-echo]\n#{c[:title]}\n\n"
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
      doc << "ifdef::ebook-edition[]\n\nimage::#{twin}[alt=\"#{c[:title]}\"]\n\nendif::[]\n\n"
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
    # Free digital outputs are the living draft of the NEXT edition: labeled,
    # dated, no ISBN (the ISBN belongs to the published edition of record).
    unless media == 'prepress'
      attrs['draft-edition'] = ''
      attrs['draft-date']    = Time.now.strftime('%Y-%m-%d')
    end
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
# One cache per media: prepress and screen paginate differently (screen keeps
# the digital-only chapters), so seeding one from the other's settled reserve
# plants bands on the wrong pages — and a band landing on a plate page leaves
# no room for the caption, which raises an uncaught CannotFit mid-pass.
reserve_cache = File.join(DIR, ".fn-reserve-#{media}#{'-noplates' if ENV['NO_PLATES']}.json")
reserve = begin
  JSON.parse(File.read(reserve_cache)).transform_keys(&:to_i)
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
File.write(reserve_cache, JSON.generate(reserve)) rescue nil
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
  epub_out = File.join(DIR, 'time-tested-tradition.epub')

  # Downsized image twins (plates >100MB in the masters; stores charge
  # delivery by the MB): longest side 1600px, JPEG. Regenerated when stale.
  $ebook_image_jobs.each do |twin, master|
    t, m = File.join(SRC, twin), File.join(SRC, master)
    require 'fileutils'; FileUtils.mkdir_p File.dirname(t)   # sips writes a FILE named after a missing dir
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
  # Reader deep-links (e.g. the LXX passages) leave the book: point them at
  # the live site so the EPUB container stays self-contained (RSC-026).
  epub_doc.gsub!(%r{link:/reader/}) { 'link:https://timetested.bible/reader/' }
  epub_doc.gsub!(%r{link:/books/time-tested-tradition/([a-z0-9-]+)/(?:#([a-z0-9-]+))?\[([^\]]*)\]}) do
    slug, fragment, text = $1, $2, $3
    if aboard.include? slug
      "<<#{fragment || slug},#{text}>>"
    else
      suffix = fragment ? %(##{fragment}) : ''
      %(https://timetested.bible/books/time-tested-tradition/#{slug}/#{suffix}[#{text}])
    end
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
      'draft-edition'     => '',   # free epub = living draft of the next edition
      'draft-date'        => Time.now.strftime('%Y-%m-%d'),
      'print-edition'     => '',   # the ebook carries the print edition's content
      'docfile'           => File.join(SRC, 'book.adoc'),  # synthetic (doc is a string); gives epub3 a docdir to resolve media against
      'imagesdir'         => '',   # empty, NOT '.': a '.' imagesdir packages media at EPUB/./images/… with "./" hrefs, which Apple Books renders as dead images (2026-07-18)
      # Package the lossless 1800x2700 cover master; the submission edition
      # must not add JPEG artifacts to the cover typography or night sky.
      'front-cover-image' => 'cover/ttt-front-second-edition-6x9.png',
      'epub3-stylesdir'   => File.join(DIR, 'epub-styles'),  # stock gem styles + list-marker fix (see epub3.scss tail)
      # Apple Books dedupes imports by identifier — review builds need a fresh
      # id per build (2026-07-19). Pass EPUB_ISBN=<digits> for the release
      # build once the ebook's own ISBN is assigned (the print ISBN must not
      # ride in the epub).
      'uuid'              => (ENV['EPUB_ISBN'] ? %(urn:isbn:#{ENV['EPUB_ISBN']}) : begin require 'securerandom'; %(urn:uuid:#{SecureRandom.uuid}) end),
    }

  # asciidoctor-epub3 only packages its stock font set. Add the monochrome
  # Noto Emoji face used by the Evidence Outline and declare it in the OPF so
  # the icons do not depend on whichever emoji font an e-reader happens to
  # provide. Noto Emoji is OFL-licensed alongside the other bundled Noto fonts.
  require 'zip'
  emoji_font_name = 'NotoEmoji-VariableFont_wght.ttf'
  emoji_font_path = File.join(FONTS, emoji_font_name)
  Zip::File.open(epub_out) do |archive|
    archive.get_output_stream("EPUB/fonts/#{emoji_font_name}") do |stream|
      stream.write File.binread(emoji_font_path)
    end
    opf_path = 'EPUB/package.opf'
    opf = archive.read opf_path
    unless opf.include? %(href="fonts/#{emoji_font_name}")
      declaration = %(    <item id="item_noto-emoji" href="fonts/#{emoji_font_name}" media-type="application/vnd.ms-opentype"/>\n)
      opf = opf.sub('  </manifest>', %(#{declaration}  </manifest>))
      archive.get_output_stream(opf_path) { |stream| stream.write opf }
    end
  end
  # asciidoctor-epub3 2.3.0: an empty imagesdir slips past its '.' check and
  # prefixes the packaged cover href as '/jacket/…' — an absolute path readers
  # drop, rendering the cover page as a broken '?'. Repair the package in place.
  Zip::File.open(epub_out) do |zip|
    zip.entries.select { |e| e.name.include? '//jacket/' }
       .each { |e| zip.rename e.name, (e.name.sub '//jacket/', '/jacket/') }
    %w[EPUB/package.opf EPUB/front-cover.xhtml].each do |n2|
      next unless (entry = zip.find_entry n2)
      body = entry.get_input_stream.read
      zip.get_output_stream(n2) { |os| os.write(body.gsub('"/jacket/', '"jacket/')) }
    end
  end
  warn '  ~ cover href repaired (imagesdir-"" jacket bug in asciidoctor-epub3 2.3.0)'

  # Trade convention: the copyright page (the document preamble) reads before
  # the table of contents, exactly as the print edition orders it.
  # asciidoctor-epub3 hard-codes the nav directly after the cover; swap it
  # with the preamble in the spine.
  Zip::File.open(epub_out) do |zip|
    opf = zip.read 'EPUB/package.opf'
    toc_ref = opf[/^\s*<itemref idref="toc"[^>]*>\n/]
    pre_ref = opf[/^\s*<itemref idref="item__preamble"[^>]*>\n/]
    if toc_ref && pre_ref && opf.index(toc_ref) < opf.index(pre_ref)
      opf = opf.sub(toc_ref, '').sub(pre_ref, pre_ref + toc_ref)
      zip.get_output_stream('EPUB/package.opf') { |os| os.write opf }
      warn '  ~ spine reordered: copyright page now precedes the toc'
    end
  end

  # Symbol popups (ported from MEAT, 2026-07-20): Apple Books renders
  # epub:type=noteref anchors as popup notes. Every symbol xref becomes a
  # noteref onto a local aside carrying the glossary's one-line definition —
  # no visible marker; the popup links on to the full glossary entry.
  esc = ->(str) { str.gsub('&', '&amp;').gsub('<', '&lt;').gsub('>', '&gt;') }
  sym_defs = {}
  glossary_body = ((main_entries + back_entries).find { |c| c[:slug] == 'glossary' } || {})[:body].to_s
  glossary_body.scan(/^\[\[(sym-[a-z0-9-]+)\]\](.+?)::\s*(.+)$/) do |key, term, defn|
    term = term.sub(/\s*verdict:\w+\[\]\s*/, '').gsub(/[_*]/, '').strip
    d = defn.sub(/\s*\+\s*\z/, '')
           .gsub(/sym:(?:sym-)?[a-z0-9-]+\[([^\]]*)\]/) { Regexp.last_match(1) }
           .gsub(/[_*#]/, '')
    sym_defs[key] = [esc.call(term), esc.call(d)]
  end
  popup_chunks = 0
  Zip::File.open(epub_out) do |zip|
    zip.entries.select { |e| e.name =~ %r{\AEPUB/[^/]+\.xhtml\z} }.each do |entry|
      html = entry.get_input_stream.read.force_encoding('UTF-8')
      used = html.scan(/href="glossary\.xhtml#(sym-[a-z0-9-]+)"/).flatten.uniq
                 .select { |k| sym_defs.key? k }
      next if used.empty?
      html = html.sub('<html ', '<html xmlns:epub="http://www.idpf.org/2007/ops" ') unless html.include? 'xmlns:epub'
      html = html.gsub(/<a ([^>]*?)href="glossary\.xhtml#(sym-[a-z0-9-]+)"([^>]*?)>/) do
        pre, key, post = Regexp.last_match.captures
        sym_defs.key?(key) ? %(<a #{pre}href="#symdef-#{key}"#{post} epub:type="noteref">) : Regexp.last_match(0)
      end
      asides = used.map { |k|
        t, d = sym_defs[k]
        %(<aside epub:type="footnote" id="symdef-#{k}" class="symdef"><p style="line-height:1.6;margin:0.4em 0;"><strong>#{t}.</strong> #{d} <a style="color:#B8860B;" href="glossary.xhtml##{k}">Glossary&#160;&#8594;</a></p></aside>)
      }.join("\n")
      html = html.sub(%r{</body>}) { "#{asides}\n</body>" }
      zip.get_output_stream(entry.name) { |os| os.write html }
      popup_chunks += 1
    end
  end
  warn "  ~ symbol popups injected (#{sym_defs.size} definitions across #{popup_chunks} chapters)"

  # Scripture citation popups (author, 2026-07-21): every inline citation —
  # "(Gen 1:14)", "(John 6:53, 56)", "(Ps 89:36-37)" — becomes a noteref onto
  # a local aside carrying the full KJV verse text, so the reader checks the
  # verse without leaving the page. Citations inside quote attributions,
  # existing links, and other popups are left alone; citations labeled with a
  # non-KJV version are skipped (the popup would misquote the cited edition).
  kjv = {}
  File.foreach(File.expand_path('../../../bibles/kjv_strongs.txt', __dir__)) do |line|
    ref, text = line.chomp.split("\t", 2)
    next unless text
    kjv[ref] = text.gsub(/\{[^}]*\}/, '').squeeze(' ').strip
  end
  abbr_to_full = CITE_ABBR.invert            # 'Gen' => 'Genesis', 'Ps' => 'Psalms', …
  book_names = (CITE_ABBR.keys + CITE_ABBR.values +
                %w[John Mark Luke Acts Jude Titus Ruth Ezra Joel Amos Jonah 1\ John 2\ John 3\ John Philemon]).uniq
  book_rx = Regexp.union(book_names.sort_by { |b| -b.length })
  cite_rx = /\b(#{book_rx.source})\s+(\d+):(\d+(?:[-\u2013]\d+)?(?:,\s*\d+(?:[-\u2013]\d+)?)*)/
  version_tail_rx = /\A\s*,\s*(?:NKJV|ASV|AKJV|NIV|ESV|YLT|NASB|LXX|Brenton)/

  resolve_book = ->(name) { abbr_to_full[name] || { 'Psalm' => 'Psalms' }[name] || name }
  verse_span = ->(book, chap, spec) {
    verses = []
    spec.split(/,\s*/).each do |part|
      a, b = part.split(/[-\u2013]/).map(&:to_i)
      (a..(b || a)).each { |v| verses << v }
    end
    verses.uniq.first(5).map { |v| [v, kjv["#{book} #{chap}:#{v}"]] }
  }

  vref_total = 0
  Zip::File.open(epub_out) do |zip|
    zip.entries.select { |e| e.name =~ %r{\AEPUB/[^/]+\.xhtml\z} }.each do |entry|
      next if entry.name =~ /glossary|bibliography|scripture-index/
      html = entry.get_input_stream.read.force_encoding('UTF-8')
      asides = {}
      depth_a = depth_aside = depth_footer = 0
      out = html.split(/(<[^>]+>)/).map do |tok|
        if tok.start_with?('<')
          case tok
          when /\A<a[\s>]/       then depth_a += 1
          when %r{\A</a>}         then depth_a -= 1
          when /\A<aside[\s>]/   then depth_aside += 1
          when %r{\A</aside>}     then depth_aside -= 1
          when /\A<footer[\s>]/  then depth_footer += 1
          when %r{\A</footer>}    then depth_footer -= 1
          end
          tok
        elsif depth_a.positive? || depth_aside.positive? || depth_footer.positive?
          tok
        else
          tok.gsub(cite_rx) do |m|
            book_raw, chap, spec = Regexp.last_match.captures
            after = Regexp.last_match.post_match
            next m if after =~ version_tail_rx
            book = resolve_book.call(book_raw)
            verses = verse_span.call(book, chap, spec)
            next m if verses.empty? || verses.any? { |_, t| t.nil? }
            key = "kv-#{book.downcase.gsub(/[^a-z0-9]/, '')}-#{chap}-#{spec.gsub(/[^0-9]+/, '-')}".sub(/-\z/, '')
            unless asides.key?(key)
              body = verses.each_with_index.map { |(v, t), i|
                i.zero? ? esc.call(t) : %(<sup>#{v}</sup>&#160;#{esc.call(t)})
              }.join(' ')
              more = spec =~ /[-\u2013]/ && verses.length == 5 ? ' &#8230;' : ''
              asides[key] = %(<aside epub:type="footnote" id="#{key}" class="versedef"><p style="line-height:1.6;margin:0.4em 0;"><strong>#{esc.call(book)} #{chap}:#{esc.call(spec)} (KJV)</strong><br/>#{body}#{more}</p></aside>)
            end
            vref_total += 1
            %(<a href="##{key}" epub:type="noteref" style="color:inherit;text-decoration:none;border-bottom:1px dotted #B8860B;">#{m}</a>)
          end
        end
      end.join
      next if asides.empty?
      out = out.sub('<html ', '<html xmlns:epub="http://www.idpf.org/2007/ops" ') unless out.include? 'xmlns:epub'
      out = out.sub(%r{</body>}) { "#{asides.values.join("\n")}\n</body>" }
      zip.get_output_stream(entry.name) { |os| os.write out }
    end
  end
  warn "  ~ scripture citation popups injected (#{vref_total} citations)"
  warn "Wrote: #{epub_out}  (epub3, print-edition content)"
end
