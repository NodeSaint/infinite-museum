import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// GitHub Pages serves from /infinite-museum/. Local dev uses '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/infinite-museum/' : '/',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        test: resolve(__dirname, 'test.html'),
      },
    },
  },
}));
