#!/usr/bin/env python3
"""Redeploy the VPS Docker project at one commit, through Hostinger's Docker Manager API.

    HOSTINGER_API_TOKEN=... python3 deploy/hostinger.py <full commit sha>

Sends deploy/docker-compose.yml with the project's current environment, changing only GIT_REF
(SITE_HOST, SITE_IP and an optional GITHUB_TOKEN stay as the owner set them). Then waits until the
builder reports that commit and the web container is healthy again. Used by
.github/workflows/deploy.yml on every push to main.
"""

import json
import os
import re
import secrets
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "https://developers.hostinger.com/api/vps/v1/virtual-machines/2059641/docker"
PROJECT = "mazen-book"
TIMEOUT_S = 20 * 60


def call(method, path="", body=None):
    req = urllib.request.Request(
        API + path,
        method=method,
        data=None if body is None else json.dumps(body).encode(),
        # the API's Cloudflare front rejects urllib's default User-Agent (error 1010)
        headers={"Authorization": f"Bearer {os.environ['HOSTINGER_API_TOKEN']}", "Content-Type": "application/json", "Accept": "application/json", "User-Agent": "mazen-book-deploy"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read()
    except urllib.error.HTTPError as err:
        sys.exit(f"::error::{method} {path or '/'} failed: {err.code} {err.read()[:300].decode(errors='replace')}")
    return json.loads(raw) if raw else None


def fresh(status, elapsed_min):
    """True when docker's "Up …" text says the container started during this deploy."""
    if "second" in status or "About a minute" in status:
        return True
    m = re.search(r"Up (\d+) minutes", status)
    return bool(m) and int(m.group(1)) <= elapsed_min + 1


def main(sha):
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        sys.exit(f"::error::expected a full commit SHA, got {sha!r}")

    current = call("GET", f"/{PROJECT}")
    env = [line for line in current["environment"].splitlines() if line and not line.startswith("GIT_REF=")]
    if not any(line.startswith("DB_PASSWORD=") for line in env):
        # first deploy with the database: Postgres keeps whatever password it is created with, so
        # this is generated once and then carried forward with the rest of the environment
        env.append(f"DB_PASSWORD={secrets.token_hex(24)}")
        print("Generated DB_PASSWORD for the new database (kept in the project's environment)")
    compose = (Path(__file__).parent / "docker-compose.yml").read_text()
    call("POST", "", {"project_name": PROJECT, "content": compose, "environment": "\n".join([f"GIT_REF={sha}", *env])})
    print(f"Deploy of {sha[:7]} sent; waiting for the build (a few minutes on this VPS)")

    started = time.time()
    built = False
    while time.time() - started < TIMEOUT_S:
        time.sleep(15)
        elapsed_min = int((time.time() - started) // 60)
        if not built:
            logs = json.dumps(call("GET", f"/{PROJECT}/logs"))
            built = f"release {sha} built" in logs or f"release {sha} already built" in logs
            if built:
                print("Build done; waiting for the web container")
        containers = {c["name"].removeprefix(f"{PROJECT}-").removesuffix("-1"): c for c in call("GET", f"/{PROJECT}/containers")}
        builder, web = containers.get("builder", {}), containers.get("web", {})
        if builder.get("state") == "exited" and not builder.get("status", "").startswith("Exited (0)") and fresh(builder.get("status", ""), elapsed_min):
            print(json.dumps(call("GET", f"/{PROJECT}/logs"))[-3000:])
            sys.exit(f"::error::The build failed on the VPS ({builder['status']}). The previous release is still live.")
        if built and web.get("health") == "healthy" and fresh(web.get("status", ""), elapsed_min):
            print(f"Live: {sha[:7]} is serving ({web['status']})")
            return
    sys.exit("::error::Timed out waiting for the deploy. Check the project in hPanel → VPS → Docker Manager.")


if __name__ == "__main__":
    if not os.environ.get("HOSTINGER_API_TOKEN"):
        sys.exit("::error::Add HOSTINGER_API_TOKEN (hPanel → Account → API) under Settings > Secrets and variables > Actions > Repository secrets.")
    main(sys.argv[1] if len(sys.argv) > 1 else "")
