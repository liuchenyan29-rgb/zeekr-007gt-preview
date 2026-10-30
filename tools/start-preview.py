"""Start a detached preview process and verify that its page is ready."""
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

URL = 'http://127.0.0.1:8765/'


def ready():
    try:
        with urllib.request.urlopen(URL, timeout=1) as response:
            return response.status == 200 and response.headers.get('X-Preview-App') == 'zeekr-007gt'
    except (urllib.error.URLError, OSError):
        return False


if __name__ == '__main__':
    if not ready():
        log_path = Path(tempfile.gettempdir()) / 'zeekr-007gt-preview.log'
        with log_path.open('ab') as log:
            process = subprocess.Popen(
                [sys.executable, '-u', str(Path(__file__).with_name('serve-preview.py'))],
                stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                start_new_session=True,
            )
        for _ in range(40):
            if ready():
                break
            if process.poll() is not None:
                raise SystemExit('Preview could not start. See: ' + str(log_path))
            time.sleep(.15)
        else:
            raise SystemExit('Preview did not become ready. See: ' + str(log_path))
    print(URL)
