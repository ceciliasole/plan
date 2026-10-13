import json,os
urls=json.load(open('urls.json')) if os.path.exists('urls.json') else {}
P=[('prioridades','Matriz de prioridades','Qué hacer ya, qué planificar, qué delegar y qué dejar ir.'),
('bcg','Cartera BCG','Qué programas invertir, sostener, cosechar o cerrar.'),
('pestel','Semáforo PESTEL','Cómo te afecta el contexto político, económico, social, tecnológico, ambiental y legal.'),
('stakeholders','Mapa de stakeholders','A quién dedicarle tiempo este año, según poder e interés.'),
('identidad','Identidad y posicionamiento','Tu propósito, misión, visión o manifiesto, y el enunciado que guía lo que decís.'),
('matriz','Matriz de posicionamiento','Dónde estás frente a tus alternativas reales y dónde hay espacio.'),
('finanzas','Salud financiera','Reservas, dependencia, fondos asegurados y peso de la estructura.'),
('digital','Auditoría digital','Qué es tuyo, qué depende de una persona y qué está expuesto.'),
('roi','Calculadora de impacto','Cuánto valor social genera cada peso, con su rango de fragilidad.'),
('okr','OKR y responsables','Objetivos, resultados clave, responsables y cronograma.'),
('presupuesto','Presupuesto anual','Caja mes a mes y los baches que hay que cubrir.'),
('plan','Plan estratégico','Todo junto, con riesgos y los primeros 90 días.')]
css=open('core.css').read()
cards=''.join(f'<li class="c"><span class="m">Mes {i+1}</span><h2>{n}</h2><p>{d}</p>'+(f'<a class="go" href="{urls[k]}" target="_blank" rel="noopener">Abrir</a>' if k in urls else '<span class="sub">próximamente</span>')+'</li>' for i,(k,n,d) in enumerate(P))
html=f'''<title>Un año de planificación</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>{css}
.hero{{padding-block:28px 8px}}.hero h1{{font-size:clamp(34px,7vw,60px);max-width:16ch}}
ol.list{{list-style:none;padding:0;margin:22px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:12px}}
.c{{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:14px;display:flex;flex-direction:column;gap:6px}}
.c h2{{font-size:18px}}.c p{{margin:0;color:var(--muted);font-size:14px;flex:1}}.m{{font:12px var(--f-m);color:var(--red);text-transform:uppercase;letter-spacing:.06em}}
.go{{align-self:flex-start;font-weight:600;color:var(--blue);border-bottom:2px solid var(--red)}}
.rules{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px;margin-top:8px}}.rules p{{margin:0;font-size:14px}}</style>
<div class="wrap"><div class="top"><span>Programa anual</span><span>impactese</span></div>
<div class="hero"><h1>Un año para planificar bien</h1><p class="lead">Doce herramientas, una por mes, para que tu fundación llegue al final del año con un plan y con activos que antes no tenía. Cada una la usás por tu cuenta, en unos 30 a 60 minutos.</p></div>
<div class="rules"><p><b>Podés empezar cuando quieras.</b> El orden sugerido va de lo que decidís primero a lo que se apoya en eso, pero no hace falta seguir un mes por herramienta.</p><p><b>Tu trabajo es tuyo.</b> Se guarda en tu navegador y nadie más lo ve. Si querés comentarlo con nosotras, copiás el resumen y nos lo mandás.</p><p><b>Los ejemplos son ficticios.</b> Cada herramienta abre con datos de muestra marcados. Reemplazalos por los tuyos.</p></div>
<ol class="list">{cards}</ol></div>'''
open('out/index.html','w').write(html)
