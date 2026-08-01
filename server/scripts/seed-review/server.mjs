/**
 * Temporary local tool: review seed JSON citations and delete rows from disk.
 * Run: npm run seed:review  →  http://127.0.0.1:9191
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(__dirname, "../../data/seed");
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = Number(process.env.SEED_REVIEW_PORT || 9191);
const HOST = "127.0.0.1";

const FILES = {
  bible: "bible-hy.json",
  fiction: "fiction-quotes.json",
};

async function readSeed(category) {
  const filePath = path.join(SEED_DIR, FILES[category]);
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`${FILES[category]} must be a JSON array`);
  }
  return { filePath, data };
}

async function writeSeed(filePath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const tmp = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(tmp, json, "utf8");
  await fs.rename(tmp, filePath);
}

async function loadAll() {
  const out = [];
  for (const category of Object.keys(FILES)) {
    const { data } = await readSeed(category);
    for (const row of data) {
      out.push({
        id: row.id,
        category: row.category || category,
        text: row.text ?? "",
        source: row.source ?? "",
        file: FILES[category],
      });
    }
  }
  return out;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function sendText(res, status, text, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(text);
}

async function serveStatic(reqPath, res) {
  const safe = reqPath === "/" ? "/index.html" : reqPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safe));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".html"
        ? "text/html; charset=utf-8"
        : ext === ".css"
          ? "text/css; charset=utf-8"
          : ext === ".js"
            ? "text/javascript; charset=utf-8"
            : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    sendText(res, 404, "Not found");
  }
}

async function handleDelete(id, res) {
  if (!id) {
    sendJson(res, 400, { error: "Missing id" });
    return;
  }

  for (const category of Object.keys(FILES)) {
    const { filePath, data } = await readSeed(category);
    const index = data.findIndex((row) => row.id === id);
    if (index === -1) continue;

    const [removed] = data.splice(index, 1);
    await writeSeed(filePath, data);
    sendJson(res, 200, {
      ok: true,
      removed,
      remainingInFile: data.length,
      file: FILES[category],
    });
    return;
  }

  sendJson(res, 404, { error: `Citation not found: ${id}` });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

    if (req.method === "GET" && url.pathname === "/api/citations") {
      const citations = await loadAll();
      sendJson(res, 200, {
        citations,
        counts: {
          total: citations.length,
          bible: citations.filter((c) => c.category === "bible").length,
          fiction: citations.filter((c) => c.category === "fiction").length,
        },
      });
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/citations/")) {
      const id = decodeURIComponent(url.pathname.slice("/api/citations/".length));
      await handleDelete(id, res);
      return;
    }

    if (req.method === "GET") {
      await serveStatic(url.pathname, res);
      return;
    }

    sendText(res, 405, "Method not allowed");
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Seed review tool → http://${HOST}:${PORT}`);
  console.log(`Editing files in ${SEED_DIR}`);
  console.log("Remove writes immediately to local JSON. Ctrl+C to stop.");
});
