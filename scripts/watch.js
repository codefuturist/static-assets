#!/usr/bin/env node
/**
 * Watch Mode for Asset Development
 * Auto-rebuilds assets when source files change
 * 
 * Usage: npm run dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const WATCH_PATHS = [
    path.join(ROOT_DIR, '_source'),
    path.join(ROOT_DIR, 'assets.config.json')
];

const DEBOUNCE_MS = 500;
const VALID_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.json'];

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

let debounceTimer = null;
let isBuilding = false;

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
        info: `${colors.cyan}ℹ${colors.reset}`,
        success: `${colors.green}✓${colors.reset}`,
        warning: `${colors.yellow}⚠${colors.reset}`,
        error: `${colors.red}✗${colors.reset}`,
        watch: `${colors.cyan}👁${colors.reset}`
    };
    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${icons[type]} ${message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Runner
// ─────────────────────────────────────────────────────────────────────────────

function runBuild() {
    if (isBuilding) {
        log('Build already in progress, skipping...', 'warning');
        return;
    }

    isBuilding = true;
    log('Building assets...', 'info');
    
    const startTime = Date.now();
    
    const build = spawn('node', ['scripts/generate-assets.js'], {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });

    build.on('close', code => {
        isBuilding = false;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        if (code === 0) {
            log(`Build completed in ${duration}s`, 'success');
        } else {
            log(`Build failed with code ${code}`, 'error');
        }
        
        console.log('');
        log('Watching for changes...', 'watch');
    });

    build.on('error', err => {
        isBuilding = false;
        log(`Build error: ${err.message}`, 'error');
    });
}

function debouncedBuild(changedFile) {
    clearTimeout(debounceTimer);
    
    const relPath = path.relative(ROOT_DIR, changedFile);
    log(`Changed: ${colors.cyan}${relPath}${colors.reset}`, 'info');
    
    debounceTimer = setTimeout(runBuild, DEBOUNCE_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// File Watcher
// ─────────────────────────────────────────────────────────────────────────────

function watchDirectory(dir) {
    try {
        fs.watch(dir, { recursive: true }, (eventType, filename) => {
            if (!filename) return;
            
            const ext = path.extname(filename).toLowerCase();
            if (!VALID_EXTENSIONS.includes(ext)) return;
            
            const fullPath = path.join(dir, filename);
            debouncedBuild(fullPath);
        });
        
        log(`Watching: ${colors.dim}${path.relative(ROOT_DIR, dir)}${colors.reset}`, 'watch');
    } catch (err) {
        log(`Failed to watch ${dir}: ${err.message}`, 'error');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

console.log(`
${colors.cyan}${colors.bold}Asset Watch Mode${colors.reset}
${colors.dim}Auto-rebuilds assets when source files change${colors.reset}
${colors.dim}Press Ctrl+C to stop${colors.reset}
`);

// Initial build
runBuild();

// Start watching
for (const watchPath of WATCH_PATHS) {
    try {
        const stat = fs.statSync(watchPath);
        if (stat.isDirectory()) {
            watchDirectory(watchPath);
        } else {
            // Watch parent directory for file changes
            fs.watch(watchPath, () => {
                debouncedBuild(watchPath);
            });
            log(`Watching: ${colors.dim}${path.relative(ROOT_DIR, watchPath)}${colors.reset}`, 'watch');
        }
    } catch {
        log(`Watch path not found: ${watchPath}`, 'warning');
    }
}

console.log('');

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n${colors.dim}Stopping watch mode...${colors.reset}\n`);
    process.exit(0);
});
