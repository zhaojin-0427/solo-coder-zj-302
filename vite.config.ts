import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 9210,
    host: true,
  },
  build: {
    target: 'es2020',
  },
});
