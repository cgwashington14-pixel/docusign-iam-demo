#!/usr/bin/env python3
"""Push local .env + private.key to Vercel (production/preview/development)."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"
KEY_FILE = ROOT / "private.key"
TARGETS = ("production", "preview", "development")
PRODUCTION_REDIRECT = "https://docusign-iam-demo.vercel.app/oauth/callback"


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        values[key.strip()] = val.strip().strip('"').strip("'")
    return values


def upsert(name: str, value: str, target: str) -> bool:
    if not value:
        return True
    subprocess.run(
        ["vercel", "env", "rm", name, target, "--yes"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    proc = subprocess.run(
        ["vercel", "env", "add", name, target],
        cwd=ROOT,
        input=value + "\n",
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        print(f"Warning: failed {name} ({target}): {proc.stderr.strip()}", file=sys.stderr)
        return False
    print(f"Set {name} for {target}")
    return True


def main() -> None:
    env = parse_env(ENV_FILE)
    if KEY_FILE.exists():
        pem = KEY_FILE.read_text(encoding="utf-8").strip()
        env["RSA_PRIVATE_KEY"] = pem.replace("\n", "\\n")

    if not env:
        print("No .env found — nothing to sync.", file=sys.stderr)
        sys.exit(1)

    env["DOCUSIGN_REDIRECT_URI"] = PRODUCTION_REDIRECT

    skip = {"RSA_PRIVATE_KEY_PATH"}
    failures = 0
    for target in TARGETS:
        for key, value in sorted(env.items()):
            if key in skip or not value:
                continue
            if not upsert(key, value, target):
                failures += 1

    if failures:
        print(f"Completed with {failures} warning(s).", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
