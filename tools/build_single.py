#!/usr/bin/env python3
"""Bundle the whole game into ONE file: play.html.

The website stays as separate pages (index/paths/levels/applications),
but play.html packs it all together so you can double-click a single
file — or send it to family — and play.

Run from the repo root:  python3 tools/build_single.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

JS_FILES = [
    'js/data.js',
    'js/state.js',
    'js/cloud.js',
    'js/ui.js',
    'js/games/engine.js',
    'js/games/fishing.js',
    'js/games/workshift.js',
    'js/games/chef.js',
    'js/games/miner.js',
    'js/games/prisoner.js',
    'js/games/soldier.js',
    'js/games/peasant.js',
    'js/games/beekeeper.js',
    'js/games/nomad.js',
    'js/games/teacher.js',
    'js/games/criminal.js',
    'js/games/gamer.js',
    'js/games/bodyguard.js',
    'js/games/engineer.js',
    'js/games/executioner.js',
    'js/games/bountyhunter.js',
    'js/games/dungeoneer.js',
    'js/games/deadshot.js',
    'js/games/jobapplicator.js',
    'js/games/frogkeeper.js',
    'js/games/king.js',
    'js/pages/home.js',
    'js/pages/paths.js',
    'js/pages/applications.js',
    'js/pages/levels.js',
]

PAGES = [
    ('home', 'index.html'),
    ('paths', 'paths.html'),
    ('levels', 'levels.html'),
    ('applications', 'applications.html'),
]

TITLE = 'Job Application — What Job Will YOU Get?'
FAVICON = ("data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 "
           "viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎣</text></svg>")


def extract_main(html: str, filename: str) -> str:
    match = re.search(r'<main>([\s\S]*?)</main>', html)
    if not match:
        raise SystemExit(f'No <main> found in {filename}')
    return match.group(1)


def main():
    css = (ROOT / 'css/style.css').read_text(encoding='utf-8')
    js = '\n;\n'.join((ROOT / f).read_text(encoding='utf-8') for f in JS_FILES)

    sections = []
    for page_id, filename in PAGES:
        inner = extract_main((ROOT / filename).read_text(encoding='utf-8'), filename)
        hidden = '' if page_id == 'home' else ' hidden'
        sections.append(f'<section class="page" data-page="{page_id}"{hidden}>\n<main>{inner}</main>\n</section>')

    body = (
        '<header id="site-header" hidden></header>\n'
        + '\n'.join(sections)
        + '\n<script>\nwindow.SINGLE_FILE = true;\n' + js + '\n;Boot();\n</script>'
    )

    play = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="{FAVICON}">
<title>{TITLE}</title>
<style>
{css}
</style>
</head>
<body data-page="home">
{body}
</body>
</html>
"""
    (ROOT / 'play.html').write_text(play, encoding='utf-8')
    print(f'wrote play.html ({len(play):,} bytes)')

    # bare version for the claude.ai artifact (no doctype/html/head/body tags)
    artifact = f'<title>{TITLE}</title>\n<style>\n{css}\n</style>\n{body}\n'
    out = ROOT / 'tools' / 'artifact-build.html'
    out.write_text(artifact, encoding='utf-8')
    print(f'wrote {out.relative_to(ROOT)} ({len(artifact):,} bytes)')


if __name__ == '__main__':
    main()
