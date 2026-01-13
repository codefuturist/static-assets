# GitHub Actions Workflows

This repository uses a clean, modular workflow architecture with reusable components.

## Workflow Structure

```text
.github/workflows/
├── build.yml    # Reusable build workflow (called by others)
├── ci.yml       # PR validation (runs on pull_request)
└── deploy.yml   # Production deploy (runs on push to main)
```

## Workflow Details

### `build.yml` - Reusable Build Workflow

**Purpose**: Shared build logic to avoid duplication

**Called by**: `ci.yml`, `deploy.yml`

**Inputs**:

| Input              | Type    | Default    | Description                      |
| ------------------ | ------- | ---------- | -------------------------------- |
| `upload-artifact`  | boolean | `false`    | Whether to upload Pages artifact |
| `node-version`     | string  | `20.11.0`  | Node.js version                  |

### `ci.yml` - Continuous Integration

**Triggers**: Pull requests to `main`

**Purpose**:

- Validates the build succeeds
- Checks source file integrity
- Provides fast feedback on PRs

**Concurrency**: Cancels outdated PR runs (`cancel-in-progress: true`)

### `deploy.yml` - Production Deployment

**Triggers**: Push to `main`, manual dispatch

**Purpose**:

- Builds assets for production
- Deploys to GitHub Pages

**Concurrency**: Queues deployments (`cancel-in-progress: false`)

> ⚠️ **Important**: Deployments are NOT cancelled when newer commits arrive.
> This prevents incomplete deployments and ensures every merge to main is deployed.

## Design Principles

1. **Single Responsibility**: Each workflow has one clear purpose
2. **DRY (Don't Repeat Yourself)**: Shared logic lives in `build.yml`
3. **Clear Triggers**:
   - PRs → CI validation only
   - Merge to main → Deploy only
4. **Safe Concurrency**:
   - CI: Cancel old runs (save resources)
   - Deploy: Queue runs (ensure completion)

## Path Filters

All workflows only trigger on relevant file changes:

- `_source/**` - Source assets
- `assets/**` - Generated assets
- `scripts/**` - Build scripts
- `assets.config.json` - Asset configuration
- `package.json` - Dependencies
- `.github/workflows/**` - Workflow changes

## Manual Deployment

Trigger a manual deployment via GitHub Actions UI:

1. Go to Actions → Deploy
2. Click "Run workflow"
3. Select the `main` branch
4. Click "Run workflow"

Or via CLI:

```bash
gh workflow run deploy.yml
```
