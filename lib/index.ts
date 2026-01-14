/**
 * @fileoverview Static Assets Library
 * @module @codefuturist/static-assets
 * @see https://github.com/codefuturist/static-assets
 *
 * @description
 * Type definitions and utilities for working with the static-assets manifest.
 * This library provides TypeScript types for consuming the asset manifest API.
 *
 * @example
 * ```typescript
 * import type { AssetManifest, Asset, AssetFormat } from '@codefuturist/static-assets';
 *
 * async function loadAssets(): Promise<AssetManifest> {
 *   const response = await fetch(
 *     'https://codefuturist.github.io/static-assets/assets-manifest.json'
 *   );
 *   return response.json();
 * }
 *
 * function getAssetUrl(manifest: AssetManifest, asset: Asset, format: AssetFormat): string {
 *   const file = asset.files.find(f => f.format === format);
 *   return file ? manifest.baseUrls.jsdelivr + file.path : '';
 * }
 * ```
 */

// Re-export all types from the types module
export type * from './types/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default manifest URL (GitHub Pages)
 */
export const MANIFEST_URL = 'https://codefuturist.github.io/static-assets/assets-manifest.json' as const;

/**
 * CDN base URLs
 */
export const CDN_URLS = {
    github: 'https://codefuturist.github.io/static-assets/',
    jsdelivr: 'https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/site/',
} as const;

/**
 * Supported asset formats in order of preference (best quality/compression first)
 */
export const FORMAT_PRIORITY = ['avif', 'webp', 'svg', 'png', 'jpg'] as const;

/**
 * Standard icon/favicon sizes
 */
export const STANDARD_SIZES = {
    favicon: [16, 32, 48],
    appIcon: [64, 96, 128, 180, 192, 256, 512],
    social: [1200],
} as const;
