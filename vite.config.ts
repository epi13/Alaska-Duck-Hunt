import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [VitePWA({ registerType: 'prompt', includeAssets: ['assets/icon.svg'], manifest: {
    name: 'Alaska Duck Hunt', short_name: 'AK Duck Hunt', description: 'An original retro-modern Alaskan bird hunting arcade game.',
    theme_color: '#071521', background_color: '#071521', display: 'standalone', orientation: 'any', start_url: './',
    icons: [{ src: 'assets/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
  }})],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  build: { target: 'es2022', sourcemap: true }
});
