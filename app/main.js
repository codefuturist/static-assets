import Fuse from 'fuse.js';
import './styles.css';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let manifest = null;
let fuse = null;
let allAssets = [];
let filteredAssets = [];
let selectedBrands = new Set();
let selectedTypes = new Set();
let previewBg = 'checkerboard'; // 'checkerboard', 'light', 'dark'
let currentAsset = null;

const BASE_URLS = {
    github: 'https://codefuturist.github.io/static-assets/',
    jsdelivr: 'https://cdn.jsdelivr.net/gh/codefuturist/static-assets@main/site/'
};

// ─────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────
async function init() {
    // Load manifest
    try {
        const res = await fetch('assets-manifest.json');
        manifest = await res.json();

        // Flatten assets for search
        allAssets = [];
        for (const brand of manifest.brands) {
            for (const assetType of brand.assetTypes) {
                for (const asset of assetType.assets) {
                    allAssets.push({
                        ...asset,
                        brandId: brand.id,
                        brandName: brand.name,
                        brandTags: brand.tags || [],
                        brandAliases: brand.aliases || [],
                        assetType: assetType.type
                    });
                }
            }
        }

        // Initialize Fuse.js
        fuse = new Fuse(allAssets, {
            keys: [
                { name: 'displayName', weight: 0.35 },
                { name: 'name', weight: 0.25 },
                { name: 'tags', weight: 0.2 },
                { name: 'aliases', weight: 0.2 },
                { name: 'description', weight: 0.1 },
                { name: 'usage', weight: 0.05 },
                { name: 'brandName', weight: 0.15 },
                { name: 'brandTags', weight: 0.05 },
                { name: 'brandAliases', weight: 0.05 },
                { name: 'assetType', weight: 0.05 },
                { name: 'id', weight: 0.05 },
                { name: 'brandId', weight: 0.02 }
            ],
            threshold: 0.4,
            ignoreLocation: true,
            minMatchCharLength: 2
        });

        // Setup filters
        setupFilters();

        // Initial render
        filterAndRender();

        // Hide loading
        document.getElementById('loadingState').classList.add('hidden');

    } catch (err) {
        console.error('Failed to load manifest:', err);
        document.getElementById('loadingState').innerHTML = `
            <svg class="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <p class="text-red-500">Failed to load assets manifest</p>
        `;
    }

    // Setup event listeners
    document.getElementById('searchInput').addEventListener('input', debounce(filterAndRender, 200));
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('bgToggle').addEventListener('click', cyclePreviewBg);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);

    // Check for dark mode preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    // Modal event listeners
    document.getElementById('modalFormat').addEventListener('change', updateModalUrls);
    document.getElementById('modalSize').addEventListener('change', updateModalUrls);

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // '/' or Cmd/Ctrl+K focuses search
    document.addEventListener('keydown', (e) => {
        const isTypingInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
        if (isTypingInInput) return;
        if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────────────────
function setupFilters() {
    const brandFilters = document.getElementById('brandFilters');
    const typeFilters = document.getElementById('typeFilters');

    const brands = manifest?.brands || [];
    const types = [...new Set(allAssets.map(a => a.assetType))].sort();

    brands.forEach(brand => {
        const btn = createFilterChip(brand.id, brand.name, 'brand');
        brandFilters.appendChild(btn);
    });

    types.forEach(type => {
        const label = type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const btn = createFilterChip(type, label, 'type');
        typeFilters.appendChild(btn);
    });
}

function createFilterChip(value, label, filterType) {
    const btn = document.createElement('button');
    btn.className = 'px-3 py-1.5 text-sm font-medium rounded-full border transition-all';
    btn.textContent = label;
    btn.dataset.value = value;
    btn.dataset.filterType = filterType;

    updateChipStyle(btn, false);

    btn.addEventListener('click', () => {
        const set = filterType === 'brand' ? selectedBrands : selectedTypes;
        if (set.has(value)) {
            set.delete(value);
            updateChipStyle(btn, false);
        } else {
            set.add(value);
            updateChipStyle(btn, true);
        }
        filterAndRender();
    });

    return btn;
}

function updateChipStyle(btn, active) {
    if (active) {
        btn.className = 'px-3 py-1.5 text-sm font-medium rounded-full border border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 transition-all';
    } else {
        btn.className = 'px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtering & Rendering
// ─────────────────────────────────────────────────────────────────────────────
function filterAndRender() {
    const query = document.getElementById('searchInput').value.trim();

    // Start with all assets or search results
    if (query) {
        filteredAssets = fuse.search(query).map(r => r.item);
    } else {
        filteredAssets = [...allAssets];
    }

    // Apply filters
    if (selectedBrands.size > 0) {
        filteredAssets = filteredAssets.filter(a => selectedBrands.has(a.brandId));
    }
    if (selectedTypes.size > 0) {
        filteredAssets = filteredAssets.filter(a => selectedTypes.has(a.assetType));
    }

    // Stable sort: brand -> type -> sortKey -> displayName
    filteredAssets.sort((a, b) => {
        const brandCmp = String(a.brandName).localeCompare(String(b.brandName));
        if (brandCmp !== 0) return brandCmp;
        const typeCmp = String(a.assetType).localeCompare(String(b.assetType));
        if (typeCmp !== 0) return typeCmp;
        const aKey = typeof a.sortKey === 'number' ? a.sortKey : 9999;
        const bKey = typeof b.sortKey === 'number' ? b.sortKey : 9999;
        if (aKey !== bKey) return aKey - bKey;
        const aName = a.displayName || a.name || a.id;
        const bName = b.displayName || b.name || b.id;
        return String(aName).localeCompare(String(bName));
    });

    // Toggle clear button
    const hasFilters = query.length > 0 || selectedBrands.size > 0 || selectedTypes.size > 0;
    document.getElementById('clearFiltersBtn').classList.toggle('hidden', !hasFilters);

    renderAssets();
}

function renderAssets() {
    const grid = document.getElementById('assetGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');

    resultsCount.textContent = `${filteredAssets.length} asset${filteredAssets.length !== 1 ? 's' : ''}`;

    if (filteredAssets.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    grid.innerHTML = filteredAssets.map(asset => createAssetCard(asset)).join('');
}

function createAssetCard(asset) {
    const previewFile = asset.files.find(f => f.format === 'svg')
        || asset.files.find(f => f.format === 'png' && f.size === 128)
        || asset.files.find(f => f.format === 'png')
        || asset.files[0];

    const previewUrl = BASE_URLS.github + previewFile.path;
    const bgClass = getPreviewBgClass();

    const title = asset.displayName || asset.name;
    const desc = asset.description || asset.usage || '';
    const tags = Array.isArray(asset.tags) ? asset.tags : [];
    const tagBadges = tags.slice(0, 3).map(t => `
        <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">${escapeHtml(t)}</span>
    `).join('');

    return `
        <div class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden card-hover cursor-pointer" onclick="window.openModal('${asset.brandId}', '${asset.assetType}', '${asset.id}')">
            <!-- Preview -->
            <div class="aspect-square ${bgClass} flex items-center justify-center p-8 relative overflow-hidden">
                <img 
                    src="${previewUrl}" 
                    alt="${escapeHtml(title)}"
                    class="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                    loading="lazy"
                >
                
                <!-- Quick actions overlay -->
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"></div>
            </div>
            
            <!-- Info -->
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">${escapeHtml(title)}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${escapeHtml(asset.brandName)} • ${escapeHtml(asset.assetType)}</p>

                ${desc ? `<p class="text-sm text-gray-600 dark:text-gray-300 mt-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(desc)}</p>` : ''}

                ${tagBadges ? `<div class="flex flex-wrap gap-1.5 mt-3">${tagBadges}</div>` : ''}
                
                <!-- Format badges -->
                <div class="flex flex-wrap gap-1.5 mt-3">
                    ${asset.formats.map(f => `
                        <span class="px-2 py-0.5 text-xs font-medium text-white rounded badge-${f}">${f.toUpperCase()}</span>
                    `).join('')}
                </div>
                
                <!-- Sizes -->
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    ${asset.sizes.length > 0 ? `${asset.sizes.length} sizes (${asset.sizes[0]}–${asset.sizes[asset.sizes.length - 1]}px)` : 'Vector'}
                </p>
            </div>
        </div>
    `;
}

function clearAllFilters() {
    selectedBrands.clear();
    selectedTypes.clear();
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('button[data-filter-type]').forEach(btn => updateChipStyle(btn, false));
    filterAndRender();
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────
function openModal(brandId, assetType, assetId) {
    currentAsset = allAssets.find(a =>
        a.brandId === brandId && a.assetType === assetType && a.id === assetId
    );

    if (!currentAsset) return;

    // Set title
    const title = currentAsset.displayName || currentAsset.name;
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalSubtitle').textContent = `${currentAsset.brandName} • ${currentAsset.assetType}`;

    const meta = document.getElementById('modalMeta');
    const tags = Array.isArray(currentAsset.tags) ? currentAsset.tags : [];
    const aliases = Array.isArray(currentAsset.aliases) ? currentAsset.aliases : [];
    const blocks = [];

    if (currentAsset.description) {
        blocks.push(`<p class="text-sm text-gray-700 dark:text-gray-300">${escapeHtml(currentAsset.description)}</p>`);
    }
    if (currentAsset.usage) {
        blocks.push(`<p class="text-sm text-gray-600 dark:text-gray-400 mt-2">${escapeHtml(currentAsset.usage)}</p>`);
    }
    if (tags.length > 0) {
        blocks.push(`<div class="flex flex-wrap gap-1.5 mt-3">${tags.map(t => `<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">${escapeHtml(t)}</span>`).join('')}</div>`);
    }
    if (aliases.length > 0) {
        blocks.push(`<p class="text-xs text-gray-400 dark:text-gray-500 mt-3">Also known as: ${aliases.map(a => `<span class="font-mono">${escapeHtml(a)}</span>`).join(', ')}</p>`);
    }

    meta.innerHTML = blocks.length > 0
        ? `<div class="rounded-xl border border-gray-200 dark:border-gray-700 p-4">${blocks.join('')}</div>`
        : '';

    // Populate format dropdown
    const formatSelect = document.getElementById('modalFormat');
    formatSelect.innerHTML = currentAsset.formats.map(f =>
        `<option value="${f}">${f.toUpperCase()}</option>`
    ).join('');

    // Populate size dropdown
    const sizeSelect = document.getElementById('modalSize');
    const sizes = currentAsset.sizes.length > 0 ? currentAsset.sizes : [null];
    sizeSelect.innerHTML = sizes.map(s =>
        `<option value="${s || 'original'}">${s ? s + 'px' : 'Original (Vector)'}</option>`
    ).join('');

    // Set preview background
    document.getElementById('modalPreview').className = `flex items-center justify-center p-8 rounded-xl mb-6 transition-colors ${getPreviewBgClass()}`;

    // Update URLs
    updateModalUrls();

    // Show modal
    document.getElementById('modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.body.style.overflow = '';
    currentAsset = null;
}

function updateModalUrls() {
    if (!currentAsset) return;

    const format = document.getElementById('modalFormat').value;
    const sizeVal = document.getElementById('modalSize').value;
    const size = sizeVal === 'original' ? null : parseInt(sizeVal, 10);

    // Find matching file
    const file = currentAsset.files.find(f =>
        f.format === format && f.size === size
    );

    if (!file) {
        // Try to find any file with this format
        const fallback = currentAsset.files.find(f => f.format === format);
        if (fallback) {
            document.getElementById('modalGithubUrl').value = BASE_URLS.github + fallback.path;
            document.getElementById('modalJsdelivrUrl').value = BASE_URLS.jsdelivr + fallback.path;
            document.getElementById('modalImage').src = BASE_URLS.github + fallback.path;
        }
        return;
    }

    document.getElementById('modalGithubUrl').value = BASE_URLS.github + file.path;
    document.getElementById('modalJsdelivrUrl').value = BASE_URLS.jsdelivr + file.path;
    document.getElementById('modalImage').src = BASE_URLS.github + file.path;
}

function copyUrl(type) {
    const input = type === 'github'
        ? document.getElementById('modalGithubUrl')
        : document.getElementById('modalJsdelivrUrl');

    navigator.clipboard.writeText(input.value).then(() => {
        showToast(`${type === 'github' ? 'GitHub Pages' : 'jsDelivr'} URL copied!`, 'success');
    }).catch(() => {
        showToast('Failed to copy URL', 'error');
    });
}

function downloadAsset() {
    const url = document.getElementById('modalGithubUrl').value;
    const filename = url.split('/').pop();

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Download started', 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview Background
// ─────────────────────────────────────────────────────────────────────────────
function getPreviewBgClass() {
    switch (previewBg) {
        case 'light': return 'bg-white';
        case 'dark': return 'bg-gray-900';
        default: return 'checkerboard';
    }
}

function cyclePreviewBg() {
    const order = ['checkerboard', 'light', 'dark'];
    const idx = order.indexOf(previewBg);
    previewBg = order[(idx + 1) % order.length];

    // Re-render cards
    renderAssets();

    // Update modal if open
    if (currentAsset) {
        document.getElementById('modalPreview').className = `flex items-center justify-center p-8 rounded-xl mb-6 transition-colors ${getPreviewBgClass()}`;
    }

    showToast(`Preview: ${previewBg} background`, 'info');
}

// ─────────────────────────────────────────────────────────────────────────────
// Dark Mode
// ─────────────────────────────────────────────────────────────────────────────
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-brand-500'
    };

    toast.className = `${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg toast-enter flex items-center gap-2`;

    const icons = {
        success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
        error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
        info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    };

    toast.innerHTML = `${icons[type]}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────
function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

// Export functions that need to be called from HTML onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.copyUrl = copyUrl;
window.downloadAsset = downloadAsset;

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────
init();
