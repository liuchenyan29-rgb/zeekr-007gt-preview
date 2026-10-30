#!/bin/zsh
set -eu
preview_directory="${0:A:h}"
python3 "$preview_directory/tools/start-preview.py"
open 'http://127.0.0.1:8765/'
