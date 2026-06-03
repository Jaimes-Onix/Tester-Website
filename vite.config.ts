import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * Dev-only live reload for standalone pages in `public/` (e.g. TesterTech.html).
 *
 * Vite's HMR only watches the module graph (src/**), and it does NOT inject its
 * client into raw static files served from public/. So those pages never auto-reload.
 * This plugin fixes both halves:
 *   1) injects Vite's HMR client into public/*.html so the page can receive reload events
 *   2) triggers a full page reload whenever any file under public/ changes
 * It only runs during `vite dev` (apply: "serve"), so builds/preview are unaffected.
 */
function publicLiveReload(): Plugin {
  const publicDir = path.resolve(__dirname, "public");
  return {
    name: "public-live-reload",
    apply: "serve",
    configureServer(server) {
      // (1) inject the HMR client into standalone public HTML responses
      server.middlewares.use((req, res, next) => {
        const url = (req.url || "").split("?")[0];
        if (!url.endsWith(".html")) return next();
        const filePath = path.join(publicDir, decodeURIComponent(url));
        if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) return next();
        let html = fs.readFileSync(filePath, "utf8");
        const tag = `<script type="module" src="/@vite/client"></script>`;
        html = html.includes("</head>") ? html.replace("</head>", `  ${tag}\n</head>`) : tag + html;
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "no-cache");
        res.end(html);
      });

      // (2) reload all connected clients when anything in public/ changes
      const reload = (file: string) => {
        if (path.normalize(file).startsWith(publicDir)) {
          server.ws.send({ type: "full-reload", path: "*" });
        }
      };
      server.watcher.on("change", reload);
      server.watcher.on("add", reload);
      server.watcher.on("unlink", reload);
    },
  };
}

export default defineConfig({
  plugins: [react(), publicLiveReload()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 3000 },
  preview: { port: 3000 },
});
