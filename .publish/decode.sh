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
# D-197: promote One Take v3 to /onetake/ (keeps /onetake/order/, shared bar/range CSS, rm-story fallback).
# The d183 One Take stays in the main pack untouched and is also parked at /_parked/onetake-d183/.
# Roll back: delete .publish/onetake-promote/ (one commit).
PROMO="$ROOT/.publish/onetake-promote"
if [[ -d "$PROMO" && -d "$ROOT/onetake-v3" ]]; then
  mkdir -p "$ROOT/_parked"
  cp -a "$ROOT/onetake" "$ROOT/_parked/onetake-d183"
  cp -a "$ROOT/onetake-v3/cg" "$ROOT/onetake/cg"
  cp -a "$ROOT/onetake-v3/video/seq/film-phone/." "$ROOT/onetake/video/seq/film-phone/"
  cp -a "$ROOT/onetake-v3/video/seq/film-desk/." "$ROOT/onetake/video/seq/film-desk/"
  cp "$PROMO/index.html" "$ROOT/onetake/index.html"
  cp "$PROMO/app-v3.js" "$ROOT/onetake/app-v3.js"
  cp "$PROMO/film2.json" "$ROOT/onetake/video/seq/film2.json"
  echo "Promoted One Take v3 to /onetake/"
fi
rm -rf "$ROOT/.publish"
