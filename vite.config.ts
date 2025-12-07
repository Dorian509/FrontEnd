import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    css: {
        devSourcemap: true,
        transformer: 'postcss',  // Verwende PostCSS statt LightningCSS
    },
    build: {
        cssMinify: false,  // Deaktiviere CSS Minification komplett!
        minify: 'esbuild'  // Nur JS minification
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        },
    },
})
