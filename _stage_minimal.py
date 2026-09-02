"""模拟 ESA 构建（使用 github-upload 里的 10 文件精简版计算器）：
生成 dist/ 并供浏览器验证 —— 证明仓库补传 10 个文件后构建即可成功、站点完整可用。
"""
import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")
FILES = ["index.html", "styles.css", "particles.js", "bg.jpg"]

for f in FILES:
    assert os.path.exists(os.path.join(ROOT, f)), f
for name in ("dsp", "satisfactory"):
    assert os.path.exists(os.path.join(ROOT, "github-upload", name, "index.html")), name

shutil.rmtree(DIST, ignore_errors=True)
os.makedirs(DIST)
for f in FILES:
    shutil.copy2(os.path.join(ROOT, f), os.path.join(DIST, f))
for name in ("dsp", "satisfactory"):
    shutil.copytree(os.path.join(ROOT, "github-upload", name), os.path.join(DIST, name))
with open(os.path.join(DIST, "build_info.txt"), "w") as f:
    f.write("BUILD_TIME minimal-upload-test")

total = sum(len(fns) for _, _, fns in os.walk(DIST))
print(f"dist/: {total} files (minimal calculator version)")
