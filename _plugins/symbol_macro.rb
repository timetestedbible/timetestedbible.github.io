# Inline macro:  sym:<glossary-anchor>[label]
#
# Renders a glossary-term reference that is styled (role "symbol") AND linked:
#   - PDF backend  -> an internal cross-reference (xref) to the glossary entry,
#                     so the single-file PDF jumps to the definition.
#   - HTML backend -> a cross-page link to the glossary page + anchor.
#
# Loaded by both builds: Jekyll auto-loads _plugins/*.rb (web); build.rb
# require's this file (print PDF). One source, two backends.
require 'asciidoctor'
require 'asciidoctor/extensions'

Asciidoctor::Extensions.register do
  inline_macro do
    named :sym
    name_positional_attributes 'label'
    process do |parent, target, attrs|
      label = attrs['label'] || target
      if %w(pdf epub3).include? parent.document.backend
        # internal cross-reference to the glossary entry (single-file PDF and
        # EPUB both carry the glossary aboard); styled via the PDF converter
        # override (extension.rb), which adds the role class to roled xrefs
        Asciidoctor::Inline.new(parent, :anchor, label, type: :xref,
          target: "##{target}", attributes: { 'refid' => target, 'role' => 'symbol' })
      else
        Asciidoctor::Inline.new(parent, :anchor, label, type: :link,
          target: "/books/meat-bibles-symbolic-language/glossary/##{target}", attributes: { 'role' => 'symbol' })
      end
    end
  end
  # Inline macro:  verdict:divergent[] / verdict:novel[]
  #
  # Marks a glossary term with its experiment verdict (see the Introduction's
  # blind test). HTML renders a right-floated small-caps badge; the print
  # pipeline (build.rb) strips this macro from the term and re-expresses it as
  # a badge paragraph the PDF converter inks right-aligned on the term line.
  inline_macro do
    named :verdict
    process do |parent, target, _attrs|
      if parent.document.backend == 'pdf'
        Asciidoctor::Inline.new(parent, :quoted, '', type: :unquoted)
      else
        html = %(<span class="verdict-badge verdict-#{target}" style="float:right;font-variant:small-caps;font-size:0.78em;letter-spacing:0.08em;color:#8a6d1a;">#{target}</span>)
        Asciidoctor::Inline.new(parent, :quoted, html, type: :unquoted)
      end
    end
  end
end
