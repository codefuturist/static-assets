# Git Hooks

This directory contains version-controlled git hooks for the static-assets repository.

## Pre-commit Hook

Automatically regenerates optimized asset variants when source files are modified.

### What It Does

1. **Detects changes** to source assets in `_source/brands/`
2. **Runs** `npm run build` to regenerate optimized variants
3. **Stages** generated assets automatically
4. **Aborts commit** if generation fails

### Installation

Hooks are automatically installed when you run:

```bash
npm install
```

Or manually:

```bash
npm run hooks:install
```

### Uninstallation

To disable git hooks:

```bash
npm run hooks:uninstall
```

### How It Works

The pre-commit hook triggers when you commit files matching:
```
_source/brands/**/*.{svg,png,jpg,jpeg,gif}
```

Example workflow:
```bash
# Add a new logo source file
cp my-new-logo.svg _source/brands/acme/logos/

# Commit the source file
git add _source/brands/acme/logos/my-new-logo.svg
git commit -m "feat: add acme logo"

# Hook automatically:
# 1. Detects _source/ changes
# 2. Runs npm run build
# 3. Generates optimized variants (PNG, WebP, AVIF at multiple sizes)
# 4. Stages generated files in assets/v1/
# 5. Includes them in the same commit
```

### Bypassing the Hook

If you need to commit without running the hook:

```bash
git commit --no-verify -m "message"
```

**Note:** Only bypass when necessary, as generated assets should stay in sync with source files.
