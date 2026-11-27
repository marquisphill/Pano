#!/usr/bin/env python3
"""Smoke test for a site that has Paño from the kit (K4 in PANO-KIT-PLAN.md). It wraps kit/check_site.py.

    python3 tests/kit_smoke.py path/to/site                 # expects 3 tours
    python3 tests/kit_smoke.py path/to/site --tours 3 --engine path/to/Pano

It runs kit/check_site.py on the site, with --engine answering for marquisphill.github.io/Pano/ from this
repo (or the folder given), then reads its --json report and prints one line per check:

  - check_site.py ends in "All good" (no ✗ at all),
  - Paño appears and greets on every page that loads him, at phone (390×844) and desktop (1280×800) sizes,
  - his menu lists the expected number of tours: that many different tour labels across the site, and all of
    them in the menu on the first page (index.html), at both sizes,
  - each of those tours finishes at phone and desktop sizes (every time it was walked),
  - no page errors anywhere.

It ends with "smoke: PASS" or "smoke: FAIL" (exit code 0 or 1). check_site.py's own output is printed first.
"""
import argparse, json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)


def main():
    ap = argparse.ArgumentParser(description='Paño kit smoke test: wraps kit/check_site.py.')
    ap.add_argument('site')
    ap.add_argument('--tours', type=int, default=3, help='how many tours his menu should list (default 3)')
    ap.add_argument('--engine', default=REPO, help='the Pano folder that answers for marquisphill.github.io/Pano/ (default: this repo)')
    ap.add_argument('--quiet', action='store_true', help="don't print check_site.py's own output")
    a = ap.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'report.json')
        cmd = [sys.executable, os.path.join(REPO, 'kit', 'check_site.py'), a.site, '--engine', a.engine, '--json', out]
        run = subprocess.run(cmd, capture_output=True, text=True)
        if not a.quiet:
            print(run.stdout, end='')
            print(run.stderr, end='', file=sys.stderr)
        if not os.path.isfile(out):
            print('check_site.py wrote no report (it stopped early)', False)
            print('smoke: FAIL')
            sys.exit(1)
        R = json.load(open(out, encoding='utf-8'))

    results = []

    def check(label, ok, extra=''):
        results.append(bool(ok))
        print(f'{label} {bool(ok)}' + (f'  {extra}' if extra else ''))

    print()
    print(f'== kit smoke: {os.path.abspath(a.site)} (expecting {a.tours} tours)')
    check('check_site.py says All good', run.returncode == 0 and R.get('all_good'), f'{R.get("problems")} to fix' if R.get('problems') else '')
    pages = R.get('pages', [])
    check('pages checked', bool(pages), ', '.join(sorted({p['page'] for p in pages})))
    sizes = {p['size'] for p in pages}
    check('both sizes checked', {'phone', 'desktop'} <= sizes, ', '.join(sorted(sizes)))

    for p in pages:
        check(f'{p["page"]} {p["size"]}: appears and greets', p.get('greeted'))

    # his tours: labels offered across the site
    labels = []
    for p in pages:
        for t in p.get('tours', []):
            if t['label'] not in labels:
                labels.append(t['label'])
    check(f'{a.tours} different tours across the site', len(labels) == a.tours, ' | '.join(labels))
    first = sorted({p['page'] for p in pages}, key=lambda x: (x.count('/'), x.lower() != 'index.html', x))[:1]
    for p in pages:
        offered = [t['label'] for t in p.get('tours', [])]
        if p['page'] in first:
            missing = [l for l in labels if l not in p.get('menu', [])]
            check(f'{p["page"]} {p["size"]}: menu lists all {len(labels)} tours', len(offered) == a.tours and not missing,
                  ' | '.join(p.get('menu', [])))
        else:
            print(f'{p["page"]} {p["size"]}: menu offers {len(offered)} tour{"" if len(offered) == 1 else "s"}  ' + ' | '.join(p.get('menu', [])))

    for label in labels:
        for size in ('phone', 'desktop'):
            runs = [(p['page'], t) for p in pages if p['size'] == size for t in p.get('tours', []) if t['label'] == label]
            done = [pg for pg, t in runs if t['finished']]
            failed = [f'{pg}: {t["why"]}' for pg, t in runs if not t['finished']]
            check(f'tour "{label}" finishes at {size} size', runs and not failed,
                  ('on ' + ', '.join(done)) if not failed else '; '.join(failed)[:300])

    errors = [f'{p["page"]} {p["size"]}: {e}' for p in pages for e in p.get('errors', [])]
    check('no page errors', not errors, '; '.join(errors)[:400])

    print('smoke:', 'PASS' if all(results) else 'FAIL', f'({sum(results)} of {len(results)})')
    sys.exit(0 if all(results) else 1)


if __name__ == '__main__':
    main()
