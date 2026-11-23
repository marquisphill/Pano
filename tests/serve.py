#!/usr/bin/env python3
"""Serve a site the way GitHub Pages does, with this repo mounted at /Pano/.

The sites load Paño from /Pano/latest/... (the same address on GitHub Pages).
A plain `python3 -m http.server` cannot answer that address, so use this instead:

    python3 tests/serve.py path/to/site            # port 8773
    python3 tests/serve.py path/to/site 8774       # another port

The site is served at / and the Pano repo (the folder above tests/) at /Pano/.
Nothing is cached, so an edit shows up on the next reload.
"""
import os, sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

SITE = os.path.abspath(sys.argv[1])
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8773
PANO = os.path.abspath(sys.argv[3]) if len(sys.argv) > 3 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        if clean == '/Pano' or clean.startswith('/Pano/'):
            self.directory = PANO
            return super().translate_path(clean[len('/Pano'):] or '/')
        self.directory = SITE
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    print(f'site {SITE} at http://localhost:{PORT}/  |  Pano {PANO} at /Pano/')
    ThreadingHTTPServer(('127.0.0.1', PORT), partial(Handler, directory=SITE)).serve_forever()
