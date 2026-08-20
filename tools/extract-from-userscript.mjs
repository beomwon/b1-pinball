// 유저스크립트(sample.script) 안에 gzip+base64로 박혀 있는 게임 HTML을 꺼낸다.
// 사이트 파일을 덮어쓰지 않고 지정한 경로에 단일 HTML로만 뽑는다 (원본 대조용).
//   node tools/extract-from-userscript.mjs sample.script out/game.html
import fs from "node:fs";
import zlib from "node:zlib";

const [src = "sample.script", out = "game.extracted.html"] = process.argv.slice(2);

const line = fs
  .readFileSync(src, "utf8")
  .split(/\r?\n/)
  .find((l) => l.includes("GAME_GZ_B64"));
if (!line) throw new Error("GAME_GZ_B64 를 찾지 못했다");

const b64 = line.match(/'([A-Za-z0-9+/=]+)'/)?.[1];
if (!b64) throw new Error("base64 문자열을 찾지 못했다");

const html = zlib.gunzipSync(Buffer.from(b64, "base64"));
fs.writeFileSync(out, html);
console.log(`${out} (${html.length.toLocaleString()} bytes)`);
