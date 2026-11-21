#!/usr/bin/env bash
# Concatenate base64 parts and extract the site tree into the repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARTS="$ROOT/.publish/binaries.b64"
if [[ ! -d "$PARTS" ]]; then
  echo "No $PARTS; nothing to decode"
  exit 0
fi
cat $(ls -1 "$PARTS"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
echo "Decoded site into $ROOT"
# onetake-v3 review build (separate preview path; does not touch became/darkhour/onetake)
V3="$ROOT/.publish/onetake-v3.b64"
if [[ -d "$V3" ]]; then
  cat $(ls -1 "$V3"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  echo "Decoded onetake-v3 into $ROOT"
fi
rm -rf "$ROOT/.publish"
