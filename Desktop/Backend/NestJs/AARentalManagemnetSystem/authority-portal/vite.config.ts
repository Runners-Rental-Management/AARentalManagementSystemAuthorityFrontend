import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 46000,
    proxy: {
      "/api-proxy": {
        target: process.env.BACKEND_PROXY_TARGET ?? "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api-proxy/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          recharts: ["recharts"],
        },
      },
    },
  },
});
