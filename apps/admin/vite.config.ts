import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pinned so local dev is deterministic. Vite otherwise defaults both apps to
  // 5173 and increments when taken, so whichever started second got 5174 —
  // which silently swapped which app each origin in the API's allowlist
  // referred to. strictPort fails loudly instead of drifting to another port.
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
