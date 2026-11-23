#!/usr/bin/env bash
# Run the dashboard tests and save what each one prints.
#
#   tests/run_dash.sh <outdir> [port]
#
# Serve the dashboard first (tests/serve.py path/to/Dashboard-DEV [port]). The port defaults to 8773.
# Output lands in <outdir>/<test>.txt and screenshots in <outdir>/shots/.
set -u
OUT=${1:?usage: run_dash.sh <outdir> [port]}
PORT=${2:-8773}
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT/shots" "$OUT/.scripts"
OUT=$(cd "$OUT" && pwd)
# the scripts have the port and the screenshot folder written into them; run adjusted copies
for f in "$HERE"/dash.py "$HERE"/devdash.py; do
  sed -e "s#localhost:8773#localhost:$PORT#g" -e "s#/tmp/pano-qa#$OUT/shots#g" "$f" > "$OUT/.scripts/$(basename "$f")"
done
cd "$OUT/.scripts"
run() { local name=$1; shift; echo "== $name"; python3 "$@" > "$OUT/$name.txt" 2>&1; }
run devdash devdash.py
run dash dash.py
echo "done: $OUT"
grep -c "True" "$OUT/dash.txt" | sed 's/^/dash.py lines with True: /'
grep -n "False\|Traceback" "$OUT"/dash.txt "$OUT"/devdash.txt | grep -v "errors \[\]" || echo "nothing reported False"
