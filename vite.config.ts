import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 8082,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    cors: true,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/standalone.tsx'),
      name: 'FoodcubeConfigurator',
      formats: ['iife'],
      fileName: 'foodcube-configurator',
    },
    rollupOptions: {
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) => {
          // Ensure the bundled stylesheet is named for the Shopify theme include
          if ((assetInfo.name || '').endsWith('.css')) {
            return 'foodcube-configurator.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    minify: true,
    sourcemap: true,
  },
}));
