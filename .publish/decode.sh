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
# D-198: reduced-motion v3 stills (onetake-v3/index.html + onetake-v3/img/rm/)
D198="$ROOT/.publish/onetake-d198.b64"
if [[ -d "$D198" ]]; then
  cat $(ls -1 "$D198"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  echo "Applied D-198 to onetake-v3"
fi
# D-199: 3D r6 phone time reframe (onetake-v3 phone film 38/39, cg/phone 001-010, proxy-phone, film2.json, app-v3.js, index.html)
D199="$ROOT/.publish/onetake-d199.b64"
if [[ -d "$D199" ]]; then
  cat $(ls -1 "$D199"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  echo "Applied D-199 to onetake-v3"
fi
# D-200: phone hold reframe (app-v3.js, reduced-motion hold still) + 3D r7 phone polish (film sheets 37-39 + proxy, cg/phone 009-013, proxy-phone, film2.json)
D200="$ROOT/.publish/onetake-d200.b64"
if [[ -d "$D200" ]]; then
  cat $(ls -1 "$D200"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  echo "Applied D-200 to onetake-v3"
fi
# D-201: section gaps + dead scroll tails (became/darkhour story length, onetake-v3 story 1076vh, reveal + solid nav restored)
D201="$ROOT/.publish/onetake-d201.b64"
if [[ -d "$D201" ]]; then
  cat $(ls -1 "$D201"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  echo "Applied D-201 (became, darkhour, onetake-v3)"
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
  if [[ -d "$ROOT/onetake-v3/img/rm" ]]; then mkdir -p "$ROOT/onetake/img/rm"; cp -a "$ROOT/onetake-v3/img/rm/." "$ROOT/onetake/img/rm/"; fi
  cp "$PROMO/index.html" "$ROOT/onetake/index.html"
  cp "$PROMO/app-v3.js" "$ROOT/onetake/app-v3.js"
  cp "$PROMO/film2.json" "$ROOT/onetake/video/seq/film2.json"
  echo "Promoted One Take v3 to /onetake/"
fi
# D-243: maker line on became/darkhour/onetake (onetake-v3 shares /onetake/ range-data.js).
# Applied AFTER promote so /_parked/onetake-d183/ stays the untouched d183 tree.
D243="$ROOT/.publish/d243.b64"
if [[ -d "$D243" ]]; then
  cat $(ls -1 "$D243"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  echo "Applied D-243 maker line (became, darkhour, onetake, onetake-v3)"
fi
# D-244 (Lucas 11:53 AM fix batch): Signature $399 in Basalt, How it works full width, size tags under renders,
# Signature 360 (height cap, back placeholder removed, muted ribbon, hint off the medal), Became print clears the bar,
# line breaks, One Take header fade, curly apostrophes, one footer, credit contrast, 44 px taps, close block without the
# in-page month line / second Make yours, Dark Hour hero v3 (+ LQIP, og). Applied last. The GLB and poster ship once and are copied.
D244="$ROOT/.publish/d244.b64"
if [[ -d "$D244" ]]; then
  cat $(ls -1 "$D244"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  cp "$ROOT/became/assets/3d/signature320_muted_v1c.glb" "$ROOT/darkhour/assets/3d/signature320_muted_v1c.glb"
  cp "$ROOT/became/assets/3d/signature320_muted_v1c.glb" "$ROOT/onetake/3d/signature320_muted_v1c.glb"
  cp "$ROOT/became/assets/range/img/sig320-v1c-poster.webp" "$ROOT/darkhour/assets/range/img/sig320-v1c-poster.webp"
  cp "$ROOT/became/assets/range/img/sig320-v1c-poster.webp" "$ROOT/onetake/assets/range/img/sig320-v1c-poster.webp"
  echo "Applied D-244 fix batch (became, darkhour, onetake, onetake-v3, order pages)"
fi
# D-245 (3D Signature card _v2, ribbon in Scree #6E675E): new sig320-v1c2 card fronts (range + order) and 360 poster,
# re-encoded from 3D's lossless masters (WebP q95, AVIF q86 4:4:4; poster WebP q92) so the plate stays within ~2 levels.
# Data files and pages point at the new names. Applied after D-244. Images ship once (became) and are copied.
D245="$ROOT/.publish/d245.b64"
if [[ -d "$D245" ]]; then
  cat $(ls -1 "$D245"/part-*.txt | sort) | base64 -d | tar -x -C "$ROOT"
  for s in darkhour onetake; do
    cp "$ROOT"/became/assets/range/img/sig320-v1c2-* "$ROOT/$s/assets/range/img/"
    cp "$ROOT"/became/assets/order/img/sig320-v1c2-* "$ROOT/$s/assets/order/img/"
  done
  echo "Applied D-245 Signature card v2 (became, darkhour, onetake, onetake-v3, order pages)"
fi
rm -rf "$ROOT/.publish"
