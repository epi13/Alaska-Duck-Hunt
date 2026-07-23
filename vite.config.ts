import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 8000,
    strictPort: true,
    headers: { 'Cache-Control': 'no-store' },
  },
  preview: { host: true, port: 4173, strictPort: true },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'assets/icon.svg',
        'assets/characters/alaska-husky/atlas.png',
        'assets/characters/alaska-husky/atlas.json',
        'assets/characters/alaska-husky/preview.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'Alaska Duck Hunt',
        short_name: 'AK Duck Hunt',
        description: 'An original retro-modern Alaskan bird hunting arcade game.',
        theme_color: '#071521',
        background_color: '#071521',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        icons: [
          { src: 'assets/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  build: { target: 'es2022', sourcemap: true },
});
