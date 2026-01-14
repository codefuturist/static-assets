# Contributing to Static Assets

<!-- markdownlint-disable MD060 -->

Thank you for your interest in contributing! This document provides guidelines for contributing to the static-assets repository.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Adding a New Brand](#adding-a-new-brand)
- [Asset Requirements](#asset-requirements)
- [File Naming Conventions](#file-naming-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

## Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `npm install`
3. **Run validation**: `npm run validate`
4. **Build assets**: `npm run build`

## Adding a New Brand

The easiest way to add a new brand:

```bash
# Use the scaffolding CLI
npm run new-brand your-brand-name

# Add your source files
# _source/brands/your-brand-name/logos/logo.svg

# Validate and build
npm run validate
npm run build
```

### Metadata (Recommended)

For better names and search results in the asset browser, each brand can optionally include a metadata file:

`_source/brands/<brand-name>/meta.json`

The scaffolding CLI (`npm run new-brand ...`) creates a starter `meta.json` for you.

Notes:

- Metadata is merged into the generated manifest (`assets/assets-manifest.json`).
- Asset keys under `assets.<type>` must match the **asset id** (the filename base, without format or generated size suffixes).
- All fields are optional; if omitted, the UI falls back to filename-derived names.

Example:

```json
{
  "brand": {
    "displayName": "Acme Corp",
    "description": "Internal brand kit for Acme.",
    "tags": ["acme", "brand"],
    "aliases": ["acme"]
  },
  "assets": {
    "logos": {
      "logo": {
        "displayName": "Primary Logo",
        "tags": ["primary"],
        "aliases": ["logo"],
        "usage": "Use on light backgrounds.",
        "sortKey": 10
      }
    }
  }
}
```

### Manual Process

1. Create the source directory structure:

  ```text
   _source/brands/your-brand-name/
   ├── logos/
   ├── icons/
   └── images/
   ```

1. Add your source files (see [Asset Requirements](#asset-requirements))

1. Add configuration in `assets.config.json`:

   ```json
   {
     "brands": {
       "your-brand-name": {
         "logos": {
           "sizes": [
             { "name": "32", "width": 32, "height": 32 },
             { "name": "64", "width": 64, "height": 64 },
             { "name": "128", "width": 128, "height": 128 }
           ],
           "formats": ["original", "webp", "avif", "png"]
         }
       }
     }
   }
   ```

1. Run `npm run build` to generate assets

## Asset Requirements

### Source File Specifications

| Asset Type | Preferred Format | Minimum Resolution | Recommended     |
| ---------- | ---------------- | ----------------- | --------------- |
| Logos      | SVG              | 512×512 (raster)  | Vector SVG      |
| Icons      | SVG              | 128×128 (raster)  | Vector SVG      |
| Images     | PNG/JPG          | 1024×1024         | High resolution |

### SVG Best Practices

- **Clean up** unnecessary metadata and comments
- **Optimize** paths using tools like SVGO (happens automatically during build)
- **Use viewBox** instead of fixed width/height
- **Avoid** embedded raster images
- **Remove** font dependencies (convert text to paths)

### Raster Best Practices

- **Provide highest resolution** source available
- **Use PNG** for transparency
- **Use JPG** for photos (no transparency needed)
- **Avoid** upscaling low-resolution images

## File Naming Conventions

Use **kebab-case** for all filenames:

### Valid Names

```text
logo.svg          ✓
logo-dark.svg     ✓
logo-on-brand.svg ✓
icon.png          ✓
```

### Invalid Names

```text
Logo.svg          ✗ (uppercase)
logo_dark.svg     ✗ (underscore)
logo dark.svg     ✗ (space)
myLogo.svg        ✗ (camelCase)
```

### Variant Suffixes

| Suffix       | Description                     |
| ------------ | ------------------------------- |
| (none)       | Primary/default version         |
| `-dark`      | Optimized for dark backgrounds  |
| `-light`     | Optimized for light backgrounds |
| `-mono`      | Single color/monochrome         |
| `-on-brand`  | With brand color background     |
| `-icon`      | Icon/symbol only                |
| `-wordmark`  | Text/wordmark only              |

### Generated Size Suffixes

Do **not** include size suffixes in `_source/` filenames. Sizes like `-16`, `-32`, `-128`, etc. are **generated automatically** into `assets/` during `npm run build`.

## Pull Request Process

### Before Submitting

1. ✅ Run `npm run validate` - fix any errors
2. ✅ Run `npm run build` - ensure build succeeds
3. ✅ Test the asset browser locally: `cd assets && python3 -m http.server 8080`
4. ✅ Verify assets display correctly in the browser

### PR Checklist

```markdown
- [ ] Source files follow naming conventions
- [ ] Source files meet minimum resolution requirements
- [ ] Configuration added to `assets.config.json`
- [ ] Validation passes (`npm run validate`)
- [ ] Build succeeds (`npm run build`)
- [ ] Assets display correctly in browser
- [ ] No copyrighted content without permission
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(brand): add acme-corp logo assets
fix(build): handle SVG with embedded fonts
docs: update contribution guidelines
```

## Code Style

### JavaScript

- Use ES modules (`import`/`export`)
- Use `async`/`await` for async operations
- Use template literals for strings
- Add JSDoc comments for functions

### JSON

- Use 4-space indentation
- Keep arrays on multiple lines when >3 items
- Sort keys alphabetically in config objects

## ❓ Questions?

- Open an [issue](https://github.com/codefuturist/static-assets/issues) for bugs or feature requests
- Check existing issues before creating new ones

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
