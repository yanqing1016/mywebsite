/*
 * 青岩 · 游戏产线计算器 —— 静态托管构建脚本（阿里云 ESA / 任意 Node CI）
 *
 * 本站是纯静态站点：构建 = 校验入口文件存在 + 把站点文件原样复制到 dist/。
 * 零依赖，只需 Node 16.7+（fs.cpSync），在 ESA 的 Node 22 构建环境直接可用。
 *
 * 用法：npm run build（或 node build.js）
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

// 站点文件清单（仓库根 = 站点根）
const FILES = ["index.html", "styles.css", "particles.js", "bg.jpg"];
const DIRS = ["dsp", "satisfactory"];

// 构建前校验：入口缺失立即失败，把问题暴露在构建期而不是部署后
for (const f of FILES) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    console.error("BUILD ERROR: 缺少站点文件 " + f + "，请确认仓库内容完整");
    process.exit(1);
  }
}
for (const d of DIRS) {
  if (!fs.existsSync(path.join(ROOT, d, "index.html"))) {
    console.error(
      "BUILD ERROR: 缺少 " + d + "/index.html —— 仓库里还没有 " + d +
      "/ 目录。把本目录 github-upload/" + d +
      " 里的 5 个文件上传到仓库同名目录（GitHub 网页：Add file → Upload files 可整文件夹拖入）"
    );
    process.exit(1);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

for (const f of FILES) {
  fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
}
for (const d of DIRS) {
  fs.cpSync(path.join(ROOT, d), path.join(DIST, d), { recursive: true });
}

// 构建信息（与 Docker 版 build_info.txt 的用途一致：验证线上跑的是新构建）
fs.writeFileSync(DIST + "/build_info.txt", "BUILD_TIME " + new Date().toISOString() + "\n");

const count = (dir) =>
  fs.readdirSync(dir, { recursive: true }).filter((e) => {
    const full = path.join(dir, e);
    return fs.statSync(full).isFile();
  }).length;

console.log("BUILD OK: dist/ 已生成（" + count(DIST) + " 个文件）");
