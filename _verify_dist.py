"""静态托管产物验证：对 dist/（ESA/Node 构建的输出目录）起 HTTP 服务，
检查所有关键路径与门户/两个计算器内容是否完整可用。
用法：python _verify_dist.py
"""
import os
import sys
import threading
import urllib.request
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")


def main() -> int:
    if not os.path.isdir(ROOT):
        print("dist/ 不存在：请先运行 npm run build（或 build.js 等效逻辑）")
        return 1
    handler = partial(SimpleHTTPRequestHandler, directory=ROOT)
    srv = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    checks = [
        ("/", "text/html", 1000),                        # 门户
        ("/build_info.txt", "text/plain", 5),            # 构建时间戳
        ("/styles.css", "text/css", 1500),
        ("/particles.js", "javascript", 2000),
        ("/bg.jpg", "image/jpeg", 200000),
        ("/dsp/", "text/html", 3000),
        ("/dsp/data.js?v=5", "javascript", 500000),
        ("/dsp/app.js?v=5", "javascript", 50000),
        ("/satisfactory/", "text/html", 3000),
        ("/satisfactory/data.js?v=10", "javascript", 2000000),
        ("/satisfactory/app.js?v=10", "javascript", 50000),
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

    with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=10) as r:
        portal_ok = "\u9752\u5ca9" in r.read().decode("utf-8")  # 青岩
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/dsp/", timeout=10) as r:
        dsp_ok = "\u6234\u68ee\u7403\u8ba1\u5212" in r.read().decode("utf-8")
    with urllib.request.urlopen(f"http://127.0.0.1:{port}/satisfactory/", timeout=10) as r:
        sfy_ok = "Satisfactory" in r.read().decode("utf-8")
    print(f"[{'PASS' if portal_ok else 'FAIL'}] / 包含「青岩」")
    print(f"[{'PASS' if dsp_ok else 'FAIL'}] /dsp/ 为戴森球计算器")
    print(f"[{'PASS' if sfy_ok else 'FAIL'}] /satisfactory/ 为幸福工厂计算器")

    srv.shutdown()
    all_ok = failed == 0 and dsp_ok and sfy_ok and portal_ok
    print("RESULT:", "ALL PASS" if all_ok else f"{failed} FAILURES")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
