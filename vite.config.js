import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ensure all routes are handled by index.html for HashRouter
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
