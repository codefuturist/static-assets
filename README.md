# 📦 Static Assets

<!-- markdownlint-disable MD060 -->

[![Deploy to GitHub Pages](https://github.com/codefuturist/static-assets/actions/workflows/deploy.yml/badge.svg)](https://github.com/codefuturist/static-assets/actions/workflows/deploy.yml)

CDN-ready public static assets with automated generation pipeline. Optimized logos, icons, and images served via **GitHub Pages** and **jsDelivr**.

## 🌐 Asset Browser

Browse all assets visually: **[codefuturist.github.io/static-assets](https://codefuturist.github.io/static-assets/)**

The browser features fuzzy search, brand/type filters, format selectors, and one-click copy for both CDN URLs.

## 🚀 Quick Start

### Using Assets in Your Project

Assets are available from two CDNs:

| CDN              | Base URL                                                              | Best For                       |
| ---------------- | --------------------------------------------------------------------- | ------------------------------ |
| **GitHub Pages** | `https://codefuturist.github.io/static-assets/`                        | Direct linking                 |
| **jsDelivr**     | `https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/`  | Production CDN with caching    |

#### Example URLs

```html
<!-- GitHub Pages -->
<img src="https://codefuturist.github.io/static-assets/v1/brands/rey-it-solutions/logos/logo.svg" alt="Logo">

<!-- jsDelivr CDN (recommended for production) -->
<img src="https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/v1/brands/rey-it-solutions/logos/logo.svg" alt="Logo">
```

#### Favicon Example

```html
<link rel="icon" type="image/svg+xml" href="https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/v1/brands/rey-it-solutions/logos/logo.svg">
<link rel="icon" type="image/png" sizes="32x32" href="https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/v1/brands/rey-it-solutions/logos/logo-32.png">
<link rel="apple-touch-icon" href="https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/v1/brands/rey-it-solutions/logos/logo-180.png">
```

## 📁 Directory Structure

```text
static-assets/
├── _source/                    # Source files (not deployed)
│   └── brands/
│       ├── rey-it-solutions/
│       │   ├── logos/          # SVG sources
│       │   └── icons/
│       └── technitium/
│           └── icons/
├── assets/                     # Generated output (deployed)
│   ├── v1/brands/
│   │   ├── rey-it-solutions/
│   │   └── technitium/
│   ├── assets-manifest.json    # Asset inventory
│   └── index.html              # Asset browser
├── scripts/
│   ├── generate-assets.js      # Build pipeline
│   ├── new-brand.js            # Scaffolding CLI
│   └── validate.js             # Asset validation
└── assets.config.json          # Configuration
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/codefuturist/static-assets.git
cd static-assets

# Install dependencies
npm install

# Build all assets
npm run build
```

### Available Commands

| Command                      | Description                            |
| ---------------------------- | -------------------------------------- |
| `npm run build`              | Generate all assets from source files  |
| `npm run build:brand <name>` | Build assets for a specific brand      |
| `npm run dev`                | Watch mode - auto-rebuild on changes   |
| `npm run validate`           | Validate source assets before building |
| `npm run new-brand <name>`   | Scaffold a new brand directory         |
| `npm run clean`              | Remove generated assets                |

### Adding a New Brand

The easiest way to add a new brand:

```bash
# Scaffold the brand structure
npm run new-brand acme-corp

# Add source files to _source/brands/acme-corp/logos/
# Then build
npm run build
```

Or manually:

1. Create directory: `_source/brands/your-brand/logos/`
2. Add source SVG files (minimum 512×512 recommended)
3. Add config entry in `assets.config.json` under `brands`
4. Run `npm run build`

## 📐 Available Formats & Sizes

### Formats

| Format   | Use Case                              |
| -------- | ------------------------------------- |
| **SVG**  | Vector graphics, infinite scaling     |
| **PNG**  | Transparency support, legacy browsers |
| **WebP** | Modern browsers, smaller file size    |
| **AVIF** | Newest format, best compression       |
| **JPG**  | Photos, solid backgrounds             |

### Standard Sizes

- **Favicons**: 16, 32, 48, 64, 96, 128, 192, 256, 512px
- **App Icons**: 180 (Apple Touch), 192, 512 (Android)
- **Social**: 1200×630 (OG), 1200×600 (Twitter)

## 🔗 Asset Manifest

The generated `assets-manifest.json` contains metadata for all assets:

```javascript
// Fetch the manifest
const res = await fetch('https://codefuturist.github.io/static-assets/assets-manifest.json');
const manifest = await res.json();

// Access assets
manifest.brands.forEach(brand => {
  console.log(brand.name, brand.assetTypes);
});
```

## 📖 Documentation

- [Naming Conventions](_source/README.md) - Variant and file naming standards
- [Configuration Guide](docs/notes.md) - Detailed config options
- [Contributing](docs/CONTRIBUTING.md) - How to contribute

## 📄 License

MIT © [codefuturist](https://github.com/codefuturist)
