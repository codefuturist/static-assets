#!/usr/bin/env node
/**
 * Brand Scaffolding CLI
 * Creates a new brand directory structure and adds config entry
 * 
 * Usage: npm run new-brand <brand-name>
 * Example: npm run new-brand acme-corp
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m'
};

function log(message, type = 'info') {
    const icons = {
        info: `${colors.cyan}ℹ${colors.reset}`,
        success: `${colors.green}✓${colors.reset}`,
        warning: `${colors.yellow}⚠${colors.reset}`,
        error: `${colors.red}✗${colors.reset}`
    };
    console.log(`${icons[type]} ${message}`);
}

function toKebabCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function toTitleCase(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

async function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Logic
// ─────────────────────────────────────────────────────────────────────────────

async function createBrand(brandName) {
    const brandId = toKebabCase(brandName);
    const brandTitle = toTitleCase(brandId);

    if (!brandId) {
        log('Brand name is required', 'error');
        console.log(`\nUsage: npm run new-brand <brand-name>`);
        console.log(`Example: npm run new-brand acme-corp\n`);
        process.exit(1);
    }

    log(`Creating brand: ${colors.cyan}${brandTitle}${colors.reset} (${brandId})`);

    // Check if brand already exists
    const brandSourceDir = path.join(ROOT_DIR, '_source', 'brands', brandId);
    try {
        await fs.access(brandSourceDir);
        log(`Brand "${brandId}" already exists at ${brandSourceDir}`, 'error');
        process.exit(1);
    } catch {
        // Directory doesn't exist, continue
    }

    // Create directory structure
    const directories = [
        path.join(brandSourceDir, 'logos'),
        path.join(brandSourceDir, 'icons'),
        path.join(brandSourceDir, 'images')
    ];

    for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
        log(`Created ${path.relative(ROOT_DIR, dir)}`, 'success');
    }

    // Create placeholder README
    const readmePath = path.join(brandSourceDir, 'README.md');
    const readmeContent = `# ${brandTitle}

## Source Assets

Place your source files in the appropriate directories:

- \`logos/\` - Brand logos (SVG recommended, minimum 512×512 for rasters)
- \`icons/\` - Icons and symbols
- \`images/\` - Other brand images

## Naming Convention

Use kebab-case for all filenames:
- \`logo.svg\` - Primary logo
- \`logo-dark.svg\` - Logo for dark backgrounds
- \`logo-on-brand.svg\` - Logo with brand color background
- \`icon.svg\` - Primary icon

See the [naming conventions](../../README.md) for full details.

## Building

\`\`\`bash
# Build only this brand
npm run build:brand ${brandId}

# Build all brands
npm run build
\`\`\`
`;
    await fs.writeFile(readmePath, readmeContent);
    log(`Created ${path.relative(ROOT_DIR, readmePath)}`, 'success');

    // Create metadata file for better search/display names
    const metaPath = path.join(brandSourceDir, 'meta.json');
    const metaContent = {
        brand: {
            displayName: brandTitle,
            description: "",
            tags: [],
            aliases: []
        },
        assets: {
            logos: {
                logo: {
                    displayName: "Primary Logo",
                    tags: ["primary"],
                    aliases: ["logo"],
                    sortKey: 10
                },
                "logo-on-brand": {
                    displayName: "Logo (On Brand)",
                    tags: ["on-brand"],
                    aliases: ["logo on brand"],
                    sortKey: 20
                }
            },
            icons: {
                icon: {
                    displayName: "App Icon",
                    tags: ["icon"],
                    aliases: ["favicon"],
                    sortKey: 10
                }
            }
        }
    };
    await fs.writeFile(metaPath, JSON.stringify(metaContent, null, 2));
    log(`Created ${path.relative(ROOT_DIR, metaPath)}`, 'success');

    // Update assets.config.json
    const configPath = path.join(ROOT_DIR, 'assets.config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

    if (config.brands[brandId]) {
        log(`Brand "${brandId}" already exists in config`, 'warning');
    } else {
        // Add default brand config
        config.brands[brandId] = {
            logos: {
                sizes: [
                    { name: "16", width: 16, height: 16 },
                    { name: "32", width: 32, height: 32 },
                    { name: "48", width: 48, height: 48 },
                    { name: "64", width: 64, height: 64 },
                    { name: "128", width: 128, height: 128 },
                    { name: "256", width: 256, height: 256 },
                    { name: "512", width: 512, height: 512 }
                ],
                formats: ["original", "webp", "avif", "png"]
            },
            icons: {
                sizes: [
                    { name: "16", width: 16 },
                    { name: "24", width: 24 },
                    { name: "32", width: 32 },
                    { name: "48", width: 48 },
                    { name: "64", width: 64 }
                ]
            }
        };

        await fs.writeFile(configPath, JSON.stringify(config, null, 4));
        log(`Added "${brandId}" to assets.config.json`, 'success');
    }

    // Summary
    console.log('');
    log(`Brand "${brandTitle}" scaffolded successfully!`, 'success');
    console.log(`
${colors.dim}Next steps:${colors.reset}
  1. Add source files to ${colors.cyan}_source/brands/${brandId}/logos/${colors.reset}
  2. Customize config in ${colors.cyan}assets.config.json${colors.reset} if needed
  3. Run ${colors.cyan}npm run build${colors.reset} to generate assets
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Entry Point
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.cyan}Brand Scaffolding CLI${colors.reset}

Creates a new brand directory structure and adds config entry.

${colors.dim}Usage:${colors.reset}
  npm run new-brand <brand-name>

${colors.dim}Examples:${colors.reset}
  npm run new-brand acme-corp
  npm run new-brand "My Company"

${colors.dim}This will create:${colors.reset}
  _source/brands/<brand-name>/
  ├── logos/
  ├── icons/
  ├── images/
  └── README.md

And add a config entry to assets.config.json
`);
    process.exit(0);
}

createBrand(args.join(' ')).catch(err => {
    log(err.message, 'error');
    process.exit(1);
});
