#!/usr/bin/env ruby
# Build the trade-paperback (6x9) PDF of "The Bible's Symbolic Language".
#
# Replaces the old bash/awk pipeline with the Asciidoctor Ruby API:
#   - real YAML parsing of each chapter's Jekyll front matter (title, epigraphs)
#   - a treeprocessor extension (extension.rb) for the quote/citation transform
#   - asciidoctor-pdf for rendering, with the trade theme
#
# Usage:
#   ruby build.rb            # screen PDF (single pages) — proofing
#   ruby build.rb prepress   # print-ready: facing pages, gutter margins
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
MEDIA = (ARGV[0] || 'screen')
OUT   = File.join(DIR, 'the-bibles-symbolic-language.pdf')
NBSP  = '{nbsp}'

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
  = The Bible's Symbolic Language
  :doctype: book
  :lang: en
  :notitle:
  :toc:
  :toc-title: Contents
  :toclevels: 1
ADOC

# Epigraphs are rendered ABOVE each chapter title by the converter override in
# extension.rb (so we keep real chapters → TOC + bookmarks). Collect them here,
# keyed by chapter id (the slug), and expose via the global the converter reads.
epigraph_map = {}

chapters.each do |path|
  fm, body = split_front_matter(File.read(path))
  slug  = fm['slug'] || File.basename(path, '.adoc').sub(/^\d+[-_]/, '')
  title = fm['title'] || slug
  epigraph_map[slug] = fm['epigraphs'] if fm['epigraphs'].is_a?(Array) && !fm['epigraphs'].empty?

  # Real chapter: auto page break, TOC entry, PDF bookmark, running head.
  doc << "\n[##{slug}]\n== #{title}\n\n"
  doc << body.strip << "\n"

  warn "  + #{title}  (#{File.basename(path)})"
end

$chapter_epigraphs = epigraph_map

# Page-bottom footnotes need to know which pages carry a marker before they are
# laid out (so only those pages get a reserved foot band). Render in a short
# converging loop: each pass reserves the pages found by the previous pass; once
# the detected set matches the reserved set, do one final pass that draws the
# notes. extension.rb reads $fn_reserve_pages / $fn_flush and reports
# $fn_detected_pages. See extension.rb for the rationale.
render = lambda do |reserve_pages, do_flush|
  $fn_reserve_pages  = reserve_pages
  $fn_flush          = do_flush
  $fn_detected_pages = []
  Asciidoctor.convert doc,
    backend: 'pdf',
    safe: :unsafe,
    base_dir: SRC,
    to_file: OUT,
    mkdirs: true,
    attributes: {
      'pdf-themesdir'       => DIR,
      'pdf-theme'           => 'trade',
      'pdf-fontsdir'        => FONTS,   # base fonts use explicit GEM_FONTS_DIR/ prefixes; Hebrew fonts resolve here
      'media'               => MEDIA,
      'hyphens'             => 'en',
      'imagesdir'           => SRC,
      'front-cover-image'   => "image:#{File.join(DIR, 'title-page.svg')}[fit=fill]",
    }
  $fn_detected_pages.uniq.sort
end

reserve  = []
detected = []
converged = false
6.times do |i|
  detected = render.call reserve, false
  warn "  footnote pass #{i + 1}: reserved #{reserve.inspect} -> markers on #{detected.inspect}"
  if detected == reserve
    converged = true
    break
  end
  reserve = detected
end
final_reserve = converged ? reserve : (reserve | detected).sort
warn "  footnote layout #{converged ? 'converged' : 'did not converge — reserving union'}: #{final_reserve.inspect}"
render.call final_reserve, true

warn "Wrote: #{OUT}  (media=#{MEDIA})"
