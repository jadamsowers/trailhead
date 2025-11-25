import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    // Generate pre-compressed assets for nginx/CDN to serve
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),
    viteCompression({ algorithm: "gzip", ext: ".gz", threshold: 10240 }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
    // Ensure proper cache busting for assets
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    // show brotli size in build output
    brotliSize: true,
  },
});
