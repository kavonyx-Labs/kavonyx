#!/usr/bin/env python3
"""Serve frontend/dist. Every sheet is the one index.html.

key.txt and token.json are read from their source files on each request,
so a save shows up without another build.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

REPO = Path(__file__).resolve().parent.parent
ROOT = REPO / "frontend" / "dist"
LIVE = {
    "/key.txt": REPO / "key.txt",
    "/token.json": REPO / "frontend" / "public" / "token.json",
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        live = LIVE.get(path)
        if live is not None:
            self.send_live(live)
            return
        rel = path.lstrip("/")
        target = (ROOT / rel).resolve()
        if not str(target).startswith(str(ROOT.resolve())):
            self.send_error(403)
            return
        if target.is_dir():
            target = target / "index.html"
        if not target.is_file():
            self.path = "/index.html"
        return super().do_GET()

    def send_live(self, path):
        if not path.is_file():
            self.send_error(404)
            return
        data = path.read_bytes()
        kind = "application/json" if path.suffix == ".json" else "text/plain; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8090"))
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
