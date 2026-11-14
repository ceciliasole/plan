import glob,os,re,json,sys
css=open('core.css').read();core=open('core.js').read()
meta=json.load(open('meta.json'))
index_url=os.environ.get('INDEX_URL','')
for f in sorted(glob.glob('tools/*.js')):
    slug=os.path.basename(f)[3:-3]; m=meta[slug]
    body=open(f).read()
    html=f'''<title>{m['name']}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>{css}</style>
<div id="root"></div>
<script>window.INDEX_URL={json.dumps(index_url)};</script>
<script>{body}
{core}</script>'''
    open(f'out/impactese-{slug}.html','w').write(html)
    print(slug,len(html))
