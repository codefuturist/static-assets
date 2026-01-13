# Source Assets

This directory contains **original, high-resolution source assets** that are processed by the asset generation pipeline.

## Structure

```text
_source/
├── brands/
│   ├── {brand-name}/
│   │   ├── logos/      # Original logo files (highest resolution available)
│   │   ├── icons/      # Icon source files
│   │   └── images/     # Other images
│   └── ...
└── shared/
    ├── icons/          # Common icons
    └── images/         # Shared images
```

## Logo Variant Naming Convention

Follow industry-standard naming to ensure all variants are properly organized:

### Color Variants

| Suffix | Description | Use Case |
| ------ | ----------- | -------- |
| *(none)* | Primary/default (transparent) | General use, most contexts |
| `-dark` | For dark backgrounds | Light-colored logo version |
| `-light` | For light backgrounds | Dark-colored logo version |
| `-mono` | Single color/monochrome | Simplified contexts |
| `-mono-dark` | Monochrome for dark bg | White/light single-color |
| `-mono-light` | Monochrome for light bg | Black/dark single-color |
| `-knockout` | Reversed/inverted colors | Special treatments |

### Background Variants

| Suffix | Description | Use Case |
| ------ | ----------- | -------- |
| `-on-dark` | With dark solid background | Social media, favicons |
| `-on-light` | With light solid background | Print, documents |
| `-on-brand` | With brand color background | Marketing materials |

### Form Variants

| Suffix | Description | Use Case |
| ------ | ----------- | -------- |
| *(none)* | Full lockup (icon + wordmark) | Primary branding |
| `-icon` | Icon/symbol only | Favicons, app icons, small spaces |
| `-wordmark` | Text/wordmark only | Where icon isn't needed |
| `-horizontal` | Horizontal layout | Headers, wide spaces |
| `-vertical` | Vertical/stacked layout | Square spaces, mobile |
| `-tagline` | Includes tagline/slogan | Marketing, formal use |

### Naming Examples

```text
logo.svg                          # Primary full lockup, transparent
logo-dark.svg                     # For dark backgrounds
logo-light.svg                    # For light backgrounds
logo-icon.svg                     # Icon only, transparent
logo-icon-on-dark.svg             # Icon with dark background (for favicons)
logo-icon-mono-dark.svg           # White icon for dark backgrounds
logo-wordmark.svg                 # Text only
logo-horizontal.svg               # Horizontal layout
logo-horizontal-dark.svg          # Horizontal for dark backgrounds
logo-vertical-tagline.svg         # Stacked with tagline
```

## Complete Brand Asset Checklist

For comprehensive brand coverage, provide these source files:

### Essential (Minimum)

- [ ] `logo.svg` — Primary logo, transparent background
- [ ] `logo-icon.svg` — Icon only, for favicons/app icons

### Recommended

- [ ] `logo-dark.svg` — Version for dark backgrounds
- [ ] `logo-light.svg` — Version for light backgrounds  
- [ ] `logo-icon-on-dark.svg` — Icon with solid dark background
- [ ] `logo-mono-dark.svg` — White/light monochrome version
- [ ] `logo-mono-light.svg` — Black/dark monochrome version

### Full Brand Kit

- [ ] `logo-horizontal.svg` — Horizontal lockup
- [ ] `logo-vertical.svg` — Vertical/stacked lockup
- [ ] `logo-wordmark.svg` — Text only
- [ ] `logo-tagline.svg` — With tagline
- [ ] All variants in `-dark` and `-light` versions

## File Requirements

| Type | Format | Resolution |
| ---- | ------ | ---------- |
| Logos | SVG preferred, or PNG at 2000px+ | Highest available |
| Icons | SVG preferred | Vector or 512px+ |
| Photos | JPG/PNG | Original resolution |

### Guidelines

- Use **lowercase-kebab-case**: `logo-icon-dark.svg`
- Use **descriptive names**: `hero-homepage.jpg` not `image1.jpg`
- **No size suffixes** in source — sizes are generated automatically
- **SVG preferred** for logos/icons — scales to any size
- **Transparent backgrounds** for maximum flexibility (add `-on-*` variants for solid backgrounds)

## Processing

Run the pipeline to generate optimized variants:

```bash
npm run build                           # Process all assets
npm run build:brand rey-it-solutions    # Process single brand
```

## What Gets Generated

From each source file, the pipeline creates:

- **Format variants**: WebP, AVIF, PNG (from any raster source)
- **Size variants**: 16px → 1024px (configurable in assets.config.json)
- **Optimized SVGs**: Minified with SVGO (20-50% smaller)

### Example Output

**Source files:**

```text
_source/brands/acme/logos/
├── logo.svg
├── logo-dark.svg
├── logo-icon.svg
└── logo-icon-on-dark.png (1024x1024)
```

**Generated outputs:**

```text
assets/v1/brands/acme/logos/
├── logo.svg                    # Optimized SVG
├── logo-dark.svg               # Optimized SVG
├── logo-icon.svg               # Optimized SVG
├── logo-icon-on-dark-16.png    # Favicon
├── logo-icon-on-dark-16.webp
├── logo-icon-on-dark-32.png
├── logo-icon-on-dark-32.webp
├── logo-icon-on-dark-180.png   # Apple Touch Icon
├── logo-icon-on-dark-192.png   # Android Chrome
├── logo-icon-on-dark-512.png   # PWA icon
└── ... (all configured sizes)
```
