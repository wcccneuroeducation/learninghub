from __future__ import annotations

import contextlib
import http.server
import os
import socket
import socketserver
import threading
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"


def find_free_port(start: int = 8765, attempts: int = 50) -> int:
    for port in range(start, start + attempts):
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            try:
                sock.bind((HOST, port))
                return port
            except OSError:
                continue
    raise RuntimeError("Could not find a free local port.")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


def main() -> None:
    os.chdir(ROOT)
    port = find_free_port()
    url = f"http://{HOST}:{port}/index.html"

    with socketserver.TCPServer((HOST, port), QuietHandler) as server:
        print("NeuroQuest Content Studio is running.")
        print(url)
        print("Keep this window open while using the Studio.")
        print("Press Ctrl+C to stop it.\n")

        threading.Thread(
            target=lambda: (time.sleep(0.7), webbrowser.open(url)),
            daemon=True,
        ).start()

        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStudio stopped.")


if __name__ == "__main__":
    main()
