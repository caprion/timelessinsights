import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'site',
  publicDir: '../public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './site/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
