import { defineConfig } from 'vite';

export default defineConfig({
  base: '/magic-fusion-lab/',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
