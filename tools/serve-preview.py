"""Serve the local viewer on loopback only; no third-party dependencies."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewServer(ThreadingHTTPServer):
    request_queue_size = 128
    allow_reuse_address = True
    daemon_threads = True


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('X-Preview-App', 'zeekr-007gt')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1]
    handler = partial(PreviewHandler, directory=str(root))
    with PreviewServer(('127.0.0.1', 8765), handler) as server:
        print('007 GT preview: http://127.0.0.1:8765/', flush=True)
        server.serve_forever()
