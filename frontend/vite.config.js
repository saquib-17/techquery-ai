import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),       // ⭐ Required for React apps
    tailwindcss(), // ⭐ Required for Tailwind v4
  ],
});
