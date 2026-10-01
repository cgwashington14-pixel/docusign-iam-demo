#!/usr/bin/env python3
"""Screenshot every portal page from two checkouts and report pixel differences.

    git worktree add /tmp/baseline <ref>
    python scripts/visual_diff.py --old /tmp/baseline --new . --theme light --width 1400

Each checkout is served on its own port with the site gate disabled; headless Chrome renders
every page and any console errors are reported next to the pixel diff. Differences are
written as ``*-DIFF.png`` (changed pixels in red) under ``--out``. Requires Pillow + numpy.
"""

from __future__ import annotations

import argparse
import concurrent.futures as futures
import os
import signal
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

PAGE_TIMEOUT = 45
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PAGES = {
    "home": "/",
    "agent": "/agent",
    "agreement-desk": "/agreement-desk",
    "clm": "/clm-troubleshoot",
    "embedded": "/embedded",
    "envelopes": "/envelopes",
    "send": "/envelopes/send",
    "explorer": "/explorer",
    "gov-agents": "/gov-agents",
    "gov-workflows": "/gov-workflows?state=CA",
    "integration": "/integration-story",
    "maestro": "/maestro",
    "navigator": "/navigator",
    "procurement": "/procurement-intake",
    "webforms": "/webforms",
    "webhooks": "/webhooks",
    "discovery": "/workflow-discovery",
    "workspaces": "/workspaces",
    "admin": "/admin",
    "notfound": "/no-such-page",
}
SERVE = """
import sys
sys.path.insert(0, '.')
try:
    from iamdemo import create_app
    app = create_app()
except ImportError:
    import app as module
    app = module.app


@app.after_request
def force_theme(response):
    # Pin the theme before boot-theme.js runs, independent of the OS appearance.
    if response.mimetype == "text/html" and not response.direct_passthrough:
        marker = b"<head>"
        script = b"<script>localStorage.setItem('ds-theme','{theme}')</script>"
        response.set_data(response.get_data().replace(marker, marker + script, 1))
    return response


app.run(port={port}, threaded=True)
"""


def serve(checkout: Path, port: int, theme: str) -> subprocess.Popen:
    # No credentials: pages render their signed-out states, which keeps runs fast and deterministic.
    env = {
        **os.environ,
        "FLASK_SECRET_KEY": "visual-diff",
        "SITE_PASSWORD": "",
        "DOCUSIGN_ACCESS_TOKEN": "",
        "RSA_PRIVATE_KEY": "",
        "RSA_PRIVATE_KEY_PATH": "/nonexistent",
    }
    proc = subprocess.Popen(
        [sys.executable, "-c", SERVE.format(port=port, theme=theme)],
        cwd=checkout,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for _ in range(100):
        try:
            urllib.request.urlopen(f"http://localhost:{port}/static/favicon.svg", timeout=1)
            return proc
        except OSError:
            time.sleep(0.2)
    proc.kill()
    raise RuntimeError(f"server on {port} did not start")


def shoot(port: int, name: str, path: str, out: Path, width: int) -> list[str]:
    png = out / f"{name}.png"
    with tempfile.TemporaryDirectory() as profile:
        command = [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--user-data-dir={profile}",
            "--enable-logging=stderr",
            "--v=0",
            "--virtual-time-budget=4000",
            f"--window-size={width},1800",
            f"--screenshot={png}",
            f"http://localhost:{port}{path}",
        ]
        # Chrome spawns helper processes: log to a file (not a pipe) and use a process group so a
        # hung page can be killed without blocking on inherited descriptors.
        log = Path(profile) / "chrome.log"
        with log.open("w") as sink:
            proc = subprocess.Popen(command, stdout=sink, stderr=sink, start_new_session=True)
            # Headless Chrome often keeps running after the screenshot is written, so treat a
            # non-empty, stable PNG as completion and stop the process group ourselves.
            deadline = time.monotonic() + PAGE_TIMEOUT
            last_size = -1
            while proc.poll() is None:
                if time.monotonic() > deadline:
                    os.killpg(proc.pid, signal.SIGKILL)
                    return [f"TIMEOUT after {PAGE_TIMEOUT}s"]
                size = png.stat().st_size if png.exists() else 0
                if size and size == last_size:
                    break
                last_size = size
                time.sleep(1)
            if proc.poll() is None:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.wait()
        stderr = log.read_text(errors="replace")
    ignore = ("favicon", "googleapis", "gstatic", "private-network")
    return [
        line.split("CONSOLE", 1)[1][:200]
        for line in stderr.splitlines()
        if "CONSOLE" in line and not any(token in line for token in ignore)
    ]


def capture(port: int, out: Path, pages: dict[str, str], width: int) -> dict[str, list[str]]:
    out.mkdir(parents=True, exist_ok=True)
    with futures.ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {name: pool.submit(shoot, port, name, path, out, width) for name, path in pages.items()}
        return {name: job.result() for name, job in jobs.items()}


def compare(old: Path, new: Path, threshold: float) -> None:
    for png in sorted(old.glob("*.png")):
        other = new / png.name
        a = np.asarray(Image.open(png).convert("RGB")).astype(int)
        b = np.asarray(Image.open(other).convert("RGB")).astype(int)
        if a.shape != b.shape:
            print(f"{png.stem:16s} SIZE CHANGED {a.shape[:2]} -> {b.shape[:2]}")
            continue
        changed = np.abs(a - b).sum(axis=2) > 40
        pct = changed.mean() * 100
        if pct <= threshold:
            print(f"{png.stem:16s} ok ({pct:.3f}%)")
            continue
        ys, xs = np.where(changed)
        print(f"{png.stem:16s} {pct:6.2f}% changed  x {xs.min()}-{xs.max()}  y {ys.min()}-{ys.max()}")
        marked = b.copy()
        marked[changed] = [255, 0, 0]
        Image.fromarray(marked.astype("uint8")).save(new / f"{png.stem}-DIFF.png")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--old", required=True, type=Path)
    parser.add_argument("--new", default=".", type=Path)
    parser.add_argument("--theme", choices=("light", "dark"), default="light")
    parser.add_argument("--width", type=int, default=1400)
    parser.add_argument("--pages", nargs="*", help="subset of page names (default: all)")
    parser.add_argument("--threshold", type=float, default=0.05, help="percent of pixels allowed to differ")
    parser.add_argument("--out", type=Path, default=Path(tempfile.gettempdir()) / "visual-diff")
    args = parser.parse_args()

    pages = {k: v for k, v in PAGES.items() if not args.pages or k in args.pages}
    servers = [serve(args.old.resolve(), 5078, args.theme), serve(args.new.resolve(), 5077, args.theme)]
    try:
        tag = f"{args.theme}-{args.width}"
        old_logs = capture(5078, args.out / f"old-{tag}", pages, args.width)
        new_logs = capture(5077, args.out / f"new-{tag}", pages, args.width)
    finally:
        for proc in servers:
            proc.kill()

    compare(args.out / f"old-{tag}", args.out / f"new-{tag}", args.threshold)
    print("\nConsole messages (old -> new):")
    for name in pages:
        if old_logs[name] or new_logs[name]:
            print(f"  {name}: old={old_logs[name]} new={new_logs[name]}")
    print(f"\nImages in {args.out}")


if __name__ == "__main__":
    main()
