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
  = MEAT: The Bible's Symbolic Language
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

# --- Parts: the book's five movements plus the appendices. Keyed by the slug
# of the chapter that OPENS each part; a level-0 part heading (real book part:
# own page, nested TOC) with a short opener is emitted before that chapter.
PARTS = {
  'introduction' => ['Part One — The Key', <<~TXT],
    Scripture speaks a symbolic language, and it expects its readers to learn it.
    This part states the method and sits the exam Jesus Himself graded — the parables of the kingdom, derived from the Scriptures the disciples already held — then works the language's first grammar: the mountain, the sea, the sign.
    It ends inside the sign of Jonah, where one prophet's life is read as a single similitude.
  TXT
  'gospel' => ['Part Two — The Covenant', <<~TXT],
    The gospel is a king's proclamation, and its content is a covenant.
    This part gathers the covenant's own vocabulary — the way, the name, the marriage, the bow — and finds beneath them one binding thing: the law of the kingdom, going forth from Zion, taking a people as a bride takes a name.
  TXT
  'the-four-winds' => ['Part Three — The Scattering', <<~TXT],
    Nations are trees and people are grass, and a bride who broke covenant was divorced and scattered to the four winds.
    This part follows the two houses of Israel through their garments, their wings, their widowhood and orphanhood, to the fall of the city that holds them captive — and to the remnant God has always kept.
    Its summit is a name: who Babylon is, and the call that ends her chapter — come out of her, my people.
  TXT
  'knowing-faith-love-and-belief' => ['Part Four — The Usurper', <<~TXT],
    To spot a counterfeit, first know the true.
    This part learns discernment — what it is to know, who the fool and the wise are, what light and darkness do — then reads the fourth day's sky as Scripture assigns it: sun, moon, and stars in their offices.
    Then it opens the enemy's plan, published out of his own heart: a throne that is a moon, raised over the appointed times — and finds the pearl of great price hanging where no tradition thought to look.
  TXT
  'shadow' => ['Part Five — The Verdict', <<~TXT],
    Once the method holds, the conclusions are arithmetic.
    This part weighs the shadow against the substance, justice against the case of the fatherless, liberty against the year of release, worship against the calendar it keeps, and the fear of the LORD against the fear of man.
    It ends where the book has aimed from the first page: the path to salvation.
  TXT
  'clouds' => ['Appendices', <<~TXT],
    Three symbol studies that stand on their own, for the reader still hungry — and the glossary that indexes every symbol this book proves.
  TXT
}

# Main chapters: auto page break, TOC entry, PDF bookmark, running head.
main_entries.each do |c|
  if (part = PARTS[c[:slug]])
    doc << "\n= #{part[0]}\n\n#{part[1]}\n"
    warn "  = #{part[0]}"
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
# Safety criterion, not equality: the loop stops when every page that NEEDS a
# band already has one at least as tall as needed (detected SUBSET-OF reserve).
# The reserve only ever grows (max-union per pass), so oscillating markers —
# a band on page N pushing its own marker to N+1 and back — cannot flip-flop
# forever; both pages simply end up reserved. A reserved page whose marker
# moved away keeps a small empty band (a slightly short page) — invisible,
# and the price of a guarantee: the final flush pass renders with the exact
# reserve that its own measuring pass proved sufficient, so a drawn note can
# never land on an unreserved page (which printed notes OVER body text).
reserve = {}
passes  = 0
loop do
  passes += 1
  detected = render.call reserve, false
  warn "  footnote pass #{passes}: reserved #{fmt.call reserve} -> needed #{fmt.call detected}"
  safe = detected.all? { |pg, h| reserve[pg] && reserve[pg] >= h }
  break if safe
  if passes >= 12
    warn "  footnote layout did not settle in 12 passes — reserving union and proceeding"
    detected.each { |pg, h| reserve[pg] = [reserve[pg] || 0, h].max }
    break
  end
  detected.each { |pg, h| reserve[pg] = [reserve[pg] || 0, h].max }
end
warn "  footnote layout settled after #{passes} passes: #{fmt.call reserve}"
render.call reserve, true

  warn "Wrote: #{out}  (media=#{media})"
end

TARGETS.each { |media, out| build_target.call media, out }
