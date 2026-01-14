import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    publicDir: '../site', // Serve site folder as public dir in dev
    build: {
        outDir: '../site',
        emptyOutDir: false, // Keep generated image assets from generate-assets.js
        rollupOptions: {
            output: {
                // Use consistent naming for cache busting
                entryFileNames: 'js/[name]-[hash].js',
                chunkFileNames: 'js/[name]-[hash].js',
                assetFileNames: ({ name }) => {
                    if (/\.css$/.test(name ?? '')) {
                        return 'css/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        }
    },
    server: {
        port: 3000,
        open: true
    }
});
