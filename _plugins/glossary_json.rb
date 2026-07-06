# Emits /books/symbolic-language/glossary.json — the glossary entries as JSON —
# so the web book's sym: links can show a hover/tap preview popup instead of
# forcing a jump to the glossary page (assets/js/glossary-popup.js consumes it).
#
# Parses books/symbolic-language/42-glossary.adoc:
#   [[sym-x]]Term:: definition +
#   [.seeref]__(refs) · see link:/books/...[Title], ch. N__
require 'json'

module SymbolicLanguage
  class GlossaryJson < Jekyll::Generator
    safe true
    priority :low

    GLOSSARY = 'books/symbolic-language/42-glossary.adoc'

    def strip_inline(s)
      s = s.gsub(/sym:sym-[a-z0-9-]+\[([^\]]*)\]/, '\1')
      s = s.gsub(/link:[^\[\s]+\[([^\]]*)\]/, '\1')
      s = s.gsub(/__([^_]+)__/, '\1')
      s = s.gsub(/\*([^*]+)\*/, '\1')
      s = s.gsub(/\b_([^_]+)_\b/, '\1')
      s.strip
    end

    def generate(site)
      src = File.join(site.source, GLOSSARY)
      return unless File.exist?(src)

      entries = {}
      current = nil
      File.readlines(src, encoding: 'utf-8').each do |line|
        if (m = line.match(/^\[\[(sym-[a-z0-9-]+)\]\](.+?)::\s*(.*?)\s*\+?\s*$/))
          current = m[1]
          entries[current] = { 'term' => strip_inline(m[2]), 'def' => strip_inline(m[3]) }
        elsif current && (m = line.match(/^\[\.seeref\]__\((.*?)\)\s*·\s*see link:(\S+?)\[([^\]]+)\],\s*ch\.\s*(\d+)__/))
          entries[current]['refs'] = m[1]
          entries[current]['see'] = { 'url' => m[2], 'title' => m[3], 'ch' => m[4].to_i }
          current = nil
        end
      end
      return if entries.empty?

      page = Jekyll::PageWithoutAFile.new(site, site.source, 'books/symbolic-language', 'glossary.json')
      page.content = JSON.generate(entries)
      page.data['layout'] = nil
      site.pages << page
    end
  end
end
