#!/usr/bin/env bash
# Installs Piper and the two Swedish voices into .tools/ (gitignored), for
# `npm run audio`. macOS only, because the audio build encodes with afconvert.
# The path stays short on purpose: Piper's speech engine cannot find its data
# under a very long path.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -m venv .tools/piper-venv
.tools/piper-venv/bin/pip install --quiet piper-tts==1.8.0

mkdir -p .tools/voices
base=https://huggingface.co/rhasspy/piper-voices/resolve/main/sv/sv_SE
for voice in nst alma; do
  for ext in onnx onnx.json; do
    file=".tools/voices/sv_SE-$voice-medium.$ext"
    [ -f "$file" ] || curl -sSfL -o "$file" "$base/$voice/medium/sv_SE-$voice-medium.$ext"
  done
done
echo "Piper and voices are ready. Run: npm run audio"
