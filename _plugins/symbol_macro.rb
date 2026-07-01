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
      if parent.document.backend == 'pdf'
        # internal cross-reference to the glossary entry; styled via the PDF
        # converter override (extension.rb), which adds the role class to roled xrefs
        Asciidoctor::Inline.new(parent, :anchor, label, type: :xref,
          target: "##{target}", attributes: { 'refid' => target, 'role' => 'symbol' })
      else
        Asciidoctor::Inline.new(parent, :anchor, label, type: :link,
          target: "/books/symbolic-language/glossary/##{target}", attributes: { 'role' => 'symbol' })
      end
    end
  end
end
