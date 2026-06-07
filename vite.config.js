import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rssProxyPlugin = () => ({
  name: 'rss-proxy',
  configureServer(server) {
    server.middlewares.use('/api/rss', async (req, res) => {
      try {
        const requestUrl = new URL(req.url ?? '', 'http://localhost');
        const feedUrl = requestUrl.searchParams.get('url');

        if (!feedUrl) {
          res.statusCode = 400;
          res.end('Missing feed url');
          return;
        }

        const response = await fetch(feedUrl);
        const body = await response.text();

        res.statusCode = response.status;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.end(body);
      } catch {
        res.statusCode = 502;
        res.end('Feed proxy failed');
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), rssProxyPlugin()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
