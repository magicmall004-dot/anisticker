import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change base to match your GitHub Pages repo name
// e.g. https://HtunHlaAung.github.io/anisticker → base: process.env.VITE_BASE || "/anisticker/"
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/anisticker/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
