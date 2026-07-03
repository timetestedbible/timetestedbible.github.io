#!/usr/bin/env ruby
# Reflow AsciiDoc body prose to ONE SENTENCE PER LINE (semantic line breaks).
#
# Why: AsciiDoc joins consecutive non-blank lines of a paragraph into one paragraph,
# so this renders identically to one-line-per-paragraph — but yields clean,
# sentence-level git diffs and readable raw source (AsciiDoc's recommended practice).
#
# It ONLY touches ordinary prose lines. It leaves untouched:
#   - YAML front matter (--- ... ---)
#   - // comments, [block.attrs], headings (= ...), list items, table rows (| ...)
#   - block delimiters (____ ---- .... ++++ ==== |===) and verbatim block contents
#   - dlist terms (term::) and any line ending in a hard break ( +)
# and it will not split on scripture/other abbreviations (Rev., ch., e.g., initials, ...).
#
# Usage:  ruby reflow-sentences.rb FILE.adoc [FILE.adoc ...]
#         ruby reflow-sentences.rb            # every .adoc in this directory

require 'set'

BOOK_ABBR = %w[
  Gen Exod Exo Ex Lev Num Deut Deu Josh Jos Judg Jdg Ruth Sam Kgs Kings Chr Chron Ezra Neh
  Esth Est Job Ps Psa Prov Pro Eccl Song Isa Jer Lam Ezek Eze Dan Hos Joel Amos Obad Jonah
  Jon Mic Nah Hab Zeph Zep Hag Zech Zec Mal Matt Mat Mk Mark Lk Luke Jn John Acts Rom Cor
  Gal Eph Phil Php Col Thess Thes Tim Tit Titus Phlm Heb Jas Pet Pt Jude Rev
]
OTHER_ABBR = %w[ch chs chap chaps v vv ver vs viz cf etc no No pp St Mr Mrs Ms Dr Prof]
ABBR = (BOOK_ABBR + OTHER_ABBR).to_set

PH = ""  # placeholder standing in for a protected (non-terminal) period

# Sentence-final punctuation, optional trailing close-markup/quotes, whitespace, then a
# capital letter or an opening quote/paren. Curly quotes included.
OPEN  = "A-Z(“‘\"'"
CLOSE = "\"')”’*_\\]"
BOUND = /([.!?][#{CLOSE}]*)[ \t]+(?=[#{OPEN}])/

def protect(s)
  s = s.gsub('...') { PH * 3 }                                             # ellipsis
  s = s.gsub(/\b([A-Za-z])\.([A-Za-z])\.(?=\s|\z)/) { "#{$1}#{PH}#{$2}#{PH}" } # e.g. i.e. a.m.
  s = s.gsub(/\b([A-Z])\.(?=[ \t]+[A-Z])/) { "#{$1}#{PH}" }                # single-letter initials
  abbr = ABBR.map { |a| Regexp.escape a }.join('|')
  s = s.gsub(/\b(#{abbr})\.(?=[ \t])/i) { "#{$1}#{PH}" }                   # Rev.  ch.  etc.
  s
end

def split_sentences(line)
  s = protect(line.dup)
  s = s.gsub(BOUND, "\\1\n")
  s = s.gsub(PH, '.')
  s.split("\n").map(&:rstrip).reject(&:empty?)
end

VERBATIM_OPEN = /\A(-{4,}|\.{4,}|\+{4,})\s*\z/   # listing / literal / passthrough blocks
TABLE_DELIM   = /\A\|={3,}\s*\z/

def structural?(line)
  l = line
  return true if l.strip.empty?
  return true if l.start_with?('//')                 # comment
  return true if l.start_with?('[')                  # [block.attrs]
  return true if l =~ /\A={1,6}\s/                   # = heading
  return true if l =~ /\A_{4,}\s*\z/                 # ____ quote delimiter
  return true if l =~ /\A={4,}\s*\z/                 # ==== example delimiter
  return true if l =~ /\A\*{4,}\s*\z/                # **** sidebar delimiter
  return true if l =~ /\A--\s*\z/                    # -- open block
  return true if l =~ /\A'{3,}\s*\z/ || l =~ /\A<<<\s*\z/   # thematic break / page break
  return true if l.start_with?('|')                  # table row
  return true if l =~ /\A\s*[*.\-]{1,5}\s/           # list item (unordered/ordered)
  return true if l =~ /\A\s*\d+\.\s/                 # numbered list item
  return true if l =~ /\A:\S/                        # :attribute: entry
  return true if l =~ /::(\s|\z)/                    # dlist term line
  return true if l =~ /\s\+\s*\z/                    # ends with a hard line break
  false
end

def reflow(path)
  raw = File.read path
  fm, body =
    if raw =~ /\A(---\s*\n.*?\n---\s*\n)(.*)\z/m
      [$1, $2]
    else
      ['', raw]
    end
  out = []
  verbatim = false
  body.each_line do |line|
    line = line.chomp
    if verbatim
      out << line
      verbatim = false if line =~ VERBATIM_OPEN || line =~ TABLE_DELIM
      next
    end
    if line =~ VERBATIM_OPEN || line =~ TABLE_DELIM
      verbatim = true
      out << line
      next
    end
    if structural?(line)
      out << line
    else
      out.concat split_sentences(line)
    end
  end
  File.write path, fm + out.join("\n") + "\n"
end

targets = ARGV.empty? ? Dir.glob(File.join(__dir__, '*.adoc')).sort : ARGV
targets.each do |f|
  reflow f
  warn "  reflowed #{File.basename f}"
end
