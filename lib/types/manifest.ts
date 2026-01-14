/**
 * @fileoverview Core manifest type definitions for static-assets
 * @module @codefuturist/static-assets/types
 * @see https://github.com/codefuturist/static-assets
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Root manifest structure returned by the assets API
 *
 * @example
 * ```typescript
 * import type { AssetManifest } from '@codefuturist/static-assets';
 *
 * const manifest: AssetManifest = await fetch(
 *   'https://codefuturist.github.io/static-assets/assets-manifest.json'
 * ).then(r => r.json());
 *
 * console.log(manifest.brands.length); // Number of available brands
 * ```
 */
export interface AssetManifest {
    /** ISO 8601 timestamp of when the manifest was generated */
    readonly generated: string;

    /** Asset API version (e.g., "v1") */
    readonly version: string;

    /** Base URLs for different CDN options */
    readonly baseUrls: BaseUrls;

    /** Array of available brands */
    readonly brands: Brand[];
}

/**
 * CDN base URLs for constructing asset paths
 */
export interface BaseUrls {
    /** GitHub Pages URL (e.g., "https://codefuturist.github.io/static-assets/") */
    readonly github: string;

    /** jsDelivr CDN URL (e.g., "https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/site/") */
    readonly jsdelivr: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Brand containing multiple asset types
 *
 * @example
 * ```typescript
 * const brand = manifest.brands.find(b => b.id === 'rey-it-solutions');
 * console.log(brand?.name); // "Rey IT Solutions"
 * ```
 */
export interface Brand {
    /** Unique brand identifier (kebab-case, e.g., "rey-it-solutions") */
    readonly id: string;

    /** Human-readable brand name (e.g., "Rey IT Solutions") */
    readonly name: string;

    /** Optional brand description for UI/search */
    readonly description?: string;

    /** Optional tags to improve search/discovery */
    readonly tags?: readonly string[];

    /** Optional aliases/synonyms (e.g., abbreviations) */
    readonly aliases?: readonly string[];

    /** Array of asset type categories */
    readonly assetTypes: readonly AssetTypeGroup[];
}

/**
 * Group of assets by type (logos, icons, images)
 */
export interface AssetTypeGroup {
    /** Asset type identifier */
    readonly type: AssetType;

    /** Array of assets in this category */
    readonly assets: readonly Asset[];
}

/**
 * Supported asset type categories
 */
export type AssetType = 'logos' | 'icons' | 'images';

// ─────────────────────────────────────────────────────────────────────────────
// Asset Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Individual asset with all its variants
 *
 * @example
 * ```typescript
 * const logos = brand.assetTypes.find(t => t.type === 'logos');
 * const primaryLogo = logos?.assets.find(a => a.id === 'logo');
 *
 * // Get SVG version
 * const svg = primaryLogo?.files.find(f => f.format === 'svg');
 * const url = manifest.baseUrls.jsdelivr + svg?.path;
 * ```
 */
export interface Asset {
    /** Unique asset identifier within its type (e.g., "logo", "logo-on-brand") */
    readonly id: string;

    /** Human-readable asset name (e.g., "Logo On Brand") */
    readonly name: string;

    /** Preferred UI name (falls back to `name`) */
    readonly displayName?: string;

    /** Optional short description */
    readonly description?: string;

    /** Optional usage guidance (e.g., background constraints) */
    readonly usage?: string;

    /** Optional tags to improve search/discovery */
    readonly tags?: readonly string[];

    /** Optional aliases/synonyms */
    readonly aliases?: readonly string[];

    /** Optional ordering hint (lower values sort first) */
    readonly sortKey?: number;

    /** Asset type category */
    readonly type: AssetType;

    /** Base path for constructing URLs (without size/format suffix) */
    readonly basePath: string;

    /** Available sizes in pixels (empty for vector-only assets) */
    readonly sizes: readonly number[];

    /** Available file formats */
    readonly formats: readonly AssetFormat[];

    /** Array of all available file variants */
    readonly files: readonly AssetFile[];
}

/**
 * Supported image formats
 */
export type AssetFormat = 'svg' | 'png' | 'webp' | 'avif' | 'jpg';

/**
 * Individual file variant of an asset
 */
export interface AssetFile {
    /** Filename including extension (e.g., "logo-128.png") */
    readonly file: string;

    /** File format */
    readonly format: AssetFormat;

    /** Size in pixels (null for original/vector) */
    readonly size: number | null;

    /** Relative path from site root (e.g., "v1/brands/acme/logos/logo-128.png") */
    readonly path: string;
}
