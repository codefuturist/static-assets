/**
 * @fileoverview Type definitions for static-assets manifest
 * @module @codefuturist/static-assets/types
 * @see https://github.com/codefuturist/static-assets
 *
 * @example
 * ```typescript
 * import type {
 *   AssetManifest,
 *   Brand,
 *   Asset,
 *   AssetFile,
 *   AssetFormat
 * } from '@codefuturist/static-assets';
 *
 * // Fetch and type the manifest
 * const manifest: AssetManifest = await fetch(
 *   'https://codefuturist.github.io/static-assets/assets-manifest.json'
 * ).then(r => r.json());
 *
 * // Find a brand
 * const brand = manifest.brands.find(b => b.id === 'rey-it-solutions');
 *
 * // Get logo assets
 * const logos = brand?.assetTypes.find(t => t.type === 'logos');
 *
 * // Build a URL
 * const file = logos?.assets[0].files.find(f => f.format === 'svg');
 * const url = manifest.baseUrls.jsdelivr + file?.path;
 * ```
 */

// Core manifest types
export type {
    AssetManifest,
    BaseUrls,
    Brand,
    AssetTypeGroup,
    AssetType,
    Asset,
    AssetFormat,
    AssetFile,
} from './manifest.js';

// Helper and utility types
export type {
    CdnProvider,
    AssetUrl,
    AssetFilter,
    AssetSortOptions,
    GetAssetUrl,
    GetBestFormat,
    FindAssets,
    GetFileVariant,
    BrandId,
    Mutable,
    DeepMutable,
} from './helpers.js';
