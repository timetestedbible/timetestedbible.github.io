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
TARGETS = case (ARGV[0] || 'all')
          when 'all'               then ALL_TARGETS
          when 'print', 'prepress' then ALL_TARGETS.slice('prepress')
          when 'screen'            then ALL_TARGETS.slice('screen')
          else abort "Unknown target #{ARGV[0].inspect} — use print, screen, or no argument for both"
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

front_entries = []
main_entries  = []
chapters.each do |path|
  fm, body = split_front_matter(File.read(path))
  slug  = fm['slug'] || File.basename(path, '.adoc').sub(/^\d+[-_]/, '')
  title = fm['title'] || slug
  epigraph_map[slug] = fm['epigraphs'] if fm['epigraphs'].is_a?(Array) && !fm['epigraphs'].empty?
  (fm['front_matter'] ? front_entries : main_entries) << { slug: slug, title: title, body: body.strip, file: File.basename(path) }
end

# Front matter (e.g. the copyright page): rendered BEFORE the Contents as untitled
# colophon pages — no chapter heading, no TOC entry, and, sitting ahead of the body,
# no running head or page number. Flag a file with `front_matter: true` in its YAML.
front_entries.each do |c|
  doc << "\n" << c[:body] << "\n\n<<<\n"
  warn "  · #{c[:title]}  (front matter, #{c[:file]})"
end

# Contents — placed here, after the front matter and before the chapters.
doc << "\ntoc::[]\n"

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

# Main chapters: auto page break, TOC entry, PDF bookmark, running head.
main_entries.each do |c|
  if (part = PARTS[c[:slug]])
    doc << "\n= #{part}\n"
    warn "  = #{part}"
  end
  doc << "\n[##{c[:slug]}]\n== #{c[:title]}\n\n" << c[:body] << "\n"
  warn "  + #{c[:title]}  (#{c[:file]})"
end

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
    Asciidoctor.convert doc,
      backend: 'pdf',
      safe: :unsafe,
      base_dir: SRC,
      to_file: out,
      mkdirs: true,
      attributes: {
        'pdf-themesdir'       => DIR,
        'pdf-theme'           => 'trade',
        'pdf-fontsdir'        => FONTS,   # base fonts use explicit GEM_FONTS_DIR/ prefixes; Hebrew fonts resolve here
        'media'               => media,
        'hyphens'             => 'en',
        'imagesdir'           => SRC,
        'front-cover-image'   => "image:#{File.join(DIR, 'title-page.svg')}[fit=fill]",
      }
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
reserve = {}
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
render.call reserve, true

  warn "Wrote: #{out}  (media=#{media})"
end

TARGETS.each { |media, out| build_target.call media, out }
