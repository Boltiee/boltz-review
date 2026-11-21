#!/usr/bin/env bash
# Concatenate base64 parts, extract binaries into the repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARTS="$ROOT/.publish/binaries.b64"
if [[ ! -d "$PARTS" ]]; then
  echo "No $PARTS; nothing to decode"
  exit 0
fi
# sort by part name so part-000, part-001, ... concatenate in order
cat $(ls -1 "$PARTS"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
echo "Decoded binaries into $ROOT"
# do not publish the pack machinery
rm -rf "$ROOT/.publish"
