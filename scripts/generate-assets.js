#!/usr/bin/env node

/**
 * Asset Generation Pipeline
 * 
 * Processes source assets and generates optimized variants:
 * - Format conversion (WebP, AVIF)
 * - Size variants (thumbnails, retina)
 * - SVG optimization
 * - Image compression
 * 
 * Usage:
 *   npm run build:assets           # Process all assets
 *   npm run build:assets -- --brand rey-it-solutions  # Process single brand
 *   npm run build:assets -- --watch  # Watch for changes
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { optimize } from 'svgo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.dirname(__dirname);

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

async function loadConfig() {
    const configPath = path.join(ROOT_DIR, 'assets.config.json');
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function log(message, level = 'info') {
    const prefix = {
        info: '\x1b[36mℹ\x1b[0m',
        success: '\x1b[32m✓\x1b[0m',
        warn: '\x1b[33m⚠\x1b[0m',
        error: '\x1b[31m✗\x1b[0m',
    }[level] || '';
    console.log(`${prefix} ${message}`);
}

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function getFiles(dir, extensions = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await getFiles(fullPath, extensions));
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (extensions.length === 0 || extensions.includes(ext)) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

function getBaseName(filePath) {
    return path.basename(filePath, path.extname(filePath));
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Processing
// ─────────────────────────────────────────────────────────────────────────────

async function processSvg(inputPath, outputPath, config) {
    const content = await fs.readFile(inputPath, 'utf-8');
    const result = optimize(content, {
        path: inputPath,
        ...config.svgo,
    });

    await ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, result.data);

    const inputSize = Buffer.byteLength(content, 'utf8');
    const outputSize = Buffer.byteLength(result.data, 'utf8');
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

    log(`${path.basename(outputPath)} (${savings}% smaller)`, 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// Raster Image Processing
// ─────────────────────────────────────────────────────────────────────────────

async function processRasterImage(inputPath, outputDir, assetConfig, globalConfig) {
    const baseName = getBaseName(inputPath);
    const inputExt = path.extname(inputPath).toLowerCase().slice(1);
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    const sizes = assetConfig.sizes || globalConfig.defaults.sizes || [];
    const formats = assetConfig.formats || globalConfig.defaults.formats || ['original'];
    const generateRetina = assetConfig.generateRetina || false;
    const quality = globalConfig.defaults.quality;

    await ensureDir(outputDir);

    const tasks = [];

    // Generate size variants
    const sizeVariants = sizes.length > 0 ? sizes : [{ name: null, width: metadata.width }];

    for (const sizeConfig of sizeVariants) {
        const width = sizeConfig.width;
        const height = sizeConfig.height;
        const sizeSuffix = sizeConfig.name ? `-${sizeConfig.name}` : '';

        // Skip if requested size is larger than source
        if (width > metadata.width) {
            log(`Skipping ${baseName}${sizeSuffix} (source too small)`, 'warn');
            continue;
        }

        const retinaMultipliers = generateRetina && width * 2 <= metadata.width
            ? [1, 2]
            : [1];

        for (const multiplier of retinaMultipliers) {
            const actualWidth = width * multiplier;
            const actualHeight = height ? height * multiplier : undefined;
            const retinaSuffix = multiplier > 1 ? `@${multiplier}x` : '';

            for (const format of formats) {
                const outputFormat = format === 'original' ? inputExt : format;
                const outputName = `${baseName}${sizeSuffix}${retinaSuffix}.${outputFormat}`;
                const outputPath = path.join(outputDir, outputName);

                tasks.push(async () => {
                    let pipeline = sharp(inputPath)
                        .resize(actualWidth, actualHeight, {
                            fit: 'inside',
                            withoutEnlargement: true,
                        });

                    // Apply format-specific options
                    switch (outputFormat) {
                        case 'jpg':
                        case 'jpeg':
                            pipeline = pipeline.jpeg({ quality: quality.jpg, mozjpeg: true });
                            break;
                        case 'png':
                            pipeline = pipeline.png({ quality: quality.png, compressionLevel: 9 });
                            break;
                        case 'webp':
                            pipeline = pipeline.webp({ quality: quality.webp });
                            break;
                        case 'avif':
                            pipeline = pipeline.avif({ quality: quality.avif });
                            break;
                    }

                    await pipeline.toFile(outputPath);
                    log(`${outputName}`, 'success');
                });
            }
        }
    }

    // Process in parallel with concurrency limit
    const concurrency = 4;
    for (let i = 0; i < tasks.length; i += concurrency) {
        await Promise.all(tasks.slice(i, i + concurrency).map(fn => fn()));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand Processing
// ─────────────────────────────────────────────────────────────────────────────

async function processBrand(brandName, brandConfig, config) {
    const sourceDir = path.join(ROOT_DIR, config.sourceDir, 'brands', brandName);
    const outputDir = path.join(ROOT_DIR, config.outputDir, 'brands', brandName);

    log(`\n📦 Processing brand: ${brandName}`);

    for (const [assetType, assetConfig] of Object.entries(brandConfig)) {
        const assetSourceDir = path.join(sourceDir, assetType);
        const assetOutputDir = path.join(outputDir, assetType);

        try {
            await fs.access(assetSourceDir);
        } catch {
            log(`No source directory: ${assetType}/`, 'warn');
            continue;
        }

        log(`\n  📁 ${assetType}/`);

        // Process SVGs
        const svgFiles = await getFiles(assetSourceDir, ['.svg']);
        for (const svgFile of svgFiles) {
            const relativePath = path.relative(assetSourceDir, svgFile);
            const outputPath = path.join(assetOutputDir, relativePath);

            // 1. Optimize and save SVG
            await processSvg(svgFile, outputPath, config);

            // 2. Generate raster variants from SVG
            await processRasterImage(svgFile, assetOutputDir, assetConfig, config);
        }

        // Process raster images
        const rasterFiles = await getFiles(assetSourceDir, ['.jpg', '.jpeg', '.png', '.gif']);
        for (const rasterFile of rasterFiles) {
            await processRasterImage(rasterFile, assetOutputDir, assetConfig, config);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest Generation
// ─────────────────────────────────────────────────────────────────────────────

async function generateManifest(config) {
    const outputDir = path.join(ROOT_DIR, config.outputDir);
    const brandsDir = path.join(outputDir, 'brands');

    const manifest = {
        generated: new Date().toISOString(),
        version: 'v1',
        baseUrls: {
            github: 'https://codefuturist.github.io/static-assets/',
            jsdelivr: 'https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/'
        },
        brands: []
    };

    // Scan brands directory
    const brandDirs = await fs.readdir(brandsDir, { withFileTypes: true });

    for (const brandEntry of brandDirs) {
        if (!brandEntry.isDirectory()) continue;

        const brandId = brandEntry.name;
        const brandPath = path.join(brandsDir, brandId);
        const brand = {
            id: brandId,
            name: brandId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            assetTypes: []
        };

        // Scan asset type directories (logos, icons, images)
        const assetTypeDirs = await fs.readdir(brandPath, { withFileTypes: true });

        for (const typeEntry of assetTypeDirs) {
            if (!typeEntry.isDirectory()) continue;

            const assetType = typeEntry.name;
            const typePath = path.join(brandPath, assetType);
            const files = await fs.readdir(typePath);

            // Group files by base asset name
            const assetGroups = {};

            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (!['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(ext)) continue;

                const baseName = path.basename(file, ext);
                // Parse: logo-on-brand-128 -> { name: 'logo-on-brand', size: 128 }
                // Parse: logo-128 -> { name: 'logo', size: 128 }
                // Parse: logo -> { name: 'logo', size: null }
                const sizeMatch = baseName.match(/^(.+?)-(\d+)$/);
                let assetName, size;

                if (sizeMatch) {
                    assetName = sizeMatch[1];
                    size = parseInt(sizeMatch[2], 10);
                } else {
                    assetName = baseName;
                    size = null;
                }

                if (!assetGroups[assetName]) {
                    assetGroups[assetName] = {
                        id: assetName,
                        name: assetName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        type: assetType,
                        basePath: `v1/brands/${brandId}/${assetType}/${assetName}`,
                        sizes: new Set(),
                        formats: new Set(),
                        files: []
                    };
                }

                const format = ext.slice(1);
                assetGroups[assetName].formats.add(format);
                if (size) assetGroups[assetName].sizes.add(size);
                assetGroups[assetName].files.push({
                    file,
                    format,
                    size,
                    path: `v1/brands/${brandId}/${assetType}/${file}`
                });
            }

            // Convert Sets to sorted arrays
            const assets = Object.values(assetGroups).map(group => ({
                ...group,
                sizes: Array.from(group.sizes).sort((a, b) => a - b),
                formats: Array.from(group.formats).sort()
            }));

            if (assets.length > 0) {
                brand.assetTypes.push({
                    type: assetType,
                    assets
                });
            }
        }

        if (brand.assetTypes.length > 0) {
            manifest.brands.push(brand);
        }
    }

    // Write manifest to parent assets/ directory (where index.html lives)
    const manifestPath = path.join(ROOT_DIR, 'assets', 'assets-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    log(`Generated assets-manifest.json`, 'success');

    return manifest;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const brandFilter = args.includes('--brand')
        ? args[args.indexOf('--brand') + 1]
        : null;

    log('🚀 Asset Generation Pipeline\n');

    const config = await loadConfig();

    // Ensure output directories exist
    await ensureDir(path.join(ROOT_DIR, config.outputDir, 'brands'));
    await ensureDir(path.join(ROOT_DIR, config.outputDir, 'shared'));

    // Process brands
    for (const [brandName, brandConfig] of Object.entries(config.brands)) {
        if (brandFilter && brandName !== brandFilter) continue;
        await processBrand(brandName, brandConfig, config);
    }

    // Generate manifest for the asset browser
    log('\n📋 Generating asset manifest...');
    await generateManifest(config);

    log('\n✨ Asset generation complete!\n');
}

main().catch(err => {
    log(err.message, 'error');
    process.exit(1);
});
