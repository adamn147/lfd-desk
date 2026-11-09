// Local test server that mimics Vercel: serves the pages and runs api/*.js.
// Usage: APP_PASSWORD=test ANTHROPIC_API_KEY=... node dev/server.mjs
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, "");
      const file = path.join(root, "api", name + ".js");
      const mod = await import(pathToFileURL(file).href);
      return await mod.default(req, res);
    }
    const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = path.join(root, path.normalize(rel));
    if (!file.startsWith(root) || rel.startsWith("api") || rel.startsWith("dev") || rel.startsWith("node_modules")) throw new Error("nope");
    const body = await fs.readFile(file);
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(body);
  } catch (e) {
    if (!res.headersSent) { res.statusCode = 404; res.end("Not found"); }
  }
}).listen(PORT, () => console.log(`LFD Desk running at http://localhost:${PORT}`));
