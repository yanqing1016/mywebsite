"""本地验证脚本：版本目录本身就是站点根（与镜像内布局一致），
直接对本目录起 HTTP 服务并检查关键路径。
用法：python _verify_local.py
"""
import os
import sys
import threading
import urllib.request
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))


def main() -> int:
    handler = partial(SimpleHTTPRequestHandler, directory=ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    checks = [
        ("/", "text/html", 1000),                        # 门户
        ("/styles.css?v=4.2", "text/css", 1500),
        ("/particles.js?v=4.3", "javascript", 2000),     # 粒子光效脚本（v4 修订）
        ("/bg.jpg", "image/jpeg", 200000),               # 背景图
        # build_info.txt 由 Dockerfile 构建时生成，本地不存在属正常，不检查
        ("/dsp/", "text/html", 3000),                    # DSP 首页
        ("/dsp/data.js?v=5", "javascript", 500000),      # 内嵌图标数据
        ("/dsp/app.js?v=5", "javascript", 50000),
        ("/dsp/vendor/html2canvas.min.js", "javascript", 100000),
        ("/satisfactory/", "text/html", 3000),           # SFY 首页
        ("/satisfactory/data.js?v=10", "javascript", 2000000),
        ("/satisfactory/app.js?v=10", "javascript", 50000),
        ("/satisfactory/vendor/html2canvas.min.js", "javascript", 100000),
    ]

    failed = 0
    for path, ctype, min_len in checks:
        url = f"http://127.0.0.1:{port}{path}"
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                body = resp.read()
                ok = resp.status == 200 and len(body) >= min_len and ctype in resp.headers.get("Content-Type", "")
                tag = "PASS" if ok else "FAIL"
                if not ok:
                    failed += 1
                print(f"[{tag}] {path}  status={resp.status}  bytes={len(body)}  type={resp.headers.get('Content-Type')}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"[FAIL] {path}  error={exc}")

    # 确认门户与两个应用的 HTML 是各自的内容
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=10) as r:
        portal_ok = "\u9752\u5ca9" in r.read().decode("utf-8")  # 青岩
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/dsp/", timeout=10) as r:
        dsp_ok = "\u6234\u68ee\u7403\u8ba1\u5212" in r.read().decode("utf-8")  # 戴森球计划
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/satisfactory/", timeout=10) as r:
        sfy_ok = "Satisfactory" in r.read().decode("utf-8")
    print(f"[{'PASS' if portal_ok else 'FAIL'}] / 页面包含「青岩」")
    print(f"[{'PASS' if dsp_ok else 'FAIL'}] /dsp/ 页面内容为戴森球计算器")
    print(f"[{'PASS' if sfy_ok else 'FAIL'}] /satisfactory/ 页面内容为幸福工厂计算器")

    srv.shutdown()
    all_ok = failed == 0 and dsp_ok and sfy_ok and portal_ok
    print("RESULT:", "ALL PASS" if all_ok else f"{failed} FAILURES")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
