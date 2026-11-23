#!/usr/bin/env bash
# Run every portfolio test and save what each one prints.
#
#   tests/run_all.sh <outdir> [port]
#
# Serve the site first (tests/serve.py path/to/site [port]). The port defaults to 8773.
# Output lands in <outdir>/<test>.txt and screenshots in <outdir>/shots/.
# To compare two sites (before and after a change), run this twice with different
# ports and outdirs, then: diff -r <before> <after> --exclude=shots
set -u
OUT=${1:?usage: run_all.sh <outdir> [port]}
PORT=${2:-8773}
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT/shots" "$OUT/.scripts"
OUT=$(cd "$OUT" && pwd)
# the scripts have the port and the screenshot folder written into them; run adjusted copies
for f in "$HERE"/*.py; do
  sed -e "s#localhost:8773#localhost:$PORT#g" -e "s#/tmp/pano-qa#$OUT/shots#g" "$f" > "$OUT/.scripts/$(basename "$f")"
done
cd "$OUT/.scripts"
run() { local name=$1; shift; echo "== $name"; python3 "$@" > "$OUT/$name.txt" 2>&1; }
run head-phone head.py 390 800 phone
run head-fold  head.py 880 900 fold
run head-desk  head.py 1280 800 desk
run idle  idle.py
run wins  wins.py
run clean-phone clean.py 390 800 phone
run clean-fold  clean.py 880 900 fold
run clean-desk  clean.py 1280 800 desk
run bin   bin.py
run wall  wall.py
run cases cases.py
run sweep sweep.py
run lifted lifted.py
run brain brain.py
run tours-desk  tours.py desk  "app:contact,app:skills"
run tours-fold  tours.py fold  "app:contact,app:skills"
run tours-phone tours.py phone "app:contact,app:skills"
echo "done: $OUT"
