#!/bin/bash
# Generate PNG icons from SVG using various tools
# Run this script in the icons directory

# Try using rsvg-convert (part of librsvg)
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert..."
    rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
    rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
    echo "Icons generated!"
    exit 0
fi

# Try using Inkscape
if command -v inkscape &> /dev/null; then
    echo "Using Inkscape..."
    inkscape -w 192 -h 192 icon.svg -o icon-192.png
    inkscape -w 512 -h 512 icon.svg -o icon-512.png
    echo "Icons generated!"
    exit 0
fi

# Try using ImageMagick
if command -v convert &> /dev/null || command -v magick &> /dev/null; then
    echo "Using ImageMagick..."
    convert -background none -resize 192x192 icon.svg icon-192.png 2>/dev/null || \
    magick -background none -resize 192x192 icon.svg icon-192.png
    convert -background none -resize 512x512 icon.svg icon-512.png 2>/dev/null || \
    magick -background none -resize 512x512 icon.svg icon-512.png
    echo "Icons generated!"
    exit 0
fi

echo "No suitable tool found. Please install one of:"
echo "  - librsvg (brew install librsvg)"
echo "  - Inkscape (brew install inkscape)"
echo "  - ImageMagick (brew install imagemagick)"
echo ""
echo "Or use an online converter to convert icon.svg to:"
echo "  - icon-192.png (192x192 pixels)"
echo "  - icon-512.png (512x512 pixels)"
exit 1
