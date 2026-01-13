/**
 * TypeScript type definitions for the static-assets manifest
 * 
 * Usage:
 * ```typescript
 * import type { AssetManifest } from '@codefuturist/static-assets/types/manifest';
 * 
 * const manifest: AssetManifest = await fetch('...').then(r => r.json());
 * ```
 */

/**
 * Root manifest structure
 */
export interface AssetManifest {
    /** ISO 8601 timestamp of when the manifest was generated */
    generated: string;

    /** Asset API version (e.g., "v1") */
    version: string;

    /** Base URLs for different CDN options */
    baseUrls: BaseUrls;

    /** Array of available brands */
    brands: Brand[];
}

/**
 * CDN base URLs for constructing asset paths
 */
export interface BaseUrls {
    /** GitHub Pages URL */
    github: string;

    /** jsDelivr CDN URL */
    jsdelivr: string;
}

/**
 * Brand containing multiple asset types
 */
export interface Brand {
    /** Unique brand identifier (kebab-case, e.g., "rey-it-solutions") */
    id: string;

    /** Human-readable brand name (e.g., "Rey IT Solutions") */
    name: string;

    /** Optional brand description for UI/search */
    description?: string;

    /** Optional tags to improve search/discovery */
    tags?: string[];

    /** Optional aliases/synonyms (e.g., abbreviations) */
    aliases?: string[];

    /** Array of asset type categories */
    assetTypes: AssetTypeGroup[];
}

/**
 * Group of assets by type (logos, icons, images)
 */
export interface AssetTypeGroup {
    /** Asset type identifier */
    type: AssetType;

    /** Array of assets in this category */
    assets: Asset[];
}

/**
 * Supported asset type categories
 */
export type AssetType = 'logos' | 'icons' | 'images';

/**
 * Individual asset with all its variants
 */
export interface Asset {
    /** Unique asset identifier within its type (e.g., "logo", "logo-on-brand") */
    id: string;

    /** Human-readable asset name (e.g., "Logo On Brand") */
    name: string;

    /** Preferred UI name (falls back to `name`) */
    displayName?: string;

    /** Optional short description */
    description?: string;

    /** Optional usage guidance (e.g., background constraints) */
    usage?: string;

    /** Optional tags to improve search/discovery */
    tags?: string[];

    /** Optional aliases/synonyms */
    aliases?: string[];

    /** Optional ordering hint (lower first) */
    sortKey?: number;

    /** Asset type category */
    type: AssetType;

    /** Base path for constructing URLs (without size/format suffix) */
    basePath: string;

    /** Available sizes in pixels (empty for vector-only assets) */
    sizes: number[];

    /** Available file formats */
    formats: AssetFormat[];

    /** Array of all available file variants */
    files: AssetFile[];
}

/**
 * Supported image formats
 */
export type AssetFormat = 'svg' | 'png' | 'webp' | 'avif' | 'jpg';

/**
 * Individual file variant of an asset
 */
export interface AssetFile {
    /** Filename including extension */
    file: string;

    /** File format */
    format: AssetFormat;

    /** Size in pixels (null for original/vector) */
    size: number | null;

    /** Relative path from assets root (e.g., "v1/brands/acme/logos/logo-128.png") */
    path: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construct a full URL for an asset file
 */
export type AssetUrl<T extends 'github' | 'jsdelivr'> =
    T extends 'github'
    ? `https://codefuturist.github.io/static-assets/${string}`
    : `https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/assets/${string}`;

/**
 * Find assets by brand ID
 */
export type AssetsForBrand<B extends string> = Asset[];

/**
 * Find assets by type
 */
export type AssetsOfType<T extends AssetType> = Asset[];

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions (for documentation purposes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Example: Build full URL for an asset
 * 
 * ```typescript
 * function getAssetUrl(
 *   manifest: AssetManifest,
 *   file: AssetFile,
 *   cdn: 'github' | 'jsdelivr' = 'jsdelivr'
 * ): string {
 *   return manifest.baseUrls[cdn] + file.path;
 * }
 * ```
 */
export type GetAssetUrl = (
    manifest: AssetManifest,
    file: AssetFile,
    cdn?: 'github' | 'jsdelivr'
) => string;

/**
 * Example: Find best format for browser support
 * 
 * ```typescript
 * function getBestFormat(asset: Asset): AssetFormat {
 *   const priority: AssetFormat[] = ['avif', 'webp', 'svg', 'png', 'jpg'];
 *   return priority.find(f => asset.formats.includes(f)) || 'png';
 * }
 * ```
 */
export type GetBestFormat = (asset: Asset) => AssetFormat;
