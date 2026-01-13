# Static Assets Architecture

> A scalable, CDN-ready public assets repository for serving images, fonts, stylesheets, and scripts.

## Overview

This repository serves as a centralized CDN-backed storage for static assets. Assets are organized by version and domain, enabling cache-friendly URLs, easy rollbacks, and clear ownership.

## Directory Structure

```
static-assets/
├── assets/
│   ├── index.html              # Asset catalog/preview page
│   └── v1/                     # Version 1 namespace
│       ├── brands/             # Brand/project-specific assets
│       │   └── {brand-name}/   # e.g., rey-it-solutions/
│       │       ├── logos/      # Logo variants
│       │       ├── icons/      # Brand icons
│       │       └── images/     # Other brand images
│       └── shared/             # Cross-project shared assets
│           ├── css/            # Stylesheets
│           ├── js/             # JavaScript
│           ├── fonts/          # Web fonts
│           └── icons/          # Common icons
├── docs/                       # Documentation
├── _migration/                 # Migration scripts (not deployed)
└── .github/workflows/          # CI/CD pipelines
```

## Versioning Strategy

### Folder-Based Versioning (Primary)

Assets live under version prefixes (`/v1/`, `/v2/`) for:
- **Cache longevity**: Versioned URLs can be cached indefinitely
- **Safe rollbacks**: Previous versions remain accessible
- **Breaking changes**: New major versions don't break existing consumers

```
/assets/v1/brands/acme/logos/logo-primary.svg
/assets/v2/brands/acme/logos/logo-primary.svg  # Updated design
```

### Git Tag Versioning (CDN)

For jsDelivr CDN, use semantic version tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

CDN URL pattern:
```
https://cdn.jsdelivr.net/gh/codefuturist/static-assets@v1.0.0/assets/v1/brands/acme/logos/logo-primary.svg
```

## Naming Conventions

### Files

| Rule | Example | ❌ Avoid |
|------|---------|----------|
| Lowercase kebab-case | `logo-primary.svg` | `Logo_Primary.svg` |
| Descriptive names | `icon-arrow-right.svg` | `arrow.svg` |
| Size suffix for rasters | `hero-1920x1080.jpg` | `hero-large.jpg` |
| Density suffix for retina | `logo@2x.png` | `logo-retina.png` |
| No trailing punctuation | `logo.svg` | `logo-.svg` |

### Directories

| Rule | Example |
|------|---------|
| Lowercase kebab-case | `rey-it-solutions/` |
| Plural for collections | `logos/`, `icons/` |
| Singular for single-purpose | `css/`, `js/` |

### Asset Variants

For assets with multiple sizes/variants:

```
logos/
├── logo-primary.svg           # Vector (scalable)
├── logo-primary-64x64.png     # Favicon size
├── logo-primary-200x200.png   # Thumbnail
├── logo-primary-400x400.png   # Standard
├── logo-primary@2x.png        # Retina (2x density)
└── logo-wordmark.svg          # Alternative variant
```

## CDN & Serving

### GitHub Pages (Default)

Assets deploy automatically to GitHub Pages on push to `main`:

```
https://codefuturist.github.io/static-assets/assets/v1/...
```

### jsDelivr CDN (Recommended for Production)

Free CDN with global edge caching:

```
# Latest from main branch
https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/v1/...

# Pinned to specific release (recommended)
https://cdn.jsdelivr.net/gh/codefuturist/static-assets@v1.0.0/assets/v1/...

# With cache purge (after updates)
https://purge.jsdelivr.net/gh/codefuturist/static-assets@main/assets/v1/...
```

### URL Examples

| Asset Type | URL Pattern |
|------------|-------------|
| Brand logo | `/assets/v1/brands/rey-it-solutions/logos/logo-primary.svg` |
| Shared CSS | `/assets/v1/shared/css/reset.css` |
| Web font | `/assets/v1/shared/fonts/inter-regular.woff2` |
| Icon | `/assets/v1/shared/icons/icon-check.svg` |

## Adding New Assets

### 1. New Brand/Project

```bash
mkdir -p assets/v1/brands/{brand-name}/{logos,icons,images}
```

### 2. Add Assets

```bash
# Rename to follow conventions
mv "Logo With Spaces.PNG" assets/v1/brands/acme/logos/logo-primary.png

# Git LFS tracks binaries automatically (configured in .gitattributes)
git add assets/v1/brands/acme/
git commit -m "feat: add acme brand assets"
```

### 3. Tag Release (Optional)

```bash
git tag v1.1.0
git push origin v1.1.0
```

## Git LFS

Large binary files are tracked via Git LFS (configured in `.gitattributes`):

- All image formats (jpg, png, gif, webp, svg, ico)
- Fonts (woff, woff2, ttf, otf, eot)
- Videos & audio (mp4, webm, mp3, wav)
- Documents (pdf)

Run `git lfs install` before cloning to enable LFS.

## Cache Strategy

| URL Type | Cache Duration | Use Case |
|----------|----------------|----------|
| `@v1.0.0` (tagged) | Indefinite | Production |
| `@main` (branch) | ~24 hours | Development |
| GitHub Pages | Varies | Fallback |

## Asset Generation Pipeline

An automated pipeline processes source assets to generate optimized variants.

### Quick Start

```bash
npm install                    # Install dependencies (sharp, svgo)
npm run build                  # Process all assets
npm run build:brand acme       # Process single brand
```

### How It Works

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  _source/       │     │  generate-assets.js  │     │  assets/v1/     │
│  └── brands/    │ ──▶ │  • Resize            │ ──▶ │  └── brands/    │
│      └── logos/ │     │  • Convert formats   │     │      └── logos/ │
│          *.png  │     │  • Optimize          │     │          *.webp │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
     (source)                 (pipeline)                  (output)
```

### Source Directory

Place original high-resolution assets in `_source/`:

```
_source/
├── brands/
│   └── {brand-name}/
│       ├── logos/     # SVG or PNG/JPG at 2000px+
│       └── icons/     # SVG or 512px+
└── shared/
    └── icons/
```

### Configuration

Edit `assets.config.json` to define output variants:

```json
{
  "brands": {
    "rey-it-solutions": {
      "logos": {
        "sizes": [
          { "name": "favicon", "width": 64 },
          { "name": "standard", "width": 400 }
        ],
        "formats": ["original", "webp", "avif"],
        "generateRetina": true
      }
    }
  }
}
```

### Generated Outputs

From a single source file, the pipeline generates:

| Output | Description |
|--------|-------------|
| `logo-primary.png` | Original format, original size |
| `logo-primary.webp` | WebP format (smaller) |
| `logo-primary-favicon.png` | 64px variant |
| `logo-primary-standard.webp` | 400px WebP |
| `logo-primary-standard@2x.webp` | 800px retina WebP |

### SVG Optimization

SVGs are processed with SVGO:
- Removes metadata and comments
- Minifies paths
- Removes unused attributes
- Typically 20-50% size reduction

## Migration Notes

When restructuring or renaming assets:

1. Keep old paths working during transition
2. Add redirects or symlinks if possible
3. Document deprecated paths in `_migration/`
4. Communicate changes to consumers
5. Remove old paths after migration period
