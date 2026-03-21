import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Allow external access (for ngrok/local IP)
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000'
    },
    allowedHosts: ['limberly-supercandid-caprice.ngrok-free.dev'],
    hmr: {
      clientPort: 443
    }
  }
});
