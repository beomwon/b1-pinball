// 의존성 없는 로컬 정적 서버 — node serve.js [포트]
// GitHub Pages와 동일하게 이 폴더를 그대로 서빙한다.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.argv[2] || 5173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webm": "video/webm",
  ".map": "application/json",
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const file = path.resolve(ROOT, "." + p);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404 " + p);
        return;
      }
      res.writeHead(200, {
        "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(buf);
    });
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT} 에서 실행 중 (Ctrl+C 종료)`));
