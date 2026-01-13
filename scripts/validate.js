#!/usr/bin/env node
/**
 * Asset Validation Script
 * Validates source assets before building
 * 
 * Checks:
 * - File naming conventions (kebab-case)
 * - Minimum resolution for raster images
 * - Required files exist
 * - Config entries have corresponding source directories
 * - Orphaned source directories (not in config)
 * 
 * Usage: npm run validate
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const VALIDATION_RULES = {
    // Minimum resolution for raster source images
    minResolution: {
        logos: 512,
        icons: 128,
        images: 256
    },
    // Required files per asset type (regex patterns)
    requiredFiles: {
        logos: [/^logo\.(svg|png)$/],
        icons: [/^icon\.(svg|png)$/]
    },
    // Valid file extensions
    validExtensions: ['.svg', '.png', '.jpg', '.jpeg', '.webp'],
    // Naming pattern (kebab-case with optional variant suffixes)
    namingPattern: /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    bold: '\x1b[1m'
};

const issues = {
    errors: [],
    warnings: []
};

function addError(message, file = null) {
    issues.errors.push({ message, file });
}

function addWarning(message, file = null) {
    issues.warnings.push({ message, file });
}

async function loadConfig() {
    const configPath = path.join(ROOT_DIR, 'assets.config.json');
    return JSON.parse(await fs.readFile(configPath, 'utf-8'));
}

async function getImageMetadata(filePath) {
    try {
        return await sharp(filePath).metadata();
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────────────────────────────────────

async function validateNaming(filePath) {
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext);

    // Check extension
    if (!VALIDATION_RULES.validExtensions.includes(ext)) {
        addWarning(`Unsupported file extension: ${ext}`, filePath);
        return;
    }

    // Check naming convention
    if (!VALIDATION_RULES.namingPattern.test(basename)) {
        addError(`Invalid filename (use kebab-case): ${filename}`, filePath);
    }
}

async function validateResolution(filePath, assetType) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Skip SVGs
    if (ext === '.svg') return;

    const metadata = await getImageMetadata(filePath);
    if (!metadata) {
        addError(`Could not read image metadata`, filePath);
        return;
    }

    const minRes = VALIDATION_RULES.minResolution[assetType] || 256;
    const actualRes = Math.min(metadata.width, metadata.height);

    if (actualRes < minRes) {
        addWarning(
            `Low resolution (${metadata.width}×${metadata.height}), recommended minimum: ${minRes}×${minRes}`,
            filePath
        );
    }
}

async function validateRequiredFiles(brandDir, assetType) {
    const patterns = VALIDATION_RULES.requiredFiles[assetType];
    if (!patterns) return;

    const typeDir = path.join(brandDir, assetType);
    
    try {
        const files = await fs.readdir(typeDir);
        
        for (const pattern of patterns) {
            const hasMatch = files.some(f => pattern.test(f));
            if (!hasMatch) {
                addWarning(
                    `Missing recommended file matching ${pattern}`,
                    typeDir
                );
            }
        }
    } catch {
        // Directory doesn't exist, handled elsewhere
    }
}

async function validateBrandDirectory(brandId, brandConfig, sourceDir) {
    const brandDir = path.join(sourceDir, 'brands', brandId);
    
    // Check if source directory exists
    try {
        await fs.access(brandDir);
    } catch {
        addError(`Brand directory not found: ${brandId}`, brandDir);
        return;
    }

    // Get configured asset types
    const configuredTypes = Object.keys(brandConfig);

    for (const assetType of configuredTypes) {
        const typeDir = path.join(brandDir, assetType);
        
        try {
            const files = await fs.readdir(typeDir);
            
            if (files.length === 0) {
                addWarning(`Empty directory`, typeDir);
                continue;
            }

            // Validate each file
            for (const file of files) {
                const filePath = path.join(typeDir, file);
                const stat = await fs.stat(filePath);
                
                if (!stat.isFile()) continue;

                await validateNaming(filePath);
                await validateResolution(filePath, assetType);
            }

            // Check required files
            await validateRequiredFiles(brandDir, assetType);

        } catch {
            addWarning(`Directory not found: ${assetType}`, typeDir);
        }
    }
}

async function checkOrphanedDirectories(config) {
    const sourceDir = path.join(ROOT_DIR, config.sourceDir);
    const brandsDir = path.join(sourceDir, 'brands');

    try {
        const dirs = await fs.readdir(brandsDir, { withFileTypes: true });
        
        for (const dir of dirs) {
            if (!dir.isDirectory()) continue;
            
            if (!config.brands[dir.name]) {
                addWarning(
                    `Orphaned brand directory (not in config)`,
                    path.join(brandsDir, dir.name)
                );
            }
        }
    } catch {
        // Brands directory doesn't exist
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n${colors.cyan}${colors.bold}Asset Validation${colors.reset}\n`);

    const config = await loadConfig();
    const sourceDir = path.join(ROOT_DIR, config.sourceDir);

    // Validate each brand
    for (const [brandId, brandConfig] of Object.entries(config.brands)) {
        console.log(`${colors.dim}Validating:${colors.reset} ${brandId}`);
        await validateBrandDirectory(brandId, brandConfig, sourceDir);
    }

    // Check for orphaned directories
    await checkOrphanedDirectories(config);

    // Print results
    console.log('');

    if (issues.errors.length === 0 && issues.warnings.length === 0) {
        console.log(`${colors.green}✓ All validations passed!${colors.reset}\n`);
        process.exit(0);
    }

    if (issues.warnings.length > 0) {
        console.log(`${colors.yellow}${colors.bold}Warnings (${issues.warnings.length}):${colors.reset}`);
        for (const { message, file } of issues.warnings) {
            const relPath = file ? path.relative(ROOT_DIR, file) : '';
            console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`);
            if (relPath) console.log(`    ${colors.dim}${relPath}${colors.reset}`);
        }
        console.log('');
    }

    if (issues.errors.length > 0) {
        console.log(`${colors.red}${colors.bold}Errors (${issues.errors.length}):${colors.reset}`);
        for (const { message, file } of issues.errors) {
            const relPath = file ? path.relative(ROOT_DIR, file) : '';
            console.log(`  ${colors.red}✗${colors.reset} ${message}`);
            if (relPath) console.log(`    ${colors.dim}${relPath}${colors.reset}`);
        }
        console.log('');
        process.exit(1);
    }

    console.log(`${colors.yellow}Validation completed with warnings${colors.reset}\n`);
    process.exit(0);
}

main().catch(err => {
    console.error(`${colors.red}Validation failed:${colors.reset}`, err.message);
    process.exit(1);
});
