# Time Tested Tradition cover assets

This directory owns the second-edition TTT cover package.

- `cover-jacket-sun-moon.svg` is the editable 440-page full-jacket source based on BookBaby's `US-Trade-DustJacket (4)` template.
- `cover-case-sun-moon.svg` is the matching 440-page printed-case source based on BookBaby's `US-Trade-Hard-Cover (4)` template.
- `ttt-front-second-edition.png` is the complete 6.375-by-9.25-inch dust-jacket front panel.
- `ttt-front-second-edition-6x9.png` is the centered 1800×2700, 300-DPI book-face master for web, ebook, catalog, and companion-cover use.
- `ttt-front-second-edition-epub.jpg` is the 1800×2700, 300-DPI RGB JPEG packaged as the EPUB cover.
- `ttt-full-jacket-second-edition.png` is the full 300-DPI jacket render for review.
- `ttt-full-case-second-edition.png` is the full 300-DPI printed-case render for review.
- `ttt-sun-moon-panorama-4x.png` is the untouched 7596×3312 Upscayl master.
- `ttt-moon-nasa-lro-full.png` is the NASA LRO-derived full-Moon source.
- `ttt-moon-atmosphere-ai-patch-source.png` is the original isolated AI blend output.
- `ttt-moon-atmosphere-ai-patch.png` is that blend normalized to the 1600×1600 working crop.
- `ttt-sun-moon-panorama-4x-natural-moon.png` is the production panorama with only the feathered Moon neighborhood merged into the untouched 4× master.
- `ttt-isbn-9781736521199-barcode.svg` and `.png` are the current second edition Bookland EAN-13 barcode assets.
- Files beginning with `ttt-` belong exclusively to TTT.
- `companion-meat-front.png` is a local snapshot rendered from MEAT's current `cover-jacket-vineyard-moon-bookbaby-v2.svg` front panel and used only for the TTT flap promotion.
- MEAT's reciprocal snapshot is `books/symbolic-language/cover/companion-ttt-front.png`; it is copied from the 6×9 master so later TTT jacket edits cannot silently change MEAT.
- The Bowker JPEG is `output/bowker/9781736521175.jpg` at 1600×2400, RGB, 300 DPI, and under the 5 MB portal limit.
- The current production PDFs are `output/pdf/time-tested-tradition-dust-jacket-440pp.pdf` and `output/pdf/time-tested-tradition-hard-cover-case-440pp.pdf`; both match the supplied BookBaby template page sizes exactly and contain a single 300-DPI RGB cover image.

MEAT cover sources live in `books/symbolic-language/cover/`. Cross-promotions use local snapshot files so changes to one book's cover cannot silently alter the other book's jacket.

## Moon image credit

The full-Moon layer comes from NASA's Scientific Visualization Studio, “Moon Phase and Libration, 2025,” using Lunar Reconnaissance Orbiter LROC/LOLA data. Visualization by Ernie Wright (USRA); science by Noah Petro (NASA/GSFC). Source: <https://svs.gsfc.nasa.gov/5415> (downloaded July 18, 2026).

## Local Moon-edit workflow

The base panorama is never regenerated. A 1600×1600 crop at source coordinates x=4217, y=1500 receives the LRO Moon substitution and the isolated AI atmosphere pass. A feathered elliptical mask merges that crop back into the original 7596×3312 panorama; every pixel outside the crop remains byte-identical to the Upscayl master. All cover typography remains editable SVG text.
