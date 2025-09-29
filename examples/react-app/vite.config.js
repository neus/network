import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  server: {
    proxy: {
      '/api/neus': {
        target: 'https://api.neus.network',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/neus\/?/, '/'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', '');
            proxyReq.removeHeader?.('cookie');
            proxyReq.removeHeader?.('referer');
          });
        }
      }
    }
  }
});
