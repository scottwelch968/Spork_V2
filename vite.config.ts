/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false,
    allowedHosts: ['dev_01.loc', 'localhost', 'site01'],
    hmr: {
      host: "dev_01.loc",
      clientPort: 80
    },
    proxy: {
      '/api/supabase/v1': {
        target: 'https://api.supabase.com/v1',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/supabase\/v1/, ''),
      },
    },
    // Serve docs directory for migration SQL files
    fs: {
      allow: ['..']
    }
  },
  preview: {
    port: 5173,
  },
  plugins: [
    react(),
    // Custom plugin to handle admin SPA routing
    {
      name: 'admin-spa-fallback',
      configureServer(server: any) {
        server.middlewares.use((req: any, res: any, next: any) => {
          // If request starts with /admin (but not requesting a file), serve admin/index.html
          if (req.url?.startsWith('/admin') && !req.url.includes('.')) {
            req.url = '/admin/index.html';
          }
          next();
        });
      },
    },
    // Serve docs/migrate SQL files
    {
      name: 'serve-migration-sql',
      configureServer(server: any) {
        server.middlewares.use('/docs/migrate', (req: any, res: any, next: any) => {
          if (req.url && req.url.endsWith('.sql')) {
            const filePath = path.join(__dirname, 'docs', 'migrate', req.url);
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end(content);
              return;
            }
          }
          next();
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  // Phase 8: Bundle separation - admin code in separate chunk
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin/index.html'),
      },
      output: {
        manualChunks: (id) => {
          // Admin code in separate chunk
          if (id.includes('/src/admin/')) {
            return 'admin';
          }
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            return 'vendor';
          }
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}']
    }
  }
}));
