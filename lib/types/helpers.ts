/**
 * @fileoverview Helper and utility type definitions
 * @module @codefuturist/static-assets/types/helpers
 */

import type { Asset, AssetFile, AssetFormat, AssetManifest, AssetType } from './manifest.js';

// ─────────────────────────────────────────────────────────────────────────────
// URL Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CDN provider options
 */
export type CdnProvider = 'github' | 'jsdelivr';

/**
 * Construct a full URL for an asset file based on CDN provider
 *
 * @example
 * ```typescript
 * const url: AssetUrl<'jsdelivr'> = 'https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/site/v1/...';
 * ```
 */
export type AssetUrl<T extends CdnProvider> = T extends 'github'
    ? `https://codefuturist.github.io/static-assets/${string}`
    : `https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/site/${string}`;

// ─────────────────────────────────────────────────────────────────────────────
// Filter Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter options for querying assets
 */
export interface AssetFilter {
    /** Filter by brand ID(s) */
    brands?: string | readonly string[];

    /** Filter by asset type(s) */
    types?: AssetType | readonly AssetType[];

    /** Filter by format(s) */
    formats?: AssetFormat | readonly AssetFormat[];

    /** Filter by minimum size */
    minSize?: number;

    /** Filter by maximum size */
    maxSize?: number;

    /** Search query for name/tags */
    query?: string;
}

/**
 * Sort options for asset results
 */
export interface AssetSortOptions {
    /** Field to sort by */
    by: 'name' | 'size' | 'format' | 'sortKey';

    /** Sort direction */
    direction?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────────────────────
// Function Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Function signature for building full asset URLs
 *
 * @example
 * ```typescript
 * const getAssetUrl: GetAssetUrl = (manifest, file, cdn = 'jsdelivr') => {
 *   return manifest.baseUrls[cdn] + file.path;
 * };
 * ```
 */
export type GetAssetUrl = (
    manifest: AssetManifest,
    file: AssetFile,
    cdn?: CdnProvider
) => string;

/**
 * Function signature for finding the best format for browser support
 *
 * @example
 * ```typescript
 * const getBestFormat: GetBestFormat = (asset) => {
 *   const priority: AssetFormat[] = ['avif', 'webp', 'svg', 'png', 'jpg'];
 *   return priority.find(f => asset.formats.includes(f)) || 'png';
 * };
 * ```
 */
export type GetBestFormat = (asset: Asset) => AssetFormat;

/**
 * Function signature for finding assets matching criteria
 */
export type FindAssets = (
    manifest: AssetManifest,
    filter?: AssetFilter
) => Asset[];

/**
 * Function signature for getting a specific file variant
 */
export type GetFileVariant = (
    asset: Asset,
    options?: {
        format?: AssetFormat;
        size?: number;
        preferLarger?: boolean;
    }
) => AssetFile | undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Mapped Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract all brand IDs from a manifest (useful with const assertions)
 */
export type BrandId<M extends AssetManifest> = M['brands'][number]['id'];

/**
 * Make all properties in T mutable (removes readonly)
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * Deep mutable version of a type
 */
export type DeepMutable<T> = {
    -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};
