/*
 * 青岩 · 游戏产线计算器 —— 静态托管构建脚本（阿里云 ESA / 任意 Node CI）
 *
 * 本站是纯静态站点：构建 = 校验入口文件存在 + 把站点文件原样复制到 dist/。
 * 零依赖，只需 Node 16.7+（fs.cpSync），在 ESA 的 Node 22 构建环境直接可用。
 *
 * 计算器目录 dsp/、satisfactory/ 与音乐解锁 music/ 支持两种提供方式（二选一，目录优先）：
 *   1. 仓库里直接有 dsp/、satisfactory/ 目录；
 *   2. 仓库根有 dsp.zip、satisfactory.zip（构建时自动解压进 dist/，仓库保持整洁）。
 *
 * 用法：npm run build（或 node build.js）
 */
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// 站点文件清单（仓库根 = 站点根）
const FILES = ["index.html", "styles.css", "particles.js", "bg.jpg"];
const DIRS = ["dsp", "satisfactory", "music"];

// 构建前校验：入口缺失立即失败，把问题暴露在构建期而不是部署后
for (const f of FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    console.error("BUILD ERROR: 缺少站点文件 " + f + "，请确认仓库内容完整");
    process.exit(1);
  }
}
for (const d of DIRS) {
  const hasDir = fs.existsSync(path.join(ROOT, d, "index.html"));
  const hasZip = fs.existsSync(path.join(ROOT, d + ".zip"));
  if (!hasDir && !hasZip) {
    console.error(
      "BUILD ERROR: 缺少 " + d + "/ 目录。两种修复方式任选其一后重新触发构建：" +
      "① 上传 " + d + ".zip（推荐，在 github-upload/ 里，Add file → Upload files 拖入即可）；" +
      "② 上传 " + d + "/ 目录（github-upload/" + d + " 里，共 5 个运行必需文件）"
    );
    process.exit(1);
  }
}

/* ---------- 纯 Node 最小 zip 解压（method 0=存储 / 8=deflate） ---------- */

function extractZip(zipPath, destDir) {
  const buf = fs.readFileSync(zipPath);

  // 从尾部找 End of Central Directory（注释最长 65535）
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("无效的 zip 文件（找不到 EOCD）: " + zipPath);

  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16); // central directory 起始偏移

  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error("zip 中央目录损坏: " + zipPath);
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOff = buf.readUInt32LE(ptr + 42);
    const name = buf.toString("utf8", ptr + 46, ptr + 46 + nameLen);
    ptr += 46 + nameLen + extraLen + commentLen;
    if (!name.endsWith("/")) entries.push({ name, method, compSize, localOff });
  }

  // 若所有条目共享同一个顶层目录（如 dsp/xxx），剥掉它，避免双层嵌套
  let strip = "";
  if (entries.length) {
    const first = entries[0].name.split("/")[0];
    if (first && entries.every((e) => e.name.startsWith(first + "/"))) strip = first + "/";
  }

  for (const e of entries) {
    // 定位 local file header 后的数据区
    const lNameLen = buf.readUInt16LE(e.localOff + 26);
    const lExtraLen = buf.readUInt16LE(e.localOff + 28);
    const dataStart = e.localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(dataStart, dataStart + e.compSize);

    let data;
    if (e.method === 0) data = raw;
    else if (e.method === 8) data = zlib.inflateRawSync(raw);
    else throw new Error("不支持的 zip 压缩方法 " + e.method + "（条目 " + e.name + "）");

    const rel = e.name.slice(strip.length);
    const outPath = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, data);
  }
}

/* ------------------------------- 构建 ------------------------------- */

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
}
for (const d of DIRS) {
  const dest = path.join(DIST, d);
  if (fs.existsSync(path.join(ROOT, d, "index.html"))) {
    fs.cpSync(path.join(ROOT, d), dest, { recursive: true });
    console.log(d + "/: 使用仓库目录");
  } else {
    extractZip(path.join(ROOT, d + ".zip"), dest);
    console.log(d + "/: 从 " + d + ".zip 解压");
  }
}

// 构建信息（与 Docker 版 build_info.txt 的用途一致：验证线上跑的是新构建）
fs.writeFileSync(
  path.join(DIST, "build_info.txt"),
  "BUILD_TIME " + new Date().toISOString() + "\n"
);

const count = (dir) =>
  fs.readdirSync(dir, { recursive: true }).filter((e) => {
    const full = path.join(dir, e);
    return fs.statSync(full).isFile();
  }).length;

console.log("BUILD OK: dist/ 已生成（" + count(DIST) + " 个文件）");
