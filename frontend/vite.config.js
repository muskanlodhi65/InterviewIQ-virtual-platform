import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// InterviewIQ frontend build config. In Replit dev, the backend runs on
// :8000 and this dev server on :5173; the proxy below lets the frontend
// call relative "/api/..." paths without hardcoding a host, so the same
// code works locally and once deployed behind a single domain.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
