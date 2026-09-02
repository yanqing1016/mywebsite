"""生成 GitHub 网页上传包：github-upload/dsp 与 github-upload/satisfactory。
每个计算器只含线上运行必需的 5 个文件（图标已内嵌在 data.js，无需 img/ 目录）。
"""
import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "github-upload")
ESSENTIAL = ["index.html", "styles.css", "data.js", "app.js"]
VENDOR = os.path.join("vendor", "html2canvas.min.js")

shutil.rmtree(OUT, ignore_errors=True)
for name in ("dsp", "satisfactory"):
    src = os.path.join(ROOT, name)
    dst = os.path.join(OUT, name)
    os.makedirs(os.path.join(dst, "vendor"))
    for f in ESSENTIAL:
        shutil.copy2(os.path.join(src, f), os.path.join(dst, f))
    shutil.copy2(os.path.join(src, VENDOR), os.path.join(dst, VENDOR))
    files = 0
    size = 0
    for dp, _, fns in os.walk(dst):
        for fn in fns:
            files += 1
            size += os.path.getsize(os.path.join(dp, fn))
    print(f"{name}: {files} files, {size // 1024} KB")
