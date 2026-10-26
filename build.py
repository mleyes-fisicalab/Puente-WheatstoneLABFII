#!/usr/bin/env python3
"""Ensambla cada cuaderno como un único HTML autocontenido."""
import pathlib, sys
D = pathlib.Path(__file__).parent
OUT = D / "dist"; OUT.mkdir(exist_ok=True)
CSS = (D / "engine.css").read_text()
JS = (D / "engine.js").read_text().replace("__LOGO__", (D / "logo.b64").read_text().strip()) + "\n" + (D / "ill.js").read_text()
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600'
         '&family=JetBrains+Mono:wght@400;500;600&family=Source+Sans+3:wght@400;600;700&display=swap">')
MJ = """<script>window.MathJax={tex:{inlineMath:[['$','$'],['\\\\(','\\\\)']],displayMath:[['$$','$$'],['\\\\[','\\\\]']]},
svg:{fontCache:'global'},startup:{typeset:false},options:{enableMenu:false}};</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js" defer></script>"""
NB = {
  "wheatstone": "Puente de Wheatstone",
  "resistividad": "Resistividad Eléctrica",
  "transformadores": "Transformadores e Inducción",
  "ampere": "Ley de Ampère",
}
for key in (sys.argv[1:] or NB):
    src = D / f"{key}.js"
    if not src.exists(): continue
    extra_css = (D / f"{key}.css").read_text() if (D / f"{key}.css").exists() else ""
    html = f"""<title>{NB[key]}</title>
<meta name="claude:viewport-fit-sides" content="cover">
{FONTS}
<style>
{CSS}
{extra_css}
</style>
<div id="app"></div>
{MJ}
<script>
{JS}
</script>
<script>
{src.read_text()}
</script>
"""
    (OUT / f"{key}.html").write_text(html)
    print(key, len(html) // 1024, "KB")
